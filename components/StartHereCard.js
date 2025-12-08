// StartHereCard Component
// Hero card showing repo summary, best file to open, and quickstart command

class StartHereCard {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
  }

  render() {
    const card = document.createElement('div');
    card.className = 'card-glass p-6 mb-6 hover:shadow-xl transition-all duration-300';
    
    // Extract data
    const summary = this.analysis.summary || 'No summary available.';
    const summarySentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0).slice(0, 2);
    const twoSentenceSummary = summarySentences.map(s => s.trim() + '.').join(' ');
    
    const bestFile = this.getBestFile();
    const quickstartCommand = this.getQuickstartCommand();
    
    card.innerHTML = `
      <div class="mb-4">
        <h2 class="text-2xl font-bold text-white mb-2">🚀 Start Here</h2>
        <p class="text-slate-300 text-base leading-relaxed">${this.escapeHtml(twoSentenceSummary)}</p>
      </div>
      
      ${bestFile ? `
        <div class="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div class="text-sm text-slate-400 mb-1">📄 Best file to open:</div>
          <div class="text-slate-200 font-medium font-mono text-sm">${this.escapeHtml(bestFile)}</div>
        </div>
      ` : ''}
      
      ${quickstartCommand ? `
        <div class="p-4 bg-slate-900 rounded-lg border border-slate-700/60">
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm text-slate-400 font-medium">⚡ Quickstart</div>
            <button 
              class="copy-btn px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
              data-command="${this.escapeHtml(quickstartCommand)}"
              onclick="this.copyToClipboard(this.dataset.command)"
            >
              📋 Copy
            </button>
          </div>
          <pre class="code-block text-sm text-slate-200 font-mono p-3 bg-slate-800 rounded overflow-x-auto"><code>${this.escapeHtml(quickstartCommand)}</code></pre>
        </div>
      ` : ''}
    `;
    
    // Add copy functionality
    this.addCopyHandler(card);
    
    return card;
  }

  getBestFile() {
    if (!this.analysis.keyFiles || this.analysis.keyFiles.length === 0) {
      return null;
    }
    
    // Priority: main entry points > config files > others
    const keyFiles = this.analysis.keyFiles;
    
    // Find main entry points first
    const entryPoints = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      const pathLower = path.toLowerCase();
      return pathLower.includes('main') || 
             pathLower.includes('index') || 
             pathLower.includes('app') ||
             pathLower.includes('server') ||
             pathLower.includes('run');
    });
    
    if (entryPoints.length > 0) {
      const file = entryPoints[0];
      return typeof file === 'string' ? file : (file.path || file);
    }
    
    // Fallback to first key file
    const firstFile = keyFiles[0];
    return typeof firstFile === 'string' ? firstFile : (firstFile.path || firstFile);
  }

  getQuickstartCommand() {
    // Check for installation commands
    if (this.analysis.requirements?.installation) {
      const install = this.analysis.requirements.installation;
      if (install.toLowerCase().includes('pip')) {
        return 'pip install -r requirements.txt && python main.py';
      } else if (install.toLowerCase().includes('npm')) {
        return 'npm install && npm run dev';
      } else if (install.toLowerCase().includes('yarn')) {
        return 'yarn install && yarn dev';
      }
    }
    
    // Check dependencies to infer command
    const deps = this.analysis.requirements?.dependencies || [];
    const depStr = JSON.stringify(deps).toLowerCase();
    
    if (depStr.includes('package.json') || this.hasFile('package.json')) {
      return 'npm install && npm start';
    } else if (depStr.includes('requirements.txt') || this.hasFile('requirements.txt')) {
      return 'pip install -r requirements.txt && python main.py';
    } else if (this.hasFile('Dockerfile')) {
      return 'docker build -t repo . && docker run repo';
    }
    
    // Check language
    const language = this.repoData.metrics?.language || this.repoData.repository?.language || '';
    if (language.toLowerCase() === 'python') {
      return 'pip install -r requirements.txt && python main.py';
    } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
      return 'npm install && npm start';
    }
    
    return null;
  }

  hasFile(fileName) {
    if (!this.analysis.keyFiles) return false;
    return this.analysis.keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && path.toLowerCase().includes(fileName.toLowerCase());
    });
  }

  addCopyHandler(card) {
    // Add global copy function if not exists
    if (typeof window.copyToClipboard === 'undefined') {
      window.copyToClipboard = async function(text) {
        try {
          await navigator.clipboard.writeText(text);
          const btn = event.target.closest('.copy-btn');
          if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅ Copied!';
            btn.disabled = true;
            setTimeout(() => {
              btn.innerHTML = original;
              btn.disabled = false;
            }, 2000);
          }
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      };
    }
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
  window.StartHereCard = StartHereCard;
}

