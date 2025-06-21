
const dayEl = document.getElementById("currentDay");
const monthEl = document.getElementById("currentMonth");
const modal = document.getElementById('taskModal');
const addBtn = document.getElementById('modaladdbtn');
const closeBtn = document.getElementById("modalclosebtn");
const listContainer = document.getElementById("list-container");
const tabs = document.querySelectorAll(".tab");

// Modal control
addBtn?.addEventListener("click", () => modal.style.display = "flex");
closeBtn?.addEventListener("click", () => {
  modal.style.display = "none";
  clearModalFields();
  const btn = document.querySelector(".modal-footer button");
  btn.textContent = "Add";
  btn.onclick = addTask;
});

// Date display
function formatDateWithSuffix(day) {
  if (day > 3 && day < 21) return day + "th";
  switch (day % 10) {
    case 1: return day + "st";
    case 2: return day + "nd";
    case 3: return day + "rd";
    default: return day + "th";
  }
}

function setDateToday() {
  const today = new Date();
  const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  dayEl.textContent = `${weekdays[today.getDay()]}, ${formatDateWithSuffix(today.getDate())}`;
  monthEl.textContent = `${months[today.getMonth()]}`;
}




// Add new task
function addTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const details = document.getElementById('taskDetails').value.trim();
  const time = document.getElementById('taskTime').value;

  if (!title || !details || !time) {
    alert("Please fill all fields");
    return;
  }

  const task = {
    id: Date.now(),
    title,
    details,
    time,
    completed: false,
    notified: false // For 15-minute reminders
  };

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  alert("✅ Task added!");
  modal.style.display = "none";
  clearModalFields();
  loadTasks();

}

// Clear modal fields
function clearModalFields() {
  document.getElementById("taskTitle").value = '';
  document.getElementById("taskDetails").value = '';
  document.getElementById("taskTime").value = '';
}

// Load and render tasks
function loadTasks() {
  if (!listContainer) return;
  listContainer.innerHTML = "";
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";
    if (task.completed) li.classList.add("checked");
    li.setAttribute("data-time", task.time);

    li.innerHTML = `
      <div class="task-info">
        <h3>${task.title}</h3>
        <p class="task-time">${formatTime(task.time)}</p>
        <p class="task-desc">${task.details}</p>
      </div>
      <div class="task-actions">
        <button class="edit-btn" onclick="editTask(${task.id})">✏️</button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">❌</button>
        <button class="complete-btn" onclick="toggleComplete(${task.id})">✔️</button>
      </div>
    `;
    listContainer.appendChild(li);
  });

  filterTasks(document.querySelector(".tab.active")?.textContent || "All");

}
function editTask(id) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDetails').value = task.details;
  document.getElementById('taskTime').value = task.time;
  document.getElementById('editingTaskId').value = task.id;

  modal.style.display = "flex";

  // Change the modal button to say "Update"
  const btn = document.querySelector(".modal-footer button");
  btn.textContent = "Update";
  btn.onclick = updateTask;
}
function updateTask() {
  const id = parseInt(document.getElementById('editingTaskId').value);
  const title = document.getElementById('taskTitle').value.trim();
  const details = document.getElementById('taskDetails').value.trim();
  const time = document.getElementById('taskTime').value;

  if (!title || !details || !time) {
    alert("Please fill all fields");
    return;
  }

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.map(task => {
    if (task.id === id) {
      return { ...task, title, details, time };
    }
    return task;
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
  alert("✅ Task updated!");
  modal.style.display = "none";
  clearModalFields();
  loadTasks();

  // Reset to add mode
  const btn = document.querySelector(".modal-footer button");
  btn.textContent = "Add";
  btn.onclick = addTask;
}
function clearModalFields() {
  document.getElementById("taskTitle").value = '';
  document.getElementById("taskDetails").value = '';
  document.getElementById("taskTime").value = '';
  document.getElementById("editingTaskId").value = '';
}


// Delete task
function deleteTask(id) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.filter(t => t.id !== id);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();

}

// Mark task as complete/incomplete
function toggleComplete(id) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.map(t => {
    if (t.id === id) t.completed = !t.completed;
    return t;
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();

}

// Time formatter
function formatTime(timeStr) {
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour);
  const ampm = h >= 12 ? "p.m." : "a.m.";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
}

// Task filters
function filterTasks(type) {
  const items = document.querySelectorAll(".task-item");
  items.forEach(item => {
    const isChecked = item.classList.contains("checked");
    switch (type) {
      case "All": item.style.display = "flex"; break;
      case "Pending": item.style.display = isChecked ? "none" : "flex"; break;
      case "Completed": item.style.display = isChecked ? "flex" : "none"; break;
    }
  });
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    filterTasks(tab.textContent);
  });
});

// Notification: 15 minutes before due time
function checkDueTasks() {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const now = new Date();
  const alertTimes = [30, 15, 10, 5];

  console.log("🔄 Checking due tasks at:", now.toLocaleTimeString());

  tasks = tasks.map(task => {
    if (task.completed) return task;

    const [h, m] = task.time.split(":").map(Number);
    const due = new Date();
    due.setHours(h, m, 0, 0);

    const diffMin = Math.floor((due - now) / 60000);

    if (diffMin <= 30 && diffMin >= 0) {
      if (!task.alerts) task.alerts = {};

      alertTimes.forEach(min => {
        if (diffMin <= min && !task.alerts[min]) {
          console.log(`🔔 Sending ${min} min alert for "${task.title}"`);
          showReminder(`⏰ "${task.title}" is due in ${diffMin} minute(s).`);
          task.alerts[min] = true;
        }
      });
    }

    return task;
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}



  function showReminder(message) {
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Task Reminder", {
        body: message,
        icon: "images/icon1.png" // optional icon
      });
    } else {
      // Fallback: show custom reminder box
      const box = document.getElementById("reminderBox");
      if (box) {
        box.textContent = message;
        box.style.display = "block";
        setTimeout(() => {
          box.style.display = "none";
        }, 6000);
      }
    }
  }


// On page load
window.onload = () => {
  setDateToday?.();
  loadTasks?.();
  checkDueTasks();
  setInterval(checkDueTasks, 60000); // every 1 minute
};
