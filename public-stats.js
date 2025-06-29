// public-stats.js
const SUPABASE_URL = 'https://tnjdqipuegeuzpfbrxmv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamRxaXB1ZWdldXpwZmJyeG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzY5MTYsImV4cCI6MjA1MDA1MjkxNn0.Wm0Zzh6Oy-Av7Vr7gfmJ5DGqxRPXJLY4Ow0eZCG0yKo';

async function supabaseRequest(path, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const params = new URLSearchParams(window.location.search);
const username = params.get('user') || 'guest';

const headingEl = document.getElementById('pageHeading');
headingEl.textContent = `📊 Your Weekly Public Summary`;

const summaryEl = document.getElementById('summaryText');
const badgeEl = document.getElementById('badge');
const copyBtn = document.getElementById('copyBtn');

// New elements for stats cards
const totalTimeDisplay = document.getElementById('totalTimeDisplay');
const productivityDisplay = document.getElementById('productivityDisplay');
const topWebsitesDisplay = document.getElementById('topWebsitesDisplay');

let chartInstance = null;
let dailyChartInstance = null;

function formatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function getBadge(productivePercent) {
  if (productivePercent >= 0.7) return '🏆 Productivity Master!';
  if (productivePercent >= 0.5) return '💪 Doing Great!';
  return '⏳ Keep Pushing!';
}

async function fetchWeeklyData() {
  const { timeData = {} } = await chrome.storage.local.get('timeData');
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const toStr = d => d.toISOString().split('T')[0];
  const start = toStr(weekAgo);
  const end = toStr(today);
  const rows = [];

  Object.entries(timeData).forEach(([date, data]) => {
    if (date >= start && date <= end) {
      rows.push({ date, categories: data.categories || {}, sites: data.sites || {} });
    }
  });
  return rows;
}

function aggregateCategories(rows) {
  const totals = {};
  let totalMs = 0;
  const siteTotals = {};
  rows.forEach(r => {
    Object.entries(r.categories).forEach(([cat, ms]) => {
      totals[cat] = (totals[cat] || 0) + ms;
      totalMs += ms;
    });
    Object.entries(r.sites).forEach(([site, ms]) => {
      siteTotals[site] = (siteTotals[site] || 0) + ms;
    });
  });
  return { totals, totalMs, siteTotals };
}

function getDailyData(rows) {
  const dailyData = {};
  const today = new Date();
  
  // Initialize all 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = 0;
  }
  
  // Fill with actual data
  rows.forEach(r => {
    const dayTotal = Object.values(r.categories).reduce((sum, ms) => sum + ms, 0);
    dailyData[r.date] = dayTotal;
  });
  
  return dailyData;
}

function renderChart(totals) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(totals),
      datasets: [{ 
        data: Object.values(totals).map(ms => ms/3600000), 
        backgroundColor: ['#9C27B0', '#FFD700', '#FF5722', '#4CAF50', '#2196F3', '#FF9800', '#607D8B']
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          labels: { 
            color: '#fff',
            font: {
              family: 'Inter',
              size: 12
            }
          } 
        } 
      } 
    }
  });
}

function renderDailyChart(dailyData) {
  const ctx = document.getElementById('dailyChart').getContext('2d');
  if (dailyChartInstance) dailyChartInstance.destroy();
  
  const dates = Object.keys(dailyData).sort();
  const dayNames = dates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });
  const hours = dates.map(date => dailyData[date] / 3600000);
  
  dailyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dayNames,
      datasets: [{
        label: 'Hours',
        data: hours,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
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
          ticks: {
            color: '#a0a0b8',
            font: {
              family: 'Inter',
              size: 11
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#a0a0b8',
            font: {
              family: 'Inter',
              size: 11
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

function updateStatCards(totalMs, productivePercent, siteTotals) {
  // Update total time
  totalTimeDisplay.textContent = formatMs(totalMs);
  
  // Update productivity percentage
  productivityDisplay.textContent = `${Math.round(productivePercent * 100)}%`;
  
  // Update top websites
  let topWebsites = 'N/A';
  if (Object.keys(siteTotals).length) {
    const sortedSites = Object.entries(siteTotals).sort(([,a],[,b])=>b-a);
    const first = sortedSites[0][0];
    const second = sortedSites[1] ? sortedSites[1][0] : null;
    topWebsites = second ? `${first}, ${second}` : first;
  }
  topWebsitesDisplay.textContent = topWebsites;
}

async function init() {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(()=>{
      copyBtn.textContent = '✅ Copied!';
      setTimeout(()=> copyBtn.textContent='🔗 Copy Public Link',2000);
    });
  });

  const shareBtn = document.getElementById('shareBtn');
  const shareOptions = document.getElementById('shareOptions');

  shareBtn.addEventListener('click', () => {
    // Use native share if available
    if (navigator.share) {
      navigator.share({
        title: `${username}'s Weekly Summary`,
        text: 'Check out my weekly productivity summary!',
        url: window.location.href
      });
      return;
    }
    // Toggle options menu
    shareOptions.style.display = shareOptions.style.display === 'none' ? 'flex' : 'none';
  });

  shareOptions.addEventListener('click', (e) => {
    if (!e.target.classList.contains('share-option')) return;
    const net = e.target.dataset.net;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${username}'s Weekly Summary`);
    let shareUrl = '';
    switch(net) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      case 'instagram':
        alert('Instagram does not support direct web sharing. Copy link instead.');
        return;
    }
    window.open(shareUrl, '_blank');
  });

  const rows = await fetchWeeklyData();
  if (rows.length === 0) {
    summaryEl.textContent = 'No data available.';
    totalTimeDisplay.textContent = '0h 0m';
    productivityDisplay.textContent = '0%';
    topWebsitesDisplay.textContent = 'N/A';
    return;
  }

  const { totals, totalMs, siteTotals } = aggregateCategories(rows);
  const dailyData = getDailyData(rows);
  
  renderChart(totals);
  renderDailyChart(dailyData);

  const productiveMs = totals['Productive'] || totals['Productive / Educational'] || 0;
  const productivePercent = productiveMs / totalMs;

  // Update stat cards
  updateStatCards(totalMs, productivePercent, siteTotals);

  // Breakdown times
  const entMs = totals['Entertainment'] || 0;
  const smMs = totals['Social Media'] || 0;
  const prodMs = productiveMs;

  // Top two websites
  let topWebsites = 'N/A';
  if (Object.keys(siteTotals).length) {
    const sortedSites = Object.entries(siteTotals).sort(([,a],[,b])=>b-a);
    const first = sortedSites[0][0];
    const second = sortedSites[1] ? sortedSites[1][0] : null;
    topWebsites = second ? `${first} and ${second}` : first;
  }

  summaryEl.textContent = `This week, you spent ${formatMs(totalMs)} online. You were ${Math.round(productivePercent*100)}% productive. You spent ${formatMs(entMs)} in Entertainment, ${formatMs(smMs)} in Social Media, and ${formatMs(prodMs)} in Productivity. Your top website(s) were ${topWebsites}.`;
  badgeEl.textContent = getBadge(productivePercent);
}

document.addEventListener('DOMContentLoaded', init);

async function supabaseRequestUrl(url) {
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

async function syncData(payload) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/device_usage`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        device: 'mobile',
        date: new Date().toISOString().slice(0,10),
        data: payload            // ← your array of {app,time,…}
      })
    }
  );
} 