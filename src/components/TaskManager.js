import React, { useState, useEffect, useRef } from 'react';
import TaskItem from './TaskItem';
import './TaskManager.css';

function TaskManager({ 
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
}) {
  const [taskInput, setTaskInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(taskCategories[0] || '生活');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const dropdownRef = useRef(null);

  // 处理分类变化时的默认选择
  useEffect(() => {
    if (taskCategories.length > 0 && !taskCategories.includes(selectedCategory)) {
      setSelectedCategory(taskCategories[0]);
    }
  }, [taskCategories, selectedCategory]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const taskName = taskInput.trim();
    if (taskName) {
      onAddTask(taskName, selectedCategory);
      setTaskInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleAddCategory = () => {
    const categoryName = newCategoryInput.trim();
    if (categoryName) {
      onAddCategory(categoryName);
      setNewCategoryInput('');
    }
  };

  const handleDeleteCategory = (categoryName) => {
    onDeleteCategory(categoryName);
    if (selectedCategory === categoryName) {
      setSelectedCategory(taskCategories.filter(cat => cat !== categoryName)[0] || '生活');
    }
  };

  const handleDeleteCategoryFromDropdown = (e, categoryName) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发选择分类
    handleDeleteCategory(categoryName);
  };

  // 按分类分组任务
  const groupedTasks = taskCategories.reduce((groups, category) => {
    groups[category] = tasks.filter(task => task.category === category);
    return groups;
  }, {});

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
            maxLength="50"
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
                  <i className="fas fa-folder"></i> {category} 
                  <span className="task-count">({groupedTasks[category].length})</span>
                </span>
              </h3>
              <div className="task-list">
                {groupedTasks[category].map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    isActive={currentTask && currentTask.id === task.id}
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
}

export default TaskManager; 