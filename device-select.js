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
      }
    });
  });
}); 