#!/bin/bash

# Tampermonkey User Script Deployment Script (Windows Only)
# Copies injector.user.js to local and/or remote Tampermonkey installations on Windows

set -e

# Check if running on Windows
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" && "$OSTYPE" != "cygwin" ]]; then
    echo "Error: This script is designed for Windows only."
    echo "Current OS: $OSTYPE"
    exit 1
fi

# Allow the caller to specify a Tampermonkey export zip as the first argument. If a file is
# provided and it exists, unpack the .user.js from it later and shift the arguments.
if [[ $# -ge 1 && -f "$1" ]]; then
    EXPORT_ZIP="$1"
    shift
fi


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/injector.user.js"
SCRIPT_NAME="injector.user.js"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# If a Tampermonkey export zip was provided, unpack it to obtain the .user.js
if [[ -n "$EXPORT_ZIP" ]]; then
    if [[ ! -f "$EXPORT_ZIP" ]]; then
        echo -e "${RED}Error: Export zip not found: $EXPORT_ZIP${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Unpacking Tampermonkey export: $EXPORT_ZIP${NC}"
    TMPDIR=$(mktemp -d)
    # extract the first .user.js file we find
    unzip -p "$EXPORT_ZIP" "*.user.js" > "$TMPDIR/$SCRIPT_NAME" || {
        echo -e "${RED}Failed to extract .user.js from zip${NC}"
        exit 1
    }
    SOURCE_FILE="$TMPDIR/$SCRIPT_NAME"
fi

# Check if source file exists
if [[ ! -f "$SOURCE_FILE" ]]; then
    echo -e "${RED}Error: Source file not found: $SOURCE_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Tampermonkey User Script Deployment (Windows)${NC}"
echo "Source: $SOURCE_FILE"
echo ""

# Windows Tampermonkey directories (AppData paths)
TAMPERMONKEY_DIRS=(
    "$APPDATA/Tampermonkey"
    "$APPDATA/Google/Chrome/User Data/Default/Extensions"
    "$APPDATA/Microsoft/Edge/User Data/Default/Extensions"
)

# Function to deploy locally
deploy_local() {
    echo -e "${YELLOW}Deploying to local Windows Tampermonkey directories...${NC}"
    
    deployed=0
    
    # Primary Windows Tampermonkey location
    local tampermonkey_scripts="$APPDATA/Tampermonkey"
    
    if [[ ! -d "$tampermonkey_scripts" ]]; then
        mkdir -p "$tampermonkey_scripts"
        echo -e "${GREEN}Created directory: $tampermonkey_scripts${NC}"
    fi
    
    cp "$SOURCE_FILE" "$tampermonkey_scripts/$SCRIPT_NAME"
    echo -e "${GREEN}✓ Deployed to: $tampermonkey_scripts/$SCRIPT_NAME${NC}"
    ((deployed++))
    
    # Deploy to Chrome Tampermonkey storage
    echo ""
    echo -e "${YELLOW}Deploying to Chrome Tampermonkey...${NC}"
    
    local chrome_storage="$APPDATA/Local/Google/Chrome/User Data/Default/Local Extension Settings/gcbommkclmclpchlhjekmpleeacaggo"
    # Also try alternate path
    local chrome_storage_alt="$APPDATA/Local/Google/Chrome/User Data/Default/Local Storage/leveldb"
    
    if [[ -d "$(dirname "$chrome_storage")" ]]; then
        mkdir -p "$chrome_storage"
        cp "$SOURCE_FILE" "$chrome_storage/$SCRIPT_NAME"
        echo -e "${GREEN}✓ Deployed to Chrome: $chrome_storage/$SCRIPT_NAME${NC}"
        ((deployed++))
    fi
    
    # Deploy to Edge Tampermonkey storage
    echo ""
    echo -e "${YELLOW}Deploying to Microsoft Edge Tampermonkey...${NC}"
    
    local edge_storage="$APPDATA/Local/Microsoft/Edge/User Data/Default/Local Extension Settings/iikmkjmpaadaobahmlepeloendndfohd"
    
    if [[ -d "$(dirname "$edge_storage")" ]]; then
        mkdir -p "$edge_storage"
        cp "$SOURCE_FILE" "$edge_storage/$SCRIPT_NAME"
        echo -e "${GREEN}✓ Deployed to Edge: $edge_storage/$SCRIPT_NAME${NC}"
        ((deployed++))
    fi
    
    # Fallback: Deploy to common browser extension locations
    echo ""
    echo -e "${YELLOW}Checking for additional browser locations...${NC}"
    
    local chrome_tampermonkey_id="gcbommkclmclpchlhjekmpleeacaggo"
    local chrome_scripts_dir="$APPDATA/Local/Google/Chrome/User Data/Default/Extensions/$chrome_tampermonkey_id"
    
    if [[ -d "$chrome_scripts_dir" ]]; then
        # Find the version directory
        local version_dir=$(ls -t "$chrome_scripts_dir" 2>/dev/null | head -1)
        if [[ -n "$version_dir" ]]; then
            mkdir -p "$chrome_scripts_dir/$version_dir/scripts"
            cp "$SOURCE_FILE" "$chrome_scripts_dir/$version_dir/scripts/$SCRIPT_NAME"
            echo -e "${GREEN}✓ Deployed to Chrome Extension: $chrome_scripts_dir/$version_dir/scripts/$SCRIPT_NAME${NC}"
            ((deployed++))
        fi
    fi

    # Offer to install the Tampermonkey extension itself by creating an external-update manifest
    read -p "Would you like to install/enable the Tampermonkey Chrome/Edge extension? [y/N] " install_ext
    if [[ "$install_ext" =~ ^[Yy] ]]; then
        echo -e "${YELLOW}Creating external extension manifests...${NC}"
        local external_dir="$APPDATA/Local/Google/Chrome/User Data/Default/External Extensions"
        mkdir -p "$external_dir"
        cat <<EOF > "$external_dir/$chrome_tampermonkey_id.json"
{"external_update_url":"https://clients2.google.com/service/update2/crx"}
EOF
        echo -e "${GREEN}✓ Chrome manifest created: $external_dir/$chrome_tampermonkey_id.json${NC}"
        ((deployed++))

        local edge_external="$APPDATA/Local/Microsoft/Edge/User Data/Default/External Extensions"
        mkdir -p "$edge_external"
        local edge_id="iikmkjmpaadaobahmlepeloendndfohd"
        cat <<EOF > "$edge_external/$edge_id.json"
{"external_update_url":"https://clients2.google.com/service/update2/crx"}
EOF
        echo -e "${GREEN}✓ Edge manifest created: $edge_external/$edge_id.json${NC}"
        ((deployed++))
    fi

    echo ""
    echo -e "${GREEN}Deployment Summary: $deployed location(s) updated${NC}"
}

# Function to deploy to remote Windows PC via SSH or UNC path
deploy_remote() {
    local host=$1
    local user=$2
    
    echo -e "${YELLOW}Deploying to remote Windows PC: $host${NC}"
    
    # Try SSH first
    if command -v ssh &> /dev/null; then
        echo "Using SSH..."
        
        # Create primary Tampermonkey directory
        ssh "$user@$host" "cmd /c if not exist %APPDATA%\\Tampermonkey mkdir %APPDATA%\\Tampermonkey" || {
            echo -e "${RED}Failed to connect to $host via SSH${NC}"
            return 1
        }
        
        # Copy file via SCP to primary location
        scp "$SOURCE_FILE" "$user@$host:$(cygpath -u "$APPDATA")/Tampermonkey/$SCRIPT_NAME" 2>/dev/null
        echo -e "${GREEN}✓ Deployed to primary Tampermonkey directory${NC}"
        
        # Deploy to Chrome extension location
        echo -e "${YELLOW}Deploying to Chrome Tampermonkey...${NC}"
        ssh "$user@$host" "cmd /c if not exist %APPDATA%\\Local\\Google\\Chrome\\User\ Data\\Default\\Extensions\\gcbommkclmclpchlhjekmpleeacaggo mkdir %APPDATA%\\Local\\Google\\Chrome\\User\ Data\\Default\\Extensions\\gcbommkclmclpchlhjekmpleeacaggo" 2>/dev/null
        scp "$SOURCE_FILE" "$user@$host:$(cygpath -u "$APPDATA")/Local/Google/Chrome/User\\ Data/Default/Extensions/gcbommkclmclpchlhjekmpleeacaggo/$SCRIPT_NAME" 2>/dev/null && \
            echo -e "${GREEN}✓ Deployed to Chrome extension${NC}" || echo -e "${YELLOW}⚠ Chrome deployment optional${NC}"
        
        # Deploy to Edge extension location
        echo -e "${YELLOW}Deploying to Microsoft Edge Tampermonkey...${NC}"
        ssh "$user@$host" "cmd /c if not exist %APPDATA%\\Local\\Microsoft\\Edge\\User\ Data\\Default\\Extensions\\iikmkjmpaadaobahmlepeloendndfohd mkdir %APPDATA%\\Local\\Microsoft\\Edge\\User\ Data\\Default\\Extensions\\iikmkjmpaadaobahmlepeloendndfohd" 2>/dev/null
        scp "$SOURCE_FILE" "$user@$host:$(cygpath -u "$APPDATA")/Local/Microsoft/Edge/User\\ Data/Default/Extensions/iikmkjmpaadaobahmlepeloendndfohd/$SCRIPT_NAME" 2>/dev/null && \
            echo -e "${GREEN}✓ Deployed to Edge extension${NC}" || echo -e "${YELLOW}⚠ Edge deployment optional${NC}"
        
        # ask remote user whether to create external extension manifests (only SSH path works)
        read -p "Create external extension manifests on remote? [y/N] " remote_ext
        if [[ "$remote_ext" =~ ^[Yy] ]]; then
            echo "";
            echo -e "${YELLOW}Creating external extension manifests on remote machine...${NC}"
            # chrome
            ssh "$user@$host" "mkdir -p '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\External Extensions' && \
                echo {\"external_update_url\":\"https://clients2.google.com/service/update2/crx\"} > '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\External Extensions\\gcbommkclmclpchlhjekmpleeacaggo.json'"
            echo -e "${GREEN}✓ Chrome manifest created on remote${NC}"
            # edge
            ssh "$user@$host" "mkdir -p '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\External Extensions' && \
                echo {\"external_update_url\":\"https://clients2.google.com/service/update2/crx\"} > '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\External Extensions\\iikmkjmpaadaobahmlepeloendndfohd.json'"
            echo -e "${GREEN}✓ Edge manifest created on remote${NC}"
        fi
    else
        # Try UNC path (network share)
        echo "SSH not available. Using UNC path..."
        local unc_base="//\\$host/Users/$user/AppData/Roaming"
        local unc_path="$unc_base/Tampermonkey"
        
        if [[ -d "$unc_base" ]]; then
            mkdir -p "$unc_path" 2>/dev/null
            cp "$SOURCE_FILE" "$unc_path/$SCRIPT_NAME"
            echo -e "${GREEN}✓ Deployed to: $unc_path/$SCRIPT_NAME${NC}"
        else
            echo -e "${RED}Cannot access UNC path: $unc_base${NC}"
            echo "Make sure the network path is accessible and the user has proper permissions."
            return 1
        fi
    fi
    
    echo -e "${GREEN}✓ Remote deployment to $user@$host complete${NC}"
}

# Main menu (local only)
show_menu() {
    echo "Select deployment option:"
    echo "1) Deploy to local Windows machine"
    echo "2) Exit"
    echo ""
    read -p "Enter choice [1-2]: " choice
}

# Parse command line arguments
if [[ $# -eq 0 ]]; then
    # Interactive mode
    while true; do
        show_menu
        
        case $choice in
            1)
                deploy_local
                break
                ;;
            2)
                echo "Exiting."
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option. Please try again.${NC}"
                ;;
        esac
    done
else
    # Command line mode: local only
    if [[ $1 == "local" || $# -eq 0 ]]; then
        deploy_local
    else
        echo "Usage (Windows):"
        echo "  $0 [<export.zip>]           - Interactive menu (local only)"
        echo "  $0 [<export.zip>] local     - Deploy to local Windows machine"
        echo ""
        echo "Examples:"
        echo "  $0 local"
        echo "  $0 myexport.zip local"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo "The user script should now be active in Tampermonkey."
echo ""
echo "Note: If Tampermonkey is already running, you may need to:"
echo "  - Refresh the Tampermonkey dashboard in your browser"
echo "  - Or restart your browser"
