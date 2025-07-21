# 番茄钟时间配置说明 - 统一配置版本

## ✅ 现在只需要修改一个文件！

现在采用了**统一配置管理**，所有时间设置都在一个地方定义！

### 📍 统一配置文件
文件: `main.js`
```javascript
// 应用配置 - 统一配置源
const APP_CONFIG = {
  POMODORO_DURATION_MINUTES: 25,     // 番茄钟时长
  BREAK_DURATION_MINUTES: 5,         // 短休息时长  
  LONG_BREAK_DURATION_MINUTES: 15    // 长休息时长
};
```

## 🔧 如何修改时间

### 将番茄钟改为10秒（用于测试）
```javascript
const APP_CONFIG = {
  POMODORO_DURATION_MINUTES: 10/60,  // 10秒 = 10/60分钟
  // ... 其他配置
};
```

### 将番茄钟改为30分钟
```javascript
const APP_CONFIG = {
  POMODORO_DURATION_MINUTES: 30,
  // ... 其他配置
};
```

### 自定义所有时间
```javascript
const APP_CONFIG = {
  POMODORO_DURATION_MINUTES: 25,     // 番茄钟25分钟
  BREAK_DURATION_MINUTES: 10,        // 短休息10分钟
  LONG_BREAK_DURATION_MINUTES: 30    // 长休息30分钟
};
```

## 🏗️ 技术原理

### 配置传递流程：
1. **main.js** 定义 `APP_CONFIG` 对象
2. 通过 **IPC通信** 传递给渲染进程
3. **React组件** 从 `src/config/appConfig.js` 获取配置
4. 如果IPC失败，使用默认值确保应用正常运行

### 优势：
- ✅ **真正的单一配置源** - 只需修改 main.js
- ✅ **自动同步** - 主进程和渲染进程使用相同配置
- ✅ **容错处理** - IPC失败时有默认值兜底
- ✅ **类型安全** - 避免了手动同步可能的错误

## 🔄 修改后如何生效

1. 修改 `main.js` 中的 `APP_CONFIG`
2. 重启应用程序 (`npm start`)
3. 所有功能自动使用新的时间设置

## 📁 相关文件

- `main.js` - 配置定义和IPC处理
- `src/config/appConfig.js` - React组件配置接口
- 所有React组件自动获取最新配置

**🎯 现在真正做到了"改一处，全更新"！** 