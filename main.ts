import {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  IpcMainEvent,
  IpcMainInvokeEvent,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import { TaskORM } from "./src/db/TaskORM";
import { CategoryORM } from "./src/db/CategoryORM";
import { Task } from "./src/types";

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
let taskORM: TaskORM | null = null;
let categoryORM: CategoryORM | null = null;

// 确保数据目录存在
function ensureDataDirectory(): void {
  let dataDir: string;
  if (isDev) {
    // 开发环境下使用项目目录
    dataDir = path.join(__dirname, "data");
  } else {
    // 生产环境下使用用户数据目录
    dataDir = path.join(app.getPath("userData"), "data");
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("数据目录已创建:", dataDir);
  }
}

// 初始化数据库
function initializeDatabase(): void {
  try {
    ensureDataDirectory();
    let dbPath: string;
    if (isDev) {
      // 开发环境下使用项目目录
      dbPath = path.join(__dirname, "data", "pomodoro.db");
    } else {
      // 生产环境下使用用户数据目录
      dbPath = path.join(app.getPath("userData"), "data", "pomodoro.db");
    }

    taskORM = new TaskORM(dbPath);
    categoryORM = new CategoryORM(dbPath);
    console.log("SQLite数据库初始化成功，数据库路径:", dbPath);
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  }
}

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
  let startUrl: string;
  if (isDev) {
    startUrl = "http://localhost:3000";
  } else {
    // 生产环境下，build文件夹在extraResources中
    const buildPath = path.join(process.resourcesPath, "build", "index.html");
    startUrl = `file://${buildPath}`;
  }

  console.log("Loading URL:", startUrl);
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
app.whenReady().then(() => {
  initializeDatabase();
  createWindow();
});

// 当所有窗口都关闭时退出应用
app.on("window-all-closed", () => {
  if (taskORM) {
    taskORM.close();
    taskORM = null;
  }
  if (categoryORM) {
    categoryORM.close();
    categoryORM = null;
  }

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

// TaskORM IPC handlers
// 创建任务
ipcMain.handle(
  "task-create",
  async (event: IpcMainInvokeEvent, taskData: Omit<Task, "id">) => {
    try {
      if (!taskORM) throw new Error("数据库未初始化");
      return taskORM.create(taskData);
    } catch (error) {
      console.error("创建任务失败:", error);
      throw error;
    }
  }
);

// 查询所有任务
ipcMain.handle("task-find-all", async (event: IpcMainInvokeEvent) => {
  try {
    if (!taskORM) throw new Error("数据库未初始化");
    return taskORM.findAll();
  } catch (error) {
    console.error("查询任务失败:", error);
    throw error;
  }
});

// 更新任务
ipcMain.handle(
  "task-update",
  async (
    event: IpcMainInvokeEvent,
    id: number,
    taskData: Partial<Omit<Task, "id">>
  ) => {
    try {
      if (!taskORM) throw new Error("数据库未初始化");
      return taskORM.update(id, taskData);
    } catch (error) {
      console.error("更新任务失败:", error);
      throw error;
    }
  }
);

// 删除任务
ipcMain.handle("task-delete", async (event: IpcMainInvokeEvent, id: number) => {
  try {
    if (!taskORM) throw new Error("数据库未初始化");
    return taskORM.delete(id);
  } catch (error) {
    console.error("删除任务失败:", error);
    throw error;
  }
});

// 获取活跃任务（未完成任务 + 今日创建的任务）
ipcMain.handle("task-find-active", async (event: IpcMainInvokeEvent) => {
  try {
    if (!taskORM) throw new Error("数据库未初始化");
    return taskORM.findActiveTasks();
  } catch (error) {
    console.error("查询活跃任务失败:", error);
    throw error;
  }
});

// 获取历史已完成任务（不包括今天）
ipcMain.handle("task-find-history", async (event: IpcMainInvokeEvent) => {
  try {
    if (!taskORM) throw new Error("数据库未初始化");
    return taskORM.findHistoryTasks();
  } catch (error) {
    console.error("查询历史任务失败:", error);
    throw error;
  }
});

// 按时间范围查询任务
ipcMain.handle(
  "task-find-by-date-range",
  async (event: IpcMainInvokeEvent, startDate: string, endDate: string) => {
    try {
      if (!taskORM) throw new Error("数据库未初始化");
      return taskORM.findTasksByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
    } catch (error) {
      console.error("按时间范围查询任务失败:", error);
      throw error;
    }
  }
);

// 获取历史已完成任务（支持时间范围过滤）
ipcMain.handle(
  "task-find-history-in-range",
  async (event: IpcMainInvokeEvent, startDate?: string, endDate?: string) => {
    try {
      if (!taskORM) throw new Error("数据库未初始化");
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      return taskORM.findHistoryTasksInRange(start, end);
    } catch (error) {
      console.error("查询时间范围内的历史任务失败:", error);
      throw error;
    }
  }
);

// CategoryORM IPC handlers
// 查询所有分类
ipcMain.handle("category-find-all", async (event: IpcMainInvokeEvent) => {
  try {
    if (!categoryORM) throw new Error("数据库未初始化");
    return categoryORM.findAll();
  } catch (error) {
    console.error("查询分类失败:", error);
    throw error;
  }
});

// 获取所有分类名称
ipcMain.handle("category-get-all-names", async (event: IpcMainInvokeEvent) => {
  try {
    if (!categoryORM) throw new Error("数据库未初始化");
    return categoryORM.getAllNames();
  } catch (error) {
    console.error("获取分类名称失败:", error);
    throw error;
  }
});

// 添加分类
ipcMain.handle(
  "category-add",
  async (event: IpcMainInvokeEvent, name: string) => {
    try {
      if (!categoryORM) throw new Error("数据库未初始化");
      return categoryORM.addCategory(name);
    } catch (error) {
      console.error("添加分类失败:", error);
      throw error;
    }
  }
);

// 删除分类
ipcMain.handle(
  "category-delete",
  async (event: IpcMainInvokeEvent, name: string) => {
    try {
      if (!categoryORM) throw new Error("数据库未初始化");
      return categoryORM.deleteCategory(name);
    } catch (error) {
      console.error("删除分类失败:", error);
      throw error;
    }
  }
);

// 检查分类是否存在
ipcMain.handle(
  "category-exists",
  async (event: IpcMainInvokeEvent, name: string) => {
    try {
      if (!categoryORM) throw new Error("数据库未初始化");
      return categoryORM.exists(name);
    } catch (error) {
      console.error("检查分类是否存在失败:", error);
      throw error;
    }
  }
);
