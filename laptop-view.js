document.addEventListener('DOMContentLoaded', () => {
  // Dummy data for categories
  const dummyCategories = {
    'Productive / Educational': 180, // minutes
    'Entertainment': 75,
    'Social Media': 45,
    'Development': 120
  };

  // Dummy data for top applications
  const laptopApps = [
    { name: 'Visual Studio Code', time: '2h 15m', domain: 'code.visualstudio.com' },
    { name: 'Chrome', time: '1h 45m', domain: 'google.com' },
    { name: 'Spotify', time: '45m', domain: 'spotify.com' },
    { name: 'Slack', time: '30m', domain: 'slack.com' },
    { name: 'Terminal', time: '25m', domain: 'terminal.app' }
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

  // Populate top apps list
  const listEl = document.getElementById('laptopAppsList');
  laptopApps.forEach(app => {
    const div = document.createElement('div');
    div.className = 'site-item';
    div.innerHTML = `
      <div class="site-info">
        <img src="https://www.google.com/s2/favicons?sz=32&domain=${app.domain}" class="site-logo" alt="logo">
        <span class="site-name">${app.name}</span>
      </div>
      <span>${app.time}</span>
    `;
    listEl.appendChild(div);
  });
}); 