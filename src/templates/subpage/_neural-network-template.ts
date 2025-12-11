/**
 * Neural Network Animation Template
 *
 * GSAP-powered animation for the "Meet [Product]" section neural network visualization.
 * Creates orbiting stat nodes with connection lines and floating particles.
 *
 * USAGE:
 * 1. Copy to: src/scripts/neural-network-[page-name].ts
 * 2. Replace all [MARKERS] with your values
 * 3. Update IDs to match your section component
 *
 * MARKERS TO REPLACE:
 * - [PAGE_NAME]: kebab-case page name (e.g., "dart-ai")
 * - [FUNCTION_NAME]: Export function name (e.g., "initDartNeuralNetwork")
 *
 * DEPENDENCIES:
 * - GSAP: npm install gsap
 */

import gsap from "gsap";

// ============================================
// CUSTOMIZE: Export function name
// ============================================
export function init[FUNCTION_NAME]NeuralNetwork(): void {
  // CUSTOMIZE: Update these IDs to match your component
  const container = document.getElementById("[PAGE_NAME]-neural-network");
  const svg = document.getElementById("[PAGE_NAME]-neural-svg");
  const core = document.getElementById("[PAGE_NAME]-neural-core");
  const particlesContainer = document.getElementById("[PAGE_NAME]-data-particles");

  if (!container || !svg || !core) {
    console.warn("Neural network elements not found");
    return;
  }

  // Get container dimensions
  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // CUSTOMIZE: Adjust radius factor (0.3 - 0.45 recommended)
  const radius = Math.min(rect.width, rect.height) * 0.38;

  // Get all stat nodes
  const nodes = container.querySelectorAll<HTMLElement>(".stat-node");

  // Clear existing SVG content (except defs)
  const defs = svg.querySelector("defs");
  svg.innerHTML = "";
  if (defs) svg.appendChild(defs);

  // ============================================
  // POSITION NODES IN ORBITAL PATTERN
  // ============================================
  const nodePositions: { x: number; y: number }[] = [];

  nodes.forEach((node, i) => {
    // Calculate angle (start from top, go clockwise)
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;

    // Calculate position
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Store for connection lines
    nodePositions.push({ x, y });

    // Position the node
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  });

  // ============================================
  // CREATE SVG CONNECTION LINES
  // ============================================
  nodePositions.forEach((pos, i) => {
    // Create line from center to node
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.classList.add("connection-line");
    line.setAttribute("data-node", String(i));

    // Calculate path (straight line)
    const d = `M ${centerX} ${centerY} L ${pos.x} ${pos.y}`;
    line.setAttribute("d", d);

    // Style
    line.setAttribute("stroke", "rgba(220, 38, 38, 0.5)");
    line.setAttribute("stroke-width", "1.5");
    line.setAttribute("fill", "none");
    line.setAttribute("stroke-dasharray", "6 4");
    line.setAttribute("stroke-linecap", "round");

    svg.appendChild(line);

    // Create traveling data pulse
    const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pulse.classList.add("data-pulse");
    pulse.setAttribute("r", "3");
    pulse.setAttribute("fill", "#dc2626");

    svg.appendChild(pulse);

    // Animate the pulse along the path
    animatePulseAlongPath(pulse, centerX, centerY, pos.x, pos.y, i);
  });

  // ============================================
  // ANIMATE NODES WITH GSAP
  // ============================================
  nodes.forEach((node, i) => {
    // Floating animation with unique timing
    gsap.to(node, {
      y: "+=8",
      x: `+=${i % 2 === 0 ? 4 : -4}`,
      duration: 3 + (i * 0.5),
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: i * 0.3,
    });
  });

  // ============================================
  // UPDATE CONNECTION LINES ON GSAP TICKER
  // ============================================
  gsap.ticker.add(() => {
    nodes.forEach((node, i) => {
      const nodeRect = node.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculate node center relative to container
      const nodeX = nodeRect.left - containerRect.left + nodeRect.width / 2;
      const nodeY = nodeRect.top - containerRect.top + nodeRect.height / 2;

      // Update line path
      const line = svg.querySelector(`path[data-node="${i}"]`);
      if (line) {
        const d = `M ${centerX} ${centerY} L ${nodeX} ${nodeY}`;
        line.setAttribute("d", d);
      }
    });
  });

  // ============================================
  // CREATE FLOATING PARTICLES
  // ============================================
  if (particlesContainer) {
    createParticles(particlesContainer, rect.width, rect.height);
  }
}

// ============================================
// HELPER: Animate pulse along connection line
// ============================================
function animatePulseAlongPath(
  pulse: SVGCircleElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  index: number
): void {
  // Animation duration with stagger
  const duration = 2 + index * 0.3;

  // Create GSAP timeline for continuous animation
  const tl = gsap.timeline({ repeat: -1, delay: index * 0.5 });

  // Animate from center to node
  tl.fromTo(
    pulse,
    {
      attr: { cx: startX, cy: startY },
      opacity: 0,
    },
    {
      attr: { cx: endX, cy: endY },
      opacity: 1,
      duration: duration,
      ease: "power1.inOut",
    }
  );

  // Fade out at end
  tl.to(pulse, {
    opacity: 0,
    duration: 0.3,
  });

  // Pause before repeating
  tl.to({}, { duration: 1 });
}

// ============================================
// HELPER: Create floating background particles
// ============================================
function createParticles(
  container: HTMLElement,
  width: number,
  height: number
): void {
  // Clear existing particles
  container.innerHTML = "";

  // CUSTOMIZE: Number of particles (6-12 recommended)
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("data-particle");

    // Random starting position
    const x = Math.random() * width;
    const y = Math.random() * height;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.opacity = String(0.3 + Math.random() * 0.4);

    container.appendChild(particle);

    // Animate with GSAP
    gsap.to(particle, {
      x: `+=${(Math.random() - 0.5) * 100}`,
      y: `+=${(Math.random() - 0.5) * 100}`,
      opacity: 0.2 + Math.random() * 0.3,
      duration: 5 + Math.random() * 5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 2,
    });
  }
}

// ============================================
// HELPER: Create particle connection lines (optional)
// ============================================
function createParticleConnections(
  svg: SVGSVGElement,
  particles: HTMLElement[]
): void {
  // Optional: Draw faint connections between nearby particles
  particles.forEach((p1, i) => {
    particles.slice(i + 1).forEach((p2) => {
      const rect1 = p1.getBoundingClientRect();
      const rect2 = p2.getBoundingClientRect();

      const distance = Math.hypot(
        rect2.left - rect1.left,
        rect2.top - rect1.top
      );

      // Only connect if close enough
      if (distance < 150) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.classList.add("particle-connection");
        line.setAttribute("x1", String(rect1.left));
        line.setAttribute("y1", String(rect1.top));
        line.setAttribute("x2", String(rect2.left));
        line.setAttribute("y2", String(rect2.top));
        line.setAttribute("stroke", "rgba(140, 140, 140, 0.2)");
        line.setAttribute("stroke-width", "0.5");

        svg.appendChild(line);
      }
    });
  });
}

// ============================================
// EXPORT ALIAS (for cleaner imports)
// ============================================
// CUSTOMIZE: Update this alias name
export { init[FUNCTION_NAME]NeuralNetwork as default };
