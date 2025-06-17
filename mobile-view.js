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

    // Update apps list
    const mobileSitesList = document.getElementById('mobileSitesList');
    mobileSitesList.innerHTML = '';
    apps.forEach(app => {
      console.log('Adding app to list:', app);
      const div = document.createElement('div');
      div.className = 'site-item';
      div.innerHTML = `
        <div class="site-info">
          <img src="https://www.google.com/s2/favicons?sz=32&domain=${app.domain}" class="site-logo" alt="logo">
          <span class="site-name">${app.app}</span>
        </div>
        <span>${app.time}</span>
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
    document.getElementById(id).style.display = 'flex';
  }
  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  // Attach listeners for action buttons
  document.getElementById('goalsBtn').addEventListener('click', () => openModal('goalsModal'));
  document.getElementById('settingsBtn').addEventListener('click', () => openModal('settingsModal'));
  document.getElementById('moreBtn').addEventListener('click', () => openModal('moreModal'));

  // Close buttons
  document.getElementById('closeGoalsBtn').addEventListener('click', () => closeModal('goalsModal'));
  document.getElementById('closeSettingsBtn').addEventListener('click', () => closeModal('settingsModal'));
  document.getElementById('closeMoreBtn').addEventListener('click', () => closeModal('moreModal'));

  chrome.storage.local.get('timeData', console.log);
}); 