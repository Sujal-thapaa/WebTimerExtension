// Keywords for content classification
const PRODUCTIVE_KEYWORDS = [
    'learn', 'tutorial', 'how to', 'guide', 'study', 'course',
    'education', 'lecture', 'lesson', 'training', 'skills',
    'programming', 'development', 'science', 'math', 'history',
    'research', 'analysis', 'explanation', 'documentation'
];

const ENTERTAINMENT_KEYWORDS = [
    'funny', 'prank', 'celebrity', 'vlog', 'comedy', 'reaction',
    'meme', 'entertainment', 'gaming', 'gameplay', 'fun',
    'music video', 'movie', 'trailer', 'show', 'drama',
    'highlights', 'compilation', 'viral', 'trending'
];

// Function to extract text content from YouTube
function extractYouTubeContent() {
    const content = {
        title: '',
        channelName: '',
        description: '',
        otherText: ''
    };

    // Get video title (try multiple selectors)
    const titleSelectors = [
        'h1.ytd-video-primary-info-renderer',
        '#video-title',
        'ytd-video-primary-info-renderer .title'
    ];
    
    for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
            content.title = titleElement.textContent.trim();
            break;
        }
    }

    // Get channel name (try multiple selectors)
    const channelSelectors = [
        '#channel-name .ytd-channel-name',
        '#owner-name a',
        'ytd-video-owner-renderer .ytd-channel-name'
    ];
    
    for (const selector of channelSelectors) {
        const channelElement = document.querySelector(selector);
        if (channelElement && channelElement.textContent.trim()) {
            content.channelName = channelElement.textContent.trim();
            break;
        }
    }

    // Get video description (try multiple selectors)
    const descriptionSelectors = [
        '#description ytd-expanded-metadata-renderer',
        '#description',
        'ytd-expander#description'
    ];
    
    for (const selector of descriptionSelectors) {
        const descElement = document.querySelector(selector);
        if (descElement && descElement.textContent.trim()) {
            content.description = descElement.textContent.trim();
            break;
        }
    }

    // Get other relevant text (video titles in recommendations, etc.)
    const videoRenderers = document.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer');
    const otherText = Array.from(videoRenderers)
        .map(renderer => {
            const title = renderer.querySelector('#video-title');
            return title ? title.textContent.trim() : '';
        })
        .filter(text => text)
        .join(' ');
    content.otherText = otherText;

    // Log the extracted content for debugging
    console.log('Extracted YouTube content:', content);

    return content;
}

// Function to extract general page content
function extractPageContent() {
    const content = {
        title: document.title,
        mainText: '',
        headings: ''
    };

    // Get all visible text
    content.mainText = Array.from(document.querySelectorAll('p, span, div'))
        .filter(element => {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   element.offsetWidth > 0;
        })
        .map(element => element.textContent.trim())
        .join(' ');

    // Get headings
    content.headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(heading => heading.textContent.trim())
        .join(' ');

    return content;
}

// Function to count keyword occurrences
function countKeywords(text, keywords) {
    let count = 0;
    const lowerText = text.toLowerCase();
    
    keywords.forEach(keyword => {
        const regex = new RegExp(keyword.toLowerCase(), 'g');
        const matches = lowerText.match(regex);
        if (matches) {
            count += matches.length;
        }
    });
    
    return count;
}

// Function to classify content
function classifyContent(text) {
    const productiveCount = countKeywords(text, PRODUCTIVE_KEYWORDS);
    const entertainmentCount = countKeywords(text, ENTERTAINMENT_KEYWORDS);
    
    return {
        type: productiveCount > entertainmentCount ? 'Productive' : 'Entertainment',
        productiveCount,
        entertainmentCount
    };
}

// Function to analyze page content
function analyzePage() {
    let content = '';
    const domain = window.location.hostname;
    
    console.log('Analyzing page:', window.location.href);

    // Extract content based on domain
    if (domain.includes('youtube.com')) {
        const youtubeContent = extractYouTubeContent();
        content = Object.values(youtubeContent).join(' ');
    } else {
        const pageContent = extractPageContent();
        content = Object.values(pageContent).join(' ');
    }

    // Classify the content
    const classification = classifyContent(content);

    // Send results to background script
    // Add error handling for sendMessage
    try {
        chrome.runtime.sendMessage({
            type: 'contentClassification',
            data: {
                url: window.location.href,
                domain: domain,
                timestamp: new Date().toISOString(),
                classification: classification.type,
                stats: {
                    productiveCount: classification.productiveCount,
                    entertainmentCount: classification.entertainmentCount
                }
            }
        }, (response) => {
            // Optional: Handle response if background script sends one
            if (chrome.runtime.lastError) {
                console.error('Error sending message to background script:', chrome.runtime.lastError.message);
                // Context likely invalidated, stop further messaging
                stopAnalysis();
            }
        });
    } catch (error) {
        console.error('Unexpected error during sendMessage:', error);
    }
}

// Initialize when the page is ready
function initialize() {
    console.log('Initializing content script');
    // Run initial analysis
    analyzePage();
    
    // Set up interval for periodic analysis
    setInterval(analyzePage, 15000);
    
    // Also analyze when the page content changes
    const observer = new MutationObserver(() => {
        analyzePage();
    });
    
    // Observe changes to the body and its descendants
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// Function to stop periodic analysis and mutation observer
let analysisInterval;
let mutationObserver;

function stopAnalysis() {
    console.log('Stopping content script analysis');
    if (analysisInterval) {
        clearInterval(analysisInterval);
    }
    if (mutationObserver) {
        mutationObserver.disconnect();
    }
}

// Run initialization when the page is ready
if (document.readyState === 'complete') {
    initialize();
} else {
    window.addEventListener('load', initialize); 
}