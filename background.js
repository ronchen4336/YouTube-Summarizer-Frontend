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

// Get auth token helper function
function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(token);
    });
  });
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuth') {
    handleAuth(false, sendResponse);
    return true;
  } 
  else if (request.action === 'authenticate') {
    handleAuth(true, sendResponse);
    return true;
  }
  else if (request.action === 'getYouTubeVideo') {
    // Handle video summary request
    getAuthToken(false)
      .then(token => {
        chrome.cookies.getAll({ domain: '.youtube.com' }, cookies => {
          const cookieString = cookies
            .filter(cookie => ['CONSENT', 'VISITOR_INFO1_LIVE'].includes(cookie.name))
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
          console.log('Cookie String:', cookieString);
          fetch('https://youtube-summarizer-445521.appspot.com/summarize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              video_url: request.videoUrl,
              cookies: cookieString
            })
          })
          .then(response => response.text())
          .then(responseText => {
            console.log('API Response Text:', responseText);
            const data = JSON.parse(responseText);
            console.log('Parsed API Response:', data);
            sendResponse({ success: true, data: data });
          })
          .catch(error => {
            console.error('API request failed:', error);
            sendResponse({
              success: false,
              error: "We're having trouble generating your summary. Please try again in a few minutes."
            });
          });
        });
      })
      .catch(error => {
        console.error('Error getting auth token:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});

// Authentication handler
function handleAuth(interactive, sendResponse) {
  getAuthToken(interactive)
    .then(token => {
      sendResponse({ 
        success: true, 
        isAuthenticated: !!token,
        token: token 
      });
    })
    .catch(error => {
      console.error('Auth error:', error.message);
      sendResponse({ 
        success: false, 
        isAuthenticated: false, 
        error: error.message || 'Authentication failed'
      });
    });
}

// Installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Video Summarizer extension installed');
}); 