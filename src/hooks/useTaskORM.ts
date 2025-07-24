import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { getTaskORM, closeTaskORM } from '../db/TaskLocalStorageORM';

/**
 * React Hook for TaskORM integration
 * 提供数据库操作的React接口
 */
export const useTaskORM = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取ORM实例
  const orm = getTaskORM();

  // 加载所有任务
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allTasks = orm.findAll();
      setTasks(allTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载任务失败');
      console.error('加载任务失败:', err);
    } finally {
      setLoading(false);
    }
  }, [orm]);

  // 初始化数据
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 创建任务
  const createTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    try {
      setError(null);
      const newTask = orm.create(taskData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建任务失败';
      setError(errorMsg);
      console.error('创建任务失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

  // 更新任务
  const updateTask = useCallback(async (id: number, taskData: Partial<Omit<Task, 'id'>>) => {
    try {
      setError(null);
      const success = orm.update(id, taskData);
      if (success) {
        setTasks(prev => prev.map(task => 
          task.id === id ? { ...task, ...taskData } : task
        ));
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新任务失败';
      setError(errorMsg);
      console.error('更新任务失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

  // 删除任务
  const deleteTask = useCallback(async (id: number) => {
    try {
      setError(null);
      const success = orm.delete(id);
      if (success) {
        setTasks(prev => prev.filter(task => task.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除任务失败';
      setError(errorMsg);
      console.error('删除任务失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

  // 更新任务进度（基于通用update方法）
  const updateTaskProgress = useCallback(async (id: number, progress: number) => {
    const completed = progress >= 100;
    return updateTask(id, { progress, completed });
  }, [updateTask]);

  // 更新番茄钟计数（基于通用update方法）
  const updatePomodoroCount = useCallback(async (id: number, pomodoroCount: number) => {
    return updateTask(id, { pomodoroCount });
  }, [updateTask]);

  // 更新任务用时（基于通用update方法）
  const updateTimeSpent = useCallback(async (id: number, timeSpent: number) => {
    return updateTask(id, { timeSpent });
  }, [updateTask]);

  // 标记任务完成（基于通用update方法）
  const markTaskCompleted = useCallback(async (id: number, completed: boolean = true) => {
    return updateTask(id, { completed });
  }, [updateTask]);

  // 根据分类获取任务
  const getTasksByCategory = useCallback((category: string): Task[] => {
    return tasks.filter(task => task.category === category);
  }, [tasks]);

  // 根据日期获取任务
  const getTasksByDate = useCallback((date: string): Task[] => {
    return tasks.filter(task => task.date === date);
  }, [tasks]);

  // 获取已完成任务
  const getCompletedTasks = useCallback((): Task[] => {
    return tasks.filter(task => task.completed);
  }, [tasks]);

  // 获取未完成任务
  const getIncompleteTasks = useCallback((): Task[] => {
    return tasks.filter(task => !task.completed);
  }, [tasks]);

  // 获取统计信息（基于本地数据计算）
  const getStats = useCallback(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalPomodoros = tasks.reduce((sum, task) => sum + task.pomodoroCount, 0);
    const totalTimeSpent = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      totalPomodoros,
      totalTimeSpent,
      completionRate
    };
  }, [tasks]);



  // 刷新数据
  const refresh = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // 清理函数
  const cleanup = useCallback(() => {
    closeTaskORM();
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
    updatePomodoroCount,
    updateTimeSpent,
    markTaskCompleted,
    
    // 查询方法
    getTasksByCategory,
    getTasksByDate,
    getCompletedTasks,
    getIncompleteTasks,
    
    // 统计和工具方法
    getStats,
    refresh,
    loadTasks,
    cleanup
  };
};

// 简化版本的Hook，仅包含基本操作
export const useTaskDB = () => {
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskProgress,
    getStats
  } = useTaskORM();

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskProgress,
    getStats
  };
}; 