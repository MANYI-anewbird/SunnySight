// Overview Renderer - Enhanced overview with folder structure, code viewer, AI agents, and APIs

class OverviewRenderer {
  constructor() {
    this.selectedFile = null;
    this.fileContentCache = {};
  }

  render(analysis, repoData, container) {
    this.container = container;
    container.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid overview-grid';

    // 1. Metrics Section (existing)
    grid.appendChild(this.renderMetrics(repoData));
    
    // 2. Folder/File Structure Tree (NEW)
    if (analysis.keyFiles || repoData.repository) {
      grid.appendChild(this.renderFolderStructure(analysis, repoData));
    }
    
    // 3. Code Viewer for Selected Files (NEW)
    grid.appendChild(this.renderCodeViewer(analysis, repoData));
    
    // 4. AI Agentic System Messages (NEW)
    if (analysis.aiMLDetection || analysis.systemMessages) {
      grid.appendChild(this.renderAgenticSystems(analysis));
    }
    
    // 5. API Usage Detection (NEW)
    grid.appendChild(this.renderAPIUsage(analysis, repoData));
    
    // 6. Summary (existing)
    if (analysis.summary) {
      grid.appendChild(this.renderSummary(analysis));
    }
    
    container.appendChild(grid);
  }

  renderMetrics(repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📊 Metrics';
    
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';
    
    const metrics = [
      {
        icon: '⭐',
        value: repoData.metrics?.stars || 0,
        label: 'Stars'
      },
      {
        icon: '🍴',
        value: repoData.metrics?.forks || 0,
        label: 'Forks'
      },
      {
        icon: '🏥',
        value: `${repoData.metrics?.healthScore || 0}/100`,
        label: 'Health Score'
      },
      {
        icon: '💻',
        value: repoData.metrics?.language || 'N/A',
        label: 'Language'
      }
    ];
    
    metrics.forEach(metric => {
      const card = document.createElement('div');
      card.className = 'metric-card';
      
      const icon = document.createElement('div');
      icon.className = 'metric-icon';
      icon.textContent = metric.icon;
      
      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = metric.value;
      
      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = metric.label;
      
      card.appendChild(icon);
      card.appendChild(value);
      card.appendChild(label);
      metricsGrid.appendChild(card);
    });
    
    section.appendChild(title);
    section.appendChild(metricsGrid);
    
    return section;
  }

  renderFolderStructure(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section overview-tree-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📁 Folder Structure';
    
    const treeContainer = document.createElement('div');
    treeContainer.className = 'folder-tree-container';
    
    // Build tree from key files
    const tree = this.buildTreeFromFiles(analysis.keyFiles || [], repoData);
    
    const treeHTML = this.renderTreeHTML(tree, 0);
    treeContainer.innerHTML = treeHTML;
    
    // Add click handlers for file selection
    treeContainer.addEventListener('click', (e) => {
      const fileNode = e.target.closest('.tree-file');
      if (fileNode) {
        const filePath = fileNode.dataset.path;
        if (filePath) {
          this.selectFile(filePath, analysis, repoData);
        }
      }
    });
    
    section.appendChild(title);
    section.appendChild(treeContainer);
    
    return section;
  }

  buildTreeFromFiles(keyFiles, repoData) {
    const tree = {};
    
    (keyFiles || []).forEach(file => {
      const path = typeof file === 'string' ? file : (file.path || file);
      if (!path) return;
      
      const parts = path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // File
          if (!current._files) current._files = [];
          current._files.push({
            name: part,
            path: path,
            purpose: typeof file === 'object' ? (file.purpose || file.importance) : null
          });
        } else {
          // Directory
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });
    
    return tree;
  }

  renderTreeHTML(tree, depth = 0) {
    let html = '';
    const indent = '  '.repeat(depth);
    
    // Render directories first
    Object.keys(tree)
      .filter(key => key !== '_files' && typeof tree[key] === 'object')
      .forEach(dir => {
        html += `<div class="tree-directory" style="margin-left: ${depth * 20}px;">
          <span class="tree-icon">📁</span>
          <span class="tree-name">${dir}/</span>
        </div>`;
        html += this.renderTreeHTML(tree[dir], depth + 1);
      });
    
    // Render files
    if (tree._files && tree._files.length > 0) {
      tree._files.forEach(file => {
        const icon = this.getFileIcon(file.name);
        html += `<div class="tree-file" data-path="${file.path}" style="margin-left: ${depth * 20}px;">
          <span class="tree-icon">${icon}</span>
          <span class="tree-name">${file.name}</span>
          ${file.purpose ? `<span class="tree-hint"> - ${file.purpose}</span>` : ''}
        </div>`;
      });
    }
    
    return html;
  }

  getFileIcon(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
      'py': '🐍', 'js': '📜', 'ts': '📘', 'jsx': '⚛️', 'tsx': '⚛️',
      'json': '📄', 'yaml': '⚙️', 'yml': '⚙️', 'md': '📝',
      'html': '🌐', 'css': '🎨', 'xml': '📋',
      'java': '☕', 'cpp': '⚙️', 'c': '⚙️', 'go': '🐹',
      'rs': '🦀', 'rb': '💎', 'php': '🐘', 'swift': '🐦'
    };
    return iconMap[ext] || '📄';
  }

  renderCodeViewer(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section overview-code-section';
    
    const header = document.createElement('div');
    header.className = 'section-header';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '💻 Code Viewer';
    
    const fileSelect = document.createElement('select');
    fileSelect.className = 'file-selector';
    fileSelect.innerHTML = '<option value="">Select a file to view code...</option>';
    
    // Populate with key files
    const keyFiles = analysis.keyFiles || [];
    keyFiles.slice(0, 20).forEach(file => {
      const path = typeof file === 'string' ? file : (file.path || file);
      const name = path.split('/').pop();
      const option = document.createElement('option');
      option.value = path;
      option.textContent = `${name} (${path})`;
      fileSelect.appendChild(option);
    });
    
    fileSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.selectFile(e.target.value, analysis, repoData);
      }
    });
    
    header.appendChild(title);
    section.appendChild(header);
    section.appendChild(fileSelect);
    
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-viewer-container';
    codeContainer.id = 'code-viewer-container';
    codeContainer.innerHTML = '<p class="code-placeholder">Select a file from the dropdown or click a file in the folder tree to view its code...</p>';
    
    section.appendChild(codeContainer);
    
    return section;
  }

  async selectFile(filePath, analysis, repoData) {
    const codeContainer = document.getElementById('code-viewer-container');
    if (!codeContainer) return;
    
    // Update selected file
    this.selectedFile = filePath;
    
    // Show loading
    codeContainer.innerHTML = '<div class="loading-code">Loading code...</div>';
    
    try {
      // Check cache first
      if (this.fileContentCache[filePath]) {
        this.displayCode(filePath, this.fileContentCache[filePath]);
        return;
      }
      
      // Get file content from deep scan if available
      const deepScan = analysis.deepScan || {};
      const scannedContents = deepScan.contents || [];
      const fileData = scannedContents.find(f => f.path === filePath);
      
      if (fileData && fileData.content) {
        this.fileContentCache[filePath] = fileData.content;
        this.displayCode(filePath, fileData.content);
      } else {
        // Try to fetch from GitHub API
        const owner = repoData.repository?.owner || repoData.metadata?.owner;
        const repo = repoData.repository?.name?.split('/')[1] || repoData.metadata?.repo;
        
        if (owner && repo) {
          const content = await this.fetchFileContent(owner, repo, filePath);
          if (content) {
            this.fileContentCache[filePath] = content;
            this.displayCode(filePath, content);
          } else {
            codeContainer.innerHTML = `<p class="code-error">Unable to load file: ${filePath}</p>`;
          }
        } else {
          codeContainer.innerHTML = `<p class="code-error">File not found in scan results. Path: ${filePath}</p>`;
        }
      }
    } catch (error) {
      console.error('Error loading file:', error);
      codeContainer.innerHTML = `<p class="code-error">Error loading file: ${error.message}</p>`;
    }
  }

  displayCode(filePath, content) {
    const codeContainer = document.getElementById('code-viewer-container');
    if (!codeContainer) return;
    
    const fileName = filePath.split('/').pop();
    const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
    
    // Limit content size for display
    const displayContent = content.length > 5000 ? content.substring(0, 5000) + '\n... (truncated)' : content;
    
    codeContainer.innerHTML = `
      <div class="code-header">
        <span class="code-filename">${fileName}</span>
        <span class="code-path">${filePath}</span>
        <span class="code-size">${content.length} chars</span>
      </div>
      <pre class="code-block"><code class="language-${ext}">${this.escapeHtml(displayContent)}</code></pre>
      ${content.length > 5000 ? '<p class="code-truncated">⚠️ File is large. Showing first 5000 characters.</p>' : ''}
    `;
    
    // Highlight syntax (basic)
    this.highlightSyntax(codeContainer.querySelector('code'), ext);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  highlightSyntax(codeElement, language) {
    // Basic syntax highlighting (can be enhanced with a library)
    if (language === 'py' || language === 'python') {
      codeElement.innerHTML = codeElement.textContent
        .replace(/(def |class |import |from |return |if |elif |else |for |while |try |except |with |async |await )/g, '<span class="keyword">$1</span>')
        .replace(/(["'])((?:(?=(\\?))\3.)*?)\1/g, '<span class="string">$1$2$1</span>');
    } else if (language === 'js' || language === 'ts') {
      codeElement.innerHTML = codeElement.textContent
        .replace(/(function|const|let|var|class|import|export|return|if|else|for|while|async|await|try|catch)/g, '<span class="keyword">$1</span>')
        .replace(/(["'])((?:(?=(\\?))\3.)*?)\1/g, '<span class="string">$1$2$1</span>');
    }
  }

  async fetchFileContent(owner, repo, path) {
    try {
      const { githubToken } = await apiService.getAPIKeys();
      return await apiService.getFileContent(owner, repo, path, githubToken);
    } catch (error) {
      console.error('Error fetching file:', error);
      return null;
    }
  }

  renderAgenticSystems(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section overview-agents-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🤖 AI Agentic Systems & Messages';
    
    const content = document.createElement('div');
    content.className = 'agents-content';
    
    // Detect agents from code
    const agents = this.detectAgents(analysis);
    
    if (agents.length === 0 && !analysis.systemMessages) {
      content.innerHTML = '<p class="no-agents">No AI agentic systems detected in this repository.</p>';
      section.appendChild(title);
      section.appendChild(content);
      return section;
    }
    
    // Render detected agents
    if (agents.length > 0) {
      const agentsSection = document.createElement('div');
      agentsSection.className = 'agents-list';
      agentsSection.innerHTML = '<h3>Detected Agents:</h3>';
      
      agents.forEach(agent => {
        const agentCard = document.createElement('div');
        agentCard.className = 'agent-card';
        agentCard.innerHTML = `
          <div class="agent-header">
            <span class="agent-icon">${agent.icon}</span>
            <span class="agent-name">${agent.name}</span>
            <span class="agent-type">${agent.type}</span>
          </div>
          <div class="agent-files">
            <strong>Files:</strong> ${agent.files.join(', ')}
          </div>
        `;
        agentsSection.appendChild(agentCard);
      });
      
      content.appendChild(agentsSection);
    }
    
    // Render system messages
    if (analysis.systemMessages) {
      const messagesSection = document.createElement('div');
      messagesSection.className = 'system-messages-section';
      messagesSection.innerHTML = '<h3>System Messages & Prompts:</h3>';
      
      // System messages
      if (analysis.systemMessages.systemMessages && analysis.systemMessages.systemMessages.length > 0) {
        analysis.systemMessages.systemMessages.slice(0, 3).forEach(msg => {
          const msgCard = document.createElement('div');
          msgCard.className = 'message-card';
          msgCard.innerHTML = `
            <div class="message-header">
              <span class="message-icon">📝</span>
              <span class="message-file">${msg.file?.split('/').pop() || 'Unknown'}</span>
            </div>
            <div class="message-text">${this.truncateText(msg.text || '', 300)}</div>
          `;
          messagesSection.appendChild(msgCard);
        });
      }
      
      // Prompts
      if (analysis.systemMessages.prompts && analysis.systemMessages.prompts.length > 0) {
        analysis.systemMessages.prompts.slice(0, 2).forEach(prompt => {
          const promptCard = document.createElement('div');
          promptCard.className = 'message-card prompt-card';
          promptCard.innerHTML = `
            <div class="message-header">
              <span class="message-icon">💭</span>
              <span class="message-file">${prompt.file?.split('/').pop() || 'Unknown'}</span>
            </div>
            <div class="message-text">${this.truncateText(prompt.text || '', 300)}</div>
          `;
          messagesSection.appendChild(promptCard);
        });
      }
      
      content.appendChild(messagesSection);
    }
    
    section.appendChild(title);
    section.appendChild(content);
    
    return section;
  }

  detectAgents(analysis) {
    const agents = [];
    
    // Check AI/ML detection results
    if (analysis.aiMLDetection && analysis.aiMLDetection.agenticSystems) {
      analysis.aiMLDetection.agenticSystems.forEach(agent => {
        agents.push({
          name: agent.name,
          type: agent.type || 'Agentic System',
          icon: agent.icon || '🤖',
          files: agent.files || []
        });
      });
    }
    
    // Check key files for agent patterns
    if (analysis.keyFiles) {
      const agentFiles = analysis.keyFiles.filter(f => {
        const path = typeof f === 'string' ? f : (f.path || f);
        return path && (
          path.toLowerCase().includes('agent') ||
          path.toLowerCase().includes('chain') ||
          path.toLowerCase().includes('tool')
        );
      });
      
      agentFiles.forEach(file => {
        const path = typeof file === 'string' ? file : (file.path || file);
        if (!agents.find(a => a.files.includes(path))) {
          agents.push({
            name: path.split('/').pop(),
            type: this.inferAgentType(path),
            icon: '🤖',
            files: [path]
          });
        }
      });
    }
    
    return agents;
  }

  inferAgentType(filePath) {
    const path = filePath.toLowerCase();
    if (path.includes('chain')) return 'LLM Chain';
    if (path.includes('tool')) return 'Tool/Function';
    if (path.includes('memory')) return 'Memory System';
    if (path.includes('planning')) return 'Planning Agent';
    if (path.includes('react')) return 'ReAct Agent';
    return 'Agent Implementation';
  }

  renderAPIUsage(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section overview-apis-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔌 API Usage';
    
    const content = document.createElement('div');
    content.className = 'apis-content';
    
    const apis = this.detectAPIs(analysis, repoData);
    
    if (apis.length === 0) {
      content.innerHTML = '<p class="no-apis">No external APIs detected.</p>';
      section.appendChild(title);
      section.appendChild(content);
      return section;
    }
    
    const apiGrid = document.createElement('div');
    apiGrid.className = 'apis-grid';
    
    apis.forEach(api => {
      const apiCard = document.createElement('div');
      apiCard.className = 'api-card';
      apiCard.innerHTML = `
        <div class="api-header">
          <span class="api-icon">${api.icon}</span>
          <span class="api-name">${api.name}</span>
        </div>
        <div class="api-description">${api.description}</div>
        ${api.endpoints && api.endpoints.length > 0 ? `
          <div class="api-endpoints">
            <strong>Usage:</strong>
            <ul>
              ${api.endpoints.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${api.files && api.files.length > 0 ? `
          <div class="api-files">
            <strong>Files:</strong> ${api.files.slice(0, 3).join(', ')}
            ${api.files.length > 3 ? ` (+${api.files.length - 3} more)` : ''}
          </div>
        ` : ''}
      `;
      apiGrid.appendChild(apiCard);
    });
    
    content.appendChild(apiGrid);
    section.appendChild(title);
    section.appendChild(content);
    
    return section;
  }

  detectAPIs(analysis, repoData) {
    const apis = [];
    const detectedAPIs = new Set();
    
    // Check dependencies for API libraries
    if (analysis.requirements && analysis.requirements.dependencies) {
      const deps = analysis.requirements.dependencies;
      
      // OpenAI
      if (this.hasDependency(deps, 'openai')) {
        apis.push({
          name: 'OpenAI API',
          icon: '🧠',
          description: 'GPT models, embeddings, and completions',
          files: this.findFilesWithPattern(analysis, 'openai'),
          endpoints: ['chat/completions', 'embeddings', 'models']
        });
        detectedAPIs.add('openai');
      }
      
      // Anthropic Claude
      if (this.hasDependency(deps, 'anthropic')) {
        apis.push({
          name: 'Anthropic Claude API',
          icon: '🤖',
          description: 'Claude language models and completions',
          files: this.findFilesWithPattern(analysis, 'anthropic|claude'),
          endpoints: ['messages', 'completions']
        });
        detectedAPIs.add('anthropic');
      }
      
      // LangChain (uses multiple APIs)
      if (this.hasDependency(deps, 'langchain')) {
        apis.push({
          name: 'LangChain',
          icon: '🔗',
          description: 'LLM orchestration framework with multiple API integrations',
          files: this.findFilesWithPattern(analysis, 'langchain'),
          endpoints: ['LLM chains', 'Tools', 'Agents']
        });
        detectedAPIs.add('langchain');
      }
      
      // Replicate
      if (this.hasDependency(deps, 'replicate')) {
        apis.push({
          name: 'Replicate API',
          icon: '🔄',
          description: 'Run machine learning models in the cloud',
          files: this.findFilesWithPattern(analysis, 'replicate'),
          endpoints: ['predictions', 'models']
        });
        detectedAPIs.add('replicate');
      }
      
      // Hugging Face
      if (this.hasDependency(deps, 'transformers|huggingface')) {
        apis.push({
          name: 'Hugging Face API',
          icon: '🤗',
          description: 'Model hosting and inference API',
          files: this.findFilesWithPattern(analysis, 'transformers|huggingface'),
          endpoints: ['models', 'inference']
        });
        detectedAPIs.add('huggingface');
      }
      
      // Google Cloud
      if (this.hasDependency(deps, 'google-cloud|gcloud')) {
        apis.push({
          name: 'Google Cloud APIs',
          icon: '☁️',
          description: 'Google Cloud services (Storage, BigQuery, etc.)',
          files: this.findFilesWithPattern(analysis, 'google|gcloud|gcs|bigquery'),
          endpoints: ['Storage', 'BigQuery', 'AI Platform']
        });
        detectedAPIs.add('google-cloud');
      }
      
      // AWS
      if (this.hasDependency(deps, 'boto3|aws')) {
        apis.push({
          name: 'AWS APIs',
          icon: '☁️',
          description: 'Amazon Web Services APIs',
          files: this.findFilesWithPattern(analysis, 'boto3|aws'),
          endpoints: ['S3', 'Lambda', 'SageMaker']
        });
        detectedAPIs.add('aws');
      }
    }
    
    // Check code for API usage patterns
    const deepScan = analysis.deepScan || {};
    const scannedContents = deepScan.contents || [];
    
    scannedContents.forEach(file => {
      const content = file.content || '';
      const path = file.path || '';
      
      // Detect REST API calls
      if (content.match(/fetch\(|axios\.|requests\.|httpx\.|http\.client/gi)) {
        if (!detectedAPIs.has('rest')) {
          apis.push({
            name: 'REST APIs',
            icon: '🌐',
            description: 'HTTP/REST API calls detected',
            files: [path],
            endpoints: ['Various endpoints']
          });
          detectedAPIs.add('rest');
        }
      }
    });
    
    return apis;
  }

  hasDependency(deps, pattern) {
    return deps.some(dep => {
      const depStr = typeof dep === 'string' ? dep.toLowerCase() : JSON.stringify(dep).toLowerCase();
      return new RegExp(pattern, 'i').test(depStr);
    });
  }

  findFilesWithPattern(analysis, pattern) {
    const files = [];
    const regex = new RegExp(pattern, 'i');
    
    // Check key files
    if (analysis.keyFiles) {
      analysis.keyFiles.forEach(file => {
        const path = typeof file === 'string' ? file : (file.path || file);
        if (path && regex.test(path)) {
          files.push(path);
        }
      });
    }
    
    // Check deep scan
    const deepScan = analysis.deepScan || {};
    const scannedContents = deepScan.contents || [];
    scannedContents.forEach(file => {
      if (regex.test(file.path || '') || regex.test(file.content || '')) {
        if (!files.includes(file.path)) {
          files.push(file.path);
        }
      }
    });
    
    return files;
  }

  renderSummary(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📝 Summary';
    
    const content = document.createElement('p');
    content.className = 'repo-summary';
    content.textContent = analysis.summary;
    
    section.appendChild(title);
    section.appendChild(content);
    
    return section;
  }

  truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

