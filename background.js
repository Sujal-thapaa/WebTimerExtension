// --- CATEGORY DEFINITIONS ---
const CATEGORY_KEYWORDS = {
    'Social Media': {
      keywords: ['social', 'network', 'friend', 'post', 'share', 'status', 'community', 'message'],
      domains: ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'tiktok.com', 'snapchat.com']
    },
    'Entertainment': {
      keywords: ['video', 'music', 'movie', 'entertainment', 'fun', 'game', 'gaming'],
      domains: ['youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv', 'hulu.com', 'disney.com']
    },
    'Productive / Educational': {
      keywords: ['learn', 'study', 'tutorial', 'education', 'research', 'notion', 'work', 'productivity'],
      domains: ['khanacademy.org', 'coursera.org', 'notion.so', 'edx.org', 'udemy.com', 'github.com']
    }
  };
  
  const DEFAULT_CATEGORIES = {
    'Social Media': {
      description: 'Social networking and communication',
      examples: ['facebook.com', 'twitter.com', 'instagram.com']
    },
    'Entertainment': {
      description: 'Entertainment and media sites',
      examples: ['youtube.com', 'netflix.com', 'spotify.com']
    },
    'Productive / Educational': {
      description: 'Learning and productivity tools',
      examples: ['coursera.org', 'udemy.com', 'notion.so']
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
    console.log('Handling midnight reset');
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
    } catch (error) {
      console.error('Error parsing URL:', url, error);
      return null;
    }
  }
  
  function formatTime(ms) {
    const min = Math.floor(ms / 60000);
    return min + ' min';
  }
  
  // --- GOAL KEY HELPER ---
  function getGoalKey(category) {
    const keyMap = {
      'Social Media': 'socialMediaHours',
      'Entertainment': 'entertainmentHours',
      'Productive / Educational': 'productiveHours'
    };
    return keyMap[category] || category.toLowerCase().replace(/[^a-z0-9]/gi, '') + 'Hours';
  }
  
  // --- GOAL COMPLETION NOTIFICATION ---
  async function checkGoalCompletion(category, timeSpent) {
    try {
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
    } catch (error) {
      console.error('Error checking goal completion:', error);
    }
  }
  
  // --- INITIALIZATION ---
  chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated');
    
    try {
      const { categories } = await chrome.storage.local.get('categories');
      if (!categories) {
        await chrome.storage.local.set({ categories: DEFAULT_CATEGORIES });
      }
  
      const { blockedSites } = await chrome.storage.local.get('blockedSites');
      if (!blockedSites) {
        await chrome.storage.local.set({ blockedSites: [] });
      }
  
      const { goals } = await chrome.storage.local.get('goals');
      if (!goals) {
        await chrome.storage.local.set({ 
          goals: { 
            productiveHours: 4, 
            entertainmentHours: 2, 
            socialMediaHours: 1,
            streak: 0 
          } 
        });
      }
  
      await setupBlockingRules();
      scheduleMidnightReset();
    } catch (error) {
      console.error('Error during installation:', error);
    }
  });
  
  chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension startup');
    
    try {
      await cleanupExpiredBlocks();
      await setupBlockingRules();
      
      // Clean up previous day's notifications
      const all = await chrome.storage.local.get(null);
      const today = getTodayString();
      const keysToRemove = [];
      
      for (const key of Object.keys(all)) {
        if (key.startsWith('goalNotified_') && !key.includes(today)) {
          keysToRemove.push(key);
        }
      }
      
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
      
      scheduleMidnightReset();
    } catch (error) {
      console.error('Error during startup:', error);
    }
  });
  
  // --- WEBSITE BLOCKING ---
  async function setupBlockingRules() {
    try {
      const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
      const now = Date.now();
      const activeSites = blockedSites.filter(site => site.expiresAt > now);
  
      // Remove all existing rules first
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIdsToRemove = existingRules.map(rule => rule.id);
      
      const rules = activeSites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { extensionPath: `/blocked.html?url=${encodeURIComponent(site.url)}&expires=${site.expiresAt}` }
        },
        condition: {
          urlFilter: `*://*.${site.url}/*`,
          resourceTypes: ['main_frame']
        }
      }));
  
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: rules
      });
      
      console.log(`Updated blocking rules: ${rules.length} active blocks`);
    } catch (error) {
      console.error('Error setting up blocking rules:', error);
    }
  }
  
  async function cleanupExpiredBlocks() {
    try {
      const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
      const now = Date.now();
      const updated = blockedSites.filter(site => site.expiresAt > now);
      
      if (updated.length !== blockedSites.length) {
        await chrome.storage.local.set({ blockedSites: updated });
        console.log(`Cleaned up ${blockedSites.length - updated.length} expired blocks`);
      }
    } catch (error) {
      console.error('Error cleaning up expired blocks:', error);
    }
  }
  
  // --- MESSAGE HANDLERS ---
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.action);
    
    if (request.action === 'addBlock') {
      addBlockedSite(request.url, request.duration)
        .then(res => sendResponse({ success: res }))
        .catch(error => {
          console.error('Error adding block:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    if (request.action === 'removeBlock') {
      removeBlockedSite(request.url)
        .then(res => sendResponse({ success: res }))
        .catch(error => {
          console.error('Error removing block:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    if (request.action === 'getBlockedSites') {
      getBlockedSites()
        .then(res => sendResponse(res))
        .catch(error => {
          console.error('Error getting blocked sites:', error);
          sendResponse({ blockedSites: [] });
        });
      return true;
    }
    
    if (request.type === 'contentClassification') {
      handleContentClassification(request.data);
      sendResponse({ received: true });
      return true;
    }
  });
  
  async function addBlockedSite(url, durationMinutes) {
    try {
      if (!url || !durationMinutes || durationMinutes < 1) {
        throw new Error('Invalid URL or duration');
      }
      
      const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
      const expiresAt = Date.now() + durationMinutes * 60000;
      
      // Remove existing block for the same URL
      const updated = blockedSites.filter(site => site.url !== url);
      updated.push({ url, expiresAt });
      
      await chrome.storage.local.set({ blockedSites: updated });
      await setupBlockingRules();
      
      console.log(`Blocked ${url} for ${durationMinutes} minutes`);
      return true;
    } catch (error) {
      console.error('Error adding blocked site:', error);
      return false;
    }
  }
  
  async function removeBlockedSite(url) {
    try {
      const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
      const updated = blockedSites.filter(site => site.url !== url);
      
      await chrome.storage.local.set({ blockedSites: updated });
      await setupBlockingRules();
      
      console.log(`Unblocked ${url}`);
      return true;
    } catch (error) {
      console.error('Error removing blocked site:', error);
      return false;
    }
  }
  
  async function getBlockedSites() {
    try {
      const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
      return { blockedSites };
    } catch (error) {
      console.error('Error getting blocked sites:', error);
      return { blockedSites: [] };
    }
  }
  
  // --- CONTENT CLASSIFICATION HANDLER ---
  async function handleContentClassification(data) {
    try {
      console.log('Content classification received:', data);
      // You can extend this to use the classification data for better categorization
    } catch (error) {
      console.error('Error handling content classification:', error);
    }
  }
  
  // --- TRACKING + NOTIFICATIONS ---
  async function updateTime(url, timeSpent) {
    try {
      const today = getTodayString();
      if (today !== lastTrackedDate) {
        handleMidnightReset();
        lastTrackedDate = today;
      }
  
      const domain = getDomainFromUrl(url);
      if (!domain) return;
  
      const { timeData = {} } = await chrome.storage.local.get('timeData');
      if (!timeData[today]) {
        timeData[today] = { sites: {}, categories: {} };
      }
  
      timeData[today].sites[domain] = (timeData[today].sites[domain] || 0) + timeSpent;
  
      const category = await categorizeWebsite(domain);
      timeData[today].categories[category] = (timeData[today].categories[category] || 0) + timeSpent;
      
      await chrome.storage.local.set({ timeData });
  
      await checkNotifications(category, timeData[today].categories[category]);
      await checkGoalCompletion(category, timeData[today].categories[category]);
    } catch (error) {
      console.error('Error updating time:', error);
    }
  }
  
  async function categorizeWebsite(domain) {
    try {
      // Check domain-based categorization first
      for (const [cat, info] of Object.entries(CATEGORY_KEYWORDS)) {
        if (info.domains.some(d => domain.includes(d))) {
          return cat;
        }
      }
      
      // Check custom categories
      const { categories = {} } = await chrome.storage.local.get('categories');
      for (const [categoryName, categoryInfo] of Object.entries(categories)) {
        if (categoryInfo.examples && categoryInfo.examples.some(example => domain.includes(example))) {
          return categoryName;
        }
      }
      
      return 'Other';
    } catch (error) {
      console.error('Error categorizing website:', error);
      return 'Other';
    }
  }
  
  async function checkNotifications(category, timeSpent) {
    try {
      if (category === 'Social Media' && timeSpent > 1800000 && !notificationsSent.socialMedia) {
        chrome.notifications.create({
          type: 'basic', 
          iconUrl: 'icons/icon128.png',
          title: '⚠️ Social Media Alert', 
          message: `Over 30 minutes spent on social media today!`
        });
        notificationsSent.socialMedia = true;
      }
  
      if (category === 'Productive / Educational' && timeSpent > 3600000 && !notificationsSent.productive) {
        chrome.notifications.create({
          type: 'basic', 
          iconUrl: 'icons/icon128.png',
          title: '🎉 Productivity Milestone!', 
          message: `Great job! 1 hour spent on productive activities!`
        });
        notificationsSent.productive = true;
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }
  
  // --- TAB EVENTS ---
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      await stopTracking();
      const tab = await chrome.tabs.get(tabId);
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await startTracking(tab);
      }
    } catch (error) {
      console.error('Error on tab activated:', error);
    }
  });
  
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
      if (changeInfo.status === 'complete' && tab.active && tab.url && 
          !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await stopTracking();
        await startTracking(tab);
      }
    } catch (error) {
      console.error('Error on tab updated:', error);
    }
  });
  
  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    try {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        return stopTracking();
      }
      
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await startTracking(tab);
      }
    } catch (error) {
      console.error('Error on window focus changed:', error);
    }
  });
  
  async function startTracking(tab) {
    try {
      if (!tab || !tab.url) return;
      
      currentTab = tab;
      trackingStartTime = Date.now();
      isTracking = true;
  
      // Clear any existing interval
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
      
      trackingInterval = setInterval(async () => {
        if (isTracking && currentTab && trackingStartTime) {
          try {
            const now = Date.now();
            const timeSpent = now - trackingStartTime;
            trackingStartTime = now;
            await updateTime(currentTab.url, timeSpent);
          } catch (error) {
            console.error('Error in tracking interval:', error);
          }
        }
      }, 5000); // Update every 5 seconds instead of 1 second for better performance
      
      console.log('Started tracking:', tab.url);
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  }
  
  async function stopTracking() {
    try {
      if (isTracking && currentTab && trackingStartTime) {
        const timeSpent = Date.now() - trackingStartTime;
        await updateTime(currentTab.url, timeSpent);
        console.log('Stopped tracking:', currentTab.url, 'Time:', timeSpent);
      }
      
      if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
      }
      
      isTracking = false;
      currentTab = null;
      trackingStartTime = null;
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  }
  
  // Periodic cleanup - run every 5 minutes instead of every minute
  setInterval(cleanupExpiredBlocks, 300000);
  
  // Handle extension context invalidation
  chrome.runtime.onSuspend.addListener(() => {
    console.log('Extension suspending, stopping tracking');
    stopTracking();
  });