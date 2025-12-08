// AIMLWorkflowPanel Component
// AI/ML Workflow Detection from enhanced-features-renderer

class AIMLWorkflowPanel {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
  }

  render() {
    const container = document.createElement('div');
    container.className = 'card-glass p-6 mb-6';
    
    const detection = this.analysis.aiMLDetection || {};
    
    if (!detection.hasAIML) {
      container.innerHTML = `
        <h3 class="text-xl font-bold text-white mb-4">🤖 AI/ML Workflow Detection</h3>
        <p class="text-slate-400 text-center py-8">No AI/ML frameworks detected</p>
      `;
      return container;
    }
    
    // Quick info cards
    const quickInfoHTML = this.renderQuickInfoCards(detection);
    
    // Frameworks
    const frameworksHTML = this.renderFrameworks(detection);
    
    // Models
    const modelsHTML = this.renderModels(detection);
    
    // Agentic Systems
    const agentsHTML = this.renderAgenticSystems(detection);
    
    // Workflow stages
    const workflowHTML = this.renderWorkflowStages(detection);
    
    container.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-4">🤖 AI/ML Workflow Detection</h3>
      ${quickInfoHTML}
      ${frameworksHTML}
      ${modelsHTML}
      ${agentsHTML}
      ${workflowHTML}
    `;
    
    return container;
  }

  renderQuickInfoCards(detection) {
    return `
      <div class="ai-quick-info-cards" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 1.5rem;
      ">
        <div class="info-card glass-light p-3 rounded-lg text-center">
          <span class="info-icon" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">💡</span>
          <span class="info-label text-xs text-slate-400 block">AI/ML Detected</span>
          <span class="info-value font-bold text-sm ${detection.hasAIML ? 'text-green-400' : 'text-red-400'}">${detection.hasAIML ? 'Yes' : 'No'}</span>
        </div>
        <div class="info-card glass-light p-3 rounded-lg text-center">
          <span class="info-icon" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🔬</span>
          <span class="info-label text-xs text-slate-400 block">Frameworks</span>
          <span class="info-value font-bold text-sm text-white">${(detection.frameworks || []).length}</span>
        </div>
        <div class="info-card glass-light p-3 rounded-lg text-center">
          <span class="info-icon" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🤖</span>
          <span class="info-label text-xs text-slate-400 block">Agentic Systems</span>
          <span class="info-value font-bold text-sm text-white">${(detection.agenticSystems || []).length}</span>
        </div>
        <div class="info-card glass-light p-3 rounded-lg text-center">
          <span class="info-icon" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🧠</span>
          <span class="info-label text-xs text-slate-400 block">Models</span>
          <span class="info-value font-bold text-sm text-white">${(detection.models || []).length}</span>
        </div>
        <div class="info-card glass-light p-3 rounded-lg text-center">
          <span class="info-icon" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🔄</span>
          <span class="info-label text-xs text-slate-400 block">Workflow Stages</span>
          <span class="info-value font-bold text-sm text-white">${(detection.workflows || []).length}</span>
        </div>
        <div class="info-card glass-light p-3 rounded-lg text-center">
          <span class="info-icon" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🎯</span>
          <span class="info-label text-xs text-slate-400 block">Confidence</span>
          <span class="info-value font-bold text-sm text-white">${detection.confidence || 0}%</span>
        </div>
      </div>
    `;
  }

  renderFrameworks(detection) {
    const frameworks = detection.frameworks || [];
    if (frameworks.length === 0) return '';
    
    return `
      <div class="mb-4">
        <h4 class="text-lg font-semibold text-white mb-3">🔬 Frameworks</h4>
        <div class="frameworks-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${frameworks.map(fw => `
            <div class="framework-item glass-light p-3 rounded-lg" style="min-width: 150px;">
              <div class="flex items-center gap-2 mb-1">
                <span style="font-size: 1.2rem;">${fw.icon || '📦'}</span>
                <span class="font-semibold text-white text-sm">${this.escapeHtml(fw.name || 'Unknown')}</span>
              </div>
              ${fw.description ? `<p class="text-xs text-slate-400">${this.escapeHtml(fw.description)}</p>` : ''}
              ${fw.files && fw.files.length > 0 ? `
                <div class="text-xs text-slate-500 mt-2">
                  Found in: ${fw.files.slice(0, 2).map(f => this.escapeHtml(String(f))).join(', ')}
                  ${fw.files.length > 2 ? ` +${fw.files.length - 2} more` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderModels(detection) {
    const models = detection.models || [];
    if (models.length === 0) return '';
    
    return `
      <div class="mb-4">
        <h4 class="text-lg font-semibold text-white mb-3">🧠 Models</h4>
        <div class="models-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${models.map(model => `
            <div class="model-item glass-light p-3 rounded-lg" style="min-width: 150px;">
              <div class="flex items-center gap-2 mb-1">
                <span style="font-size: 1.2rem;">${model.icon || '🤖'}</span>
                <span class="font-semibold text-white text-sm">${this.escapeHtml(model.name || 'Unknown')}</span>
              </div>
              ${model.type ? `<p class="text-xs text-slate-400">Type: ${this.escapeHtml(model.type)}</p>` : ''}
              ${model.files && model.files.length > 0 ? `
                <div class="text-xs text-slate-500 mt-2">
                  Found in: ${model.files.slice(0, 2).map(f => this.escapeHtml(String(f))).join(', ')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderAgenticSystems(detection) {
    const agents = detection.agenticSystems || [];
    if (agents.length === 0) return '';
    
    return `
      <div class="mb-4">
        <h4 class="text-lg font-semibold text-white mb-3">🤖 Agentic Systems</h4>
        <div class="agents-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${agents.map(agent => `
            <div class="agent-item glass-light p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-all" style="min-width: 150px;" data-files='${JSON.stringify(agent.files || [])}'>
              <div class="flex items-center gap-2 mb-1">
                <span style="font-size: 1.2rem;">${agent.icon || '🤖'}</span>
                <span class="font-semibold text-white text-sm">${this.escapeHtml(agent.name || 'Unknown')}</span>
              </div>
              ${agent.type ? `<p class="text-xs text-slate-400">Type: ${this.escapeHtml(agent.type)}</p>` : ''}
              ${agent.description ? `<p class="text-xs text-slate-300 mt-1">${this.escapeHtml(agent.description.substring(0, 60))}...</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderWorkflowStages(detection) {
    const workflows = detection.workflows || [];
    if (workflows.length === 0) return '';
    
    return `
      <div>
        <h4 class="text-lg font-semibold text-white mb-3">🔄 Workflow Stages</h4>
        <div class="workflow-stages" style="display: flex; flex-direction: column; gap: 12px;">
          ${workflows.map((stage, index) => `
            <div class="workflow-stage glass-light p-4 rounded-lg" style="
              border-left: 3px solid #667eea;
              display: flex;
              align-items: center;
              gap: 12px;
            ">
              <div class="stage-number" style="
                background: #667eea;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
              ">${index + 1}</div>
              <div class="flex-1">
                <div class="stage-name font-semibold text-white mb-1">${this.escapeHtml(stage.name || 'Stage ' + (index + 1))}</div>
                ${stage.description ? `<div class="stage-desc text-sm text-slate-400">${this.escapeHtml(stage.description)}</div>` : ''}
              </div>
              ${index < workflows.length - 1 ? '<div class="stage-arrow text-slate-500">→</div>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
  window.AIMLWorkflowPanel = AIMLWorkflowPanel;
}

