# Mac 应用构建指南

## 概述

本指南说明如何为 Apple Silicon (M1/M2) 和 Intel 芯片的 Mac 构建带圆角图标的安装包。

## 前置要求

- macOS 系统（需要 sips 和 iconutil 工具）
- Node.js 和 npm
- 已安装项目依赖

## 快速构建

### 方法 1：使用专用脚本（推荐）

```bash
npm run build:mac
```

这个脚本会自动：

1. 生成不同尺寸的图标
2. 转换为 ICNS 格式（支持圆角）
3. 构建 React 应用
4. 编译 Electron 主进程
5. 打包为 DMG 和 ZIP 格式

### 方法 2：手动构建

```bash
# 1. 构建 React 应用
npm run react-build

# 2. 编译主进程
npm run compile-main

# 3. 打包
npx electron-builder --mac
```

## 架构支持

- **x64**: Intel Mac
- **arm64**: Apple Silicon (M1/M2) Mac

## 图标格式

- 使用 `icon.icns` 格式（Mac 原生格式）
- 自动生成多种尺寸：16x16, 32x32, 128x128, 256x256, 512x512
- 支持 Retina 显示器的 @2x 版本
- **圆角效果**: ICNS 格式自动应用 macOS 的圆角样式

## 输出文件

构建完成后，文件位于 `output/` 目录：

- `Pomodoro for Her-1.1.5-arm64.dmg` - Apple Silicon 安装包
- `Pomodoro for Her-1.1.5-x64.dmg` - Intel Mac 安装包
- `Pomodoro for Her-1.1.5-arm64.zip` - Apple Silicon 压缩包
- `Pomodoro for Her-1.1.5-x64.zip` - Intel Mac 压缩包

## 故障排除

### 图标不显示圆角

- 确保使用 `icon.icns` 格式
- 检查 `build/` 目录中是否有 `icon.icns` 文件

### 构建失败

- 运行 `npm install` 确保依赖完整
- 检查 `build/entitlements.mac.plist` 文件是否存在
- 确保有足够的磁盘空间

### 代码签名问题

- 当前配置为开发模式，无需开发者证书
- 如需发布到 App Store，需要配置相应的证书和描述文件

## 技术细节

### 图标生成

使用 macOS 内置工具：

- `sips`: 图像尺寸调整
- `iconutil`: 转换为 ICNS 格式

### 权限配置

`build/entitlements.mac.plist` 包含应用所需的权限：

- JIT 编译支持
- 网络访问
- 文件读写权限

### 构建配置

`package.json` 中的 `build.mac` 配置：

- 支持多架构
- 启用硬化运行时
- 配置权限文件
