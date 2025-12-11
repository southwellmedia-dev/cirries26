/**
 * Open RAN Network Visualization Script
 *
 * Handles positioning and connection lines for the disaggregated RAN visualization
 */

interface RANNode {
  element: HTMLElement;
  angle: number;
  distance: number;
  x: number;
  y: number;
}

class RANNetworkVisualization {
  private container: HTMLElement | null;
  private svg: SVGElement | null;
  private connectionGroup: SVGGElement | null;
  private meshGroup: SVGGElement | null;
  private nodes: RANNode[] = [];
  private centerX: number = 200;
  private centerY: number = 200;

  constructor() {
    this.container = document.getElementById('ran-network');
    this.svg = document.getElementById('ran-connections-svg') as SVGElement | null;
    this.connectionGroup = document.getElementById('ran-connection-lines') as SVGGElement | null;
    this.meshGroup = document.getElementById('ran-mesh-lines') as SVGGElement | null;

    if (this.container && this.svg) {
      this.init();
    }
  }

  private init(): void {
    this.collectNodes();
    this.positionNodes();
    this.drawConnections();
    this.drawMeshLines();

    window.addEventListener('resize', () => this.handleResize());
  }

  private collectNodes(): void {
    const nodeElements = this.container?.querySelectorAll('.ran-node');
    nodeElements?.forEach((el) => {
      const element = el as HTMLElement;
      const angle = parseFloat(element.dataset.angle || '0');
      const distance = parseFloat(element.dataset.distance || '150');

      const rad = (angle * Math.PI) / 180;
      const x = this.centerX + distance * Math.cos(rad);
      const y = this.centerY + distance * Math.sin(rad);

      this.nodes.push({ element, angle, distance, x, y });
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

    this.connectionGroup.innerHTML = '';

    this.nodes.forEach((node) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', this.centerX.toString());
      line.setAttribute('y1', this.centerY.toString());
      line.setAttribute('x2', node.x.toString());
      line.setAttribute('y2', node.y.toString());
      line.classList.add('ran-connection-line');
      this.connectionGroup?.appendChild(line);
    });
  }

  private drawMeshLines(): void {
    if (!this.meshGroup) return;

    this.meshGroup.innerHTML = '';

    // Connect adjacent nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const nextIndex = (i + 1) % this.nodes.length;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', this.nodes[i].x.toString());
      line.setAttribute('y1', this.nodes[i].y.toString());
      line.setAttribute('x2', this.nodes[nextIndex].x.toString());
      line.setAttribute('y2', this.nodes[nextIndex].y.toString());
      line.classList.add('ran-mesh-line');
      this.meshGroup?.appendChild(line);
    }
  }

  private handleResize(): void {
    this.positionNodes();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RANNetworkVisualization();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  new RANNetworkVisualization();
}
