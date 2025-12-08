// SystemMessageExplorer Component
// Lists detected system prompts with code editor view

class SystemMessageExplorer {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
  }

  render() {
    const container = document.createElement('div');
    container.className = 'card-glass p-6 mb-6';
    
    const systemMessages = this.getSystemMessages();
    
    if (systemMessages.length === 0) {
      container.innerHTML = `
        <h3 class="text-xl font-bold text-white mb-4">💬 System Messages</h3>
        <p class="text-slate-400 text-center py-8">No system messages detected</p>
      `;
      return container;
    }
    
    container.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-4">💬 System Messages</h3>
      <div class="system-messages-list">
        ${systemMessages.map(msg => this.renderMessageCard(msg)).join('')}
      </div>
    `;
    
    this.addCodeHighlighting(container);
    this.addCopyHandlers(container);
    
    return container;
  }

  renderMessageCard(message) {
    const tone = this.detectTone(message.text);
    const role = this.detectRole(message.text);
    
    return `
      <div class="message-card glass-light p-4 mb-4 rounded-xl hover:shadow-xl transition-all duration-300">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-2xl">📝</span>
            <span class="font-mono text-sm text-slate-300">${this.escapeHtml(message.file || 'Unknown')}</span>
          </div>
          <div class="flex items-center gap-2">
            ${tone ? `<span class="tone-pill px-2 py-1 text-xs rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/40">${tone}</span>` : ''}
            ${role ? `<span class="role-pill px-2 py-1 text-xs rounded-full bg-blue-600/20 text-blue-300 border border-blue-600/40">${role}</span>` : ''}
          </div>
        </div>
        
        <div class="code-viewer bg-slate-900 rounded-lg border border-slate-700/60 p-4 mb-3">
          <pre class="code-block text-sm text-slate-200 font-mono overflow-x-auto"><code class="language-text">${this.escapeHtml(message.text)}</code></pre>
        </div>
        
        <div class="message-toolbar flex items-center gap-2">
          <button 
            class="copy-msg-btn px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
            data-text="${this.escapeHtml(message.text)}"
          >
            📋 Copy
          </button>
          <button 
            class="playground-btn px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200"
            data-file="${this.escapeHtml(message.file || '')}"
          >
            🎮 Open in Playground
          </button>
        </div>
      </div>
    `;
  }

  getSystemMessages() {
    const messages = [];
    
    if (this.analysis.systemMessages?.systemMessages) {
      this.analysis.systemMessages.systemMessages.forEach(msg => {
        messages.push({
          text: msg.text || '',
          file: msg.file || 'Unknown'
        });
      });
    }
    
    if (this.analysis.systemMessages?.prompts) {
      this.analysis.systemMessages.prompts.forEach(prompt => {
        messages.push({
          text: prompt.text || '',
          file: prompt.file || 'Unknown'
        });
      });
    }
    
    return messages.slice(0, 5); // Limit to 5 messages
  }

  detectTone(text) {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    
    const tones = {
      'friendly': /friendly|helpful|kind|welcoming/i,
      'professional': /professional|formal|respectful/i,
      'technical': /technical|precise|detailed/i,
      'assistant': /assistant|helper|support/i
    };
    
    for (const [tone, pattern] of Object.entries(tones)) {
      if (pattern.test(lowerText)) {
        return tone;
      }
    }
    
    return 'assistant';
  }

  detectRole(text) {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    
    if (/expert|specialist|professional/.test(lowerText)) {
      return 'Expert';
    } else if (/assistant|helper|support/.test(lowerText)) {
      return 'Assistant';
    } else if (/teacher|educator|instructor/.test(lowerText)) {
      return 'Teacher';
    }
    
    return 'Assistant';
  }

  addCodeHighlighting(container) {
    // Basic syntax highlighting (can be enhanced with Prism.js)
    const codeBlocks = container.querySelectorAll('.code-block code');
    codeBlocks.forEach(block => {
      // Simple keyword highlighting
      let html = block.innerHTML;
      html = html.replace(/(system|user|assistant|function|class|def|import|from)/gi, 
        '<span style="color: #a855f7;">$1</span>');
      html = html.replace(/(".*?"|'.*?')/g, 
        '<span style="color: #10b981;">$1</span>');
      block.innerHTML = html;
    });
  }

  addCopyHandlers(container) {
    container.querySelectorAll('.copy-msg-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const text = btn.dataset.text;
        try {
          await navigator.clipboard.writeText(text);
          btn.innerHTML = '✅ Copied!';
          setTimeout(() => {
            btn.innerHTML = '📋 Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
    
    container.querySelectorAll('.playground-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = btn.dataset.file;
        // Emit event to open file in code editor
        const event = new CustomEvent('openInEditor', {
          detail: { file }
        });
        document.dispatchEvent(event);
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
  window.SystemMessageExplorer = SystemMessageExplorer;
}

