// RepoSidebar Component
// Left sidebar with repo selection and basic stats

class RepoSidebar {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
  }

  render() {
    const sidebar = document.createElement('div');
    sidebar.className = 'repo-sidebar';
    sidebar.style.cssText = 'width: 280px; background: rgba(15, 23, 42, 0.95); border-right: 1px solid rgba(51, 65, 85, 0.6); padding: 1.5rem; height: 100vh; overflow-y: auto;';
    
    const repo = this.repoData.repository || {};
    const metrics = this.repoData.metrics || {};
    
    sidebar.innerHTML = `
      <div class="sidebar-header mb-6">
        <h2 class="text-xl font-bold text-white mb-2">📂 Repository</h2>
        <div class="repo-name text-sm text-slate-300 font-mono break-all">
          ${this.escapeHtml(repo.name || 'Unknown')}
        </div>
        ${repo.url ? `
          <a 
            href="${this.escapeHtml(repo.url)}" 
            target="_blank" 
            class="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
          >
            View on GitHub →
          </a>
        ` : ''}
      </div>
      
      <div class="stats-section mb-6">
        <h3 class="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Statistics</h3>
        <div class="stats-grid grid grid-cols-2 gap-3">
          ${this.renderStatCard('⭐', 'Stars', metrics.stars || 0)}
          ${this.renderStatCard('🍴', 'Forks', metrics.forks || 0)}
          ${this.renderStatCard('💻', 'Language', metrics.language || 'Unknown')}
          ${this.renderStatCard('📅', 'Updated', this.formatDate(repo.lastPushed || repo.updated_at))}
        </div>
      </div>
      
      ${this.analysis.health ? `
        <div class="health-mini mb-6">
          <h3 class="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Health</h3>
          <div class="card-glass p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-white mb-1">${this.analysis.health.score || 0}</div>
              <div class="text-xs text-slate-400 uppercase">Score</div>
              <div class="mt-2">
                <span class="status-badge px-2 py-1 text-xs rounded-full bg-blue-600/20 text-blue-300 border border-blue-600/40">
                  ${(this.analysis.health.status || 'unknown').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${this.analysis.keyFiles && this.analysis.keyFiles.length > 0 ? `
        <div class="quick-files mb-6">
          <h3 class="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Quick Files</h3>
          <div class="file-list">
            ${this.analysis.keyFiles.slice(0, 5).map(file => {
              const path = typeof file === 'string' ? file : (file.path || file);
              const name = path.split('/').pop();
              return `
                <div 
                  class="file-item glass-light p-2 mb-2 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 text-xs font-mono text-slate-300 hover:text-white"
                  data-file="${this.escapeHtml(path)}"
                >
                  📄 ${this.escapeHtml(name)}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    this.addFileClickHandlers(sidebar);
    
    return sidebar;
  }

  renderStatCard(icon, label, value) {
    return `
      <div class="stat-card glass-light p-3 rounded-lg text-center">
        <div class="text-xl mb-1">${icon}</div>
        <div class="text-lg font-bold text-white">${this.escapeHtml(String(value))}</div>
        <div class="text-xs text-slate-400 mt-1">${label}</div>
      </div>
    `;
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
      return `${Math.floor(diffDays / 365)}y ago`;
    } catch (e) {
      return 'N/A';
    }
  }

  addFileClickHandlers(sidebar) {
    sidebar.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('click', () => {
        const file = item.dataset.file;
        
        // Emit event to open in code editor
        const event = new CustomEvent('openInEditor', {
          detail: { file }
        });
        document.dispatchEvent(event);
        
        // Visual feedback
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          item.style.transform = 'scale(1)';
        }, 150);
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
  window.RepoSidebar = RepoSidebar;
}

