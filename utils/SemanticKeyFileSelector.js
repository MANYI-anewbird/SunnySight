// Semantic Key File Selector - Uses embeddings to identify truly important files
// Based on semantic meaning, not just heuristics

class SemanticKeyFileSelector {
  constructor(openaiKey) {
    this.openaiKey = openaiKey;
    this.embeddingModel = 'text-embedding-3-large';
    this.embeddingBaseURL = 'https://api.openai.com/v1';
    
    // Reference embeddings for semantic comparison
    this.coreLogicPrompt = "Code representing primary logic, orchestrators, pipelines, training loops, API handlers, major algorithms.";
    this.architecturalPrompt = "Architecture entrypoints, main application flow, initialization logic.";
    
    // Cache for reference embeddings
    this.referenceEmbeddings = null;
  }

  // Get embeddings for reference prompts (cached)
  async getReferenceEmbeddings() {
    if (this.referenceEmbeddings) {
      return this.referenceEmbeddings;
    }

    try {
      const [coreEmbedding, archEmbedding] = await Promise.all([
        this.getEmbedding(this.coreLogicPrompt),
        this.getEmbedding(this.architecturalPrompt)
      ]);

      this.referenceEmbeddings = {
        coreLogic: coreEmbedding,
        architectural: archEmbedding
      };

      return this.referenceEmbeddings;
    } catch (error) {
      console.error('Error getting reference embeddings:', error);
      return null;
    }
  }

  // Get embedding for a text
  async getEmbedding(text) {
    if (!text || text.trim().length === 0) {
      return null;
    }

    try {
      const response = await fetch(`${this.embeddingBaseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text.substring(0, 8000) // Limit to 8k tokens
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error getting embedding:', error);
      return null;
    }
  }

  // Compute cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  // Analyze code density of a file
  analyzeCodeDensity(content) {
    if (!content) return 0;

    let score = 0;
    const contentLower = content.toLowerCase();

    // Count classes
    const classMatches = content.match(/\bclass\s+\w+/g);
    if (classMatches && classMatches.length >= 3) {
      score += 3;
    }

    // Count functions
    const functionMatches = content.match(/\b(def|function|fn|func)\s+\w+/g);
    if (functionMatches && functionMatches.length >= 5) {
      score += 3;
    }

    // Check for long functions (heuristic: look for functions with many lines)
    const functionBlocks = content.match(/(def|function|fn|func)\s+\w+[^}]*\{[^}]*\{/g);
    if (functionBlocks) {
      functionBlocks.forEach(block => {
        const lines = block.split('\n').length;
        if (lines > 30) {
          score += 2;
        }
      });
    }

    // Count internal imports (indicates connectivity)
    const importMatches = content.match(/(import|from)\s+[\w.]+\s+(import|as)/g);
    if (importMatches && importMatches.length > 5) {
      score += 1;
    }

    return Math.min(score, 10); // Cap at 10
  }

  // Analyze connectivity signals
  analyzeConnectivity(content) {
    if (!content) return 0;

    let score = 0;
    const contentLower = content.toLowerCase();

    // Many imports
    const importCount = (content.match(/(import|from)\s+/g) || []).length;
    if (importCount > 10) score += 3;
    else if (importCount > 5) score += 2;
    else if (importCount > 2) score += 1;

    // Initialization logic
    if (contentLower.includes('__init__') || contentLower.includes('initialize') || contentLower.includes('main()')) {
      score += 2;
    }

    // Pipeline building
    if (contentLower.includes('pipeline') || contentLower.includes('build') || contentLower.includes('create')) {
      score += 2;
    }

    // Orchestration
    if (contentLower.includes('orchestrate') || contentLower.includes('coordinate') || contentLower.includes('manage')) {
      score += 2;
    }

    // Model definition
    if (contentLower.includes('class') && (contentLower.includes('model') || contentLower.includes('network'))) {
      score += 2;
    }

    return Math.min(score, 10); // Cap at 10
  }

  // Extract content summary for embedding
  extractContentForEmbedding(path, content, fileContentsMap) {
    const filename = path.split('/').pop() || '';
    const filenameLower = filename.toLowerCase();

    // For config files, extract relevant sections
    if (filenameLower === 'package.json' || filenameLower === 'manifest.json') {
      try {
        const parsed = JSON.parse(content);
        const relevant = {
          name: parsed.name || '',
          scripts: parsed.scripts || {},
          dependencies: Object.keys(parsed.dependencies || {}).slice(0, 20),
          main: parsed.main || ''
        };
        return JSON.stringify(relevant);
      } catch (e) {
        return content.substring(0, 2000);
      }
    }

    // For code files, use full content (truncated)
    return content.substring(0, 8000);
  }

  // Rank files by semantic importance
  async rankFilesBySemanticImportance(fileStructure, fileContentsMap, isTechnicalFile) {
    if (!Array.isArray(fileStructure)) {
      return [];
    }

    // Filter to only technical files
    const technicalFiles = [];
    for (const item of fileStructure) {
      if (item.type !== 'file') continue;
      
      const path = item.path || item.name || '';
      const filename = path.split('/').pop() || '';
      
      if (isTechnicalFile(path, filename)) {
        technicalFiles.push({
          path: path,
          filename: filename,
          content: fileContentsMap[path] || ''
        });
      }
    }

    // If repo has ≤ 7 technical files, return all
    if (technicalFiles.length <= 7) {
      return technicalFiles.map(f => ({
        path: f.path,
        score: 100, // All files are important in small repos
        embedding: null
      }));
    }

    // Get reference embeddings
    const references = await this.getReferenceEmbeddings();
    if (!references) {
      // Fallback to heuristics if embeddings fail
      return this.fallbackToHeuristics(technicalFiles);
    }

    // Extract embeddings for all files
    const fileEmbeddings = [];
    for (const file of technicalFiles) {
      const contentForEmbedding = this.extractContentForEmbedding(
        file.path,
        file.content,
        fileContentsMap
      );

      const embedding = await this.getEmbedding(contentForEmbedding);
      if (embedding) {
        fileEmbeddings.push({
          path: file.path,
          filename: file.filename,
          content: file.content,
          embedding: embedding
        });
      }
    }

    // Calculate semantic importance scores
    const scoredFiles = [];
    for (const file of fileEmbeddings) {
      // 1. Core Logic Similarity (35%)
      const coreSimilarity = this.cosineSimilarity(file.embedding, references.coreLogic);
      const coreScore = coreSimilarity * 0.35;

      // 2. Architectural Relevance (25%)
      const archSimilarity = this.cosineSimilarity(file.embedding, references.architectural);
      const archScore = archSimilarity * 0.25;

      // 3. Code Density (20%)
      const densityScore = (this.analyzeCodeDensity(file.content) / 10) * 0.20;

      // 4. Semantic Uniqueness (10%) - penalize files too similar to others
      let uniquenessScore = 1.0;
      let similarityCount = 0;
      for (const otherFile of fileEmbeddings) {
        if (otherFile.path !== file.path) {
          const similarity = this.cosineSimilarity(file.embedding, otherFile.embedding);
          if (similarity > 0.85) { // Very similar
            similarityCount++;
          }
        }
      }
      uniquenessScore = Math.max(0, 1 - (similarityCount * 0.1));
      const uniquenessFinal = uniquenessScore * 0.10;

      // 5. Connectivity Signals (10%)
      const connectivityScore = (this.analyzeConnectivity(file.content) / 10) * 0.10;

      // Total importance score
      const totalScore = coreScore + archScore + densityScore + uniquenessFinal + connectivityScore;

      scoredFiles.push({
        path: file.path,
        filename: file.filename,
        score: totalScore,
        embedding: file.embedding,
        coreSimilarity: coreSimilarity,
        archSimilarity: archSimilarity
      });
    }

    // Sort by score (descending)
    scoredFiles.sort((a, b) => b.score - a.score);

    // Return top 5 files
    return scoredFiles.slice(0, 5);
  }

  // Fallback to heuristics if embeddings fail
  fallbackToHeuristics(technicalFiles) {
    const entrypoints = ['main.py', 'app.py', 'server.py', 'index.js', 'main.js', 'app.js', 'index.ts'];
    const mlCore = ['model.py', 'trainer.py', 'pipeline.py', 'rag.py'];
    
    const scored = technicalFiles.map(file => {
      const filenameLower = file.filename.toLowerCase();
      let score = 1;

      if (entrypoints.some(ep => filenameLower === ep)) score += 10;
      if (mlCore.some(ml => filenameLower.includes(ml))) score += 8;
      if (file.content && file.content.length > 500) score += 3;
      if (file.content && (file.content.includes('class ') || file.content.includes('def '))) score += 2;

      return {
        path: file.path,
        score: score,
        embedding: null
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SemanticKeyFileSelector;
}

