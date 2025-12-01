// Popup logic - Main entry point for repository analysis

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');
  const errorMessage = error.querySelector('.error-message');
  const settingsWarning = document.getElementById('settings-warning');

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  // Settings button handlers
  const settingsBtn = document.getElementById('settings-btn');
  const settingsBtnInline = document.getElementById('settings-btn-inline');
  const settingsBtnFooter = document.getElementById('settings-btn-footer');
  
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (settingsBtnInline) settingsBtnInline.addEventListener('click', openSettings);
  if (settingsBtnFooter) settingsBtnFooter.addEventListener('click', openSettings);

  try {
    // Check if API keys are configured
    const { openaiKey } = await new Promise((resolve) => {
      chrome.storage.sync.get(['openaiKey'], resolve);
    });

    if (!openaiKey) {
      showSettingsWarning();
    }

    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if on GitHub page
    if (!tab.url || !tab.url.includes('github.com')) {
      showError('Please open a GitHub repository page first');
      return;
    }

    // Extract owner and repo from URL
    const urlMatch = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      showError('Unable to parse repository URL. Make sure you are on a repository page.');
      return;
    }

    const [, owner, repo] = urlMatch;
    const repoName = repo.replace(/\/$/, ''); // Remove trailing slash

    // Start analysis
    loading.style.display = 'flex';
    error.style.display = 'none';
    content.style.display = 'none';

    try {
      const analysis = await repoAnalyzer.analyzeRepository(owner, repoName);
      displayAnalysis(analysis);
    } catch (err) {
      console.error('Analysis error:', err);
      
      if (err.message.includes('OpenAI API key')) {
        showError('OpenAI API key not configured. Please configure it in settings.', true);
      } else if (err.message.includes('OpenAI API error')) {
        showError('OpenAI API error: ' + err.message + '. Please check your API key.', true);
      } else if (err.message.includes('GitHub API error')) {
        showError('GitHub API error: ' + err.message + '. The repository may be private or not found.');
      } else {
        showError('Analysis failed: ' + err.message);
      }
    }

  } catch (err) {
    console.error('Error:', err);
    showError('An error occurred: ' + err.message);
  }

  function showError(message, showSettings = false) {
    loading.style.display = 'none';
    content.style.display = 'none';
    error.style.display = 'block';
    errorMessage.textContent = message;
    
    const settingsBtn = document.getElementById('settings-btn');
    if (showSettings && settingsBtn) {
      settingsBtn.style.display = 'inline-block';
    } else if (settingsBtn) {
      settingsBtn.style.display = 'none';
    }
  }

  function showSettingsWarning() {
    settingsWarning.style.display = 'block';
  }

  function displayAnalysis(analysis) {
    loading.style.display = 'none';
    error.style.display = 'none';
    content.style.display = 'block';

    // Feature 1: AI Repo Summary
    const summaryEl = document.getElementById('repo-summary');
    summaryEl.textContent = analysis.summary || 'No summary available';

    // Feature 2: Key File Highlighter
    const keyFilesEl = document.getElementById('key-files');
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      keyFilesEl.innerHTML = '';
      analysis.keyFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'key-file-item';
        fileItem.innerHTML = `
          <div class="key-file-path">📄 ${file.path}</div>
          <div class="key-file-purpose">${file.purpose || file.importance || ''}</div>
          ${file.importance ? `<div class="key-file-importance">💡 ${file.importance}</div>` : ''}
        `;
        keyFilesEl.appendChild(fileItem);
      });
    } else {
      keyFilesEl.innerHTML = '<p class="empty-state">No key files identified</p>';
    }

    // Feature 3: Architecture / Pipeline Explanation
    const pipelineEl = document.getElementById('pipeline-explanation');
    pipelineEl.textContent = analysis.pipeline || 'Unable to analyze architecture';

    // Feature 4: Smart Use-Case Recommendations
    const useCasesEl = document.getElementById('use-cases');
    if (analysis.useCases && analysis.useCases.length > 0) {
      useCasesEl.innerHTML = '';
      analysis.useCases.forEach(useCase => {
        const li = document.createElement('li');
        li.textContent = useCase;
        useCasesEl.appendChild(li);
      });
    } else {
      useCasesEl.innerHTML = '<li class="empty-state">No use cases identified</li>';
    }

    // Feature 5: Dependency & Environment Auditor
    const requirementsEl = document.getElementById('requirements');
    if (analysis.requirements) {
      const req = analysis.requirements;
      let html = '';
      
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

      requirementsEl.innerHTML = html || '<div class="empty-state">No dependency information available</div>';
    } else {
      requirementsEl.innerHTML = '<div class="empty-state">No dependency information available</div>';
    }

    // Feature 6: Repo Health Check
    const healthEl = document.getElementById('health-check');
    if (analysis.health) {
      const health = analysis.health;
      const statusClass = `health-${health.status}`;
      
      let html = `
        <div class="health-header">
          <div class="health-score ${statusClass}">
            <div class="health-score-value">${health.score || 0}</div>
            <div class="health-score-label">Health Score</div>
          </div>
          <div class="health-status ${statusClass}">
            <span class="status-badge">${health.status.toUpperCase()}</span>
            <p class="status-maintenance">${health.maintenance || 'Unknown'}</p>
          </div>
        </div>
      `;

      if (health.indicators && health.indicators.length > 0) {
        html += `<div class="health-section"><strong>✅ Indicators:</strong><ul>`;
        health.indicators.forEach(indicator => {
          html += `<li>${indicator}</li>`;
        });
        html += `</ul></div>`;
      }

      if (health.concerns && health.concerns.length > 0) {
        html += `<div class="health-section concerns"><strong>⚠️ Concerns:</strong><ul>`;
        health.concerns.forEach(concern => {
          html += `<li>${concern}</li>`;
        });
        html += `</ul></div>`;
      }

      healthEl.innerHTML = html;
    } else {
      healthEl.innerHTML = '<div class="empty-state">Unable to assess repository health</div>';
    }

    // Metadata
    if (analysis.metadata) {
      const meta = analysis.metadata;
      document.getElementById('meta-stars').textContent = meta.stars || '0';
      document.getElementById('meta-forks').textContent = meta.forks || '0';
      document.getElementById('meta-language').textContent = meta.language || 'Unknown';
      document.getElementById('meta-license').textContent = meta.license || 'None';
      
      const repoLink = document.getElementById('repo-link');
      if (meta.url) {
        repoLink.href = meta.url;
      }
    }
  }
});
