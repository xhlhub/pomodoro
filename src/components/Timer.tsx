import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Timer.css';
import { POMODORO_DURATION_SECONDS } from '../config/appConfig';
import { TimerProps } from '../types';

const Timer: React.FC<TimerProps> = ({ 
  currentTask, 
  timerState, 
  onPausedTaskTimer, 
  onStartTaskTimer 
}) => {
  const clockSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // 从传入的状态中获取计时器数据
  const timeLeft = timerState?.timeLeft || POMODORO_DURATION_SECONDS;
  const isRunning = timerState?.isRunning || false;
  const isPaused = timerState?.isPaused || false;

  // 初始化音效
  useEffect(() => {
    clockSoundRef.current = new Audio('audio/clock.mp3');
  }, []);

  // 移除了本地计时逻辑，现在使用全局计时器

  const startPomodoro = (): void => {
    if (!currentTask) return;

    console.log('开始番茄钟，当前任务:', currentTask);

    // 使用原子操作：暂停其他任务并启动当前任务
    onStartTaskTimer(currentTask.id, {
      isRunning: true,
      isPaused: false
    });

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
    
    // 使用原子操作：暂停其他任务并继续当前任务
    onStartTaskTimer(currentTask.id, {
      isRunning: true,
      isPaused: false
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentTask || !timerState) {
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
        {!isRunning && !isPaused && (
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
        
        {isPaused && (
          <button 
            className="btn btn-info" 
            onClick={resumePomodoro}
          >
            <i className="fas fa-play"></i> 继续
          </button>
        )}
        
        {/* <button 
          className="btn btn-danger" 
          onClick={stopPomodoro}
        >
          <i className="fas fa-stop"></i> 停止
        </button> */}
      </div>

      <div className="current-task">
        <h3>当前任务：<span>{currentTask.name}</span></h3>
      </div>
    </div>
  );
};

export default Timer; 