import React from 'react';
import './Stats.css';

function Stats({ completedPomodoros, totalTime }) {
  return (
    <div className="stats-section">
      <div className="stats-card">
        <h4><i className="fas fa-chart-bar"></i> 今日统计</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{completedPomodoros}</span>
            <span className="stat-label">
              <i className="fas fa-clock"></i> 完成番茄钟
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{totalTime}</span>
            <span className="stat-label">
              <i className="fas fa-hourglass-half"></i> 总专注时间(分钟)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats; 