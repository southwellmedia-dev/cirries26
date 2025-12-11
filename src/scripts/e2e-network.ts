/**
 * End-to-End Network Visualization
 *
 * Creates an animated visualization showing DART-AI hub connected to
 * the full network stack (L7-L2) with data packets flowing along paths.
 */

interface StackLayer {
  layer: string;
  label: string;
  sublabel: string;
  color: string;
  yPosition: number; // percentage from top
}

const stackLayers: StackLayer[] = [
  { layer: "L7", label: "Application", sublabel: "APIs & Services", color: "#8B5CF6", yPosition: 15 },
  { layer: "L4", label: "Transport", sublabel: "TCP/UDP", color: "#3B82F6", yPosition: 38 },
  { layer: "L3", label: "Network", sublabel: "IP Routing", color: "#10B981", yPosition: 62 },
  { layer: "L2", label: "Data Link", sublabel: "Ethernet", color: "#F59E0B", yPosition: 85 },
];

function initE2EVisualization() {
  const container = document.getElementById("e2e-network");
  const svg = document.getElementById("e2e-connections-svg") as SVGSVGElement | null;
  const hub = document.getElementById("e2e-hub");
  const layersContainer = document.getElementById("e2e-layers");
  const dataFlowsContainer = document.getElementById("e2e-data-flows");

  if (!container || !svg || !hub || !layersContainer || !dataFlowsContainer) return;

  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  // Hub position (left side, centered vertically)
  const hubCenterX = containerWidth * 0.22;
  const hubCenterY = containerHeight * 0.5;

  // Stack position (right side)
  const stackX = containerWidth * 0.72;

  // Clear previous SVG content
  const connectionsGroup = svg.getElementById("e2e-connection-lines");
  if (connectionsGroup) {
    connectionsGroup.innerHTML = "";
  }

  // Position layer cards and draw connections
  const layerElements = layersContainer.querySelectorAll(".e2e-layer-card");

  layerElements.forEach((layerEl, index) => {
    const layer = stackLayers[index];
    if (!layer) return;

    const el = layerEl as HTMLElement;
    const layerY = containerHeight * (layer.yPosition / 100);

    // Position the layer card
    el.style.top = `${layerY}px`;
    el.style.left = `${stackX}px`;
    el.style.transform = "translate(-50%, -50%)";

    // Draw connection line from hub to this layer
    if (connectionsGroup) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

      // Create a curved path from hub to layer
      const midX = (hubCenterX + stackX) / 2;
      const controlOffset = (layerY - hubCenterY) * 0.3;

      const d = `M ${hubCenterX} ${hubCenterY}
                 Q ${midX} ${hubCenterY + controlOffset} ${stackX - 80} ${layerY}`;

      path.setAttribute("d", d);
      path.setAttribute("class", "e2e-connection-line");
      path.setAttribute("stroke", layer.color);
      path.setAttribute("stroke-opacity", "0.3");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-dasharray", "6 4");
      path.setAttribute("data-layer", layer.layer);

      connectionsGroup.appendChild(path);
    }
  });

  // Draw main trunk line
  if (connectionsGroup) {
    const trunkLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const trunkEndX = (hubCenterX + stackX) / 2 - 20;

    trunkLine.setAttribute("d", `M ${hubCenterX + 60} ${hubCenterY} L ${trunkEndX} ${hubCenterY}`);
    trunkLine.setAttribute("class", "e2e-trunk-line");
    trunkLine.setAttribute("stroke", "url(#e2e-gradient)");
    trunkLine.setAttribute("stroke-width", "3");
    trunkLine.setAttribute("fill", "none");
    trunkLine.setAttribute("stroke-dasharray", "8 4");

    connectionsGroup.insertBefore(trunkLine, connectionsGroup.firstChild);
  }

  // Start data flow animations
  startDataFlows(container, hubCenterX, hubCenterY, stackX, dataFlowsContainer);
}

function startDataFlows(
  container: HTMLElement,
  hubX: number,
  hubY: number,
  stackX: number,
  flowsContainer: HTMLElement
) {
  const containerRect = container.getBoundingClientRect();
  const containerHeight = containerRect.height;

  function createDataPacket() {
    const packet = document.createElement("div");
    packet.className = "e2e-data-packet";

    // Random layer to travel to/from
    const targetLayer = stackLayers[Math.floor(Math.random() * stackLayers.length)];
    const targetY = containerHeight * (targetLayer.yPosition / 100);

    // Randomly decide direction (to hub or from hub)
    const toHub = Math.random() > 0.5;

    // Set packet color based on layer or random health status
    const isHealthy = Math.random() > 0.2;
    packet.style.background = isHealthy ? "#22c55e" : targetLayer.color;
    packet.style.boxShadow = `0 0 12px ${isHealthy ? "rgba(34, 197, 94, 0.7)" : targetLayer.color}`;

    // Starting position
    if (toHub) {
      packet.style.left = `${stackX - 80}px`;
      packet.style.top = `${targetY}px`;
    } else {
      packet.style.left = `${hubX + 60}px`;
      packet.style.top = `${hubY}px`;
    }

    flowsContainer.appendChild(packet);

    // Animate the packet
    const duration = 2000 + Math.random() * 1500;
    const midX = (hubX + stackX) / 2;
    const controlOffset = (targetY - hubY) * 0.3;

    // Create keyframes for curved path
    const keyframes = toHub
      ? [
          { left: `${stackX - 80}px`, top: `${targetY}px`, opacity: 0 },
          { left: `${stackX - 80}px`, top: `${targetY}px`, opacity: 1, offset: 0.1 },
          { left: `${midX}px`, top: `${hubY + controlOffset}px`, opacity: 1 },
          { left: `${hubX + 60}px`, top: `${hubY}px`, opacity: 1, offset: 0.9 },
          { left: `${hubX + 60}px`, top: `${hubY}px`, opacity: 0 },
        ]
      : [
          { left: `${hubX + 60}px`, top: `${hubY}px`, opacity: 0 },
          { left: `${hubX + 60}px`, top: `${hubY}px`, opacity: 1, offset: 0.1 },
          { left: `${midX}px`, top: `${hubY + controlOffset}px`, opacity: 1 },
          { left: `${stackX - 80}px`, top: `${targetY}px`, opacity: 1, offset: 0.9 },
          { left: `${stackX - 80}px`, top: `${targetY}px`, opacity: 0 },
        ];

    const animation = packet.animate(keyframes, {
      duration,
      easing: "ease-in-out",
    });

    animation.onfinish = () => {
      packet.remove();
    };
  }

  // Create packets at intervals
  function schedulePacket() {
    createDataPacket();
    setTimeout(schedulePacket, 400 + Math.random() * 600);
  }

  // Start with a few packets
  for (let i = 0; i < 3; i++) {
    setTimeout(() => createDataPacket(), i * 300);
  }

  // Continue creating packets
  setTimeout(schedulePacket, 1000);
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initE2EVisualization);
} else {
  initE2EVisualization();
}

// Reinitialize on window resize (debounced)
let resizeTimeout: ReturnType<typeof setTimeout>;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(initE2EVisualization, 250);
});
