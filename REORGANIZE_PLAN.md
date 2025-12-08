# 文件重组计划

## 📁 建议的文件夹结构

```
SunnySight/
├── core/                    # 核心功能
│   ├── api.js              # API 服务层
│   ├── analyzer.js         # 分析器
│   └── content.js          # Content script
│
├── ui/                      # 用户界面
│   ├── popup.html          # 主弹窗
│   ├── popup.js            # 弹窗逻辑
│   ├── settings.html       # 设置页面
│   ├── settings.js         # 设置逻辑
│   └── styles.css          # 样式文件
│
├── dashboard/               # Dashboard 系统
│   ├── dashboard.html      # Dashboard 主页面
│   ├── dashboard.js        # Dashboard 服务
│   ├── dashboard-init.js   # 初始化
│   ├── dashboard-renderer.js
│   ├── dashboard-simple-renderer.js
│   ├── dashboard-view-switcher.js
│   └── renderers/          # 渲染器
│       ├── architecture-view-renderer.js
│       ├── security-review-renderer.js
│       ├── security-view-renderer.js
│       ├── pipeline-view-renderer.js
│       ├── overview-renderer.js
│       ├── enhanced-features-renderer.js
│       └── pr-review-view-renderer.js
│
├── utils/                   # 工具类
│   ├── deep-code-scanner.js
│   └── SemanticKeyFileSelector.js
│
├── legacy/                  # 旧文件（如果不再使用）
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
│   ├── PRIVACY_POLICY.md
│   ├── STORE_DESCRIPTION.md
│   ├── CHROME_EXTENSION_GUIDE.md
│   ├── DOCUMENTATION_CHECKLIST.md
│   ├── FILE_STRUCTURE_ANALYSIS.md
│   ├── KEY_FOLDER_LOGIC.md
│   ├── MERGE_GUIDE.md
│   ├── MERGE_PLAN.md
│   ├── MERGE_STEPS.md
│   ├── MERGE_TWO_REPOS.md
│   └── TEAMMATE_CHANGES_ANALYSIS.md
│
├── scripts/                 # 工具脚本
│   ├── package-extension.sh
│   └── generate-icons.html
│
├── icons/                   # 图标（已存在）
│
├── manifest.json            # 扩展配置（必须在根目录）
└── .gitignore
```

## ⚠️ 注意事项

1. **manifest.json 必须在根目录**（Chrome Extension 要求）
2. **所有路径引用需要更新**：
   - manifest.json 中的路径
   - HTML 文件中的 script 和 link 标签
   - JS 文件中的 import/require

## 🔄 执行步骤

1. 创建文件夹结构
2. 移动文件到对应文件夹
3. 更新所有路径引用
4. 测试扩展功能
5. 提交更改

