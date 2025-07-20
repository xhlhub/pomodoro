const { ipcRenderer } = require("electron");

// 全局变量
let tasks = [];
let currentTask = null;
let timer = null;
let timeLeft = 25 * 60; // 25分钟，以秒为单位
let isRunning = false;
let isPaused = false;
let completedPomodoros = 0;
let totalTime = 0;
let selectedProgress = 0;
let currentTaskForProgress = null;

// 音效对象
const clockSound = new Audio("audio/clock.mp3");
const cheersSound = new Audio("audio/cheers.mp3");

// DOM 元素
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const pomodoroSection = document.getElementById("pomodoroSection");
const timerText = document.getElementById("timerText");
const timerLabel = document.getElementById("timerLabel");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const stopBtn = document.getElementById("stopBtn");
const currentTaskName = document.getElementById("currentTaskName");
const completedPomodorosEl = document.getElementById("completedPomodoros");
const totalTimeEl = document.getElementById("totalTime");

// 模态框元素
const progressModal = document.getElementById("progressModal");
const modalTaskName = document.getElementById("modalTaskName");
const closeModal = document.getElementById("closeModal");
const saveProgress = document.getElementById("saveProgress");
const cancelProgress = document.getElementById("cancelProgress");
const customProgress = document.getElementById("customProgress");
const customProgressValue = document.getElementById("customProgressValue");

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  updateStats();
  renderTasks();
  setupModalEvents();
});

// 事件监听器
addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});

startBtn.addEventListener("click", startPomodoro);
pauseBtn.addEventListener("click", pausePomodoro);
resumeBtn.addEventListener("click", resumePomodoro);
stopBtn.addEventListener("click", stopPomodoro);

// 模态框事件设置
function setupModalEvents() {
  closeModal.addEventListener("click", hideProgressModal);
  saveProgress.addEventListener("click", saveTaskProgress);
  cancelProgress.addEventListener("click", hideProgressModal);

  // 进度按钮事件
  document.querySelectorAll(".progress-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".progress-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      selectedProgress = parseInt(e.target.dataset.progress);
      customProgress.value = selectedProgress;
      customProgressValue.textContent = selectedProgress + "%";
    });
  });

  // 自定义进度滑块事件
  customProgress.addEventListener("input", (e) => {
    selectedProgress = parseInt(e.target.value);
    customProgressValue.textContent = selectedProgress + "%";
    document
      .querySelectorAll(".progress-btn")
      .forEach((b) => b.classList.remove("active"));
  });

  // 点击模态框外部关闭
  progressModal.addEventListener("click", (e) => {
    if (e.target === progressModal) {
      hideProgressModal();
    }
  });
}

// 获取当前日期字符串
function getCurrentDateString() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${month}/${day}`;
}

// 任务管理函数
function addTask() {
  const taskName = taskInput.value.trim();
  if (taskName === "") return;

  const task = {
    id: Date.now(),
    name: taskName,
    completed: false,
    pomodoroCount: 0,
    timeSpent: 0, // 花费的时间（分钟）
    progress: 0,
    date: getCurrentDateString(),
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  taskInput.value = "";

  saveTasks();
  renderTasks();
  showPomodoroSection();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();

  if (tasks.length === 0) {
    hidePomodoroSection();
  }
}

function toggleTaskComplete(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    if (task.completed) {
      task.progress = 100;
    }
    saveTasks();
    renderTasks();
  }
}

function showProgressModal(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  currentTaskForProgress = task;
  modalTaskName.textContent = task.name;
  selectedProgress = task.progress;

  // 重置模态框状态
  document
    .querySelectorAll(".progress-btn")
    .forEach((b) => b.classList.remove("active"));
  customProgress.value = selectedProgress;
  customProgressValue.textContent = selectedProgress + "%";

  progressModal.style.display = "flex";
}

function hideProgressModal() {
  progressModal.style.display = "none";
  currentTaskForProgress = null;
}

function saveTaskProgress() {
  if (!currentTaskForProgress) return;

  const previousProgress = currentTaskForProgress.progress;
  currentTaskForProgress.progress = selectedProgress;

  // 如果进度达到100%，自动标记为完成
  if (selectedProgress >= 100) {
    currentTaskForProgress.completed = true;

    // 如果之前进度不是100%，现在设置为100%，播放完成音效
    if (previousProgress < 100) {
      cheersSound.play().catch((e) => console.log("音效播放失败:", e));
    }
  }

  saveTasks();
  renderTasks();
  hideProgressModal();
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const taskElement = document.createElement("div");
    taskElement.className = `task-item ${task.completed ? "completed" : ""} ${
      currentTask && currentTask.id === task.id ? "active" : ""
    }`;

    // 为任务项添加点击事件
    taskElement.addEventListener("click", () => {
      if (!task.completed) {
        startTaskPomodoro(task.id);
      }
    });

    // 计算番茄钟显示值
    let pomodoroDisplay = "";
    if (task.completed) {
      // 任务完成时，显示时间比率（花费时间/25分钟）
      const timeRatio = task.timeSpent / 25;
      if (timeRatio > 0) {
        // 如果是整数或1位小数才显示
        const roundedRatio = Math.round(timeRatio * 10) / 10;
        if (
          roundedRatio === Math.floor(roundedRatio) ||
          (timeRatio * 10) % 1 === 0
        ) {
          pomodoroDisplay = `🍅 x ${roundedRatio}`;
        }
      }
    } else if (task.pomodoroCount > 0) {
      // 任务未完成但番茄钟结束后，显示整数番茄钟数量
      pomodoroDisplay = `🍅 x ${task.pomodoroCount}`;
    }

    taskElement.innerHTML = `
            <div class="task-info">
                <div class="task-number">${index + 1}</div>
                <div class="task-details">
                    <span class="task-name">${task.name}</span>
                    <span class="task-date">${task.date}</span>
                </div>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${
                          task.progress
                        }%"></div>
                    </div>
                    <div class="progress-text">${task.progress}%</div>
                </div>
                ${
                  pomodoroDisplay
                    ? `<span class="task-timer">${pomodoroDisplay}</span>`
                    : ""
                }
            </div>
            <div class="task-actions" onclick="event.stopPropagation()">
                <button class="btn-icon btn-info" onclick="showProgressModal(${
                  task.id
                })" title="更新进度">
                    <i class="fas fa-hand-pointer"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteTask(${
                  task.id
                })" title="删除任务">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

    taskList.appendChild(taskElement);
  });
}

// 番茄钟函数
function startTaskPomodoro(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return;

  currentTask = task;
  currentTaskName.textContent = task.name;
  timeLeft = 25 * 60;
  isRunning = false;
  isPaused = false;

  updateTimerDisplay();
  showPomodoroSection();

  // 发送开始通知
  ipcRenderer.send("pomodoro-start", task.name);
}

function startPomodoro() {
  if (!currentTask) return;

  isRunning = true;
  isPaused = false;

  // 播放开始音效
  clockSound.play().catch((e) => console.log("音效播放失败:", e));

  startBtn.style.display = "none";
  pauseBtn.style.display = "inline-block";
  resumeBtn.style.display = "none";

  document.querySelector(".timer-circle").classList.add("running");

  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      completePomodoro();
    }
  }, 1000);
}

function pausePomodoro() {
  if (!isRunning) return;

  isRunning = false;
  isPaused = true;
  clearInterval(timer);

  pauseBtn.style.display = "none";
  resumeBtn.style.display = "inline-block";

  document.querySelector(".timer-circle").classList.remove("running");
}

function resumePomodoro() {
  if (!isPaused) return;

  isRunning = true;
  isPaused = false;

  pauseBtn.style.display = "inline-block";
  resumeBtn.style.display = "none";

  document.querySelector(".timer-circle").classList.add("running");

  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      completePomodoro();
    }
  }, 1000);
}

function stopPomodoro() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  timeLeft = 25 * 60;

  startBtn.style.display = "inline-block";
  pauseBtn.style.display = "none";
  resumeBtn.style.display = "none";

  document.querySelector(".timer-circle").classList.remove("running");

  updateTimerDisplay();
}

function completePomodoro() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;

  // 播放完成音效
  cheersSound.play().catch((e) => console.log("音效播放失败:", e));

  // 更新任务统计
  if (currentTask) {
    currentTask.pomodoroCount++;
    currentTask.timeSpent += 25; // 增加25分钟
    completedPomodoros++;
    totalTime += 25;
  }

  // 发送完成通知
  ipcRenderer.send(
    "pomodoro-complete",
    currentTask ? currentTask.name : "任务"
  );

  // 重置界面
  startBtn.style.display = "inline-block";
  pauseBtn.style.display = "none";
  resumeBtn.style.display = "none";

  document.querySelector(".timer-circle").classList.remove("running");

  timeLeft = 25 * 60;
  updateTimerDisplay();
  saveTasks();
  renderTasks();
  updateStats();

  // 显示完成消息
  showCompletionMessage();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerText.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function showPomodoroSection() {
  pomodoroSection.style.display = "block";
}

function hidePomodoroSection() {
  pomodoroSection.style.display = "none";
  currentTask = null;
  currentTaskName.textContent = "无";
}

function showCompletionMessage() {
  const message = document.createElement("div");
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
  message.textContent = "🍅 番茄钟完成！休息一下吧！";

  document.body.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 3000);
}

// 统计函数
function updateStats() {
  completedPomodorosEl.textContent = completedPomodoros;
  totalTimeEl.textContent = totalTime;
}

// 本地存储函数
function saveTasks() {
  localStorage.setItem("pomodoro-tasks", JSON.stringify(tasks));
  localStorage.setItem(
    "pomodoro-stats",
    JSON.stringify({
      completedPomodoros,
      totalTime,
    })
  );
}

function loadTasks() {
  const savedTasks = localStorage.getItem("pomodoro-tasks");
  const savedStats = localStorage.getItem("pomodoro-stats");

  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
    // 为旧任务添加新字段
    tasks.forEach((task) => {
      if (!task.progress) task.progress = 0;
      if (!task.date) task.date = getCurrentDateString();
      if (!task.createdAt) task.createdAt = new Date().toISOString();
      if (!task.timeSpent) task.timeSpent = task.pomodoroCount * 25; // 根据番茄钟数量计算时间
    });
  }

  if (savedStats) {
    const stats = JSON.parse(savedStats);
    completedPomodoros = stats.completedPomodoros || 0;
    totalTime = stats.totalTime || 0;
  }
}

// 添加 CSS 动画
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
