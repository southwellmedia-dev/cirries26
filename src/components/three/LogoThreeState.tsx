import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import gsap from 'gsap';

type LogoState = 'wireframe' | 'solid' | 'particles';

interface Props {
  className?: string;
  initialState?: LogoState;
  autoTransition?: boolean;
  autoTransitionDelay?: number;
}

export default function LogoThreeState({
  className = '',
  initialState = 'wireframe',
  autoTransition = true,
  autoTransitionDelay = 2000,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    logoGroup: THREE.Group;
    wireframeMesh: THREE.LineSegments | null;
    solidMesh: THREE.Mesh | null;
    particleSystem: THREE.Points | null;
    particleGeometry: THREE.BufferGeometry | null;
    originalPositions: Float32Array | null;
    currentPositions: Float32Array | null;
    explosionTargets: Float32Array | null;
    ambientLight: THREE.AmbientLight;
    pointLight1: THREE.PointLight;
    pointLight2: THREE.PointLight;
  } | null>(null);

  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const stateRef = useRef<LogoState>(initialState);
  const transitionProgressRef = useRef<number>(initialState === 'wireframe' ? 0 : initialState === 'solid' ? 1 : 2);
  const isHoveringRef = useRef<boolean>(false);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [currentState, setCurrentState] = useState<LogoState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Brand colors
  const COLORS = {
    primary: 0xEA242B,
    primaryBright: 0xFF3B42,
    white: 0xFFFFFF,
    dark: 0x0A0A0A,
    glow: 0xEA242B,
  };

  const transitionToState = useCallback((newState: LogoState) => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    stateRef.current = newState;
    setCurrentState(newState);

    const targetProgress = newState === 'wireframe' ? 0 : newState === 'solid' ? 1 : 2;

    gsap.to(transitionProgressRef, {
      current: targetProgress,
      duration: 1.2,
      ease: 'power2.inOut',
    });

    // Animate lighting based on state
    if (newState === 'solid') {
      gsap.to(scene.pointLight1, { intensity: 2.5, duration: 0.8 });
      gsap.to(scene.pointLight2, { intensity: 1.5, duration: 0.8 });
    } else if (newState === 'particles') {
      gsap.to(scene.pointLight1, { intensity: 4, duration: 0.5 });
      gsap.to(scene.pointLight2, { intensity: 2.5, duration: 0.5 });
    } else {
      gsap.to(scene.pointLight1, { intensity: 1, duration: 0.8 });
      gsap.to(scene.pointLight2, { intensity: 0.5, duration: 0.8 });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    // Responsive camera positioning
    const getResponsiveSettings = () => {
      const w = window.innerWidth;
      if (w <= 480) return { cameraZ: 5.5, scale: 0.65 };
      if (w <= 768) return { cameraZ: 4.8, scale: 0.75 };
      if (w <= 1024) return { cameraZ: 4.2, scale: 0.85 };
      return { cameraZ: 3.8, scale: 1.0 };
    };

    const settings = getResponsiveSettings();
    camera.position.z = settings.cameraZ;

    // Renderer with premium settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Logo container group
    const logoGroup = new THREE.Group();
    logoGroup.scale.setScalar(settings.scale);
    scene.add(logoGroup);

    // Lighting setup - dramatic for solid state
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(COLORS.primary, 1, 20);
    pointLight1.position.set(2, 2, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(COLORS.white, 0.5, 20);
    pointLight2.position.set(-3, -1, 2);
    scene.add(pointLight2);

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      logoGroup,
      wireframeMesh: null,
      solidMesh: null,
      particleSystem: null,
      particleGeometry: null,
      originalPositions: null,
      currentPositions: null,
      explosionTargets: null,
      ambientLight,
      pointLight1,
      pointLight2,
    };

    // Load and process SVG
    const loader = new SVGLoader();
    loader.load(
      '/assets/models/logo.svg',
      (data) => {
        if (!sceneRef.current) return;

        const paths = data.paths;
        const svgWidth = 1137;
        const svgHeight = 278;
        const targetWidth = 4;
        const scale = targetWidth / svgWidth;
        const svgCenterX = svgWidth / 2;
        const svgCenterY = svgHeight / 2;

        // ========================================
        // 1. WIREFRAME STATE - Glowing edge lines
        // ========================================
        const wireframeGroup = new THREE.Group();

        paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);

          shapes.forEach((shape) => {
            // Get high-resolution outline points
            const points = shape.getPoints(150);
            const linePoints: THREE.Vector3[] = [];

            points.forEach((p) => {
              const x = (p.x - svgCenterX) * scale;
              const y = -(p.y - svgCenterY) * scale;
              linePoints.push(new THREE.Vector3(x, y, 0));
            });

            // Close the shape
            if (linePoints.length > 0) {
              linePoints.push(linePoints[0].clone());
            }

            const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

            // Glowing wireframe material
            const lineMaterial = new THREE.LineBasicMaterial({
              color: COLORS.white,
              transparent: true,
              opacity: 0.9,
              linewidth: 1,
            });

            const line = new THREE.Line(lineGeometry, lineMaterial);
            wireframeGroup.add(line);

            // Add depth lines for 3D wireframe effect
            const extrudeDepth = 0.15;
            const backPoints = linePoints.map(p => new THREE.Vector3(p.x, p.y, -extrudeDepth));
            const backGeometry = new THREE.BufferGeometry().setFromPoints(backPoints);
            const backLine = new THREE.Line(backGeometry, lineMaterial.clone());
            wireframeGroup.add(backLine);

            // Connect front and back with vertical lines (sparse for elegance)
            for (let i = 0; i < linePoints.length; i += 8) {
              const connectGeometry = new THREE.BufferGeometry().setFromPoints([
                linePoints[i],
                backPoints[i]
              ]);
              const connectLine = new THREE.Line(connectGeometry, lineMaterial.clone());
              wireframeGroup.add(connectLine);
            }
          });
        });

        logoGroup.add(wireframeGroup);
        sceneRef.current.wireframeMesh = wireframeGroup as unknown as THREE.LineSegments;

        // ========================================
        // 2. SOLID STATE - 3D extruded mesh
        // ========================================
        const solidGroup = new THREE.Group();

        paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);

          shapes.forEach((shape) => {
            // Determine if this is the circle (check aspect ratio)
            const points = shape.getPoints(30);
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            points.forEach(p => {
              minX = Math.min(minX, p.x);
              maxX = Math.max(maxX, p.x);
              minY = Math.min(minY, p.y);
              maxY = Math.max(maxY, p.y);
            });
            const aspectRatio = (maxX - minX) / (maxY - minY);
            const centerX = (minX + maxX) / 2;
            const isCircle = aspectRatio > 0.8 && aspectRatio < 1.2 && centerX > 900;

            const extrudeSettings = {
              depth: isCircle ? 0.2 : 0.12,
              bevelEnabled: true,
              bevelThickness: isCircle ? 0.04 : 0.02,
              bevelSize: isCircle ? 0.03 : 0.015,
              bevelSegments: 3,
              curveSegments: 24,
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.translate(-svgCenterX, -svgCenterY, -extrudeSettings.depth / 2);
            geometry.scale(scale, -scale, 1);
            geometry.computeVertexNormals();

            // Premium material with subtle metallic quality
            const material = new THREE.MeshStandardMaterial({
              color: COLORS.white,
              metalness: 0.1,
              roughness: 0.3,
              emissive: COLORS.primary,
              emissiveIntensity: 0.05,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            solidGroup.add(mesh);
          });
        });

        solidGroup.visible = false;
        logoGroup.add(solidGroup);
        sceneRef.current.solidMesh = solidGroup as unknown as THREE.Mesh;

        // ========================================
        // 3. PARTICLE STATE - Explosive particles
        // ========================================
        const particlePositions: number[] = [];
        const particleOriginals: number[] = [];
        const particleExplosions: number[] = [];
        const particleColors: number[] = [];
        const particleSeeds: number[] = [];

        paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);

          shapes.forEach((shape) => {
            const points = shape.getPoints(30);
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            points.forEach(p => {
              minX = Math.min(minX, p.x);
              maxX = Math.max(maxX, p.x);
              minY = Math.min(minY, p.y);
              maxY = Math.max(maxY, p.y);
            });
            const aspectRatio = (maxX - minX) / (maxY - minY);
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const isCircle = aspectRatio > 0.8 && aspectRatio < 1.2 && centerX > 900;

            if (isCircle) {
              // SPHERE particles
              const radius = ((maxX - minX) / 2) * scale;
              const sphereCenterX = (centerX - svgCenterX) * scale;
              const sphereCenterY = -(centerY - svgCenterY) * scale;

              // Dense sphere
              for (let i = 0; i < 3500; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = radius * Math.cbrt(Math.random()); // Cube root for uniform volume

                const x = sphereCenterX + r * Math.sin(phi) * Math.cos(theta);
                const y = sphereCenterY + r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                particlePositions.push(x, y, z);
                particleOriginals.push(x, y, z);

                // Explosion targets - radial outward
                const explosionRadius = 1.5 + Math.random() * 2;
                particleExplosions.push(
                  sphereCenterX + explosionRadius * Math.sin(phi) * Math.cos(theta),
                  sphereCenterY + explosionRadius * Math.sin(phi) * Math.sin(theta),
                  explosionRadius * Math.cos(phi) * 0.5
                );

                // Color - mix of white and red
                const isRed = Math.random() > 0.7;
                if (isRed) {
                  particleColors.push(0.92, 0.14, 0.17);
                } else {
                  particleColors.push(1, 1, 1);
                }
                particleSeeds.push(Math.random());
              }
            } else {
              // SWOOSH particles - extruded volume sampling
              const extrudeSettings = {
                depth: 40,
                bevelEnabled: true,
                bevelThickness: 8,
                bevelSize: 6,
                bevelSegments: 2,
                curveSegments: 20,
              };

              const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
              geometry.translate(-svgCenterX, -svgCenterY, -extrudeSettings.depth / 2);
              const zScale = 0.004;
              geometry.scale(scale, -scale, zScale);

              const posAttr = geometry.attributes.position;
              const indexAttr = geometry.index;

              // Sample from triangles
              if (indexAttr) {
                const triangleCount = indexAttr.count / 3;
                const particlesPerTriangle = Math.ceil(8000 / triangleCount);

                for (let i = 0; i < triangleCount; i++) {
                  const i0 = indexAttr.getX(i * 3);
                  const i1 = indexAttr.getX(i * 3 + 1);
                  const i2 = indexAttr.getX(i * 3 + 2);

                  const v0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
                  const v1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
                  const v2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

                  for (let j = 0; j < particlesPerTriangle; j++) {
                    const r1 = Math.random();
                    const r2 = Math.random();
                    const sqrtR1 = Math.sqrt(r1);

                    const x = v0.x * (1 - sqrtR1) + v1.x * (sqrtR1 * (1 - r2)) + v2.x * (sqrtR1 * r2);
                    const y = v0.y * (1 - sqrtR1) + v1.y * (sqrtR1 * (1 - r2)) + v2.y * (sqrtR1 * r2);
                    const z = v0.z * (1 - sqrtR1) + v1.z * (sqrtR1 * (1 - r2)) + v2.z * (sqrtR1 * r2);

                    particlePositions.push(x, y, z);
                    particleOriginals.push(x, y, z);

                    // Explosion - spray outward and up
                    const angle = Math.atan2(y, x) + (Math.random() - 0.5) * 0.5;
                    const explosionDist = 0.8 + Math.random() * 1.5;
                    particleExplosions.push(
                      x + Math.cos(angle) * explosionDist,
                      y + Math.sin(angle) * explosionDist + Math.random() * 0.5,
                      z + (Math.random() - 0.5) * 0.8
                    );

                    const isRed = Math.random() > 0.75;
                    if (isRed) {
                      particleColors.push(0.92, 0.14, 0.17);
                    } else {
                      particleColors.push(1, 1, 1);
                    }
                    particleSeeds.push(Math.random());
                  }
                }
              }
              geometry.dispose();
            }
          });
        });

        // Create particle system
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particlePositions);
        const originals = new Float32Array(particleOriginals);
        const explosions = new Float32Array(particleExplosions);
        const colors = new Float32Array(particleColors);
        const seeds = new Float32Array(particleSeeds);

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('aOriginal', new THREE.BufferAttribute(originals, 3));
        particleGeometry.setAttribute('aExplosion', new THREE.BufferAttribute(explosions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

        const particleMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uProgress: { value: 0 }, // 0 = solid form, 1 = exploded
            uPointSize: { value: 6.0 },
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

              // Interpolate between original and explosion positions
              vec3 pos = mix(aOriginal, aExplosion, uProgress);

              // Add turbulence when exploding
              float turbulence = uProgress * 0.15;
              pos.x += sin(uTime * 2.0 + aSeed * 20.0) * turbulence;
              pos.y += cos(uTime * 1.8 + aSeed * 25.0) * turbulence;
              pos.z += sin(uTime * 2.2 + aSeed * 30.0) * turbulence * 0.5;

              // Subtle ambient float when in solid form
              float ambientFloat = (1.0 - uProgress) * 0.003;
              pos.x += sin(uTime * 0.8 + aSeed * 10.0) * ambientFloat;
              pos.y += cos(uTime * 0.6 + aSeed * 12.0) * ambientFloat;

              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_Position = projectionMatrix * mvPosition;

              // Size varies with explosion state
              float sizeBoost = uProgress * 2.0;
              float pulse = sin(uTime * 3.0 + aSeed * 6.28) * 0.3 * uProgress;
              gl_PointSize = (uPointSize + sizeBoost + pulse) / -mvPosition.z;

              // Fade slightly at edges during explosion
              vAlpha = 1.0 - uProgress * 0.2;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
              vec2 center = gl_PointCoord - vec2(0.5);
              float dist = length(center);
              if (dist > 0.5) discard;

              // Soft circular gradient
              float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;

              // Add glow
              vec3 finalColor = vColor + vColor * smoothstep(0.5, 0.0, dist) * 0.3;

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
        sceneRef.current.particleGeometry = particleGeometry;
        sceneRef.current.originalPositions = originals;
        sceneRef.current.currentPositions = positions;
        sceneRef.current.explosionTargets = explosions;

        console.log(`LogoThreeState: Created ${particlePositions.length / 3} particles`);
        setIsLoaded(true);

        // Auto-transition sequence
        if (autoTransition) {
          setTimeout(() => transitionToState('solid'), autoTransitionDelay);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading SVG:', error);
        setIsLoaded(true);
      }
    );

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseEnter = () => {
      isHoveringRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
      mouseRef.current = { x: 0, y: 0 };
    };

    const handleClick = () => {
      if (stateRef.current === 'solid') {
        transitionToState('particles');
      } else if (stateRef.current === 'particles') {
        transitionToState('solid');
      } else if (stateRef.current === 'wireframe') {
        transitionToState('solid');
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;

      if (!sceneRef.current) return;

      const { logoGroup, wireframeMesh, solidMesh, particleSystem } = sceneRef.current;
      const progress = transitionProgressRef.current;

      // Smooth rotation following mouse
      const targetRotY = mouseRef.current.x * 0.3;
      const targetRotX = mouseRef.current.y * 0.15;
      logoGroup.rotation.y += (targetRotY - logoGroup.rotation.y) * 0.05;
      logoGroup.rotation.x += (targetRotX - logoGroup.rotation.x) * 0.05;

      // Gentle auto-rotation when not hovering
      if (!isHoveringRef.current) {
        logoGroup.rotation.y += Math.sin(timeRef.current * 0.3) * 0.001;
        logoGroup.rotation.x += Math.cos(timeRef.current * 0.2) * 0.0005;
      }

      // State visibility and transitions
      if (wireframeMesh) {
        // Wireframe visible when progress < 1, fades out as we approach solid
        wireframeMesh.visible = progress < 1.2;
        wireframeMesh.traverse((child) => {
          if ((child as THREE.Line).material) {
            const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
            mat.opacity = Math.max(0, 1 - progress) * 0.9;
          }
        });
      }

      if (solidMesh) {
        // Solid visible when 0.5 < progress < 1.8
        solidMesh.visible = progress > 0.5 && progress < 1.8;
        solidMesh.traverse((child) => {
          if ((child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            // Fade in from wireframe, fade out to particles
            if (progress < 1) {
              mat.opacity = Math.min(1, (progress - 0.5) * 2);
            } else {
              mat.opacity = Math.max(0, 1 - (progress - 1) * 1.5);
            }
            mat.transparent = true;
            mat.needsUpdate = true;
          }
        });
      }

      if (particleSystem) {
        // Particles visible when progress > 1.2
        particleSystem.visible = progress > 1.2;
        const particleMat = particleSystem.material as THREE.ShaderMaterial;
        particleMat.uniforms.uTime.value = timeRef.current;
        // Explosion progress: 0 when at solid (progress=1.5), 1 when fully exploded (progress=2)
        particleMat.uniforms.uProgress.value = Math.max(0, Math.min(1, (progress - 1.5) * 2));
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!sceneRef.current) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      const newSettings = getResponsiveSettings();

      camera.aspect = w / h;
      camera.position.z = newSettings.cameraZ;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      logoGroup.scale.setScalar(newSettings.scale);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);

      if (sceneRef.current) {
        sceneRef.current.particleGeometry?.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, [autoTransition, autoTransitionDelay, transitionToState]);

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
          cursor: 'pointer',
        }}
      />

      {/* State indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          opacity: isLoaded ? 0.7 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: 'none',
        }}
      >
        {(['wireframe', 'solid', 'particles'] as LogoState[]).map((state) => (
          <div
            key={state}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentState === state ? '#EA242B' : '#333',
              transition: 'background-color 0.3s ease',
              boxShadow: currentState === state ? '0 0 10px rgba(234, 36, 43, 0.6)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Interaction hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#666',
          opacity: isLoaded && currentState !== 'wireframe' ? 0.6 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: 'none',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Click to {currentState === 'solid' ? 'explode' : 'reassemble'}
      </div>
    </div>
  );
}
