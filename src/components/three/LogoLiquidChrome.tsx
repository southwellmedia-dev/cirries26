import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

interface Props {
  className?: string;
  modelPath?: string;
}

export default function LogoLiquidChrome({
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
    chromeMaterial: THREE.ShaderMaterial | null;
    rimLight: THREE.PointLight;
  } | null>(null);

  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const previousMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isLoaded, setIsLoaded] = useState(false);

  // Brand colors
  const COLORS = {
    primary: new THREE.Color(0xEA242B),
    primaryBright: new THREE.Color(0xFF4B52),
    white: new THREE.Color(0xFFFFFF),
    dark: new THREE.Color(0x0A0A0A),
  };

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

    // Renderer with high quality settings
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Logo container
    const logoGroup = new THREE.Group();
    logoGroup.position.set(0, 0, 0);
    logoGroup.scale.setScalar(settings.scale);
    scene.add(logoGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Key light - bright white from upper right
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 3, 5);
    scene.add(keyLight);

    // Fill light - softer from left
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-4, 0, 3);
    scene.add(fillLight);

    // Rim light - brand red accent from behind
    const rimLight = new THREE.PointLight(COLORS.primary.getHex(), 2, 20);
    rimLight.position.set(0, -2, -4);
    scene.add(rimLight);

    // Top accent light
    const topLight = new THREE.PointLight(0xffffff, 1, 15);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      logoGroup,
      model: null,
      chromeMaterial: null,
      rimLight,
    };

    // Liquid Chrome Shader Material
    const createChromeMaterial = (envMap: THREE.Texture | null) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uEnvMap: { value: envMap },
          uMousePosition: { value: new THREE.Vector2(0, 0) },
          uRimColor: { value: COLORS.primary },
          uRimPower: { value: 2.5 },
          uRimIntensity: { value: 0.6 },
          uReflectivity: { value: 0.95 },
          uFresnelPower: { value: 3.0 },
          uDistortionAmount: { value: 0.02 },
          uDistortionSpeed: { value: 0.8 },
          uChromeColor: { value: new THREE.Color(0.95, 0.95, 0.98) },
          uCameraPosition: { value: camera.position },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uDistortionAmount;
          uniform float uDistortionSpeed;
          uniform vec2 uMousePosition;

          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vViewDirection;
          varying vec2 vUv;
          varying float vDisplacement;

          // Simplex noise function
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
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);

            // Liquid surface displacement
            float slowTime = uTime * uDistortionSpeed;
            vec3 noisePos = position * 2.0 + slowTime * 0.5;

            // Multiple octaves of noise for organic feel
            float noise1 = snoise(noisePos) * 0.5;
            float noise2 = snoise(noisePos * 2.0 + slowTime) * 0.25;
            float noise3 = snoise(noisePos * 4.0 - slowTime * 0.5) * 0.125;

            float displacement = (noise1 + noise2 + noise3) * uDistortionAmount;

            // Breathing effect - subtle scale pulse
            float breathe = sin(uTime * 0.5) * 0.008 + 1.0;

            // Apply displacement along normal
            vec3 newPosition = position * breathe + normal * displacement;

            // Recalculate normal with displacement
            float epsilon = 0.001;
            vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
            if (length(tangent) < 0.01) tangent = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
            vec3 bitangent = normalize(cross(normal, tangent));

            vec3 posT = position + tangent * epsilon;
            vec3 posB = position + bitangent * epsilon;

            float dispT = (snoise(posT * 2.0 + slowTime * 0.5) * 0.5 + snoise(posT * 4.0 + slowTime) * 0.25) * uDistortionAmount;
            float dispB = (snoise(posB * 2.0 + slowTime * 0.5) * 0.5 + snoise(posB * 4.0 + slowTime) * 0.25) * uDistortionAmount;

            vec3 newPosT = posT * breathe + normal * dispT;
            vec3 newPosB = posB * breathe + normal * dispB;

            vec3 newTangent = normalize(newPosT - newPosition);
            vec3 newBitangent = normalize(newPosB - newPosition);
            vec3 newNormal = normalize(cross(newTangent, newBitangent));

            vNormal = normalize(normalMatrix * newNormal);
            vDisplacement = displacement;

            vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
            vWorldPosition = worldPosition.xyz;
            vViewDirection = normalize(cameraPosition - worldPosition.xyz);

            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform samplerCube uEnvMap;
          uniform vec3 uRimColor;
          uniform float uRimPower;
          uniform float uRimIntensity;
          uniform float uReflectivity;
          uniform float uFresnelPower;
          uniform vec3 uChromeColor;
          uniform vec3 uCameraPosition;

          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vViewDirection;
          varying vec2 vUv;
          varying float vDisplacement;

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewDirection);

            // Fresnel effect for edge glow
            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);

            // Reflection
            vec3 reflectDir = reflect(-viewDir, normal);

            // Add subtle time-based distortion to reflections
            float distortTime = uTime * 0.3;
            reflectDir.x += sin(distortTime + vWorldPosition.y * 2.0) * 0.05;
            reflectDir.y += cos(distortTime + vWorldPosition.x * 2.0) * 0.05;
            reflectDir = normalize(reflectDir);

            // Sample environment map
            vec3 envColor = vec3(0.9, 0.92, 0.95); // Fallback chrome color
            #ifdef USE_ENVMAP
              envColor = textureCube(uEnvMap, reflectDir).rgb;
            #endif

            // Create chrome base with gradient based on view angle
            vec3 chromeBase = uChromeColor;

            // Add subtle color variation based on normal direction for depth
            float topLight = max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0);
            float sideLight = max(dot(normal, vec3(1.0, 0.0, 0.0)), 0.0);

            chromeBase = mix(chromeBase * 0.7, chromeBase, topLight * 0.5 + 0.5);
            chromeBase += vec3(0.05, 0.05, 0.08) * sideLight;

            // Specular highlights
            vec3 lightDir1 = normalize(vec3(5.0, 3.0, 5.0));
            vec3 lightDir2 = normalize(vec3(-4.0, 0.0, 3.0));
            vec3 lightDir3 = normalize(vec3(0.0, 5.0, 0.0));

            vec3 halfDir1 = normalize(lightDir1 + viewDir);
            vec3 halfDir2 = normalize(lightDir2 + viewDir);
            vec3 halfDir3 = normalize(lightDir3 + viewDir);

            float spec1 = pow(max(dot(normal, halfDir1), 0.0), 80.0) * 1.5;
            float spec2 = pow(max(dot(normal, halfDir2), 0.0), 60.0) * 0.8;
            float spec3 = pow(max(dot(normal, halfDir3), 0.0), 100.0) * 1.0;

            vec3 specular = vec3(spec1 + spec2 + spec3);

            // Combine chrome with environment reflections
            vec3 color = mix(chromeBase, envColor, uReflectivity * fresnel);
            color += specular;

            // Rim lighting with brand color
            float rim = pow(fresnel, uRimPower);
            vec3 rimGlow = uRimColor * rim * uRimIntensity;

            // Pulsing rim effect
            float rimPulse = sin(uTime * 1.5) * 0.15 + 0.85;
            rimGlow *= rimPulse;

            color += rimGlow;

            // Subtle displacement-based color variation (liquid ripples)
            color += vec3(0.02, 0.02, 0.03) * vDisplacement * 20.0;

            // Tone mapping and gamma
            color = color / (color + vec3(1.0));
            color = pow(color, vec3(1.0 / 2.2));

            gl_FragColor = vec4(color, 1.0);
          }
        `,
        side: THREE.DoubleSide,
      });
    };

    // Create a procedural environment map for reflections
    const createProceduralEnvMap = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Create gradient background for studio-like reflections
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#2a2a3a');
      gradient.addColorStop(0.3, '#1a1a2a');
      gradient.addColorStop(0.5, '#0f0f1a');
      gradient.addColorStop(0.7, '#1a1a2a');
      gradient.addColorStop(1, '#2a2a3a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Add some bright spots for specular reflections
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(size * 0.3, size * 0.25, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(size * 0.7, size * 0.35, 20, 0, Math.PI * 2);
      ctx.fill();

      // Add subtle red accent
      ctx.fillStyle = 'rgba(234, 36, 43, 0.15)';
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.8, 40, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    };

    // Create environment and material
    const envMap = createProceduralEnvMap();
    const chromeMaterial = createChromeMaterial(envMap);
    sceneRef.current.chromeMaterial = chromeMaterial;

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

        // Apply chrome material to all meshes
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = chromeMaterial;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        logoGroup.add(model);
        sceneRef.current.model = model;

        console.log(`Liquid Chrome Logo loaded: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
        setIsLoaded(true);
      },
      (progress) => {
        console.log(`Loading: ${((progress.loaded / progress.total) * 100).toFixed(0)}%`);
      },
      (error) => {
        console.error('Error loading model:', error);
        setIsLoaded(true);
      }
    );

    // Interaction - click and drag to rotate
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePositionRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePositionRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

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

      const { logoGroup, chromeMaterial, rimLight } = sceneRef.current;

      // Smooth rotation
      logoGroup.rotation.y += (rotationRef.current.y - logoGroup.rotation.y) * 0.08;
      logoGroup.rotation.x += (rotationRef.current.x - logoGroup.rotation.x) * 0.08;

      // Very slow auto-rotation
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.0003;
      }

      // Update shader uniforms
      if (chromeMaterial) {
        chromeMaterial.uniforms.uTime.value = timeRef.current;
        chromeMaterial.uniforms.uMousePosition.value.set(
          mousePositionRef.current.x,
          mousePositionRef.current.y
        );
      }

      // Animate rim light position subtly
      rimLight.position.x = Math.sin(timeRef.current * 0.5) * 2;
      rimLight.position.y = -2 + Math.cos(timeRef.current * 0.3) * 0.5;

      // Pulse rim light intensity
      rimLight.intensity = 2 + Math.sin(timeRef.current * 1.5) * 0.5;

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
