import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import TaskManager from './components/TaskManager';
import Timer from './components/Timer';
import Stats from './components/Stats';
import ProgressModal from './components/ProgressModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getCurrentDateString } from './utils/dateUtils';
import { POMODORO_DURATION_SECONDS, POMODORO_DURATION_MINUTES } from './config/appConfig';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

function App() {
  const [tasks, setTasks] = useLocalStorage('pomodoro-tasks', []);
  const [stats, setStats] = useLocalStorage('pomodoro-stats', { completedPomodoros: 0, totalTime: 0 });
  const [currentTask, setCurrentTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState(null);
  // 为每个任务维护独立的计时器状态
  const [taskTimerStates, setTaskTimerStates] = useLocalStorage('pomodoro-timer-states', {});
  
  // 全局计时器引用
  const globalTimerRef = useRef(null);

  // 初始化时为旧任务添加新字段和计时器状态
  useEffect(() => {
    const updatedTasks = tasks.map(task => ({
      ...task,
      progress: task.progress || 0,
      date: task.date || getCurrentDateString(),
      createdAt: task.createdAt || new Date().toISOString(),
      timeSpent: task.timeSpent || (task.pomodoroCount * POMODORO_DURATION_MINUTES)
    }));
    
    // 为缺少计时器状态的任务添加默认状态
    const newTimerStates = { ...taskTimerStates };
    let needsUpdate = false;
    
    tasks.forEach(task => {
      if (!newTimerStates[task.id]) {
        newTimerStates[task.id] = {
          timeLeft: POMODORO_DURATION_SECONDS,
          isRunning: false,
          isPaused: false
        };
        needsUpdate = true;
      }
    });
    
    if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
      setTasks(updatedTasks);
    }
    
         if (needsUpdate) {
       setTaskTimerStates(newTimerStates);
     }
   }, [tasks, setTasks, taskTimerStates, setTaskTimerStates]);

  

  const onPomodoroComplete = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // 播放完成音效
      const cheersSoundRef = new Audio('audio/cheers.mp3');
      cheersSoundRef.play().catch(e => console.log('音效播放失败:', e));

      // 显示完成消息
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
      showCompletionMessage();

      // 更新任务统计（timeSpent已在全局计时器中实时更新，这里只更新pomodoroCount）
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, pomodoroCount: t.pomodoroCount + 1 }
          : t
      ));
      
      // 更新全局统计（使用实际花费时间）
      const actualTimeSpent = POMODORO_DURATION_MINUTES; // 一个完整番茄钟的时间
      setStats(prev => ({
        completedPomodoros: prev.completedPomodoros + 1,
        totalTime: prev.totalTime + actualTimeSpent
      }));

      // 发送通知
      if (ipcRenderer) {
        ipcRenderer.send('pomodoro-complete', task.name);
      }
    }
  }, [tasks, setTasks, setStats]);

  // 全局计时器逻辑 - 为所有正在运行的任务计时
  useEffect(() => {
    // 启动全局计时器，每秒检查所有任务状态
    globalTimerRef.current = setInterval(() => {
      const runningTaskIds = [];
      
      setTaskTimerStates(prev => {
        const newStates = { ...prev };
        let hasTimerChanges = false;

        // 遍历所有任务，为正在运行的任务计时
        Object.keys(newStates).forEach(taskId => {
          const currentState = newStates[taskId];
          if (currentState && currentState.isRunning && currentState.timeLeft > 0) {
            
            if (currentState.timeLeft <= 1) {
              // 计时结束
              newStates[taskId] = {
                ...currentState,
                timeLeft: POMODORO_DURATION_SECONDS,
                isRunning: false,
                isPaused: false
              };
              
              // 最后一秒也要计入时间
              runningTaskIds.push(taskId);
              
              // 触发完成回调
              setTimeout(() => onPomodoroComplete(parseInt(taskId)), 100);
              hasTimerChanges = true;
            } else {
              // 减少时间，这秒的时间会在下面统一更新
              newStates[taskId] = {
                ...currentState,
                timeLeft: currentState.timeLeft - 1
              };
              runningTaskIds.push(taskId);
              hasTimerChanges = true;
            }
          }
        });

        return hasTimerChanges ? newStates : prev;
      });

      // 为所有正在运行的任务更新timeSpent（每秒增加1/60分钟）
      if (runningTaskIds.length > 0) {
        const secondsToMinutes = Math.round((1 / 60) * 10000) / 10000; // 1秒 = 1/60分钟，保留4位小数精度
        
        setTasks(prevTasks => 
          prevTasks.map(task => 
            runningTaskIds.includes(task.id.toString()) 
              ? { ...task, timeSpent: Math.round((task.timeSpent + secondsToMinutes) * 10000) / 10000 }
              : task
          )
        );
      }
    }, 1000);

    return () => clearInterval(globalTimerRef.current);
  }, [onPomodoroComplete, setTasks]); // 移除taskTimerStates依赖

  const addTask = useCallback((taskName) => {
    const newTask = {
      id: Date.now(),
      name: taskName,
      completed: false,
      pomodoroCount: 0,
      timeSpent: 0,
      progress: 0,
      date: getCurrentDateString(),
      createdAt: new Date().toISOString(),
    };
    
    // 为新任务初始化计时器状态
    setTaskTimerStates(prev => ({
      ...prev,
      [newTask.id]: {
        timeLeft: POMODORO_DURATION_SECONDS,
        isRunning: false,
        isPaused: false
      }
    }));
    
    setTasks(prev => [...prev, newTask]);
  }, [setTasks, setTaskTimerStates]);

  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    // 删除对应的计时器状态
    setTaskTimerStates(prev => {
      const newStates = { ...prev };
      delete newStates[taskId];
      return newStates;
    });
    if (currentTask && currentTask.id === taskId) {
      setCurrentTask(null);
    }
  }, [setTasks, setTaskTimerStates, currentTask]);

  const updateTaskProgress = useCallback((taskId, progress) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const wasCompleted = task.completed;
        const updatedTask = {
          ...task,
          progress,
          completed: progress >= 100
        };
        
        // 如果任务刚完成，播放音效
        if (!wasCompleted && progress >= 100) {
          const audio = new Audio('audio/cheers.mp3');
          audio.play().catch(e => console.log('音效播放失败:', e));
        }
        
        return updatedTask;
      }
      return task;
    }));
  }, [setTasks]);

  const startTaskPomodoro = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      setCurrentTask(task);
      if (ipcRenderer) {
        ipcRenderer.send('pomodoro-start', task.name);
      }
    }
  }, [tasks]);

  const openProgressModal = useCallback((task) => {
    setSelectedTaskForProgress(task);
    setIsModalOpen(true);
  }, []);

  const closeProgressModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTaskForProgress(null);
  }, []);

  // 更新任务计时器状态
  const updateTaskTimerState = useCallback((taskId, newState) => {
    setTaskTimerStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...newState
      }
    }));
  }, [setTaskTimerStates]);

  // 获取当前任务的计时器状态
  const getCurrentTaskTimerState = useCallback(() => {
    if (!currentTask) return null;
    return taskTimerStates[currentTask.id] || {
      timeLeft: POMODORO_DURATION_SECONDS,
      isRunning: false,
      isPaused: false
    };
  }, [currentTask, taskTimerStates]);

  // 检查任务是否正在运行
  const isTaskRunning = useCallback((taskId) => {
    const timerState = taskTimerStates[taskId];
    return timerState ? timerState.isRunning : false;
  }, [taskTimerStates]);

  // 暂停除指定任务外的所有正在运行的任务
  const pauseOtherRunningTasks = useCallback((excludeTaskId) => {
    console.log('pauseOtherRunningTasks 被调用，排除任务ID:', excludeTaskId);
    console.log('当前任务状态:', taskTimerStates);
    
    const updatedTimerStates = { ...taskTimerStates };
    let hasChanges = false;
    
    Object.keys(updatedTimerStates).forEach(id => {
      if (parseInt(id) !== excludeTaskId && updatedTimerStates[id].isRunning) {
        console.log(`暂停任务 ${id}, 当前状态:`, updatedTimerStates[id]);
        updatedTimerStates[id] = {
          ...updatedTimerStates[id],
          isRunning: false,
          isPaused: true
        };
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      console.log('更新后的状态:', updatedTimerStates);
      setTaskTimerStates(updatedTimerStates);
    } else {
      console.log('没有需要暂停的任务');
    }
  }, [taskTimerStates, setTaskTimerStates]);

  // 原子操作：暂停其他任务并启动当前任务
  const startTaskTimer = useCallback((taskId, newState) => {
    console.log('startTaskTimer 被调用，任务ID:', taskId, '新状态:', newState);
    console.log('当前任务状态:', taskTimerStates);
    
    const updatedTimerStates = { ...taskTimerStates };
    
    // 暂停所有其他正在运行的任务
    Object.keys(updatedTimerStates).forEach(id => {
      if (parseInt(id) !== taskId && updatedTimerStates[id].isRunning) {
        console.log(`暂停任务 ${id}`);
        updatedTimerStates[id] = {
          ...updatedTimerStates[id],
          isRunning: false,
          isPaused: true
        };
      }
    });
    
    // 更新当前任务状态
    updatedTimerStates[taskId] = {
      ...updatedTimerStates[taskId],
      ...newState
    };
    
    console.log('更新后的状态:', updatedTimerStates);
    setTaskTimerStates(updatedTimerStates);
  }, [taskTimerStates, setTaskTimerStates]);

  return (
    <div className="App">
      <div className="container">
        <Header />
        
        <TaskManager
          tasks={tasks}
          currentTask={currentTask}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onStartPomodoro={startTaskPomodoro}
          onOpenProgressModal={openProgressModal}
          isTaskRunning={isTaskRunning}
        />
        
        {tasks.length > 0 && (
          <Timer
            currentTask={currentTask}
            timerState={getCurrentTaskTimerState()}
            onComplete={onPomodoroComplete}
            onStop={() => setCurrentTask(null)}
            onTimerStateUpdate={updateTaskTimerState}
            onPauseOtherTasks={pauseOtherRunningTasks}
            onStartTaskTimer={startTaskTimer}
          />
        )}
        
        <Stats
          completedPomodoros={stats.completedPomodoros}
          totalTime={stats.totalTime}
        />
        
        {isModalOpen && selectedTaskForProgress && (
          <ProgressModal
            task={selectedTaskForProgress}
            onClose={closeProgressModal}
            onUpdateProgress={updateTaskProgress}
          />
        )}
      </div>
    </div>
  );
}

export default App; 