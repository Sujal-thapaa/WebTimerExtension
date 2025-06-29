// Demo data for TimeSetu dashboard

// Migration function to handle old localStorage keys
function migrateLocalStorageKeys() {
    const oldPrefix = 'webtimewise_';
    const newPrefix = 'timesetu_';
    
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Find keys that start with the old prefix
    const oldKeys = keys.filter(key => key.startsWith(oldPrefix));
    
    // Migrate each old key to the new prefix
    oldKeys.forEach(oldKey => {
        const newKey = oldKey.replace(oldPrefix, newPrefix);
        const value = localStorage.getItem(oldKey);
        
        // Only migrate if the new key doesn't already exist
        if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, value);
        }
        
        // Remove the old key
        localStorage.removeItem(oldKey);
    });
    
    if (oldKeys.length > 0) {
        console.log(`Migrated ${oldKeys.length} localStorage keys from ${oldPrefix} to ${newPrefix}`);
    }
}

// Run migration on load
migrateLocalStorageKeys();

const DEMO_SCENARIOS = {
    productive: {
        name: "📚 Productive Day",
        timeData: {
            "2025-06-22": {
                sites: {
                    "github.com": 7200000, // 2 hours
                    "stackoverflow.com": 3600000, // 1 hour
                    "docs.google.com": 5400000, // 1.5 hours
                    "notion.so": 3600000, // 1 hour
                    "leetcode.com": 1800000, // 30 minutes
                    "chat.openai.com": 1800000, // 30 minutes
                    "wikipedia.org": 900000, // 15 minutes
                    "medium.com": 900000 // 15 minutes
                },
                categories: {
                    "Productive / Educational": 23400000, // 6.5 hours
                    "News": 900000, // 15 minutes
                    "Other / Uncategorized": 900000 // 15 minutes
                }
            }
        },
        goals: {
            productiveHours: 4,
            entertainmentHours: 2,
            socialMediaHours: 1,
            streak: 5
        }
    },
    
    social: {
        name: "📱 Social Media Day",
        timeData: {
            "2025-06-22": {
                sites: {
                    "facebook.com": 7200000, // 2 hours
                    "instagram.com": 5400000, // 1.5 hours
                    "twitter.com": 3600000, // 1 hour
                    "tiktok.com": 5400000, // 1.5 hours
                    "reddit.com": 1800000, // 30 minutes
                    "youtube.com": 3600000, // 1 hour
                    "netflix.com": 1800000, // 30 minutes
                    "spotify.com": 900000 // 15 minutes
                },
                categories: {
                    "Social Media": 19800000, // 5.5 hours
                    "Entertainment": 6300000, // 1.75 hours
                    "Other / Uncategorized": 900000 // 15 minutes
                }
            }
        },
        goals: {
            productiveHours: 2,
            entertainmentHours: 3,
            socialMediaHours: 4,
            streak: 1
        }
    },
    
    mixed: {
        name: "🔄 Mixed Usage",
        timeData: {
            "2025-06-22": {
                sites: {
                    "github.com": 3600000, // 1 hour
                    "youtube.com": 5400000, // 1.5 hours
                    "facebook.com": 1800000, // 30 minutes
                    "stackoverflow.com": 1800000, // 30 minutes
                    "netflix.com": 3600000, // 1 hour
                    "docs.google.com": 2700000, // 45 minutes
                    "instagram.com": 1800000, // 30 minutes
                    "wikipedia.org": 900000, // 15 minutes
                    "amazon.com": 900000, // 15 minutes
                    "reddit.com": 900000 // 15 minutes
                },
                categories: {
                    "Productive / Educational": 9000000, // 2.5 hours
                    "Entertainment": 9000000, // 2.5 hours
                    "Social Media": 3600000, // 1 hour
                    "Shopping": 900000, // 15 minutes
                    "Other / Uncategorized": 900000 // 15 minutes
                }
            }
        },
        goals: {
            productiveHours: 3,
            entertainmentHours: 2,
            socialMediaHours: 2,
            streak: 3
        }
    },
    
    gaming: {
        name: "🎮 Gaming Day",
        timeData: {
            "2025-06-22": {
                sites: {
                    "twitch.tv": 7200000, // 2 hours
                    "steampowered.com": 5400000, // 1.5 hours
                    "roblox.com": 3600000, // 1 hour
                    "epicgames.com": 1800000, // 30 minutes
                    "chess.com": 1800000, // 30 minutes
                    "youtube.com": 3600000, // 1 hour (gaming content)
                    "reddit.com": 1800000, // 30 minutes (gaming subreddits)
                    "discord.com": 1800000, // 30 minutes
                    "github.com": 900000, // 15 minutes
                    "stackoverflow.com": 900000 // 15 minutes
                },
                categories: {
                    "Games": 19800000, // 5.5 hours
                    "Entertainment": 5400000, // 1.5 hours
                    "Social Media": 1800000, // 30 minutes
                    "Productive / Educational": 1800000 // 30 minutes
                }
            }
        },
        goals: {
            productiveHours: 1,
            entertainmentHours: 4,
            socialMediaHours: 1,
            streak: 2
        }
    },
    
    work: {
        name: "💼 Work Day",
        timeData: {
            "2025-06-22": {
                sites: {
                    "slack.com": 7200000, // 2 hours
                    "docs.google.com": 5400000, // 1.5 hours
                    "trello.com": 3600000, // 1 hour
                    "github.com": 3600000, // 1 hour
                    "linkedin.com": 1800000, // 30 minutes
                    "stackoverflow.com": 1800000, // 30 minutes
                    "notion.so": 2700000, // 45 minutes
                    "zoom.us": 1800000, // 30 minutes
                    "gmail.com": 900000, // 15 minutes
                    "calendar.google.com": 900000, // 15 minutes
                    "youtube.com": 900000, // 15 minutes (break)
                    "facebook.com": 900000 // 15 minutes (break)
                },
                categories: {
                    "Productive / Educational": 27000000, // 7.5 hours
                    "Social Media": 1800000, // 30 minutes
                    "Entertainment": 900000, // 15 minutes
                    "Other / Uncategorized": 900000 // 15 minutes
                }
            }
        },
        goals: {
            productiveHours: 6,
            entertainmentHours: 1,
            socialMediaHours: 1,
            streak: 7
        }
    }
};

// Demo categories
const DEMO_CATEGORIES = {
    'Productive / Educational': {
        description: 'Websites that promote learning, work, coding, and personal growth',
        examples: ['wikipedia.org','khanacademy.org','coursera.org','udemy.com','edx.org','leetcode.com','notion.so','trello.com','slack.com','linkedin.com','docs.google.com','chat.openai.com']
    },
    'Entertainment': {
        description: 'Time-pass, media consumption, and fun-focused websites',
        examples: ['youtube.com','netflix.com','spotify.com','twitch.tv','hotstar.com','primevideo.com','disneyplus.com','9gag.com']
    },
    'News': {
        description: 'Websites focused on current events, politics, and general news',
        examples: ['cnn.com','bbc.com','nytimes.com','reuters.com','foxnews.com','aljazeera.com']
    },
    'Social Media': {
        description: 'Websites focused on social interaction and communication',
        examples: ['facebook.com','instagram.com','twitter.com','tiktok.com','snapchat.com','linkedin.com','reddit.com','pinterest.com']
    },
    'Games': {
        description: 'Online gaming platforms or game-related content',
        examples: ['roblox.com','epicgames.com','steampowered.com','miniclip.com','ign.com','chess.com']
    },
    'Shopping': {
        description: 'E-commerce and online retail platforms',
        examples: ['amazon.com','ebay.com','aliexpress.com','walmart.com','flipkart.com','etsy.com']
    },
    'Other / Uncategorized': {
        description: 'Anything that doesn\'t clearly fit the above or is new/unknown',
        examples: ['medium.com','quora.com','openai.com','duckduckgo.com']
    }
};

// Demo blocked sites
const DEMO_BLOCKED_SITES = [
    { url: 'facebook.com', expiresAt: Date.now() + 86400000 },
    { url: 'instagram.com', expiresAt: Date.now() + 86400000 },
    { url: 'tiktok.com', expiresAt: Date.now() + 86400000 }
];

// Demo focus block list
const DEMO_FOCUS_BLOCK_LIST = ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'youtube.com'];

// Current demo scenario
let currentScenario = 'productive';

// Function to load demo data
function loadDemoData(scenario) {
    currentScenario = scenario;
    
    // Update active button
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Store demo data in localStorage
    const demoData = DEMO_SCENARIOS[scenario];
    localStorage.setItem('timesetu_timeData', JSON.stringify(demoData.timeData));
    localStorage.setItem('timesetu_goals', JSON.stringify(demoData.goals));
    localStorage.setItem('timesetu_categories', JSON.stringify(DEMO_CATEGORIES));
    localStorage.setItem('timesetu_blockedSites', JSON.stringify(DEMO_BLOCKED_SITES));
    localStorage.setItem('timesetu_focusBlockList', JSON.stringify(DEMO_FOCUS_BLOCK_LIST));
    
    // Mark as demo data
    localStorage.setItem('timesetu_demoMode', 'true');
    localStorage.setItem('timesetu_demoScenario', scenario);
    
    // Refresh the dashboard
    if (window.loadData) {
        window.loadData('today');
    }
    
    // Show notification
    showDemoNotification(`Loaded ${demoData.name} scenario`);
}

// Function to show demo notifications
function showDemoNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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
`;
document.head.appendChild(style);

// Override chrome.storage.local.get for demo mode
if (typeof chrome !== 'undefined' && chrome.storage) {
    const originalGet = chrome.storage.local.get;
    chrome.storage.local.get = function(keys, callback) {
        const result = {};
        
        if (typeof keys === 'string') {
            keys = [keys];
        }
        
        if (Array.isArray(keys)) {
            keys.forEach(key => {
                const data = localStorage.getItem(`timesetu_${key}`);
                if (data) {
                    try {
                        result[key] = JSON.parse(data);
                    } catch (e) {
                        result[key] = data;
                    }
                }
            });
        } else if (typeof keys === 'object') {
            Object.keys(keys).forEach(key => {
                const data = localStorage.getItem(`timesetu_${key}`);
                if (data) {
                    try {
                        result[key] = JSON.parse(data);
                    } catch (e) {
                        result[key] = keys[key]; // default value
                    }
                } else {
                    result[key] = keys[key]; // default value
                }
            });
        }
        
        if (callback) {
            callback(result);
        }
        return Promise.resolve(result);
    };
}

// Initialize demo data on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load default scenario
    loadDemoData('productive');
    
    // Add demo mode indicator
    const demoIndicator = document.createElement('div');
    demoIndicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(255, 193, 7, 0.9);
        color: #333;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    demoIndicator.textContent = '🎮 Demo Mode';
    document.body.appendChild(demoIndicator);
});

// Export for use in other scripts
window.DEMO_SCENARIOS = DEMO_SCENARIOS;
window.loadDemoData = loadDemoData; 