document.addEventListener('DOMContentLoaded', () => {
  // Dummy data for mobile
  const mobileData = {
    totalTime: '4h 59m',
    categories: {
      'Social Media': 97,
      'Entertainment': 23,
      'Games': 112,
      'Productive / Educational': 7
    },
    topApps: [
      { name: 'Instagram', time: '1h 37m', domain: 'instagram.com' },
      { name: 'YouTube', time: '23m', domain: 'youtube.com' },
      { name: 'Clash of Clans', time: '1h 08m', domain: 'supercell.com' },
      { name: 'Clash Royale', time: '44m', domain: 'supercell.com' },
      { name: 'LinkedIn', time: '7m', domain: 'linkedin.com' }
    ]
  };

  // Dummy data for laptop
  const laptopData = {
    totalTime: '6h 45m',
    categories: {
      'Productive / Educational': 180,
      'Entertainment': 75,
      'Social Media': 45,
      'Development': 120
    },
    topApps: [
      { name: 'Visual Studio Code', time: '2h 15m', domain: 'code.visualstudio.com' },
      { name: 'Chrome', time: '1h 45m', domain: 'google.com' },
      { name: 'Spotify', time: '45m', domain: 'spotify.com' },
      { name: 'Slack', time: '30m', domain: 'slack.com' },
      { name: 'Terminal', time: '25m', domain: 'terminal.app' }
    ]
  };

  // Category colors
  const CATEGORY_COLORS = {
    'Social Media': '#FF6B6B',
    'Entertainment': '#4ECDC4',
    'Games': '#45B7D1',
    'Productive / Educational': '#96CEB4',
    'Development': '#FFD93D',
    'Other': '#FFEEAD'
  };

  // Insert chart instance variables after CATEGORY_COLORS definition
  let categoryChartInstance = null;
  let deviceChartInstance = null;

  // Function to format time in milliseconds to hours and minutes
  function formatTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // Function to update browser data
  async function updateBrowserData() {
    try {
      const { timeData = {} } = await chrome.storage.local.get('timeData');
      const today = new Date().toISOString().split('T')[0];
      const todayData = timeData[today] || { sites: {}, categories: {} };

      // Calculate total time
      let totalTime = 0;
      Object.values(todayData.sites).forEach(time => totalTime += time);

      // Update browser time display
      const browserHours = totalTime / (1000 * 60 * 60);
      document.getElementById('browserTime').textContent = formatTime(totalTime);

      // Update total time (browser + dummy data)
      const browserMinutes = Math.floor(totalTime / (1000 * 60));
      const totalMinutesAll = browserMinutes + (4 * 60 + 59) + (6 * 60 + 45);
      const totalHoursAll = Math.floor(totalMinutesAll / 60);
      const remainingMinutesAll = totalMinutesAll % 60;
      const totalTimeFormatted = `${totalHoursAll}h ${remainingMinutesAll}m`;
      document.getElementById('totalTime').textContent = totalTimeFormatted;

      // Populate browser sites list
      const browserSitesList = document.getElementById('browserSitesList');
      browserSitesList.innerHTML = '';
      Object.entries(todayData.sites)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([site, time]) => {
          const div = document.createElement('div');
          div.className = 'site-item';
          div.innerHTML = `
            <div class="site-info">
              <img src="https://www.google.com/s2/favicons?sz=32&domain=${site}" class="site-logo" alt="logo">
              <span class="site-name">${site}</span>
            </div>
            <span>${formatTime(time)}</span>
          `;
          browserSitesList.appendChild(div);
        });

      // Update category chart
      updateCategoryChart(todayData.categories);

      // Update device usage chart with real browser hours
      renderDeviceChart(browserHours);
    } catch (error) {
      console.error('Error updating browser data:', error);
    }
  }

  // Function to update category chart
  function updateCategoryChart(browserCategories) {
    // Combine browser categories with dummy data
    const combinedCategories = {
      ...browserCategories,
      'Social Media': (browserCategories['Social Media'] || 0) + mobileData.categories['Social Media'] * 60000,
      'Entertainment': (browserCategories['Entertainment'] || 0) + mobileData.categories['Entertainment'] * 60000 + laptopData.categories['Entertainment'] * 60000,
      'Games': mobileData.categories['Games'] * 60000,
      'Productive / Educational': (browserCategories['Productive / Educational'] || 0) + mobileData.categories['Productive / Educational'] * 60000 + laptopData.categories['Productive / Educational'] * 60000,
      'Development': laptopData.categories['Development'] * 60000
    };

    // Destroy existing instance if any
    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    const ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(combinedCategories),
        datasets: [{
          data: Object.values(combinedCategories).map(m => m / (1000 * 60 * 60)),
          backgroundColor: Object.keys(combinedCategories).map(cat => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'])
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ffffff' }
          }
        }
      }
    });
  }

  // Function to render device usage chart
  function renderDeviceChart(browserHours = 0) {
    if (deviceChartInstance) {
      deviceChartInstance.destroy();
    }
    const ctx = document.getElementById('deviceChart').getContext('2d');
    deviceChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Browser', 'Mobile', 'Laptop'],
        datasets: [{
          data: [browserHours, 4.9833, 6.75], // Convert 4h59m to 4.9833h
          backgroundColor: ['#4a90e2', '#FF6B6B', '#45B7D1']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ffffff' }
          }
        }
      }
    });
  }

  // Populate mobile apps list
  const mobileSitesList = document.getElementById('mobileSitesList');
  mobileData.topApps.forEach(app => {
    const div = document.createElement('div');
    div.className = 'site-item';
    div.innerHTML = `
      <div class="site-info">
        <img src="https://www.google.com/s2/favicons?sz=32&domain=${app.domain}" class="site-logo" alt="logo">
        <span class="site-name">${app.name}</span>
      </div>
      <span>${app.time}</span>
    `;
    mobileSitesList.appendChild(div);
  });

  // Populate laptop apps list
  const laptopSitesList = document.getElementById('laptopSitesList');
  laptopData.topApps.forEach(app => {
    const div = document.createElement('div');
    div.className = 'site-item';
    div.innerHTML = `
      <div class="site-info">
        <img src="https://www.google.com/s2/favicons?sz=32&domain=${app.domain}" class="site-logo" alt="logo">
        <span class="site-name">${app.name}</span>
      </div>
      <span>${app.time}</span>
    `;
    laptopSitesList.appendChild(div);
  });

  // After defining laptopData constant, set totals in DOM once DOM ready
  document.getElementById('mobileTime').textContent = mobileData.totalTime;
  document.getElementById('laptopTime').textContent = laptopData.totalTime;

  // Initial update
  updateBrowserData();

  // Update browser data every minute
  setInterval(updateBrowserData, 60000);
}); 