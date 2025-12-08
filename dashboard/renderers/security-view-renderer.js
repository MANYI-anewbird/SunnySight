// Security Dashboard Renderer
// Creates security analysis and vulnerability scanning dashboard

class SecurityViewRenderer {
  constructor() {
    this.container = null;
  }

  render(analysis, repoData, container) {
    this.container = container;
    container.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    
    // 1. Security Overview Score
    grid.appendChild(this.renderSecurityScore(analysis));
    
    // 2. Vulnerability Scanner
    grid.appendChild(this.renderVulnerabilities(analysis));
    
    // 3. Dependency Security
    grid.appendChild(this.renderDependencySecurity(analysis));
    
    // 4. Sensitive Data Detection
    grid.appendChild(this.renderSensitiveData(analysis));
    
    // 5. Security Best Practices
    grid.appendChild(this.renderBestPractices(analysis));
    
    container.appendChild(grid);
  }

  renderSecurityScore(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔒 Security Overview';
    
    const scoreCard = document.createElement('div');
    scoreCard.className = 'security-score-card';
    
    // Calculate security score based on various factors
    let securityScore = 70; // Base score
    const issues = [];
    
    // Check for security concerns
    if (analysis.health?.concerns && Array.isArray(analysis.health.concerns)) {
      analysis.health.concerns.forEach(concern => {
        const concernStr = typeof concern === 'string' ? concern : String(concern || '');
        if (concernStr.toLowerCase().includes('security') || concernStr.toLowerCase().includes('vulnerability')) {
          securityScore -= 10;
          issues.push(concern);
        }
      });
    }
    
    // Check for warnings
    if (analysis.requirements?.warnings) {
      securityScore -= analysis.requirements.warnings.length * 5;
      issues.push(...analysis.requirements.warnings);
    }
    
    // Check key files for security files
    if (analysis.keyFiles && Array.isArray(analysis.keyFiles)) {
      const hasSecurityConfig = analysis.keyFiles.some(f => {
        const path = typeof (f.path || f) === 'string' ? (f.path || f).toLowerCase() : '';
        return path && (path.includes('security') || path.includes('.env.example') || path.includes('secrets'));
      });
      if (!hasSecurityConfig) {
        securityScore -= 5;
      }
    }
    
    securityScore = Math.max(0, Math.min(100, securityScore));
    
    const scoreClass = securityScore >= 80 ? 'high' : securityScore >= 60 ? 'medium' : 'low';
    
    scoreCard.innerHTML = `
      <div class="security-score ${scoreClass}">
        <div class="security-score-value">${securityScore}</div>
        <div class="security-score-label">Security Score</div>
      </div>
      <div class="security-status">
        <div class="security-status-badge ${scoreClass}">
          ${securityScore >= 80 ? '🟢 Secure' : securityScore >= 60 ? '🟡 Moderate' : '🔴 At Risk'}
        </div>
        ${issues.length > 0 ? `<p style="color: #b8c5d6; margin-top: 15px; font-size: 14px;">${issues.length} security concern${issues.length > 1 ? 's' : ''} detected</p>` : ''}
      </div>
    `;
    
    section.appendChild(title);
    section.appendChild(scoreCard);
    return section;
  }

  renderVulnerabilities(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '⚠️ Vulnerabilities & Risks';
    
    const vulnCard = document.createElement('div');
    vulnCard.className = 'vulnerabilities-card';
    
    const vulnerabilities = [];
    
    // Check health concerns
    if (analysis.health?.concerns && analysis.health.concerns.length > 0) {
      analysis.health.concerns.forEach(concern => {
        vulnerabilities.push({
          type: 'warning',
          title: 'Health Concern',
          description: concern,
          severity: 'medium'
        });
      });
    }
    
    // Check requirements warnings
    if (analysis.requirements?.warnings && analysis.requirements.warnings.length > 0) {
      analysis.requirements.warnings.forEach(warning => {
        vulnerabilities.push({
          type: 'warning',
          title: 'Compatibility Warning',
          description: warning,
          severity: 'low'
        });
      });
    }
    
    // Scan key files for potential issues
    if (analysis.keyFiles && Array.isArray(analysis.keyFiles)) {
      analysis.keyFiles.forEach(file => {
        const filePath = file.path || file;
        const path = typeof filePath === 'string' ? filePath.toLowerCase() : '';
        
        if (!path) return;
        
        // Check for potential security issues
        if (path.includes('secret') || path.includes('key') || path.includes('token')) {
          if (!path.includes('.example') && !path.includes('.template')) {
            vulnerabilities.push({
              type: 'sensitive',
              title: 'Potential Sensitive File',
              description: `File "${filePath}" may contain sensitive information`,
              severity: 'high'
            });
          }
        }
        
        // Check for missing security files
        if (path.includes('package.json') || path.includes('requirements.txt')) {
          // Dependency files exist, but check if security is addressed
        }
      });
    }
    
    if (vulnerabilities.length > 0) {
      vulnerabilities.forEach(vuln => {
        const vulnEl = document.createElement('div');
        vulnEl.className = `vulnerability-card ${vuln.severity}`;
        vulnEl.innerHTML = `
          <div class="vulnerability-header">
            <span class="vulnerability-icon">${vuln.severity === 'high' ? '🔴' : vuln.severity === 'medium' ? '🟡' : '⚪'}</span>
            <span class="vulnerability-title">${vuln.title}</span>
            <span class="vulnerability-severity ${vuln.severity}">${vuln.severity.toUpperCase()}</span>
          </div>
          <div class="vulnerability-desc">${vuln.description}</div>
        `;
        vulnCard.appendChild(vulnEl);
      });
    } else {
      vulnCard.innerHTML = `
        <div class="vulnerability-card success">
          <div class="vulnerability-header">
            <span class="vulnerability-icon">✅</span>
            <span class="vulnerability-title">No Critical Vulnerabilities Detected</span>
          </div>
          <div class="vulnerability-desc">No obvious security vulnerabilities found in the analysis.</div>
        </div>
      `;
    }
    
    section.appendChild(title);
    section.appendChild(vulnCard);
    return section;
  }

  renderDependencySecurity(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📦 Dependency Security';
    
    const depsCard = document.createElement('div');
    depsCard.className = 'dependency-security-card';
    
    if (analysis.requirements?.dependencies && analysis.requirements.dependencies.length > 0) {
      const depsCount = analysis.requirements.dependencies.length;
      const depsList = document.createElement('div');
      depsList.className = 'dependency-list';
      
      depsList.innerHTML = `
        <div class="dependency-summary">
          <span class="dep-count">${depsCount}</span>
          <span class="dep-label">dependencies found</span>
        </div>
        <p style="color: #b8c5d6; margin: 15px 0; font-size: 14px;">
          ⚠️ <strong>Recommendation:</strong> Regularly scan dependencies for known vulnerabilities.
          <br>Use tools like: npm audit, pip-audit, Snyk, or Dependabot.
        </p>
        <div class="dependency-items">
          ${analysis.requirements.dependencies.slice(0, 10).map(dep => {
            const depName = typeof dep === 'string' ? dep : JSON.stringify(dep);
            return `<div class="dependency-item">
              <span class="dep-icon">📚</span>
              <span class="dep-name">${depName}</span>
              <span class="dep-status unknown">Status: Unknown</span>
            </div>`;
          }).join('')}
        </div>
      `;
      
      depsCard.appendChild(depsList);
    } else {
      depsCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No dependency information available</p>';
    }
    
    section.appendChild(title);
    section.appendChild(depsCard);
    return section;
  }

  renderSensitiveData(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔐 Sensitive Data Detection';
    
    const sensitiveCard = document.createElement('div');
    sensitiveCard.className = 'sensitive-data-card';
    
    const sensitiveFiles = [];
    const patterns = [
      { pattern: /\.env$/, name: 'Environment Variables', severity: 'high' },
      { pattern: /secret/i, name: 'Secret Files', severity: 'high' },
      { pattern: /key/i, name: 'Key Files', severity: 'medium' },
      { pattern: /token/i, name: 'Token Files', severity: 'high' },
      { pattern: /password/i, name: 'Password Files', severity: 'high' },
      { pattern: /credential/i, name: 'Credentials', severity: 'high' }
    ];
    
    if (analysis.keyFiles && Array.isArray(analysis.keyFiles)) {
      analysis.keyFiles.forEach(file => {
        const filePath = file.path || file;
        const path = typeof filePath === 'string' ? filePath : String(filePath || '');
        
        if (!path) return;
        
        patterns.forEach(p => {
          if (p.pattern.test(path) && !path.includes('.example') && !path.includes('.template') && !path.includes('.sample')) {
            sensitiveFiles.push({
              path: path,
              type: p.name,
              severity: p.severity
            });
          }
        });
      });
    }
    
    if (sensitiveFiles.length > 0) {
      const warningEl = document.createElement('div');
      warningEl.className = 'sensitive-warning';
      warningEl.innerHTML = `
        <div class="sensitive-alert">
          <span class="sensitive-icon">⚠️</span>
          <span class="sensitive-text"><strong>${sensitiveFiles.length} potentially sensitive file${sensitiveFiles.length > 1 ? 's' : ''} detected</strong></span>
        </div>
        <p style="color: #ff9800; margin: 15px 0; font-size: 14px;">
          Make sure these files are not committed to version control or are properly secured.
        </p>
      `;
      sensitiveCard.appendChild(warningEl);
      
      sensitiveFiles.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.className = `sensitive-file-item ${file.severity}`;
        fileEl.innerHTML = `
          <span class="sensitive-file-icon">${file.severity === 'high' ? '🔴' : '🟡'}</span>
          <span class="sensitive-file-path">${file.path}</span>
          <span class="sensitive-file-type">${file.type}</span>
        `;
        sensitiveCard.appendChild(fileEl);
      });
    } else {
      sensitiveCard.innerHTML = `
        <div class="sensitive-safe">
          <span class="sensitive-icon">✅</span>
          <span class="sensitive-text">No obvious sensitive files detected in key files</span>
        </div>
        <p style="color: #b8c5d6; margin-top: 15px; font-size: 14px;">
          Always ensure sensitive data is stored in environment variables or secure vaults.
        </p>
      `;
    }
    
    section.appendChild(title);
    section.appendChild(sensitiveCard);
    return section;
  }

  renderBestPractices(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🛡️ Security Best Practices';
    
    const practicesCard = document.createElement('div');
    practicesCard.className = 'best-practices-card';
    
    const practices = [
      { icon: '✅', text: 'Use dependency scanning tools (npm audit, Snyk, Dependabot)' },
      { icon: '✅', text: 'Keep dependencies up to date' },
      { icon: '✅', text: 'Never commit secrets or API keys to version control' },
      { icon: '✅', text: 'Use environment variables for configuration' },
      { icon: '✅', text: 'Implement proper authentication and authorization' },
      { icon: '✅', text: 'Regular security audits and code reviews' },
      { icon: '✅', text: 'Use HTTPS for all API communications' },
      { icon: '✅', text: 'Implement rate limiting and input validation' }
    ];
    
    const practicesList = document.createElement('ul');
    practicesList.className = 'practices-list';
    
    practices.forEach(practice => {
      const li = document.createElement('li');
      li.className = 'practice-item';
      li.innerHTML = `
        <span class="practice-icon">${practice.icon}</span>
        <span class="practice-text">${practice.text}</span>
      `;
      practicesList.appendChild(li);
    });
    
    practicesCard.appendChild(practicesList);
    
    // Add specific recommendations based on analysis
    if (analysis.requirements?.warnings && analysis.requirements.warnings.length > 0) {
      const recommendations = document.createElement('div');
      recommendations.className = 'security-recommendations';
      recommendations.innerHTML = `
        <h3 style="font-size: 16px; margin: 20px 0 10px 0; color: #ffffff;">Specific Recommendations:</h3>
        <ul style="color: #b8c5d6; font-size: 14px; line-height: 1.8;">
          ${analysis.requirements.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
      `;
      practicesCard.appendChild(recommendations);
    }
    
    section.appendChild(title);
    section.appendChild(practicesCard);
    return section;
  }
}

