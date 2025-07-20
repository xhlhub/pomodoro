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

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  updateStats();
  renderTasks();
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

// 任务管理函数
function addTask() {
  const taskName = taskInput.value.trim();
  if (taskName === "") return;

  const task = {
    id: Date.now(),
    name: taskName,
    completed: false,
    pomodoroCount: 0,
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
    saveTasks();
    renderTasks();
  }
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.className = `task-item ${task.completed ? "completed" : ""}`;

    taskElement.innerHTML = `
            <div class="task-info">
                <span class="task-name">${task.name}</span>
                <span class="task-timer">${task.pomodoroCount} 番茄钟</span>
            </div>
            <div class="task-actions">
                ${
                  !task.completed
                    ? `<button class="btn btn-success btn-small" onclick="startTaskPomodoro(${task.id})">开始番茄钟</button>`
                    : ""
                }
                <button class="btn btn-warning btn-small" onclick="toggleTaskComplete(${
                  task.id
                })">${task.completed ? "恢复" : "完成"}</button>
                <button class="btn btn-danger btn-small" onclick="deleteTask(${
                  task.id
                })">删除</button>
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

  // 更新任务统计
  if (currentTask) {
    currentTask.pomodoroCount++;
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
