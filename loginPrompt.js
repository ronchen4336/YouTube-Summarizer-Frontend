import authService from './auth.js';

export function createLoginPrompt() {
    const container = document.createElement('div');
    container.className = 'login-prompt';
    container.innerHTML = `
        <div class="login-content">
            <h2>Sign in Required</h2>
            <p>Please sign in with your Google account to use the YouTube Summarizer</p>
            <button class="login-button">Sign in with Google</button>
        </div>
    `;

    const button = container.querySelector('.login-button');
    button.addEventListener('click', async () => {
        try {
            await authService.authenticate();
            container.remove();
            // Get the handleSummarizeClick function from the window object
            if (typeof window.handleSummarizeClick === 'function') {
                window.handleSummarizeClick();
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    });

    return container;
} 