let categoryChart = null;
let currentTimeframe = 'today';
let refreshInterval;
let elements = {};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup initialized');
  try {
    initializeElements();
    await loadData('today');
    setupEventListeners();
    setupAutoRefresh();
    console.log('Initial data loaded');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

function initializeElements() {
  elements = {
    // Time period
    todayBtn: document.getElementById('todayBtn'),
    weekBtn: document.getElementById('weekBtn'),
    
    // Main buttons
    goalsBtn: document.getElementById('goalsBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    moreBtn: document.getElementById('moreBtn'),
    
    // Modals
    moreModal: document.getElementById('moreModal'),
    goalsModal: document.getElementById('goalsModal'),
    settingsModal: document.getElementById('settingsModal'),
    editGoalsModal: document.getElementById('editGoalsModal'),
    
    // Close buttons
    closeMoreBtn: document.getElementById('closeMoreBtn'),
    closeGoalsBtn: document.getElementById('closeGoalsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    closeEditGoalsBtn: document.getElementById('closeEditGoalsBtn'),
    
    // Action buttons
    exportDataBtn: document.getElementById('exportDataBtn'),
    editGoalsBtn: document.getElementById('editGoalsBtn'),
    saveGoalsBtn: document.getElementById('saveGoalsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Containers
    goalsContainer: document.querySelector('.goals-container'),
    sessionInsights: document.getElementById('sessionInsights'),
    streakInfo: document.querySelector('.streak-info'),
    categoryGoals: document.getElementById('categoryGoals'),
    categoriesList: document.getElementById('categoriesList')
  };

  // Log any missing elements
  Object.entries(elements).forEach(([name, element]) => {
    if (!element) {
      console.error(`Missing element: ${name}`);
    }
  });
}

function setupAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(async () => {
    await loadData(currentTimeframe);
  }, 1000);
}

// Cleanup when popup closes
window.addEventListener('unload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Function to get date in YYYY-MM-DD format
function getDateString(date) {
  return date.toISOString().split('T')[0];
}

// Function to get today's date string
function getTodayString() {
  return getDateString(new Date());
}

async function loadData(timeframe) {
  console.log('Loading data for timeframe:', timeframe);
  currentTimeframe = timeframe;
  try {
    const { timeData = {}, goals = {} } = await chrome.storage.local.get(['timeData', 'goals']);
    console.log('Retrieved data:', { timeData, goals });
    
    if (timeframe === 'today') {
      const today = getTodayString();
      console.log('Loading data for date:', today);
      const todayData = timeData[today] || { sites: {}, categories: {} };
      console.log('Today\'s data:', todayData);
      updateUI(todayData, goals);
    } else {
      const weekData = getWeekData(timeData);
      console.log('Week data:', weekData);
      updateUI(weekData, goals);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function getWeekData(timeData) {
  const weekData = { sites: {}, categories: {} };
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayString = getTodayString();
  const weekAgoString = getDateString(weekAgo);

  console.log('Getting week data from', weekAgoString, 'to', todayString);

  Object.entries(timeData).forEach(([date, data]) => {
    if (date >= weekAgoString && date <= todayString) {
      console.log('Including data for date:', date);
      
      // Aggregate site data
      Object.entries(data.sites).forEach(([site, time]) => {
        weekData.sites[site] = (weekData.sites[site] || 0) + time;
      });

      // Aggregate category data
      Object.entries(data.categories).forEach(([category, time]) => {
        weekData.categories[category] = (weekData.categories[category] || 0) + time;
      });
    }
  });

  return weekData;
}

function updateUI(data, goals) {
  console.log('Updating UI with data:', data);
  updateTotalTime(data);
  updateAllGoals(data, goals);
  updateCategoryChart(data);
  updateTopSites(data);
}

function updateTotalTime(data) {
  const totalTime = Object.values(data.categories).reduce((a, b) => a + b, 0);
  const hours = Math.floor(totalTime / 3600000);
  const minutes = Math.floor((totalTime % 3600000) / 60000);
  const seconds = Math.floor((totalTime % 60000) / 1000);
  document.getElementById('totalTime').textContent = `${hours}h ${minutes}m ${seconds}s`;
}

// Helper function to format time
function formatTime(milliseconds) {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function updateAllGoals(data, goals) {
  try {
    console.log('Updating goals with data:', data);
    const goalsContainer = document.getElementById('goalsContainer');
    goalsContainer.innerHTML = ''; // Clear existing goals

    // Process each category
    Object.entries(data.categories).forEach(([category, timeSpent]) => {
      const goalHours = goals?.[`${category.toLowerCase()}Hours`] || 0;
      
      // Only show categories that have goals set
      if (goalHours > 0) {
        const progress = Math.min((timeSpent / (goalHours * 3600000)) * 100, 100);
        
        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-item';
        goalDiv.innerHTML = `
          <div class="goal-header">
            <span class="goal-name">${category}</span>
            <span class="goal-time">${formatTime(timeSpent)} / ${goalHours}h</span>
          </div>
          <div class="goal-progress">
            <progress class="goal-bar" value="${progress}" max="100"></progress>
            <span class="goal-percentage">${Math.round(progress)}%</span>
          </div>
        `;

        // Add color coding based on progress
        const progressBar = goalDiv.querySelector('.goal-bar');
        const percentageText = goalDiv.querySelector('.goal-percentage');
        
        if (progress >= 100) {
          progressBar.classList.add('progress-complete');
          percentageText.style.color = 'var(--success-color)';
        } else if (progress >= 50) {
          progressBar.classList.add('progress-good');
          percentageText.style.color = 'var(--primary-color)';
        }

        goalsContainer.appendChild(goalDiv);
      }
    });

    // Add streak if any goals are met
    if (goals?.streak > 0) {
      const streakDiv = document.createElement('div');
      streakDiv.className = 'streak';
      streakDiv.innerHTML = `
        <span>🔥 Current Streak: ${goals.streak} day${goals.streak !== 1 ? 's' : ''}</span>
      `;
      streakDiv.style.color = 'var(--success-color)';
      goalsContainer.appendChild(streakDiv);
    }

  } catch (error) {
    console.error('Error updating goals:', error);
  }
}

function updateCategoryChart(data) {
  console.log('Updating category chart with data:', data);
  try {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) {
      console.error('Category chart canvas not found');
      return;
    }

    if (categoryChart) {
      categoryChart.destroy();
    }

    const categories = Object.keys(data.categories);
    const times = Object.values(data.categories).map(time => time / 3600000); // Convert to hours

    if (categories.length === 0) {
      console.log('No categories data available');
      return;
    }

    console.log('Creating chart with:', { categories, times });
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: times,
          backgroundColor: [
            '#4a90e2', // Primary
            '#27ae60', // Success
            '#e67e22', // Warning
            '#e74c3c', // Danger
            '#95a5a6'  // Gray
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating chart:', error);
  }
}

function updateTopSites(data) {
  const topSitesList = document.getElementById('topSitesList');
  topSitesList.innerHTML = '';

  const sortedSites = Object.entries(data.sites)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  sortedSites.forEach(([site, time]) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    siteItem.innerHTML = `
      <span>${site}</span>
      <span>${hours}h ${minutes}m ${seconds}s</span>
    `;
    topSitesList.appendChild(siteItem);
  });
}

function setupEventListeners() {
  console.log('Setting up event listeners');
  try {
    // Time period buttons
    if (elements.todayBtn && elements.weekBtn) {
      elements.todayBtn.addEventListener('click', async (e) => {
        document.querySelector('.time-period .active')?.classList.remove('active');
        e.target.classList.add('active');
        currentTimeframe = 'today';
        await loadData('today');
      });

      elements.weekBtn.addEventListener('click', async (e) => {
        document.querySelector('.time-period .active')?.classList.remove('active');
        e.target.classList.add('active');
        currentTimeframe = 'week';
        await loadData('week');
      });
    }

    // More button and modal
    if (elements.moreBtn && elements.moreModal && elements.closeMoreBtn) {
      elements.moreBtn.addEventListener('click', () => {
        elements.moreModal.style.display = 'block';
        updateSessionInsights();
      });

      elements.closeMoreBtn.addEventListener('click', () => {
        elements.moreModal.style.display = 'none';
      });
    }

    // Export button
    if (elements.exportDataBtn) {
      elements.exportDataBtn.addEventListener('click', exportData);
    }

    // Goals button and modal
    if (elements.goalsBtn && elements.goalsModal && elements.closeGoalsBtn) {
      elements.goalsBtn.addEventListener('click', () => {
        elements.goalsModal.style.display = 'block';
        updateGoalsDisplay();
      });

      elements.closeGoalsBtn.addEventListener('click', () => {
        elements.goalsModal.style.display = 'none';
      });
    }

    // Edit goals
    if (elements.editGoalsBtn && elements.editGoalsModal && elements.closeEditGoalsBtn && elements.saveGoalsBtn) {
      elements.editGoalsBtn.addEventListener('click', () => {
        elements.editGoalsModal.style.display = 'block';
        loadGoalsEditor();
      });

      elements.closeEditGoalsBtn.addEventListener('click', () => {
        elements.editGoalsModal.style.display = 'none';
      });

      elements.saveGoalsBtn.addEventListener('click', saveGoals);
    }

    // Settings
    if (elements.settingsBtn && elements.settingsModal && elements.closeSettingsBtn && elements.saveSettingsBtn) {
      elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.style.display = 'block';
        loadSettings();
      });

      elements.closeSettingsBtn.addEventListener('click', () => {
        elements.settingsModal.style.display = 'none';
      });

      elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }

    console.log('Event listeners set up successfully');
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

async function updateGoalsDisplay() {
  try {
    if (!elements.goalsContainer || !elements.streakInfo) {
      console.error('Required elements for goals display not found');
      return;
    }

    const { timeData, goals = {} } = await chrome.storage.local.get(['timeData', 'goals']);
    const today = getTodayString();
    const todayData = timeData[today] || { categories: {} };

    elements.goalsContainer.innerHTML = '';

    // Create a goal card for each category that has a goal set
    Object.entries(todayData.categories).forEach(([category, timeSpent]) => {
      const goalHours = goals[`${category.toLowerCase()}Hours`] || 0;
      
      if (goalHours > 0) {
        const progress = Math.min((timeSpent / (goalHours * 3600000)) * 100, 100);
        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        
        goalCard.innerHTML = `
          <div class="goal-card-header">
            <span class="goal-card-title">${category}</span>
            <span class="goal-card-time">${formatTime(timeSpent)} / ${goalHours}h</span>
          </div>
          <div class="goal-card-progress">
            <progress value="${progress}" max="100" class="${progress >= 100 ? 'progress-complete' : progress >= 50 ? 'progress-good' : ''}"></progress>
          </div>
          <div class="goal-card-stats">
            <span>${Math.round(progress)}% Complete</span>
            <span>${formatTime(Math.max(goalHours * 3600000 - timeSpent, 0))} Remaining</span>
          </div>
        `;
        
        elements.goalsContainer.appendChild(goalCard);
      }
    });

    // Update streak information
    if (goals.streak > 0) {
      elements.streakInfo.innerHTML = `
        <div class="streak-count">🔥 ${goals.streak}</div>
        <div>Day Streak</div>
      `;
    } else {
      elements.streakInfo.innerHTML = `
        <div>Start achieving your goals to build a streak!</div>
      `;
    }
  } catch (error) {
    console.error('Error updating goals display:', error);
  }
}

async function loadGoalsEditor() {
  try {
    if (!elements.categoryGoals) {
      console.error('Category goals container not found');
      return;
    }

    const { categories = {}, goals = {} } = await chrome.storage.local.get(['categories', 'goals']);
    elements.categoryGoals.innerHTML = '';

    Object.keys(categories).forEach(category => {
      const goalItem = document.createElement('div');
      goalItem.className = 'category-goal-item';
      goalItem.innerHTML = `
        <span class="category-goal-name">${category}</span>
        <div class="goal-input-wrapper">
          <input type="number" 
                 class="category-goal-input" 
                 data-category="${category}"
                 value="${goals[`${category.toLowerCase()}Hours`] || 0}"
                 min="0" 
                 max="24" 
                 step="0.5">
          <span class="goal-unit">hours</span>
        </div>
      `;
      elements.categoryGoals.appendChild(goalItem);
    });
  } catch (error) {
    console.error('Error loading goals editor:', error);
  }
}

async function saveGoals() {
  try {
    if (!elements.categoryGoals || !elements.editGoalsModal) {
      console.error('Required elements for saving goals not found');
      return;
    }

    const goals = { streak: 0 }; // Reset streak when saving new goals
    
    // Get all category goal inputs
    const goalInputs = elements.categoryGoals.querySelectorAll('.category-goal-input');
    if (!goalInputs || goalInputs.length === 0) {
      console.error('No goal inputs found');
      return;
    }

    goalInputs.forEach(input => {
      const category = input.dataset.category;
      const hours = parseFloat(input.value);
      
      if (!isNaN(hours) && hours >= 0 && hours <= 24) {
        goals[`${category.toLowerCase()}Hours`] = hours;
      }
    });

    // Preserve existing streak
    const existingGoals = (await chrome.storage.local.get('goals')).goals || {};
    goals.streak = existingGoals.streak || 0;

    await chrome.storage.local.set({ goals });
    elements.editGoalsModal.style.display = 'none';
    updateGoalsDisplay(); // Refresh the goals display
  } catch (error) {
    console.error('Error saving goals:', error);
  }
}

// Add CSS styles for the goal input wrapper
const style = document.createElement('style');
style.textContent = `
  .goal-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .category-goal-input {
    width: 60px;
    padding: 6px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    text-align: center;
    font-size: 0.9em;
  }

  .goal-unit {
    color: var(--text-secondary);
    font-size: 0.9em;
  }

  .category-goal-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-bottom: 10px;
  }

  .category-goal-name {
    font-weight: 500;
    color: var(--text-color);
  }
`;
document.head.appendChild(style);

async function loadSettings() {
  try {
    const { categories, goals = {} } = await chrome.storage.local.get(['categories', 'goals']);
    
    // Update category goals
    const categoryGoals = document.getElementById('categoryGoals');
    categoryGoals.innerHTML = '';

    Object.entries(categories || {}).forEach(([category, data]) => {
      const goalDiv = document.createElement('div');
      goalDiv.className = 'goal-setting';
      goalDiv.innerHTML = `
        <div class="goal-header">
          <label>${category} Goal (hours):</label>
          <input type="number" 
                 class="category-goal-input" 
                 data-category="${category}"
                 value="${goals[`${category.toLowerCase()}Hours`] || 0}"
                 min="0" 
                 max="24" 
                 step="0.5">
        </div>
      `;
      categoryGoals.appendChild(goalDiv);
    });

    // Update categories list
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';

    Object.entries(categories || {}).forEach(([category, data]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'category-item';
      categoryDiv.innerHTML = `
        <div class="category-header">
          <h4>${category}</h4>
          <button class="edit-category" data-category="${category}">Edit</button>
        </div>
        <div class="category-description">${data.description}</div>
        <div class="category-examples">Example sites: ${data.examples.join(', ')}</div>
      `;
      categoriesList.appendChild(categoryDiv);

      // Add click handler for edit button
      const editButton = categoryDiv.querySelector('.edit-category');
      editButton.addEventListener('click', () => openCategoryEditor(category, data));
    });

  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function openCategoryEditor(category, data) {
  const modal = document.getElementById('editCategoryModal');
  const nameInput = document.getElementById('categoryName');
  const descInput = document.getElementById('categoryDescription');
  const examplesInput = document.getElementById('categoryExamples');

  // Fill in current values
  nameInput.value = category;
  descInput.value = data.description;
  examplesInput.value = data.examples.join(', ');

  // Show the modal
  modal.style.display = 'block';

  // Handle save
  document.getElementById('saveCategoryBtn').onclick = async () => {
    try {
      const { categories } = await chrome.storage.local.get('categories');
      
      // Update category data
      categories[category] = {
        description: descInput.value,
        examples: examplesInput.value.split(',').map(s => s.trim()).filter(s => s)
      };

      await chrome.storage.local.set({ categories });
      modal.style.display = 'none';
      await loadSettings(); // Refresh the list
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  // Handle cancel
  document.getElementById('cancelCategoryBtn').onclick = () => {
    modal.style.display = 'none';
  };
}

async function saveSettings() {
  try {
    const goals = { streak: 0 }; // Reset streak when saving new goals
    
    // Get all category goal inputs
    const goalInputs = document.querySelectorAll('.category-goal-input');
    goalInputs.forEach(input => {
      const category = input.dataset.category;
      const hours = parseFloat(input.value);
      
      if (!isNaN(hours) && hours >= 0 && hours <= 24) {
        goals[`${category.toLowerCase()}Hours`] = hours;
      }
    });

    // Preserve existing streak
    const existingGoals = (await chrome.storage.local.get('goals')).goals || {};
    goals.streak = existingGoals.streak || 0;

    await chrome.storage.local.set({ goals });
    document.getElementById('settingsModal').style.display = 'none';
    await loadData(currentTimeframe);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

async function exportData() {
  const { timeData } = await chrome.storage.local.get('timeData');
  
  const blob = new Blob([JSON.stringify(timeData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'web-time-tracker-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function updateSessionInsights() {
  try {
    if (!elements.sessionInsights) {
      console.error('Session insights container not found');
      return;
    }

    const { sessionData = {} } = await chrome.storage.local.get('sessionData');
    const today = getTodayString();
    const todaySessions = sessionData[today] || { sites: {}, categories: {} };
    
    elements.sessionInsights.innerHTML = '';

    // If no sessions today, show message
    if (Object.keys(todaySessions.sites || {}).length === 0) {
      elements.sessionInsights.innerHTML = `
        <div class="no-sessions">
          No browsing sessions recorded today
        </div>
      `;
      return;
    }

    // Process site sessions
    Object.entries(todaySessions.sites || {}).forEach(([site, sessions]) => {
      if (sessions && sessions.length > 0) {
        const longestSession = Math.max(...sessions.map(s => s.duration));
        const averageSession = sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length;
        
        const siteCard = document.createElement('div');
        siteCard.className = 'session-card';
        siteCard.innerHTML = `
          <div class="session-site">${site}</div>
          <div class="session-stat">
            <span>Longest Session</span>
            <span class="session-stat-value">${formatTime(longestSession)}</span>
          </div>
          <div class="session-stat">
            <span>Average Session</span>
            <span class="session-stat-value">${formatTime(averageSession)}</span>
          </div>
          <div class="session-stat">
            <span>Number of Sessions</span>
            <span class="session-stat-value">${sessions.length}</span>
          </div>
        `;
        elements.sessionInsights.appendChild(siteCard);
      }
    });

    // Process category sessions
    Object.entries(todaySessions.categories || {}).forEach(([category, sessions]) => {
      if (sessions && sessions.length > 0) {
        const categorySection = document.createElement('div');
        categorySection.className = 'session-category';
        
        const longestSession = Math.max(...sessions.map(s => s.duration));
        const averageSession = sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length;
        
        categorySection.innerHTML = `
          <div class="session-category-title">${category}</div>
          <div class="session-stat">
            <span>Longest Session</span>
            <span class="session-stat-value">${formatTime(longestSession)}</span>
          </div>
          <div class="session-stat">
            <span>Average Session</span>
            <span class="session-stat-value">${formatTime(averageSession)}</span>
          </div>
          <div class="session-stat">
            <span>Total Sessions</span>
            <span class="session-stat-value">${sessions.length}</span>
          </div>
        `;
        elements.sessionInsights.appendChild(categorySection);
      }
    });

  } catch (error) {
    console.error('Error updating session insights:', error);
  }
} 