import React from 'react';
import './TaskItem.css';
import ClockIcon from './ClockIcon';
import { POMODORO_DURATION_MINUTES } from '../config/appConfig';

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
      // 任务完成时：显示实际花费时间的番茄钟比例（支持小数）
      const timeRatio = task.timeSpent / POMODORO_DURATION_MINUTES;
      const roundedRatio = Math.round(timeRatio * 10) / 10;
      return `🍅 x ${roundedRatio}`;
    } else if (!task.completed && task.pomodoroCount > 0) {
      // 任务未完成时：显示完整的番茄钟数量（整数）
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
            <ClockIcon size={24} color="white" />
          ) : (
            index + 1
          )}
        </div>
        <div className="task-details">
          <span className="task-name">{task.name}</span>
          <span className="task-date">{task.date}</span>
        </div>
        {pomodoroDisplay && (
          <span className="task-timer">{pomodoroDisplay}</span>
        )}
        <div className="task-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{task.progress}%</div>
        </div>
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