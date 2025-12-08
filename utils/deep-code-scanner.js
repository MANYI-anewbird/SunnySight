// Deep Code Scanner - Reads actual file contents to detect AI/ML and agentic systems
// Priority-based scanning for better detection of agentic systems, models, and configurations

class DeepCodeScanner {
  constructor(apiService) {
    this.apiService = apiService;
    this.scannedFiles = new Set();
    this.scannedContents = [];
    this.priorityQueue = {
      priority1: [], // Config files (highest priority)
      priority2: [], // Model files
      priority3: [], // Main entry points
      priority4: [], // Agentic systems
      priority5: []  // Supporting code
    };
    this.maxFileSize = 100000; // Max 100KB per file
    this.maxFilesToScan = 50; // Limit to prevent timeout
    this.maxDepth = 4; // Increased depth for better scanning
  }

  // Priority patterns for file classification
  getPriorityPatterns() {
    return {
      // PRIORITY 1: Configuration & Setup Files (Highest Priority - Always read)
      priority1: [
        /replicate\.ya?ml$/i,      // Replicate config
        /cog\.ya?ml$/i,             // Replicate model config
        /config\.(ya?ml|json|toml|ini)$/i,
        /\.env$/i,
        /\.env\.example$/i,
        /requirements\.txt$/i,
        /pyproject\.toml$/i,
        /poetry\.lock$/i,
        /docker-compose\.ya?ml$/i,
        /Dockerfile$/i,
        /setup\.(py|cfg)$/i,
        /environment\.ya?ml$/i,
        /conda\.ya?ml$/i,
        /Pipfile$/i,
        /Gemfile$/i,
        /package\.json$/i,
        /package-lock\.json$/i,
        /yarn\.lock$/i,
        /tsconfig\.json$/i,
        /\.prettierrc/i,
        /\.eslintrc/i
      ],
      
      // PRIORITY 2: Model Definitions & Weights (High Priority)
      priority2: [
        /model(s)?\.py$/i,
        /inference\.py$/i,
        /predict\.py$/i,
        /\.(pth|h5|ckpt|safetensors|pt|pkl|onnx|pb)$/i,
        /weights?/i,
        /checkpoint/i,
        /pretrained/i,
        /model.*card/i,
        /model.*config/i
      ],
      
      // PRIORITY 3: Main Entry Points & API (High Priority)
      priority3: [
        /main\.py$/i,
        /app\.py$/i,
        /server\.py$/i,
        /api\.py$/i,
        /routes?\.py$/i,
        /run\.py$/i,
        /__main__\.py$/i,
        /index\.(js|ts|jsx|tsx)$/i,
        /app\.(js|ts|jsx|tsx)$/i,
        /server\.(js|ts)$/i,
        /entrypoint/i
      ],
      
      // PRIORITY 4: Agentic AI System Core (Medium Priority)
      priority4: [
        /agent(s)?\.py$/i,
        /chain(s)?\.py$/i,
        /tool(s)?\.py$/i,
        /prompt(s)?/i,
        /memory\.py$/i,
        /planning\.py$/i,
        /reflection\.py$/i,
        /system.*message/i,
        /messages?\.(txt|ya?ml|json)$/i,
        /prompt.*template/i,
        /instruction/i,
        /llm\.py$/i,
        /chat.*agent/i,
        /react.*agent/i,
        /predict\.py$/i,        // Replicate inference
        /inference\.py$/i,      // Replicate inference
        /replicate\.py$/i       // Replicate API
      ],
      
      // PRIORITY 5: Supporting Code (Lower Priority)
      priority5: [
        /utils?/i,
        /helpers?/i,
        /lib/i,
        /common/i,
        /shared/i
      ]
    };
  }

  // Get file priority
  getFilePriority(fileName, filePath) {
    const patterns = this.getPriorityPatterns();
    
    for (const priority in patterns) {
      if (patterns[priority].some(pattern => pattern.test(fileName) || pattern.test(filePath))) {
        return priority;
      }
    }
    
    // Default to priority5 for code files
    return 'priority5';
  }

  // Recursively scan repository for code files with priority
  async scanRepository(owner, repo, githubToken = null, progressCallback = null) {
    this.scannedFiles.clear();
    this.scannedContents = [];
    // Reset priority queues
    for (const priority in this.priorityQueue) {
      this.priorityQueue[priority] = [];
    }
    
    try {
      // Phase 1: Collect all files and classify by priority
      if (progressCallback) progressCallback('📁 Scanning repository structure and classifying files...');
      await this.collectAndClassifyFiles(owner, repo, '', githubToken, 0, progressCallback);
      
      // Phase 2: Read files in priority order
      if (progressCallback) progressCallback('🔍 Reading Priority 1 files (Configurations)...');
      await this.readPriorityFiles('priority1', owner, repo, githubToken, progressCallback, Infinity);
      
      if (progressCallback) progressCallback('🧠 Reading Priority 2 files (Models)...');
      await this.readPriorityFiles('priority2', owner, repo, githubToken, progressCallback, 20);
      
      if (progressCallback) progressCallback('🚀 Reading Priority 3 files (Main Entry Points)...');
      await this.readPriorityFiles('priority3', owner, repo, githubToken, progressCallback, 10);
      
      if (progressCallback) progressCallback('🤖 Reading Priority 4 files (Agentic Systems)...');
      await this.readPriorityFiles('priority4', owner, repo, githubToken, progressCallback, 15);
      
      // Phase 3: Read remaining files if slots available
      const remainingSlots = this.maxFilesToScan - this.scannedFiles.size;
      if (remainingSlots > 0 && progressCallback) {
        progressCallback(`📝 Reading Priority 5 files (Supporting Code)...`);
      }
      await this.readPriorityFiles('priority5', owner, repo, githubToken, progressCallback, remainingSlots);
      
      // Phase 4: Analyze collected contents
      if (progressCallback) progressCallback('🔬 Analyzing AI/ML patterns...');
      const aiMLDetection = this.analyzeForAIML(this.scannedContents);
      
      // Phase 5: Extract system messages and prompts
      const systemMessages = this.extractSystemMessages(this.scannedContents);
      
      return {
        filesScanned: this.scannedFiles.size,
        contents: this.scannedContents,
        aiMLDetection: aiMLDetection,
        systemMessages: systemMessages,
        priorityBreakdown: {
          priority1: this.priorityQueue.priority1.length,
          priority2: this.priorityQueue.priority2.length,
          priority3: this.priorityQueue.priority3.length,
          priority4: this.priorityQueue.priority4.length,
          priority5: this.priorityQueue.priority5.length
        }
      };
    } catch (error) {
      console.error('Deep scan error:', error);
      return {
        filesScanned: this.scannedFiles.size,
        contents: this.scannedContents,
        aiMLDetection: null,
        systemMessages: [],
        error: error.message
      };
    }
  }

  // Collect files and classify by priority (don't read yet)
  async collectAndClassifyFiles(owner, repo, path, githubToken, depth, progressCallback) {
    if (depth > this.maxDepth) return;
    
    try {
      const contents = await this.apiService.getRepoContents(owner, repo, path, githubToken);
      if (!Array.isArray(contents)) return;

      const codeExtensions = ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php', '.r', '.jl', '.swift', '.kt', '.scala'];
      const aiMLFilePatterns = [
        /model/i, /agent/i, /llm/i, /gpt/i, /claude/i, /langchain/i, /autogpt/i,
        /tensorflow/i, /pytorch/i, /keras/i, /sklearn/i, /transformers/i
      ];

      for (const item of contents) {
        if (item.type === 'file') {
          const fileName = item.name.toLowerCase();
          const filePath = item.path || item.name;
          
          const isCodeFile = codeExtensions.some(ext => fileName.endsWith(ext));
          const matchesAIPattern = aiMLFilePatterns.some(pattern => pattern.test(fileName) || pattern.test(filePath));
          const isConfigFile = fileName.match(/\.(ya?ml|json|toml|ini|env|txt|lock|cfg)$/i);
          const isTextFile = fileName.match(/\.(txt|md|rst)$/i);
          
          if (isCodeFile || matchesAIPattern || isConfigFile || isTextFile) {
            const priority = this.getFilePriority(fileName, filePath);
            this.priorityQueue[priority].push({
              path: filePath,
              name: fileName,
              type: item.type
            });
          }
        } else if (item.type === 'dir' && depth < this.maxDepth) {
          const dirName = item.name.toLowerCase();
          const skipDirs = ['node_modules', '.git', 'dist', 'build', 'target', '__pycache__', 
                           '.venv', 'venv', 'env', '.env', 'vendor', 'bin', 'obj', '.idea', 
                           '.vscode', '.next', '.nuxt', 'coverage', '.pytest_cache'];
          
          if (!skipDirs.includes(dirName)) {
            await this.collectAndClassifyFiles(owner, repo, item.path, githubToken, depth + 1, progressCallback);
          }
        }
      }
    } catch (error) {
      console.warn(`Error collecting files from ${path}:`, error.message);
    }
  }

  // Read files from a priority queue
  async readPriorityFiles(priority, owner, repo, githubToken, progressCallback, maxFiles) {
    const files = this.priorityQueue[priority] || [];
    const filesToRead = files.slice(0, maxFiles);
    
    for (const fileInfo of filesToRead) {
      if (this.scannedFiles.size >= this.maxFilesToScan) break;
      
      if (progressCallback && this.scannedFiles.size % 3 === 0) {
        progressCallback(`📖 Reading ${priority} files... (${this.scannedFiles.size}/${this.maxFilesToScan})`);
      }
      
      await this.readAndAnalyzeFile(owner, repo, fileInfo.path, githubToken, progressCallback);
    }
  }

  // Recursively scan directory
  async scanDirectory(owner, repo, path, githubToken, depth, progressCallback) {
    // Prevent too deep recursion
    if (depth > this.maxDepth) {
      return;
    }

    // Prevent scanning too many files
    if (this.scannedFiles.size >= this.maxFilesToScan) {
      return;
    }

    try {
      const contents = await this.apiService.getRepoContents(owner, repo, path, githubToken);
      
      if (!Array.isArray(contents)) {
        return;
      }

      // Filter for code files and directories
      const codeExtensions = ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php'];
      const aiMLFilePatterns = [
        /model/i, /agent/i, /llm/i, /gpt/i, /claude/i, /langchain/i, /autogpt/i,
        /tensorflow/i, /pytorch/i, /keras/i, /sklearn/i, /transformers/i
      ];

      // Process each item
      for (const item of contents) {
        if (this.scannedFiles.size >= this.maxFilesToScan) break;

        if (item.type === 'file') {
          const fileName = item.name.toLowerCase();
          const filePath = item.path || item.name;
          
          // Check if it's a code file or AI/ML related
          const isCodeFile = codeExtensions.some(ext => fileName.endsWith(ext));
          const matchesAIPattern = aiMLFilePatterns.some(pattern => pattern.test(fileName) || pattern.test(filePath));
          
          // Also check for config files that might contain AI/ML info
          const isConfigFile = fileName.includes('requirements') || 
                              fileName.includes('package.json') || 
                              fileName.includes('setup.py') ||
                              fileName.includes('pyproject.toml') ||
                              fileName.includes('environment.yml') ||
                              fileName.includes('conda.yml');

          if (isCodeFile || matchesAIPattern || isConfigFile) {
            // Read file content
            await this.readAndAnalyzeFile(owner, repo, filePath, githubToken, progressCallback);
          }
        } else if (item.type === 'dir' && depth < this.maxDepth) {
          // Skip common non-code directories
          const dirName = item.name.toLowerCase();
          const skipDirs = ['node_modules', '.git', 'dist', 'build', 'target', '__pycache__', 
                           '.venv', 'venv', 'env', '.env', 'vendor', 'bin', 'obj'];
          
          if (!skipDirs.includes(dirName)) {
            await this.scanDirectory(owner, repo, item.path, githubToken, depth + 1, progressCallback);
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${path}:`, error.message);
    }
  }

  // Read and analyze individual file
  async readAndAnalyzeFile(owner, repo, filePath, githubToken, progressCallback) {
    if (this.scannedFiles.has(filePath)) {
      return; // Already scanned
    }

    if (this.scannedFiles.size >= this.maxFilesToScan) {
      return;
    }

    try {
      this.scannedFiles.add(filePath);
      
      if (progressCallback && this.scannedFiles.size % 5 === 0) {
        progressCallback(`Scanning code files... (${this.scannedFiles.size} files)`);
      }

      const content = await this.apiService.getFileContent(owner, repo, filePath, githubToken);
      
      if (!content || content.length > this.maxFileSize) {
        // File too large or empty, skip
        return;
      }

      // Store file content with metadata
      this.scannedContents.push({
        path: filePath,
        name: filePath.split('/').pop(),
        content: content.substring(0, 50000), // Limit content size for analysis
        size: content.length,
        extension: filePath.split('.').pop()?.toLowerCase() || ''
      });

    } catch (error) {
      console.warn(`Error reading file ${filePath}:`, error.message);
    }
  }

  // Analyze scanned contents for AI/ML patterns
  analyzeForAIML(contents) {
    const detection = {
      hasAIML: false,
      frameworks: [],
      models: [],
      agenticSystems: [],
      patterns: [],
      confidence: 0
    };

    // AI/ML Framework patterns
    const frameworkPatterns = [
      { name: 'TensorFlow', pattern: /import tensorflow|from tensorflow|tf\./gi, icon: '🧠', files: [] },
      { name: 'PyTorch', pattern: /import torch|from torch|import pytorch/gi, icon: '🔥', files: [] },
      { name: 'Keras', pattern: /from keras|import keras|keras\./gi, icon: '🎯', files: [] },
      { name: 'Scikit-learn', pattern: /from sklearn|import sklearn|sklearn\./gi, icon: '📊', files: [] },
      { name: 'Hugging Face Transformers', pattern: /from transformers|import transformers|AutoModel|AutoTokenizer/gi, icon: '🤗', files: [] },
      { name: 'LangChain', pattern: /from langchain|import langchain|LangChain|Chain\(/gi, icon: '🔗', files: [] },
      { name: 'OpenAI', pattern: /openai|OpenAI\(|gpt-|text-davinci|text-embedding/gi, icon: '🧠', files: [] },
      { name: 'Anthropic Claude', pattern: /anthropic|claude|Anthropic\(/gi, icon: '🤖', files: [] },
      { name: 'AutoGPT', pattern: /autogpt|auto-gpt|AutoGPT/gi, icon: '🤖', files: [] },
      { name: 'ReAct Agent', pattern: /react.*agent|agent.*react|ReActAgent/gi, icon: '🔄', files: [] },
      { name: 'BabyAGI', pattern: /babyagi|BabyAGI/gi, icon: '👶', files: [] },
      { name: 'Replicate', pattern: /replicate|Replicate\(|from replicate|import replicate/gi, icon: '🔄', files: [] },
      { name: 'Cog (Replicate)', pattern: /cog\.ya?ml|@cog|from cog/gi, icon: '⚙️', files: [] }
    ];

    // Agentic system patterns
    const agenticPatterns = [
      { name: 'Agent Class', pattern: /class.*Agent|def.*agent|Agent\(/gi, type: 'Agent Implementation', files: [] },
      { name: 'LLM Chain', pattern: /LLMChain|Chain\(|llm_chain/gi, type: 'LLM Framework', files: [] },
      { name: 'Tool/Function Calling', pattern: /@tool|def.*tool|function_calling|tool_use/gi, type: 'Tool Integration', files: [] },
      { name: 'Memory System', pattern: /memory|Memory\(|ConversationBufferMemory/gi, type: 'Memory', files: [] },
      { name: 'Vector Store', pattern: /VectorStore|FAISS|Pinecone|Chroma|vector.*store/gi, type: 'RAG System', files: [] },
      { name: 'Planning', pattern: /plan\(|planning|Plan\(/gi, type: 'Planning System', files: [] },
      { name: 'Reflection', pattern: /reflect|reflection|critique/gi, type: 'Reflection', files: [] }
    ];

    // Model file patterns
    const modelPatterns = [
      { name: 'Model Loading', pattern: /\.load\(|load_model|torch\.load|tf\.keras\.models\.load/gi, files: [] },
      { name: 'Model Training', pattern: /\.fit\(|\.train\(|trainer\.train/gi, files: [] },
      { name: 'Model Inference', pattern: /\.predict\(|\.forward\(|model\(/gi, files: [] },
      { name: 'Checkpoint', pattern: /checkpoint|\.ckpt|\.pth|\.h5|\.pkl/gi, files: [] }
    ];

    // Scan all file contents
    contents.forEach(file => {
      const content = file.content || '';
      const path = file.path || '';

      // Check framework patterns
      frameworkPatterns.forEach(fw => {
        if (fw.pattern.test(content) || fw.pattern.test(path)) {
          if (!detection.frameworks.find(f => f.name === fw.name)) {
            detection.frameworks.push({
              name: fw.name,
              icon: fw.icon,
              files: []
            });
            detection.hasAIML = true;
            detection.confidence += 20;
          }
          const framework = detection.frameworks.find(f => f.name === fw.name);
          if (framework && !framework.files.includes(path)) {
            framework.files.push(path);
          }
        }
      });

      // Check agentic patterns
      agenticPatterns.forEach(agent => {
        if (agent.pattern.test(content)) {
          if (!detection.agenticSystems.find(a => a.name === agent.name)) {
            detection.agenticSystems.push({
              name: agent.name,
              type: agent.type,
              icon: '🤖',
              files: []
            });
            detection.hasAIML = true;
            detection.confidence += 15;
          }
          const system = detection.agenticSystems.find(a => a.name === agent.name);
          if (system && !system.files.includes(path)) {
            system.files.push(path);
          }
        }
      });

      // Check model patterns
      modelPatterns.forEach(model => {
        if (model.pattern.test(content) || model.pattern.test(path)) {
          if (!detection.models.find(m => m.name === model.name)) {
            detection.models.push({
              name: model.name,
              icon: '💾',
              files: []
            });
            detection.hasAIML = true;
            detection.confidence += 10;
          }
          const modelObj = detection.models.find(m => m.name === model.name);
          if (modelObj && !modelObj.files.includes(path)) {
            modelObj.files.push(path);
          }
        }
      });
    });

    // Check dependencies files
    contents.filter(f => f.name.includes('requirements') || 
                        f.name === 'package.json' || 
                        f.name.includes('pyproject.toml')).forEach(file => {
      const content = file.content || '';
      
      // Check for AI/ML dependencies
      const depPatterns = [
        { name: 'TensorFlow', pattern: /tensorflow/i },
        { name: 'PyTorch', pattern: /torch|pytorch/i },
        { name: 'Hugging Face', pattern: /transformers|huggingface/i },
        { name: 'LangChain', pattern: /langchain/i },
        { name: 'OpenAI', pattern: /openai/i },
        { name: 'Anthropic', pattern: /anthropic/i }
      ];

      depPatterns.forEach(dep => {
        if (dep.pattern.test(content)) {
          if (!detection.frameworks.find(f => f.name === dep.name)) {
            detection.frameworks.push({
              name: dep.name,
              icon: '📦',
              files: [file.path]
            });
            detection.hasAIML = true;
            detection.confidence += 15;
          }
        }
      });
    });

    detection.confidence = Math.min(100, detection.confidence);

    return detection;
  }

  // Extract AI/ML workflow from code
  extractWorkflow(contents) {
    const workflow = {
      stages: [],
      dataFlow: []
    };

    const workflowKeywords = {
      'Data Loading': ['load_data', 'read_csv', 'read_json', 'DataLoader', 'dataset'],
      'Preprocessing': ['preprocess', 'normalize', 'transform', 'tokenize', 'encode'],
      'Training': ['fit', 'train', 'trainer', 'training_loop', 'epoch'],
      'Validation': ['validate', 'evaluate', 'validation_loss', 'metrics'],
      'Inference': ['predict', 'forward', 'generate', 'inference', 'forward_pass'],
      'Deployment': ['deploy', 'serve', 'api', 'endpoint', 'flask', 'fastapi']
    };

    contents.forEach(file => {
      const content = file.content || '';
      Object.keys(workflowKeywords).forEach(stage => {
        const keywords = workflowKeywords[stage];
        if (keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
          if (!workflow.stages.find(s => s.name === stage)) {
            workflow.stages.push({
              name: stage,
              files: [file.path]
            });
          } else {
            const existing = workflow.stages.find(s => s.name === stage);
            if (!existing.files.includes(file.path)) {
              existing.files.push(file.path);
            }
          }
        }
      });
    });

    return workflow;
  }

  // Extract system messages and prompts from scanned files
  extractSystemMessages(contents) {
    const messages = {
      systemMessages: [],
      prompts: [],
      templates: []
    };

    // Look for system messages in various formats
    contents.forEach(file => {
      const content = file.content || '';
      const path = file.path || '';

      // Check if file is explicitly a prompt/message file
      if (path.match(/system.*message|prompt|instruction/i) || 
          path.match(/\.(prompt|msg|template)$/i)) {
        
        // Extract system message patterns
        const systemMsgPatterns = [
          /system.*message["']?\s*[:=]\s*["']([^"']{50,})["']/gis,
          /system_message\s*=\s*["']([^"']{50,})["']/gis,
          /"system":\s*"([^"]{50,})"/gis,
          /'system':\s*'([^']{50,})'/gis,
          /SYSTEM[:\s]+(.{50,}?)(?=\n\n|\n[A-Z]|$)/gis
        ];

        systemMsgPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const msg = match[1].trim();
            if (msg.length > 50 && !messages.systemMessages.find(m => m.text === msg)) {
              messages.systemMessages.push({
                text: msg.substring(0, 500), // Limit length
                file: path,
                source: 'pattern_match'
              });
            }
          }
        });

        // If whole file looks like a system message/prompt
        if (content.length > 50 && content.length < 5000 && 
            !content.includes('def ') && !content.includes('function') &&
            !content.includes('class ') && !content.includes('import ')) {
          
          if (!messages.prompts.find(p => p.file === path)) {
            messages.prompts.push({
              text: content.substring(0, 1000),
              file: path,
              type: 'full_file'
            });
          }
        }
      }

      // Look for prompt templates in code
      const promptTemplatePatterns = [
        /prompt\s*=\s*["']([^"']{20,})["']/gis,
        /PROMPT\s*=\s*["']([^"']{20,})["']/gis,
        /template\s*=\s*["']([^"']{20,})["']/gis
      ];

      promptTemplatePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const prompt = match[1].trim();
          if (prompt.length > 20 && !messages.templates.find(t => t.text === prompt)) {
            messages.templates.push({
              text: prompt.substring(0, 300),
              file: path,
              line: content.substring(0, match.index).split('\n').length
            });
          }
        }
      });
    });

    return messages;
  }
}

// Export for browser environment
if (typeof window !== 'undefined') {
  window.DeepCodeScanner = DeepCodeScanner;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeepCodeScanner;
}

