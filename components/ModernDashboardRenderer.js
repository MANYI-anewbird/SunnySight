// Modern Dashboard Renderer
// Renders the new 3-column glassmorphic cockpit layout

class ModernDashboardRenderer {
  constructor() {
    this.container = null;
    this.analysis = null;
    this.repoData = null;
    this.codeEditorPanel = null;
  }

  render(analysis, repoData, container) {
    this.container = container;
    this.analysis = analysis || {};
    this.repoData = repoData || {};
    
    // Clear container - but preserve loading/error elements if they exist
    const loadingEl = container.querySelector('#loading');
    const errorEl = container.querySelector('#error');
    
    container.innerHTML = '';
    
    // Re-append loading/error if they were there
    if (loadingEl) container.appendChild(loadingEl);
    if (errorEl) container.appendChild(errorEl);
    
    // Hide loading now
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    
    // Create 3-column layout
    const layout = document.createElement('div');
    layout.className = 'modern-dashboard-layout';
    layout.style.cssText = 'display: grid; grid-template-columns: 280px 1fr 320px; min-height: 100vh; gap: 0;';
    
    // Left Sidebar
    const sidebar = new RepoSidebar(analysis, repoData).render();
    
    // Main Center Column
    const mainColumn = this.createMainColumn();
    
    // Right Sidebar (Code Editor + Use Cases)
    const rightColumn = this.createRightColumn();
    
    layout.appendChild(sidebar);
    layout.appendChild(mainColumn);
    layout.appendChild(rightColumn);
    
    container.appendChild(layout);
    
    // Store code editor reference
    this.codeEditorPanel = rightColumn.querySelector('#code-editor-panel');
  }

  createMainColumn() {
    const main = document.createElement('div');
    main.className = 'main-column';
    main.style.cssText = 'background: #0f172a; padding: 2rem; overflow-y: auto;';
    
    // Tabbed Interface
    const tabbedInterface = this.createTabbedInterface();
    main.appendChild(tabbedInterface);
    
    return main;
  }

  createTabbedInterface() {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tabbed-interface';
    
    // Tab Navigation
    const tabNav = document.createElement('div');
    tabNav.className = 'tab-nav';
    tabNav.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 2px solid rgba(51, 65, 85, 0.6);';
    
    const tabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'architecture', label: 'Architecture', icon: '🏗️' },
      { id: 'security-review', label: 'Security & Review', icon: '🔒' },
      { id: 'run', label: 'Run & Deploy', icon: '🚀' }
    ];
    
    tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `tab-btn ${tab.id === 'overview' ? 'active' : ''}`;
      tabBtn.dataset.tab = tab.id;
      tabBtn.style.cssText = `
        padding: 0.75rem 1.5rem;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #94a3b8;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: -2px;
      `;
      tabBtn.innerHTML = `${tab.icon} ${tab.label}`;
      tabBtn.addEventListener('click', () => this.switchTab(tab.id, tabContainer));
      
      tabBtn.addEventListener('mouseenter', () => {
        if (!tabBtn.classList.contains('active')) {
          tabBtn.style.color = '#e2e8f0';
        }
      });
      
      tabBtn.addEventListener('mouseleave', () => {
        if (!tabBtn.classList.contains('active')) {
          tabBtn.style.color = '#94a3b8';
        }
      });
      
      tabNav.appendChild(tabBtn);
    });
    
    // Tab Content Container
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.id = 'tab-content';
    
    tabContainer.appendChild(tabNav);
    tabContainer.appendChild(tabContent);
    
    // Render initial tab
    this.switchTab('overview', tabContainer);
    
    return tabContainer;
  }

  switchTab(tabId, container) {
    // Update active tab button
    container.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
        btn.style.color = '#ffffff';
        btn.style.borderBottomColor = '#667eea';
      } else {
        btn.classList.remove('active');
        btn.style.color = '#94a3b8';
        btn.style.borderBottomColor = 'transparent';
      }
    });
    
    // Render tab content
    const tabContent = container.querySelector('#tab-content');
    if (!tabContent) return;
    
    tabContent.innerHTML = '';
    
    switch(tabId) {
      case 'overview':
        this.renderOverviewTab(tabContent);
        break;
      case 'architecture':
        this.renderArchitectureTab(tabContent);
        break;
      case 'security-review':
        this.renderSecurityReviewTab(tabContent);
        break;
      case 'run':
        this.renderRunTab(tabContent);
        break;
    }
  }

  renderOverviewTab(container) {
    // Start Here Card
    const startCard = new StartHereCard(this.analysis, this.repoData).render();
    container.appendChild(startCard);
    
    // Folder Structure Tree
    if (typeof FolderStructureTree !== 'undefined') {
      const folderTree = new FolderStructureTree(this.analysis, this.repoData).render();
      container.appendChild(folderTree);
    }
    
    // Two column grid for Tech Stack and Architecture Orb
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;';
    
    // Tech Stack Ring
    const techStack = new TechStackRing(this.analysis, this.repoData).render();
    grid.appendChild(techStack);
    
    // Architecture Orb 3D
    const architectureOrb = new ArchitectureOrb3D(this.analysis, this.repoData).render();
    grid.appendChild(architectureOrb);
    
    container.appendChild(grid);
    
    // AI/ML Workflow Panel
    if (typeof AIMLWorkflowPanel !== 'undefined') {
      const aiMLPanel = new AIMLWorkflowPanel(this.analysis, this.repoData).render();
      container.appendChild(aiMLPanel);
    }
    
    // Summary section (if available)
    if (this.analysis.summary) {
      const summaryCard = document.createElement('div');
      summaryCard.className = 'card-glass p-6 mb-6';
      summaryCard.innerHTML = `
        <h3 class="text-xl font-bold text-white mb-4">📝 Summary</h3>
        <p class="text-slate-300 leading-relaxed">${this.escapeHtml(this.analysis.summary)}</p>
      `;
      container.appendChild(summaryCard);
    }
    
    // Make responsive
    const updateGridLayout = () => {
      if (window.innerWidth < 1024) {
        grid.style.gridTemplateColumns = '1fr';
      } else {
        grid.style.gridTemplateColumns = '1fr 1fr';
      }
    };
    
    updateGridLayout();
    window.addEventListener('resize', updateGridLayout);
  }

  renderArchitectureTab(container) {
    // Use ArchitectureViewRenderer from previous version
    if (typeof ArchitectureViewRenderer !== 'undefined') {
      try {
        const archRenderer = new ArchitectureViewRenderer();
        archRenderer.render(this.analysis, this.repoData, container);
        return; // Success, exit early
      } catch (error) {
        console.warn('ArchitectureViewRenderer failed, using fallback:', error);
        // Fall through to fallback
      }
    }
    
    // Fallback: Component-based approach
    container.innerHTML = '';
    
    // Create wrapper for Enhanced Features
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 1.5rem;';
    
    // Enhanced Tech Stack Visualization
    if (typeof EnhancedFeaturesRenderer !== 'undefined') {
      try {
        const enhancedRenderer = new EnhancedFeaturesRenderer();
        const techStackViz = enhancedRenderer.renderTechStackVisualization(this.analysis, this.repoData, wrapper);
        if (techStackViz) wrapper.appendChild(techStackViz);
        
        // Interactive Folder Tree
        const folderTree = enhancedRenderer.renderInteractiveFolderTree(this.analysis, this.repoData, wrapper);
        if (folderTree) wrapper.appendChild(folderTree);
        
        // Related Code Viewer
        const relatedCode = enhancedRenderer.renderRelatedCodeViewer(this.analysis, this.repoData, wrapper);
        if (relatedCode) wrapper.appendChild(relatedCode);
        
        // AI/ML Workflow
        const aiMLWorkflow = enhancedRenderer.renderAIMLWorkflowTree(this.analysis, this.repoData, wrapper);
        if (aiMLWorkflow) wrapper.appendChild(aiMLWorkflow);
      } catch (error) {
        console.warn('EnhancedFeaturesRenderer error:', error);
      }
    }
    
    // System Message Explorer
    if (typeof SystemMessageExplorer !== 'undefined') {
      const systemMessages = new SystemMessageExplorer(this.analysis, this.repoData).render();
      wrapper.appendChild(systemMessages);
    }
    
    // Agent Graph Panel
    if (typeof AgentGraphPanel !== 'undefined') {
      const agentGraph = new AgentGraphPanel(this.analysis, this.repoData).render();
      wrapper.appendChild(agentGraph);
    }
    
    container.appendChild(wrapper);
  }

  renderSecurityReviewTab(container) {
    // Use SecurityReviewRenderer from previous version
    if (typeof SecurityReviewRenderer !== 'undefined') {
      try {
        const securityRenderer = new SecurityReviewRenderer();
        securityRenderer.render(this.analysis, this.repoData, container);
        return; // Success, exit early
      } catch (error) {
        console.warn('SecurityReviewRenderer failed, using fallback:', error);
        // Fall through to fallback
      }
    }
    
    // Fallback: Basic security info
    container.innerHTML = `
      <div class="card-glass p-6 mb-6">
        <h3 class="text-xl font-bold text-white mb-4">🔒 Security & Review</h3>
        <p class="text-slate-400">Security review renderer not available</p>
      </div>
    `;
  }

  renderRunTab(container) {
    // Run & Deploy Recipe Cards
    const runRecipes = new RunRecipeCard(this.analysis, this.repoData).render();
    container.appendChild(runRecipes);
  }

  createRightColumn() {
    const rightCol = document.createElement('div');
    rightCol.className = 'right-column';
    rightCol.style.cssText = 'background: #0f172a; border-left: 1px solid rgba(51, 65, 85, 0.6); display: flex; flex-direction: column;';
    
    // Code Editor Panel (top)
    const codeEditor = new CodeEditorPanel().render();
    rightCol.appendChild(codeEditor);
    
    // Use Case Panel (bottom)
    const useCasePanel = new UseCasePanel(this.analysis, this.repoData).render();
    rightCol.appendChild(useCasePanel);
    
    return rightCol;
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
  window.ModernDashboardRenderer = ModernDashboardRenderer;
}

