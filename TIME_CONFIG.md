# 番茄钟时间配置说明

## 如何修改番茄钟时间

要修改番茄钟的时长，你需要在两个文件中更新相同的数值：

### 1. React 组件配置
文件: `src/utils/constants.js`
```javascript
export const POMODORO_DURATION_MINUTES = 25; // 修改这个数值
```

### 2. Electron 主进程配置  
文件: `main.js`
```javascript
const POMODORO_DURATION_MINUTES = 25; // 修改这个数值（保持与上面相同）
```

## 示例修改

### 将番茄钟改为10秒（用于测试）
1. 在 `src/utils/constants.js` 中：
```javascript
export const POMODORO_DURATION_MINUTES = 10/60; // 10秒 = 10/60分钟
```

2. 在 `main.js` 中：
```javascript
const POMODORO_DURATION_MINUTES = 10/60; // 保持相同
```

### 将番茄钟改为30分钟
1. 在 `src/utils/constants.js` 中：
```javascript
export const POMODORO_DURATION_MINUTES = 30;
```

2. 在 `main.js` 中：
```javascript
const POMODORO_DURATION_MINUTES = 30;
```

## 重要提示

⚠️ **请确保两个文件中的数值保持一致**，否则：
- 计时器显示的时间与通知消息中的时间可能不匹配
- 统计数据可能出现错误

## 其他可配置的时间

在 `src/utils/constants.js` 中还可以配置：
- `BREAK_DURATION_MINUTES` - 短休息时长
- `LONG_BREAK_DURATION_MINUTES` - 长休息时长

修改后重启应用即可生效！ 