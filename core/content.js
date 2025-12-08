// Function to extract GitHub repository information
function extractRepoInfo() {
  const info = {
    owner: '',
    repo: '',
    description: '',
    stars: '',
    forks: '',
    watching: '',
    language: '',
    license: '',
    topics: [],
    issues: '',
    pullRequests: '',
    lastCommit: '',
    readme: '',
    url: window.location.href
  };

  try {
    // Extract repository owner
    const ownerElement = document.querySelector('span[itemprop="author"] a, .author a');
    if (ownerElement) {
      info.owner = ownerElement.textContent.trim();
    }

    // Extract repository name
    const repoElement = document.querySelector('strong[itemprop="name"] a, h1 strong a, h1 a');
    if (repoElement) {
      info.repo = repoElement.textContent.trim();
    }

    // Extract description
    const descElement = document.querySelector('span[itemprop="about"], .f4.mb-3');
    if (descElement) {
      info.description = descElement.textContent.trim();
    }

    // Extract Stars count
    const starsElement = document.querySelector('a[href*="/stargazers"], .social-count[href*="/stargazers"]');
    if (starsElement) {
      info.stars = starsElement.textContent.trim().replace(/\s+/g, ' ');
    }

    // Extract Forks count
    const forksElement = document.querySelector('a[href*="/network/members"], .social-count[href*="/network/members"]');
    if (forksElement) {
      info.forks = forksElement.textContent.trim().replace(/\s+/g, ' ');
    }

    // Extract Watching count
    const watchingElement = document.querySelector('a[href*="/watchers"]');
    if (watchingElement) {
      info.watching = watchingElement.textContent.trim().replace(/\s+/g, ' ');
    }

    // Extract primary programming language
    const languageElement = document.querySelector('span[itemprop="programmingLanguage"], .d-inline-flex .text-bold');
    if (languageElement) {
      info.language = languageElement.textContent.trim();
    }

    // Extract License
    const licenseElement = document.querySelector('a[href*="/blob/master/LICENSE"], .octicon-law + span');
    if (licenseElement) {
      info.license = licenseElement.textContent.trim();
    }

    // Extract Topics
    const topicElements = document.querySelectorAll('.topic-tag, .topic-tag-link');
    topicElements.forEach(tag => {
      const topic = tag.textContent.trim();
      if (topic) {
        info.topics.push(topic);
      }
    });

    // Extract Issues count
    const issuesElement = document.querySelector('a[href*="/issues"] .Counter, span[data-content="Issues"]');
    if (issuesElement) {
      info.issues = issuesElement.textContent.trim();
    }

    // Extract Pull Requests count
    const prElement = document.querySelector('a[href*="/pulls"] .Counter, span[data-content="Pull requests"]');
    if (prElement) {
      info.pullRequests = prElement.textContent.trim();
    }

    // Extract last commit information
    const commitElement = document.querySelector('relative-time, time-ago');
    if (commitElement) {
      info.lastCommit = commitElement.getAttribute('datetime') || commitElement.textContent.trim();
    }

    // Check if README exists
    const readmeElement = document.querySelector('div[data-path="README.md"], div[data-path="README"]');
    if (readmeElement) {
      info.readme = 'Yes';
    } else {
      info.readme = 'No';
    }

  } catch (error) {
    console.error('Error extracting repo info:', error);
  }

  return info;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRepoInfo') {
    const repoInfo = extractRepoInfo();
    sendResponse(repoInfo);
  }
  return true; // Keep message channel open
});

