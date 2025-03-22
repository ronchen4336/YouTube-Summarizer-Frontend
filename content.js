// Compatibility with Firefox and Chrome
const browserAPI = window.browser || window.chrome;

// Configuration
const SUMMARY_BUTTON_ID = 'yt-summarizer-btn';
const SUMMARY_PANEL_ID = 'yt-summarizer-panel';
const PERSISTENT_PANEL_ID = 'yt-persistent-summary-panel';

// Create and inject the summary button
function createSummaryButton() {
    // Check if button already exists to prevent duplicates
    if (document.getElementById(SUMMARY_BUTTON_ID)) {
        return;
    }
    
    const button = document.createElement('button');
    button.id = SUMMARY_BUTTON_ID;
    button.className = 'yt-summarizer-button';
    button.title = 'Generate Video Summary';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'yt-summarizer-icon';
    iconSpan.textContent = '✨'; // Using a sparkle emoji as it suggests AI/magic
    
    const textSpan = document.createElement('span');
    textSpan.className = 'yt-summarizer-text';
    textSpan.textContent = 'Summarize';
    
    button.appendChild(iconSpan);
    button.appendChild(textSpan);
    button.addEventListener('click', handleSummarizeClick);
    
    // Create a container to add our button without replacing existing controls
    const container = document.createElement('div');
    container.className = 'yt-summarizer-container';
    container.appendChild(button);
    
    // Find the YouTube player controls
    const controls = document.querySelector('.ytp-right-controls');
    if (controls) {
        // Insert our container before the first child
        controls.insertBefore(container, controls.firstChild);
        console.log('Summary button added to YouTube player controls');
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
    minimizeButton.innerHTML = '_';
    minimizeButton.title = 'Minimize';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'yt-summarizer-close';
    closeButton.innerHTML = '×';
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
        if (panel.classList.contains('minimized')) {
            minimizeButton.innerHTML = '□';
            minimizeButton.title = 'Restore';
        } else {
            minimizeButton.innerHTML = '_';
            minimizeButton.title = 'Minimize';
        }
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
        console.log('Displaying persistent summary:', summaryData);
        
        // Create or get panel
        let panel = document.getElementById(PERSISTENT_PANEL_ID);
        if (!panel) {
            panel = createPersistentPanel();
        }
        
        const content = panel.querySelector('.yt-summarizer-panel-content');
        if (!content) {
            console.error('Panel content area not found');
            return;
        }
        
        let summaryContent;
        
        // Handle the response format
        if (summaryData.response) {
            try {
                summaryContent = JSON.parse(summaryData.response);
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                throw new Error('Invalid response format');
            }
        } else if (typeof summaryData === 'object' && summaryData.title && summaryData.body) {
            summaryContent = summaryData;
        } else {
            throw new Error('Unrecognized response format');
        }
        
        // Clear existing content
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
                    contentElement.textContent = Array.isArray(section.body_content) 
                        ? section.body_content[0] 
                        : section.body_content;
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
                    
                case 'tag_cloud':
                    contentElement.className = 'tag-cloud';
                    section.body_content.forEach(tag => {
                        const span = document.createElement('span');
                        span.className = 'tag';
                        span.textContent = tag;
                        contentElement.appendChild(span);
                    });
                    break;
                    
                case 'blockquote':
                    section.body_content.forEach(quote => {
                        const blockquote = document.createElement('blockquote');
                        blockquote.className = 'blockquote';
                        blockquote.textContent = quote;
                        contentElement.appendChild(blockquote);
                    });
                    break;
                    
                case 'italic_text':
                    const ul2 = document.createElement('ul');
                    ul2.className = 'bullet-list';
                    section.body_content.forEach(item => {
                        const li = document.createElement('li');
                        li.style.fontStyle = 'italic';
                        li.textContent = item;
                        ul2.appendChild(li);
                    });
                    contentElement.appendChild(ul2);
                    break;
                    
                default:
                    contentElement.className = 'paragraph';
                    if (Array.isArray(section.body_content)) {
                        section.body_content.forEach(text => {
                            const p = document.createElement('p');
                            p.textContent = text;
                            contentElement.appendChild(p);
                        });
                    } else {
                        contentElement.textContent = section.body_content;
                    }
            }
            
            sectionElement.appendChild(contentElement);
            content.appendChild(sectionElement);
        });
        
    } catch (error) {
        console.error('Error displaying persistent summary:', error);
        console.error('Summary data:', summaryData);
        
        const panel = document.getElementById(PERSISTENT_PANEL_ID);
        if (panel) {
            const content = panel.querySelector('.yt-summarizer-panel-content');
            if (content) {
                content.innerHTML = `
                    <div class="error-message">
                        <p>❌ Error displaying summary: ${error.message}</p>
                    </div>
                `;
            }
        }
        
        browserAPI.runtime.sendMessage({
            action: 'log_error',
            error: `Display error: ${error.message}`
        });
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
function initialize() {
    console.log('Initializing YouTube Summarizer extension');
    const currentUrl = window.location.href;
    
    if (isYouTubeVideoUrl(currentUrl)) {
        console.log('YouTube video detected, adding summarize button');
        
        if (!document.querySelector('.ytp-right-controls')) {
            console.log('YouTube player controls not found, waiting...');
            setTimeout(createSummaryButton, 2000);
        } else {
            createSummaryButton();
        }
    } else {
        console.log('Not a YouTube video page, skipping button creation');
    }
}

// Listen for messages from popup/service worker
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'display_persistent_summary') {
        console.log('Received request to display persistent summary');
        if (request.summaryData) {
            displayPersistentSummary(request.summaryData);
            sendResponse({ success: true });
        } else {
            console.error('No summary data received');
            sendResponse({ success: false, error: 'No summary data received' });
        }
        return true;
    } else if (request.action === 'trigger_summarize') {
        console.log('Received request to trigger summarization');
        handleSummarizeClick();
        sendResponse({ success: true });
        return true;
    }
});

// Start the extension when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

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
        console.error('Permission request failed:', error);
        throw error;
    }
}

// Updated handleSummarizeClick function
async function handleSummarizeClick() {
    try {
        console.log('Summarize button clicked');
        
        const currentUrl = window.location.href;
        if (!isYouTubeVideoUrl(currentUrl)) {
            alert('This button only works on YouTube video pages');
            return;
        }
        
        let panel = document.getElementById(PERSISTENT_PANEL_ID);
        panel = panel || createPersistentPanel();
        const content = panel.querySelector('.yt-summarizer-panel-content');
        
        content.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Processing video...</p>
            </div>
        `;

        // Let the background script handle everything (including cookies)
        const response = await browserAPI.runtime.sendMessage({
            action: 'getYouTubeVideo',
            videoUrl: currentUrl
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to process video');
        }

        // Display the summary
        displayPersistentSummary(response.data);
        
    } catch (error) {
        console.error('Error in summarize process:', error);
        
        const panel = document.getElementById(PERSISTENT_PANEL_ID);
        if (panel) {
            const content = panel.querySelector('.yt-summarizer-panel-content');
            if (content) {
                content.innerHTML = `
                    <div class="error-message">
                        <p>❌ Error: ${error.message}</p>
                        <p>Please try again later.</p>
                    </div>
                `;
            }
        }
        
        browserAPI.runtime.sendMessage({
            action: 'log_error',
            error: `Summarize error: ${error.message}`
        });
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
