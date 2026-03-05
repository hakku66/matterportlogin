// ==UserScript==
// @name         Multi‑Service Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically inject credentials for Matterport and Edozo logins
// @author       MJ Designs
// @match        https://authn.matterport.com/login*
// @match        https://login.edozo.com/login*
// @include      https://authn.matterport.com/*
// @include      https://login.edozo.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    function findField(selector) {
        let field = document.querySelector(selector);
        if (field) return field;

        const iframes = document.querySelectorAll('iframe');
        for (let iframe of iframes) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                field = doc.querySelector(selector);
                if (field) return field;
            } catch (e) {
                // cross‑origin iframe, skip
            }
        }
        return null;
    }

    function getSelectors() {
        const isEdozo = location.host.includes('edozo.com');
        if (isEdozo) {
            return {
                email: '[aria-label="Email"], [id="1-email"], input[name="email"]',
                password: 'div.auth0-lock-input-show-password input, input[type="password"]',
                isEdozo: true
            };
        } else {
            return {
                email: '[data-testid="textfield_email"], #email, input[name="email"], input[type="email"]',
                password: '[data-testid="textfield_password"], #password, input[name="password"], input[type="password"]',
                isEdozo: false
            };
        }
    }

    function injectCredentials() {
        const { email: emailSel, password: pwdSel, isEdozo } = getSelectors();
        const serviceParam = isEdozo ? 'edozo' : 'matterport';

        const emailField = findField(emailSel);
        const passwordField = findField(pwdSel);
        if (!emailField || !passwordField) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://192.168.2.49/matterportlogin/access.php?service=' + serviceParam,
            onload(response) {
                try {
                    const data = JSON.parse(response.responseText);

                    function fillSequentially() {
                        // Disable autocomplete on parent form to prevent Chrome's auto-save
                        let form = emailField.closest('form');
                        if (form) {
                            form.setAttribute('autocomplete', 'off');
                        }

                        emailField.click();
                        emailField.focus();
                        emailField.setAttribute('autocomplete', 'off');
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(emailField, data.username);
                        emailField.dispatchEvent(new Event('input', { bubbles: true }));
                        emailField.dispatchEvent(new Event('change', { bubbles: true }));
                        emailField.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
                        emailField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
                        emailField.dispatchEvent(new Event('blur', { bubbles: true }));

                        setTimeout(() => {
                            passwordField.click();
                            passwordField.focus();
                            passwordField.setAttribute('autocomplete', 'new-password');
                            // Disable spellcheck and other autocomplete hints
                            passwordField.setAttribute('spellcheck', 'false');
                            const nativePwdSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                            nativePwdSetter.call(passwordField, data.password);
                            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                            passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                            passwordField.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
                            passwordField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
                            passwordField.dispatchEvent(new Event('blur', { bubbles: true }));

                            setTimeout(checkAndSubmit, 1000);
                            // Clear password field after a delay to prevent Chrome from saving it
                            setTimeout(() => {
                                nativePwdSetter.call(passwordField, '');
                                emailField.value = '';
                            }, 3000);
                        }, 300);
                    }

                    function checkAndSubmit() {
                        let submitBtn;
                        if (isEdozo) {
                            submitBtn = document.querySelector('button[type="submit"]');
                        } else {
                            submitBtn = findField('[data-testid="button_sign_in"]') ||
                                        document.querySelector('button[type="submit"]') ||
                                        document.querySelector('button[data-testid*="login"]') ||
                                        Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim().toLowerCase().includes('sign in')) ||
                                        document.querySelector('input[type="submit"]');
                        }
                        if (submitBtn && !submitBtn.disabled) submitBtn.click();
                    }

                    fillSequentially();
                } catch (e) {
                    console.error('Error parsing credentials:', e);
                }
            },
            onerror(response) {
                console.error('Failed to fetch credentials:', response);
            }
        });
    }

    function readyCheck() {
        const { email: emailSel, password: pwdSel } = getSelectors();
        const emailCheck = findField(emailSel);
        const passwordCheck = findField(pwdSel);
        return emailCheck && passwordCheck;
    }

    if (readyCheck()) {
        injectCredentials();
        return;
    }

    const observer = new MutationObserver(() => {
        if (readyCheck()) {
            observer.disconnect();
            injectCredentials();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    let attempts = 0;
    const fallbackCheck = setInterval(() => {
        attempts++;
        if (readyCheck()) {
            clearInterval(fallbackCheck);
            observer.disconnect();
            injectCredentials();
        }
        if (attempts > 100) {
            clearInterval(fallbackCheck);
            observer.disconnect();
        }
    }, 100);

})();
