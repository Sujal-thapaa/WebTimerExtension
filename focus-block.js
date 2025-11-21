// Focus Mode Block List Management
// This script runs in the popup only and keeps list separate from regular blocked websites.
document.addEventListener('DOMContentLoaded', () => {
  const focusSiteInput = document.getElementById('focusSiteToBlock');
  const addBtn = document.getElementById('addFocusBlockBtn');
  const listContainer = document.getElementById('focusBlockedSitesList');
  const focusToggle = document.getElementById('focusModeToggle');
  const durationInput = document.getElementById('focusDuration');
  const startBtn = document.getElementById('startFocusBtn');
  const countdownEl = document.getElementById('focusCountdown');

  let countdownInterval = null;

  // Load toggle state and list on start
  loadToggleState();
  // Load list on start
  loadList();

  // Add new site handler
  addBtn?.addEventListener('click', async () => {
    const rawValue = focusSiteInput.value.trim();
    if (!rawValue) return;

    // Normalise input to plain domain (strip protocol & www.)
    const cleaned = rawValue
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase();

    if (!cleaned) return;

    const { focusBlockList = [] } = await chrome.storage.local.get('focusBlockList');
    if (!focusBlockList.includes(cleaned)) {
      focusBlockList.push(cleaned);
      await chrome.storage.local.set({ focusBlockList });
      renderList(focusBlockList);
    }
    focusSiteInput.value = '';
  });

  // Delegate remove button click
  listContainer?.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('remove-focus-block-btn')) {
      const site = target.dataset.site;
      const { focusBlockList = [] } = await chrome.storage.local.get('focusBlockList');
      const updated = focusBlockList.filter(s => s !== site);
      await chrome.storage.local.set({ focusBlockList: updated });
      renderList(updated);
    }
  });

  // Toggle Focus Mode on/off
  focusToggle?.addEventListener('change', async (e) => {
    const isActive = focusToggle.checked;
    await chrome.storage.local.set({ focusActive: isActive });

    // Handle timer logic
    const durationMinutes = parseInt(durationInput?.value);
    if (isActive) {
      if (durationMinutes && durationMinutes > 0) {
        // Create or reset alarm
        chrome.alarms.create('focusModeOff', { delayInMinutes: durationMinutes });
        await chrome.storage.local.set({ focusExpiresAt: Date.now() + durationMinutes * 60000 });
      } else {
        // No timer provided; clear any existing alarm
        chrome.alarms.clear('focusModeOff');
        await chrome.storage.local.remove('focusExpiresAt');
      }
    } else {
      // Turning off manually – clear alarm & expiration
      chrome.alarms.clear('focusModeOff');
      await chrome.storage.local.remove('focusExpiresAt');
    }
  });

  startBtn?.addEventListener('click', async () => {
    const durationMinutes = parseInt(durationInput?.value);
    if (durationMinutes && durationMinutes > 0) {
      await enableFocusWithTimer(durationMinutes);
    } else {
      // No timer entered, just turn on focus
      await chrome.storage.local.set({ focusActive: true });
      focusToggle.checked = true;
      chrome.alarms.clear('focusModeOff');
      await chrome.storage.local.remove('focusExpiresAt');
      updateCountdown();
    }
  });

  async function enableFocusWithTimer(minutes) {
    await chrome.storage.local.set({ focusActive: true, focusExpiresAt: Date.now() + minutes * 60000 });
    focusToggle.checked = true;
    chrome.alarms.create('focusModeOff', { delayInMinutes: minutes });
    updateCountdown();
  }

  function updateCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownEl.textContent = '';

    chrome.storage.local.get(['focusActive', 'focusExpiresAt']).then(({ focusActive, focusExpiresAt }) => {
      if (!focusActive || !focusExpiresAt) return;

      const render = () => {
        const msLeft = focusExpiresAt - Date.now();
        if (msLeft <= 0) {
          countdownEl.textContent = 'Focus Mode ended';
          clearInterval(countdownInterval);
        } else {
          const min = Math.floor(msLeft / 60000);
          const sec = Math.floor((msLeft % 60000) / 1000);
          countdownEl.textContent = `Auto-off in ${min}m ${sec}s`;
        }
      };
      render();
      countdownInterval = setInterval(render, 1000);
    });
  }

  // Update countdown whenever storage changes (e.g., turned off automatically)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.focusExpiresAt || changes.focusActive)) {
      updateCountdown();

      if (changes.focusActive && changes.focusActive.newValue === false) {
        focusToggle.checked = false;
      }
    }
  });

  // Initial countdown load
  updateCountdown();

  async function loadToggleState() {
    const { focusActive = false } = await chrome.storage.local.get('focusActive');
    if (focusToggle) {
      focusToggle.checked = focusActive;
    }
  }

  async function loadList() {
    const { focusBlockList = [] } = await chrome.storage.local.get('focusBlockList');
    renderList(focusBlockList);
  }

  function renderList(list) {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!list.length) {
      listContainer.innerHTML = '<div class="no-sites">No focus block sites added</div>';
      return;
    }

    list.forEach(site => {
      const item = document.createElement('div');
      item.className = 'blocked-site-item';
      item.innerHTML = `
        <div class="site-info">
          <img src="${getWebsiteLogo(site)}" alt="${site} logo" class="site-logo">
          <span class="site-name">${getCleanWebsiteName(site)}</span>
        </div>
        <button class="remove-focus-block-btn" data-site="${site}">❌</button>
      `;
      listContainer.appendChild(item);
    });
  }

  // Helper utilities (duplicated from popup.js)
  function getWebsiteLogo(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  }
  function getCleanWebsiteName(domain) {
    const cleaned = domain.replace(/^www\./, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).split('.')[0];
  }

  // ===== YouTube Category Blocking =====
  let categoryCheckboxes = [];
  let blockedCategoriesList = null;

  // Initialize category blocking - wait for elements to be available
  function initializeCategoryBlocking() {
    categoryCheckboxes = Array.from(document.querySelectorAll('.category-block-checkbox'));
    blockedCategoriesList = document.getElementById('blockedCategoriesList');

    if (categoryCheckboxes.length === 0) {
      console.log('TimeSetu: Category checkboxes not found yet, will retry...');
      // Retry after a short delay (for dynamically loaded content)
      setTimeout(initializeCategoryBlocking, 500);
      return;
    }

    console.log('TimeSetu: Found', categoryCheckboxes.length, 'category checkboxes');

    // Load blocked categories on page load
    loadBlockedCategories();

    // Handle category checkbox changes
    categoryCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        console.log('TimeSetu: Category checkbox changed:', checkbox.dataset.category, checkbox.checked);
        await saveBlockedCategories();
        await updateBlockedCategoriesList();
        // Notify YouTube tabs to update blocking
        notifyYouTubeTabs();
      });
    });
  }

  // Start initialization - try multiple times for dynamically loaded content
  initializeCategoryBlocking();
  
  // Also try after a delay (for dashboard that loads content dynamically)
  setTimeout(() => {
    if (categoryCheckboxes.length === 0) {
      console.log('TimeSetu: Retrying category blocking initialization after delay...');
      initializeCategoryBlocking();
    }
  }, 1000);

  // Also listen for when the details element is opened (in case content is lazy-loaded)
  const categoryBlockDropdown = document.getElementById('youtubeCategoryBlockDropdown');
  if (categoryBlockDropdown) {
    categoryBlockDropdown.addEventListener('toggle', () => {
      if (categoryBlockDropdown.open) {
        setTimeout(() => {
          if (categoryCheckboxes.length === 0) {
            console.log('TimeSetu: Category block dropdown opened, reinitializing...');
            initializeCategoryBlocking();
          }
        }, 200);
      }
    });
  }

  // Also listen for DOM mutations (for dynamically loaded content)
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (categoryCheckboxes.length === 0) {
        const found = document.querySelectorAll('.category-block-checkbox');
        if (found.length > 0) {
          console.log('TimeSetu: Found category checkboxes via mutation observer');
          initializeCategoryBlocking();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async function loadBlockedCategories() {
    if (categoryCheckboxes.length === 0) {
      console.warn('TimeSetu: Cannot load blocked categories - checkboxes not found');
      return;
    }

    const { blockedYouTubeCategories = [] } = await chrome.storage.local.get('blockedYouTubeCategories');
    console.log('TimeSetu: Loading blocked categories:', blockedYouTubeCategories);

    categoryCheckboxes.forEach(checkbox => {
      const category = checkbox.dataset.category;
      checkbox.checked = blockedYouTubeCategories.includes(category);
      console.log('TimeSetu: Set checkbox for', category, 'to', checkbox.checked);
    });

    await updateBlockedCategoriesList();
  }

  async function saveBlockedCategories() {
    if (categoryCheckboxes.length === 0) {
      console.warn('TimeSetu: Cannot save blocked categories - checkboxes not found');
      return;
    }

    const blockedCategories = [];
    
    categoryCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        blockedCategories.push(checkbox.dataset.category);
      }
    });

    await chrome.storage.local.set({ blockedYouTubeCategories: blockedCategories });
    console.log('TimeSetu: Saved blocked YouTube categories:', blockedCategories);
  }

  async function updateBlockedCategoriesList() {
    if (!blockedCategoriesList) return;
    
    const { blockedYouTubeCategories = [] } = await chrome.storage.local.get('blockedYouTubeCategories');
    
    if (blockedYouTubeCategories.length === 0) {
      blockedCategoriesList.innerHTML = '<div class="no-sites" style="text-align: center; color: var(--text-secondary); padding: 12px;">No categories blocked</div>';
      return;
    }

    blockedCategoriesList.innerHTML = '';
    
    blockedYouTubeCategories.forEach(category => {
      const item = document.createElement('div');
      item.className = 'blocked-site-item';
      item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; margin-bottom: 6px; border: 1px solid rgba(255, 255, 255, 0.1);';
      
      const categoryEmoji = {
        'Productive': '📚',
        'Entertainment': '🎬',
        'News': '📰',
        'Games': '🎮'
      }[category] || '🚫';

      item.innerHTML = `
        <div class="site-info" style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.2rem;">${categoryEmoji}</span>
          <span class="site-name" style="color: var(--text-primary); font-weight: 500;">${category}</span>
        </div>
        <button class="remove-category-block-btn" data-category="${category}" style="background: rgba(255, 0, 0, 0.2); border: none; color: #ff6b6b; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Remove</button>
      `;
      blockedCategoriesList.appendChild(item);
    });

    // Handle remove button clicks
    blockedCategoriesList.querySelectorAll('.remove-category-block-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const category = e.target.dataset.category;
        const checkbox = document.querySelector(`[data-category="${category}"]`);
        if (checkbox) {
          checkbox.checked = false;
          await saveBlockedCategories();
          await updateBlockedCategoriesList();
          notifyYouTubeTabs();
        }
      });
    });
  }

  function notifyYouTubeTabs() {
    if (categoryCheckboxes.length === 0) {
      // Get blocked categories from storage instead
      chrome.storage.local.get('blockedYouTubeCategories', ({ blockedYouTubeCategories = [] }) => {
        chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateBlockedCategories',
              blockedCategories: blockedYouTubeCategories
            }).catch(() => {}); // Ignore errors if content script not ready
          });
        });
      });
      return;
    }

    const blockedCategories = categoryCheckboxes
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.category);

    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      console.log('TimeSetu: Notifying', tabs.length, 'YouTube tabs about blocked categories:', blockedCategories);
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateBlockedCategories',
          blockedCategories: blockedCategories
        }).catch(() => {}); // Ignore errors if content script not ready
      });
    });
  }
}); 