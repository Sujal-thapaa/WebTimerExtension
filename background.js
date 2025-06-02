// Categories configuration with descriptions
const SITE_CATEGORIES = {
  'Social Media': {
    description: 'Platforms mainly used for networking and communication',
    examples: ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'messenger.com', 'snapchat.com']
  },
  'Entertainment': {
    description: 'Streaming, video, music, memes, etc.',
    examples: ['youtube.com', 'twitch.tv', 'netflix.com', 'spotify.com', 'reddit.com']
  },
  'Gaming': {
    description: 'Online games, game platforms, or related sites',
    examples: ['chess.com', 'lichess.org', 'roblox.com', 'epicgames.com', 'steampowered.com']
  },
  'Productive / Educational': {
    description: 'Study, work, learning platforms, research',
    examples: ['khanacademy.org', 'coursera.org', 'edx.org', 'chat.openai.com', 'docs.google.com', 'notion.so']
  },
  'Shopping / E-commerce': {
    description: 'Online shopping and marketplaces',
    examples: ['amazon.com', 'ebay.com', 'walmart.com', 'flipkart.com', 'aliexpress.com']
  },
  'News & Blogs': {
    description: 'Informational, article-based sites',
    examples: ['nytimes.com', 'bbc.com', 'medium.com', 'cnn.com']
  },
  'Email / Communication': {
    description: 'Communication tools',
    examples: ['gmail.com', 'outlook.com', 'slack.com', 'zoom.us', 'teams.microsoft.com']
  },
  'Other': {
    description: 'Anything that doesn\'t fall into the above categories',
    examples: []
  }
};

// Enhanced category keywords for better free categorization
const CATEGORY_KEYWORDS = {
  'Social Media': {
    keywords: [
      'social', 'network', 'friend', 'share', 'post', 'follow', 'like', 'comment',
      'profile', 'status', 'feed', 'timeline', 'community', 'connect', 'message',
      'dm', 'story', 'reel', 'tweet', 'viral', 'trending'
    ],
    domains: [
      'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'tiktok.com',
      'snapchat.com', 'pinterest.com', 'reddit.com', 'tumblr.com', 'threads.net'
    ]
  },
  'Entertainment': {
    keywords: [
      'video', 'watch', 'stream', 'music', 'movie', 'show', 'play', 'listen',
      'episode', 'series', 'channel', 'subscribe', 'playlist', 'artist', 'album',
      'entertainment', 'fun', 'comedy', 'drama', 'anime'
    ],
    domains: [
      'youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv', 'hulu.com',
      'disney.com', 'vimeo.com', 'soundcloud.com', 'dailymotion.com'
    ]
  },
  'Gaming': {
    keywords: [
      'game', 'play', 'score', 'level', 'multiplayer', 'tournament', 'player',
      'gaming', 'esports', 'achievement', 'leaderboard', 'match', 'battle',
      'quest', 'mission', 'strategy', 'rpg', 'mmorpg', 'fps', 'puzzle'
    ],
    domains: [
      'chess.com', 'lichess.org', 'roblox.com', 'steam.com', 'epicgames.com',
      'blizzard.com', 'playstation.com', 'xbox.com', 'nintendo.com'
    ]
  },
  'Productive / Educational': {
    keywords: [
      'learn', 'study', 'course', 'education', 'work', 'document', 'research',
      'tutorial', 'lesson', 'lecture', 'assignment', 'project', 'homework',
      'productivity', 'task', 'organize', 'note', 'calendar', 'meeting', 'class',
      'university', 'school', 'college', 'academic', 'science', 'math'
    ],
    domains: [
      'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'duolingo.com',
      'github.com', 'stackoverflow.com', 'docs.google.com', 'notion.so', 'trello.com',
      'asana.com', 'jira.com', 'clickup.com', 'monday.com', 'miro.com'
    ]
  },
  'Email / Communication': {
    keywords: [
      'mail', 'email', 'message', 'chat', 'communicate', 'meet', 'conference',
      'inbox', 'compose', 'send', 'receive', 'contact', 'calendar', 'schedule',
      'team', 'collaboration', 'meeting', 'call', 'video chat', 'voice'
    ],
    domains: [
      'gmail.com', 'outlook.com', 'yahoo.com', 'zoom.us', 'teams.microsoft.com',
      'slack.com', 'discord.com', 'skype.com', 'telegram.org', 'protonmail.com',
      'meet.google.com', 'webex.com', 'hotmail.com'
    ]
  },
  'Shopping / E-commerce': {
    keywords: [
      'shop', 'buy', 'price', 'cart', 'checkout', 'store', 'product', 'order',
      'shipping', 'discount', 'deal', 'sale', 'offer', 'purchase', 'item',
      'marketplace', 'seller', 'buyer', 'retail', 'brand', 'collection'
    ],
    domains: [
      'amazon.com', 'ebay.com', 'walmart.com', 'etsy.com', 'aliexpress.com',
      'bestbuy.com', 'target.com', 'shopify.com', 'wish.com'
    ]
  },
  'News & Blogs': {
    keywords: [
      'news', 'article', 'blog', 'post', 'report', 'update', 'latest',
      'headline', 'breaking', 'politics', 'economy', 'world', 'local',
      'opinion', 'editorial', 'journalist', 'media', 'press', 'magazine'
    ],
    domains: [
      'nytimes.com', 'bbc.com', 'cnn.com', 'reuters.com', 'medium.com',
      'wordpress.com', 'blogger.com', 'huffpost.com', 'theguardian.com'
    ]
  }
};

// Track current active tab
let currentTab = null;
let trackingStartTime = null;
let isTracking = false;
let trackingInterval = null;

// Debug function to log storage state
async function logStorageState(message) {
  const storage = await chrome.storage.local.get(null);
  console.log('Storage state (' + message + '):', storage);
}

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Initialize storage with default categories if not exists
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
  try {
    // Clear existing data for testing
    await chrome.storage.local.clear();
    
    // Initialize categories
    await chrome.storage.local.set({ categories: SITE_CATEGORIES });
    console.log('Default categories initialized');

    // Initialize empty time data for today
    const today = getTodayDate();
    await chrome.storage.local.set({
      timeData: {
        [today]: {
          sites: {},
          categories: {},
          lastUpdated: Date.now()
        }
      }
    });
    console.log('Time data initialized for today:', today);

    // Initialize goals
    await chrome.storage.local.set({
      goals: {
        productiveHours: 4,
        entertainmentHours: 2,
        streak: 0
      }
    });
    console.log('Default goals initialized');

    // Set up daily notification alarm
    chrome.alarms.create('dailySummary', {
      periodInMinutes: 1440 // 24 hours
    });
    console.log('Daily summary alarm created');

    await logStorageState('after initialization');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

// Function to check if we should track a URL
function shouldTrackUrl(url) {
  try {
    if (!url) {
      console.log('URL is empty');
      return false;
    }
    
    // Skip browser-specific URLs
    if (url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') || 
        url.startsWith('about:')) {
      console.log('Skipping browser-specific URL');
      return false;
    }

    // Accept all other URLs
    console.log('URL is trackable:', url);
    return true;

  } catch (error) {
    console.error('Error in shouldTrackUrl:', error);
    return false;
  }
}

// Function to get domain from URL
function getDomainFromUrl(url) {
  try {
    if (!url) return null;
    
    // Handle URLs without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    console.log('Extracted domain:', domain);
    return domain;
  } catch (error) {
    console.error('Error getting domain from URL:', error);
    return url.toLowerCase(); // Fallback to using the URL as is
  }
}

// Improved content analysis function
function analyzeContent(content) {
  try {
    // Combine all content fields and convert to lowercase
    const text = `${content.title} ${content.metaDescription} ${content.metaKeywords} ${content.headings} ${content.mainContent}`.toLowerCase();
    const domain = getDomainFromUrl(content.url)?.toLowerCase();

    // Initialize scores for each category
    const scores = {};
    for (const category in CATEGORY_KEYWORDS) {
      scores[category] = 0;
      
      // Check domain matches
      if (domain && CATEGORY_KEYWORDS[category].domains.some(d => 
        domain.includes(d) || d.includes(domain)
      )) {
        scores[category] += 10; // High weight for domain match
      }

      // Check keyword matches with weighted scoring
      const keywords = CATEGORY_KEYWORDS[category].keywords;
      for (const keyword of keywords) {
        // Count occurrences of each keyword
        const regex = new RegExp(keyword, 'gi');
        const matches = (text.match(regex) || []).length;
        
        // Add weighted score based on matches
        if (matches > 0) {
          // Title matches are worth more
          const titleMatches = (content.title.toLowerCase().match(regex) || []).length;
          scores[category] += titleMatches * 3; // Triple points for title matches
          
          // Regular content matches
          scores[category] += matches;
        }
      }
    }

    // Find category with highest score
    let bestCategory = 'Other';
    let highestScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }

    // Only categorize if we have a reasonable confidence (score > threshold)
    return highestScore > 2 ? bestCategory : 'Other';
  } catch (error) {
    console.error('Error in content analysis:', error);
    return 'Other';
  }
}

// Update extractPageContent to include URL
async function extractPageContent(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        // Get visible text content
        const getVisibleText = (element) => {
          if (!element) return '';
          if (element.style && (element.style.display === 'none' || element.style.visibility === 'hidden')) return '';
          
          let text = '';
          for (let child of element.childNodes) {
            if (child.nodeType === 3) { // Text node
              text += child.textContent.trim() + ' ';
            } else if (child.nodeType === 1) { // Element node
              text += getVisibleText(child) + ' ';
            }
          }
          return text.trim();
        };

        // Get meta description and keywords
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
        const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
        
        // Get main content
        const mainContent = getVisibleText(document.body);
        const title = document.title;
        
        // Get h1, h2, h3 headings
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent.trim())
          .join(' ');

        return {
          title,
          metaDescription,
          metaKeywords,
          headings,
          mainContent: mainContent.substring(0, 1000), // Limit content length
          url: window.location.href
        };
      }
    });

    return result[0].result;
  } catch (error) {
    console.error('Error extracting page content:', error);
    return null;
  }
}

// Update getCategoryForDomain to use content analysis
async function getCategoryForDomain(domain, tabId) {
  try {
    if (!domain) return 'Other';

    // First check if we have a cached category
    const { categorizedDomains = {} } = await chrome.storage.local.get('categorizedDomains');
    if (categorizedDomains[domain]) {
      console.log(`Using cached category for ${domain}: ${categorizedDomains[domain]}`);
      return categorizedDomains[domain];
    }

    // Check for exact domain matches first
    for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
      if (data.domains.some(d => domain.includes(d) || d.includes(domain))) {
        console.log(`Found domain match for ${domain} in category ${category}`);
        categorizedDomains[domain] = category;
        await chrome.storage.local.set({ categorizedDomains });
        return category;
      }
    }

    // If no domain match, analyze page content
    const content = await extractPageContent(tabId);
    if (!content) {
      console.log('No content available for analysis');
      return 'Other';
    }

    // Combine all text content for analysis
    const text = `${content.title} ${content.metaDescription} ${content.metaKeywords} ${content.headings}`.toLowerCase();

    // Score each category based on keyword matches
    let bestMatch = { category: 'Other', score: 0 };

    for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const keyword of data.keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = (text.match(regex) || []).length;
        if (matches > 0) {
          score += matches;
          // Give extra weight to keywords in title
          if (content.title.toLowerCase().includes(keyword)) {
            score += 2;
          }
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    console.log(`Categorized ${domain} as ${bestMatch.category} with score ${bestMatch.score}`);
    
    // Cache the result if we have a good match
    if (bestMatch.score > 0) {
      categorizedDomains[domain] = bestMatch.category;
      await chrome.storage.local.set({ categorizedDomains });
    }

    return bestMatch.category;
  } catch (error) {
    console.error('Error categorizing domain:', error);
    return 'Other';
  }
}

// Function to get active tab
async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (error) {
    console.error('Error getting active tab:', error);
    return null;
  }
}

// Initialize tracking on extension load
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension started up');
  await initializeTracking();
});

// Track on install/update
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
  await initializeTracking();
});

// Initialize tracking for current tab
async function initializeTracking() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs[0]) {
      console.log('Initializing tracking for current tab:', tabs[0].url);
      await startTracking(tabs[0]);
    }
  } catch (error) {
    console.error('Error initializing tracking:', error);
  }
}

// Handle tab updates (including initial load)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId, changeInfo.status, tab.url);
  
  // Check if this is the active tab
  const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const isActiveTab = activeTabs[0]?.id === tabId;
  
  if (isActiveTab) {
    if (changeInfo.status === 'complete' && tab.url) {
      console.log('Active tab finished loading:', tab.url);
      await startTracking(tab);
    } else if (changeInfo.url) {
      console.log('Active tab URL changed:', changeInfo.url);
      await stopTracking();
      await startTracking(tab);
    }
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
  try {
    await stopTracking();
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.status === 'complete' && tab.url) {
      console.log('Starting tracking for activated tab:', tab.url);
      await startTracking(tab);
    } else {
      console.log('Waiting for tab to complete loading...');
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Handle window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  console.log('Window focus changed:', windowId);
  try {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      console.log('Window lost focus, stopping tracking');
      await stopTracking();
    } else {
      const tabs = await chrome.tabs.query({ active: true, windowId });
      if (tabs[0] && tabs[0].status === 'complete' && tabs[0].url) {
        console.log('Starting tracking for focused window tab:', tabs[0].url);
        await startTracking(tabs[0]);
      }
    }
  } catch (error) {
    console.error('Error handling window focus change:', error);
  }
});

// Update updateTimeForCurrentTab to use content analysis
async function updateTimeForCurrentTab(tabId) {
  try {
    if (!currentTab || !isTracking || !trackingStartTime) {
      console.log('No active tracking session');
      return;
    }

    const domain = getDomainFromUrl(currentTab.url);
    if (!domain) {
      console.log('Could not get domain from URL');
      return;
    }

    const now = Date.now();
    const timeSpent = now - trackingStartTime;
    trackingStartTime = now;

    console.log(`Updating time for ${domain}: ${timeSpent}ms`);

    const today = getTodayDate();
    console.log('Updating data for date:', today);

    // Get existing time data
    const { timeData = {} } = await chrome.storage.local.get('timeData');
    
    // Initialize today's data if it doesn't exist
    if (!timeData[today]) {
      timeData[today] = { 
        sites: {},
        categories: {},
        lastUpdated: now
      };
    }

    // Update site-specific time
    if (!timeData[today].sites[domain]) {
      timeData[today].sites[domain] = 0;
    }
    timeData[today].sites[domain] += timeSpent;

    // Update category time using AI-based categorization
    const category = await getCategoryForDomain(domain, tabId || currentTab.id);
    if (!timeData[today].categories[category]) {
      timeData[today].categories[category] = 0;
    }
    timeData[today].categories[category] += timeSpent;

    // Update last updated timestamp
    timeData[today].lastUpdated = now;

    // Clean up old data (keep only last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    Object.keys(timeData).forEach(date => {
      if (date < thirtyDaysAgoStr) {
        delete timeData[date];
      }
    });

    await chrome.storage.local.set({ timeData });
    console.log('Time data updated successfully for', today);

  } catch (error) {
    console.error('Error updating time:', error);
  }
}

// Start tracking function
async function startTracking(tab) {
  try {
    if (!tab || !tab.url) {
      console.log('Invalid tab or URL for tracking');
      return;
    }

    // Don't restart tracking if we're already tracking this tab
    if (currentTab && currentTab.id === tab.id && isTracking) {
      console.log('Already tracking this tab:', tab.url);
      return;
    }

    // Stop any existing tracking
    await stopTracking();

    // Check if the URL should be tracked
    if (!shouldTrackUrl(tab.url)) {
      console.log('URL should not be tracked:', tab.url);
      return;
    }

    currentTab = tab;
    trackingStartTime = Date.now();
    isTracking = true;

    const domain = getDomainFromUrl(tab.url);
    console.log(`Started tracking for ${domain}`);

    // Clear any existing interval
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }

    // Set up new tracking interval
    trackingInterval = setInterval(async () => {
      if (isTracking) {
        await updateTimeForCurrentTab(tab.id);
      }
    }, 1000);

    // Initial update with content analysis
    await updateTimeForCurrentTab(tab.id);

  } catch (error) {
    console.error('Error starting tracking:', error);
  }
}

// Stop tracking function
async function stopTracking() {
  try {
    if (isTracking) {
      await updateTimeForCurrentTab(currentTab.id);
    }
    
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
    
    currentTab = null;
    trackingStartTime = null;
    isTracking = false;
    
    console.log('Tracking stopped');
  } catch (error) {
    console.error('Error stopping tracking:', error);
  }
}

// Handle extension unload
chrome.runtime.onSuspend.addListener(async () => {
  await stopTracking();
});

// Handle daily summary notification
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailySummary') {
    const today = getTodayDate();
    const stats = await getDailyStats(today);
    await updateDailyStreak(stats);
    await showDailySummaryNotification(stats);
  }
});

async function getDailyStats(date = getTodayDate()) {
  const { timeData = {} } = await chrome.storage.local.get('timeData');
  return timeData[date] || { sites: {}, categories: {} };
}

async function updateDailyStreak(stats) {
  try {
    const { goals = {} } = await chrome.storage.local.get('goals');
    const productiveTime = (stats.categories['Productive / Educational'] || 0) / (1000 * 60 * 60); // Convert to hours
    const goalHours = goals.productiveHours || 4;

    // Get today's date
    const today = getTodayDate();
    
    // Get last update date
    const { lastStreakUpdate } = await chrome.storage.local.get('lastStreakUpdate');
    
    // Only update streak once per day
    if (lastStreakUpdate !== today) {
      console.log('Updating streak for', today);
      console.log('Productive time:', productiveTime, 'hours');
      console.log('Goal:', goalHours, 'hours');
      
      if (productiveTime >= goalHours) {
        // Goal achieved, increment streak
        goals.streak = (goals.streak || 0) + 1;
        console.log('Daily goal achieved! New streak:', goals.streak);
      } else {
        // Goal not achieved, reset streak
        goals.streak = 0;
        console.log('Daily goal not achieved, streak reset');
      }

      // Save updated streak and last update date
      await chrome.storage.local.set({ 
        goals,
        lastStreakUpdate: today
      });

      // Log the update
      console.log('Streak updated:', goals.streak);
      console.log('Last streak update:', today);
    } else {
      console.log('Streak already updated today');
    }
  } catch (error) {
    console.error('Error updating daily streak:', error);
  }
}

async function showDailySummaryNotification(stats) {
  try {
    const totalTime = Object.values(stats.categories).reduce((a, b) => a + b, 0);
    const hours = Math.floor(totalTime / 3600000);
    const minutes = Math.floor((totalTime % 3600000) / 60000);

    const productiveTime = (stats.categories['Productive / Educational'] || 0) / 3600000;
    const { goals = {} } = await chrome.storage.local.get('goals');
    const goalHours = goals.productiveHours || 4;
    const goalAchieved = productiveTime >= goalHours;

    const message = goalAchieved
      ? `Great job! You spent ${hours}h ${minutes}m online, including ${Math.round(productiveTime)}h on productive tasks. Keep up the ${goals.streak}-day streak! 🎯`
      : `Today you spent ${hours}h ${minutes}m online, with ${Math.round(productiveTime)}h on productive tasks. Goal: ${goalHours}h`;

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Daily Web Usage Summary',
      message
    });
  } catch (error) {
    console.error('Error showing daily summary notification:', error);
  }
} 