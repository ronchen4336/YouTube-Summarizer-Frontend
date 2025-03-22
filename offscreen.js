// This URL must point to your authentication page
const AUTH_URL = 'https://youtube-summarizer-445521.appspot.com/auth.html';
const iframe = document.createElement('iframe');
iframe.src = AUTH_URL;
document.documentElement.appendChild(iframe);

chrome.runtime.onMessage.addListener(handleChromeMessages);

function handleChromeMessages(message, sender, sendResponse) {
  if (message.target !== 'offscreen') {
    return false;
  }

  function handleIframeMessage({data}) {
    try {
      if (data.startsWith('!_{')) {
        return;
      }
      data = JSON.parse(data);
      self.removeEventListener('message', handleIframeMessage);
      sendResponse(data);
    } catch (e) {
      console.error('JSON parse failed:', e.message);
    }
  }

  globalThis.addEventListener('message', handleIframeMessage, false);
  iframe.contentWindow.postMessage({"initAuth": true}, new URL(AUTH_URL).origin);
  return true;
} 