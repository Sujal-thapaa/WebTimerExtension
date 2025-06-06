let categoryChart = null;
let currentTimeframe = 'today';
let refreshInterval;
let elements = {};
let weeklyChart = null;

// Define fixed colors for categories
const CATEGORY_COLORS = {
  'Gaming': '#2196F3',                   // Blue
  'Social Media': '#FF0000',             // Red
  'Entertainment': '#FFD700',            // Yellow
  'News & Blogs': '#4CAF50',            // Green
  'Productive / Educational': '#9C27B0',  // Purple
  'Email': '#00BCD4',                    // Light Blue
  'Shopping': '#FF9800',                 // Orange
  'Other': '#FF69B4'                     // Pink
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeElements();
    await setupEventListeners();
    await loadData('today');
    await initializeTheme();
    await initializeCategories();
    
    // Initialize chart if More modal is open
    const moreModal = document.getElementById('moreModal');
    if (moreModal && moreModal.style.display === 'block') {
      await updateWeeklyChart();
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
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

// Add notification permission check
async function checkNotificationPermission() {
  try {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Requested notification permission:', permission);
      if (permission === 'granted') {
        showToast('Notifications enabled! 🔔', 'success');
      } else {
        showToast('Please enable notifications to receive goal alerts', 'warning');
      }
    } else {
      console.log('Notification permission status:', Notification.permission);
      if (Notification.permission !== 'granted') {
        showToast('Please enable notifications in browser settings', 'warning');
      }
    }

    // Test notification to verify everything works
    if (Notification.permission === 'granted') {
      await testNotification();
    }
  } catch (error) {
    console.error('Error checking notification permission:', error);
    showToast('Error setting up notifications', 'error');
  }
}

// Function to test notifications
async function testNotification() {
  try {
    await chrome.notifications.create('test_notification', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'WebTimeTracker',
      message: 'Notifications are working! 🎉',
      priority: 2
    });
    console.log('✅ Test notification sent successfully');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

async function updateAllGoals(data, goals) {
  try {
    console.log('Updating goals display with data:', data);
    console.log('Current goals state from storage:', goals);

    const goalsContainer = document.querySelector('.goals-container');
    if (!goalsContainer) {
      console.error('Goals container not found in popup DOM');
      return;
    }
    goalsContainer.innerHTML = '';

    // Get all categories from the storage
    const { categories = {} } = await chrome.storage.local.get('categories');
    
    // Process each category that has a goal set
    Object.keys(categories).forEach(category => {
      const goalKey = `${category.toLowerCase().replace(/ /g, '')}Hours`;
      const goalHours = goals[goalKey];
      
      if (typeof goalHours === 'number' && goalHours > 0) {
        const timeSpent = data.categories[category] || 0;
        const goalMilliseconds = goalHours * 3600000;
        const progress = Math.min((timeSpent / goalMilliseconds) * 100, 100);
        
        console.log(`Displaying progress for ${category}:`, {
          timeSpent: timeSpent / 3600000, // hours
          goalHours,
          progress
        });

        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-item';
        goalDiv.innerHTML = `
          <div class="goal-header">
            <span class="goal-name">${category} ${progress >= 100 ? '🎉' : ''}</span>
            <span class="goal-time">${formatTime(timeSpent)} / ${goalHours}h</span>
          </div>
          <div class="goal-progress">
            <div class="progress-bar ${progress >= 100 ? 'progress-complete' : progress >= 50 ? 'progress-good' : ''}">
              <div style="width: ${progress}%"></div>
            </div>
            <span class="goal-percentage">${Math.round(progress)}%</span>
          </div>`;
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
    console.error('Error updating goals display in popup:', error);
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

    // Debug: Log all available categories and their exact names
    console.log('Available categories:', categories);
    console.log('CATEGORY_COLORS keys:', Object.keys(CATEGORY_COLORS));

    // Map categories to their fixed colors, with detailed logging
    const colors = categories.map(category => {
      const color = CATEGORY_COLORS[category.trim()];
      if (!color) {
        console.warn(`No color defined for category: "${category}" (length: ${category.length})`);
        // Log character codes to check for hidden characters
        console.log('Category character codes:', [...category].map(c => c.charCodeAt(0)));
        return CATEGORY_COLORS['Other'];
      }
      console.log(`Assigned color for ${category}: ${color}`);
      return color;
    });

    console.log('Final color assignments:', categories.map((cat, i) => ({
      category: cat,
      color: colors[i]
    })));

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: times,
          backgroundColor: colors,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.5)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const hours = Math.floor(context.raw);
                const minutes = Math.round((context.raw - hours) * 60);
                return `${context.label}: ${hours}h ${minutes}m`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating chart:', error);
  }
}

function getWebsiteLogo(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

function getCleanWebsiteName(domain) {
  // Remove www. and .com/.org etc
  let name = domain.replace(/^www\./, '').replace(/\.(com|org|net|io|edu|gov)$/, '');
  
  // Split by dots and get the main domain name
  name = name.split('.')[0];
  
  // Capitalize first letter of each word
  name = name.split(/[-_]/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Special cases for common websites
  const specialCases = {
    'Youtube': 'YouTube',
    'Github': 'GitHub',
    'Linkedin': 'LinkedIn',
    'Facebook': 'Facebook',
    'Twitter': 'Twitter',
    'Instagram': 'Instagram'
  };

  return specialCases[name] || name;
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
      <div class="site-info">
        <img src="${getWebsiteLogo(site)}" alt="${site} logo" class="site-logo">
        <span class="site-name">${getCleanWebsiteName(site)}</span>
      </div>
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
    const moreBtn = document.getElementById('moreBtn');
    const moreModal = document.getElementById('moreModal');
    const closeMoreBtn = document.getElementById('closeMoreBtn');

    moreBtn?.addEventListener('click', async () => {
      moreModal.style.display = 'block';
      await updateWeeklyChart(); // Make sure chart is updated when modal opens
      await updateSessionInsights();
    });

    closeMoreBtn?.addEventListener('click', () => {
      moreModal.style.display = 'none';
    });

    // Close modal when clicking outside
    moreModal.addEventListener('click', (e) => {
      if (e.target === moreModal) {
        moreModal.style.display = 'none';
      }
    });

    // Export button
    if (elements.exportDataBtn) {
      elements.exportDataBtn.addEventListener('click', exportData);
    }

    // Goals button and modal
    if (elements.goalsBtn && elements.goalsModal && elements.closeGoalsBtn) {
      elements.goalsBtn.addEventListener('click', async () => {
        elements.goalsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        await updateGoalsDisplay();
      });

      elements.closeGoalsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        elements.goalsModal.style.display = 'none';
        document.body.style.overflow = '';
      });

      // Close modal when clicking outside
      elements.goalsModal.addEventListener('click', (e) => {
        if (e.target === elements.goalsModal) {
          elements.goalsModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }

    // Edit goals
    if (elements.editGoalsBtn && elements.editGoalsModal && elements.closeEditGoalsBtn && elements.saveGoalsBtn) {
      elements.editGoalsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        elements.editGoalsModal.style.display = 'block';
        await loadGoalsEditor();
      });

      elements.closeEditGoalsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        elements.editGoalsModal.style.display = 'none';
      });

      // Close modal when clicking outside
      elements.editGoalsModal.addEventListener('click', (e) => {
        if (e.target === elements.editGoalsModal) {
          elements.editGoalsModal.style.display = 'none';
        }
      });

      elements.saveGoalsBtn.addEventListener('click', saveGoals);
    }

    // Settings
    if (elements.settingsBtn && elements.settingsModal && elements.closeSettingsBtn && elements.saveSettingsBtn) {
      elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadSettings();
      });

      elements.closeSettingsBtn.addEventListener('click', () => {
        elements.settingsModal.style.display = 'none';
        document.body.style.overflow = '';
      });

      // Close modal when clicking outside
      elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
          elements.settingsModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });

      elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Theme mode buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mode = btn.id.replace('ModeBtn', '').toLowerCase();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Update active state
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Apply theme
        applyTheme(mode, prefersDark);
        
        // Save preference
        const { theme = {} } = await chrome.storage.local.get('theme');
        await chrome.storage.local.set({
          theme: { ...theme, mode }
        });
      });
    });

    // Color accent buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const color = btn.dataset.color;
        
        // Update active state
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Apply color
        applyAccentColor(color);
        
        // Save preference
        const { theme = {} } = await chrome.storage.local.get('theme');
        await chrome.storage.local.set({
          theme: { ...theme, accent: color }
        });
      });
    });

    // Setup collapsible sections
    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        const targetId = header.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        
        // Toggle aria-expanded
        header.setAttribute('aria-expanded', !isExpanded);
        
        // Toggle content visibility
        if (content) {
          content.classList.toggle('show');
        }
      });
    });

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

    const { timeData, goals = {}, categories = {} } = await chrome.storage.local.get(['timeData', 'goals', 'categories']);
    const today = getTodayString();
    const todayData = timeData[today] || { categories: {} };

    // Store scroll position before updating content
    const modalBody = elements.goalsModal.querySelector('.modal-body');
    const scrollPosition = modalBody ? modalBody.scrollTop : 0;

    elements.goalsContainer.innerHTML = '';

    // Create a goal card for each category that has a goal set
    Object.keys(categories).forEach(category => {
      const goalKey = `${category.toLowerCase().replace(/ /g, '')}Hours`;
      const goalHours = goals[goalKey] || 0;
      
      if (goalHours > 0) {
        const timeSpent = todayData.categories[category] || 0;
        const goalMilliseconds = goalHours * 3600000;
        const progress = Math.min((timeSpent / goalMilliseconds) * 100, 100);
        
        console.log(`Displaying progress for ${category}:`, {
          timeSpent: timeSpent / 3600000, // hours
          goalHours,
          progress
        });

        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-item';
        goalDiv.innerHTML = `
          <div class="goal-header">
            <span class="goal-name">${category} ${progress >= 100 ? '🎉' : ''}</span>
            <span class="goal-time">${formatTime(timeSpent)} / ${goalHours}h</span>
          </div>
          <div class="goal-progress">
            <div class="progress-bar ${progress >= 100 ? 'progress-complete' : progress >= 50 ? 'progress-good' : ''}">
              <div style="width: ${progress}%"></div>
            </div>
            <span class="goal-percentage">${Math.round(progress)}%</span>
          </div>`;
        elements.goalsContainer.appendChild(goalDiv);
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

    // Restore scroll position after content update
    if (modalBody) {
      requestAnimationFrame(() => {
        modalBody.scrollTop = scrollPosition;
      });
    }
  } catch (error) {
    console.error('Error updating goals display:', error);
  }
}

async function loadGoalsEditor() {
  try {
    const categoryGoalsContainer = document.getElementById('categoryGoals');
    if (!categoryGoalsContainer) {
      console.error('Category goals container not found');
      return;
    }

    const { categories = {}, goals = {} } = await chrome.storage.local.get(['categories', 'goals']);
    categoryGoalsContainer.innerHTML = '';

    if (Object.keys(categories).length === 0) {
      categoryGoalsContainer.innerHTML = '<p class="no-categories">No categories defined yet.</p>';
      return;
    }

    Object.keys(categories).forEach(category => {
      const goalItem = document.createElement('div');
      goalItem.className = 'category-goal-item';
      
      const goalKey = `${category.toLowerCase().replace(/ /g, '')}Hours`;
      const currentValue = goals[goalKey] || 0;

      goalItem.innerHTML = `
        <span class="category-goal-name">${category}</span>
        <div class="goal-input-wrapper">
          <input type="number" 
                 class="category-goal-input" 
                 data-category="${category}"
                 value="${currentValue}"
                 min="0" 
                 max="24" 
                 step="0.5">
          <span class="goal-unit">hours</span>
        </div>
      `;
      categoryGoalsContainer.appendChild(goalItem);
    });

  } catch (error) {
    console.error('Error loading goals editor:', error);
    showToast('Error loading goals editor', 'error');
  }
}

async function saveGoals() {
  try {
    const newGoals = { streak: 0 }; // Reset streak when saving new goals
    let hasChanges = false;

    // Get current goals to check for changes
    const { goals: currentGoals = {} } = await chrome.storage.local.get('goals');
    
    // Get all category goal inputs
    document.querySelectorAll('.category-goal-input').forEach(input => {
      const category = input.getAttribute('data-category');
      if (!category) return;

      const newValue = parseFloat(input.value) || 0;
      const goalKey = `${category.toLowerCase().replace(/ /g, '')}Hours`;
      
      // Only update if the value has changed
      if (currentGoals[goalKey] !== newValue) {
        hasChanges = true;
      }
      newGoals[goalKey] = newValue;
    });

    // Preserve existing streak
    newGoals.streak = currentGoals.streak || 0;

    if (hasChanges) {
      await chrome.storage.local.set({ goals: newGoals });
      console.log('Updated goals:', newGoals);
      
      // Close the edit modal
      const editGoalsModal = document.getElementById('editGoalsModal');
      if (editGoalsModal) {
        editGoalsModal.style.display = 'none';
      }

      // Refresh the goals display
      const { timeData = {} } = await chrome.storage.local.get('timeData');
      const today = getTodayString();
      const todayData = timeData[today] || { sites: {}, categories: {} };
      await updateAllGoals(todayData, newGoals);
      
      showToast('Goals updated successfully! 🎯', 'success');
    } else {
      // Just close the modal if no changes
      const editGoalsModal = document.getElementById('editGoalsModal');
      if (editGoalsModal) {
        editGoalsModal.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error saving goals:', error);
    showToast('Error saving goals', 'error');
  }
}

// Update the toast function to handle different types
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Update toast styles to include warning type
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    z-index: 1000;
    animation: fadeInOut 3s ease-in-out;
  }

  .toast.success {
    background-color: #27ae60;
  }

  .toast.error {
    background-color: #e74c3c;
  }

  .toast.info {
    background-color: #3498db;
  }

  .toast.warning {
    background-color: #f1c40f;
    color: #2c3e50;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, 20px); }
    10% { opacity: 1; transform: translate(-50%, 0); }
    90% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -20px); }
  }

  .goal-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .category-goal-input {
    width: 80px;
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
document.head.appendChild(toastStyle);

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

// Theme Management
async function initializeTheme() {
  try {
    const { theme = {} } = await chrome.storage.local.get('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    const colorMode = theme.mode || 'system';
    const accentColor = theme.accent || 'blue';
    
    // Apply theme
    applyTheme(colorMode, prefersDark);
    applyAccentColor(accentColor);
    
    // Update UI to show active settings
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === `${colorMode}ModeBtn`);
    });
    
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === accentColor);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (colorMode === 'system') {
        applyTheme('system', e.matches);
      }
    });
  } catch (error) {
    console.error('Error initializing theme:', error);
  }
}

function applyTheme(mode, systemPrefersDark) {
  let isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function applyAccentColor(color) {
  const colors = {
    blue: '#4a90e2',
    green: '#27ae60',
    purple: '#9b59b6',
    orange: '#e67e22',
    red: '#e74c3c'
  };
  
  document.documentElement.style.setProperty('--accent-color', colors[color] || colors.blue);
}

async function initializeCategories() {
  try {
    const { categories } = await chrome.storage.local.get('categories');
    
    // If categories don't exist, set up default categories
    if (!categories || Object.keys(categories).length === 0) {
      const defaultCategories = {
        'Gaming': {
          description: 'Gaming and game-related websites',
          examples: ['steam.com', 'epicgames.com', 'twitch.tv', 'roblox.com']
        },
        'Social Media': {
          description: 'Social networking and communication',
          examples: ['facebook.com', 'twitter.com', 'instagram.com']
        },
        'Entertainment': {
          description: 'Entertainment and media sites',
          examples: ['youtube.com', 'netflix.com', 'spotify.com']
        },
        'News & Blogs': {
          description: 'News websites and blog platforms',
          examples: ['medium.com', 'news.google.com', 'bbc.com']
        },
        'Productive / Educational': {
          description: 'Learning and productivity tools',
          examples: ['coursera.org', 'udemy.com', 'notion.so']
        },
        'Email': {
          description: 'Email services and communication',
          examples: ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com']
        },
        'Shopping': {
          description: 'Online shopping and e-commerce',
          examples: ['amazon.com', 'ebay.com', 'etsy.com']
        }
      };

      await chrome.storage.local.set({ categories: defaultCategories });
      console.log('Initialized default categories:', defaultCategories);
    } else {
      // Log existing categories to check their names
      console.log('Existing categories:', Object.keys(categories));
    }

    // Verify that category names match exactly
    const storedCategories = await chrome.storage.local.get('categories');
    console.log('Current stored categories:', storedCategories);
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
}

// Function to get formatted day name
function getDayName(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
}

// Function to update weekly usage details
async function updateWeeklyDetails(weekData) {
  const categoriesContainer = document.getElementById('weeklyCategories');
  const websitesContainer = document.getElementById('weeklyWebsites');
  
  if (!categoriesContainer || !websitesContainer) return;

  // Clear existing content
  categoriesContainer.innerHTML = '';
  websitesContainer.innerHTML = '';

  // Calculate total time for percentages
  const totalTime = Object.values(weekData.categories).reduce((sum, time) => sum + time, 0);

  // Sort categories by time spent
  const sortedCategories = Object.entries(weekData.categories)
    .sort(([, a], [, b]) => b - a);

  // Update categories list
  for (const [category, time] of sortedCategories) {
    const percentage = ((time / totalTime) * 100).toFixed(1);
    const formattedTime = formatTime(time);
    
    const categoryItem = document.createElement('div');
    categoryItem.className = 'weekly-item';
    categoryItem.innerHTML = `
      <div class="weekly-item-info">
        <div class="weekly-item-icon">📁</div>
        <div class="weekly-item-name">${category}</div>
      </div>
      <div class="weekly-item-stats">
        <span class="weekly-item-time">${formattedTime}</span>
        <span class="weekly-item-percentage">(${percentage}%)</span>
      </div>
    `;
    categoriesContainer.appendChild(categoryItem);
  }

  // Sort websites by time spent
  const sortedWebsites = Object.entries(weekData.sites)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Show top 10 websites

  // Update websites list
  for (const [domain, time] of sortedWebsites) {
    const percentage = ((time / totalTime) * 100).toFixed(1);
    const formattedTime = formatTime(time);
    const cleanName = getCleanWebsiteName(domain);
    
    const websiteItem = document.createElement('div');
    websiteItem.className = 'weekly-item';
    websiteItem.innerHTML = `
      <div class="weekly-item-info">
        <img class="weekly-item-icon" src="${getWebsiteLogo(domain)}" alt="${cleanName} logo" 
             onerror="this.src='icons/globe.png'">
        <div class="weekly-item-name">${cleanName}</div>
      </div>
      <div class="weekly-item-stats">
        <span class="weekly-item-time">${formattedTime}</span>
        <span class="weekly-item-percentage">(${percentage}%)</span>
      </div>
    `;
    websitesContainer.appendChild(websiteItem);
  }
}

// Function to update weekly chart
async function updateWeeklyChart() {
  try {
    console.log('Updating weekly chart...');
    const { timeData = {} } = await chrome.storage.local.get('timeData');
    const weekData = getWeekData(timeData);
    const ctx = document.getElementById('weeklyChart');
    
    if (!ctx) {
      console.error('Weekly chart canvas not found');
      return;
    }
    console.log('Found chart canvas:', ctx);

    // Destroy existing chart if it exists
    if (weeklyChart) {
      console.log('Destroying existing chart');
      weeklyChart.destroy();
    }

    // Get the last 7 days of data
    const today = new Date();
    const dates = [];
    const dailyTotals = [];
    const categoryData = {};

    // Initialize the arrays with the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = getDateString(date);
      dates.push(getDayName(date));
      
      const dayData = timeData[dateStr]?.categories || {};
      const dayTotal = Object.values(dayData).reduce((sum, time) => sum + time, 0);
      dailyTotals.push(dayTotal / 3600000); // Convert to hours

      // Collect category data
      Object.entries(dayData).forEach(([category, time]) => {
        if (!categoryData[category]) {
          categoryData[category] = new Array(7).fill(0);
        }
        categoryData[category][6 - i] = time / 3600000; // Convert to hours
      });
    }

    console.log('Prepared chart data:', {
      dates,
      categoryData
    });

    // Create datasets for each category
    const datasets = Object.entries(categoryData).map(([category, data], index) => ({
      label: category,
      data: data,
      backgroundColor: [
        '#4a90e2',
        '#27ae60',
        '#e67e22',
        '#e74c3c',
        '#95a5a6',
        '#9b59b6',
        '#f1c40f'
      ][index % 7],
      borderWidth: 1
    }));

    console.log('Creating new chart with datasets:', datasets);

    // Create the chart
    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const hours = Math.floor(context.raw);
                const minutes = Math.round((context.raw - hours) * 60);
                return `${context.dataset.label}: ${hours}h ${minutes}m`;
              }
            }
          }
        }
      }
    });

    console.log('Chart created successfully');

    // Update the weekly details
    await updateWeeklyDetails(weekData);
  } catch (error) {
    console.error('Error updating weekly insights:', error);
  }
} 