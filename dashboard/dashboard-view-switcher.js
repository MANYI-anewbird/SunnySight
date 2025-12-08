// Dashboard View Switcher
// Manages navigation between different dashboard views

class DashboardViewSwitcher {
  constructor(analysis, repoData, a2uiProtocol = null) {
    this.analysis = analysis || {};
    
    // Ensure repoData always has proper structure
    this.repoData = repoData || {
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
    
    // Merge any existing repoData properties
    if (repoData) {
      this.repoData = {
        repository: repoData.repository || this.repoData.repository,
        metrics: { ...this.repoData.metrics, ...(repoData.metrics || {}) },
        analysis: repoData.analysis || this.repoData.analysis,
        ...repoData
      };
    }
    
    this.a2uiProtocol = a2uiProtocol;
    this.currentView = 'overview';
    this.container = null;
  }

  render(container) {
    this.container = container;
    
    // Create navigation bar
    const nav = document.createElement('div');
    nav.className = 'dashboard-nav';
    nav.id = 'dashboard-nav';
    
    const views = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'architecture', label: 'Architecture', icon: '🏗️' },
      { id: 'security-review', label: 'Security & Review', icon: '🔒' }
    ];

    views.forEach(view => {
      const btn = document.createElement('button');
      btn.className = `nav-btn ${this.currentView === view.id ? 'active' : ''}`;
      btn.innerHTML = `${view.icon} ${view.label}`;
      btn.onclick = () => this.switchView(view.id);
      btn.setAttribute('data-view', view.id);
      nav.appendChild(btn);
    });

    // Insert navigation after header, before content
    const header = container.querySelector('.dashboard-header');
    const contentEl = document.getElementById('dashboard-content');
    const loadingEl = document.getElementById('loading');
    
    console.log('Inserting navigation. Header:', !!header, 'Content:', !!contentEl, 'Loading:', !!loadingEl);
    
    // Try multiple insertion strategies
    let inserted = false;
    
    if (header && header.nextSibling) {
      // Insert after header
      header.parentNode.insertBefore(nav, header.nextSibling);
      inserted = true;
      console.log('✅ Navigation inserted after header');
    } else if (header) {
      // Insert after header (no next sibling)
      header.after(nav);
      inserted = true;
      console.log('✅ Navigation inserted after header (using after())');
    } else if (contentEl && contentEl.parentNode) {
      // Insert before content
      contentEl.parentNode.insertBefore(nav, contentEl);
      inserted = true;
      console.log('✅ Navigation inserted before content');
    } else if (loadingEl && loadingEl.parentNode) {
      // Insert after loading (which should be hidden)
      loadingEl.parentNode.insertBefore(nav, loadingEl.nextSibling);
      inserted = true;
      console.log('✅ Navigation inserted after loading');
    } else {
      // Insert at the beginning of container
      if (container.firstChild) {
        container.insertBefore(nav, container.firstChild);
      } else {
        container.appendChild(nav);
      }
      inserted = true;
      console.log('✅ Navigation inserted at container start');
    }
    
    // Make sure navigation is visible
    nav.style.display = 'flex';
    nav.style.visibility = 'visible';
    nav.style.opacity = '1';
    nav.style.width = '100%';
    nav.style.position = 'relative';
    nav.style.zIndex = '10';
    
    console.log('Navigation bar created with', views.length, 'buttons');
    console.log('Navigation inserted:', inserted);
    console.log('Navigation in DOM:', document.contains(nav));
    console.log('Navigation parent:', nav.parentElement?.className || nav.parentElement?.tagName);
    
    // Double-check it's visible
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(nav);
      console.log('Navigation computed styles:', {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        width: computedStyle.width
      });
    }, 50);

    // Render initial view
    this.renderCurrentView();
  }

  switchView(viewId) {
    this.currentView = viewId;
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === viewId) {
        btn.classList.add('active');
      }
    });

    // Render new view
    this.renderCurrentView();
  }

  renderCurrentView() {
    const contentEl = document.getElementById('dashboard-content');
    if (!contentEl) {
      console.error('Dashboard content element not found');
      return;
    }

    // Clear previous content
    contentEl.innerHTML = '';
    
    try {
      switch(this.currentView) {
        case 'overview':
          // Use enhanced OverviewRenderer with folder structure, code viewer, agents, and APIs
          if (typeof OverviewRenderer !== 'undefined') {
            new OverviewRenderer().render(this.analysis, this.repoData, contentEl);
            console.log('Overview rendered with enhanced OverviewRenderer');
          } else {
            // Fallback to simple renderer
            new SimpleDashboardRenderer().render(this.analysis, this.repoData, contentEl);
          }
          break;
        case 'architecture':
          // Try A2UI protocol for architecture view first
          this.renderArchitectureWithA2UI(contentEl);
          break;
        case 'security-review':
          // Render merged Security & Review view
          this.renderSecurityReviewView(contentEl);
          break;
        default:
          new SimpleDashboardRenderer().render(this.analysis, this.repoData, contentEl);
      }
    } catch (error) {
      console.error(`Error rendering ${this.currentView} view:`, error);
      contentEl.innerHTML = `<div class="error">Error loading ${this.currentView} view: ${error.message}</div>`;
    }
  }

  async renderArchitectureWithA2UI(container) {
    // Ensure repoData is defined
    const safeRepoData = this.repoData || {
      repository: this.analysis?.metadata || {},
      metrics: {
        stars: this.analysis?.metadata?.stars || 0,
        forks: this.analysis?.metadata?.forks || 0,
        language: this.analysis?.metadata?.language || 'Unknown',
        healthScore: this.analysis?.health?.score || 0,
        healthStatus: this.analysis?.health?.status || 'unknown'
      },
      analysis: this.analysis || {}
    };

    // Check if we have API keys to generate A2UI protocol
    try {
      const { geminiKey, openaiKey } = await apiService.getAPIKeys();
      
      if (geminiKey || openaiKey) {
        console.log('Generating A2UI protocol for Architecture view...');
        
        // Show loading state
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Generating architecture visualization...</p></div>';
        
        try {
          // Create architecture-specific instructions
          const instructions = dashboardService.createArchitectureA2UIInstructions(safeRepoData);
          
          // Generate A2UI protocol (with timeout)
          let a2uiProtocol = null;
          const generatePromise = geminiKey 
            ? dashboardService.generateA2UIProtocol(safeRepoData, instructions, geminiKey, false)
            : dashboardService.generateA2UIProtocol(safeRepoData, instructions, openaiKey, true);
          
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('A2UI generation timeout (15s)')), 15000)
          );
          
          a2uiProtocol = await Promise.race([generatePromise, timeoutPromise]);
          
          // Render with A2UI if successful
          if (a2uiProtocol && Array.isArray(a2uiProtocol) && a2uiProtocol.length > 0) {
            const renderer = new A2UIRenderer();
            renderer.render(a2uiProtocol, safeRepoData, container, this.analysis);
            console.log('Architecture view rendered with A2UI protocol');
            return;
          }
        } catch (error) {
          console.warn('A2UI generation failed for Architecture, using fallback:', error.message);
          // Fall through to fallback renderer
        }
      }
    } catch (error) {
      console.warn('Failed to get API keys for Architecture A2UI:', error.message);
    }
    
    // Fallback to custom renderer
    if (typeof ArchitectureViewRenderer !== 'undefined') {
      try {
        new ArchitectureViewRenderer().render(this.analysis, safeRepoData, container);
      } catch (error) {
        console.error('Architecture render error:', error);
        container.innerHTML = `<div class="error">Error loading architecture view: ${error?.message || 'Unknown error'}</div>`;
      }
    } else {
      this.showNotAvailable(container, 'Architecture View');
    }
  }

  renderSecurityReviewView(container) {
    container.innerHTML = '';
    
    // Use the new combined SecurityReviewRenderer
    if (typeof SecurityReviewRenderer !== 'undefined') {
      try {
        new SecurityReviewRenderer().render(this.analysis, this.repoData, container);
        console.log('Security & Review view rendered');
      } catch (error) {
        console.error('SecurityReviewRenderer error:', error);
        container.innerHTML = `<div class="error">Error loading Security & Review view: ${error.message}</div>`;
      }
    } else {
      // Fallback to individual renderers
      const grid = document.createElement('div');
      grid.className = 'dashboard-grid';
      
      if (typeof SecurityViewRenderer !== 'undefined') {
        const securitySection = document.createElement('div');
        new SecurityViewRenderer().render(this.analysis, this.repoData, securitySection);
        grid.appendChild(securitySection);
      }
      
      if (typeof PRReviewViewRenderer !== 'undefined') {
        const reviewSection = document.createElement('div');
        new PRReviewViewRenderer().render(this.analysis, this.repoData, reviewSection);
        grid.appendChild(reviewSection);
      }
      
      container.appendChild(grid);
    }
  }


  showNotAvailable(container, viewName) {
    container.innerHTML = `
      <div class="dashboard-section">
        <h2 class="section-title">${viewName}</h2>
        <p style="color: #b8c5d6; text-align: center; padding: 40px;">
          ${viewName} is loading... Please wait.
        </p>
      </div>
    `;
  }
}

