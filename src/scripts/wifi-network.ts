/**
 * Wi-Fi Network Visualization
 *
 * Animates the Wi-Fi hub visualization with:
 * - Device nodes positioned around a central hub
 * - Signal connection lines with strength-based styling
 * - Data packet animations traveling along connections
 * - Signal ring pulse animations
 */

interface SignalClasses {
  [key: string]: string;
}

interface PacketClasses {
  [key: string]: string;
}

export function initWifiNetwork(): void {
  const network = document.getElementById("wifi-network");
  const hub = document.getElementById("wifi-hub");
  const svg = document.getElementById("wifi-connections-svg");
  const connectionsGroup = document.getElementById("connection-lines");
  const dataPacketsContainer = document.getElementById("data-packets");

  if (!network || !hub || !svg || !connectionsGroup || !dataPacketsContainer)
    return;

  const deviceNodes = network.querySelectorAll(
    ".device-node"
  ) as NodeListOf<HTMLElement>;
  const networkRect = network.getBoundingClientRect();
  const centerX = networkRect.width / 2;
  const centerY = networkRect.height / 2;

  // Position device nodes in a circle around the hub
  deviceNodes.forEach((node) => {
    const angle = parseFloat(node.dataset.angle || "0") * (Math.PI / 180);
    const distance = parseFloat(node.dataset.distance || "150");

    // Scale distance based on container size
    const scaleFactor = Math.min(networkRect.width, networkRect.height) / 480;
    const scaledDistance = distance * scaleFactor;

    const x = centerX + Math.cos(angle) * scaledDistance;
    const y = centerY + Math.sin(angle) * scaledDistance;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  });

  // Draw connection lines
  connectionsGroup.innerHTML = "";
  const svgNS = "http://www.w3.org/2000/svg";

  // Map signal strength to class names
  const signalClasses: SignalClasses = {
    "1": "wifi-connection-line--weak",
    "2": "wifi-connection-line--medium",
    "3": "wifi-connection-line--strong",
  };

  deviceNodes.forEach((node, index) => {
    const nodeRect = node.getBoundingClientRect();
    const relativeNodeX =
      nodeRect.left - networkRect.left + nodeRect.width / 2;
    const relativeNodeY = nodeRect.top - networkRect.top + nodeRect.height / 2;

    // Scale to SVG viewBox coordinates
    const scaleX = 480 / networkRect.width;
    const scaleY = 480 / networkRect.height;

    const svgNodeX = relativeNodeX * scaleX;
    const svgNodeY = relativeNodeY * scaleY;
    const svgCenterX = 240;
    const svgCenterY = 240;

    // Get signal strength from data attribute
    const signalStrength = node.dataset.signal || "3";
    const signalClass =
      signalClasses[signalStrength] || "wifi-connection-line--strong";

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", String(svgCenterX));
    line.setAttribute("y1", String(svgCenterY));
    line.setAttribute("x2", String(svgNodeX));
    line.setAttribute("y2", String(svgNodeY));
    line.setAttribute("class", `wifi-connection-line ${signalClass}`);
    line.style.animationDelay = `${index * 0.3}s`;
    connectionsGroup.appendChild(line);
  });

  // Map signal strength to packet class names
  const packetClasses: PacketClasses = {
    "1": "data-packet--weak",
    "2": "data-packet--medium",
    "3": "data-packet--strong",
  };

  // Create animated data packets
  function createDataPacket(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    delay: number,
    signalStrength: string
  ): void {
    const packet = document.createElement("div");
    const packetClass = packetClasses[signalStrength] || "data-packet--strong";
    packet.className = `data-packet ${packetClass}`;
    packet.style.left = `${startX}px`;
    packet.style.top = `${startY}px`;
    packet.style.opacity = "0";

    dataPacketsContainer?.appendChild(packet);

    setTimeout(() => {
      packet.style.transition = "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)";
      packet.style.opacity = "1";
      packet.style.left = `${endX}px`;
      packet.style.top = `${endY}px`;

      setTimeout(() => {
        packet.style.opacity = "0";
        setTimeout(() => packet.remove(), 300);
      }, 1000);
    }, delay);
  }

  // Animate data packets periodically
  function animateDataPackets(): void {
    deviceNodes.forEach((node, index) => {
      const nodeStyle = window.getComputedStyle(node);
      const nodeX = parseFloat(nodeStyle.left);
      const nodeY = parseFloat(nodeStyle.top);
      const signalStrength = node.dataset.signal || "3";

      // Random direction: to hub or from hub
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
        index * 400 + Math.random() * 600,
        signalStrength
      );
    });
  }

  // Initial animation
  setTimeout(animateDataPackets, 500);

  // Repeat animation
  setInterval(animateDataPackets, 4000);
}

// Auto-initialize if DOM is ready
export function initWifiNetworkOnReady(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initWifiNetwork, 150);
    });
  } else {
    setTimeout(initWifiNetwork, 150);
  }
}
