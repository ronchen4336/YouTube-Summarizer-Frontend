// Background script for YouTube Video Summarizer

const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
let creatingOffscreenDocument;

async function hasDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some(
    (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function setupOffscreenDocument(path) {
  if (!(await hasDocument())) {
    if (creatingOffscreenDocument) {
      await creatingOffscreenDocument;
    } else {
      creatingOffscreenDocument = chrome.offscreen.createDocument({
        url: path,
        reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
        justification: 'authentication'
      });
      await creatingOffscreenDocument;
      creatingOffscreenDocument = null;
    }
  }
}

async function closeOffscreenDocument() {
  if (await hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

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
      
      // Only request essential cookies needed for transcript access
      chrome.cookies.getAll({ domain: '.youtube.com' }, (cookies) => {
        // Only include cookies required for transcript access
        const essentialCookies = cookies.filter(cookie => 
            ['CONSENT', 'VISITOR_INFO1_LIVE'].includes(cookie.name)
        );
        const cookieString = essentialCookies
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
          sendResponse({ 
            success: false, 
            error: "We're having trouble generating your summary. Please try again in a few minutes." 
          });
        });
      });
      
      return true; // Required for async response
    } catch (error) {
      console.error('Error processing video:', error);
      sendResponse({ success: false, error: error.message });
      return true;
    }
  }

  if (request.action === 'checkAuth') {
    handleAuth(false, sendResponse);
    return true;
  }
  
  if (request.action === 'authenticate') {
    handleAuth(true, sendResponse);
    return true;
  }
});

async function handleAuth(interactive, sendResponse) {
  try {
    // Get auth token using chrome.identity
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(token);
      });
    });

    sendResponse({ 
      success: true, 
      isAuthenticated: !!token,
      token: token 
    });
  } catch (error) {
    console.error('Auth error:', error);
    if (interactive) {
      // Only try offscreen auth if interactive login was requested
      await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
      try {
        const response = await chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'firebase-auth'
        });
        
        if (response?.name === 'FirebaseError') {
          throw response;
        }
        
        sendResponse({ 
          success: true, 
          isAuthenticated: true, 
          token: response.user?.accessToken 
        });
      } catch (offscreenError) {
        sendResponse({ 
          success: false, 
          isAuthenticated: false, 
          error: offscreenError.message 
        });
      } finally {
        await closeOffscreenDocument();
      }
    } else {
      sendResponse({ 
        success: false, 
        isAuthenticated: false, 
        error: error.message 
      });
    }
  }
} 