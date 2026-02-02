# Quick Setup Guide for Chromium Users

## Issue Resolved ✅

The ChromeDriver npm package was trying to download ChromeDriver from the internet, which failed due to network issues. Since you're using Chromium on Linux (snap installation), I've configured the tests to use your system's Chromium browser directly.

## Changes Made

1. **Removed ChromeDriver npm dependency** - No longer trying to download ChromeDriver
2. **Updated Selenium configuration** - Now uses `/snap/bin/chromium` (your system Chromium)
3. **Simplified package.json** - Only essential testing dependencies

## Installation Steps

```bash
cd /home/aditya/Desktop/programming/cloud-file-sharing/tests

# Clean install (already done for you)
rm -rf node_modules package-lock.json
npm install
```

## Install ChromeDriver (System-wide)

You need ChromeDriver to work with Selenium. Install it system-wide:

```bash
# Option 1: Using snap (recommended for snap Chromium)
sudo snap install chromium-chromedriver

# Option 2: Using apt
sudo apt-get update
sudo apt-get install chromium-chromedriver

# Option 3: Download manually
# Visit: https://chromedriver.chromium.org/downloads
# Download the version matching your Chromium version
# Extract and move to /usr/local/bin/
```

## Verify Installation

```bash
# Check Chromium version
chromium --version

# Check if ChromeDriver is accessible
which chromedriver
# OR
snap list | grep chromedriver
```

## Running Tests

Once ChromeDriver is installed:

```bash
cd /home/aditya/Desktop/programming/cloud-file-sharing/tests

# Run White Box tests (no browser needed)
npm run test:whitebox

# Run Black Box tests (requires ChromeDriver)
npm run test:blackbox

# Run Integration tests
npm run test:integration

# Run Functionality tests (requires ChromeDriver)
npm run test:functionality

# Run all tests
npm run test:all
```

## Troubleshooting

### If tests still fail to find ChromeDriver:

1. **Find ChromeDriver location**:
   ```bash
   which chromedriver
   # OR
   find /snap -name chromedriver 2>/dev/null
   ```

2. **Update PATH** (if needed):
   ```bash
   export PATH=$PATH:/snap/bin
   # Add to ~/.bashrc to make permanent
   echo 'export PATH=$PATH:/snap/bin' >> ~/.bashrc
   ```

3. **Test ChromeDriver manually**:
   ```bash
   chromedriver --version
   ```

### Alternative: Use Firefox instead

If you have Firefox installed, you can use it instead:

1. Edit `tests/.env.test`:
   ```env
   DEFAULT_BROWSER=firefox
   ```

2. Install geckodriver:
   ```bash
   sudo apt-get install firefox-geckodriver
   ```

## Next Steps

1. ✅ Install ChromeDriver (choose one option above)
2. ✅ Verify ChromeDriver works: `chromedriver --version`
3. ✅ Run tests: `npm run test:whitebox` (start with non-browser tests)
4. ✅ Run browser tests: `npm run test:blackbox`

## Quick Test

Run this to test if everything works:

```bash
cd /home/aditya/Desktop/programming/cloud-file-sharing/tests

# Test without browser (should work immediately)
npm run test:whitebox

# Test with browser (needs ChromeDriver)
npm run test:blackbox
```

---

**Status**: Dependencies installed successfully! Just need to install ChromeDriver system-wide.
