// Repository Analyzer - Orchestrates data collection and analysis

class RepoAnalyzer {
  constructor() {
    this.apiService = apiService;
  }

  // Main analysis function - orchestrates all 6 killer features
  async analyzeRepository(owner, repo) {
    try {
      // Get API keys
      const { githubToken, openaiKey } = await this.apiService.getAPIKeys();

      if (!openaiKey) {
        throw new Error('OpenAI API key not configured. Please set it in settings.');
      }

      // Step 1: Collect all repository data in parallel
      const [
        repoInfo,
        languages,
        readme,
        commits,
        issues,
        contributors,
        rootContents
      ] = await Promise.all([
        this.apiService.getRepoInfo(owner, repo, githubToken),
        this.apiService.getRepoLanguages(owner, repo, githubToken),
        this.apiService.getReadme(owner, repo, githubToken),
        this.apiService.getCommits(owner, repo, githubToken, 10),
        this.apiService.getIssues(owner, repo, githubToken, 'open', 10),
        this.apiService.getContributors(owner, repo, githubToken),
        this.apiService.getRepoContents(owner, repo, '', githubToken)
      ]);

      // Step 2: Build file structure (identify key files)
      const fileStructure = this.identifyKeyFiles(rootContents);

      // Step 3: Prepare data for AI analysis
      const repoData = {
        name: `${owner}/${repo}`,
        description: repoInfo.description || '',
        readme: readme || '',
        languages: languages || {},
        fileStructure: fileStructure,
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
        default_branch: repoInfo.default_branch || 'main'
      };

      // Step 4: Get AI analysis (all 6 features in one call)
      const aiAnalysis = await this.apiService.analyzeRepoWithAI(repoData, openaiKey);

      // Step 5: Combine and return comprehensive analysis
      return {
        // Feature 1: AI Repo Summary
        summary: aiAnalysis.summary || 'Unable to generate summary',
        
        // Feature 2: Key File Highlighter
        keyFiles: aiAnalysis.keyFiles || [],
        
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
    } catch (error) {
      console.error('Error analyzing repository:', error);
      throw error;
    }
  }

  // Identify key files from repository structure
  identifyKeyFiles(contents) {
    if (!Array.isArray(contents)) {
      return [];
    }

    const keyFilePatterns = [
      /package\.json$/i,
      /requirements\.txt$/i,
      /pom\.xml$/i,
      /build\.gradle$/i,
      /Cargo\.toml$/i,
      /go\.mod$/i,
      /composer\.json$/i,
      /Gemfile$/i,
      /Dockerfile$/i,
      /docker-compose\.yml$/i,
      /\.env\.example$/i,
      /\.env$/i,
      /config\./i,
      /setup\./i,
      /install\./i,
      /main\./i,
      /index\./i,
      /app\./i,
      /server\./i,
      /client\./i
    ];

    const importantFiles = contents
      .filter(item => {
        if (item.type === 'file') {
          return keyFilePatterns.some(pattern => pattern.test(item.name));
        }
        return item.type === 'dir' && !item.name.startsWith('.');
      })
      .slice(0, 30); // Limit to top 30 files/dirs

    return importantFiles;
  }

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

