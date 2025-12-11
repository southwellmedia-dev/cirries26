/**
 * Mobile Network Visualization Script
 *
 * Handles:
 * - Node positioning around central hub
 * - Connection lines between nodes and hub
 * - Animated data flow packets
 */

interface MobileNode {
  element: HTMLElement;
  angle: number;
  distance: number;
  color: string;
  x: number;
  y: number;
}

class MobileNetworkVisualization {
  private container: HTMLElement | null;
  private svg: SVGElement | null;
  private connectionGroup: SVGGElement | null;
  private meshGroup: SVGGElement | null;
  private dataFlowContainer: HTMLElement | null;
  private nodes: MobileNode[] = [];
  private centerX: number = 200;
  private centerY: number = 200;
  private animationFrame: number | null = null;

  constructor() {
    this.container = document.getElementById('mobile-network');
    this.svg = document.getElementById('mobile-connections-svg') as SVGElement | null;
    this.connectionGroup = document.getElementById('mobile-connection-lines') as SVGGElement | null;
    this.meshGroup = document.getElementById('mobile-mesh-lines') as SVGGElement | null;
    this.dataFlowContainer = document.getElementById('mobile-data-flows');

    if (this.container && this.svg) {
      this.init();
    }
  }

  private init(): void {
    this.collectNodes();
    this.positionNodes();
    this.drawConnections();
    this.drawMeshLines();
    this.startDataFlows();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private collectNodes(): void {
    const nodeElements = this.container?.querySelectorAll('.mobile-node');
    nodeElements?.forEach((el) => {
      const element = el as HTMLElement;
      const angle = parseFloat(element.dataset.angle || '0');
      const distance = parseFloat(element.dataset.distance || '150');
      const color = element.dataset.color || '#8B5CF6';

      // Calculate position
      const rad = (angle * Math.PI) / 180;
      const x = this.centerX + distance * Math.cos(rad);
      const y = this.centerY + distance * Math.sin(rad);

      this.nodes.push({ element, angle, distance, color, x, y });
    });
  }

  private positionNodes(): void {
    if (!this.container) return;

    const containerRect = this.container.getBoundingClientRect();
    const scale = containerRect.width / 400;

    this.nodes.forEach((node) => {
      const pixelX = node.x * scale;
      const pixelY = node.y * scale;
      node.element.style.left = `${pixelX}px`;
      node.element.style.top = `${pixelY}px`;
    });
  }

  private drawConnections(): void {
    if (!this.connectionGroup) return;

    // Clear existing
    this.connectionGroup.innerHTML = '';

    this.nodes.forEach((node) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', this.centerX.toString());
      line.setAttribute('y1', this.centerY.toString());
      line.setAttribute('x2', node.x.toString());
      line.setAttribute('y2', node.y.toString());
      line.classList.add('mobile-connection-line');
      this.connectionGroup?.appendChild(line);
    });
  }

  private drawMeshLines(): void {
    if (!this.meshGroup) return;

    // Clear existing
    this.meshGroup.innerHTML = '';

    // Draw connections between adjacent nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const nextIndex = (i + 1) % this.nodes.length;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', this.nodes[i].x.toString());
      line.setAttribute('y1', this.nodes[i].y.toString());
      line.setAttribute('x2', this.nodes[nextIndex].x.toString());
      line.setAttribute('y2', this.nodes[nextIndex].y.toString());
      line.classList.add('mobile-mesh-line');
      this.meshGroup?.appendChild(line);
    }
  }

  private startDataFlows(): void {
    // Create data flow packets periodically
    setInterval(() => this.createDataPacket(), 1500);
  }

  private createDataPacket(): void {
    if (!this.dataFlowContainer || !this.container || this.nodes.length === 0) return;

    const containerRect = this.container.getBoundingClientRect();
    const scale = containerRect.width / 400;

    // Pick random source node
    const sourceNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];

    // Create packet element
    const packet = document.createElement('div');
    packet.className = 'mobile-data-flow mobile-data-flow--healthy';

    // Random health status
    const rand = Math.random();
    if (rand > 0.85) {
      packet.className = 'mobile-data-flow mobile-data-flow--warning';
    }

    // Starting position
    const startX = sourceNode.x * scale;
    const startY = sourceNode.y * scale;
    const endX = this.centerX * scale;
    const endY = this.centerY * scale;

    packet.style.left = `${startX}px`;
    packet.style.top = `${startY}px`;

    this.dataFlowContainer.appendChild(packet);

    // Animate to center
    const duration = 1200 + Math.random() * 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentX = startX + (endX - startX) * eased;
      const currentY = startY + (endY - startY) * eased;

      packet.style.left = `${currentX}px`;
      packet.style.top = `${currentY}px`;
      packet.style.opacity = progress < 0.1 ? (progress * 10).toString() :
                             progress > 0.8 ? ((1 - progress) * 5).toString() : '1';

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        packet.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  private handleResize(): void {
    this.positionNodes();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MobileNetworkVisualization();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  new MobileNetworkVisualization();
}
