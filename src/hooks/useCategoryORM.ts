import { useState, useEffect, useCallback } from 'react';

// 分类接口
export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

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
 * React Hook for CategoryORM integration with SQLite via IPC
 * 提供分类管理的React接口，通过IPC与主进程的SQLite数据库通信
 */
export const useCategoryORM = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ipcRenderer = getIpcRenderer();

  // 加载所有分类
  const loadCategories = useCallback(async () => {
    if (!ipcRenderer) {
      setError("IPC通信不可用");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allCategories = await ipcRenderer.invoke("category-find-all");
      setCategories(allCategories);
      setCategoryNames(allCategories.map((cat: Category) => cat.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载分类失败');
      console.error('加载分类失败:', err);
    } finally {
      setLoading(false);
    }
  }, [ipcRenderer]);

  // 初始化数据
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 添加分类
  const addCategory = useCallback(async (categoryName: string) => {
    if (!ipcRenderer) {
      throw new Error("IPC通信不可用");
    }

    try {
      setError(null);
      
      // 检查分类名是否为空或仅包含空格
      const trimmedName = categoryName.trim();
      if (!trimmedName) {
        throw new Error('分类名称不能为空');
      }

      // 检查是否已存在
      if (categoryNames.includes(trimmedName)) {
        throw new Error('分类已存在');
      }

      const newCategory = await ipcRenderer.invoke("category-add", trimmedName);
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryNames(prev => [...prev, trimmedName].sort());
      
      console.log('分类添加成功:', newCategory);
      return newCategory;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '添加分类失败';
      setError(errorMsg);
      console.error('添加分类失败:', err);
      throw new Error(errorMsg);
    }
  }, [ipcRenderer, categoryNames]);

  // 删除分类
  const deleteCategory = useCallback(async (categoryName: string) => {
    if (!ipcRenderer) {
      throw new Error("IPC通信不可用");
    }

    try {
      setError(null);
      
      const success = await ipcRenderer.invoke("category-delete", categoryName);
      if (success) {
        setCategories(prev => prev.filter(cat => cat.name !== categoryName));
        setCategoryNames(prev => prev.filter(name => name !== categoryName));
        console.log('分类删除成功:', categoryName);
        return true;
      } else {
        throw new Error('删除分类失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除分类失败';
      setError(errorMsg);
      console.error('删除分类失败:', err);
      throw new Error(errorMsg);
    }
  }, [ipcRenderer]);

  // 检查分类是否存在
  const categoryExists = useCallback(async (categoryName: string): Promise<boolean> => {
    if (!ipcRenderer) {
      return categoryNames.includes(categoryName);
    }

    try {
      return await ipcRenderer.invoke("category-exists", categoryName);
    } catch (error) {
      console.error('检查分类是否存在失败:', error);
      return categoryNames.includes(categoryName);
    }
  }, [ipcRenderer, categoryNames]);

  // 本地同步检查分类是否存在
  const categoryExistsLocal = useCallback((categoryName: string): boolean => {
    return categoryNames.includes(categoryName);
  }, [categoryNames]);

  // 获取分类数量
  const getCategoryCount = useCallback((): number => {
    return categories.length;
  }, [categories]);

  // 获取默认分类
  const getDefaultCategories = useCallback((): string[] => {
    return ['生活', '工作'];
  }, []);

  // 检查是否为默认分类
  const isDefaultCategory = useCallback((categoryName: string): boolean => {
    return getDefaultCategories().includes(categoryName);
  }, [getDefaultCategories]);

  // 刷新分类数据
  const refresh = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  // 清理函数
  const cleanup = useCallback(() => {
    // SQLite在主进程，这里不需要特殊清理
    console.log('CategoryORM清理完成');
  }, []);

  return {
    // 数据状态
    categories,
    categoryNames,
    loading,
    error,
    
    // 分类操作
    addCategory,
    deleteCategory,
    
    // 查询方法
    categoryExists,
    categoryExistsLocal, // 本地同步检查
    getCategoryCount,
    getDefaultCategories,
    isDefaultCategory,
    
    // 工具方法
    refresh,
    loadCategories,
    cleanup
  };
};

// 简化版本的Hook，仅返回分类名称和基本操作
export const useCategoryNames = () => {
  const {
    categoryNames,
    loading,
    error,
    addCategory,
    deleteCategory,
    categoryExistsLocal
  } = useCategoryORM();

  return {
    categoryNames,
    loading,
    error,
    addCategory,
    deleteCategory,
    categoryExists: categoryExistsLocal // 使用本地同步版本
  };
}; 