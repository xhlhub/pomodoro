import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import TaskManager from './components/TaskManager';
import Timer from './components/Timer';
import Stats from './components/Stats';
import ProgressModal from './components/ProgressModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getCurrentDateString } from './utils/dateUtils';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

function App() {
  const [tasks, setTasks] = useLocalStorage('pomodoro-tasks', []);
  const [stats, setStats] = useLocalStorage('pomodoro-stats', { completedPomodoros: 0, totalTime: 0 });
  const [currentTask, setCurrentTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState(null);
  // 为每个任务维护独立的计时器状态
  const [taskTimerStates, setTaskTimerStates] = useLocalStorage('pomodoro-timer-states', {});

  // 初始化时为旧任务添加新字段和计时器状态
  useEffect(() => {
    const updatedTasks = tasks.map(task => ({
      ...task,
      progress: task.progress || 0,
      date: task.date || getCurrentDateString(),
      createdAt: task.createdAt || new Date().toISOString(),
      timeSpent: task.timeSpent || (task.pomodoroCount * 25)
    }));
    
    // 为缺少计时器状态的任务添加默认状态
    const newTimerStates = { ...taskTimerStates };
    let needsUpdate = false;
    
    tasks.forEach(task => {
      if (!newTimerStates[task.id]) {
        newTimerStates[task.id] = {
          timeLeft: 25 * 60,
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
        timeLeft: 25 * 60, // 25分钟，以秒为单位
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

  const onPomodoroComplete = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // 更新任务统计
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, pomodoroCount: t.pomodoroCount + 1, timeSpent: t.timeSpent + 25 }
          : t
      ));
      
      // 更新全局统计
      setStats(prev => ({
        completedPomodoros: prev.completedPomodoros + 1,
        totalTime: prev.totalTime + 25
      }));

      // 发送通知
      if (ipcRenderer) {
        ipcRenderer.send('pomodoro-complete', task.name);
      }
    }
  }, [tasks, setTasks, setStats]);

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
      timeLeft: 25 * 60,
      isRunning: false,
      isPaused: false
    };
  }, [currentTask, taskTimerStates]);

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
        />
        
        {tasks.length > 0 && (
          <Timer
            currentTask={currentTask}
            timerState={getCurrentTaskTimerState()}
            onComplete={onPomodoroComplete}
            onStop={() => setCurrentTask(null)}
            onTimerStateUpdate={updateTaskTimerState}
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