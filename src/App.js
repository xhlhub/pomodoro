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

  // 初始化时为旧任务添加新字段
  useEffect(() => {
    const updatedTasks = tasks.map(task => ({
      ...task,
      progress: task.progress || 0,
      date: task.date || getCurrentDateString(),
      createdAt: task.createdAt || new Date().toISOString(),
      timeSpent: task.timeSpent || (task.pomodoroCount * 25)
    }));
    
    if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
      setTasks(updatedTasks);
    }
  }, [tasks, setTasks]);

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
    
    setTasks(prev => [...prev, newTask]);
  }, [setTasks]);

  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (currentTask && currentTask.id === taskId) {
      setCurrentTask(null);
    }
  }, [setTasks, currentTask]);

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
            onComplete={onPomodoroComplete}
            onStop={() => setCurrentTask(null)}
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