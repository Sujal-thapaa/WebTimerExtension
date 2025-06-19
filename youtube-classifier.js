// WebTimeWise :: YouTube Video Classifier

console.log("WebTimeWise: YouTube Classifier content script loaded.");

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

let lastProcessedUrl = '';

async function classifyVideoTitle() {
    const currentUrl = window.location.href;
    if (currentUrl === lastProcessedUrl) {
        return; // Avoid re-processing the same video
    }

    // YouTube titles can take a moment to load, especially on navigation
    const titleElement = await waitForElement('h1.title yt-formatted-string');
    
    if (!titleElement || !titleElement.innerText) {
        console.log("WebTimeWise: Could not find video title element.");
        return;
    }

    const videoTitle = titleElement.innerText.trim();
    if (!videoTitle) {
        return;
    }

    console.log(`WebTimeWise: Found video title: "${videoTitle}"`);
    lastProcessedUrl = currentUrl; // Mark this URL as processed

    try {
        console.log("WebTimeWise: Sending title to OpenRouter for classification...");
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
                        content: `Classify this title: "${videoTitle}"`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const category = data.choices[0].message.content.trim();
        console.log(`WebTimeWise: Classification result: ${category}`);

        // Store the result
        await chrome.storage.local.set({ youtubeClassification: { title: videoTitle, category: category } });

    } catch (error) {
        console.error('WebTimeWise: Error during video classification:', error);
        await chrome.storage.local.remove('youtubeClassification');
    }
}

// Helper function to wait for an element to appear in the DOM
function waitForElement(selector, timeout = 5000) {
    return new Promise(resolve => {
        const interval = 100;
        const endTime = Date.now() + timeout;

        const check = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() < endTime) {
                setTimeout(check, interval);
            } else {
                resolve(null);
            }
        };
        check();
    });
}


// YouTube is a Single Page App, so we need to observe for navigation changes
const observer = new MutationObserver(() => {
    if (window.location.href !== lastProcessedUrl && window.location.pathname === '/watch') {
        classifyVideoTitle();
    } else if (window.location.pathname !== '/watch') {
        // Clear the classification if we navigate away from a video
        lastProcessedUrl = '';
        chrome.storage.local.remove('youtubeClassification');
    }
});

// Start observing the <title> tag, which changes on every YouTube navigation
observer.observe(document.querySelector('title'), { childList: true });

// Initial run in case the script is injected directly on a video page
if (window.location.pathname === '/watch') {
    classifyVideoTitle();
} 