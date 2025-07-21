import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Timer.css';

function Timer({ currentTask, timerState, onComplete, onStop, onTimerStateUpdate }) {
  const timerRef = useRef(null);
  const clockSoundRef = useRef(null);
  const cheersSoundRef = useRef(null);
  
  // 从传入的状态中获取计时器数据
  const timeLeft = timerState?.timeLeft || 25 * 60;
  const isRunning = timerState?.isRunning || false;
  const isPaused = timerState?.isPaused || false;

  // 初始化音效
  useEffect(() => {
    clockSoundRef.current = new Audio('audio/clock.mp3');
    cheersSoundRef.current = new Audio('audio/cheers.mp3');
  }, []);

  // 计时器逻辑
  useEffect(() => {
    if (isRunning && timeLeft > 0 && currentTask) {
      timerRef.current = setInterval(() => {
        if (timeLeft <= 1) {
          // 计时结束
          onTimerStateUpdate(currentTask.id, {
            timeLeft: 25 * 60, // 重置为25分钟
            isRunning: false,
            isPaused: false
          });
          completePomodoro();
        } else {
          // 减少时间
          onTimerStateUpdate(currentTask.id, {
            timeLeft: timeLeft - 1
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft, currentTask, onTimerStateUpdate]);



  const completePomodoro = useCallback(() => {
    // 播放完成音效
    if (cheersSoundRef.current) {
      cheersSoundRef.current.play().catch(e => console.log('音效播放失败:', e));
    }

    // 通知父组件番茄钟完成
    if (currentTask) {
      onComplete(currentTask.id);
    }

    // 显示完成消息
    showCompletionMessage();
  }, [currentTask, onComplete]);

  const showCompletionMessage = () => {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideInRight 0.3s ease;
    `;
    message.textContent = '🍅 番茄钟完成！休息一下吧！';

    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 3000);
  };

  const startPomodoro = () => {
    if (!currentTask) return;

    onTimerStateUpdate(currentTask.id, {
      isRunning: true,
      isPaused: false
    });

    // 播放开始音效
    if (clockSoundRef.current) {
      clockSoundRef.current.play().catch(e => console.log('音效播放失败:', e));
    }
  };

  const pausePomodoro = () => {
    if (!currentTask) return;
    
    onTimerStateUpdate(currentTask.id, {
      isRunning: false,
      isPaused: true
    });
  };

  const resumePomodoro = () => {
    if (!currentTask) return;
    
    onTimerStateUpdate(currentTask.id, {
      isRunning: true,
      isPaused: false
    });
  };

  const stopPomodoro = () => {
    if (!currentTask) return;
    
    onTimerStateUpdate(currentTask.id, {
      isRunning: false,
      isPaused: false,
      timeLeft: 25 * 60
    });
    onStop();
  };

  const formatTime = (seconds) => {
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
        
        <button 
          className="btn btn-danger" 
          onClick={stopPomodoro}
        >
          <i className="fas fa-stop"></i> 停止
        </button>
      </div>

      <div className="current-task">
        <h3>当前任务：<span>{currentTask.name}</span></h3>
      </div>
    </div>
  );
}

export default Timer; 