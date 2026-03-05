// ==UserScript==
// @name         Matterport Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically inject credentials and login to Matterport
// @author       MJ Designs
// @match        https://my.matterport.com/login*
// @include       https://my.matterport.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// ==/UserScript==

(function() {
    'use strict';

    console.log('Matterport Auto Login script loaded');
    GM_log('Matterport Auto Login script loaded');
    console.log('Iframes found:', document.querySelectorAll('iframe').length);
    GM_log('Iframes found: ' + document.querySelectorAll('iframe').length);
    // debugger;  // Removed - was for debugging
    // alert('Matterport Auto Login script loaded - check console for details');  // Removed - was for debugging

    function findField(selector) {
        // Check main document
        let field = document.querySelector(selector);
        if (field) return field;

        // Check iframes
        const iframes = document.querySelectorAll('iframe');
        for (let iframe of iframes) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                field = doc.querySelector(selector);
                if (field) return field;
            } catch (e) {
                // Cross-origin iframe, skip
            }
        }
        return null;
    }

    function injectCredentials() {
        // Identify input fields using CSS selectors (based on inspected HTML data-testid)
        const emailField = findField('[data-testid="textfield_email"]') || findField('#email') || findField('input[name="email"]') || findField('input[type="email"]');
        const passwordField = findField('[data-testid="textfield_password"]') || findField('#password') || findField('input[name="password"]') || findField('input[type="password"]');

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
    const emailCheck = findField('[data-testid="textfield_email"]') || findField('#email') || findField('input[name="email"]') || findField('input[type="email"]');
    const passwordCheck = findField('[data-testid="textfield_password"]') || findField('#password') || findField('input[name="password"]') || findField('input[type="password"]');
    console.log('Initial check - Email:', emailCheck, 'Password:', passwordCheck);
    GM_log('Initial check - Email: ' + emailCheck + ' Password: ' + passwordCheck);
    if (emailCheck && passwordCheck) {
        console.log('Fields already present, injecting immediately');
        GM_log('Fields already present, injecting immediately');
        injectCredentials();
        return;
    }

    // Use MutationObserver to handle dynamic loading of fields
    const observer = new MutationObserver(() => {
        const emailObs = findField('[data-testid="textfield_email"]') || findField('#email') || findField('input[name="email"]') || findField('input[type="email"]');
        const passwordObs = findField('[data-testid="textfield_password"]') || findField('#password') || findField('input[name="password"]') || findField('input[type="password"]');
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
        const emailInt = findField('[data-testid="textfield_email"]') || findField('#email') || findField('input[name="email"]') || findField('input[type="email"]');
        const passwordInt = findField('[data-testid="textfield_password"]') || findField('#password') || findField('input[name="password"]') || findField('input[type="password"]');
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