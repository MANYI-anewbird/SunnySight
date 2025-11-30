# GitHub Repo Analyzer - Chrome Extension

A Chrome browser extension for analyzing GitHub repository information.

## Features

- 📊 Automatically extracts detailed information from GitHub repositories
- ⭐ Displays statistics like Stars, Forks, Watching, etc.
- 💻 Shows programming language, License, and other information
- 🏷️ Displays repository Topics tags
- 📝 Checks if README file exists
- 🔄 Shows Issues and Pull Requests count
- 🕐 Displays last commit time

## Installation

1. **Download or clone this project**
   ```bash
   git clone https://github.com/MANYI-anewbird/Sunnysett-Hub.git
   cd Sunnysett-Hub
   ```

2. **Prepare icon files**
   - Place the following icon files in the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - If you don't have icons, you can use online tools to generate them, or use placeholder images

3. **Load the extension in Chrome**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the project directory

## Usage

1. Visit any GitHub repository page (e.g., `https://github.com/owner/repo`)
2. Click the extension icon in the browser toolbar
3. The extension will automatically analyze and display detailed information about the repository

## Project Structure

```
Sunnysett-Hub/
├── manifest.json      # Chrome extension configuration file
├── popup.html         # Popup interface
├── popup.js           # Popup logic
├── content.js         # Content script (extracts page information)
├── styles.css         # Stylesheet
├── icons/             # Icons folder
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # Documentation
```

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension API
- **Content Script**: Injected into GitHub pages to extract information
- **Popup**: Popup interface displayed when clicking the extension icon
- **Message Passing**: Uses Chrome messaging API to communicate between popup and content script

## Extracted Information

- Repository Owner
- Repository Name
- Repository Description
- Stars count
- Forks count
- Watching count
- Primary programming language
- License information
- Topics tags
- Issues count
- Pull Requests count
- Last commit time
- README file existence

## Notes

- Make sure to use this extension on GitHub repository pages
- If the page structure changes, you may need to update the selectors in content.js
- Refresh the GitHub page before first use to ensure the content script is properly injected

## Development

To modify or extend functionality:

1. Modify `content.js` to extract more information
2. Modify `popup.html` and `popup.js` to display new information
3. Modify `styles.css` to adjust the interface style
4. Click "Reload" in `chrome://extensions/` to apply changes

## License

MIT License
