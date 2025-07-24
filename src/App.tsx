import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import TaskManager from './components/TaskManager';
import Timer from './components/Timer';
import Stats from './components/Stats';
import ProgressModal from './components/ProgressModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getCurrentDateString } from './utils/dateUtils';
import { POMODORO_DURATION_SECONDS } from './config/appConfig';
import { Task } from './types';

// Electron IPC类型定义
interface ElectronIPC {
  ipcRenderer?: {
    send: (channel: string, ...args: any[]) => void;
    sendSync: (channel: string, ...args: any[]) => any;
  };
}

// 正在运行的任务状态
interface RunningTask {
  taskId: number;
  runningTime: number; // 已运行的秒数
}

const electron: ElectronIPC = window.require ? window.require('electron') : { ipcRenderer: undefined };
const { ipcRenderer } = electron;

const App: React.FC = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('pomodoro-tasks', []);

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);

  // 任务分类管理
  const [taskCategories, setTaskCategories] = useLocalStorage<string[]>('pomodoro-categories', ['生活', '工作']);
  
  // 当前正在运行的任务
  const [runningTask, setRunningTask] = useState<RunningTask | null>(null);
  
  // 全局计时器引用
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onPomodoroComplete = useCallback((taskId: number): void => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // 播放完成音效
      const cheersSoundRef = new Audio('audio/cheers.mp3');
      cheersSoundRef.play().catch(e => console.log('音效播放失败:', e));

      // 显示完成消息
      const showCompletionMessage = (): void => {
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

      // timeSpent已在全局计时器中实时更新，番茄钟完成时不需要额外更新任务状态

      // 发送通知
      if (ipcRenderer) {
        ipcRenderer.send('pomodoro-complete', task.name);
      }
    }
  }, [tasks]);

  // 全局计时器逻辑 - 为当前正在运行的任务计时
  useEffect(() => {
    // 启动全局计时器，每秒更新当前运行任务
    globalTimerRef.current = setInterval(() => {
      if (!runningTask) return;
      
      const newRunningTime = runningTask.runningTime + 1;
      const currentTaskSpentTime = tasks.find(t => t.id === runningTask.taskId)?.timeSpent || 0;
      const totalSpentTime = currentTaskSpentTime + newRunningTime;
      const timeLeft = POMODORO_DURATION_SECONDS - (totalSpentTime % POMODORO_DURATION_SECONDS);
      
      if (timeLeft <= 0) {
        // 计时结束，停止任务
        pausedTaskTimer(runningTask.taskId);
        // 触发完成回调
        setTimeout(() => onPomodoroComplete(runningTask.taskId), 100);
      } else {
        // 更新运行时间
        setRunningTask(prev => prev ? { ...prev, runningTime: newRunningTime } : null);
      }
    }, 1000);

    return () => {
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
      }
    };
  }, [runningTask, onPomodoroComplete, setTasks]);

  // 监听任务完成状态，自动暂停已完成任务的计时器
  useEffect(() => {
    if (runningTask) {
      const task = tasks.find(t => t.id === runningTask.taskId);
      if (task && task.completed) {
        setRunningTask(null);
      }
    }
  }, [tasks, runningTask]);

  const addTask = useCallback((taskName: string, category: string = '生活'): void => {
    const newTask: Task = {
      id: Date.now(),
      name: taskName,
      category: category,
      completed: false,
      timeSpent: 0,
      progress: 0,
      created_at: getCurrentDateString(),
    };
    
    setTasks(prev => [...prev, newTask]);
  }, [setTasks]);

  // 分类管理函数
  const addCategory = useCallback((categoryName: string): void => {
    if (categoryName.trim() && !taskCategories.includes(categoryName.trim())) {
      setTaskCategories(prev => [...prev, categoryName.trim()]);
    }
  }, [taskCategories, setTaskCategories]);

  const deleteCategory = useCallback((categoryName: string): void => {
    if (taskCategories.length > 1) { // 至少保留一个分类
      setTaskCategories(prev => prev.filter(cat => cat !== categoryName));
      // 将该分类下的所有任务移动到第一个分类
      const remainingCategories = taskCategories.filter(cat => cat !== categoryName);
      const defaultCategory = remainingCategories[0];
      setTasks(prev => prev.map(task => 
        task.category === categoryName 
          ? { ...task, category: defaultCategory }
          : task
      ));
    }
  }, [taskCategories, setTaskCategories, setTasks]);

  const deleteTask = useCallback((taskId: number): void => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    // 如果删除的是当前运行的任务，清空运行状态
    if (runningTask && runningTask.taskId === taskId) {
      setRunningTask(null);
    }
    if (currentTask && currentTask.id === taskId) {
      setCurrentTask(null);
    }
  }, [setTasks, runningTask, currentTask]);

  const updateTaskProgress = useCallback((taskId: number, progress: number): void => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const wasCompleted = task.completed;
        const updatedTask = {
          ...task,
          progress,
          completed: progress >= 100
        };
        
        // 如果任务刚完成，播放音效并暂停计时器
        if (!wasCompleted && progress >= 100) {
          const audio = new Audio('audio/cheers.mp3');
          audio.play().catch(e => console.log('音效播放失败:', e));
          
          // 完成任务，暂停任务
          if (runningTask && runningTask.taskId === taskId) {
            updatedTask.timeSpent = updatedTask.timeSpent + runningTask.runningTime;
            setRunningTask(null);
          }
         
          // 如果完成的任务是当前选中的任务，清除当前任务状态
          if (currentTask && currentTask.id === taskId) {
            setCurrentTask(null);
          }
        }
        
        return updatedTask;
      }
      return task;
    }));
  }, [setTasks, currentTask]);

  const startTaskPomodoro = useCallback((taskId: number): void => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      setCurrentTask(task);
      if (ipcRenderer) {
        ipcRenderer.send('pomodoro-start', task.name);
      }
    }
  }, [tasks]);

  const openProgressModal = useCallback((task: Task): void => {
    setSelectedTaskForProgress(task);
    setIsModalOpen(true);
  }, []);

  const closeProgressModal = useCallback((): void => {
    setIsModalOpen(false);
    setSelectedTaskForProgress(null);
  }, []);


  // 获取当前任务的时间剩余和运行状态
  const getTimerState = useCallback((task: Task | null) => {
    if (!task) {
      return { timeLeft: POMODORO_DURATION_SECONDS, isRunning: false };
    }
    
    const isRunning = runningTask?.taskId === task.id;
    const currentRunningTime = isRunning ? runningTask.runningTime : 0;
    const timeLeft = POMODORO_DURATION_SECONDS - (task.timeSpent % POMODORO_DURATION_SECONDS) - currentRunningTime
    
    return {
      timeLeft: Math.max(0, timeLeft), 
      isRunning 
    };
  }, [runningTask]);

  // 检查任务是否正在运行
  const isTaskRunning = useCallback((taskId: number): boolean => {
    return runningTask?.taskId === taskId;
  }, [runningTask]);

  // 暂停任务
  const pausedTaskTimer = useCallback((taskId: number): void => {
    // 如果暂停的是当前正在运行的任务，需要先更新timeSpent然后清空runningTask
    if (runningTask && runningTask.taskId === taskId) {
      // 更新任务的timeSpent（加上当前已运行的时间）
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, timeSpent: task.timeSpent + runningTask.runningTime }
            : task
        )
      );
      
      // 清空当前运行任务
      setRunningTask(null);
    }
  }, [runningTask, setTasks]);

  // 启动当前任务
  const startTaskTimer = useCallback((taskId: number): void => {
    // 如果有其他任务正在运行，先暂停它
    if (runningTask && runningTask.taskId !== taskId) {
      pausedTaskTimer(runningTask.taskId);
    }
    
    // 启动新任务
    setRunningTask({
      taskId: taskId,
      runningTime: 0
    });
  }, [runningTask, pausedTaskTimer]);


  return (
    <div className="App">
      <div className="container">
        <Header />
        
        <TaskManager
          tasks={tasks}
          currentTask={currentTask}
          taskCategories={taskCategories}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onStartPomodoro={startTaskPomodoro}
          onOpenProgressModal={openProgressModal}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          isTaskRunning={isTaskRunning}
        />
        
        {tasks.length > 0 && (() => {
          const { timeLeft, isRunning } = getTimerState(currentTask);
          return (
            <Timer
              currentTask={currentTask}
              timeLeft={timeLeft}
              isRunning={isRunning}
              onPausedTaskTimer={pausedTaskTimer}
              onStartTaskTimer={startTaskTimer}
            />
          );
        })()}
        
        <Stats
          tasks={tasks}
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
};

export default App; 