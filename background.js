// --- CATEGORY DEFINITIONS ---
const CATEGORY_KEYWORDS = {
    'Social Media': {
      keywords: ['social', 'network', 'friend', 'post', 'share', 'status', 'community', 'message'],
      domains: ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com']
    },
    'Entertainment': {
      keywords: ['video', 'music', 'movie', 'entertainment', 'fun'],
      domains: ['youtube.com', 'netflix.com', 'spotify.com']
    },
    'Productive / Educational': {
      keywords: ['learn', 'study', 'tutorial', 'education', 'research', 'notion'],
      domains: ['khanacademy.org', 'coursera.org', 'notion.so', 'edx.org']
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
  
  // --- INITIALIZATION ---
  chrome.runtime.onInstalled.addListener(async () => {
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
      await chrome.storage.local.set({ goals: { productiveHours: 4, entertainmentHours: 2, streak: 0 } });
    }
  
    await setupBlockingRules();
    scheduleMidnightReset();
  });
  
  chrome.runtime.onStartup.addListener(async () => {
    await cleanupExpiredBlocks();
    await setupBlockingRules();
    // --- Clean up previous day's notifications ---
    const all = await chrome.storage.local.get(null);
    const today = getTodayString();
    for (const key of Object.keys(all)) {
      if (key.startsWith('goalNotified_') && !key.includes(today)) {
        await chrome.storage.local.remove(key);
      }
    }
    scheduleMidnightReset();
  });
  
  // --- WEBSITE BLOCKING ---
  async function setupBlockingRules() {
    const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
    const now = Date.now();
    const activeSites = blockedSites.filter(site => site.expiresAt > now);
  
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
      removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(r => r.id),
      addRules: rules
    });
  }
  
  async function cleanupExpiredBlocks() {
    const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
    const now = Date.now();
    const updated = blockedSites.filter(site => site.expiresAt > now);
    await chrome.storage.local.set({ blockedSites: updated });
  }
  
  // --- BLOCK SITE MESSAGE HANDLER ---
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'addBlock') {
      addBlockedSite(request.url, request.duration).then(res => sendResponse({ success: res }));
      return true;
    }
    if (request.action === 'removeBlock') {
      removeBlockedSite(request.url).then(res => sendResponse({ success: res }));
      return true;
    }
    if (request.action === 'getBlockedSites') {
      getBlockedSites().then(res => sendResponse(res));
      return true;
    }
  });
  
  async function addBlockedSite(url, durationMinutes) {
    const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
    const expiresAt = Date.now() + durationMinutes * 60000;
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