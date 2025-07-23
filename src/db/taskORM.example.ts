import { TaskORM, getTaskORM, closeTaskORM } from './TaskORM';
import { Task } from '../types';

/**
 * TaskORM 使用示例
 * 
 * 这个文件展示了如何使用 TaskORM 类进行各种数据库操作
 */

// 使用示例函数
export async function taskORMExample() {
  console.log('=== TaskORM 使用示例 ===');

  try {
    // 1. 获取ORM实例（单例模式）
    const orm = getTaskORM();
    
    console.log('\n1. 创建新任务');
    // 创建几个示例任务
    const task1 = orm.create({
      name: '学习React',
      category: '工作',
      completed: false,
      pomodoroCount: 0,
      timeSpent: 0,
      progress: 0,
      date: '2024-01-20',
      createdAt: new Date().toISOString()
    });
    console.log('创建任务1:', task1);

    const task2 = orm.create({
      name: '锻炼身体',
      category: '生活',
      completed: false,
      pomodoroCount: 0,
      timeSpent: 0,
      progress: 50,
      date: '2024-01-20',
      createdAt: new Date().toISOString()
    });
    console.log('创建任务2:', task2);

    console.log('\n2. 查询操作');
    // 查询所有任务
    const allTasks = orm.findAll();
    console.log('所有任务:', allTasks);

    // 根据ID查询
    const foundTask = orm.findById(task1.id);
    console.log('根据ID查询任务:', foundTask);

    // 根据分类查询
    const workTasks = orm.findByCategory('工作');
    console.log('工作分类任务:', workTasks);

    // 根据日期查询
    const todayTasks = orm.findByDate('2024-01-20');
    console.log('今日任务:', todayTasks);

    console.log('\n3. 更新操作');
    // 更新任务进度
    orm.updateProgress(task1.id, 75);
    console.log('任务1进度已更新到75%');

    // 更新番茄钟计数
    orm.updatePomodoroCount(task1.id, 3);
    console.log('任务1番茄钟计数已更新到3');

    // 更新任务用时
    orm.updateTimeSpent(task1.id, 5400); // 1.5小时
    console.log('任务1用时已更新到5400秒');

    // 完整更新任务
    orm.update(task2.id, {
      name: '健身锻炼 - 已完成',
      progress: 100,
      completed: true,
      pomodoroCount: 2,
      timeSpent: 3600
    });
    console.log('任务2已完整更新');

    // 标记任务完成
    orm.markCompleted(task1.id, true);
    console.log('任务1已标记为完成');

    console.log('\n4. 统计信息');
    const stats = orm.getStats();
    console.log('任务统计:', stats);

    console.log('\n5. 分类管理');
    // 添加新分类
    orm.addCategory('学习');
    orm.addCategory('娱乐');
    
    // 获取所有分类
    const categories = orm.getCategories();
    console.log('所有分类:', categories);

    console.log('\n6. 查看更新后的所有任务');
    const updatedTasks = orm.findAll();
    console.log('更新后的所有任务:', updatedTasks);

    console.log('\n7. 高级查询示例');
    // 执行原始SQL查询
    const completedTasksCount = orm.executeRawQuery(
      'SELECT COUNT(*) as count FROM tasks WHERE completed = ?', 
      [1]
    );
    console.log('已完成任务数量:', completedTasksCount);

    // 查询高进度任务
    const highProgressTasks = orm.executeRawQuery(
      'SELECT * FROM tasks WHERE progress >= ? ORDER BY progress DESC', 
      [50]
    );
    console.log('高进度任务:', highProgressTasks);

    console.log('\n8. 数据备份');
    try {
      orm.backup('./data/pomodoro_backup.db');
      console.log('数据库备份成功');
    } catch (error) {
      console.log('数据库备份失败:', error);
    }

    // 最后清理 - 删除示例任务
    console.log('\n9. 清理测试数据');
    orm.delete(task1.id);
    orm.delete(task2.id);
    console.log('测试任务已删除');

  } catch (error) {
    console.error('示例运行出错:', error);
  } finally {
    // 关闭数据库连接
    closeTaskORM();
    console.log('数据库连接已关闭');
  }
}

/**
 * 批量操作示例
 */
export function batchOperationsExample() {
  console.log('\n=== 批量操作示例 ===');
  
  const orm = getTaskORM();
  
  try {
    // 批量创建任务
    const taskData = [
      { name: '阅读技术文档', category: '学习' },
      { name: '编写代码', category: '工作' },
      { name: '整理房间', category: '生活' },
      { name: '运动健身', category: '健康' }
    ];

    const createdTasks: Task[] = [];
    taskData.forEach(data => {
      const task = orm.create({
        name: data.name,
        category: data.category,
        completed: false,
        pomodoroCount: 0,
        timeSpent: 0,
        progress: 0,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
      createdTasks.push(task);
    });

    console.log('批量创建的任务:', createdTasks);

    // 批量更新进度
    createdTasks.forEach((task, index) => {
      const progress = (index + 1) * 25; // 25%, 50%, 75%, 100%
      orm.updateProgress(task.id, progress);
      console.log(`任务 ${task.name} 进度更新为 ${progress}%`);
    });

    // 查看更新结果
    const updatedTasks = orm.findAll();
    console.log('批量更新后的任务:', updatedTasks.slice(-4)); // 只显示最后4个任务

    // 清理
    createdTasks.forEach(task => {
      orm.delete(task.id);
    });
    console.log('批量测试数据已清理');

  } catch (error) {
    console.error('批量操作出错:', error);
  }
}

/**
 * 性能测试示例
 */
export function performanceTestExample() {
  console.log('\n=== 性能测试示例 ===');
  
  const orm = getTaskORM();
  const startTime = Date.now();
  
  try {
    // 创建大量任务进行性能测试
    console.log('开始性能测试...');
    
    const tasks: Task[] = [];
    for (let i = 0; i < 100; i++) {
      const task = orm.create({
        name: `性能测试任务 ${i + 1}`,
        category: i % 2 === 0 ? '工作' : '生活',
        completed: Math.random() > 0.5,
        pomodoroCount: Math.floor(Math.random() * 10),
        timeSpent: Math.floor(Math.random() * 7200),
        progress: Math.floor(Math.random() * 101),
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
      tasks.push(task);
    }
    
    const createTime = Date.now() - startTime;
    console.log(`创建100个任务耗时: ${createTime}ms`);

    // 测试查询性能
    const queryStartTime = Date.now();
    for (let i = 0; i < 100; i++) {
      orm.findAll();
    }
    const queryTime = Date.now() - queryStartTime;
    console.log(`执行100次查询所有任务耗时: ${queryTime}ms`);

    // 测试更新性能
    const updateStartTime = Date.now();
    tasks.forEach(task => {
      orm.updateProgress(task.id, Math.floor(Math.random() * 101));
    });
    const updateTime = Date.now() - updateStartTime;
    console.log(`更新100个任务进度耗时: ${updateTime}ms`);

    // 清理测试数据
    tasks.forEach(task => {
      orm.delete(task.id);
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`性能测试总耗时: ${totalTime}ms`);

  } catch (error) {
    console.error('性能测试出错:', error);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  console.log('开始运行TaskORM示例...\n');
  
  taskORMExample()
    .then(() => batchOperationsExample())
    .then(() => performanceTestExample())
    .then(() => {
      console.log('\n所有示例运行完成！');
    })
    .catch(error => {
      console.error('示例运行失败:', error);
    });
} 