/**
 * ML Engine Neural Network Visualization
 *
 * Animated neural network with orbiting stat nodes, pulsing core,
 * and data particle effects using GSAP - for the ML Engine page.
 */

import gsap from "gsap";

interface NodePosition {
  x: number;
  y: number;
  angle: number;
}

/**
 * Initialize the ML Engine neural network visualization
 */
export function initMLNeuralNetwork(): void {
  const network = document.getElementById("ml-neural-network");
  const svg = document.getElementById("ml-neural-svg") as SVGSVGElement | null;
  const core = document.getElementById("ml-neural-core");
  const nodes = document.querySelectorAll("#ml-neural-network .stat-node");
  const particlesContainer = document.getElementById("ml-data-particles");

  if (!network || !svg || !core || nodes.length === 0) {
    return;
  }

  // Kill any existing animations
  gsap.killTweensOf(
    "#ml-neural-network .stat-node, .ml-data-particle, .ml-data-pulse"
  );

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
  const angleOffsets = [-15, 10, -5, 12];

  nodes.forEach((node, index) => {
    const element = node as HTMLElement;
    const baseAngle = (index / nodeCount) * 360 - 90;
    const angle = baseAngle + (angleOffsets[index] || 0);
    const radian = (angle * Math.PI) / 180;
    const nodeRadius = radius * (0.92 + (index % 2) * 0.16);

    const x = centerX + Math.cos(radian) * nodeRadius;
    const y = centerY + Math.sin(radian) * nodeRadius;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    nodePositions.push({ x, y, angle });

    // Floating animation
    gsap.to(element, {
      y: "+=8",
      x: "+=4",
      duration: 3 + index * 0.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  });

  // Draw connections
  drawConnections(svg, centerX, centerY, nodePositions, nodes, network);

  // Create particles
  if (particlesContainer) {
    createDataParticles(particlesContainer, svg, centerX, centerY, radius);
  }

  // Line animation loop
  startLineAnimationLoop(svg, network, nodes);
}

function startLineAnimationLoop(
  svg: SVGSVGElement,
  network: HTMLElement,
  nodes: NodeListOf<Element>
): void {
  gsap.ticker.add(() => {
    nodes.forEach((node, index) => {
      const line = svg.querySelector(
        `.ml-connection-line[data-node-index="${index}"]`
      ) as SVGLineElement;
      if (!line) return;

      const nodeEl = node as HTMLElement;
      const nodeRect = nodeEl.getBoundingClientRect();
      const currentNetworkRect = network.getBoundingClientRect();

      const nodeX =
        nodeRect.left + nodeRect.width / 2 - currentNetworkRect.left;
      const nodeY =
        nodeRect.top + nodeRect.height / 2 - currentNetworkRect.top;

      line.setAttribute("x2", nodeX.toString());
      line.setAttribute("y2", nodeY.toString());
    });
  });
}

function drawConnections(
  svg: SVGSVGElement,
  centerX: number,
  centerY: number,
  positions: NodePosition[],
  nodes: NodeListOf<Element>,
  network: HTMLElement
): void {
  const rect = network.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);

  // Clear existing
  svg
    .querySelectorAll(".ml-connection-line, .ml-data-pulse")
    .forEach((el) => el.remove());

  positions.forEach((pos, index) => {
    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line.setAttribute("x1", centerX.toString());
    line.setAttribute("y1", centerY.toString());
    line.setAttribute("x2", pos.x.toString());
    line.setAttribute("y2", pos.y.toString());
    line.setAttribute("class", "ml-connection-line");
    line.setAttribute("data-node-index", index.toString());
    line.setAttribute("stroke", "rgba(220, 38, 38, 0.5)");
    line.setAttribute("stroke-width", "1.5");
    line.setAttribute("stroke-dasharray", "6 4");
    line.setAttribute("fill", "none");
    svg.appendChild(line);

    // Pulse
    const pulse = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    pulse.setAttribute("r", "3");
    pulse.setAttribute("cx", centerX.toString());
    pulse.setAttribute("cy", centerY.toString());
    pulse.setAttribute("class", "ml-data-pulse");
    pulse.setAttribute("data-node-index", index.toString());
    pulse.setAttribute("fill", "#dc2626");
    pulse.setAttribute("opacity", "0");
    svg.appendChild(pulse);

    const duration = 2.5 + index * 0.3;
    const delay = index * 0.5;

    gsap
      .timeline({ repeat: -1, delay })
      .to(pulse, {
        attr: { cx: pos.x, cy: pos.y },
        opacity: 0.8,
        duration: duration * 0.4,
        ease: "power1.in",
      })
      .to(pulse, {
        attr: { cx: pos.x, cy: pos.y },
        opacity: 0,
        duration: duration * 0.1,
        ease: "power1.out",
      })
      .to(pulse, {
        attr: { cx: centerX, cy: centerY },
        duration: 0,
      })
      .to({}, { duration: duration * 0.5 });
  });
}

function createDataParticles(
  container: HTMLElement,
  svg: SVGSVGElement,
  centerX: number,
  centerY: number,
  radius: number
): void {
  container.innerHTML = "";
  svg.querySelectorAll(".ml-particle-line").forEach((el) => el.remove());

  // Create 8 floating particles
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.className = "ml-data-particle";
    particle.setAttribute("data-particle-index", i.toString());

    // Position around the network - spread evenly
    const angle = (i / 8) * Math.PI * 2;
    const r = radius * (0.55 + Math.random() * 0.4);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    container.appendChild(particle);

    // Create faded connection line
    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line.setAttribute("x1", centerX.toString());
    line.setAttribute("y1", centerY.toString());
    line.setAttribute("x2", x.toString());
    line.setAttribute("y2", y.toString());
    line.setAttribute("class", "ml-particle-line");
    line.setAttribute("data-particle-index", i.toString());
    line.setAttribute("stroke", "rgba(140, 140, 140, 0.25)");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("stroke-dasharray", "3 5");
    line.setAttribute("fill", "none");
    svg.appendChild(line);

    // Set initial particle opacity
    particle.style.opacity = "0.7";

    // Animate particle with GSAP
    const floatX = 12 + Math.random() * 18;
    const floatY = 10 + Math.random() * 15;
    const duration = 4 + Math.random() * 3;

    gsap.to(particle, {
      x: `+=${floatX}`,
      y: `-=${floatY}`,
      duration: duration,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      onUpdate: function () {
        // Update the line endpoint to follow particle
        const rect = particle.getBoundingClientRect();
        const networkRect = container.parentElement?.getBoundingClientRect();
        if (networkRect) {
          const particleX = rect.left + rect.width / 2 - networkRect.left;
          const particleY = rect.top + rect.height / 2 - networkRect.top;
          line.setAttribute("x2", particleX.toString());
          line.setAttribute("y2", particleY.toString());
        }
      },
    });

    // Subtle opacity pulsing
    gsap.to(particle, {
      opacity: 0.5,
      duration: 2.5 + Math.random() * 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 2,
    });
  }
}
