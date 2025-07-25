import Database from "better-sqlite3";
import { Task } from "../types";
import { getCurrentDateString, getTodayStart, getTodayEnd, formatDateForDB, isBeforeToday } from "../utils/dateUtils";

export class TaskORM {
  private db: Database.Database;
  private insertStmt!: Database.Statement;
  private updateStmt!: Database.Statement;
  private deleteStmt!: Database.Statement;
  private selectAllStmt!: Database.Statement;
  // 新增预编译语句
  private selectActiveTasksStmt!: Database.Statement;
  private selectHistoryTasksStmt!: Database.Statement;
  private selectTasksByDateRangeStmt!: Database.Statement;

  constructor(dbPath?: string) {
    // 默认数据库路径
    const defaultPath = dbPath || "./data/pomodoro.db";
    this.db = new Database(defaultPath);

    // 启用外键约束
    this.db.pragma("foreign_keys = ON");

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
        time_spent INTEGER NOT NULL DEFAULT 0,
        progress INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        completed_at TEXT DEFAULT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建索引以提高查询性能
    const createIndexes = [
      "CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at)",
    ];

    try {
      this.db.exec(createTasksTable);

      createIndexes.forEach((index) => {
        this.db.exec(index);
      });

      console.log("数据库表初始化成功");
    } catch (error) {
      console.error("数据库初始化失败:", error);
      throw error;
    }
  }

  /**
   * 预编译SQL语句
   */
  private prepareStatements(): void {
    this.insertStmt = this.db.prepare(`
      INSERT INTO tasks (name, category, completed, time_spent, progress, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.updateStmt = this.db.prepare(`
      UPDATE tasks 
      SET name = ?, category = ?, completed = ?, 
          time_spent = ?, progress = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    this.deleteStmt = this.db.prepare("DELETE FROM tasks WHERE id = ?");

    this.selectAllStmt = this.db.prepare(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );

    // 查询活跃任务：未完成的任务 + 今日创建的任务
    this.selectActiveTasksStmt = this.db.prepare(`
      SELECT * FROM tasks 
      WHERE completed = 0 OR (created_at >= ? AND created_at <= ?)
      ORDER BY created_at DESC
    `);

    // 查询历史已完成任务（不包括今天）
    this.selectHistoryTasksStmt = this.db.prepare(`
      SELECT * FROM tasks 
      WHERE completed = 1 AND completed_at IS NOT NULL AND completed_at < ?
      ORDER BY completed_at DESC
    `);

    // 按时间范围查询任务（创建日期或完成日期在范围内）
    this.selectTasksByDateRangeStmt = this.db.prepare(`
      SELECT * FROM tasks 
      WHERE (created_at >= ? AND created_at <= ?) 
         OR (completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?)
      ORDER BY 
        CASE WHEN completed_at IS NOT NULL THEN completed_at ELSE created_at END DESC
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
      timeSpent: row.time_spent,
      progress: row.progress,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  /**
   * 创建新任务
   */
  create(taskData: Omit<Task, "id">): Task {
    try {
      const result = this.insertStmt.run(
        taskData.name,
        taskData.category || "生活",
        taskData.completed ? 1 : 0,
        taskData.timeSpent || 0,
        taskData.progress || 0,
        taskData.createdAt || new Date().toISOString(),
        taskData.completedAt || null
      );

      const newTask: Task = {
        id: Number(result.lastInsertRowid),
        ...taskData,
        category: taskData.category || "生活",
        completed: taskData.completed || false,
        timeSpent: taskData.timeSpent || 0,
        progress: taskData.progress || 0,
        createdAt: taskData.createdAt || new Date().toISOString(),
        completedAt: taskData.completedAt || null,
      };

      console.log("任务创建成功:", newTask);
      return newTask;
    } catch (error) {
      console.error("创建任务失败:", error);
      throw error;
    }
  }

  /**
   * 查询所有任务
   */
  findAll(): Task[] {
    try {
      const rows = this.selectAllStmt.all();
      return rows.map((row) => this.rowToTask(row));
    } catch (error) {
      console.error("查询所有任务失败:", error);
      throw error;
    }
  }

  /**
   * 获取活跃任务：未完成的任务 + 今日创建的任务
   */
  findActiveTasks(): Task[] {
    try {
      const todayStart = formatDateForDB(getTodayStart());
      const todayEnd = formatDateForDB(getTodayEnd());
      
      const rows = this.selectActiveTasksStmt.all(todayStart, todayEnd);
      return rows.map((row) => this.rowToTask(row));
    } catch (error) {
      console.error("查询活跃任务失败:", error);
      throw error;
    }
  }

  /**
   * 获取历史已完成任务（不包括今天）
   */
  findHistoryTasks(): Task[] {
    try {
      const todayStart = formatDateForDB(getTodayStart());
      
      const rows = this.selectHistoryTasksStmt.all(todayStart);
      return rows.map((row) => this.rowToTask(row));
    } catch (error) {
      console.error("查询历史任务失败:", error);
      throw error;
    }
  }

  /**
   * 按时间范围查询任务
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 在指定时间范围内创建或完成的任务
   */
  findTasksByDateRange(startDate: Date, endDate: Date): Task[] {
    try {
      const start = formatDateForDB(startDate);
      const end = formatDateForDB(endDate);
      
      const rows = this.selectTasksByDateRangeStmt.all(start, end, start, end);
      return rows.map((row) => this.rowToTask(row));
    } catch (error) {
      console.error("按时间范围查询任务失败:", error);
      throw error;
    }
  }

  /**
   * 获取历史已完成任务（支持时间范围过滤）
   * @param startDate 可选的开始日期
   * @param endDate 可选的结束日期
   * @returns 历史已完成任务
   */
  findHistoryTasksInRange(startDate?: Date, endDate?: Date): Task[] {
    try {
      if (startDate && endDate) {
        // 如果提供了时间范围，使用范围查询但只返回已完成的任务
        const start = formatDateForDB(startDate);
        const end = formatDateForDB(endDate);
        
        const stmt = this.db.prepare(`
          SELECT * FROM tasks 
          WHERE completed = 1 AND completed_at IS NOT NULL 
            AND ((created_at >= ? AND created_at <= ?) 
                 OR (completed_at >= ? AND completed_at <= ?))
            AND completed_at < ?
          ORDER BY completed_at DESC
        `);
        
        const todayStart = formatDateForDB(getTodayStart());
        const rows = stmt.all(start, end, start, end, todayStart);
        return rows.map((row) => this.rowToTask(row));
      } else {
        // 如果没有提供时间范围，返回所有历史已完成任务
        return this.findHistoryTasks();
      }
    } catch (error) {
      console.error("按时间范围查询历史任务失败:", error);
      throw error;
    }
  }

  /**
   * 更新任务（支持所有字段除了id）
   */
  update(id: number, taskData: Partial<Omit<Task, "id">>): boolean {
    try {
      // 先查询现有任务数据
      const existingRow = this.db
        .prepare("SELECT * FROM tasks WHERE id = ?")
        .get(id);
      if (!existingRow) {
        console.warn("任务不存在:", id);
        return false;
      }

      const existingTask = this.rowToTask(existingRow);

      // 合并更新数据
      const updatedTask = { ...existingTask, ...taskData };

      const result = this.updateStmt.run(
        updatedTask.name,
        updatedTask.category,
        updatedTask.completed ? 1 : 0,
        updatedTask.timeSpent,
        updatedTask.progress,
        updatedTask.completedAt,
        id
      );

      const success = result.changes > 0;
      if (success) {
        console.log("任务更新成功:", id);
      }
      return success;
    } catch (error) {
      console.error("更新任务失败:", error);
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
        console.log("任务删除成功:", id);
      }
      return success;
    } catch (error) {
      console.error("删除任务失败:", error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    try {
      this.db.close();
      console.log("数据库连接已关闭");
    } catch (error) {
      console.error("关闭数据库连接失败:", error);
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
