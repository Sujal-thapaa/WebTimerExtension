let categoryChart = null;
let currentTimeframe = 'today';
let currentView = 'category';
let refreshInterval;
let elements = {};
let weeklyChart = null;
let weeklyWebsiteChart = null;
let websiteColors = {}; // To store persistent colors for websites
let currentLang = 'en';

// Define fixed colors for categories
const CATEGORY_COLORS = {
  'Productive / Educational': '#9C27B0', // Purple
  'Entertainment': '#FFD700',            // Yellow
  'News': '#4CAF50',                     // Green
  'Social Media': '#FF5722',             // Deep Orange
  'Games': '#2196F3',                    // Blue
  'Shopping': '#FF9800',                 // Orange
  'Other / Uncategorized': '#8E44AD',    // Violet
  'Other': '#FF69B4'                     // Pink (fallback)
};

// --- ADD THIS HELPER FUNCTION NEAR THE TOP ---
function getGoalKey(category) {
  return category.toLowerCase().replace(/[^a-z0-9]/gi, '') + 'Hours';
}

// Helper function for website goals
function getWebsiteGoalKey(website) {
  const clean = cleanWebsiteDomain(website);
  return 'website_' + clean.replace(/[^a-z0-9]/gi, '') + 'Hours';
}

// Helper function to get the original domain name for a website goal
function getWebsiteGoalName(goalKey) {
  const websiteKey = goalKey.replace('website_', '').replace('Hours', '');
  // Since we're storing the cleaned domain in the key, we need to reconstruct it
  // For now, we'll use the key as-is, but in a future version we should store the original domain
  return websiteKey;
}

// Helper function to clean website domain
function cleanWebsiteDomain(website) {
  // Remove protocol and www if present
  let clean = website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Remove trailing slash
  clean = clean.replace(/\/$/, '');
  return clean;
}

// ---

// Helper function to get clean domain name without subdomain and TLD
function getCleanDomain(url) {
  return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].split('.')[0];
}

// Update every instance like:
//   const goalKey = `${category.toLowerCase().replace(/ /g, '')}Hours`;
// To:
//   const goalKey = getGoalKey(category);

// For example, in updateAllGoals, updateGoalsDisplay, loadGoalsEditor, saveGoals, saveSettings, etc.

// Example: In updateAllGoals
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
      const goalKey = getGoalKey(category);
      const goalHours = goals[goalKey];
      
      if (typeof goalHours === 'number' && goalHours > 0) {
        const timeSpent = data.categories[category] || 0;
        const goalMilliseconds = goalHours * 3600000;
        const progress = Math.min((timeSpent / goalMilliseconds) * 100, 100);
        
        console.log(`Displaying progress for ${category}:`, {
          timeSpent: timeSpent / 3600000, // hours
          goalHours,
          progress,
          goalKey
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

    // Process website goals
    Object.keys(goals).forEach(goalKey => {
      if (goalKey.startsWith('website_') && goalKey.endsWith('Hours')) {
        const website = getWebsiteGoalName(goalKey);
        const cleanDomain = cleanWebsiteDomain(website);
        const goalHours = goals[goalKey];
        
        if (typeof goalHours === 'number' && goalHours > 0) {
          const timeSpent = data.sites[cleanDomain] || 0;
          const goalMilliseconds = goalHours * 3600000;
          const progress = Math.min((timeSpent / goalMilliseconds) * 100, 100);
          
          console.log(`Displaying website goal progress for ${website}:`, {
            timeSpent: timeSpent / 3600000, // hours
            goalHours,
            progress,
            goalKey,
            cleanDomain
          });

          const goalDiv = document.createElement('div');
          goalDiv.className = 'goal-item website-goal-display';
          goalDiv.innerHTML = `
            <div class="goal-header">
              <span class="goal-name">🌐 ${website} ${progress >= 100 ? '🎉' : ''}</span>
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
      }
    });

    // Show message if no goals are set
    if (goalsContainer.children.length === 0) {
      goalsContainer.innerHTML = `
        <div class="no-goals-message">
          <p>No goals set yet. Click "Edit Goals" to set your daily targets!</p>
        </div>
      `;
    }

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

// ...rest of popup.js remains unchanged...
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeElements();
    await setupEventListeners();
    await loadData('today');
    await initializeTheme();
    await initializeCategories();
    await loadBrowserSettings();
    
    // Initialize chart if More modal is open
    const moreModal = document.getElementById('moreModal');
    if (moreModal && moreModal.style.display === 'block') {
      await updateWeeklyChart();
    }

    // notify full-page dashboard that popup DOM is ready
    document.dispatchEvent(new CustomEvent('popupReady'));
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
    dashboardBtn: document.getElementById('dashboardBtn'),
    
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
    saveBrowserSettingsBtn: document.getElementById('saveBrowserSettingsBtn'),
    resetBrowserSettingsBtn: document.getElementById('resetBrowserSettingsBtn'),
    
    // Blocking elements
    siteToBlock: document.getElementById('siteToBlock'),
    blockDuration: document.getElementById('blockDuration'),
    addBlockBtn: document.getElementById('addBlockBtn'),
    blockedSitesList: document.getElementById('blockedSitesList'),
    
    // Containers
    goalsContainer: document.querySelector('.goals-container'),
    streakInfo: document.querySelector('.streak-info'),
    categoryGoals: document.getElementById('categoryGoals'),
    categoriesList: document.getElementById('categoriesList'),
    
    // Website Goals Elements
    categoryGoalsBtn: document.getElementById('categoryGoalsBtn'),
    websiteGoalsBtn: document.getElementById('websiteGoalsBtn'),
    categoryGoalsSection: document.getElementById('categoryGoalsSection'),
    websiteGoalsSection: document.getElementById('websiteGoalsSection'),
    websiteGoalsList: document.getElementById('websiteGoalsList'),
    newWebsiteGoal: document.getElementById('newWebsiteGoal'),
    newWebsiteHours: document.getElementById('newWebsiteHours'),
    addWebsiteGoalBtn: document.getElementById('addWebsiteGoalBtn')
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
    await updateBlockedSitesList(); // Refresh blocked sites list
    await updateGoalsDisplay(); // Always update goals display for real-time progress
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
  updateQuickStats(data);
  
  // Always update goals for real-time progress, regardless of modal state
  updateAllGoals(data, goals);

  if (currentView === 'category') {
    updateCategoryChart(data);
    updateTopCategoriesList(data);
  } else {
    updateWebsiteChart(data);
    updateTopSites(data);
  }
}

function updateTotalTime(data) {
  const totalTime = Object.values(data.categories).reduce((a, b) => a + b, 0);
  const hours = Math.floor(totalTime / 3600000);
  const minutes = Math.floor((totalTime % 3600000) / 60000);
  const seconds = Math.floor((totalTime % 60000) / 1000);
  document.getElementById('totalTime').textContent = `${hours}h ${minutes}m ${seconds}s`;
}

function updateQuickStats(data) {
  // Calculate sites visited
  const sitesCount = Object.keys(data.sites || {}).length;
  const sitesElement = document.getElementById('sitesVisited');
  if (sitesElement) {
    sitesElement.textContent = sitesCount.toString();
  }

  // Calculate average session time
  const totalTime = Object.values(data.categories).reduce((a, b) => a + b, 0);
  const avgSession = sitesCount > 0 ? totalTime / sitesCount : 0;
  const avgElement = document.getElementById('avgSession');
  if (avgElement) {
    const avgMinutes = Math.floor(avgSession / 60000);
    avgElement.textContent = avgMinutes > 0 ? `${avgMinutes}m` : '<1m';
  }

  // Find top category
  const categories = data.categories || {};
  const topCategory = Object.entries(categories)
    .sort(([, a], [, b]) => b - a)[0];
  const topCategoryElement = document.getElementById('topCategory');
  if (topCategoryElement) {
    if (topCategory && topCategory[1] > 0) {
      // Shorten category names for display
      let categoryName = topCategory[0];
      if (categoryName === 'Productive / Educational') categoryName = 'Productive';
      else if (categoryName === 'Other / Uncategorized') categoryName = 'Other';
      else if (categoryName === 'Social Media') categoryName = 'Social';
      topCategoryElement.textContent = categoryName;
    } else {
      topCategoryElement.textContent = '--';
    }
  }

  // Calculate productivity percentage
  const productiveTime = (categories['Productive / Educational'] || 0) + 
                        (categories['News'] || 0);
  const productivity = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
  const productivityElement = document.getElementById('productivity');
  if (productivityElement) {
    productivityElement.textContent = `${productivity}%`;
  }
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
  const extensionId = chrome.runtime.id;
  if (domain === extensionId || domain === 'Dashboard') {
    return 'Dashboard';
  }
  // Capitalize first letter and remove TLD if simple
  return domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
}

function updateTopCategoriesList(data) {
  const sitesList = document.querySelector('.sites-list');
  const topSitesHeader = document.querySelector('.top-sites h2');

  if (!sitesList || !topSitesHeader) return;

  topSitesHeader.textContent = 'Time by Category';
  sitesList.innerHTML = '';

  const categories = data.categories || {};
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (sortedCategories.length === 0) {
    sitesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data yet for this period.</p>';
    return;
  }

  sortedCategories.forEach(([category, time]) => {
    const timeSpent = formatTime(time);
    const categoryColor = CATEGORY_COLORS[category] || '#CCCCCC';

    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.innerHTML = `
      <div class="site-info">
          <div class="category-color-dot" style="background-color: ${categoryColor};"></div>
          <span>${category}</span>
      </div>
      <div class="site-time">${timeSpent}</div>
    `;
    sitesList.appendChild(categoryItem);
  });
}

function updateTopSites(data) {
  const sitesList = document.querySelector('.sites-list');
  const topSitesHeader = document.querySelector('.top-sites h2');

  if (!sitesList || !topSitesHeader) return;

  if (translations[currentLang]?.topSites) {
    topSitesHeader.textContent = translations[currentLang].topSites;
  } else {
    topSitesHeader.textContent = 'Top Sites';
  }
  sitesList.innerHTML = '';

  const sites = data.sites || {};
  const sortedSites = Object.entries(sites)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

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
    sitesList.appendChild(siteItem);
  });
}

// Website blocking functions
async function addBlockedSite() {
  const siteInput = document.getElementById('siteToBlock');
  const durationInput = document.getElementById('blockDuration');
  
  const site = siteInput.value.trim();
  const duration = parseInt(durationInput.value);
  
  if (!site) {
    showToast('Please enter a website URL', 'error');
    return;
  }
  
  if (!duration || duration <= 0) {
    showToast('Please enter a valid duration in minutes', 'error');
    return;
  }
  
  // Clean up the URL (remove protocol, www, etc.)
  const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'addBlock',
      url: cleanSite,
      duration: duration
    });
    
    if (response.success) {
      showToast(`Blocked ${cleanSite} for ${duration} minutes`, 'success');
      siteInput.value = '';
      durationInput.value = '';
      await updateBlockedSitesList();
    } else {
      showToast('Failed to block site', 'error');
    }
  } catch (error) {
    console.error('Error blocking site:', error);
    showToast('Error blocking site', 'error');
  }
}

async function removeBlockedSite(url) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'removeBlock',
      url: url
    });
    
    if (response && response.success) {
      showToast('Site unblocked successfully');
      await updateBlockedSitesList();
    } else {
      showToast('Failed to unblock site', 'error');
    }
  } catch (error) {
    console.error('Error removing blocked site:', error);
    showToast('Error unblocking site', 'error');
  }
}

async function updateBlockedSitesList() {
  const blockedSitesList = document.getElementById('blockedSitesList');
  if (!blockedSitesList) return;

  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const now = Math.floor(Date.now());

  // Filter out expired sites
  const activeSites = blockedSites.filter(site => site.expiresAt > now);
  
  // Update storage if there are expired sites
  if (activeSites.length !== blockedSites.length) {
    await chrome.storage.local.set({ blockedSites: activeSites });
    await chrome.runtime.sendMessage({ action: 'setupBlockingRules' });
  }

  if (activeSites.length === 0) {
    blockedSitesList.innerHTML = '<div class="no-sites">no current site block</div>';
    return;
  }

  blockedSitesList.innerHTML = '';
  activeSites.forEach(site => {
    const timeLeft = Math.max(0, Math.floor((site.expiresAt - now) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const siteDiv = document.createElement('div');
    siteDiv.className = 'blocked-site-item';
    siteDiv.innerHTML = `
      <div class="site-info">
        <img src="${getWebsiteLogo(site.url)}" alt="${site.url} logo" class="site-logo">
        <span class="site-url">${getCleanWebsiteName(site.url)}</span>
      </div>
      <span class="time-left">${minutes}m ${seconds}s</span>
      <button class="remove-block" onclick="removeBlockedSite('${site.url}')" data-url="${site.url}">×</button>
    `;
    blockedSitesList.appendChild(siteDiv);
  });
}

// Make removeBlockedSite available globally
window.removeBlockedSite = removeBlockedSite;

function setupEventListeners() {
  console.log('Setting up event listeners');
  try {
    // New view switcher buttons
    const categoryViewBtn = document.getElementById('categoryViewBtn');
    const websiteViewBtn = document.getElementById('websiteViewBtn');

    if (categoryViewBtn && websiteViewBtn) {
      categoryViewBtn.addEventListener('click', () => {
        if (currentView !== 'category') {
          currentView = 'category';
          websiteViewBtn.classList.remove('active');
          categoryViewBtn.classList.add('active');
          loadData(currentTimeframe); // Reload data for the new view
        }
      });

      websiteViewBtn.addEventListener('click', () => {
        if (currentView !== 'website') {
          currentView = 'website';
          categoryViewBtn.classList.remove('active');
          websiteViewBtn.classList.add('active');
          loadData(currentTimeframe); // Reload data for the new view
        }
      });
    }

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

    // Website blocking
    if (elements.addBlockBtn) {
      elements.addBlockBtn.addEventListener('click', addBlockedSite);
    }

    // Allow Enter key to add block
    if (elements.siteToBlock) {
      elements.siteToBlock.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addBlockedSite();
        }
      });
    }

    if (elements.blockDuration) {
      elements.blockDuration.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addBlockedSite();
        }
      });
    }

    // More button and modal
    const moreBtn = document.getElementById('moreBtn');
    const moreModal = document.getElementById('moreModal');
    const closeMoreBtn = document.getElementById('closeMoreBtn');

    if (moreBtn) {
        moreBtn.addEventListener('click', async () => {
            if (moreModal) moreModal.style.display = 'block';
            await updateWeeklyChart();
            await updateWeeklyWebsiteChart();
        });
    }

    if (closeMoreBtn) {
        closeMoreBtn.addEventListener('click', () => {
            if (moreModal) moreModal.style.display = 'none';
        });
    }

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

    // Enhanced Browser Settings
    if (elements.saveBrowserSettingsBtn) {
      elements.saveBrowserSettingsBtn.addEventListener('click', saveBrowserSettings);
    }
    
    if (elements.resetBrowserSettingsBtn) {
      elements.resetBrowserSettingsBtn.addEventListener('click', resetBrowserSettings);
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

    // Initialize blocked sites list
    updateBlockedSitesList();
    setupAutoRefresh();

    // Dashboard button
    elements.dashboardBtn?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'device-select.html' });
    });

    // Website Goals Toggle
    if (elements.categoryGoalsBtn && elements.websiteGoalsBtn) {
      elements.categoryGoalsBtn.addEventListener('click', () => {
        elements.categoryGoalsBtn.classList.add('active');
        elements.websiteGoalsBtn.classList.remove('active');
        elements.categoryGoalsSection.style.display = 'block';
        elements.websiteGoalsSection.style.display = 'none';
      });

      elements.websiteGoalsBtn.addEventListener('click', () => {
        elements.websiteGoalsBtn.classList.add('active');
        elements.categoryGoalsBtn.classList.remove('active');
        elements.categoryGoalsSection.style.display = 'none';
        elements.websiteGoalsSection.style.display = 'block';
        loadWebsiteGoalsEditor();
      });
    }

    // Add Website Goal
    if (elements.addWebsiteGoalBtn) {
      elements.addWebsiteGoalBtn.addEventListener('click', addWebsiteGoal);
    }

    // Allow Enter key to add website goal
    if (elements.newWebsiteGoal) {
      elements.newWebsiteGoal.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addWebsiteGoal();
        }
      });
    }

    if (elements.newWebsiteHours) {
      elements.newWebsiteHours.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addWebsiteGoal();
        }
      });
    }

    // Save Website Goals button
    const saveWebsiteGoalsBtn = document.getElementById('saveWebsiteGoalsBtn');
    if (saveWebsiteGoalsBtn) {
      saveWebsiteGoalsBtn.addEventListener('click', saveWebsiteGoals);
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

    const { timeData, goals = {}, categories = {}, blockedSites = [] } = await chrome.storage.local.get(['timeData', 'goals', 'categories', 'blockedSites']);
    const today = getTodayString();
    const todayData = timeData[today] || { categories: {} };

    console.log('=== UPDATE GOALS DISPLAY DEBUG ===');
    console.log('Today:', today);
    console.log('Today\'s data:', todayData);
    console.log('All goals:', goals);
    console.log('Categories:', Object.keys(categories));

    // Store scroll position before updating content
    const modalContent = elements.goalsModal.querySelector('.modal-content');
    const scrollPosition = modalContent ? modalContent.scrollTop : 0;

    elements.goalsContainer.innerHTML = '';

    // Create a goal card for each category that has a goal set
    Object.keys(categories).forEach(category => {
      const goalKey = getGoalKey(category);
      const goalHours = goals[goalKey] || 0;
      
      if (goalHours > 0) {
        const timeSpent = todayData.categories[category] || 0;
        const goalMilliseconds = goalHours * 3600000;
        const progress = Math.min((timeSpent / goalMilliseconds) * 100, 100);
        
        console.log(`Displaying progress for ${category}:`, {
          timeSpent: timeSpent / 3600000, // hours
          goalHours,
          progress,
          goalKey
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

    // Process website goals
    console.log('=== PROCESSING WEBSITE GOALS ===');
    Object.keys(goals).forEach(goalKey => {
      if (goalKey.startsWith('website_') && goalKey.endsWith('Hours')) {
        const website = getWebsiteGoalName(goalKey);
        const cleanDomain = cleanWebsiteDomain(website);
        const goalHours = goals[goalKey];
        
        console.log(`Processing website goal: ${goalKey}`, {
          website,
          cleanDomain,
          goalHours,
          timeSpent: todayData.sites[cleanDomain] || 0
        });
        
        if (typeof goalHours === 'number' && goalHours > 0) {
          const timeSpent = todayData.sites[cleanDomain] || 0;
          const goalMilliseconds = goalHours * 3600000;
          const progress = Math.min((timeSpent / goalMilliseconds) * 100, 100);
          
          console.log(`Displaying website goal progress for ${website}:`, {
            timeSpent: timeSpent / 3600000, // hours
            goalHours,
            progress,
            goalKey,
            cleanDomain
          });

          const goalDiv = document.createElement('div');
          goalDiv.className = 'goal-item website-goal-display';
          goalDiv.innerHTML = `
            <div class="goal-header">
              <span class="goal-name">🌐 ${website} ${progress >= 100 ? '🎉' : ''}</span>
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
      }
    });

    // Show message if no goals are set
    if (elements.goalsContainer.children.length === 0) {
      elements.goalsContainer.innerHTML = `
        <div class="no-goals-message">
          <p>No goals set yet. Click "Edit Goals" to set your daily targets!</p>
        </div>
      `;
    }

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

    // Display blocked sites list
    displayBlockedSites(blockedSites);

    // Restore scroll position after content update
    if (modalContent) {
      requestAnimationFrame(() => {
        modalContent.scrollTop = scrollPosition;
      });
    }
  } catch (error) {
    console.error('Error updating goals display:', error);
  }
}

function displayBlockedSites(blockedSites) {
  const blockedSitesList = document.getElementById('blockedSitesList');
  if (!blockedSitesList) return;
  
  blockedSitesList.innerHTML = '';
  
  if (blockedSites && blockedSites.length > 0) {
    const now = Date.now();
    const activeSites = blockedSites.filter(site => site.expiresAt > now);
    
    if (activeSites.length > 0) {
      activeSites.forEach(site => {
        const remaining = site.expiresAt - now;
        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        const siteItem = document.createElement('div');
        siteItem.className = 'blocked-site-item';
        siteItem.innerHTML = `
          <div class="blocked-site-info">
            <img src="${getWebsiteLogo(site.url)}" alt="${site.url} logo" class="site-logo">
            <div class="blocked-site-details">
              <span class="blocked-site-name">${getCleanWebsiteName(site.url)}</span>
              <span class="blocked-site-time">${minutes}m ${seconds}s remaining</span>
            </div>
          </div>
          <button class="unblock-btn" onclick="removeBlockedSite('${site.url}')">Unblock</button>
        `;
        blockedSitesList.appendChild(siteItem);
      });
    } else {
      blockedSitesList.innerHTML = '<p class="no-blocked-sites">No sites currently blocked</p>';
    }
  } else {
    blockedSitesList.innerHTML = '<p class="no-blocked-sites">No sites currently blocked</p>';
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
      
      const goalKey = getGoalKey(category);
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
      const goalKey = getGoalKey(category); // Use the correct helper function

      // Only update if the value has changed
      if (currentGoals[goalKey] !== newValue) {
        hasChanges = true;
      }
      newGoals[goalKey] = newValue;
    });

    // Get all website goal inputs
    document.querySelectorAll('.website-goal-input').forEach(input => {
      const website = input.getAttribute('data-website');
      if (!website) return;

      const newValue = parseFloat(input.value) || 0;
      const goalKey = getWebsiteGoalKey(website);

      // Only update if the value has changed
      if (currentGoals[goalKey] !== newValue) {
        hasChanges = true;
      }
      newGoals[goalKey] = newValue;
    });

    // Remove website goals that are no longer in the list
    Object.keys(currentGoals).forEach(goalKey => {
      if (goalKey.startsWith('website_') && goalKey.endsWith('Hours')) {
        const website = goalKey.replace('website_', '').replace('Hours', '');
        const stillExists = document.querySelector(`[data-website="${website}"]`);
        if (!stillExists) {
          hasChanges = true;
          // Don't add to newGoals, effectively removing it
        }
      }
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
      await updateGoalsDisplay();
      
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

  .blocked-site-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 10px;
  }

  .blocked-site-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .blocked-site-details {
    display: flex;
    flex-direction: column;
  }

  .blocked-site-name {
    font-weight: 500;
    color: var(--text-color);
  }

  .blocked-site-time {
    font-size: 0.9em;
    color: var(--text-secondary);
  }

  .unblock-btn {
    background-color: var(--error-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.9em;
  }

  .unblock-btn:hover {
    opacity: 0.9;
  }

  .no-blocked-sites {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 20px;
  }

  .block-input {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
    align-items: center;
  }

  .block-input input {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9em;
  }

  .block-input button {
    background-color: var(--error-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    white-space: nowrap;
  }

  .block-input button:hover {
    opacity: 0.9;
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
        goals[getGoalKey(category)] = hours;
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

// Enhanced Browser Settings Functions
async function saveBrowserSettings() {
  try {
    const settings = {
      autoTrackWebsites: document.getElementById('autoTrackWebsites').checked,
      trackIncognito: document.getElementById('trackIncognito').checked,
      trackPageTitles: document.getElementById('trackPageTitles').checked,
      focusModeAlerts: document.getElementById('focusModeAlerts').checked,
      productivityScoring: document.getElementById('productivityScoring').checked,
      timeWarnings: document.getElementById('timeWarnings').checked,
      dailySummary: document.getElementById('dailySummary').checked,
      goalAchievements: document.getElementById('goalAchievements').checked,
      weeklyReports: document.getElementById('weeklyReports').checked,
      localDataOnly: document.getElementById('localDataOnly').checked,
      anonymousUsage: document.getElementById('anonymousUsage').checked,
      dataRetention: document.getElementById('dataRetention').checked
    };
    
    await chrome.storage.local.set({ browserSettings: settings });
    showToast('Browser settings saved successfully!', 'success');
    document.getElementById('settingsModal').style.display = 'none';
  } catch (error) {
    console.error('Error saving browser settings:', error);
    showToast('Error saving settings. Please try again.', 'error');
  }
}

async function resetBrowserSettings() {
  if (confirm('Are you sure you want to reset all browser settings to defaults?')) {
    try {
      // Set default values
      document.getElementById('autoTrackWebsites').checked = true;
      document.getElementById('trackIncognito').checked = false;
      document.getElementById('trackPageTitles').checked = true;
      document.getElementById('focusModeAlerts').checked = true;
      document.getElementById('productivityScoring').checked = true;
      document.getElementById('timeWarnings').checked = false;
      document.getElementById('dailySummary').checked = true;
      document.getElementById('goalAchievements').checked = false;
      document.getElementById('weeklyReports').checked = true;
      document.getElementById('localDataOnly').checked = true;
      document.getElementById('anonymousUsage').checked = false;
      document.getElementById('dataRetention').checked = true;
      
      // Save default settings
      await saveBrowserSettings();
      showToast('Browser settings reset to defaults!', 'success');
    } catch (error) {
      console.error('Error resetting browser settings:', error);
      showToast('Error resetting settings. Please try again.', 'error');
    }
  }
}

// Load saved browser settings
async function loadBrowserSettings() {
  try {
    const { browserSettings } = await chrome.storage.local.get('browserSettings');
    if (browserSettings) {
      Object.keys(browserSettings).forEach(key => {
        const element = document.getElementById(key);
        if (element) element.checked = browserSettings[key];
      });
    }
  } catch (error) {
    console.error('Error loading browser settings:', error);
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
    console.log('Retrieved timeData:', Object.keys(timeData));
    
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) {
      console.error('Weekly chart canvas not found');
      return;
    }

    // Destroy existing chart if it exists
    if (weeklyChart) {
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
      const dayName = getDayName(date);
      dates.push(dayName);
      
      const dayData = timeData[dateStr];
      console.log(`Data for ${dateStr} (${dayName}):`, dayData);
      
      if (dayData && dayData.categories) {
        const dayTotal = Object.values(dayData.categories).reduce((sum, time) => sum + time, 0);
        dailyTotals.push(dayTotal / 3600000); // Convert to hours

        // Collect category data
        Object.entries(dayData.categories).forEach(([category, time]) => {
          if (!categoryData[category]) {
            categoryData[category] = new Array(7).fill(0);
          }
          categoryData[category][6 - i] = time / 3600000; // Convert to hours
        });
      } else {
        dailyTotals.push(0);
      }
    }

    console.log('Prepared chart data:', {
      dates,
      dailyTotals,
      categoryData
    });

    // If no data, show sample data for demonstration
    if (Object.keys(categoryData).length === 0) {
      console.log('No real data found, showing sample data');
      // Add some sample data to show the chart works
      categoryData['Productive / Educational'] = [0.5, 1.2, 0.8, 2.1, 1.5, 0.3, 1.0];
      categoryData['Entertainment'] = [1.0, 0.5, 1.5, 0.8, 2.0, 3.5, 2.2];
      categoryData['Social Media'] = [0.3, 0.8, 0.5, 1.2, 1.0, 2.1, 1.5];
    }

    // Use fixed colors from CATEGORY_COLORS
    const datasets = Object.entries(categoryData).map(([category, data]) => ({
      label: category,
      data: data,
      backgroundColor: CATEGORY_COLORS[category] || '#8E44AD',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    }));

    console.log('Creating chart with datasets:', datasets);

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
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              display: false
            },
            ticks: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours',
              color: '#ffffff',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff',
              callback: function(value) {
                return value + 'h';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              boxWidth: 12,
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const hours = Math.floor(context.raw);
                const minutes = Math.round((context.raw - hours) * 60);
                return `${context.dataset.label}: ${hours}h ${minutes}m`;
              },
              footer: function(tooltipItems) {
                let total = 0;
                tooltipItems.forEach(item => total += item.raw);
                const totalHours = Math.floor(total);
                const totalMinutes = Math.round((total - totalHours) * 60);
                return `Total: ${totalHours}h ${totalMinutes}m`;
              }
            }
          }
        }
      }
    });

    console.log('Chart created successfully');

    // Update the weekly details
    const weekData = getWeekData(timeData);
    await updateWeeklyDetails(weekData);
  } catch (error) {
    console.error('Error updating weekly chart:', error);
  }
}

async function updateWeeklyWebsiteChart() {
    const { timeData = {} } = await chrome.storage.local.get('timeData');
    const weekData = getWeekData(timeData);
    
    const sites = weekData.sites || {};
    const sortedSites = Object.entries(sites)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7); // Top 7 sites

    const labels = sortedSites.map(([site]) => getCleanWebsiteName(site));
    const data = sortedSites.map(([, time]) => time / 3600000); // Convert ms to hours

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Hours Spent',
            data: data,
            backgroundColor: labels.map(label => websiteColors[label] || getRandomColor()),
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 4
        }]
    };
    
    const ctx = document.getElementById('weeklyWebsiteChart')?.getContext('2d');
    if (!ctx) return;
    
    if (weeklyWebsiteChart) {
        weeklyWebsiteChart.destroy();
    }
    
    weeklyWebsiteChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            indexAxis: 'y', // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top Websites This Week',
                    color: 'white',
                    font: { size: 16 }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { 
                        color: 'white',
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: 'white' },
                    grid: { display: false }
                }
            }
        }
    });
}

// Flag selector functionality
document.addEventListener('DOMContentLoaded', function() {
    const selectedFlag = document.getElementById('selectedFlag');
    const flagDropdown = document.getElementById('flagDropdown');

    // Toggle dropdown
    selectedFlag.addEventListener('click', function() {
        flagDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.flag-container')) {
            flagDropdown.classList.remove('show');
        }
    });
});

// Language translations
const translations = {
    en: {
        title: "WebTimeTracker",
        today: "Today",
        thisWeek: "This Week",
        totalTime: "Total Time",
        goalsAndLimits: "Goals & Limits",
        settings: "Settings",
        more: "More",
        topSites: "Top Sites",
        blockWebsite: "Block Website",
        example: "e.g., facebook.com",
        minutes: "Minutes",
        blockSite: "Block Site",
        currentlyBlocked: "Currently Blocked Sites",
        noBlockedSites: "no current site block",
        totalTimeBtn: "Total Time",
        productiveTimeBtn: "Productive",
        distractingTimeBtn: "Distracting",
        totalTimeToday: "Total Time Today",
        byCategory: "By Category",
        byWebsite: "By Website"
    },
    hi: {
        title: "वेबटाइमट्रैकर",
        today: "आज",
        thisWeek: "इस सप्ताह",
        totalTime: "कुल समय",
        goalsAndLimits: "लक्ष्य और सीमाएँ",
        settings: "सेटिंग्स",
        more: "अधिक",
        topSites: "शीर्ष साइटें",
        blockWebsite: "वेबसाइट ब्लॉक करें",
        example: "जैसे, facebook.com",
        minutes: "मिनट",
        blockSite: "साइट ब्लॉक करें",
        currentlyBlocked: "वर्तमान में ब्लॉक की गई साइटें",
        noBlockedSites: "कोई वर्तमान साइट ब्लॉक नहीं",
        totalTimeBtn: "कुल समय",
        productiveTimeBtn: "उत्पादक",
        distractingTimeBtn: "व्याकुल",
        totalTimeToday: "आज का कुल समय",
        byCategory: "श्रेणी अनुसार",
        byWebsite: "वेबसाइट अनुसार"
    },
    zh: {
        title: "网站时间跟踪器",
        today: "今天",
        thisWeek: "本周",
        totalTime: "总时间",
        goalsAndLimits: "目标与限制",
        settings: "设置",
        more: "更多",
        topSites: "常用网站",
        blockWebsite: "封锁网站",
        example: "例如，facebook.com",
        minutes: "分钟",
        blockSite: "封锁网站",
        currentlyBlocked: "当前封锁的网站",
        noBlockedSites: "暂无封锁网站",
        totalTimeBtn: "总时间",
        productiveTimeBtn: "高效",
        distractingTimeBtn: "分心",
        totalTimeToday: "今日总时间",
        byCategory: "按类别",
        byWebsite: "按网站"
    },
    ja: {
        title: "ウェブタイムトラッカー",
        today: "今日",
        thisWeek: "今週",
        totalTime: "合計時間",
        goalsAndLimits: "目標と制限",
        settings: "設定",
        more: "詳細",
        topSites: "人気サイト",
        blockWebsite: "ウェブサイトをブロック",
        example: "例: facebook.com",
        minutes: "分",
        blockSite: "サイトをブロック",
        currentlyBlocked: "ブロック中のサイト",
        noBlockedSites: "ブロック中のサイトはありません",
        totalTimeBtn: "合計時間",
        productiveTimeBtn: "生産的",
        distractingTimeBtn: "気晴らし",
        totalTimeToday: "今日の合計時間",
        byCategory: "カテゴリ別",
        byWebsite: "ウェブサイト別"
    },
    fr: {
        title: "Suivi du Temps Web",
        today: "Aujourd'hui",
        thisWeek: "Cette semaine",
        totalTime: "Temps total",
        goalsAndLimits: "Objectifs & limites",
        settings: "Paramètres",
        more: "Plus",
        topSites: "Sites principaux",
        blockWebsite: "Bloquer le site Web",
        example: "ex., facebook.com",
        minutes: "Minutes",
        blockSite: "Bloquer le site",
        currentlyBlocked: "Sites bloqués",
        noBlockedSites: "aucun site bloqué",
        totalTimeBtn: "Temps total",
        productiveTimeBtn: "Productif",
        distractingTimeBtn: "Distraction",
        totalTimeToday: "Temps total aujourd'hui",
        byCategory: "Par catégorie",
        byWebsite: "Par site"
    },
    es: {
        title: "Rastreador de Tiempo Web",
        today: "Hoy",
        thisWeek: "Esta Semana",
        totalTime: "Tiempo Total",
        goalsAndLimits: "Metas y Límites",
        settings: "Configuración",
        more: "Más",
        topSites: "Sitios Principales",
        blockWebsite: "Bloquear Sitio Web",
        example: "p.ej., facebook.com",
        minutes: "Minutos",
        blockSite: "Bloquear Sitio",
        currentlyBlocked: "Sitios Bloqueados",
        noBlockedSites: "no hay sitios bloqueados",
        totalTimeBtn: "Tiempo Total",
        productiveTimeBtn: "Productivo",
        distractingTimeBtn: "Distracción",
        totalTimeToday: "Tiempo total hoy",
        byCategory: "Por categoría",
        byWebsite: "Por sitio web"
    }
};

// Function to update text content based on selected language
function updateLanguage(langCode) {
    const langData = translations[langCode] || translations['en'];
    
    // Update all text content
    document.querySelector('h1').textContent = langData.title;
    document.getElementById('todayBtn').textContent = langData.today;
    document.getElementById('weekBtn').textContent = langData.thisWeek;
    
    // Update total time section
    const totalTimeSection = document.querySelector('.total-time h2');
    if (totalTimeSection) {
        totalTimeSection.textContent = langData.totalTime;
    }
    
    // Update action buttons
    const goalsBtn = document.getElementById('goalsBtn');
    if (goalsBtn) {
        goalsBtn.innerHTML = `<span class="button-icon">🎯</span>${langData.goalsAndLimits}`;
    }
    
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.innerHTML = `<span class="button-icon">⚙️</span>${langData.settings}`;
    }
    
    const moreBtn = document.getElementById('moreBtn');
    if (moreBtn) {
        moreBtn.innerHTML = `<span class="button-icon">📊</span>${langData.more}`;
    }
    
    // Update time period buttons
    document.getElementById('totalTimeBtn').textContent = langData.totalTimeBtn;
    document.getElementById('productiveTimeBtn').textContent = langData.productiveTimeBtn;
    document.getElementById('distractingTimeBtn').textContent = langData.distractingTimeBtn;
    
    // Update block website section
    const blockSection = document.querySelector('.block-site');
    if (blockSection) {
        blockSection.querySelector('h2').textContent = langData.blockWebsite;
        blockSection.querySelector('input').placeholder = langData.example;
        blockSection.querySelector('button').textContent = langData.blockSite;
    }
    
    // Update blocked sites section
    const blockedSites = document.querySelector('.blocked-sites-list');
    if (blockedSites) {
        const noSites = blockedSites.querySelector('.no-sites');
        if (noSites) {
            noSites.textContent = langData.noBlockedSites;
        }
    }

    // Update view switcher buttons
    const categoryViewBtn = document.getElementById('categoryViewBtn');
    const websiteViewBtn = document.getElementById('websiteViewBtn');
    if (categoryViewBtn) categoryViewBtn.textContent = langData.byCategory;
    if (websiteViewBtn) websiteViewBtn.textContent = langData.byWebsite;

    // Update total time header
    const totalTimeHeader = document.querySelector('.total-time-card h2');
    if (totalTimeHeader) totalTimeHeader.textContent = langData.totalTimeToday;

    // Update top sites header
    const topSitesHeader = document.querySelector('.top-sites h2');
    if (topSitesHeader) topSitesHeader.textContent = langData.topSites;

    currentLang = langCode;
}

// Update flag selection handler
document.querySelectorAll('.flag-option').forEach(option => {
    option.addEventListener('click', function() {
        const flagCode = this.getAttribute('data-flag');
        const flagImg = this.querySelector('img');
        const currentFlag = document.getElementById('currentFlag');
        currentFlag.src = flagImg.src;
        currentFlag.alt = this.querySelector('span').textContent;
        
        // Map flag codes to language codes
        const langMap = {
            'us': 'en',
            'in': 'hi',
            'cn': 'zh',
            'jp': 'ja',
            'de': 'de',
            'fr': 'fr',
            'es': 'es'
        };
        
        // Update language
        const langCode = langMap[flagCode] || 'en';
        updateLanguage(langCode);
        
        // Save selected language to storage
        chrome.storage.sync.set({ selectedLanguage: langCode });
        
        // Close dropdown
        document.getElementById('flagDropdown').classList.remove('show');
    });
});

// Load saved language preference
chrome.storage.sync.get(['selectedLanguage'], function(result) {
    if (result.selectedLanguage) {
        updateLanguage(result.selectedLanguage);
    }
});

// New function to render chart by website
function updateWebsiteChart(data) {
  const sites = data.sites || {};
  const sortedSites = Object.entries(sites).sort(([, a], [, b]) => b - a);
  
  // Take top 7 sites and group the rest into 'Other'
  const topSites = sortedSites.slice(0, 7);
  const otherSites = sortedSites.slice(7);
  const otherTime = otherSites.reduce((acc, [, time]) => acc + time, 0);

  const chartData = Object.fromEntries(topSites);
  if (otherTime > 0) {
    chartData['Other'] = otherTime;
  }

  const chartLabels = Object.keys(chartData).map(site => getCleanWebsiteName(site));
  const chartValues = Object.values(chartData);

  if (categoryChart) {
    categoryChart.destroy();
  }

  // Generate and store colors to prevent flickering
  const backgroundColors = Object.keys(chartData).map(site => {
    if (site === 'Other') {
      return '#8E44AD'; // Consistent color for 'Other'
    }
    if (websiteColors[site]) {
      return websiteColors[site]; // Use stored color
    }
    // Generate and store a new color if one doesn't exist
    const newColor = getRandomColor();
    websiteColors[site] = newColor;
    return newColor;
  });

  const ctx = document.getElementById('categoryChart').getContext('2d');
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartValues,
        backgroundColor: backgroundColors, // Use the persistent color array
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#ffffff',
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${formatTime(value)}`;
            }
          }
        }
      }
    }
  });
}

// Helper function to generate random colors for the website chart
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Debug function to help troubleshoot goal issues
async function debugGoals() {
  try {
    const { goals = {}, categories = {}, timeData = {} } = await chrome.storage.local.get(['goals', 'categories', 'timeData']);
    const today = getTodayString();
    const todayData = timeData[today] || { categories: {} };
    
    console.log('=== GOALS DEBUG ===');
    console.log('All goals:', goals);
    console.log('All categories:', Object.keys(categories));
    console.log('Today\'s data:', todayData);
    
    Object.keys(categories).forEach(category => {
      const goalKey = getGoalKey(category);
      const goalHours = goals[goalKey];
      const timeSpent = todayData.categories[category] || 0;
      
      console.log(`${category}:`, {
        goalKey,
        goalHours,
        timeSpent: timeSpent / 3600000, // hours
        hasGoal: goalHours > 0
      });
    });
  } catch (error) {
    console.error('Error in debugGoals:', error);
  }
}

// Call debug function when goals button is clicked
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeElements();
    await setupEventListeners();
    await loadData('today');
    await initializeTheme();
    await initializeCategories();
    await loadBrowserSettings();
    
    // Debug goals on startup
    await debugGoals();
    
    // Initialize chart if More modal is open
    const moreModal = document.getElementById('moreModal');
    if (moreModal && moreModal.style.display === 'block') {
      await updateWeeklyChart();
    }

    // notify full-page dashboard that popup DOM is ready
    document.dispatchEvent(new CustomEvent('popupReady'));
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
});

// Website Goals Toggle
if (elements.categoryGoalsBtn && elements.websiteGoalsBtn) {
  elements.categoryGoalsBtn.addEventListener('click', () => {
    elements.categoryGoalsBtn.classList.add('active');
    elements.websiteGoalsBtn.classList.remove('active');
    elements.categoryGoalsSection.style.display = 'block';
    elements.websiteGoalsSection.style.display = 'none';
  });

  elements.websiteGoalsBtn.addEventListener('click', () => {
    elements.websiteGoalsBtn.classList.add('active');
    elements.categoryGoalsBtn.classList.remove('active');
    elements.categoryGoalsSection.style.display = 'none';
    elements.websiteGoalsSection.style.display = 'block';
    loadWebsiteGoalsEditor();
  });
}

// Add Website Goal
if (elements.addWebsiteGoalBtn) {
  elements.addWebsiteGoalBtn.addEventListener('click', addWebsiteGoal);
}

// Allow Enter key to add website goal
if (elements.newWebsiteGoal) {
  elements.newWebsiteGoal.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addWebsiteGoal();
    }
  });
}

if (elements.newWebsiteHours) {
  elements.newWebsiteHours.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addWebsiteGoal();
    }
  });
}

// Website Goals Functions
async function loadWebsiteGoalsEditor() {
  try {
    const websiteGoalsList = document.getElementById('websiteGoalsList');
    if (!websiteGoalsList) {
      console.error('Website goals list container not found');
      return;
    }

    const { goals = {} } = await chrome.storage.local.get('goals');
    websiteGoalsList.innerHTML = '';

    // Find all website goals
    const websiteGoals = [];
    Object.keys(goals).forEach(goalKey => {
      if (goalKey.startsWith('website_') && goalKey.endsWith('Hours')) {
        const website = goalKey.replace('website_', '').replace('Hours', '');
        const hours = goals[goalKey];
        if (hours > 0) {
          websiteGoals.push({ website, hours });
        }
      }
    });

    // Display existing website goals
    websiteGoals.forEach(({ website, hours }) => {
      const goalItem = document.createElement('div');
      goalItem.className = 'website-goal-item';
      goalItem.innerHTML = `
        <div class="website-goal-info">
          <span class="website-goal-name">${website}</span>
          <input type="number" 
                 class="website-goal-input" 
                 data-website="${website}"
                 value="${hours}"
                 min="0" 
                 max="24" 
                 step="0.5">
          <span class="goal-unit">hours</span>
        </div>
        <button class="remove-website-goal" data-website="${website}">Remove</button>
      `;
      websiteGoalsList.appendChild(goalItem);
    });

    // Add event listeners for remove buttons
    websiteGoalsList.querySelectorAll('.remove-website-goal').forEach(btn => {
      btn.addEventListener('click', () => removeWebsiteGoal(btn.dataset.website));
    });

  } catch (error) {
    console.error('Error loading website goals editor:', error);
    showToast('Error loading website goals editor', 'error');
  }
}

async function addWebsiteGoal() {
  try {
    const websiteInput = document.getElementById('newWebsiteGoal');
    const hoursInput = document.getElementById('newWebsiteHours');
    
    if (!websiteInput || !hoursInput) {
      console.error('Website goal input elements not found');
      return;
    }

    const website = cleanWebsiteDomain(websiteInput.value.trim());
    const hours = parseFloat(hoursInput.value);

    // Validation
    if (!website) {
      showToast('Please enter a website name', 'warning');
      return;
    }

    if (isNaN(hours) || hours <= 0 || hours > 24) {
      showToast('Please enter a valid number of hours (0-24)', 'warning');
      return;
    }

    // Check if website goal already exists
    const { goals = {} } = await chrome.storage.local.get('goals');
    const goalKey = getWebsiteGoalKey(website);
    
    if (goals[goalKey] && goals[goalKey] > 0) {
      showToast('Website goal already exists', 'warning');
      return;
    }

    // Save the website goal to storage
    goals[goalKey] = hours;
    await chrome.storage.local.set({ goals });

    // Add the website goal to the list
    const websiteGoalsList = document.getElementById('websiteGoalsList');
    const goalItem = document.createElement('div');
    goalItem.className = 'website-goal-item';
    goalItem.innerHTML = `
      <div class="website-goal-info">
        <span class="website-goal-name">${website}</span>
        <input type="number" 
               class="website-goal-input" 
               data-website="${website}"
               value="${hours}"
               min="0" 
               max="24" 
               step="0.5">
        <span class="goal-unit">hours</span>
      </div>
      <button class="remove-website-goal" data-website="${website}">Remove</button>
    `;
    websiteGoalsList.appendChild(goalItem);

    // Add event listener for remove button
    const removeBtn = goalItem.querySelector('.remove-website-goal');
    removeBtn.addEventListener('click', () => removeWebsiteGoal(website));

    // Clear inputs
    websiteInput.value = '';
    hoursInput.value = '';

    showToast(`Added goal for ${website}`, 'success');

  } catch (error) {
    console.error('Error adding website goal:', error);
    showToast('Error adding website goal', 'error');
  }
}

async function removeWebsiteGoal(website) {
  try {
    // Remove from storage
    const { goals = {} } = await chrome.storage.local.get('goals');
    const goalKey = getWebsiteGoalKey(website);
    delete goals[goalKey];
    await chrome.storage.local.set({ goals });

    // Remove from DOM
    const websiteGoalsList = document.getElementById('websiteGoalsList');
    const goalItem = websiteGoalsList.querySelector(`[data-website="${website}"]`).closest('.website-goal-item');
    if (goalItem) {
      goalItem.remove();
    }

    showToast(`Removed goal for ${website}`, 'success');

  } catch (error) {
    console.error('Error removing website goal:', error);
    showToast('Error removing website goal', 'error');
  }
}

async function saveWebsiteGoals() {
  try {
    const { goals = {} } = await chrome.storage.local.get('goals');
    let hasChanges = false;

    // Get all website goal inputs and save them
    document.querySelectorAll('.website-goal-input').forEach(input => {
      const website = input.getAttribute('data-website');
      if (!website) return;

      const newValue = parseFloat(input.value) || 0;
      const goalKey = getWebsiteGoalKey(website);

      // Only update if the value has changed
      if (goals[goalKey] !== newValue) {
        hasChanges = true;
      }
      goals[goalKey] = newValue;
    });

    if (hasChanges) {
      await chrome.storage.local.set({ goals });
      showToast('Website goals saved successfully', 'success');
    } else {
      showToast('No changes to save', 'info');
    }

  } catch (error) {
    console.error('Error saving website goals:', error);
    showToast('Error saving website goals', 'error');
  }
}