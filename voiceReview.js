// voiceReview.js
(function() {
  const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL';
  const API_KEY = 'sk_48cecf94738c5ee8a7b4856904b56934821e0a5a567ee0e9';
  const summaryTextDefault = `No usage data available for this week.`;
  let lastSummary = summaryTextDefault;

  let audioUrl = null;

  async function fetchAudio(text) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
      if (!response.ok) throw new Error('TTS request failed');
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      if (audioUrl) URL.revokeObjectURL(audioUrl); // clean previous
      audioUrl = URL.createObjectURL(blob);
      return audioUrl;
    } catch (err) {
      console.error('VoiceReview error:', err);
      return null;
    }
  }

  function msToHours(ms) {
    return Math.round((ms / 3600000) * 10) / 10; // 1 decimal place
  }

  async function computeWeeklySummary() {
    try {
      const { timeData = {}, goals = {} } = await chrome.storage.local.get(['timeData', 'goals']);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const toStr = d => d.toISOString().split('T')[0];
      const start = toStr(weekAgo);
      const end = toStr(today);

      const weekly = { categories: {}, total: 0 };
      Object.entries(timeData).forEach(([date, data]) => {
        if (date >= start && date <= end) {
          Object.values(data.categories || {}).forEach(t => {
            weekly.total += t;
          });
          Object.entries(data.categories || {}).forEach(([cat, t]) => {
            weekly.categories[cat] = (weekly.categories[cat] || 0) + t;
          });
        }
      });

      if (weekly.total === 0) return summaryTextDefault;

      // Sort categories by time desc, pick top 3
      const topCats = Object.entries(weekly.categories)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 3);

      const catSentences = topCats.map(([cat, t]) => `${msToHours(t)} hours on ${cat}`);
      let catPhrase = '';
      if (catSentences.length === 1) {
        catPhrase = catSentences[0];
      } else if (catSentences.length === 2) {
        catPhrase = catSentences.join(' and ');
      } else {
        catPhrase = `${catSentences[0]}, ${catSentences[1]}, and ${catSentences[2]}`;
      }

      const totalHours = msToHours(weekly.total);

      // Prepare top category statement
      let topCategoryStmt = '';
      if (topCats.length > 0) {
        const [topCat, topCatMs] = topCats[0];
        const hours = Math.floor(topCatMs / 3600000);
        const minutes = Math.floor((topCatMs % 3600000) / 60000);
        const hm = `${hours}h ${minutes}m`;
        topCategoryStmt = ` You spent ${hm} on ${topCat}.`;
      }

      // Device-specific summary if DOM elements exist
      const mobileEl = document.getElementById('mobileTime');
      const laptopEl = document.getElementById('laptopTime');
      const browserEl = document.getElementById('browserTime');
      if (mobileEl && laptopEl && browserEl && mobileEl.textContent && laptopEl.textContent && browserEl.textContent) {
        const mobileStr = mobileEl.textContent.trim();
        const laptopStr = laptopEl.textContent.trim();
        const browserStr = browserEl.textContent.trim();
        return `This week, you spent ${browserStr} on Browser, ${mobileStr} on Mobile, and ${laptopStr} on Laptop.${topCategoryStmt}`;
      }

      const summary = `This week, you spent ${totalHours} hours on your devices. You spent ${catPhrase}.${topCategoryStmt} Keep up the good work!`;
      return summary;
    } catch (err) {
      console.error('Weekly summary computation error', err);
      return summaryTextDefault;
    }
  }

  async function playSummary(text) {
    const url = await fetchAudio(text);
    if (!url) return;
    const audio = new Audio(url);
    audio.play();
  }

  function init() {
    const moreBtn = document.getElementById('moreBtn');
    const replayBtn = document.getElementById('replayVoiceBtn');
    const summaryEl = document.getElementById('voiceSummaryText');
    if (!replayBtn || !summaryEl) return;

    const generateAndPlay = async () => {
      const summaryText = await computeWeeklySummary();
      lastSummary = summaryText;
      summaryEl.textContent = summaryText;
      setTimeout(() => playSummary(summaryText), 1200);
    };

    if (moreBtn) {
      // Only trigger when More modal opens
      moreBtn.addEventListener('click', generateAndPlay);
    } else {
      // Auto play on page load (overall view)
      generateAndPlay();
    }

    replayBtn.addEventListener('click', () => playSummary(lastSummary));
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); 