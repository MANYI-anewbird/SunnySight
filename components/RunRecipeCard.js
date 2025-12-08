// RunRecipeCard Component
// Recipe cards for Run Locally, Container, and Deploy

class RunRecipeCard {
  constructor(analysis, repoData) {
    this.analysis = analysis || {};
    this.repoData = repoData || {};
  }

  render() {
    const container = document.createElement('div');
    container.className = 'mb-6';
    
    container.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-4">🚀 Run & Deploy</h3>
      <div class="recipe-cards grid grid-cols-1 md:grid-cols-3 gap-4">
        ${this.renderRecipeCard('Run Locally', '💻', this.getLocalRecipe(), 'local')}
        ${this.renderRecipeCard('Run in Container', '🐳', this.getContainerRecipe(), 'container')}
        ${this.renderRecipeCard('Deploy to Cloud', '☁️', this.getCloudRecipe(), 'cloud')}
      </div>
    `;
    
    this.addCopyHandlers(container);
    
    return container;
  }

  renderRecipeCard(title, icon, recipe, type) {
    if (!recipe) {
      return `
        <div class="card-glass p-6 opacity-50">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">${icon}</span>
            <h4 class="text-lg font-semibold text-white">${title}</h4>
          </div>
          <p class="text-slate-400 text-sm">No recipe available</p>
        </div>
      `;
    }
    
    const difficulty = this.calculateDifficulty(recipe.command);
    const difficultyColors = {
      easy: 'bg-green-600/20 text-green-300 border-green-600/40',
      medium: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40',
      hard: 'bg-red-600/20 text-red-300 border-red-600/40'
    };
    
    return `
      <div class="card-glass p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${icon}</span>
            <h4 class="text-lg font-semibold text-white">${title}</h4>
          </div>
          <span class="difficulty-badge px-2 py-1 text-xs rounded-full border ${difficultyColors[difficulty]}">
            ${difficulty}
          </span>
        </div>
        
        <div class="recipe-command bg-slate-900 rounded-lg border border-slate-700/60 p-3 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-400 font-medium">Command</span>
            <button 
              class="copy-recipe-btn px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-all duration-200"
              data-command="${this.escapeHtml(recipe.command)}"
            >
              📋 Copy
            </button>
          </div>
          <pre class="code-block text-sm text-slate-200 font-mono overflow-x-auto"><code>${this.escapeHtml(recipe.command)}</code></pre>
        </div>
        
        ${recipe.description ? `
          <p class="text-slate-400 text-sm">${this.escapeHtml(recipe.description)}</p>
        ` : ''}
      </div>
    `;
  }

  getLocalRecipe() {
    const language = this.repoData.metrics?.language || this.repoData.repository?.language || '';
    const deps = this.analysis.requirements?.dependencies || [];
    const depStr = JSON.stringify(deps).toLowerCase();
    
    // Check for package.json
    if (this.hasFile('package.json') || depStr.includes('package.json')) {
      return {
        command: 'npm install && npm start',
        description: 'Install dependencies and start the application'
      };
    }
    
    // Check for requirements.txt
    if (this.hasFile('requirements.txt') || depStr.includes('requirements')) {
      return {
        command: 'pip install -r requirements.txt && python main.py',
        description: 'Install Python dependencies and run the main script'
      };
    }
    
    // Language-based fallback
    if (language.toLowerCase() === 'python') {
      return {
        command: 'pip install -r requirements.txt && python main.py',
        description: 'Python application setup and run'
      };
    } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
      return {
        command: 'npm install && npm start',
        description: 'Node.js application setup and run'
      };
    }
    
    return null;
  }

  getContainerRecipe() {
    if (this.hasFile('Dockerfile')) {
      const repoName = this.repoData.repository?.name?.split('/')[1] || 'repo';
      return {
        command: `docker build -t ${repoName} . && docker run -p 3000:3000 ${repoName}`,
        description: 'Build and run using Docker container'
      };
    }
    
    if (this.hasFile('docker-compose.yml')) {
      return {
        command: 'docker-compose up',
        description: 'Start services using Docker Compose'
      };
    }
    
    return null;
  }

  getCloudRecipe() {
    const keyFiles = this.analysis.keyFiles || [];
    const filePaths = keyFiles.map(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return typeof path === 'string' ? path.toLowerCase() : '';
    }).join(' ');
    
    // Detect deployment platforms
    if (filePaths.includes('vercel.json') || filePaths.includes('.vercel')) {
      return {
        command: 'vercel deploy',
        description: 'Deploy to Vercel platform'
      };
    }
    
    if (filePaths.includes('heroku') || filePaths.includes('Procfile')) {
      return {
        command: 'git push heroku main',
        description: 'Deploy to Heroku'
      };
    }
    
    if (this.hasFile('Dockerfile')) {
      return {
        command: 'docker build -t repo . && docker push repo',
        description: 'Build and push Docker image for cloud deployment'
      };
    }
    
    return null;
  }

  calculateDifficulty(command) {
    if (!command) return 'easy';
    
    const complexity = command.split('&&').length + command.split('|').length;
    
    if (complexity <= 2) return 'easy';
    if (complexity <= 4) return 'medium';
    return 'hard';
  }

  hasFile(fileName) {
    if (!this.analysis.keyFiles) return false;
    return this.analysis.keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && path.toLowerCase().includes(fileName.toLowerCase());
    });
  }

  addCopyHandlers(container) {
    container.querySelectorAll('.copy-recipe-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const command = btn.dataset.command;
        try {
          await navigator.clipboard.writeText(command);
          btn.innerHTML = '✅';
          setTimeout(() => {
            btn.innerHTML = '📋 Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.RunRecipeCard = RunRecipeCard;
}

