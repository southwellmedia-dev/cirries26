import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import gsap from "gsap";

interface Props {
  className?: string;
  disableInteraction?: boolean;
  onAnimationComplete?: () => void;
  particleCount?: number;
}

// Constants
const DEG_TO_RAD = Math.PI / 180;
const CENTER_X = 568.5;
const CENTER_Y = 139;
const SPHERE_CENTER = { x: 1055, y: 197 };
const SPHERE_RADIUS = 82;
const LOGO_WIDTH = 1137;
const LOGO_HEIGHT = 278;

// Configuration
const CONFIG = {
  particles: {
    count: 15000,
    scale: { x: 1.5, y: 1.5, z: 1.5 },
    scatter: 1.5,
    color: "#F2f2f2",
    secondaryColor: "#8f8f8f",
    roughness: 0.2,
  },
  geometry: {
    depth: 50,
    bevelThickness: 3,
    bevelSize: 0.9,
    curveSegments: 20,
  },
  interaction: {
    radius: 50, // Smaller, more targeted area
    strength: 60, // Stronger push in that area
    disperseSpeed: 0.1,
    reformSpeed: 0.035,
  },
  shimmer: {
    color: "#E7001A",
    delay: { min: 4.0, max: 7.0 },
    speed: 0.25,
  },
  autoRotation: {
    maxAngle: Math.PI / 18, // 10 degrees in each direction
    speed: 0.05, // Slow, subtle oscillation
  },
  postProcessing: {
    bloom: {
      strength: 0.6,
      radius: 0.4,
      threshold: 0.85,
    },
    chromatic: {
      strength: 0, // Disabled
    },
    vignette: {
      strength: 0.3,
    },
    grain: {
      strength: 0.06,
    },
  },
};

const SVG_CONTENT = `<svg width="1137" height="278" viewBox="0 0 1137 278" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 181.114C12.7794 174.834 25.4132 168.266 38.3381 162.345C107.594 130.63 180.075 108.432 254.254 91.3644C322.467 75.6869 391.529 65.1393 461.221 58.595C511.296 53.8966 561.468 50.6364 611.785 50.8282C657.762 50.996 703.714 52.3145 749.691 53.1055C752.285 53.1535 754.88 53.1055 757.572 52.0268C743.192 49.8214 728.836 47.4482 714.432 45.4585C651.724 36.8527 588.7 33.9281 525.458 35.1507C471.939 36.1815 418.518 39.2738 365.461 46.2976C317.447 52.6501 269.628 60.3929 221.711 67.5125C221.566 67.5125 221.396 67.3927 220.45 66.9851C234.49 63.3175 247.852 59.6977 261.286 56.2938C336.022 37.3801 411.607 22.6854 488.138 13.0248C540.686 6.38464 593.452 2.1896 646.437 0.655406C702.477 -0.974671 758.42 0.367745 814.242 5.44975C898.023 13.0728 980.374 27.7914 1060.06 55.2869C1069.68 58.595 1079.12 62.4065 1088.62 66.0263C1089.28 66.266 1089.84 66.7454 1090.05 66.8893C1032.8 54.8555 983.138 67.8481 944.8 113.49C915.628 148.225 902.243 201.035 931.778 261.995C930.517 261.276 929.838 261.012 929.281 260.581C871.034 215.754 805.634 184.423 736.087 161.05C672.141 139.548 606.402 126.363 539.28 119.531C464.083 111.884 388.91 112.483 313.689 119.459C208.956 129.168 106.697 150.958 6.13507 181.019C4.29212 181.57 2.40068 182.025 0.533484 182.505C0.363739 182.025 0.193994 181.57 0 181.091L0 181.114Z" fill="white"/>
<path d="M1055.33 115.112C1092.58 114.489 1137.41 144.885 1137 197.431C1136.64 242.594 1100.26 278 1053.63 278C1008.26 278 972.178 241.419 972.178 195.465C972.178 151.022 1009.25 115.184 1055.33 115.112Z" fill="white"/>
</svg>`;

// Shared particle vertex shader
const PARTICLE_VERTEX_SHADER = `
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
  varying float vRandom;

  // Simplex 3D Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec4 instanceMatrixCol3 = instanceMatrix[3];
    vec3 instancePos = instanceMatrixCol3.xyz;

    vec3 endPos = instancePos;
    vec3 startPos = vec3(
      instancePos.x + (aRandom - 0.5) * 150.0,
      800.0,
      instancePos.z + (aRandom - 0.5) * 30.0
    );

    float xNormalized = (instancePos.x + 600.0) / 1200.0;
    float yNormalized = (instancePos.y + 200.0) / 400.0;
    float staggerDelay = xNormalized * 0.35 + yNormalized * 0.1 + aRandom * 0.15;

    float adjustedProgress = clamp(
      (streamProgress - staggerDelay) / max(1.0 - staggerDelay, 0.2),
      0.0, 1.0
    );

    float easedProgress = 1.0 - pow(1.0 - adjustedProgress, 2.0);

    vec3 controlPoint = mix(startPos, endPos, 0.6);
    controlPoint.x += (aRandom - 0.5) * 30.0;
    controlPoint.y = mix(startPos.y, endPos.y, 0.7);

    vec3 p0 = mix(startPos, controlPoint, easedProgress);
    vec3 p1 = mix(controlPoint, endPos, easedProgress);
    vec3 curvePos = mix(p0, p1, easedProgress);

    float driftAmount = (1.0 - easedProgress) * (1.0 - easedProgress);
    curvePos.x += sin(easedProgress * 6.0 + aRandom * 10.0) * 5.0 * driftAmount;
    curvePos.z += cos(easedProgress * 4.0 + aRandom * 8.0) * 3.0 * driftAmount;

    vec3 animPos = curvePos;

    vec3 overshootDir = vec3(0.0, -1.0, 0.0);
    float overshootAmount = (positionOvershoot - 1.0) * 12.0;
    if (easedProgress > 0.95) {
      animPos += overshootDir * overshootAmount * smoothstep(0.95, 1.0, easedProgress);
    }

    vec3 prevPos = mix(startPos, endPos, max(easedProgress - 0.08, 0.0));
    vTrail = length(animPos - prevPos) * 0.05 * (1.0 - easedProgress);

    vDisperse = 0.0;
    if (streamProgress > 0.85) {
      float dist = distance(animPos.xy, mousePos.xy);

      // Layered influence - sharp close, gradual far
      float innerRadius = interactionRadius;
      float outerRadius = interactionRadius * 3.0;

      float innerInfluence = 1.0 - smoothstep(0.0, innerRadius, dist);
      float outerInfluence = 1.0 - smoothstep(innerRadius, outerRadius, dist);

      vec3 toMouse = normalize(mousePos - animPos + vec3(0.001));
      vec3 awayFromMouse = -toMouse;

      // Inner zone: strong repulsion
      // Outer zone: slight attraction (magnetic feel)
      vec3 force = mix(
        toMouse * 0.2,           // Outer: slight pull
        awayFromMouse * 1.0,     // Inner: strong push
        innerInfluence
      );

      // Add spiral motion for particles being pushed
      float angle = atan(animPos.y - mousePos.y, animPos.x - mousePos.x);
      vec3 tangent = vec3(-sin(angle), cos(angle), 0.0);
      force += tangent * innerInfluence * 0.3 * sin(time * 5.0 + aRandom * 10.0);

      // Add turbulence
      float turbulence = sin(time * 3.0 + aRandom * 20.0) * 2.0;
      force.x += turbulence * innerInfluence * 0.5;
      force.y += cos(time * 2.5 + aRandom * 15.0) * innerInfluence * 0.4;
      force.z += sin(time * 2.0 + aRandom * 12.0) * innerInfluence * 0.3;

      animPos += force * interactionStrength * disperseAmount * outerInfluence * (0.5 + aRandom * 0.5);

      vDisperse = outerInfluence * disperseAmount;
    }

    // Organic floating movement using layered noise (only when entrance is complete)
    if (streamProgress > 0.95) {
      float noiseScale = 0.008;
      float noiseSpeed = 0.3;
      vec3 noisePos = instancePos * noiseScale + time * noiseSpeed;

      vec3 organicOffset = vec3(
        snoise(noisePos) * 2.5,
        snoise(noisePos + vec3(100.0)) * 1.5,
        snoise(noisePos + vec3(200.0)) * 1.5
      );

      // Reduce organic movement when particles are being dispersed
      animPos += organicOffset * (1.0 - vDisperse * 0.5);
    }

    float mixFactor = smoothstep(minY, maxY, instancePos.y);
    vColor = mix(color, colorB, clamp(mixFactor, 0.0, 1.0));
    vRandom = aRandom;

    float distFromShimmer = abs(instancePos.x - shimmerPosX);
    float shimmerWidth = 50.0;
    vShimmer = (1.0 - smoothstep(0.0, shimmerWidth, distFromShimmer)) * shimmerIntensity;

    // Calculate preliminary world position for depth
    vec4 tempWorldPos = instanceMatrix * vec4(position, 1.0);
    tempWorldPos.xyz = animPos + (tempWorldPos.xyz - instancePos);
    vec4 tempMvPos = viewMatrix * modelMatrix * tempWorldPos;
    float depth = -tempMvPos.z;

    // Depth-based particle sizing (closer = slightly larger)
    float depthFactor = clamp(depth / 120.0, 0.0, 1.0);
    float depthScale = 1.0 + (1.0 - depthFactor) * 0.3;

    vec3 localPos = position * uScale * depthScale;
    vec4 worldPos = instanceMatrix * vec4(localPos, 1.0);
    worldPos.xyz = animPos + (worldPos.xyz - instancePos);

    vWorldPosition = worldPos.xyz;
    vec4 mvPosition = viewMatrix * modelMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Shared particle fragment shader
const PARTICLE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying float vShimmer;
  varying float vDisperse;
  varying float vRandom;
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

    vec3 finalColor = mix(baseColor, vec3(1.0), vShimmer * 0.4);

    if (vDisperse > 0.1) {
      finalColor = mix(finalColor, vec3(1.0, 0.9, 0.9), vDisperse * 0.3);
    }

    // Vary opacity per particle - range from 0.3 to 1.0 of base opacity
    float particleOpacity = uOpacity * (0.3 + vRandom * 0.7);

    gl_FragColor = vec4(finalColor, particleOpacity);
  }
`;

// Film effect shader (chromatic aberration + vignette + film grain)
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    chromaticStrength: { value: CONFIG.postProcessing.chromatic.strength },
    grainStrength: { value: CONFIG.postProcessing.grain.strength },
    vignetteStrength: { value: CONFIG.postProcessing.vignette.strength },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float chromaticStrength;
    uniform float grainStrength;
    uniform float vignetteStrength;
    varying vec2 vUv;

    // Film grain noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = length(center);

      // Sample pixel
      vec4 col = texture2D(tDiffuse, uv);

      // Vignette
      float vignette = 1.0 - dist * vignetteStrength;
      col.rgb *= vignette;

      // Film grain - only on visible content
      if (col.a > 0.01) {
        float grain = hash(uv * time * 0.01) * grainStrength;
        col.rgb += grain - grainStrength * 0.5;
      }

      gl_FragColor = col;
    }
  `,
};

// Create shader material with shared uniforms (moved to module scope)
const createParticleMaterial = (
  bounds: THREE.Box3,
  size: THREE.Vector3
): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
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
      disperseAmount: { value: 0.0 },
      interactionRadius: { value: CONFIG.interaction.radius },
      interactionStrength: { value: CONFIG.interaction.strength },
      minY: { value: bounds.min.y },
      maxY: { value: bounds.max.y },
      maxRadius: { value: Math.max(size.x, size.y) / 2 },
      shimmerPosX: { value: -600.0 },
      shimmerIntensity: { value: 0.0 },
      shimmerColor: { value: new THREE.Color(CONFIG.shimmer.color) },
      streamProgress: { value: 0.0 },
      uOpacity: { value: 0.0 },
      positionOvershoot: { value: 1.0 },
    },
    transparent: true,
    vertexShader: PARTICLE_VERTEX_SHADER,
    fragmentShader: PARTICLE_FRAGMENT_SHADER,
    side: THREE.DoubleSide,
  });
};

export default function LogoMeshNetwork({
  className = "",
  disableInteraction = false,
  onAnimationComplete,
  particleCount = CONFIG.particles.count,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameRef = useRef<number>(0);
  const groupRef = useRef<THREE.Group | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const sphereMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const spherePivotRef = useRef<THREE.Group | null>(null);

  // Post-processing refs
  const composerRef = useRef<EffectComposer | null>(null);
  const filmPassRef = useRef<ShaderPass | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const mouseWorldRef = useRef(new THREE.Vector3(0, 0, 0));
  const mouseActiveRef = useRef(false);
  const mouseTimeoutRef = useRef<number | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const actualRotation = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationBaseRef = useRef({ x: 0, y: 0 }); // Base position to oscillate from
  const disperseAmount = useRef(0);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const scaleRef = useRef(1);

  // Preallocated objects for animation loop (avoid GC pressure)
  const tempVec = useRef(new THREE.Vector3());
  const tempQuat = useRef(new THREE.Quaternion());
  const sphereLocalMouse = useRef(new THREE.Vector3());

  // Reduced motion preference
  const prefersReducedMotion = useRef(false);

  // Animation state
  const animationState = useRef({
    streamProgress: 0,
    particleOpacity: 0,
    positionOvershoot: 1.0,
    connectionPulse: 0,
    idleFloat: 0,
    entranceComplete: false,
  });

  // Shimmer sweep state
  const shimmerSweepRef = useRef({
    posX: -700,
    startX: -700,
    endX: 700,
    progress: 0,
    speed: CONFIG.shimmer.speed,
    intensity: 0,
    delay: 0,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Check for reduced motion preference
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const isMobile = width < 768;
    const isSmallScreen = width < 1200;
    const baseFov = isMobile ? 55 : isSmallScreen ? 50 : 45;
    const baseZ = isMobile ? 90 : isSmallScreen ? 75 : 70;

    const camera = new THREE.PerspectiveCamera(
      baseFov,
      width / height,
      0.1,
      1000
    );
    camera.position.z = baseZ;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Bloom pass - makes bright particles glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      CONFIG.postProcessing.bloom.strength,
      CONFIG.postProcessing.bloom.radius,
      CONFIG.postProcessing.bloom.threshold
    );
    composer.addPass(bloomPass);
    bloomPassRef.current = bloomPass;

    // Film effects pass (chromatic aberration + vignette + grain)
    const filmPass = new ShaderPass(FilmShader);
    composer.addPass(filmPass);
    filmPassRef.current = filmPass;
    composerRef.current = composer;

    // Handle WebGL context loss
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frameRef.current);
    };

    const handleContextRestored = () => {
      animate();
    };

    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored
    );

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // Load and process SVG geometry
    const loadGeometry = () => {
      const loader = new SVGLoader();
      const data = loader.parse(SVG_CONTENT);
      const paths = data.paths;
      const geometries: THREE.BufferGeometry[] = [];
      const totalBounds = new THREE.Box3();

      const circleCenter = SPHERE_CENTER;
      const circleRadius = SPHERE_RADIUS;

      paths.forEach((path, pathIndex) => {
        const shapes = SVGLoader.createShapes(path);

        if (pathIndex === 1) {
          const sphereGeo = new THREE.SphereGeometry(circleRadius, 32, 32);
          sphereGeo.translate(
            circleCenter.x,
            circleCenter.y,
            CONFIG.geometry.depth / 2
          );
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

      const contentGroup = new THREE.Group();

      const sphereGeo = geometries.length > 1 ? geometries[1] : null;
      const swooshGeos = geometries.filter((_, i) => i !== 1);

      generateParticles(swooshGeos, contentGroup, center, totalBounds);

      if (sphereGeo) {
        generateSphereParticles(
          sphereGeo,
          contentGroup,
          center,
          totalBounds,
          circleCenter
        );
      }

      const maxDim = Math.max(size.x, size.y);
      if (maxDim > 0) {
        // Scale based on viewport width to always fill container
        // Calculate visible width at z=0 based on camera FOV and position
        const fovRad = baseFov * DEG_TO_RAD;
        const visibleHeight = 2 * Math.tan(fovRad / 2) * baseZ;
        const visibleWidth = visibleHeight * (width / height);

        // Logo should fill ~85% of visible width on all screen sizes
        const targetWidth = visibleWidth * 0.85;
        const scale = targetWidth / LOGO_WIDTH;

        group.scale.set(scale, scale, scale);
        scaleRef.current = scale;
      }

      group.add(contentGroup);

      setIsLoaded(true);

      // Helper to update shader uniforms on both meshes
      const updateShaderUniform = (
        uniform: string,
        value: number,
        transform?: (v: number) => number
      ) => {
        const finalValue = transform ? transform(value) : value;
        [instancedMeshRef.current, sphereMeshRef.current].forEach((mesh) => {
          if (mesh) {
            const mat = mesh.material as THREE.ShaderMaterial;
            if (mat.uniforms?.[uniform]) {
              mat.uniforms[uniform].value = finalValue;
            }
          }
        });
      };

      // GSAP Animation Timeline
      const tl = gsap.timeline({
        delay: 0,
        onComplete: () => {
          animationState.current.entranceComplete = true;
        },
      });

      // Phase 1: Stream in
      tl.to(
        animationState.current,
        {
          streamProgress: 1.0,
          particleOpacity: 1.0,
          duration: prefersReducedMotion.current ? 0.3 : 1.8,
          ease: "power2.out",
          onUpdate: () => {
            updateShaderUniform(
              "streamProgress",
              animationState.current.streamProgress
            );
            updateShaderUniform(
              "uOpacity",
              animationState.current.particleOpacity
            );
          },
          onComplete: () => {
            onAnimationComplete?.();
            window.dispatchEvent(new CustomEvent("logoAnimationComplete"));
          },
        },
        0
      );

      // Phase 1b: Fade back
      tl.to(
        animationState.current,
        {
          particleOpacity: 0.55,
          duration: 0.6,
          ease: "power2.inOut",
          onUpdate: () => {
            updateShaderUniform(
              "uOpacity",
              animationState.current.particleOpacity
            );
          },
        },
        1.6
      );

      // Phase 2: Crystallization
      if (!prefersReducedMotion.current) {
        tl.to(
          animationState.current,
          {
            positionOvershoot: 1.04,
            duration: 0.15,
            ease: "power2.out",
            onUpdate: () => {
              updateShaderUniform(
                "positionOvershoot",
                animationState.current.positionOvershoot
              );
            },
          },
          1.8
        );

        tl.to(
          animationState.current,
          {
            positionOvershoot: 1.0,
            duration: 0.3,
            ease: "back.out(2)",
            onUpdate: () => {
              updateShaderUniform(
                "positionOvershoot",
                animationState.current.positionOvershoot
              );
            },
          },
          2.0
        );

        tl.to(
          animationState.current,
          {
            connectionPulse: 1.0,
            duration: 0.2,
            ease: "power2.in",
            onUpdate: () => {
              updateShaderUniform(
                "shimmerIntensity",
                animationState.current.connectionPulse,
                (v) => v * 0.7
              );
            },
          },
          2.2
        );

        tl.to(
          animationState.current,
          {
            connectionPulse: 0,
            duration: 0.4,
            ease: "power2.out",
            onUpdate: () => {
              updateShaderUniform(
                "shimmerIntensity",
                animationState.current.connectionPulse,
                (v) => v * 0.7
              );
            },
          },
          2.4
        );
      }

      tl.to(
        animationState.current,
        {
          idleFloat: 1.0,
          duration: 0.2,
          ease: "sine.inOut",
        },
        2.6
      );
    };

    // Generate swoosh particles
    const generateParticles = (
      geometries: THREE.BufferGeometry[],
      parent: THREE.Group,
      center: THREE.Vector3,
      bounds: THREE.Box3
    ) => {
      const positions: THREE.Vector3[] = [];
      const randoms: number[] = [];
      const size = new THREE.Vector3();
      bounds.getSize(size);

      geometries.forEach((geo) => {
        const tempMesh = new THREE.Mesh(geo);
        const sampler = new MeshSurfaceSampler(tempMesh).build();
        const tempPos = new THREE.Vector3();
        const tempNormal = new THREE.Vector3();

        const samples = Math.floor(particleCount / geometries.length);

        for (let i = 0; i < samples; i++) {
          sampler.sample(tempPos, tempNormal);

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

      const material = createParticleMaterial(bounds, size);
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
        "aRandom",
        new THREE.InstancedBufferAttribute(aRandom, 1)
      );
      instancedMesh.position.set(-center.x, center.y, -center.z);
      instancedMesh.scale.y = -1;

      instancedMeshRef.current = instancedMesh;
      parent.add(instancedMesh);
    };

    // Generate sphere particles
    const generateSphereParticles = (
      sphereGeo: THREE.BufferGeometry,
      parent: THREE.Group,
      center: THREE.Vector3,
      bounds: THREE.Box3,
      sphereCenter: { x: number; y: number }
    ) => {
      const positions: THREE.Vector3[] = [];
      const randoms: number[] = [];
      const size = new THREE.Vector3();
      bounds.getSize(size);

      const tempMesh = new THREE.Mesh(sphereGeo);
      const sampler = new MeshSurfaceSampler(tempMesh).build();
      const tempPos = new THREE.Vector3();
      const tempNormal = new THREE.Vector3();

      const samples = Math.floor(particleCount / 3);

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

      const material = createParticleMaterial(bounds, size);
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
        "aRandom",
        new THREE.InstancedBufferAttribute(aRandom, 1)
      );

      const spherePivot = new THREE.Group();
      const sphereWorldX = sphereCenter.x - center.x;
      const sphereWorldY = -(sphereCenter.y - center.y);
      const sphereWorldZ = CONFIG.geometry.depth / 2 - center.z;

      spherePivot.position.set(sphereWorldX, sphereWorldY, sphereWorldZ);
      instancedMesh.position.set(
        -sphereCenter.x,
        sphereCenter.y,
        -CONFIG.geometry.depth / 2
      );
      instancedMesh.scale.y = -1;

      spherePivot.add(instancedMesh);

      sphereMeshRef.current = instancedMesh;
      spherePivotRef.current = spherePivot;
      parent.add(spherePivot);
    };

    // Shared drag logic
    const handleDragStart = (clientX: number, clientY: number) => {
      if (disableInteraction) return;
      isDraggingRef.current = true;
      previousMouseRef.current = { x: clientX, y: clientY };
      targetRotation.current.y = actualRotation.current.y;
      targetRotation.current.x = actualRotation.current.x;
    };

    const handleDragMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;

      const deltaX = clientX - previousMouseRef.current.x;
      const deltaY = clientY - previousMouseRef.current.y;

      targetRotation.current.y += deltaX * 0.008;
      targetRotation.current.x = Math.max(
        -Math.PI / 4,
        Math.min(Math.PI / 4, targetRotation.current.x + deltaY * 0.006)
      );

      previousMouseRef.current = { x: clientX, y: clientY };
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      rotationBaseRef.current.x = actualRotation.current.x;
      rotationBaseRef.current.y = actualRotation.current.y;
    };

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) =>
      handleDragStart(e.clientX, e.clientY);
    const handleMouseUp = handleDragEnd;
    const handleGlobalMouseMove = (e: MouseEvent) =>
      handleDragMove(e.clientX, e.clientY);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouseRef.current.set(x, y);

      const isInsideContainer =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (
        isInsideContainer &&
        !prefersReducedMotion.current &&
        !disableInteraction
      ) {
        mouseActiveRef.current = true;
        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = window.setTimeout(() => {
          mouseActiveRef.current = false;
        }, 1500);
      }
    };

    const handleMouseLeave = () => {
      mouseActiveRef.current = false;
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
    };

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = handleDragEnd;

    // Add event listeners with passive where possible
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleGlobalMouseMove, {
      passive: true,
    });

    // Update shimmer speed based on reduced motion preference
    shimmerSweepRef.current.speed = prefersReducedMotion.current
      ? 0
      : CONFIG.shimmer.speed;

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      if (groupRef.current) {
        if (isDraggingRef.current) {
          // When dragging, smoothly follow target rotation (user can drag anywhere)
          actualRotation.current.x +=
            (targetRotation.current.x - actualRotation.current.x) * 0.15;
          actualRotation.current.y +=
            (targetRotation.current.y - actualRotation.current.y) * 0.15;
        } else {
          // Gentle oscillation from wherever user left it
          const oscillationY =
            Math.sin(time * CONFIG.autoRotation.speed) *
            CONFIG.autoRotation.maxAngle;
          const oscillationX = Math.sin(time * 0.1) * 0.015; // Subtle vertical wobble

          const targetY = rotationBaseRef.current.y + oscillationY;
          const targetX = rotationBaseRef.current.x + oscillationX;

          actualRotation.current.y +=
            (targetY - actualRotation.current.y) * 0.02;
          actualRotation.current.x +=
            (targetX - actualRotation.current.x) * 0.02;
        }

        groupRef.current.rotation.x = actualRotation.current.x;
        groupRef.current.rotation.y = actualRotation.current.y;
      }

      // Update shimmer sweep
      if (!prefersReducedMotion.current) {
        const shimmer = shimmerSweepRef.current;
        if (shimmer.delay > 0) {
          shimmer.delay -= 0.016;
        } else {
          shimmer.progress += 0.016 * shimmer.speed;
          shimmer.posX =
            shimmer.startX + (shimmer.endX - shimmer.startX) * shimmer.progress;

          if (shimmer.progress < 0.1) {
            shimmer.intensity = shimmer.progress / 0.1;
          } else if (shimmer.progress > 0.9) {
            shimmer.intensity = (1 - shimmer.progress) / 0.1;
          } else {
            shimmer.intensity = 1;
          }

          if (shimmer.progress >= 1) {
            shimmer.progress = 0;
            shimmer.posX = shimmer.startX;
            shimmer.intensity = 0;
            shimmer.delay =
              CONFIG.shimmer.delay.min +
              Math.random() *
                (CONFIG.shimmer.delay.max - CONFIG.shimmer.delay.min);
          }
        }
      }

      // Animate disperse (skip if reduced motion)
      if (!prefersReducedMotion.current) {
        if (mouseActiveRef.current && !isDraggingRef.current) {
          disperseAmount.current +=
            (1.0 - disperseAmount.current) * CONFIG.interaction.disperseSpeed;
        } else {
          disperseAmount.current +=
            (0.0 - disperseAmount.current) * CONFIG.interaction.reformSpeed;
        }
        disperseAmount.current = Math.max(
          0,
          Math.min(1, disperseAmount.current)
        );
      }

      // Calculate mouse position using preallocated objects
      if (cameraRef.current && groupRef.current) {
        const cam = cameraRef.current;
        const fovRad = cam.fov * DEG_TO_RAD;
        const visibleHeight = 2 * Math.tan(fovRad / 2) * cam.position.z;
        const visibleWidth = visibleHeight * cam.aspect;

        const worldX = mouseRef.current.x * (visibleWidth / 2);
        const worldY = mouseRef.current.y * (visibleHeight / 2);

        tempVec.current.set(worldX, worldY, 0);
        groupRef.current.getWorldQuaternion(tempQuat.current);
        tempQuat.current.invert();
        tempVec.current.applyQuaternion(tempQuat.current);

        const scale = scaleRef.current;
        const localX = tempVec.current.x / scale;
        const localY = tempVec.current.y / scale;

        const meshLocalX = localX + CENTER_X;
        const meshLocalY = CENTER_Y - localY;

        mouseWorldRef.current.set(meshLocalX, meshLocalY, 0);
      }

      // Update swoosh shader uniforms
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
          if (animationState.current.entranceComplete) {
            material.uniforms.shimmerPosX.value = shimmerSweepRef.current.posX;
            material.uniforms.shimmerIntensity.value =
              shimmerSweepRef.current.intensity * 1.8;
          }
        }
      }

      // Update sphere shader uniforms
      if (spherePivotRef.current && sphereMeshRef.current) {
        if (
          animationState.current.entranceComplete &&
          !prefersReducedMotion.current
        ) {
          spherePivotRef.current.rotation.y = time * 0.15;
          spherePivotRef.current.rotation.z = Math.sin(time * 0.08) * 0.03;
        }

        const material = sphereMeshRef.current.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.time.value = time;

          // Transform mouse to sphere's local space using preallocated vector
          sphereLocalMouse.current.set(
            mouseWorldRef.current.x,
            mouseWorldRef.current.y,
            0
          );

          tempQuat.current.setFromEuler(spherePivotRef.current.rotation);
          tempQuat.current.invert();

          sphereLocalMouse.current.x -= SPHERE_CENTER.x;
          sphereLocalMouse.current.y -= SPHERE_CENTER.y;
          sphereLocalMouse.current.applyQuaternion(tempQuat.current);
          sphereLocalMouse.current.x += SPHERE_CENTER.x;
          sphereLocalMouse.current.y += SPHERE_CENTER.y;

          material.uniforms.mousePos.value.copy(sphereLocalMouse.current);
          material.uniforms.mouseActive.value = mouseActiveRef.current
            ? 1.0
            : 0.0;
          material.uniforms.disperseAmount.value = disperseAmount.current;
          if (animationState.current.entranceComplete) {
            material.uniforms.shimmerPosX.value = shimmerSweepRef.current.posX;
            material.uniforms.shimmerIntensity.value =
              shimmerSweepRef.current.intensity * 1.8;
          }
        }
      }

      // Update post-processing and render
      if (filmPassRef.current) {
        filmPassRef.current.uniforms.time.value = time;
      }
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    loadGeometry();
    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;

      const newIsMobile = w < 768;
      const newIsSmallScreen = w < 1200;

      const newFov = newIsMobile ? 55 : newIsSmallScreen ? 50 : 45;
      const newZ = newIsMobile ? 90 : newIsSmallScreen ? 75 : 70;

      camera.fov = newFov;
      camera.position.z = newZ;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Update post-processing
      if (composerRef.current) {
        composerRef.current.setSize(w, h);
      }
      if (bloomPassRef.current) {
        bloomPassRef.current.resolution.set(w, h);
      }

      // Recalculate scale based on visible width to always fill container
      if (groupRef.current) {
        const fovRad = newFov * DEG_TO_RAD;
        const visibleHeight = 2 * Math.tan(fovRad / 2) * newZ;
        const visibleWidth = visibleHeight * (w / h);

        // Logo should fill ~85% of visible width on all screen sizes
        const targetWidth = visibleWidth * 0.85;
        const scale = targetWidth / LOGO_WIDTH;

        groupRef.current.scale.set(scale, scale, scale);
        scaleRef.current = scale;
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup - proper Three.js resource disposal
    return () => {
      cancelAnimationFrame(frameRef.current);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);

      // Remove event listeners
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        handleContextLost
      );
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored
      );

      // Dispose post-processing
      if (composerRef.current) {
        composerRef.current.dispose();
      }

      // Dispose all Three.js resources
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.InstancedMesh ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();

      if (
        rendererRef.current &&
        container.contains(rendererRef.current.domElement)
      ) {
        container.removeChild(rendererRef.current.domElement);
      }
    };
    // Props are captured at mount time - changes require component remount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 0.6s ease-out",
        cursor: disableInteraction ? "default" : "grab",
        willChange: "transform",
      }}
    />
  );
}
