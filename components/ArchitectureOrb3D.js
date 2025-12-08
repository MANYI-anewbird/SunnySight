// ArchitectureOrb3D Component
// 3D visualization of architecture using CSS 3D transforms

class ArchitectureOrb3D {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
    this.graph = null;
    this.rotation = { x: 0, y: 0 };
  }

  render() {
    const container = document.createElement('div');
    container.className = 'card-glass p-6 mb-6';
    
    // Generate graph structure
    this.graph = GraphGenerator.generateFromAnalysis(this.analysis, this.repoData);
    
    container.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-4">🌐 Architecture Orb</h3>
      <div class="orb-container" style="height: 400px; perspective: 1000px;">
        <div class="orb-scene" style="
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        ">
          ${this.renderNodes()}
          ${this.renderEdges()}
        </div>
        <div class="orb-controls text-center mt-4">
          <div class="text-sm text-slate-400">Drag or rotate to explore</div>
        </div>
      </div>
    `;
    
    this.addInteractivity(container);
    
    return container;
  }

  renderNodes() {
    if (!this.graph || !this.graph.nodes) return '';
    
    return this.graph.nodes.map(node => {
      const typeColors = {
        service: '#3b82f6',
        frontend: '#8b5cf6',
        storage: '#10b981',
        worker: '#f59e0b',
        external: '#ef4444',
        ml: '#ec4899'
      };
      
      const color = typeColors[node.type] || '#64748b';
      const size = node.type === 'ml' ? 20 : 15;
      
      // Convert 3D coordinates to CSS 3D transform
      const scale = 50; // Scale factor for visualization
      const translateX = node.x * scale;
      const translateY = node.y * scale;
      const translateZ = node.z * scale;
      
      return `
        <div 
          class="orb-node" 
          data-node-id="${node.id}"
          style="
            position: absolute;
            left: 50%;
            top: 50%;
            width: ${size}px;
            height: ${size}px;
            margin-left: -${size/2}px;
            margin-top: -${size/2}px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 0 20px ${color}80;
            cursor: pointer;
            transition: all 0.3s ease;
            transform: translate3d(${translateX}px, ${translateY}px, ${translateZ}px);
          "
          title="${node.label} (${node.type})"
        >
          <div class="node-label" style="
            position: absolute;
            white-space: nowrap;
            left: 50%;
            top: ${size + 5}px;
            transform: translateX(-50%);
            font-size: 10px;
            color: #fff;
            background: rgba(0, 0, 0, 0.7);
            padding: 2px 6px;
            border-radius: 4px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
          ">${node.label}</div>
        </div>
      `;
    }).join('');
  }

  renderEdges() {
    if (!this.graph || !this.graph.edges) return '';
    
    // For CSS 3D, we'll use SVG lines positioned absolutely
    // This is a simplified version - for better 3D edges, use Three.js
    return this.graph.edges.map((edge, index) => {
      const fromNode = this.graph.nodes.find(n => n.id === edge.from);
      const toNode = this.graph.nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return '';
      
      const scale = 50;
      const x1 = 200 + fromNode.x * scale;
      const y1 = 200 + fromNode.y * scale;
      const x2 = 200 + toNode.x * scale;
      const y2 = 200 + toNode.y * scale;
      
      return `
        <svg 
          class="orb-edge" 
          style="
            position: absolute;
            left: 0;
            top: 0;
            width: 400px;
            height: 400px;
            pointer-events: none;
            z-index: 1;
          "
        >
          <line 
            x1="${x1}" 
            y1="${y1}" 
            x2="${x2}" 
            y2="${y2}" 
            stroke="rgba(100, 116, 139, 0.3)" 
            stroke-width="1"
          />
        </svg>
      `;
    }).join('');
  }

  addInteractivity(container) {
    const scene = container.querySelector('.orb-scene');
    const nodes = container.querySelectorAll('.orb-node');
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentRotation = { x: 0, y: 0 };
    
    // Mouse drag rotation
    scene.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      currentRotation.y += deltaX * 0.5;
      currentRotation.x -= deltaY * 0.5;
      
      scene.style.transform = `rotateX(${currentRotation.x}deg) rotateY(${currentRotation.y}deg)`;
      
      startX = e.clientX;
      startY = e.clientY;
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // Node hover effects
    nodes.forEach(node => {
      const label = node.querySelector('.node-label');
      
      node.addEventListener('mouseenter', () => {
        node.style.transform += ' scale(1.3)';
        if (label) label.style.opacity = '1';
      });
      
      node.addEventListener('mouseleave', () => {
        const style = node.getAttribute('style');
        const newStyle = style.replace(/scale\([^)]+\)/g, '');
        node.setAttribute('style', newStyle);
        if (label) label.style.opacity = '0';
      });
      
      node.addEventListener('click', () => {
        const nodeId = node.dataset.nodeId;
        this.onNodeClick(nodeId);
      });
    });
    
    // Auto-rotation animation
    let autoRotateY = 0;
    setInterval(() => {
      if (!isDragging) {
        autoRotateY += 0.2;
        scene.style.transform = `rotateX(${currentRotation.x}deg) rotateY(${currentRotation.y + autoRotateY}deg)`;
      }
    }, 50);
  }

  onNodeClick(nodeId) {
    // Emit custom event for node click
    const event = new CustomEvent('orbNodeClick', {
      detail: { nodeId, graph: this.graph }
    });
    document.dispatchEvent(event);
    
    console.log('Node clicked:', nodeId);
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ArchitectureOrb3D = ArchitectureOrb3D;
}

