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
  
  // Clear notification flags for the new day
  chrome.storage.local.get(null, (items) => {
    const keysToRemove = Object.keys(items).filter(key => key.startsWith('notification_'));
    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove);
    }
  });
  
  // Optionally stop tracking at midnight for clean stats:
  stopTracking();
}

// --- UTILITY FUNCTIONS ---
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getDomainFromUrl(url) {
  try {
    if (url === chrome.runtime.getURL('dashboard.html')) {
        return 'Dashboard';
    }
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

// --- GOAL MIGRATION ---
async function migrateGoalsToNewFormat() {
  const { goals = {} } = await chrome.storage.local.get('goals');
  let needsMigration = false;
  const newGoals = { ...goals };

  // Check for old goal key formats and migrate them
  const oldToNewMapping = {
    'productiveHours': 'productiveeducationalHours',
    'socialMediaHours': 'socialmediaHours',
    'otherHours': 'otheruncategorizedHours'
  };

  Object.keys(oldToNewMapping).forEach(oldKey => {
    if (goals[oldKey] !== undefined) {
      newGoals[oldToNewMapping[oldKey]] = goals[oldKey];
      delete newGoals[oldKey];
      needsMigration = true;
    }
  });

  if (needsMigration) {
    await chrome.storage.local.set({ goals: newGoals });
    console.log('Goals migrated to new format:', newGoals);
  }
}

// --- INITIALIZATION ---
async function initialize() {
    try {
        await ensureCategoriesUpToDate();
        await migrateGoalsToNewFormat();
        await cleanupExpiredBlocks();
        await setupBlockingRules();
        scheduleMidnightReset();
        setupBlockCleanupAlarm();
        cleanupNotificationFlags();
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
            // Set initial goals using the correct goal key format
            const initialGoals = {
                streak: 0,
                productiveeducationalHours: 4,  // Productive / Educational
                entertainmentHours: 2,
                newsHours: 1,
                socialmediaHours: 1,
                gamesHours: 1,
                shoppingHours: 0.5,
                otheruncategorizedHours: 0
            };
            await chrome.storage.local.set({ goals: initialGoals });
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
  await setupBlockingRules();
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
  if (!url || !timeSpent || timeSpent <= 0) return;

  const today = getTodayString();
  const domain = getDomainFromUrl(url);
  if (!domain) return;
  
  const category = await getCategoryForUrl(url);
  
  const { timeData = {} } = await chrome.storage.local.get('timeData');
  if (!timeData[today]) timeData[today] = { sites: {}, categories: {} };

  const cleanDomain = cleanWebsiteDomain(domain);
  timeData[today].sites[cleanDomain] = (timeData[today].sites[cleanDomain] || 0) + timeSpent;

  timeData[today].categories[category] = (timeData[today].categories[category] || 0) + timeSpent;
  await chrome.storage.local.set({ timeData });

  await checkNotifications(category, timeData[today].categories[category]);
  await checkGoalCompletion(category, timeData[today].categories[category]);
  await checkWebsiteGoalNotifications(cleanDomain, timeData[today].sites[cleanDomain]);
}

// --- MAIN CATEGORIZATION LOGIC ---
async function getCategoryForUrl(url) {
  const domain = getDomainFromUrl(url);
  if (!domain) return 'Other / Uncategorized';

  // 1. Special check for YouTube AI Classification
  if (url.includes('youtube.com/watch')) {
    const { youtubeClassification } = await chrome.storage.local.get('youtubeClassification');
    const validCategories = ['Productive', 'Entertainment', 'News', 'Other'];
    
    // Use the AI category if it's valid and available
    if (youtubeClassification?.category && validCategories.includes(youtubeClassification.category)) {
      // The AI returns 'Productive', but our category is 'Productive / Educational'
      if (youtubeClassification.category === 'Productive') {
        return 'Productive / Educational';
      }
      return youtubeClassification.category;
    }
  }

  // 2. Fallback to keyword/domain-based classification
  const { categories: userCategories } = await chrome.storage.local.get('categories');
  const allCategories = { ...DEFAULT_CATEGORIES, ...userCategories };

  for (const [category, data] of Object.entries(allCategories)) {
    if (data.examples?.some(d => domain.includes(d))) {
      return category;
    }
  }

  return 'Other / Uncategorized';
}

async function categorizeWebsite(domain) {
  // This function is now replaced by getCategoryForUrl
  // Keeping it here to avoid breaking other parts of the code if they still reference it.
  // In a future refactor, all calls should go to getCategoryForUrl.
  return getCategoryForUrl(`https://${domain}`);
}

async function checkNotifications(category, timeSpent) {
  const { notifications } = await chrome.storage.local.get({ notifications: true });
  
  if (!notifications) return;
  
  // Check if we've already sent a notification for this category today
  const today = getTodayString();
  const notificationKey = `notification_${category}_${today}`;
  const { [notificationKey]: alreadyNotified } = await chrome.storage.local.get(notificationKey);
  
  console.log(`Checking notifications for ${category}:`, {
    timeSpent: timeSpent / 3600000, // hours
    alreadyNotified,
    notificationKey
  });
  
  if (category === 'Social Media' && timeSpent > 1800000 && !alreadyNotified) {
    console.log('Sending Social Media notification');
    chrome.notifications.create({
      type: 'basic', 
      iconUrl: 'icons/icon128.png',
      title: '⚠️ Social Media Alert', 
      message: `Over 30 min spent on social media!`
    });
    // Mark as notified for today
    await chrome.storage.local.set({ [notificationKey]: true });
    console.log('Marked Social Media notification as sent for today');
  }

  if (category === 'Productive / Educational' && timeSpent > 3600000 && !alreadyNotified) {
    console.log('Sending Productivity notification');
    chrome.notifications.create({
      type: 'basic', 
      iconUrl: 'icons/icon128.png',
      title: '🎉 Productivity Milestone!', 
      message: `1 hour spent productively!`
    });
    // Mark as notified for today
    await chrome.storage.local.set({ [notificationKey]: true });
    console.log('Marked Productivity notification as sent for today');
  }
}

async function checkWebsiteGoalNotifications(domain, timeSpent) {
  const { notifications, goals = {} } = await chrome.storage.local.get({ notifications: true, goals: {} });
  
  if (!notifications) {
    console.log('Notifications disabled, skipping website goal check');
    return;
  }
  
  // Check if there's a goal set for this website
  const cleanDomain = cleanWebsiteDomain(domain);
  const goalKey = `website_${cleanDomain.toLowerCase().replace(/[^a-z0-9]/gi, '')}Hours`;
  const goalHours = goals[goalKey];
  
  console.log(`Checking website goal notifications for ${domain}:`, {
    cleanDomain,
    goalKey,
    goalHours,
    timeSpent: timeSpent / 3600000, // hours
    availableGoals: Object.keys(goals).filter(k => k.startsWith('website_'))
  });
  
  if (typeof goalHours === 'number' && goalHours > 0) {
    const goalMilliseconds = goalHours * 3600000;
    const progress = (timeSpent / goalMilliseconds) * 100;
    
    // Check if we've already sent a notification for this website today
    const today = getTodayString();
    const notificationKey = `notification_website_${cleanDomain}_${today}`;
    const { [notificationKey]: alreadyNotified } = await chrome.storage.local.get(notificationKey);
    
    console.log(`Website goal progress for ${cleanDomain}:`, {
      progress: Math.round(progress),
      goalHours,
      alreadyNotified,
      notificationKey
    });
    
    // Send notification when goal is reached (100%)
    if (progress >= 100 && !alreadyNotified) {
      console.log(`Sending website goal achieved notification for ${cleanDomain}`);
      chrome.notifications.create({
        type: 'basic', 
        iconUrl: 'icons/icon128.png',
        title: '🎯 Website Goal Achieved!', 
        message: `You've reached your daily goal for ${cleanDomain}!`
      });
      // Mark as notified for today
      await chrome.storage.local.set({ [notificationKey]: true });
      console.log(`Marked website goal notification as sent for ${cleanDomain}`);
    }
    // Send warning notification when approaching goal (80%)
    else if (progress >= 80 && progress < 100 && !alreadyNotified) {
      console.log(`Sending website goal warning notification for ${cleanDomain}`);
      chrome.notifications.create({
        type: 'basic', 
        iconUrl: 'icons/icon128.png',
        title: '⚠️ Website Goal Warning', 
        message: `You're approaching your daily goal for ${cleanDomain} (${Math.round(progress)}%)`
      });
      // Mark as notified for today
      await chrome.storage.local.set({ [notificationKey]: true });
      console.log(`Marked website goal warning notification as sent for ${cleanDomain}`);
    }
  } else {
    console.log(`No goal found for ${cleanDomain} (key: ${goalKey})`);
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

// === FOCUS MODE ENFORCEMENT ===
// Checks if Focus Mode is active and the current domain is in focusBlockList.
// If so, redirects the given tab to the extension's blocked page and returns true to indicate a redirect occurred.
async function enforceFocusBlock(url, tabId) {
  try {
    const domain = getDomainFromUrl(url);
    if (!domain) return false;

    const { focusActive = false, focusBlockList = [] } = await chrome.storage.local.get([
      'focusActive',
      'focusBlockList'
    ]);

    if (focusActive && Array.isArray(focusBlockList) && focusBlockList.includes(domain)) {
      const redirectUrl = chrome.runtime.getURL(`blocked.html?focus=1&url=${encodeURIComponent(domain)}&expires=${Date.now() + 86400000}`);
      await chrome.tabs.update(tabId, { url: redirectUrl });
      return true;
    }
  } catch (err) {
    console.error('Error enforcing Focus Mode block:', err);
  }
  return false;
}

async function startTracking(tab) {
  // Focus Mode handling: redirect early if needed
  if (await enforceFocusBlock(tab.url, tab.id)) {
    return; // Do not start tracking on blocked sites during Focus Mode
  }

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

// Listener to react immediately when the user toggles Focus Mode from the popup
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.focusActive) {
    const focusActive = changes.focusActive.newValue;
    if (focusActive) {
      // Iterate through all tabs and enforce the Focus Mode block list right away
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && tab.url) {
            enforceFocusBlock(tab.url, tab.id);
          }
        });
      });
    }
  }
});

// Auto turn off Focus Mode when alarm fires
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focusModeOff') {
    await chrome.storage.local.set({ focusActive: false });
    await chrome.storage.local.remove('focusExpiresAt');

    // Proactively notify all tabs so blocked pages can auto-close without polling every 2s
    chrome.tabs.query({}, tabs => {
      tabs.forEach(t => {
        chrome.tabs.sendMessage(t.id, { type: 'FOCUS_ENDED' }).catch(() => {});
      });
    });
    chrome.alarms.clear('focusModeOff');
  }
});

function cleanWebsiteDomain(domain) {
  return domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

// Function to clean up old notification flags
async function cleanupNotificationFlags() {
  try {
    const today = getTodayString();
    const { timeData = {} } = await chrome.storage.local.get('timeData');
    
    // Get all notification keys
    const allData = await chrome.storage.local.get(null);
    const notificationKeys = Object.keys(allData).filter(key => key.startsWith('notification_'));
    
    // Remove notification flags from previous days
    const keysToRemove = {};
    notificationKeys.forEach(key => {
      if (!key.includes(today)) {
        keysToRemove[key] = null;
      }
    });
    
    if (Object.keys(keysToRemove).length > 0) {
      await chrome.storage.local.remove(Object.keys(keysToRemove));
      console.log('Cleaned up old notification flags:', Object.keys(keysToRemove));
    }
  } catch (error) {
    console.error('Error cleaning up notification flags:', error);
  }
}

// Call cleanup on initialization
cleanupNotificationFlags();

// Function to manually test website goal notifications
async function testWebsiteGoalNotification(domain) {
  try {
    const { goals = {} } = await chrome.storage.local.get('goals');
    const cleanDomain = cleanWebsiteDomain(domain);
    const goalKey = `website_${cleanDomain.toLowerCase().replace(/[^a-z0-9]/gi, '')}Hours`;
    const goalHours = goals[goalKey];
    
    console.log(`Testing website goal notification for ${domain}:`, {
      cleanDomain,
      goalKey,
      goalHours,
      availableGoals: Object.keys(goals).filter(k => k.startsWith('website_'))
    });
    
    if (typeof goalHours === 'number' && goalHours > 0) {
      // Simulate reaching the goal
      const goalMilliseconds = goalHours * 3600000;
      await checkWebsiteGoalNotifications(cleanDomain, goalMilliseconds);
    } else {
      console.log(`No goal found for ${domain}`);
    }
  } catch (error) {
    console.error('Error testing website goal notification:', error);
  }
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addBlock') {
    addBlockedSite(request.url, request.duration)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'clearNotificationFlags') {
    cleanupNotificationFlags()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'testWebsiteGoalNotification') {
    testWebsiteGoalNotification(request.domain)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});