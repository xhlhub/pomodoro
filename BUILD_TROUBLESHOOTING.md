# Electron 构建故障排除指南

## 问题描述

在 GitHub CI 构建过程中，`@electron/rebuild` 命令可能会失败，出现以下错误：

```
An unhandled error occurred inside electron-rebuild
The "paths[0]" argument must be of type string. Received undefined
```

## 解决方案

### 1. 本地开发环境

如果你在本地遇到类似问题，请按以下步骤操作：

```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重建原生依赖
npm run rebuild

# 如果上面的命令失败，尝试自定义重建脚本
npm run rebuild:custom
```

### 2. CI/CD 环境

项目已经配置了以下解决方案：

#### 主要重建流程

1. 安装依赖：`npm ci`
2. 安装应用依赖：`npm run postinstall`
3. 重建原生模块：`npm run rebuild`

#### 备选重建流程

如果主要流程失败，会自动尝试自定义重建脚本：`npm run rebuild:custom`

### 3. 配置文件说明

#### `.npmrc`

- 配置了 Electron 镜像源
- 设置了正确的运行时和版本信息

#### `package.json` 脚本

- `postinstall`: 自动安装应用依赖并重建原生模块
- `rebuild`: 使用 `@electron/rebuild` 重建原生模块
- `rebuild:custom`: 使用自定义脚本重建（更可靠）

#### `scripts/rebuild.js`

- 自定义重建脚本，提供更详细的错误信息
- 自动检测 Electron 版本
- 验证 `better-sqlite3` 安装

### 4. 常见问题

#### Q: 为什么会出现这个错误？

A: 这个错误通常是由于 `@electron/rebuild` 无法找到正确的 Electron 路径或版本信息导致的。

#### Q: 如何验证重建是否成功？

A: 运行以下命令检查 `better-sqlite3` 是否正确安装：

```bash
node -e "console.log('better-sqlite3 path:', require.resolve('better-sqlite3'))"
```

#### Q: 如果所有方法都失败了怎么办？

A: 可以尝试手动指定 Electron 版本：

```bash
npx @electron/rebuild --version 28.0.0 --only-deps
```

### 5. 环境要求

- Node.js 18+
- Python 3.x (用于编译 `better-sqlite3`)
- 足够的磁盘空间用于编译

### 6. 调试信息

在 CI 构建过程中，会输出详细的调试信息：

- Node.js 和 NPM 版本
- 当前工作目录
- 文件列表
- Electron 相关模块状态

如果问题仍然存在，请检查这些调试信息以获取更多线索。
