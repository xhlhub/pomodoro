import { useState, useEffect, useCallback } from 'react';
import { Category, getCategoryORM, closeCategoryORM } from '../db/CategoryLocalStorageORM';

/**
 * React Hook for CategoryORM integration
 * 提供分类管理的React接口
 */
export const useCategoryORM = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取ORM实例
  const orm = getCategoryORM();

  // 加载所有分类
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allCategories = orm.findAll();
      setCategories(allCategories);
      setCategoryNames(allCategories.map(cat => cat.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载分类失败');
      console.error('加载分类失败:', err);
    } finally {
      setLoading(false);
    }
  }, [orm]);

  // 初始化数据
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 添加分类
  const addCategory = useCallback(async (categoryName: string) => {
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

      const newCategory = orm.addCategory(trimmedName);
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
  }, [orm, categoryNames]);

  // 删除分类
  const deleteCategory = useCallback(async (categoryName: string) => {
    try {
      setError(null);
      
      const success = orm.deleteCategory(categoryName);
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
  }, [orm]);

  // 检查分类是否存在
  const categoryExists = useCallback((categoryName: string): boolean => {
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
    closeCategoryORM();
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
    categoryExists
  } = useCategoryORM();

  return {
    categoryNames,
    loading,
    error,
    addCategory,
    deleteCategory,
    categoryExists
  };
}; 