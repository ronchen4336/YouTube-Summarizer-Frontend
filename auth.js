const browserAPI = window.browser || window.chrome;

class AuthService {
    constructor() {
        this.isAuthenticated = false;
    }

    async checkAuthStatus() {
        if (!browserAPI?.identity?.getAuthToken) {
            console.error('Chrome identity API not available');
            return false;
        }

        return new Promise((resolve) => {
            try {
                browserAPI.identity.getAuthToken({ interactive: false }, (token) => {
                    if (browserAPI.runtime.lastError) {
                        console.log('Not authenticated:', browserAPI.runtime.lastError.message);
                        this.isAuthenticated = false;
                        resolve(false);
                        return;
                    }
                    this.isAuthenticated = !!token;
                    resolve(!!token);
                });
            } catch (error) {
                console.error('Auth check failed:', error);
                this.isAuthenticated = false;
                resolve(false);
            }
        });
    }

    async authenticate() {
        return new Promise((resolve, reject) => {
            browserAPI.identity.getAuthToken({ interactive: true }, (token) => {
                if (browserAPI.runtime.lastError) {
                    reject(browserAPI.runtime.lastError);
                    return;
                }
                this.isAuthenticated = true;
                resolve(token);
            });
        });
    }

    async getToken() {
        return new Promise((resolve, reject) => {
            browserAPI.identity.getAuthToken({ interactive: false }, (token) => {
                if (browserAPI.runtime.lastError) {
                    reject(browserAPI.runtime.lastError);
                    return;
                }
                resolve(token);
            });
        });
    }

    async signOut() {
        return new Promise((resolve, reject) => {
            browserAPI.identity.getAuthToken({ interactive: false }, (token) => {
                if (!token) {
                    resolve();
                    return;
                }

                // Revoke token
                browserAPI.identity.removeCachedAuthToken({ token }, () => {
                    fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
                        .then(() => {
                            this.isAuthenticated = false;
                            resolve();
                        })
                        .catch(reject);
                });
            });
        });
    }
}

window.authService = new AuthService(); 