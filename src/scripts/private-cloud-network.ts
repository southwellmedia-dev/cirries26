/**
 * Private Cloud Network Visualization Script
 *
 * Handles the private cloud/VMware visualization with:
 * - Infrastructure node positioning (VMware, VMs, Containers, Storage, SDN, Compute)
 * - SVG connection lines from DART-AI hub to nodes
 * - Mesh connections between infrastructure components
 * - Animated data flows with status-based colors
 */

export function initPrivateCloudNetwork(): void {
  const network = document.getElementById("private-cloud-network");
  const svg = document.getElementById("private-cloud-connections-svg");
  const connectionLines = document.getElementById("private-connection-lines");
  const meshLines = document.getElementById("private-mesh-lines");
  const dataFlowsContainer = document.getElementById("private-cloud-data-flows");

  if (
    !network ||
    !svg ||
    !connectionLines ||
    !meshLines ||
    !dataFlowsContainer
  ) {
    return;
  }

  const nodes = network.querySelectorAll(
    ".cloud-node"
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
    line.setAttribute("class", "private-cloud-connection-line");
    line.style.animationDelay = `${index * 0.15}s`;
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

      if (distance < 130) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(nodePositions[i].x));
        line.setAttribute("y1", String(nodePositions[i].y));
        line.setAttribute("x2", String(nodePositions[j].x));
        line.setAttribute("y2", String(nodePositions[j].y));
        line.setAttribute("class", "private-cloud-mesh-line");
        meshLines.appendChild(line);
      }
    }
  }

  // Create and animate a data flow between two points
  function createDataFlow(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    delay: number,
    status: string
  ): void {
    const flow = document.createElement("div");
    flow.className = `private-cloud-data-flow private-cloud-data-flow--${status}`;
    flow.style.left = `${startX}px`;
    flow.style.top = `${startY}px`;
    dataFlowsContainer?.appendChild(flow);

    setTimeout(() => {
      flow.style.transition = "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)";
      flow.style.opacity = "1";
      flow.style.left = `${endX}px`;
      flow.style.top = `${endY}px`;

      setTimeout(() => {
        flow.style.opacity = "0";
        setTimeout(() => flow.remove(), 300);
      }, 900);
    }, delay);
  }

  // Animate data flows from all nodes to/from hub
  function animateDataFlows(): void {
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

      createDataFlow(
        startX,
        startY,
        endX,
        endY,
        index * 180 + Math.random() * 350,
        status
      );
    });
  }

  // Start animation after initial delay, then repeat
  setTimeout(animateDataFlows, 600);
  setInterval(animateDataFlows, 4000);
}

// Auto-initialize when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initPrivateCloudNetwork, 200);
    });
  } else {
    setTimeout(initPrivateCloudNetwork, 200);
  }
}
