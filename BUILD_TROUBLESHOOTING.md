# Electron 构建故障排除指南

## 问题描述

在 GitHub CI 构建过程中，可能遇到以下问题：

1. **Node.js 版本不兼容错误**：

```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@electron/rebuild@4.0.1',
npm warn EBADENGINE   required: { node: '>=22.12.0' },
npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
```

2. **镜像源 SSL 证书错误**：

```
RequestError: Hostname/IP does not match certificate's altnames: Host: npm.taobao.org
```

3. **`@electron/rebuild` 路径错误**：

```
An unhandled error occurred inside electron-rebuild
The "paths[0]" argument must be of type string. Received undefined
```

## 解决方案

### 1. 更新的依赖版本

项目已经更新为使用兼容的依赖版本：

- **Node.js**: 升级到 20.x（从 18.x）
- **@electron/rebuild**: 降级到 3.6.0（从 4.0.1）
- **better-sqlite3**: 降级到 11.0.0（从 12.2.0）
- **@types/node**: 降级到 20.x（从 24.x）
- **@types/react**: 降级到 18.x（从 19.x）

### 2. 本地开发环境

如果你在本地遇到类似问题，请按以下步骤操作：

```bash
# 确保使用 Node.js 20+
node --version  # 应该显示 v20.x.x

# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重建原生依赖
npm run rebuild

# 如果上面的命令失败，尝试自定义重建脚本
npm run rebuild:custom

# 验证安装
node -e "console.log('better-sqlite3:', require.resolve('better-sqlite3'))"
```

### 3. CI/CD 环境

项目已经配置了以下解决方案：

#### 主要构建流程

1. 使用 Node.js 20
2. 安装依赖：`npm ci`
3. 如果失败，使用 `npm install --legacy-peer-deps`
4. 安装应用依赖：`npm run postinstall`
5. 重建原生模块：`npm run rebuild`

#### 备选重建流程

如果主要流程失败，会自动尝试自定义重建脚本：`npm run rebuild:custom`

### 4. 配置文件说明

#### `.npmrc`

- 使用官方 npm 注册表避免镜像问题
- 设置了正确的 Electron 运行时信息

#### `package.json` 脚本

- `postinstall`: 只安装应用依赖
- `rebuild`: 使用 `@electron/rebuild` 重建原生模块
- `rebuild:custom`: 使用自定义脚本重建（更可靠）

#### `scripts/rebuild.js`

- 自定义重建脚本，提供更详细的错误信息
- 自动提取并清理 Electron 版本号
- 多重重建策略和错误恢复

### 5. 常见问题

#### Q: 为什么需要降级依赖版本？

A: 新版本的 `@electron/rebuild` 和其他依赖要求 Node.js 22+，但为了兼容性我们使用 Node.js 20。

#### Q: 如何解决镜像源证书错误？

A: 项目已配置使用官方 npm 注册表，避免使用有证书问题的镜像源。

#### Q: 如何验证重建是否成功？

A: 运行以下命令检查：

```bash
# 检查 better-sqlite3
node -e "console.log('better-sqlite3:', require.resolve('better-sqlite3'))"

# 检查 Electron
npx electron --version
```

#### Q: 如果所有方法都失败了怎么办？

A: 可以尝试以下步骤：

```bash
# 完全清理
rm -rf node_modules package-lock.json .cache

# 使用 legacy peer deps 安装
npm install --legacy-peer-deps

# 手动重建
npx electron-rebuild
```

### 6. 环境要求

- **Node.js**: 20.x 或更高版本
- **Python**: 3.x (用于编译 `better-sqlite3`)
- **足够的磁盘空间**用于编译和缓存

### 7. 版本兼容性矩阵

| 组件     | 推荐版本 | 最低版本 | 注意事项         |
| -------- | -------- | -------- | ---------------- |
| Node.js  | 20.x     | 20.0.0   | 避免使用 18.x    |
| npm      | 10.x     | 9.0.0    | 随 Node.js 安装  |
| Python   | 3.11     | 3.8      | 用于编译原生模块 |
| Electron | 28.x     | 28.0.0   | 项目指定版本     |

### 8. 调试信息

在 CI 构建过程中，会输出详细的调试信息：

- Node.js 和 npm 版本
- Python 版本
- 当前工作目录
- 文件列表
- Electron 相关模块状态
- better-sqlite3 安装验证

如果问题仍然存在，请检查这些调试信息以获取更多线索。
