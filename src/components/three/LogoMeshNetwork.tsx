import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import gsap from 'gsap';

interface Props {
  className?: string;
}

// Configuration
const CONFIG = {
  particles: {
    count: 15000,
    scale: { x: 1.5, y: 1.5, z: 1.5 }, // Bigger particles
    scatter: 1.5,
    color: '#e6e6e6',
    secondaryColor: '#ff3333',
    roughness: 0.2,
  },
  geometry: {
    depth: 50,
    bevelThickness: 3,
    bevelSize: 0.9,
    curveSegments: 20,
  },
  interaction: {
    radius: 120,     // Radius in logo coordinate space (logo is ~1200 wide)
    strength: 35,    // Push strength for scatter (reduced from 80)
    disperseSpeed: 0.08,  // How fast particles scatter (slower)
    reformSpeed: 0.03,    // How fast particles reform
  },
  shimmer: {
    color: '#E7001A',
    delay: { min: 4.0, max: 7.0 },
    speed: 0.25,
  },
};

const SVG_CONTENT = `<svg width="1137" height="278" viewBox="0 0 1137 278" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 181.114C12.7794 174.834 25.4132 168.266 38.3381 162.345C107.594 130.63 180.075 108.432 254.254 91.3644C322.467 75.6869 391.529 65.1393 461.221 58.595C511.296 53.8966 561.468 50.6364 611.785 50.8282C657.762 50.996 703.714 52.3145 749.691 53.1055C752.285 53.1535 754.88 53.1055 757.572 52.0268C743.192 49.8214 728.836 47.4482 714.432 45.4585C651.724 36.8527 588.7 33.9281 525.458 35.1507C471.939 36.1815 418.518 39.2738 365.461 46.2976C317.447 52.6501 269.628 60.3929 221.711 67.5125C221.566 67.5125 221.396 67.3927 220.45 66.9851C234.49 63.3175 247.852 59.6977 261.286 56.2938C336.022 37.3801 411.607 22.6854 488.138 13.0248C540.686 6.38464 593.452 2.1896 646.437 0.655406C702.477 -0.974671 758.42 0.367745 814.242 5.44975C898.023 13.0728 980.374 27.7914 1060.06 55.2869C1069.68 58.595 1079.12 62.4065 1088.62 66.0263C1089.28 66.266 1089.84 66.7454 1090.05 66.8893C1032.8 54.8555 983.138 67.8481 944.8 113.49C915.628 148.225 902.243 201.035 931.778 261.995C930.517 261.276 929.838 261.012 929.281 260.581C871.034 215.754 805.634 184.423 736.087 161.05C672.141 139.548 606.402 126.363 539.28 119.531C464.083 111.884 388.91 112.483 313.689 119.459C208.956 129.168 106.697 150.958 6.13507 181.019C4.29212 181.57 2.40068 182.025 0.533484 182.505C0.363739 182.025 0.193994 181.57 0 181.091L0 181.114Z" fill="white"/>
<path d="M1055.33 115.112C1092.58 114.489 1137.41 144.885 1137 197.431C1136.64 242.594 1100.26 278 1053.63 278C1008.26 278 972.178 241.419 972.178 195.465C972.178 151.022 1009.25 115.184 1055.33 115.112Z" fill="white"/>
</svg>`;

export default function LogoMeshNetwork({ className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const groupRef = useRef<THREE.Group | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const sphereMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const spherePivotRef = useRef<THREE.Group | null>(null); // Pivot for sphere to rotate around its center

  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const mouseWorldRef = useRef(new THREE.Vector3(0, 0, 0)); // Mouse position in logo local coords
  const mouseActiveRef = useRef(false);
  const mouseTimeoutRef = useRef<number | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const actualRotation = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const autoRotationOffset = useRef(0); // Track auto-rotation offset
  const disperseAmount = useRef(0); // For scatter/reform effect
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const scaleRef = useRef(1); // Store the logo scale for coordinate conversion

  // Store original positions for animation
  const swooshOriginalPositions = useRef<THREE.Vector3[]>([]);
  const sphereCenter3D = useRef(new THREE.Vector3());

  // Animation state for "Cosmic Genesis" entrance
  // Both swoosh and sphere stream in from a common origin point
  const animationState = useRef({
    // Unified streaming animation
    streamProgress: 0,       // 0 = at origin, 1 = final position
    particleOpacity: 0,      // Fade in as particles stream
    // Phase 3: Crystallization
    positionOvershoot: 1.0,  // For spring settle effect
    connectionPulse: 0,
    // Phase 4: Rest
    idleFloat: 0,
    entranceComplete: false,
  });

  // Store sphere base position for animation
  const sphereBaseY = useRef(0);
  const sphereBaseX = useRef(0);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    // Responsive camera distance based on screen size
    const isMobile = width < 768;
    const isSmallScreen = width < 1200;
    const baseFov = isMobile ? 55 : isSmallScreen ? 50 : 45;
    const baseZ = isMobile ? 90 : isSmallScreen ? 75 : 70;

    const camera = new THREE.PerspectiveCamera(baseFov, width / height, 0.1, 1000);
    camera.position.z = baseZ;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // Bounds for shader uniforms
    let boundsMin = new THREE.Vector3();
    let boundsMax = new THREE.Vector3();
    let maxRadius = 1;

    // Load and process SVG geometry
    const loadGeometry = () => {
      console.log('Loading SVG geometry...');
      const loader = new SVGLoader();
      const data = loader.parse(SVG_CONTENT);
      const paths = data.paths;
      console.log('Paths found:', paths.length);
      const geometries: THREE.BufferGeometry[] = [];
      const totalBounds = new THREE.Box3();

      // Circle center and radius from SVG (second path is the circle)
      const circleCenter = { x: 1055, y: 197 };
      const circleRadius = 82;

      paths.forEach((path, pathIndex) => {
        const shapes = SVGLoader.createShapes(path);

        // Second path (index 1) is the circle - create a sphere instead
        if (pathIndex === 1) {
          // Create sphere geometry for the circle
          const sphereGeo = new THREE.SphereGeometry(circleRadius, 32, 32);
          // Position the sphere at the circle's center
          sphereGeo.translate(circleCenter.x, circleCenter.y, CONFIG.geometry.depth / 2);

          sphereGeo.computeBoundingBox();
          if (sphereGeo.boundingBox) {
            totalBounds.expandByPoint(sphereGeo.boundingBox.min);
            totalBounds.expandByPoint(sphereGeo.boundingBox.max);
          }
          geometries.push(sphereGeo);
          return;
        }

        shapes.forEach((shape) => {
          const geo = new THREE.ExtrudeGeometry(shape, {
            depth: CONFIG.geometry.depth,
            bevelEnabled: CONFIG.geometry.bevelThickness > 0,
            bevelThickness: CONFIG.geometry.bevelThickness,
            bevelSize: CONFIG.geometry.bevelSize,
            steps: 1,
            curveSegments: CONFIG.geometry.curveSegments,
          });

          geo.computeBoundingBox();
          if (geo.boundingBox) {
            totalBounds.expandByPoint(geo.boundingBox.min);
            totalBounds.expandByPoint(geo.boundingBox.max);
          }
          geometries.push(geo);
        });
      });

      const center = new THREE.Vector3();
      totalBounds.getCenter(center);
      const size = new THREE.Vector3();
      totalBounds.getSize(size);

      boundsMin = totalBounds.min;
      boundsMax = totalBounds.max;
      maxRadius = Math.max(size.x, size.y) / 2;

      console.log('Geometries created:', geometries.length);
      console.log('Bounds:', totalBounds);
      console.log('Size:', size);

      const contentGroup = new THREE.Group();

      // Separate sphere geometry from the rest
      const sphereGeo = geometries.length > 1 ? geometries[1] : null;
      const swooshGeos = geometries.filter((_, i) => i !== 1);

      // Calculate sphere center in world coordinates (for swoosh streaming origin)
      const sphereCenterWorld = new THREE.Vector3(
        circleCenter.x - center.x,
        -(circleCenter.y - center.y), // Flip Y
        CONFIG.geometry.depth / 2 - center.z
      );

      // Generate particles for swoosh (streams from sphere)
      generateParticles(swooshGeos, contentGroup, center, totalBounds, sphereCenterWorld);

      // Generate particles for sphere separately (so it can rotate)
      if (sphereGeo) {
        generateSphereParticles(sphereGeo, contentGroup, center, totalBounds, circleCenter, sphereCenterWorld.x);
      }

      // Auto-scale to fit view - responsive sizing
      const maxDim = Math.max(size.x, size.y);
      console.log('Max dimension:', maxDim);
      if (maxDim > 0) {
        // Smaller base scale, adjusted for screen size
        const baseScale = isMobile ? 50 : isSmallScreen ? 60 : 65;
        const scale = baseScale / maxDim;
        console.log('Scale:', scale);
        group.scale.set(scale, scale, scale);
        scaleRef.current = scale; // Store for mouse coordinate conversion
      }

      group.add(contentGroup);
      console.log('Content group children:', contentGroup.children.length);
      setIsLoaded(true);

      // ============================================
      // GSAP Unified Particle Stream Animation
      // ============================================
      // Both swoosh and sphere particles stream in from a common origin
      // Phase 1: Stream (0-2.5s) - All particles flow from origin to final positions
      // Phase 2: Crystallization (2.5-3.0s) - Particles settle with spring
      // Phase 3: Rest (3.0s+) - Idle state begins

      // Store base positions for animation
      sphereBaseX.current = sphereCenterWorld.x;
      sphereBaseY.current = sphereCenterWorld.y;

      const tl = gsap.timeline({
        delay: 0,  // Start immediately
        onComplete: () => {
          animationState.current.entranceComplete = true;
        },
      });

      // ============================================
      // PHASE 1: UNIFIED PARTICLE STREAM (0 - 1.8s)
      // All particles rise from bottom - staggered formation
      // ============================================
      tl.to(
        animationState.current,
        {
          streamProgress: 1.0,
          particleOpacity: 1.0,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            const progress = animationState.current.streamProgress;
            const opacity = animationState.current.particleOpacity;

            // Update swoosh particles
            if (instancedMeshRef.current) {
              const mat = instancedMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.streamProgress.value = progress;
                mat.uniforms.uOpacity.value = opacity;
              }
            }

            // Update sphere particles with same animation
            if (sphereMeshRef.current) {
              const mat = sphereMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.streamProgress.value = progress;
                mat.uniforms.uOpacity.value = opacity;
              }
            }
          },
          onComplete: () => {
            // Fire event when particles are in position (end of Phase 1)
            // This triggers hero content animation immediately when logo is visually formed
            window.dispatchEvent(new CustomEvent('logoAnimationComplete'));
          },
        },
        0
      );

      // ============================================
      // PHASE 1b: FADE BACK (1.6 - 2.2s)
      // Particles fade to let shimmer shine
      // ============================================
      tl.to(
        animationState.current,
        {
          particleOpacity: 0.55,  // Fade to 55% opacity
          duration: 0.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            const opacity = animationState.current.particleOpacity;
            if (instancedMeshRef.current) {
              const mat = instancedMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.uOpacity.value = opacity;
              }
            }
            if (sphereMeshRef.current) {
              const mat = sphereMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.uOpacity.value = opacity;
              }
            }
          },
        },
        1.6
      );

      // ============================================
      // PHASE 2: CRYSTALLIZATION (1.8 - 2.4s)
      // Particles overshoot then spring back
      // ============================================

      // Phase 2a: Overshoot (1.8 - 2.0s)
      tl.to(
        animationState.current,
        {
          positionOvershoot: 1.04,
          duration: 0.15,
          ease: 'power2.out',
          onUpdate: () => {
            const overshoot = animationState.current.positionOvershoot;
            if (instancedMeshRef.current) {
              const mat = instancedMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.positionOvershoot.value = overshoot;
              }
            }
            if (sphereMeshRef.current) {
              const mat = sphereMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.positionOvershoot.value = overshoot;
              }
            }
          },
        },
        1.8
      );

      // Phase 2b: Spring back (2.0 - 2.2s)
      tl.to(
        animationState.current,
        {
          positionOvershoot: 1.0,
          duration: 0.3,
          ease: 'back.out(2)',
          onUpdate: () => {
            const overshoot = animationState.current.positionOvershoot;
            if (instancedMeshRef.current) {
              const mat = instancedMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.positionOvershoot.value = overshoot;
              }
            }
            if (sphereMeshRef.current) {
              const mat = sphereMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.positionOvershoot.value = overshoot;
              }
            }
          },
        },
        2.0
      );

      // Phase 2c: Connection shimmer pulse (2.2 - 2.4s)
      tl.to(
        animationState.current,
        {
          connectionPulse: 1.0,
          duration: 0.2,
          ease: 'power2.in',
          onUpdate: () => {
            const pulse = animationState.current.connectionPulse;
            if (instancedMeshRef.current) {
              const mat = instancedMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.shimmerIntensity.value = pulse * 0.7;
              }
            }
            if (sphereMeshRef.current) {
              const mat = sphereMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.shimmerIntensity.value = pulse * 0.7;
              }
            }
          },
        },
        2.2
      );

      // Phase 2d: Pulse fades (2.4 - 2.6s)
      tl.to(
        animationState.current,
        {
          connectionPulse: 0,
          duration: 0.4,
          ease: 'power2.out',
          onUpdate: () => {
            const pulse = animationState.current.connectionPulse;
            if (instancedMeshRef.current) {
              const mat = instancedMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.shimmerIntensity.value = pulse * 0.7;
              }
            }
            if (sphereMeshRef.current) {
              const mat = sphereMeshRef.current.material as THREE.ShaderMaterial;
              if (mat.uniforms) {
                mat.uniforms.shimmerIntensity.value = pulse * 0.7;
              }
            }
          },
        },
        2.4
      );

      // ============================================
      // PHASE 3: REST (2.6s onwards)
      // ============================================
      tl.to(
        animationState.current,
        {
          idleFloat: 1.0,
          duration: 0.2,
          ease: 'sine.inOut',
        },
        2.6
      );
    };

    // Generate particle system
    const generateParticles = (
      geometries: THREE.BufferGeometry[],
      parent: THREE.Group,
      center: THREE.Vector3,
      bounds: THREE.Box3,
      sphereCenterWorld: THREE.Vector3
    ) => {
      const positions: THREE.Vector3[] = [];
      const randoms: number[] = [];
      const size = new THREE.Vector3();
      bounds.getSize(size);

      geometries.forEach((geo, geoIndex) => {
        console.log(`Processing geometry ${geoIndex}...`);
        const tempMesh = new THREE.Mesh(geo);
        const sampler = new MeshSurfaceSampler(tempMesh).build();
        const tempPos = new THREE.Vector3();
        const tempNormal = new THREE.Vector3();

        const samples = Math.floor(CONFIG.particles.count / geometries.length);
        console.log(`Sampling ${samples} particles from geometry ${geoIndex}`);

        for (let i = 0; i < samples; i++) {
          sampler.sample(tempPos, tempNormal);

          // Add scatter
          if (CONFIG.particles.scatter > 0) {
            tempPos.addScaledVector(
              tempNormal,
              (Math.random() - 0.5) * CONFIG.particles.scatter
            );
          }

          positions.push(tempPos.clone());
          randoms.push(Math.random());
        }
      });

      // Store original positions for swoosh streaming animation
      swooshOriginalPositions.current = positions.map(p => p.clone());
      // Store sphere center for particles to stream from
      sphereCenter3D.current.copy(sphereCenterWorld);

      console.log('Total positions sampled:', positions.length);

      // Particle shader material with Cosmic Genesis animation
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(CONFIG.particles.color) },
          colorB: { value: new THREE.Color(CONFIG.particles.secondaryColor) },
          roughness: { value: CONFIG.particles.roughness },
          uScale: {
            value: new THREE.Vector3(
              CONFIG.particles.scale.x,
              CONFIG.particles.scale.y,
              CONFIG.particles.scale.z
            ),
          },
          time: { value: 0 },
          mousePos: { value: new THREE.Vector3() },
          mouseActive: { value: 0.0 },
          disperseAmount: { value: 0.0 },  // 0 = formed, 1 = fully scattered
          interactionRadius: { value: CONFIG.interaction.radius },
          interactionStrength: { value: CONFIG.interaction.strength },
          minY: { value: bounds.min.y },
          maxY: { value: bounds.max.y },
          maxRadius: { value: Math.max(size.x, size.y) / 2 },
          // Shimmer uniforms
          shimmerPosX: { value: -600.0 },
          shimmerIntensity: { value: 0.0 },
          shimmerColor: { value: new THREE.Color(CONFIG.shimmer.color) },
          // Rising particle animation uniforms
          streamProgress: { value: 0.0 },
          uOpacity: { value: 0.0 },
          positionOvershoot: { value: 1.0 },
        },
        transparent: true,
        vertexShader: `
          attribute float aRandom;
          uniform float time;
          uniform vec3 mousePos;
          uniform float mouseActive;
          uniform float disperseAmount;
          uniform float interactionRadius;
          uniform float interactionStrength;
          uniform vec3 uScale;
          uniform float minY;
          uniform float maxY;
          uniform float maxRadius;
          uniform vec3 color;
          uniform vec3 colorB;
          uniform float shimmerPosX;
          uniform float shimmerIntensity;
          uniform vec3 shimmerColor;
          uniform float streamProgress;
          uniform float positionOvershoot;

          varying vec3 vColor;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying float vShimmer;
          varying float vTrail;
          varying float vDisperse;

          void main() {
            vec4 instanceMatrixCol3 = instanceMatrix[3];
            vec3 instancePos = instanceMatrixCol3.xyz;

            // ========================================
            // RISING FROM BOTTOM - Particles float up from below
            // Each particle starts at bottom edge of screen
            // ========================================
            vec3 endPos = instancePos;

            // Start position: far below the screen (positive Y = bottom in this coord system)
            vec3 startPos = vec3(
              instancePos.x + (aRandom - 0.5) * 150.0,  // Spread horizontally
              800.0,                                     // Start FAR below viewport
              instancePos.z + (aRandom - 0.5) * 30.0    // Slight Z variation
            );

            // Stagger particles for dramatic formation effect
            // Particles on the left arrive first, right side arrives later
            float xNormalized = (instancePos.x + 600.0) / 1200.0; // Normalize X to 0-1
            float yNormalized = (instancePos.y + 200.0) / 400.0;  // Normalize Y

            // Stagger: X position + Y position + randomness (total max ~0.6)
            float staggerDelay = xNormalized * 0.35 + yNormalized * 0.1 + aRandom * 0.15;

            float adjustedProgress = clamp(
              (streamProgress - staggerDelay) / max(1.0 - staggerDelay, 0.2),
              0.0, 1.0
            );

            // Smooth easing - ease out for gentle landing
            float easedProgress = 1.0 - pow(1.0 - adjustedProgress, 2.0);

            // ========================================
            // RISING TRAJECTORY with slight curve
            // ========================================
            // Control point creates a gentle S-curve as particles rise
            vec3 controlPoint = mix(startPos, endPos, 0.6);
            controlPoint.x += (aRandom - 0.5) * 30.0;  // Gentle horizontal drift
            controlPoint.y = mix(startPos.y, endPos.y, 0.7);  // Rise faster initially

            // Quadratic Bezier for smooth curved path
            vec3 p0 = mix(startPos, controlPoint, easedProgress);
            vec3 p1 = mix(controlPoint, endPos, easedProgress);
            vec3 curvePos = mix(p0, p1, easedProgress);

            // Subtle float/drift during rise
            float driftAmount = (1.0 - easedProgress) * (1.0 - easedProgress);
            curvePos.x += sin(easedProgress * 6.0 + aRandom * 10.0) * 5.0 * driftAmount;
            curvePos.z += cos(easedProgress * 4.0 + aRandom * 8.0) * 3.0 * driftAmount;

            vec3 animPos = curvePos;

            // ========================================
            // POSITION OVERSHOOT (Spring settle)
            // ========================================
            vec3 overshootDir = vec3(0.0, -1.0, 0.0);  // Overshoot upward (negative Y is up)
            float overshootAmount = (positionOvershoot - 1.0) * 12.0;
            if (easedProgress > 0.95) {
              animPos += overshootDir * overshootAmount * smoothstep(0.95, 1.0, easedProgress);
            }

            // Trail effect for motion blur look
            vec3 prevPos = mix(startPos, endPos, max(easedProgress - 0.08, 0.0));
            vTrail = length(animPos - prevPos) * 0.05 * (1.0 - easedProgress);

            // ========================================
            // MOUSE SCATTER/DISPERSE EFFECT
            // Particles explode outward from mouse, reform when mouse leaves
            // ========================================
            vDisperse = 0.0;
            if (streamProgress > 0.85) {
              // Calculate distance from mouse
              float dist = distance(animPos.xy, mousePos.xy);

              // Influence falls off with distance
              float influence = smoothstep(interactionRadius * 2.5, 0.0, dist);

              // Direction away from mouse (with some randomness for organic feel)
              vec3 scatterDir = normalize(animPos - mousePos + vec3((aRandom - 0.5) * 0.5, (aRandom - 0.3) * 0.5, aRandom - 0.5));

              // Scatter distance varies by particle (randomness) and mouse proximity
              float scatterDist = interactionStrength * influence * disperseAmount * (0.5 + aRandom * 0.5);

              // Add some turbulence/float while scattered
              float turbulence = sin(time * 3.0 + aRandom * 20.0) * disperseAmount * influence * 2.0;

              animPos += scatterDir * scatterDist;
              animPos.x += turbulence;
              animPos.y += cos(time * 2.5 + aRandom * 15.0) * disperseAmount * influence * 1.5;
              animPos.z += sin(time * 2.0 + aRandom * 12.0) * disperseAmount * influence * 1.0;

              vDisperse = influence * disperseAmount;
            }

            // Color gradient based on Y position
            float mixFactor = smoothstep(minY, maxY, instancePos.y);
            vColor = mix(color, colorB, clamp(mixFactor, 0.0, 1.0));

            // Calculate shimmer
            float distFromShimmer = abs(instancePos.x - shimmerPosX);
            float shimmerWidth = 50.0;
            vShimmer = (1.0 - smoothstep(0.0, shimmerWidth, distFromShimmer)) * shimmerIntensity;

            vec3 localPos = position * uScale;
            vec4 worldPos = instanceMatrix * vec4(localPos, 1.0);
            worldPos.xyz = animPos + (worldPos.xyz - instancePos);

            vWorldPosition = worldPos.xyz;
            vec4 mvPosition = viewMatrix * modelMatrix * worldPos;
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying float vShimmer;
          varying float vDisperse;
          uniform float roughness;
          uniform vec3 shimmerColor;
          uniform float mouseActive;
          uniform vec3 mousePos;
          uniform float interactionRadius;
          uniform float uOpacity;

          void main() {
            vec3 viewDir = normalize(vViewPosition);
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0));
            vec3 halfDir = normalize(lightDir + viewDir);

            float NdotL = max(dot(normal, lightDir), 0.0);
            vec3 diffuse = vColor * NdotL;

            float specPower = mix(100.0, 1.0, roughness);
            float NdotH = max(dot(normal, halfDir), 0.0);
            float specIntensity = pow(NdotH, specPower) * (1.0 - roughness);
            vec3 specular = vec3(1.0) * specIntensity;

            vec3 ambient = vColor * 0.2;
            vec3 baseColor = ambient + diffuse + specular;

            // Apply white shimmer
            vec3 finalColor = mix(baseColor, vec3(1.0), vShimmer * 0.4);

            // Subtle glow on scattered particles
            if (vDisperse > 0.1) {
              // Slight white/red tint on dispersed particles
              finalColor = mix(finalColor, vec3(1.0, 0.9, 0.9), vDisperse * 0.3);
            }

            gl_FragColor = vec4(finalColor, uOpacity);
          }
        `,
        side: THREE.DoubleSide,
      });

      const geometry = new THREE.IcosahedronGeometry(0.5, 1);
      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        positions.length
      );

      const dummy = new THREE.Object3D();
      const aRandom = new Float32Array(positions.length);

      positions.forEach((pos, i) => {
        dummy.position.copy(pos);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
        aRandom[i] = randoms[i];
      });

      instancedMesh.geometry.setAttribute(
        'aRandom',
        new THREE.InstancedBufferAttribute(aRandom, 1)
      );
      instancedMesh.position.set(-center.x, center.y, -center.z);
      instancedMesh.scale.y = -1;

      instancedMeshRef.current = instancedMesh;
      parent.add(instancedMesh);
    };

    // Generate particles for sphere separately so it can rotate independently
    const generateSphereParticles = (
      sphereGeo: THREE.BufferGeometry,
      parent: THREE.Group,
      center: THREE.Vector3,
      bounds: THREE.Box3,
      sphereCenter: { x: number; y: number },
      sphereBaseX: number
    ) => {
      const positions: THREE.Vector3[] = [];
      const randoms: number[] = [];
      const size = new THREE.Vector3();
      bounds.getSize(size);

      const tempMesh = new THREE.Mesh(sphereGeo);
      const sampler = new MeshSurfaceSampler(tempMesh).build();
      const tempPos = new THREE.Vector3();
      const tempNormal = new THREE.Vector3();

      const samples = Math.floor(CONFIG.particles.count / 3); // More particles for sphere

      for (let i = 0; i < samples; i++) {
        sampler.sample(tempPos, tempNormal);

        if (CONFIG.particles.scatter > 0) {
          tempPos.addScaledVector(
            tempNormal,
            (Math.random() - 0.5) * CONFIG.particles.scatter * 0.5
          );
        }

        positions.push(tempPos.clone());
        randoms.push(Math.random());
      }

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(CONFIG.particles.color) },
          colorB: { value: new THREE.Color(CONFIG.particles.secondaryColor) },
          roughness: { value: CONFIG.particles.roughness },
          uScale: {
            value: new THREE.Vector3(
              CONFIG.particles.scale.x,
              CONFIG.particles.scale.y,
              CONFIG.particles.scale.z
            ),
          },
          time: { value: 0 },
          mousePos: { value: new THREE.Vector3() },
          mouseActive: { value: 0.0 },
          disperseAmount: { value: 0.0 },  // 0 = formed, 1 = fully scattered
          interactionRadius: { value: CONFIG.interaction.radius },
          interactionStrength: { value: CONFIG.interaction.strength },
          minY: { value: bounds.min.y },
          maxY: { value: bounds.max.y },
          maxRadius: { value: Math.max(size.x, size.y) / 2 },
          shimmerPosX: { value: -600.0 },
          shimmerIntensity: { value: 0.0 },
          shimmerColor: { value: new THREE.Color(CONFIG.shimmer.color) },
          // Rising particle animation uniforms
          streamProgress: { value: 0.0 },
          uOpacity: { value: 0.0 },
          positionOvershoot: { value: 1.0 },
        },
        transparent: true,
        vertexShader: `
          attribute float aRandom;
          uniform float time;
          uniform vec3 mousePos;
          uniform float mouseActive;
          uniform float disperseAmount;
          uniform float interactionRadius;
          uniform float interactionStrength;
          uniform vec3 uScale;
          uniform float minY;
          uniform float maxY;
          uniform float maxRadius;
          uniform vec3 color;
          uniform vec3 colorB;
          uniform float shimmerPosX;
          uniform float shimmerIntensity;
          uniform float streamProgress;
          uniform float positionOvershoot;

          varying vec3 vColor;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying float vShimmer;
          varying float vDisperse;

          void main() {
            vec4 instanceMatrixCol3 = instanceMatrix[3];
            vec3 instancePos = instanceMatrixCol3.xyz;

            // ========================================
            // RISING FROM BOTTOM - Same as swoosh
            // ========================================
            vec3 endPos = instancePos;

            // Start position: far below the screen (positive Y = bottom in this coord system)
            vec3 startPos = vec3(
              instancePos.x + (aRandom - 0.5) * 120.0,  // Spread horizontally
              800.0,                                     // Start FAR below viewport
              instancePos.z + (aRandom - 0.5) * 25.0    // Slight Z variation
            );

            // Sphere particles - stagger similar to swoosh
            float xNormalized = (instancePos.x + 600.0) / 1200.0;
            float yNormalized = (instancePos.y + 200.0) / 400.0;

            // Stagger: X position + Y position + randomness (total max ~0.6)
            float staggerDelay = xNormalized * 0.35 + yNormalized * 0.1 + aRandom * 0.15;

            float adjustedProgress = clamp(
              (streamProgress - staggerDelay) / max(1.0 - staggerDelay, 0.2),
              0.0, 1.0
            );

            // Smooth easing - ease out for gentle landing
            float easedProgress = 1.0 - pow(1.0 - adjustedProgress, 2.0);

            // ========================================
            // RISING TRAJECTORY with slight curve
            // ========================================
            vec3 controlPoint = mix(startPos, endPos, 0.6);
            controlPoint.x += (aRandom - 0.5) * 25.0;
            controlPoint.y = mix(startPos.y, endPos.y, 0.7);

            // Quadratic Bezier for smooth curved path
            vec3 p0 = mix(startPos, controlPoint, easedProgress);
            vec3 p1 = mix(controlPoint, endPos, easedProgress);
            vec3 curvePos = mix(p0, p1, easedProgress);

            // Subtle float/drift during rise
            float driftAmount = (1.0 - easedProgress) * (1.0 - easedProgress);
            curvePos.x += sin(easedProgress * 6.0 + aRandom * 10.0) * 4.0 * driftAmount;
            curvePos.z += cos(easedProgress * 4.0 + aRandom * 8.0) * 2.5 * driftAmount;

            vec3 animPos = curvePos;

            // ========================================
            // POSITION OVERSHOOT (Spring settle)
            // ========================================
            vec3 overshootDir = vec3(0.0, -1.0, 0.0);  // Overshoot upward (negative Y is up)
            float overshootAmount = (positionOvershoot - 1.0) * 12.0;
            if (easedProgress > 0.95) {
              animPos += overshootDir * overshootAmount * smoothstep(0.95, 1.0, easedProgress);
            }

            // ========================================
            // MOUSE SCATTER/DISPERSE EFFECT
            // ========================================
            vDisperse = 0.0;
            if (streamProgress > 0.85) {
              float dist = distance(animPos.xy, mousePos.xy);
              float influence = smoothstep(interactionRadius * 2.5, 0.0, dist);
              vec3 scatterDir = normalize(animPos - mousePos + vec3((aRandom - 0.5) * 0.5, (aRandom - 0.3) * 0.5, aRandom - 0.5));
              float scatterDist = interactionStrength * influence * disperseAmount * (0.5 + aRandom * 0.5);
              float turbulence = sin(time * 3.0 + aRandom * 20.0) * disperseAmount * influence * 2.0;

              animPos += scatterDir * scatterDist;
              animPos.x += turbulence;
              animPos.y += cos(time * 2.5 + aRandom * 15.0) * disperseAmount * influence * 1.5;
              animPos.z += sin(time * 2.0 + aRandom * 12.0) * disperseAmount * influence * 1.0;

              vDisperse = influence * disperseAmount;
            }

            float mixFactor = smoothstep(minY, maxY, instancePos.y);
            vColor = mix(color, colorB, clamp(mixFactor, 0.0, 1.0));

            float distFromShimmer = abs(instancePos.x - shimmerPosX);
            float shimmerWidth = 50.0;
            vShimmer = (1.0 - smoothstep(0.0, shimmerWidth, distFromShimmer)) * shimmerIntensity;

            vec3 localPos = position * uScale;
            vec4 worldPos = instanceMatrix * vec4(localPos, 1.0);
            worldPos.xyz = animPos + (worldPos.xyz - instancePos);

            vWorldPosition = worldPos.xyz;
            vec4 mvPosition = viewMatrix * modelMatrix * worldPos;
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying float vShimmer;
          varying float vDisperse;
          uniform float roughness;
          uniform vec3 shimmerColor;
          uniform float mouseActive;
          uniform vec3 mousePos;
          uniform float interactionRadius;
          uniform float uOpacity;

          void main() {
            vec3 viewDir = normalize(vViewPosition);
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0));
            vec3 halfDir = normalize(lightDir + viewDir);

            float NdotL = max(dot(normal, lightDir), 0.0);
            vec3 diffuse = vColor * NdotL;

            float specPower = mix(100.0, 1.0, roughness);
            float NdotH = max(dot(normal, halfDir), 0.0);
            float specIntensity = pow(NdotH, specPower) * (1.0 - roughness);
            vec3 specular = vec3(1.0) * specIntensity;

            vec3 ambient = vColor * 0.2;
            vec3 baseColor = ambient + diffuse + specular;

            // Apply white shimmer
            vec3 finalColor = mix(baseColor, vec3(1.0), vShimmer * 0.4);

            // Subtle glow on scattered particles
            if (vDisperse > 0.1) {
              finalColor = mix(finalColor, vec3(1.0, 0.9, 0.9), vDisperse * 0.3);
            }

            gl_FragColor = vec4(finalColor, uOpacity);
          }
        `,
        side: THREE.DoubleSide,
      });

      const geometry = new THREE.IcosahedronGeometry(0.5, 1);
      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        positions.length
      );

      const dummy = new THREE.Object3D();
      const aRandom = new Float32Array(positions.length);

      positions.forEach((pos, i) => {
        dummy.position.copy(pos);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
        aRandom[i] = randoms[i];
      });

      instancedMesh.geometry.setAttribute(
        'aRandom',
        new THREE.InstancedBufferAttribute(aRandom, 1)
      );

      // Create a pivot group positioned at the sphere's center so it spins in place like a globe
      const spherePivot = new THREE.Group();

      // Position pivot at the sphere's world position (after centering adjustments)
      // The sphere center in SVG coords, adjusted for the logo centering
      const sphereWorldX = sphereCenter.x - center.x;
      const sphereWorldY = -(sphereCenter.y - center.y); // Flip Y
      const sphereWorldZ = CONFIG.geometry.depth / 2 - center.z;

      spherePivot.position.set(sphereWorldX, sphereWorldY, sphereWorldZ);

      // Position the instanced mesh relative to the pivot (offset so sphere center is at pivot origin)
      instancedMesh.position.set(-sphereCenter.x, sphereCenter.y, -CONFIG.geometry.depth / 2);
      instancedMesh.scale.y = -1;

      // Add mesh to pivot
      spherePivot.add(instancedMesh);

      // Store references
      sphereMeshRef.current = instancedMesh;
      spherePivotRef.current = spherePivot;

      // Sphere now streams in via shader animation - no initial transform needed
      parent.add(spherePivot);
    };

    // Track time since drag ended for smooth transition back to auto-rotation
    const dragEndTime = { current: 0 };

    // Event handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      // Capture current auto-rotation into the target so there's no jump
      targetRotation.current.y = actualRotation.current.y;
      targetRotation.current.x = actualRotation.current.x;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      // Store current rotation as the new base for auto-rotation
      autoRotationOffset.current = actualRotation.current.y;
      // Record when drag ended for smooth transition
      dragEndTime.current = performance.now();
    };

    // Handle mouse move - works both inside container and globally during drag
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Normalize to -1 to 1 for raycaster
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Store normalized coords for raycasting
      mouseRef.current.set(x, y);

      // Track mouse activity only when inside container
      const isInsideContainer =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isInsideContainer) {
        mouseActiveRef.current = true;
        if (mouseTimeoutRef.current) {
          clearTimeout(mouseTimeoutRef.current);
        }
        mouseTimeoutRef.current = window.setTimeout(() => {
          mouseActiveRef.current = false;
        }, 1500);
      }
    };

    // Handle drag movement globally so it works even outside the container
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMouseRef.current.x;
        const deltaY = e.clientY - previousMouseRef.current.y;

        // Smoother drag with higher sensitivity
        targetRotation.current.y += deltaX * 0.008;
        targetRotation.current.x += deltaY * 0.006;

        // X rotation limits - allow tilting but not extreme angles
        targetRotation.current.x = Math.max(
          -Math.PI / 4,  // ~45° down
          Math.min(Math.PI / 4, targetRotation.current.x)  // ~45° up
        );

        previousMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseLeave = () => {
      mouseActiveRef.current = false;
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    // Listen on window for mouseup and mousemove to handle dragging outside container
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    // Shimmer sweep state - extended range to cover sphere (which is at ~480 on X axis)
    const shimmerSweep = {
      posX: -700,
      startX: -700,
      endX: 700,  // Extended to ensure shimmer covers entire logo including sphere
      progress: 0,
      speed: CONFIG.shimmer.speed,
      intensity: 0,
      delay: 0,
    };

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      if (groupRef.current) {
        if (isDraggingRef.current) {
          // When dragging, smoothly follow target rotation
          actualRotation.current.x +=
            (targetRotation.current.x - actualRotation.current.x) * 0.15;
          actualRotation.current.y +=
            (targetRotation.current.y - actualRotation.current.y) * 0.15;
        } else {
          // Calculate time since drag ended for smooth transition
          const timeSinceDrag = performance.now() - dragEndTime.current;
          const transitionDuration = 1500; // 1.5 seconds to fully transition back
          const transitionProgress = Math.min(timeSinceDrag / transitionDuration, 1);

          // Ease the transition
          const easedTransition = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);

          // Target auto-rotation values - slow and subtle
          const autoRotateY = autoRotationOffset.current + time * 0.02;  // Slowed from 0.08 to 0.02
          const autoRotateX = Math.sin(time * 0.1) * 0.015;  // Slower, subtler wobble

          // Blend between current position and auto-rotation based on transition progress
          const blendFactor = 0.02 + easedTransition * 0.03; // Starts slow, speeds up

          actualRotation.current.y += (autoRotateY - actualRotation.current.y) * blendFactor;
          actualRotation.current.x += (autoRotateX - actualRotation.current.x) * blendFactor;
        }

        groupRef.current.rotation.x = actualRotation.current.x;
        groupRef.current.rotation.y = actualRotation.current.y;
      }

      // Update shimmer sweep
      if (shimmerSweep.delay > 0) {
        shimmerSweep.delay -= 0.016;
      } else {
        shimmerSweep.progress += 0.016 * shimmerSweep.speed;
        shimmerSweep.posX =
          shimmerSweep.startX +
          (shimmerSweep.endX - shimmerSweep.startX) * shimmerSweep.progress;

        if (shimmerSweep.progress < 0.1) {
          shimmerSweep.intensity = shimmerSweep.progress / 0.1;
        } else if (shimmerSweep.progress > 0.9) {
          shimmerSweep.intensity = (1 - shimmerSweep.progress) / 0.1;
        } else {
          shimmerSweep.intensity = 1;
        }

        if (shimmerSweep.progress >= 1) {
          shimmerSweep.progress = 0;
          shimmerSweep.posX = shimmerSweep.startX;
          shimmerSweep.intensity = 0;
          shimmerSweep.delay =
            CONFIG.shimmer.delay.min +
            Math.random() * (CONFIG.shimmer.delay.max - CONFIG.shimmer.delay.min);
        }
      }

      // Animate disperse amount based on mouse activity
      // Scatter quickly when mouse is active, reform slowly when mouse leaves
      if (mouseActiveRef.current && !isDraggingRef.current) {
        // Scatter - fast
        disperseAmount.current += (1.0 - disperseAmount.current) * CONFIG.interaction.disperseSpeed;
      } else {
        // Reform - slow and smooth
        disperseAmount.current += (0.0 - disperseAmount.current) * CONFIG.interaction.reformSpeed;
      }
      // Clamp to valid range
      disperseAmount.current = Math.max(0, Math.min(1, disperseAmount.current));

      // Calculate mouse position in particle's local coordinate space
      // The particles exist in a space where the logo is ~1137 wide
      // After mesh positioning, the logo is centered around (0, 0)
      if (cameraRef.current && groupRef.current) {
        // Calculate visible range at z=0 based on camera
        const cam = cameraRef.current;
        const fovRad = cam.fov * Math.PI / 180;
        const visibleHeight = 2 * Math.tan(fovRad / 2) * cam.position.z;
        const visibleWidth = visibleHeight * cam.aspect;

        // Convert mouse NDC to world coords at z=0 plane
        const worldX = mouseRef.current.x * (visibleWidth / 2);
        const worldY = mouseRef.current.y * (visibleHeight / 2);

        // Apply inverse of group rotation first
        const tempVec = new THREE.Vector3(worldX, worldY, 0);
        const inverseQuat = new THREE.Quaternion();
        groupRef.current.getWorldQuaternion(inverseQuat);
        inverseQuat.invert();
        tempVec.applyQuaternion(inverseQuat);

        // Convert world coords to mesh-local coords by dividing by group scale
        const scale = scaleRef.current;
        let localX = tempVec.x / scale;
        let localY = tempVec.y / scale;

        // The instancedMesh for swoosh has:
        // - position: (-center.x, center.y, -center.z) where center is ~(568.5, 139, 25)
        // - scale.y: -1 (flipped)
        // The particles in the shader use instancePos which is in mesh-local space
        // The mesh transforms particles from local to world via: worldPos = meshPosition + localPos * meshScale
        // So to go from world back to local: localPos = (worldPos - meshPosition) / meshScale
        // But our coords are already in group space, so we need to account for mesh offset

        // The swoosh mesh position is (-568.5, 139, -25) in group space
        // Particles are sampled from geometry and stored as-is, then the mesh transforms them
        // In the shader, instancePos is the original sampled position
        // After mesh transform: finalPos = meshPos + instancePos * meshScale

        // Since mesh scale.y = -1, if instancePos.y = 100, finalPos.y = 139 + 100*(-1) = 39
        // So a particle at SVG y=100 ends up at group y=39

        // We have mouse in group space (localX, localY)
        // We need mouse in mesh-local space to match instancePos
        // meshLocalX = (groupX - meshPosX) / meshScaleX = (groupX - (-568.5)) / 1 = groupX + 568.5
        // meshLocalY = (groupY - meshPosY) / meshScaleY = (groupY - 139) / (-1) = -(groupY - 139) = 139 - groupY

        // The mesh position uses center values: position.set(-center.x, center.y, -center.z)
        // center is approximately (568.5, 139, 25) for a 1137x278 SVG
        const centerX = 568.5;
        const centerY = 139;

        // Convert from group space to mesh-local space
        const meshLocalX = localX + centerX;  // Because meshPos.x = -centerX
        const meshLocalY = centerY - localY;  // Because meshPos.y = centerY and scale.y = -1

        mouseWorldRef.current.set(meshLocalX, meshLocalY, 0);
      }

      // Update shader uniforms for main mesh
      if (instancedMeshRef.current) {
        const material = instancedMeshRef.current
          .material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.time.value = time;
          material.uniforms.mousePos.value.set(
            mouseWorldRef.current.x,
            mouseWorldRef.current.y,
            mouseWorldRef.current.z
          );
          material.uniforms.mouseActive.value = mouseActiveRef.current
            ? 1.0
            : 0.0;
          material.uniforms.disperseAmount.value = disperseAmount.current;
          // Only update shimmer from sweep after entrance animation is complete
          if (animationState.current.entranceComplete) {
            material.uniforms.shimmerPosX.value = shimmerSweep.posX;
            // Boosted shimmer intensity (1.8x) to pop against faded particles
            material.uniforms.shimmerIntensity.value = shimmerSweep.intensity * 1.8;
          }
        }
      }

      // Update and rotate sphere (spins in place like a globe)
      if (spherePivotRef.current && sphereMeshRef.current) {
        // Only rotate after entrance animation is complete to avoid interference
        if (animationState.current.entranceComplete) {
          // Slow continuous rotation around the pivot's Y axis (globe-like spin)
          spherePivotRef.current.rotation.y = time * 0.15;
          // Very subtle tilt
          spherePivotRef.current.rotation.z = Math.sin(time * 0.08) * 0.03;
        }

        const material = sphereMeshRef.current.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.time.value = time;

          // For sphere, we need mouse in the same coordinate space as sphere particles
          // Sphere setup:
          // - sphereCenter = {x: 1055, y: 197} from SVG
          // - Pivot at (486.5, -58, 0) in group space
          // - Mesh at (-1055, 197, -25) within pivot
          // - Mesh scale.y = -1

          // The mouse is currently in swoosh mesh-local space
          // We need to convert it to sphere mesh-local space

          // Since the sphere particles are at SVG coords around (1055, 197),
          // and swoosh particles are at SVG coords around (0-800, 0-278),
          // they're in the same SVG coordinate space, just different positions

          // The mouseWorldRef is already in SVG space (after swoosh transform)
          // So for sphere, we can use the same coordinates directly

          const sphereLocalMouse = new THREE.Vector3(
            mouseWorldRef.current.x,
            mouseWorldRef.current.y,
            0
          );

          // Apply inverse of sphere's local rotation (the globe spin)
          // This rotates the mouse position into the sphere's rotated frame
          const sphereQuat = new THREE.Quaternion();
          sphereQuat.setFromEuler(spherePivotRef.current.rotation);
          sphereQuat.invert();

          // Transform mouse relative to sphere center before rotation
          // Sphere center in SVG coords is (1055, 197)
          sphereLocalMouse.x -= 1055;
          sphereLocalMouse.y -= 197;
          sphereLocalMouse.applyQuaternion(sphereQuat);
          sphereLocalMouse.x += 1055;
          sphereLocalMouse.y += 197;

          material.uniforms.mousePos.value.copy(sphereLocalMouse);
          material.uniforms.mouseActive.value = mouseActiveRef.current
            ? 1.0
            : 0.0;
          material.uniforms.disperseAmount.value = disperseAmount.current;
          // Only update shimmer from sweep after entrance animation is complete
          if (animationState.current.entranceComplete) {
            material.uniforms.shimmerPosX.value = shimmerSweep.posX;
            // Boosted shimmer intensity (1.8x) to pop against faded particles
            material.uniforms.shimmerIntensity.value = shimmerSweep.intensity * 1.8;
          }
        }
      }

      renderer.render(scene, camera);
    };

    loadGeometry();
    animate();

    // Resize handler - recalculate responsive values
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;

      const newIsMobile = w < 768;
      const newIsSmallScreen = w < 1200;

      camera.fov = newIsMobile ? 55 : newIsSmallScreen ? 50 : 45;
      camera.position.z = newIsMobile ? 90 : newIsSmallScreen ? 75 : 70;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('resize', handleResize);

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
