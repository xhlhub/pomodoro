import { app, BrowserWindow, ipcMain, Notification, IpcMainEvent } from "electron";
import * as path from "path";

const isDev: boolean = !app.isPackaged;

// 应用配置接口
interface AppConfig {
  POMODORO_DURATION_MINUTES: number;
  BREAK_DURATION_MINUTES: number;
  LONG_BREAK_DURATION_MINUTES: number;
}

// 应用配置 - 统一配置源
const APP_CONFIG: AppConfig = {
  POMODORO_DURATION_MINUTES: 25,
  BREAK_DURATION_MINUTES: 5,
  LONG_BREAK_DURATION_MINUTES: 15,
};

// 向下兼容
const POMODORO_DURATION_MINUTES: number = APP_CONFIG.POMODORO_DURATION_MINUTES;

let mainWindow: BrowserWindow | null;

function createWindow(): void {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // 允许加载本地资源
    },
    icon: path.join(__dirname, "icon.ico"),
    title: "Pomodoro for Her",
    show: false,
  });

  // 根据环境加载不同的URL
  const startUrl: string = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;

  mainWindow.loadURL(startUrl);

  // 开发模式下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 当窗口准备好显示时显示窗口
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // 当窗口关闭时触发
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都关闭时退出应用
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 处理番茄钟完成通知
ipcMain.on("pomodoro-complete", (event: IpcMainEvent, taskName: string) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: "番茄钟完成！",
      body: `任务 "${taskName}" 的番茄钟时间到了，休息一下吧！`,
      icon: path.join(__dirname, "icon.ico"),
      silent: false,
    });

    notification.show();

    // 5秒后自动关闭通知
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
});

// 处理配置请求 - 让渲染进程获取配置
ipcMain.on("get-app-config", (event: IpcMainEvent) => {
  event.returnValue = APP_CONFIG;
});

// 处理番茄钟开始通知
ipcMain.on("pomodoro-start", (event: IpcMainEvent, taskName: string) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: "番茄钟开始！",
      body: `开始专注任务 "${taskName}"，${POMODORO_DURATION_MINUTES}分钟后见！`,
      icon: path.join(__dirname, "icon.ico"),
      silent: false,
    });

    notification.show();

    // 3秒后自动关闭通知
    setTimeout(() => {
      notification.close();
    }, 3000);
  }
}); 