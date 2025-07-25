import { useState, useEffect, useCallback } from "react";
import { Task } from "../types";

declare global {
  interface Window {
    require?: (module: string) => any;
  }
}

// IPC通信接口
interface IpcRenderer {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

// 获取IPC渲染器
const getIpcRenderer = (): IpcRenderer | null => {
  try {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      return ipcRenderer;
    }
    return null;
  } catch (error) {
    console.error("无法获取ipcRenderer:", error);
    return null;
  }
};

/**
 * React Hook for TaskORM integration with SQLite via IPC
 * 提供数据库操作的React接口，通过IPC与主进程的SQLite数据库通信
 */
export const useTaskORM = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ipcRenderer = getIpcRenderer();

  // 加载所有任务
  const loadTasks = useCallback(async () => {
    if (!ipcRenderer) {
      setError("IPC通信不可用");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allTasks = await ipcRenderer.invoke("task-find-all");
      setTasks(allTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载任务失败");
      console.error("加载任务失败:", err);
    } finally {
      setLoading(false);
    }
  }, [ipcRenderer]);

  // 初始化数据
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 创建任务
  const createTask = useCallback(
    async (taskData: Omit<Task, "id">) => {
      if (!ipcRenderer) {
        throw new Error("IPC通信不可用");
      }

      try {
        setError(null);
        const newTask = await ipcRenderer.invoke("task-create", taskData);
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "创建任务失败";
        setError(errorMsg);
        console.error("创建任务失败:", err);
        throw new Error(errorMsg);
      }
    },
    [ipcRenderer]
  );

  // 更新任务
  const updateTask = useCallback(
    async (id: number, taskData: Partial<Omit<Task, "id">>) => {
      if (!ipcRenderer) {
        throw new Error("IPC通信不可用");
      }

      try {
        setError(null);
        const success = await ipcRenderer.invoke("task-update", id, taskData);
        if (success) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === id ? { ...task, ...taskData } : task
            )
          );
          return true;
        }
        return false;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "更新任务失败";
        setError(errorMsg);
        console.error("更新任务失败:", err);
        throw new Error(errorMsg);
      }
    },
    [ipcRenderer]
  );

  // 删除任务
  const deleteTask = useCallback(
    async (id: number) => {
      if (!ipcRenderer) {
        throw new Error("IPC通信不可用");
      }

      try {
        setError(null);
        const success = await ipcRenderer.invoke("task-delete", id);
        if (success) {
          setTasks((prev) => prev.filter((task) => task.id !== id));
          return true;
        }
        return false;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "删除任务失败";
        setError(errorMsg);
        console.error("删除任务失败:", err);
        throw new Error(errorMsg);
      }
    },
    [ipcRenderer]
  );

  // 更新任务进度（基于通用update方法）
  const updateTaskProgress = useCallback(
    async (id: number, progress: number) => {
      const completed = progress >= 100;
      const completedAt = completed ? new Date().toISOString() : null;
      return updateTask(id, { progress, completed, completedAt });
    },
    [updateTask]
  );

  // 更新任务用时（基于通用update方法）
  const updateTimeSpent = useCallback(
    async (id: number, timeSpent: number) => {
      return updateTask(id, { timeSpent });
    },
    [updateTask]
  );

  // 标记任务完成（基于通用update方法）
  const markTaskCompleted = useCallback(
    async (id: number, completed: boolean = true) => {
      const completedAt = completed ? new Date().toISOString() : null;
      return updateTask(id, { completed, completedAt });
    },
    [updateTask]
  );

  // 根据分类获取任务
  const getTasksByCategory = useCallback(
    (category: string): Task[] => {
      return tasks.filter((task) => task.category === category);
    },
    [tasks]
  );

  // 获取已完成任务
  const getCompletedTasks = useCallback((): Task[] => {
    return tasks.filter((task) => task.completed);
  }, [tasks]);

  // 获取未完成任务
  const getIncompleteTasks = useCallback((): Task[] => {
    return tasks.filter((task) => !task.completed);
  }, [tasks]);

  // 获取统计信息（基于本地数据计算）
  const getStats = useCallback(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const totalTimeSpent = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      totalTimeSpent,
      completionRate,
    };
  }, [tasks]);

  // 刷新数据
  const refresh = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // 清理函数
  const cleanup = useCallback(() => {
    // SQLite在主进程，这里不需要特殊清理
    console.log("TaskORM清理完成");
  }, []);

  return {
    // 数据状态
    tasks,
    loading,
    error,

    // 任务操作
    createTask,
    updateTask,
    deleteTask,
    updateTaskProgress,
    updateTimeSpent,
    markTaskCompleted,

    // 查询方法
    getTasksByCategory,
    getCompletedTasks,
    getIncompleteTasks,

    // 统计和工具方法
    getStats,
    refresh,
    loadTasks,
    cleanup,
  };
};
