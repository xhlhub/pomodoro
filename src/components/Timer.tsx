import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Timer.css';
import { POMODORO_DURATION_SECONDS } from '../config/appConfig';
import { TimerProps } from '../types';

const Timer: React.FC<TimerProps> = ({ 
  currentTask, 
  timeLeft,
  isRunning,
  onPausedTaskTimer, 
  onStartTaskTimer 
}) => {
  const clockSoundRef = useRef<HTMLAudioElement | null>(null);

  // 初始化音效
  useEffect(() => {
    clockSoundRef.current = new Audio('audio/clock.mp3');
  }, []);

  const startPomodoro = (): void => {
    if (!currentTask) return;

    console.log('开始番茄钟，当前任务:', currentTask);

    // 启动当前任务
    onStartTaskTimer(currentTask.id);

    // 播放开始音效
    if (clockSoundRef.current) {
      clockSoundRef.current.play().catch(e => console.log('音效播放失败:', e));
    }
  };

  const pausePomodoro = (): void => {
    if (!currentTask) return;
    
    onPausedTaskTimer(currentTask.id);
  };

  const resumePomodoro = (): void => {
    if (!currentTask) return;
    
    console.log('继续番茄钟，当前任务:', currentTask);
    
    // 继续当前任务
    onStartTaskTimer(currentTask.id);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentTask) {
    return null;
  }

  return (
    <div className="pomodoro-section">
      <div className="timer-display">
        <div className={`timer-circle ${isRunning ? 'running' : ''}`}>
          <div className="timer-text">{formatTime(timeLeft)}</div>
          <div className="timer-label">专注时间</div>
        </div>
      </div>

      <div className="timer-controls">
        {!isRunning && (
          <button 
            className="btn btn-success" 
            onClick={startPomodoro}
          >
            <i className="fas fa-play"></i> 开始番茄钟
          </button>
        )}
        
        {isRunning && (
          <button 
            className="btn btn-warning" 
            onClick={pausePomodoro}
          >
            <i className="fas fa-pause"></i> 暂停
          </button>
        )}
      </div>

      <div className="current-task">
        <h3>当前任务：<span>{currentTask.name}</span></h3>
      </div>
    </div>
  );
};

export default Timer; 