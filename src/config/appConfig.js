// 应用配置管理
// 通过 IPC 从主进程获取配置，如果获取失败则使用默认值

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

// 默认配置
const DEFAULT_CONFIG = {
  POMODORO_DURATION_MINUTES: 25,
  BREAK_DURATION_MINUTES: 5,
  LONG_BREAK_DURATION_MINUTES: 15
};

// 从主进程获取配置
let appConfig = DEFAULT_CONFIG;

if (ipcRenderer) {
  try {
    // 同步获取配置
    appConfig = ipcRenderer.sendSync('get-app-config') || DEFAULT_CONFIG;
  } catch (error) {
    console.warn('无法从主进程获取配置，使用默认值:', error);
    appConfig = DEFAULT_CONFIG;
  }
}

// 导出配置常量
export const POMODORO_DURATION_MINUTES = appConfig.POMODORO_DURATION_MINUTES;
export const POMODORO_DURATION_SECONDS = POMODORO_DURATION_MINUTES * 60;
export const BREAK_DURATION_MINUTES = appConfig.BREAK_DURATION_MINUTES;
export const LONG_BREAK_DURATION_MINUTES = appConfig.LONG_BREAK_DURATION_MINUTES;

// 导出配置对象供其他用途
export default appConfig; 