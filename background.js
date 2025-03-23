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
          .then(response => response.json())
          .then(data => {
            sendResponse({ success: true, data: data });
          })
          .catch(() => {
            sendResponse({
              success: false,
              error: "We're having trouble generating your summary. Please try again in a few minutes."
            });
          });
        });
      })
      .catch(() => {
        sendResponse({ 
          success: false, 
          error: "Authentication failed. Please try again." 
        });
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
      sendResponse({ 
        success: false, 
        isAuthenticated: false, 
        error: error.message || 'Authentication failed'
      });
    });
}

// Installation handler
chrome.runtime.onInstalled.addListener(() => {}); 