// TechStackRing Component
// 2D concentric circles visualization for tech stack

class TechStackRing {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
  }

  render() {
    const container = document.createElement('div');
    container.className = 'card-glass p-6 mb-6';
    
    container.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-4">🔧 Tech Stack</h3>
      <div class="tech-stack-ring-container">
        ${this.renderRings()}
      </div>
    `;
    
    this.addTooltips(container);
    
    return container;
  }

  renderRings() {
    // Get data for each ring
    const innerRing = this.getInnerRing(); // Core runtime
    const middleRing = this.getMiddleRing(); // AI frameworks
    const outerRing = this.getOuterRing(); // Infrastructure
    
    const svgSize = 400;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    
    const innerRadius = 60;
    const middleRadius = 120;
    const outerRadius = 180;
    
    return `
      <div style="width: 100%; display: flex; justify-content: center;">
        <svg width="${svgSize}" height="${svgSize}" style="max-width: 100%; height: auto;" viewBox="0 0 ${svgSize} ${svgSize}">
        <!-- Outer ring - Infrastructure -->
        ${this.renderRing(outerRing, centerX, centerY, outerRadius, middleRadius + 10, '#60a5fa', 'Infrastructure')}
        
        <!-- Middle ring - AI Frameworks -->
        ${this.renderRing(middleRing, centerX, centerY, middleRadius, innerRadius + 10, '#a78bfa', 'AI Frameworks')}
        
        <!-- Inner ring - Core Runtime -->
        ${this.renderRing(innerRing, centerX, centerY, innerRadius, 0, '#34d399', 'Core Runtime')}
      </svg>
      </div>
    `;
  }

  renderRing(items, cx, cy, radius, innerRadius, colorClass, label) {
    if (items.length === 0) return '';
    
    const angleStep = (2 * Math.PI) / items.length;
    const textRadius = radius - 15;
    
    const circles = items.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const textX = cx + textRadius * Math.cos(angle);
      const textY = cy + textRadius * Math.sin(angle);
      
      return `
        <g class="tech-item" data-tech="${this.escapeHtml(item.name)}" data-desc="${this.escapeHtml(item.description || '')}">
          <circle 
            cx="${x}" 
            cy="${y}" 
            r="8" 
            fill="${colorClass}" 
            style="cursor: pointer; opacity: 0.8; transition: transform 0.2s;"
          />
          <text 
            x="${textX}" 
            y="${textY}" 
            text-anchor="${textX > cx ? 'start' : 'end'}"
            dominant-baseline="middle"
            fill="${colorClass}"
            style="font-size: 10px; font-weight: 500; pointer-events: none;"
          >
            ${this.escapeHtml(item.name)}
          </text>
        </g>
      `;
    }).join('');
    
    // Ring circle
    const ringCircle = innerRadius > 0 
      ? `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${colorClass}" stroke-width="1" opacity="0.2" />`
      : '';
    
    return `
      ${ringCircle}
      ${circles}
    `;
  }

  getInnerRing() {
    const runtime = this.repoData.metrics?.language || this.repoData.repository?.language || 'Unknown';
    return [{
      name: runtime,
      description: `Primary programming language: ${runtime}`
    }];
  }

  getMiddleRing() {
    const frameworks = [];
    
    // Get from AI/ML detection
    if (this.analysis.aiMLDetection?.frameworks) {
      this.analysis.aiMLDetection.frameworks.forEach(fw => {
        frameworks.push({
          name: fw.name,
          description: fw.description || `${fw.name} framework`
        });
      });
    }
    
    // Also check dependencies
    if (this.analysis.requirements?.dependencies) {
      const deps = this.analysis.requirements.dependencies;
      const depStr = JSON.stringify(deps).toLowerCase();
      
      const aiFrameworks = [
        { name: 'LangChain', pattern: /langchain/i },
        { name: 'LlamaIndex', pattern: /llamaindex|llama-index/i },
        { name: 'OpenAI SDK', pattern: /openai/i },
        { name: 'PyTorch', pattern: /torch|pytorch/i },
        { name: 'TensorFlow', pattern: /tensorflow/i },
        { name: 'Hugging Face', pattern: /transformers|huggingface/i }
      ];
      
      aiFrameworks.forEach(fw => {
        if (fw.pattern.test(depStr) && !frameworks.find(f => f.name === fw.name)) {
          frameworks.push({
            name: fw.name,
            description: `${fw.name} AI/ML framework`
          });
        }
      });
    }
    
    return frameworks.slice(0, 8); // Limit to 8 items
  }

  getOuterRing() {
    const infra = [];
    
    // Check for infrastructure in dependencies and files
    const deps = this.analysis.requirements?.dependencies || [];
    const depStr = JSON.stringify(deps).toLowerCase();
    const filePaths = (this.analysis.keyFiles || []).map(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return typeof path === 'string' ? path.toLowerCase() : '';
    }).join(' ');
    
    const infraPatterns = [
      { name: 'Postgres', pattern: /postgres|postgresql/i },
      { name: 'Redis', pattern: /redis/i },
      { name: 'Supabase', pattern: /supabase/i },
      { name: 'Vercel', pattern: /vercel/i },
      { name: 'Docker', pattern: /docker/i },
      { name: 'Kubernetes', pattern: /kubernetes|k8s/i },
      { name: 'AWS', pattern: /aws|boto3/i },
      { name: 'GCP', pattern: /google.*cloud|gcp/i }
    ];
    
    infraPatterns.forEach(item => {
      if (item.pattern.test(depStr) || item.pattern.test(filePaths)) {
        infra.push({
          name: item.name,
          description: `${item.name} infrastructure/service`
        });
      }
    });
    
    // Check for Dockerfile
    if (this.hasFile('Dockerfile') && !infra.find(i => i.name === 'Docker')) {
      infra.push({ name: 'Docker', description: 'Containerization' });
    }
    
    return infra.slice(0, 8); // Limit to 8 items
  }

  hasFile(fileName) {
    if (!this.analysis.keyFiles) return false;
    return this.analysis.keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && path.toLowerCase().includes(fileName.toLowerCase());
    });
  }

  addTooltips(container) {
    const items = container.querySelectorAll('.tech-item');
    items.forEach(item => {
      item.addEventListener('mouseenter', (e) => {
        const name = item.dataset.tech;
        const desc = item.dataset.desc;
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tech-tooltip glass-card p-3 text-sm text-white';
        tooltip.innerHTML = `
          <div class="font-bold mb-1">${this.escapeHtml(name)}</div>
          <div class="text-slate-300">${this.escapeHtml(desc)}</div>
        `;
        tooltip.style.position = 'absolute';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1000';
        
        document.body.appendChild(tooltip);
        
        item._tooltip = tooltip;
        
        const rect = item.getBoundingClientRect();
        tooltip.style.left = rect.right + 10 + 'px';
        tooltip.style.top = rect.top + 'px';
      });
      
      item.addEventListener('mouseleave', () => {
        if (item._tooltip) {
          item._tooltip.remove();
          delete item._tooltip;
        }
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
  window.TechStackRing = TechStackRing;
}

