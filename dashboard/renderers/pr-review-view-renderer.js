// PR Reviewer & Code Explorer Renderer
// Creates interactive code review and exploration dashboard

class PRReviewViewRenderer {
  constructor() {
    this.container = null;
  }

  render(analysis, repoData, container) {
    this.container = container;
    container.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    
    // 1. File Structure Explorer
    grid.appendChild(this.renderFileExplorer(analysis));
    
    // 2. Code Quality Metrics
    grid.appendChild(this.renderCodeQuality(analysis));
    
    // 3. Critical Files for Review
    grid.appendChild(this.renderCriticalFiles(analysis));
    
    // 4. Review Insights
    grid.appendChild(this.renderReviewInsights(analysis, repoData));
    
    container.appendChild(grid);
  }

  renderFileExplorer(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📂 File Structure Explorer';
    
    const explorerCard = document.createElement('div');
    explorerCard.className = 'file-explorer-card';
    
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      const explorer = document.createElement('div');
      explorer.className = 'file-explorer';
      
      // Group files by importance
      const criticalFiles = analysis.keyFiles.filter(f => {
        const importance = typeof (f.importance || '') === 'string' ? (f.importance || '').toLowerCase() : '';
        return importance && (importance.includes('critical') || importance.includes('essential'));
      });
      
      const importantFiles = analysis.keyFiles.filter(f => {
        const importance = typeof (f.importance || '') === 'string' ? (f.importance || '').toLowerCase() : '';
        return importance && (importance.includes('important') || importance.includes('high'));
      });
      
      const otherFiles = analysis.keyFiles.filter(f => {
        const importance = typeof (f.importance || '') === 'string' ? (f.importance || '').toLowerCase() : '';
        return !importance || (!importance.includes('critical') && !importance.includes('essential') && 
               !importance.includes('important') && !importance.includes('high'));
      });
      
      if (criticalFiles.length > 0) {
        const criticalSection = document.createElement('div');
        criticalSection.className = 'explorer-section critical';
        criticalSection.innerHTML = '<h3 class="explorer-section-title">🔴 Critical Files</h3>';
        
        criticalFiles.forEach(file => {
          const fileEl = this.createFileExplorerItem(file, 'critical');
          criticalSection.appendChild(fileEl);
        });
        
        explorer.appendChild(criticalSection);
      }
      
      if (importantFiles.length > 0) {
        const importantSection = document.createElement('div');
        importantSection.className = 'explorer-section important';
        importantSection.innerHTML = '<h3 class="explorer-section-title">🟡 Important Files</h3>';
        
        importantFiles.forEach(file => {
          const fileEl = this.createFileExplorerItem(file, 'important');
          importantSection.appendChild(fileEl);
        });
        
        explorer.appendChild(importantSection);
      }
      
      if (otherFiles.length > 0) {
        const otherSection = document.createElement('div');
        otherSection.className = 'explorer-section';
        otherSection.innerHTML = '<h3 class="explorer-section-title">📄 Other Key Files</h3>';
        
        otherFiles.slice(0, 10).forEach(file => {
          const fileEl = this.createFileExplorerItem(file, 'normal');
          otherSection.appendChild(fileEl);
        });
        
        explorer.appendChild(otherSection);
      }
      
      explorerCard.appendChild(explorer);
    } else {
      explorerCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No file structure data available</p>';
    }
    
    section.appendChild(title);
    section.appendChild(explorerCard);
    return section;
  }

  createFileExplorerItem(file, priority) {
    const item = document.createElement('div');
    item.className = `file-explorer-item ${priority}`;
    
    const path = file.path || file;
    const fileName = path.split('/').pop();
    const fileDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '/';
    
    item.innerHTML = `
      <div class="file-item-header">
        <span class="file-item-icon">${priority === 'critical' ? '🔴' : priority === 'important' ? '🟡' : '⚪'}</span>
        <span class="file-item-name">${fileName}</span>
        <span class="file-item-path">${fileDir}</span>
      </div>
      ${file.purpose ? `<div class="file-item-purpose">${file.purpose}</div>` : ''}
      ${file.importance ? `<div class="file-item-importance">${file.importance}</div>` : ''}
    `;
    
    return item;
  }

  renderCodeQuality(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '📊 Code Quality Metrics';
    
    const qualityCard = document.createElement('div');
    qualityCard.className = 'code-quality-card';
    
    // Calculate quality metrics based on analysis
    const metrics = {
      maintainability: this.calculateMaintainability(analysis),
      documentation: this.calculateDocumentation(analysis),
      testCoverage: this.calculateTestCoverage(analysis),
      complexity: this.calculateComplexity(analysis)
    };
    
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'quality-metrics-grid';
    
    Object.entries(metrics).forEach(([key, value]) => {
      const metricEl = document.createElement('div');
      metricEl.className = 'quality-metric';
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const scoreClass = value >= 80 ? 'high' : value >= 60 ? 'medium' : 'low';
      
      metricEl.innerHTML = `
        <div class="quality-metric-value ${scoreClass}">${value}%</div>
        <div class="quality-metric-label">${label}</div>
      `;
      metricsGrid.appendChild(metricEl);
    });
    
    qualityCard.appendChild(metricsGrid);
    
    // Add health score if available
    if (analysis.health?.score) {
      const healthScore = document.createElement('div');
      healthScore.className = 'overall-health-score';
      healthScore.innerHTML = `
        <div class="health-score-title">Overall Health Score</div>
        <div class="health-score-value">${analysis.health.score}/100</div>
        <div class="health-score-status">${analysis.health.status || 'Unknown'}</div>
      `;
      qualityCard.appendChild(healthScore);
    }
    
    section.appendChild(title);
    section.appendChild(qualityCard);
    return section;
  }

  calculateMaintainability(analysis) {
    let score = 70;
    
    // Good indicators
    if (analysis.keyFiles && analysis.keyFiles.length > 0) score += 10;
    if (analysis.pipeline) score += 10;
    if (analysis.summary) score += 10;
    
    // Bad indicators
    if (analysis.health?.concerns && analysis.health.concerns.length > 0) score -= 10;
    if (analysis.requirements?.warnings && analysis.requirements.warnings.length > 0) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateDocumentation(analysis) {
    let score = 50;
    
    if (analysis.summary && analysis.summary.length > 100) score += 20;
    if (analysis.pipeline && analysis.pipeline.length > 100) score += 20;
    if (analysis.useCases && analysis.useCases.length > 0) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateTestCoverage(analysis) {
    let score = 40; // Base score, assume some tests
    
    if (analysis.keyFiles) {
      const testFiles = analysis.keyFiles.filter(f => {
        const path = (f.path || f).toLowerCase();
        return path.includes('test') || path.includes('spec');
      });
      if (testFiles.length > 0) score += 30;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  calculateComplexity(analysis) {
    let score = 60; // Base score
    
    if (analysis.keyFiles && analysis.keyFiles.length > 10) score -= 10;
    if (analysis.requirements?.dependencies && analysis.requirements.dependencies.length > 20) score -= 10;
    if (analysis.health?.concerns && analysis.health.concerns.length > 3) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  renderCriticalFiles(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🎯 Critical Files for Review';
    
    const criticalCard = document.createElement('div');
    criticalCard.className = 'critical-files-card';
    
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      // Sort by importance
      const sortedFiles = [...analysis.keyFiles].sort((a, b) => {
        const aImportance = typeof (a.importance || '') === 'string' ? (a.importance || '').toLowerCase() : '';
        const bImportance = typeof (b.importance || '') === 'string' ? (b.importance || '').toLowerCase() : '';
        
        if (aImportance && aImportance.includes('critical')) return -1;
        if (bImportance && bImportance.includes('critical')) return 1;
        if (aImportance && (aImportance.includes('high') || aImportance.includes('important'))) return -1;
        if (bImportance && (bImportance.includes('high') || bImportance.includes('important'))) return 1;
        return 0;
      });
      
      const filesList = document.createElement('div');
      filesList.className = 'critical-files-list';
      
      sortedFiles.slice(0, 8).forEach((file, index) => {
        const fileEl = document.createElement('div');
        fileEl.className = 'critical-file-item';
        
        const importanceStr = typeof (file.importance || 'Normal') === 'string' ? (file.importance || 'Normal').toLowerCase() : 'normal';
        const priority = importanceStr.includes('critical') ? 'critical' : 
                        importanceStr.includes('high') || importanceStr.includes('important') ? 'high' : 'normal';
        
        fileEl.innerHTML = `
          <div class="critical-file-rank">#${index + 1}</div>
          <div class="critical-file-info">
            <div class="critical-file-path">${file.path || file}</div>
            ${file.purpose ? `<div class="critical-file-purpose">${file.purpose}</div>` : ''}
            ${file.importance ? `<div class="critical-file-importance ${priority}">${file.importance}</div>` : ''}
          </div>
        `;
        filesList.appendChild(fileEl);
      });
      
      criticalCard.appendChild(filesList);
    } else {
      criticalCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No critical files identified</p>';
    }
    
    section.appendChild(title);
    section.appendChild(criticalCard);
    return section;
  }

  renderReviewInsights(analysis, repoData) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '💡 Review Insights & Recommendations';
    
    const insightsCard = document.createElement('div');
    insightsCard.className = 'review-insights-card';
    
    const insights = [];
    
    // Generate insights based on analysis
    if (analysis.keyFiles && analysis.keyFiles.length > 0) {
      insights.push({
        type: 'info',
        icon: '📁',
        title: 'Focus on Key Files',
        description: `Start your review with the ${analysis.keyFiles.length} key files identified. These are critical to the repository's functionality.`
      });
    }
    
    if (analysis.health?.concerns && analysis.health.concerns.length > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Health Concerns',
        description: `Pay special attention to ${analysis.health.concerns.length} health concern(s) that may need addressing.`
      });
    }
    
    if (analysis.requirements?.warnings && analysis.requirements.warnings.length > 0) {
      insights.push({
        type: 'warning',
        icon: '🔧',
        title: 'Compatibility Issues',
        description: `${analysis.requirements.warnings.length} compatibility warning(s) detected. Review dependency versions and environment requirements.`
      });
    }
    
    if (analysis.pipeline) {
      insights.push({
        type: 'info',
        icon: '⚙️',
        title: 'Architecture Review',
        description: 'Review the architecture and pipeline to understand how components interact and data flows through the system.'
      });
    }
    
    if (!analysis.keyFiles || analysis.keyFiles.length === 0) {
      insights.push({
        type: 'tip',
        icon: '💡',
        title: 'File Analysis Needed',
        description: 'Consider analyzing more files to get better insights into the codebase structure.'
      });
    }
    
    if (insights.length === 0) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Good Starting Point',
        description: 'The repository appears well-structured. Focus your review on the key files and ensure code quality standards are met.'
      });
    }
    
    const insightsList = document.createElement('div');
    insightsList.className = 'insights-list';
    
    insights.forEach(insight => {
      const insightEl = document.createElement('div');
      insightEl.className = `insight-item ${insight.type}`;
      insightEl.innerHTML = `
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-desc">${insight.description}</div>
        </div>
      `;
      insightsList.appendChild(insightEl);
    });
    
    insightsCard.appendChild(insightsList);
    
    // Add use cases if available
    if (analysis.useCases && analysis.useCases.length > 0) {
      const useCasesEl = document.createElement('div');
      useCasesEl.className = 'review-use-cases';
      useCasesEl.innerHTML = `
        <h3 style="font-size: 16px; margin: 20px 0 10px 0; color: #ffffff;">💡 Use Cases to Verify:</h3>
        <ul style="color: #b8c5d6; font-size: 14px; line-height: 1.8;">
          ${analysis.useCases.slice(0, 5).map(uc => `<li>${typeof uc === 'string' ? uc : JSON.stringify(uc)}</li>`).join('')}
        </ul>
      `;
      insightsCard.appendChild(useCasesEl);
    }
    
    section.appendChild(title);
    section.appendChild(insightsCard);
    return section;
  }
}

