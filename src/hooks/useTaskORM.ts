import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { getTaskORM, closeTaskORM } from '../db/TaskORM';

/**
 * React Hook for TaskORM integration
 * 提供数据库操作的React接口
 */
export const useTaskORM = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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

  // 加载所有分类
  const loadCategories = useCallback(async () => {
    try {
      const allCategories = orm.getCategories();
      setCategories(allCategories);
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  }, [orm]);

  // 初始化数据
  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

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
  const updateTask = useCallback(async (id: number, taskData: Partial<Task>) => {
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

  // 更新任务进度
  const updateTaskProgress = useCallback(async (id: number, progress: number) => {
    try {
      setError(null);
      const success = orm.updateProgress(id, progress);
      if (success) {
        setTasks(prev => prev.map(task => 
          task.id === id 
            ? { ...task, progress, completed: progress >= 100 }
            : task
        ));
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新进度失败';
      setError(errorMsg);
      console.error('更新进度失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

  // 更新番茄钟计数
  const updatePomodoroCount = useCallback(async (id: number, count: number) => {
    try {
      setError(null);
      const success = orm.updatePomodoroCount(id, count);
      if (success) {
        setTasks(prev => prev.map(task => 
          task.id === id ? { ...task, pomodoroCount: count } : task
        ));
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新番茄钟计数失败';
      setError(errorMsg);
      console.error('更新番茄钟计数失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

  // 更新任务用时
  const updateTimeSpent = useCallback(async (id: number, timeSpent: number) => {
    try {
      setError(null);
      const success = orm.updateTimeSpent(id, timeSpent);
      if (success) {
        setTasks(prev => prev.map(task => 
          task.id === id ? { ...task, timeSpent } : task
        ));
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新用时失败';
      setError(errorMsg);
      console.error('更新用时失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

  // 标记任务完成
  const markTaskCompleted = useCallback(async (id: number, completed: boolean = true) => {
    try {
      setError(null);
      const success = orm.markCompleted(id, completed);
      if (success) {
        setTasks(prev => prev.map(task => 
          task.id === id ? { ...task, completed } : task
        ));
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '标记完成失败';
      setError(errorMsg);
      console.error('标记完成失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

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

  // 添加分类
  const addCategory = useCallback(async (categoryName: string) => {
    try {
      setError(null);
      const success = orm.addCategory(categoryName);
      if (success) {
        setCategories(prev => [...prev, categoryName].sort());
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '添加分类失败';
      setError(errorMsg);
      console.error('添加分类失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm]);

  // 删除分类
  const deleteCategory = useCallback(async (categoryName: string) => {
    try {
      setError(null);
      const success = orm.deleteCategory(categoryName);
      if (success) {
        setCategories(prev => prev.filter(cat => cat !== categoryName));
        // 重新加载任务以反映分类变更
        loadTasks();
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除分类失败';
      setError(errorMsg);
      console.error('删除分类失败:', err);
      throw new Error(errorMsg);
    }
  }, [orm, loadTasks]);

  // 获取统计信息
  const getStats = useCallback(() => {
    try {
      return orm.getStats();
    } catch (err) {
      console.error('获取统计信息失败:', err);
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalPomodoros: 0,
        totalTimeSpent: 0,
        completionRate: 0
      };
    }
  }, [orm]);

  // 刷新数据
  const refresh = useCallback(async () => {
    await Promise.all([loadTasks(), loadCategories()]);
  }, [loadTasks, loadCategories]);

  // 清理函数
  const cleanup = useCallback(() => {
    closeTaskORM();
  }, []);

  return {
    // 数据状态
    tasks,
    categories,
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
    
    // 分类操作
    addCategory,
    deleteCategory,
    
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