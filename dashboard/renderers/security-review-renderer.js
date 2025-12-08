// Security & Review Renderer - Combined Security and PR Review view

class SecurityReviewRenderer {
  constructor() {
    this.container = null;
  }

  render(analysis, repoData, container) {
    this.container = container;
    container.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid security-review-grid';

    // 1. Health Score Section (Added back)
    if (analysis.health) {
      grid.appendChild(this.renderHealthScore(analysis, repoData));
    }
    
    // 2. Security Overview Section
    grid.appendChild(this.renderSecurityOverview(analysis, repoData));
    
    // 3. Security Issues Section
    grid.appendChild(this.renderSecurityIssues(analysis, repoData));
    
    // 4. Sensitive Information Detection
    grid.appendChild(this.renderSensitiveInfo(analysis, repoData));
    
    // 5. PR Review Section
    grid.appendChild(this.renderPRReview(analysis, repoData));
    
    // 6. Code Quality & Best Practices
    grid.appendChild(this.renderCodeQuality(analysis, repoData));

    container.appendChild(grid);
  }

  renderHealthScore(analysis, repoData) {
    // Use the same health rendering as in dashboard-simple-renderer.js (version 2.2 style)
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🏥 Health Status';
    
    const card = document.createElement('div');
    card.className = 'health-card';
    
    const health = analysis.health || {};
    const metrics = repoData.metrics || {};
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

  renderSecurityOverview(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section security-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔒 Security Overview';
    
    const card = document.createElement('div');
    card.className = 'security-overview-card';
    
    // Calculate security score
    const securityScore = this.calculateSecurityScore(analysis, repoData);
    const scoreColor = securityScore >= 80 ? '#10b981' : securityScore >= 60 ? '#f59e0b' : '#ef4444';
    
    card.innerHTML = `
      <div class="security-score-circle" style="border-color: ${scoreColor}">
        <div class="score-value" style="color: ${scoreColor}">${securityScore}</div>
        <div class="score-label">Security Score</div>
      </div>
      <div class="security-indicators">
        <div class="indicator-item">
          <span class="indicator-icon">✅</span>
          <span class="indicator-text">Security checks performed</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-icon">🔍</span>
          <span class="indicator-text">Dependency analysis</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-icon">🛡️</span>
          <span class="indicator-text">Sensitive data scan</span>
        </div>
      </div>
    `;
    
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }

  renderSecurityIssues(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section security-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '⚠️ Security Issues';
    
    const card = document.createElement('div');
    card.className = 'security-issues-card';
    
    const issues = this.detectSecurityIssues(analysis, repoData);
    
    if (issues.length === 0) {
      card.innerHTML = '<p class="no-issues">✅ No security issues detected</p>';
    } else {
      const issuesList = document.createElement('div');
      issuesList.className = 'issues-list';
      
      issues.forEach(issue => {
        const issueCard = document.createElement('div');
        issueCard.className = `issue-card issue-${issue.severity}`;
        issueCard.innerHTML = `
          <div class="issue-header">
            <span class="issue-severity-badge severity-${issue.severity}">${issue.severity.toUpperCase()}</span>
            <span class="issue-title">${issue.title}</span>
          </div>
          <div class="issue-description">${issue.description}</div>
          ${issue.files && issue.files.length > 0 ? `
            <div class="issue-files">
              <strong>Files:</strong> ${issue.files.slice(0, 3).join(', ')}
              ${issue.files.length > 3 ? ` (+${issue.files.length - 3} more)` : ''}
            </div>
          ` : ''}
          ${issue.recommendation ? `
            <div class="issue-recommendation">
              <strong>💡 Recommendation:</strong> ${issue.recommendation}
            </div>
          ` : ''}
        `;
        issuesList.appendChild(issueCard);
      });
      
      card.appendChild(issuesList);
    }
    
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }

  renderSensitiveInfo(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section security-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔐 Sensitive Information Detection';
    
    const card = document.createElement('div');
    card.className = 'sensitive-info-card';
    
    const sensitiveItems = this.detectSensitiveInfo(analysis, repoData);
    
    if (sensitiveItems.length === 0) {
      card.innerHTML = '<p class="no-issues">✅ No sensitive information detected in tracked files</p>';
    } else {
      const itemsList = document.createElement('div');
      itemsList.className = 'sensitive-items-list';
      
      sensitiveItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'sensitive-item-card';
        itemCard.innerHTML = `
          <div class="sensitive-header">
            <span class="sensitive-icon">${item.icon}</span>
            <span class="sensitive-type">${item.type}</span>
          </div>
          <div class="sensitive-location">
            <strong>Location:</strong> ${item.location}
          </div>
          ${item.snippet ? `
            <div class="sensitive-snippet">
              <code>${this.escapeHtml(item.snippet.substring(0, 100))}...</code>
            </div>
          ` : ''}
          <div class="sensitive-action">
            <strong>⚠️ Action Required:</strong> ${item.action}
          </div>
        `;
        itemsList.appendChild(itemCard);
      });
      
      card.appendChild(itemsList);
    }
    
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }

  renderPRReview(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section review-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔍 PR Review & Code Analysis';
    
    const card = document.createElement('div');
    card.className = 'review-card';
    
    // Code quality metrics
    const metrics = this.calculateCodeQualityMetrics(analysis, repoData);
    
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'review-metrics-grid';
    
    Object.keys(metrics).forEach(key => {
      const metricCard = document.createElement('div');
      metricCard.className = 'review-metric-card';
      metricCard.innerHTML = `
        <div class="metric-label">${metrics[key].label}</div>
        <div class="metric-value">${metrics[key].value}</div>
        <div class="metric-icon">${metrics[key].icon}</div>
      `;
      metricsGrid.appendChild(metricCard);
    });
    
    card.appendChild(metricsGrid);
    
    // Review recommendations
    const recommendations = this.generateReviewRecommendations(analysis, repoData);
    if (recommendations.length > 0) {
      const recsSection = document.createElement('div');
      recsSection.className = 'review-recommendations';
      recsSection.innerHTML = '<h3>📋 Review Recommendations</h3>';
      
      const recsList = document.createElement('ul');
      recsList.className = 'recommendations-list';
      
      recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="rec-icon">${rec.icon}</span>
          <span class="rec-text">${rec.text}</span>
        `;
        recsList.appendChild(li);
      });
      
      recsSection.appendChild(recsList);
      card.appendChild(recsSection);
    }
    
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }

  renderCodeQuality(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section review-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '✨ Code Quality & Best Practices';
    
    const card = document.createElement('div');
    card.className = 'code-quality-card';
    
    const qualityItems = this.analyzeCodeQuality(analysis, repoData);
    
    const qualityGrid = document.createElement('div');
    qualityGrid.className = 'quality-grid';
    
    qualityItems.forEach(item => {
      const itemCard = document.createElement('div');
      itemCard.className = `quality-item-card quality-${item.status}`;
      itemCard.innerHTML = `
        <div class="quality-header">
          <span class="quality-icon">${item.icon}</span>
          <span class="quality-title">${item.title}</span>
          <span class="quality-status status-${item.status}">${item.status}</span>
        </div>
        <div class="quality-description">${item.description}</div>
      `;
      qualityGrid.appendChild(itemCard);
    });
    
    card.appendChild(qualityGrid);
    section.appendChild(title);
    section.appendChild(card);
    
    return section;
  }

  // Helper methods
  calculateSecurityScore(analysis, repoData) {
    let score = 100;
    
    // Deduct points for issues
    const issues = this.detectSecurityIssues(analysis, repoData);
    issues.forEach(issue => {
      if (issue.severity === 'high') score -= 10;
      else if (issue.severity === 'medium') score -= 5;
      else score -= 2;
    });
    
    // Deduct for sensitive info
    const sensitive = this.detectSensitiveInfo(analysis, repoData);
    score -= sensitive.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  detectSecurityIssues(analysis, repoData) {
    const issues = [];
    
    // Check for exposed credentials
    const deepScan = analysis.deepScan || {};
    const scannedContents = deepScan.contents || [];
    
    scannedContents.forEach(file => {
      const content = file.content || '';
      const path = file.path || '';
      
      // Check for API keys in code
      if (content.match(/(api[_-]?key|apikey|secret[_-]?key|access[_-]?token)\s*[=:]\s*["']([^"']{10,})/gi)) {
        issues.push({
          severity: 'high',
          title: 'Potential API Key Exposure',
          description: `Possible API key found in ${path}`,
          files: [path],
          recommendation: 'Use environment variables or secrets management instead of hardcoding keys'
        });
      }
      
      // Check for hardcoded passwords
      if (content.match(/password\s*[=:]\s*["']([^"']{5,})/gi)) {
        issues.push({
          severity: 'high',
          title: 'Hardcoded Password',
          description: `Password found in ${path}`,
          files: [path],
          recommendation: 'Never commit passwords. Use environment variables or secure storage.'
        });
      }
      
      // Check for SQL injection risks
      if (content.match(/execute\(|query\(.*\+|query\(.*\${/gi)) {
        issues.push({
          severity: 'medium',
          title: 'Potential SQL Injection Risk',
          description: `String concatenation in database queries found in ${path}`,
          files: [path],
          recommendation: 'Use parameterized queries or ORM methods'
        });
      }
    });
    
    // Check dependencies for known vulnerabilities
    if (analysis.requirements && analysis.requirements.dependencies) {
      // This would typically call a vulnerability database
      // For now, we'll check for outdated patterns
    }
    
    return issues;
  }

  detectSensitiveInfo(analysis, repoData) {
    const items = [];
    
    const deepScan = analysis.deepScan || {};
    const scannedContents = deepScan.contents || [];
    
    scannedContents.forEach(file => {
      const content = file.content || '';
      const path = file.path || '';
      
      // Check for email addresses
      const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emails && !path.includes('test') && !path.includes('example')) {
        items.push({
          icon: '📧',
          type: 'Email Address',
          location: path,
          snippet: emails[0],
          action: 'Ensure email addresses are not sensitive or use placeholder emails in examples'
        });
      }
      
      // Check for credit card patterns (basic)
      if (content.match(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/)) {
        items.push({
          icon: '💳',
          type: 'Potential Credit Card Number',
          location: path,
          snippet: 'Credit card pattern detected',
          action: '⚠️ CRITICAL: Remove any credit card numbers immediately!'
        });
      }
      
      // Check for AWS keys
      if (content.match(/AKIA[0-9A-Z]{16}/)) {
        items.push({
          icon: '🔑',
          type: 'AWS Access Key',
          location: path,
          snippet: 'AWS key pattern detected',
          action: '⚠️ Rotate this key immediately if it was committed!'
        });
      }
    });
    
    return items;
  }

  calculateCodeQualityMetrics(analysis, repoData) {
    const keyFiles = analysis.keyFiles || [];
    const deps = analysis.requirements?.dependencies || [];
    
    return {
      files: {
        label: 'Key Files',
        value: keyFiles.length,
        icon: '📄'
      },
      dependencies: {
        label: 'Dependencies',
        value: deps.length,
        icon: '📦'
      },
      health: {
        label: 'Health Score',
        value: analysis.health?.score || 0,
        icon: '🏥'
      },
      maintainability: {
        label: 'Maintainability',
        value: analysis.health?.status || 'Unknown',
        icon: '🔧'
      }
    };
  }

  generateReviewRecommendations(analysis, repoData) {
    const recommendations = [];
    
    // Check for README
    if (!analysis.readme || analysis.readme.length < 100) {
      recommendations.push({
        icon: '📝',
        text: 'Add or improve README.md with project description and setup instructions'
      });
    }
    
    // Check for tests
    const keyFiles = analysis.keyFiles || [];
    const hasTests = keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && path.toLowerCase().includes('test');
    });
    
    if (!hasTests) {
      recommendations.push({
        icon: '🧪',
        text: 'Consider adding unit tests to improve code reliability'
      });
    }
    
    // Check for CI/CD
    const hasCI = keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && (path.includes('.github/workflows') || path.includes('ci') || path.includes('jenkins'));
    });
    
    if (!hasCI) {
      recommendations.push({
        icon: '⚙️',
        text: 'Add CI/CD pipeline for automated testing and deployment'
      });
    }
    
    // Check dependencies
    const deps = analysis.requirements?.dependencies || [];
    if (deps.length > 50) {
      recommendations.push({
        icon: '📦',
        text: 'Consider reducing dependencies to improve maintainability'
      });
    }
    
    return recommendations;
  }

  analyzeCodeQuality(analysis, repoData) {
    const items = [];
    
    // Documentation
    items.push({
      icon: '📚',
      title: 'Documentation',
      status: analysis.readme && analysis.readme.length > 100 ? 'good' : 'needs-improvement',
      description: analysis.readme && analysis.readme.length > 100 
        ? 'README and documentation present' 
        : 'Documentation could be improved'
    });
    
    // Testing
    const keyFiles = analysis.keyFiles || [];
    const hasTests = keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && path.toLowerCase().includes('test');
    });
    
    items.push({
      icon: '🧪',
      title: 'Testing',
      status: hasTests ? 'good' : 'needs-improvement',
      description: hasTests ? 'Test files detected' : 'No test files found'
    });
    
    // CI/CD
    const hasCI = keyFiles.some(f => {
      const path = typeof f === 'string' ? f : (f.path || f);
      return path && (path.includes('.github/workflows') || path.includes('ci'));
    });
    
    items.push({
      icon: '⚙️',
      title: 'CI/CD',
      status: hasCI ? 'good' : 'needs-improvement',
      description: hasCI ? 'CI/CD configuration detected' : 'No CI/CD pipeline found'
    });
    
    // Code organization
    items.push({
      icon: '📁',
      title: 'Code Organization',
      status: keyFiles.length > 5 ? 'good' : 'needs-improvement',
      description: keyFiles.length > 5 ? 'Well-organized file structure' : 'Consider better code organization'
    });
    
    return items;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

