import React, { useState } from 'react';
import TaskItem from './TaskItem';
import './TaskManager.css';

function TaskManager({ 
  tasks, 
  currentTask, 
  onAddTask, 
  onDeleteTask, 
  onStartPomodoro, 
  onOpenProgressModal 
}) {
  const [taskInput, setTaskInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const taskName = taskInput.trim();
    if (taskName) {
      onAddTask(taskName);
      setTaskInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="task-section">
      <div className="task-input-container">
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入新任务..."
          maxLength="50"
          className="task-input"
        />
        <button 
          onClick={handleSubmit}
          className="btn btn-primary"
        >
          <i className="fas fa-plus"></i> 添加任务
        </button>
      </div>

      <div className="task-list">
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            index={index}
            isActive={currentTask && currentTask.id === task.id}
            onStartPomodoro={onStartPomodoro}
            onDelete={onDeleteTask}
            onOpenProgressModal={onOpenProgressModal}
          />
        ))}
      </div>
    </div>
  );
}

export default TaskManager; 