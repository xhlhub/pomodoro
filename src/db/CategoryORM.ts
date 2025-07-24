import Database from 'better-sqlite3';

export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export class CategoryORM {
  private db: Database.Database;
  private insertStmt!: Database.Statement;
  private selectAllStmt!: Database.Statement;
  private deleteStmt!: Database.Statement;
  private selectByNameStmt!: Database.Statement;

  constructor(dbPath?: string) {
    // 默认数据库路径
    const defaultPath = dbPath || './data/pomodoro.db';
    this.db = new Database(defaultPath);
    
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
    // 创建分类表
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建索引
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)'
    ];

    try {
      this.db.exec(createCategoriesTable);
      
      createIndexes.forEach(index => {
        this.db.exec(index);
      });

      // 初始化默认分类
      this.initializeDefaultCategories();
      
      console.log('分类数据库表初始化成功');
    } catch (error) {
      console.error('分类数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化默认分类
   */
  private initializeDefaultCategories(): void {
    const defaultCategories = ['生活', '工作'];
    
    defaultCategories.forEach(categoryName => {
      try {
        this.addCategory(categoryName);
      } catch (error) {
        // 忽略重复插入错误
      }
    });
  }

  /**
   * 预编译SQL语句
   */
  private prepareStatements(): void {
    this.insertStmt = this.db.prepare(`
      INSERT INTO categories (name, created_at)
      VALUES (?, ?)
    `);

    this.selectAllStmt = this.db.prepare('SELECT * FROM categories ORDER BY name');
    
    this.deleteStmt = this.db.prepare('DELETE FROM categories WHERE name = ?');
    
    this.selectByNameStmt = this.db.prepare('SELECT * FROM categories WHERE name = ?');
  }

  /**
   * 数据库行转换为Category对象
   */
  private rowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at
    };
  }

  /**
   * 查询所有分类
   */
  findAll(): Category[] {
    try {
      const rows = this.selectAllStmt.all();
      return rows.map(row => this.rowToCategory(row));
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
      // 检查是否已存在
      const existing = this.selectByNameStmt.get(name);
      if (existing) {
        console.log('分类已存在:', name);
        return this.rowToCategory(existing);
      }

      const createdAt = new Date().toISOString();
      const result = this.insertStmt.run(name, createdAt);

      const newCategory: Category = {
        id: Number(result.lastInsertRowid),
        name,
        createdAt
      };

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

      // 将该分类下的任务移动到默认分类
      const updateTasksStmt = this.db.prepare('UPDATE tasks SET category = ? WHERE category = ?');
      updateTasksStmt.run('生活', name);
      
      // 删除分类
      const result = this.deleteStmt.run(name);
      const success = result.changes > 0;
      
      if (success) {
        console.log('分类删除成功:', name);
      } else {
        console.warn('分类不存在:', name);
      }
      return success;
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  /**
   * 检查分类是否存在
   */
  exists(name: string): boolean {
    try {
      const result = this.selectByNameStmt.get(name);
      return !!result;
    } catch (error) {
      console.error('检查分类是否存在失败:', error);
      return false;
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    try {
      this.db.close();
      console.log('分类数据库连接已关闭');
    } catch (error) {
      console.error('关闭分类数据库连接失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
let categoryORM: CategoryORM | null = null;

export const getCategoryORM = (dbPath?: string): CategoryORM => {
  if (!categoryORM) {
    categoryORM = new CategoryORM(dbPath);
  }
  return categoryORM;
};

export const closeCategoryORM = (): void => {
  if (categoryORM) {
    categoryORM.close();
    categoryORM = null;
  }
}; 