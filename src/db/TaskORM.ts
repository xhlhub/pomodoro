import Database from 'better-sqlite3';
import path from 'path';
import { Task } from '../types';
import { getCurrentDateString } from '../utils/dateUtils';

export class TaskORM {
  private db: Database.Database;
  private insertStmt!: Database.Statement;
  private updateStmt!: Database.Statement;
  private deleteStmt!: Database.Statement;
  private selectAllStmt!: Database.Statement;
  private selectByIdStmt!: Database.Statement;
  private selectByCategoryStmt!: Database.Statement;
  private selectByDateStmt!: Database.Statement;
  private updateProgressStmt!: Database.Statement;
  private updatePomodoroCountStmt!: Database.Statement;
  private updateTimeSpentStmt!: Database.Statement;
  private markCompletedStmt!: Database.Statement;

  constructor(dbPath?: string) {
    // 默认数据库路径
    const defaultPath = path.join(process.cwd(), 'data', 'pomodoro.db');
    this.db = new Database(dbPath || defaultPath);
    
    // 启用外键约束
    this.db.pragma('foreign_keys = ON');
    
    // 初始化数据库表
    this.initializeDatabase();
    
    // 预编译SQL语句以提高性能
    this.prepareStatements();
  }

  /**
   * 初始化数据库表结构
   */
  private initializeDatabase(): void {
    // 创建tasks表
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '生活',
        completed BOOLEAN NOT NULL DEFAULT 0,
        pomodoro_count INTEGER NOT NULL DEFAULT 0,
        time_spent INTEGER NOT NULL DEFAULT 0,
        progress INTEGER NOT NULL DEFAULT 0,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建分类表（可选，用于管理分类）
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建索引以提高查询性能
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)'
    ];

    try {
      this.db.exec(createTasksTable);
      this.db.exec(createCategoriesTable);
      
      createIndexes.forEach(index => {
        this.db.exec(index);
      });

      // 初始化默认分类
      this.initializeDefaultCategories();
      
      console.log('数据库表初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化默认分类
   */
  private initializeDefaultCategories(): void {
    const insertCategory = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    const defaultCategories = ['生活', '工作'];
    
    defaultCategories.forEach(category => {
      insertCategory.run(category);
    });
  }

  /**
   * 预编译SQL语句
   */
  private prepareStatements(): void {
    this.insertStmt = this.db.prepare(`
      INSERT INTO tasks (name, category, completed, pomodoro_count, time_spent, progress, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.updateStmt = this.db.prepare(`
      UPDATE tasks 
      SET name = ?, category = ?, completed = ?, pomodoro_count = ?, 
          time_spent = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    this.deleteStmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    
    this.selectAllStmt = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    
    this.selectByIdStmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    
    this.selectByCategoryStmt = this.db.prepare('SELECT * FROM tasks WHERE category = ? ORDER BY created_at DESC');
    
    this.selectByDateStmt = this.db.prepare('SELECT * FROM tasks WHERE date = ? ORDER BY created_at DESC');

    this.updateProgressStmt = this.db.prepare(`
      UPDATE tasks 
      SET progress = ?, completed = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    this.updatePomodoroCountStmt = this.db.prepare(`
      UPDATE tasks 
      SET pomodoro_count = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    this.updateTimeSpentStmt = this.db.prepare(`
      UPDATE tasks 
      SET time_spent = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    this.markCompletedStmt = this.db.prepare(`
      UPDATE tasks 
      SET completed = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
  }

  /**
   * 数据库行转换为Task对象
   */
  private rowToTask(row: any): Task {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      completed: Boolean(row.completed),
      pomodoroCount: row.pomodoro_count,
      timeSpent: row.time_spent,
      progress: row.progress,
      date: row.date,
      createdAt: row.created_at
    };
  }

  /**
   * 创建新任务
   */
  create(taskData: Omit<Task, 'id'>): Task {
    try {
      const result = this.insertStmt.run(
        taskData.name,
        taskData.category || '生活',
        taskData.completed ? 1 : 0,
        taskData.pomodoroCount || 0,
        taskData.timeSpent || 0,
        taskData.progress || 0,
        taskData.date || getCurrentDateString(),
        taskData.createdAt || new Date().toISOString()
      );

      const newTask: Task = {
        id: Number(result.lastInsertRowid),
        ...taskData,
        category: taskData.category || '生活',
        completed: taskData.completed || false,
        pomodoroCount: taskData.pomodoroCount || 0,
        timeSpent: taskData.timeSpent || 0,
        progress: taskData.progress || 0,
        date: taskData.date || getCurrentDateString(),
        createdAt: taskData.createdAt || new Date().toISOString()
      };

      console.log('任务创建成功:', newTask);
      return newTask;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID查询任务
   */
  findById(id: number): Task | null {
    try {
      const row = this.selectByIdStmt.get(id);
      return row ? this.rowToTask(row) : null;
    } catch (error) {
      console.error('查询任务失败:', error);
      throw error;
    }
  }

  /**
   * 查询所有任务
   */
  findAll(): Task[] {
    try {
      const rows = this.selectAllStmt.all();
      return rows.map(row => this.rowToTask(row));
    } catch (error) {
      console.error('查询所有任务失败:', error);
      throw error;
    }
  }

  /**
   * 根据分类查询任务
   */
  findByCategory(category: string): Task[] {
    try {
      const rows = this.selectByCategoryStmt.all(category);
      return rows.map(row => this.rowToTask(row));
    } catch (error) {
      console.error('根据分类查询任务失败:', error);
      throw error;
    }
  }

  /**
   * 根据日期查询任务
   */
  findByDate(date: string): Task[] {
    try {
      const rows = this.selectByDateStmt.all(date);
      return rows.map(row => this.rowToTask(row));
    } catch (error) {
      console.error('根据日期查询任务失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务
   */
  update(id: number, taskData: Partial<Task>): boolean {
    try {
      const existingTask = this.findById(id);
      if (!existingTask) {
        console.warn('任务不存在:', id);
        return false;
      }

      const updatedTask = { ...existingTask, ...taskData };
      
      const result = this.updateStmt.run(
        updatedTask.name,
        updatedTask.category,
        updatedTask.completed ? 1 : 0,
        updatedTask.pomodoroCount,
        updatedTask.timeSpent,
        updatedTask.progress,
        id
      );

      const success = result.changes > 0;
      if (success) {
        console.log('任务更新成功:', id);
      }
      return success;
    } catch (error) {
      console.error('更新任务失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务进度
   */
  updateProgress(id: number, progress: number): boolean {
    try {
      const completed = progress >= 100;
      const result = this.updateProgressStmt.run(progress, completed ? 1 : 0, id);
      const success = result.changes > 0;
      
      if (success) {
        console.log(`任务 ${id} 进度更新为 ${progress}%`);
      }
      return success;
    } catch (error) {
      console.error('更新任务进度失败:', error);
      throw error;
    }
  }

  /**
   * 更新番茄钟计数
   */
  updatePomodoroCount(id: number, count: number): boolean {
    try {
      const result = this.updatePomodoroCountStmt.run(count, id);
      const success = result.changes > 0;
      
      if (success) {
        console.log(`任务 ${id} 番茄钟计数更新为 ${count}`);
      }
      return success;
    } catch (error) {
      console.error('更新番茄钟计数失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务用时
   */
  updateTimeSpent(id: number, timeSpent: number): boolean {
    try {
      const result = this.updateTimeSpentStmt.run(timeSpent, id);
      const success = result.changes > 0;
      
      if (success) {
        console.log(`任务 ${id} 用时更新为 ${timeSpent} 秒`);
      }
      return success;
    } catch (error) {
      console.error('更新任务用时失败:', error);
      throw error;
    }
  }

  /**
   * 标记任务完成状态
   */
  markCompleted(id: number, completed: boolean = true): boolean {
    try {
      const result = this.markCompletedStmt.run(completed ? 1 : 0, id);
      const success = result.changes > 0;
      
      if (success) {
        console.log(`任务 ${id} 标记为${completed ? '已完成' : '未完成'}`);
      }
      return success;
    } catch (error) {
      console.error('标记任务完成状态失败:', error);
      throw error;
    }
  }

  /**
   * 删除任务
   */
  delete(id: number): boolean {
    try {
      const result = this.deleteStmt.run(id);
      const success = result.changes > 0;
      
      if (success) {
        console.log('任务删除成功:', id);
      }
      return success;
    } catch (error) {
      console.error('删除任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务统计信息
   */
  getStats() {
    try {
      const totalTasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
      const completedTasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 1').get() as { count: number };
      const totalPomodoros = this.db.prepare('SELECT SUM(pomodoro_count) as total FROM tasks').get() as { total: number };
      const totalTimeSpent = this.db.prepare('SELECT SUM(time_spent) as total FROM tasks').get() as { total: number };
      
      return {
        totalTasks: totalTasks.count,
        completedTasks: completedTasks.count,
        totalPomodoros: totalPomodoros.total || 0,
        totalTimeSpent: totalTimeSpent.total || 0,
        completionRate: totalTasks.count > 0 ? (completedTasks.count / totalTasks.count) * 100 : 0
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有分类
   */
  getCategories(): string[] {
    try {
      const rows = this.db.prepare('SELECT name FROM categories ORDER BY name').all();
      return rows.map((row: any) => row.name);
    } catch (error) {
      console.error('获取分类失败:', error);
      throw error;
    }
  }

  /**
   * 添加分类
   */
  addCategory(name: string): boolean {
    try {
      const stmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
      const result = stmt.run(name);
      const success = result.changes > 0;
      
      if (success) {
        console.log('分类添加成功:', name);
      }
      return success;
    } catch (error) {
      console.error('添加分类失败:', error);
      throw error;
    }
  }

  /**
   * 删除分类
   */
  deleteCategory(name: string): boolean {
    try {
      // 将该分类下的任务移动到默认分类
      const updateTasksStmt = this.db.prepare('UPDATE tasks SET category = ? WHERE category = ?');
      updateTasksStmt.run('生活', name);
      
      // 删除分类
      const deleteCategoryStmt = this.db.prepare('DELETE FROM categories WHERE name = ?');
      const result = deleteCategoryStmt.run(name);
      const success = result.changes > 0;
      
      if (success) {
        console.log('分类删除成功:', name);
      }
      return success;
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    try {
      this.db.close();
      console.log('数据库连接已关闭');
    } catch (error) {
      console.error('关闭数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 备份数据库
   */
  backup(backupPath: string): void {
    try {
      this.db.backup(backupPath);
      console.log('数据库备份成功:', backupPath);
    } catch (error) {
      console.error('数据库备份失败:', error);
      throw error;
    }
  }

  /**
   * 执行原始SQL查询（仅用于调试和特殊场景）
   */
  executeRawQuery(query: string, params: any[] = []): any {
    try {
      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('执行原始查询失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
let taskORM: TaskORM | null = null;

export const getTaskORM = (dbPath?: string): TaskORM => {
  if (!taskORM) {
    taskORM = new TaskORM(dbPath);
  }
  return taskORM;
};

export const closeTaskORM = (): void => {
  if (taskORM) {
    taskORM.close();
    taskORM = null;
  }
}; 