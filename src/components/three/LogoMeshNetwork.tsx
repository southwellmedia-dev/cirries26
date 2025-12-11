import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

interface Props {
  className?: string;
}

export default function LogoMeshNetwork({ className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const groupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const mousePositionRef = useRef({ x: 0, y: 0 }); // Normalized mouse position for glimmer
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 3; // Closer camera = bigger logo

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create group to hold all logo meshes
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);
    groupRef.current = logoGroup;

    // Load SVG and create extruded 3D mesh
    const loader = new SVGLoader();

    loader.load(
      '/assets/models/logo.svg',
      (data) => {
        const paths = data.paths;

        // SVG dimensions from viewBox (1137 x 278)
        const svgWidth = 1137;
        const svgHeight = 278;
        const targetWidth = 4;
        const scale = targetWidth / svgWidth;

        // Calculate the center of the entire SVG for proper positioning
        const svgCenterX = svgWidth / 2;
        const svgCenterY = svgHeight / 2;

        // Materials - increased visibility for smaller screens
        const meshMaterial = new THREE.MeshBasicMaterial({
          color: 0x1a1a1a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.15,
        });

        const wireMaterial = new THREE.MeshBasicMaterial({
          color: 0x444444, // Lighter gray wireframe for better visibility
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        });

        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x666666, // Lighter edges for better visibility
          transparent: true,
          opacity: 0.8,
        });

        // Glimmer material - red highlight that follows mouse using custom shader
        const glimmerShaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            mousePos: { value: new THREE.Vector3(0, 0, 0) },
            glimmerRadius: { value: 0.4 }, // Radius of the glimmer spotlight
            glimmerColor: { value: new THREE.Color(0xE7001A) },
            time: { value: 0 },
            mouseActive: { value: 0.0 },
          },
          vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPos.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform vec3 mousePos;
            uniform float glimmerRadius;
            uniform vec3 glimmerColor;
            uniform float time;
            uniform float mouseActive;
            varying vec3 vWorldPosition;

            void main() {
              // Calculate distance from this fragment to mouse position in world space
              float dist = distance(vWorldPosition.xy, mousePos.xy);

              // Create soft falloff based on distance
              float intensity = 1.0 - smoothstep(0.0, glimmerRadius, dist);

              // Add subtle pulse
              float pulse = sin(time * 3.0) * 0.15 + 0.85;
              intensity *= pulse;

              // Only show when mouse is active
              intensity *= mouseActive;

              // Output color with calculated alpha
              gl_FragColor = vec4(glimmerColor, intensity * 0.7);
            }
          `,
          transparent: true,
          wireframe: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        // Process each path
        paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);

          shapes.forEach((shape) => {
            // Simplified extrude settings - minimal depth, no bevel
            const extrudeSettings = {
              depth: 8,
              bevelEnabled: false,
              curveSegments: 3, // Reduce curve complexity
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.translate(-svgCenterX, -svgCenterY, -4);

            // Create solid mesh (subtle fill)
            const solidMesh = new THREE.Mesh(geometry.clone(), meshMaterial);
            solidMesh.scale.set(scale, -scale, scale * 0.5);
            logoGroup.add(solidMesh);

            // Create wireframe mesh (the main visible structure)
            const wireMesh = new THREE.Mesh(geometry.clone(), wireMaterial);
            wireMesh.scale.set(scale, -scale, scale * 0.5);
            logoGroup.add(wireMesh);

            // Create edges for sharper outline - higher angle threshold for fewer lines
            const edges = new THREE.EdgesGeometry(geometry, 30);
            const edgeLine = new THREE.LineSegments(edges, edgeMaterial);
            edgeLine.scale.set(scale, -scale, scale * 0.5);
            logoGroup.add(edgeLine);

            // Create glimmer mesh (red overlay that follows mouse)
            const glimmerMesh = new THREE.Mesh(geometry.clone(), glimmerShaderMaterial.clone());
            glimmerMesh.scale.set(scale, -scale, scale * 0.5);
            glimmerMesh.userData.isGlimmer = true;
            logoGroup.add(glimmerMesh);

            geometry.dispose();
          });
        });

        setIsLoaded(true);
      },
      undefined,
      (error) => {
        console.error('Error loading SVG:', error);
        setIsLoaded(true);
      }
    );

    // Mouse drag to rotate
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Track mouse position for glimmer effect (normalized -1 to 1)
      mousePositionRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePositionRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMouseRef.current.x;
        const deltaY = e.clientY - previousMouseRef.current.y;

        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x += deltaY * 0.005;

        // Clamp vertical rotation
        targetRotationRef.current.x = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, targetRotationRef.current.x)
        );

        previousMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
      // Reset mouse position to turn off glimmer
      mousePositionRef.current = { x: 0, y: 0 };
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Raycaster for converting mouse position to 3D world coordinates
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const worldMousePos = new THREE.Vector3();

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      // Smooth rotation interpolation
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.08;

      // Apply rotation to the logo group
      if (groupRef.current) {
        // Add subtle auto-rotation when not dragging
        const autoRotateY = isDraggingRef.current ? 0 : Math.sin(time * 0.3) * 0.05;
        const autoRotateX = isDraggingRef.current ? 0 : Math.cos(time * 0.2) * 0.02;

        groupRef.current.rotation.y = rotationRef.current.y + autoRotateY;
        groupRef.current.rotation.x = rotationRef.current.x + autoRotateX;

        // Convert mouse position to 3D world coordinates
        const mouseX = mousePositionRef.current.x;
        const mouseY = mousePositionRef.current.y;
        const mouseActive = mouseX !== 0 || mouseY !== 0;

        // Calculate world position of mouse on the logo plane
        mouseVec.set(mouseX, mouseY);
        raycaster.setFromCamera(mouseVec, camera);
        raycaster.ray.intersectPlane(intersectPlane, worldMousePos);

        // Update all glimmer shader uniforms
        groupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData.isGlimmer) {
            const material = child.material as THREE.ShaderMaterial;
            if (material.uniforms) {
              material.uniforms.mousePos.value.copy(worldMousePos);
              material.uniforms.time.value = time;
              material.uniforms.mouseActive.value = mouseActive ? 1.0 : 0.0;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
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
        cursor: 'pointer',
      }}
    />
  );
}
