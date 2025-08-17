#!/bin/bash

echo "🚀 开始构建通用Mac应用 (Apple Silicon + Intel)..."

# 检查依赖
if ! command -v sips &> /dev/null; then
    echo "❌ 错误: 需要sips工具 (macOS自带)"
    exit 1
fi

if ! command -v iconutil &> /dev/null; then
    echo "❌ 错误: 需要iconutil工具 (macOS自带)"
    exit 1
fi

# 创建构建目录
echo "📁 创建构建目录..."
mkdir -p build/icon.iconset

# 生成不同尺寸的图标
echo "🎨 生成图标文件..."
sips -z 16 16 icon.png --out build/icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out build/icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out build/icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out build/icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out build/icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out build/icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out build/icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out build/icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out build/icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out build/icon.iconset/icon_512x512@2x.png

# 转换为ICNS格式
echo "🔄 转换为ICNS格式..."
iconutil -c icns build/icon.iconset -o build/icon.icns

# 清理临时文件
echo "🧹 清理临时文件..."
rm -rf build/icon.iconset

# 构建应用
echo "🔨 构建应用..."
npm run react-build
npm run compile-main

# 创建通用二进制文件
echo "🔧 创建通用二进制文件..."

# 先构建x64版本
echo "📦 构建x64版本..."
npx electron-builder --mac --x64

# 再构建arm64版本
echo "📦 构建arm64版本..."
npx electron-builder --mac --arm64

# 创建通用版本 (Universal Binary)
echo "🔗 创建通用版本..."
mkdir -p output/universal
cp -r "output/mac/Pomodoro for Her.app" "output/universal/Pomodoro for Her.app"

# 使用lipo创建通用二进制文件
echo "🔗 合并架构..."
lipo -create \
  "output/mac/Pomodoro for Her.app/Contents/MacOS/Pomodoro for Her" \
  "output/mac-arm64/Pomodoro for Her.app/Contents/MacOS/Pomodoro for Her" \
  -output "output/universal/Pomodoro for Her.app/Contents/MacOS/Pomodoro for Her"

# 复制arm64的Frameworks
echo "📁 复制Frameworks..."
cp -r "output/mac-arm64/Pomodoro for Her.app/Contents/Frameworks/Electron Framework.framework" \
  "output/universal/Pomodoro for Her.app/Contents/Frameworks/"

# 创建通用DMG
echo "📦 创建通用DMG..."
npx electron-builder --mac --universal

echo "✅ 通用Mac应用构建完成！"
echo "📁 输出文件位于: output/ 目录"
echo "🔍 通用版本位于: output/universal/ 目录"
echo ""
echo "💡 如果遇到'已损坏'错误，请运行以下命令："
echo "   sudo xattr -rd com.apple.quarantine '/Applications/Pomodoro for Her.app'" 