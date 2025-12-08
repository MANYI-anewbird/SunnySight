// Pipeline Visualization Renderer
// Creates visual pipeline and workflow representations

class PipelineViewRenderer {
  constructor() {
    this.container = null;
  }

  render(analysis, repoData, container) {
    this.container = container;
    container.innerHTML = '';
    
    // Ensure repoData is defined with defaults
    if (!repoData) {
      repoData = {
        repository: analysis?.metadata || {},
        metrics: {
          stars: analysis?.metadata?.stars || 0,
          forks: analysis?.metadata?.forks || 0,
          language: analysis?.metadata?.language || 'Unknown',
          healthScore: analysis?.health?.score || 0,
          healthStatus: analysis?.health?.status || 'unknown'
        },
        analysis: analysis || {}
      };
    }
    
    // Ensure required properties exist
    if (!repoData.repository) repoData.repository = analysis?.metadata || {};
    if (!repoData.metrics) {
      repoData.metrics = {
        stars: analysis?.metadata?.stars || 0,
        forks: analysis?.metadata?.forks || 0,
        language: analysis?.metadata?.language || 'Unknown',
        healthScore: analysis?.health?.score || 0,
        healthStatus: analysis?.health?.status || 'unknown'
      };
    }
    
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    
    try {
      // 1. Architecture Pipeline Flow
      grid.appendChild(this.renderPipelineFlow(analysis));
      
      // 2. Build & Deploy Process
      grid.appendChild(this.renderBuildProcess(analysis));
      
      // 3. Data Flow Diagram
      grid.appendChild(this.renderDataFlow(analysis));
      
      // 4. CI/CD Detection
      grid.appendChild(this.renderCICD(analysis));
    } catch (error) {
      console.error('Error rendering pipeline sections:', error);
      container.innerHTML = `<div class="error">Error rendering pipeline view: ${error?.message || 'Unknown error'}</div>`;
      return;
    }
    
    container.appendChild(grid);
  }

  renderPipelineFlow(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '⚙️ Architecture Pipeline';
    
    const flowCard = document.createElement('div');
    flowCard.className = 'pipeline-flow-card';
    
    if (analysis.pipeline) {
      // Parse pipeline text into stages
      const pipelineText = analysis.pipeline;
      const stages = this.extractPipelineStages(pipelineText);
      
      if (stages.length > 0) {
        const flow = document.createElement('div');
        flow.className = 'pipeline-flow';
        
        stages.forEach((stage, index) => {
          const stageDiv = document.createElement('div');
          stageDiv.className = 'pipeline-stage-item';
          stageDiv.innerHTML = `
            <div class="pipeline-stage-number">${index + 1}</div>
            <div class="pipeline-stage-content">
              <div class="pipeline-stage-title">${stage.title}</div>
              <div class="pipeline-stage-desc">${stage.description}</div>
            </div>
          `;
          flow.appendChild(stageDiv);
          
          if (index < stages.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'pipeline-arrow';
            arrow.innerHTML = '→';
            flow.appendChild(arrow);
          }
        });
        
        flowCard.appendChild(flow);
      } else {
        // Show full pipeline text
        const pipelineTextEl = document.createElement('p');
        pipelineTextEl.className = 'architecture-text';
        pipelineTextEl.textContent = pipelineText;
        flowCard.appendChild(pipelineTextEl);
      }
    } else {
      flowCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No pipeline information available</p>';
    }
    
    section.appendChild(title);
    section.appendChild(flowCard);
    return section;
  }

  extractPipelineStages(text) {
    // Simple extraction of pipeline stages from text
    const stages = [];
    const lines = text.split('\n').filter(l => l.trim());
    
    // Look for numbered stages or key words
    lines.forEach((line, index) => {
      if (line.match(/^\d+[\.\)]/) || line.toLowerCase().includes('stage') || line.toLowerCase().includes('step')) {
        stages.push({
          title: line.substring(0, 50),
          description: line.substring(50) || 'Pipeline stage'
        });
      }
    });
    
    // If no stages found, create from sentences
    if (stages.length === 0 && lines.length > 0) {
      lines.slice(0, 5).forEach((line, index) => {
        if (line.length > 20) {
          stages.push({
            title: `Step ${index + 1}`,
            description: line.substring(0, 100)
          });
        }
      });
    }
    
    return stages;
  }

  renderBuildProcess(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔨 Build & Deploy Process';
    
    const buildCard = document.createElement('div');
    buildCard.className = 'build-process-card';
    
    const stages = [
      { name: 'Source', icon: '📝', desc: 'Code repository' },
      { name: 'Build', icon: '🔨', desc: 'Compile & package' },
      { name: 'Test', icon: '🧪', desc: 'Run tests' },
      { name: 'Deploy', icon: '🚀', desc: 'Deploy to production' }
    ];
    
    const processFlow = document.createElement('div');
    processFlow.className = 'build-process-flow';
    
    stages.forEach((stage, index) => {
      const stageEl = document.createElement('div');
      stageEl.className = 'build-stage';
      
      // Detect build tools from key files
      let toolDetected = '';
      if (analysis.keyFiles) {
        const filePaths = analysis.keyFiles.map(f => f.path || f).join(' ').toLowerCase();
        if (filePaths.includes('package.json')) toolDetected = 'npm/yarn';
        if (filePaths.includes('requirements.txt')) toolDetected = 'pip';
        if (filePaths.includes('pom.xml')) toolDetected = 'maven';
        if (filePaths.includes('build.gradle')) toolDetected = 'gradle';
      }
      
      stageEl.innerHTML = `
        <div class="build-stage-icon">${stage.icon}</div>
        <div class="build-stage-name">${stage.name}</div>
        <div class="build-stage-desc">${index === 1 && toolDetected ? toolDetected : stage.desc}</div>
      `;
      
      processFlow.appendChild(stageEl);
      
      if (index < stages.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'build-arrow';
        arrow.innerHTML = '→';
        processFlow.appendChild(arrow);
      }
    });
    
    buildCard.appendChild(processFlow);
    
    // Show installation instructions if available
    if (analysis.requirements?.installation) {
      const installDiv = document.createElement('div');
      installDiv.className = 'install-instructions';
      installDiv.innerHTML = `
        <h3 style="font-size: 16px; margin: 20px 0 10px 0; color: #ffffff;">Installation Steps:</h3>
        <p style="color: #b8c5d6; line-height: 1.6;">${analysis.requirements.installation}</p>
      `;
      buildCard.appendChild(installDiv);
    }
    
    section.appendChild(title);
    section.appendChild(buildCard);
    return section;
  }

  renderDataFlow(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔄 Data Flow';
    
    const flowCard = document.createElement('div');
    flowCard.className = 'data-flow-card';
    
    if (analysis.pipeline) {
      // Extract data flow information from pipeline description
      const flowText = analysis.pipeline.toLowerCase();
      const flowComponents = [];
      
      // Detect common data flow patterns
      if (flowText.includes('input') || flowText.includes('read')) flowComponents.push({ name: 'Input', icon: '📥' });
      if (flowText.includes('process') || flowText.includes('transform')) flowComponents.push({ name: 'Process', icon: '⚙️' });
      if (flowText.includes('store') || flowText.includes('database')) flowComponents.push({ name: 'Storage', icon: '💾' });
      if (flowText.includes('output') || flowText.includes('api')) flowComponents.push({ name: 'Output', icon: '📤' });
      
      if (flowComponents.length > 0) {
        const flow = document.createElement('div');
        flow.className = 'data-flow-diagram';
        
        flowComponents.forEach((comp, index) => {
          const compEl = document.createElement('div');
          compEl.className = 'data-flow-component';
          compEl.innerHTML = `
            <div class="data-flow-icon">${comp.icon}</div>
            <div class="data-flow-label">${comp.name}</div>
          `;
          flow.appendChild(compEl);
          
          if (index < flowComponents.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'data-flow-arrow';
            arrow.innerHTML = '→';
            flow.appendChild(arrow);
          }
        });
        
        flowCard.appendChild(flow);
      } else {
        // Show pipeline as data flow
        const flowTextEl = document.createElement('p');
        flowTextEl.className = 'architecture-text';
        flowTextEl.textContent = analysis.pipeline.substring(0, 500);
        flowCard.appendChild(flowTextEl);
      }
    } else {
      flowCard.innerHTML = '<p style="color: #b8c5d6; text-align: center; padding: 20px;">No data flow information available</p>';
    }
    
    section.appendChild(title);
    section.appendChild(flowCard);
    return section;
  }

  renderCICD(analysis) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';
    
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '🔁 CI/CD Detection';
    
    const cicdCard = document.createElement('div');
    cicdCard.className = 'cicd-card';
    
    // Detect CI/CD files from key files
    let cicdDetected = false;
    let cicdFiles = [];
    
    if (analysis.keyFiles) {
      analysis.keyFiles.forEach(file => {
        const path = (file.path || file).toLowerCase();
        if (path.includes('.github/workflows') || path.includes('ci.yml') || path.includes('cd.yml') ||
            path.includes('.gitlab-ci') || path.includes('jenkinsfile') || path.includes('circleci') ||
            path.includes('travis.yml') || path.includes('azure-pipelines')) {
          cicdDetected = true;
          cicdFiles.push(file.path || file);
        }
      });
    }
    
    if (cicdDetected) {
      const statusEl = document.createElement('div');
      statusEl.className = 'cicd-status';
      statusEl.innerHTML = `
        <div class="cicd-indicator active">
          <span class="cicd-icon">✅</span>
          <span class="cicd-text">CI/CD Configured</span>
        </div>
      `;
      cicdCard.appendChild(statusEl);
      
      const filesList = document.createElement('div');
      filesList.className = 'cicd-files';
      filesList.innerHTML = '<h3 style="font-size: 16px; margin: 20px 0 10px 0; color: #ffffff;">CI/CD Files:</h3>';
      
      cicdFiles.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.className = 'cicd-file-item';
        fileEl.textContent = file;
        filesList.appendChild(fileEl);
      });
      
      cicdCard.appendChild(filesList);
    } else {
      cicdCard.innerHTML = `
        <div class="cicd-status">
          <div class="cicd-indicator inactive">
            <span class="cicd-icon">⚠️</span>
            <span class="cicd-text">No CI/CD detected</span>
          </div>
          <p style="color: #b8c5d6; margin-top: 15px; font-size: 14px;">
            Consider adding CI/CD configuration files like:
            <br>• .github/workflows/*.yml (GitHub Actions)
            <br>• .gitlab-ci.yml (GitLab CI)
            <br>• Jenkinsfile (Jenkins)
          </p>
        </div>
      `;
    }
    
    section.appendChild(title);
    section.appendChild(cicdCard);
    return section;
  }
}

