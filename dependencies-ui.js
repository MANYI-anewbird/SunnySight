// Dependencies UI - A2UI View with Security
document.addEventListener('DOMContentLoaded', async () => {
  const backBtn = document.getElementById('back-btn');
  const dependenciesContent = document.getElementById('dependencies-content');
  const securityContent = document.getElementById('security-content');

  // Back button handler
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Close current tab or navigate back
      chrome.tabs.getCurrent((tab) => {
        if (tab) {
          chrome.tabs.remove(tab.id);
        } else {
          window.close();
        }
      });
    });
  }

  // Load dependencies data from storage
  async function loadDependenciesData() {
    try {
      // Get current tab to extract repo info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('github.com')) {
        dependenciesContent.innerHTML = '<p class="empty-state">Please open a GitHub repository page first</p>';
        securityContent.innerHTML = '<p class="empty-state">Please open a GitHub repository page first</p>';
        return;
      }

      const urlMatch = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        dependenciesContent.innerHTML = '<p class="empty-state">Unable to parse repository URL</p>';
        securityContent.innerHTML = '<p class="empty-state">Unable to parse repository URL</p>';
        return;
      }

      const [, owner, repo] = urlMatch;
      const repoName = repo.replace(/\/$/, '');
      const cacheKey = `analysis_${owner}_${repoName}`;

      // Get cached analysis
      chrome.storage.local.get([cacheKey], (result) => {
        const cached = result[cacheKey];
        if (cached && cached.analysis) {
          displayDependencies(cached.analysis);
          displaySecurity(cached.analysis);
        } else {
          dependenciesContent.innerHTML = '<p class="empty-state">No analysis data found. Please analyze the repository first.</p>';
          securityContent.innerHTML = '<p class="empty-state">No analysis data found. Please analyze the repository first.</p>';
        }
      });
    } catch (error) {
      console.error('Error loading dependencies data:', error);
      dependenciesContent.innerHTML = '<p class="empty-state">Error loading data</p>';
      securityContent.innerHTML = '<p class="empty-state">Error loading data</p>';
    }
  }

  function displayDependencies(analysis) {
    if (!analysis.requirements) {
      dependenciesContent.innerHTML = '<p class="empty-state">No dependencies data available</p>';
      return;
    }

    const req = analysis.requirements;
    let html = '<div class="a2ui-container">';
    
    if (req.dependencies && req.dependencies.length > 0) {
      html += `<div class="req-section"><strong>Dependencies:</strong><ul>`;
      req.dependencies.forEach(dep => {
        html += `<li>${dep}</li>`;
      });
      html += `</ul></div>`;
    }

    if (req.environment) {
      html += `<div class="req-section"><strong>Environment:</strong><p>${req.environment}</p></div>`;
    }

    if (req.installation) {
      html += `<div class="req-section"><strong>Installation:</strong><p>${req.installation}</p></div>`;
    }

    if (req.warnings && req.warnings.length > 0) {
      html += `<div class="req-section warnings"><strong>⚠️ Warnings:</strong><ul>`;
      req.warnings.forEach(warning => {
        html += `<li>${warning}</li>`;
      });
      html += `</ul></div>`;
    }

    html += '</div>';
    dependenciesContent.innerHTML = html || '<div class="empty-state">No dependency information available</div>';
  }

  function displaySecurity(analysis) {
    // A2UI Security placeholder - will be enhanced later
    const req = analysis.requirements || {};
    const warnings = req.warnings || [];
    
    let html = '<div class="a2ui-container security-container">';
    
    if (warnings.length > 0) {
      html += '<div class="security-risks">';
      html += '<h3>⚠️ Security Risks Detected</h3>';
      html += '<ul class="security-list">';
      warnings.forEach(warning => {
        html += `<li class="security-item">${warning}</li>`;
      });
      html += '</ul></div>';
    } else {
      html += '<div class="security-safe">';
      html += '<h3>✅ No Security Risks Detected</h3>';
      html += '<p>No obvious security warnings found in dependencies.</p>';
      html += '</div>';
    }

    html += '</div>';
    securityContent.innerHTML = html;
  }

  // Load data on page load
  await loadDependenciesData();
});

