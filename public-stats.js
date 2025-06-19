// public-stats.js
const SUPABASE_URL = 'https://tnjdqipuegeuzpfbrxmv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamRxaXB1ZWdldXpwZmJyeG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMzY1MjQsImV4cCI6MjA2NTcxMjUyNH0.56IkmlyQvR86D7be0TlRYxwLtlkfhse4jyCZehY6I90';

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
headingEl.textContent = `📊 ${username}'s Weekly Public Summary`;

const summaryEl = document.getElementById('summaryText');
const badgeEl = document.getElementById('badge');
const copyBtn = document.getElementById('copyBtn');

let chartInstance = null;

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
  // determine top app/site
  let topApp = 'N/A';
  if (Object.keys(siteTotals).length) {
    topApp = Object.entries(siteTotals).sort(([,a],[,b])=>b-a)[0][0];
  }
  return { totals, totalMs, siteTotals };
}

function renderChart(totals) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(totals),
      datasets: [{ data: Object.values(totals).map(ms => ms/3600000), backgroundColor:['#9C27B0','#FFD700','#FF5722','#4CAF50','#2196F3'] }]
    },
    options:{ plugins:{ legend:{ labels:{ color:'#fff'} } } }
  });
}

async function init() {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(()=>{
      copyBtn.textContent = '✅ Copied!';
      setTimeout(()=> copyBtn.textContent='🔗 Copy Public Link',2000);
    });
  });

  const rows = await fetchWeeklyData();
  if (rows.length === 0) {
    summaryEl.textContent = 'No data available.';
    return;
  }

  const { totals, totalMs, siteTotals } = aggregateCategories(rows);
  renderChart(totals);

  const productiveMs = totals['Productive'] || totals['Productive / Educational'] || 0;
  const productivePercent = productiveMs / totalMs;

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