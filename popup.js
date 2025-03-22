// Compatibility with Firefox and Chrome
const browserAPI = window.browser || window.chrome;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Set extension version in the popup footer
  const manifest = browserAPI.runtime.getManifest();
  document.getElementById('version').textContent = manifest.version;
  
  // Check if current tab is a YouTube video
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const url = currentTab?.url || '';
    
    // Show/hide appropriate content based on URL
    if (isYouTubeVideoUrl(url)) {
      // Automatically start generating a summary
      document.getElementById('message-container').style.display = 'block';
      generateAndDisplaySummary(currentTab);
    } else {
      // Not a YouTube video, show message
      document.getElementById('no-video-message').style.display = 'block';
      document.getElementById('message-container').style.display = 'none';
    }
  });
});

// Check if URL is a YouTube video
function isYouTubeVideoUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(&.*)?$/;
  return youtubeRegex.test(url);
}

// Generate summary and display in persistent panel
function generateAndDisplaySummary(tab) {
  // Close popup immediately since we're handling everything in the content script
  window.close();
}

// Display error message
function showError(message) {
  const iconElement = document.querySelector('#message-container .icon');
  if (iconElement) {
    iconElement.textContent = '❌';
  }
  
  const messageElement = document.querySelector('#message-container p');
  if (messageElement) {
    messageElement.textContent = `Error: ${message}`;
  }
  
  document.getElementById('message-container').style.display = 'block';
} 