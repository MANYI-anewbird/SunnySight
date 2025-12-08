// Use Cases UI - A2UI View
document.addEventListener('DOMContentLoaded', async () => {
  const backBtn = document.getElementById('back-btn');
  const content = document.getElementById('usecases-content');

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

  // Load use cases data from storage
  async function loadUseCasesData() {
    try {
      // Get current tab to extract repo info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('github.com')) {
        content.innerHTML = '<p class="empty-state">Please open a GitHub repository page first</p>';
        return;
      }

      const urlMatch = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        content.innerHTML = '<p class="empty-state">Unable to parse repository URL</p>';
        return;
      }

      const [, owner, repo] = urlMatch;
      const repoName = repo.replace(/\/$/, '');
      const cacheKey = `analysis_${owner}_${repoName}`;

      // Get cached analysis
      chrome.storage.local.get([cacheKey], (result) => {
        const cached = result[cacheKey];
        if (cached && cached.analysis) {
          displayUseCases(cached.analysis);
        } else {
          content.innerHTML = '<p class="empty-state">No analysis data found. Please analyze the repository first.</p>';
        }
      });
    } catch (error) {
      console.error('Error loading use cases data:', error);
      content.innerHTML = '<p class="empty-state">Error loading data</p>';
    }
  }

  function displayUseCases(analysis) {
    if (!analysis.useCases || analysis.useCases.length === 0) {
      content.innerHTML = '<p class="empty-state">No use cases data available</p>';
      return;
    }

    // A2UI placeholder - will be enhanced later
    let html = '<div class="a2ui-container"><ul class="use-cases-list">';
    analysis.useCases.forEach(useCase => {
      html += `<li>${useCase}</li>`;
    });
    html += '</ul></div>';
    content.innerHTML = html;
  }

  // Load data on page load
  await loadUseCasesData();
});

