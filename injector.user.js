// ==UserScript==
// @name         Matterport Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically inject credentials and login to Matterport
// @author       MJ Designs
// @match        https://my.matterport.com/login*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    function injectCredentials() {
        // Identify input fields using CSS selectors
        const emailField = document.querySelector('input[type="email"]');
        const passwordField = document.querySelector('input[type="password"]');

        if (!emailField || !passwordField) {
            console.log('Login fields not found, retrying...');
            return;
        }

        // Fetch credentials from local API using GM_xmlhttpRequest
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://192.168.1.100/access.php',  // Replace with your local server IP
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);

                    // Inject username
                    emailField.value = data.username;
                    emailField.dispatchEvent(new Event('input', { bubbles: true }));
                    emailField.dispatchEvent(new Event('change', { bubbles: true }));

                    // Inject password
                    passwordField.value = data.password;
                    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordField.dispatchEvent(new Event('change', { bubbles: true }));

                    // Auto-submit after 500ms
                    setTimeout(() => {
                        const submitBtn = document.querySelector('button[type="submit"]') ||
                                         document.querySelector('button[data-testid="login-button"]') ||
                                         document.querySelector('button:contains("Sign in")') ||
                                         document.querySelector('input[type="submit"]');

                        if (submitBtn) {
                            submitBtn.click();
                        } else {
                            console.log('Submit button not found');
                        }
                    }, 500);

                } catch (e) {
                    console.error('Error parsing credentials:', e);
                }
            },
            onerror: function() {
                console.error('Failed to fetch credentials');
            }
        });
    }

    // Use MutationObserver to handle dynamic loading of fields
    const observer = new MutationObserver(() => {
        if (document.querySelector('input[type="email"]') && document.querySelector('input[type="password"]')) {
            observer.disconnect();
            injectCredentials();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Fallback: Check every 100ms for up to 10 seconds
    let attempts = 0;
    const fallbackCheck = setInterval(() => {
        attempts++;
        if (document.querySelector('input[type="email"]') && document.querySelector('input[type="password"]')) {
            clearInterval(fallbackCheck);
            observer.disconnect();
            injectCredentials();
        }
        if (attempts > 100) {  // 10 seconds
            clearInterval(fallbackCheck);
            observer.disconnect();
        }
    }, 100);

})();