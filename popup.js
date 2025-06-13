// Enhanced WebTimeTracker Popup Script
class WebTimeTracker {
  constructor() {
    this.currentPeriod = 'today';
    this.charts = {};
    this.init();
  }

  async init() {
    try {
      await this.loadTheme();
      this.setupEventListeners();
      await this.loadData();
      this.setupCharts();
    } catch (error) {
      console.error('Failed to initialize WebTimeTracker:', error);
      this.showError('Failed to load extension data');
    }
  }

  setupEventListeners() {
    try {
      // Period buttons
      const todayBtn = document.getElementById('todayBtn');
      const weekBtn = document.getElementById('weekBtn');
      
      if (todayBtn) todayBtn.addEventListener('click', () => this.switchPeriod('today'));
      if (weekBtn) weekBtn.addEventListener('click', () => this.switchPeriod('week'));

      // Modal buttons
      const goalsBtn = document.getElementById('goalsBtn');
      const settingsBtn = document.getElementById('settingsBtn');
      const moreBtn = document.getElementById('moreBtn');
      
      if (goalsBtn) goalsBtn.addEventListener('click', () => this.openModal('goalsModal'));
      if (settingsBtn) settingsBtn.addEventListener('click', () => this.openModal('settingsModal'));
      if (moreBtn) moreBtn.addEventListener('click', () => this.openModal('moreModal'));

      // Close buttons
      const closeGoalsBtn = document.getElementById('closeGoalsBtn');
      const closeSettingsBtn = document.getElementById('closeSettingsBtn');
      const closeMoreBtn = document.getElementById('closeMoreBtn');
      const closeEditGoalsBtn = document.getElementById('closeEditGoalsBtn');
      
      if (closeGoalsBtn) closeGoalsBtn.addEventListener('click', () => this.closeModal('goalsModal'));
      if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.closeModal('settingsModal'));
      if (closeMoreBtn) closeMoreBtn.addEventListener('click', () => this.closeModal('moreModal'));
      if (closeEditGoalsBtn) closeEditGoalsBtn.addEventListener('click', () => this.closeModal('editGoalsModal'));

      // Settings buttons
      const editGoalsBtn = document.getElementById('editGoalsBtn');
      const saveGoalsBtn = document.getElementById('saveGoalsBtn');
      const saveSettingsBtn = document.getElementById('saveSettingsBtn');
      
      if (editGoalsBtn) editGoalsBtn.addEventListener('click', () => this.openEditGoals());
      if (saveGoalsBtn) saveGoalsBtn.addEventListener('click', () => this.saveGoals());
      if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveSettings());

      // Theme buttons
      const lightModeBtn = document.getElementById('lightModeBtn');
      const darkModeBtn = document.getElementById('darkModeBtn');
      const systemModeBtn = document.getElementById('systemModeBtn');
      
      if (lightModeBtn) lightModeBtn.addEventListener('click', () => this.setTheme('light'));
      if (darkModeBtn) darkModeBtn.addEventListener('click', () => this.setTheme('dark'));
      if (systemModeBtn) systemModeBtn.addEventListener('click', () => this.setTheme('system'));

      // Color palette
      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => this.setAccentColor(btn.dataset.color));
      });

      // Blocking functionality
      const addBlockBtn = document.getElementById('addBlockBtn');
      const siteToBlock = document.getElementById('siteToBlock');
      
      if (addBlockBtn) addBlockBtn.addEventListener('click', () => this.addBlock());
      if (siteToBlock) {
        siteToBlock.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.addBlock();
        });
      }

      // Export data
      const exportDataBtn = document.getElementById('exportDataBtn');
      if (exportDataBtn) exportDataBtn.addEventListener('click', () => this.exportData());

      // Collapsible sections
      document.querySelectorAll('.section-header[data-target]').forEach(header => {
        header.addEventListener('click', () => this.toggleCollapse(header));
      });

      // Modal backdrop clicks
      document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal.id);
          }
        });
      });
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  async switchPeriod(period) {
    try {
      this.currentPeriod = period;
      
      // Update button states
      document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(period === 'today' ? 'todayBtn' : 'weekBtn');
      if (activeBtn) activeBtn.classList.add('active');
      
      await this.loadData();
      this.updateCharts();
    } catch (error) {
      console.error('Error switching period:', error);
    }
  }

  async loadData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { timeData = {} } = await chrome.storage.local.get('timeData');
      
      if (this.currentPeriod === 'today') {
        this.currentData = timeData[today] || { sites: {}, categories: {} };
      } else {
        // Calculate week data
        this.currentData = this.calculateWeekData(timeData);
      }
      
      this.updateUI();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.currentData = { sites: {}, categories: {} };
      this.updateUI();
    }
  }

  calculateWeekData(timeData) {
    const weekData = { sites: {}, categories: {} };
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = timeData[dateStr];
      if (dayData) {
        // Aggregate sites
        Object.entries(dayData.sites || {}).forEach(([site, time]) => {
          weekData.sites[site] = (weekData.sites[site] || 0) + time;
        });
        
        // Aggregate categories
        Object.entries(dayData.categories || {}).forEach(([category, time]) => {
          weekData.categories[category] = (weekData.categories[category] || 0) + time;
        });
      }
    }
    
    return weekData;
  }

  updateUI() {
    try {
      this.updateStats();
      this.updateTopSites();
      this.updateBlockedSites();
    } catch (error) {
      console.error('Error updating UI:', error);
    }
  }

  updateStats() {
    try {
      const totalTime = Object.values(this.currentData.categories || {}).reduce((sum, time) => sum + time, 0);
      const totalTimeElement = document.getElementById('totalTime');
      if (totalTimeElement) {
        totalTimeElement.textContent = this.formatTime(totalTime);
      }
      
      // Update goal progress
      this.updateGoalProgress();
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  async updateGoalProgress() {
    try {
      const { goals = {} } = await chrome.storage.local.get('goals');
      const goalProgressElement = document.getElementById('goalProgress');
      
      if (goalProgressElement) {
        let completedGoals = 0;
        let totalGoals = 0;
        
        Object.entries(goals).forEach(([key, value]) => {
          if (key.endsWith('Hours') && value > 0) {
            totalGoals++;
            const category = this.getGoalCategory(key);
            const timeSpent = this.currentData.categories[category] || 0;
            if (timeSpent >= value * 3600000) {
              completedGoals++;
            }
          }
        });
        
        goalProgressElement.textContent = `${completedGoals}/${totalGoals}`;
      }
    } catch (error) {
      console.error('Failed to update goal progress:', error);
    }
  }

  getGoalCategory(goalKey) {
    const categoryMap = {
      'productiveHours': 'Productive / Educational',
      'entertainmentHours': 'Entertainment',
      'socialMediaHours': 'Social Media'
    };
    return categoryMap[goalKey] || 'Other';
  }

  updateTopSites() {
    try {
      const topSitesList = document.getElementById('topSitesList');
      if (!topSitesList) return;
      
      const sites = Object.entries(this.currentData.sites || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      if (sites.length === 0) {
        topSitesList.innerHTML = '<div class="no-data">No browsing data available</div>';
        return;
      }
      
      topSitesList.innerHTML = sites.map(([site, time]) => `
        <div class="site-item">
          <div class="site-info">
            <img src="https://www.google.com/s2/favicons?domain=${site}" 
                 alt="${site}" class="site-logo" 
                 onerror="this.style.display='none'">
            <span class="site-name">${site}</span>
          </div>
          <span class="site-time">${this.formatTime(time)}</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error updating top sites:', error);
    }
  }

  async updateBlockedSites() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getBlockedSites' });
      const blockedSitesList = document.getElementById('blockedSitesList');
      
      if (!blockedSitesList) return;
      
      if (!response?.blockedSites || response.blockedSites.length === 0) {
        blockedSitesList.innerHTML = '<div class="no-data">No blocked sites</div>';
        return;
      }
      
      const now = Date.now();
      const activeSites = response.blockedSites.filter(site => site.expiresAt > now);
      
      if (activeSites.length === 0) {
        blockedSitesList.innerHTML = '<div class="no-data">No active blocks</div>';
        return;
      }
      
      blockedSitesList.innerHTML = activeSites.map(site => {
        const remaining = Math.max(0, site.expiresAt - now);
        const minutes = Math.floor(remaining / 60000);
        
        return `
          <div class="blocked-site-item">
            <div class="blocked-site-info">
              <div class="blocked-site-url">${site.url}</div>
              <div class="blocked-site-time">${minutes}m remaining</div>
            </div>
            <button class="unblock-btn" onclick="webTimeTracker.removeBlock('${site.url}')">
              Unblock
            </button>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Failed to update blocked sites:', error);
    }
  }

  setupCharts() {
    try {
      this.setupCategoryChart();
      this.setupWeeklyChart();
    } catch (error) {
      console.error('Error setting up charts:', error);
    }
  }

  setupCategoryChart() {
    try {
      const canvas = document.getElementById('categoryChart');
      if (!canvas || typeof Chart === 'undefined') return;
      
      const ctx = canvas.getContext('2d');
      
      if (this.charts.category) {
        this.charts.category.destroy();
      }
      
      this.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [
              '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            }
          }
        }
      });
      
      this.updateCharts();
    } catch (error) {
      console.error('Error setting up category chart:', error);
    }
  }

  setupWeeklyChart() {
    try {
      const canvas = document.getElementById('weeklyChart');
      if (!canvas || typeof Chart === 'undefined') return;
      
      const ctx = canvas.getContext('2d');
      
      if (this.charts.weekly) {
        this.charts.weekly.destroy();
      }
      
      this.charts.weekly = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return Math.floor(value / 60) + 'h';
                }
              }
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });
    } catch (error) {
      console.error('Error setting up weekly chart:', error);
    }
  }

  updateCharts() {
    try {
      this.updateCategoryChart();
      this.updateWeeklyChart();
    } catch (error) {
      console.error('Error updating charts:', error);
    }
  }

  updateCategoryChart() {
    try {
      if (!this.charts.category) return;
      
      const categories = Object.entries(this.currentData.categories || {})
        .filter(([,time]) => time > 0)
        .sort(([,a], [,b]) => b - a);
      
      this.charts.category.data.labels = categories.map(([category]) => category);
      this.charts.category.data.datasets[0].data = categories.map(([,time]) => Math.floor(time / 60000));
      this.charts.category.update();
    } catch (error) {
      console.error('Error updating category chart:', error);
    }
  }

  async updateWeeklyChart() {
    try {
      if (!this.charts.weekly) return;
      
      const { timeData = {} } = await chrome.storage.local.get('timeData');
      const weekData = [];
      const labels = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        
        labels.push(dayName);
        
        const dayData = timeData[dateStr] || { categories: {} };
        const totalMinutes = Object.values(dayData.categories).reduce((sum, time) => sum + time, 0) / 60000;
        weekData.push(Math.floor(totalMinutes));
      }
      
      this.charts.weekly.data.labels = labels;
      this.charts.weekly.data.datasets = [{
        label: 'Daily Usage (minutes)',
        data: weekData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }];
      
      this.charts.weekly.update();
    } catch (error) {
      console.error('Failed to update weekly chart:', error);
    }
  }

  async addBlock() {
    try {
      const siteInput = document.getElementById('siteToBlock');
      const durationInput = document.getElementById('blockDuration');
      
      if (!siteInput || !durationInput) return;
      
      const site = siteInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      const duration = parseInt(durationInput.value);
      
      if (!site || !duration || duration < 1) {
        this.showError('Please enter a valid website and duration');
        return;
      }
      
      const response = await chrome.runtime.sendMessage({
        action: 'addBlock',
        url: site,
        duration: duration
      });
      
      if (response?.success) {
        siteInput.value = '';
        durationInput.value = '';
        await this.updateBlockedSites();
        this.showSuccess('Site blocked successfully');
      } else {
        this.showError('Failed to block site');
      }
    } catch (error) {
      console.error('Failed to add block:', error);
      this.showError('Failed to block site');
    }
  }

  async removeBlock(url) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'removeBlock',
        url: url
      });
      
      if (response?.success) {
        await this.updateBlockedSites();
        this.showSuccess('Site unblocked successfully');
      } else {
        this.showError('Failed to unblock site');
      }
    } catch (error) {
      console.error('Failed to remove block:', error);
      this.showError('Failed to unblock site');
    }
  }

  openModal(modalId) {
    try {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        if (modalId === 'goalsModal') {
          this.loadGoals();
        } else if (modalId === 'moreModal') {
          this.loadInsights();
        }
      }
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  }

  closeModal(modalId) {
    try {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }

  async loadGoals() {
    try {
      const { goals = {} } = await chrome.storage.local.get('goals');
      const goalsContainer = document.querySelector('.goals-container');
      const streakInfo = document.querySelector('.streak-info');
      
      if (streakInfo) {
        streakInfo.innerHTML = `
          <h3>🔥 Current Streak: ${goals.streak || 0} days</h3>
          <p>Keep up the great work!</p>
        `;
      }
      
      if (goalsContainer) {
        const goalItems = Object.entries(goals)
          .filter(([key]) => key.endsWith('Hours'))
          .map(([key, value]) => {
            const category = this.getGoalCategory(key);
            const timeSpent = this.currentData.categories[category] || 0;
            const progress = Math.min(100, (timeSpent / (value * 3600000)) * 100);
            
            return `
              <div class="goal-item">
                <div class="goal-header">
                  <span class="goal-name">${category}</span>
                  <span class="goal-time">${this.formatTime(timeSpent)} / ${value}h</span>
                </div>
                <div class="goal-progress">
                  <div class="progress-bar ${progress >= 100 ? 'progress-complete' : ''}">
                    <div style="width: ${progress}%"></div>
                  </div>
                  <span class="goal-percentage">${Math.floor(progress)}%</span>
                </div>
              </div>
            `;
          });
        
        goalsContainer.innerHTML = goalItems.join('');
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  }

  async openEditGoals() {
    try {
      this.closeModal('goalsModal');
      
      const { goals = {} } = await chrome.storage.local.get('goals');
      const { categories = {} } = await chrome.storage.local.get('categories');
      
      const categoryGoals = document.getElementById('categoryGoals');
      if (categoryGoals) {
        const goalItems = Object.keys(categories).map(category => {
          const goalKey = this.getCategoryGoalKey(category);
          const currentValue = goals[goalKey] || 0;
          
          return `
            <div class="category-goal-item">
              <span class="category-goal-name">${category}</span>
              <div class="goal-input-wrapper">
                <input type="number" 
                       class="category-goal-input" 
                       data-category="${goalKey}"
                       value="${currentValue}" 
                       min="0" 
                       max="24" 
                       step="0.5">
                <span class="goal-unit">hours</span>
              </div>
            </div>
          `;
        });
        
        categoryGoals.innerHTML = goalItems.join('');
      }
      
      this.openModal('editGoalsModal');
    } catch (error) {
      console.error('Failed to open edit goals:', error);
    }
  }

  getCategoryGoalKey(category) {
    const keyMap = {
      'Productive / Educational': 'productiveHours',
      'Entertainment': 'entertainmentHours',
      'Social Media': 'socialMediaHours'
    };
    return keyMap[category] || category.toLowerCase().replace(/[^a-z0-9]/gi, '') + 'Hours';
  }

  async saveGoals() {
    try {
      const { goals = {} } = await chrome.storage.local.get('goals');
      
      document.querySelectorAll('.category-goal-input').forEach(input => {
        const category = input.dataset.category;
        const value = parseFloat(input.value) || 0;
        goals[category] = value;
      });
      
      await chrome.storage.local.set({ goals });
      this.closeModal('editGoalsModal');
      this.showSuccess('Goals saved successfully');
    } catch (error) {
      console.error('Failed to save goals:', error);
      this.showError('Failed to save goals');
    }
  }

  async loadInsights() {
    try {
      const { timeData = {} } = await chrome.storage.local.get('timeData');
      
      // Load weekly categories
      this.loadWeeklyCategories(timeData);
      
      // Load weekly websites
      this.loadWeeklyWebsites(timeData);
      
      // Load session insights
      this.loadSessionInsights(timeData);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  }

  loadWeeklyCategories(timeData) {
    try {
      const weeklyCategories = document.getElementById('weeklyCategories');
      if (!weeklyCategories) return;
      
      const weekData = this.calculateWeekData(timeData);
      const totalTime = Object.values(weekData.categories).reduce((sum, time) => sum + time, 0);
      
      const categories = Object.entries(weekData.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      if (categories.length === 0) {
        weeklyCategories.innerHTML = '<div class="no-data">No category data available</div>';
        return;
      }
      
      weeklyCategories.innerHTML = categories.map(([category, time]) => {
        const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
        return `
          <div class="weekly-item">
            <div class="weekly-item-info">
              <div class="weekly-item-icon">📁</div>
              <span class="weekly-item-name">${category}</span>
            </div>
            <div>
              <span class="weekly-item-time">${this.formatTime(time)}</span>
              <span class="weekly-item-percentage">${percentage}%</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading weekly categories:', error);
    }
  }

  loadWeeklyWebsites(timeData) {
    try {
      const weeklyWebsites = document.getElementById('weeklyWebsites');
      if (!weeklyWebsites) return;
      
      const weekData = this.calculateWeekData(timeData);
      const websites = Object.entries(weekData.sites)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      if (websites.length === 0) {
        weeklyWebsites.innerHTML = '<div class="no-data">No website data available</div>';
        return;
      }
      
      weeklyWebsites.innerHTML = websites.map(([site, time]) => `
        <div class="weekly-item">
          <div class="weekly-item-info">
            <img src="https://www.google.com/s2/favicons?domain=${site}" 
                 alt="${site}" class="weekly-item-icon" 
                 onerror="this.style.display='none'">
            <span class="weekly-item-name">${site}</span>
          </div>
          <span class="weekly-item-time">${this.formatTime(time)}</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading weekly websites:', error);
    }
  }

  loadSessionInsights(timeData) {
    try {
      const sessionInsights = document.getElementById('sessionInsights');
      if (!sessionInsights) return;
      
      const today = new Date().toISOString().split('T')[0];
      const todayData = timeData[today];
      
      if (!todayData || Object.keys(todayData.sites || {}).length === 0) {
        sessionInsights.innerHTML = '<div class="no-sessions">No session data for today</div>';
        return;
      }
      
      const sessions = Object.entries(todayData.sites)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      sessionInsights.innerHTML = sessions.map(([site, time]) => `
        <div class="session-card">
          <div class="session-site">${site}</div>
          <div class="session-stat">
            <span>Time Spent:</span>
            <span class="session-stat-value">${this.formatTime(time)}</span>
          </div>
          <div class="session-stat">
            <span>Sessions:</span>
            <span class="session-stat-value">1</span>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading session insights:', error);
    }
  }

  toggleCollapse(header) {
    try {
      const target = header.dataset.target;
      const collapse = document.getElementById(target);
      const icon = header.querySelector('.toggle-icon');
      
      if (collapse && icon) {
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        
        header.setAttribute('aria-expanded', !isExpanded);
        collapse.classList.toggle('show');
        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    } catch (error) {
      console.error('Error toggling collapse:', error);
    }
  }

  async exportData() {
    try {
      const data = await chrome.storage.local.get(null);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `webtimetracker-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showSuccess('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showError('Failed to export data');
    }
  }

  async loadTheme() {
    try {
      const { theme = 'light', accentColor = 'blue' } = await chrome.storage.local.get(['theme', 'accentColor']);
      this.setTheme(theme);
      this.setAccentColor(accentColor);
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }

  setTheme(theme) {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      
      // Update button states
      document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
      const themeBtn = document.getElementById(`${theme}ModeBtn`);
      if (themeBtn) themeBtn.classList.add('active');
      
      // Save theme
      chrome.storage.local.set({ theme });
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }

  setAccentColor(color) {
    try {
      const colorMap = {
        blue: '#3b82f6',
        green: '#10b981',
        purple: '#8b5cf6',
        orange: '#f59e0b',
        red: '#ef4444'
      };
      
      if (colorMap[color]) {
        document.documentElement.style.setProperty('--accent-color', colorMap[color]);
        
        // Update button states
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        const colorBtn = document.querySelector(`[data-color="${color}"]`);
        if (colorBtn) colorBtn.classList.add('active');
        
        // Save color
        chrome.storage.local.set({ accentColor: color });
      }
    } catch (error) {
      console.error('Error setting accent color:', error);
    }
  }

  async saveSettings() {
    try {
      this.closeModal('settingsModal');
      this.showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showError('Failed to save settings');
    }
  }

  formatTime(ms) {
    if (!ms || ms < 0) return '0m';
    
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      `;
      
      document.body.appendChild(notification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

// Initialize the app
let webTimeTracker;

document.addEventListener('DOMContentLoaded', () => {
  try {
    webTimeTracker = new WebTimeTracker();
  } catch (error) {
    console.error('Failed to initialize WebTimeTracker:', error);
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .no-data {
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem;
    font-style: italic;
  }
`;
document.head.appendChild(style);