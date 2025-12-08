// Simple Dashboard Renderer
// Creates a beautiful dashboard directly from repository analysis JSON

class SimpleDashboardRenderer {
  constructor() {
    this.container = null;
  }

  render(analysis, repoData, container) {
    this.container = container;
    container.innerHTML = '';
    
    // Create dashboard grid
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    
    // Render header section
    grid.appendChild(this.renderHeader(repoData, analysis));
    
    // Render metrics section
    grid.appendChild(this.renderMetrics(repoData));
    
    // Render summary section
    if (analysis.summary) {
      grid.appendChild(this.renderSummary(analysis));
    }
    
    // Render key files section
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      grid.appendChild(this.renderKeyFiles(analysis.keyFiles));
    }
    
    // Render architecture section
    if (analysis.pipeline) {
      grid.appendChild(this.renderArchitecture(analysis.pipeline));
    }
    
    // Render health section
    if (analysis.health) {
      grid.appendChild(this.renderHealth(analysis.health, repoData.metrics));
    }
    
    // Render use cases section
    if (analysis.useCases && analysis.useCases.length > 0) {
      grid.appendChild(this.renderUseCases(analysis.useCases));
    }
    
    // Render requirements section
    if (analysis.requirements) {
      grid.appendChild(this.renderRequirements(analysis.requirements));
    }
    
    container.appendChild(grid);
  }

  renderHeader(repoData, analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section header-section';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'section-header';
    
    const title = document.createElement('h1');
    title.className = 'repo-title';
    title.textContent = repoData.repository?.name || 'Repository Dashboard';
    
    const link = document.createElement('a');
    link.className = 'repo-link';
    link.href = repoData.repository?.url || '#';
    link.target = '_blank';
    link.textContent = 'View on GitHub →';
    
    headerContent.appendChild(title);
    headerContent.appendChild(link);
    
    const summary = document.createElement('p');
    summary.className = 'repo-summary';
    summary.textContent = analysis.summary || 'No summary available';
    
    section.appendChild(headerContent);
    section.appendChild(summary);
    
    return section;
  }

  renderMetrics(repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📊 Metrics';
    
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';
    
    const metrics = [
      {
        icon: '⭐',
        value: repoData.metrics?.stars || 0,
        label: 'Stars'
      },
      {
        icon: '🍴',
        value: repoData.metrics?.forks || 0,
        label: 'Forks'
      },
      {
        icon: '🏥',
        value: `${repoData.metrics?.healthScore || 0}/100`,
        label: 'Health Score'
      },
      {
        icon: '💻',
        value: repoData.metrics?.language || 'N/A',
        label: 'Language'
      }
    ];
    
    metrics.forEach(metric => {
      const card = document.createElement('div');
      card.className = 'metric-card';
      
      const icon = document.createElement('div');
      icon.className = 'metric-icon';
      icon.textContent = metric.icon;
      
      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = metric.value;
      
      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = metric.label;
      
      card.appendChild(icon);
      card.appendChild(value);
      card.appendChild(label);
      metricsGrid.appendChild(card);
    });
    
    section.appendChild(title);
    section.appendChild(metricsGrid);
    
    return section;
  }

  renderSummary(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📝 Summary';
    
    const content = document.createElement('p');
    content.className = 'repo-summary';
    
    // Handle summary as object or string
    let summaryText = '';
    if (typeof analysis.summary === 'string') {
      summaryText = analysis.summary;
    } else if (analysis.summary && typeof analysis.summary === 'object') {
      // Extract overview from summary object
      summaryText = analysis.summary.overview || 
                   analysis.summary.description || 
                   JSON.stringify(analysis.summary, null, 2);
    } else {
      summaryText = 'No summary available';
    }
    
    content.textContent = summaryText;
    
    section.appendChild(title);
    section.appendChild(content);
    
    return section;
  }

  renderKeyFiles(keyFiles) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔑 Key Files';
    
    const grid = document.createElement('div');
    grid.className = 'key-files-grid';
    
    keyFiles.slice(0, 10).forEach(file => {
      const card = document.createElement('div');
      card.className = 'key-file-card';
      
      const path = document.createElement('div');
      path.className = 'key-file-path';
      path.textContent = file.path || file;
      
      if (file.purpose) {
        const purpose = document.createElement('div');
        purpose.className = 'key-file-desc';
        purpose.textContent = file.purpose;
        card.appendChild(purpose);
      }
      
      if (file.importance) {
        const importance = document.createElement('div');
        importance.className = 'key-file-importance';
        importance.textContent = `💡 ${file.importance}`;
        card.appendChild(importance);
      }
      
      card.insertBefore(path, card.firstChild);
      grid.appendChild(card);
    });
    
    section.appendChild(title);
    section.appendChild(grid);
    
    return section;
  }

  renderArchitecture(pipeline) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🏗️ Architecture & Pipeline';
    
    const card = document.createElement('div');
    card.className = 'architecture-card';
    
    const text = document.createElement('p');
    text.className = 'architecture-text';
    text.textContent = typeof pipeline === 'string' ? pipeline : JSON.stringify(pipeline, null, 2);
    
    card.appendChild(text);
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }

  renderHealth(health, metrics) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🏥 Health Status';
    
    const card = document.createElement('div');
    card.className = 'health-card';
    
    const status = health.status || 'unknown';
    card.classList.add(`health-${status.toLowerCase()}`);
    
    const header = document.createElement('div');
    header.className = 'health-header';
    
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'health-score';
    
    const scoreValue = document.createElement('div');
    scoreValue.className = 'score-value';
    scoreValue.textContent = health.score !== undefined ? health.score : (metrics?.healthScore || 0);
    
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'score-label';
    scoreLabel.textContent = 'Health Score';
    
    scoreDiv.appendChild(scoreValue);
    scoreDiv.appendChild(scoreLabel);
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'health-status';
    
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    badge.textContent = status.toUpperCase();
    
    if (health.maintenance) {
      const maintenance = document.createElement('p');
      maintenance.className = 'maintenance-text';
      maintenance.textContent = health.maintenance;
      statusDiv.appendChild(badge);
      statusDiv.appendChild(maintenance);
    } else {
      statusDiv.appendChild(badge);
    }
    
    header.appendChild(scoreDiv);
    header.appendChild(statusDiv);
    
    card.appendChild(header);
    
    if (health.indicators && health.indicators.length > 0) {
      const indicatorsDiv = document.createElement('div');
      indicatorsDiv.className = 'health-indicators';
      
      const indicatorsTitle = document.createElement('h3');
      indicatorsTitle.textContent = 'Indicators';
      indicatorsDiv.appendChild(indicatorsTitle);
      
      const indicatorsList = document.createElement('ul');
      health.indicators.forEach(indicator => {
        const li = document.createElement('li');
        li.textContent = indicator;
        indicatorsList.appendChild(li);
      });
      indicatorsDiv.appendChild(indicatorsList);
      card.appendChild(indicatorsDiv);
    }
    
    if (health.concerns && health.concerns.length > 0) {
      const concernsDiv = document.createElement('div');
      concernsDiv.className = 'health-concerns';
      
      const concernsTitle = document.createElement('h3');
      concernsTitle.textContent = 'Concerns';
      concernsDiv.appendChild(concernsTitle);
      
      const concernsList = document.createElement('ul');
      health.concerns.forEach(concern => {
        const li = document.createElement('li');
        li.textContent = concern;
        concernsList.appendChild(li);
      });
      concernsDiv.appendChild(concernsList);
      card.appendChild(concernsDiv);
    }
    
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }

  renderUseCases(useCases) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '💡 Use Cases';
    
    const list = document.createElement('ul');
    list.className = 'use-cases-list';
    
    useCases.forEach(useCase => {
      const li = document.createElement('li');
      li.textContent = typeof useCase === 'string' ? useCase : JSON.stringify(useCase);
      list.appendChild(li);
    });
    
    section.appendChild(title);
    section.appendChild(list);
    
    return section;
  }

  renderRequirements(requirements) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '⚙️ Requirements & Setup';
    
    const card = document.createElement('div');
    card.className = 'requirements-card';
    
    if (requirements.dependencies && requirements.dependencies.length > 0) {
      const depsDiv = document.createElement('div');
      depsDiv.className = 'req-item';
      
      const depsTitle = document.createElement('h3');
      depsTitle.textContent = '📦 Dependencies';
      depsDiv.appendChild(depsTitle);
      
      const depsList = document.createElement('ul');
      requirements.dependencies.forEach(dep => {
        const li = document.createElement('li');
        li.textContent = typeof dep === 'string' ? dep : JSON.stringify(dep);
        depsList.appendChild(li);
      });
      depsDiv.appendChild(depsList);
      card.appendChild(depsDiv);
    }
    
    if (requirements.environment) {
      const envDiv = document.createElement('div');
      envDiv.className = 'req-item';
      
      const envTitle = document.createElement('h3');
      envTitle.textContent = '🌍 Environment';
      envDiv.appendChild(envTitle);
      
      const envText = document.createElement('p');
      envText.textContent = requirements.environment;
      envDiv.appendChild(envText);
      card.appendChild(envDiv);
    }
    
    if (requirements.installation) {
      const installDiv = document.createElement('div');
      installDiv.className = 'req-item';
      
      const installTitle = document.createElement('h3');
      installTitle.textContent = '📥 Installation';
      installDiv.appendChild(installTitle);
      
      const installText = document.createElement('p');
      installText.textContent = requirements.installation;
      installDiv.appendChild(installText);
      card.appendChild(installDiv);
    }
    
    if (requirements.warnings && requirements.warnings.length > 0) {
      const warningsDiv = document.createElement('div');
      warningsDiv.className = 'req-item warnings';
      
      const warningsTitle = document.createElement('h3');
      warningsTitle.textContent = '⚠️ Warnings';
      warningsDiv.appendChild(warningsTitle);
      
      const warningsList = document.createElement('ul');
      requirements.warnings.forEach(warning => {
        const li = document.createElement('li');
        li.textContent = typeof warning === 'string' ? warning : JSON.stringify(warning);
        warningsList.appendChild(li);
      });
      warningsDiv.appendChild(warningsList);
      card.appendChild(warningsDiv);
    }
    
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }
}
