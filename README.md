# 🚀 Sunnysett Hub - AI-Powered GitHub Repository Analyzer

A powerful Chrome extension that provides deep technical insights into GitHub repositories using AI analysis. Understand repositories faster, identify key files, assess health, and avoid common pain points.

## ✨ 6 Killer Features

### 1. 📋 AI Repo Summary
Get a clear, concise 2-3 sentence summary of what the repository does and its main purpose - instantly understand any codebase.

### 2. 🔑 Key File Highlighter
Discover the real core of the repository. Identifies critical files like `package.json`, `Dockerfile`, main entry points, and configuration files with explanations of their importance.

### 3. 🏗️ Architecture & Pipeline Explanation
Understand how the system works end-to-end. Get detailed explanations of the architecture, data flow, and key components.

### 4. 💡 Smart Use-Case Recommendations
Answer "What should I do with this repo?" with specific, actionable use cases tailored to the repository's purpose.

### 5. 📦 Dependency & Environment Auditor
Avoid installation hell. Get comprehensive information about:
- Required dependencies
- Environment setup (Node version, Python version, etc.)
- Installation steps and gotchas
- Compatibility warnings

### 6. 🏥 Repository Health Check
Is it active, risky, or outdated? Get a health score (0-100) with:
- Maintenance status assessment
- Activity indicators
- Risk factors and concerns
- Overall health status

## 🚀 Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/MANYI-anewbird/Sunnysett-Hub.git
   cd Sunnysett-Hub
   ```

2. **Load the extension in Chrome**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `Sunnysett-Hub` directory

3. **Configure API Keys** (Required)
   - Click the extension icon
   - Click "Settings" or right-click the extension → Options
   - Enter your **OpenAI API key** (required)
   - Optionally enter your **GitHub Personal Access Token** (for higher rate limits)
   - Click "Save Settings"

   **Getting API Keys:**
   - **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **GitHub Token** (optional): Create at [GitHub Settings](https://github.com/settings/tokens) - no special permissions needed

## 📖 Usage

1. Visit any GitHub repository page (e.g., `https://github.com/owner/repo`)
2. Click the Sunnysett Hub extension icon in your browser toolbar
3. Wait 10-20 seconds for AI analysis to complete
4. Review all 6 features in the popup:
   - Repository summary
   - Key files with explanations
   - Architecture overview
   - Use case recommendations
   - Dependency requirements
   - Health assessment

## 🏗️ Project Structure

```
Sunnysett-Hub/
├── manifest.json       # Chrome extension configuration
├── popup.html          # Main popup interface
├── popup.js            # Popup logic and UI
├── api.js              # GitHub & OpenAI API service layer
├── analyzer.js         # Repository analysis orchestrator
├── content.js          # Content script (legacy DOM extraction)
├── settings.html       # Settings page for API keys
├── settings.js         # Settings page logic
├── styles.css          # Styling for all pages
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## 🔧 Technical Details

- **Manifest V3**: Uses the latest Chrome extension API
- **GitHub REST API**: Fetches comprehensive repository data
- **OpenAI API**: Powers AI analysis (GPT-4o-mini for cost efficiency)
- **Chrome Storage API**: Securely stores API keys
- **Parallel API Calls**: Optimized data fetching for speed

## 🔒 Security & Privacy

- API keys are stored locally in Chrome's encrypted storage
- No data is sent to third-party servers except:
  - GitHub API (for repository data)
  - OpenAI API (for analysis)
- All processing happens in your browser
- API keys never leave your device

## 💡 Use Cases

**For Developers:**
- Quickly understand unfamiliar codebases
- Assess if a library is worth using
- Identify potential integration issues
- Learn from well-architected projects

**For Project Managers:**
- Evaluate repository health and maintenance
- Assess technical debt and risks
- Make informed decisions about dependencies

**For Code Reviewers:**
- Get context before diving into code
- Understand architecture before reviewing PRs
- Identify critical files to focus on

## 🐛 Troubleshooting

**"OpenAI API key not configured"**
- Go to Settings and add your OpenAI API key
- Make sure the key starts with `sk-`

**"GitHub API error"**
- The repository might be private (requires GitHub token)
- Check your internet connection
- Verify the repository URL is correct

**"Analysis failed"**
- Check your OpenAI API key is valid
- Ensure you have API credits available
- Try refreshing the page and analyzing again

**Slow analysis**
- First analysis may take 15-20 seconds
- Subsequent analyses are faster due to caching
- Consider using a GitHub token for better rate limits

## 🚧 Limitations

- Requires OpenAI API key (costs apply per analysis)
- Analysis time: 10-20 seconds per repository
- Rate limits apply (GitHub: 60 requests/hour without token, 5000/hour with token)
- Private repositories require GitHub token

## 🔮 Future Enhancements

- [ ] Cache analysis results
- [ ] Compare multiple repositories
- [ ] Export analysis as PDF/JSON
- [ ] Support for GitLab and Bitbucket
- [ ] Custom analysis prompts
- [ ] Batch repository analysis

## 📝 Development

To modify or extend functionality:

1. **Add new analysis features**: Modify `analyzer.js`
2. **Change API calls**: Update `api.js`
3. **Modify UI**: Edit `popup.html` and `styles.css`
4. **Update prompts**: Modify the prompt in `api.js` → `analyzeRepoWithAI()`
5. **Reload extension**: Click "Reload" in `chrome://extensions/`

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with GitHub REST API
- Powered by OpenAI GPT models
- Icons from Icons8

---

**Made with ❤️ to solve real developer pain points**
