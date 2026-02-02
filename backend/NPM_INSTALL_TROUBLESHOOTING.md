# Backend npm Install Troubleshooting

## Issue: SSL/TLS Error

**Error**: `ERR_SSL_TLSV1_UNRECOGNIZED_NAME` when installing npm packages

## Solutions Applied

### 1. Disable Strict SSL (Temporary Fix)
```bash
npm config set strict-ssl false
npm install --legacy-peer-deps
```

### 2. Alternative Solutions

If the above doesn't work, try these:

#### Option A: Use HTTP Registry (Not Recommended for Production)
```bash
npm config set registry http://registry.npmjs.org/
npm install
# Revert back after install:
npm config set registry https://registry.npmjs.org/
```

#### Option B: Clear npm Cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Option C: Update npm and Node.js
```bash
# Check versions
node --version
npm --version

# Update npm
sudo npm install -g npm@latest
```

#### Option D: Use Yarn Instead
```bash
# Install yarn if not installed
sudo npm install -g yarn

# Install dependencies with yarn
yarn install
```

#### Option E: Install Without Optional Dependencies
```bash
npm install --no-optional --legacy-peer-deps
```

## Network/Proxy Issues

If you're behind a proxy or firewall:

```bash
# Set proxy (if applicable)
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or unset if not needed
npm config delete proxy
npm config delete https-proxy
```

## Manual Jest Installation

If Jest specifically is causing issues, you can skip it for now:

```bash
# Install without Jest
npm install --ignore-scripts --legacy-peer-deps

# Or install Jest separately later
npm install --save-dev jest ts-jest @types/jest --legacy-peer-deps
```

## Verify Installation

After successful install:

```bash
# Check if packages are installed
ls node_modules/ | grep jest

# Try running the dev server
npm run dev
```

## Revert SSL Settings

After installation completes, revert the SSL setting:

```bash
npm config set strict-ssl true
```

## Current Status

✅ Disabled strict SSL checking
🔄 Running: `npm install --legacy-peer-deps`

The installation is in progress. This may take a few minutes depending on your network speed.
