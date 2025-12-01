// Popup logic - Main entry point for repository analysis

// Global state
let currentAnalysis = null;
let currentOwner = null;
let currentRepo = null;

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');
  const errorMessage = error.querySelector('.error-message');
  const settingsWarning = document.getElementById('settings-warning');
  const loadingMessage = document.getElementById('loading-message');
  const loadingDetail = document.getElementById('loading-detail');
  const progressBar = document.getElementById('progress-bar');

  // Initialize UI handlers
  initializeHandlers();

  // Start analysis
  await startAnalysis();

  function initializeHandlers() {
    // Settings buttons
    const settingsBtn = document.getElementById('settings-btn');
    const settingsBtnInline = document.getElementById('settings-btn-inline');
    const settingsBtnFooter = document.getElementById('settings-btn-footer');
    const settingsBtnHeader = document.getElementById('settings-btn-header');
    
    [settingsBtn, settingsBtnInline, settingsBtnFooter, settingsBtnHeader].forEach(btn => {
      if (btn) btn.addEventListener('click', openSettings);
    });

    // History button
    const historyBtn = document.getElementById('history-btn');
    const historyClose = document.getElementById('history-close');
    if (historyBtn) historyBtn.addEventListener('click', toggleHistory);
    if (historyClose) historyClose.addEventListener('click', toggleHistory);

    // Copy summary button
    const copySummaryBtn = document.getElementById('copy-summary-btn');
    if (copySummaryBtn) {
      copySummaryBtn.addEventListener('click', () => {
        const summary = document.getElementById('repo-summary').textContent;
        copyToClipboard(summary, 'Summary copied to clipboard!');
      });
    }

    // Export buttons
    const exportBtn = document.getElementById('export-btn');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportAnalysis);
    if (copyJsonBtn) copyJsonBtn.addEventListener('click', copyAnalysisAsJson);

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (currentOwner && currentRepo) {
          startAnalysis(true); // Force refresh
        }
      });
    }
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  function toggleHistory() {
    const dropdown = document.getElementById('history-dropdown');
    if (dropdown) {
      const isVisible = dropdown.style.display !== 'none';
      dropdown.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        loadHistory();
      }
    }
  }

  async function loadHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    const history = await getHistory();
    
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No analysis history yet</p>';
      return;
    }

    historyList.innerHTML = '';
    history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      const date = new Date(item.timestamp);
      historyItem.innerHTML = `
        <div class="history-item-info">
          <div class="history-item-name">${item.owner}/${item.repo}</div>
          <div class="history-item-time">${formatTimeAgo(date)}</div>
        </div>
        <div class="history-item-actions">
          <button class="btn-history-action" data-action="view" data-owner="${item.owner}" data-repo="${item.repo}">View</button>
          <button class="btn-history-action" data-action="reanalyze" data-owner="${item.owner}" data-repo="${item.repo}">Re-analyze</button>
        </div>
      `;
      historyList.appendChild(historyItem);
    });

    // Add event listeners to action buttons
    historyList.querySelectorAll('.btn-history-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const owner = e.target.dataset.owner;
        const repo = e.target.dataset.repo;
        
        if (action === 'view') {
          // Load from cache
          const cacheKey = `analysis_${owner}_${repo}`;
          chrome.storage.local.get([cacheKey], (result) => {
            if (result[cacheKey] && result[cacheKey].analysis) {
              currentOwner = owner;
              currentRepo = repo;
              displayAnalysis(result[cacheKey].analysis, result[cacheKey].analysis._cached);
              toggleHistory(); // Close dropdown
            } else {
              showToast('Cached analysis not found. Re-analyzing...');
              startAnalysisForRepo(owner, repo, true);
              toggleHistory();
            }
          });
        } else if (action === 'reanalyze') {
          toggleHistory();
          startAnalysisForRepo(owner, repo, true);
        }
      });
    });
  }

  async function startAnalysis(forceRefresh = false) {
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

      currentOwner = owner;
      currentRepo = repoName;

      await startAnalysisForRepo(owner, repoName, forceRefresh);

    } catch (err) {
      console.error('Error:', err);
      showError('An error occurred: ' + err.message);
    }
  }

  async function startAnalysisForRepo(owner, repo, forceRefresh = false) {
    // Start analysis
    loading.style.display = 'flex';
    error.style.display = 'none';
    content.style.display = 'none';
    
    // Reset progress
    if (progressBar) {
      progressBar.style.width = '0%';
    }
    updateProgress('Analyzing repository...', 'This may take 10-20 seconds');

    try {
      // Progress callback
      const progressCallback = (message) => {
        updateProgress(message);
      };

      const analysis = await repoAnalyzer.analyzeRepository(owner, repo, forceRefresh, progressCallback);
      currentAnalysis = analysis;
      
      // Add to history
      await addToHistory(owner, repo);
      
      // Display results
      displayAnalysis(analysis, analysis._cached);
    } catch (err) {
      console.error('Analysis error:', err);
      
      let errorMsg = 'Analysis failed: ' + err.message;
      let showSettings = false;
      
      if (err.message.includes('OpenAI API key')) {
        errorMsg = 'OpenAI API key not configured. Please configure it in settings.';
        showSettings = true;
      } else if (err.message.includes('OpenAI API error')) {
        errorMsg = 'OpenAI API error: ' + err.message + '. Please check your API key.';
        showSettings = true;
      } else if (err.message.includes('GitHub API error')) {
        errorMsg = 'GitHub API error: ' + err.message + '. The repository may be private or not found.';
      }
      
      showError(errorMsg, showSettings);
    }
  }

  function updateProgress(message, detail = null) {
    if (loadingMessage) loadingMessage.textContent = message;
    if (detail && loadingDetail) loadingDetail.textContent = detail;
    
    // Update progress bar (simple animation)
    if (progressBar) {
      const progress = Math.min(95, (progressBar.style.width ? parseFloat(progressBar.style.width) : 0) + 10);
      progressBar.style.width = progress + '%';
    }
  }

  function showError(message, showSettings = false) {
    loading.style.display = 'none';
    content.style.display = 'none';
    error.style.display = 'block';
    if (errorMessage) errorMessage.textContent = message;
    
    const settingsBtn = document.getElementById('settings-btn');
    if (showSettings && settingsBtn) {
      settingsBtn.style.display = 'inline-block';
    } else if (settingsBtn) {
      settingsBtn.style.display = 'none';
    }
  }

  function showSettingsWarning() {
    if (settingsWarning) settingsWarning.style.display = 'block';
  }

  function displayAnalysis(analysis, isCached = false) {
    loading.style.display = 'none';
    error.style.display = 'none';
    content.style.display = 'block';

    // Show cached badge if applicable
    const cachedBadge = document.getElementById('cached-badge');
    if (cachedBadge) {
      cachedBadge.style.display = isCached ? 'flex' : 'none';
    }

    // Complete progress bar
    if (progressBar) {
      progressBar.style.width = '100%';
    }

    // Feature 1: AI Repo Summary
    const summaryEl = document.getElementById('repo-summary');
    if (summaryEl) summaryEl.textContent = analysis.summary || 'No summary available';

    // Feature 2: Key File Highlighter
    const keyFilesEl = document.getElementById('key-files');
    if (keyFilesEl) {
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
    }

    // Feature 3: Architecture / Pipeline Explanation
    const pipelineEl = document.getElementById('pipeline-explanation');
    if (pipelineEl) pipelineEl.textContent = analysis.pipeline || 'Unable to analyze architecture';

    // Feature 4: Smart Use-Case Recommendations
    const useCasesEl = document.getElementById('use-cases');
    if (useCasesEl) {
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
    }

    // Feature 5: Dependency & Environment Auditor
    const requirementsEl = document.getElementById('requirements');
    if (requirementsEl) {
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
    }

    // Feature 6: Repo Health Check
    const healthEl = document.getElementById('health-check');
    if (healthEl) {
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
    }

    // Metadata
    if (analysis.metadata) {
      const meta = analysis.metadata;
      const starsEl = document.getElementById('meta-stars');
      const forksEl = document.getElementById('meta-forks');
      const languageEl = document.getElementById('meta-language');
      const licenseEl = document.getElementById('meta-license');
      
      if (starsEl) starsEl.textContent = meta.stars || '0';
      if (forksEl) forksEl.textContent = meta.forks || '0';
      if (languageEl) languageEl.textContent = meta.language || 'Unknown';
      if (licenseEl) licenseEl.textContent = meta.license || 'None';
      
      const repoLink = document.getElementById('repo-link');
      if (repoLink && meta.url) {
        repoLink.href = meta.url;
      }
    }
  }

  // History management
  async function getHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['analysis_history'], (result) => {
        resolve(result.analysis_history || []);
      });
    });
  }

  async function addToHistory(owner, repo) {
    const history = await getHistory();
    
    // Remove if already exists
    const filtered = history.filter(item => !(item.owner === owner && item.repo === repo));
    
    // Add to beginning
    filtered.unshift({
      owner,
      repo,
      timestamp: Date.now()
    });
    
    // Keep only last 10
    const limited = filtered.slice(0, 10);
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ analysis_history: limited }, resolve);
    });
  }

  // Export functionality
  async function exportAnalysis() {
    if (!currentAnalysis) {
      showToast('No analysis to export');
      return;
    }

    const exportData = {
      ...currentAnalysis,
      exportedAt: new Date().toISOString(),
      repository: `${currentOwner}/${currentRepo}`
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const filename = `sunnysight-analysis-${currentOwner}-${currentRepo}-${Date.now()}.json`;
    
    try {
      await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
      showToast('Analysis exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export analysis');
    }
  }

  async function copyAnalysisAsJson() {
    if (!currentAnalysis) {
      showToast('No analysis to copy');
      return;
    }

    const exportData = {
      ...currentAnalysis,
      exportedAt: new Date().toISOString(),
      repository: `${currentOwner}/${currentRepo}`
    };

    const json = JSON.stringify(exportData, null, 2);
    copyToClipboard(json, 'Analysis JSON copied to clipboard!');
  }

  function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage);
    }).catch(err => {
      console.error('Copy error:', err);
      showToast('Failed to copy to clipboard');
    });
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.style.display = 'block';
      
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3000);
    }
  }

  function formatTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }
});
