# TaskORM 迁移指南

本文档介绍如何将现有的 localStorage 存储系统迁移到基于 better-sqlite3 的 TaskORM 数据库系统。

## 📋 迁移概述

### 从 localStorage 到 SQLite 数据库的优势

1. **性能提升**: SQLite 查询比 localStorage 更快，特别是对大量数据
2. **结构化查询**: 支持复杂的SQL查询和数据关系
3. **数据完整性**: 事务支持和数据约束
4. **更好的并发性**: 多进程安全
5. **数据备份**: 内置备份和恢复功能

## 🔧 安装和设置

### 1. 安装依赖

```bash
npm install better-sqlite3 @types/better-sqlite3 --legacy-peer-deps
```

### 2. 文件结构

确保项目中有以下文件结构：

```
src/
├── db/
│   ├── TaskORM.ts          # 主要ORM类
│   └── taskORM.example.ts  # 使用示例
├── hooks/
│   └── useTaskORM.ts       # React Hook
└── types/
    └── index.ts            # 类型定义
```

## 📦 集成步骤

### 步骤 1: 替换 App.tsx 中的 localStorage

将现有的 `App.tsx` 中的 localStorage 操作替换为 TaskORM：

```typescript
// 原来的代码
import { useLocalStorage } from './hooks/useLocalStorage';
const [tasks, setTasks] = useLocalStorage<Task[]>('pomodoro-tasks', []);

// 替换为
import { useTaskORM } from './hooks/useTaskORM';
const {
  tasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskProgress,
  updatePomodoroCount,
  updateTimeSpent,
  loading,
  error
} = useTaskORM();
```

### 步骤 2: 更新任务操作函数

```typescript
// 原来的 addTask 函数
const addTask = useCallback((taskName: string, category: string = '生活'): void => {
  const newTask: Task = {
    id: Date.now(),
    name: taskName,
    category: category,
    completed: false,
    pomodoroCount: 0,
    timeSpent: 0,
    progress: 0,
    date: getCurrentDateString(),
    createdAt: new Date().toISOString(),
  };
  setTasks(prev => [...prev, newTask]);
}, [setTasks]);

// 替换为
const addTask = useCallback(async (taskName: string, category: string = '生活'): Promise<void> => {
  try {
    await createTask({
      name: taskName,
      category: category,
      completed: false,
      pomodoroCount: 0,
      timeSpent: 0,
      progress: 0,
      date: getCurrentDateString(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    // 处理错误，比如显示错误消息
  }
}, [createTask]);
```

### 步骤 3: 更新任务进度函数

```typescript
// 原来的 updateTaskProgress 函数
const updateTaskProgress = useCallback((taskId: number, progress: number): void => {
  setTasks(prev => prev.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        progress,
        completed: progress >= 100
      };
    }
    return task;
  }));
}, [setTasks]);

// 替换为
const handleUpdateTaskProgress = useCallback(async (taskId: number, progress: number): Promise<void> => {
  try {
    await updateTaskProgress(taskId, progress);
  } catch (error) {
    console.error('更新进度失败:', error);
  }
}, [updateTaskProgress]);
```

### 步骤 4: 数据迁移脚本

创建一个数据迁移脚本来将现有的 localStorage 数据迁移到数据库：

```typescript
// src/utils/migrateData.ts
import { getTaskORM } from '../db/TaskORM';
import { Task } from '../types';

export const migrateFromLocalStorage = (): boolean => {
  try {
    // 从 localStorage 读取现有数据
    const existingTasks = localStorage.getItem('pomodoro-tasks');
    const existingCategories = localStorage.getItem('pomodoro-categories');
    
    if (!existingTasks) {
      console.log('没有发现需要迁移的任务数据');
      return true;
    }

    const tasks: Task[] = JSON.parse(existingTasks);
    const categories: string[] = existingCategories 
      ? JSON.parse(existingCategories) 
      : ['生活', '工作'];

    const orm = getTaskORM();

    // 迁移分类
    categories.forEach(category => {
      orm.addCategory(category);
    });

    // 迁移任务
    let migratedCount = 0;
    tasks.forEach(task => {
      try {
        orm.create({
          name: task.name,
          category: task.category,
          completed: task.completed,
          pomodoroCount: task.pomodoroCount,
          timeSpent: task.timeSpent,
          progress: task.progress,
          date: task.date,
          createdAt: task.createdAt
        });
        migratedCount++;
      } catch (error) {
        console.error('迁移任务失败:', task.name, error);
      }
    });

    console.log(`成功迁移 ${migratedCount} 个任务和 ${categories.length} 个分类`);

    // 备份原数据后清除 localStorage
    localStorage.setItem('pomodoro-tasks-backup', existingTasks);
    localStorage.setItem('pomodoro-categories-backup', existingCategories || '[]');
    localStorage.removeItem('pomodoro-tasks');
    localStorage.removeItem('pomodoro-categories');

    console.log('localStorage 数据已备份并清除');
    return true;

  } catch (error) {
    console.error('数据迁移失败:', error);
    return false;
  }
};
```

### 步骤 5: 在应用启动时执行迁移

在 `App.tsx` 中添加迁移逻辑：

```typescript
import { migrateFromLocalStorage } from './utils/migrateData';

const App: React.FC = () => {
  const [isMigrated, setIsMigrated] = useState(false);

  useEffect(() => {
    // 检查是否需要执行数据迁移
    const migrationKey = 'pomodoro-migration-completed';
    const isMigrationCompleted = localStorage.getItem(migrationKey);

    if (!isMigrationCompleted) {
      console.log('开始执行数据迁移...');
      const success = migrateFromLocalStorage();
      if (success) {
        localStorage.setItem(migrationKey, 'true');
        console.log('数据迁移完成');
      }
    }
    setIsMigrated(true);
  }, []);

  if (!isMigrated) {
    return (
      <div className="App">
        <div className="migration-loading">
          <h3>正在迁移数据...</h3>
          <p>首次启动需要将数据迁移到新的存储系统，请稍候...</p>
        </div>
      </div>
    );
  }

  // 其余组件代码...
};
```

## 🔍 使用示例

### 基本使用

```typescript
import { useTaskORM } from './hooks/useTaskORM';

function TaskList() {
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTaskProgress,
    deleteTask
  } = useTaskORM();

  const handleAddTask = async () => {
    try {
      await createTask({
        name: '新任务',
        category: '工作',
        completed: false,
        pomodoroCount: 0,
        timeSpent: 0,
        progress: 0,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('添加任务失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <button onClick={handleAddTask}>添加任务</button>
      {tasks.map(task => (
        <div key={task.id}>
          <h4>{task.name}</h4>
          <p>进度: {task.progress}%</p>
          <button onClick={() => updateTaskProgress(task.id, task.progress + 10)}>
            增加进度
          </button>
          <button onClick={() => deleteTask(task.id)}>
            删除任务
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 高级查询

```typescript
const {
  getTasksByCategory,
  getCompletedTasks,
  getStats
} = useTaskORM();

// 获取工作相关任务
const workTasks = getTasksByCategory('工作');

// 获取已完成任务
const completedTasks = getCompletedTasks();

// 获取统计信息
const stats = getStats();
console.log('完成率:', stats.completionRate + '%');
```

## 🚀 测试迁移

运行示例来测试 TaskORM 功能：

```bash
# 在项目根目录运行
npx ts-node src/db/taskORM.example.ts
```

## 📝 注意事项

1. **备份数据**: 迁移前确保原数据已备份
2. **渐进式迁移**: 建议先在开发环境测试完整迁移流程
3. **错误处理**: 添加适当的错误处理和用户反馈
4. **性能监控**: 监控数据库操作性能，特别是大量数据时
5. **数据验证**: 迁移后验证数据完整性

## 🛠️ 故障排除

### 常见问题

1. **数据库文件权限问题**
   ```bash
   # 确保data目录有写权限
   chmod 755 data/
   ```

2. **TypeScript 编译错误**
   ```bash
   # 确保类型定义正确安装
   npm install @types/better-sqlite3 --save-dev
   ```

3. **better-sqlite3 安装失败**
   ```bash
   # 使用 legacy-peer-deps 标志
   npm install better-sqlite3 --legacy-peer-deps
   ```

## 📚 进阶功能

### 数据备份和恢复

```typescript
import { getTaskORM } from './db/TaskORM';

const orm = getTaskORM();

// 备份数据库
orm.backup('./backups/pomodoro_' + new Date().toISOString() + '.db');

// 执行原始SQL查询
const customQuery = orm.executeRawQuery(
  'SELECT category, COUNT(*) as count FROM tasks GROUP BY category'
);
```

### 批量操作

```typescript
// 批量更新任务状态
const batchUpdateTasks = async (taskIds: number[], updates: Partial<Task>) => {
  const orm = getTaskORM();
  const results = taskIds.map(id => orm.update(id, updates));
  return results.every(result => result);
};
```

迁移完成后，你的应用将拥有更强大的数据管理能力，同时保持与原有功能的兼容性。 