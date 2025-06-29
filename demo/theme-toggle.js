// Ultra Simple Theme Toggle Script - External File
// Universal Theme Toggle with Persistent Storage

function initializeThemeToggle() {
    console.log('Initializing universal theme toggle...');
    
    // Try both possible IDs for the theme toggle button
    var button = document.getElementById('theme-toggle') || document.getElementById('simpleThemeToggle');
    var icon = document.getElementById('themeIcon');
    var text = document.getElementById('themeText');
    var body = document.body;
    
    if (!button || !icon || !text) {
        console.log('Theme toggle elements not found - button:', !!button, 'icon:', !!icon, 'text:', !!text);
        // Try again after a short delay
        setTimeout(initializeThemeToggle, 100);
        return;
    }
    
    console.log('Theme toggle elements found');
    console.log('Button element:', button);
    console.log('Icon element:', icon);
    console.log('Text element:', text);
    
    var lightThemeStyles = null;
    
    // Check saved theme preference from localStorage
    var savedTheme = localStorage.getItem('dashboardTheme');
    if (!savedTheme) {
        console.log('localStorage not available, using default theme');
        savedTheme = 'dark'; // Default to dark
    }
    
    // Set initial theme based on saved preference
    var isLight = savedTheme === 'light';
    
    function createLightThemeStyles() {
        if (lightThemeStyles) return;
        
        lightThemeStyles = document.createElement('style');
        lightThemeStyles.id = 'lightThemeStyles';
        lightThemeStyles.innerHTML = `
            /* Complete Olive Green Light Mode Theme */
            
            /* Smooth transitions for theme changes */
            * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
            }
            
            /* Core Background Colors - Olive Green Theme */
            body.light-theme {
                background: linear-gradient(135deg, #f7f8dc 0%, #eef2e0 50%, #e6f0d4 100%) !important;
                color: #1a202c !important;
            }
            
            /* Text Colors - Dark on Light Olive */
            body.light-theme,
            body.light-theme * {
                color: #1a202c !important; /* Primary text - Dark slate */
            }
            
            body.light-theme .browser-header p,
            body.light-theme .overall-header p,
            body.light-theme .hero-subtitle,
            body.light-theme .device-description,
            body.light-theme .stat-label {
                color: #4a5568 !important; /* Secondary text - Medium gray */
            }
            
            /* Header Gradients - Olive Green Shades */
            body.light-theme .browser-header h1,
            body.light-theme .overall-header h1,
            body.light-theme .hero-section h1 {
                background: linear-gradient(135deg, #84cc16, #16a34a) !important;
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
                background-clip: text !important;
                color: #1a202c !important; /* Fallback */
            }
            
            /* Card Backgrounds - Light Olive Green */
            body.light-theme .container,
            body.light-theme .total-time-card,
            body.light-theme .quick-stats-card,
            body.light-theme .view-switcher,
            body.light-theme .time-period,
            body.light-theme .device-card,
            body.light-theme .overall-card,
            body.light-theme .stat-card,
            body.light-theme .chart-card,
            body.light-theme .apps-card-full,
            body.light-theme .chart-container,
            body.light-theme .top-sites,
            body.light-theme .goals-container {
                background: #f0f4e8 !important; /* Light olive green background */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #1a202c !important;
                box-shadow: 0 1px 3px rgba(132, 204, 22, 0.2), 0 1px 2px rgba(132, 204, 22, 0.1) !important;
            }
            
            /* SPECIFIC SECTIONS - Daily Goals Progress */
            body.light-theme .goals-section,
            body.light-theme .daily-goals,
            body.light-theme .goals-progress,
            body.light-theme .progress-container,
            body.light-theme .goal-item,
            body.light-theme .goal-card,
            body.light-theme .progress-card {
                background: #f0f4e8 !important; /* Light olive green background */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #1a202c !important;
                box-shadow: 0 1px 3px rgba(132, 204, 22, 0.2) !important;
            }
            
            /* Focus Mode Block List */
            body.light-theme .focus-block,
            body.light-theme .block-list,
            body.light-theme .blocked-sites,
            body.light-theme .focus-mode,
            body.light-theme .block-item,
            body.light-theme .blocked-item {
                background: #f0f4e8 !important; /* Light olive green background */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #1a202c !important;
                box-shadow: 0 1px 3px rgba(132, 204, 22, 0.2) !important;
            }
            
            /* Weekly AI Review Section */
            body.light-theme .ai-review,
            body.light-theme .weekly-review,
            body.light-theme .voice-review,
            body.light-theme .review-container,
            body.light-theme .review-card,
            body.light-theme .ai-insights {
                background: #f0f4e8 !important; /* Light olive green background */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #1a202c !important;
                box-shadow: 0 1px 3px rgba(132, 204, 22, 0.2) !important;
            }
            
            /* Settings, More, Goals Sections */
            body.light-theme .settings-section,
            body.light-theme .more-section,
            body.light-theme .goals-section,
            body.light-theme .settings-card,
            body.light-theme .more-card,
            body.light-theme .settings-item,
            body.light-theme .more-item,
            body.light-theme .config-panel,
            body.light-theme .options-panel {
                background: #f0f4e8 !important; /* Light olive green background */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #1a202c !important;
                box-shadow: 0 1px 3px rgba(132, 204, 22, 0.2) !important;
            }
            
            /* All divs, sections, and containers */
            body.light-theme div,
            body.light-theme section,
            body.light-theme article,
            body.light-theme aside,
            body.light-theme main,
            body.light-theme header,
            body.light-theme footer,
            body.light-theme nav {
                background-color: transparent !important;
                color: #1a202c !important;
            }
            
            /* Specific background overrides for cards */
            body.light-theme [class*="card"],
            body.light-theme [class*="container"],
            body.light-theme [class*="panel"],
            body.light-theme [class*="section"],
            body.light-theme [class*="box"],
            body.light-theme [class*="item"] {
                background: #f0f4e8 !important;
                border: 1px solid #84cc16 !important;
                color: #1a202c !important;
            }
            
            /* Accent Colors - Olive Green Theme */
            body.light-theme .stat-value,
            body.light-theme #totalTime,
            body.light-theme .time-value {
                color: #65a30d !important; /* Vibrant olive green */
            }
            
            /* Interactive Elements - Olive Green Buttons */
            body.light-theme .action-btn,
            body.light-theme .time-btn,
            body.light-theme button:not(.simple-theme-toggle) {
                background: #ecfccb !important; /* Very light olive green */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #365314 !important; /* Dark olive green text */
                transition: all 0.2s ease !important;
            }
            
            body.light-theme .action-btn:hover,
            body.light-theme .time-btn:hover,
            body.light-theme button:not(.simple-theme-toggle):hover {
                background: #d9f99d !important; /* Medium light olive green */
                border-color: #65a30d !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 6px rgba(132, 204, 22, 0.2) !important;
            }
            
            body.light-theme .time-btn.active {
                background: #65a30d !important;
                color: #ffffff !important;
                border-color: #65a30d !important;
                box-shadow: 0 4px 14px rgba(101, 163, 13, 0.25) !important;
            }
            
            /* List Items and Site Items - Olive Green Theme */
            body.light-theme .site-item,
            body.light-theme .app-item {
                background: #ecfccb !important; /* Very light olive green */
                border: 1px solid #a3e635 !important; /* Light olive green border */
                color: #1a202c !important;
            }
            
            body.light-theme .site-item:hover,
            body.light-theme .app-item:hover {
                background: #d9f99d !important; /* Medium light olive green */
                border-color: #84cc16 !important;
                transform: translateY(-1px) !important;
            }
            
            /* Country Flags Container - Olive Green */
            body.light-theme .selected-flag {
                background: #f0f4e8 !important; /* Light olive green */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #1a202c !important;
            }
            
            /* Theme Toggle Button Styling - Olive Green */
            body.light-theme .simple-theme-toggle,
            body.light-theme #theme-toggle,
            body.light-theme #simpleThemeToggle {
                background: #ecfccb !important; /* Very light olive green */
                border: 2px solid #84cc16 !important; /* Olive green border */
                color: #365314 !important; /* Dark olive green text */
                box-shadow: 0 2px 4px rgba(132, 204, 22, 0.2) !important;
                border-radius: 25px !important;
                padding: 8px 16px !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            
            body.light-theme .simple-theme-toggle:hover,
            body.light-theme #theme-toggle:hover,
            body.light-theme #simpleThemeToggle:hover {
                background: #d9f99d !important; /* Medium light olive green */
                border-color: #65a30d !important;
                box-shadow: 0 4px 6px rgba(132, 204, 22, 0.3) !important;
                transform: translateY(-1px) !important;
            }
            
            /* Form Elements - Olive Green Theme */
            body.light-theme input,
            body.light-theme select,
            body.light-theme textarea {
                background: #ecfccb !important; /* Very light olive green */
                border: 1px solid #84cc16 !important; /* Olive green border */
                color: #365314 !important; /* Dark olive green text */
            }
            
            body.light-theme input:focus,
            body.light-theme select:focus,
            body.light-theme textarea:focus {
                border-color: #65a30d !important;
                box-shadow: 0 0 0 3px rgba(101, 163, 13, 0.1) !important;
            }
            
            /* Links - Olive Green */
            body.light-theme a {
                color: #65a30d !important;
            }
            
            body.light-theme a:hover {
                color: #4d7c0f !important;
            }
            
            /* Tables - Olive Green Theme */
            body.light-theme table {
                background: #f0f4e8 !important; /* Light olive green */
            }
            
            body.light-theme th {
                background: #ecfccb !important; /* Very light olive green */
                color: #365314 !important; /* Dark olive green text */
                border-bottom: 2px solid #84cc16 !important; /* Olive green border */
            }
            
            body.light-theme td {
                color: #1a202c !important;
                border-bottom: 1px solid #a3e635 !important; /* Light olive green border */
            }
            
            /* Charts and Data Visualization - Olive Green */
            body.light-theme .chart-container canvas {
                background: #f0f4e8 !important; /* Light olive green */
            }
            
            /* Chart Text and Labels - Make All Text Visible */
            body.light-theme .chart-container,
            body.light-theme .chart-container * {
                color: #1a202c !important; /* Dark text for all chart elements */
            }
            
            /* Pie Chart Text */
            body.light-theme .chart-container text,
            body.light-theme canvas + * text,
            body.light-theme .chartjs-tooltip,
            body.light-theme .chartjs-tooltip * {
                fill: #1a202c !important; /* SVG text fill */
                color: #1a202c !important; /* Regular text color */
            }
            
            /* Chart.js specific overrides */
            body.light-theme .chartjs-render-monitor,
            body.light-theme .chartjs-size-monitor {
                color: #1a202c !important;
            }
            
            /* Force all chart text elements to be dark */
            body.light-theme canvas,
            body.light-theme canvas * {
                color: #1a202c !important;
            }
            
            /* Chart legends and labels */
            body.light-theme .chart-legend,
            body.light-theme .chart-legend *,
            body.light-theme .chart-labels,
            body.light-theme .chart-labels * {
                color: #1a202c !important;
            }
            
            /* Override any white text in charts */
            body.light-theme [fill="white"],
            body.light-theme [fill="#fff"],
            body.light-theme [fill="#ffffff"] {
                fill: #1a202c !important;
            }
            
            body.light-theme [color="white"],
            body.light-theme [color="#fff"],
            body.light-theme [color="#ffffff"] {
                color: #1a202c !important;
            }
            
            /* Comprehensive Chart Legend Text Targeting */
            body.light-theme .chart-container ul,
            body.light-theme .chart-container ul li,
            body.light-theme .chart-container ul li span,
            body.light-theme .chart-container .chartjs-legend,
            body.light-theme .chart-container .chartjs-legend-item,
            body.light-theme .chart-container .chartjs-legend-text,
            body.light-theme .chart-container [class*="legend"],
            body.light-theme .chart-container [class*="chartjs"],
            body.light-theme .chart-container div,
            body.light-theme .chart-container span {
                color: #1a202c !important;
            }
            
            /* Force all text in chart containers to be dark */
            body.light-theme .chart-container,
            body.light-theme .chart-container * {
                color: #1a202c !important;
            }
            
            /* SVG text elements in charts */
            body.light-theme .chart-container svg text,
            body.light-theme .chart-container text,
            body.light-theme .chart-container tspan {
                fill: #1a202c !important;
                color: #1a202c !important;
            }
            
            /* Progress Bars - Olive Green */
            body.light-theme .progress {
                background: #ecfccb !important; /* Very light olive green */
            }
            
            body.light-theme .progress-bar {
                background: linear-gradient(90deg, #65a30d, #84cc16) !important;
            }
            
            /* Success, Warning, Error States - Keep Original for Clarity */
            body.light-theme .success {
                color: #065f46 !important;
                background: #d1fae5 !important;
                border-color: #a7f3d0 !important;
            }
            
            body.light-theme .warning {
                color: #92400e !important;
                background: #fef3c7 !important;
                border-color: #fde68a !important;
            }
            
            body.light-theme .error {
                color: #991b1b !important;
                background: #fee2e2 !important;
                border-color: #fecaca !important;
            }
            
            /* Built with Bolt Badge - Keep Dark for Contrast */
            body.light-theme .bolt-badge {
                background: #1a202c !important;
                color: #ffffff !important;
                border: 1px solid #374151 !important;
            }
            
            body.light-theme .bolt-badge:hover {
                background: #374151 !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
            }
        `;
        document.head.appendChild(lightThemeStyles);
    }
    
    function removeLightThemeStyles() {
        if (lightThemeStyles) {
            document.head.removeChild(lightThemeStyles);
            lightThemeStyles = null;
        }
    }
    
    function applyTheme(lightMode) {
        console.log('Applying theme:', lightMode ? 'light' : 'dark');
        console.log('Current body className:', body.className);
        
        if (lightMode) {
            // Apply light theme
            if (body.className.indexOf('light-theme') === -1) {
                body.className += ' light-theme';
            }
            createLightThemeStyles();
            if (icon) icon.innerHTML = '☀️';
            if (text) text.innerHTML = 'Light';
            console.log('Applied light theme - body className now:', body.className);
            
            // Update chart text colors for light mode
            updateChartTextColors(true);
        } else {
            // Apply dark theme
            body.className = body.className.replace('light-theme', '').trim();
            removeLightThemeStyles();
            if (icon) icon.innerHTML = '🌙';
            if (text) text.innerHTML = 'Dark';
            console.log('Applied dark theme - body className now:', body.className);
            
            // Update chart text colors for dark mode
            updateChartTextColors(false);
        }
        
        // Apply theme-specific button styling
        if (lightMode) {
            // Light theme button styling is handled in CSS above
        } else {
            // Dark theme button styling
            var themeButtons = document.querySelectorAll('.simple-theme-toggle, #theme-toggle, #simpleThemeToggle');
            for (var i = 0; i < themeButtons.length; i++) {
                var btn = themeButtons[i];
                btn.style.background = '#2d3748';
                btn.style.border = '2px solid #4a5568';
                btn.style.color = '#e2e8f0';
                btn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
                btn.style.borderRadius = '25px';
                btn.style.padding = '8px 16px';
                btn.style.fontSize = '14px';
                btn.style.fontWeight = '500';
                btn.style.cursor = 'pointer';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.gap = '6px';
            }
        }
        
        // Save theme preference to localStorage
        try {
            localStorage.setItem('dashboardTheme', lightMode ? 'light' : 'dark');
            console.log('Theme preference saved:', lightMode ? 'light' : 'dark');
        } catch (e) {
            console.log('Could not save theme preference to localStorage:', e);
        }
    }
    
    function updateChartTextColors(isLightMode) {
        // Wait a bit for charts to render, then update text colors
        setTimeout(function() {
            try {
                // Update all text elements in charts
                var chartTexts = document.querySelectorAll('.chart-container text, canvas + * text, .chartjs-tooltip, .chartjs-tooltip *');
                for (var i = 0; i < chartTexts.length; i++) {
                    if (isLightMode) {
                        chartTexts[i].style.fill = '#1a202c'; // Dark text for light mode
                        chartTexts[i].style.color = '#1a202c';
                    } else {
                        chartTexts[i].style.fill = '#ffffff'; // White text for dark mode
                        chartTexts[i].style.color = '#ffffff';
                    }
                }
                
                // Update SVG text elements specifically
                var svgTexts = document.querySelectorAll('svg text');
                for (var j = 0; j < svgTexts.length; j++) {
                    if (isLightMode) {
                        svgTexts[j].setAttribute('fill', '#1a202c'); // Dark text for light mode
                        svgTexts[j].style.fill = '#1a202c';
                    } else {
                        svgTexts[j].setAttribute('fill', '#ffffff'); // White text for dark mode
                        svgTexts[j].style.fill = '#ffffff';
                    }
                }
                
                // Update Chart.js legend text specifically
                var legendTexts = document.querySelectorAll('.chart-container .chartjs-legend, .chart-container .chartjs-legend-item, .chart-container .chartjs-legend-text');
                for (var l = 0; l < legendTexts.length; l++) {
                    if (isLightMode) {
                        legendTexts[l].style.color = '#1a202c !important';
                    } else {
                        legendTexts[l].style.color = '#ffffff !important';
                    }
                }
                
                // Force redraw of charts if Chart.js is available
                if (typeof Chart !== 'undefined' && Chart.instances) {
                    for (var chartId in Chart.instances) {
                        var chart = Chart.instances[chartId];
                        if (chart && chart.options) {
                            // Update legend colors
                            if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                                if (isLightMode) {
                                    chart.options.plugins.legend.labels.color = '#1a202c'; // Dark text for light mode
                                } else {
                                    chart.options.plugins.legend.labels.color = '#ffffff'; // White text for dark mode
                                }
                            }
                            
                            // Update scale colors
                            if (chart.options.scales) {
                                if (chart.options.scales.x && chart.options.scales.x.ticks) {
                                    chart.options.scales.x.ticks.color = isLightMode ? '#1a202c' : '#ffffff';
                                }
                                if (chart.options.scales.y && chart.options.scales.y.ticks) {
                                    chart.options.scales.y.ticks.color = isLightMode ? '#1a202c' : '#ffffff';
                                }
                            }
                            
                            chart.update('none'); // Update without animation
                        }
                    }
                }
                
                console.log('Updated chart text colors for', isLightMode ? 'light' : 'dark', 'mode');
            } catch (e) {
                console.log('Error updating chart text colors:', e);
            }
        }, 500); // Wait 500ms for charts to render
        
        // Also try again after a longer delay for slow-loading charts
        setTimeout(function() {
            try {
                // Find all chart containers and update their text colors
                var chartContainers = document.querySelectorAll('.chart-container');
                for (var c = 0; c < chartContainers.length; c++) {
                    var allTexts = chartContainers[c].querySelectorAll('*');
                    for (var k = 0; k < allTexts.length; k++) {
                        var element = allTexts[k];
                        var computedStyle = window.getComputedStyle(element);
                        
                        if (isLightMode) {
                            // In light mode, change white text to black
                            if (computedStyle.color === 'rgb(255, 255, 255)' || element.style.color === 'white' || element.style.color === '#ffffff' || element.style.color === '#fff') {
                                element.style.color = '#1a202c !important';
                            }
                            if (computedStyle.fill === 'rgb(255, 255, 255)' || element.style.fill === 'white' || element.style.fill === '#ffffff' || element.style.fill === '#fff') {
                                element.style.fill = '#1a202c !important';
                                element.setAttribute('fill', '#1a202c');
                            }
                        } else {
                            // In dark mode, ensure text is white
                            if (computedStyle.color === 'rgb(26, 32, 44)' || element.style.color === '#1a202c' || element.style.color === 'black' || element.style.color === '#000000') {
                                element.style.color = '#ffffff !important';
                            }
                            if (computedStyle.fill === 'rgb(26, 32, 44)' || element.style.fill === '#1a202c' || element.style.fill === 'black' || element.style.fill === '#000000') {
                                element.style.fill = '#ffffff !important';
                                element.setAttribute('fill', '#ffffff');
                            }
                        }
                    }
                }
                
                // Additional specific targeting for Chart.js elements
                var chartjsElements = document.querySelectorAll('[class*="chartjs"], [class*="chart-"]');
                for (var cj = 0; cj < chartjsElements.length; cj++) {
                    if (isLightMode) {
                        chartjsElements[cj].style.color = '#1a202c !important';
                    } else {
                        chartjsElements[cj].style.color = '#ffffff !important';
                    }
                }
                
                console.log('Completed delayed chart text color update');
            } catch (e) {
                console.log('Error in delayed chart text update:', e);
            }
        }, 2000); // Wait 2 seconds for all charts to fully load
        
        // Final attempt after 3 seconds for very slow charts
        setTimeout(function() {
            try {
                if (typeof Chart !== 'undefined' && Chart.instances) {
                    for (var chartId in Chart.instances) {
                        var chart = Chart.instances[chartId];
                        if (chart && chart.options && chart.options.plugins && chart.options.plugins.legend) {
                            chart.options.plugins.legend.labels.color = isLightMode ? '#1a202c' : '#ffffff';
                            chart.update('none');
                        }
                    }
                }
            } catch (e) {
                console.log('Error in final chart update:', e);
            }
        }, 3000);
    }
    
    // Apply initial theme on page load
    applyTheme(isLight);
    
    // Button click handler
    button.onclick = function() {
        console.log('Theme toggle clicked');
        
        // Add loading state
        var originalText = text.innerHTML;
        if (text) text.innerHTML = '...';
        button.style.opacity = '0.7';
        
        // Toggle theme
        isLight = !isLight;
        
        // Apply theme with a slight delay for visual feedback
        setTimeout(function() {
            applyTheme(isLight);
            
            // Reset button state
            button.style.opacity = '1';
            
            // Visual feedback
            button.style.transform = 'scale(0.95)';
            setTimeout(function() {
                button.style.transform = 'scale(1)';
            }, 100);
        }, 50);
        
        // Broadcast theme change to other tabs/windows
        try {
            localStorage.setItem('themeChangeTimestamp', Date.now().toString());
            console.log('Theme change broadcasted to other tabs');
        } catch (e) {
            console.log('Could not broadcast theme change');
        }
    };
    
    // Listen for theme changes from other tabs/windows
    try {
        window.addEventListener('storage', function(e) {
            if (e.key === 'dashboardTheme') {
                var newTheme = e.newValue;
                console.log('Theme change detected from another tab:', newTheme);
                isLight = newTheme === 'light';
                applyTheme(isLight);
            }
        });
        console.log('Cross-tab theme synchronization enabled');
    } catch (e) {
        console.log('Could not set up cross-tab theme sync');
    }
    
    console.log('Universal theme toggle is ready! Current theme:', isLight ? 'light' : 'dark');
}

// Initialize theme toggle when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeToggle);
} else {
    initializeThemeToggle();
}

// Also try on window load as fallback
window.addEventListener('load', function() {
    // Only initialize if not already done
    var button = document.getElementById('theme-toggle') || document.getElementById('simpleThemeToggle');
    if (button && !button.onclick) {
        console.log('Fallback theme toggle initialization');
        initializeThemeToggle();
    }
});

// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const body = document.body;

    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Show notification
            showNotification(`Switched to ${newTheme} mode`);
        });
    }

    function setTheme(theme) {
        if (theme === 'light') {
            body.classList.add('light-theme');
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = 'Light';
            
            // Update CSS custom properties for light theme
            document.documentElement.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #f0f9ff 100%)');
            document.documentElement.style.setProperty('--text-color', '#1f2937');
            document.documentElement.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.8)');
            document.documentElement.style.setProperty('--border-color', 'rgba(156, 163, 175, 0.3)');
        } else {
            body.classList.remove('light-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = 'Dark';
            
            // Reset to default dark theme
            document.documentElement.style.removeProperty('--bg-gradient');
            document.documentElement.style.removeProperty('--text-color');
            document.documentElement.style.removeProperty('--card-bg');
            document.documentElement.style.removeProperty('--border-color');
        }
    }

    // Function to show notification (defined here if not available globally)
    function showNotification(message) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message);
        } else {
            // Fallback notification
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
                setTimeout(() => notification.remove(), 400);
            }, 3000);
        }
    }
}); 