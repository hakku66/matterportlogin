# LAN-Based Credential Injection System for Matterport

## Overview
This system provides secure, automated login to Matterport for team members without exposing credentials. It consists of a local PHP API, HTML dashboard, and Tampermonkey userscript.

## Setup Guide

### Prerequisites
- Windows 10/11 LAN environment
- XAMPP or WAMP server installed on a central machine
- Tampermonkey extension installed on all 40 workstations
- Matterport account credentials

### Step 1: Configure the Local Server
1. Install XAMPP/WAMP on your server machine (e.g., IP: 192.168.1.100)
2. Copy the project files to `C:\xampp\htdocs\matterportlogin\` (or equivalent WAMP directory)
3. Start Apache and MySQL services in XAMPP control panel
4. Update `access.php`:
   - Replace `'your_matterport_username'` with actual username
   - Replace `'your_matterport_password'` with actual password
   - If your LAN uses different IP range, update `$allowed_ip_prefix`
5. Update `injector.user.js`:
   - Replace `'http://192.168.1.100/access.php'` with your server's IP

### Step 2: Test the API
1. Access `http://192.168.1.100/matterportlogin/access.php` from a machine in the LAN
2. Should return JSON with credentials (only from allowed IPs)
3. Access from outside LAN should be denied

### Step 3: Deploy the Dashboard
1. Team members access `http://192.168.1.100/matterportlogin/index.html`
2. Clicking "Launch Matterport Studio" opens the login page in new tab

### Step 4: Install and Configure Tampermonkey Script
1. On each workstation, open Chrome/Firefox
2. Install Tampermonkey extension if not already installed
3. Open Tampermonkey dashboard → "Add a new script"
4. Copy the contents of `injector.user.js` and paste
5. Save the script
6. **Obfuscate the script** (recommended for security):
   - Use an online JavaScript obfuscator (e.g., javascriptobfuscator.com)
   - Obfuscate the code and replace the script content
   - This prevents easy reading via "Inspect Element"

### Step 5: Verify Functionality
1. From a workstation, access the dashboard
2. Click "Launch Matterport Studio"
3. The userscript should automatically inject credentials and login
4. If fields don't load immediately, the script waits using MutationObserver

### Security Notes
- Credentials only exist in server memory and browser volatile memory
- IP restrictions prevent external access
- Obfuscated script prevents casual inspection
- No external services or email required

### Troubleshooting
- If login fails, check browser console for errors
- Verify server IP in userscript matches actual server
- Ensure Tampermonkey is enabled and script is active
- Check that Matterport login page selectors haven't changed (update CSS selectors if needed)

### Files
- `access.php`: Secure credential API
- `index.html`: Team dashboard
- `injector.user.js`: Tampermonkey injection script