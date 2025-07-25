import React, { useState, useEffect, useCallback } from 'react';
import './History.css';
import { Task } from '../types';
import { useTaskORM } from '../hooks/useTaskORM';
import { getDateStart, getDateEnd } from '../utils/dateUtils';

interface HistoryProps {
  onGoBack: () => void;
}

const History: React.FC<HistoryProps> = ({ onGoBack }) => {
  const { loadHistoryTasksInRange } = useTaskORM();
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 加载历史任务
  const loadHistoryTasks = useCallback(async (start?: Date, end?: Date) => {
    try {
      setLoading(true);
      const tasks = await loadHistoryTasksInRange(start, end);
      setHistoryTasks(tasks);
    } catch (error) {
      console.error("加载历史任务失败:", error);
    } finally {
      setLoading(false);
    }
  }, [loadHistoryTasksInRange]);

  // 初始化加载所有历史任务
  useEffect(() => {
    loadHistoryTasks();
  }, [loadHistoryTasks]);

  // 处理时间范围搜索
  const handleDateRangeSearch = useCallback(() => {
    if (startDate && endDate) {
      const start = getDateStart(new Date(startDate));
      const end = getDateEnd(new Date(endDate));
      loadHistoryTasks(start, end);
    } else {
      // 如果没有选择日期范围，加载所有历史任务
      loadHistoryTasks();
    }
  }, [startDate, endDate, loadHistoryTasks]);

  // 清除日期范围筛选
  const handleClearDateRange = useCallback(() => {
    setStartDate('');
    setEndDate('');
    loadHistoryTasks();
  }, [loadHistoryTasks]);

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

      <div className="history-filters">
        <div className="date-range-filter">
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="开始日期"
            />
            <span>至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="结束日期"
            />
          </div>
          <div className="filter-buttons">
            <button onClick={handleDateRangeSearch} className="search-button">
              搜索
            </button>
            <button onClick={handleClearDateRange} className="clear-button">
              清除
            </button>
          </div>
        </div>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading">
            <p>加载中...</p>
          </div>
        ) : historyTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>没有找到历史任务</p>
            <p className="empty-subtitle">
              {startDate || endDate ? "请尝试调整时间范围" : "完成任务后会在这里显示"}
            </p>
          </div>
        ) : (
          <div className="history-list">
            <div className="history-summary">
              <div className="summary-card">
                <span className="summary-number">{historyTasks.length}</span>
                <span className="summary-label">已完成任务</span>
              </div>
              <div className="summary-card">
                <span className="summary-number">
                  {Math.floor(historyTasks.reduce((total, task) => total + task.timeSpent, 0) / 3600)}
                </span>
                <span className="summary-label">总计小时</span>
              </div>
            </div>

            {historyTasks.map((task) => (
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