let history = [];             // To store task history
let tasks = [];               // To store active tasks
let countdownInterval = null; // To store the countdown interval

// Request notification permission on load
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Add event listener for the "Add" button
document.getElementById('add-btn').addEventListener('click', function() {
  const taskInput = document.getElementById('todo-input');
  const taskDate = document.getElementById('task-date').value; // Optional – if blank, current date is used
  const hoursVal = document.getElementById('task-hours').value;
  const minutesVal = document.getElementById('task-minutes').value;
  const secondsVal = document.getElementById('task-seconds').value;
  const taskAmPm = document.getElementById('task-am-pm').value;

  if (!taskInput.value) {
    alert('Please provide a task description.');
    return;
  }

  const now = new Date();
  let reminderTime;

  if (taskDate) {
    // Use the provided date
    reminderTime = new Date(taskDate);
    // Check if the selected date is today
    const isToday = reminderTime.toDateString() === now.toDateString();
    let finalHours;
    if (hoursVal === "") {
      // If hours are not provided and the date is today, default to the current hour;
      // otherwise, default to 0 (midnight) for future dates.
      finalHours = isToday ? now.getHours() : 0;
    } else {
      finalHours = parseInt(hoursVal);
      // Apply AM/PM conversion if hours are provided
      if (taskAmPm === 'PM' && finalHours !== 12) {
        finalHours += 12;
      } else if (taskAmPm === 'AM' && finalHours === 12) {
        finalHours = 0;
      }
    }
    const finalMinutes = minutesVal === "" ? 0 : parseInt(minutesVal);
    const finalSeconds = secondsVal === "" ? 0 : parseInt(secondsVal);
    reminderTime.setHours(finalHours, finalMinutes, finalSeconds, 0);
  } else {
    // If no date is provided, default to the current date/time
    reminderTime = new Date();
    let finalHours = hoursVal === "" ? reminderTime.getHours() : parseInt(hoursVal);
    if (hoursVal !== "") {
      if (taskAmPm === 'PM' && finalHours !== 12) {
        finalHours += 12;
      } else if (taskAmPm === 'AM' && finalHours === 12) {
        finalHours = 0;
      }
    }
    const finalMinutes = minutesVal === "" ? 0 : parseInt(minutesVal);
    const finalSeconds = secondsVal === "" ? 0 : parseInt(secondsVal);
    reminderTime.setHours(finalHours, finalMinutes, finalSeconds, 0);
  }

  // Validate that the reminder time is in the future
  if (reminderTime <= now) {
    alert('You cannot set a reminder for a past time!');
    return;
  }

  // Create list item for the task
  const li = document.createElement('li');
  li.classList.add('todo-item');
  const formattedTime = formatTime(reminderTime);

  // Create a span for the task text and one for the countdown
  const taskText = document.createElement('span');
  taskText.textContent = `${taskInput.value} - Due: ${formattedTime}`;
  
  const countdownSpan = document.createElement('span');
  countdownSpan.classList.add('countdown');
  countdownSpan.textContent = ""; // Will be updated with remaining time

  // Create a delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', function() {
    li.remove();
    tasks = tasks.filter(t => t.reminderTime !== reminderTime);
  });

  // Append elements to the list item
  li.appendChild(taskText);
  li.appendChild(countdownSpan);
  li.appendChild(deleteBtn);
  document.getElementById('todo-list').appendChild(li);

  // Save the task with a "notified" flag and a reference to its countdown span
  tasks.push({ task: taskInput.value, reminderTime, notified: false, countdownSpan });
  document.getElementById('show-time-remaining').disabled = false;
  history.push({ task: taskInput.value, timestamp: new Date().toLocaleString() });

  // Reset input fields
  taskInput.value = '';
  document.getElementById('task-date').value = '';
  document.getElementById('task-hours').value = '';
  document.getElementById('task-minutes').value = '';
  document.getElementById('task-seconds').value = '';
});

// Function to format time in a 12-hour format
function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  return `${hours}:${minutes}:${seconds} ${ampm}`;
}

// Show time remaining functionality
document.getElementById('show-time-remaining').addEventListener('click', function() {
  if (tasks.length === 0) return;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(function() {
    let currentTime = new Date();
    tasks.forEach(task => {
      let remainingTime = task.reminderTime - currentTime;
      if (remainingTime <= 0) {
        if (!task.notified) {
          task.notified = true;
          showPopup(`Task "${task.task}" is due!`);
          if (Notification.permission === "granted") {
            new Notification("Task Reminder", { body: `Task "${task.task}" is due!` });
          }
          playNotificationSound();
        }
        task.countdownSpan.textContent = " - Reminder time has passed!";
      } else {
        let remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
        let remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        let remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        task.countdownSpan.textContent = ` - Time remaining: ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
      }
    });
  }, 1000);
});

// Function to play a notification sound
function playNotificationSound() {
  const audio = new Audio('https://www.soundjay.com/button/beep-07.wav');
  audio.play();
}

// Function to show the pop-up modal with a custom message for 10 seconds
function showPopup(message) {
  const popup = document.getElementById('popup-notification');
  const popupMessage = document.getElementById('popup-message');
  popupMessage.textContent = message;
  popup.style.display = "block";
  // Automatically hide the popup after 10 seconds (10000ms)
  setTimeout(() => {
    popup.style.display = "none";
  }, 10000);
}

// Close the popup when the close button is clicked
document.getElementById('popup-close').addEventListener('click', function() {
  document.getElementById('popup-notification').style.display = "none";
});

// Show History functionality
document.getElementById('history-btn').addEventListener('click', function() {
  const historyArea = document.getElementById('history-area');
  const historyList = document.getElementById('history-list');
  historyArea.style.display = historyArea.style.display === 'none' || historyArea.style.display === '' ? 'block' : 'none';
  historyList.innerHTML = '';
  history.forEach((item, index) => {
    const historyItem = document.createElement('li');
    historyItem.textContent = `${item.task} - Added on: ${item.timestamp}`;
    const deleteHistoryBtn = document.createElement('button');
    deleteHistoryBtn.textContent = 'Delete';
    deleteHistoryBtn.addEventListener('click', function() {
      history.splice(index, 1);
      historyItem.remove();
    });
    historyItem.appendChild(deleteHistoryBtn);
    historyList.appendChild(historyItem);
  });
});
