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

// Track current active tab and session
let currentTab = null;
let trackingStartTime = null;
let isTracking = false;
let trackingInterval = null;
let currentSession = null;

// Initialize notification state
let notificationsSent = {
  socialMedia: false,
  productive: false,
  goals: new Set()
};

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

// Function to get next midnight timestamp
function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// Function to format time for notifications
function formatTimeForNotification(milliseconds) {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}hr : ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}hr`;
  } else {
    return `${minutes}min`;
  }
}

// Initialize storage with default categories if not exists
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
  try {
    // Get existing data
    const existingData = await chrome.storage.local.get(null);
    const today = getTodayDate();

    // Only initialize if data doesn't exist
    if (!existingData.categories) {
      await chrome.storage.local.set({ categories: SITE_CATEGORIES });
      console.log('Categories initialized');
    }

    // Initialize time data for today if it doesn't exist
    if (!existingData.timeData || !existingData.timeData[today]) {
      const timeData = existingData.timeData || {};
      timeData[today] = {
        sites: {},
        categories: {},
        lastUpdated: Date.now()
      };
      await chrome.storage.local.set({ timeData });
      console.log('Time data initialized for today');
    }

    // Initialize session data for today if it doesn't exist
    if (!existingData.sessionData || !existingData.sessionData[today]) {
      const sessionData = existingData.sessionData || {};
      sessionData[today] = {
        sites: {},
        categories: {}
      };
      await chrome.storage.local.set({ sessionData });
      console.log('Session data initialized for today');
    }

    // Initialize goals if they don't exist
    if (!existingData.goals) {
      await chrome.storage.local.set({
        goals: {
          productiveHours: 4,
          entertainmentHours: 2,
          newsHours: 0.01,
          streak: 0
        }
      });
      console.log('Goals initialized');
    }

    // Set up alarms
    const alarms = await chrome.alarms.getAll();
    
    if (!alarms.find(a => a.name === 'dailySummary')) {
      chrome.alarms.create('dailySummary', {
        periodInMinutes: 1440 // 24 hours
      });
      console.log('Daily summary alarm created');
    }

    if (!alarms.find(a => a.name === 'resetNotifications')) {
      chrome.alarms.create('resetNotifications', {
        when: getNextMidnight(),
        periodInMinutes: 1440 // 24 hours
      });
      console.log('Reset notifications alarm created');
    }

    await logStorageState('after initialization');
    
    // Initialize tracking for current tab
    await initializeTracking();
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

// Add this function to handle notifications
async function checkAndSendNotifications(category, timeSpent) {
  try {
    // Social Media threshold notification (30 minutes)
    if (category === 'Social Media' && timeSpent >= 1800000 && !notificationsSent.socialMedia) {
      const formattedTime = formatTimeForNotification(timeSpent);
      await chrome.notifications.create('social_media_alert', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '⚠️ Social Media Usage Alert',
        message: `Today ${formattedTime}, you've spent over 30 minutes on social media. Consider taking a break!`
      });
      notificationsSent.socialMedia = true;
    }

    // Productive/Educational threshold notification (1 hour)
    if (category === 'Productive / Educational' && timeSpent >= 3600000 && !notificationsSent.productive) {
      const formattedTime = formatTimeForNotification(timeSpent);
      await chrome.notifications.create('productive_milestone', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🎉 Productivity Milestone!',
        message: `Great job! Today ${formattedTime}, you've spent an hour on productive activities!`
      });
      notificationsSent.productive = true;
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

// Enhanced function to check goal completion with detailed notifications
async function checkGoalCompletion(category, timeSpent) {
  try {
    // Get both goals and notification data
    const [goalsData, notifData] = await Promise.all([
      chrome.storage.local.get('goals'),
      chrome.storage.local.get('notificationsSent')
    ]);

    const goals = goalsData.goals || {};
    const goalKey = `${category.toLowerCase().replace(/ /g, '')}Hours`;
    const goalHours = goals[goalKey] || 0;

    // Rehydrate the Set from stored array
    notificationsSent.goals = new Set(notifData?.notificationsSent?.goals || []);
    
    // Log current state for debugging
    console.log('Checking goal completion:', {
      category,
      timeSpent: Math.round(timeSpent / 1000), // seconds
      goalHours,
      goalInMilliseconds: goalHours * 3600000,
      alreadyNotified: notificationsSent.goals.has(category),
      storedNotifications: notifData?.notificationsSent?.goals || []
    });

    if (goalHours > 0) {
      const goalMilliseconds = goalHours * 3600000;
      
      // Check if goal is newly completed
      if (timeSpent >= goalMilliseconds && !notificationsSent.goals.has(category)) {
        console.log(`Goal reached for ${category}! Creating notification...`);
        
        // Format time for display in the requested format
        const formattedTime = formatTimeForNotification(timeSpent);
        const categoryLower = category.toLowerCase();
        
        // Create enhanced notification with detailed message
        const notificationId = `goal_complete_${category}_${Date.now()}`;
        await chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '🎉 Goal Achieved! 🎉',
          message: `Today ${formattedTime}, ${categoryLower} goal is completed! Keep up the great work!`,
          priority: 2,
          requireInteraction: true,
          silent: false
        });
        
        console.log('Created enhanced notification with ID:', notificationId);
        
        // Add to notified set
        notificationsSent.goals.add(category);
        
        // Save notification state - convert Set to Array
        await chrome.storage.local.set({
          notificationsSent: {
            ...notificationsSent,
            goals: Array.from(notificationsSent.goals)
          }
        });
        
        console.log("✅ Enhanced notification triggered for goal:", category);
        console.log('Updated notification state:', {
          ...notificationsSent,
          goals: Array.from(notificationsSent.goals)
        });

        // Optional: Play a sound or create additional visual feedback
        try {
          // Create a celebratory follow-up notification after 2 seconds
          setTimeout(async () => {
            await chrome.notifications.create(`celebration_${category}_${Date.now()}`, {
              type: 'basic',
              iconUrl: 'icons/icon128.png',
              title: '🔥 Streak Building!',
              message: `${category} goal completed! You're building great habits!`,
              priority: 1
            });
          }, 2000);
        } catch (celebrationError) {
          console.log('Could not create celebration notification:', celebrationError);
        }
      }
    }
  } catch (error) {
    console.error('Error in checkGoalCompletion:', error);
  }
}

// Add notification click handler
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
  // Clear the notification when clicked
  chrome.notifications.clear(notificationId);
  
  // If it's a goal completion notification, maybe open the extension popup
  if (notificationId.includes('goal_complete')) {
    chrome.action.openPopup();
  }
});

// Modify updateTimeForCurrentTab to ensure accurate goal checking
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

    // Get category and update category time
    const category = await getCategoryForDomain(domain, tabId || currentTab.id);
    if (!timeData[today].categories[category]) {
      timeData[today].categories[category] = 0;
    }
    
    // Update category time and log for debugging
    const previousTime = timeData[today].categories[category];
    timeData[today].categories[category] += timeSpent;
    
    console.log(`Category ${category} time updated:`, {
      previous: Math.round(previousTime / 1000), // seconds
      added: Math.round(timeSpent / 1000), // seconds
      new: Math.round(timeData[today].categories[category] / 1000) // seconds
    });

    // Save updated time data
    await chrome.storage.local.set({ timeData });

    // Check notifications and goals with the updated total time
    await checkAndSendNotifications(category, timeData[today].categories[category]);
    await checkGoalCompletion(category, timeData[today].categories[category]);

  } catch (error) {
    console.error('Error in updateTimeForCurrentTab:', error);
  }
}

// Start tracking function
async function startTracking(tab) {
  if (!tab || !shouldTrackUrl(tab.url)) {
    console.log('Not tracking tab:', tab);
    return;
  }

  currentTab = tab;
  trackingStartTime = Date.now();
  isTracking = true;

  // Start a new session
  const domain = getDomainFromUrl(tab.url);
  const category = await getCategoryForDomain(domain, tab.id);
  
  currentSession = {
    domain,
    category,
    startTime: trackingStartTime
  };

  console.log('Started tracking tab:', tab.url);
  console.log('Started new session:', currentSession);

  if (!trackingInterval) {
    trackingInterval = setInterval(() => updateTimeForCurrentTab(tab.id), 1000);
  }
}

// Stop tracking function
async function stopTracking() {
  if (!isTracking || !currentSession) {
    return;
  }

  clearInterval(trackingInterval);
  trackingInterval = null;
  isTracking = false;

  if (currentSession && trackingStartTime) {
    const duration = Date.now() - trackingStartTime;
    
    // Only record sessions that are longer than 5 seconds
    if (duration >= 5000) {
      const today = getTodayDate();
      const { sessionData = {} } = await chrome.storage.local.get('sessionData');
      
      if (!sessionData[today]) {
        sessionData[today] = { sites: {}, categories: {} };
      }

      // Update site sessions
      if (!sessionData[today].sites[currentSession.domain]) {
        sessionData[today].sites[currentSession.domain] = [];
      }
      sessionData[today].sites[currentSession.domain].push({
        duration,
        startTime: currentSession.startTime
      });

      // Update category sessions
      if (!sessionData[today].categories[currentSession.category]) {
        sessionData[today].categories[currentSession.category] = [];
      }
      sessionData[today].categories[currentSession.category].push({
        duration,
        startTime: currentSession.startTime
      });

      await chrome.storage.local.set({ sessionData });
      console.log('Session recorded:', {
        domain: currentSession.domain,
        category: currentSession.category,
        duration
      });
    }
  }

  currentTab = null;
  trackingStartTime = null;
  currentSession = null;
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
    const formattedTotalTime = formatTimeForNotification(totalTime);

    const productiveTime = (stats.categories['Productive / Educational'] || 0) / 3600000;
    const { goals = {} } = await chrome.storage.local.get('goals');
    const goalHours = goals.productiveHours || 4;
    const goalAchieved = productiveTime >= goalHours;

    const message = goalAchieved
      ? `Great job! Today ${formattedTotalTime} online, including ${Math.round(productiveTime)}h on productive tasks. Keep up the ${goals.streak}-day streak! 🎯`
      : `Today ${formattedTotalTime} online, with ${Math.round(productiveTime)}h on productive tasks. Goal: ${goalHours}h`;

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

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetNotifications') {
    resetNotifications();
  }
});

// Modify the existing resetNotifications function to include persistence
async function resetNotifications() {
  try {
    notificationsSent = {
      socialMedia: false,
      productive: false,
      goals: new Set()
    };
    
    // Save as array
    await chrome.storage.local.set({
      notificationsSent: {
        ...notificationsSent,
        goals: Array.from(notificationsSent.goals)
      }
    });
    console.log('Notifications reset and saved:', {
      ...notificationsSent,
      goals: Array.from(notificationsSent.goals)
    });
  } catch (error) {
    console.error('Error resetting notifications:', error);
  }
}

// Initialize notification state on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const { notificationsSent: savedState = null } = await chrome.storage.local.get('notificationsSent');
    if (savedState) {
      // Convert stored array back to Set
      notificationsSent = {
        ...savedState,
        goals: new Set(savedState.goals || [])
      };
    }
    console.log('Initialized notification state:', {
      ...notificationsSent,
      goals: Array.from(notificationsSent.goals)
    });
    
    await initializeTracking();
  } catch (error) {
    console.error('Error initializing notification state:', error);
  }
});

// Function to get date string in YYYY-MM-DD format
function getDateString(date) {
  return date.toISOString().split('T')[0];
}

// Function to clean up old data (keep only last 7 days)
async function cleanupOldData() {
  try {
    const { timeData = {} } = await chrome.storage.local.get('timeData');
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const cleanedData = {};
    Object.entries(timeData).forEach(([date, data]) => {
      if (new Date(date) >= sevenDaysAgo) {
        cleanedData[date] = data;
      }
    });

    await chrome.storage.local.set({ timeData: cleanedData });
    console.log('Cleaned up old data, keeping last 7 days');
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

// Function to check if we need to reset for a new day
async function checkDayReset() {
  try {
    const { lastResetDate } = await chrome.storage.local.get('lastResetDate');
    const today = getDateString(new Date());

    if (lastResetDate !== today) {
      console.log('New day detected, performing reset');
      await chrome.storage.local.set({ lastResetDate: today });
      await cleanupOldData();
      
      // Reset notification flags for the new day
      await chrome.storage.local.set({
        notificationsSent: {
          goals: [],
          socialMedia: false,
          productive: false
        }
      });
    }
  } catch (error) {
    console.error('Error checking day reset:', error);
  }
}

// Check for day reset every minute
setInterval(checkDayReset, 60000);

// Also check when the extension starts
checkDayReset();