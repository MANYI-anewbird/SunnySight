# 合并两个独立仓库的指南

## 📋 当前情况

- **你的仓库**：当前这个（包含你的所有更改）
- **队友的仓库**：队友复制的基础版本，在此基础上添加了新功能

## 🔀 合并策略

### 方案 A：添加队友的仓库作为 remote（推荐）

这是最安全和可控的方法。

#### 步骤 1：获取队友的仓库地址

询问队友他的 GitHub 仓库地址，例如：
- `https://github.com/teammate-username/SunnySight.git`
- 或者 `git@github.com:teammate-username/SunnySight.git`

#### 步骤 2：添加队友的仓库作为 remote

```bash
# 添加队友的仓库，命名为 teammate
git remote add teammate https://github.com/teammate-username/SunnySight.git

# 或者如果是 SSH
git remote add teammate git@github.com:teammate-username/SunnySight.git

# 验证添加成功
git remote -v
```

#### 步骤 3：拉取队友的更改

```bash
# 获取队友仓库的所有分支和提交
git fetch teammate

# 查看队友的 main 分支（或他的主分支名）
git log teammate/main --oneline -10
```

#### 步骤 4：对比差异

```bash
# 查看队友添加了哪些文件
git diff main teammate/main --name-status

# 查看具体文件差异
git diff main teammate/main -- popup.html
git diff main teammate/main -- popup.js
```

#### 步骤 5：选择性合并

**选项 1：合并队友的特定文件**

```bash
# 只合并队友的独立页面文件（如果这些文件在你的仓库中不存在）
git checkout teammate/main -- architecture-ui.html
git checkout teammate/main -- architecture-ui.js
git checkout teammate/main -- usecases-ui.html
git checkout teammate/main -- usecases-ui.js
git checkout teammate/main -- dependencies-ui.html
git checkout teammate/main -- dependencies-ui.js

# 提交这些文件
git add architecture-ui.* usecases-ui.* dependencies-ui.*
git commit -m "Add teammate's independent UI pages"
```

**选项 2：查看队友对现有文件的修改**

```bash
# 查看队友修改了哪些现有文件
git diff main teammate/main --stat

# 查看队友对 popup.js 的修改
git diff main teammate/main -- popup.js > teammate_changes.patch

# 查看差异文件
cat teammate_changes.patch
```

#### 步骤 6：手动合并冲突部分

如果队友修改了你也修改过的文件：

1. **查看队友的更改**：
   ```bash
   git show teammate/main:popup.js > teammate_popup.js
   ```

2. **对比两个版本**：
   - 你的版本：当前 `popup.js`
   - 队友的版本：`teammate_popup.js`
   - 使用 diff 工具或 IDE 对比

3. **手动合并**：
   - 保留你的内部视图系统
   - 添加队友的独立页面相关代码（如果有新功能）
   - 确保两者不冲突

### 方案 B：让队友提交 Pull Request

如果队友有 GitHub 仓库，可以：

1. 队友 fork 你的仓库
2. 队友在他的 fork 上添加他的更改
3. 队友提交 Pull Request 到你的仓库
4. 你在 GitHub 上审查和合并

### 方案 C：手动复制文件（简单但容易出错）

如果队友的更改不多：

1. 让队友把他的更改文件发给你（或通过其他方式分享）
2. 手动对比和合并
3. 测试功能

## 🎯 推荐操作流程

### 1. 先备份你的代码

```bash
# 创建备份分支
git branch backup-before-merge
git checkout -b merge-teammate-changes
```

### 2. 添加队友的仓库

```bash
# 替换为队友的实际仓库地址
git remote add teammate [队友的仓库地址]
git fetch teammate
```

### 3. 查看队友做了什么

```bash
# 查看队友添加的新文件
git log teammate/main --name-status --oneline

# 查看队友修改的文件
git diff main teammate/main --name-only
```

### 4. 合并策略

**对于新文件**（队友添加的独立页面）：
- ✅ 直接合并，这些文件不会冲突

**对于修改的文件**（你们都改过的）：
- 需要手动对比和合并
- 优先保留你的实现（内部视图系统）
- 如果队友有特殊功能，选择性添加

### 5. 具体合并步骤

```bash
# 假设队友的主分支是 main，你的也是 main

# 1. 查看队友添加了哪些新文件
git diff main teammate/main --diff-filter=A --name-only

# 2. 如果队友添加了独立页面文件，直接合并
git checkout teammate/main -- architecture-ui.html architecture-ui.js
git checkout teammate/main -- usecases-ui.html usecases-ui.js  
git checkout teammate/main -- dependencies-ui.html dependencies-ui.js

# 3. 检查 manifest.json 是否需要更新
git diff main teammate/main -- manifest.json

# 4. 对于 popup.js 和 popup.html，需要手动合并
# 使用你的 IDE 或 diff 工具对比
```

## ⚠️ 注意事项

1. **不要直接 merge**：两个独立仓库直接 merge 会产生很多冲突
2. **选择性合并**：只合并需要的部分
3. **保留你的实现**：你的内部视图系统应该保留
4. **测试合并结果**：合并后一定要测试所有功能

## 🔍 快速检查清单

- [ ] 获取队友的仓库地址
- [ ] 添加队友仓库作为 remote
- [ ] 查看队友的更改列表
- [ ] 识别新文件和修改的文件
- [ ] 合并新文件（独立页面）
- [ ] 手动合并修改的文件
- [ ] 测试所有功能
- [ ] 提交合并结果

## 💡 如果遇到问题

如果合并过程中遇到困难，可以：

1. **使用 GitHub 的对比功能**：
   - 在 GitHub 上对比两个仓库
   - 手动复制需要的代码

2. **分步合并**：
   - 先合并独立页面文件
   - 再处理冲突文件
   - 最后测试

3. **寻求帮助**：
   - 让队友说明他具体改了什么
   - 一起讨论合并策略

