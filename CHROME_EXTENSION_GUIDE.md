# Chrome Extension Development Guide

A comprehensive guide to understanding Chrome extension structure, required documents, and folder organization.

## 📁 Standard Folder Structure

```
your-extension/
├── manifest.json          # Core configuration file (REQUIRED)
├── icons/                 # Extension icons folder
│   ├── icon16.png         # 16x16 pixels
│   ├── icon48.png         # 48x48 pixels
│   └── icon128.png        # 128x128 pixels
├── popup.html             # Popup interface (if using popup)
├── popup.js               # Popup logic
├── popup.css              # Popup styles
├── content.js             # Content script (injected into web pages)
├── background.js          # Background service worker (Manifest V3)
├── options.html           # Options page (optional)
├── options.js             # Options page logic (optional)
├── styles.css             # Global styles (if needed)
├── images/               # Image assets (optional)
├── README.md              # Project documentation
├── LICENSE                # License file
├── PRIVACY_POLICY.md      # Privacy policy (required for store)
└── CHANGELOG.md           # Version history (optional)
```

## 📄 Core Files Explained

### 1. manifest.json (REQUIRED)
**Purpose:** The configuration file that defines your extension

**Contains:**
- Extension name, version, description
- Permissions requested
- Files to load (scripts, HTML, CSS)
- Icons and assets
- Content scripts configuration
- Background scripts configuration

**Example structure:**
```json
{
  "manifest_version": 3,
  "name": "Your Extension Name",
  "version": "1.0.0",
  "description": "What your extension does",
  "permissions": ["activeTab"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [...],
  "background": {...},
  "icons": {...}
}
```

**Why it's needed:** Chrome uses this file to understand what your extension does and what permissions it needs.

---

### 2. Icons Folder (REQUIRED)
**Purpose:** Visual representation of your extension

**Files needed:**
- `icon16.png` - Toolbar icon
- `icon48.png` - Extension management page
- `icon128.png` - Chrome Web Store listing

**Why it's needed:** Users see these icons in the browser toolbar, extension management page, and Chrome Web Store.

---

### 3. Popup Files (Optional but common)
**Purpose:** Interface shown when user clicks extension icon

**Files:**
- `popup.html` - Structure of the popup
- `popup.js` - Logic and functionality
- `popup.css` or `styles.css` - Styling

**Why it's needed:** Provides user interface for interacting with your extension.

---

### 4. Content Scripts (Optional)
**Purpose:** JavaScript that runs in the context of web pages

**File:** `content.js` (or any name you choose)

**What it does:**
- Can read and modify the DOM of web pages
- Runs in isolated environment (can't access page's JavaScript variables)
- Can communicate with background scripts and popup

**Why it's needed:** Allows your extension to interact with web page content.

---

### 5. Background Script (Optional)
**Purpose:** Service worker that runs in the background

**File:** `background.js` (Manifest V3) or `background.html` (Manifest V2)

**What it does:**
- Handles events (browser startup, tab updates, etc.)
- Can make network requests
- Manages extension state
- Coordinates between different parts of extension

**Why it's needed:** For functionality that needs to run independently of web pages.

---

### 6. Options Page (Optional)
**Purpose:** Settings page for your extension

**Files:**
- `options.html` - Settings page structure
- `options.js` - Settings logic

**Why it's needed:** Allows users to configure extension settings.

---

## 📚 Documentation Files

### 1. README.md (Recommended)
**Purpose:** Project documentation for developers and users

**Contains:**
- Project description
- Installation instructions
- Usage guide
- Development setup
- Feature list
- Troubleshooting

**Why it's needed:** Helps others understand and use your extension.

---

### 2. LICENSE (Recommended)
**Purpose:** Defines how others can use your code

**Common types:**
- MIT License (permissive, most common)
- Apache 2.0
- GPL (copyleft)
- Proprietary (all rights reserved)

**Why it's needed:** 
- Required if you want others to use your code
- Shows you understand open-source licensing
- Some platforms require it

---

### 3. PRIVACY_POLICY.md (REQUIRED for Chrome Web Store)
**Purpose:** Explains data collection and usage

**Must include:**
- What data is collected (if any)
- How data is used
- Data storage practices
- Third-party services
- User rights

**Why it's needed:**
- Chrome Web Store requires it if extension requests permissions
- Even if you don't collect data, you need a privacy policy
- Must be publicly accessible via HTTPS URL

**Where to host:**
- GitHub (recommended - free and easy)
- Your own website
- Any public HTTPS URL

---

### 4. CHANGELOG.md (Optional but recommended)
**Purpose:** Tracks version history and changes

**Format:**
```
## [1.0.0] - 2024-01-01
### Added
- New feature X
### Fixed
- Bug Y
```

**Why it's needed:**
- Users can see what changed in each version
- Helps with debugging
- Professional practice

---

## 🎯 Chrome Web Store Submission Requirements

### Required Files:
1. ✅ **manifest.json** - Extension configuration
2. ✅ **Icons** - At least 128x128, but 16, 48, 128 recommended
3. ✅ **Privacy Policy** - Public HTTPS URL (can be on GitHub)

### Required Information:
1. **Extension Details:**
   - Name
   - Short description (132 characters max)
   - Detailed description
   - Category
   - Language

2. **Store Assets:**
   - Screenshots (at least 1, up to 5)
     - Size: 1280x800 or 640x400 pixels
   - Promotional images
     - Large: 1280x800 pixels
     - Small: 440x280 pixels
   - Icon: 128x128 pixels minimum

3. **Links:**
   - Privacy Policy URL (required)
   - Support URL (optional but recommended)
   - Homepage URL (optional)

### Optional but Recommended:
- README.md
- LICENSE
- CHANGELOG.md
- Support email/contact

---

## 📦 Package Structure for Submission

When submitting to Chrome Web Store, you need to create a ZIP file containing:

```
your-extension.zip
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup.html
├── popup.js
├── content.js
├── background.js
├── styles.css
└── (any other files your extension needs)
```

**Do NOT include:**
- README.md (not needed in package, but good to have in repo)
- LICENSE (not needed in package, but good to have in repo)
- PRIVACY_POLICY.md (hosted separately, not in package)
- .git files
- node_modules
- Development files

---

## 🔍 File Purpose Summary

| File/Folder | Required? | Purpose | Used By |
|------------|-----------|---------|---------|
| manifest.json | ✅ Yes | Extension configuration | Chrome |
| icons/ | ✅ Yes | Visual representation | Chrome, Store |
| popup.html/js | Optional | User interface | Users |
| content.js | Optional | Page interaction | Web pages |
| background.js | Optional | Background tasks | Extension |
| options.html | Optional | Settings page | Users |
| README.md | Recommended | Documentation | Developers |
| LICENSE | Recommended | Legal terms | Developers |
| PRIVACY_POLICY.md | ✅ Store | Data policy | Store, Users |
| CHANGELOG.md | Optional | Version history | Users |

---

## 🎓 Learning Points

### 1. Manifest V3 vs V2
- **V3 (Current):** Uses service workers, more secure, required for new extensions
- **V2 (Deprecated):** Uses background pages, being phased out

### 2. Permissions
- Request only what you need
- Users see permission requests
- More permissions = lower trust

### 3. Content Security Policy (CSP)
- Extensions have strict CSP
- Can't use inline scripts
- Must use external files or specific methods

### 4. Extension Types
- **Browser Action:** Toolbar button with popup
- **Page Action:** Button that appears on specific pages
- **Content Script:** Runs on web pages
- **Background:** Runs independently

### 5. Communication
- **Message Passing:** Between popup, content, and background
- **Storage API:** For saving data
- **Chrome APIs:** For browser functionality

---

## 📝 Quick Checklist

### For Development:
- [ ] manifest.json configured
- [ ] Icons created (16, 48, 128)
- [ ] Core functionality implemented
- [ ] Tested in Chrome
- [ ] README.md written

### For Chrome Web Store:
- [ ] Privacy Policy created and hosted
- [ ] Store description written
- [ ] Screenshots prepared
- [ ] Promotional images created
- [ ] Extension packaged (ZIP)
- [ ] All required fields filled
- [ ] Extension tested thoroughly

---

## 🔗 Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Extension Examples](https://github.com/GoogleChrome/chrome-extensions-samples)

---

## 💡 Best Practices

1. **Keep it simple:** Start with minimal permissions
2. **Test thoroughly:** Test on different pages and scenarios
3. **User privacy:** Be transparent about data collection
4. **Error handling:** Handle errors gracefully
5. **Performance:** Keep extension lightweight
6. **Documentation:** Write clear README and comments
7. **Version control:** Use Git for your project
8. **Updates:** Maintain CHANGELOG for users

---

This guide covers the essential knowledge for creating and publishing Chrome extensions. Each file and folder has a specific purpose in the extension ecosystem.

