import { Task } from '../types';
import { getCurrentDateString } from '../utils/dateUtils';

export class TaskLocalStorageORM {
  private storageKey = 'pomodoro-tasks';

  constructor() {
    // 确保数据目录存在（localStorage不需要）
    this.initializeStorage();
  }

  /**
   * 初始化存储
   */
  private initializeStorage(): void {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  /**
   * 获取所有任务
   */
  private getAllTasks(): Task[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 保存所有任务
   */
  private saveAllTasks(tasks: Task[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  /**
   * 创建新任务
   */
  create(taskData: Omit<Task, 'id'>): Task {
    try {
      const tasks = this.getAllTasks();
      const newTask: Task = {
        id: Date.now(),
        ...taskData,
        category: taskData.category || '生活',
        completed: taskData.completed || false,
        pomodoroCount: taskData.pomodoroCount || 0,
        timeSpent: taskData.timeSpent || 0,
        progress: taskData.progress || 0,
        date: taskData.date || getCurrentDateString(),
        createdAt: taskData.createdAt || new Date().toISOString()
      };

      tasks.unshift(newTask); // 添加到开头
      this.saveAllTasks(tasks);

      console.log('任务创建成功:', newTask);
      return newTask;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  }

  /**
   * 查询所有任务
   */
  findAll(): Task[] {
    try {
      const tasks = this.getAllTasks();
      // 按创建时间倒序排列
      return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('查询所有任务失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务（支持所有字段除了id）
   */
  update(id: number, taskData: Partial<Omit<Task, 'id'>>): boolean {
    try {
      const tasks = this.getAllTasks();
      const taskIndex = tasks.findIndex(task => task.id === id);
      
      if (taskIndex === -1) {
        console.warn('任务不存在:', id);
        return false;
      }

      // 合并更新数据
      tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
      this.saveAllTasks(tasks);

      console.log('任务更新成功:', id);
      return true;
    } catch (error) {
      console.error('更新任务失败:', error);
      throw error;
    }
  }

  /**
   * 删除任务
   */
  delete(id: number): boolean {
    try {
      const tasks = this.getAllTasks();
      const filteredTasks = tasks.filter(task => task.id !== id);
      
      if (filteredTasks.length === tasks.length) {
        console.warn('任务不存在:', id);
        return false;
      }

      this.saveAllTasks(filteredTasks);
      console.log('任务删除成功:', id);
      return true;
    } catch (error) {
      console.error('删除任务失败:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接（localStorage不需要）
   */
  close(): void {
    console.log('LocalStorage连接已关闭');
  }
}

// 导出单例实例
let taskORM: TaskLocalStorageORM | null = null;

export const getTaskORM = (): TaskLocalStorageORM => {
  if (!taskORM) {
    taskORM = new TaskLocalStorageORM();
  }
  return taskORM;
};

export const closeTaskORM = (): void => {
  if (taskORM) {
    taskORM.close();
    taskORM = null;
  }
}; 