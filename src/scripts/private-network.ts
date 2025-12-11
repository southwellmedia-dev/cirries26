/**
 * Private Network Visualization Script
 *
 * Handles the private network topology visualization with:
 * - Network node positioning (RAN, Core, Edge, Cloud, Enterprise, IoT Zone)
 * - SVG connection lines from DART-AI hub to nodes
 * - Mesh connections between nearby nodes
 * - Animated data packets with status-based colors
 */

export function initPrivateNetwork(): void {
  const network = document.getElementById("pn-network");
  const svg = document.getElementById("pn-connections-svg");
  const connectionLines = document.getElementById("pn-connection-lines");
  const meshLines = document.getElementById("pn-mesh-lines");
  const dataPacketsContainer = document.getElementById("pn-data-packets");

  if (
    !network ||
    !svg ||
    !connectionLines ||
    !meshLines ||
    !dataPacketsContainer
  ) {
    return;
  }

  const nodes = network.querySelectorAll(
    ".pn-node"
  ) as NodeListOf<HTMLElement>;
  const networkRect = network.getBoundingClientRect();
  const centerX = networkRect.width / 2;
  const centerY = networkRect.height / 2;
  const svgNS = "http://www.w3.org/2000/svg";

  // Position nodes based on angle and distance data attributes
  nodes.forEach((node) => {
    const angle = parseFloat(node.dataset.angle || "0") * (Math.PI / 180);
    const distance = parseFloat(node.dataset.distance || "150");
    const scaleFactor = Math.min(networkRect.width, networkRect.height) / 400;
    const scaledDistance = distance * scaleFactor;

    const x = centerX + Math.cos(angle) * scaledDistance;
    const y = centerY + Math.sin(angle) * scaledDistance;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  });

  // Scale coordinates to SVG viewBox (400x400)
  const scaleX = 400 / networkRect.width;
  const scaleY = 400 / networkRect.height;

  // Draw connection lines from hub (center) to each node
  connectionLines.innerHTML = "";
  nodes.forEach((node, index) => {
    const nodeStyle = window.getComputedStyle(node);
    const nodeX = parseFloat(nodeStyle.left) * scaleX;
    const nodeY = parseFloat(nodeStyle.top) * scaleY;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "200");
    line.setAttribute("y1", "200");
    line.setAttribute("x2", String(nodeX));
    line.setAttribute("y2", String(nodeY));
    line.setAttribute("class", "pn-connection-line");
    line.style.animationDelay = `${index * 0.2}s`;
    connectionLines.appendChild(line);
  });

  // Draw mesh connections between nearby nodes
  meshLines.innerHTML = "";
  const nodePositions: { x: number; y: number }[] = [];
  nodes.forEach((node) => {
    const nodeStyle = window.getComputedStyle(node);
    nodePositions.push({
      x: parseFloat(nodeStyle.left) * scaleX,
      y: parseFloat(nodeStyle.top) * scaleY,
    });
  });

  // Connect nodes that are within proximity threshold
  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      const dx = nodePositions[i].x - nodePositions[j].x;
      const dy = nodePositions[i].y - nodePositions[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 140) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(nodePositions[i].x));
        line.setAttribute("y1", String(nodePositions[i].y));
        line.setAttribute("x2", String(nodePositions[j].x));
        line.setAttribute("y2", String(nodePositions[j].y));
        line.setAttribute("class", "pn-mesh-line");
        meshLines.appendChild(line);
      }
    }
  }

  // Create and animate a data packet between two points
  function createDataPacket(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    delay: number,
    status: string
  ): void {
    const packet = document.createElement("div");
    packet.className = `pn-data-packet pn-data-packet--${status}`;
    packet.style.left = `${startX}px`;
    packet.style.top = `${startY}px`;
    dataPacketsContainer?.appendChild(packet);

    setTimeout(() => {
      packet.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)";
      packet.style.opacity = "1";
      packet.style.left = `${endX}px`;
      packet.style.top = `${endY}px`;

      setTimeout(() => {
        packet.style.opacity = "0";
        setTimeout(() => packet.remove(), 300);
      }, 800);
    }, delay);
  }

  // Animate data packets from all nodes to/from hub
  function animateDataPackets(): void {
    nodes.forEach((node, index) => {
      const nodeStyle = window.getComputedStyle(node);
      const nodeX = parseFloat(nodeStyle.left);
      const nodeY = parseFloat(nodeStyle.top);
      const status = node.dataset.status || "healthy";

      // Randomly choose direction: to hub or from hub
      const toHub = Math.random() > 0.5;
      const startX = toHub ? nodeX : centerX;
      const startY = toHub ? nodeY : centerY;
      const endX = toHub ? centerX : nodeX;
      const endY = toHub ? centerY : nodeY;

      createDataPacket(
        startX,
        startY,
        endX,
        endY,
        index * 200 + Math.random() * 400,
        status
      );
    });
  }

  // Start animation after initial delay, then repeat
  setTimeout(animateDataPackets, 800);
  setInterval(animateDataPackets, 4500);
}

// Auto-initialize when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(initPrivateNetwork, 200)
    );
  } else {
    setTimeout(initPrivateNetwork, 200);
  }
}
