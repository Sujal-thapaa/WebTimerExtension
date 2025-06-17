// --- CATEGORY DEFINITIONS ---
const CATEGORY_KEYWORDS = {
  'Productive / Educational': {
    keywords: ['learn','study','tutorial','education','research','wiki','docs','coding','productivity','project','note'],
    domains: ['wikipedia.org','khanacademy.org','coursera.org','udemy.com','edx.org','leetcode.com','notion.so','trello.com','slack.com','linkedin.com','docs.google.com','chat.openai.com']
  },
  'Entertainment': {
    keywords: ['video','music','movie','entertainment','fun','stream','watch'],
    domains: ['youtube.com','netflix.com','spotify.com','twitch.tv','hotstar.com','primevideo.com','disneyplus.com','9gag.com']
  },
  'News': {
    keywords: ['news','politics','breaking','headline'],
    domains: ['cnn.com','bbc.com','nytimes.com','reuters.com','foxnews.com','aljazeera.com']
  },
  'Social Media': {
    keywords: ['social','network','friend','post','share','status','community','message'],
    domains: ['facebook.com','instagram.com','twitter.com','x.com','tiktok.com','snapchat.com','linkedin.com','reddit.com','pinterest.com']
  },
  'Games': {
    keywords: ['game','gaming','play','steam','epic','roblox','chess'],
    domains: ['roblox.com','epicgames.com','steampowered.com','miniclip.com','ign.com','chess.com']
  },
  'Shopping': {
    keywords: ['shop','buy','ecommerce','cart'],
    domains: ['amazon.com','ebay.com','aliexpress.com','walmart.com','flipkart.com','etsy.com']
  },
  'Other': {
    keywords: [],
    domains: []
  }
};

const DEFAULT_CATEGORIES = {
  'Productive / Educational': {
    description: 'Websites that promote learning, work, coding, and personal growth',
    examples: ['wikipedia.org','khanacademy.org','coursera.org','udemy.com','edx.org','leetcode.com','notion.so','trello.com','slack.com','linkedin.com/learning','docs.google.com','chat.openai.com']
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

let currentTab = null;
let trackingStartTime = null;
let isTracking = false;
let trackingInterval = null;
let notificationsSent = {
  socialMedia: false,
  productive: false,
  goals: new Set()
};

// --- MIDNIGHT RESET MANAGEMENT ---
let lastTrackedDate = getTodayString();

function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight =
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0) - now;

  setTimeout(() => {
    handleMidnightReset();
    scheduleMidnightReset();
  }, msUntilMidnight + 1000); // +1s to be safe
}

function handleMidnightReset() {
  lastTrackedDate = getTodayString();
  notificationsSent = {
    socialMedia: false,
    productive: false,
    goals: new Set()
  };
  // Optionally stop tracking at midnight for clean stats:
  stopTracking();
}

// --- UTILITY FUNCTIONS ---
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getDomainFromUrl(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return null;
  }
}

function formatTime(ms) {
  const min = Math.floor(ms / 60000);
  return min + ' min';
}

// --- GOAL KEY HELPER ---
function getGoalKey(category) {
  return category.toLowerCase().replace(/[^a-z0-9]/gi, '') + 'Hours';
}

// --- GOAL COMPLETION NOTIFICATION ---
async function checkGoalCompletion(category, timeSpent) {
  const { goals = {} } = await chrome.storage.local.get('goals');
  const goalKey = getGoalKey(category);
  const goalHours = goals[goalKey];
  if (!goalHours || goalHours <= 0) return;
  const goalMs = goalHours * 3600000;
  const today = getTodayString();
  const notifiedKey = `goalNotified_${today}_${goalKey}`;
  const { [notifiedKey]: alreadyNotified } = await chrome.storage.local.get(notifiedKey);
  if (timeSpent >= goalMs && !alreadyNotified) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '🎯 Goal Completed!',
      message: `You've achieved your daily goal for ${category}!`
    });
    await chrome.storage.local.set({ [notifiedKey]: true });
  }
}

// --- CATEGORY MANAGEMENT ---
async function ensureCategoriesUpToDate() {
  const { categories = {} } = await chrome.storage.local.get('categories');
  const merged = { ...DEFAULT_CATEGORIES, ...categories };
  await chrome.storage.local.set({ categories: merged });
}

// --- INITIALIZATION ---
async function initialize() {
    try {
        await ensureCategoriesUpToDate();
        await cleanupExpiredBlocks();
        await setupBlockingRules();
        scheduleMidnightReset();
        setupBlockCleanupAlarm();
        console.log("WebTimeTracker background initialized successfully.");
    } catch (error) {
        console.error("Error during background script initialization:", error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    // Perform initial setup when the extension is first installed or updated.
    chrome.storage.local.get(['categories', 'blockedSites', 'goals'], async (result) => {
        const { categories, blockedSites, goals } = result;
        if (!categories) {
            await chrome.storage.local.set({ categories: DEFAULT_CATEGORIES });
        }
        if (!blockedSites) {
            await chrome.storage.local.set({ blockedSites: [] });
        }
        if (!goals) {
            await chrome.storage.local.set({ goals: { productiveHours: 4, entertainmentHours: 2, streak: 0 } });
        }
        initialize();
    });
});

chrome.runtime.onStartup.addListener(() => {
    // Initialize when the browser starts up.
    initialize();
});

// --- WEBSITE BLOCKING ---
async function setupBlockingRules() {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const now = Date.now();
  const activeSites = blockedSites.filter(site => site.expiresAt > now);

  // Update storage with only active sites
  if (activeSites.length !== blockedSites.length) {
      await chrome.storage.local.set({ blockedSites: activeSites });
  }

  const rules = activeSites.map((site, index) => ({
      id: index + 1,
      priority: 1,
      action: {
          type: 'redirect',
          redirect: { extensionPath: `/blocked.html?url=${encodeURIComponent(site.url)}&expires=${site.expiresAt}` }
      },
      condition: {
          urlFilter: `||${site.url}`,
          resourceTypes: ['main_frame']
      }
  }));

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: rules
    });

    console.log("Blocking rules updated successfully.");
  } catch (error) {
    console.error("Error updating blocking rules:", error);
  }
}

async function cleanupExpiredBlocks() {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const now = Date.now();
  const updated = blockedSites.filter(site => site.expiresAt > now);
  await chrome.storage.local.set({ blockedSites: updated });
}

// --- BLOCKING LOGIC (Restored) ---
async function addBlockedSite(url, durationMinutes) {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const expiresAt = Math.floor(Date.now() + (durationMinutes * 60000));
  // Remove any existing block for the same site to update it
  const updated = blockedSites.filter(site => site.url !== url);
  updated.push({ url, expiresAt });
  await chrome.storage.local.set({ blockedSites: updated });
  await setupBlockingRules();
  return true;
}

async function removeBlockedSite(url) {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const updated = blockedSites.filter(site => site.url !== url);
  await chrome.storage.local.set({ blockedSites: updated });
  await setupBlockingRules();
  return true;
}

async function getBlockedSites() {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  return { blockedSites };
}

// --- TRACKING + NOTIFICATIONS ---
async function updateTime(url, timeSpent) {
  const today = getTodayString();
  if (today !== lastTrackedDate) {
    handleMidnightReset();
    lastTrackedDate = today;
  }

  const domain = getDomainFromUrl(url);
  if (!domain) return;

  const { timeData = {} } = await chrome.storage.local.get('timeData');
  if (!timeData[today]) timeData[today] = { sites: {}, categories: {} };

  timeData[today].sites[domain] = (timeData[today].sites[domain] || 0) + timeSpent;

  const category = await categorizeWebsite(domain);
  timeData[today].categories[category] = (timeData[today].categories[category] || 0) + timeSpent;
  await chrome.storage.local.set({ timeData });

  await checkNotifications(category, timeData[today].categories[category]);
  await checkGoalCompletion(category, timeData[today].categories[category]);
}

async function categorizeWebsite(domain) {
  for (const [cat, info] of Object.entries(CATEGORY_KEYWORDS)) {
    if (info.domains.some(d => domain.includes(d))) return cat;
  }
  return 'Other';
}

async function checkNotifications(category, timeSpent) {
  if (category === 'Social Media' && timeSpent > 1800000 && !notificationsSent.socialMedia) {
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon128.png',
      title: '⚠️ Social Media Alert', message: `Over 30 min spent on social media!`
    });
    notificationsSent.socialMedia = true;
  }

  if (category === 'Productive / Educational' && timeSpent > 3600000 && !notificationsSent.productive) {
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon128.png',
      title: '🎉 Productivity Milestone!', message: `1 hour spent productively!`
    });
    notificationsSent.productive = true;
  }
}

// --- TAB EVENTS ---
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await stopTracking();
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) await startTracking(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status === 'complete' && tab.active && tab.url) {
    await stopTracking();
    await startTracking(tab);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return stopTracking();
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (tab && tab.url) await startTracking(tab);
});

async function startTracking(tab) {
  currentTab = tab;
  trackingStartTime = Date.now();
  isTracking = true;

  trackingInterval = setInterval(async () => {
    if (isTracking && currentTab) {
      const now = Date.now();
      const timeSpent = now - trackingStartTime;
      trackingStartTime = now;
      await updateTime(currentTab.url, timeSpent);
    }
  }, 1000);
}

async function stopTracking() {
  if (isTracking && currentTab && trackingStartTime) {
    const timeSpent = Date.now() - trackingStartTime;
    await updateTime(currentTab.url, timeSpent);
  }
  clearInterval(trackingInterval);
  trackingInterval = null;
  isTracking = false;
  currentTab = null;
  trackingStartTime = null;
}

// Periodic cleanup
setInterval(cleanupExpiredBlocks, 60000);

// === ALARM-BASED CLEANUP OF EXPIRED BLOCKS ===
function setupBlockCleanupAlarm() {
  // Creates (or refreshes) a repeating alarm that fires every minute
  chrome.alarms.create('blockCleanup', { delayInMinutes: 1, periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'blockCleanup') {
    try {
      await cleanupExpiredBlocks();
      await setupBlockingRules();
    } catch (err) {
      console.error('Error during block cleanup alarm:', err);
    }
  }
});

// Background script for WebTimeTracker
async function handlePageVisit(data) {
  console.log('Handling page visit:', data);
  try {
    // Correctly initialize visits data if it doesn't exist
    const { visits: storedVisits = [] } = await chrome.storage.local.get('visits');
    
    storedVisits.push({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 visits
    if (storedVisits.length > 1000) {
      storedVisits.slice(-1000);
    }
    
    await chrome.storage.local.set({ visits: storedVisits });
    console.log('Visit data stored successfully');
  } catch (error) {
    console.error('Error storing visit data:', error);
    throw error;
  }
}

// This listener is also being removed and replaced by a new unified one.

// Initialize background script
console.log('Background script initialized');

// A single, unified message listener to handle all runtime communications.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Messages from the popup for blocking sites
    if (message.action) {
        switch (message.action) {
            case 'addBlock':
                addBlockedSite(message.url, message.duration).then(success => sendResponse({ success }));
                return true; // Indicates an asynchronous response.
            case 'removeBlock':
                removeBlockedSite(message.url).then(success => sendResponse({ success }));
                return true; // Indicates an asynchronous response.
            case 'getBlockedSites':
                getBlockedSites().then(sites => sendResponse(sites));
                return true; // Indicates an asynchronous response.
        }
    }

    // Messages from content scripts for page analysis and pings
    if (message.type) {
        switch (message.type) {
            case 'PING':
                sendResponse({ success: true });
                break; // Synchronous response, no 'return true' needed.
            case 'PAGE_VISIT':
                handlePageVisit(message.data).then(() => sendResponse({ success: true }));
                return true; // Indicates an asynchronous response.
        }
    }
});