// Get repository information when page loads
document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');

  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if on GitHub page
    if (!tab.url || !tab.url.includes('github.com')) {
      showError('Please open a GitHub repository page first');
      return;
    }

    // Send message to content script to get repository information
    chrome.tabs.sendMessage(tab.id, { action: 'getRepoInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        showError('Unable to connect to page, please refresh and try again');
        return;
      }

      if (response) {
        displayRepoInfo(response);
      } else {
        showError('Unable to fetch repository information');
      }
    });

  } catch (err) {
    console.error('Error:', err);
    showError('An error occurred: ' + err.message);
  }
});

function showError(message) {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');
  
  loading.style.display = 'none';
  content.style.display = 'none';
  error.style.display = 'block';
  
  const errorMessage = error.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
  }
}

function displayRepoInfo(info) {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');
  
  loading.style.display = 'none';
  error.style.display = 'none';
  content.style.display = 'block';

  // Display repository name
  const repoName = document.getElementById('repo-name');
  if (info.owner && info.repo) {
    repoName.textContent = `${info.owner} / ${info.repo}`;
  } else if (info.repo) {
    repoName.textContent = info.repo;
  } else {
    repoName.textContent = 'Unknown Repository';
  }

  // Display description
  const description = document.getElementById('repo-description');
  description.textContent = info.description || 'No description';

  // Display statistics
  document.getElementById('stars').textContent = info.stars || '0';
  document.getElementById('forks').textContent = info.forks || '0';
  document.getElementById('watching').textContent = info.watching || '0';
  document.getElementById('issues').textContent = info.issues || '0';

  // Display detailed information
  document.getElementById('owner').textContent = info.owner || '-';
  document.getElementById('language').textContent = info.language || 'Unknown';
  document.getElementById('license').textContent = info.license || 'None';
  document.getElementById('readme').textContent = info.readme || 'No';
  document.getElementById('pull-requests').textContent = info.pullRequests || '0';

  // Display last commit time
  const lastCommit = document.getElementById('last-commit');
  if (info.lastCommit) {
    try {
      const date = new Date(info.lastCommit);
      lastCommit.textContent = date.toLocaleString('en-US');
    } catch (e) {
      lastCommit.textContent = info.lastCommit;
    }
  } else {
    lastCommit.textContent = '-';
  }

  // Display Topics
  const topicsSection = document.getElementById('topics-section');
  const topicsContainer = document.getElementById('topics-container');
  if (info.topics && info.topics.length > 0) {
    topicsSection.style.display = 'block';
    topicsContainer.innerHTML = '';
    info.topics.forEach(topic => {
      const tag = document.createElement('span');
      tag.className = 'topic-tag';
      tag.textContent = topic;
      topicsContainer.appendChild(tag);
    });
  } else {
    topicsSection.style.display = 'none';
  }

  // Set repository link
  const repoLink = document.getElementById('repo-link');
  if (info.url) {
    repoLink.href = info.url;
  }
}

