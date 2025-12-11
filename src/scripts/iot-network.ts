/**
 * IoT Network Visualization Script
 *
 * Handles the IoT mesh network visualization with:
 * - Device positioning around central hub
 * - SVG connection lines from hub to devices
 * - Mesh connections between nearby devices
 * - Animated data packets with status-based colors
 */

export function initIoTNetwork(): void {
  const network = document.getElementById("iot-network");
  const svg = document.getElementById("iot-connections-svg");
  const connectionLines = document.getElementById("connection-lines");
  const meshLines = document.getElementById("mesh-lines");
  const dataPacketsContainer = document.getElementById("iot-data-packets");

  if (
    !network ||
    !svg ||
    !connectionLines ||
    !meshLines ||
    !dataPacketsContainer
  ) {
    return;
  }

  const devices = network.querySelectorAll(
    ".iot-device"
  ) as NodeListOf<HTMLElement>;
  const networkRect = network.getBoundingClientRect();
  const centerX = networkRect.width / 2;
  const centerY = networkRect.height / 2;
  const svgNS = "http://www.w3.org/2000/svg";

  // Position devices based on angle and distance data attributes
  devices.forEach((device) => {
    const angle = parseFloat(device.dataset.angle || "0") * (Math.PI / 180);
    const distance = parseFloat(device.dataset.distance || "150");
    const scaleFactor = Math.min(networkRect.width, networkRect.height) / 400;
    const scaledDistance = distance * scaleFactor;

    const x = centerX + Math.cos(angle) * scaledDistance;
    const y = centerY + Math.sin(angle) * scaledDistance;

    device.style.left = `${x}px`;
    device.style.top = `${y}px`;
  });

  // Scale coordinates to SVG viewBox (400x400)
  const scaleX = 400 / networkRect.width;
  const scaleY = 400 / networkRect.height;

  // Draw connection lines from hub (center) to each device
  connectionLines.innerHTML = "";
  devices.forEach((device, index) => {
    const deviceStyle = window.getComputedStyle(device);
    const deviceX = parseFloat(deviceStyle.left) * scaleX;
    const deviceY = parseFloat(deviceStyle.top) * scaleY;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "200");
    line.setAttribute("y1", "200");
    line.setAttribute("x2", String(deviceX));
    line.setAttribute("y2", String(deviceY));
    line.setAttribute("class", "iot-connection-line");
    line.style.animationDelay = `${index * 0.2}s`;
    connectionLines.appendChild(line);
  });

  // Draw mesh connections between nearby devices
  meshLines.innerHTML = "";
  const devicePositions: { x: number; y: number }[] = [];
  devices.forEach((device) => {
    const deviceStyle = window.getComputedStyle(device);
    devicePositions.push({
      x: parseFloat(deviceStyle.left) * scaleX,
      y: parseFloat(deviceStyle.top) * scaleY,
    });
  });

  // Connect devices that are within proximity threshold
  for (let i = 0; i < devicePositions.length; i++) {
    for (let j = i + 1; j < devicePositions.length; j++) {
      const dx = devicePositions[i].x - devicePositions[j].x;
      const dy = devicePositions[i].y - devicePositions[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 120) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(devicePositions[i].x));
        line.setAttribute("y1", String(devicePositions[i].y));
        line.setAttribute("x2", String(devicePositions[j].x));
        line.setAttribute("y2", String(devicePositions[j].y));
        line.setAttribute("class", "iot-mesh-line");
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
    packet.className = `iot-data-packet iot-data-packet--${status}`;
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

  // Animate data packets from all devices to/from hub
  function animateDataPackets(): void {
    devices.forEach((device, index) => {
      const deviceStyle = window.getComputedStyle(device);
      const deviceX = parseFloat(deviceStyle.left);
      const deviceY = parseFloat(deviceStyle.top);
      const status = device.dataset.status || "healthy";

      // Randomly choose direction: to hub or from hub
      const toHub = Math.random() > 0.5;
      const startX = toHub ? deviceX : centerX;
      const startY = toHub ? deviceY : centerY;
      const endX = toHub ? centerX : deviceX;
      const endY = toHub ? centerY : deviceY;

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
      setTimeout(initIoTNetwork, 200)
    );
  } else {
    setTimeout(initIoTNetwork, 200);
  }
}
