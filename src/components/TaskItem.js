import React from 'react';
import './TaskItem.css';

function TaskItem({ 
  task, 
  index, 
  isActive, 
  isRunning,
  onStartPomodoro, 
  onDelete, 
  onOpenProgressModal 
}) {
  const handleClick = () => {
    if (!task.completed) {
      onStartPomodoro(task.id);
    }
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    onOpenProgressModal(task);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  // 计算番茄钟显示值
  const getPomodoroDisplay = () => {
    if (task.completed && task.timeSpent > 0) {
      const timeRatio = task.timeSpent / 25;
      const roundedRatio = Math.round(timeRatio * 10) / 10;
      if (roundedRatio === Math.floor(roundedRatio) || (timeRatio * 10) % 1 === 0) {
        return `🍅 x ${roundedRatio}`;
      }
    } else if (!task.completed && task.pomodoroCount > 0) {
      return `🍅 x ${task.pomodoroCount}`;
    }
    return '';
  };

  const pomodoroDisplay = getPomodoroDisplay();

  return (
    <div 
      className={`task-item ${task.completed ? 'completed' : ''} ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <div className="task-info">
        <div className="task-number">
          {isRunning ? (
            <i className="fas fa-hourglass-half" style={{color: 'white'}}></i>
          ) : (
            index + 1
          )}
        </div>
        <div className="task-details">
          <span className="task-name">{task.name}</span>
          <span className="task-date">{task.date}</span>
        </div>
        <div className="task-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{task.progress}%</div>
        </div>
        {pomodoroDisplay && (
          <span className="task-timer">{pomodoroDisplay}</span>
        )}
      </div>
      <div className="task-actions">
        <button 
          className="btn-icon btn-info" 
          onClick={handleProgressClick}
          title="更新进度"
        >
          <i className="fas fa-hand-pointer"></i>
        </button>
        <button 
          className="btn-icon btn-danger" 
          onClick={handleDeleteClick}
          title="删除任务"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}

export default TaskItem; 