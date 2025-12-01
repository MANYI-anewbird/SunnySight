// Settings page logic

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const openaiInput = document.getElementById('openai-key');
  const githubInput = document.getElementById('github-token');
  const statusMessage = document.getElementById('status-message');

  // Load existing settings
  chrome.storage.sync.get(['openaiKey', 'githubToken'], (result) => {
    if (result.openaiKey) {
      openaiInput.value = result.openaiKey;
    }
    if (result.githubToken) {
      githubInput.value = result.githubToken;
    }
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const openaiKey = openaiInput.value.trim();
    const githubToken = githubInput.value.trim();

    // Validate OpenAI key
    if (!openaiKey) {
      showStatus('OpenAI API key is required', 'error');
      return;
    }

    if (!openaiKey.startsWith('sk-')) {
      showStatus('Invalid OpenAI API key format', 'error');
      return;
    }

    // Save to storage
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({
          openaiKey: openaiKey,
          githubToken: githubToken || null
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      showStatus('✅ Settings saved successfully!', 'success');
      
      // Clear status after 3 seconds
      setTimeout(() => {
        statusMessage.style.display = 'none';
        statusMessage.className = 'status-message';
      }, 3000);
    } catch (error) {
      showStatus('❌ Error saving settings: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
  }
});

