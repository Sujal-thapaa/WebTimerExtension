// dashboard.js
// Load popup markup and initialize popup.js when the dashboard page loads
(async () => {
  try {
    const htmlText = await fetch(chrome.runtime.getURL('popup.html')).then(r => r.text());
    const bodyMatch = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      document.querySelector('.container').innerHTML = bodyMatch[1];
      // Create script element for popup.js
      const s = document.createElement('script');
      s.src = chrome.runtime.getURL('popup.js');
      s.onload = () => {
        // Remove the original popup header (duplicate title/buttons)
        const popupHeader = document.querySelector('header');
        if (popupHeader) popupHeader.style.display = 'none';

        // Map navbar buttons to existing controls
        const navSettings = document.getElementById('navSettings');
        const navMore = document.getElementById('navMore');

        const settingsBtn = document.getElementById('settingsBtn');
        const moreBtn = document.getElementById('moreBtn');

        navSettings?.addEventListener('click', () => settingsBtn?.click());
        navMore?.addEventListener('click', () => moreBtn?.click());

        // Trigger DOMContentLoaded for popup.js listeners
        document.dispatchEvent(new Event('DOMContentLoaded', {
          bubbles: true,
          cancelable: true
        }));
      };
      (document.head || document.documentElement).appendChild(s);

      // Inject voiceReview.js
      const vr = document.createElement('script');
      vr.src = chrome.runtime.getURL('voiceReview.js');
      (document.head || document.documentElement).appendChild(vr);
    }
  } catch (error) {
    console.error('Error loading popup:', error);
  }
})(); 