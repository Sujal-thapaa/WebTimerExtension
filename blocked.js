// Get the blocked URL and expiry from the current page
const urlParams = new URLSearchParams(window.location.search);
const blockedUrl = urlParams.get('url') || 'this website';
const expiresAt = parseInt(urlParams.get('expires')) || 0;

// Display the blocked site
document.getElementById('blockedSite').textContent = `Blocked: ${blockedUrl}`;

// Update time remaining
function updateTimeRemaining() {
    const now = Date.now();
    const remaining = expiresAt - now;

    const timeRemainingElement = document.getElementById('timeRemaining');

    if (remaining <= 0) {
        timeRemainingElement.innerHTML =
            '<strong>✅ Block has expired! You can now access this site.</strong>';
        // Redirect after a short delay
        setTimeout(() => {
            // Attempt to redirect to the original URL
            if (blockedUrl && blockedUrl !== 'this website') {
                 window.location.href = `https://${blockedUrl}`;
            } else {
                // If original URL is not available, go back
                 history.back();
            }
        }, 2000);
        return;
    }

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    timeRemainingElement.innerHTML =
        `⏰ Time remaining: <strong>${minutes}m ${seconds}s</strong>`;
}

// Update every second
updateTimeRemaining();
setInterval(updateTimeRemaining, 1000);

// Add event listener for the back button
document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            history.back();
        });
    }

    // Add click effect to suggestions
    const suggestions = document.querySelectorAll('.suggestion-list li');
    suggestions.forEach(item => {
        item.addEventListener('click', function() {
            this.style.background = 'rgba(255, 255, 255, 0.2)';
            setTimeout(() => {
                this.style.background = 'transparent';
            }, 200);
        });
    });
});