import React, { useState, useEffect, useRef } from 'react';
import TaskItem from './TaskItem';
import './TaskManager.css';
import { TaskManagerProps, Task } from '../types';

const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks, 
  currentTask, 
  taskCategories,
  onAddTask, 
  onDeleteTask, 
  onStartPomodoro, 
  onOpenProgressModal,
  onAddCategory,
  onDeleteCategory,
  isTaskRunning
}) => {
  const [taskInput, setTaskInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(taskCategories[0] || '生活');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 处理分类变化时的默认选择
  useEffect(() => {
    if (taskCategories.length > 0 && !taskCategories.includes(selectedCategory)) {
      setSelectedCategory(taskCategories[0]);
    }
  }, [taskCategories, selectedCategory]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    const taskName = taskInput.trim();
    if (taskName) {
      try {
        await onAddTask(taskName, selectedCategory);
        setTaskInput('');
      } catch (error) {
        console.error('添加任务失败:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  const handleAddCategory = async (): Promise<void> => {
    const categoryName = newCategoryInput.trim();
    if (categoryName) {
      try {
        await onAddCategory(categoryName);
        setNewCategoryInput('');
      } catch (error) {
        console.error('添加分类失败:', error);
      }
    }
  };

  const handleDeleteCategory = async (categoryName: string): Promise<void> => {
    try {
      await onDeleteCategory(categoryName);
      if (selectedCategory === categoryName) {
        setSelectedCategory(taskCategories.filter(cat => cat !== categoryName)[0] || '生活');
      }
    } catch (error) {
      console.error('删除分类失败:', error);
    }
  };

  const handleDeleteCategoryFromDropdown = async (e: React.MouseEvent<HTMLButtonElement>, categoryName: string): Promise<void> => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发选择分类
    await handleDeleteCategory(categoryName);
  };

  // 按分类分组任务
  const groupedTasks: Record<string, Task[]> = taskCategories.reduce((groups, category) => {
    groups[category] = tasks.filter(task => task.category === category);
    return groups;
  }, {} as Record<string, Task[]>);

  return (
    <div className="task-section">
      {/* 复合添加任务输入框 */}
      <div className="task-input-container">
        <div className="task-input-wrapper">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入新任务..."
            maxLength={50}
            className="task-input"
          />
          
          {/* 分类标签选择器 - 在输入框内部 */}
          <div className="category-tag-selector" ref={dropdownRef}>
            <div 
              className="category-tag"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              {selectedCategory ? (
                <span className="category-tag-text">{selectedCategory}</span>
              ) : (
                <span className="category-tag-placeholder"></span>
              )}
            </div>
            
            {showCategoryDropdown && (
              <div className="category-dropdown">
                {taskCategories.map(category => (
                  <div 
                    key={category}
                    className={`category-option ${selectedCategory === category ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <span className="category-option-name">{category}</span>
                    {taskCategories.length > 1 && (
                      <button 
                        className="category-option-delete"
                        onClick={(e) => handleDeleteCategoryFromDropdown(e, category)}
                        title={`删除分类 "${category}"`}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                ))}
                
                {/* 简化的添加新分类 */}
                <div className="add-category-section">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="新分类名"
                    className="new-category-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory();
                      }
                    }}
                  />
                  <button 
                    className="add-category-btn"
                    onClick={handleAddCategory}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          className="btn btn-primary add-task-btn"
        >
          <i className="fas fa-plus"></i> 添加任务
        </button>
      </div>

      {/* 按分类分组显示任务 */}
      <div className="task-categories">
        {taskCategories.map(category => (
          groupedTasks[category] && groupedTasks[category].length > 0 && (
            <div key={category} className="task-category-group">
              <h3 className="category-title">
                <span className="category-title-content">
                  {category} 
                </span>
              </h3>
              <div className="task-list">
                {groupedTasks[category].map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    isActive={currentTask ? currentTask.id === task.id : false}
                    isRunning={isTaskRunning(task.id)}
                    onStartPomodoro={onStartPomodoro}
                    onDelete={onDeleteTask}
                    onOpenProgressModal={onOpenProgressModal}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default React.memo(TaskManager); 