# SQLite升级指南

## 当前架构
- 渲染进程：React组件 → LocalStorageORM → localStorage
- 数据存储：浏览器localStorage

## 目标架构
- 渲染进程：React组件 → IPC调用 → 主进程
- 主进程：TaskORM → better-sqlite3 → 数据库文件

## 升级步骤

### 1. 修改主进程 (main.ts)
```typescript
import { ipcMain } from 'electron';
import { TaskORM } from './src/db/TaskORM';
import { CategoryORM } from './src/db/CategoryORM';

const taskORM = new TaskORM();
const categoryORM = new CategoryORM();

// 任务相关IPC处理
ipcMain.handle('task:findAll', () => taskORM.findAll());
ipcMain.handle('task:create', (_, taskData) => taskORM.create(taskData));
ipcMain.handle('task:update', (_, id, data) => taskORM.update(id, data));
ipcMain.handle('task:delete', (_, id) => taskORM.delete(id));

// 分类相关IPC处理
ipcMain.handle('category:findAll', () => categoryORM.findAll());
ipcMain.handle('category:add', (_, name) => categoryORM.addCategory(name));
ipcMain.handle('category:delete', (_, name) => categoryORM.deleteCategory(name));
```

### 2. 创建IPC服务层
```typescript
// src/services/ipcService.ts
export class IPCTaskService {
  private ipc = window.require('electron').ipcRenderer;

  async findAll() {
    return this.ipc.invoke('task:findAll');
  }

  async create(taskData: Omit<Task, 'id'>) {
    return this.ipc.invoke('task:create', taskData);
  }

  async update(id: number, data: Partial<Omit<Task, 'id'>>) {
    return this.ipc.invoke('task:update', id, data);
  }

  async delete(id: number) {
    return this.ipc.invoke('task:delete', id);
  }
}
```

### 3. 更新Hook
```typescript
// src/hooks/useTaskORM.ts
import { IPCTaskService } from '../services/ipcService';

export const useTaskORM = () => {
  const taskService = new IPCTaskService();
  
  const createTask = useCallback(async (taskData) => {
    const newTask = await taskService.create(taskData);
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);
  
  // ... 其他方法
};
```

### 4. 数据迁移
```typescript
// 一次性数据迁移脚本
const migrateFromLocalStorage = async () => {
  const tasksData = localStorage.getItem('pomodoro-tasks');
  const categoriesData = localStorage.getItem('pomodoro-categories');
  
  if (tasksData) {
    const tasks = JSON.parse(tasksData);
    for (const task of tasks) {
      await ipcRenderer.invoke('task:create', task);
    }
    localStorage.removeItem('pomodoro-tasks');
  }
  
  if (categoriesData) {
    const categories = JSON.parse(categoriesData);
    for (const category of categories) {
      await ipcRenderer.invoke('category:add', category.name);
    }
    localStorage.removeItem('pomodoro-categories');
  }
};
```

## 配置文件更新

### package.json
```json
{
  "build": {
    "files": [
      "dist/main.js",
      "build/**/*",
      "data/**/*",  // 添加数据库文件
      "audio/**/*",
      "icon.ico",
      "package.json"
    ]
  }
}
```

## 优势对比

| 特性 | LocalStorage | SQLite |
|------|-------------|--------|
| 数据大小 | ~5-10MB | 几乎无限制 |
| 查询性能 | 简单 | 高效索引和查询 |
| 数据完整性 | 基础 | ACID事务 |
| 并发处理 | 有限 | 优秀 |
| 复杂查询 | 困难 | SQL支持 |
| 开发复杂度 | 低 | 中等 | 