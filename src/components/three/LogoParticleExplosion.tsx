import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

interface Props {
  className?: string;
}

export default function LogoParticleExplosion({ className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const groupRef = useRef<THREE.Group | null>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const linesMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  const mouseWorldRef = useRef<THREE.Vector3>(new THREE.Vector3(100, 100, 100));
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);

    // Responsive camera distance
    const getResponsiveSettings = () => {
      const w = window.innerWidth;
      if (w <= 480) return { cameraZ: 4.5, logoScale: 0.7 };
      if (w <= 768) return { cameraZ: 4.0, logoScale: 0.8 };
      if (w <= 992) return { cameraZ: 3.5, logoScale: 0.9 };
      if (w <= 1200) return { cameraZ: 3.2, logoScale: 0.95 };
      return { cameraZ: 3, logoScale: 1.0 };
    };

    const responsiveSettings = getResponsiveSettings();
    camera.position.z = responsiveSettings.cameraZ;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const logoGroup = new THREE.Group();
    logoGroup.scale.setScalar(responsiveSettings.logoScale);
    scene.add(logoGroup);
    groupRef.current = logoGroup;

    // Enhanced shader with ambient float, glow, and better depth
    const particleShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMousePosition: { value: new THREE.Vector3(100, 100, 100) },
        uBaseColor: { value: new THREE.Color(0xffffff) },
        uHighlightColor: { value: new THREE.Color(0xE7001A) },
        uSecondaryColor: { value: new THREE.Color(0xff6b6b) }, // Softer red for glow
        uExplosionRadius: { value: 0.4 },
        uExplosionStrength: { value: 0.5 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uMousePosition;
        uniform float uExplosionRadius;
        uniform float uExplosionStrength;

        attribute vec3 aOriginalPosition;
        attribute float aRandomSeed;

        varying float vExplosionAmount;
        varying float vDepth;
        varying float vRandom;

        void main() {
          float distToMouse = distance(aOriginalPosition, uMousePosition);
          float explosionInfluence = 1.0 - smoothstep(0.0, uExplosionRadius, distToMouse);
          vExplosionAmount = explosionInfluence;
          vDepth = aOriginalPosition.z;
          vRandom = aRandomSeed;

          // AMBIENT FLOAT - constant subtle movement
          float floatX = sin(uTime * 0.8 + aRandomSeed * 20.0) * 0.008;
          float floatY = cos(uTime * 0.6 + aRandomSeed * 25.0) * 0.008;
          float floatZ = sin(uTime * 0.7 + aRandomSeed * 30.0) * 0.005;
          vec3 ambientOffset = vec3(floatX, floatY, floatZ);

          // Explosion direction
          vec3 explosionDir = normalize(aOriginalPosition - uMousePosition + vec3(0.001));

          // Turbulence on explosion
          float turbX = sin(uTime * 2.5 + aRandomSeed * 10.0) * 0.15;
          float turbY = cos(uTime * 2.0 + aRandomSeed * 15.0) * 0.15;
          float turbZ = sin(uTime * 2.2 + aRandomSeed * 12.0) * 0.15;

          float displacement = explosionInfluence * uExplosionStrength * (0.4 + aRandomSeed * 0.6);
          vec3 explosionOffset = explosionDir * displacement;
          explosionOffset += vec3(turbX, turbY, turbZ) * explosionInfluence * 0.25;

          // Combine ambient + explosion
          vec3 pos = aOriginalPosition + ambientOffset + explosionOffset;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Dynamic particle size with glow effect
          float baseSize = 7.0;
          float explosionBoost = explosionInfluence * 8.0;
          float pulseSize = sin(uTime * 3.0 + aRandomSeed * 6.28) * 0.5 + 0.5;
          float glowPulse = pulseSize * 1.5 * explosionInfluence;

          gl_PointSize = (baseSize + explosionBoost + glowPulse) / -mvPosition.z;
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uHighlightColor;
        uniform vec3 uSecondaryColor;
        uniform float uTime;

        varying float vExplosionAmount;
        varying float vDepth;
        varying float vRandom;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;

          // Soft glow falloff
          float coreBrightness = smoothstep(0.5, 0.0, dist);
          float glowBrightness = smoothstep(0.5, 0.2, dist);

          // Enhanced depth shading
          float depthShade = 0.4 + (vDepth + 0.25) * 2.5;
          depthShade = clamp(depthShade, 0.25, 1.0);

          // Color mixing - base with subtle variation
          vec3 baseShaded = uBaseColor * depthShade;

          // Add subtle color variation based on position
          float colorVar = sin(vRandom * 6.28) * 0.1;
          baseShaded = mix(baseShaded, uSecondaryColor * 0.3, colorVar * (1.0 - vExplosionAmount));

          // Explosion color
          vec3 color = mix(baseShaded, uHighlightColor, vExplosionAmount * 0.9);

          // Glow effect - brighter core, softer edges
          float alpha = mix(glowBrightness * 0.8, coreBrightness, 0.6);

          // Add bloom to exploding particles
          color += uHighlightColor * vExplosionAmount * coreBrightness * 0.5;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending, // Glow effect
    });
    shaderMaterialRef.current = particleShaderMaterial;

    // Connection lines shader
    const linesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMousePosition: { value: new THREE.Vector3(100, 100, 100) },
        uColor: { value: new THREE.Color(0xffffff) },
        uHighlightColor: { value: new THREE.Color(0xE7001A) },
        uExplosionRadius: { value: 0.4 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uMousePosition;
        uniform float uExplosionRadius;

        attribute vec3 aOriginalPosition;
        attribute float aRandomSeed;

        varying float vOpacity;
        varying float vExplosion;

        void main() {
          float distToMouse = distance(aOriginalPosition, uMousePosition);
          float explosionInfluence = 1.0 - smoothstep(0.0, uExplosionRadius, distToMouse);
          vExplosion = explosionInfluence;

          // Ambient float matching particles
          float floatX = sin(uTime * 0.8 + aRandomSeed * 20.0) * 0.008;
          float floatY = cos(uTime * 0.6 + aRandomSeed * 25.0) * 0.008;
          float floatZ = sin(uTime * 0.7 + aRandomSeed * 30.0) * 0.005;

          // Explosion offset
          vec3 explosionDir = normalize(aOriginalPosition - uMousePosition + vec3(0.001));
          float turbX = sin(uTime * 2.5 + aRandomSeed * 10.0) * 0.15;
          float turbY = cos(uTime * 2.0 + aRandomSeed * 15.0) * 0.15;
          float turbZ = sin(uTime * 2.2 + aRandomSeed * 12.0) * 0.15;
          float displacement = explosionInfluence * 0.5 * (0.4 + aRandomSeed * 0.6);
          vec3 explosionOffset = explosionDir * displacement + vec3(turbX, turbY, turbZ) * explosionInfluence * 0.25;

          vec3 pos = aOriginalPosition + vec3(floatX, floatY, floatZ) + explosionOffset;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Fade lines when exploding
          vOpacity = 0.15 * (1.0 - explosionInfluence * 0.8);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uHighlightColor;

        varying float vOpacity;
        varying float vExplosion;

        void main() {
          vec3 color = mix(uColor, uHighlightColor, vExplosion * 0.5);
          gl_FragColor = vec4(color, vOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    linesMaterialRef.current = linesMaterial;

    const particleGeometry = new THREE.BufferGeometry();
    const loader = new SVGLoader();

    loader.load(
      '/assets/models/logo.svg',
      (data) => {
        const paths = data.paths;
        const svgWidth = 1137;
        const svgHeight = 278;
        const targetWidth = 4;
        const scale = targetWidth / svgWidth;
        const svgCenterX = svgWidth / 2;
        const svgCenterY = svgHeight / 2;

        const particles: THREE.Vector3[] = [];
        const connectionPairs: [THREE.Vector3, THREE.Vector3][] = [];

        paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);

          shapes.forEach((shape) => {
            const points = shape.getPoints(50);
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            points.forEach(p => {
              minX = Math.min(minX, p.x);
              maxX = Math.max(maxX, p.x);
              minY = Math.min(minY, p.y);
              maxY = Math.max(maxY, p.y);
            });

            const shapeWidth = maxX - minX;
            const shapeHeight = maxY - minY;
            const aspectRatio = shapeWidth / shapeHeight;
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const isCircle = aspectRatio > 0.8 && aspectRatio < 1.2 && centerX > 900;

            if (isCircle) {
              // SPHERE - enhanced with more particles
              const radius = (shapeWidth / 2) * scale;
              const sphereCenterX = (centerX - svgCenterX) * scale;
              const sphereCenterY = -(centerY - svgCenterY) * scale;

              // Dense sphere particles
              const sphereParticleCount = 4000;
              for (let i = 0; i < sphereParticleCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = radius * (0.6 + Math.random() * 0.4);

                const x = sphereCenterX + r * Math.sin(phi) * Math.cos(theta);
                const y = sphereCenterY + r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                particles.push(new THREE.Vector3(x, y, z));
              }

              // Surface shell for definition
              for (let i = 0; i < 2000; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                particles.push(new THREE.Vector3(
                  sphereCenterX + radius * Math.sin(phi) * Math.cos(theta),
                  sphereCenterY + radius * Math.sin(phi) * Math.sin(theta),
                  radius * Math.cos(phi)
                ));
              }

            } else {
              // SWOOSH - Much denser with edge emphasis

              // 1. EDGE PARTICLES - trace the outline multiple times at different Z depths
              const edgePoints = shape.getPoints(300); // High resolution outline
              const zDepths = [-0.18, -0.12, -0.06, 0, 0.06, 0.12, 0.18]; // Multiple Z layers

              zDepths.forEach(z => {
                edgePoints.forEach((p, idx) => {
                  const worldX = (p.x - svgCenterX) * scale;
                  const worldY = -(p.y - svgCenterY) * scale;

                  // Multiple particles per edge point for thickness
                  for (let t = 0; t < 3; t++) {
                    particles.push(new THREE.Vector3(
                      worldX + (Math.random() - 0.5) * 0.015,
                      worldY + (Math.random() - 0.5) * 0.015,
                      z + (Math.random() - 0.5) * 0.03
                    ));
                  }
                });
              });

              // 2. EXTRUDED VOLUME with better sampling
              const extrudeSettings = {
                depth: 50,
                bevelEnabled: true,
                bevelThickness: 12,
                bevelSize: 10,
                bevelSegments: 4,
                curveSegments: 32,
              };

              const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
              geometry.translate(-svgCenterX, -svgCenterY, -extrudeSettings.depth / 2);
              const zScale = 0.007;
              geometry.scale(scale, -scale, zScale);

              const posAttr = geometry.attributes.position;
              const indexAttr = geometry.index;

              // All vertices
              for (let i = 0; i < posAttr.count; i++) {
                particles.push(new THREE.Vector3(
                  posAttr.getX(i),
                  posAttr.getY(i),
                  posAttr.getZ(i)
                ));
              }

              // Dense triangle sampling
              if (indexAttr) {
                const triangleCount = indexAttr.count / 3;
                for (let i = 0; i < triangleCount; i++) {
                  const i0 = indexAttr.getX(i * 3);
                  const i1 = indexAttr.getX(i * 3 + 1);
                  const i2 = indexAttr.getX(i * 3 + 2);

                  const v0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
                  const v1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
                  const v2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

                  // 8 random points per triangle
                  for (let j = 0; j < 8; j++) {
                    const r1 = Math.random();
                    const r2 = Math.random();
                    const sqrtR1 = Math.sqrt(r1);

                    const point = new THREE.Vector3();
                    point.addScaledVector(v0, 1 - sqrtR1);
                    point.addScaledVector(v1, sqrtR1 * (1 - r2));
                    point.addScaledVector(v2, sqrtR1 * r2);
                    particles.push(point);
                  }
                }
              }

              geometry.dispose();

              // 3. FILL thin areas with extra particles
              // Sample along the shape path and add extra particles
              const pathPoints = shape.getPoints(500);
              pathPoints.forEach((p, idx) => {
                const worldX = (p.x - svgCenterX) * scale;
                const worldY = -(p.y - svgCenterY) * scale;

                // Add particles in a small sphere around each path point
                for (let n = 0; n < 5; n++) {
                  const theta = Math.random() * Math.PI * 2;
                  const phi = Math.random() * Math.PI;
                  const r = 0.02 + Math.random() * 0.03;

                  particles.push(new THREE.Vector3(
                    worldX + r * Math.sin(phi) * Math.cos(theta),
                    worldY + r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                  ));
                }
              });
            }
          });
        });

        console.log(`Created ${particles.length} particles`);

        // Build connection lines between nearby particles
        const maxConnectionDist = 0.06;
        const maxConnections = 3000; // Limit for performance
        let connectionCount = 0;

        // Sample random pairs for connections
        for (let i = 0; i < particles.length && connectionCount < maxConnections; i += 3) {
          for (let j = i + 1; j < particles.length && connectionCount < maxConnections; j += 3) {
            const dist = particles[i].distanceTo(particles[j]);
            if (dist < maxConnectionDist && dist > 0.01) {
              connectionPairs.push([particles[i], particles[j]]);
              connectionCount++;
            }
          }
        }

        // Build particle arrays
        const particleCount = particles.length;
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const randomSeeds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
          const p = particles[i];
          positions[i * 3] = p.x;
          positions[i * 3 + 1] = p.y;
          positions[i * 3 + 2] = p.z;

          originalPositions[i * 3] = p.x;
          originalPositions[i * 3 + 1] = p.y;
          originalPositions[i * 3 + 2] = p.z;

          randomSeeds[i] = Math.random();
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('aOriginalPosition', new THREE.BufferAttribute(originalPositions, 3));
        particleGeometry.setAttribute('aRandomSeed', new THREE.BufferAttribute(randomSeeds, 1));

        const particleSystem = new THREE.Points(particleGeometry, particleShaderMaterial);
        logoGroup.add(particleSystem);

        // Build connection lines geometry
        if (connectionPairs.length > 0) {
          const linePositions = new Float32Array(connectionPairs.length * 6);
          const lineOriginalPositions = new Float32Array(connectionPairs.length * 6);
          const lineRandomSeeds = new Float32Array(connectionPairs.length * 2);

          connectionPairs.forEach((pair, i) => {
            const [p1, p2] = pair;
            linePositions[i * 6] = p1.x;
            linePositions[i * 6 + 1] = p1.y;
            linePositions[i * 6 + 2] = p1.z;
            linePositions[i * 6 + 3] = p2.x;
            linePositions[i * 6 + 4] = p2.y;
            linePositions[i * 6 + 5] = p2.z;

            lineOriginalPositions[i * 6] = p1.x;
            lineOriginalPositions[i * 6 + 1] = p1.y;
            lineOriginalPositions[i * 6 + 2] = p1.z;
            lineOriginalPositions[i * 6 + 3] = p2.x;
            lineOriginalPositions[i * 6 + 4] = p2.y;
            lineOriginalPositions[i * 6 + 5] = p2.z;

            const seed = Math.random();
            lineRandomSeeds[i * 2] = seed;
            lineRandomSeeds[i * 2 + 1] = seed;
          });

          const linesGeometry = new THREE.BufferGeometry();
          linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
          linesGeometry.setAttribute('aOriginalPosition', new THREE.BufferAttribute(lineOriginalPositions, 3));
          linesGeometry.setAttribute('aRandomSeed', new THREE.BufferAttribute(lineRandomSeeds, 1));

          const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
          logoGroup.add(lines);
        }

        setIsLoaded(true);
      },
      undefined,
      (error) => {
        console.error('Error loading SVG:', error);
        setIsLoaded(true);
      }
    );

    // Mouse handling
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);

      if (groupRef.current) {
        const planeNormal = new THREE.Vector3(0, 0, 1);
        planeNormal.applyQuaternion(groupRef.current.quaternion);

        const dynamicPlane = new THREE.Plane(planeNormal, 0);
        const worldPos = new THREE.Vector3();

        if (raycaster.ray.intersectPlane(dynamicPlane, worldPos)) {
          const inverseMatrix = new THREE.Matrix4().copy(groupRef.current.matrixWorld).invert();
          worldPos.applyMatrix4(inverseMatrix);
          mouseWorldRef.current.copy(worldPos);
        }
      }

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMouseRef.current.x;
        const deltaY = e.clientY - previousMouseRef.current.y;

        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x += deltaY * 0.005;
        targetRotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotationRef.current.x));

        previousMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
      mouseWorldRef.current.set(100, 100, 100);
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.08;

      if (groupRef.current) {
        const autoRotateY = isDraggingRef.current ? 0 : Math.sin(time * 0.3) * 0.12;
        const autoRotateX = isDraggingRef.current ? 0 : Math.cos(time * 0.2) * 0.06;

        groupRef.current.rotation.y = rotationRef.current.y + autoRotateY;
        groupRef.current.rotation.x = rotationRef.current.x + autoRotateX;
      }

      if (shaderMaterialRef.current) {
        shaderMaterialRef.current.uniforms.uTime.value = time;
        shaderMaterialRef.current.uniforms.uMousePosition.value.copy(mouseWorldRef.current);
      }

      if (linesMaterialRef.current) {
        linesMaterialRef.current.uniforms.uTime.value = time;
        linesMaterialRef.current.uniforms.uMousePosition.value.copy(mouseWorldRef.current);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      const newSettings = getResponsiveSettings();
      camera.position.z = newSettings.cameraZ;
      if (groupRef.current) {
        groupRef.current.scale.setScalar(newSettings.logoScale);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);

      particleGeometry.dispose();
      particleShaderMaterial.dispose();
      linesMaterial.dispose();

      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
        cursor: 'grab',
      }}
    />
  );
}
