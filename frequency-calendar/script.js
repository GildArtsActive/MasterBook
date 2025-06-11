// Theme Management
function initTheme() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Set up theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', initTheme);

// Activity Data Structure
let activities = {
    work: { name: 'Work', color: '#9be9a8' },
    exercise: { name: 'Exercise', color: '#40c463' },
    study: { name: 'Study', color: '#2166ac' },
    other: { name: 'Other', color: '#6a3d9a' }
};

// Activity tracking data
let activityData = {}; // Format: { '2025-06-09': { activityId: 'work', count: 1 } }
let currentYear = new Date().getFullYear();
let selectedActivity = 'work'; // Default selected activity

// Helper function to get color based on frequency count
function getActivityColor(activityId, count = 1) {
    // Default color for no activity
    if (!activityId) return '#ebedf0';
    
    // Define the color progression: Green -> Blue -> Yellow -> Red
    const colorMap = {
        1: '#40c463', // Green
        2: '#2188ff', // Blue
        3: '#ffd33d', // Yellow
        4: '#cb2431'  // Red
    };
    
    // Return the corresponding color based on count (clamped between 1-4)
    return colorMap[Math.min(Math.max(1, count), 4)];
}

// Helper function to get activity name
function getActivityName(activityId) {
    return activities[activityId]?.name || 'Unknown';
}

// Add a new activity
function addActivity() {
    const nameInput = document.getElementById('activityName');
    const colorInput = document.getElementById('activityColor');
    const name = nameInput.value.trim();
    const color = colorInput.value;
    
    if (!name) return;
    
    const id = name.toLowerCase().replace(/\s+/g, '-');
    activities[id] = { name, color };
    
    // Reset inputs
    nameInput.value = '';
    
    // Update UI
    renderActivityLegend();
    renderCalendar();
}

// Remove an activity
function removeActivity(activityId) {
    if (Object.keys(activities).length <= 1) {
        alert('You must have at least one activity');
        return;
    }
    
    delete activities[activityId];
    
    // Remove this activity from all dates
    Object.keys(activityData).forEach(date => {
        if (activityData[date].activityId === activityId) {
            delete activityData[date];
        }
    });
    
    // Update UI
    renderActivityLegend();
    renderCalendar();
    saveData();
}

// Render activity legend
function renderActivityLegend() {
    const legendEl = document.getElementById('activityLegend');
    legendEl.innerHTML = '';
    
    Object.entries(activities).forEach(([id, activity]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = activity.color;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = activity.name;
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'legend-remove';
        removeBtn.textContent = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeActivity(id);
        };
        
        item.appendChild(colorBox);
        item.appendChild(nameSpan);
        
        // Only show remove button for custom activities (not the default ones)
        if (!['work', 'exercise', 'study', 'other'].includes(id)) {
            item.appendChild(removeBtn);
        }
        
        item.onclick = () => {
            selectedActivity = id;
            document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
        };
        
        if (id === selectedActivity) {
            item.classList.add('selected');
        }
        
        legendEl.appendChild(item);
    });
}

// Render the calendar
function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    calendarEl.innerHTML = '';
    
    // Set current year in the header
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = currentYear;
    }
    
    // Create a date object for the current year
    
    // Create a date object for the current year
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Create containers for each month
    for (let i = 0; i < 12; i++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        
        // Month header with name
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        
        const monthName = document.createElement('h3');
        monthName.textContent = monthNames[i];
        
        monthHeader.appendChild(monthName);
        monthContainer.appendChild(monthHeader);
        
        // Days grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';
        
        // Calculate days in month and first day of week
        const daysInMonth = new Date(currentYear, i + 1, 0).getDate();
        const firstDay = new Date(currentYear, i, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Add empty cells for days before the 1st of the month
        for (let j = 0; j < firstDay; j++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            daysGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(currentYear, i, day);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.textContent = day;
            dayEl.setAttribute('data-date', dateStr);
            
            // Set activity data if exists for this date
            if (activityData[dateStr]) {
                const activity = activityData[dateStr];
                dayEl.setAttribute('data-activity', activity.activityId);
                dayEl.setAttribute('data-count', activity.count);
                dayEl.style.backgroundColor = getActivityColor(activity.activityId, activity.count);
                dayEl.title = `${getActivityName(activity.activityId)}: ${activity.count} time(s)`;
            }
            
            // Highlight current day
            const today = new Date();
            if (currentDate.getDate() === today.getDate() && 
                currentDate.getMonth() === today.getMonth() && 
                currentDate.getFullYear() === today.getFullYear()) {
                dayEl.style.border = '2px solid #1a73e8';
            }
            
            daysGrid.appendChild(dayEl);
        }
        
        monthContainer.appendChild(daysGrid);
        calendarEl.appendChild(monthContainer);
    }
    
    // Add event listeners to days
    document.querySelectorAll('.day').forEach(day => {
        day.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            const currentActivity = activityData[date];
            
            if (currentActivity) {
                if (currentActivity.activityId === selectedActivity) {
                    // Same activity - increment count or remove if max
                    if (currentActivity.count >= 4) {
                        delete activityData[date];
                        this.removeAttribute('data-activity');
                        this.removeAttribute('data-count');
                        this.style.backgroundColor = '';
                        this.title = '';
                    } else {
                        currentActivity.count++;
                        this.setAttribute('data-count', currentActivity.count);
                        this.title = `${getActivityName(selectedActivity)}: ${currentActivity.count} time(s)`;
                    }
                } else {
                    // Different activity - switch to selected activity
                    currentActivity.activityId = selectedActivity;
                    currentActivity.count = 1;
                    this.setAttribute('data-activity', selectedActivity);
                    this.setAttribute('data-count', 1);
                    this.style.backgroundColor = getActivityColor(selectedActivity);
                    this.title = `${getActivityName(selectedActivity)}: 1 time`;
                }
            } else {
                // No activity - add new one
                activityData[date] = {
                    activityId: selectedActivity,
                    count: 1
                };
                this.setAttribute('data-activity', selectedActivity);
                this.setAttribute('data-count', 1);
                this.style.backgroundColor = getActivityColor(selectedActivity);
                this.title = `${getActivityName(selectedActivity)}: 1 time`;
            }
            
            // Save to localStorage
            saveData();
        });
        
        // Show activity name on hover
        day.addEventListener('mouseenter', function() {
            const activityId = this.getAttribute('data-activity');
            if (activityId) {
                const count = this.getAttribute('data-count');
                this.title = `${getActivityName(activityId)}: ${count} time(s)`;
            }
        });
    });
}



// Save data to localStorage
function saveData() {
    localStorage.setItem('activityData', JSON.stringify(activityData));
    localStorage.setItem('activities', JSON.stringify(activities));
}

// Initialize the application
function init() {
    // Load saved data
    const savedData = localStorage.getItem('activityData');
    const savedActivities = localStorage.getItem('activities');
    
    if (savedData) activityData = JSON.parse(savedData);
    if (savedActivities) {
        activities = { ...activities, ...JSON.parse(savedActivities) };
    }
    
    // Setup event listeners
    document.getElementById('addActivity').addEventListener('click', addActivity);
    document.getElementById('activityName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addActivity();
    });
    
    document.getElementById('activityType').addEventListener('change', (e) => {
        const activity = activities[e.target.value];
        if (activity) {
            document.getElementById('activityColor').value = activity.color;
            document.getElementById('activityName').value = activity.name;
        }
    });
    
    // Navigation event listeners
    document.getElementById('prevYear').addEventListener('click', () => {
        currentYear--;
        renderCalendar();
    });
    
    document.getElementById('nextYear').addEventListener('click', () => {
        currentYear++;
        renderCalendar();
    });
    
    // Setup markdown export button
    document.getElementById('markToday').addEventListener('click', () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentActivity = activityData[todayStr];
        
        if (currentActivity) {
            if (currentActivity.activityId === selectedActivity) {
                // Increment count if same activity
                if (currentActivity.count < 4) {
                    currentActivity.count++;
                } else {
                    delete activityData[todayStr];
                }
            } else {
                // Switch to selected activity
                activityData[todayStr] = {
                    activityId: selectedActivity,
                    count: 1
                };
            }
        } else {
            // Add new activity for today
            activityData[todayStr] = {
                activityId: selectedActivity,
                count: 1
            };
        }
        
        // Save and re-render
        saveData();
        renderCalendar();
        
        // Scroll to today's cell
        const todayCell = document.querySelector(`[data-date="${todayStr}"]`);
        if (todayCell) {
            todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            
            // Add highlight animation
            todayCell.classList.add('highlight-today');
            setTimeout(() => {
                todayCell.classList.remove('highlight-today');
            }, 1000);
        }
    });
    
    // Initial render
    renderActivityLegend();
    renderCalendar();
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
