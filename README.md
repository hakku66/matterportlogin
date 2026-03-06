# LAN-Based Credential Injection System for Matterport

## Overview
This system provides secure, automated login to Matterport for team members without exposing credentials. It consists of a local PHP API, HTML dashboard, and Tampermonkey userscript.

**⚠️ SECURITY:** Never commit credentials to git. Use `.gitignore` to prevent accidental exposure.

## Setup Guide

### Prerequisites
- Windows 10/11 LAN environment
- XAMPP or WAMP server installed on a central machine
- Tampermonkey extension installed on all 40 workstations
- Matterport account credentials

### Step 1: Configure the Local Server
1. Install XAMPP/WAMP on your server machine (note your server's LAN IP - e.g., `192.168.2.49`)
2. Copy the project files to `C:\xampp\htdocs\matterportlogin\` (or equivalent WAMP directory)
3. Start Apache and MySQL services in XAMPP control panel
4. **⚠️ SECURITY: Configure credentials locally only (do NOT commit to git):**
   - Edit `access.php` directly on the server machine
   - The file now supports multiple services; each has its own email/password pair.
     e.g.:
     ```php
     if ($service === 'edozo') {
         $username = 'edozo_user@example.com';
         $password = 'edozo_secret';
     } else {
         $username = 'matterport_user@example.com';
         $password = 'matterport_secret';
     }
     ```
   - Be sure to set the values for **both** Edozo and Matterport since they are different logins.   - Adjust the `$allowed_ip_prefix` at the top of `access.php` to match your LAN subnet (e.g. `192.168.2.`) or remove the check during testing; a mismatched prefix causes an "Access denied" response instead of JSON.   - The `.gitignore` file prevents these values from being committed accidentally
5. Update `injector.user.js`:
   - Find your server's LAN IP (e.g., `ipconfig` in Windows command prompt, look for IPv4 address on your Ethernet adapter)
   - Replace `'http://192.168.1.100/access.php'` with your server's IP and correct path
   - **IMPORTANT**: Ensure the URL matches where you placed the files (if in `/C:/xampp/htdocs/matterportlogin/`, the URL should be `/matterportlogin/access.php`)

### Step 2: Test the API
1. Access `http://192.168.1.100/matterportlogin/access.php` from a machine in the LAN
2. Should return JSON with credentials (only from allowed IPs)
3. Access from outside LAN should be denied

### Step 3: Deploy the Dashboard
1. Team members access `http://192.168.1.100/matterportlogin/index.html`
2. The page presents buttons for each supported service. Currently:
   * **Launch Matterport Studio** – opens Matterport login
   * **Launch Edozo Map** – opens Edozo login
3. Adding more services in the future is as simple as adding another `<button>` element in `index.html`; the userscript and API already support multiple services via the `service` query parameter.

### Step 4: Install and Configure Tampermonkey Script

This repository also includes a convenience deployment script (`deploy.sh`) that can copy the `injector.user.js` file into local or remote Tampermonkey installations on Windows. Starting with v2 it also accepts a Tampermonkey export zip file as input and will unpack the `.user.js` automatically.

Usage examples:

```sh
# interactive menu (Windows Git Bash, WSL, etc.)
./deploy.sh

# deploy local copy
./deploy.sh local

# specify an export zip (e.g. network share) and deploy locally
./deploy.sh \\192.168.2.199\resi\tampermonkey-script.zip local
```
The script handles Windows paths, SSH, and UNC shares; it simply copies the `.user.js` into the Tampermonkey directory so that browsers will pick it up.  (It does **not** actually run Tampermonkey – the extension must be installed and running on the target machine.)

### Step 5: Verify Functionality

This script now supports multiple login pages (Matterport and Edozo). It detects the host and adds `?service=edozo` for Edozo or leaves it blank for Matterport, ensuring distinct credentials are fetched for each service.

1. On each workstation, open Chrome or Firefox browser
2. Install the Tampermonkey extension if not already installed:
   - Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/
3. Click the Tampermonkey icon in the browser toolbar and select "Dashboard"
4. Click "Add a new script" (the + icon)
5. Delete all the default code in the editor
6. Copy the entire contents of `injector.user.js` from this repository (the production build no longer contains any console or GM_log statements)
7. Paste it into the Tampermonkey editor
8. Click "File" > "Save" (or Ctrl+S)
9. The script will automatically detect whether it's running on Matterport or Edozo and fetch the correct credentials from your server
10. The script should now be active - verify it's enabled in the "Installed scripts" tab
11. **Obfuscate the script** (recommended for security):
    - Use an online JavaScript obfuscator (e.g., javascriptobfuscator.com)
    - Copy the obfuscated code and replace the script content in Tampermonkey
    - This prevents easy reading via "Inspect Element"

### Step 5: Verify Functionality
1. From a workstation, access the dashboard
2. Click "Launch Matterport Studio"
3. The userscript should automatically inject credentials and login
4. If fields don't load immediately, the script waits using MutationObserver

### Debugging (production script is silent)
- Although the production script is silent, errors will still surface in the console if something goes wrong (e.g. fetch failure)
- Open browser Developer Tools (F12) on the Matterport login page **before loading or refreshing** the page
- Check the URL shown in the address bar – if it isn’t exactly `https://my.matterport.com/login` (for example it’s embedded in an iframe or uses a different subdomain), adjust the `@match` pattern accordingly or add an `@include` for the real address
- If "Failed to fetch credentials" appears, check server IP, LAN connectivity, and that Apache is running
- If fields are not found, inspect the page (right-click on input fields > Inspect) to find the correct selectors
- Update the selectors in the script if Matterport changes their form structure
- The script now checks both main document and iframes for login fields
### Security Notes
- Credentials only exist in server memory and browser volatile memory
- IP restrictions prevent external access
- Obfuscated script prevents casual inspection
- **Credentials are NOT committed to git** - `.gitignore` prevents accidental exposure
- Configure credentials locally on each server only
- No external services or email required

### Troubleshooting
- If login fails, check browser console for errors
- Verify server IP in userscript matches actual server
- Ensure Tampermonkey is enabled and script is active
- Check that Matterport login page selectors haven't changed (update CSS selectors if needed)

### Files
- `access.php`: Secure credential API (returns credentials for Matterport or Edozo depending on `?service=` parameter)
- `index.html`: Team dashboard
- `injector.user.js`: Tampermonkey injection script (handles multiple login domains)