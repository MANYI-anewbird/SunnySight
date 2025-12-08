// Dashboard initialization script
// Loads dashboard data and renders it using SimpleDashboardRenderer

(function() {
  'use strict';

  // Get dashboard key from URL
  const urlParams = new URLSearchParams(window.location.search);
  const dashboardKey = urlParams.get('key');

  if (!dashboardKey) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = 'No dashboard key provided';
    return;
  }

  // Load dashboard data
  chrome.storage.local.get([dashboardKey], (result) => {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const contentEl = document.getElementById('dashboard-content');

    console.log('Dashboard key:', dashboardKey);
    console.log('Storage result:', result);

    if (!result || !result[dashboardKey]) {
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
      errorEl.innerHTML = 'Dashboard data not found. Please try generating the dashboard again.';
      return;
    }

    const dashboardData = result[dashboardKey];
    console.log('Dashboard data:', dashboardData);

    // Get analysis data - try multiple paths to find it
    let analysisJson = dashboardData.analysisJson || 
                      dashboardData.repoData?.analysis || 
                      dashboardData.repoData?.fullAnalysis || 
                      dashboardData.analysis || {};
    
    // Ensure repoData has proper structure
    const repoData = dashboardData.repoData || {
      repository: dashboardData.repository || {},
      metrics: dashboardData.metrics || {},
      analysis: analysisJson
    };

    // If analysis is empty, try to get it from repoData
    if (!analysisJson || Object.keys(analysisJson).length === 0) {
      analysisJson = repoData.analysis || repoData.fullAnalysis || {};
    }

    console.log('Analysis data:', analysisJson);
    console.log('Repo data:', repoData);

    // Try Modern Dashboard Renderer first (new 3-column glassmorphic layout)
    if (analysisJson && typeof analysisJson === 'object' && Object.keys(analysisJson).length > 0) {
      try {
        // Try Modern Dashboard Renderer first
        console.log('Checking for ModernDashboardRenderer...', typeof ModernDashboardRenderer);
        console.log('Available window globals:', Object.keys(window).filter(k => k.includes('Dashboard') || k.includes('Renderer')));
        
        if (typeof ModernDashboardRenderer !== 'undefined') {
          console.log('✅ ModernDashboardRenderer found! Initializing...');
          console.log('Analysis data keys:', Object.keys(analysisJson));
          console.log('RepoData keys:', Object.keys(repoData));
          
          const modernRenderer = new ModernDashboardRenderer();
          modernRenderer.render(analysisJson, repoData, contentEl);
          loadingEl.style.display = 'none';
          console.log('✅ Modern dashboard renderer initialized successfully!');
          return;
        } else {
          console.warn('⚠️ ModernDashboardRenderer is undefined!');
          console.warn('Available components:', {
            RepoSidebar: typeof RepoSidebar,
            TechStackRing: typeof TechStackRing,
            ArchitectureOrb3D: typeof ArchitectureOrb3D,
            ModernDashboardRenderer: typeof ModernDashboardRenderer
          });
        }
        
        // Fallback to view switcher
        console.log('Modern renderer not available, using view switcher...');
        const a2uiProtocol = dashboardData.protocol || null;
        const switcher = new DashboardViewSwitcher(analysisJson, repoData, a2uiProtocol);
        const dashboardContainer = document.querySelector('.dashboard-container');
        
        if (dashboardContainer) {
          switcher.render(dashboardContainer);
          loadingEl.style.display = 'none';
          console.log('✅ Dashboard view switcher initialized');
        } else {
          console.warn('Dashboard container not found, using content element...');
          switcher.render(contentEl.parentElement || contentEl);
          loadingEl.style.display = 'none';
        }
      } catch (error) {
        console.error('Dashboard renderer error:', error);
        console.error('Error stack:', error.stack);
        // Final fallback to simple renderer
        try {
          new SimpleDashboardRenderer().render(analysisJson, repoData, contentEl);
          loadingEl.style.display = 'none';
        } catch (fallbackError) {
          loadingEl.style.display = 'none';
          errorEl.style.display = 'block';
          const errorMsg = error?.message || error?.toString() || 'Unknown error';
          errorEl.innerHTML = `Error rendering dashboard: ${errorMsg}<br><br>Check console (F12) for details.`;
        }
      }
    } else {
      // No analysis data - show error with helpful message
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
      const dataPreview = JSON.stringify(dashboardData, null, 2).substring(0, 500);
      errorEl.innerHTML = 'Error: No analysis data found.<br><br>Please analyze the repository first, then create the dashboard.<br><br>Dashboard data structure:<br><pre style="font-size: 12px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; overflow: auto; max-height: 200px;">' + dataPreview + '</pre>';
      console.error('No valid analysis data found:', {
        analysisJson,
        repoData,
        dashboardData
      });
    }
  });
})();

