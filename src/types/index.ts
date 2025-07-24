// 任务接口
export interface Task {
  id: number;
  name: string;
  category: string;
  completed: boolean;
  pomodoroCount: number;
  timeSpent: number;
  progress: number;
  date: string;
  createdAt: string;
}

// 分类接口
export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

// 计时器状态接口
export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
}

// 任务计时器状态映射
export interface TaskTimerStates {
  [taskId: string]: TimerState;
}

// 组件Props类型
export interface TaskManagerProps {
  tasks: Task[];
  currentTask: Task | null;
  taskCategories: string[];
  onAddTask: (taskName: string, category?: string) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onStartPomodoro: (taskId: number) => void;
  onOpenProgressModal: (task: Task) => void;
  onAddCategory: (categoryName: string) => Promise<void>;
  onDeleteCategory: (categoryName: string) => Promise<void>;
  isTaskRunning: (taskId: number) => boolean;
}

export interface TimerProps {
  currentTask: Task | null;
  timeLeft: number;
  isRunning: boolean;
  onPausedTaskTimer: (taskId: number) => Promise<void>;
  onStartTaskTimer: (taskId: number) => void;
}

export interface StatsProps {
  tasks: Task[];
}

export interface ProgressModalProps {
  task: Task;
  onClose: () => void;
  onUpdateProgress: (taskId: number, progress: number) => Promise<void>;
}

export interface TaskItemProps {
  task: Task;
  index: number;
  isActive: boolean;
  isRunning: boolean;
  onStartPomodoro: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onOpenProgressModal: (task: Task) => void;
}

export interface ClockIconProps {
  size?: number;
  color?: string;
}

// Electron IPC类型
export interface ElectronAPI {
  ipcRenderer?: {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
}

declare global {
  interface Window {
    require?: (module: string) => any;
  }
} 