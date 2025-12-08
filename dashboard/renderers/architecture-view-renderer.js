// Architecture Visual Dashboard Renderer
// Creates visual representations of repository architecture

class ArchitectureViewRenderer {
  constructor() {
    this.container = null;
  }

  render(analysis, repoData, container) {
    this.container = container;
    container.innerHTML = '';
    
    // Ensure repoData is defined with defaults
    if (!repoData) {
      repoData = {
        repository: analysis?.metadata || {},
        metrics: {
          stars: analysis?.metadata?.stars || 0,
          forks: analysis?.metadata?.forks || 0,
          language: analysis?.metadata?.language || 'Unknown',
          healthScore: analysis?.health?.score || 0,
          healthStatus: analysis?.health?.status || 'unknown'
        },
        analysis: analysis || {}
      };
    }
    
    // Ensure required properties exist
    if (!repoData.repository) repoData.repository = analysis?.metadata || {};
    if (!repoData.metrics) {
      repoData.metrics = {
        stars: analysis?.metadata?.stars || 0,
        forks: analysis?.metadata?.forks || 0,
        language: analysis?.metadata?.language || 'Unknown',
        healthScore: analysis?.health?.score || 0,
        healthStatus: analysis?.health?.status || 'unknown'
      };
    }
    
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    
    try {
      // Enhanced features renderer for new pain-point solving features
      const enhancedRenderer = typeof EnhancedFeaturesRenderer !== 'undefined' 
        ? new EnhancedFeaturesRenderer() : null;
      
      // 1. Related Code Viewer - NEW FEATURE
      if (enhancedRenderer) {
        grid.appendChild(enhancedRenderer.renderRelatedCodeViewer(analysis, repoData, container));
      }
      
      // 2. Interactive Folder Structure Tree - ENHANCED
      if (enhancedRenderer) {
        grid.appendChild(enhancedRenderer.renderInteractiveFolderTree(analysis, repoData, container));
      } else {
        // Fallback to original
        grid.appendChild(this.renderFolderStructure(analysis, repoData));
      }
      
      // 3. Enhanced Tech Stack Visualization - ENHANCED
      if (enhancedRenderer) {
        grid.appendChild(enhancedRenderer.renderTechStackVisualization(analysis, repoData, container));
      } else {
        // Fallback to original
        grid.appendChild(this.renderTechStack(analysis, repoData));
      }
      
      // 4. AI/ML Workflow Detection - NEW FEATURE
      if (enhancedRenderer) {
        grid.appendChild(enhancedRenderer.renderAIMLWorkflowTree(analysis, repoData, container));
      }
      
      // 5. Dependency Graph
      grid.appendChild(this.renderDependencyGraph(analysis, repoData));
      
      // 6. Component Architecture
      grid.appendChild(this.renderComponentArchitecture(analysis));
    } catch (error) {
      console.error('Error rendering architecture sections:', error);
      container.innerHTML = `<div class="error">Error rendering architecture view: ${error?.message || 'Unknown error'}</div>`;
      return;
    }
    
    container.appendChild(grid);
  }

  renderTechStack(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🎨 Tech Stack';
    
    const stackCard = document.createElement('div');
    stackCard.className = 'tech-stack-card';
    
    // Primary language
    if (repoData.metrics?.language) {
      const langCard = document.createElement('div');
      langCard.className = 'tech-item primary';
      langCard.innerHTML = `
        <div class="tech-icon">💻</div>
        <div class="tech-info">
          <div class="tech-name">Primary Language</div>
          <div class="tech-value">${repoData.metrics.language}</div>
        </div>
      `;
      stackCard.appendChild(langCard);
    }
    
    // Dependencies
    if (analysis.requirements?.dependencies && analysis.requirements.dependencies.length > 0) {
      const depsCard = document.createElement('div');
      depsCard.className = 'tech-item';
      depsCard.innerHTML = `
        <div class="tech-icon">📦</div>
        <div class="tech-info">
          <div class="tech-name">Dependencies</div>
          <div class="tech-value">${analysis.requirements.dependencies.length} packages</div>
        </div>
      `;
      stackCard.appendChild(depsCard);
    }
    
    // Key files analysis
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      const filesCard = document.createElement('div');
      filesCard.className = 'tech-item';
      filesCard.innerHTML = `
        <div class="tech-icon">🔑</div>
        <div class="tech-info">
          <div class="tech-name">Key Files</div>
          <div class="tech-value">${analysis.keyFiles.length} critical files</div>
        </div>
      `;
      stackCard.appendChild(filesCard);
    }
    
    // Dependencies list
    if (analysis.requirements?.dependencies && analysis.requirements.dependencies.length > 0) {
      const depsList = document.createElement('div');
      depsList.className = 'dependencies-list';
      depsList.innerHTML = '<h3 style="font-size: 16px; margin-bottom: 12px; color: #ffffff;">Main Dependencies:</h3>';
      
      const depsGrid = document.createElement('div');
      depsGrid.className = 'deps-grid';
      
      analysis.requirements.dependencies.slice(0, 12).forEach(dep => {
        const depTag = document.createElement('span');
        depTag.className = 'dep-tag';
        depTag.textContent = typeof dep === 'string' ? dep : JSON.stringify(dep);
        depsGrid.appendChild(depTag);
      });
      
      depsList.appendChild(depsGrid);
      stackCard.appendChild(depsList);
    }
    
    section.appendChild(title);
    section.appendChild(stackCard);
    return section;
  }

  renderFolderStructure(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📁 Repository Structure';
    
    const treeCard = document.createElement('div');
    treeCard.className = 'folder-tree-card';
    
    // Use key files to show structure
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      const tree = document.createElement('div');
      tree.className = 'folder-tree';
      
      // Group files by directory
      const fileMap = {};
      analysis.keyFiles.forEach(file => {
        const path = file.path || file;
        const parts = path.split('/');
        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';
        
        if (!fileMap[dir]) {
          fileMap[dir] = [];
        }
        fileMap[dir].push({
          name: parts[parts.length - 1],
          fullPath: path,
          importance: typeof file.importance === 'string' ? file.importance : 'Normal',
          purpose: typeof file.purpose === 'string' ? file.purpose : ''
        });
      });
      
      // Render tree
      Object.keys(fileMap).sort().forEach(dir => {
        const dirDiv = document.createElement('div');
        dirDiv.className = 'folder-tree-item';
        
        const dirHeader = document.createElement('div');
        dirHeader.className = 'folder-tree-dir';
        dirHeader.innerHTML = `📁 ${dir === '/' ? 'Root' : dir}`;
        dirDiv.appendChild(dirHeader);
        
        fileMap[dir].forEach(file => {
          const fileDiv = document.createElement('div');
          fileDiv.className = 'folder-tree-file';
          const importanceStr = typeof file.importance === 'string' ? file.importance.toLowerCase() : '';
          const icon = importanceStr.includes('critical') ? '🔴' : 
                      importanceStr.includes('high') ? '🟡' : '⚪';
          fileDiv.innerHTML = `
            <span class="file-icon">${icon}</span>
            <span class="file-name">${file.name}</span>
            ${file.purpose ? `<span class="file-hint">- ${file.purpose.substring(0, 50)}</span>` : ''}
          `;
          dirDiv.appendChild(fileDiv);
        });
        
        tree.appendChild(dirDiv);
      });
      
      treeCard.appendChild(tree);
    } else {
      treeCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No file structure data available</p>';
    }
    
    section.appendChild(title);
    section.appendChild(treeCard);
    return section;
  }

  renderDependencyGraph(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔗 Dependency Graph';
    
    const graphCard = document.createElement('div');
    graphCard.className = 'dependency-graph-card';
    
    if (analysis.requirements?.dependencies && analysis.requirements.dependencies.length > 0) {
      const graph = document.createElement('div');
      graph.className = 'dependency-graph';
      
      // Get repository name safely
      const repoName = repoData?.repository?.name || 
                      repoData?.repository?.repo || 
                      analysis?.metadata?.repo ||
                      analysis?.metadata?.owner && analysis?.metadata?.repo ? 
                        `${analysis.metadata.owner}/${analysis.metadata.repo}` : 
                      'Repository';
      
      // Create dependency nodes
      const centerNode = document.createElement('div');
      centerNode.className = 'dep-node center';
      centerNode.innerHTML = `
        <div class="dep-node-content">
          <div class="dep-node-icon">📦</div>
          <div class="dep-node-label">${repoName}</div>
        </div>
      `;
      graph.appendChild(centerNode);
      
      // Create dependency nodes around center
      const deps = analysis.requirements.dependencies.slice(0, 8);
      deps.forEach((dep, index) => {
        const node = document.createElement('div');
        node.className = 'dep-node';
        const depName = typeof dep === 'string' ? dep.split('@')[0].split('/').pop() : JSON.stringify(dep).substring(0, 20);
        node.innerHTML = `
          <div class="dep-node-content">
            <div class="dep-node-icon">📚</div>
            <div class="dep-node-label">${depName}</div>
          </div>
        `;
        const angle = (index * (360 / deps.length)) * (Math.PI / 180);
        const radius = 100;
        node.style.position = 'absolute';
        node.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        node.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
        node.style.transform = 'translate(-50%, -50%)';
        graph.appendChild(node);
      });
      
      graphCard.appendChild(graph);
    } else {
      graphCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No dependency information available</p>';
    }
    
    section.appendChild(title);
    section.appendChild(graphCard);
    return section;
  }

  renderComponentArchitecture(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🧩 Component Architecture';
    
    const archCard = document.createElement('div');
    archCard.className = 'architecture-card';
    
    if (analysis.pipeline) {
      const archText = document.createElement('p');
      archText.className = 'architecture-text';
      archText.textContent = analysis.pipeline;
      archCard.appendChild(archText);
    } else if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      // Show component relationships based on key files
      const components = document.createElement('div');
      components.className = 'components-grid';
      
      analysis.keyFiles.slice(0, 6).forEach(file => {
        const comp = document.createElement('div');
        comp.className = 'component-card';
        const fileName = (file.path || file).split('/').pop();
        comp.innerHTML = `
          <div class="component-name">${fileName}</div>
          <div class="component-purpose">${file.purpose || file.importance || 'Component'}</div>
        `;
        components.appendChild(comp);
      });
      
      archCard.appendChild(components);
    } else {
      archCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No architecture information available</p>';
    }
    
    section.appendChild(title);
    section.appendChild(archCard);
    return section;
  }
}

