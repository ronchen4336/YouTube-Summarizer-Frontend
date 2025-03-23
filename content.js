// Compatibility with Firefox and Chrome
const browserAPI = window.browser || window.chrome;

// Configuration
const SUMMARY_BUTTON_ID = 'yt-summarizer-btn';
const SUMMARY_PANEL_ID = 'yt-summarizer-panel';
const PERSISTENT_PANEL_ID = 'yt-persistent-summary-panel';

// Add a flag to track initialization
let isInitialized = false;

const LOADING_MESSAGES = [
    "Negotiating with YouTube's algorithm... 🤝",
    "Bribing the AI to summarize faster... 🍩🤖",
    "Convincing videos to spill the tea... ☕️",
    "Filtering clickbait, almost there... 🎣",
    "Teaching the bots how to speed-read... 📖🤖",
    "Distracting YouTube ads while we sneak past... 🕵️‍♀️",
    "Compressing hours into seconds—magic! 🪄✨",
    "Wrestling the video into submission... 🤼",
    "Avoiding cat videos—promise! 🐱❌",
    "Stealing secrets from the video ninjas... 🥷",
    "Tickling bytes for a faster summary... 🤭💻",
    "Snacking on boring parts, yum... 🍽️🥱",
    "Convincing creators we watched everything... 🤐👀",
    "Hacking into video wisdom... ethically! 🧑‍💻😇",
    "Loading wit and charm into summaries... 🎩✨"
];

// Create and inject the summary button
function createSummaryButton() {
    // Create the button
    const button = document.createElement('button');
    button.className = 'ytp-button yt-summarizer-button';
    button.innerHTML = `
        <span style="font-size: 16px; margin-right: 4px;">✨</span>
        <span style="font-size: 13px;">Summarize</span>
    `;
    
    // Add click handler
    button.addEventListener('click', handleSummarizeClick);
    
    // Add to player controls
    const rightControls = document.querySelector('.ytp-right-controls');
    if (rightControls) {
        rightControls.insertBefore(button, rightControls.firstChild);
    }
}

// Create persistent panel for the summary that stays open
function createPersistentPanel() {
    // Remove any existing panel
    const existingPanel = document.getElementById(PERSISTENT_PANEL_ID);
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = PERSISTENT_PANEL_ID;
    panel.className = 'yt-summarizer-panel persistent-panel';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'yt-summarizer-panel-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Video Summary';
    
    const controls = document.createElement('div');
    controls.className = 'yt-summarizer-controls';
    
    const minimizeButton = document.createElement('button');
    minimizeButton.className = 'yt-summarizer-minimize';
    minimizeButton.title = 'Minimize';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'yt-summarizer-close';
    closeButton.title = 'Close';
    
    controls.appendChild(minimizeButton);
    controls.appendChild(closeButton);
    
    header.appendChild(title);
    header.appendChild(controls);
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'yt-summarizer-panel-content';
    
    // Add event listeners
    minimizeButton.addEventListener('click', () => {
        panel.classList.toggle('minimized');
        minimizeButton.classList.toggle('minimized');
        minimizeButton.title = panel.classList.contains('minimized') ? 'Restore' : 'Minimize';
    });
    
    closeButton.addEventListener('click', () => {
        panel.remove();
    });
    
    // Assemble the panel
    panel.appendChild(header);
    panel.appendChild(content);
    
    document.body.appendChild(panel);
    return panel;
}

// Display summary in the persistent panel
function displayPersistentSummary(summaryData) {
    try {
        let panel = document.getElementById(PERSISTENT_PANEL_ID);
        if (!panel) {
            panel = createPersistentPanel();
        }
        
        const content = panel.querySelector('.yt-summarizer-panel-content');
        if (!content) return;

        // First check if this is an error response from the backend
        if (summaryData.error || summaryData.data?.error) {
            const errorData = summaryData.data || summaryData;
            
            // Handle free trial limit error specifically
            if (errorData.error === 'Free trial limit reached') {
                content.innerHTML = `
                    <div class="error-message">
                        <div class="error-icon">ℹ️</div>
                        <div class="error-content">
                            <h3>Free Trial Limit Reached</h3>
                            <p>You have used all 3 free summaries.</p>
                            <p style="margin-top: 12px;">We're working on adding new subscription tiers with increased usage limits! 
                            For early access or increased limits, please email:</p>
                            <a href="mailto:ronaldchen4236@gmail.com" 
                               style="color: #2196F3; text-decoration: underline; display: block; margin-top: 8px;">
                               ronaldchen4236@gmail.com
                            </a>
                        </div>
                    </div>
                `;
                return;
            }

            // Handle other API errors with a generic message
            content.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">ℹ️</div>
                    <div class="error-content">
                        <p>We're having trouble generating your summary. Please try again in a few minutes.</p>
                        <button class="login-button" style="margin-top: 16px;">Try Again</button>
                    </div>
                </div>
            `;
            
            const retryButton = content.querySelector('.login-button');
            if (retryButton) {
                retryButton.addEventListener('click', handleSummarizeClick);
            }
            return;
        }

        // Continue with normal summary display if no errors
        let summaryContent;
        if (summaryData.response) {
            summaryContent = JSON.parse(summaryData.response);
        } else if (typeof summaryData === 'object' && summaryData.data) {
            summaryContent = summaryData.data;
        } else if (typeof summaryData === 'object' && summaryData.title && summaryData.body) {
            summaryContent = summaryData;
        } else {
            throw new Error();
        }

        // Clear existing content and display summary
        content.innerHTML = '';
        
        // Create title element
        const titleElement = document.createElement('div');
        titleElement.className = 'summary-title';
        titleElement.textContent = summaryContent.title;
        content.appendChild(titleElement);
        
        // Sort body sections by priority
        const bodySections = summaryContent.body.sort((a, b) => 
            (a.metadata?.priority || 999) - (b.metadata?.priority || 999)
        );
        
        // Process each section
        bodySections.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'summary-section';
            if (section.metadata?.content_type) {
                sectionElement.classList.add(`content-${section.metadata.content_type}`);
            }
            
            sectionElement.setAttribute('data-section-type', section.metadata?.content_type || 'general');
            
            // Create subtitle
            const subtitle = document.createElement('h3');
            subtitle.textContent = section.subtitle;
            sectionElement.appendChild(subtitle);
            
            // Create content based on display hint
            const contentElement = document.createElement('div');
            contentElement.className = 'section-content';
            
            switch (section.metadata?.display_hint) {
                case 'highlight':
                    contentElement.className = 'highlight';
                    contentElement.textContent = section.body_content[0];
                    break;
                    
                case 'bullet_list':
                    const ul = document.createElement('ul');
                    ul.className = 'bullet-list';
                    section.body_content.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        ul.appendChild(li);
                    });
                    contentElement.appendChild(ul);
                    break;
                    
                case 'paragraph':
                default:
                    contentElement.className = 'paragraph';
                    section.body_content.forEach(text => {
                        const p = document.createElement('p');
                        p.textContent = text;
                        contentElement.appendChild(p);
                    });
                    break;
            }
            
            sectionElement.appendChild(contentElement);
            content.appendChild(sectionElement);
        });
        
    } catch {
        const panel = document.getElementById(PERSISTENT_PANEL_ID);
        if (panel) {
            const content = panel.querySelector('.yt-summarizer-panel-content');
            if (content) {
                content.innerHTML = `
                    <div class="error-message">
                        <div class="error-icon">ℹ️</div>
                        <div class="error-content">
                            <p>We're having trouble displaying your summary. Please try again.</p>
                            <button class="login-button" style="margin-top: 16px;">Try Again</button>
                        </div>
                    </div>
                `;
                
                const retryButton = content.querySelector('.login-button');
                if (retryButton) {
                    retryButton.addEventListener('click', handleSummarizeClick);
                }
            }
        }
    }
}

// Create content element based on display hint
function createContentElement(content, displayHint) {
    const element = document.createElement('div');
    
    switch (displayHint) {
        case 'banner':
            element.className = 'banner';
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (Array.isArray(content)) {
                element.textContent = content.join(' ');
            }
            break;
            
        case 'highlight':
            element.className = 'highlight';
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (Array.isArray(content)) {
                element.textContent = content.join(' ');
            }
            break;
            
        case 'paragraph':
            element.className = 'paragraph';
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (Array.isArray(content)) {
                content.forEach(paragraph => {
                    const p = document.createElement('p');
                    p.className = 'paragraph';
                    p.textContent = typeof paragraph === 'string' ? paragraph : JSON.stringify(paragraph);
                    element.appendChild(p);
                });
            } else if (content && typeof content === 'object') {
                element.textContent = JSON.stringify(content, null, 2);
            }
            break;
            
        case 'bullet_list':
            const ul = document.createElement('ul');
            ul.className = 'bullet-list';
            if (Array.isArray(content)) {
                content.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = typeof item === 'string' ? item : JSON.stringify(item);
                    ul.appendChild(li);
                });
            } else if (typeof content === 'string') {
                const li = document.createElement('li');
                li.textContent = content;
                ul.appendChild(li);
            } else if (content && typeof content === 'object') {
                Object.entries(content).forEach(([key, value]) => {
                    const li = document.createElement('li');
                    li.textContent = `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`;
                    ul.appendChild(li);
                });
            }
            element.appendChild(ul);
            break;
            
        case 'quote':
        case 'blockquote':
            element.className = 'blockquote';
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (Array.isArray(content)) {
                content.forEach(quote => {
                    const blockquote = document.createElement('div');
                    blockquote.className = 'blockquote';
                    blockquote.textContent = typeof quote === 'string' ? quote : JSON.stringify(quote);
                    element.appendChild(blockquote);
                });
            }
            break;
            
        case 'tag_cloud':
            element.className = 'tag-cloud';
            if (Array.isArray(content)) {
                content.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tag';
                    span.textContent = typeof tag === 'string' ? tag : JSON.stringify(tag);
                    element.appendChild(span);
                });
            } else if (content && typeof content === 'object') {
                Object.entries(content).forEach(([category, items]) => {
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            const tag = document.createElement('span');
                            tag.className = 'tag';
                            tag.title = category;
                            tag.textContent = item;
                            element.appendChild(tag);
                        });
                    }
                });
            }
            break;
            
        default:
            // Default text display for any content type
            if (typeof content === 'string') {
                element.className = 'paragraph';
                element.textContent = content;
            } else if (Array.isArray(content)) {
                element.className = 'paragraph';
                content.forEach(item => {
                    const p = document.createElement('p');
                    p.className = 'paragraph';
                    p.textContent = typeof item === 'string' ? item : JSON.stringify(item);
                    element.appendChild(p);
                });
            } else if (content && typeof content === 'object') {
                element.className = 'paragraph';
                element.textContent = JSON.stringify(content, null, 2);
            }
    }
    
    return element;
}

// Initialize the extension
async function initialize() {
    const rightControls = document.querySelector('.ytp-right-controls');
    if (rightControls) {
        createSummaryButton();
    } else {
        setTimeout(initialize, 1000);
    }
}

// Start when page loads
initialize();

// Handle YouTube's dynamic navigation
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        initialize();
    }
}).observe(document, {subtree: true, childList: true});

// Listen for messages from popup/service worker
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'display_persistent_summary') {
        if (request.summaryData) {
            displayPersistentSummary(request.summaryData);
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'No summary data received' });
        }
        return true;
    } else if (request.action === 'trigger_summarize') {
        handleSummarizeClick();
        sendResponse({ success: true });
        return true;
    }
});

// Function to request cookie permissions
async function requestCookiePermissions() {
    try {
        // Check if we already have permission
        const permissions = {
            permissions: ['cookies'],
            origins: ['*://*.youtube.com/*']
        };
        
        const hasPermission = await browserAPI.permissions.contains(permissions);
        if (hasPermission) {
            return true;
        }

        // Request permission from user
        const granted = await browserAPI.permissions.request(permissions);
        if (!granted) {
            throw new Error('Cookie permission is required to generate summaries');
        }
        return true;
    } catch (error) {
        throw error;
    }
}

// Updated handleSummarizeClick function
async function handleSummarizeClick() {
    try {
        const authResponse = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error('Authentication failed'));
                } else {
                    resolve(response);
                }
            });
        });

        if (!authResponse.isAuthenticated) {
            // Show login prompt
            let panel = document.getElementById(PERSISTENT_PANEL_ID);
            panel = panel || createPersistentPanel();
            const content = panel.querySelector('.yt-summarizer-panel-content');
            
            content.innerHTML = `
                <div class="login-content">
                    <h2>Sign in Required</h2>
                    <p>Please sign in with your Google account to use the YouTube Summarizer</p>
                    <button class="login-button">Sign in with Google</button>
                </div>
            `;

            const loginButton = content.querySelector('.login-button');
            loginButton.addEventListener('click', async () => {
                try {
                    content.innerHTML = `
                        <div class="loading-container">
                            <div class="spinner">
                                <div class="spinner-circle"></div>
                            </div>
                            <p>Signing in...</p>
                        </div>
                    `;
                    
                    const authResult = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else if (!response || response.error) {
                                reject(new Error(response?.error || 'Authentication failed'));
                            } else {
                                resolve(response);
                            }
                        });
                    });

                    if (authResult.success) {
                        handleSummarizeClick(); // Retry after successful authentication
                    } else {
                        throw new Error(authResult.error || 'Authentication failed');
                    }
                } catch (error) {
                    content.innerHTML = `
                        <div class="error-message">
                            <div class="error-icon">❌</div>
                            <p>${error.message}</p>
                            <button class="login-button" style="margin-top: 16px;">Try Again</button>
                        </div>
                    `;
                    
                    const retryButton = content.querySelector('.login-button');
                    if (retryButton) {
                        retryButton.addEventListener('click', handleSummarizeClick);
                    }
                }
            });
            return;
        }

        // Continue with video summary if authenticated
        let panel = document.getElementById(PERSISTENT_PANEL_ID);
        panel = panel || createPersistentPanel();
        const content = panel.querySelector('.yt-summarizer-panel-content');
        
        // Create loading container with all elements
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
            <div class="spinner">
                <div class="spinner-circle"></div>
                <div class="spinner-circle"></div>
                <div class="spinner-circle"></div>
            </div>
            <p id="loading-message" class="loading-text">${LOADING_MESSAGES[0]}</p>
        `;
        
        // Clear existing content and add loading container
        content.innerHTML = '';
        content.appendChild(loadingContainer);

        // Get message element after it's added to DOM
        const messageElement = loadingContainer.querySelector('#loading-message');
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            // Double check element still exists
            if (messageElement && document.body.contains(messageElement)) {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                messageElement.textContent = LOADING_MESSAGES[messageIndex];
            } else {
                clearInterval(messageInterval);
            }
        }, 3000);

        try {
            const currentUrl = window.location.href;
            if (!currentUrl.includes('youtube.com/watch')) {
                throw new Error('Not a YouTube video page');
            }
            
            const response = await chrome.runtime.sendMessage({
                action: 'getYouTubeVideo',
                videoUrl: currentUrl
            });

            clearInterval(messageInterval);

            if (!response.success) {
                throw new Error(response.error || 'Failed to process video');
            }
            displayPersistentSummary(response.data);
        } catch (error) {
            clearInterval(messageInterval);
            throw error;
        }
        
    } catch {
        const panel = document.getElementById(PERSISTENT_PANEL_ID);
        if (panel) {
            const content = panel.querySelector('.yt-summarizer-panel-content');
            if (content) {
                content.innerHTML = `
                    <div class="error-message">
                        <div class="error-icon">ℹ️</div>
                        <div class="error-content">
                            <p>Something went wrong. Please try again.</p>
                            <button class="login-button" style="margin-top: 16px;">Try Again</button>
                        </div>
                    </div>
                `;
                
                const retryButton = content.querySelector('.login-button');
                if (retryButton) {
                    retryButton.addEventListener('click', handleSummarizeClick);
                }
            }
        }
    }
}

// Helper to extract video ID from URL
function getVideoId(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
}

// Check if the current URL is a YouTube video
function isYouTubeVideoUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(&.*)?$/;
    return youtubeRegex.test(url);
}

// Add this near the top of content.js
window.handleSummarizeClick = handleSummarizeClick;
