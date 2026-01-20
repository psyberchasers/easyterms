# EasyTerms Extensions

This folder contains browser and workspace extensions for EasyTerms.

## Chrome Extension

Located in `/chrome`

### Features
- Upload contracts directly from browser popup
- Right-click context menu to analyze PDFs
- View recent contracts
- Quick access to full analysis

### Local Development

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `/extensions/chrome` folder
5. The extension should appear in your toolbar

### Publishing to Chrome Web Store

1. Create a ZIP of the `/chrome` folder
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Pay the one-time $5 developer fee (if not already done)
4. Click "New Item" and upload the ZIP
5. Fill in the listing details and submit for review

---

## Google Workspace Add-on

Located in `/workspace`

### Features
- Analyze contracts directly from Google Drive
- Right-click on files to analyze
- View analysis in sidebar
- Works with PDF, DOC, DOCX, and Google Docs

### Setup Instructions

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project named "EasyTerms"
3. Copy the contents of `Code.gs` into the script editor
4. Copy `appsscript.json` to Project Settings > Show "appsscript.json" manifest
5. Save the project

### Testing Locally

1. In Apps Script, click "Deploy" > "Test deployments"
2. Select "Workspace Add-on"
3. Click "Install"
4. Open Google Drive and select a PDF - you should see the EasyTerms sidebar

### Publishing to Google Workspace Marketplace

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the "Google Workspace Marketplace SDK" API
4. Configure OAuth consent screen
5. In Apps Script, click "Deploy" > "New deployment"
6. Select "Add-on" and configure the deployment
7. Submit for review through the Marketplace SDK

---

## API Integration

Both extensions use the EasyTerms API at `https://easyterms.ai/api/`

### Authentication Flow

1. User clicks "Sign In" in the extension
2. Opens EasyTerms login page with `?extension=true` or `?workspace=true`
3. After login, EasyTerms sends session data back to the extension
4. Session is stored locally in extension storage

### Endpoints Used

- `POST /api/contracts` - Create and analyze new contract
- `GET /api/contracts` - List user's contracts
- `GET /api/contracts/:id` - Get contract details

---

## Icons

The Chrome extension icons are located in `/chrome/icons/`:
- `icon16.png` - 16x16 (toolbar)
- `icon48.png` - 48x48 (extensions page)
- `icon128.png` - 128x128 (Chrome Web Store)

To regenerate icons with a custom design, replace these files with your own PNGs.
