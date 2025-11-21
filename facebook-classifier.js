// TimeSetu :: Facebook Content Classifier

console.log("TimeSetu: Facebook Classifier content script loaded.");

// Base URL for local AI backend (Node/Express server that calls Gemini)
// You can change the port here if you run the backend on a different port.
const DEFAULT_BACKEND_URL = 'http://localhost:4000';

async function getBackendUrl() {
    try {
        const { backendUrl } = await chrome.storage.local.get('backendUrl');
        return backendUrl || DEFAULT_BACKEND_URL;
    } catch (e) {
        console.warn('TimeSetu: Error reading backendUrl from storage, using default:', e);
        return DEFAULT_BACKEND_URL;
    }
}

let lastProcessedUrl = '';

async function classifyFacebookContent() {
    const currentUrl = window.location.href;
    if (currentUrl === lastProcessedUrl) {
        return; // Avoid re-processing the same URL
    }

    // Clear stale classification if navigating to a different page
    await chrome.storage.local.remove('facebookClassification');

    // Wait a bit for Facebook's dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract content from Facebook page
    let postText = '';
    let pageName = '';
    let videoTitle = '';
    let contentType = 'post'; // post, video, reel, story

    // Try to detect what type of content we're viewing
    const urlPath = window.location.pathname;
    
    // Check for video content
    if (urlPath.includes('/videos/') || urlPath.includes('/watch/')) {
        contentType = 'video';
        videoTitle = queryText([
            '[data-pagelet="VideoPage"] h1',
            'h1[dir="auto"]',
            '[role="main"] h1',
            'span[dir="auto"]'
        ]);
    }
    // Check for reels
    else if (urlPath.includes('/reel/') || urlPath.includes('/reels/')) {
        contentType = 'reel';
        videoTitle = queryText([
            '[data-pagelet="VideoPage"] h1',
            'h1[dir="auto"]',
            '[role="main"] h1'
        ]);
    }
    // Check for stories
    else if (urlPath.includes('/stories/')) {
        contentType = 'story';
    }

    // Extract post text (works for regular posts, videos, and reels)
    postText = queryText([
        '[data-ad-preview="message"]',
        '[data-testid="post_message"]',
        'div[data-ad-comet-preview="message"]',
        'div[dir="auto"][data-testid]',
        'span[dir="auto"]',
        'div.userContent'
    ]);

    // Extract page/author name
    pageName = queryText([
        'h2[dir="auto"] a',
        'strong[dir="auto"] a',
        'a[role="link"][tabindex="0"] strong',
        '[data-pagelet="ProfileTimeline"] h1',
        'span[dir="auto"] strong'
    ]);

    // Fallback: try to get from meta tags
    if (!postText && !videoTitle) {
        const metaDesc = document.querySelector("meta[property='og:description']");
        if (metaDesc) postText = metaDesc.content.trim();
    }

    if (!pageName) {
        const metaTitle = document.querySelector("meta[property='og:title']");
        if (metaTitle) {
            const titleParts = metaTitle.content.split(' - ');
            pageName = titleParts[0] || titleParts[titleParts.length - 1];
        }
    }

    // Limit text length
    postText = (postText || '').slice(0, 300);
    videoTitle = (videoTitle || '').slice(0, 200);

    const contentText = postText || videoTitle || '';
    
    if (!contentText && !pageName) {
        console.log("TimeSetu: Could not find Facebook content to classify.");
        await chrome.storage.local.remove('facebookClassification');
        return;
    }

    // Create a content identifier for caching
    const contentId = `${contentType}-${contentText.substring(0, 50)}-${pageName}`;

    // Optional cache: if stored classification already matches this content, skip re-querying
    const { facebookClassification: cached } = await chrome.storage.local.get('facebookClassification');
    if (cached?.contentId === contentId && cached?.category) {
        console.log('TimeSetu: Using cached Facebook classification:', cached.category);
        lastProcessedUrl = currentUrl;
        return;
    }

    console.log(`TimeSetu: Classifying Facebook content -> Type: "${contentType}", Page: "${pageName}", Text: "${contentText.substring(0, 100)}"`);

    try {
        console.log("TimeSetu: Sending Facebook content to local AI backend for classification...");

        const backendUrl = await getBackendUrl();
        const response = await fetch(`${backendUrl}/classify/facebook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contentText,
                pageName,
                contentType
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.error || `HTTP ${response.status}`;
            throw new Error(`Backend classification failed: ${errorMessage}`);
        }

        const data = await response.json();
        let category = data.category || 'Other';
        const rawCategory = data.rawCategory || '';

        console.log(`TimeSetu: Final Facebook classification result from backend: ${category} (raw: "${rawCategory}")`);

        // Store the result & cache
        await chrome.storage.local.set({ 
            facebookClassification: { 
                contentId: contentId,
                contentType: contentType,
                category: category,
                source: 'api'
            } 
        });
        lastProcessedUrl = currentUrl; // Mark success so we don't reprocess until URL changes

    } catch (error) {
        console.error('TimeSetu: Error during Facebook content classification via backend:', error);
        console.error('TimeSetu: Error stack:', error.stack);
        
        // ALWAYS use fallback categorization when backend/API fails
        console.log('TimeSetu: Backend failed, using fallback keyword-based categorization');
        const fallbackCategory = getFallbackCategory(contentText, pageName, contentType);
        console.log(`TimeSetu: Fallback category determined: ${fallbackCategory}`);
        
        // Store the fallback category so it can be used
        await chrome.storage.local.set({ 
            facebookClassification: { 
                contentId: contentId,
                contentType: contentType,
                category: fallbackCategory,
                source: 'fallback'
            } 
        });
        
        lastProcessedUrl = currentUrl; // Mark as processed so we don't retry immediately
    }
}

// Fallback categorization using keywords when API is unavailable
function getFallbackCategory(contentText, pageName, contentType) {
    if (!contentText && !pageName) return 'Social Media'; // Default for Facebook
    
    const text = `${contentText} ${pageName || ''}`.toLowerCase();
    console.log('TimeSetu: Analyzing text for fallback category:', text.substring(0, 100));
    
    // Productive keywords - expanded list
    const productiveKeywords = [
        'tutorial', 'learn', 'course', 'education', 'educational', 'how to', 'how-to',
        'coding', 'programming', 'lesson', 'lessons', 'study', 'studying', 'academic',
        'documentary', 'explained', 'explain', 'guide', 'training', 'workshop',
        'masterclass', 'lecture', 'university', 'college', 'school', 'skill',
        'productivity', 'productivity tips', 'tips', 'advice', 'business', 'professional',
        'career', 'job', 'work', 'entrepreneur', 'startup'
    ];
    
    // News keywords
    const newsKeywords = [
        'news', 'breaking', 'report', 'reports', 'update', 'updates', 'politics',
        'political', 'election', 'elections', 'journalism', 'journalist', 'headline',
        'breaking news', 'current events', 'world news', 'latest news', 'news update',
        'news report', 'live news', 'news channel', 'cnn', 'bbc', 'reuters'
    ];
    
    // Entertainment keywords - expanded but specific
    const entertainmentKeywords = [
        'music', 'song', 'songs', 'comedy', 'funny', 'vlog', 'vlogs', 'gaming',
        'gameplay', 'movie', 'movies', 'trailer', 'trailers', 'entertainment',
        'meme', 'memes', 'dance', 'dancing', 'prank', 'pranks', 'reaction',
        'reactions', 'challenge', 'challenges', 'fun', 'funny video', 'comedy video',
        'viral', 'trending', 'laugh', 'lol', 'haha'
    ];
    
    // Social Media keywords (for personal/social content)
    const socialKeywords = [
        'birthday', 'congratulations', 'anniversary', 'wedding', 'graduation',
        'family', 'friends', 'vacation', 'trip', 'party', 'celebration',
        'update', 'status', 'check in', 'feeling', 'thinking', 'proud'
    ];
    
    // Check in order: Productive, News, Entertainment, Social Media
    // Count matches to be more accurate
    const productiveMatches = productiveKeywords.filter(keyword => text.includes(keyword)).length;
    const newsMatches = newsKeywords.filter(keyword => text.includes(keyword)).length;
    const entertainmentMatches = entertainmentKeywords.filter(keyword => text.includes(keyword)).length;
    const socialMatches = socialKeywords.filter(keyword => text.includes(keyword)).length;
    
    console.log(`TimeSetu: Keyword matches - Productive: ${productiveMatches}, News: ${newsMatches}, Entertainment: ${entertainmentMatches}, Social: ${socialMatches}`);
    
    // Return category with most matches, or default priority order
    if (productiveMatches > 0 && productiveMatches >= newsMatches && productiveMatches >= entertainmentMatches && productiveMatches >= socialMatches) {
        return 'Productive';
    }
    if (newsMatches > 0 && newsMatches >= entertainmentMatches && newsMatches >= socialMatches) {
        return 'News';
    }
    if (entertainmentMatches > 0 && entertainmentMatches >= socialMatches) {
        return 'Entertainment';
    }
    if (socialMatches > 0) {
        return 'Social Media';
    }
    
    // Default to Social Media for Facebook (most common)
    return 'Social Media';
}

// Helper to retrieve text from first matching selector in list
function queryText(selectors) {
    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent && el.textContent.trim()) {
            return el.textContent.trim();
        }
    }
    return '';
}

// === URL watcher using setInterval ===
function startUrlWatcher() {
    let previousUrl = location.href;
    
    // Check if we're on a Facebook page that should be classified
    if (isFacebookContentPage()) {
        classifyFacebookContent(); // Initial check
    }

    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== previousUrl) {
            previousUrl = currentUrl;

            if (isFacebookContentPage()) {
                classifyFacebookContent();
            } else {
                // Navigated away from content page – clear stored classification
                lastProcessedUrl = '';
                chrome.storage.local.remove('facebookClassification');
            }
        }
    }, 2000); // Check every 2 seconds (Facebook loads content dynamically)
}

// Check if current page is a Facebook content page worth classifying
function isFacebookContentPage() {
    const url = window.location.href;
    const path = window.location.pathname;
    
    // Classify posts, videos, reels, stories, and profile pages
    return url.includes('facebook.com') && (
        path.includes('/videos/') ||
        path.includes('/watch/') ||
        path.includes('/reel/') ||
        path.includes('/reels/') ||
        path.includes('/stories/') ||
        path.match(/^\/[^\/]+\/posts\/\d+/) || // Post URLs like /username/posts/123
        path.match(/^\/[^\/]+\/photos\/\d+/) || // Photo posts
        path.includes('/permalink/') ||
        (path === '/' || path === '/home.php') // Main feed
    );
}

// Wait for full page load before starting the watcher
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startUrlWatcher();
} else {
    document.addEventListener('DOMContentLoaded', startUrlWatcher);
}

// Also watch for Facebook's dynamic content loading
function setupMutationObserver() {
    if (!document.body) {
        setTimeout(setupMutationObserver, 500);
        return;
    }
    
    const observer = new MutationObserver(() => {
        if (isFacebookContentPage() && location.href !== lastProcessedUrl) {
            setTimeout(() => classifyFacebookContent(), 1000);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

setupMutationObserver();

// --- end facebook-classifier.js ---

