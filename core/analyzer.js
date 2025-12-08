// Repository Analyzer - Orchestrates data collection and analysis

class RepoAnalyzer {
  constructor() {
    this.apiService = apiService;
  }

  // Get cache key for repository
  getCacheKey(owner, repo) {
    return `analysis_${owner}_${repo}`;
  }

  // Get cached analysis if available and valid
  async getCachedAnalysis(owner, repo, repoPushedAt = null) {
    const cacheKey = this.getCacheKey(owner, repo);
    return new Promise((resolve) => {
      chrome.storage.local.get([cacheKey], (result) => {
        const cached = result[cacheKey];
        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is expired (24 hours)
        const cacheAge = Date.now() - cached.timestamp;
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (cacheAge > twentyFourHours) {
          resolve(null);
          return;
        }

        // Check if repo was updated since cache
        if (repoPushedAt && cached.repoPushedAt) {
          const cachedDate = new Date(cached.repoPushedAt);
          const repoDate = new Date(repoPushedAt);
          if (repoDate > cachedDate) {
            resolve(null);
            return;
          }
        }

        resolve(cached.analysis);
      });
    });
  }

  // Save analysis to cache
  async saveToCache(owner, repo, analysis, repoPushedAt = null) {
    const cacheKey = this.getCacheKey(owner, repo);
    const cacheData = {
      analysis: analysis,
      timestamp: Date.now(),
      repoPushedAt: repoPushedAt,
      owner: owner,
      repo: repo
    };
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ [cacheKey]: cacheData }, () => {
        resolve();
      });
    });
  }

  // Main analysis function - orchestrates all 6 killer features
  async analyzeRepository(owner, repo, forceRefresh = false, progressCallback = null) {
    try {
      // Get API keys
      const { githubToken, openaiKey } = await this.apiService.getAPIKeys();

      if (!openaiKey) {
        throw new Error('OpenAI API key not configured. Please set it in settings.');
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        if (progressCallback) progressCallback('Checking cache...');
        
        // Check cache without repo info first (faster)
        const cached = await this.getCachedAnalysis(owner, repo);
        
        if (cached) {
          // If cache exists, verify it's still valid by checking repo's pushed_at
          // Only fetch repo info if we have a cached result to validate
          try {
            const repoInfo = await this.apiService.getRepoInfo(owner, repo, githubToken);
            const cachedWithValidation = await this.getCachedAnalysis(owner, repo, repoInfo.pushed_at);
            
            if (cachedWithValidation) {
              // Return cached result with flag
              return { ...cachedWithValidation, _cached: true };
            }
          } catch (err) {
            // If repo info fetch fails, still return cached result
            console.warn('Failed to validate cache, returning cached result anyway:', err);
            return { ...cached, _cached: true };
          }
        }
      }

      // Step 1: Collect all repository data in parallel
      if (progressCallback) progressCallback('Fetching repository data...');
      
      // Create retry callback for progress updates
      const createRetryCallback = (stepName) => (attempt, maxRetries, delay) => {
        if (progressCallback) {
          progressCallback(`${stepName}... Retrying (attempt ${attempt}/${maxRetries})`);
        }
      };

      const [
        repoInfo,
        languages,
        readme,
        commits,
        issues,
        contributors,
        rootContents
      ] = await Promise.all([
        this.apiService.getRepoInfo(owner, repo, githubToken, createRetryCallback('Fetching repo info')),
        this.apiService.getRepoLanguages(owner, repo, githubToken, createRetryCallback('Fetching languages')),
        this.apiService.getReadme(owner, repo, githubToken, createRetryCallback('Fetching README')),
        this.apiService.getCommits(owner, repo, githubToken, 10, createRetryCallback('Fetching commits')),
        this.apiService.getIssues(owner, repo, githubToken, 'open', 10, createRetryCallback('Fetching issues')),
        this.apiService.getContributors(owner, repo, githubToken, createRetryCallback('Fetching contributors')),
        this.apiService.getRepoContents(owner, repo, '', githubToken, createRetryCallback('Fetching file structure'))
      ]);

      // Step 2: Build file structure and identify candidate key files
      // First, collect all files including those in important directories
      let allFiles = [...rootContents];
      
      // Recursively fetch files from important directories
      const importantDirNames = [
        'cloud_functions', 'cloud-functions', 'functions', 'lambda',
        'airflow', 'dags', 'pipelines', 'pipeline',
        'notebooks', 'notebook', 'jupyter',
        'streamlit_app', 'streamlit',
        'src', 'app', 'backend', 'frontend', 'core', 'models',
        'services', 'api', 'apis', 'server'
      ];
      
      if (progressCallback) progressCallback('Scanning important directories...');
      
      // Check which important directories exist in root
      const importantDirs = rootContents.filter(item => 
        item.type === 'dir' && importantDirNames.some(dir => 
          item.name.toLowerCase().includes(dir.toLowerCase()) || 
          dir.toLowerCase().includes(item.name.toLowerCase())
        )
      );
      
      // Fetch contents from important directories (limit to 8 for performance, but prioritize all important dirs)
      // Sort by importance: cloud_functions, airflow, streamlit_app, etc. first
      const sortedDirs = importantDirs.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const priority = ['cloud_functions', 'cloud-functions', 'functions', 'airflow', 'streamlit_app', 'streamlit', 'notebooks'];
        const aIdx = priority.findIndex(p => aName.includes(p));
        const bIdx = priority.findIndex(p => bName.includes(p));
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return 0;
      });
      
      // Recursively fetch files from directories (up to 5 levels deep)
      const recursivelyFetchDir = async (dirPath, dirName, maxDepth = 5, currentDepth = 0) => {
        if (currentDepth >= maxDepth) {
          return [];
        }
        
        try {
          const contents = await this.apiService.getRepoContents(
            owner,
            repo,
            dirPath,
            githubToken,
            createRetryCallback(`Fetching ${dirName}${currentDepth > 0 ? ` (level ${currentDepth + 1})` : ''}`)
          );
          
          if (!Array.isArray(contents)) {
            return [];
          }
          
          const allFiles = [];
          const subDirPromises = [];
          
          for (const item of contents) {
            if (item.type === 'file') {
              allFiles.push(item);
            } else if (item.type === 'dir') {
              // Recursively fetch subdirectories
              subDirPromises.push(
                recursivelyFetchDir(item.path || item.name, item.name, maxDepth, currentDepth + 1)
              );
            }
          }
          
          // Wait for all subdirectories to be fetched
          const subDirFiles = await Promise.all(subDirPromises);
          subDirFiles.forEach(files => {
            allFiles.push(...files);
          });
          
          return allFiles;
        } catch (err) {
          console.warn(`Failed to fetch contents for ${dirPath}:`, err);
          return [];
        }
      };
      
      const dirContentsPromises = sortedDirs.slice(0, 8).map(async (dir) => {
        const dirPath = dir.path || dir.name;
        return await recursivelyFetchDir(dirPath, dir.name);
      });
      
      const dirContentsArrays = await Promise.all(dirContentsPromises);
      // Flatten and add to allFiles
      dirContentsArrays.forEach(contents => {
        allFiles = allFiles.concat(contents);
      });
      
      // Get candidate key folders using folder-based scoring
      const candidateKeyFolders = this.apiService.identifyKeyFolders(allFiles, {});
      
      // Fetch file contents for ALL technical files (needed for semantic analysis)
      const fileContentsMap = {};
      if (progressCallback) progressCallback('Fetching file contents for semantic analysis...');
      
      // Collect all technical files from all folders
      const allTechnicalFiles = [];
      for (const item of allFiles) {
        if (item.type === 'file') {
          const path = item.path || item.name || '';
          const filename = path.split('/').pop() || '';
          if (this.apiService.isTechnicalFile(path, filename)) {
            allTechnicalFiles.push(path);
          }
        }
      }
      
      // Fetch contents (limit to top 30 for performance, prioritize important folders)
      const filesToFetch = [];
      candidateKeyFolders.forEach(folder => {
        folder.keyFiles.forEach(filePath => {
          if (!filesToFetch.includes(filePath)) {
            filesToFetch.push(filePath);
          }
        });
      });
      
      // Add more files from important folders
      allTechnicalFiles.slice(0, 30).forEach(filePath => {
        if (!filesToFetch.includes(filePath)) {
          filesToFetch.push(filePath);
        }
      });
      
      await Promise.all(
        filesToFetch.slice(0, 30).map(async (filePath) => {
          try {
            const content = await this.apiService.getFileContent(
              owner, 
              repo, 
              filePath, 
              githubToken
            );
            if (content) {
              fileContentsMap[filePath] = content.substring(0, 8000); // Limit to 8k for embeddings
            }
          } catch (err) {
            console.warn(`Failed to fetch content for ${filePath}:`, err);
          }
        })
      );
      
      // Use semantic selector to identify key files
      if (progressCallback) progressCallback('Analyzing files with semantic embeddings...');
      const semanticSelector = new SemanticKeyFileSelector(openaiKey);
      const semanticKeyFiles = await semanticSelector.rankFilesBySemanticImportance(
        allFiles,
        fileContentsMap,
        (path, filename) => this.apiService.isTechnicalFile(path, filename)
      );
      
      // Re-score folders with content analysis
      const finalCandidateFolders = this.apiService.identifyKeyFolders(allFiles, fileContentsMap);
      
      // Enhance folders with semantic key files
      const semanticFilePaths = new Set(semanticKeyFiles.map(f => f.path));
      finalCandidateFolders.forEach(folder => {
        // Prioritize semantic key files in each folder
        const semanticFilesInFolder = folder.keyFiles.filter(f => semanticFilePaths.has(f));
        const otherFiles = folder.keyFiles.filter(f => !semanticFilePaths.has(f));
        folder.keyFiles = [...semanticFilesInFolder, ...otherFiles].slice(0, 2);
      });
      
      // Step 3: Prepare data for AI analysis
      const repoData = {
        name: `${owner}/${repo}`,
        description: repoInfo.description || '',
        readme: readme || '',
        languages: languages || {},
        fileStructure: allFiles,
        commits: commits || [],
        issues: issues || [],
        contributors: contributors || [],
        stars: repoInfo.stargazers_count || 0,
        forks: repoInfo.forks_count || 0,
        created_at: repoInfo.created_at || '',
        updated_at: repoInfo.updated_at || '',
        pushed_at: repoInfo.pushed_at || '',
        license: repoInfo.license?.name || 'None',
        topics: repoInfo.topics || [],
        default_branch: repoInfo.default_branch || 'main',
        semanticKeyFiles: semanticKeyFiles.map(f => f.path)
      };

      // Step 4: Get AI analysis (all 6 features in one call)
      if (progressCallback) progressCallback('Analyzing with AI...');
      const aiAnalysis = await this.apiService.analyzeRepoWithAI(
        repoData, 
        openaiKey,
        fileContentsMap,
        createRetryCallback('AI analysis')
      );

      // Step 5: Combine and return comprehensive analysis
      if (progressCallback) progressCallback('Processing results...');
      
      const analysis = {
        // Feature 1: AI Repo Summary
        summary: aiAnalysis.summary || 'Unable to generate summary',
        
        // Feature 2: Key Files (semantic-based) + Key Folders
        keyFiles: aiAnalysis.keyFiles || [], // Semantic key files (3-7 files)
        keyFolders: aiAnalysis.keyFolders || [], // Folder-based organization
        
        // Feature 3: Architecture / Pipeline Explanation
        pipeline: aiAnalysis.pipeline || 'Unable to analyze architecture',
        
        // Feature 4: Smart Use-Case Recommendations
        useCases: aiAnalysis.useCases || [],
        
        // Feature 5: Dependency & Environment Auditor
        requirements: aiAnalysis.requirements || {
          dependencies: [],
          environment: 'Unknown',
          installation: 'Check README for installation instructions',
          warnings: []
        },
        
        // Feature 6: Repo Health Check
        health: aiAnalysis.health || {
          status: 'unknown',
          score: 0,
          indicators: [],
          concerns: [],
          maintenance: 'Unable to assess'
        },
        
        // Additional metadata
        metadata: {
          owner,
          repo,
          url: repoInfo.html_url,
          stars: repoData.stars,
          forks: repoData.forks,
          language: Object.keys(languages)[0] || 'Unknown',
          languages: languages,
          license: repoData.license,
          topics: repoData.topics,
          lastPushed: repoData.pushed_at,
          createdAt: repoData.created_at
        }
      };

      // Save to cache
      await this.saveToCache(owner, repo, analysis, repoData.pushed_at);

      return analysis;
    } catch (error) {
      console.error('Error analyzing repository:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        owner: owner,
        repo: repo
      });
      throw error;
    }
  }

  // OLD identifyKeyFiles removed - now using identifyKeyFilesV2 in apiService

  // Quick health check without AI (fallback)
  calculateBasicHealth(repoInfo, commits, issues, contributors) {
    let score = 50;
    const indicators = [];
    const concerns = [];

    // Activity score
    if (commits && commits.length > 0) {
      const lastCommit = new Date(commits[0].commit.author.date);
      const daysSinceCommit = (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCommit < 7) {
        score += 20;
        indicators.push('Very active (commits in last week)');
      } else if (daysSinceCommit < 30) {
        score += 10;
        indicators.push('Active (commits in last month)');
      } else if (daysSinceCommit < 90) {
        score += 5;
        indicators.push('Moderately active');
      } else {
        score -= 10;
        concerns.push('No commits in last 3 months');
      }
    } else {
      score -= 15;
      concerns.push('No recent commits found');
    }

    // Issue management
    if (issues && issues.length > 0) {
      if (issues.length < 10) {
        score += 5;
        indicators.push('Low number of open issues');
      } else if (issues.length > 50) {
        score -= 10;
        concerns.push('High number of open issues');
      }
    }

    // Contributors
    if (contributors && contributors.length > 1) {
      score += 10;
      indicators.push('Multiple contributors');
    } else if (contributors && contributors.length === 1) {
      score -= 5;
      concerns.push('Single contributor (bus factor risk)');
    }

    // Stars (popularity indicator)
    if (repoInfo.stargazers_count > 1000) {
      score += 10;
      indicators.push('Highly popular');
    } else if (repoInfo.stargazers_count > 100) {
      score += 5;
      indicators.push('Moderately popular');
    }

    score = Math.max(0, Math.min(100, score));

    let status = 'moderate';
    if (score >= 80) status = 'active';
    else if (score >= 60) status = 'moderate';
    else if (score >= 40) status = 'inactive';
    else status = 'risky';

    return {
      status,
      score,
      indicators,
      concerns,
      maintenance: score >= 70 ? 'Well maintained' : score >= 50 ? 'Moderately maintained' : 'Needs attention'
    };
  }
}

// Export singleton instance
const repoAnalyzer = new RepoAnalyzer();

