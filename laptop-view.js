document.addEventListener('DOMContentLoaded', () => {
  // Dummy data for categories
  const dummyCategories = {
    'Productive / Educational': 107, // minutes (Chrome 105m + Slack 2m)
    'Entertainment': 7, // minutes (Spotify 7m)
    'Social Media': 0, // minutes
    'Development': 31 // minutes (VS Code 22m + Terminal 9m)
  };

  // Dummy data for top applications (ordered by usage time - highest to lowest)
  const laptopApps = [
    { name: 'Chrome', time: '1h 45m', domain: 'google.com' },
    { name: 'Visual Studio Code', time: '22m', domain: 'code.visualstudio.com' },
    { name: 'Terminal', time: '9m', domain: 'terminal.app' },
    { name: 'Spotify', time: '7m', domain: 'spotify.com' },
    { name: 'Slack', time: '2m', domain: 'slack.com' }
  ];

  // Category colors
  const CATEGORY_COLORS = {
    'Productive / Educational': '#96CEB4',
    'Entertainment': '#4ECDC4',
    'Social Media': '#FF6B6B',
    'Development': '#45B7D1',
    'Other': '#FFEEAD'
  };

  // Render category chart
  const ctx = document.getElementById('categoryChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(dummyCategories),
      datasets: [{
        data: Object.values(dummyCategories).map(m => m/60), // Convert minutes to hours
        backgroundColor: Object.keys(dummyCategories).map(cat => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'])
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#ffffff' // White text for dark mode
          }
        }
      }
    }
  });

  // Populate top apps list with modern styling
  const listEl = document.getElementById('laptopAppsList');
  laptopApps.forEach(app => {
    const div = document.createElement('div');
    div.className = 'app-item';
    div.innerHTML = `
      <div class="app-info">
        <img src="https://www.google.com/s2/favicons?sz=32&domain=${app.domain}" class="app-logo" alt="logo">
        <span class="app-name">${app.name}</span>
      </div>
      <span class="app-time">${app.time}</span>
    `;
    listEl.appendChild(div);
  });

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
    const weeklyCanvas = document.getElementById('weeklyLaptopChart');
    const appsCanvas = document.getElementById('weeklyLaptopAppsChart');
    
    if (weeklyCanvas && weeklyCanvas.chart) {
      weeklyCanvas.chart.destroy();
    }
    if (appsCanvas && appsCanvas.chart) {
      appsCanvas.chart.destroy();
    }
    
    // Show loading and hide canvas initially
    document.getElementById('weeklyLaptopLoading').style.display = 'block';
    document.getElementById('weeklyLaptopAppsLoading').style.display = 'block';
    weeklyCanvas.style.display = 'none';
    appsCanvas.style.display = 'none';
    
    // Weekly Laptop Usage Chart (Bar Chart)
    const weeklyCtx = weeklyCanvas.getContext('2d');
    weeklyCanvas.chart = new Chart(weeklyCtx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Hours',
          data: [4.5, 6.2, 3.8, 7.1, 5.9, 2.7, 1.3],
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
    document.getElementById('weeklyLaptopLoading').style.display = 'none';
    weeklyCanvas.style.display = 'block';

    // Weekly Laptop Apps Chart (Doughnut)
    const appsCtx = appsCanvas.getContext('2d');
    appsCanvas.chart = new Chart(appsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Chrome', 'VS Code', 'Terminal', 'Spotify', 'Slack'],
        datasets: [{
          data: [12, 8, 3, 2, 1],
          backgroundColor: [
            '#4285F4',
            '#007ACC', 
            '#000000',
            '#1DB954',
            '#4A154B'
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
    document.getElementById('weeklyLaptopAppsLoading').style.display = 'none';
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
  function exportLaptopData() {
    const data = {
      totalTime: '2h 25m',
      apps: laptopApps,
      categories: dummyCategories,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laptop-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Settings functionality
  function saveLaptopSettings() {
    const settings = {
      autoTrackApps: document.getElementById('autoTrackApps').checked,
      trackIdleTime: document.getElementById('trackIdleTime').checked,
      trackWindowTitles: document.getElementById('trackWindowTitles').checked,
      breakReminders: document.getElementById('breakReminders').checked,
      focusAlerts: document.getElementById('focusAlerts').checked,
      distractionWarnings: document.getElementById('distractionWarnings').checked,
      detailedLogging: document.getElementById('detailedLogging').checked,
      shareAnonymousData: document.getElementById('shareAnonymousData').checked,
      cloudSync: document.getElementById('cloudSync').checked
    };
    
    localStorage.setItem('laptopSettings', JSON.stringify(settings));
    alert('Laptop settings saved successfully!');
  }

  function resetLaptopSettings() {
    if (confirm('Are you sure you want to reset all laptop settings to defaults?')) {
      document.getElementById('autoTrackApps').checked = true;
      document.getElementById('trackIdleTime').checked = false;
      document.getElementById('trackWindowTitles').checked = true;
      document.getElementById('breakReminders').checked = true;
      document.getElementById('focusAlerts').checked = false;
      document.getElementById('distractionWarnings').checked = true;
      document.getElementById('detailedLogging').checked = true;
      document.getElementById('shareAnonymousData').checked = false;
      document.getElementById('cloudSync').checked = true;
      alert('Laptop settings reset to defaults!');
    }
  }

  // Focus session functionality
  function startFocusSession() {
    alert('Focus session started! You will be notified of distractions.');
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
  document.getElementById('exportLaptopDataBtn').addEventListener('click', exportLaptopData);

  // Settings functionality
  document.getElementById('saveLaptopSettingsBtn').addEventListener('click', saveLaptopSettings);
  document.getElementById('resetLaptopSettingsBtn').addEventListener('click', resetLaptopSettings);

  // Goals functionality
  document.getElementById('editLaptopGoalsBtn').addEventListener('click', () => {
    alert('Goal editing feature coming soon!');
  });
  
  document.getElementById('addFocusSessionBtn').addEventListener('click', startFocusSession);

  // Load saved settings
  const savedSettings = localStorage.getItem('laptopSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) element.checked = settings[key];
    });
  }
}); 