let categoryChart = null;
let currentTimeframe = 'today';
let refreshInterval;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup initialized');
  try {
    await loadData('today');
    setupEventListeners();
    setupAutoRefresh();
    console.log('Initial data loaded');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

function setupAutoRefresh() {
  // Refresh data every second while popup is open
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
  updateProductivityGoal(data, goals);
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

function updateProductivityGoal(data, goals) {
  try {
    console.log('Updating productivity goal with data:', data);
    console.log('Goals:', goals);

    // Get productive time (convert from milliseconds to hours)
    const productiveTime = (data.categories['Productive / Educational'] || 0) / (1000 * 60 * 60);
    console.log('Productive time (hours):', productiveTime);

    // Get goal (default to 4 hours if not set)
    const goalHours = goals?.productiveHours || 4;
    console.log('Goal hours:', goalHours);

    // Calculate progress percentage (cap at 100%)
    const progress = Math.min((productiveTime / goalHours) * 100, 100);
    console.log('Progress percentage:', progress);

    // Update progress bar and percentage text
    const progressBar = document.getElementById('goalProgress');
    const percentageText = document.getElementById('goalPercentage');
    
    if (progressBar && percentageText) {
      progressBar.value = progress;
      percentageText.textContent = `${Math.round(progress)}%`;
      
      // Add color coding based on progress
      if (progress >= 100) {
        progressBar.className = 'progress-complete';
        percentageText.style.color = 'var(--success-color)';
      } else if (progress >= 50) {
        progressBar.className = 'progress-good';
        percentageText.style.color = 'var(--primary-color)';
      } else {
        progressBar.className = '';
        percentageText.style.color = 'var(--text-color)';
      }
    }

    // Update streak
    const streakCount = document.getElementById('streakCount');
    if (streakCount) {
      const streak = goals?.streak || 0;
      streakCount.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
      
      // Add visual indicator for streak
      if (streak > 0) {
        streakCount.style.color = 'var(--success-color)';
      } else {
        streakCount.style.color = 'var(--text-color)';
      }
    }

  } catch (error) {
    console.error('Error updating productivity goal:', error);
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
    document.getElementById('todayBtn').addEventListener('click', async (e) => {
      document.querySelector('.time-period .active').classList.remove('active');
      e.target.classList.add('active');
      await loadData('today');
    });

    document.getElementById('weekBtn').addEventListener('click', async (e) => {
      document.querySelector('.time-period .active').classList.remove('active');
      e.target.classList.add('active');
      await loadData('week');
    });

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'block';
      loadSettings();
    });

    // Close settings
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    // Save settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    console.log('Event listeners set up successfully');
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

async function loadSettings() {
  try {
    const { categories, goals } = await chrome.storage.local.get(['categories', 'goals']);
    
    // Update goals inputs
    document.getElementById('productiveGoal').value = goals?.productiveHours || 4;
    document.getElementById('entertainmentLimit').value = goals?.entertainmentHours || 2;

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
    const productiveHours = parseFloat(document.getElementById('productiveGoal').value);
    const entertainmentHours = parseFloat(document.getElementById('entertainmentLimit').value);

    // Validate inputs
    if (isNaN(productiveHours) || isNaN(entertainmentHours) ||
        productiveHours < 0 || productiveHours > 24 ||
        entertainmentHours < 0 || entertainmentHours > 24) {
      alert('Please enter valid hours between 0 and 24');
      return;
    }

    await chrome.storage.local.set({
      goals: {
        productiveHours,
        entertainmentHours,
        streak: (await chrome.storage.local.get('goals')).goals?.streak || 0
      }
    });

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