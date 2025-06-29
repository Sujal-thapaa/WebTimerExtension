// TimeSetu :: YouTube Video Classifier

console.log("TimeSetu: YouTube Classifier content script loaded.");

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

    // Optional cache: if stored classification already matches this title, skip re-querying
    const { youtubeClassification: cached } = await chrome.storage.local.get('youtubeClassification');
    if (cached?.title === videoTitle && cached?.category) {
        console.log('TimeSetu: Using cached classification:', cached.category);
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

    try {
        console.log("TimeSetu: Sending metadata to OpenRouter for classification...");
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI that classifies YouTube videos into one of the following categories: Productive, Entertainment, News, or Other. Only return the category name.'
                    },
                    {
                        role: 'user',
                        content: `Classify the YouTube content into one of these categories: Productive, Entertainment, News, or Other.\n\nTitle: "${videoTitle}"\nChannel: "${channelName}"\nDescription: "${descriptionText}"`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        let category = data.choices[0].message.content.trim();
        // Sanitize common punctuation
        category = category.replace(/[\.:;\-]+$/g, '').toLowerCase();

        // Map to allowed categories using keywords
        if (category.includes('productive') || category.includes('education')) {
            category = 'Productive';
        } else if (category.includes('news')) {
            category = 'News';
        } else if (category.includes('entertain')) {
            category = 'Entertainment';
        } else {
            category = 'Other';
        }

        const allowed = ['Productive', 'Entertainment', 'News', 'Other'];
        if (!allowed.includes(category)) {
            console.warn('TimeSetu: Invalid category returned, defaulting to Other. Raw value:', category);
            category = 'Other';
        }

        console.log(`TimeSetu: Classification result: ${category}`);

        // Store the result & cache
        await chrome.storage.local.set({ youtubeClassification: { title: videoTitle, category: category } });
        lastProcessedUrl = currentUrl; // Mark success so we don't reprocess until URL changes

    } catch (error) {
        console.error('TimeSetu: Error during video classification:', error);
        await chrome.storage.local.remove('youtubeClassification');
        // Allow retry on next DOM change
        lastProcessedUrl = '';
    }
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

// === URL watcher using setInterval ===
function startUrlWatcher() {
    let previousUrl = location.href;
    if (location.pathname === '/watch') {
        classifyVideoTitle(); // Initial check
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
            }
        }
    }, 1000);
}

// Wait for full page load before starting the watcher
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startUrlWatcher();
} else {
    document.addEventListener('DOMContentLoaded', startUrlWatcher);
}

// --- end youtube-classifier.js --- 