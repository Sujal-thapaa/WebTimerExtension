import { fetchMobileData } from './utils/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Category colors
  const CATEGORY_COLORS = {
    'Social Media': '#FF6B6B',
    'Entertainment': '#4ECDC4',
    'Games': '#45B7D1',
    'Productive / Educational': '#96CEB4',
    'Development': '#FFD93D',
    'Other': '#FFEEAD'
  };

  // Function to format time in milliseconds to hours and minutes
  function formatTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // Function to parse time string (e.g., "1h 37m") to minutes
  function parseTimeToMinutes(timeStr) {
    const hours = parseInt(timeStr.match(/(\d+)h/)?.[1] || 0);
    const minutes = parseInt(timeStr.match(/(\d+)m/)?.[1] || 0);
    return hours * 60 + minutes;
  }

  // Function to calculate total time from app data
  function calculateTotalTime(apps) {
    return apps.reduce((total, app) => {
      return total + parseTimeToMinutes(app.time);
    }, 0);
  }

  // Function to update the UI with app data
  function updateUI(apps) {
    console.log('Updating UI with apps:', apps);
    
    // Update total time
    const totalMinutes = calculateTotalTime(apps);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalTimeStr = `${hours}h ${minutes}m`;
    console.log('Total time:', totalTimeStr);
    document.getElementById('totalTime').textContent = totalTimeStr;

    // Update apps list with modern styling
    const mobileSitesList = document.getElementById('mobileSitesList');
    mobileSitesList.innerHTML = '';
    apps.forEach(app => {
      console.log('Adding app to list:', app);
      const div = document.createElement('div');
      div.className = 'app-item';
      div.innerHTML = `
        <div class="app-info">
          <img src="https://www.google.com/s2/favicons?sz=32&domain=${app.domain}" class="app-logo" alt="logo">
          <span class="app-name">${app.app}</span>
        </div>
        <span class="app-time">${app.time}</span>
      `;
      mobileSitesList.appendChild(div);
    });

    // Update category chart
    updateCategoryChart(apps);
  }

  // Function to update category chart
  function updateCategoryChart(apps) {
    console.log('Updating category chart with apps:', apps);
    
    const categories = {
      'Social Media': 0,
      'Entertainment': 0,
      'Games': 0,
      'Productive / Educational': 0
    };

    // Categorize apps
    apps.forEach(app => {
      const category = app.category || (
        ['Instagram', 'LinkedIn'].includes(app.app) ? 'Social Media' :
        ['YouTube'].includes(app.app) ? 'Entertainment' :
        ['Clash of Clans', 'Clash Royale'].includes(app.app) ? 'Games' :
        'Productive / Educational'
      );
      categories[category] += parseTimeToMinutes(app.time);
    });

    console.log('Category totals:', categories);

    // Render chart
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories).map(m => m / 60), // Convert to hours
          backgroundColor: Object.keys(categories).map(cat => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'])
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#ffffff'
            }
          }
        }
      }
    });
  }

  // Load initial data
  const today = new Date().toISOString().split('T')[0];
  console.log('Loading data for date:', today);
  
  const mobileData = await fetchMobileData(today);
  console.log('Fetched mobile data:', mobileData);
  
  if (mobileData) {
    updateUI(mobileData);
  } else {
    console.log('No data found, using dummy data');
    // Fallback to dummy data if no data found
    const dummyData = [
      { 
        app: 'Instagram', 
        time: '1h 37m', 
        domain: 'instagram.com',
        category: 'Social Media'
      },
      { 
        app: 'YouTube', 
        time: '23m', 
        domain: 'youtube.com',
        category: 'Entertainment'
      },
      { 
        app: 'Clash of Clans', 
        time: '1h 08m', 
        domain: 'supercell.com',
        category: 'Games'
      },
      { 
        app: 'Clash Royale', 
        time: '44m', 
        domain: 'supercell.com',
        category: 'Games'
      },
      { 
        app: 'LinkedIn', 
        time: '7m', 
        domain: 'linkedin.com',
        category: 'Social Media'
      }
    ];
    updateUI(dummyData);
  }

  // Refresh data every minute
  setInterval(async () => {
    console.log('Refreshing data...');
    const newData = await fetchMobileData(today);
    console.log('Refreshed data:', newData);
    if (newData) {
      updateUI(newData);
    }
  }, 60000);

  // Modal helpers
  function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    
    // Add smooth transition
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
    
    // Initialize charts when More modal opens
    if (id === 'moreModal') {
      setTimeout(() => {
        initializeMoreModalCharts();
      }, 100);
    }
  }
  
  function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('show');
    
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }

  // Initialize charts in More modal
  function initializeMoreModalCharts() {
    // Clear any existing charts first
    const weeklyCanvas = document.getElementById('weeklyMobileChart');
    const appsCanvas = document.getElementById('weeklyMobileAppsChart');
    
    if (weeklyCanvas && weeklyCanvas.chart) {
      weeklyCanvas.chart.destroy();
    }
    if (appsCanvas && appsCanvas.chart) {
      appsCanvas.chart.destroy();
    }
    
    // Show loading and hide canvas initially
    document.getElementById('weeklyMobileLoading').style.display = 'block';
    document.getElementById('weeklyMobileAppsLoading').style.display = 'block';
    weeklyCanvas.style.display = 'none';
    appsCanvas.style.display = 'none';
    
    // Weekly Mobile Usage Chart (Bar Chart)
    const weeklyCtx = weeklyCanvas.getContext('2d');
    weeklyCanvas.chart = new Chart(weeklyCtx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Hours',
          data: [2.5, 3.2, 1.8, 4.1, 2.9, 3.7, 2.3],
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          }
        }
      }
    });

    // Hide loading and show chart
    document.getElementById('weeklyMobileLoading').style.display = 'none';
    weeklyCanvas.style.display = 'block';

    // Weekly Mobile Apps Chart (Doughnut)
    const appsCtx = appsCanvas.getContext('2d');
    appsCanvas.chart = new Chart(appsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Instagram', 'YouTube', 'Clash of Clans', 'Clash Royale', 'LinkedIn'],
        datasets: [{
          data: [8, 4, 6, 3, 1],
          backgroundColor: [
            '#FF6B6B',
            '#4ECDC4', 
            '#45B7D1',
            '#96CEB4',
            '#FFD93D'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff'
            }
          }
        }
      }
    });

    // Hide loading and show chart
    document.getElementById('weeklyMobileAppsLoading').style.display = 'none';
    appsCanvas.style.display = 'block';
  }

  // Voice Review functionality
  function playVoiceReview() {
    const text = document.getElementById('voiceSummaryText').textContent;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }

  // Export data functionality
  function exportMobileData() {
    const data = {
      totalTime: document.getElementById('totalTime').textContent,
      apps: Array.from(document.querySelectorAll('#mobileSitesList .app-item')).map(item => ({
        name: item.querySelector('.app-name').textContent,
        time: item.querySelector('.app-time').textContent
      })),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Settings functionality
  function saveMobileSettings() {
    const settings = {
      autoSyncMobile: document.getElementById('autoSyncMobile').checked,
      backgroundTracking: document.getElementById('backgroundTracking').checked,
      dailyReminders: document.getElementById('dailyReminders').checked,
      goalAlerts: document.getElementById('goalAlerts').checked,
      anonymousData: document.getElementById('anonymousData').checked,
      cloudBackup: document.getElementById('cloudBackup').checked
    };
    
    localStorage.setItem('mobileSettings', JSON.stringify(settings));
    alert('Mobile settings saved successfully!');
  }

  function resetMobileSettings() {
    if (confirm('Are you sure you want to reset all mobile settings to defaults?')) {
      document.getElementById('autoSyncMobile').checked = true;
      document.getElementById('backgroundTracking').checked = true;
      document.getElementById('dailyReminders').checked = true;
      document.getElementById('goalAlerts').checked = false;
      document.getElementById('anonymousData').checked = false;
      document.getElementById('cloudBackup').checked = true;
      alert('Mobile settings reset to defaults!');
    }
  }

  // Attach listeners for action buttons
  document.getElementById('goalsBtn').addEventListener('click', () => openModal('goalsModal'));
  document.getElementById('settingsBtn').addEventListener('click', () => openModal('settingsModal'));
  document.getElementById('moreBtn').addEventListener('click', () => openModal('moreModal'));

  // Close buttons
  document.getElementById('closeGoalsBtn').addEventListener('click', () => closeModal('goalsModal'));
  document.getElementById('closeSettingsBtn').addEventListener('click', () => closeModal('settingsModal'));
  document.getElementById('closeMoreBtn').addEventListener('click', () => closeModal('moreModal'));

  // More modal functionality
  document.getElementById('replayVoiceBtn').addEventListener('click', playVoiceReview);
  document.getElementById('exportMobileDataBtn').addEventListener('click', exportMobileData);

  // Settings functionality
  document.getElementById('saveMobileSettingsBtn').addEventListener('click', saveMobileSettings);
  document.getElementById('resetMobileSettingsBtn').addEventListener('click', resetMobileSettings);

  // Goals functionality
  document.getElementById('editMobileGoalsBtn').addEventListener('click', () => {
    alert('Goal editing feature coming soon!');
  });
  
  document.getElementById('resetMobileGoalsBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all mobile goals?')) {
      alert('Mobile goals reset successfully!');
    }
  });

  // Load saved settings
  const savedSettings = localStorage.getItem('mobileSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) element.checked = settings[key];
    });
  }

  chrome.storage.local.get('timeData', console.log);
}); 