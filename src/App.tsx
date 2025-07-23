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
import { Task, TaskTimerStates, TimerState } from './types';

// Electron IPC类型定义
interface ElectronIPC {
  ipcRenderer?: {
    send: (channel: string, ...args: any[]) => void;
    sendSync: (channel: string, ...args: any[]) => any;
  };
}

const electron: ElectronIPC = window.require ? window.require('electron') : { ipcRenderer: undefined };
const { ipcRenderer } = electron;

const App: React.FC = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('pomodoro-tasks', []);

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);
  // 为每个任务维护独立的计时器状态
  const [taskTimerStates, setTaskTimerStates] = useLocalStorage<TaskTimerStates>('pomodoro-timer-states', {});
  // 任务分类管理
  const [taskCategories, setTaskCategories] = useLocalStorage<string[]>('pomodoro-categories', ['生活', '工作']);
  
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

      // 更新任务统计（timeSpent已在全局计时器中实时更新，这里只更新pomodoroCount）
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, pomodoroCount: t.pomodoroCount + 1 }
          : t
      ));
      


      // 发送通知
      if (ipcRenderer) {
        ipcRenderer.send('pomodoro-complete', task.name);
      }
    }
  }, [tasks, setTasks]);

  // 全局计时器逻辑 - 为所有正在运行的任务计时
  useEffect(() => {
    // 启动全局计时器，每秒检查所有任务状态
    globalTimerRef.current = setInterval(() => {
      const runningTaskIds: string[] = [];
      
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

      // 为所有正在运行的任务更新timeSpent（每秒增加1秒）
      if (runningTaskIds.length > 0) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            runningTaskIds.includes(task.id.toString()) 
              ? { ...task, timeSpent: task.timeSpent + 1 }
              : task
          )
        );
      }
    }, 1000);

    return () => {
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
      }
    };
  }, [onPomodoroComplete, setTasks]); // 移除taskTimerStates依赖

  const addTask = useCallback((taskName: string, category: string = '生活'): void => {
    const newTask: Task = {
      id: Date.now(),
      name: taskName,
      category: category,
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
          
          // 暂停该任务的计时器
          setTaskTimerStates(prevTimerStates => ({
            ...prevTimerStates,
            [taskId]: prevTimerStates[taskId] ? {
              ...prevTimerStates[taskId],
              isRunning: false,
              isPaused: true
            } : prevTimerStates[taskId]
          }));
          
          // 如果完成的任务是当前选中的任务，清除当前任务状态
          if (currentTask && currentTask.id === taskId) {
            setCurrentTask(null);
          }
          
          console.log(`任务 ${task.name} 已完成，计时器已暂停`);
        }
        
        return updatedTask;
      }
      return task;
    }));
  }, [setTasks, setTaskTimerStates, currentTask]);

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

  // 更新任务计时器状态
  const updateTaskTimerState = useCallback((taskId: number, newState: Partial<TimerState>): void => {
    setTaskTimerStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...newState
      }
    }));
  }, [setTaskTimerStates]);

  // 获取当前任务的计时器状态
  const getCurrentTaskTimerState = useCallback((): TimerState | null => {
    if (!currentTask) return null;
    return taskTimerStates[currentTask.id] || {
      timeLeft: POMODORO_DURATION_SECONDS,
      isRunning: false,
      isPaused: false
    };
  }, [currentTask, taskTimerStates]);

  // 检查任务是否正在运行
  const isTaskRunning = useCallback((taskId: number): boolean => {
    const timerState = taskTimerStates[taskId];
    return timerState ? timerState.isRunning : false;
  }, [taskTimerStates]);

  // 原子操作：暂停其他任务并启动当前任务
  const startTaskTimer = useCallback((taskId: number, newState: Partial<TimerState>): void => {
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
          taskCategories={taskCategories}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onStartPomodoro={startTaskPomodoro}
          onOpenProgressModal={openProgressModal}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          isTaskRunning={isTaskRunning}
        />
        
        {tasks.length > 0 && (
          <Timer
            currentTask={currentTask}
            timerState={getCurrentTaskTimerState()}
            onTimerStateUpdate={updateTaskTimerState}
            onStartTaskTimer={startTaskTimer}
          />
        )}
        
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