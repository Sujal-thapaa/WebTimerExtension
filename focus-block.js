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
}); 