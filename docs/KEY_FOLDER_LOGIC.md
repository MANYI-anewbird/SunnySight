# Key Folder 和 Key File 识别逻辑说明

## 📁 核心文件位置

**主要逻辑在：`api.js` 文件中的 `identifyKeyFolders()` 函数（第 272-425 行）**

## 🔍 识别流程

### 1. 代码文件定义（第 278 行）

```javascript
const codeExtensions = ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.hpp', '.rb', '.php', '.swift', '.kt', '.scala', '.clj', '.r', '.m', '.mm'];
```

**支持的代码文件类型：**
- Python: `.py`
- JavaScript/TypeScript: `.js`, `.ts`, `.jsx`, `.tsx`
- Java: `.java`
- Go: `.go`
- Rust: `.rs`
- C/C++: `.cpp`, `.c`, `.h`, `.hpp`
- Ruby: `.rb`
- PHP: `.php`
- Swift: `.swift`
- Kotlin: `.kt`
- Scala: `.scala`
- Clojure: `.clj`
- R: `.r`
- Objective-C: `.m`, `.mm`

### 2. 排除的文件（第 279 行）

```javascript
const excludeFiles = ['readme.md', 'readme.txt', 'readme', 'license', 'changelog.md', 'contributing.md', '.md', '.txt'];
```

**自动排除：**
- README 文件
- LICENSE 文件
- 所有 `.md` 和 `.txt` 文档文件

### 3. 重要目录定义（第 282-291 行）

```javascript
const highImportanceDirs = [
  'src/', 'app/', 'backend/', 'frontend/', 'core/', 'models/',
  'cloud_functions/', 'cloud-functions/', 'functions/', 'lambda/',
  'airflow/', 'dags/', 'pipelines/', 'pipeline/',
  'notebooks/', 'notebook/', 'jupyter/',
  'streamlit_app/', 'streamlit/', 'app/',
  'services/', 'api/', 'apis/', 'server/',
  'lib/', 'library/', 'libraries/',
  'components/', 'modules/', 'utils/', 'utilities/'
];
```

**高重要性目录包括：**
- 通用：`src/`, `app/`, `core/`, `models/`
- 云函数：`cloud_functions/`, `cloud-functions/`, `functions/`, `lambda/`
- 数据管道：`airflow/`, `dags/`, `pipelines/`, `pipeline/`
- 笔记本：`notebooks/`, `notebook/`, `jupyter/`
- 前端：`streamlit_app/`, `streamlit/`, `frontend/`
- 后端：`backend/`, `services/`, `api/`, `apis/`, `server/`
- 库：`lib/`, `library/`, `libraries/`
- 组件：`components/`, `modules/`, `utils/`, `utilities/`

### 4. 低重要性目录（第 292 行）

```javascript
const lowImportanceDirs = ['docs/', 'samples/', 'test/', 'tests/', '__tests__/', 'static/', 'images/', 'screenshots/', 'assets/', 'examples/', 'demo/'];
```

**自动跳过：**
- 文档目录：`docs/`
- 测试目录：`test/`, `tests/`, `__tests__/`
- 静态资源：`static/`, `images/`, `screenshots/`, `assets/`
- 示例：`samples/`, `examples/`, `demo/`

## 📊 评分系统

### 文件评分（第 350-402 行）

1. **目录重要性** (+4 分)
   - 如果文件在高重要性目录中

2. **嵌套目录加分** (+3 分)
   - 如果文件在重要目录的子目录中

3. **文件类型重要性**
   - 入口文件（`main.py`, `app.py`, `index.js`, `main.js`）：+5 分
   - 其他代码文件：+2 分

4. **内容分析** (+2 分)
   - 如果文件包含 `def `, `class `, `function ` 等代码结构

### 文件夹评分（第 415-421 行）

```javascript
folder.score += folder.files[0].score;  // 最高分文件
if (folder.files.length > 1) {
  folder.score += folder.files[1].score * 0.5;  // 第二高分文件（权重 0.5）
}
```

**文件夹评分 = 最高分文件 + 第二高分文件 × 0.5**

## 🎯 选择逻辑（第 422-425 行）

```javascript
// Sort folders by score
foldersWithCode.sort((a, b) => b.score - a.score);

// Return top 3-5 folders
return foldersWithCode.slice(0, 5).map(folder => ({
  path: folder.path,
  name: folder.name,
  keyFiles: folder.files.slice(0, 2).map(f => f.path) // Top 1-2 files per folder
}));
```

**最终返回：**
- 最多 5 个文件夹（按评分排序）
- 每个文件夹包含 1-2 个最重要的文件

## 🔄 递归获取逻辑（analyzer.js 第 168-200 行）

**递归深度：最多 5 级**

```javascript
const recursivelyFetchDir = async (dirPath, dirName, maxDepth = 5, currentDepth = 0) => {
  // 递归获取所有子目录中的文件
}
```

**支持的目录结构：**
- `folder/file.py` ✅
- `folder/subfolder/file.py` ✅
- `folder/sub1/sub2/file.py` ✅
- `folder/sub1/sub2/sub3/sub4/file.py` ✅ (最多 5 级)

## ⚠️ 常见问题

### 为什么某些文件夹识别不出来？

1. **文件夹内没有代码文件**
   - 只有配置文件、文档、测试文件等
   - 解决方案：检查文件夹内是否有 `.py`, `.js` 等代码文件

2. **文件夹名称不匹配**
   - 文件夹名称不在 `highImportanceDirs` 列表中
   - 解决方案：添加新的目录模式到 `highImportanceDirs`

3. **文件在太深的目录中**
   - 超过 5 级深度
   - 解决方案：增加 `maxDepth` 参数（目前是 5）

4. **文件被排除**
   - 文件扩展名不在 `codeExtensions` 中
   - 解决方案：添加新的文件扩展名

5. **文件夹评分太低**
   - 虽然有代码文件，但评分不够高，没有进入 top 5
   - 解决方案：优化评分逻辑或增加返回数量

## 🛠️ 如何调试

1. **检查文件结构**
   - 在 `analyzer.js` 中打印 `allFiles` 查看获取到的所有文件

2. **检查文件夹映射**
   - 在 `identifyKeyFolders()` 中打印 `folderMap` 查看文件夹分组

3. **检查评分**
   - 打印 `foldersWithCode` 查看每个文件夹的评分

4. **检查最终结果**
   - 打印返回的 `candidateKeyFolders` 查看最终选择的文件夹

