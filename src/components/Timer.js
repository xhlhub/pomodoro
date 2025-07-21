import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Timer.css';

function Timer({ currentTask, onComplete, onStop }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟，以秒为单位
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const clockSoundRef = useRef(null);
  const cheersSoundRef = useRef(null);

  // 初始化音效
  useEffect(() => {
    clockSoundRef.current = new Audio('audio/clock.mp3');
    cheersSoundRef.current = new Audio('audio/cheers.mp3');
  }, []);

  // 计时器逻辑
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 计时结束
            setIsRunning(false);
            setIsPaused(false);
            completePomodoro();
            return 25 * 60; // 重置为25分钟
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  // 当前任务改变时重置计时器
  useEffect(() => {
    if (currentTask) {
      setTimeLeft(25 * 60);
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [currentTask]);

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

    setIsRunning(true);
    setIsPaused(false);

    // 播放开始音效
    if (clockSoundRef.current) {
      clockSoundRef.current.play().catch(e => console.log('音效播放失败:', e));
    }
  };

  const pausePomodoro = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const resumePomodoro = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const stopPomodoro = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(25 * 60);
    onStop();
  };

  const formatTime = (seconds) => {
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