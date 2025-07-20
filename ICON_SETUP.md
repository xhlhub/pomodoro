# 图标设置说明

## 获取应用图标

当前项目中的 `icon.ico` 是一个占位符文件。在打包应用之前，你需要替换为真实的图标文件。

### 方法一：在线转换工具

1. 准备一个高质量的 PNG 或 JPG 图片（推荐 256x256 像素）
2. 访问在线转换工具：
   - https://convertio.co/png-ico/
   - https://www.icoconverter.com/
   - https://favicon.io/favicon-converter/
3. 上传图片并转换为 ICO 格式
4. 下载转换后的文件并重命名为 `icon.ico`
5. 替换项目中的 `icon.ico` 文件

### 方法二：使用设计工具

1. 使用 Photoshop、GIMP 或 Figma 等工具
2. 创建 256x256 像素的图标
3. 导出为 ICO 格式
4. 替换项目中的 `icon.ico` 文件

### 方法三：下载免费图标

1. 访问图标网站：
   - https://www.flaticon.com/
   - https://icons8.com/
   - https://www.iconfinder.com/
2. 搜索 "tomato"、"pomodoro" 或 "timer" 相关图标
3. 下载 ICO 格式文件
4. 重命名为 `icon.ico` 并替换项目中的文件

## 图标要求

- **格式**: ICO
- **尺寸**: 256x256 像素（推荐）
- **文件大小**: 小于 1MB
- **背景**: 透明或白色背景

## 验证图标

替换图标后，运行以下命令验证：

```bash
npm start
```

如果应用正常启动并显示图标，说明设置成功。

## 打包测试

设置好图标后，可以测试打包：

```bash
npm run dist
```

打包完成后，检查 `dist` 目录中的安装包是否包含正确的图标。
