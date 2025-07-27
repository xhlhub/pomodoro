# 依赖管理指南

## 概述

由于 Electron 项目的复杂依赖关系和版本兼容性问题，我们采用了自定义的依赖管理策略。

## 当前策略

### 1. 智能 Lock 文件管理

我们采用智能的 `package-lock.json` 管理策略：

- **CI 环境**：创建临时 lock 文件以启用 npm 缓存，但在安装时会被替换
- **本地开发**：可以保留 lock 文件，但如果出现版本冲突会被清理
- **版本控制**：暂时忽略 lock 文件以避免版本冲突

### 2. 自定义安装脚本

使用 `scripts/install-deps.js` 进行多策略依赖安装：

```bash
npm run install:custom
```

#### 安装策略（按顺序尝试）

1. **标准安装**：`npm install --legacy-peer-deps`
2. **清理重装**：清除缓存和旧文件后重新安装
3. **强制安装**：使用 `--force --no-optional --no-audit` 标志
4. **分批安装**：按组件分别安装依赖

### 3. CI/CD 集成

GitHub Actions 工作流自动：

1. 创建临时 lock 文件以启用 npm 缓存
2. 检测并清理不兼容的 lock 文件
3. 使用自定义安装脚本
4. 在失败时提供备选安装方案

## 本地开发

### 首次设置

```bash
# 克隆项目
git clone <repository-url>
cd pomodoro

# 使用自定义安装脚本
npm run install:custom

# 或者手动安装
npm install --legacy-peer-deps
```

### 依赖更新

```bash
# 清理环境
rm -rf node_modules package-lock.json
npm cache clean --force

# 重新安装
npm run install:custom
```

### 问题诊断

如果遇到安装问题：

1. **检查 Node.js 版本**：

   ```bash
   node --version  # 应该是 v20.x.x
   ```

2. **清理所有缓存**：

   ```bash
   rm -rf node_modules package-lock.json .npm
   npm cache clean --force
   ```

3. **使用详细日志**：
   ```bash
   npm install --legacy-peer-deps --verbose
   ```

## 依赖版本策略

### 核心依赖

- **Node.js**: 20.x（避免 18.x 的兼容性问题）
- **Electron**: 28.x（项目指定版本）
- **React**: 18.x（稳定版本）

### 构建工具

- **@electron/rebuild**: 3.7.2（避免 4.x 的 Node.js 22+ 要求）
- **better-sqlite3**: 11.10.0（兼容 Node.js 20）
- **TypeScript**: 4.9.5（稳定版本）

### 类型定义

- **@types/node**: 20.19.9（匹配 Node.js 版本）
- **@types/react**: 18.3.23（匹配 React 版本）
- **@types/react-dom**: 18.3.7（匹配 React DOM 版本）

## 故障排除

### 常见错误

1. **EBADENGINE 错误**

   - 原因：依赖要求的 Node.js 版本不匹配
   - 解决：确保使用 Node.js 20.x

2. **Lock 文件同步错误**

   - 原因：package-lock.json 与 package.json 不匹配
   - 解决：删除 lock 文件，使用自定义安装脚本

3. **网络/镜像问题**
   - 原因：npm 镜像源问题
   - 解决：使用官方 npm 注册表

### 紧急恢复

如果所有方法都失败：

```bash
# 完全清理
rm -rf node_modules package-lock.json .npm .cache
npm cache clean --force

# 手动安装核心依赖
npm install react@18.2.0 react-dom@18.2.0 react-scripts@5.0.1 --legacy-peer-deps
npm install electron@28.0.0 --legacy-peer-deps
npm install @electron/rebuild@3.7.2 --legacy-peer-deps
npm install better-sqlite3@11.10.0 --legacy-peer-deps

# 安装其余依赖
npm install --legacy-peer-deps
```

## 维护建议

1. **定期检查**：每月检查依赖更新和兼容性
2. **测试环境**：在不同的 Node.js 版本下测试
3. **文档更新**：记录任何版本变更和解决方案
4. **CI 监控**：密切关注 CI 构建状态

## 联系支持

如果遇到无法解决的依赖问题，请：

1. 检查 GitHub Actions 构建日志
2. 查看 `BUILD_TROUBLESHOOTING.md`
3. 创建 Issue 并附上详细的错误信息
