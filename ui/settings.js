// Settings page logic

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const openaiInput = document.getElementById('openai-key');
  const githubInput = document.getElementById('github-token');
  const geminiInput = document.getElementById('gemini-key');
  const statusMessage = document.getElementById('status-message');

  // Load existing settings
  chrome.storage.sync.get(['openaiKey', 'githubToken', 'geminiKey'], (result) => {
    if (result.openaiKey) {
      openaiInput.value = result.openaiKey;
    }
    if (result.githubToken) {
      githubInput.value = result.githubToken;
    }
    if (result.geminiKey) {
      geminiInput.value = result.geminiKey;
    }
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const openaiKey = openaiInput.value.trim();
    const githubToken = githubInput.value.trim();
    const geminiKey = geminiInput.value.trim();

    // Validate OpenAI key
    if (!openaiKey) {
      showStatus('OpenAI API key is required', 'error');
      return;
    }

    if (!openaiKey.startsWith('sk-')) {
      showStatus('Invalid OpenAI API key format', 'error');
      return;
    }

    // Validate Gemini key format if provided
    if (geminiKey && !geminiKey.startsWith('AIza')) {
      showStatus('Invalid Gemini API key format (should start with AIza)', 'error');
      return;
    }

    // Save to storage
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({
          openaiKey: openaiKey,
          githubToken: githubToken || null,
          geminiKey: geminiKey || null
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

