// API Service Layer - Handles GitHub and OpenAI API calls

class APIService {
  constructor() {
    this.githubBaseURL = 'https://api.github.com';
    this.openaiBaseURL = 'https://api.openai.com/v1';
  }

  // Get API keys from storage
  async getAPIKeys() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['githubToken', 'openaiKey', 'geminiKey'], (result) => {
        resolve({
          githubToken: result.githubToken || null,
          openaiKey: result.openaiKey || null,
          geminiKey: result.geminiKey || null
        });
      });
    });
  }

  // Retry helper with exponential backoff
  async retryWithBackoff(fn, maxRetries = 3, onRetry = null) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors like auth, not found)
        if (error.message && error.message.includes('error: 4')) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, maxRetries, delay);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  // GitHub API: Get repository information
  async getRepoInfo(owner, repo, githubToken = null, onRetry = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        let errorMsg = `GitHub API error: ${response.status}`;
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0' || !githubToken) {
            errorMsg = `GitHub API rate limit exceeded. Please add a GitHub Personal Access Token in settings for higher rate limits (5000/hour vs 60/hour).`;
          } else {
            errorMsg = `GitHub API error: 403 Forbidden. The repository may be private or access is restricted.`;
          }
        } else if (response.status === 404) {
          errorMsg = `GitHub API error: 404 Not Found. The repository may not exist or is private.`;
        }
        throw new Error(errorMsg);
      }
      return await response.json();
    }, 3, onRetry);
  }

  // GitHub API: Get repository languages
  async getRepoLanguages(owner, repo, githubToken = null, onRetry = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}/languages`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }
        return await response.json();
      }, 3, onRetry);
    } catch (error) {
      console.error('Error fetching languages:', error);
      return {};
    }
  }

  // GitHub API: Get repository contents (file structure)
  async getRepoContents(owner, repo, path = '', githubToken = null, onRetry = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }
        return await response.json();
      }, 3, onRetry);
    } catch (error) {
      console.error('Error fetching contents:', error);
      return [];
    }
  }

  // GitHub API: Get README content
  async getReadme(owner, repo, githubToken = null, onRetry = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}/readme`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          return null;
        }
        const data = await response.json();
        return atob(data.content); // Decode base64
      }, 3, onRetry);
    } catch (error) {
      console.error('Error fetching README:', error);
      return null;
    }
  }

  // GitHub API: Get repository commits (for activity analysis)
  async getCommits(owner, repo, githubToken = null, perPage = 10, onRetry = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}/commits?per_page=${perPage}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }
        return await response.json();
      }, 3, onRetry);
    } catch (error) {
      console.error('Error fetching commits:', error);
      return [];
    }
  }

  // GitHub API: Get repository issues
  async getIssues(owner, repo, githubToken = null, state = 'open', perPage = 10, onRetry = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }
        return await response.json();
      }, 3, onRetry);
    } catch (error) {
      console.error('Error fetching issues:', error);
      return [];
    }
  }

  // GitHub API: Get repository contributors
  async getContributors(owner, repo, githubToken = null, onRetry = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}/contributors?per_page=10`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }
        return await response.json();
      }, 3, onRetry);
    } catch (error) {
      console.error('Error fetching contributors:', error);
      return [];
    }
  }

  // GitHub API: Get file content
  async getFileContent(owner, repo, path, githubToken = null) {
    const url = `${this.githubBaseURL}/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SunnySight-Extension'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (data.content) {
        return atob(data.content.replace(/\s/g, ''));
      }
      return null;
    } catch (error) {
      console.error('Error fetching file content:', error);
      return null;
    }
  }

  // Check if a file is a technical file (not documentation, images, tests, etc.)
  isTechnicalFile(path, filename = null) {
    if (!path) return false;
    
    const pathLower = path.toLowerCase();
    const file = filename || path.split('/').pop() || '';
    const filenameLower = file.toLowerCase();
    
    // Blacklist: Non-technical file patterns
    const blacklistPatterns = [
      'readme', 'license', 'changelog', 'contributing', 'authors', 'credits',
      '.md', '.txt', '.rst', '.pdf',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
      '.mp4', '.mp3', '.avi', '.mov',
      '.zip', '.tar', '.gz', '.rar'
    ];
    
    // Check filename against blacklist
    for (const pattern of blacklistPatterns) {
      if (filenameLower.includes(pattern) || filenameLower.endsWith(pattern)) {
        return false;
      }
    }
    
    // Blacklist: Non-technical directories in path
    const nonTechDirs = [
      'docs/', 'documentation/', 'doc/',
      'test/', 'tests/', '__tests__/', 'spec/', 'specs/',
      'samples/', 'examples/', 'demo/', 'demos/',
      'static/', 'public/', 'assets/', 'images/', 'img/', 'pictures/',
      '.git/', '.github/', '.idea/', '.vscode/', '.vs/',
      'node_modules/', 'vendor/', 'dist/', 'build/', 'out/',
      'coverage/', '.nyc_output/', 'tmp/', 'temp/'
    ];
    
    for (const dir of nonTechDirs) {
      if (pathLower.includes(dir)) {
        return false;
      }
    }
    
    // Whitelist: Technical file extensions
    const techExtensions = [
      // Code files
      '.py', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
      '.java', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala',
      '.cpp', '.c', '.cc', '.cxx', '.h', '.hpp', '.hxx',
      '.clj', '.cljs', '.r', '.m', '.mm', '.pl', '.pm',
      '.sh', '.bash', '.zsh', '.fish', '.ps1',
      '.sql', '.rql', '.graphql',
      '.vue', '.svelte',
      // Infra files
      'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      'makefile', 'cmakelists.txt',
      // Config files (technical only)
      'manifest.json', 'package.json', 'requirements.txt', 'pyproject.toml',
      'pom.xml', 'build.gradle', 'cargo.toml', 'go.mod', 'composer.json',
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'tsconfig.json', 'webpack.config.js', 'vite.config.js',
      'config.yml', 'config.yaml', '.env.example'
    ];
    
    // Check if file has technical extension
    for (const ext of techExtensions) {
      if (filenameLower.endsWith(ext) || filenameLower === ext) {
        return true;
      }
    }
    
    // Special technical file names (case-insensitive)
    const techFileNames = [
      'dockerfile', 'makefile', 'cmakelists.txt',
      'main.py', 'app.py', 'server.py', 'index.js', 'main.js', 'app.js',
      'server.js', 'index.ts', 'main.ts', 'app.ts',
      'model.py', 'trainer.py', 'pipeline.py', 'rag.py', 'retriever.py',
      'background.js', 'service_worker.js', 'content.js', 'content_script.js'
    ];
    
    for (const techName of techFileNames) {
      if (filenameLower === techName || filenameLower.includes(techName)) {
        return true;
      }
    }
    
    return false;
  }

  // Score a technical file based on its importance
  scoreTechnicalFile(path, filename, content = '') {
    const filenameLower = filename.toLowerCase();
    const pathLower = path.toLowerCase();
    const contentLower = content.toLowerCase();
    let score = 0;
    
    // 1. Entrypoint files (highest priority)
    const entrypoints = ['main.py', 'app.py', 'server.py', 'index.js', 'main.js', 'app.js', 'server.js', 'index.ts', 'main.ts', 'app.ts'];
    if (entrypoints.some(ep => filenameLower === ep || filenameLower.includes(ep))) {
      score += 10;
    }
    
    // 2. ML/RAG/Pipeline core files
    const mlCoreFiles = ['model.py', 'trainer.py', 'pipeline.py', 'rag.py', 'retriever.py', 'vectorstore.py', 'dataset.py'];
    if (mlCoreFiles.some(ml => filenameLower.includes(ml))) {
      score += 8;
    }
    
    // 3. Extension core files
    const extensionCore = ['manifest.json', 'background.js', 'service_worker.js', 'content.js', 'content_script.js', 'popup.js'];
    if (extensionCore.some(ext => filenameLower === ext || filenameLower.includes(ext))) {
      score += 8;
    }
    
    // 4. Infrastructure files
    const infraFiles = ['dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'makefile'];
    if (infraFiles.some(inf => filenameLower === inf || filenameLower.includes(inf))) {
      score += 6;
    }
    
    // 5. High-value config files
    const techConfigs = ['pyproject.toml', 'requirements.txt', 'package.json', 'config.yml', 'config.yaml', 'tsconfig.json'];
    if (techConfigs.some(cfg => filenameLower === cfg || filenameLower.includes(cfg))) {
      score += 4;
    }
    
    // 6. Directory importance boost
    const highImportanceDirs = [
      'src/', 'app/', 'backend/', 'frontend/', 'core/', 'models/',
      'cloud_functions/', 'cloud-functions/', 'functions/', 'lambda/',
      'airflow/', 'dags/', 'pipelines/', 'pipeline/',
      'services/', 'api/', 'apis/', 'server/',
      'components/', 'modules/', 'utils/'
    ];
    
    for (const highDir of highImportanceDirs) {
      const dirPatternClean = highDir.replace('/', '').toLowerCase();
      if (pathLower.includes(dirPatternClean) || pathLower.includes(highDir)) {
        score += 5;
        break;
      }
    }
    
    // 7. Code density (estimate from content)
    if (content) {
      const lines = content.split('\n').length;
      if (lines > 500) score += 3;
      else if (lines > 200) score += 2;
      else if (lines > 50) score += 1;
      
      // Code structure indicators
      if (contentLower.includes('class ') || contentLower.includes('def ') || contentLower.includes('function ')) {
        score += 2;
      }
    }
    
    // 8. Base score for any technical file
    score += 1;
    
    return score;
  }

  // Identify key folders and their important files
  identifyKeyFolders(fileStructure, fileContentsMap = {}) {
    if (!Array.isArray(fileStructure)) {
      return [];
    }
    
    // High importance directory patterns
    const highImportanceDirs = [
      'src/', 'app/', 'backend/', 'frontend/', 'core/', 'models/',
      'cloud_functions/', 'cloud-functions/', 'functions/', 'lambda/',
      'airflow/', 'dags/', 'pipelines/', 'pipeline/',
      'notebooks/', 'notebook/', 'jupyter/',
      'streamlit_app/', 'streamlit/', 'app/',
      'services/', 'api/', 'apis/', 'server/',
      'lib/', 'library/', 'libraries/',
      'components/', 'modules/', 'utils/', 'utilities/'
    ];

    // Group technical files by top-level directory
    const folderMap = {};
    
    for (const item of fileStructure) {
      if (item.type !== 'file') continue;
      
      const path = item.path || item.name || '';
      const filename = path.split('/').pop() || '';
      
      // CRITICAL: Only process technical files
      if (!this.isTechnicalFile(path, filename)) {
        continue;
      }
      
      // Get top-level directory (for files in nested directories, get the first-level folder)
      // e.g., "cloud_functions/subfolder/file.py" -> "cloud_functions"
      let dir = 'root';
      let dirName = '';
      
      if (path.includes('/')) {
        const pathParts = path.split('/');
        dir = pathParts[0];
        dirName = dir;
      } else {
        dir = 'root';
        dirName = 'root';
      }
      
      // Skip root-level files (they don't belong to a folder)
      if (dir === 'root') {
        continue;
      }
      
      // Initialize folder if not exists
      if (!folderMap[dir]) {
        folderMap[dir] = {
          path: dir,
          name: dirName,
          files: [],
          score: 0,
          isHighImportance: false
        };
      }
      
      // Check if folder is high importance
      const dirNameLower = dirName.toLowerCase();
      const pathLower = path.toLowerCase();
      for (const highDir of highImportanceDirs) {
        const dirPatternClean = highDir.replace('/', '').toLowerCase();
        if (dirNameLower === dirPatternClean ||
            dirNameLower.includes(dirPatternClean) ||
            dirPatternClean.includes(dirNameLower) ||
            pathLower.includes(highDir)) {
          folderMap[dir].isHighImportance = true;
          break;
        }
      }
      
      // Score the technical file
      const content = fileContentsMap[path] || '';
      const fileScore = this.scoreTechnicalFile(path, filename, content);
      
      folderMap[dir].files.push({
        path: path,
        filename: filename,
        score: fileScore
      });
    }
    
    // Filter folders that have at least 1 technical file
    const foldersWithTechFiles = Object.values(folderMap).filter(folder => folder.files.length > 0);
    
    // Sort files within each folder by score
    foldersWithTechFiles.forEach(folder => {
      folder.files.sort((a, b) => b.score - a.score);
      
      // Calculate folder score
      // Base score from best file
      folder.score = folder.files[0].score;
      
      // Second file contributes (if exists)
      if (folder.files.length > 1) {
        folder.score += folder.files[1].score * 0.5;
      }
      
      // High importance directory boost
      if (folder.isHighImportance) {
        folder.score += 5;
      }
      
      // Code density boost (more files = more important)
      if (folder.files.length > 5) {
        folder.score += 3;
      } else if (folder.files.length > 2) {
        folder.score += 1;
      }
    });
    
    // Sort folders by score (descending)
    foldersWithTechFiles.sort((a, b) => b.score - a.score);
    
    // Return top 3-5 folders, each with 1-2 most important technical files
    return foldersWithTechFiles.slice(0, 5).map(folder => ({
      path: folder.path,
      name: folder.name,
      keyFiles: folder.files.slice(0, 2).map(f => f.path) // Top 1-2 technical files per folder
    }));
  }

  // Identify key files using scoring algorithm (V2) - returns top 5 technical files across entire repo
  identifyKeyFilesV2(fileStructure, fileContentsMap = {}) {
    if (!Array.isArray(fileStructure)) {
      return [];
    }
    
    // Score all technical files
    const scoredFiles = [];

    for (const item of fileStructure) {
      if (item.type !== 'file') continue;
      
      const path = item.path || item.name || '';
      const filename = path.split('/').pop() || '';
      
      // CRITICAL: Only process technical files
      if (!this.isTechnicalFile(path, filename)) {
        continue;
      }
      
      // Score the technical file
      const content = fileContentsMap[path] || '';
      const fileScore = this.scoreTechnicalFile(path, filename, content);
      
      scoredFiles.push({
        path: path,
        filename: filename,
        score: fileScore
      });
    }

    // Sort by score DESC (highest first)
    scoredFiles.sort((a, b) => b.score - a.score);

    // Return top 5 technical files across entire repo (no directory distribution requirement)
    return scoredFiles.slice(0, 5).map(f => f.path);
  }

  // OpenAI API: Analyze repository with all 6 features
  async analyzeRepoWithAI(repoData, openaiKey, fileContentsMap = {}, onRetry = null) {
    const {
      name,
      description,
      readme,
      languages,
      fileStructure,
      commits,
      issues,
      contributors,
      stars,
      forks,
      created_at,
      updated_at,
      pushed_at
    } = repoData;

    const prompt = `Analyze this GitHub repository and return a structured JSON object.

### Repository Metadata

Repository: ${name}

Description: ${description || 'No description'}

Languages: ${JSON.stringify(languages)}

Stars: ${stars}, Forks: ${forks}

Created: ${created_at}, Last Updated: ${updated_at}, Last Pushed: ${pushed_at}

### README (truncated)

${readme ? readme.substring(0, 3000) : 'No README available'}

### File Structure (all files)

${fileStructure ? fileStructure.map(f => {
  const path = f.path || f.name || '';
  const type = f.type || 'file';
  return `${type === 'dir' ? '📁' : '📄'} ${path}`;
}).join('\n') : 'Unknown'}

### Recent Activity

Commits: ${commits ? commits.length : 0}

Open Issues: ${issues ? issues.length : 0}

Contributors: ${contributors ? contributors.length : 0}

---

You MUST respond with ONLY valid JSON in the following schema:

{
  "summary": {
    "overview": "A 2–3 sentence high-level explanation of what this repository does and its purpose. Avoid deep technical details.",
    "projectType": {
      "category": "One of: ['ML Model Training Repo','ML Inference Service','Data Pipeline Project','RAG System','Agentic System','Benchmark Suite','Dataset Repository','API Microservice','Web Application','Fullstack Application','Mobile Application','CLI Tool','Library Package','Plugin or Extension','Framework or Starter Kit','DevOps Automation Script','Infrastructure-as-Code','Containerization Repo','Monorepo','Notebook Research Repo','Scientific Algorithm Repo','Simulation Repo','Configuration Repo','Documentation Repo']",
      "subcategory": "More specific label, e.g. 'FastAPI Service', 'PyTorch Trainer'.",
      "confidence": 0.0
    },
    "tags": [
      "An array of 5–7 strings (minimum 5, maximum 7). Each tag must be 1–2 words maximum.",
      "Generate tags by identifying key keywords from the repository's actual content, purpose, technologies, and dependencies.",
      "Tags should be meaningful keywords that help classify and understand the repository.",
      "Analyze the repo's README, dependencies, file structure, and code to identify the most relevant keywords.",
      "Each tag must be concise (1–2 words) and represent an important aspect of the repository.",
      "Return at most 7 tags - do not exceed this limit."
    ]
  },
  "keyFiles": [
    {
      "path": "file path from the file structure above",
      "role": "short architectural role (1–2 words, e.g., Entrypoint, Pipeline, Trainer, API, Model, Core Logic, Documentation, Configuration)",
      "purpose": "what this file does (1 sentence, keep it short)",
      "importance": "why this file matters (1 sentence, keep it short)"
    }
  ],
  "pipeline": "A clear explanation of the architecture and how the system works end-to-end, including data flow and key components",
  "useCases": [
    "Specific use case 1",
    "Specific use case 2",
    "Specific use case 3"
  ],
  "requirements": {
    "dependencies": ["list of main dependencies if identifiable"],
    "environment": "required environment setup (Node version, Python version, etc.)",
    "installation": "key installation steps or gotchas",
    "warnings": ["any potential issues or compatibility concerns"]
  },
  "health": {
    "status": "active|moderate|inactive|risky",
    "score": 0-100,
    "indicators": ["list of health indicators"],
    "concerns": ["any red flags or concerns"],
    "maintenance": "assessment of maintenance status"
  }

### CRITICAL: Key Folders and Files Selection Rules

IMPORTANT: Check if the repository has folders or is flat (all files in root).

IF the repository HAS folders:
- Identify 3–5 most important folders from the file structure above, sorted by importance.
- For each selected folder, identify 1–3 most important files within that folder, sorted by importance.
- Return folders in keyFolders array, leave keyFiles empty.

IF the repository has NO folders (flat structure, all files in root):
- Identify 3–5 most important files directly from the file structure, sorted by importance.
- Return files in keyFiles array, leave keyFolders empty.

RULES:
1. Select based on importance to the repository, regardless of file type.
2. You can include ANY type of file (code files, documentation, config files, etc.) as long as they are important.
3. Focus on files that are critical to understanding or using the repository:
   - Core code files (entrypoints, main logic, models, APIs)
   - Important documentation (README, guides, architecture docs)
   - Critical configuration files
   - Key infrastructure files
4. Sort by importance: most critical first.
5. IGNORE only truly non-essential files like: .git/, .github/, node_modules/, build artifacts, temporary files.

RULES:

1. Respond only with JSON.

2. Summary must stay high-level and non-technical.

3. architecture and pipeline are separate sections - architecture shows folder structure, pipeline shows technical workflow.

4. useCases describe *applications*, not repo contents.

5. keyFiles MUST follow these CRITICAL rules:
   - Identify 3–5 most important files from the file structure above.
   - **CRITICAL: Sort files by importance in the array - most critical/important files FIRST, less important files LAST.**
   - The order of files in the keyFiles array determines their display order - most important files should appear first.
   - Select files based on their importance, regardless of file types (code, docs, config, etc.).
   - Each file must:
     * Have path matching exactly a file in the file structure
     * Include role (1–2 words), purpose (1 sentence), importance (1 sentence)
     * Can be ANY type of file (code, documentation, config, etc.) as long as it's important
   - Maximum 5 files.

6. tags MUST follow these rules:
   - Generate 5–7 tags (minimum 5, maximum 7). DO NOT exceed 7 tags.
   - Return an array of 5–7 strings. Maximum 7 tags allowed.
   - Each tag must be 1–2 words maximum.
   - Generate tags by freely identifying key keywords from the repository's actual content, purpose, technologies, dependencies, and code.
   - Tags can represent: technologies used, frameworks, libraries, protocols, algorithms, purpose, domain, or any other relevant keywords.
   - Analyze the repo's README, dependencies, file structure, code, and purpose to identify the most meaningful keywords.
   - Tags should help users quickly understand what the repository is about and what technologies it uses.
   - MUST NOT repeat projectType.category or projectType.subcategory in tags array (they are displayed separately).
   - Do not repeat or paraphrase any text from summary.overview.
   - Be creative but accurate - identify keywords that truly represent this specific repository.

6. projectType.category MUST match the 24-category list exactly.

7. Avoid repetition between sections.

8. Write as a senior engineer analyzing a repo.

9. **CRITICAL: The keyFiles array MUST be sorted by importance - the first file in the array should be the most important/critical file, and the last file should be the least important. The order in which you return files determines how they will be displayed to users.**
`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.openaiBaseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using cost-effective model, can upgrade to gpt-4
          messages: [
            {
              role: 'system',
              content: 'You are a senior software engineer and technical analyst. Provide detailed, accurate technical analysis of GitHub repositories. Always respond with valid JSON only. For tags, freely identify 5–7 key keywords (1–2 words each) from the repository\'s actual content, technologies, dependencies, and purpose. Analyze the repo thoroughly and generate meaningful tags that help classify and understand the repository.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || response.statusText || 'Unknown error';
        console.error('OpenAI API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          errorMessage: errorMsg
        });
        throw new Error(`OpenAI API error: ${errorMsg}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid OpenAI API response:', data);
        throw new Error('Invalid response from OpenAI API. Please try again.');
      }
      const content = data.choices[0].message.content;
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response content (first 500 chars):', jsonContent.substring(0, 500));
        throw new Error('Failed to parse AI response as JSON. The AI may have returned invalid data. Please try again.');
      }
      
      // Validate keyFiles: ensure paths exist in file structure
      if (parsed.keyFiles && Array.isArray(parsed.keyFiles)) {
        const fileStructure = repoData.fileStructure || [];
        const allFilePaths = new Set();
        
        // Build set of valid file paths
        fileStructure.forEach(item => {
          if (item.type === 'file') {
            const path = item.path || item.name || '';
            allFilePaths.add(path);
          }
        });
        
        parsed.keyFiles = parsed.keyFiles.filter(file => {
          if (!file || !file.path) return false;
          
          const filePath = file.path;
          
          // File path must exist in file structure
          if (!allFilePaths.has(filePath)) {
            return false;
          }
          
          return true;
        });
        
        // Limit to maximum 5 files
        if (parsed.keyFiles.length > 5) {
          parsed.keyFiles = parsed.keyFiles.slice(0, 5);
        }
      }
      
      return parsed;
    }, 3, onRetry);
  }
}

// Export singleton instance
const apiService = new APIService();

