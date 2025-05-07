#!/bin/bash

APP_NAME="Nocturnal UI"
APP_BUNDLE_ID="com.nocturnal.ui"
VERSION="1.0.1"
DATA_DIRECTORY="Nocturnal"

DOWNLOAD_URL_INTEL="https://github.com/sillyconvicted/nocturnalui/releases/download/v1.0.1-beta.1/Nocturnal.UI.Intel.app.zip"
DOWNLOAD_URL_ARM="https://github.com/sillyconvicted/nocturnalui/releases/download/v1.0.1-beta.1/Nocturnal.UI.app.zip"
BG_BLACK='\033[40m'
FG_WHITE='\033[97m'
FG_BLUE='\033[94m'
FG_CYAN='\033[96m'
FG_GREEN='\033[92m'
FG_YELLOW='\033[93m'
FG_RED='\033[91m'
FG_MAGENTA='\033[95m'
BOLD='\033[1m'
RESET='\033[0m'

OK_SYMBOL="✓"
ERR_SYMBOL="✗"
WARN_SYMBOL="⚠"
ARROW_SYMBOL="→"
INFO_SYMBOL="ℹ"

PROGRESS_FILLED="■"
PROGRESS_EMPTY="□"
PROGRESS_COLOR=$FG_CYAN

RETRY_ATTEMPTS=3
RETRY_DELAY=3

HOME_DIR="$HOME"
APP_DATA_DIR="$HOME_DIR/$DATA_DIRECTORY"
APP_SUPPORT_DIR="$HOME_DIR/Library/Application Support/$APP_NAME"
APP_INSTALL_PATH="/Applications/$APP_NAME.app"

print_section_header() {
    echo -e "\n${FG_MAGENTA}${BOLD}[ $1 ]${RESET}"
    echo -e "${FG_MAGENTA}----------------------------------------${RESET}"
}

success_msg() {
    echo -e "${FG_GREEN}${OK_SYMBOL} $1${RESET}"
}

error_msg() {
    echo -e "${FG_RED}${ERR_SYMBOL} $1${RESET}"
}

warning_msg() {
    echo -e "${FG_YELLOW}${WARN_SYMBOL} $1${RESET}"
}

info_msg() {
    echo -e "${FG_BLUE}${INFO_SYMBOL} $1${RESET}"
}

step_msg() {
    echo -e "${FG_CYAN}${ARROW_SYMBOL} $1${RESET}"
}

show_progress() {
    local duration=$1
    local width=30
    local progress=0
    
    while [ $progress -le 100 ]; do
        local filled=$((progress * width / 100))
        local empty=$((width - filled))
        
        printf "\r${PROGRESS_COLOR}["
        printf "%${filled}s" | tr " " "$PROGRESS_FILLED"
        printf "%${empty}s" | tr " " "$PROGRESS_EMPTY"
        printf "] %3d%%${RESET}" $progress
        
        progress=$((progress + 2))
        sleep $(echo "scale=3; $duration/50" | bc)
    done
    printf "\n"
}

show_spinner() {
    local pid=$1
    local delay=0.1
    local spinner="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinner#?}
        printf "\r${FG_CYAN}%c${RESET} " "${spinner}"
        local spinner=${temp}${spinner%"$temp"}
        sleep $delay
    done
    printf "\r   \r"
}

check_network() {
    step_msg "Checking internet connection..."
    if ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        error_msg "No internet connection. Please check your network and try again."
        return 1
    fi
    success_msg "Internet connection verified."
    return 0
}

download_with_retry() {
    local url=$1
    local output_file=$2
    local attempt=1
    
    while [ $attempt -le $RETRY_ATTEMPTS ]; do
        step_msg "Download attempt $attempt of $RETRY_ATTEMPTS..."
        
        curl -L -o "$output_file" "$url" --progress-bar
        
        if [ -f "$output_file" ] && [ -s "$output_file" ]; then
            success_msg "Download completed successfully."
            return 0
        fi
        
        warning_msg "Download failed. Retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
        attempt=$((attempt + 1))
    done
    
    error_msg "Download failed after $RETRY_ATTEMPTS attempts."
    return 1
}

detect_architecture() {
    print_section_header "DETECTING SYSTEM ARCHITECTURE"
    
    ARCH=$(uname -m)
    
    if [[ "$ARCH" == "arm64" ]]; then
        info_msg "Detected Apple Silicon (ARM) Mac"
        DOWNLOAD_URL="$DOWNLOAD_URL_ARM"
    elif [[ "$ARCH" == "x86_64" ]]; then
        if /usr/bin/arch -arm64 true 2>/dev/null; then
            DOWNLOAD_URL="$DOWNLOAD_URL_INTEL"
        else
            info_msg "Detected Intel Mac"
            DOWNLOAD_URL="$DOWNLOAD_URL_INTEL"
        fi
    else
        warning_msg "Unknown architecture: $ARCH"
        warning_msg "Defaulting to Intel version"
        DOWNLOAD_URL="$DOWNLOAD_URL_INTEL"
    fi
    
}

print_section_header "INSTALLATION SETUP"

if [ "$EUID" -ne 0 ]; then
    warning_msg "Your Mac password is required to install the application."
    if ! sudo -v; then
        error_msg "Failed to obtain administrator privileges."
        exit 1
    fi
    success_msg "Administrator access granted."
fi

# Detect architecture and set download URL
detect_architecture

print_section_header "DOWNLOADING $APP_NAME"

TEMP_DIR=$(mktemp -d)
TEMP_ZIP="$TEMP_DIR/app.zip"

if ! check_network; then
    rm -rf "$TEMP_DIR"
    exit 1
fi

info_msg "Downloading $APP_NAME v$VERSION..."
info_msg "Download URL: $DOWNLOAD_URL"

if ! download_with_retry "$DOWNLOAD_URL" "$TEMP_ZIP"; then
    rm -rf "$TEMP_DIR"
    exit 1
fi

print_section_header "INSTALLING APPLICATION"

step_msg "Extracting application files..."
EXTRACT_DIR="$TEMP_DIR/extracted"
mkdir -p "$EXTRACT_DIR"

if ! unzip -q "$TEMP_ZIP" -d "$EXTRACT_DIR"; then
    error_msg "Failed to extract the application archive."
    rm -rf "$TEMP_DIR"
    exit 1
fi
success_msg "Archive extracted successfully."

APP_BUNDLE=$(find "$EXTRACT_DIR" -name "*.app" -maxdepth 2 | head -n 1)

if [ -z "$APP_BUNDLE" ]; then
    error_msg "Could not find an application bundle in the downloaded archive."
    rm -rf "$TEMP_DIR"
    exit 1
fi

if [ -d "$APP_INSTALL_PATH" ]; then
    step_msg "Closing $APP_NAME if running..."
    osascript -e "quit app \"$APP_NAME\"" 2>/dev/null
    sleep 2
    
    step_msg "Removing previous installation..."
    if ! sudo rm -rf "$APP_INSTALL_PATH"; then
        error_msg "Failed to remove previous installation."
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    success_msg "Previous installation removed."
fi

step_msg "Installing $APP_NAME to Applications folder..."
if ! sudo cp -R "$APP_BUNDLE" "/Applications/"; then
    error_msg "Failed to copy application to Applications folder."
    rm -rf "$TEMP_DIR"
    exit 1
fi

sudo chown -R root:wheel "$APP_INSTALL_PATH" 2>/dev/null
sudo chmod -R 755 "$APP_INSTALL_PATH" 2>/dev/null

show_progress 1
success_msg "Application installed successfully."

step_msg "Setting up application data directory..."
mkdir -p "$APP_DATA_DIR" 2>/dev/null
success_msg "Data directory created at: $APP_DATA_DIR"

step_msg "Cleaning up temporary files..."
(rm -rf "$TEMP_DIR") &
show_spinner $!
success_msg "Cleanup completed."

print_section_header "INSTALLATION COMPLETE"

echo -e "${FG_GREEN}${BOLD}$APP_NAME has been successfully installed!${RESET}\n"

echo -e "${FG_YELLOW}${BOLD}Important Notes:${RESET}"
echo -e "  ${FG_CYAN}•${RESET} $APP_NAME has been installed to your Applications folder"
echo -e "  ${FG_CYAN}•${RESET} Data and configuration will be stored in ~/$DATA_DIRECTORY"
echo -e "  ${FG_CYAN}•${RESET} For an optimal experience, ensure your macOS is up-to-date"
echo -e "  ${FG_CYAN}•${RESET} ${FG_GREEN}Installed version: For $([ "$(uname -m)" == "arm64" ] && echo "Apple Silicon" || echo "Intel") Mac${RESET}"

echo -e "\n${FG_GREEN}${BOLD}Thank you for installing $APP_NAME!${RESET}\n"

step_msg "Launching $APP_NAME..."
open -a "$APP_NAME"
success_msg "Application launched."

exit 0
