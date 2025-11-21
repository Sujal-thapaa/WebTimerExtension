// TimeSetu :: YouTube Video Classifier

console.log("TimeSetu: YouTube Classifier content script loaded.");

const API_KEY = "AIzaSyCmR5kLpMtNFzl5gx0c20L8JvCOxG28_Ko";
// Try different model endpoints - will fallback if one fails
// Common Gemini API model names: gemini-1.5-flash, gemini-1.5-pro, gemini-pro
const API_MODELS = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`
];
let currentApiUrlIndex = 0;

let lastProcessedUrl = '';

async function classifyVideoTitle() {
    const currentUrl = window.location.href;
    if (currentUrl === lastProcessedUrl) {
        return; // Avoid re-processing the same video URL
    }

    // Clear stale classification if navigating to a different page
    await chrome.storage.local.remove('youtubeClassification');

    // Ensure the main elements are present (wait for up to 5 s)
    const titleElement = await waitForElement([
        '#title yt-formatted-string',
        'h1.title',
        'h1.ytd-watch-metadata',
        'h1.ytd-video-primary-info-renderer'
    ]);
    
    if (!titleElement || !titleElement.innerText) {
        console.log("TimeSetu: Could not find video title element. Clearing classification.");
        await chrome.storage.local.remove('youtubeClassification');
        return;
    }

    let videoTitle = queryText([
        '#title yt-formatted-string',
        'h1.title',
        'h1.ytd-watch-metadata',
        'h1.ytd-video-primary-info-renderer'
    ]);
    // Fallback to document.title minus " - YouTube"
    if (!videoTitle) {
        videoTitle = document.title.replace(/ - YouTube$/i, '').trim();
    }

    // Check if this video is already classified and if it's blocked
    const { youtubeClassification: cached, blockedYouTubeCategories = [] } = await chrome.storage.local.get(['youtubeClassification', 'blockedYouTubeCategories']);
    if (cached?.title === videoTitle && cached?.category) {
        console.log('TimeSetu: Using cached classification:', cached.category);
        // Still check if it's blocked even if cached
        if (blockedYouTubeCategories.includes(cached.category)) {
            console.log(`TimeSetu: Cached video category "${cached.category}" is blocked. Hiding video.`);
            hideCurrentVideo();
        }
        lastProcessedUrl = currentUrl;
        return;
    }

    // Get channel name and first 200 chars of description
    const channelName = queryText([
        '#text-container.ytd-channel-name',
        '#owner-name a',
        '#channel-name #text'
    ]);

    let descriptionText = queryText(['#description', '#description yt-formatted-string']);
    if (!descriptionText) {
        const metaDesc = document.querySelector("meta[name='description']");
        if (metaDesc) descriptionText = metaDesc.content.trim();
    }
    descriptionText = descriptionText.slice(0, 200);

    console.log(`TimeSetu: Classifying video -> Title: "${videoTitle}", Channel: "${channelName}"`);

    // Check if API is temporarily disabled due to failures
    const { apiDisabled, apiDisabledUntil, apiFailureCount } = await chrome.storage.local.get(['apiDisabled', 'apiDisabledUntil', 'apiFailureCount']);
    
    // If API is disabled or has failed 5+ times, skip API and use fallback immediately
    const shouldSkipApi = (apiDisabled && apiDisabledUntil && Date.now() < apiDisabledUntil) || (apiFailureCount >= 5);
    
    if (shouldSkipApi) {
        if (apiDisabled && apiDisabledUntil && Date.now() >= apiDisabledUntil) {
            // Re-enable API after the timeout period
            await chrome.storage.local.remove(['apiDisabled', 'apiDisabledUntil', 'apiFailureCount']);
            console.log('TimeSetu: API re-enabled after timeout period.');
        } else {
            console.log('TimeSetu: API disabled or too many failures. Using fallback categorization immediately.');
            // Use keyword-based fallback
            const fallbackCategory = getFallbackCategory(videoTitle, channelName, descriptionText);
            console.log(`TimeSetu: Fallback category: ${fallbackCategory}`);
            await chrome.storage.local.set({ 
                youtubeClassification: { 
                    title: videoTitle, 
                    category: fallbackCategory,
                    source: 'fallback'
                } 
            });
            lastProcessedUrl = currentUrl;
            return;
        }
    }

    try {
        console.log("TimeSetu: Sending metadata to Google Gemini for classification...");
        
        const prompt = `You must classify this YouTube video into EXACTLY one category. Choose from: Productive, Entertainment, News, Games, or Other.

Category Definitions:
- Productive: Educational videos, tutorials, courses, coding lessons, learning content, productivity tips, how-to guides, documentaries about learning
- Entertainment: Music videos, comedy, vlogs, movie trailers, TV shows, fun/leisure content, memes (NOT gaming videos)
- News: News reports, current events, political news, breaking news, journalism, news analysis, world events
- Games: Gaming videos, gameplay, game reviews, game walkthroughs, esports, gaming streams, game-related content
- Other: Everything that doesn't clearly fit Productive, Entertainment, News, or Games

CRITICAL: You must respond with ONLY one word: either "Productive", "Entertainment", "News", "Games", or "Other". Do not include any other text, explanations, or punctuation.

Video Information:
Title: "${videoTitle}"
Channel: "${channelName}"
Description: "${descriptionText}"

Your response (one word only):`;

        // Try API endpoints in order until one works
        let response = null;
        let lastError = null;
        
        for (let i = currentApiUrlIndex; i < API_MODELS.length; i++) {
            try {
                console.log(`TimeSetu: Trying API endpoint ${i + 1}/${API_MODELS.length}`);
                response = await fetch(API_MODELS[i], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
            })
        });

                if (response.ok) {
                    currentApiUrlIndex = i; // Remember which endpoint worked
                    console.log(`TimeSetu: Successfully using API endpoint ${i + 1}`);
                    break;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData?.error?.message || errorData?.error || 'Unknown error';
                    const errorDetails = errorData?.error || errorData;
                    lastError = `API endpoint ${i + 1} failed with status ${response.status}: ${errorMessage}`;
                    console.error(`TimeSetu: ${lastError}`);
                    console.error('TimeSetu: Full error details:', errorDetails);
                    console.error('TimeSetu: Endpoint tried:', API_MODELS[i]);
                    if (i < API_MODELS.length - 1) {
                        continue; // Try next endpoint
                    }
                }
            } catch (err) {
                lastError = `API endpoint ${i + 1} error: ${err.message}`;
                console.warn(`TimeSetu: ${lastError}`);
                if (i < API_MODELS.length - 1) {
                    continue; // Try next endpoint
                }
            }
        }

        if (!response || !response.ok) {
            throw new Error(`All API endpoints failed. Last error: ${lastError || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('TimeSetu: Raw Gemini response:', data);
        
        // Extract the text from Gemini response
        let rawCategory = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            rawCategory = data.candidates[0].content.parts[0].text.trim();
        } else {
            throw new Error('Unexpected response structure from Gemini API');
        }
        
        console.log('TimeSetu: Raw category from Gemini:', rawCategory);
        
        // Clean and normalize the response - remove quotes, extra whitespace, punctuation
        let category = rawCategory.replace(/["'`]/g, '').replace(/[\.:;\-]+$/g, '').trim().toLowerCase();
        
        // Extract first word if response contains multiple words
        const firstWord = category.split(/\s+/)[0];
        
        // More precise category matching - check exact matches first
        let matchedCategory = null;
        
        // Check exact match on first word
        if (firstWord === 'productive' || firstWord === 'education' || firstWord === 'educational') {
            matchedCategory = 'Productive';
        } else if (firstWord === 'news') {
            matchedCategory = 'News';
        } else if (firstWord === 'games' || firstWord === 'gaming' || firstWord === 'game') {
            matchedCategory = 'Games';
        } else if (firstWord === 'entertainment' || firstWord === 'entertain') {
            matchedCategory = 'Entertainment';
        } else if (firstWord === 'other') {
            matchedCategory = 'Other';
        } else {
            // Fallback to keyword matching in the full response (prioritize Productive, News, Games, then Entertainment)
            if (category.includes('productive') || category.includes('education') || category.includes('tutorial') || category.includes('learn') || category.includes('course')) {
                matchedCategory = 'Productive';
            } else if (category.includes('news') && !category.includes('entertainment')) {
                matchedCategory = 'News';
            } else if (category.includes('game') && !category.includes('entertainment')) {
                matchedCategory = 'Games';
            } else if (category.includes('entertain')) {
                matchedCategory = 'Entertainment';
            } else {
                matchedCategory = 'Other';
            }
        }
        
        category = matchedCategory;

        const allowed = ['Productive', 'Entertainment', 'News', 'Games', 'Other'];
        if (!allowed.includes(category)) {
            console.warn('TimeSetu: Invalid category returned, defaulting to Other. Raw value:', rawCategory, 'Processed:', category);
            category = 'Other';
        }

        console.log(`TimeSetu: Final classification result: ${category} (from raw: "${rawCategory}")`);

        // Check if this category is blocked
        const { blockedYouTubeCategories = [] } = await chrome.storage.local.get('blockedYouTubeCategories');
        console.log('TimeSetu: Checking if category is blocked. Category:', category, 'Blocked categories:', blockedYouTubeCategories);
        
        if (blockedYouTubeCategories.includes(category)) {
            console.log(`TimeSetu: Video category "${category}" is blocked. Hiding video.`);
            hideCurrentVideo();
        } else {
            console.log(`TimeSetu: Category "${category}" is not blocked.`);
        }

        // Store the result & cache
        await chrome.storage.local.set({ youtubeClassification: { title: videoTitle, category: category } });
        lastProcessedUrl = currentUrl; // Mark success so we don't reprocess until URL changes

    } catch (error) {
        console.error('TimeSetu: Error during video classification:', error);
        console.error('TimeSetu: Error stack:', error.stack);
        
        // Track API failures to avoid wasting quota
        const { apiFailureCount = 0 } = await chrome.storage.local.get('apiFailureCount');
        const newFailureCount = apiFailureCount + 1;
        await chrome.storage.local.set({ apiFailureCount: newFailureCount });
        
        // If too many failures, disable API calls for a while
        if (newFailureCount >= 5) {
            console.warn('TimeSetu: Too many API failures. Disabling API calls temporarily. Using fallback categorization.');
            await chrome.storage.local.set({ 
                apiDisabled: true, 
                apiDisabledUntil: Date.now() + (60 * 60 * 1000) // Disable for 1 hour
            });
        }
        
        // ALWAYS use fallback categorization when API fails
        console.log('TimeSetu: API failed, using fallback keyword-based categorization');
        const fallbackCategory = getFallbackCategory(videoTitle, channelName, descriptionText);
        console.log(`TimeSetu: Fallback category determined: ${fallbackCategory}`);
        
        // Check if this category is blocked
        const { blockedYouTubeCategories = [] } = await chrome.storage.local.get('blockedYouTubeCategories');
        console.log('TimeSetu: Checking if fallback category is blocked. Category:', fallbackCategory, 'Blocked categories:', blockedYouTubeCategories);
        
        if (blockedYouTubeCategories.includes(fallbackCategory)) {
            console.log(`TimeSetu: Video category "${fallbackCategory}" is blocked. Hiding video.`);
            hideCurrentVideo();
        } else {
            console.log(`TimeSetu: Fallback category "${fallbackCategory}" is not blocked.`);
        }
        
        // Store the fallback category so it can be used
        await chrome.storage.local.set({ 
            youtubeClassification: { 
                title: videoTitle, 
                category: fallbackCategory,
                source: 'fallback' // Mark that this came from fallback, not API
            } 
        });
        
        lastProcessedUrl = currentUrl; // Mark as processed so we don't retry immediately
    }
}

// Function to hide the current video if it's blocked
function hideCurrentVideo() {
    console.log('TimeSetu: hideCurrentVideo() called - blocking video');
    
    // Remove any existing overlay first
    const existingOverlay = document.getElementById('timesetu-block-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Hide the video player - try multiple selectors
    const playerSelectors = ['#movie_player', '#player', 'ytd-player', '#player-container', '#player-container-inner'];
    playerSelectors.forEach(selector => {
        const player = document.querySelector(selector);
        if (player) {
            player.style.display = 'none';
            console.log(`TimeSetu: Hid player element: ${selector}`);
        }
    });
    
    // Hide the main content area
    const mainContent = document.querySelector('#primary, #primary-inner, ytd-watch-flexy');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Create a blocking overlay
    const overlay = document.createElement('div');
    overlay.id = 'timesetu-block-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        padding: 40px;
    `;
    
    overlay.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">🚫</div>
        <h1 style="font-size: 2rem; margin: 0 0 16px 0; color: #ff6b6b;">Content Blocked</h1>
        <p style="font-size: 1.1rem; color: #a0a0b8; max-width: 500px; margin: 0 0 24px 0;">
            This video category has been blocked in your TimeSetu settings.
        </p>
        <button id="timesetu-go-back" style="
            background: #4a90e2;
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        ">Go Back</button>
    `;
    
    document.body.appendChild(overlay);
    
    // Add click handler for go back button
    overlay.querySelector('#timesetu-go-back').addEventListener('click', () => {
        window.history.back();
    });
    
    // Also hide related videos and comments
    const relatedSection = document.querySelector('#secondary, #related, #comments');
    if (relatedSection) {
        relatedSection.style.display = 'none';
    }
    
    // Prevent video from playing by stopping any media
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.pause();
        video.style.display = 'none';
    });
}

// Fallback categorization using keywords when API is unavailable
function getFallbackCategory(title, channel, description) {
    if (!title) return 'Other';
    
    const text = `${title} ${channel || ''} ${description || ''}`.toLowerCase();
    console.log('TimeSetu: Analyzing text for fallback category:', text.substring(0, 100));
    
    // Productive keywords - expanded list
    const productiveKeywords = [
        'tutorial', 'learn', 'course', 'education', 'educational', 'how to', 'how-to',
        'coding', 'programming', 'lesson', 'lessons', 'study', 'studying', 'academic',
        'documentary', 'explained', 'explain', 'guide', 'training', 'workshop',
        'masterclass', 'lecture', 'university', 'college', 'school', 'skill',
        'productivity', 'productivity tips', 'tips', 'advice', 'learn', 'learning'
    ];
    
    // News keywords - expanded list for better detection
    const newsKeywords = [
        'news', 'breaking', 'report', 'reports', 'update', 'updates', 'politics',
        'political', 'election', 'elections', 'journalism', 'journalist', 'headline',
        'breaking news', 'current events', 'world news', 'latest news', 'news update',
        'news report', 'live news', 'news channel', 'cnn', 'bbc', 'reuters', 'fox news',
        'al jazeera', 'sky news', 'news today', 'news now', 'news live', 'news break',
        'news flash', 'news alert', 'news coverage', 'news analysis', 'newsroom',
        'press conference', 'news conference', 'breaking story', 'news story',
        'news headline', 'top news', 'news briefing', 'news bulletin', 'news anchor',
        'news broadcast', 'news segment', 'news update', 'news today', 'news hour'
    ];
    
    // Entertainment keywords - expanded but specific (excluding gaming)
    const entertainmentKeywords = [
        'music', 'song', 'songs', 'comedy', 'funny', 'vlog', 'vlogs',
        'movie', 'movies', 'trailer', 'trailers', 'entertainment',
        'meme', 'memes', 'dance', 'dancing', 'prank', 'pranks', 'reaction',
        'reactions', 'challenge', 'challenges', 'fun', 'funny video', 'comedy video'
    ];
    
    // Games keywords
    const gamesKeywords = [
        'gaming', 'gameplay', 'game', 'games', 'playthrough', 'walkthrough',
        'gamer', 'esports', 'twitch', 'stream', 'livestream', 'speedrun',
        'minecraft', 'fortnite', 'valorant', 'league of legends', 'csgo', 'cs:go'
    ];
    
    // Check in order: Productive, News, Games, Entertainment
    // Count matches to be more accurate
    const productiveMatches = productiveKeywords.filter(keyword => text.includes(keyword)).length;
    const newsMatches = newsKeywords.filter(keyword => text.includes(keyword)).length;
    const gamesMatches = gamesKeywords.filter(keyword => text.includes(keyword)).length;
    const entertainmentMatches = entertainmentKeywords.filter(keyword => text.includes(keyword)).length;
    
    console.log(`TimeSetu: Keyword matches - Productive: ${productiveMatches}, News: ${newsMatches}, Games: ${gamesMatches}, Entertainment: ${entertainmentMatches}`);
    
    // Return category with most matches, or default priority order
    // News gets higher priority if it has any matches (since it's often time-sensitive)
    if (newsMatches > 0 && newsMatches >= productiveMatches && newsMatches >= gamesMatches && newsMatches >= entertainmentMatches) {
        return 'News';
    }
    if (productiveMatches > 0 && productiveMatches >= gamesMatches && productiveMatches >= entertainmentMatches) {
        return 'Productive';
    }
    if (gamesMatches > 0 && gamesMatches >= entertainmentMatches) {
        return 'Games';
    }
    if (entertainmentMatches > 0) {
        return 'Entertainment';
    }
    
    // Default to Other if no keywords match
    return 'Other';
}

// Helper to retrieve text from first matching selector in list
function queryText(selectors) {
    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
}

// Update waitForElement to accept array of selectors and resolve when any matches
function waitForElement(selectors, timeout = 7000) {
    if (typeof selectors === 'string') selectors = [selectors];
    return new Promise(resolve => {
        const interval = 100;
        const endTime = Date.now() + timeout;
        const check = () => {
            for (const sel of selectors) {
                const element = document.querySelector(sel);
                if (element) {
                    return resolve(element);
                }
            }
            if (Date.now() < endTime) {
                setTimeout(check, interval);
            } else {
                resolve(null);
            }
        };
        check();
    });
}

// Function to check and hide blocked videos in feed/search results
async function checkAndHideBlockedVideos() {
    const { blockedYouTubeCategories = [] } = await chrome.storage.local.get('blockedYouTubeCategories');
    console.log('TimeSetu: Checking videos for blocked categories:', blockedYouTubeCategories);
    
    if (blockedYouTubeCategories.length === 0) {
        // If no categories are blocked, show all videos
        document.querySelectorAll('[data-timesetu-blocked="true"]').forEach(el => {
            el.style.display = '';
            el.removeAttribute('data-timesetu-blocked');
        });
        return;
    }
    
    // Get all video elements on the page - use more comprehensive selectors
    const videoElements = document.querySelectorAll(
        'ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ' +
        'ytd-rich-item-renderer, ytd-playlist-video-renderer, ytd-video-meta-block'
    );
    console.log('TimeSetu: Found', videoElements.length, 'video elements to check');
    
    // Process videos synchronously to avoid race conditions
    for (const element of videoElements) {
        // Skip if already processed and blocked
        if (element.dataset.timesetuBlocked === 'true') continue;
        
        // Try multiple selectors for title - be more aggressive
        let titleElement = element.querySelector('#video-title, a#video-title, ytd-video-meta-block #video-title, h3 a, #video-title-link, [id*="video-title"]');
        if (!titleElement) {
            const parent = element.closest('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer');
            if (parent) {
                titleElement = parent.querySelector('#video-title, a#video-title, h3 a, #video-title-link, [id*="video-title"]');
            }
        }
        // Last resort: try to find any link with /watch in it
        if (!titleElement) {
            const watchLink = element.querySelector('a[href*="/watch"]');
            if (watchLink) {
                titleElement = watchLink;
            }
        }
        
        if (!titleElement) continue;
        
        const videoTitle = titleElement.textContent?.trim() || titleElement.innerText?.trim() || titleElement.getAttribute('title') || titleElement.getAttribute('aria-label') || '';
        if (!videoTitle || videoTitle.length < 3) continue;
        
        // Get channel name for better classification
        const channelElement = element.querySelector('#channel-name a, #channel-info a, ytd-channel-name a, #channel-name, #text-container a') ||
                              element.closest('ytd-video-renderer, ytd-grid-video-renderer')?.querySelector('#channel-name a, #channel-info a');
        const channelName = channelElement ? (channelElement.textContent?.trim() || channelElement.innerText?.trim() || '') : '';
        
        // Use fallback categorization for quick check
        const fallbackCategory = getFallbackCategory(videoTitle, channelName, '');
        
        // Also check cached classification if available
        const { youtubeClassification } = await chrome.storage.local.get('youtubeClassification');
        let finalCategory = fallbackCategory;
        
        // Prefer cached classification if it exists and matches this video
        if (youtubeClassification && youtubeClassification.title === videoTitle && youtubeClassification.category) {
            finalCategory = youtubeClassification.category;
            console.log(`TimeSetu: Using cached category "${finalCategory}" for "${videoTitle.substring(0, 50)}"`);
        } else {
            console.log(`TimeSetu: Using fallback category "${fallbackCategory}" for "${videoTitle.substring(0, 50)}"`);
        }
        
        console.log(`TimeSetu: Video "${videoTitle.substring(0, 50)}" -> Category: ${finalCategory}, Blocked: ${blockedYouTubeCategories.includes(finalCategory)}`);
        
        // Check if this category is blocked
        if (blockedYouTubeCategories.includes(finalCategory)) {
            element.style.display = 'none';
            element.dataset.timesetuBlocked = 'true';
            // Also hide parent containers
            const parent = element.closest('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer');
            if (parent) {
                parent.style.display = 'none';
                parent.dataset.timesetuBlocked = 'true';
            }
            console.log(`TimeSetu: ✅ HIDING blocked video: "${videoTitle}" (Category: ${finalCategory})`);
        } else {
            // Make sure it's visible if not blocked
            element.style.display = '';
            element.dataset.timesetuBlocked = 'false';
        }
    }
}

// Listen for messages to update blocked categories
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateBlockedCategories') {
        console.log('TimeSetu: Received updateBlockedCategories message:', message.blockedCategories);
        // Immediately check and hide blocked videos in feed
        checkAndHideBlockedVideos();
        // Also check current video if on watch page
        if (location.pathname === '/watch') {
            console.log('TimeSetu: Re-checking current video after category update');
            // Force re-check by clearing cache
            lastProcessedUrl = '';
            chrome.storage.local.remove('youtubeClassification').then(() => {
                classifyVideoTitle();
            });
        }
        sendResponse({ success: true });
    }
    return true; // Keep message channel open for async response
});

// === URL watcher using setInterval ===
function startUrlWatcher() {
    let previousUrl = location.href;
    if (location.pathname === '/watch') {
        classifyVideoTitle(); // Initial check
    } else {
        // Check feed/search results for blocked videos
        checkAndHideBlockedVideos();
    }

    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== previousUrl) {
            previousUrl = currentUrl;

            if (location.pathname === '/watch') {
                classifyVideoTitle();
            } else {
                // Navigated away from a video – clear stored classification
                lastProcessedUrl = '';
                chrome.storage.local.remove('youtubeClassification');
                // Check feed/search results for blocked videos
                setTimeout(() => checkAndHideBlockedVideos(), 1000);
            }
        }
    }, 1000);
    
    // Also watch for dynamic content loading (YouTube's infinite scroll)
    const observer = new MutationObserver(() => {
        if (location.pathname !== '/watch') {
            // Debounce to avoid too many calls
            clearTimeout(window.timesetuBlockCheckTimeout);
            window.timesetuBlockCheckTimeout = setTimeout(() => {
                checkAndHideBlockedVideos();
            }, 300);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also run periodically to catch any videos that might have been missed
    setInterval(() => {
        if (location.pathname !== '/watch') {
            checkAndHideBlockedVideos();
        }
    }, 2000); // Check every 2 seconds
}

// Wait for full page load before starting the watcher
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startUrlWatcher();
} else {
    document.addEventListener('DOMContentLoaded', startUrlWatcher);
}

// --- end youtube-classifier.js --- 