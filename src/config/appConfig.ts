// 应用配置管理
// 通过 IPC 从主进程获取配置，如果获取失败则使用默认值

// 配置接口定义
interface AppConfig {
  POMODORO_DURATION_MINUTES: number;
  BREAK_DURATION_MINUTES: number;
  LONG_BREAK_DURATION_MINUTES: number;
}

// Electron IPC接口
interface ElectronIPC {
  ipcRenderer?: {
    sendSync: (channel: string, ...args: any[]) => any;
    send: (channel: string, ...args: any[]) => void;
  };
}

const electron: ElectronIPC = window.require ? window.require('electron') : { ipcRenderer: undefined };
const { ipcRenderer } = electron;

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  POMODORO_DURATION_MINUTES: 25,
  BREAK_DURATION_MINUTES: 5,
  LONG_BREAK_DURATION_MINUTES: 15
};

// 从主进程获取配置
let appConfig: AppConfig = DEFAULT_CONFIG;

if (ipcRenderer) {
  try {
    // 同步获取配置
    const config = ipcRenderer.sendSync('get-app-config');
    appConfig = config || DEFAULT_CONFIG;
  } catch (error) {
    console.warn('无法从主进程获取配置，使用默认值:', error);
    appConfig = DEFAULT_CONFIG;
  }
}

// 导出配置常量
export const POMODORO_DURATION_MINUTES: number = appConfig.POMODORO_DURATION_MINUTES;
export const POMODORO_DURATION_SECONDS: number = POMODORO_DURATION_MINUTES * 60;
export const BREAK_DURATION_MINUTES: number = appConfig.BREAK_DURATION_MINUTES;
export const LONG_BREAK_DURATION_MINUTES: number = appConfig.LONG_BREAK_DURATION_MINUTES;

// 导出配置对象供其他用途
export default appConfig; 