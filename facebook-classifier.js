// TimeSetu :: Facebook Content Classifier

console.log("TimeSetu: Facebook Classifier content script loaded.");

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
            const fallbackCategory = getFallbackCategory(contentText, pageName, contentType);
            console.log(`TimeSetu: Fallback category: ${fallbackCategory}`);
            await chrome.storage.local.set({ 
                facebookClassification: { 
                    contentId: contentId,
                    contentType: contentType,
                    category: fallbackCategory,
                    source: 'fallback'
                } 
            });
            lastProcessedUrl = currentUrl;
            return;
        }
    }

    try {
        console.log("TimeSetu: Sending Facebook content to Google Gemini for classification...");
        
        const prompt = `You must classify this Facebook content into EXACTLY one category. Choose from: Productive, Entertainment, News, Social Media, or Other.

Category Definitions:
- Productive: Educational posts, tutorials, courses, learning content, productivity tips, how-to guides, professional content, business advice
- Entertainment: Funny posts, memes, jokes, entertainment videos, comedy, fun content, viral videos, reels for fun
- News: News articles, current events, political posts, breaking news, journalism, news updates, world events
- Social Media: Personal updates, social interactions, friend posts, family updates, social connections, general social content
- Other: Everything that doesn't clearly fit Productive, Entertainment, News, or Social Media

CRITICAL: You must respond with ONLY one word: either "Productive", "Entertainment", "News", "Social Media", or "Other". Do not include any other text, explanations, or punctuation.

Content Information:
Content Type: ${contentType}
Page/Author: "${pageName}"
Content Text: "${contentText}"

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
        } else if (firstWord === 'entertainment' || firstWord === 'entertain') {
            matchedCategory = 'Entertainment';
        } else if (firstWord === 'social' || category.includes('social media')) {
            matchedCategory = 'Social Media';
        } else if (firstWord === 'other') {
            matchedCategory = 'Other';
        } else {
            // Fallback to keyword matching in the full response
            if (category.includes('productive') || category.includes('education') || category.includes('tutorial') || category.includes('learn') || category.includes('course')) {
                matchedCategory = 'Productive';
            } else if (category.includes('news') && !category.includes('entertainment')) {
                matchedCategory = 'News';
            } else if (category.includes('entertain')) {
                matchedCategory = 'Entertainment';
            } else if (category.includes('social')) {
                matchedCategory = 'Social Media';
            } else {
                matchedCategory = 'Other';
            }
        }
        
        category = matchedCategory;

        const allowed = ['Productive', 'Entertainment', 'News', 'Social Media', 'Other'];
        if (!allowed.includes(category)) {
            console.warn('TimeSetu: Invalid category returned, defaulting to Other. Raw value:', rawCategory, 'Processed:', category);
            category = 'Other';
        }

        console.log(`TimeSetu: Final classification result: ${category} (from raw: "${rawCategory}")`);

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
        console.error('TimeSetu: Error during Facebook content classification:', error);
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

