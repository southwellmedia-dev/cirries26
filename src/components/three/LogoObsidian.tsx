import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface Props {
  className?: string;
  modelPath?: string;
}

export default function LogoObsidian({
  className = '',
  modelPath = '/assets/models/neural-mesh-export.glb',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    logoGroup: THREE.Group;
    model: THREE.Group | null;
    obsidianMaterial: THREE.ShaderMaterial | null;
  } | null>(null);

  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const previousMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);

    const getResponsiveSettings = () => {
      const w = window.innerWidth;
      if (w <= 480) return { cameraZ: 6, scale: 0.7 };
      if (w <= 768) return { cameraZ: 5, scale: 0.8 };
      if (w <= 1024) return { cameraZ: 4.5, scale: 0.9 };
      return { cameraZ: 4, scale: 1.0 };
    };

    const settings = getResponsiveSettings();
    camera.position.set(0, 0, settings.cameraZ);
    camera.lookAt(0, 0, 0);

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
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Logo container
    const logoGroup = new THREE.Group();
    logoGroup.position.set(0, 0, 0);
    logoGroup.scale.setScalar(settings.scale);
    scene.add(logoGroup);

    // Minimal lighting - we want the shader to do the work
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // Subtle key light for edge definition
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.3);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      logoGroup,
      model: null,
      obsidianMaterial: null,
    };

    // Obsidian Glass Shader with Internal Red Glow
    const obsidianMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        // Base colors
        uSurfaceColor: { value: new THREE.Color(0x0a0a0a) }, // Near black
        uDeepColor: { value: new THREE.Color(0x050505) }, // Deeper black
        // Glow colors (brand red)
        uGlowColor: { value: new THREE.Color(0xEA242B) },
        uGlowColorBright: { value: new THREE.Color(0xFF4B52) },
        // Edge/rim
        uEdgeColor: { value: new THREE.Color(0x1a1a1a) }, // Subtle grey edge
        uEdgeGlowColor: { value: new THREE.Color(0xEA242B) },
        // Parameters
        uGlowIntensity: { value: 0.6 },
        uGlowPulseSpeed: { value: 0.8 },
        uFresnelPower: { value: 2.5 },
        uInternalGlowDepth: { value: 0.4 },
        uEdgeSharpness: { value: 3.0 },
        // Camera for view calculations
        uCameraPosition: { value: camera.position },
      },
      vertexShader: `
        uniform float uTime;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewDirection;
        varying vec3 vLocalPosition;
        varying float vDepth;

        // Simplex noise for subtle surface variation
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
          vLocalPosition = position;
          vNormal = normalize(normalMatrix * normal);

          // Very subtle breathing
          float breathe = 1.0 + sin(uTime * 0.4) * 0.003;
          vec3 pos = position * breathe;

          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPosition.xyz;
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);

          // Calculate depth for internal glow variation
          vDepth = length(position);

          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSurfaceColor;
        uniform vec3 uDeepColor;
        uniform vec3 uGlowColor;
        uniform vec3 uGlowColorBright;
        uniform vec3 uEdgeColor;
        uniform vec3 uEdgeGlowColor;
        uniform float uGlowIntensity;
        uniform float uGlowPulseSpeed;
        uniform float uFresnelPower;
        uniform float uInternalGlowDepth;
        uniform float uEdgeSharpness;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewDirection;
        varying vec3 vLocalPosition;
        varying float vDepth;

        // Noise for internal glow variation
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + .1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                         mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                         mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewDirection);

          // Fresnel for edge detection
          float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
          float fresnelPow = pow(fresnel, uFresnelPower);

          // === BASE OBSIDIAN SURFACE ===
          // Deep black glass with subtle depth variation
          vec3 baseColor = mix(uDeepColor, uSurfaceColor, fresnel * 0.3);

          // === INTERNAL GLOW ===
          // Animated noise for organic internal light movement
          float slowTime = uTime * uGlowPulseSpeed;
          vec3 noisePos = vLocalPosition * 2.0 + vec3(slowTime * 0.2, slowTime * 0.15, slowTime * 0.1);
          float glowNoise = fbm(noisePos);

          // Pulsing intensity
          float pulse = sin(uTime * 0.8) * 0.3 + 0.7;
          float pulse2 = sin(uTime * 1.3 + 1.5) * 0.2 + 0.8;

          // Internal glow - stronger toward center, varies with noise
          float internalFactor = (1.0 - fresnel) * uInternalGlowDepth;
          float glowStrength = glowNoise * internalFactor * pulse * uGlowIntensity;

          // Mix glow colors for variation
          vec3 internalGlow = mix(uGlowColor, uGlowColorBright, glowNoise * pulse2);
          internalGlow *= glowStrength;

          // === EDGE RIM GLOW ===
          // Sharp edge detection with red glow
          float edgeFactor = pow(fresnelPow, uEdgeSharpness);

          // Subtle edge shimmer
          float edgeShimmer = sin(uTime * 2.0 + vLocalPosition.x * 10.0) * 0.1 + 0.9;

          vec3 edgeGlow = uEdgeGlowColor * edgeFactor * 0.4 * edgeShimmer;

          // Subtle grey edge highlight for definition
          vec3 edgeHighlight = uEdgeColor * fresnelPow * 0.5;

          // === SPECULAR HIGHLIGHTS ===
          // Very subtle, dark specular for glass-like quality
          vec3 lightDir = normalize(vec3(3.0, 2.0, 4.0));
          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(normal, halfDir), 0.0), 60.0);
          vec3 specular = vec3(0.15) * spec; // Dark, subtle specular

          // === COMBINE ===
          vec3 finalColor = baseColor;
          finalColor += internalGlow;
          finalColor += edgeGlow;
          finalColor += edgeHighlight;
          finalColor += specular;

          // === SUBSURFACE SCATTERING FAKE ===
          // Light bleeding through at thin edges
          float sss = pow(fresnel, 4.0) * 0.15;
          finalColor += uGlowColor * sss * pulse;

          // Subtle vignette toward edges for depth
          float vignette = 1.0 - fresnelPow * 0.1;
          finalColor *= vignette;

          // Tone mapping
          finalColor = finalColor / (finalColor + vec3(1.0));
          finalColor = pow(finalColor, vec3(1.0 / 2.2));

          // Slight transparency at extreme edges
          float alpha = 0.95 + fresnelPow * 0.05;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    sceneRef.current.obsidianMaterial = obsidianMaterial;

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        if (!sceneRef.current) return;

        const model = gltf.scene;

        // Scale first
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 3;
        const modelScale = targetSize / maxDim;
        model.scale.setScalar(modelScale);

        // Center after scaling
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -center.y, -center.z);

        // Apply obsidian material
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = obsidianMaterial;
          }
        });

        logoGroup.add(model);
        sceneRef.current.model = model;

        console.log(`Obsidian Logo loaded`);
        setIsLoaded(true);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        setIsLoaded(true);
      }
    );

    // Interaction
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
      rotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationRef.current.x));

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;

      if (!sceneRef.current) return;

      const { logoGroup, obsidianMaterial } = sceneRef.current;

      // Smooth rotation
      logoGroup.rotation.y += (rotationRef.current.y - logoGroup.rotation.y) * 0.08;
      logoGroup.rotation.x += (rotationRef.current.x - logoGroup.rotation.x) * 0.08;

      // Very slow auto-rotation
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.0003;
      }

      // Update shader
      if (obsidianMaterial) {
        obsidianMaterial.uniforms.uTime.value = timeRef.current;
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
      window.removeEventListener('resize', handleResize);

      if (sceneRef.current && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [modelPath]);

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
        transition: 'opacity 1s ease-out',
        cursor: 'grab',
      }}
    />
  );
}
