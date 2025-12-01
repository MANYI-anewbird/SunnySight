// API Service Layer - Handles GitHub and OpenAI API calls

class APIService {
  constructor() {
    this.githubBaseURL = 'https://api.github.com';
    this.openaiBaseURL = 'https://api.openai.com/v1';
  }

  // Get API keys from storage
  async getAPIKeys() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['githubToken', 'openaiKey'], (result) => {
        resolve({
          githubToken: result.githubToken || null,
          openaiKey: result.openaiKey || null
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
        throw new Error(`GitHub API error: ${response.status}`);
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

  // OpenAI API: Analyze repository with all 6 features
  async analyzeRepoWithAI(repoData, openaiKey, onRetry = null) {
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

    const prompt = `Analyze this GitHub repository and provide a comprehensive technical analysis.

Repository: ${name}
Description: ${description || 'No description'}
Languages: ${JSON.stringify(languages)}
Stars: ${stars}, Forks: ${forks}
Created: ${created_at}, Last Updated: ${updated_at}, Last Pushed: ${pushed_at}

README Content:
${readme ? readme.substring(0, 3000) : 'No README available'}

File Structure (top level):
${fileStructure ? fileStructure.slice(0, 50).map(f => f.name || f.path).join(', ') : 'Unknown'}

Recent Activity:
- Commits: ${commits ? commits.length : 0} recent commits
- Open Issues: ${issues ? issues.length : 0}
- Contributors: ${contributors ? contributors.length : 0}

Please provide a JSON response with the following structure:
{
  "summary": "A clear, concise 2-3 sentence summary of what this repository does and its main purpose",
  "keyFiles": [
    {
      "path": "file path",
      "importance": "why this file is critical",
      "purpose": "what it does"
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
}

Be specific, technical, and actionable. Focus on real pain points developers face.`;

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
              content: 'You are a senior software engineer and technical analyst. Provide detailed, accurate technical analysis of GitHub repositories. Always respond with valid JSON only.'
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
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '');
      }

      return JSON.parse(jsonContent);
    }, 3, onRetry);
  }
}

// Export singleton instance
const apiService = new APIService();

