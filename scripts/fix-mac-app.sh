#!/bin/bash

echo "🔧 Mac应用修复工具"
echo "=================="

APP_NAME="Pomodoro for Her.app"
APP_PATH="/Applications/$APP_NAME"

echo "正在检查应用状态..."

# 检查应用是否存在于应用程序文件夹
if [ ! -d "$APP_PATH" ]; then
    echo "❌ 错误: 应用 '$APP_NAME' 未在应用程序文件夹中找到"
    echo "请先将应用拖到应用程序文件夹，然后重新运行此脚本"
    exit 1
fi

echo "✅ 找到应用: $APP_PATH"

# 检查隔离属性
echo "🔍 检查隔离属性..."
if xattr -l "$APP_PATH" | grep -q "com.apple.quarantine"; then
    echo "⚠️  发现隔离属性，正在移除..."
    sudo xattr -rd com.apple.quarantine "$APP_PATH"
    echo "✅ 隔离属性已移除"
else
    echo "✅ 未发现隔离属性"
fi

# 检查代码签名
echo "🔍 检查代码签名..."
if codesign -dv "$APP_PATH" 2>&1 | grep -q "not signed"; then
    echo "⚠️  应用未签名，这是正常的（开发版本）"
else
    echo "✅ 应用已签名"
fi

# 检查架构
echo "🔍 检查应用架构..."
if file "$APP_PATH/Contents/MacOS/$APP_NAME" | grep -q "arm64"; then
    echo "✅ 支持 Apple Silicon (M1/M2)"
fi
if file "$APP_PATH/Contents/MacOS/$APP_NAME" | grep -q "x86_64"; then
    echo "✅ 支持 Intel Mac"
fi

echo ""
echo "🎯 修复完成！现在请尝试打开应用："
echo "   1. 在应用程序文件夹中双击应用图标"
echo "   2. 或者在终端运行: open '$APP_PATH'"
echo ""
echo "💡 如果仍然无法打开，请尝试："
echo "   - 重启电脑"
echo "   - 检查系统偏好设置 > 安全性与隐私"
echo "   - 右键点击应用 > 打开" 