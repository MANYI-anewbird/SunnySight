// A2UI Protocol Renderer
// Renders A2UI protocol messages into HTML

class A2UIRenderer {
  constructor() {
    this.surfaces = {};
    this.dataModels = {};
  }

  // Main render method
  render(protocolMessages, repoData, container, analysisJson = {}) {
    try {
      console.log('A2UIRenderer.render called with', protocolMessages.length, 'messages');
      
      // Initialize default data model with repository data and analysis
      this.defaultDataModel = {
        repository: repoData.repository || {},
        analysis: analysisJson || repoData.analysis || {},
        metrics: repoData.metrics || {},
        ...analysisJson // Merge full analysis JSON into data model
      };

      console.log('Default data model initialized:', Object.keys(this.defaultDataModel));

      // Process all protocol messages
      for (let i = 0; i < protocolMessages.length; i++) {
        const message = protocolMessages[i];
        console.log(`Processing message ${i + 1}/${protocolMessages.length}:`, Object.keys(message)[0]);
        
        if (message.surfaceUpdate) {
          this.processSurfaceUpdate(message.surfaceUpdate);
        } else if (message.dataModelUpdate) {
          this.processDataModelUpdate(message.dataModelUpdate);
        } else if (message.beginRendering) {
          this.processBeginRendering(message.beginRendering, container);
        } else {
          console.warn('Unknown message type:', message);
        }
      }

      console.log('Processed surfaces:', Object.keys(this.surfaces));

      // If no beginRendering message, render the first surface
      if (Object.keys(this.surfaces).length > 0 && !container.querySelector('.a2ui-surface')) {
        console.log('No beginRendering found, rendering first surface');
        const firstSurfaceId = Object.keys(this.surfaces)[0];
        this.renderSurface(firstSurfaceId, container);
      }

      // If still no content, create a fallback display
      if (!container.querySelector('.a2ui-surface') && Object.keys(this.surfaces).length === 0) {
        console.warn('No surfaces to render, creating fallback');
        this.createFallbackDisplay(container, repoData);
      }
    } catch (error) {
      console.error('Render error:', error);
      this.createFallbackDisplay(container, repoData, error);
      throw error;
    }
  }

  // Create fallback display if rendering fails
  createFallbackDisplay(container, repoData, error = null) {
    const fallback = document.createElement('div');
    fallback.className = 'a2ui-surface';
    fallback.innerHTML = `
      <div class="a2ui-card" style="padding: 30px;">
        <h2 class="a2ui-text h2">Repository Dashboard: ${repoData.repository?.name || 'Unknown'}</h2>
        ${error ? `<p style="color: #f44336; margin: 20px 0;">Error: ${error.message}</p>` : ''}
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${repoData.metrics?.stars || 0}</div>
            <div class="metric-label">Stars</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${repoData.metrics?.forks || 0}</div>
            <div class="metric-label">Forks</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${repoData.metrics?.healthScore || 0}</div>
            <div class="metric-label">Health Score</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${repoData.metrics?.language || 'N/A'}</div>
            <div class="metric-label">Language</div>
          </div>
        </div>
        <div class="a2ui-card" style="margin-top: 20px;">
          <h3 class="a2ui-text h3">Summary</h3>
          <p class="a2ui-text body">${repoData.analysis?.summary || 'No summary available'}</p>
        </div>
      </div>
    `;
    container.appendChild(fallback);
  }

  // Process surfaceUpdate message
  processSurfaceUpdate(surfaceUpdate) {
    const { surfaceId, components } = surfaceUpdate;
    this.surfaces[surfaceId] = components;
  }

  // Process dataModelUpdate message
  processDataModelUpdate(dataModelUpdate) {
    const { surfaceId, data } = dataModelUpdate;
    if (!this.dataModels[surfaceId]) {
      this.dataModels[surfaceId] = {};
    }
    Object.assign(this.dataModels[surfaceId], data);
  }

  // Process beginRendering message
  processBeginRendering(beginRendering, container) {
    const { surfaceId, root } = beginRendering;
    this.renderSurface(surfaceId, container, root);
  }

  // Render a surface
  renderSurface(surfaceId, container, rootId = null) {
    console.log(`Rendering surface: ${surfaceId}, rootId: ${rootId}`);
    const components = this.surfaces[surfaceId];
    if (!components) {
      console.warn(`No components found for surface: ${surfaceId}`);
      return;
    }

    console.log(`Found ${components.length} components for surface ${surfaceId}`);

    const surfaceEl = document.createElement('div');
    surfaceEl.className = 'a2ui-surface';
    surfaceEl.setAttribute('data-surface-id', surfaceId);

    // Find root component
    let rootComponent = null;
    if (rootId) {
      rootComponent = components.find(c => c.id === rootId);
      if (!rootComponent) {
        console.warn(`Root component "${rootId}" not found, using first component`);
      }
    }
    if (!rootComponent && components.length > 0) {
      rootComponent = components[0];
    }

    if (rootComponent) {
      console.log(`Rendering root component: ${rootComponent.id} (${rootComponent.type})`);
      try {
        const rootEl = this.renderComponent(rootComponent, components, surfaceId);
        if (rootEl) {
          surfaceEl.appendChild(rootEl);
        } else {
          console.warn('Root component rendered null');
        }
      } catch (error) {
        console.error('Error rendering root component:', error);
        throw error;
      }
    } else {
      console.warn('No root component found to render');
    }

    container.appendChild(surfaceEl);
    console.log('Surface rendered successfully');
  }

  // Render a single component
  renderComponent(component, allComponents, surfaceId) {
    if (!component || !component.type) {
      console.warn('Invalid component:', component);
      return null;
    }

    const { id, type, children, ...props } = component;
    const dataModel = { ...this.defaultDataModel, ...(this.dataModels[surfaceId] || {}) };

    let element = null;

    switch (type) {
      case 'Column':
        element = document.createElement('div');
        element.className = 'a2ui-column';
        if (children && Array.isArray(children)) {
          children.forEach(childId => {
            const childComponent = allComponents.find(c => c.id === childId);
            if (childComponent) {
              const childEl = this.renderComponent(childComponent, allComponents, surfaceId);
              if (childEl) element.appendChild(childEl);
            }
          });
        }
        break;

      case 'Row':
        element = document.createElement('div');
        element.className = 'a2ui-row';
        if (children && Array.isArray(children)) {
          children.forEach(childId => {
            const childComponent = allComponents.find(c => c.id === childId);
            if (childComponent) {
              const childEl = this.renderComponent(childComponent, allComponents, surfaceId);
              if (childEl) element.appendChild(childEl);
            }
          });
        }
        break;

      case 'Card':
        element = document.createElement('div');
        element.className = 'a2ui-card';
        if (children && Array.isArray(children)) {
          children.forEach(childId => {
            const childComponent = allComponents.find(c => c.id === childId);
            if (childComponent) {
              const childEl = this.renderComponent(childComponent, allComponents, surfaceId);
              if (childEl) element.appendChild(childEl);
            }
          });
        }
        break;

      case 'Text':
        element = document.createElement('div');
        element.className = 'a2ui-text';
        
        // Get text content
        let textContent = '';
        if (props.text) {
          if (props.text.literalString) {
            textContent = props.text.literalString;
          } else if (props.text.path) {
            textContent = this.getDataModelValue(dataModel, props.text.path) || '';
          }
        }

        // Apply usage hint
        if (props.usageHint) {
          element.classList.add(props.usageHint);
        } else {
          element.classList.add('body');
        }

        element.textContent = textContent;
        break;

      case 'Button':
        element = document.createElement('button');
        element.className = 'a2ui-button';
        
        if (props.text) {
          if (props.text.literalString) {
            element.textContent = props.text.literalString;
          } else if (props.text.path) {
            element.textContent = this.getDataModelValue(dataModel, props.text.path) || 'Button';
          }
        }

        if (props.onClick) {
          element.addEventListener('click', () => {
            // Handle button click
            console.log('Button clicked:', id);
          });
        }
        break;

      case 'Spacer':
        element = document.createElement('div');
        element.className = 'a2ui-spacer';
        break;

      case 'Image':
        element = document.createElement('img');
        if (props.url) {
          if (props.url.literalString) {
            element.src = props.url.literalString;
          } else if (props.url.path) {
            element.src = this.getDataModelValue(dataModel, props.url.path) || '';
          }
        }
        if (props.fit) {
          element.style.objectFit = props.fit;
        }
        break;

      default:
        // Unknown component type - render as div
        element = document.createElement('div');
        element.className = `a2ui-${type.toLowerCase()}`;
        element.textContent = `[${type}]`;
        break;
    }

    if (element) {
      element.setAttribute('data-component-id', id);
      element.setAttribute('data-component-type', type);
    }

    return element;
  }

  // Get value from data model using path
  getDataModelValue(dataModel, path) {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const keys = cleanPath.split('/').filter(k => k);
    
    // Start with merged data model (surface-specific + default)
    let value = { ...this.defaultDataModel, ...dataModel };
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Try to access nested properties
        try {
          // Handle array access like "keyFiles[0].path"
          if (key.includes('[')) {
            const [arrayKey, index] = key.split('[');
            const arrayIndex = parseInt(index.replace(']', ''));
            if (value && value[arrayKey] && Array.isArray(value[arrayKey])) {
              value = value[arrayKey][arrayIndex];
              continue;
            }
          }
        } catch (e) {
          // Ignore
        }
        return null;
      }
    }
    return value;
  }
}

