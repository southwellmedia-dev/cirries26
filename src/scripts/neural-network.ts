/**
 * Neural Network Visualization
 *
 * Interactive neural network animation with orbital stat nodes,
 * connection lines, and floating data particles using GSAP.
 */

import gsap from 'gsap';

interface NodePosition {
  x: number;
  y: number;
  angle: number;
}

/**
 * Initialize the neural network visualization
 * Positions nodes in orbital pattern around a central core
 */
export function initNeuralNetwork(): void {
  const network = document.getElementById('neural-network');
  const svg = document.getElementById('neural-svg') as SVGSVGElement | null;
  const core = document.getElementById('neural-core');
  const nodes = document.querySelectorAll('.stat-node');
  const particlesContainer = document.getElementById('data-particles');

  if (!network || !svg || !core || nodes.length === 0) {
    return;
  }

  // Kill any existing animations
  gsap.killTweensOf('.stat-node, .data-particle, .data-pulse');

  const networkRect = network.getBoundingClientRect();
  const centerX = networkRect.width / 2;
  const centerY = networkRect.height / 2;

  // Orbital radius based on container size
  const isMobile = window.innerWidth < 768;
  const radius = isMobile
    ? Math.min(networkRect.width, networkRect.height) * 0.38
    : Math.min(networkRect.width, networkRect.height) * 0.4;

  // Position nodes in orbital pattern
  const nodePositions: NodePosition[] = [];
  const nodeCount = nodes.length;

  // Offset angles for more organic feel
  const angleOffsets = [-15, 10, -5, 12];

  nodes.forEach((node, index) => {
    const element = node as HTMLElement;
    // Distribute nodes around the center with slight offsets
    const baseAngle = (index / nodeCount) * 360 - 90; // Start from top
    const angle = baseAngle + (angleOffsets[index] || 0);
    const radian = (angle * Math.PI) / 180;

    // Slightly vary the radius for each node
    const nodeRadius = radius * (0.92 + (index % 2) * 0.16);

    const x = centerX + Math.cos(radian) * nodeRadius;
    const y = centerY + Math.sin(radian) * nodeRadius;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    nodePositions.push({ x, y, angle });

    // Add subtle floating animation to each node
    gsap.to(element, {
      y: '+=8',
      x: '+=4',
      duration: 3 + index * 0.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  });

  // Draw connection lines from center to each node
  drawConnections(svg, centerX, centerY, nodePositions, nodes);

  // Create floating data particles
  if (particlesContainer) {
    createDataParticles(particlesContainer, svg, centerX, centerY, radius);
  }

  // Setup hover interactions
  setupNodeInteractions(nodes, svg);

  // Start line animation loop to follow floating nodes
  startLineAnimationLoop(svg, network, nodes);
}

/**
 * Animation loop to update line positions based on node transforms
 */
function startLineAnimationLoop(
  svg: SVGSVGElement,
  network: HTMLElement,
  nodes: NodeListOf<Element>
): void {
  gsap.ticker.add(() => {
    nodes.forEach((node, index) => {
      const line = svg.querySelector(`.connection-line[data-node-index="${index}"]`) as SVGLineElement;
      if (!line) return;

      const nodeEl = node as HTMLElement;
      const nodeRect = nodeEl.getBoundingClientRect();
      const currentNetworkRect = network.getBoundingClientRect();

      const nodeX = nodeRect.left + nodeRect.width / 2 - currentNetworkRect.left;
      const nodeY = nodeRect.top + nodeRect.height / 2 - currentNetworkRect.top;

      line.setAttribute('x2', nodeX.toString());
      line.setAttribute('y2', nodeY.toString());
    });
  });
}

/**
 * Draw SVG connection lines from center to each node
 */
function drawConnections(
  svg: SVGSVGElement,
  centerX: number,
  centerY: number,
  positions: NodePosition[],
  nodes: NodeListOf<Element>
): void {
  const network = document.getElementById('neural-network');
  if (network) {
    const rect = network.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  }

  // Clear existing connections (except defs)
  const existingLines = svg.querySelectorAll('.connection-line, .data-pulse');
  existingLines.forEach(el => el.remove());

  positions.forEach((pos, index) => {
    // Create connection line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', centerX.toString());
    line.setAttribute('y1', centerY.toString());
    line.setAttribute('x2', pos.x.toString());
    line.setAttribute('y2', pos.y.toString());
    line.setAttribute('class', 'connection-line');
    line.setAttribute('data-node-index', index.toString());
    line.setAttribute('stroke', 'rgba(220, 38, 38, 0.5)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '6 4');
    line.setAttribute('fill', 'none');
    svg.appendChild(line);

    // Create pulse circle that travels along the line
    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('r', '3');
    pulse.setAttribute('cx', centerX.toString());
    pulse.setAttribute('cy', centerY.toString());
    pulse.setAttribute('class', 'data-pulse');
    pulse.setAttribute('data-node-index', index.toString());
    pulse.setAttribute('fill', '#dc2626');
    pulse.setAttribute('opacity', '0');
    svg.appendChild(pulse);

    // Animate pulse along the line using GSAP
    const duration = 2.5 + index * 0.3;
    const delay = index * 0.5;

    gsap.timeline({ repeat: -1, delay })
      .to(pulse, {
        attr: { cx: pos.x, cy: pos.y },
        opacity: 0.8,
        duration: duration * 0.4,
        ease: 'power1.in',
      })
      .to(pulse, {
        attr: { cx: pos.x, cy: pos.y },
        opacity: 0,
        duration: duration * 0.1,
        ease: 'power1.out',
      })
      .to(pulse, {
        attr: { cx: centerX, cy: centerY },
        duration: 0,
      })
      .to({}, { duration: duration * 0.5 }); // Pause before repeat
  });
}

/**
 * Create floating data particles around the network with faded connection lines
 */
function createDataParticles(
  container: HTMLElement,
  svg: SVGSVGElement,
  centerX: number,
  centerY: number,
  radius: number
): void {
  container.innerHTML = '';

  // Remove existing particle lines
  svg.querySelectorAll('.particle-line').forEach(el => el.remove());

  // Create 8 floating particles
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'data-particle';
    particle.setAttribute('data-particle-index', i.toString());

    // Position around the network
    const angle = (i / 8) * Math.PI * 2;
    const r = radius * (0.55 + Math.random() * 0.4);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    container.appendChild(particle);

    // Create faded connection line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', centerX.toString());
    line.setAttribute('y1', centerY.toString());
    line.setAttribute('x2', x.toString());
    line.setAttribute('y2', y.toString());
    line.setAttribute('class', 'particle-line');
    line.setAttribute('data-particle-index', i.toString());
    line.setAttribute('stroke', 'rgba(140, 140, 140, 0.25)');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '3 5');
    line.setAttribute('fill', 'none');
    svg.appendChild(line);

    // Set initial particle opacity
    particle.style.opacity = '0.7';

    // Animate particle with GSAP
    const floatX = 12 + Math.random() * 18;
    const floatY = 10 + Math.random() * 15;
    const duration = 4 + Math.random() * 3;

    gsap.to(particle, {
      x: `+=${floatX}`,
      y: `-=${floatY}`,
      duration: duration,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      onUpdate: function() {
        // Update the line endpoint to follow particle
        const rect = particle.getBoundingClientRect();
        const networkRect = container.parentElement?.getBoundingClientRect();
        if (networkRect) {
          const particleX = rect.left + rect.width / 2 - networkRect.left;
          const particleY = rect.top + rect.height / 2 - networkRect.top;
          line.setAttribute('x2', particleX.toString());
          line.setAttribute('y2', particleY.toString());
        }
      }
    });

    // Subtle opacity pulsing
    gsap.to(particle, {
      opacity: 0.5,
      duration: 2.5 + Math.random() * 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 2,
    });
  }
}

/**
 * Setup hover interactions for nodes
 */
function setupNodeInteractions(
  nodes: NodeListOf<Element>,
  svg: SVGSVGElement
): void {
  nodes.forEach((node, index) => {
    const element = node as HTMLElement;

    element.addEventListener('mouseenter', () => {
      const lines = svg.querySelectorAll(`.connection-line[data-node-index="${index}"]`);
      lines.forEach(line => {
        gsap.to(line, { attr: { 'stroke-width': 2.5 }, opacity: 1, duration: 0.3 });
      });

      const pulses = svg.querySelectorAll(`.data-pulse[data-node-index="${index}"]`);
      pulses.forEach(pulse => {
        gsap.to(pulse, { attr: { r: 5 }, duration: 0.3 });
      });
    });

    element.addEventListener('mouseleave', () => {
      const lines = svg.querySelectorAll(`.connection-line[data-node-index="${index}"]`);
      lines.forEach(line => {
        gsap.to(line, { attr: { 'stroke-width': 1.5 }, opacity: 0.5, duration: 0.3 });
      });

      const pulses = svg.querySelectorAll(`.data-pulse[data-node-index="${index}"]`);
      pulses.forEach(pulse => {
        gsap.to(pulse, { attr: { r: 3 }, duration: 0.3 });
      });
    });
  });
}

// Auto-initialize on DOM ready
let neuralResizeTimeout: ReturnType<typeof setTimeout>;

function init(): void {
  setTimeout(initNeuralNetwork, 150);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Reinitialize on resize
window.addEventListener('resize', () => {
  clearTimeout(neuralResizeTimeout);
  neuralResizeTimeout = setTimeout(initNeuralNetwork, 250);
});
