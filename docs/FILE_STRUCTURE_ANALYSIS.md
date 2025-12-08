# 📁 SunnySight 文件结构分析

## 🎯 整体架构

这个 Chrome 扩展采用**分层架构**，主要分为以下几个层次：

```
用户交互层 (UI)
    ↓
业务逻辑层 (Orchestration)
    ↓
API 服务层 (Data Fetching)
    ↓
外部服务 (GitHub API + OpenAI API)
```

---

## 📂 核心文件详解

### 1. **manifest.json** - 扩展配置文件
**作用：** Chrome 扩展的"身份证"，告诉 Chrome 这个扩展是什么、需要什么权限、有哪些文件

**关键配置：**
- `default_popup: "popup.html"` - 点击扩展图标时显示的页面
- `content_scripts` - 在 GitHub 页面上注入的脚本（content.js）
- `host_permissions` - 允许访问 GitHub 和 OpenAI API
- `permissions` - 需要的浏览器权限（存储、下载等）

---

### 2. **popup.html** - 主界面
**作用：** 用户点击扩展图标后看到的界面

**包含内容：**
- 加载状态显示
- 错误提示
- 6 个功能模块的展示区域
- 3 个 A2UI 详细视图容器（Architecture、Use Cases、Dependencies）

**关键元素：**
- `#loading` - 分析进行中的加载界面
- `#content` - 分析结果的主内容区
- `#architecture-view` - 架构详细视图
- `#usecases-view` - 用例详细视图
- `#dependencies-view` - 依赖详细视图

---

### 3. **popup.js** - 主业务逻辑控制器 ⭐
**作用：** 整个扩展的"大脑"，协调所有功能

**主要流程：**

```
用户打开扩展
    ↓
popup.js 启动 (DOMContentLoaded)
    ↓
startAnalysis() - 从 URL 提取仓库信息
    ↓
startAnalysisForRepo() - 调用分析器
    ↓
repoAnalyzer.analyzeRepository() - 执行分析
    ↓
displayAnalysis() - 显示结果
```

**关键函数：**
- `startAnalysis()` - 入口函数，获取当前标签页的 GitHub URL
- `startAnalysisForRepo()` - 启动分析流程
- `displayAnalysis()` - 将分析结果渲染到 UI
- `showA2UIView()` - 切换到详细视图
- `loadA2UIData()` - 加载详细视图数据

---

### 4. **analyzer.js** - 分析协调器 🧠
**作用：** 协调数据收集和 AI 分析，是整个分析流程的"指挥中心"

**核心流程：**

```javascript
analyzeRepository()
    ↓
Step 1: 检查缓存（如果存在且有效，直接返回）
    ↓
Step 2: 并行收集 GitHub 数据（7 个 API 调用同时进行）
    - repoInfo (仓库基本信息)
    - languages (编程语言)
    - readme (README 内容)
    - commits (最近提交)
    - issues (开放的问题)
    - contributors (贡献者)
    - rootContents (文件结构)
    ↓
Step 3: 整理数据，准备发送给 AI
    ↓
Step 4: ⭐ 调用 AI 分析 (apiService.analyzeRepoWithAI)
    ↓
Step 5: 组合结果，保存到缓存
    ↓
返回完整的分析结果
```

**关键函数：**
- `analyzeRepository()` - 主分析函数
- `getCachedAnalysis()` - 获取缓存
- `saveToCache()` - 保存到缓存
- `identifyKeyFiles()` - 识别关键文件

---

### 5. **api.js** - API 服务层 🔌
**作用：** 负责与外部 API 通信（GitHub API 和 OpenAI API）

**包含两个主要部分：**

#### A. GitHub API 方法（数据收集）
- `getRepoInfo()` - 获取仓库基本信息
- `getRepoLanguages()` - 获取编程语言统计
- `getReadme()` - 获取 README 内容
- `getCommits()` - 获取最近提交
- `getIssues()` - 获取开放的问题
- `getContributors()` - 获取贡献者列表
- `getRepoContents()` - 获取文件结构

#### B. ⭐ OpenAI API 方法（LLM 分析）- **核心！**

**`analyzeRepoWithAI()` 函数：**

这是**指导 LLM 分析并产生内容的关键步骤**！

```javascript
// 1. 构建 Prompt（提示词）
const prompt = `
  Analyze this GitHub repository...
  Repository: ${name}
  Description: ${description}
  Languages: ${languages}
  ...
  
  Please provide a JSON response with the following structure:
  {
    "summary": "...",
    "keyFiles": [...],
    "pipeline": "...",
    "useCases": [...],
    "requirements": {...},
    "health": {...}
  }
`;

// 2. 发送请求到 OpenAI API
fetch('https://api.openai.com/v1/chat/completions', {
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are a senior software engineer...'
    },
    {
      role: 'user',
      content: prompt  // ⭐ 这里就是指导 LLM 的提示词
    }
  ]
});

// 3. 解析返回的 JSON
const aiAnalysis = JSON.parse(response);
```

**Prompt 结构：**
1. **输入数据：** 仓库名称、描述、语言、README、文件结构、提交记录等
2. **输出格式：** 要求 LLM 返回特定 JSON 结构
3. **角色设定：** 告诉 LLM 它是"高级软件工程师和技术分析师"
4. **温度设置：** `temperature: 0.3` - 较低温度，更确定性的输出

---

### 6. **content.js** - 内容脚本
**作用：** 在 GitHub 页面上运行，从 DOM 中提取仓库信息（**已弃用，现在主要用 GitHub API**）

**功能：**
- 监听来自 popup 的消息
- 从 GitHub 页面 DOM 中提取仓库信息（owner、repo、stars 等）
- 返回给 popup.js

**注意：** 现在主要使用 GitHub API 获取数据，这个文件基本不再使用。

---

### 7. **settings.html / settings.js** - 设置页面
**作用：** 让用户配置 API Keys

**功能：**
- 输入 OpenAI API Key（必需）
- 输入 GitHub Token（可选，用于提高 API 限制）
- 保存到 Chrome 加密存储

---

### 8. **styles.css** - 样式文件
**作用：** 所有页面的样式定义

**包含：**
- 深色主题配色
- 按钮样式
- 卡片样式
- A2UI 视图样式
- 响应式布局

---

### 9. **A2UI 视图文件**（新增）

#### **architecture-ui.html / architecture-ui.js**
- 显示架构和流水线的详细视图
- 从缓存加载数据并显示

#### **usecases-ui.html / usecases-ui.js**
- 显示用例的详细视图
- 从缓存加载数据并显示

#### **dependencies-ui.html / dependencies-ui.js**
- 显示依赖和环境的详细视图
- 包含 Security 分析部分
- 从缓存加载数据并显示

**注意：** 这些文件现在主要用于独立页面，但在 popup.html 中也有对应的视图容器。

---

## 🔄 完整的数据流程

### 用户操作流程：

```
1. 用户在 GitHub 仓库页面
   ↓
2. 点击扩展图标
   ↓
3. popup.html 打开，popup.js 执行
   ↓
4. popup.js 检测当前标签页 URL
   ↓
5. 提取 owner/repo（如：facebook/react）
   ↓
6. 调用 analyzer.js 的 analyzeRepository()
   ↓
7. analyzer.js 检查缓存
   - 如果有缓存且有效 → 直接返回
   - 如果没有 → 继续
   ↓
8. 并行调用 api.js 的 GitHub API 方法
   - 同时发起 7 个请求获取数据
   ↓
9. 整理收集到的数据
   ↓
10. ⭐ 调用 api.js 的 analyzeRepoWithAI()
    - 构建包含所有数据的 Prompt
    - 发送到 OpenAI API
    - 使用 gpt-4o-mini 模型
    - 返回结构化的 JSON 分析结果
   ↓
11. analyzer.js 组合结果
   ↓
12. 保存到 Chrome 本地存储（缓存）
   ↓
13. 返回给 popup.js
   ↓
14. popup.js 的 displayAnalysis() 渲染结果
   ↓
15. 用户看到 6 个功能模块的分析结果
```

---

## 🎯 LLM 分析的关键步骤

### **核心位置：`api.js` 的 `analyzeRepoWithAI()` 函数**

**第 279-329 行：构建 Prompt**

```javascript
const prompt = `Analyze this GitHub repository and provide a comprehensive technical analysis.

Repository: ${name}
Description: ${description || 'No description'}
Languages: ${JSON.stringify(languages)}
Stars: ${stars}, Forks: ${forks}
...

Please provide a JSON response with the following structure:
{
  "summary": "...",
  "keyFiles": [...],
  "pipeline": "...",
  "useCases": [...],
  "requirements": {...},
  "health": {...}
}`;
```

**第 331-353 行：发送到 OpenAI**

```javascript
fetch(`${this.openaiBaseURL}/chat/completions`, {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a senior software engineer...'
      },
      {
        role: 'user',
        content: prompt  // ⭐ 这里传入 Prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  })
});
```

**第 360-371 行：解析返回结果**

```javascript
const data = await response.json();
const content = data.choices[0].message.content;
// 清理 JSON（移除 markdown 代码块）
let jsonContent = content.trim();
if (jsonContent.startsWith('```json')) {
  jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
}
return JSON.parse(jsonContent);  // ⭐ 返回解析后的 JSON
```

---

## 📊 数据流向图

```
GitHub Repository
    ↓
[GitHub API] (api.js)
    ↓
Raw Data (repoInfo, languages, readme, commits, etc.)
    ↓
[analyzer.js] - 整理数据
    ↓
Structured Data (repoData object)
    ↓
[api.js - analyzeRepoWithAI] ⭐ LLM 分析
    ↓
Prompt (包含所有数据 + 输出格式要求)
    ↓
[OpenAI API] (gpt-4o-mini)
    ↓
AI Analysis (JSON)
    ↓
[analyzer.js] - 组合结果
    ↓
Final Analysis Object
    ↓
[Chrome Storage] - 缓存
    ↓
[popup.js] - 显示
    ↓
User Interface
```

---

## 🔑 关键概念

### 1. **缓存机制**
- 分析结果保存 24 小时
- 如果仓库有更新（pushed_at 变化），缓存失效
- 避免重复调用 API，节省成本

### 2. **并行请求**
- 7 个 GitHub API 请求同时发起
- 使用 `Promise.all()` 提高速度

### 3. **重试机制**
- API 调用失败时自动重试（最多 3 次）
- 指数退避策略（1s, 2s, 4s）

### 4. **错误处理**
- 每个步骤都有 try-catch
- 用户友好的错误提示

---

## 🎨 UI 层次结构

```
popup.html
├── Header (标题和按钮)
├── Loading (加载中)
├── Error (错误提示)
├── Content (主内容)
│   ├── Repository Summary
│   ├── Key Files
│   ├── Architecture & Pipeline [Show Details 按钮]
│   ├── Use Cases [Show Details 按钮]
│   ├── Dependencies & Environment [Security 按钮]
│   └── Repository Health
├── Architecture View (详细视图)
├── Use Cases View (详细视图)
└── Dependencies View (详细视图 + Security)
```

---

## 💡 总结

**LLM 分析的核心步骤：**

1. **数据收集** (`api.js` - GitHub API 方法)
2. **数据整理** (`analyzer.js` - 整理成 repoData)
3. **⭐ Prompt 构建** (`api.js` - `analyzeRepoWithAI()` 第 279-329 行)
4. **⭐ 发送到 OpenAI** (`api.js` - 第 331-353 行)
5. **⭐ 解析结果** (`api.js` - 第 360-371 行)
6. **结果组合** (`analyzer.js` - 第 164-208 行)
7. **显示结果** (`popup.js` - `displayAnalysis()`)

**最重要的文件：**
- `api.js` - 包含 LLM 分析的核心逻辑
- `analyzer.js` - 协调整个分析流程
- `popup.js` - 用户界面和交互逻辑

