import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

type LogoState = 'wireframe' | 'solid' | 'particles';

interface Props {
  className?: string;
  modelPath?: string;
  initialState?: LogoState;
  autoTransition?: boolean;
  autoTransitionDelay?: number;
}

export default function Logo3DModel({
  className = '',
  modelPath = '/assets/models/neural-mesh-export.glb',
  initialState = 'solid',
  autoTransition = false,
  autoTransitionDelay = 2000,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    logoGroup: THREE.Group;
    originalModel: THREE.Group | null;
    wireframeGroup: THREE.Group | null;
    particleSystem: THREE.Points | null;
    particleMaterial: THREE.ShaderMaterial | null;
    ambientLight: THREE.AmbientLight;
    keyLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    rimLight: THREE.PointLight;
  } | null>(null);

  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const stateRef = useRef<LogoState>(initialState);
  const transitionProgressRef = useRef<{ value: number }>({ value: initialState === 'particles' ? 1 : 0 });
  const isDraggingRef = useRef<boolean>(false);
  const previousMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [currentState, setCurrentState] = useState<LogoState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Brand colors
  const COLORS = {
    primary: 0xEA242B,
    primaryBright: 0xFF3B42,
    white: 0xFFFFFF,
    warmWhite: 0xFFF8F0,
    dark: 0x0A0A0A,
  };

  const transitionToState = useCallback((newState: LogoState) => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    stateRef.current = newState;
    setCurrentState(newState);

    const targetProgress = newState === 'particles' ? 1 : 0;

    gsap.to(transitionProgressRef.current, {
      value: targetProgress,
      duration: 1.5,
      ease: newState === 'particles' ? 'power2.out' : 'power3.inOut',
    });

    // Lighting adjustments per state
    if (newState === 'particles') {
      gsap.to(scene.keyLight, { intensity: 1.5, duration: 0.8 });
      gsap.to(scene.rimLight, { intensity: 3, duration: 0.5 });
    } else if (newState === 'solid') {
      gsap.to(scene.keyLight, { intensity: 1.2, duration: 0.8 });
      gsap.to(scene.rimLight, { intensity: 1.5, duration: 0.8 });
    } else {
      gsap.to(scene.keyLight, { intensity: 0.5, duration: 0.8 });
      gsap.to(scene.rimLight, { intensity: 0.8, duration: 0.8 });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);

    // Responsive settings
    const getResponsiveSettings = () => {
      const w = window.innerWidth;
      if (w <= 480) return { cameraZ: 6, scale: 0.7 };
      if (w <= 768) return { cameraZ: 5, scale: 0.8 };
      if (w <= 1024) return { cameraZ: 4.5, scale: 0.9 };
      return { cameraZ: 4, scale: 1.0 };
    };

    const settings = getResponsiveSettings();
    camera.position.set(0, 0, settings.cameraZ);
    camera.lookAt(0, 0, 0); // Ensure camera is centered on origin

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Logo container - explicitly at origin
    const logoGroup = new THREE.Group();
    logoGroup.position.set(0, 0, 0);
    logoGroup.scale.setScalar(settings.scale);
    scene.add(logoGroup);

    // Lighting - cinematic three-point setup
    const ambientLight = new THREE.AmbientLight(COLORS.warmWhite, 0.4);
    scene.add(ambientLight);

    // Key light - main illumination from upper right
    const keyLight = new THREE.DirectionalLight(COLORS.white, 1.2);
    keyLight.position.set(3, 2, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill light - softer from left
    const fillLight = new THREE.DirectionalLight(COLORS.warmWhite, 0.4);
    fillLight.position.set(-3, 0, 2);
    scene.add(fillLight);

    // Rim light - red accent from behind
    const rimLight = new THREE.PointLight(COLORS.primary, 1.5, 15);
    rimLight.position.set(0, -1, -3);
    scene.add(rimLight);

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      logoGroup,
      originalModel: null,
      wireframeGroup: null,
      particleSystem: null,
      particleMaterial: null,
      ambientLight,
      keyLight,
      fillLight,
      rimLight,
    };

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        if (!sceneRef.current) return;

        const model = gltf.scene;

        // First, get original bounding box to determine scale
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());

        // Scale to fit nicely in view (target ~3 units wide)
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 3;
        const modelScale = targetSize / maxDim;
        model.scale.setScalar(modelScale);

        // Now recalculate bounding box after scaling and center it
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());

        // Move model so its center is at origin
        model.position.set(-center.x, -center.y, -center.z);

        console.log(`Model loaded: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}, scaled by ${modelScale.toFixed(3)}, centered at origin`);

        // Apply premium materials to all meshes
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;

            // Create a premium material
            const material = new THREE.MeshStandardMaterial({
              color: COLORS.white,
              metalness: 0.15,
              roughness: 0.35,
              emissive: COLORS.primary,
              emissiveIntensity: 0.03,
            });

            mesh.material = material;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        logoGroup.add(model);
        sceneRef.current.originalModel = model;

        // Create wireframe version
        const wireframeGroup = new THREE.Group();
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
            const lineMaterial = new THREE.LineBasicMaterial({
              color: COLORS.white,
              transparent: true,
              opacity: 0.8,
            });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            wireframe.position.copy(mesh.position);
            wireframe.rotation.copy(mesh.rotation);
            wireframe.scale.copy(mesh.scale);
            wireframeGroup.add(wireframe);
          }
        });
        wireframeGroup.position.copy(model.position);
        wireframeGroup.scale.copy(model.scale);
        wireframeGroup.visible = false;
        logoGroup.add(wireframeGroup);
        sceneRef.current.wireframeGroup = wireframeGroup;

        // Create particle system from model vertices
        const particlePositions: number[] = [];
        const particleOriginals: number[] = [];
        const particleExplosions: number[] = [];
        const particleColors: number[] = [];
        const particleSeeds: number[] = [];

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const geometry = mesh.geometry;
            const posAttr = geometry.attributes.position;

            // Get world matrix for this mesh
            mesh.updateWorldMatrix(true, false);
            const worldMatrix = mesh.matrixWorld;

            // Sample particles from vertices and interpolated positions
            for (let i = 0; i < posAttr.count; i++) {
              const vertex = new THREE.Vector3(
                posAttr.getX(i),
                posAttr.getY(i),
                posAttr.getZ(i)
              );

              // Apply world transform
              vertex.applyMatrix4(worldMatrix);
              // Apply model scale and position
              vertex.multiplyScalar(modelScale);

              particlePositions.push(vertex.x, vertex.y, vertex.z);
              particleOriginals.push(vertex.x, vertex.y, vertex.z);

              // Explosion target - radial outward
              const angle = Math.atan2(vertex.y, vertex.x);
              const dist = vertex.length();
              const explosionDist = 1.2 + Math.random() * 1.8;
              const explosionAngle = angle + (Math.random() - 0.5) * 0.8;

              particleExplosions.push(
                vertex.x + Math.cos(explosionAngle) * explosionDist,
                vertex.y + Math.sin(explosionAngle) * explosionDist + (Math.random() - 0.5) * 0.5,
                vertex.z + (Math.random() - 0.5) * 1.5
              );

              // Color - mostly white with some red
              const isRed = Math.random() > 0.75;
              if (isRed) {
                particleColors.push(0.92, 0.14, 0.17);
              } else {
                particleColors.push(1, 1, 1);
              }
              particleSeeds.push(Math.random());
            }

            // Add interpolated particles for denser fill
            const indexAttr = geometry.index;
            if (indexAttr) {
              const triangleCount = indexAttr.count / 3;
              const particlesPerTriangle = Math.max(1, Math.floor(5000 / triangleCount));

              for (let t = 0; t < triangleCount; t++) {
                const i0 = indexAttr.getX(t * 3);
                const i1 = indexAttr.getX(t * 3 + 1);
                const i2 = indexAttr.getX(t * 3 + 2);

                const v0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
                const v1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
                const v2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

                v0.applyMatrix4(worldMatrix).multiplyScalar(modelScale);
                v1.applyMatrix4(worldMatrix).multiplyScalar(modelScale);
                v2.applyMatrix4(worldMatrix).multiplyScalar(modelScale);

                for (let p = 0; p < particlesPerTriangle; p++) {
                  const r1 = Math.random();
                  const r2 = Math.random();
                  const sqrtR1 = Math.sqrt(r1);

                  const x = v0.x * (1 - sqrtR1) + v1.x * (sqrtR1 * (1 - r2)) + v2.x * (sqrtR1 * r2);
                  const y = v0.y * (1 - sqrtR1) + v1.y * (sqrtR1 * (1 - r2)) + v2.y * (sqrtR1 * r2);
                  const z = v0.z * (1 - sqrtR1) + v1.z * (sqrtR1 * (1 - r2)) + v2.z * (sqrtR1 * r2);

                  particlePositions.push(x, y, z);
                  particleOriginals.push(x, y, z);

                  const angle = Math.atan2(y, x);
                  const explosionDist = 1.0 + Math.random() * 2.0;
                  particleExplosions.push(
                    x + Math.cos(angle) * explosionDist,
                    y + Math.sin(angle) * explosionDist,
                    z + (Math.random() - 0.5) * 1.2
                  );

                  const isRed = Math.random() > 0.7;
                  if (isRed) {
                    particleColors.push(0.92, 0.14, 0.17);
                  } else {
                    particleColors.push(1, 1, 1);
                  }
                  particleSeeds.push(Math.random());
                }
              }
            }
          }
        });

        console.log(`Created ${particlePositions.length / 3} particles from model`);

        // Build particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particlePositions), 3));
        particleGeometry.setAttribute('aOriginal', new THREE.BufferAttribute(new Float32Array(particleOriginals), 3));
        particleGeometry.setAttribute('aExplosion', new THREE.BufferAttribute(new Float32Array(particleExplosions), 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(particleColors), 3));
        particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(particleSeeds), 1));

        const particleMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uPointSize: { value: 5.0 },
          },
          vertexShader: `
            uniform float uTime;
            uniform float uProgress;
            uniform float uPointSize;

            attribute vec3 aOriginal;
            attribute vec3 aExplosion;
            attribute float aSeed;

            varying vec3 vColor;
            varying float vAlpha;

            void main() {
              vColor = color;

              // Interpolate between solid and exploded
              vec3 pos = mix(aOriginal, aExplosion, uProgress);

              // Turbulence during explosion
              float turbulence = uProgress * 0.2;
              pos.x += sin(uTime * 2.0 + aSeed * 20.0) * turbulence;
              pos.y += cos(uTime * 1.7 + aSeed * 25.0) * turbulence;
              pos.z += sin(uTime * 2.3 + aSeed * 30.0) * turbulence * 0.7;

              // Subtle ambient motion when solid
              float ambient = (1.0 - uProgress) * 0.004;
              pos.x += sin(uTime * 0.7 + aSeed * 10.0) * ambient;
              pos.y += cos(uTime * 0.5 + aSeed * 12.0) * ambient;

              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_Position = projectionMatrix * mvPosition;

              // Size with depth and state
              float sizeBoost = uProgress * 3.0;
              float pulse = sin(uTime * 2.5 + aSeed * 6.28) * 0.4 * uProgress;
              gl_PointSize = (uPointSize + sizeBoost + pulse) / -mvPosition.z;

              vAlpha = 1.0 - uProgress * 0.15;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
              vec2 center = gl_PointCoord - vec2(0.5);
              float dist = length(center);
              if (dist > 0.5) discard;

              float alpha = smoothstep(0.5, 0.05, dist) * vAlpha;
              vec3 finalColor = vColor + vColor * smoothstep(0.5, 0.0, dist) * 0.4;

              gl_FragColor = vec4(finalColor, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
        });

        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        particleSystem.visible = false;
        logoGroup.add(particleSystem);

        sceneRef.current.particleSystem = particleSystem;
        sceneRef.current.particleMaterial = particleMaterial;

        setIsLoaded(true);

        // Auto-transition if enabled
        if (autoTransition && initialState === 'wireframe') {
          setTimeout(() => transitionToState('solid'), autoTransitionDelay);
        }
      },
      (progress) => {
        console.log(`Loading model: ${((progress.loaded / progress.total) * 100).toFixed(0)}%`);
      },
      (error) => {
        console.error('Error loading GLTF model:', error);
        setIsLoaded(true);
      }
    );

    // Click-drag interaction only
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      rotationRef.current.y += deltaX * 0.005;
      rotationRef.current.x += deltaY * 0.005;

      // Clamp vertical rotation
      rotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationRef.current.x));

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
    };

    // Double-click to toggle particle state
    const handleDoubleClick = () => {
      if (stateRef.current === 'solid') {
        transitionToState('particles');
      } else if (stateRef.current === 'particles') {
        transitionToState('solid');
      } else if (stateRef.current === 'wireframe') {
        transitionToState('solid');
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('dblclick', handleDoubleClick);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;

      if (!sceneRef.current) return;

      const { logoGroup, originalModel, wireframeGroup, particleSystem, particleMaterial } = sceneRef.current;
      const progress = transitionProgressRef.current.value;

      // Apply drag rotation with smoothing
      logoGroup.rotation.y += (rotationRef.current.y - logoGroup.rotation.y) * 0.08;
      logoGroup.rotation.x += (rotationRef.current.x - logoGroup.rotation.x) * 0.08;

      // Very slow, elegant auto-rotation only when not dragging
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.0004;
      }

      // State visibility
      const isParticleMode = progress > 0.3;

      if (originalModel) {
        originalModel.visible = !isParticleMode;
        // Fade out solid model as we transition to particles
        originalModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.opacity = 1 - progress;
            mat.transparent = progress > 0;
          }
        });
      }

      if (wireframeGroup) {
        wireframeGroup.visible = stateRef.current === 'wireframe';
      }

      if (particleSystem && particleMaterial) {
        particleSystem.visible = progress > 0.1;
        particleMaterial.uniforms.uTime.value = timeRef.current;
        particleMaterial.uniforms.uProgress.value = progress;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!sceneRef.current) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      const newSettings = getResponsiveSettings();

      camera.aspect = w / h;
      camera.position.set(0, 0, newSettings.cameraZ);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      logoGroup.scale.setScalar(newSettings.scale);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('resize', handleResize);

      if (sceneRef.current && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [modelPath, initialState, autoTransition, autoTransitionDelay, transitionToState]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.8s ease-out',
          cursor: 'grab',
        }}
      />

      {/* State indicator dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          opacity: isLoaded ? 0.6 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: 'none',
        }}
      >
        {(['solid', 'particles'] as LogoState[]).map((state) => (
          <div
            key={state}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentState === state ? '#EA242B' : '#333',
              transition: 'background-color 0.3s ease',
              boxShadow: currentState === state ? '0 0 12px rgba(234, 36, 43, 0.7)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Interaction hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#555',
          opacity: isLoaded ? 0.5 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: 'none',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Double-click to {currentState === 'solid' ? 'explode' : 'reassemble'} · Drag to rotate
      </div>
    </div>
  );
}
