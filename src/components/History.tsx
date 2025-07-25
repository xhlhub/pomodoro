import React from 'react';
import './History.css';
import { Task } from '../types';

interface HistoryProps {
  tasks: Task[];
  onGoBack: () => void;
}

const History: React.FC<HistoryProps> = ({ tasks, onGoBack }) => {
  // 过滤出已完成的任务，按完成时间倒序排列
  const completedTasks = tasks
    .filter(task => task.completed && task.completedAt)
    .sort((a, b) => {
      const dateA = new Date(a.completedAt!).getTime();
      const dateB = new Date(b.completedAt!).getTime();
      return dateB - dateA;
    });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (taskDate.getTime() === today.getTime()) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === yesterday.getTime()) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="history">
      <div className="history-header">
        <button className="back-button" onClick={onGoBack} title="返回">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2>📚 历史记录</h2>
      </div>

      <div className="history-content">
        {completedTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>还没有完成的任务</p>
            <p className="empty-subtitle">完成任务后会在这里显示</p>
          </div>
        ) : (
          <div className="history-list">
            <div className="history-summary">
              <div className="summary-card">
                <span className="summary-number">{completedTasks.length}</span>
                <span className="summary-label">已完成任务</span>
              </div>
              <div className="summary-card">
                <span className="summary-number">
                  {Math.floor(completedTasks.reduce((total, task) => total + task.timeSpent, 0) / 3600)}
                </span>
                <span className="summary-label">总计小时</span>
              </div>
            </div>

            {completedTasks.map((task) => (
              <div key={task.id} className="history-item">
                <div className="task-info">
                  <div className="task-header">
                    <h3 className="task-name">{task.name}</h3>
                    <span className="task-category">{task.category}</span>
                  </div>
                  <div className="task-meta">
                    <span className="completion-time">
                      完成于 {formatDate(task.completedAt!)}
                    </span>
                    <span className="time-spent">
                      耗时 {formatDuration(task.timeSpent)}
                    </span>
                  </div>
                </div>
                <div className="task-progress">
                  <div className="progress-circle">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="#28a745"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(task.progress / 100) * 100.5} 100.5`}
                        strokeDashoffset="25.125"
                        transform="rotate(-90 20 20)"
                      />
                    </svg>
                    <span className="progress-text">✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History; 