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

// Content script for WebTimeTracker
let isAnalyzing = false;
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Function to check connection to background script
async function checkConnection() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'PING' }, response => {
      if (chrome.runtime.lastError) {
        console.log('Connection check failed:', chrome.runtime.lastError);
        isConnected = false;
        resolve(false);
      } else {
        console.log('Connection check successful');
        isConnected = true;
        resolve(true);
      }
    });
  });
}

// Function to send message with retry
async function sendMessageWithRetry(message) {
  if (!isConnected) {
    const connected = await checkConnection();
    if (!connected) {
      console.log('Not connected to background script, skipping message');
      return;
    }
  }

  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function trySend() {
      attempts++;
      console.log(`Attempt ${attempts} to send message:`, message);
      
      try {
        chrome.runtime.sendMessage(message, response => {
          if (chrome.runtime.lastError) {
            console.log('Error sending message:', chrome.runtime.lastError);
            isConnected = false;
            if (attempts < MAX_RETRIES) {
              console.log(`Retrying in ${RETRY_DELAY}ms...`);
              setTimeout(trySend, RETRY_DELAY);
            } else {
              reject(new Error(`Failed to send message after ${MAX_RETRIES} attempts`));
            }
          } else {
            console.log('Message sent successfully:', response);
            isConnected = true;
            resolve(response);
          }
        });
      } catch (error) {
        console.error('Error in sendMessage:', error);
        isConnected = false;
        if (attempts < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          setTimeout(trySend, RETRY_DELAY);
        } else {
          reject(error);
        }
      }
    }
    
    trySend();
  });
}

// Function to analyze page
async function analyzePage() {
  if (isAnalyzing) {
    console.log('Already analyzing page, skipping...');
    return;
  }

  isAnalyzing = true;
  console.log('Starting page analysis...');

  try {
    const pageData = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };

    console.log('Sending page data:', pageData);
    await sendMessageWithRetry({
      type: 'PAGE_VISIT',
      data: pageData
    });

    console.log('Page analysis completed successfully');
  } catch (error) {
    console.error('Error analyzing page:', error);
  } finally {
    isAnalyzing = false;
  }
}

// Initialize content script
console.log('Initializing content script');

// Check connection on startup
checkConnection().then(connected => {
  if (connected) {
    console.log('Successfully connected to background script');
  } else {
    console.log('Failed to connect to background script');
  }
});

// Listen for page load
window.addEventListener('load', () => {
  console.log('Page loaded, starting analysis');
  analyzePage();
});

// Listen for visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Page became visible, starting analysis');
    analyzePage();
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.type === 'PONG') {
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'ANALYZE_PAGE') {
    analyzePage()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});