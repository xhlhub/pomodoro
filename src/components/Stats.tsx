import React, { useMemo } from "react";
import "./Stats.css";
import { StatsProps } from "../types";
import { POMODORO_DURATION_MINUTES } from "../config/appConfig";

const Stats: React.FC<StatsProps> = ({ tasks }) => {
  // 计算所有任务的总专注时间（分钟）
  const totalTaskTime = useMemo(() => {
    const totalSeconds = tasks.reduce(
      (total, task) => total + task.timeSpent,
      0
    );
    return Math.round(totalSeconds / 60); // 转换为分钟并四舍五入
  }, [tasks]);

  // 计算累计番茄数（根据总专注时间折算，向下取整）
  // const totalTomatoCount = useMemo(() => {
  //   return Math.floor(totalTaskTime / POMODORO_DURATION_MINUTES);
  // }, [totalTaskTime]);

  return (
    <div className="stats-section">
      <div className="stats-card">
        <h4>
          <i className="fas fa-chart-bar"></i> 今日统计
        </h4>
        <div className="stats-grid">
          {/*
          <div className="stat-item">
            <span className="stat-number">{totalTomatoCount}</span>
            <span className="stat-label">
             🍅 今日累计番茄数
            </span>
          </div>
          */}
          <div className="stat-item">
            <span className="stat-number">{totalTaskTime}</span>
            <span className="stat-label">
              <i className="fas fa-clock"></i> 今日专注时间(分钟)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
