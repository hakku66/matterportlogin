// ==UserScript==
// @name         Matterport Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically inject credentials and login to Matterport
// @author       MJ Designs
// @match        https://my.matterport.com/login*
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// ==/UserScript==

(function() {
    'use strict';

    console.log('Matterport Auto Login script loaded');
    GM_log('Matterport Auto Login script loaded');
    debugger;
    // alert('Matterport Auto Login script loaded - check console for details');  // Removed - was for debugging

    function injectCredentials() {
        // Identify input fields using CSS selectors (more specific)
        const emailField = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
        const passwordField = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');

        console.log('Email field found:', emailField);
        GM_log('Email field found: ' + emailField);
        console.log('Password field found:', passwordField);
        GM_log('Password field found: ' + passwordField);

        if (!emailField || !passwordField) {
            console.log('Login fields not found, retrying...');
            return;
        }

        console.log('Fetching credentials...');
        GM_log('Fetching credentials...');

        // Fetch credentials from local API using GM_xmlhttpRequest
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://192.168.1.100/access.php',  // Replace with your local server IP
            onload: function(response) {
                console.log('Response received:', response.responseText);
                GM_log('Response received: ' + response.responseText);
                try {
                    const data = JSON.parse(response.responseText);
                    console.log('Credentials received, injecting...');
                    GM_log('Credentials received, injecting...');

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
                                         document.querySelector('button[data-testid*="login"]') ||
                                         Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim().toLowerCase().includes('sign in')) ||
                                         document.querySelector('input[type="submit"]');

                        console.log('Submit button found:', submitBtn);
                        GM_log('Submit button found: ' + submitBtn);

                        if (submitBtn) {
                            console.log('Clicking submit button');
                            GM_log('Clicking submit button');
                            submitBtn.click();
                        } else {
                            console.log('Submit button not found');
                            GM_log('Submit button not found');
                        }
                    }, 500);

                } catch (e) {
                    console.error('Error parsing credentials:', e);
                GM_log('Error parsing credentials: ' + e);
                }
            },
            onerror: function(response) {
                console.error('Failed to fetch credentials:', response);
                GM_log('Failed to fetch credentials: ' + response);
            }
        });
    }

    // Check immediately if fields are already loaded
    const emailCheck = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
    const passwordCheck = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');
    console.log('Initial check - Email:', emailCheck, 'Password:', passwordCheck);
    GM_log('Initial check - Email: ' + emailCheck + ' Password: ' + passwordCheck);
    if (emailCheck && passwordCheck) {
        console.log('Fields already present, injecting immediately');
        injectCredentials();
        return;
    }

    // Use MutationObserver to handle dynamic loading of fields
    const observer = new MutationObserver(() => {
        const emailObs = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
        const passwordObs = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');
        console.log('Observer check - Email:', emailObs, 'Password:', passwordObs);
        GM_log('Observer check - Email: ' + emailObs + ' Password: ' + passwordObs);
        if (emailObs && passwordObs) {
            observer.disconnect();
            injectCredentials();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Fallback: Check every 100ms for up to 10 seconds
    let attempts = 0;
    const fallbackCheck = setInterval(() => {
        attempts++;
        const emailInt = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
        const passwordInt = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');
        console.log('Interval check', attempts, '- Email:', emailInt, 'Password:', passwordInt);
        GM_log('Interval check ' + attempts + ' - Email: ' + emailInt + ' Password: ' + passwordInt);
        if (emailInt && passwordInt) {
            clearInterval(fallbackCheck);
            observer.disconnect();
            injectCredentials();
        }
        if (attempts > 100) {  // 10 seconds
            clearInterval(fallbackCheck);
            observer.disconnect();
            console.log('Timeout: Login fields not found after 10 seconds');
            GM_log('Timeout: Login fields not found after 10 seconds');
        }
    }, 100);

})();