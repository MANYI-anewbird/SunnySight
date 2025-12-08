# 文件结构说明

## 📁 目录结构

```
SunnySight/
├── core/                    # 核心功能模块
│   ├── api.js              # API 服务层（GitHub & OpenAI）
│   ├── analyzer.js         # 仓库分析器
│   └── content.js          # Content Script
│
├── ui/                      # 用户界面
│   ├── popup.html          # 主弹窗页面
│   ├── popup.js            # 弹窗逻辑
│   ├── settings.html       # 设置页面
│   ├── settings.js         # 设置逻辑
│   └── styles.css          # 全局样式
│
├── dashboard/               # Dashboard 系统
│   ├── dashboard.html      # Dashboard 主页面
│   ├── dashboard.js        # Dashboard 服务
│   ├── dashboard-init.js   # Dashboard 初始化
│   ├── dashboard-renderer.js
│   ├── dashboard-simple-renderer.js
│   ├── dashboard-view-switcher.js
│   └── renderers/          # 各种视图渲染器
│       ├── architecture-view-renderer.js
│       ├── security-review-renderer.js
│       ├── security-view-renderer.js
│       ├── pipeline-view-renderer.js
│       ├── overview-renderer.js
│       ├── enhanced-features-renderer.js
│       └── pr-review-view-renderer.js
│
├── utils/                   # 工具类
│   ├── deep-code-scanner.js      # 深度代码扫描
│   └── SemanticKeyFileSelector.js # 语义文件选择器
│
├── legacy/                  # 旧文件（保留但不使用）
│   ├── architecture-ui.html
│   ├── architecture-ui.js
│   ├── usecases-ui.html
│   ├── usecases-ui.js
│   ├── dependencies-ui.html
│   └── dependencies-ui.js
│
├── docs/                    # 文档
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── LICENSE
│   └── ... (其他文档)
│
├── scripts/                 # 工具脚本
│   ├── package-extension.sh
│   └── generate-icons.html
│
├── icons/                   # 图标资源
│
└── manifest.json            # Chrome Extension 配置（必须在根目录）
```

## 🔗 路径引用说明

### manifest.json
- `default_popup`: `ui/popup.html`
- `options_page`: `ui/settings.html`
- `content_scripts`: `core/content.js`
- `web_accessible_resources`: 所有需要访问的资源路径

### HTML 文件中的引用
- `popup.html`: 使用相对路径 `../core/`, `../utils/`, `../dashboard/`
- `settings.html`: 使用相对路径 `styles.css`, `settings.js`
- `dashboard.html`: 使用相对路径 `../core/`, `renderers/`

### JavaScript 文件中的引用
- 使用 `chrome.runtime.getURL()` 时，路径相对于扩展根目录
- 例如：`chrome.runtime.getURL('dashboard/dashboard.html')`

## 📝 注意事项

1. **manifest.json 必须在根目录**（Chrome Extension 要求）
2. **所有路径引用已更新**，确保扩展正常工作
3. **legacy 文件夹**包含旧文件，保留但不使用
4. **docs 文件夹**包含所有文档，保持根目录整洁

