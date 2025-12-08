// Dashboard Service - Integrates with A2UI for dynamic dashboard generation
//
// A2UI Setup Instructions:
// 1. Clone the A2UI repository: https://github.com/ecanbaykurt/A2UI_sundai_repo
// 2. Navigate to the editor directory: cd A2UI_sundai_repo/editor
// 3. Create a .env file with: GEMINI_API_KEY=your_gemini_key_here
// 4. Install dependencies: npm install
// 5. Run the dev server: npm run dev
// 6. The A2UI editor will be available at http://localhost:5173
//
// Note: The Gemini API key can be saved in extension settings and will be used
// when A2UI is deployed. For local development, configure it in A2UI's .env file.

class DashboardService {
  constructor() {
    // Configuration for A2UI integration
    // Using the forked A2UI repository from GitHub
    this.a2uiRepoUrl = 'https://github.com/ecanbaykurt/A2UI_sundai_repo';
    
    // A2UI Dashboard Generation
    // For Chrome Web Store: Opens A2UI GitHub repository for users to set up locally
    // Users can clone the repo and run it locally, or use a deployed instance
    // To use a deployed instance, update this URL to the deployed service
    this.a2uiBaseUrl = null; // Set to null to open GitHub repo instead
    this.a2uiDeployedUrl = null; // Set this if you have a deployed A2UI instance
    
    // For local development, users can set this via settings or run A2UI locally
    this.integrationMethod = 'url'; // 'url' or 'api' - default to URL-based
  }

  // Prepare repository data for A2UI
  prepareRepoData(analysis, owner, repo, metadata) {
    // Ensure we have valid analysis data
    const safeAnalysis = analysis || {};
    const safeMetadata = metadata || {};
    
    return {
      repository: {
        owner: owner,
        repo: repo,
        url: safeMetadata.url || `https://github.com/${owner}/${repo}`,
        name: `${owner}/${repo}`
      },
      analysis: {
        summary: safeAnalysis.summary || 'Repository analysis',
        keyFiles: safeAnalysis.keyFiles || [],
        architecture: safeAnalysis.pipeline || safeAnalysis.architecture || 'N/A',
        useCases: safeAnalysis.useCases || [],
        health: safeAnalysis.health || {},
        requirements: safeAnalysis.requirements || {},
        metadata: safeMetadata
      },
      metrics: {
        stars: safeMetadata.stars || 0,
        forks: safeMetadata.forks || 0,
        language: safeMetadata.language || 'Unknown',
        healthScore: safeAnalysis.health?.score || 0,
        healthStatus: safeAnalysis.health?.status || 'unknown'
      },
      // Include full analysis JSON for AI processing
      fullAnalysis: safeAnalysis
    };
  }

  // Generate A2UI dashboard URL with repository information
  createDashboardUrl(owner, repo, options = {}) {
    const repoUrl = `https://github.com/${owner}/${repo}`;
    
    // If no deployed URL, open the A2UI GitHub repository for setup instructions
    if (!this.a2uiBaseUrl && !this.a2uiDeployedUrl) {
      // Open A2UI repository with instructions in URL fragment
      const instructions = this.createA2UIInstructions(
        this.prepareRepoData({}, owner, repo, { url: repoUrl }), 
        options
      );
      const encodedInstructions = encodeURIComponent(instructions.substring(0, 500)); // Limit length
      return `${this.a2uiRepoUrl}#target-repo=${encodeURIComponent(repoUrl)}&instructions=${encodedInstructions}`;
    }
    
    // Use deployed URL if available
    const baseUrl = this.a2uiDeployedUrl || this.a2uiBaseUrl;
    
    // Build URL parameters
    const params = new URLSearchParams({
      repo: repoUrl,
      ...(options.customType && { type: options.customType }),
      ...(options.customDescription && { description: options.customDescription }),
      ...(options.instructions && { instructions: options.instructions })
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Generate dashboard using A2UI API (if API method is available)
  async generateDashboardWithAPI(repoData, options = {}) {
    try {
      const payload = {
        repository: repoData.repository,
        analysis: repoData.analysis,
        metrics: repoData.metrics,
        options: {
          customUI: options.customType || 'default',
          customDescription: options.customDescription || null
        }
      };

      // Only works if A2UI has an API endpoint
      if (!this.a2uiApiUrl) {
        throw new Error('A2UI API endpoint not configured');
      }

      const response = await fetch(this.a2uiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`A2UI API error: ${response.status}`);
      }

      const result = await response.json();
      return result.dashboardUrl || result.url;

    } catch (error) {
      console.error('Dashboard API generation error:', error);
      throw error;
    }
  }

  // Generate A2UI protocol JSON using Gemini or OpenAI API
  async generateA2UIProtocol(repoData, instructions, apiKey, useOpenAI = false) {
    if (!apiKey) {
      throw new Error('API key is required for dashboard generation');
    }

    // Basic A2UI component catalog (simplified version)
    const catalog = {
      components: {
        Text: {},
        Row: {},
        Column: {},
        Card: {},
        Button: {},
        Icon: {},
        Image: {},
        Spacer: {}
      }
    };

    // Prepare full repository analysis JSON (truncate if too long to avoid token limits)
    const fullAnalysis = repoData.fullAnalysis || repoData.analysis || {};
    let analysisJson = JSON.stringify(fullAnalysis, null, 2);
    
    // Limit analysis JSON size to avoid token limits (keep it under ~3000 chars)
    if (analysisJson.length > 3000) {
      // Keep only essential fields
      const essential = {
        summary: fullAnalysis.summary,
        health: fullAnalysis.health,
        keyFiles: fullAnalysis.keyFiles?.slice(0, 5) || [], // Limit to 5 key files
        pipeline: fullAnalysis.pipeline,
        useCases: fullAnalysis.useCases?.slice(0, 3) || [] // Limit to 3 use cases
      };
      analysisJson = JSON.stringify(essential, null, 2);
    }

    // Simplified, faster prompt
    const prompt = `Create a dashboard UI using A2UI Protocol. Return ONLY a JSON array.

Repository: ${repoData.repository.name}
Summary: ${repoData.analysis.summary || 'N/A'}
Stars: ${repoData.metrics.stars}, Forks: ${repoData.metrics.forks}
Health: ${repoData.metrics.healthScore}/100
Language: ${repoData.metrics.language}

Create a simple dashboard with:
1. Header (repository name as h1, summary as text)
2. Metrics row (4 cards: Stars, Forks, Health Score, Language)
3. Key Files list (first 5 files)
4. Architecture card

Use components: Column, Row, Card, Text
Return JSON array with surfaceUpdate, dataModelUpdate, and beginRendering messages.

Example:
[
  {"surfaceUpdate": {"surfaceId": "main", "components": [
    {"id": "root", "type": "Column", "children": ["header", "metrics"]},
    {"id": "header", "type": "Card", "children": ["title", "summary"]},
    {"id": "title", "type": "Text", "text": {"literalString": "${repoData.repository.name}"}, "usageHint": "h1"},
    {"id": "summary", "type": "Text", "text": {"literalString": "${(repoData.analysis.summary || '').substring(0, 200)}"}, "usageHint": "body"},
    {"id": "metrics", "type": "Row", "children": ["stars", "forks", "health", "lang"]},
    {"id": "stars", "type": "Card", "children": ["starsText"]},
    {"id": "starsText", "type": "Text", "text": {"literalString": "⭐ ${repoData.metrics.stars} Stars"}, "usageHint": "h3"}
  ]}},
  {"dataModelUpdate": {"surfaceId": "main", "data": {}}},
  {"beginRendering": {"surfaceId": "main", "root": "root"}}
]

Return ONLY the JSON array, no markdown.

Example structure:
[
  {
    "surfaceUpdate": {
      "surfaceId": "main",
      "components": [
        {"id": "root", "type": "Column", "children": ["header", "metrics", "content"]},
        {"id": "header", "type": "Card", "children": ["title", "summary"]},
        {"id": "title", "type": "Text", "text": {"path": "/repository/name"}, "usageHint": "h1"}
      ]
    }
  },
  {
    "dataModelUpdate": {
      "surfaceId": "main",
      "data": {
        "repository": {"name": "${repoData.repository.name}"}
      }
    }
  },
  {
    "beginRendering": {
      "surfaceId": "main",
      "root": "root"
    }
  }
]`;

    try {
      let content;
      
      if (useOpenAI) {
        // Use OpenAI
        console.log('Calling OpenAI API...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating A2UI protocol JSON. Return ONLY a valid JSON array, no markdown, no explanations. Keep it simple and fast.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.2,
            max_tokens: 2000, // Reduced for faster generation
            response_format: { type: "json_object" } // Force JSON mode if supported
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || response.statusText;
          console.error('OpenAI API error response:', errorData);
          throw new Error(`OpenAI API error (${response.status}): ${errorMsg}`);
        }

        const data = await response.json();
        
        // Check if response has valid content
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('Invalid OpenAI response:', data);
          throw new Error('Invalid response from OpenAI API. Please check your API key.');
        }
        
        content = data.choices[0].message.content;
        
        if (!content) {
          throw new Error('Empty response from OpenAI API');
        }
      } else {
        // Use Gemini
        // Use Gemini 1.5 Flash - try v1beta first, fallback to v1 if needed
        const geminiModel = 'gemini-1.5-flash';
        let apiVersion = 'v1beta';
        let apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${geminiModel}:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2000 // Reduced for faster generation
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || response.statusText;
          
          // If v1beta fails with 404, try v1
          if (response.status === 404 && apiVersion === 'v1beta' && errorMsg && typeof errorMsg === 'string' && errorMsg.includes('not found')) {
            console.warn('v1beta failed, trying v1...');
            apiVersion = 'v1';
            apiUrl = `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${apiKey}`;
            const retryResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: prompt
                  }]
                }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 2000
                }
              })
            });
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}));
              const retryErrorMsg = retryErrorData.error?.message || retryResponse.statusText;
              console.error('Gemini API error response (v1):', retryErrorData);
              throw new Error(`Gemini API error (${retryResponse.status}): ${retryErrorMsg}`);
            }
            
            // Use retry response
            const data = await retryResponse.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
              console.error('Invalid Gemini response:', data);
              throw new Error('Invalid response from Gemini API. Please check your API key.');
            }
            
            content = data.candidates[0].content.parts[0].text;
            if (!content) {
              throw new Error('Empty response from Gemini API');
            }
          } else {
            console.error('Gemini API error response:', errorData);
            throw new Error(`Gemini API error (${response.status}): ${errorMsg}`);
          }
        } else {
          // Original response was OK
          const data = await response.json();
          
          // Check if response has valid content
          if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Invalid Gemini response:', data);
            throw new Error('Invalid response from Gemini API. Please check your API key.');
          }
          
          content = data.candidates[0].content.parts[0].text;
          
          if (!content) {
            throw new Error('Empty response from Gemini API');
          }
        }

        const data = await response.json();
        
        // Check if response has valid content
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          console.error('Invalid Gemini response:', data);
          throw new Error('Invalid response from Gemini API. Please check your API key.');
        }
        
        content = data.candidates[0].content.parts[0].text;
        
        if (!content) {
          throw new Error('Empty response from Gemini API');
        }
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonContent = content.trim();
      
      // Remove markdown code blocks
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '');
      }
      
      // Try to extract JSON array from response
      // Sometimes AI wraps the response in explanatory text
      let jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      } else {
        // Try to find JSON object and wrap it
        jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // If it's an object, try to extract array from it or wrap it
          try {
            const obj = JSON.parse(jsonMatch[0]);
            if (Array.isArray(obj)) {
              jsonContent = jsonMatch[0];
            } else if (obj.messages || obj.protocol) {
              // Extract array from nested structure
              jsonContent = JSON.stringify(obj.messages || obj.protocol || [obj]);
            }
          } catch (e) {
            // Continue with original extraction
          }
        }
      }

      // Parse and validate A2UI protocol
      let a2uiMessages;
      try {
        a2uiMessages = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('JSON parse error. Content:', jsonContent.substring(0, 500));
        throw new Error(`Failed to parse A2UI protocol JSON: ${parseError.message}. Response preview: ${content.substring(0, 200)}...`);
      }
      
      // Ensure it's an array
      if (!Array.isArray(a2uiMessages)) {
        // If it's an object, try to wrap it in an array
        if (typeof a2uiMessages === 'object' && a2uiMessages !== null) {
          console.warn('Received object instead of array, wrapping...');
          a2uiMessages = [a2uiMessages];
        } else {
          throw new Error(`A2UI protocol must be an array of messages. Received: ${typeof a2uiMessages}`);
        }
      }

      // Validate it has at least one message
      if (a2uiMessages.length === 0) {
        throw new Error('A2UI protocol array is empty');
      }

      return a2uiMessages;
    } catch (error) {
      console.error('A2UI generation error:', error);
      
      // Safely get error message
      const errorMsg = error?.message || error?.toString() || 'Unknown error occurred';
      
      // Provide more context in error message (check safely)
      if (errorMsg && typeof errorMsg === 'string') {
        if (errorMsg.includes('parse') || errorMsg.includes('JSON')) {
          throw new Error(`Failed to parse AI response. This might be due to invalid API key or API error. ${errorMsg}`);
        }
        if (errorMsg.includes('Invalid response') || errorMsg.includes('Empty response')) {
          throw new Error(`API returned invalid response. Please check your API key is valid. ${errorMsg}`);
        }
      }
      throw error;
    }
  }

  // Generate a simple fallback dashboard without API
  generateFallbackDashboard(repoData) {
    return [
      {
        surfaceUpdate: {
          surfaceId: "main",
          components: [
            { id: "root", type: "Column", children: ["header", "metrics", "summary", "health"] },
            { id: "header", type: "Card", children: ["title", "repoUrl"] },
            { id: "title", type: "Text", text: { literalString: repoData.repository.name }, usageHint: "h1" },
            { id: "repoUrl", type: "Text", text: { literalString: repoData.repository.url }, usageHint: "caption" },
            { id: "metrics", type: "Row", children: ["starsCard", "forksCard", "healthCard", "langCard"] },
            { id: "starsCard", type: "Card", children: ["starsText"] },
            { id: "starsText", type: "Text", text: { literalString: `⭐ ${repoData.metrics.stars} Stars` }, usageHint: "h3" },
            { id: "forksCard", type: "Card", children: ["forksText"] },
            { id: "forksText", type: "Text", text: { literalString: `🍴 ${repoData.metrics.forks} Forks` }, usageHint: "h3" },
            { id: "healthCard", type: "Card", children: ["healthText"] },
            { id: "healthText", type: "Text", text: { literalString: `🏥 Health: ${repoData.metrics.healthScore}/100` }, usageHint: "h3" },
            { id: "langCard", type: "Card", children: ["langText"] },
            { id: "langText", type: "Text", text: { literalString: `💻 ${repoData.metrics.language}` }, usageHint: "h3" },
            { id: "summary", type: "Card", children: ["summaryTitle", "summaryText"] },
            { id: "summaryTitle", type: "Text", text: { literalString: "Summary" }, usageHint: "h2" },
            { id: "summaryText", type: "Text", text: { literalString: repoData.analysis.summary || "No summary available" }, usageHint: "body" },
            { id: "health", type: "Card", children: ["healthTitle", "healthStatus"] },
            { id: "healthTitle", type: "Text", text: { literalString: "Health Status" }, usageHint: "h2" },
            { id: "healthStatus", type: "Text", text: { literalString: repoData.analysis.health?.maintenance || "Unknown" }, usageHint: "body" }
          ]
        }
      },
      {
        dataModelUpdate: {
          surfaceId: "main",
          data: {}
        }
      },
      {
        beginRendering: {
          surfaceId: "main",
          root: "root"
        }
      }
    ];
  }

  // Main method: Create dashboard and return URL to open
  async createAndOpenDashboard(analysis, owner, repo, metadata, options = {}) {
    try {
      // Validate analysis data
      if (!analysis) {
        throw new Error('Repository analysis data is required. Please analyze the repository first.');
      }

      // Prepare repository data
      const repoData = this.prepareRepoData(analysis, owner, repo, metadata);
      const dashboardKey = `dashboard_${owner}_${repo}_${Date.now()}`;
      
      // Get API keys (try Gemini first, then OpenAI)
      const { geminiKey, openaiKey } = await apiService.getAPIKeys();
      
      console.log('API Keys status:', {
        hasGemini: !!geminiKey,
        hasOpenAI: !!openaiKey
      });
      
      let a2uiProtocol = null;
      let useFallback = true; // Will be false if A2UI protocol is successfully generated

      // Try A2UI generation with API if keys are available
      if (geminiKey || openaiKey) {
        const instructions = this.createA2UIInstructions(repoData, options);
        
        // Try Gemini first if available
        if (geminiKey) {
          try {
            console.log('Trying Gemini API for A2UI protocol (15s timeout)...');
            const geminiCall = this.generateA2UIProtocol(repoData, instructions, geminiKey, false);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Gemini API timeout (15s)')), 15000)
            );
            
            a2uiProtocol = await Promise.race([geminiCall, timeoutPromise]);
            useFallback = false; // Success!
            console.log('A2UI protocol generated successfully with Gemini');
          } catch (geminiError) {
            console.warn('Gemini failed:', geminiError.message);
            
            // Try OpenAI fallback if available
            if (openaiKey) {
              try {
                console.log('Trying OpenAI fallback for A2UI protocol (15s timeout)...');
                const openaiCall = this.generateA2UIProtocol(repoData, instructions, openaiKey, true);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('OpenAI API timeout (15s)')), 15000)
                );
                
                a2uiProtocol = await Promise.race([openaiCall, timeoutPromise]);
                useFallback = false; // Success!
                console.log('A2UI protocol generated successfully with OpenAI');
              } catch (openaiError) {
                console.warn('OpenAI also failed:', openaiError.message);
                useFallback = true;
                console.log('Will use simple renderer (fallback)');
              }
            } else {
              useFallback = true;
              console.log('No OpenAI key available, will use simple renderer');
            }
          }
        } else if (openaiKey) {
          // Only OpenAI available
          try {
            console.log('Trying OpenAI API for A2UI protocol (15s timeout)...');
            const openaiCall = this.generateA2UIProtocol(repoData, instructions, openaiKey, true);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('OpenAI API timeout (15s)')), 15000)
            );
            
            a2uiProtocol = await Promise.race([openaiCall, timeoutPromise]);
            useFallback = false; // Success!
            console.log('A2UI protocol generated successfully with OpenAI');
          } catch (openaiError) {
            console.warn('OpenAI failed:', openaiError.message);
            useFallback = true;
            console.log('Will use simple renderer (fallback)');
          }
        }
      } else {
        // No API keys - use simple renderer
        useFallback = true;
        console.log('No API keys available - will use simple renderer');
      }
      
      // If A2UI generation failed or no keys, useFallback stays true
      // The view switcher will handle rendering with simple renderer

      // Store A2UI protocol, analysis JSON, and repo data
      // Make sure analysis JSON is always included and accessible
      await new Promise((resolve) => {
        chrome.storage.local.set({ 
          [dashboardKey]: {
            protocol: a2uiProtocol,
            repoData: {
              ...repoData,
              analysis: analysis, // Also include in repoData for easier access
              fullAnalysis: analysis
            },
            analysisJson: analysis, // Full analysis JSON (primary location)
            analysis: analysis, // Alternative access path
            timestamp: Date.now(),
            useFallback: useFallback // Flag to use simple renderer
          }
        }, resolve);
      });
      
      console.log('Dashboard data stored:', {
        hasAnalysis: !!analysis,
        analysisKeys: analysis ? Object.keys(analysis) : [],
        hasRepoData: !!repoData,
        useFallback: useFallback
      });

      // Open dashboard viewer
      const dashboardUrl = chrome.runtime.getURL(`dashboard/dashboard.html?key=${dashboardKey}`);
      return dashboardUrl;

    } catch (error) {
      console.error('Failed to create dashboard:', error);
      throw error; // Re-throw to show error to user
    }
  }

  // Load A2UI configuration from settings (optional deployed URL)
  async loadConfiguration() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['a2uiDeployedUrl'], (result) => {
        if (result.a2uiDeployedUrl) {
          this.a2uiDeployedUrl = result.a2uiDeployedUrl;
        }
        resolve();
      });
    });
  }

  // Create instructions for A2UI based on repository analysis
  createA2UIInstructions(repoData, options = {}) {
    const { repository, analysis, metrics } = repoData;
    
    let instructions = `Create a dynamic dashboard for the GitHub repository: ${repository.name}\n\n`;
    instructions += `Repository URL: ${repository.url}\n\n`;
    
    if (options.customDescription) {
      instructions += `Custom Request: ${options.customDescription}\n\n`;
    } else if (options.customType === 'security') {
      instructions += `Focus: Create a security panel showing vulnerability analysis, dependency security status, and security best practices.\n\n`;
    } else if (options.customType === 'architecture') {
      instructions += this.createArchitectureA2UIInstructions(repoData);
      return instructions;
    } else {
      instructions += `Dashboard Requirements:\n`;
      instructions += `- Repository Summary: ${analysis.summary}\n`;
      instructions += `- Health Score: ${metrics.healthScore}/100 (Status: ${metrics.healthStatus})\n`;
      instructions += `- Stars: ${metrics.stars}, Forks: ${metrics.forks}\n`;
      instructions += `- Primary Language: ${metrics.language}\n`;
      instructions += `- Key Files: ${(analysis.keyFiles || []).map(f => f.path || f).join(', ')}\n`;
      instructions += `- Architecture: ${analysis.architecture || analysis.pipeline || 'N/A'}\n`;
      instructions += `\nCreate an interactive dashboard with visualizations for these metrics, repository structure, and health indicators.\n`;
    }
    
    return instructions;
  }

  // Create architecture-specific A2UI instructions
  createArchitectureA2UIInstructions(repoData) {
    const { repository, analysis, metrics } = repoData;
    
    // Include AI/ML detection info if available
    const aiMLInfo = analysis.aiMLDetection ? `
AI/ML Detection Results:
- Files Scanned: ${analysis.scannedFiles || 0}
- AI/ML Detected: ${analysis.aiMLDetection.hasAIML ? 'Yes' : 'No'}
- Frameworks: ${analysis.aiMLDetection.frameworks?.map(f => f.name).join(', ') || 'None'}
- Agentic Systems: ${analysis.aiMLDetection.agenticSystems?.map(a => a.name).join(', ') || 'None'}
- Models: ${analysis.aiMLDetection.models?.map(m => m.name).join(', ') || 'None'}
- Detection Confidence: ${analysis.aiMLDetection.confidence || 0}%

Priority-Based Scanning:
- Config Files: ${analysis.priorityBreakdown?.priority1 || 0}
- Model Files: ${analysis.priorityBreakdown?.priority2 || 0}
- Entry Points: ${analysis.priorityBreakdown?.priority3 || 0}
- Agentic Systems: ${analysis.priorityBreakdown?.priority4 || 0}
- Supporting Code: ${analysis.priorityBreakdown?.priority5 || 0}

${analysis.systemMessages?.systemMessages?.length > 0 ? `System Messages Found: ${analysis.systemMessages.systemMessages.length}` : ''}
${analysis.systemMessages?.prompts?.length > 0 ? `Prompts Found: ${analysis.systemMessages.prompts.length}` : ''}
` : '';
    
    let instructions = `Create an ARCHITECTURE visualization dashboard using A2UI Protocol. Return ONLY a JSON array.

Repository: ${repository.name || 'Unknown'}
Primary Language: ${metrics.language || 'Unknown'}
Dependencies: ${(analysis.requirements?.dependencies || []).length} packages
Key Files: ${(analysis.keyFiles || []).length} files
${aiMLInfo}
Architecture Requirements:
1. Tech Stack Section: Show primary language, dependencies count, and key technologies in cards
2. Folder Structure: Visual tree showing repository structure from key files (use hierarchical layout)
3. Dependency Graph: Visual representation of dependencies if available (use nodes and connections)
4. Component Architecture: Show component relationships and architecture flow from pipeline/architecture description
${analysis.aiMLDetection?.hasAIML ? '5. AI/ML Systems: Display detected AI/ML frameworks, models, and agentic systems' : ''}

Key Files to Display:
${(analysis.keyFiles || []).slice(0, 10).map(f => `- ${f.path || f}: ${f.purpose || f.importance || 'File'}`).join('\n')}

Architecture Description:
${analysis.pipeline || analysis.architecture || 'No architecture description available'}

Dependencies:
${(analysis.requirements?.dependencies || []).slice(0, 15).map(d => typeof d === 'string' ? d : JSON.stringify(d)).join('\n')}

Use A2UI components:
- Cards for sections and tech stack items
- Rows/Columns for layout organization
- Text components for labels, descriptions, and file names
- Visual hierarchy to show architecture layers
- Icons or badges for technology indicators

Create a clean, professional architecture dashboard with clear sections and visual organization.`;

    return instructions;
  }

  // Create pipeline-specific A2UI instructions
  createPipelineA2UIInstructions(repoData) {
    const { repository, analysis, metrics } = repoData;
    
    // Include AI/ML workflow info if available
    const aiMLWorkflowInfo = analysis.aiMLDetection?.hasAIML ? `
AI/ML Workflow Detected:
- Frameworks: ${analysis.aiMLDetection.frameworks?.map(f => f.name).join(', ') || 'None'}
- Agentic Systems: ${analysis.aiMLDetection.agenticSystems?.map(a => a.name).join(', ') || 'None'}
- Workflow Stages: ${analysis.workflow?.stages?.map(s => s.name).join(' → ') || 'Auto-detected from code'}
- Files Scanned with Priority: ${analysis.scannedFiles || 0}
- System Messages: ${analysis.systemMessages?.systemMessages?.length || 0}
- Prompts: ${analysis.systemMessages?.prompts?.length || 0}
` : '';
    
    let instructions = `Create a PIPELINE visualization dashboard using A2UI Protocol. Return ONLY a JSON array.

Repository: ${repository.name || 'Unknown'}
Primary Language: ${metrics.language || 'Unknown'}
${aiMLWorkflowInfo}
Pipeline Requirements:
1. Architecture Pipeline Flow: Show the workflow stages and steps from the pipeline description
2. Build & Deploy Process: Visualize the build, test, and deployment stages
3. Data Flow Diagram: Show how data flows through the system (input → process → storage → output)
4. CI/CD Detection: Display CI/CD configuration status and files
${analysis.aiMLDetection?.hasAIML ? '5. ML Workflow Stages: Display detected ML pipeline stages (Training, Inference, etc.)' : ''}

Pipeline Description:
${analysis.pipeline || analysis.architecture || 'No pipeline description available'}

Key Files:
${(analysis.keyFiles || []).slice(0, 10).map(f => `- ${f.path || f}`).join('\n')}

Installation Steps:
${analysis.requirements?.installation || 'Not specified'}

Dependencies:
${(analysis.requirements?.dependencies || []).slice(0, 10).map(d => typeof d === 'string' ? d : JSON.stringify(d)).join('\n')}

Use A2UI components:
- Cards for each pipeline section
- Rows/Columns for organizing stages horizontally/vertically
- Text components for stage names, descriptions, and labels
- Visual flow indicators (arrows, connectors) between stages
- Icons or badges for different stages (Source, Build, Test, Deploy)
- Status indicators for CI/CD configuration

Create a clear, sequential pipeline visualization showing the complete workflow from code to deployment.`;

    return instructions;
  }
}

// Export singleton instance
const dashboardService = new DashboardService();

