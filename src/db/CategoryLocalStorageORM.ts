export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export class CategoryLocalStorageORM {
  private storageKey = 'pomodoro-categories';

  constructor() {
    this.initializeStorage();
  }

  /**
   * 初始化存储
   */
  private initializeStorage(): void {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      // 初始化默认分类
      const defaultCategories: Category[] = [
        {
          id: 1,
          name: '生活',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: '工作',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(defaultCategories));
    }
  }

  /**
   * 获取所有分类
   */
  private getAllCategories(): Category[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 保存所有分类
   */
  private saveAllCategories(categories: Category[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(categories));
  }

  /**
   * 查询所有分类
   */
  findAll(): Category[] {
    try {
      const categories = this.getAllCategories();
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('查询所有分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有分类名称
   */
  getAllNames(): string[] {
    try {
      const categories = this.findAll();
      return categories.map(category => category.name);
    } catch (error) {
      console.error('获取分类名称失败:', error);
      throw error;
    }
  }

  /**
   * 添加分类
   */
  addCategory(name: string): Category {
    try {
      const categories = this.getAllCategories();
      
      // 检查是否已存在
      const existing = categories.find(cat => cat.name === name);
      if (existing) {
        console.log('分类已存在:', name);
        return existing;
      }

      const newCategory: Category = {
        id: Date.now(),
        name,
        createdAt: new Date().toISOString()
      };

      categories.push(newCategory);
      this.saveAllCategories(categories);

      console.log('分类添加成功:', newCategory);
      return newCategory;
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
      // 检查是否为默认分类
      if (name === '生活' || name === '工作') {
        console.warn('不能删除默认分类:', name);
        return false;
      }

      const categories = this.getAllCategories();
      const filteredCategories = categories.filter(cat => cat.name !== name);
      
      if (filteredCategories.length === categories.length) {
        console.warn('分类不存在:', name);
        return false;
      }

      this.saveAllCategories(filteredCategories);

      // 将该分类下的任务移动到默认分类
      this.migrateTasksToDefaultCategory(name);
      
      console.log('分类删除成功:', name);
      return true;
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  /**
   * 将任务迁移到默认分类
   */
  private migrateTasksToDefaultCategory(deletedCategory: string): void {
    try {
      const tasksData = localStorage.getItem('pomodoro-tasks');
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        const updatedTasks = tasks.map((task: any) => 
          task.category === deletedCategory 
            ? { ...task, category: '生活' }
            : task
        );
        localStorage.setItem('pomodoro-tasks', JSON.stringify(updatedTasks));
      }
    } catch (error) {
      console.error('迁移任务失败:', error);
    }
  }

  /**
   * 检查分类是否存在
   */
  exists(name: string): boolean {
    try {
      const categories = this.getAllCategories();
      return categories.some(cat => cat.name === name);
    } catch (error) {
      console.error('检查分类是否存在失败:', error);
      return false;
    }
  }

  /**
   * 关闭数据库连接（localStorage不需要）
   */
  close(): void {
    console.log('分类LocalStorage连接已关闭');
  }
}

// 导出单例实例
let categoryORM: CategoryLocalStorageORM | null = null;

export const getCategoryORM = (): CategoryLocalStorageORM => {
  if (!categoryORM) {
    categoryORM = new CategoryLocalStorageORM();
  }
  return categoryORM;
};

export const closeCategoryORM = (): void => {
  if (categoryORM) {
    categoryORM.close();
    categoryORM = null;
  }
}; 