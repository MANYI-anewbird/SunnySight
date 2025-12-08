// Enhanced Features Renderer
// Adds pain-point solving features: Related Code Viewer, AI/ML Detection, Interactive Trees

class EnhancedFeaturesRenderer {
  constructor() {
    this.container = null;
  }

  // 1. Related Code Viewer - Show files that work together
  renderRelatedCodeViewer(analysis, repoData, container) {
    this.repoData = repoData; // Store for URL generation
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔗 Related Code Viewer';
    title.innerHTML += '<span class="feature-badge">NEW</span>';
    
    const viewerCard = document.createElement('div');
    viewerCard.className = 'related-code-viewer';
    
    if (!analysis.keyFiles || analysis.keyFiles.length === 0) {
      viewerCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No files to analyze</p>';
      section.appendChild(title);
      section.appendChild(viewerCard);
      return section;
    }

    // Group files by relationships
    const fileGroups = this.detectFileRelationships(analysis.keyFiles, analysis);
    
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'related-tabs';
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'related-content';
    
    let activeTab = null;
    
    fileGroups.forEach((group, index) => {
      const tab = document.createElement('button');
      tab.className = `related-tab ${index === 0 ? 'active' : ''}`;
      tab.textContent = `${group.icon} ${group.category}`;
      tab.onclick = () => {
        // Remove active class from all tabs
        tabsContainer.querySelectorAll('.related-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show this group's content
        this.showRelatedGroup(group, contentContainer);
      };
      tabsContainer.appendChild(tab);
      
      if (index === 0) {
        activeTab = tab;
      }
    });
    
    // Show first group by default
    if (fileGroups.length > 0) {
      this.showRelatedGroup(fileGroups[0], contentContainer);
    }
    
    viewerCard.appendChild(tabsContainer);
    viewerCard.appendChild(contentContainer);
    
    section.appendChild(title);
    section.appendChild(viewerCard);
    return section;
  }

  detectFileRelationships(keyFiles, analysis) {
    const groups = [];
    
    // Group 1: Entry Points
    const entryPoints = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      const pathStr = typeof path === 'string' ? path.toLowerCase() : '';
      return pathStr && (pathStr.includes('main') || pathStr.includes('index') || pathStr.includes('app.js') || 
             pathStr.includes('app.py') || pathStr.includes('server.js') || pathStr.includes('__main__'));
    });
    if (entryPoints.length > 0) {
      groups.push({
        category: 'Entry Points',
        icon: '🚀',
        files: entryPoints,
        description: 'Main entry points and application starters'
      });
    }
    
    // Group 2: Configuration Files
    const configFiles = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      const pathStr = typeof path === 'string' ? path.toLowerCase() : '';
      return pathStr && (pathStr.includes('config') || pathStr.includes('.env') || pathStr.includes('settings') ||
             pathStr.includes('package.json') || pathStr.includes('requirements.txt') || 
             pathStr.includes('pom.xml') || pathStr.includes('dockerfile'));
    });
    if (configFiles.length > 0) {
      groups.push({
        category: 'Configuration',
        icon: '⚙️',
        files: configFiles,
        description: 'Configuration and setup files'
      });
    }
    
    // Group 3: API/Routes
    const apiFiles = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      const pathStr = typeof path === 'string' ? path.toLowerCase() : '';
      return pathStr && (pathStr.includes('route') || pathStr.includes('api') || pathStr.includes('controller') ||
             pathStr.includes('handler') || pathStr.includes('endpoint'));
    });
    if (apiFiles.length > 0) {
      groups.push({
        category: 'API & Routes',
        icon: '🌐',
        files: apiFiles,
        description: 'API endpoints and route handlers'
      });
    }
    
    // Group 4: Data/Models
    const dataFiles = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      const pathStr = typeof path === 'string' ? path.toLowerCase() : '';
      return pathStr && (pathStr.includes('model') || pathStr.includes('schema') || pathStr.includes('database') ||
             pathStr.includes('db') || pathStr.includes('entity') || pathStr.includes('repository'));
    });
    if (dataFiles.length > 0) {
      groups.push({
        category: 'Data Models',
        icon: '💾',
        files: dataFiles,
        description: 'Database models and data structures'
      });
    }
    
    // Group 5: Tests
    const testFiles = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      const pathStr = typeof path === 'string' ? path.toLowerCase() : '';
      return pathStr && (pathStr.includes('test') || pathStr.includes('spec') || pathStr.includes('__tests__'));
    });
    if (testFiles.length > 0) {
      groups.push({
        category: 'Tests',
        icon: '🧪',
        files: testFiles,
        description: 'Test files and test suites'
      });
    }
    
    // Group 6: Utilities/Helpers
    const utilFiles = keyFiles.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      const pathStr = typeof path === 'string' ? path.toLowerCase() : '';
      const purpose = typeof f === 'object' && f ? (f.purpose || '') : '';
      const purposeStr = typeof purpose === 'string' ? purpose.toLowerCase() : '';
      return pathStr && (pathStr.includes('util') || pathStr.includes('helper') || pathStr.includes('common') ||
             (purposeStr && (purposeStr.includes('utility') || purposeStr.includes('helper'))));
    });
    if (utilFiles.length > 0) {
      groups.push({
        category: 'Utilities',
        icon: '🛠️',
        files: utilFiles,
        description: 'Utility and helper functions'
      });
    }
    
    // Remaining files as "Other"
    const categorized = new Set([
      ...entryPoints, ...configFiles, ...apiFiles, ...dataFiles, ...testFiles, ...utilFiles
    ]);
    const otherFiles = keyFiles.filter(f => !categorized.has(f));
    if (otherFiles.length > 0) {
      groups.push({
        category: 'Other Files',
        icon: '📄',
        files: otherFiles,
        description: 'Other important files'
      });
    }
    
    return groups;
  }

  showRelatedGroup(group, container) {
    const repoData = this.repoData || {};
    
    container.innerHTML = `
      <div class="related-group-header">
        <p class="related-description">${group.description || 'Related files'}</p>
        <span class="related-count">${group.files.length} file${group.files.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="related-files-list">
        ${group.files.map(file => {
          const path = typeof file === 'string' ? file : (file.path || file);
          const purpose = typeof file === 'object' && file ? (file.purpose || file.importance || 'No description') : 'No description';
          const importance = typeof file === 'object' && file ? (file.importance || 'Normal') : 'Normal';
          const importanceStr = typeof importance === 'string' ? importance.toLowerCase() : '';
          const icon = importanceStr.includes('critical') ? '🔴' : 
                      importanceStr.includes('high') ? '🟡' : '⚪';
          
          return `
            <div class="related-file-item">
              <div class="related-file-header">
                <span class="related-file-icon">${icon}</span>
                <span class="related-file-path">${path}</span>
                <a href="${this.getGitHubFileUrl(path, repoData)}" target="_blank" class="related-file-link">🔗 View</a>
              </div>
              <div class="related-file-purpose">${purpose}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  getGitHubFileUrl(filePath, repoData) {
    if (repoData?.repository?.url) {
      return `${repoData.repository.url}/blob/main/${filePath}`;
    }
    return `#${filePath}`;
  }

  // 2. Enhanced Interactive Folder Structure Tree
  renderInteractiveFolderTree(analysis, repoData, container) {
    this.repoData = repoData; // Store for URL generation
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📁 Interactive Folder Structure';
    title.innerHTML += '<span class="feature-badge">ENHANCED</span>';
    
    const treeCard = document.createElement('div');
    treeCard.className = 'interactive-tree-card';
    
    // Add search/filter
    const searchContainer = document.createElement('div');
    searchContainer.className = 'tree-search';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '🔍 Search files and folders...';
    searchInput.className = 'tree-search-input';
    searchInput.oninput = (e) => this.filterTree(e.target.value, treeCard);
    searchContainer.appendChild(searchInput);
    
    const treeContainer = document.createElement('div');
    treeContainer.className = 'interactive-tree';
    treeContainer.id = 'folder-tree';
    
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      this.buildInteractiveTree(analysis.keyFiles, treeContainer, repoData);
    } else {
      treeContainer.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No file structure data available</p>';
    }
    
    treeCard.appendChild(searchContainer);
    treeCard.appendChild(treeContainer);
    
    section.appendChild(title);
    section.appendChild(treeCard);
    return section;
  }

  buildInteractiveTree(keyFiles, container, repoData) {
    const tree = this.buildTreeStructure(keyFiles);
    container.innerHTML = '';
    this.renderTreeNodes(tree, container, 0, repoData);
  }

  buildTreeStructure(keyFiles) {
    const tree = {};
    
    keyFiles.forEach(file => {
      const path = file.path || file;
      const parts = path.split('/').filter(p => p);
      
      let current = tree;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            type: index === parts.length - 1 ? 'file' : 'folder',
            children: {},
            file: index === parts.length - 1 ? file : null
          };
        }
        current = current[part].children;
      });
    });
    
    return tree;
  }

  renderTreeNodes(tree, container, level, repoData) {
    Object.keys(tree).sort().forEach(key => {
      const node = tree[key];
      const nodeEl = document.createElement('div');
      nodeEl.className = `tree-node level-${level}`;
      nodeEl.dataset.path = key;
      
      const icon = node.type === 'folder' ? '📁' : this.getFileIcon(key);
      const expandBtn = node.type === 'folder' && Object.keys(node.children).length > 0
        ? '<button class="tree-expand" data-expanded="false">▶</button>' : '<span class="tree-spacer"></span>';
      
      nodeEl.innerHTML = `
        ${expandBtn}
        <span class="tree-icon">${icon}</span>
        <span class="tree-name">${key}</span>
        ${node.file && node.file.importance ? `<span class="tree-badge ${node.file.importance.toLowerCase()}">${node.file.importance}</span>` : ''}
      `;
      
      if (node.type === 'folder' && Object.keys(node.children).length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-children';
        childrenContainer.style.display = 'none';
        
        this.renderTreeNodes(node.children, childrenContainer, level + 1, repoData);
        
        // Add expand/collapse functionality
        const expandBtnEl = nodeEl.querySelector('.tree-expand');
        if (expandBtnEl) {
          expandBtnEl.onclick = (e) => {
            e.stopPropagation();
            const expanded = expandBtnEl.dataset.expanded === 'true';
            expandBtnEl.dataset.expanded = !expanded;
            expandBtnEl.textContent = expanded ? '▶' : '▼';
            childrenContainer.style.display = expanded ? 'none' : 'block';
          };
        }
        
        nodeEl.appendChild(childrenContainer);
      } else if (node.file) {
        nodeEl.classList.add('tree-file');
        nodeEl.title = node.file.purpose || node.file.importance || '';
        nodeEl.onclick = () => {
          // Could open file viewer or highlight
          console.log('File clicked:', node.file);
        };
      }
      
      container.appendChild(nodeEl);
    });
  }

  getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'js': '📜', 'ts': '📘', 'jsx': '⚛️', 'tsx': '⚛️',
      'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
      'html': '🌐', 'css': '🎨', 'json': '📋', 'yaml': '📝', 'yml': '📝',
      'md': '📄', 'txt': '📄', 'xml': '📄',
      'png': '🖼️', 'jpg': '🖼️', 'svg': '🖼️',
      'dockerfile': '🐳', 'docker': '🐳'
    };
    return iconMap[ext] || '📄';
  }

  filterTree(query, container) {
    const tree = container.querySelector('.interactive-tree');
    if (!tree) return;
    
    const nodes = tree.querySelectorAll('.tree-node');
    const lowerQuery = query.toLowerCase();
    
    nodes.forEach(node => {
      const name = node.querySelector('.tree-name')?.textContent.toLowerCase() || '';
      const path = node.dataset.path?.toLowerCase() || '';
      
      if (name.includes(lowerQuery) || path.includes(lowerQuery) || !query) {
        node.style.display = '';
        // Expand parent folders if match found
        if (query) {
          let parent = node.parentElement;
          while (parent && parent.classList.contains('tree-children')) {
            parent.style.display = 'block';
            const parentNode = parent.previousElementSibling;
            if (parentNode) {
              const expandBtn = parentNode.querySelector('.tree-expand');
              if (expandBtn && expandBtn.dataset.expanded === 'false') {
                expandBtn.dataset.expanded = 'true';
                expandBtn.textContent = '▼';
              }
            }
            parent = parent.parentElement;
          }
        }
      } else {
        node.style.display = 'none';
      }
    });
  }

  // 3. Enhanced Tech Stack Visualization with Relationships
  renderTechStackVisualization(analysis, repoData, container) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🎨 Tech Stack Visualization';
    title.innerHTML += '<span class="feature-badge">ENHANCED</span>';
    
    const vizCard = document.createElement('div');
    vizCard.className = 'tech-stack-viz';
    
    // Detect tech stack categories
    const techStack = this.detectTechStack(analysis, repoData);
    
    // Primary stack visualization
    const primaryStack = document.createElement('div');
    primaryStack.className = 'primary-stack';
    
    if (techStack.primary.length > 0) {
      primaryStack.innerHTML = `
        <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">Primary Stack</h3>
        <div class="stack-items">
          ${techStack.primary.map(item => `
            <div class="stack-item primary" title="${item.description}">
              <div class="stack-icon">${item.icon}</div>
              <div class="stack-name">${item.name}</div>
              ${item.version ? `<div class="stack-version">v${item.version}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Framework & Libraries
    const frameworks = document.createElement('div');
    frameworks.className = 'frameworks-stack';
    
    if (techStack.frameworks.length > 0) {
      frameworks.innerHTML = `
        <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">Frameworks & Libraries</h3>
        <div class="stack-items">
          ${techStack.frameworks.map(item => `
            <div class="stack-item framework" title="${item.description}">
              <div class="stack-icon">${item.icon}</div>
              <div class="stack-name">${item.name}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Tools & Services
    const tools = document.createElement('div');
    tools.className = 'tools-stack';
    
    if (techStack.tools.length > 0) {
      tools.innerHTML = `
        <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">Tools & Services</h3>
        <div class="stack-items">
          ${techStack.tools.map(item => `
            <div class="stack-item tool" title="${item.description}">
              <div class="stack-icon">${item.icon}</div>
              <div class="stack-name">${item.name}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    vizCard.appendChild(primaryStack);
    vizCard.appendChild(frameworks);
    vizCard.appendChild(tools);
    
    section.appendChild(title);
    section.appendChild(vizCard);
    return section;
  }

  detectTechStack(analysis, repoData) {
    const stack = {
      primary: [],
      frameworks: [],
      tools: []
    };
    
    // Primary language
    if (repoData.metrics?.language) {
      const lang = repoData.metrics.language;
      stack.primary.push({
        name: lang,
        icon: this.getLanguageIcon(lang),
        description: 'Primary programming language',
        version: this.detectLanguageVersion(lang, analysis)
      });
    }
    
    // Detect from key files
    if (analysis && analysis.keyFiles) {
      const filePaths = analysis.keyFiles.map(f => {
        const path = typeof f === 'string' ? f : (f.path || f);
        return typeof path === 'string' ? path.toLowerCase() : '';
      }).filter(p => p).join(' ');
      
      // Frameworks
      if (filePaths && filePaths.includes('package.json')) {
        stack.frameworks.push({ name: 'Node.js', icon: '📦', description: 'JavaScript runtime' });
        if (filePaths && filePaths.includes('react')) stack.frameworks.push({ name: 'React', icon: '⚛️', description: 'UI framework' });
        if (filePaths && filePaths.includes('vue')) stack.frameworks.push({ name: 'Vue.js', icon: '💚', description: 'UI framework' });
        if (filePaths && filePaths.includes('angular')) stack.frameworks.push({ name: 'Angular', icon: '🅰️', description: 'UI framework' });
        if (filePaths && filePaths.includes('express')) stack.frameworks.push({ name: 'Express', icon: '🚂', description: 'Web framework' });
        if (filePaths && filePaths.includes('next')) stack.frameworks.push({ name: 'Next.js', icon: '▲', description: 'React framework' });
      }
      
      if (filePaths && (filePaths.includes('requirements.txt') || filePaths.includes('pyproject.toml'))) {
        stack.primary.push({ name: 'Python', icon: '🐍', description: 'Python runtime' });
        if (filePaths.includes('django')) stack.frameworks.push({ name: 'Django', icon: '🎸', description: 'Web framework' });
        if (filePaths.includes('flask')) stack.frameworks.push({ name: 'Flask', icon: '🌶️', description: 'Web framework' });
        if (filePaths.includes('fastapi')) stack.frameworks.push({ name: 'FastAPI', icon: '⚡', description: 'API framework' });
      }
      
      // Tools
      if (filePaths && (filePaths.includes('dockerfile') || filePaths.includes('docker-compose'))) {
        stack.tools.push({ name: 'Docker', icon: '🐳', description: 'Containerization' });
      }
      if (filePaths && filePaths.includes('.github/workflows')) {
        stack.tools.push({ name: 'GitHub Actions', icon: '⚙️', description: 'CI/CD' });
      }
      if (filePaths && (filePaths.includes('k8s') || filePaths.includes('kubernetes'))) {
        stack.tools.push({ name: 'Kubernetes', icon: '☸️', description: 'Orchestration' });
      }
    }
    
    // Detect from dependencies
    if (analysis.requirements?.dependencies) {
      analysis.requirements.dependencies.forEach(dep => {
        const depStr = typeof dep === 'string' ? dep.toLowerCase() : JSON.stringify(dep).toLowerCase();
        // Add more detection logic here
      });
    }
    
    return stack;
  }

  getLanguageIcon(language) {
    const iconMap = {
      'JavaScript': '📜', 'TypeScript': '📘', 'Python': '🐍',
      'Java': '☕', 'C++': '⚙️', 'C': '⚙️', 'Go': '🐹',
      'Rust': '🦀', 'Ruby': '💎', 'PHP': '🐘', 'Swift': '🐦',
      'Kotlin': '🔷', 'Dart': '🎯', 'C#': '🎵'
    };
    return iconMap[language] || '💻';
  }

  detectLanguageVersion(language, analysis) {
    // Try to detect version from requirements or package.json info
    if (language === 'Python' && analysis.requirements?.environment) {
      const match = analysis.requirements.environment.match(/python\s*([\d.]+)/i);
      if (match) return match[1];
    }
    return null;
  }

  // 4. AI/ML Workflow Tree Detection
  renderAIMLWorkflowTree(analysis, repoData, container) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🤖 AI/ML Workflow Detection';
    title.innerHTML += '<span class="feature-badge">NEW</span>';
    
    const workflowCard = document.createElement('div');
    workflowCard.className = 'ai-ml-workflow';
    
    const detection = this.detectAIMLSystems(analysis, repoData);
    
    if (!detection.hasAIML) {
      workflowCard.innerHTML = `
        <div class="no-ai-ml">
          <p style="color: #b8c5d6; text-align: center; padding: 20px;">
            🔍 No AI/ML components detected in this repository.
            <br>This appears to be a standard software project.
          </p>
        </div>
      `;
      section.appendChild(title);
      section.appendChild(workflowCard);
      return section;
    }
    
    // Show detected AI/ML systems
    let workflowHTML = '<div class="ai-ml-detections">';
    
    // Quick Info Cards Section
    workflowHTML += `
      <div class="ai-section">
        <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">
          📊 Quick Overview
        </h3>
        <div class="quick-info-cards">
          <div class="quick-info-card">
            <div class="quick-info-icon">🧠</div>
            <div class="quick-info-content">
              <div class="quick-info-label">AI/ML Detected</div>
              <div class="quick-info-value">${detection.hasAIML ? 'Yes' : 'No'}</div>
            </div>
          </div>
          <div class="quick-info-card">
            <div class="quick-info-icon">🔬</div>
            <div class="quick-info-content">
              <div class="quick-info-label">Frameworks</div>
              <div class="quick-info-value">${detection.frameworks.length}</div>
            </div>
          </div>
          <div class="quick-info-card">
            <div class="quick-info-icon">🤖</div>
            <div class="quick-info-content">
              <div class="quick-info-label">Agentic Systems</div>
              <div class="quick-info-value">${detection.agenticSystems.length}</div>
            </div>
          </div>
          <div class="quick-info-card">
            <div class="quick-info-icon">💾</div>
            <div class="quick-info-content">
              <div class="quick-info-label">Models</div>
              <div class="quick-info-value">${detection.models.length}</div>
            </div>
          </div>
          <div class="quick-info-card">
            <div class="quick-info-icon">🔄</div>
            <div class="quick-info-content">
              <div class="quick-info-label">Workflow Stages</div>
              <div class="quick-info-value">${detection.workflows.length}</div>
            </div>
          </div>
          <div class="quick-info-card">
            <div class="quick-info-icon">📈</div>
            <div class="quick-info-content">
              <div class="quick-info-label">Confidence</div>
              <div class="quick-info-value">${detection.confidence || 0}%</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    if (detection.models.length > 0) {
      workflowHTML += `
        <div class="ai-section">
          <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">
            🧠 ML Models Detected
          </h3>
          <div class="model-list">
            ${detection.models.map(model => `
              <div class="model-item" title="${model.files && model.files.length > 0 ? model.files.join(', ') : ''}">
                <span class="model-icon">${model.icon}</span>
                <span class="model-name">${model.name}</span>
                ${model.framework ? `<span class="model-framework">(${model.framework})</span>` : ''}
                ${model.files && model.files.length > 0 ? `<span class="model-files-count">${model.files.length} file(s)</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    if (detection.frameworks.length > 0) {
      workflowHTML += `
        <div class="ai-section">
          <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">
            🔬 AI/ML Frameworks
          </h3>
          <div class="framework-list">
            ${detection.frameworks.map(fw => `
              <div class="framework-item" title="${fw.description || ''}">
                <span class="framework-icon">${fw.icon}</span>
                <span class="framework-name">${fw.name}</span>
                ${fw.version ? `<span class="framework-version">v${fw.version}</span>` : ''}
                ${fw.files && fw.files.length > 0 ? `<span class="framework-files">(${fw.files.length} files)</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    if (detection.workflows.length > 0) {
      workflowHTML += `
        <div class="ai-section">
          <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">
            🔄 ML Workflow Stages
          </h3>
          <div class="workflow-stages">
            ${detection.workflows.map((stage, index) => `
              <div class="workflow-stage" title="${stage.files && stage.files.length > 0 ? 'Files: ' + stage.files.join(', ') : ''}">
                <div class="stage-number">${index + 1}</div>
                <div class="stage-content">
                  <div class="stage-name">${stage.name}</div>
                  <div class="stage-desc">${stage.description} ${stage.files && stage.files.length > 0 ? `(${stage.files.length} files)` : ''}</div>
                </div>
                ${index < detection.workflows.length - 1 ? '<div class="stage-arrow">→</div>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    if (detection.agenticSystems.length > 0) {
      workflowHTML += `
        <div class="ai-section">
          <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">
            🤖 Agentic Systems Detected
          </h3>
          <div class="agentic-list">
            ${detection.agenticSystems.map(agent => `
              <div class="agentic-item" title="${agent.description || ''} - Files: ${(agent.files || []).join(', ')}">
                <span class="agentic-icon">${agent.icon}</span>
                <span class="agentic-name">${agent.name}</span>
                <span class="agentic-type">${agent.type}</span>
                ${agent.files && agent.files.length > 0 ? `<span class="agentic-files-count">${agent.files.length} file(s)</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Add System Messages section if available
    if (analysis.systemMessages && (analysis.systemMessages.systemMessages?.length > 0 || 
        analysis.systemMessages.prompts?.length > 0 || 
        analysis.systemMessages.templates?.length > 0)) {
      workflowHTML += `
        <div class="ai-section">
          <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">
            💬 System Messages & Prompts
          </h3>
          <div class="system-messages-container">
            ${analysis.systemMessages.systemMessages?.slice(0, 3).map(msg => `
              <div class="message-item">
                <div class="message-header">
                  <span class="message-icon">📝</span>
                  <span class="message-file">${msg.file?.split('/').pop() || 'Unknown'}</span>
                </div>
                <div class="message-text">${this.truncateText(msg.text || '', 200)}</div>
              </div>
            `).join('') || ''}
            ${analysis.systemMessages.prompts?.slice(0, 2).map(prompt => `
              <div class="message-item">
                <div class="message-header">
                  <span class="message-icon">💭</span>
                  <span class="message-file">${prompt.file?.split('/').pop() || 'Unknown'}</span>
                </div>
                <div class="message-text">${this.truncateText(prompt.text || '', 200)}</div>
              </div>
            `).join('') || ''}
          </div>
        </div>
      `;
    }

    // Add Priority Breakdown section
    if (analysis.priorityBreakdown) {
      const total = Object.values(analysis.priorityBreakdown).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        workflowHTML += `
          <div class="ai-section">
            <h3 style="font-size: 16px; margin-bottom: 15px; color: #ffffff;">
              📊 Scanning Priority Breakdown
            </h3>
            <div class="priority-breakdown">
              <div class="priority-item priority-1">
                <span class="priority-label">Config Files</span>
                <span class="priority-count">${analysis.priorityBreakdown.priority1 || 0}</span>
              </div>
              <div class="priority-item priority-2">
                <span class="priority-label">Model Files</span>
                <span class="priority-count">${analysis.priorityBreakdown.priority2 || 0}</span>
              </div>
              <div class="priority-item priority-3">
                <span class="priority-label">Entry Points</span>
                <span class="priority-count">${analysis.priorityBreakdown.priority3 || 0}</span>
              </div>
              <div class="priority-item priority-4">
                <span class="priority-label">Agentic Systems</span>
                <span class="priority-count">${analysis.priorityBreakdown.priority4 || 0}</span>
              </div>
              <div class="priority-item priority-5">
                <span class="priority-label">Supporting Code</span>
                <span class="priority-count">${analysis.priorityBreakdown.priority5 || 0}</span>
              </div>
            </div>
          </div>
        `;
      }
    }
    
    workflowHTML += '</div>';
    workflowCard.innerHTML = workflowHTML;
    
    section.appendChild(title);
    section.appendChild(workflowCard);
    return section;
  }

  detectAIMLSystems(analysis, repoData) {
    // First check if we have deep scan results (more accurate)
    if (analysis.aiMLDetection && analysis.aiMLDetection.hasAIML) {
      return this.processDeepScanResults(analysis.aiMLDetection, analysis);
    }

    // Fallback to basic detection if deep scan not available
    const detection = {
      hasAIML: false,
      models: [],
      frameworks: [],
      workflows: [],
      agenticSystems: []
    };
    
    // Check key files for AI/ML indicators
    if (analysis && analysis.keyFiles) {
      const filePaths = analysis.keyFiles.map(f => {
        const path = typeof f === 'string' ? f : (f.path || f);
        return typeof path === 'string' ? path.toLowerCase() : '';
      }).filter(p => p).join(' ');
      const allText = analysis ? JSON.stringify(analysis).toLowerCase() : '';
      
      // Detect ML frameworks
      if ((filePaths && filePaths.includes('tensorflow')) || (allText && allText.includes('tensorflow')) || (filePaths && filePaths.includes('tf_'))) {
        detection.hasAIML = true;
        detection.frameworks.push({
          name: 'TensorFlow',
          icon: '🧠',
          version: this.extractVersion('tensorflow', analysis),
          description: 'Deep learning framework'
        });
      }
      
      if ((filePaths && filePaths.includes('pytorch')) || (allText && allText.includes('pytorch')) || (filePaths && filePaths.includes('torch'))) {
        detection.hasAIML = true;
        detection.frameworks.push({
          name: 'PyTorch',
          icon: '🔥',
          version: this.extractVersion('pytorch', analysis),
          description: 'Deep learning framework'
        });
      }
      
      if ((filePaths && filePaths.includes('keras')) || (allText && allText.includes('keras'))) {
        detection.hasAIML = true;
        detection.frameworks.push({
          name: 'Keras',
          icon: '🎯',
          description: 'Neural network API'
        });
      }
      
      if ((filePaths && filePaths.includes('sklearn')) || (allText && allText.includes('scikit-learn')) || (allText && allText.includes('sklearn'))) {
        detection.hasAIML = true;
        detection.frameworks.push({
          name: 'Scikit-learn',
          icon: '📊',
          description: 'Machine learning library'
        });
      }
      
      if ((filePaths && filePaths.includes('transformers')) || (allText && allText.includes('huggingface')) || (allText && allText.includes('transformers'))) {
        detection.hasAIML = true;
        detection.frameworks.push({
          name: 'Hugging Face Transformers',
          icon: '🤗',
          description: 'NLP transformer models'
        });
      }
      
      // Detect common ML model files
      if (filePaths && (filePaths.includes('.h5') || filePaths.includes('.pth') || filePaths.includes('.pkl') || 
          filePaths.includes('.model') || filePaths.includes('weights') || filePaths.includes('checkpoint'))) {
        detection.hasAIML = true;
        detection.models.push({
          name: 'Trained Model',
          icon: '💾',
          framework: 'Detected from file extensions',
          description: 'Model weights or checkpoint files found'
        });
      }
      
      // Detect agentic systems (LangChain, AutoGPT, etc.)
      if ((allText && allText.includes('langchain')) || (filePaths && filePaths.includes('langchain'))) {
        detection.hasAIML = true;
        detection.agenticSystems.push({
          name: 'LangChain',
          icon: '🔗',
          type: 'LLM Framework',
          description: 'Framework for building LLM applications'
        });
        detection.frameworks.push({
          name: 'LangChain',
          icon: '🔗',
          description: 'LLM application framework'
        });
      }
      
      if ((allText && allText.includes('autogpt')) || (allText && allText.includes('auto-gpt')) || (filePaths && filePaths.includes('autogpt'))) {
        detection.hasAIML = true;
        detection.agenticSystems.push({
          name: 'AutoGPT',
          icon: '🤖',
          type: 'Autonomous Agent',
          description: 'Autonomous AI agent system'
        });
      }
      
      if (allText && allText.includes('agent') && (allText.includes('llm') || allText.includes('gpt') || allText.includes('claude'))) {
        detection.hasAIML = true;
        if (!detection.agenticSystems.find(a => a.name === 'Custom Agent')) {
          detection.agenticSystems.push({
            name: 'Custom Agent System',
            icon: '🤖',
            type: 'Agentic System',
            description: 'Custom agentic/AI agent implementation detected'
          });
        }
      }
      
      // Detect ML workflow stages from pipeline description
      if (analysis && analysis.pipeline && typeof analysis.pipeline === 'string') {
        const pipeline = analysis.pipeline.toLowerCase();
        
        if (pipeline.includes('train') || pipeline.includes('training')) {
          detection.workflows.push({
            name: 'Training',
            description: 'Model training stage'
          });
        }
        
        if (pipeline.includes('preprocess') || pipeline.includes('data processing')) {
          detection.workflows.push({
            name: 'Data Preprocessing',
            description: 'Data preparation stage'
          });
        }
        
        if (pipeline.includes('evaluat') || pipeline.includes('test model')) {
          detection.workflows.push({
            name: 'Evaluation',
            description: 'Model evaluation stage'
          });
        }
        
        if (pipeline.includes('inference') || pipeline.includes('predict')) {
          detection.workflows.push({
            name: 'Inference',
            description: 'Model inference/prediction stage'
          });
        }
        
        if (pipeline.includes('deploy') || pipeline.includes('serving')) {
          detection.workflows.push({
            name: 'Deployment',
            description: 'Model deployment stage'
          });
        }
      }
      
      // Detect OpenAI/Anthropic integrations
      if ((allText && allText.includes('openai')) || (filePaths && filePaths.includes('openai'))) {
        detection.hasAIML = true;
        detection.frameworks.push({
          name: 'OpenAI API',
          icon: '🧠',
          description: 'OpenAI API integration'
        });
      }
      
      if ((allText && allText.includes('anthropic')) || (allText && allText.includes('claude'))) {
        detection.hasAIML = true;
        detection.frameworks.push({
          name: 'Anthropic Claude',
          icon: '🤖',
          description: 'Claude API integration'
        });
      }
    }
    
    // Check dependencies
    if (analysis.requirements?.dependencies) {
      analysis.requirements.dependencies.forEach(dep => {
        const depStr = typeof dep === 'string' ? dep.toLowerCase() : JSON.stringify(dep).toLowerCase();
        
        if (depStr.includes('tensorflow') || depStr.includes('torch') || depStr.includes('keras')) {
          detection.hasAIML = true;
        }
      });
    }
    
    return detection;
  }

  // Process deep scan results into display format
  processDeepScanResults(deepScanDetection, analysis) {
    const detection = {
      hasAIML: deepScanDetection.hasAIML || false,
      models: [],
      frameworks: [],
      workflows: [],
      agenticSystems: []
    };

    // Convert deep scan frameworks
    if (deepScanDetection.frameworks && Array.isArray(deepScanDetection.frameworks)) {
      detection.frameworks = deepScanDetection.frameworks.map(fw => ({
        name: fw.name,
        icon: fw.icon || '🔬',
        description: `${fw.files?.length || 0} file(s)`,
        version: null,
        files: fw.files || []
      }));
    }

    // Convert deep scan models
    if (deepScanDetection.models && Array.isArray(deepScanDetection.models)) {
      detection.models = deepScanDetection.models.map(model => ({
        name: model.name,
        icon: model.icon || '💾',
        framework: model.files?.length ? `${model.files.length} file(s)` : 'Detected',
        files: model.files || []
      }));
    }

    // Convert agentic systems
    if (deepScanDetection.agenticSystems && Array.isArray(deepScanDetection.agenticSystems)) {
      detection.agenticSystems = deepScanDetection.agenticSystems.map(agent => ({
        name: agent.name,
        icon: agent.icon || '🤖',
        type: agent.type || 'Agentic System',
        description: `${agent.files?.length || 0} file(s)`,
        files: agent.files || []
      }));
    }

    // Extract workflow from deep scan if available
    if (analysis.workflow && analysis.workflow.stages) {
      detection.workflows = analysis.workflow.stages.map(stage => ({
        name: stage.name,
        description: `${stage.files?.length || 0} file(s)`,
        files: stage.files || []
      }));
    } else if (analysis.pipeline) {
      // Fallback to pipeline analysis
      const pipeline = typeof analysis.pipeline === 'string' ? analysis.pipeline.toLowerCase() : '';
      if (pipeline.includes('train') || pipeline.includes('training')) {
        detection.workflows.push({ name: 'Training', description: 'Model training stage' });
      }
      if (pipeline.includes('inference') || pipeline.includes('predict')) {
        detection.workflows.push({ name: 'Inference', description: 'Model inference stage' });
      }
    }

    return detection;
  }

  truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  extractVersion(packageName, analysis) {
    // Try to extract version from dependencies
    if (analysis.requirements?.dependencies) {
      for (const dep of analysis.requirements.dependencies) {
        const depStr = typeof dep === 'string' ? dep : JSON.stringify(dep);
        const match = depStr.match(new RegExp(`${packageName}[=:]([\\d.]+)`, 'i'));
        if (match) return match[1];
      }
    }
    return null;
  }
}

