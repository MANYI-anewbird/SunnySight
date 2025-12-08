// AgentGraphPanel Component
// 2D force-directed graph for agents/tools/routers

class AgentGraphPanel {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
    this.nodes = [];
    this.edges = [];
    this.selectedNode = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'card-glass p-6 mb-6';
    
    const agents = this.extractAgents();
    
    if (agents.nodes.length === 0) {
      container.innerHTML = `
        <h3 class="text-xl font-bold text-white mb-4">🤖 Agent Graph</h3>
        <p class="text-slate-400 text-center py-8">No agentic systems detected</p>
      `;
      return container;
    }
    
    this.nodes = agents.nodes;
    this.edges = agents.edges;
    
    container.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-4">🤖 Agent Graph</h3>
      <div class="agent-graph-container" style="
        width: 100%;
        height: 500px;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 0.75rem;
        border: 1px solid rgba(51, 65, 85, 0.6);
        position: relative;
        overflow: hidden;
      ">
        <svg class="agent-graph-svg" style="width: 100%; height: 100%;">
          ${this.renderEdges()}
          ${this.renderNodes()}
        </svg>
      </div>
    `;
    
    this.addForceSimulation(container);
    this.addNodeInteractivity(container);
    
    return container;
  }

  extractAgents() {
    const nodes = [];
    const edges = [];
    
    // Get agents from AI/ML detection
    if (this.analysis.aiMLDetection?.agenticSystems) {
      this.analysis.aiMLDetection.agenticSystems.forEach((agent, index) => {
        nodes.push({
          id: `agent-${index}`,
          label: agent.name,
          type: agent.type || 'agent',
          files: agent.files || [],
          x: Math.random() * 400 + 50,
          y: Math.random() * 400 + 50,
          vx: 0,
          vy: 0
        });
      });
    }
    
    // Get tools
    const keyFiles = this.analysis.keyFiles || [];
    const toolFiles = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && path.toLowerCase().includes('tool');
    });
    
    toolFiles.forEach((file, index) => {
      nodes.push({
        id: `tool-${index}`,
        label: typeof file === 'string' ? file.split('/').pop() : (file.path || '').split('/').pop(),
        type: 'tool',
        files: [typeof file === 'string' ? file : (file.path || file)],
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
        vx: 0,
        vy: 0
      });
    });
    
    // Create edges (connections between agents and tools)
    nodes.forEach(node => {
      if (node.type === 'agent') {
        nodes.filter(n => n.type === 'tool').forEach(tool => {
          edges.push({
            from: node.id,
            to: tool.id
          });
        });
      }
    });
    
    return { nodes, edges };
  }

  renderNodes() {
    return this.nodes.map(node => {
      const colors = {
        agent: '#8b5cf6',
        tool: '#3b82f6',
        router: '#10b981'
      };
      
      const color = colors[node.type] || '#64748b';
      const size = node.type === 'agent' ? 12 : 8;
      
      return `
        <g class="agent-node" data-node-id="${node.id}">
          <circle 
            cx="${node.x}" 
            cy="${node.y}" 
            r="${size}" 
            fill="${color}"
            stroke="rgba(255, 255, 255, 0.3)"
            stroke-width="2"
            class="cursor-pointer"
            style="transition: all 0.2s;"
          />
          <text 
            x="${node.x}" 
            y="${node.y + size + 15}" 
            text-anchor="middle"
            fill="#ffffff"
            font-size="10"
            font-weight="500"
          >${this.escapeHtml(node.label)}</text>
        </g>
      `;
    }).join('');
  }

  renderEdges() {
    return this.edges.map(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return '';
      
      return `
        <line 
          x1="${fromNode.x}" 
          y1="${fromNode.y}" 
          x2="${toNode.x}" 
          y2="${toNode.y}" 
          stroke="rgba(100, 116, 139, 0.3)" 
          stroke-width="1"
        />
      `;
    }).join('');
  }

  addForceSimulation(container) {
    const svg = container.querySelector('.agent-graph-svg');
    if (!svg) return;
    
    const width = 500;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Simple force simulation
    const forceStrength = 0.01;
    const repulsionStrength = 1000;
    const attractionStrength = 0.001;
    
    const animate = () => {
      // Apply forces
      this.nodes.forEach(node => {
        let fx = 0;
        let fy = 0;
        
        // Center attraction
        fx += (centerX - node.x) * attractionStrength;
        fy += (centerY - node.y) * attractionStrength;
        
        // Node repulsion
        this.nodes.forEach(other => {
          if (other.id === node.id) return;
          
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          fx += (dx / dist) * repulsionStrength / (dist * dist);
          fy += (dy / dist) * repulsionStrength / (dist * dist);
        });
        
        // Edge attraction
        this.edges.forEach(edge => {
          if (edge.from === node.id) {
            const toNode = this.nodes.find(n => n.id === edge.to);
            if (toNode) {
              const dx = toNode.x - node.x;
              const dy = toNode.y - node.y;
              fx += dx * attractionStrength * 10;
              fy += dy * attractionStrength * 10;
            }
          }
        });
        
        // Update velocity
        node.vx = (node.vx + fx) * 0.85;
        node.vy = (node.vy + fy) * 0.85;
        
        // Update position
        node.x += node.vx;
        node.y += node.vy;
        
        // Boundary constraints
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      });
      
      // Update SVG
      this.updateSVG(svg);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  updateSVG(svg) {
    // Update node positions
    this.nodes.forEach(node => {
      const nodeGroup = svg.querySelector(`[data-node-id="${node.id}"]`);
      if (nodeGroup) {
        const circle = nodeGroup.querySelector('circle');
        const text = nodeGroup.querySelector('text');
        
        if (circle) {
          circle.setAttribute('cx', node.x);
          circle.setAttribute('cy', node.y);
        }
        if (text) {
          text.setAttribute('x', node.x);
          text.setAttribute('y', node.y + 15);
        }
      }
    });
    
    // Update edge positions
    this.edges.forEach((edge, index) => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        const line = svg.querySelectorAll('line')[index];
        if (line) {
          line.setAttribute('x1', fromNode.x);
          line.setAttribute('y1', fromNode.y);
          line.setAttribute('x2', toNode.x);
          line.setAttribute('y2', toNode.y);
        }
      }
    });
  }

  addNodeInteractivity(container) {
    const svg = container.querySelector('.agent-graph-svg');
    if (!svg) return;
    
    svg.addEventListener('click', (e) => {
      const nodeGroup = e.target.closest('.agent-node');
      if (nodeGroup) {
        const nodeId = nodeGroup.dataset.nodeId;
        const node = this.nodes.find(n => n.id === nodeId);
        
        if (node) {
          // Emit event to open in code editor
          const event = new CustomEvent('openAgentInEditor', {
            detail: { node, files: node.files }
          });
          document.dispatchEvent(event);
          
          // Visual feedback
          nodeGroup.style.transform = 'scale(1.3)';
          setTimeout(() => {
            nodeGroup.style.transform = 'scale(1)';
          }, 200);
        }
      }
    });
    
    // Hover effects
    const nodes = svg.querySelectorAll('.agent-node circle');
    nodes.forEach(circle => {
      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('r', parseInt(circle.getAttribute('r')) * 1.5);
      });
      
      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', parseInt(circle.getAttribute('r')) / 1.5);
      });
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.AgentGraphPanel = AgentGraphPanel;
}

