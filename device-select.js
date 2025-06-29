// Language translations
const translations = {
  en: {
    selectDevice: "Select Device",
    selectDeviceDesc: "Choose a device to view its screen time data",
    overallView: "Overall View",
    overallViewDesc: "Combined view of all your devices",
    browser: "Browser",
    browserDesc: "View your browser activity",
    mobile: "Mobile",
    mobileDesc: "View your mobile app usage",
    laptop: "Laptop",
    laptopDesc: "View your laptop app usage",
    shareStats: "Share Stats",
    shareStatsDesc: "Create a public weekly summary"
  },
  zh: {
    selectDevice: "选择设备",
    selectDeviceDesc: "选择要查看屏幕时间数据的设备",
    overallView: "总览",
    overallViewDesc: "所有设备的综合视图",
    browser: "浏览器",
    browserDesc: "查看您的浏览器活动",
    mobile: "手机",
    mobileDesc: "查看您的手机应用使用情况",
    laptop: "笔记本电脑",
    laptopDesc: "查看您的笔记本电脑应用使用情况",
    shareStats: "分享统计",
    shareStatsDesc: "创建公共周度摘要"
  },
  hi: {
    selectDevice: "डिवाइस चुनें",
    selectDeviceDesc: "अपने स्क्रीन टाइम डेटा देखने के लिए डिवाइस चुनें",
    overallView: "समग्र दृश्य",
    overallViewDesc: "आपके सभी डिवाइस का संयुक्त दृश्य",
    browser: "ब्राउज़र",
    browserDesc: "अपनी ब्राउज़र गतिविधि देखें",
    mobile: "मोबाइल",
    mobileDesc: "अपने मोबाइल ऐप का उपयोग देखें",
    laptop: "लैपटॉप",
    laptopDesc: "अपने लैपटॉप ऐप का उपयोग देखें",
    shareStats: "आंकड़े साझा करें",
    shareStatsDesc: "एक सार्वजनिक साप्ताहिक सारांश बनाएं"
  },
  ja: {
    selectDevice: "デバイスを選択",
    selectDeviceDesc: "スクリーンタイムデータを表示するデバイスを選択してください",
    overallView: "全体表示",
    overallViewDesc: "すべてのデバイスの統合表示",
    browser: "ブラウザ",
    browserDesc: "ブラウザアクティビティを表示",
    mobile: "モバイル",
    mobileDesc: "モバイルアプリの使用状況を表示",
    laptop: "ラップトップ",
    laptopDesc: "ラップトップアプリの使用状況を表示",
    shareStats: "統計を共有",
    shareStatsDesc: "公開週次サマリーを作成"
  },
  fr: {
    selectDevice: "Sélectionner l'appareil",
    selectDeviceDesc: "Choisissez un appareil pour voir ses données de temps d'écran",
    overallView: "Vue d'ensemble",
    overallViewDesc: "Vue combinée de tous vos appareils",
    browser: "Navigateur",
    browserDesc: "Voir votre activité de navigation",
    mobile: "Mobile",
    mobileDesc: "Voir l'utilisation de vos applications mobiles",
    laptop: "Ordinateur portable",
    laptopDesc: "Voir l'utilisation de vos applications d'ordinateur portable",
    shareStats: "Partager les statistiques",
    shareStatsDesc: "Créer un résumé hebdomadaire public"
  },
  es: {
    selectDevice: "Seleccionar dispositivo",
    selectDeviceDesc: "Elige un dispositivo para ver sus datos de tiempo de pantalla",
    overallView: "Vista general",
    overallViewDesc: "Vista combinada de todos tus dispositivos",
    browser: "Navegador",
    browserDesc: "Ver tu actividad del navegador",
    mobile: "Móvil",
    mobileDesc: "Ver el uso de tus aplicaciones móviles",
    laptop: "Portátil",
    laptopDesc: "Ver el uso de tus aplicaciones de portátil",
    shareStats: "Compartir estadísticas",
    shareStatsDesc: "Crear un resumen semanal público"
  }
};

// Language configuration
const languageConfig = {
  us: { lang: 'en', name: 'English' },
  cn: { lang: 'zh', name: '中文' },
  in: { lang: 'hi', name: 'हिन्दी' },
  jp: { lang: 'ja', name: '日本語' },
  fr: { lang: 'fr', name: 'Français' },
  es: { lang: 'es', name: 'Español' }
};

let currentLang = 'en';

// Initialize language functionality
function initializeLanguage() {
  // Load saved language preference
  const savedLang = localStorage.getItem('wtw_language') || 'en';
  const savedFlag = localStorage.getItem('wtw_flag') || 'us';
  
  currentLang = savedLang;
  updateLanguageDisplay(savedFlag, savedLang);
  updateLanguage(savedLang);
  
  // Setup language selector event listeners
  setupLanguageSelector();
}

function setupLanguageSelector() {
  const selectedFlag = document.getElementById('selectedFlag');
  const flagDropdown = document.getElementById('flagDropdown');
  const flagOptions = document.querySelectorAll('.flag-option');

  // Toggle dropdown
  selectedFlag.addEventListener('click', (e) => {
    e.stopPropagation();
    flagDropdown.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    flagDropdown.classList.remove('show');
  });

  // Handle flag selection
  flagOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const flag = option.getAttribute('data-flag');
      const lang = option.getAttribute('data-lang');
      
      // Update display
      updateLanguageDisplay(flag, lang);
      
      // Save preference
      localStorage.setItem('wtw_language', lang);
      localStorage.setItem('wtw_flag', flag);
      
      // Update language
      currentLang = lang;
      updateLanguage(lang);
      
      // Close dropdown
      flagDropdown.classList.remove('show');
    });
  });
}

function updateLanguageDisplay(flag, lang) {
  const currentFlag = document.getElementById('currentFlag');
  const currentLanguage = document.getElementById('currentLanguage');
  
  if (currentFlag) {
    currentFlag.src = `flags/${flag}.png`;
    currentFlag.alt = languageConfig[flag]?.name || 'Language';
  }
  
  if (currentLanguage) {
    currentLanguage.textContent = languageConfig[flag]?.name || 'Language';
  }
}

function updateLanguage(langCode) {
  const elements = document.querySelectorAll('[data-i18n]');
  const translation = translations[langCode] || translations['en'];
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translation[key]) {
      element.textContent = translation[key];
    }
  });
  
  // Update document language attribute
  document.documentElement.lang = langCode;
}

// Device navigation functionality
function initializeDeviceNavigation() {
  const deviceCards = document.querySelectorAll('.device-card');

  deviceCards.forEach(card => {
    card.addEventListener('click', () => {
      const deviceType = card.getAttribute('data-device');
      
      switch (deviceType) {
        case 'overall':
          window.location.href = 'overall-view.html';
          break;
        case 'browser':
          window.location.href = 'dashboard.html';
          break;
        case 'mobile':
          window.location.href = 'mobile-view.html';
          break;
        case 'laptop':
          window.location.href = 'laptop-view.html';
          break;
        case 'share':
          const username = localStorage.getItem('wtw_username') || 'guest';
          window.location.href = `public-stats.html?user=${encodeURIComponent(username)}`;
          break;
      }
    });
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeLanguage();
  initializeDeviceNavigation();
}); 