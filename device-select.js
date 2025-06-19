document.addEventListener('DOMContentLoaded', () => {
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
}); 