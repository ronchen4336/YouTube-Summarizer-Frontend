// Background script for YouTube Video Summarizer

// Handle clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  // Only trigger on YouTube video pages
  if (tab.url && tab.url.includes('youtube.com/watch')) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'trigger_summarize'
    });
  } else {
    // If not on a YouTube video page, show an alert
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        alert('Please navigate to a YouTube video page to use this extension.');
      }
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getYouTubeVideo') {
    try {
      const videoUrl = request.videoUrl;
      
      // Get YouTube cookies
      chrome.cookies.getAll({ domain: '.youtube.com' }, (cookies) => {
        // Format cookies into a string
        const cookieString = cookies
          .map(cookie => `${cookie.name}=${cookie.value}`)
          .join('; ');
        
        // Send to backend with cookies
        fetch('https://youtube-summarizer-445521.appspot.com/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: videoUrl,
            cookies: cookieString  // Send cookies to backend
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          return response.json();
        })
        .then(result => {
          sendResponse({ success: true, data: result });
        })
        .catch(error => {
          console.error('API request failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      });
      
      return true; // Required for async response
    } catch (error) {
      console.error('Error processing video:', error);
      sendResponse({ success: false, error: error.message });
      return true;
    }
  }
}); 