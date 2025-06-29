import { fetchMobileData } from './utils/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  // Dummy data for laptop
  const laptopData = {
    totalTime: '2h 25m',
    categories: {
      'Productive / Educational': 107,
      'Entertainment': 7,
      'Social Media': 0,
      'Development': 31
    },
    topApps: [
      { name: 'Chrome', time: '1h 45m', domain: 'google.com' },
      { name: 'Visual Studio Code', time: '22m', domain: 'code.visualstudio.com' },
      { name: 'Terminal', time: '9m', domain: 'terminal.app' },
      { name: 'Spotify', time: '7m', domain: 'spotify.com' },
      { name: 'Slack', time: '2m', domain: 'slack.com' }
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

  // Global variable to store mobile data
  let mobileData = {
    totalTime: '0h 0m',
    categories: {},
    topApps: []
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

  // Function to fetch and update mobile data
  async function updateMobileData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching mobile data for:', today);
      
      const apps = await fetchMobileData(today);
      console.log('Fetched mobile apps:', apps);
      
      if (apps && apps.length > 0) {
        // Calculate total time
        const totalMinutes = calculateTotalTime(apps);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalTimeStr = `${hours}h ${minutes}m`;

        // Calculate categories
        const categories = {
          'Social Media': 0,
          'Entertainment': 0,
          'Games': 0,
          'Productive / Educational': 0
        };

        apps.forEach(app => {
          const category = app.category || (
            ['Instagram', 'LinkedIn'].includes(app.app) ? 'Social Media' :
            ['YouTube'].includes(app.app) ? 'Entertainment' :
            ['Clash of Clans', 'Clash Royale'].includes(app.app) ? 'Games' :
            'Productive / Educational'
          );
          categories[category] += parseTimeToMinutes(app.time);
        });

        // Update global mobile data
        mobileData = {
          totalTime: totalTimeStr,
          categories: categories,
          topApps: apps.map(app => ({
            name: app.app,
            time: app.time,
            domain: app.domain || 'app.com'
          }))
        };

        // Update mobile time display
        document.getElementById('mobileTime').textContent = totalTimeStr;

        // Update mobile apps list
        updateMobileAppsList();
      } else {
        console.log('No mobile data found, using fallback');
        // Fallback to dummy data if no data found
        mobileData = {
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
        document.getElementById('mobileTime').textContent = mobileData.totalTime;
        updateMobileAppsList();
      }
    } catch (error) {
      console.error('Error fetching mobile data:', error);
      // Use fallback data on error
      mobileData = {
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
      document.getElementById('mobileTime').textContent = mobileData.totalTime;
      updateMobileAppsList();
    }
  }

  // Function to update mobile apps list in the UI
  function updateMobileAppsList() {
    const mobileSitesList = document.getElementById('mobileSitesList');
    mobileSitesList.innerHTML = '';
    mobileData.topApps.forEach(app => {
      const div = document.createElement('div');
      div.className = 'site-item';
      div.innerHTML = `
        <div class="site-info">
          <img src="https://www.google.com/s2/favicons?sz=32&domain=${app.domain}" class="site-logo" alt="logo">
          <span class="site-name">${app.name}</span>
        </div>
        <span class="site-time">${app.time}</span>
      `;
      mobileSitesList.appendChild(div);
    });
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

      // Update total time (browser + mobile + laptop)
      const browserMinutes = Math.floor(totalTime / (1000 * 60));
      const mobileMinutes = parseTimeToMinutes(mobileData.totalTime);
      const laptopMinutes = parseTimeToMinutes(laptopData.totalTime);
      const totalMinutesAll = browserMinutes + mobileMinutes + laptopMinutes;
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
            <span class="site-time">${formatTime(time)}</span>
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
    // Combine browser categories with real mobile data and laptop data
    const combinedCategories = {
      ...browserCategories,
      'Social Media': (browserCategories['Social Media'] || 0) + (mobileData.categories['Social Media'] || 0) * 60000,
      'Entertainment': (browserCategories['Entertainment'] || 0) + (mobileData.categories['Entertainment'] || 0) * 60000 + laptopData.categories['Entertainment'] * 60000,
      'Games': (mobileData.categories['Games'] || 0) * 60000,
      'Productive / Educational': (browserCategories['Productive / Educational'] || 0) + (mobileData.categories['Productive / Educational'] || 0) * 60000 + laptopData.categories['Productive / Educational'] * 60000,
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
    const mobileHours = parseTimeToMinutes(mobileData.totalTime) / 60;
    const laptopHours = parseTimeToMinutes(laptopData.totalTime) / 60;
    
    deviceChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Browser', 'Mobile', 'Laptop'],
        datasets: [{
          data: [browserHours, mobileHours, laptopHours],
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
      <span class="site-time">${app.time}</span>
    `;
    laptopSitesList.appendChild(div);
  });

  // Set laptop time in DOM
  document.getElementById('laptopTime').textContent = laptopData.totalTime;

  // Initial data load
  async function initializeData() {
    await updateMobileData();
    await updateBrowserData();
  }

  // Initialize data
  initializeData();

  // Update data every minute
  setInterval(async () => {
    await updateMobileData();
    await updateBrowserData();
  }, 60000);
}); 