// popup.js - Main popup functionality

// Global variables
let currentPeriod = 'today';
let categoryChart = null;
let weeklyChart = null;

// Theme management
const THEMES = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8f9fa',
    '--text-color': '#2c3e50',
    '--text-secondary': '#6c757d',
    '--border-color': '#dee2e6',
    '--shadow-color': 'rgba(0, 0, 0, 0.1)',
    '--modal-bg': '#ffffff',
    '--input-bg': '#ffffff',
    '--input-text': '#2c3e50',
    '--card-bg': '#ffffff'
  },
  dark: {
    '--bg-primary': '#1a1a1a',
    '--bg-secondary': '#2d2d2d',
    '--text-color': '#ffffff',
    '--text-secondary': '#b3b3b3',
    '--border-color': '#404040',
    '--shadow-color': 'rgba(0, 0, 0, 0.3)',
    '--modal-bg': '#2d2d2d',
    '--input-bg': '#3d3d3d',
    '--input-text': '#ffffff',
    '--card-bg': '#2d2d2d'
  }
};

const ACCENT_COLORS = {
  blue: '#4a90e2',
  green: '#27ae60',
  purple: '#9b59b6',
  orange: '#e67e22',
  red: '#e74c3c'
};

// Category colors for charts
const CATEGORY_COLORS = {
  'Productive / Educational': '#96CEB4',
  'Entertainment': '#4ECDC4',
  'Social Media': '#FF6B6B',
  'News': '#45B7D1',
  'Games': '#FFD93D',
  'Shopping': '#DDA0DD',
  'Other': '#FFEEAD'
};

// Utility functions
function formatTime(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

// Theme functions
function applyTheme(theme, accentColor) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  
  const themeVars = THEMES[theme];
  Object.entries(themeVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  root.style.setProperty('--accent-color', ACCENT_COLORS[accentColor]);
  root.setAttribute('data-theme', theme);
}

function loadThemeSettings() {
  chrome.storage.local.get(['theme', 'accentColor'], (result) => {
    const theme = result.theme || 'light';
    const accentColor = result.accentColor || 'blue';
    applyTheme(theme, accentColor);
    updateThemeButtons(theme, accentColor);
  });
}

function updateThemeButtons(theme, accentColor) {
  // Update theme mode buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const themeBtn = document.getElementById(`${theme}ModeBtn`);
  if (themeBtn) themeBtn.classList.add('active');
  
  // Update color buttons
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const colorBtn = document.querySelector(`[data-color="${accentColor}"]`);
  if (colorBtn) colorBtn.classList.add('active');
}

// Data fetching functions
async function getTimeData(period = 'today') {
  return new Promise((resolve) => {
    chrome.storage.local.get('timeData', (result) => {
      const timeData = result.timeData || {};
      
      if (period === 'today') {
        const today = getTodayString();
        resolve(timeData[today] || { sites: {}, categories: {} });
      } else if (period === 'week') {
        const weekStart = getWeekStart();
        const weekData = { sites: {}, categories: {} };
        
        // Aggregate last 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayData = timeData[dateStr] || { sites: {}, categories: {} };
          
          // Aggregate sites
          Object.entries(dayData.sites || {}).forEach(([site, time]) => {
            weekData.sites[site] = (weekData.sites[site] || 0) + time;
          });
          
          // Aggregate categories
          Object.entries(dayData.categories || {}).forEach(([category, time]) => {
            weekData.categories[category] = (weekData.categories[category] || 0) + time;
          });
        }
        
        resolve(weekData);
      }
    });
  });
}

async function getGoals() {
  return new Promise((resolve) => {
    chrome.storage.local.get('goals', (result) => {
      resolve(result.goals || {
        productiveHours: 4,
        entertainmentHours: 2,
        socialMediaHours: 1,
        streak: 0
      });
    });
  });
}

// UI update functions
async function updateTotalTime() {
  const data = await getTimeData(currentPeriod);
  const totalMs = Object.values(data.sites).reduce((sum, time) => sum + time, 0);
  document.getElementById('totalTime').textContent = formatTime(totalMs);
}

async function updateCategoryChart() {
  const data = await getTimeData(currentPeriod);
  const categories = data.categories || {};
  
  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  if (categoryChart) {
    categoryChart.destroy();
  }
  
  const labels = Object.keys(categories);
  const values = Object.values(categories).map(ms => ms / (1000 * 60 * 60)); // Convert to hours
  const colors = labels.map(label => CATEGORY_COLORS[label] || CATEGORY_COLORS['Other']);
  
  if (labels.length === 0) {
    // Show empty state
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    return;
  }
  
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}

async function updateTopSites() {
  const data = await getTimeData(currentPeriod);
  const sites = data.sites || {};
  
  const topSites = Object.entries(sites)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const listElement = document.getElementById('topSitesList');
  listElement.innerHTML = '';
  
  if (topSites.length === 0) {
    listElement.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No data available</div>';
    return;
  }
  
  topSites.forEach(([site, time]) => {
    const item = document.createElement('div');
    item.className = 'site-item';
    item.innerHTML = `
      <div class="site-info">
        <img src="https://www.google.com/s2/favicons?sz=32&domain=${site}" 
             class="site-logo" 
             alt="${site}"
             onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\"><circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\" fill=\\"%23ccc\\"/></svg>'">
        <span class="site-name">${site}</span>
      </div>
      <span>${formatTime(time)}</span>
    `;
    listElement.appendChild(item);
  });
}

async function updateGoalsDisplay() {
  const data = await getTimeData('today');
  const goals = await getGoals();
  const categories = data.categories || {};
  
  const goalsContainer = document.querySelector('.goals-container');
  if (!goalsContainer) return;
  
  goalsContainer.innerHTML = '';
  
  // Calculate goal progress
  const goalCategories = [
    { key: 'productiveHours', name: 'Productive / Educational', category: 'Productive / Educational' },
    { key: 'entertainmentHours', name: 'Entertainment', category: 'Entertainment' },
    { key: 'socialMediaHours', name: 'Social Media', category: 'Social Media' }
  ];
  
  goalCategories.forEach(({ key, name, category }) => {
    const goalHours = goals[key] || 0;
    const actualMs = categories[category] || 0;
    const actualHours = actualMs / (1000 * 60 * 60);
    const percentage = goalHours > 0 ? Math.min((actualHours / goalHours) * 100, 100) : 0;
    
    const goalItem = document.createElement('div');
    goalItem.className = 'goal-item';
    goalItem.innerHTML = `
      <div class="goal-header">
        <span class="goal-name">${name}</span>
        <span class="goal-time">${formatTime(actualMs)} / ${goalHours}h</span>
      </div>
      <div class="goal-progress">
        <div class="progress-bar ${percentage >= 100 ? 'progress-complete' : percentage >= 75 ? 'progress-good' : ''}">
          <div style="width: ${percentage}%"></div>
        </div>
        <span class="goal-percentage">${Math.round(percentage)}%</span>
      </div>
    `;
    goalsContainer.appendChild(goalItem);
  });
  
  // Add streak info
  const streakInfo = document.createElement('div');
  streakInfo.className = 'streak';
  streakInfo.innerHTML = `🔥 Current Streak: ${goals.streak || 0} days`;
  goalsContainer.appendChild(streakInfo);
}

// Modal functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Settings functions
async function loadCategories() {
  return new Promise((resolve) => {
    chrome.storage.local.get('categories', (result) => {
      resolve(result.categories || {});
    });
  });
}

async function saveCategories(categories) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ categories }, resolve);
  });
}

async function populateCategoriesList() {
  const categories = await loadCategories();
  const listElement = document.getElementById('categoriesList');
  listElement.innerHTML = '';
  
  Object.entries(categories).forEach(([name, info]) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div class="category-header">
        <h4>${name}</h4>
        <button class="edit-category" onclick="editCategory('${name}')">Edit</button>
      </div>
      <div class="category-description">${info.description || ''}</div>
      <div class="category-examples">Examples: ${(info.examples || []).join(', ')}</div>
    `;
    listElement.appendChild(item);
  });
}

// Weekly chart function
async function updateWeeklyChart() {
  const weeklyData = await getTimeData('week');
  const categories = weeklyData.categories || {};
  
  const ctx = document.getElementById('weeklyChart');
  if (!ctx) return;
  
  if (weeklyChart) {
    weeklyChart.destroy();
  }
  
  // Prepare data for last 7 days
  const labels = [];
  const datasets = {};
  
  // Initialize datasets for each category
  Object.keys(CATEGORY_COLORS).forEach(category => {
    datasets[category] = {
      label: category,
      data: [],
      backgroundColor: CATEGORY_COLORS[category],
      borderColor: CATEGORY_COLORS[category],
      borderWidth: 2,
      fill: false
    };
  });
  
  // Get data for each day
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    
    // Get day data
    chrome.storage.local.get('timeData', (result) => {
      const timeData = result.timeData || {};
      const dayData = timeData[dateStr] || { categories: {} };
      
      Object.keys(datasets).forEach(category => {
        const timeMs = dayData.categories[category] || 0;
        const timeHours = timeMs / (1000 * 60 * 60);
        datasets[category].data.push(timeHours);
      });
    });
  }
  
  // Filter out empty datasets
  const activeDatasets = Object.values(datasets).filter(dataset => 
    dataset.data.some(value => value > 0)
  );
  
  weeklyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: activeDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          }
        }
      }
    }
  });
}

// Website blocking functions
async function loadBlockedSites() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getBlockedSites' }, (response) => {
      resolve(response?.blockedSites || []);
    });
  });
}

async function updateBlockedSitesList() {
  const blockedSites = await loadBlockedSites();
  const listElement = document.getElementById('blockedSitesList');
  
  if (!listElement) return;
  
  listElement.innerHTML = '';
  
  if (blockedSites.length === 0) {
    listElement.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 10px;">No blocked sites</div>';
    return;
  }
  
  blockedSites.forEach(site => {
    const item = document.createElement('div');
    item.className = 'blocked-site-item';
    const timeLeft = Math.max(0, site.expiresAt - Date.now());
    const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
    
    item.innerHTML = `
      <div class="blocked-site-info">
        <span class="blocked-site-name">${site.url}</span>
        <span class="blocked-site-time">${minutesLeft > 0 ? `${minutesLeft} min left` : 'Expired'}</span>
      </div>
      <button onclick="unblockSite('${site.url}')" class="unblock-btn">Unblock</button>
    `;
    listElement.appendChild(item);
  });
}

function blockSite() {
  const siteInput = document.getElementById('siteToBlock');
  const durationInput = document.getElementById('blockDuration');
  
  const site = siteInput.value.trim();
  const duration = parseInt(durationInput.value);
  
  if (!site || !duration || duration <= 0) {
    alert('Please enter a valid site and duration');
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'addBlock',
    url: site,
    duration: duration
  }, (response) => {
    if (response?.success) {
      siteInput.value = '';
      durationInput.value = '';
      updateBlockedSitesList();
    } else {
      alert('Failed to block site');
    }
  });
}

function unblockSite(url) {
  chrome.runtime.sendMessage({
    action: 'removeBlock',
    url: url
  }, (response) => {
    if (response?.success) {
      updateBlockedSitesList();
    } else {
      alert('Failed to unblock site');
    }
  });
}

// Session insights
async function updateSessionInsights() {
  const sessionInsights = document.getElementById('sessionInsights');
  if (!sessionInsights) return;
  
  // Get recent session data
  const data = await getTimeData('today');
  const sites = data.sites || {};
  
  sessionInsights.innerHTML = '';
  
  if (Object.keys(sites).length === 0) {
    sessionInsights.innerHTML = '<div class="no-sessions">No session data available for today</div>';
    return;
  }
  
  // Create session cards for top sites
  const topSites = Object.entries(sites)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  topSites.forEach(([site, time]) => {
    const sessionCard = document.createElement('div');
    sessionCard.className = 'session-card';
    
    const hours = time / (1000 * 60 * 60);
    const sessions = Math.ceil(hours * 2); // Estimate sessions
    const avgSession = time / sessions;
    
    sessionCard.innerHTML = `
      <div class="session-site">${site}</div>
      <div class="session-stat">
        <span>Total Time:</span>
        <span class="session-stat-value">${formatTime(time)}</span>
      </div>
      <div class="session-stat">
        <span>Sessions:</span>
        <span class="session-stat-value">${sessions}</span>
      </div>
      <div class="session-stat">
        <span>Avg Session:</span>
        <span class="session-stat-value">${formatTime(avgSession)}</span>
      </div>
    `;
    
    sessionInsights.appendChild(sessionCard);
  });
}

// Data export
function exportData() {
  chrome.storage.local.get(['timeData', 'goals', 'categories'], (result) => {
    const data = {
      timeData: result.timeData || {},
      goals: result.goals || {},
      categories: result.categories || {},
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `webtimetracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Collapsible sections
function initializeCollapsibleSections() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      const content = document.getElementById(target);
      const icon = this.querySelector('.toggle-icon');
      
      if (content.classList.contains('show')) {
        content.classList.remove('show');
        this.setAttribute('aria-expanded', 'false');
        icon.style.transform = 'rotate(0deg)';
      } else {
        content.classList.add('show');
        this.setAttribute('aria-expanded', 'true');
        icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// Weekly details
async function updateWeeklyDetails() {
  const weeklyData = await getTimeData('week');
  
  // Update categories
  const categoriesContainer = document.getElementById('weeklyCategories');
  if (categoriesContainer) {
    categoriesContainer.innerHTML = '';
    
    const categories = Object.entries(weeklyData.categories || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    categories.forEach(([category, time]) => {
      const percentage = Math.round((time / Object.values(weeklyData.categories).reduce((a, b) => a + b, 0)) * 100);
      
      const item = document.createElement('div');
      item.className = 'weekly-item';
      item.innerHTML = `
        <div class="weekly-item-info">
          <div class="weekly-item-icon" style="background: ${CATEGORY_COLORS[category] || '#ccc'}">📊</div>
          <div>
            <div class="weekly-item-name">${category}</div>
            <div class="weekly-item-time">${formatTime(time)}</div>
          </div>
        </div>
        <div class="weekly-item-percentage">${percentage}%</div>
      `;
      categoriesContainer.appendChild(item);
    });
  }
  
  // Update websites
  const websitesContainer = document.getElementById('weeklyWebsites');
  if (websitesContainer) {
    websitesContainer.innerHTML = '';
    
    const websites = Object.entries(weeklyData.sites || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    websites.forEach(([site, time]) => {
      const percentage = Math.round((time / Object.values(weeklyData.sites).reduce((a, b) => a + b, 0)) * 100);
      
      const item = document.createElement('div');
      item.className = 'weekly-item';
      item.innerHTML = `
        <div class="weekly-item-info">
          <div class="weekly-item-icon">
            <img src="https://www.google.com/s2/favicons?sz=24&domain=${site}" 
                 alt="${site}" 
                 style="width: 16px; height: 16px;"
                 onerror="this.style.display='none'">
          </div>
          <div>
            <div class="weekly-item-name">${site}</div>
            <div class="weekly-item-time">${formatTime(time)}</div>
          </div>
        </div>
        <div class="weekly-item-percentage">${percentage}%</div>
      `;
      websitesContainer.appendChild(item);
    });
  }
}

// Flag selector functionality
function initializeFlagSelector() {
  const selectedFlag = document.getElementById('selectedFlag');
  const flagDropdown = document.getElementById('flagDropdown');
  const flagOptions = document.querySelectorAll('.flag-option');
  
  if (!selectedFlag || !flagDropdown) return;
  
  selectedFlag.addEventListener('click', (e) => {
    e.stopPropagation();
    flagDropdown.classList.toggle('show');
  });
  
  flagOptions.forEach(option => {
    option.addEventListener('click', () => {
      const flagCode = option.getAttribute('data-flag');
      const flagImg = option.querySelector('img').src;
      const flagText = option.querySelector('span').textContent;
      
      document.getElementById('currentFlag').src = flagImg;
      document.getElementById('currentFlag').alt = flagText;
      
      flagDropdown.classList.remove('show');
      
      // Save language preference
      chrome.storage.local.set({ selectedLanguage: flagCode });
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    flagDropdown.classList.remove('show');
  });
  
  // Load saved language
  chrome.storage.local.get('selectedLanguage', (result) => {
    if (result.selectedLanguage) {
      const option = document.querySelector(`[data-flag="${result.selectedLanguage}"]`);
      if (option) {
        option.click();
      }
    }
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Load theme settings first
  loadThemeSettings();
  
  // Initialize flag selector
  initializeFlagSelector();
  
  // Set up period buttons
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentPeriod = 'today';
    document.querySelectorAll('.time-period button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('todayBtn').classList.add('active');
    updateAllData();
  });
  
  document.getElementById('weekBtn').addEventListener('click', () => {
    currentPeriod = 'week';
    document.querySelectorAll('.time-period button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('weekBtn').classList.add('active');
    updateAllData();
  });
  
  // Dashboard button
  document.getElementById('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('device-select.html') });
  });
  
  // Action buttons
  document.getElementById('goalsBtn').addEventListener('click', () => openModal('goalsModal'));
  document.getElementById('settingsBtn').addEventListener('click', () => openModal('settingsModal'));
  document.getElementById('moreBtn').addEventListener('click', () => openModal('moreModal'));
  
  // Close buttons
  document.getElementById('closeGoalsBtn').addEventListener('click', () => closeModal('goalsModal'));
  document.getElementById('closeSettingsBtn').addEventListener('click', () => closeModal('settingsModal'));
  document.getElementById('closeMoreBtn').addEventListener('click', () => closeModal('moreModal'));
  document.getElementById('closeEditGoalsBtn').addEventListener('click', () => closeModal('editGoalsModal'));
  
  // Edit goals button
  document.getElementById('editGoalsBtn').addEventListener('click', () => {
    closeModal('goalsModal');
    openModal('editGoalsModal');
    populateEditGoalsModal();
  });
  
  // Theme buttons
  document.getElementById('lightModeBtn').addEventListener('click', () => {
    applyTheme('light', getCurrentAccentColor());
    chrome.storage.local.set({ theme: 'light' });
    updateThemeButtons('light', getCurrentAccentColor());
  });
  
  document.getElementById('darkModeBtn').addEventListener('click', () => {
    applyTheme('dark', getCurrentAccentColor());
    chrome.storage.local.set({ theme: 'dark' });
    updateThemeButtons('dark', getCurrentAccentColor());
  });
  
  document.getElementById('systemModeBtn').addEventListener('click', () => {
    applyTheme('system', getCurrentAccentColor());
    chrome.storage.local.set({ theme: 'system' });
    updateThemeButtons('system', getCurrentAccentColor());
  });
  
  // Color buttons
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      applyTheme(getCurrentTheme(), color);
      chrome.storage.local.set({ accentColor: color });
      updateThemeButtons(getCurrentTheme(), color);
    });
  });
  
  // Save settings button
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    closeModal('settingsModal');
  });
  
  // Save goals button
  document.getElementById('saveGoalsBtn').addEventListener('click', () => {
    saveGoalsFromModal();
    closeModal('editGoalsModal');
  });
  
  // Export data button
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  
  // Block site functionality
  const addBlockBtn = document.getElementById('addBlockBtn');
  if (addBlockBtn) {
    addBlockBtn.addEventListener('click', blockSite);
  }
  
  // Initialize collapsible sections
  initializeCollapsibleSections();
  
  // Load initial data
  await updateAllData();
  
  // Set up periodic updates
  setInterval(updateAllData, 60000); // Update every minute
});

// Helper functions for theme management
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function getCurrentAccentColor() {
  const activeColorBtn = document.querySelector('.color-btn.active');
  return activeColorBtn ? activeColorBtn.getAttribute('data-color') : 'blue';
}

// Update all data
async function updateAllData() {
  await updateTotalTime();
  await updateCategoryChart();
  await updateTopSites();
  await updateGoalsDisplay();
  await updateSessionInsights();
  await updateWeeklyChart();
  await updateWeeklyDetails();
  await updateBlockedSitesList();
  await populateCategoriesList();
}

// Goals modal functions
async function populateEditGoalsModal() {
  const goals = await getGoals();
  const container = document.getElementById('categoryGoals');
  
  container.innerHTML = '';
  
  const goalCategories = [
    { key: 'productiveHours', name: 'Productive / Educational' },
    { key: 'entertainmentHours', name: 'Entertainment' },
    { key: 'socialMediaHours', name: 'Social Media' },
    { key: 'newsHours', name: 'News' },
    { key: 'gamesHours', name: 'Games' },
    { key: 'shoppingHours', name: 'Shopping' }
  ];
  
  goalCategories.forEach(({ key, name }) => {
    const item = document.createElement('div');
    item.className = 'category-goal-item';
    item.innerHTML = `
      <span class="category-goal-name">${name}</span>
      <div class="goal-input-wrapper">
        <input type="number" 
               class="category-goal-input" 
               value="${goals[key] || 0}" 
               min="0" 
               max="24" 
               step="0.5"
               data-goal="${key}">
        <span class="goal-unit">hours</span>
      </div>
    `;
    container.appendChild(item);
  });
}

function saveGoalsFromModal() {
  const inputs = document.querySelectorAll('.category-goal-input');
  const goals = {};
  
  inputs.forEach(input => {
    const goalKey = input.getAttribute('data-goal');
    const value = parseFloat(input.value) || 0;
    goals[goalKey] = value;
  });
  
  // Preserve existing streak
  chrome.storage.local.get('goals', (result) => {
    const existingGoals = result.goals || {};
    goals.streak = existingGoals.streak || 0;
    
    chrome.storage.local.set({ goals }, () => {
      updateGoalsDisplay();
    });
  });
}

// Make functions globally available
window.blockSite = blockSite;
window.unblockSite = unblockSite;
window.exportData = exportData;