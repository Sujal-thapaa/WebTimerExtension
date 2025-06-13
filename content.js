// Enhanced Content Script with better error handling and performance
class ContentAnalyzer {
  constructor() {
    this.isActive = true;
    this.analysisInterval = null;
    this.mutationObserver = null;
    this.lastAnalysis = 0;
    this.analysisThrottle = 15000; // 15 seconds between analyses
    
    this.productiveKeywords = [
      'learn', 'tutorial', 'how to', 'guide', 'study', 'course',
      'education', 'lecture', 'lesson', 'training', 'skills',
      'programming', 'development', 'science', 'math', 'history',
      'research', 'analysis', 'explanation', 'documentation',
      'coding', 'algorithm', 'data', 'technology', 'engineering'
    ];

    this.entertainmentKeywords = [
      'funny', 'prank', 'celebrity', 'vlog', 'comedy', 'reaction',
      'meme', 'entertainment', 'gaming', 'gameplay', 'fun',
      'music video', 'movie', 'trailer', 'show', 'drama',
      'highlights', 'compilation', 'viral', 'trending',
      'sports', 'news', 'gossip', 'fashion', 'lifestyle'
    ];
    
    this.init();
  }

  init() {
    try {
      if (document.readyState === 'complete') {
        this.startAnalysis();
      } else {
        window.addEventListener('load', () => this.startAnalysis());
      }
    } catch (error) {
      console.error('Error initializing content analyzer:', error);
    }
  }

  startAnalysis() {
    try {
      console.log('Starting content analysis for:', window.location.href);
      
      // Initial analysis
      this.analyzePage();
      
      // Set up periodic analysis with throttling
      this.analysisInterval = setInterval(() => {
        if (this.isActive && Date.now() - this.lastAnalysis > this.analysisThrottle) {
          this.analyzePage();
        }
      }, this.analysisThrottle);
      
      // Set up mutation observer for dynamic content
      this.setupMutationObserver();
      
    } catch (error) {
      console.error('Error starting content analysis:', error);
    }
  }

  setupMutationObserver() {
    try {
      if (!document.body) return;
      
      this.mutationObserver = new MutationObserver((mutations) => {
        // Only analyze if there are significant changes
        const significantChanges = mutations.some(mutation => 
          mutation.type === 'childList' && mutation.addedNodes.length > 0
        );
        
        if (significantChanges && Date.now() - this.lastAnalysis > this.analysisThrottle) {
          this.analyzePage();
        }
      });
      
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false // Reduce noise from text changes
      });
    } catch (error) {
      console.error('Error setting up mutation observer:', error);
    }
  }

  extractYouTubeContent() {
    const content = {
      title: '',
      channelName: '',
      description: '',
      otherText: ''
    };

    try {
      // Get video title with multiple fallbacks
      const titleSelectors = [
        'h1.ytd-video-primary-info-renderer',
        '#video-title',
        'ytd-video-primary-info-renderer .title',
        '.ytd-video-primary-info-renderer h1',
        '[data-title]'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
          content.title = titleElement.textContent.trim();
          break;
        }
      }

      // Get channel name
      const channelSelectors = [
        '#channel-name .ytd-channel-name',
        '#owner-name a',
        'ytd-video-owner-renderer .ytd-channel-name',
        '.ytd-channel-name a'
      ];
      
      for (const selector of channelSelectors) {
        const channelElement = document.querySelector(selector);
        if (channelElement && channelElement.textContent.trim()) {
          content.channelName = channelElement.textContent.trim();
          break;
        }
      }

      // Get video description
      const descriptionSelectors = [
        '#description ytd-expanded-metadata-renderer',
        '#description',
        'ytd-expander#description',
        '.ytd-video-secondary-info-renderer #description'
      ];
      
      for (const selector of descriptionSelectors) {
        const descElement = document.querySelector(selector);
        if (descElement && descElement.textContent.trim()) {
          content.description = descElement.textContent.trim().substring(0, 1000); // Limit length
          break;
        }
      }

      // Get recommended video titles (limited to avoid performance issues)
      const videoRenderers = document.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer');
      const otherTitles = Array.from(videoRenderers)
        .slice(0, 10) // Limit to first 10 recommendations
        .map(renderer => {
          const title = renderer.querySelector('#video-title');
          return title ? title.textContent.trim() : '';
        })
        .filter(text => text)
        .join(' ');
      
      content.otherText = otherTitles;

    } catch (error) {
      console.error('Error extracting YouTube content:', error);
    }

    return content;
  }

  extractPageContent() {
    const content = {
      title: document.title || '',
      mainText: '',
      headings: ''
    };

    try {
      // Get headings first (more reliable indicators)
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
        .slice(0, 20) // Limit to avoid performance issues
        .map(heading => heading.textContent.trim())
        .filter(text => text && text.length > 2)
        .join(' ');
      
      content.headings = headings;

      // Get main content with better selectors
      const contentSelectors = [
        'main', 'article', '.content', '#content', '.post', '.article',
        '[role="main"]', '.main-content'
      ];
      
      let mainContent = '';
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = element.textContent.trim().substring(0, 2000); // Limit length
          break;
        }
      }
      
      // Fallback to paragraphs if no main content found
      if (!mainContent) {
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .slice(0, 10)
          .map(p => p.textContent.trim())
          .filter(text => text && text.length > 10)
          .join(' ');
        
        mainContent = paragraphs.substring(0, 2000);
      }
      
      content.mainText = mainContent;

    } catch (error) {
      console.error('Error extracting page content:', error);
    }

    return content;
  }

  countKeywords(text, keywords) {
    if (!text || typeof text !== 'string') return 0;
    
    let count = 0;
    const lowerText = text.toLowerCase();
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  }

  classifyContent(content) {
    const allText = Object.values(content).join(' ').toLowerCase();
    
    const productiveCount = this.countKeywords(allText, this.productiveKeywords);
    const entertainmentCount = this.countKeywords(allText, this.entertainmentKeywords);
    
    // Add domain-based hints
    const domain = window.location.hostname.toLowerCase();
    let domainBonus = { productive: 0, entertainment: 0 };
    
    if (domain.includes('edu') || domain.includes('learn') || domain.includes('course')) {
      domainBonus.productive += 5;
    } else if (domain.includes('game') || domain.includes('fun') || domain.includes('entertainment')) {
      domainBonus.entertainment += 5;
    }
    
    const finalProductiveScore = productiveCount + domainBonus.productive;
    const finalEntertainmentScore = entertainmentCount + domainBonus.entertainment;
    
    return {
      type: finalProductiveScore > finalEntertainmentScore ? 'Productive' : 'Entertainment',
      productiveCount: finalProductiveScore,
      entertainmentCount: finalEntertainmentScore,
      confidence: Math.abs(finalProductiveScore - finalEntertainmentScore)
    };
  }

  analyzePage() {
    if (!this.isActive) return;
    
    try {
      this.lastAnalysis = Date.now();
      
      const domain = window.location.hostname;
      const url = window.location.href;
      
      // Skip analysis for certain URLs
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
          url.startsWith('moz-extension://') || url.startsWith('about:')) {
        return;
      }
      
      console.log('Analyzing page:', url);

      let content = {};
      
      // Extract content based on domain
      if (domain.includes('youtube.com')) {
        content = this.extractYouTubeContent();
      } else {
        content = this.extractPageContent();
      }

      // Only proceed if we have meaningful content
      const hasContent = Object.values(content).some(value => 
        value && typeof value === 'string' && value.trim().length > 10
      );
      
      if (!hasContent) {
        console.log('No meaningful content found, skipping analysis');
        return;
      }

      // Classify the content
      const classification = this.classifyContent(content);

      // Send results to background script with error handling
      this.sendClassificationData({
        url: url,
        domain: domain,
        timestamp: new Date().toISOString(),
        classification: classification.type,
        stats: {
          productiveCount: classification.productiveCount,
          entertainmentCount: classification.entertainmentCount,
          confidence: classification.confidence
        },
        contentLength: JSON.stringify(content).length
      });

    } catch (error) {
      console.error('Error analyzing page:', error);
    }
  }

  sendClassificationData(data) {
    try {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn('Chrome runtime not available');
        this.stopAnalysis();
        return;
      }

      chrome.runtime.sendMessage({
        type: 'contentClassification',
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Extension context invalidated, stopping analysis');
          this.stopAnalysis();
        } else {
          console.log('Classification data sent successfully');
        }
      });
    } catch (error) {
      console.error('Error sending classification data:', error);
      this.stopAnalysis();
    }
  }

  stopAnalysis() {
    console.log('Stopping content analysis');
    this.isActive = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}

// Initialize the content analyzer
let contentAnalyzer;

try {
  contentAnalyzer = new ContentAnalyzer();
} catch (error) {
  console.error('Failed to initialize content analyzer:', error);
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (contentAnalyzer) {
    contentAnalyzer.stopAnalysis();
  }
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
  if (contentAnalyzer) {
    if (document.hidden) {
      contentAnalyzer.stopAnalysis();
    } else {
      // Restart analysis when tab becomes visible again
      setTimeout(() => {
        if (contentAnalyzer && !contentAnalyzer.isActive) {
          contentAnalyzer.isActive = true;
          contentAnalyzer.startAnalysis();
        }
      }, 1000);
    }
  }
});