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

    // A2UI Navigation buttons
    const architectureBtn = document.getElementById('architecture-ui-btn');
    const useCasesBtn = document.getElementById('usecases-ui-btn');
    const dependenciesBtn = document.getElementById('dependencies-ui-btn');
    
    // Back buttons
    const architectureBackBtn = document.getElementById('architecture-back-btn');
    const useCasesBackBtn = document.getElementById('usecases-back-btn');
    const dependenciesBackBtn = document.getElementById('dependencies-back-btn');
    
    if (architectureBtn) {
      architectureBtn.addEventListener('click', () => {
        showA2UIView('architecture');
      });
    }
    
    if (useCasesBtn) {
      useCasesBtn.addEventListener('click', () => {
        showA2UIView('usecases');
      });
    }
    
    if (dependenciesBtn) {
      dependenciesBtn.addEventListener('click', () => {
        showA2UIView('dependencies');
      });
    }

    if (architectureBackBtn) {
      architectureBackBtn.addEventListener('click', () => {
        hideA2UIView();
      });
    }

    if (useCasesBackBtn) {
      useCasesBackBtn.addEventListener('click', () => {
        hideA2UIView();
      });
    }

    if (dependenciesBackBtn) {
      dependenciesBackBtn.addEventListener('click', () => {
        hideA2UIView();
      });
    }
  }

  function showA2UIView(viewType) {
    // Hide main content and other UI elements
    if (content) content.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'none';
    
    // Hide history dropdown if open
    const historyDropdown = document.getElementById('history-dropdown');
    if (historyDropdown) historyDropdown.style.display = 'none';

    // Hide all views first
    const allViews = ['architecture-view', 'usecases-view', 'dependencies-view'];
    allViews.forEach(viewId => {
      const view = document.getElementById(viewId);
      if (view) view.style.display = 'none';
    });

    // Show selected view
    const viewId = `${viewType}-view`;
    const view = document.getElementById(viewId);
    if (view) {
      view.style.display = 'block';
      // Load data for the view
      loadA2UIData(viewType);
    }
  }

  function hideA2UIView() {
    // Hide all views
    const allViews = ['architecture-view', 'usecases-view', 'dependencies-view'];
    allViews.forEach(viewId => {
      const view = document.getElementById(viewId);
      if (view) view.style.display = 'none';
    });

    // Show main content if we have analysis
    if (currentAnalysis && content) {
      content.style.display = 'block';
    } else if (content) {
      // If no analysis, show content anyway (might be loading)
      content.style.display = 'block';
    }
  }

  async function loadA2UIData(viewType) {
    // First try to use currentAnalysis if available
    if (currentAnalysis) {
      displayA2UIData(viewType, currentAnalysis);
      return;
    }

    if (!currentOwner || !currentRepo) {
      // Try to get from current tab
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url && tab.url.includes('github.com')) {
          const urlMatch = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (urlMatch) {
            const [, owner, repo] = urlMatch;
            currentOwner = owner;
            currentRepo = repo.replace(/\/$/, '');
          }
        }
      } catch (err) {
        console.error('Error getting tab info:', err);
      }
    }

    if (!currentOwner || !currentRepo) {
      const contentEl = document.getElementById(`${viewType}-content`);
      if (contentEl) {
        contentEl.innerHTML = '<p class="empty-state">Please open a GitHub repository page first</p>';
      }
      return;
    }

    const cacheKey = `analysis_${currentOwner}_${currentRepo}`;
    chrome.storage.local.get([cacheKey], (result) => {
      const cached = result[cacheKey];
      if (cached && cached.analysis) {
        displayA2UIData(viewType, cached.analysis);
      } else {
        const contentEl = document.getElementById(`${viewType}-content`);
        if (contentEl) {
          contentEl.innerHTML = '<p class="empty-state">No analysis data found. Please analyze the repository first.</p>';
        }
      }
    });
  }

  function displayA2UIData(viewType, analysis) {
    if (viewType === 'architecture') {
      const contentEl = document.getElementById('architecture-content');
      if (contentEl) {
        if (!analysis.pipeline) {
          contentEl.innerHTML = '<p class="empty-state">No architecture data available</p>';
          return;
        }
        contentEl.innerHTML = `
          <div class="a2ui-container">
            <div class="pipeline-text">${analysis.pipeline}</div>
          </div>
        `;
      }
    } else if (viewType === 'usecases') {
      const contentEl = document.getElementById('usecases-content');
      if (contentEl) {
        if (!analysis.useCases || analysis.useCases.length === 0) {
          contentEl.innerHTML = '<p class="empty-state">No use cases data available</p>';
          return;
        }
        let html = '<div class="a2ui-container"><ul class="use-cases-list">';
        analysis.useCases.forEach(useCase => {
          html += `<li>${useCase}</li>`;
        });
        html += '</ul></div>';
        contentEl.innerHTML = html;
      }
    } else if (viewType === 'dependencies') {
      const dependenciesEl = document.getElementById('dependencies-content');
      const securityEl = document.getElementById('security-content');
      
      if (dependenciesEl) {
        if (!analysis.requirements) {
          dependenciesEl.innerHTML = '<p class="empty-state">No dependencies data available</p>';
        } else {
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
          dependenciesEl.innerHTML = html || '<div class="empty-state">No dependency information available</div>';
        }
      }

      if (securityEl) {
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
        securityEl.innerHTML = html;
      }
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
        showError('OpenAI API key not configured. Please configure it in settings to analyze repositories.', true);
        return; // Stop here if no API key
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
      console.error('Error in startAnalysis:', err);
      console.error('Error stack:', err.stack);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        url: tab?.url
      });
      showError('An error occurred: ' + err.message + '. Check console for details.');
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
      console.error('Error stack:', err.stack);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        owner: owner,
        repo: repo
      });
      
      let errorMsg = 'Analysis failed: ' + err.message;
      let showSettings = false;
      
      if (err.message.includes('OpenAI API key')) {
        errorMsg = 'OpenAI API key not configured. Please configure it in settings.';
        showSettings = true;
      } else if (err.message.includes('OpenAI API error')) {
        errorMsg = 'OpenAI API error: ' + err.message + '. Please check your API key.';
        showSettings = true;
      } else if (err.message.includes('GitHub API error') || err.message.includes('rate limit')) {
        // Don't duplicate the error message if it already contains the full message
        if (err.message.includes('rate limit') || err.message.includes('403')) {
          errorMsg = err.message;
          showSettings = true; // Show settings button to add GitHub token
        } else {
          errorMsg = err.message + '. The repository may be private or not found.';
        }
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
    
    // Only show content if no A2UI view is currently displayed
    const allViews = ['architecture-view', 'usecases-view', 'dependencies-view'];
    const isA2UIViewVisible = allViews.some(viewId => {
      const view = document.getElementById(viewId);
      return view && view.style.display !== 'none';
    });
    
    if (!isA2UIViewVisible) {
      content.style.display = 'block';
    }

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
    if (summaryEl) {
      // Handle both old format (string) and new format (object)
      if (typeof analysis.summary === 'string') {
        summaryEl.textContent = analysis.summary || 'No summary available';
      } else if (analysis.summary && analysis.summary.overview) {
        summaryEl.textContent = analysis.summary.overview || 'No summary available';
      } else {
        summaryEl.textContent = 'No summary available';
      }
    }

    // Render projectType + tags
    const tagsEl = document.getElementById('summary-tags');
    if (tagsEl && analysis.summary) {
      // Handle both old format (string) and new format (object)
      if (typeof analysis.summary === 'object' && analysis.summary.projectType) {
        const type = analysis.summary.projectType;
        // Ensure tags is always an array
        let tags = analysis.summary.tags;
        if (!Array.isArray(tags)) {
          // If tags is not an array, try to convert it or use empty array
          if (tags && typeof tags === 'object') {
            // If it's an object (wrong format from LLM), use empty array
            tags = [];
          } else {
            tags = [];
          }
        }
        
        // Build tags array with priority: category > subcategory > other tags
        const allTags = [];
        const maxTotalTags = 7;
        
        // 1. Add category (highest priority)
        if (type && type.category) {
          allTags.push({
            text: type.category,
            priority: 1,
            className: 'tag project-type'
          });
        }
        
        // 2. Add subcategory (second priority)
        if (type && type.subcategory) {
          allTags.push({
            text: type.subcategory,
            priority: 2,
            className: 'tag subcategory'
          });
        }
        
        // 3. Add other tags (lowest priority, filtered to avoid duplicates)
        if (Array.isArray(tags)) {
          const categoryValue = type?.category || '';
          const subcategoryValue = type?.subcategory || '';
          
          tags.forEach(t => {
            if (t && typeof t === 'string') {
              // Skip if tag matches projectType (case-insensitive)
              const tagLower = t.toLowerCase();
              const categoryLower = categoryValue.toLowerCase();
              const subcategoryLower = subcategoryValue.toLowerCase();
              
              if (tagLower !== categoryLower && 
                  tagLower !== subcategoryLower &&
                  !tagLower.includes(categoryLower) &&
                  !tagLower.includes(subcategoryLower)) {
                allTags.push({
                  text: t,
                  priority: 3,
                  className: 'tag'
                });
              }
            }
          });
        }
        
        // 4. Sort by priority (1 = highest, 3 = lowest), then limit to maxTotalTags
        allTags.sort((a, b) => a.priority - b.priority);
        const displayTags = allTags.slice(0, maxTotalTags);
        
        // 5. Render HTML
        let html = "";
        displayTags.forEach(tag => {
          html += `<span class="${tag.className}">${tag.text}</span>`;
        });
        
        tagsEl.innerHTML = html;
      } else {
        // Old format - clear tags
        tagsEl.innerHTML = '';
      }
    }

    // Feature 2: Key Files (sorted by importance)
    const keyFilesEl = document.getElementById('key-files');
    if (keyFilesEl) {
      let keyFiles = analysis.keyFiles || [];
      
      // Sort by importance: files are already sorted by LLM, but ensure they're displayed in order
      // The LLM should return files sorted by importance (most critical first)
      // We maintain that order when displaying
      
      keyFilesEl.innerHTML = '';
      
      if (keyFiles.length > 0) {
        keyFiles.forEach((file, index) => {
          const fileItem = createKeyFileItem(file, index);
          keyFilesEl.appendChild(fileItem);
        });
      } else {
        keyFilesEl.innerHTML = '<p class="empty-state">No key files identified</p>';
      }
    }
    
    // Helper function to create semantic key file item
    function createSemanticKeyFileItem(file, index, totalFiles) {
      const fileItem = document.createElement('div');
      fileItem.className = 'key-file-item semantic-key-file';
      fileItem.dataset.index = index;
      
      // Check if file is highly important (top 10% = first file if total ≤ 10, or first 2 if total > 10)
      const isCoreFile = index < Math.max(1, Math.ceil(totalFiles * 0.1));
      const coreFileBadge = isCoreFile ? '<span class="core-file-badge">⭐ Core File</span>' : '';
      
      const roleTag = file.role ? `<span class="key-file-role">${file.role}</span>` : '';
      const filename = file.path.split('/').pop() || file.path;
      
      // Collapsed view (default)
      const collapsedView = `
        <div class="key-file-header" data-file-index="${index}">
          <div class="key-file-name-row">
            <div class="key-file-path">📄 ${filename}</div>
            ${coreFileBadge}
            ${roleTag}
          </div>
        </div>
      `;
      
      // Expanded view (hidden by default)
      const expandedView = `
        <div class="key-file-details" data-file-index="${index}" style="display: none;">
          <div class="key-file-full-path">${file.path}</div>
          <div class="key-file-purpose">${file.purpose || ''}</div>
          ${file.importance ? `<div class="key-file-importance">💡 ${file.importance}</div>` : ''}
        </div>
      `;
      
      fileItem.innerHTML = collapsedView + expandedView;
      
      // Add click handler to header for expand/collapse
      const header = fileItem.querySelector('.key-file-header');
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const details = fileItem.querySelector('.key-file-details');
        const isExpanded = details.style.display !== 'none';
        
        if (isExpanded) {
          details.style.display = 'none';
          fileItem.classList.remove('expanded');
        } else {
          details.style.display = 'block';
          fileItem.classList.add('expanded');
        }
      });
      
      return fileItem;
    }
    
    // Helper function to create key folder item
    function createKeyFolderItem(folder, folderIndex) {
      const folderItem = document.createElement('div');
      folderItem.className = 'key-folder-item';
      folderItem.dataset.folderIndex = folderIndex;
      
      const folderRoleTag = folder.role ? `<span class="key-folder-role">${folder.role}</span>` : '';
      const folderName = folder.path === 'root' ? 'Root' : folder.path.split('/').pop() || folder.path;
      
      // Collapsed view (default)
      const collapsedView = `
        <div class="key-folder-header" data-folder-index="${folderIndex}">
          <div class="key-folder-info">
            <div class="key-folder-name">📁 ${folderName}</div>
            ${folderRoleTag}
          </div>
          <div class="key-folder-description">${folder.description || ''}</div>
        </div>
      `;
      
      // Expanded view (hidden by default)
      const expandedView = `
        <div class="key-folder-files" data-folder-index="${folderIndex}" style="display: none;">
          ${folder.keyFiles && folder.keyFiles.length > 0 ? folder.keyFiles.map((file, fileIndex) => {
            const roleTag = file.role ? `<span class="key-file-role">${file.role}</span>` : '';
            return `
              <div class="key-file-item-in-folder">
                <div class="key-file-header">
                  <div class="key-file-path">📄 ${file.path}</div>
                  ${roleTag}
                </div>
                <div class="key-file-details">
                  <div class="key-file-purpose">${file.purpose || ''}</div>
                  ${file.importance ? `<div class="key-file-importance">💡 ${file.importance}</div>` : ''}
                </div>
              </div>
            `;
          }).join('') : '<p class="empty-state">No key files in this folder</p>'}
        </div>
      `;
      
      folderItem.innerHTML = collapsedView + expandedView;
      
      // Add click handler to header for expand/collapse
      const header = folderItem.querySelector('.key-folder-header');
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const files = folderItem.querySelector('.key-folder-files');
        const isExpanded = files.style.display !== 'none';
        
        if (isExpanded) {
          files.style.display = 'none';
          folderItem.classList.remove('expanded');
        } else {
          files.style.display = 'block';
          folderItem.classList.add('expanded');
        }
      });
      
      return folderItem;
    }
    
    // Helper function to create collapsible key file item (for backward compatibility)
    function createKeyFileItem(file, index) {
      const fileItem = document.createElement('div');
      fileItem.className = 'key-file-item';
      fileItem.dataset.index = index;
      
      // Build role tag if available
      const roleTag = file.role ? `<span class="key-file-role">${file.role}</span>` : '';
      
      // Collapsed view (default)
      const collapsedView = `
        <div class="key-file-header" data-file-index="${index}">
          <div class="key-file-path">📄 ${file.path}</div>
          ${roleTag}
        </div>
      `;
      
      // Expanded view (hidden by default)
      const expandedView = `
        <div class="key-file-details" data-file-index="${index}" style="display: none;">
          <div class="key-file-purpose">${file.purpose || ''}</div>
          ${file.importance ? `<div class="key-file-importance">💡 ${file.importance}</div>` : ''}
        </div>
      `;
      
      fileItem.innerHTML = collapsedView + expandedView;
      
      // Add click handler to header for expand/collapse
      const header = fileItem.querySelector('.key-file-header');
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const details = fileItem.querySelector('.key-file-details');
        const isExpanded = details.style.display !== 'none';
        
        if (isExpanded) {
          details.style.display = 'none';
          fileItem.classList.remove('expanded');
        } else {
          details.style.display = 'block';
          fileItem.classList.add('expanded');
        }
      });
      
      return fileItem;
    }

    // Feature 3: Architecture / Pipeline Explanation
    const pipelineEl = document.getElementById('pipeline-explanation');
    if (pipelineEl) {
      const pipelineText = analysis.pipeline || 'Unable to analyze architecture';
      // Format pipeline with step numbers and visual separation
      const formattedText = formatPipelineSteps(pipelineText);
      pipelineEl.innerHTML = formattedText;
    }

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
          html += `<div class="req-section"><strong>Dependencies:</strong><div class="dependencies-tags">`;
          req.dependencies.forEach(dep => {
            html += `<span class="dependency-tag">${dep}</span>`;
          });
          html += `</div></div>`;
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
          html += `<div class="health-section"><strong>✅ Indicators:</strong><div class="health-indicators-tags">`;
          health.indicators.forEach(indicator => {
            html += `<span class="health-indicator-tag">${indicator}</span>`;
          });
          html += `</div></div>`;
        }

        if (health.concerns && health.concerns.length > 0) {
          html += `<div class="health-section concerns"><strong>⚠️ Concerns:</strong><div class="health-concerns-tags">`;
          health.concerns.forEach(concern => {
            html += `<span class="health-concern-tag">${concern}</span>`;
          });
          html += `</div></div>`;
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

  // Format pipeline text with step numbers and visual separation
  function formatPipelineSteps(text) {
    if (!text) return '';
    
    // First highlight file names
    let formatted = highlightFileNames(text);
    
    // Try multiple strategies to identify steps
    
    // Strategy 1: Split by newlines (if text has line breaks)
    const lines = formatted.split(/\n+/).filter(l => l.trim().length > 0);
    if (lines.length > 1) {
      return lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return '';
        
        const stepNumber = index + 1;
        const emoji = getStepEmoji(stepNumber);
        return `<div class="pipeline-step"><span class="step-number">${emoji}</span><span class="step-content">${trimmed}</span></div>`;
      }).join('');
    }
    
    // Strategy 2: Split by sentences (periods, exclamation, question marks)
    const sentences = formatted.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      // Filter out very short sentences that are likely not steps
      const validSentences = sentences.filter(s => s.trim().length >= 30 || sentences.length <= 3);
      
      if (validSentences.length > 1) {
        return validSentences.map((sentence, index) => {
          const trimmed = sentence.trim();
          if (trimmed.length === 0) return '';
          
          const stepNumber = index + 1;
          const emoji = getStepEmoji(stepNumber);
          return `<div class="pipeline-step"><span class="step-number">${emoji}</span><span class="step-content">${trimmed}</span></div>`;
        }).join('');
      }
    }
    
    // Strategy 3: Split by common flow indicators
    const flowIndicators = /(?:→|then|next|after|followed by|subsequently|finally|first|second|third|fourth|fifth|initially|step \d+|step\d+)/gi;
    if (flowIndicators.test(formatted)) {
      // Split by flow indicators but keep them
      const parts = formatted.split(/(→|then|next|after|followed by|subsequently|finally|first|second|third|fourth|fifth|initially|step \d+|step\d+)/gi);
      const filteredParts = parts.filter(p => p.trim().length > 0 && !p.match(/^(→|then|next|after|followed by|subsequently|finally|first|second|third|fourth|fifth|initially|step \d+|step\d+)$/i));
      
      if (filteredParts.length > 1) {
        return filteredParts.map((part, index) => {
          const trimmed = part.trim();
          if (trimmed.length === 0) return '';
          
          const stepNumber = index + 1;
          const emoji = getStepEmoji(stepNumber);
          return `<div class="pipeline-step"><span class="step-number">${emoji}</span><span class="step-content">${trimmed}</span></div>`;
        }).join('');
      }
    }
    
    // If no clear steps found, just return with file name highlighting
    return formatted;
  }
  
  // Get step number text
  function getStepEmoji(number) {
    return `${number}.`;
  }

  // Highlight file names in pipeline text with italic yellow styling
  function highlightFileNames(text) {
    if (!text) return '';
    
    // Escape HTML to prevent XSS
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    // Pattern to match file names with extensions
    const fileExtensionPattern = /\b[a-zA-Z0-9_\-\.\/]+\.(py|js|ts|jsx|tsx|java|go|rs|rb|php|swift|kt|scala|cpp|c|h|hpp|cc|cxx|r|m|mm|clj|pl|pm|sh|bash|zsh|sql|vue|svelte|json|yml|yaml|toml|xml|gradle|mod|lock|html|htm|css|scss|less|sass|md|txt|rst|pdf|dockerfile|makefile|cmakelists\.txt|package\.json|requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle|cargo\.toml|go\.mod|composer\.json|tsconfig\.json|webpack\.config\.js|vite\.config\.js|config\.yml|config\.yaml|\.env\.example)\b/gi;
    
    // Pattern to match common file names without extensions
    const commonFilePattern = /\b(Dockerfile|Makefile|CMakeLists\.txt|package\.json|requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle|cargo\.toml|go\.mod|composer\.json|tsconfig\.json|webpack\.config\.js|vite\.config\.js|config\.yml|config\.yaml|\.env\.example)\b/gi;
    
    // First escape the text to prevent XSS
    let escapedText = escapeHtml(text);
    let result = escapedText;
    const processedRanges = [];
    
    // Process files with extensions
    let match;
    const matches = [];
    while ((match = fileExtensionPattern.exec(escapedText)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0]
      });
    }
    
    // Process common file names
    while ((match = commonFilePattern.exec(escapedText)) !== null) {
      // Check if this range overlaps with any already processed
      const overlaps = matches.some(m => 
        (match.index >= m.index && match.index < m.index + m.length) ||
        (m.index >= match.index && m.index < match.index + match[0].length)
      );
      
      if (!overlaps) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0]
        });
      }
    }
    
    // Sort matches by index (descending) to replace from end to start
    matches.sort((a, b) => b.index - a.index);
    
    // Replace matches with highlighted versions
    matches.forEach(m => {
      // Check if it's part of a URL (skip if it is)
      const beforeText = result.substring(Math.max(0, m.index - 30), m.index);
      if (!beforeText.match(/https?:\/\/|github\.com|@|mailto:|www\./i)) {
        const before = result.substring(0, m.index);
        const after = result.substring(m.index + m.length);
        result = before + `<span class="pipeline-filename">${m.text}</span>` + after;
      }
    });
    
    return result;
  }
});
