// CodeEditorPanel Component
// Sticky right-side panel with read-only code viewer

class CodeEditorPanel {
  constructor() {
    this.currentFile = null;
    this.fileContent = null;
  }

  render() {
    const panel = document.createElement('div');
    panel.className = 'code-editor-panel sticky top-0 h-screen overflow-y-auto';
    panel.style.cssText = 'width: 320px; background: rgba(15, 23, 42, 0.95); border-left: 1px solid rgba(51, 65, 85, 0.6); padding: 1.5rem;';
    panel.id = 'code-editor-panel';
    
    panel.innerHTML = `
      <div class="editor-header mb-4">
        <h3 class="text-lg font-bold text-white mb-2">💻 Code Viewer</h3>
        <p class="text-sm text-slate-400">Click a file or agent to view code</p>
      </div>
      
      <div class="editor-content" id="editor-content">
        <div class="empty-state text-center py-12">
          <div class="text-4xl mb-3">📄</div>
          <p class="text-slate-400 text-sm">No file selected</p>
        </div>
      </div>
    `;
    
    // Listen for file open events
    this.setupEventListeners();
    
    return panel;
  }

  setupEventListeners() {
    // Listen for file open events
    document.addEventListener('openInEditor', (e) => {
      const file = e.detail.file;
      this.openFile(file);
    });
    
    document.addEventListener('openAgentInEditor', (e) => {
      const files = e.detail.files || [];
      if (files.length > 0) {
        this.openFile(files[0]);
      }
    });
    
    document.addEventListener('orbNodeClick', (e) => {
      // Handle orb node click - could open related files
      console.log('Orb node clicked:', e.detail);
    });
  }

  async openFile(filePath) {
    if (!filePath) return;
    
    const contentEl = document.getElementById('editor-content');
    if (!contentEl) return;
    
    this.currentFile = filePath;
    
    // Show loading
    contentEl.innerHTML = '<div class="text-center py-12"><div class="text-2xl mb-3">⏳</div><p class="text-slate-400 text-sm">Loading file...</p></div>';
    
    try {
      // Try to get from deep scan first
      const content = await this.getFileContent(filePath);
      
      if (content) {
        this.displayFile(filePath, content);
      } else {
        contentEl.innerHTML = `
          <div class="text-center py-12">
            <div class="text-2xl mb-3">❌</div>
            <p class="text-slate-400 text-sm">File not found or not accessible</p>
            <p class="text-slate-500 text-xs mt-2">${this.escapeHtml(filePath)}</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading file:', error);
      contentEl.innerHTML = `
        <div class="text-center py-12">
          <div class="text-2xl mb-3">⚠️</div>
          <p class="text-slate-400 text-sm">Error loading file</p>
          <p class="text-slate-500 text-xs mt-2">${error.message}</p>
        </div>
      `;
    }
  }

  async getFileContent(filePath) {
    // Try to get from chrome.storage (dashboard data)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dashboardKey = urlParams.get('key');
      
      if (dashboardKey) {
        const result = await new Promise((resolve) => {
          chrome.storage.local.get([dashboardKey], resolve);
        });
        
        const dashboardData = result[dashboardKey];
        if (dashboardData) {
          // Check deep scan contents
          const analysis = dashboardData.repoData?.analysis || dashboardData.analysis || {};
          const deepScan = analysis.deepScan || {};
          const scannedContents = deepScan.contents || [];
          
          const fileData = scannedContents.find(f => f.path === filePath);
          if (fileData && fileData.content) {
            return fileData.content;
          }
          
          // Try to fetch from GitHub API
          const owner = dashboardData.repoData?.repository?.owner || dashboardData.repository?.owner;
          const repo = dashboardData.repoData?.repository?.name?.split('/')[1] || dashboardData.repository?.name?.split('/')[1];
          
          if (owner && repo && typeof apiService !== 'undefined') {
            try {
              const { githubToken } = await apiService.getAPIKeys();
              const content = await apiService.getFileContent(owner, repo, filePath, githubToken);
              if (content) {
                return content;
              }
            } catch (apiError) {
              console.warn('Failed to fetch from API:', apiError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting file content:', error);
    }
    
    return null;
  }

  displayFile(filePath, content) {
    const contentEl = document.getElementById('editor-content');
    if (!contentEl) return;
    
    this.currentFile = filePath;
    this.fileContent = content;
    
    const fileName = filePath.split('/').pop();
    const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
    
    // Limit content size
    const displayContent = content.length > 5000 ? content.substring(0, 5000) + '\n... (truncated)' : content;
    
    contentEl.innerHTML = `
      <div class="file-header mb-3 p-3 bg-slate-800 rounded-lg border border-slate-700/60">
        <div class="flex items-center justify-between mb-2">
          <span class="font-mono text-sm text-white font-medium">${this.escapeHtml(fileName)}</span>
          <button 
            class="copy-file-btn px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-all duration-200"
            data-content="${this.escapeHtml(content.substring(0, 10000))}"
          >
            📋
          </button>
        </div>
        <div class="text-xs text-slate-400 font-mono">${this.escapeHtml(filePath)}</div>
        <div class="text-xs text-slate-500 mt-1">${content.length} characters</div>
      </div>
      
      <div class="code-editor bg-slate-900 rounded-lg border border-slate-700/60 overflow-auto" style="max-height: calc(100vh - 300px);">
        <pre class="code-block text-xs text-slate-200 font-mono p-4"><code class="language-${ext}">${this.highlightCode(displayContent, ext)}</code></pre>
      </div>
      
      ${content.length > 5000 ? `
        <div class="mt-2 text-xs text-slate-500 text-center">
          ⚠️ File is large. Showing first 5000 characters.
        </div>
      ` : ''}
    `;
    
    // Add copy handler
    const copyBtn = contentEl.querySelector('.copy-file-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(content);
          copyBtn.innerHTML = '✅';
          setTimeout(() => {
            copyBtn.innerHTML = '📋';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    }
    
    // Scroll to top
    contentEl.scrollTop = 0;
  }

  highlightCode(code, language) {
    // Basic syntax highlighting (can be enhanced with Prism.js)
    let html = this.escapeHtml(code);
    
    // Python keywords
    if (language === 'py' || language === 'python') {
      html = html.replace(/(def|class|import|from|return|if|elif|else|for|while|try|except|with|async|await|as)\b/g, 
        '<span style="color: #a855f7;">$1</span>');
      html = html.replace(/(".*?"|'.*?')/g, 
        '<span style="color: #10b981;">$1</span>');
      html = html.replace(/#.*$/gm, 
        '<span style="color: #64748b;">$&</span>');
    }
    
    // JavaScript/TypeScript keywords
    if (language === 'js' || language === 'ts' || language === 'jsx' || language === 'tsx') {
      html = html.replace(/(function|const|let|var|class|import|export|return|if|else|for|while|async|await|try|catch)\b/g, 
        '<span style="color: #a855f7;">$1</span>');
      html = html.replace(/(".*?"|'.*?')/g, 
        '<span style="color: #10b981;">$1</span>');
      html = html.replace(/\/\/.*$/gm, 
        '<span style="color: #64748b;">$&</span>');
    }
    
    // Add line numbers
    const lines = html.split('\n');
    const numberedLines = lines.map((line, index) => {
      return `<span style="color: #475569; margin-right: 1rem;">${String(index + 1).padStart(3, ' ')}</span>${line}`;
    });
    
    return numberedLines.join('\n');
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
  window.CodeEditorPanel = CodeEditorPanel;
}

