// More Menu Component for TimeSetu
class MoreMenu {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createMoreButton();
        this.createMoreMenu();
        this.setupEventListeners();
    }

    createMoreButton() {
        // Check for existing top-right elements (like .top-controls in main page)
        const topControls = document.querySelector('.top-controls');
        let rightOffset = 20;
        let topOffset = 20;
        
        // If there are top-controls (language/theme toggles), position below them
        if (topControls) {
            topOffset = 80; 
        }

        const moreButton = document.createElement('button');
        moreButton.id = 'more-menu-btn';
        moreButton.className = 'more-menu-btn';
        moreButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
            </svg>
            <span>More</span>
        `;
        
        // Position the button (avoiding conflicts with existing elements)
        moreButton.style.cssText = `
            position: fixed !important;
            top: ${topOffset}px !important;
            right: ${rightOffset}px !important;
            background: var(--card-bg, rgba(30, 30, 63, 0.95)) !important;
            border: 1px solid var(--card-border, rgba(255, 255, 255, 0.2)) !important;
            color: var(--text-primary, white) !important;
            padding: 12px 16px !important;
            border-radius: 12px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            font-size: 0.9rem !important;
            font-weight: 500 !important;
            transition: all 0.3s ease !important;
            backdrop-filter: blur(10px) !important;
            z-index: 1002 !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif !important;
        `;

        document.body.appendChild(moreButton);
    }

    createMoreMenu() {
        const menu = document.createElement('div');
        menu.id = 'more-menu';
        menu.className = 'more-menu hidden';
        
        const currentPage = this.getCurrentPageType();
        
        menu.innerHTML = `
            <div class="more-menu-content">
                <div class="more-menu-header">
                    <h3>More Options</h3>
                    <button class="close-menu-btn">&times;</button>
                </div>
                <div class="more-menu-body">
                    <div class="menu-section">
                        <h4>🔧 Settings</h4>
                        <div class="menu-items">
                            <button class="menu-item" data-action="theme-toggle">
                                <span class="menu-icon">🌙</span>
                                <span>Toggle Theme</span>
                            </button>
                            <button class="menu-item" data-action="language">
                                <span class="menu-icon">🌍</span>
                                <span>Language</span>
                            </button>
                        </div>
                    </div>

                    <div class="menu-section">
                        <h4>📊 Data</h4>
                        <div class="menu-items">
                            <button class="menu-item" data-action="export-data">
                                <span class="menu-icon">💾</span>
                                <span>Export Data</span>
                            </button>
                            <button class="menu-item" data-action="reset-data">
                                <span class="menu-icon">🔄</span>
                                <span>Reset Demo Data</span>
                            </button>
                            <button class="menu-item" data-action="share-stats">
                                <span class="menu-icon">📤</span>
                                <span>Share Stats</span>
                            </button>
                        </div>
                    </div>

                    ${currentPage === 'overall' ? `
                    <div class="menu-section">
                        <h4>📈 Analytics</h4>
                        <div class="menu-items">
                            <button class="menu-item" data-action="analytics-report">
                                <span class="menu-icon">📊</span>
                                <span>Detailed Report</span>
                            </button>
                            <button class="menu-item" data-action="productivity-insights">
                                <span class="menu-icon">🧠</span>
                                <span>Productivity Insights</span>
                            </button>
                            <button class="menu-item" data-action="time-comparison">
                                <span class="menu-icon">📈</span>
                                <span>Time Comparison</span>
                            </button>
                        </div>
                    </div>

                    <div class="menu-section">
                        <h4>🎯 Goals & Habits</h4>
                        <div class="menu-items">
                            <button class="menu-item" data-action="goal-recommendations">
                                <span class="menu-icon">💡</span>
                                <span>Goal Recommendations</span>
                            </button>
                            <button class="menu-item" data-action="habit-tracker">
                                <span class="menu-icon">📋</span>
                                <span>Habit Tracker</span>
                            </button>
                            <button class="menu-item" data-action="screen-time-calendar">
                                <span class="menu-icon">📅</span>
                                <span>Screen Time Calendar</span>
                            </button>
                        </div>
                    </div>
                    ` : ''}

                    <div class="menu-section">
                        <h4>🎯 Focus</h4>
                        <div class="menu-items">
                            <button class="menu-item" data-action="focus-mode">
                                <span class="menu-icon">🎯</span>
                                <span>Focus Mode</span>
                            </button>
                            <button class="menu-item" data-action="block-websites">
                                <span class="menu-icon">🚫</span>
                                <span>Block Websites</span>
                            </button>
                        </div>
                    </div>

                    <div class="menu-section">
                        <h4>ℹ️ Help & Info</h4>
                        <div class="menu-items">
                            <button class="menu-item" data-action="tour">
                                <span class="menu-icon">🎪</span>
                                <span>Take Tour</span>
                            </button>
                            <button class="menu-item" data-action="keyboard-shortcuts">
                                <span class="menu-icon">⌨️</span>
                                <span>Keyboard Shortcuts</span>
                            </button>
                            <button class="menu-item" data-action="about">
                                <span class="menu-icon">ℹ️</span>
                                <span>About TimeSetu</span>
                            </button>
                            <button class="menu-item" data-action="feedback">
                                <span class="menu-icon">💬</span>
                                <span>Send Feedback</span>
                            </button>
                        </div>
                    </div>

                    <div class="menu-section">
                        <h4>🔗 Links</h4>
                        <div class="menu-items">
                            <button class="menu-item" data-action="github">
                                <span class="menu-icon">🐙</span>
                                <span>GitHub Repository</span>
                            </button>
                            <button class="menu-item" data-action="demo-video">
                                <span class="menu-icon">🎥</span>
                                <span>Demo Video</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        menu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(menu);
        this.addMenuStyles();
    }

    addMenuStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .more-menu-btn {
                position: fixed !important;
                z-index: 1002 !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
            }
            
            .more-menu-btn:hover {
                transform: translateY(-2px);
                border-color: rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.05);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
            }

            .more-menu-content {
                background: var(--card-bg, rgba(30, 30, 63, 0.95));
                border: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
                border-radius: 20px;
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                backdrop-filter: blur(20px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }

            .more-menu-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px 16px;
                border-bottom: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
            }

            .more-menu-header h3 {
                margin: 0;
                font-size: 1.3rem;
                font-weight: 600;
                color: var(--text-primary, white);
            }

            .close-menu-btn {
                background: none;
                border: none;
                color: var(--text-secondary, #a0a0b8);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .close-menu-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-primary, white);
            }

            .more-menu-body {
                padding: 16px 24px 24px;
            }

            .menu-section {
                margin-bottom: 24px;
            }

            .menu-section:last-child {
                margin-bottom: 0;
            }

            .menu-section h4 {
                margin: 0 0 12px 0;
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--text-secondary, #a0a0b8);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .menu-items {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .menu-item {
                background: none;
                border: none;
                color: var(--text-primary, white);
                padding: 12px 16px;
                border-radius: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.95rem;
                font-weight: 400;
                transition: all 0.2s ease;
                text-align: left;
                width: 100%;
            }

            .menu-item:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: translateX(4px);
            }

            .menu-icon {
                font-size: 1rem;
                min-width: 20px;
                text-align: center;
            }

            .more-menu.hidden {
                opacity: 0;
                visibility: hidden;
            }

            .more-menu.visible {
                opacity: 1;
                visibility: visible;
            }

            /* Light theme adjustments */
            body.light-theme .more-menu-btn {
                background: rgba(255, 255, 255, 0.9) !important;
                color: #1f2937 !important;
                border-color: rgba(156, 163, 175, 0.3) !important;
            }

            body.light-theme .more-menu-content {
                background: rgba(255, 255, 255, 0.95) !important;
                border-color: rgba(156, 163, 175, 0.3) !important;
            }

            body.light-theme .more-menu-header h3,
            body.light-theme .menu-item {
                color: #1f2937 !important;
            }

            body.light-theme .close-menu-btn {
                color: #6b7280 !important;
            }

            body.light-theme .close-menu-btn:hover {
                color: #1f2937 !important;
                background: rgba(0, 0, 0, 0.05) !important;
            }

            body.light-theme .menu-item:hover {
                background: rgba(0, 0, 0, 0.05) !important;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .more-menu-content {
                    max-width: 95%;
                    margin: 20px;
                }

                .more-menu-btn {
                    padding: 10px 14px !important;
                    font-size: 0.85rem !important;
                }

                .more-menu-btn span {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const moreBtn = document.getElementById('more-menu-btn');
        const menu = document.getElementById('more-menu');
        const closeBtn = menu.querySelector('.close-menu-btn');

        moreBtn.addEventListener('click', () => this.toggleMenu());
        closeBtn.addEventListener('click', () => this.closeMenu());
        
        // Close menu when clicking outside
        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                this.closeMenu();
            }
        });

        // Handle menu item clicks
        menu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                this.handleMenuAction(action);
                this.closeMenu();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
            if (e.key === 'm' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.toggleMenu();
            }
        });
    }

    toggleMenu() {
        const menu = document.getElementById('more-menu');
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        const menu = document.getElementById('more-menu');
        menu.classList.remove('hidden');
        menu.classList.add('visible');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        const menu = document.getElementById('more-menu');
        menu.classList.remove('visible');
        menu.classList.add('hidden');
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    getCurrentPageType() {
        const path = window.location.pathname;
        if (path.includes('overall-view')) return 'overall';
        if (path.includes('mobile-view')) return 'mobile';
        if (path.includes('browser-view')) return 'browser';
        if (path.includes('laptop-view')) return 'laptop';
        if (path.includes('share-stats')) return 'share';
        return 'index';
    }

    handleMenuAction(action) {
        switch (action) {
            case 'theme-toggle':
                this.toggleTheme();
                break;
            case 'language':
                this.showLanguageOptions();
                break;
            case 'export-data':
                this.exportData();
                break;
            case 'reset-data':
                this.resetData();
                break;
            case 'share-stats':
                window.location.href = 'share-stats.html';
                break;
            case 'focus-mode':
                this.toggleFocusMode();
                break;
            case 'block-websites':
                this.showBlockWebsites();
                break;
            case 'tour':
                this.startTour();
                break;
            case 'keyboard-shortcuts':
                this.showKeyboardShortcuts();
                break;
            case 'about':
                this.showAbout();
                break;
            case 'feedback':
                this.showFeedback();
                break;
            case 'github':
                window.open('https://github.com/your-username/timesetu', '_blank');
                break;
            case 'demo-video':
                window.open('https://www.youtube.com/watch?v=demo-video-id', '_blank');
                break;
            case 'analytics-report':
                this.showAnalyticsReport();
                break;
            case 'productivity-insights':
                this.showProductivityInsights();
                break;
            case 'time-comparison':
                this.showTimeComparison();
                break;
            case 'goal-recommendations':
                this.showGoalRecommendations();
                break;
            case 'habit-tracker':
                this.showHabitTracker();
                break;
            case 'screen-time-calendar':
                this.showScreenTimeCalendar();
                break;
        }
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        // Also update any existing theme toggle elements if present
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        if (themeIcon) themeIcon.textContent = isLight ? '☀️' : '🌙';
        if (themeText) themeText.textContent = isLight ? 'Light' : 'Dark';
        
        this.showNotification(`Switched to ${isLight ? 'light' : 'dark'} mode`);
    }

    showLanguageOptions() {
        this.showNotification('Language selection coming soon!');
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            page: this.getCurrentPageType(),
            settings: {
                theme: localStorage.getItem('theme') || 'dark',
                scenario: localStorage.getItem('timesetu_demoScenario') || 'productive'
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timesetu-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!');
    }

    resetData() {
        if (confirm('Are you sure you want to reset all demo data? This action cannot be undone.')) {
            localStorage.removeItem('timesetu_demoScenario');
            sessionStorage.clear();
            this.showNotification('Demo data has been reset!');
            setTimeout(() => window.location.reload(), 1000);
        }
    }

    toggleFocusMode() {
        const focusModeActive = localStorage.getItem('focusModeActive') === 'true';
        localStorage.setItem('focusModeActive', !focusModeActive);
        this.showNotification(focusModeActive ? 'Focus mode disabled' : 'Focus mode enabled');
    }

    showBlockWebsites() {
        this.showNotification('Website blocking feature coming soon!');
    }

    startTour() {
        if (typeof window.startGuidedTour === 'function') {
            window.startGuidedTour();
        } else {
            this.showNotification('Guided tour is not available on this page');
        }
    }

    showKeyboardShortcuts() {
        const shortcuts = `
            <div style="text-align: left;">
                <h3>Keyboard Shortcuts</h3>
                <p><strong>Ctrl/Cmd + M:</strong> Open More menu</p>
                <p><strong>Escape:</strong> Close modals</p>
                <p><strong>Ctrl/Cmd + T:</strong> Toggle theme</p>
                <p><strong>Ctrl/Cmd + E:</strong> Export data</p>
                <p><strong>F1:</strong> Start tour (if available)</p>
            </div>
        `;
        this.showModal('Keyboard Shortcuts', shortcuts);
    }

    showAbout() {
        const about = `
            <div style="text-align: left;">
                <h3>About TimeSetu</h3>
                <p>TimeSetu is a comprehensive digital wellness companion that helps you track and manage your screen time across all devices.</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>Real-time tracking across devices</li>
                    <li>Smart analytics and insights</li>
                    <li>Focus mode and website blocking</li>
                    <li>Voice AI reviews</li>
                    <li>Cross-platform synchronization</li>
                </ul>
                <p><strong>Demo Version:</strong> You're currently viewing a frontend-only demo.</p>
            </div>
        `;
        this.showModal('About TimeSetu', about);
    }

    showFeedback() {
        const feedback = `
            <div style="text-align: left;">
                <h3>Send Feedback</h3>
                <p>We'd love to hear from you! Your feedback helps us improve TimeSetu.</p>
                <p><strong>Ways to reach us:</strong></p>
                <ul>
                    <li><a href="https://github.com/your-username/timesetu/issues" target="_blank" style="color: var(--accent-color);">GitHub Issues</a></li>
                    <li><a href="mailto:feedback@timesetu.com" style="color: var(--accent-color);">Email us</a></li>
                    <li><a href="https://twitter.com/timesetu" target="_blank" style="color: var(--accent-color);">Twitter</a></li>
                </ul>
            </div>
        `;
        this.showModal('Send Feedback', feedback);
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal-content">
                <div class="custom-modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="custom-modal-body">
                    ${content}
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modalContent = modal.querySelector('.custom-modal-content');
        modalContent.style.cssText = `
            background: var(--card-bg, rgba(30, 30, 63, 0.95));
            border: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            color: var(--text-primary, white);
        `;

        const header = modal.querySelector('.custom-modal-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px 16px;
            border-bottom: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
        `;

        const body = modal.querySelector('.custom-modal-body');
        body.style.cssText = `
            padding: 20px 24px;
            line-height: 1.6;
        `;

        const closeBtn = modal.querySelector('.close-modal-btn');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-secondary, #a0a0b8);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

        document.body.appendChild(modal);

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #4caf50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            z-index: 10000;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
            animation: slideInNotification 0.4s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.4s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 3000);
    }

    // Enhanced features for Overall View page
    showAnalyticsReport() {
        const reportData = this.generateAnalyticsData();
        const reportContent = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
                <h3>📊 Comprehensive Analytics Report</h3>
                
                <div style="margin: 20px 0; padding: 15px; background: rgba(74, 144, 226, 0.1); border-radius: 10px;">
                    <h4>📈 This Week's Summary</h4>
                    <p><strong>Total Screen Time:</strong> ${reportData.totalTime}</p>
                    <p><strong>Most Productive Day:</strong> ${reportData.mostProductiveDay}</p>
                    <p><strong>Average Daily Usage:</strong> ${reportData.avgDaily}</p>
                    <p><strong>Top Category:</strong> ${reportData.topCategory}</p>
                </div>

                <div style="margin: 20px 0;">
                    <h4>🎯 Goal Achievement</h4>
                    <div style="margin: 10px 0;">
                        ${reportData.goals.map(goal => `
                            <div style="margin: 8px 0; padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 8px;">
                                <strong>${goal.name}:</strong> ${goal.progress}% completed (${goal.actual}/${goal.target})
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📱 Device Breakdown</h4>
                    <div>
                        ${reportData.devices.map(device => `
                            <p><strong>${device.name}:</strong> ${device.time} (${device.percentage}%)</p>
                        `).join('')}
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>⭐ Key Insights</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${reportData.insights.map(insight => `
                            <li style="margin: 8px 0; padding: 10px; background: rgba(255, 193, 7, 0.1); border-radius: 8px;">
                                ${insight}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        this.showModal('Analytics Report', reportContent);
    }

    showProductivityInsights() {
        const insights = this.generateProductivityInsights();
        const content = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
                <h3>🧠 Productivity Insights</h3>
                
                <div style="margin: 20px 0; padding: 15px; background: rgba(156, 39, 176, 0.1); border-radius: 10px;">
                    <h4>🏆 Productivity Score: ${insights.score}/100</h4>
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; margin: 10px 0;">
                        <div style="width: ${insights.score}%; height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 4px;"></div>
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>⚡ Peak Productivity Hours</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        ${insights.peakHours.map(hour => `
                            <div style="padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 8px; text-align: center;">
                                <div style="font-weight: 600;">${hour.time}</div>
                                <div style="font-size: 0.8rem; opacity: 0.8;">${hour.score}% focus</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📊 Activity Patterns</h4>
                    ${insights.patterns.map(pattern => `
                        <div style="margin: 10px 0; padding: 12px; background: rgba(33, 150, 243, 0.1); border-radius: 8px;">
                            <div style="font-weight: 600; margin-bottom: 5px;">${pattern.title}</div>
                            <div style="font-size: 0.9rem;">${pattern.description}</div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin: 20px 0;">
                    <h4>💡 Recommendations</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${insights.recommendations.map(rec => `
                            <li style="margin: 8px 0; padding: 10px; background: rgba(255, 152, 0, 0.1); border-radius: 8px;">
                                ${rec}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        this.showModal('Productivity Insights', content);
    }

    showTimeComparison() {
        const comparison = this.generateTimeComparison();
        const content = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
                <h3>📈 Time Comparison Analysis</h3>
                
                <div style="margin: 20px 0;">
                    <h4>📅 This Week vs Last Week</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 10px;">
                            <div style="font-weight: 600;">This Week</div>
                            <div style="font-size: 1.5rem; margin: 10px 0;">${comparison.thisWeek.total}</div>
                            <div style="font-size: 0.8rem; opacity: 0.8;">Avg: ${comparison.thisWeek.daily}</div>
                        </div>
                        <div style="padding: 15px; background: rgba(255, 193, 7, 0.1); border-radius: 10px;">
                            <div style="font-weight: 600;">Last Week</div>
                            <div style="font-size: 1.5rem; margin: 10px 0;">${comparison.lastWeek.total}</div>
                            <div style="font-size: 0.8rem; opacity: 0.8;">Avg: ${comparison.lastWeek.daily}</div>
                        </div>
                    </div>
                    <div style="text-align: center; margin: 15px 0; padding: 10px; background: ${comparison.change.positive ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)'}; border-radius: 8px;">
                        <strong>${comparison.change.text}</strong>
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📱 Device Trends</h4>
                    ${comparison.deviceTrends.map(device => `
                        <div style="margin: 10px 0; padding: 12px; background: rgba(33, 150, 243, 0.1); border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600;">${device.name}</span>
                                <span style="color: ${device.trend > 0 ? '#f44336' : '#4caf50'}; font-weight: 600;">
                                    ${device.trend > 0 ? '+' : ''}${device.trend}%
                                </span>
                            </div>
                            <div style="margin-top: 5px; font-size: 0.9rem; opacity: 0.8;">${device.change}</div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin: 20px 0;">
                    <h4>🎯 Category Changes</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        ${comparison.categoryChanges.map(cat => `
                            <div style="padding: 10px; background: rgba(156, 39, 176, 0.1); border-radius: 8px; text-align: center;">
                                <div style="font-weight: 600; font-size: 0.9rem;">${cat.name}</div>
                                <div style="color: ${cat.change > 0 ? '#f44336' : '#4caf50'}; font-weight: 600; margin: 5px 0;">
                                    ${cat.change > 0 ? '+' : ''}${cat.change}%
                                </div>
                                <div style="font-size: 0.8rem; opacity: 0.8;">${cat.time}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        this.showModal('Time Comparison', content);
    }

    showGoalRecommendations() {
        const recommendations = this.generateGoalRecommendations();
        const content = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
                <h3>💡 Smart Goal Recommendations</h3>
                
                <div style="margin: 20px 0; padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 10px;">
                    <h4>🎯 Based on your usage patterns, we recommend:</h4>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📱 Screen Time Goals</h4>
                    ${recommendations.screenTimeGoals.map(goal => `
                        <div style="margin: 12px 0; padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 10px;">
                            <div style="font-weight: 600; margin-bottom: 8px;">${goal.title}</div>
                            <div style="margin-bottom: 8px;">${goal.description}</div>
                            <div style="font-size: 0.9rem; opacity: 0.8;">Current: ${goal.current} → Target: ${goal.target}</div>
                            <button onclick="moreMenuInstance.applyGoalRecommendation('${goal.id}')" style="margin-top: 10px; padding: 6px 12px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;">Apply Goal</button>
                        </div>
                    `).join('')}
                </div>

                <div style="margin: 20px 0;">
                    <h4>⚡ Productivity Goals</h4>
                    ${recommendations.productivityGoals.map(goal => `
                        <div style="margin: 12px 0; padding: 15px; background: rgba(255, 152, 0, 0.1); border-radius: 10px;">
                            <div style="font-weight: 600; margin-bottom: 8px;">${goal.title}</div>
                            <div style="margin-bottom: 8px;">${goal.description}</div>
                            <div style="font-size: 0.9rem; opacity: 0.8;">Estimated impact: ${goal.impact}</div>
                            <button onclick="moreMenuInstance.applyGoalRecommendation('${goal.id}')" style="margin-top: 10px; padding: 6px 12px; background: #ff9800; color: white; border: none; border-radius: 6px; cursor: pointer;">Set Goal</button>
                        </div>
                    `).join('')}
                </div>

                <div style="margin: 20px 0;">
                    <h4>🛡️ Focus Goals</h4>
                    ${recommendations.focusGoals.map(goal => `
                        <div style="margin: 12px 0; padding: 15px; background: rgba(156, 39, 176, 0.1); border-radius: 10px;">
                            <div style="font-weight: 600; margin-bottom: 8px;">${goal.title}</div>
                            <div style="margin-bottom: 8px;">${goal.description}</div>
                            <div style="font-size: 0.9rem; opacity: 0.8;">Duration: ${goal.duration}</div>
                            <button onclick="moreMenuInstance.applyGoalRecommendation('${goal.id}')" style="margin-top: 10px; padding: 6px 12px; background: #9c27b0; color: white; border: none; border-radius: 6px; cursor: pointer;">Enable</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.showModal('Goal Recommendations', content);
    }

    showHabitTracker() {
        const habits = this.generateHabitData();
        const content = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
                <h3>📋 Digital Wellness Habit Tracker</h3>
                
                <div style="margin: 20px 0; padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 10px; text-align: center;">
                    <h4>🔥 Current Streak: ${habits.currentStreak} days</h4>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Best streak: ${habits.bestStreak} days</div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📅 This Week's Habits</h4>
                    ${habits.weeklyHabits.map(habit => `
                        <div style="margin: 12px 0; padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600;">${habit.name}</span>
                                <span style="background: ${habit.completed >= habit.target ? '#4caf50' : '#ff9800'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                                    ${habit.completed}/${habit.target}
                                </span>
                            </div>
                            <div style="margin-bottom: 8px; font-size: 0.9rem; opacity: 0.8;">${habit.description}</div>
                            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px;">
                                <div style="width: ${Math.min(100, (habit.completed / habit.target) * 100)}%; height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 3px;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin: 20px 0;">
                    <h4>🏆 Achievements</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        ${habits.achievements.map(achievement => `
                            <div style="padding: 12px; background: ${achievement.unlocked ? 'rgba(255, 193, 7, 0.2)' : 'rgba(128, 128, 128, 0.1)'}; border-radius: 10px; text-align: center;">
                                <div style="font-size: 1.5rem; margin-bottom: 5px;">${achievement.icon}</div>
                                <div style="font-size: 0.8rem; font-weight: 600;">${achievement.name}</div>
                                <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 5px;">${achievement.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📊 Habit Trends</h4>
                    ${habits.trends.map(trend => `
                        <div style="margin: 10px 0; padding: 12px; background: rgba(156, 39, 176, 0.1); border-radius: 8px;">
                            <div style="font-weight: 600; margin-bottom: 5px;">${trend.habit}</div>
                            <div style="font-size: 0.9rem;">${trend.trend}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.showModal('Habit Tracker', content);
    }

    showScreenTimeCalendar() {
        const calendar = this.generateCalendarData();
        const content = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
                <h3>📅 Screen Time Calendar</h3>
                
                <div style="margin: 20px 0; text-align: center;">
                    <h4>November 2024</h4>
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin: 15px 0;">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                            `<div style="padding: 8px; font-weight: 600; text-align: center; font-size: 0.8rem;">${day}</div>`
                        ).join('')}
                        ${calendar.days.map(day => `
                            <div style="
                                padding: 8px; 
                                background: ${day.usage ? this.getUsageColor(day.usage) : 'rgba(128,128,128,0.1)'}; 
                                border-radius: 6px; 
                                text-align: center; 
                                font-size: 0.8rem;
                                color: ${day.usage > 600 ? 'white' : 'inherit'};
                                position: relative;
                                cursor: pointer;
                            " title="${day.date}: ${day.time || 'No data'}">
                                ${day.date}
                                ${day.usage ? `<div style="font-size: 0.6rem; margin-top: 2px;">${day.time}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📊 Legend</h4>
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 15px; height: 15px; background: #e8f5e8; border-radius: 3px;"></div>
                            <span style="font-size: 0.8rem;">Low (< 6h)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 15px; height: 15px; background: #4caf50; border-radius: 3px;"></div>
                            <span style="font-size: 0.8rem;">Moderate (6-10h)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 15px; height: 15px; background: #ff9800; border-radius: 3px;"></div>
                            <span style="font-size: 0.8rem;">High (10-14h)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 15px; height: 15px; background: #f44336; border-radius: 3px;"></div>
                            <span style="font-size: 0.8rem;">Very High (> 14h)</span>
                        </div>
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📈 Monthly Summary</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                        <div style="padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 10px; text-align: center;">
                            <div style="font-weight: 600; margin-bottom: 5px;">Average Daily</div>
                            <div style="font-size: 1.3rem; color: #4caf50;">${calendar.stats.avgDaily}</div>
                        </div>
                        <div style="padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 10px; text-align: center;">
                            <div style="font-weight: 600; margin-bottom: 5px;">Best Day</div>
                            <div style="font-size: 1.3rem; color: #2196f3;">${calendar.stats.bestDay}</div>
                        </div>
                        <div style="padding: 15px; background: rgba(255, 152, 0, 0.1); border-radius: 10px; text-align: center;">
                            <div style="font-weight: 600; margin-bottom: 5px;">Total Hours</div>
                            <div style="font-size: 1.3rem; color: #ff9800;">${calendar.stats.totalHours}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showModal('Screen Time Calendar', content);
    }

    getUsageColor(minutes) {
        if (minutes < 360) return '#e8f5e8';      // Light green
        if (minutes < 600) return '#4caf50';      // Green  
        if (minutes < 840) return '#ff9800';      // Orange
        return '#f44336';                         // Red
    }

    applyGoalRecommendation(goalId) {
        // In a real app, this would save the goal to the backend
        this.showNotification(`Goal applied successfully! Check your Goals section.`);
        // Close any open modals
        const modals = document.querySelectorAll('.custom-modal');
        modals.forEach(modal => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        });
    }

    // Data generation methods for dummy content
    generateAnalyticsData() {
        return {
            totalTime: '87h 58m',
            mostProductiveDay: 'Tuesday (78% productivity)',
            avgDaily: '12h 34m',
            topCategory: 'Development (28h 45m)',
            goals: [
                { name: 'Social Media Limit', progress: 85, actual: '10h 15m', target: '12h' },
                { name: 'Productive Work', progress: 120, actual: '18h 30m', target: '15h' },
                { name: 'Entertainment', progress: 45, actual: '4h 30m', target: '10h' },
                { name: 'Focus Sessions', progress: 90, actual: '9', target: '10' }
            ],
            devices: [
                { name: 'Laptop', time: '47h 15m', percentage: 54 },
                { name: 'Mobile', time: '30h 41m', percentage: 35 },
                { name: 'Browser', time: '10h 2m', percentage: 11 }
            ],
            insights: [
                '🎯 You exceeded your productivity goals by 20% this week!',
                '📱 Mobile usage decreased by 15% compared to last week',
                '⏰ Your most productive hours are 9-11 AM and 2-4 PM',
                '🔔 You had 3 days with perfect focus (no distracting websites)',
                '📈 Development work increased by 8 hours this week'
            ]
        };
    }

    generateProductivityInsights() {
        return {
            score: 78,
            peakHours: [
                { time: '9-10 AM', score: 92 },
                { time: '10-11 AM', score: 88 },
                { time: '2-3 PM', score: 85 },
                { time: '3-4 PM', score: 82 }
            ],
            patterns: [
                {
                    title: '🌅 Early Bird Productivity',
                    description: 'You\'re most focused in the morning hours with 90% productivity between 9-11 AM.'
                },
                {
                    title: '📱 Mobile Distraction Pattern',
                    description: 'Social media usage spikes during lunch hours (12-1 PM), reducing afternoon productivity.'
                },
                {
                    title: '🎯 Deep Work Sessions',
                    description: 'Your longest uninterrupted work sessions happen on Tuesdays and Thursdays.'
                }
            ],
            recommendations: [
                '🌅 Schedule important tasks between 9-11 AM when you\'re most focused',
                '📱 Use Focus Mode during lunch to maintain afternoon productivity',
                '⏰ Block 2-hour deep work sessions on your most productive days',
                '🔔 Enable notifications only for urgent messages during peak hours',
                '☕ Take scheduled breaks every 90 minutes to maintain focus'
            ]
        };
    }

    generateTimeComparison() {
        return {
            thisWeek: { total: '87h 58m', daily: '12h 34m' },
            lastWeek: { total: '92h 15m', daily: '13h 11m' },
            change: { 
                positive: false, 
                text: '↓ 4h 17m decrease from last week (Good!)' 
            },
            deviceTrends: [
                { name: 'Laptop', trend: -8, change: '3h 45m less than last week' },
                { name: 'Mobile', trend: -12, change: '4h 20m less than last week' },
                { name: 'Browser', trend: +15, change: '1h 15m more than last week' }
            ],
            categoryChanges: [
                { name: 'Social Media', change: -25, time: '8h 45m' },
                { name: 'Productivity', change: +18, time: '28h 30m' },
                { name: 'Entertainment', change: -10, time: '12h 15m' },
                { name: 'Development', change: +12, time: '18h 45m' }
            ]
        };
    }

    generateGoalRecommendations() {
        return {
            screenTimeGoals: [
                {
                    id: 'social-limit',
                    title: '📱 Social Media Daily Limit',
                    description: 'Based on your usage pattern, limit social media to 2 hours per day',
                    current: '3h 15m',
                    target: '2h 00m'
                },
                {
                    id: 'total-limit',
                    title: '⏰ Total Screen Time Limit', 
                    description: 'Reduce total daily screen time gradually',
                    current: '12h 34m',
                    target: '10h 00m'
                }
            ],
            productivityGoals: [
                {
                    id: 'dev-increase',
                    title: '💻 Increase Development Time',
                    description: 'You\'re doing great! Aim for 5 hours of focused coding per day',
                    impact: '+20% skill improvement'
                },
                {
                    id: 'focus-sessions',
                    title: '🎯 Daily Focus Sessions',
                    description: 'Complete 3 uninterrupted 45-minute focus sessions daily',
                    impact: '+35% productivity'
                }
            ],
            focusGoals: [
                {
                    id: 'morning-focus',
                    title: '🌅 Morning Deep Work',
                    description: 'Block all distractions from 9-11 AM for deep work',
                    duration: '2 hours daily'
                },
                {
                    id: 'social-blocker',
                    title: '🚫 Social Media Blocker',
                    description: 'Automatically block social sites during work hours',
                    duration: '9 AM - 5 PM'
                }
            ]
        };
    }

    generateHabitData() {
        return {
            currentStreak: 12,
            bestStreak: 28,
            weeklyHabits: [
                {
                    name: '🌅 Start work before 9 AM',
                    description: 'Begin productive work early in the day',
                    completed: 5,
                    target: 7
                },
                {
                    name: '📱 Check phone < 50 times',
                    description: 'Limit phone pickups for better focus',
                    completed: 4,
                    target: 7
                },
                {
                    name: '🎯 Use focus mode 2+ hours',
                    description: 'Spend at least 2 hours in focused work',
                    completed: 6,
                    target: 7
                },
                {
                    name: '🚫 No social media after 9 PM',
                    description: 'Wind down without social media',
                    completed: 3,
                    target: 7
                }
            ],
            achievements: [
                { icon: '🔥', name: 'Week Warrior', description: '7 days streak', unlocked: true },
                { icon: '🎯', name: 'Focus Master', description: '50 focus sessions', unlocked: true },
                { icon: '📱', name: 'Digital Minimalist', description: '< 8h daily for a week', unlocked: false },
                { icon: '🌅', name: 'Early Bird', description: 'Work before 9 AM for 30 days', unlocked: false }
            ],
            trends: [
                { habit: 'Morning Productivity', trend: 'Improving! You\'ve started work early 5 out of 7 days this week.' },
                { habit: 'Phone Usage', trend: 'Good progress! 20% fewer phone pickups compared to last week.' },
                { habit: 'Focus Time', trend: 'Excellent! You\'ve exceeded your focus time goals 6 days this week.' }
            ]
        };
    }

    generateCalendarData() {
        const days = [];
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push({ date: '', usage: null, time: null });
        }
        
        // Add days of the month with dummy usage data
        for (let date = 1; date <= lastDay.getDate(); date++) {
            const usage = date <= today.getDate() ? Math.floor(Math.random() * 900) + 300 : null; // 5-20 hours
            const hours = usage ? Math.floor(usage / 60) : 0;
            const minutes = usage ? usage % 60 : 0;
            const timeStr = usage ? `${hours}h ${minutes}m` : null;
            
            days.push({ date, usage, time: timeStr });
        }
        
        return {
            days,
            stats: {
                avgDaily: '11h 45m',
                bestDay: '6h 30m',
                totalHours: '365h'
            }
        };
    }
}

// Initialize More Menu after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other page elements are positioned first
    setTimeout(() => {
        try {
            window.moreMenuInstance = new MoreMenu();
        } catch (error) {
            console.error('Error initializing More Menu:', error);
        }
    }, 300);
});

// Fallback initialization on window load
window.addEventListener('load', () => {
    if (!document.getElementById('more-menu-btn')) {
        setTimeout(() => {
            try {
                window.moreMenuInstance = new MoreMenu();
            } catch (error) {
                console.error('Error initializing More Menu on window load:', error);
            }
        }, 100);
    }
});

// Export for use in other scripts
window.MoreMenu = MoreMenu; 