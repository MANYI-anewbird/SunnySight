// Graph Generator Utility
// Generates node/edge graph structure from repository analysis

class GraphGenerator {
  static generateFromAnalysis(analysis, repoData) {
    const nodes = [];
    const edges = [];
    
    // Extract components from analysis
    const components = this.extractComponents(analysis, repoData);
    
    // Create nodes
    components.forEach((comp, index) => {
      nodes.push({
        id: comp.id,
        label: comp.label,
        type: comp.type,
        x: 0, // Will be positioned by 3D layout
        y: 0,
        z: 0
      });
    });
    
    // Create edges (relationships)
    components.forEach(comp => {
      comp.connections?.forEach(connId => {
        edges.push({
          from: comp.id,
          to: connId
        });
      });
    });
    
    // Apply 3D layout (spherical distribution)
    this.apply3DLayout(nodes);
    
    return { nodes, edges };
  }

  static extractComponents(analysis, repoData) {
    const components = [];
    
    // API/Server component
    if (this.hasComponent(analysis, ['api', 'server', 'routes', 'endpoints'])) {
      components.push({
        id: 'api',
        label: 'API Server',
        type: 'service',
        connections: ['db', 'external']
      });
    }
    
    // UI/Frontend component
    if (this.hasComponent(analysis, ['ui', 'frontend', 'client', 'react', 'vue', 'angular'])) {
      components.push({
        id: 'ui',
        label: 'UI/Frontend',
        type: 'frontend',
        connections: ['api']
      });
    }
    
    // Database component
    if (this.hasComponent(analysis, ['db', 'database', 'postgres', 'mysql', 'mongodb', 'redis'])) {
      components.push({
        id: 'db',
        label: 'Database',
        type: 'storage',
        connections: []
      });
    }
    
    // Workers/Background jobs
    if (this.hasComponent(analysis, ['worker', 'job', 'queue', 'task', 'celery'])) {
      components.push({
        id: 'workers',
        label: 'Workers',
        type: 'worker',
        connections: ['db', 'external']
      });
    }
    
    // External APIs
    if (analysis.aiMLDetection || this.hasExternalAPIs(analysis)) {
      components.push({
        id: 'external',
        label: 'External APIs',
        type: 'external',
        connections: []
      });
    }
    
    // ML/AI Models
    if (analysis.aiMLDetection?.hasAIML) {
      components.push({
        id: 'models',
        label: 'AI/ML Models',
        type: 'ml',
        connections: ['api', 'workers']
      });
    }
    
    // Ensure at least API node
    if (components.length === 0) {
      components.push({
        id: 'api',
        label: 'Application',
        type: 'service',
        connections: []
      });
    }
    
    return components;
  }

  static hasComponent(analysis, keywords) {
    const keyFiles = analysis.keyFiles || [];
    const filePaths = keyFiles.map(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return typeof path === 'string' ? path.toLowerCase() : '';
    }).join(' ');
    
    const summary = (analysis.summary || '').toLowerCase();
    const pipeline = (analysis.pipeline || '').toLowerCase();
    
    const allText = filePaths + ' ' + summary + ' ' + pipeline;
    
    return keywords.some(keyword => allText.includes(keyword));
  }

  static hasExternalAPIs(analysis) {
    const deps = analysis.requirements?.dependencies || [];
    const depStr = JSON.stringify(deps).toLowerCase();
    
    return /openai|anthropic|langchain|api/.test(depStr);
  }

  static apply3DLayout(nodes) {
    // Spherical distribution for 3D visualization
    const count = nodes.length;
    const radius = 2.5;
    
    if (count === 1) {
      nodes[0].x = 0;
      nodes[0].y = 0;
      nodes[0].z = 0;
      return;
    }
    
    // Fibonacci sphere distribution
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    nodes.forEach((node, i) => {
      const theta = goldenAngle * i;
      const y = 1 - (2 * i) / (count - 1);
      const r = Math.sqrt(1 - y * y);
      
      node.x = r * Math.cos(theta) * radius;
      node.z = r * Math.sin(theta) * radius;
      node.y = y * radius;
    });
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.GraphGenerator = GraphGenerator;
}

