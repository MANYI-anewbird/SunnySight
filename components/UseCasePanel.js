// UseCasePanel Component
// Right sidebar with use cases and playground presets

class UseCasePanel {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
  }

  render() {
    const panel = document.createElement('div');
    panel.className = 'use-case-panel';
    
    panel.innerHTML = `
      <div class="card-glass p-6 mb-6">
        <h3 class="text-lg font-bold text-white mb-4">💡 Suggested Use Cases</h3>
        <div class="use-cases-list">
          ${this.renderUseCases()}
        </div>
      </div>
      
      <div class="card-glass p-6">
        <h3 class="text-lg font-bold text-white mb-4">🎮 Playground Presets</h3>
        <div class="playground-presets">
          ${this.renderPlaygroundPresets()}
        </div>
      </div>
    `;
    
    this.addCopyHandlers(panel);
    
    return panel;
  }

  renderUseCases() {
    const useCases = this.analysis.useCases || [];
    
    if (useCases.length === 0) {
      return '<p class="text-slate-400 text-sm text-center py-4">No use cases available</p>';
    }
    
    const icons = ['👤', '📊', '🔧', '🎯', '🚀'];
    
    return useCases.slice(0, 3).map((useCase, index) => {
      const text = typeof useCase === 'string' ? useCase : JSON.stringify(useCase);
      const icon = icons[index % icons.length];
      
      // Extract persona and action from use case text
      const personaMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+can/);
      const persona = personaMatch ? personaMatch[1] : 'User';
      
      return `
        <div class="use-case-pill glass-light p-4 mb-3 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5">
          <div class="flex items-start gap-3">
            <span class="text-xl flex-shrink-0">${icon}</span>
            <div class="flex-1">
              <div class="text-sm font-semibold text-white mb-1">${this.escapeHtml(persona)}</div>
              <div class="text-xs text-slate-300 leading-relaxed">${this.escapeHtml(text)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPlaygroundPresets() {
    const presets = this.generatePresets();
    
    if (presets.length === 0) {
      return '<p class="text-slate-400 text-sm text-center py-4">No presets available</p>';
    }
    
    return presets.map(preset => {
      return `
        <div class="preset-card glass-light p-4 mb-3 rounded-lg border border-white/10 hover:shadow-lg transition-all duration-300">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-white">${this.escapeHtml(preset.title)}</span>
            <button 
              class="copy-preset-btn px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-all duration-200"
              data-preset="${this.escapeHtml(preset.content)}"
            >
              📋
            </button>
          </div>
          <pre class="code-block text-xs text-slate-300 font-mono bg-slate-900 rounded p-2 overflow-x-auto border border-slate-700/60"><code>${this.escapeHtml(preset.content)}</code></pre>
        </div>
      `;
    }).join('');
  }

  generatePresets() {
    const presets = [];
    
    // Generate API endpoint examples
    const keyFiles = this.analysis.keyFiles || [];
    const hasAPI = keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && (path.toLowerCase().includes('api') || 
                      path.toLowerCase().includes('route') || 
                      path.toLowerCase().includes('endpoint'));
    });
    
    if (hasAPI) {
      presets.push({
        title: 'API Request',
        content: 'curl -X POST http://localhost:3000/api/endpoint \\\n  -H "Content-Type: application/json" \\\n  -d \'{"key": "value"}\''
      });
    }
    
    // Generate prompt examples from system messages
    if (this.analysis.systemMessages?.systemMessages) {
      const firstMessage = this.analysis.systemMessages.systemMessages[0];
      if (firstMessage && firstMessage.text) {
        const shortPrompt = firstMessage.text.substring(0, 200);
        presets.push({
          title: 'System Prompt',
          content: shortPrompt
        });
      }
    }
    
    // Generate Python example if Python project
    const language = this.repoData.metrics?.language || '';
    if (language.toLowerCase() === 'python') {
      presets.push({
        title: 'Python Example',
        content: 'from main import run\n\nresult = run()\nprint(result)'
      });
    }
    
    return presets.slice(0, 3); // Limit to 3 presets
  }

  addCopyHandlers(panel) {
    panel.querySelectorAll('.copy-preset-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const content = btn.dataset.preset;
        try {
          await navigator.clipboard.writeText(content);
          btn.innerHTML = '✅';
          setTimeout(() => {
            btn.innerHTML = '📋';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/"/g, '&quot;');
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.UseCasePanel = UseCasePanel;
}

