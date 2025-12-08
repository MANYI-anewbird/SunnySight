// FolderStructureTree Component
// Interactive folder/file structure tree from previous version

class FolderStructureTree {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
    this.selectedFile = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'card-glass p-6 mb-6';
    
    container.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-4">📁 Folder Structure</h3>
      <div class="folder-tree-container" style="max-height: 500px; overflow-y: auto;">
        ${this.renderTree()}
      </div>
    `;
    
    this.addInteractivity(container);
    
    return container;
  }

  renderTree() {
    const keyFiles = this.analysis.keyFiles || [];
    
    if (keyFiles.length === 0) {
      return '<p class="text-slate-400 text-center py-8 text-sm">No file structure data available</p>';
    }
    
    // Build tree structure
    const tree = this.buildTreeFromFiles(keyFiles);
    
    return this.renderTreeHTML(tree, 0);
  }

  buildTreeFromFiles(keyFiles) {
    const tree = {};
    
    keyFiles.forEach(file => {
      const path = typeof file === 'string' ? file : (file.path || file);
      if (!path || typeof path !== 'string') return;
      
      const parts = path.split('/').filter(p => p);
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            type: index === parts.length - 1 ? 'file' : 'folder',
            children: {},
            path: parts.slice(0, index + 1).join('/'),
            file: index === parts.length - 1 ? file : null
          };
        }
        current = current[part].children;
      });
    });
    
    return tree;
  }

  renderTreeHTML(tree, level) {
    let html = '';
    const indent = level * 20;
    
    Object.keys(tree).sort().forEach(key => {
      const node = tree[key];
      const isExpanded = level < 2; // Auto-expand first 2 levels
      const hasChildren = Object.keys(node.children).length > 0;
      
      html += `
        <div class="tree-node" style="padding-left: ${indent}px; margin: 4px 0;" data-path="${node.path}">
          ${hasChildren ? `
            <button class="tree-expand-btn" data-expanded="${isExpanded}" style="
              background: transparent;
              border: none;
              color: #94a3b8;
              cursor: pointer;
              padding: 0 4px;
              margin-right: 4px;
              font-size: 10px;
            ">${isExpanded ? '▼' : '▶'}</button>
          ` : '<span style="display: inline-block; width: 20px;"></span>'}
          
          <span class="tree-icon" style="margin-right: 6px;">
            ${node.type === 'folder' ? '📁' : this.getFileIcon(key)}
          </span>
          
          <span class="tree-name ${node.type === 'file' ? 'tree-file cursor-pointer hover:text-blue-400' : ''}" 
                data-path="${node.path}"
                style="color: ${node.type === 'file' ? '#e2e8f0' : '#cbd5e1'}; font-size: 0.875rem;">
            ${this.escapeHtml(key)}
          </span>
          
          ${node.file && typeof node.file === 'object' ? `
            <span class="tree-badge" style="
              margin-left: 8px;
              padding: 2px 6px;
              background: ${this.getImportanceColor(node.file.importance)};
              border-radius: 4px;
              font-size: 10px;
              color: white;
            ">${this.escapeHtml(String(node.file.importance || ''))}</span>
          ` : ''}
        </div>
      `;
      
      if (hasChildren && isExpanded) {
        html += `
          <div class="tree-children" data-parent="${node.path}" style="display: block;">
            ${this.renderTreeHTML(node.children, level + 1)}
          </div>
        `;
      } else if (hasChildren) {
        html += `
          <div class="tree-children" data-parent="${node.path}" style="display: none;">
            ${this.renderTreeHTML(node.children, level + 1)}
          </div>
        `;
      }
    });
    
    return html;
  }

  getFileIcon(filepath) {
    if (!filepath || typeof filepath !== 'string') return '📄';
    const filename = filepath.split('/').pop() || filepath;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const icons = {
      'js': '📜', 'ts': '📘', 'py': '🐍', 'java': '☕', 'cpp': '⚙️',
      'html': '🌐', 'css': '🎨', 'json': '📋', 'yaml': '⚙️', 'yml': '⚙️',
      'md': '📝', 'txt': '📄', 'sh': '💻', 'dockerfile': '🐳',
      'png': '🖼️', 'jpg': '🖼️', 'svg': '🎨'
    };
    return icons[ext] || '📄';
  }

  getImportanceColor(importance) {
    if (!importance) return 'rgba(107, 114, 128, 0.5)';
    const lower = String(importance).toLowerCase();
    if (lower.includes('critical')) return '#ef4444';
    if (lower.includes('high')) return '#f59e0b';
    if (lower.includes('medium')) return '#3b82f6';
    return 'rgba(107, 114, 128, 0.5)';
  }

  addInteractivity(container) {
    // Expand/collapse folders
    container.querySelectorAll('.tree-expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = btn.dataset.expanded === 'true';
        const node = btn.closest('.tree-node');
        const children = node?.nextElementSibling;
        
        if (children && children.classList.contains('tree-children')) {
          if (isExpanded) {
            children.style.display = 'none';
            btn.innerHTML = '▶';
            btn.dataset.expanded = 'false';
          } else {
            children.style.display = 'block';
            btn.innerHTML = '▼';
            btn.dataset.expanded = 'true';
          }
        }
      });
    });
    
    // File click handlers
    container.querySelectorAll('.tree-file').forEach(file => {
      file.addEventListener('click', (e) => {
        const path = file.dataset.path;
        if (path) {
          this.selectedFile = path;
          
          // Visual feedback
          container.querySelectorAll('.tree-file').forEach(f => {
            f.style.background = 'transparent';
          });
          file.style.background = 'rgba(59, 130, 246, 0.2)';
          
          // Emit event to open in code editor
          const event = new CustomEvent('openInEditor', {
            detail: { file: path }
          });
          document.dispatchEvent(event);
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
  window.FolderStructureTree = FolderStructureTree;
}

