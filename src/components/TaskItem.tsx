import React from "react";
import "./TaskItem.css";
import ClockIcon from "./ClockIcon";
import { POMODORO_DURATION_MINUTES } from "../config/appConfig";
import { TaskItemProps } from "../types";

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  isActive,
  isRunning,
  onStartPomodoro,
  onDelete,
  onOpenProgressModal,
}) => {
  console.log("task", task);

  // 格式化日期为月日格式
  const formatDateToMonthDay = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    } catch (error) {
      return dateStr; // 如果格式化失败，返回原始字符串
    }
  };

  // 检查日期是否为今天
  const isToday = (dateStr: string): boolean => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  };

  // 获取显示的创建日期
  const getDisplayDate = (): string | null => {
    if (!task.completed && !isToday(task.createdAt)) {
      return `创建于: ${formatDateToMonthDay(task.createdAt)}`;
    }
    return null;
  };

  const handleClick = (): void => {
    if (!task.completed) {
      onStartPomodoro(task.id);
    }
  };

  const handleProgressClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ): void => {
    e.stopPropagation();
    onOpenProgressModal(task);
  };

  const handleDeleteClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.stopPropagation();
    try {
      await onDelete(task.id);
    } catch (error) {
      console.error("删除任务失败:", error);
    }
  };

  // 计算番茄钟显示值
  const getPomodoroDisplay = (): string => {
    if (task.timeSpent > 0) {
      const timeInMinutes = task.timeSpent / 60;
      const timeRatio = timeInMinutes / POMODORO_DURATION_MINUTES;
      const roundedRatio = Math.round(timeRatio * 10) / 10;
      return `🍅 x ${roundedRatio}`;
    }
    return "";
  };

  const pomodoroDisplay = getPomodoroDisplay();

  return (
    <div
      className={`task-item ${task.completed ? "completed" : ""} ${
        isActive ? "active" : ""
      }`}
      onClick={handleClick}
    >
      <div className="task-info">
        <div className="task-number">
          {isRunning ? <ClockIcon size={24} color="white" /> : index + 1}
        </div>
        <div className="task-details">
          <span className="task-name">{task.name}</span>
          {getDisplayDate() && (
            <span className="task-date">
              {getDisplayDate()}
            </span>
          )}
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
};

export default React.memo(TaskItem);
