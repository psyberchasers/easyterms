// EasyTerms Background Service Worker
const API_BASE = 'https://easyterms.vercel.app';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-contract',
    title: 'Analyze with EasyTerms',
    contexts: ['link', 'selection', 'page'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'analyze-contract') {
    // Check if user is logged in
    const session = await getStoredSession();
    if (!session) {
      // Open popup for login
      chrome.action.openPopup();
      return;
    }

    // Handle link click (PDF link)
    if (info.linkUrl && isPdfUrl(info.linkUrl)) {
      chrome.tabs.create({
        url: `${API_BASE}/dashboard/upload-contract?url=${encodeURIComponent(info.linkUrl)}`,
      });
      return;
    }

    // Handle page (if it's a PDF)
    if (tab.url && isPdfUrl(tab.url)) {
      chrome.tabs.create({
        url: `${API_BASE}/dashboard/upload-contract?url=${encodeURIComponent(tab.url)}`,
      });
      return;
    }

    // Default: open upload page
    chrome.tabs.create({ url: `${API_BASE}/dashboard/upload-contract` });
  }
});

function isPdfUrl(url) {
  return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
}

async function getStoredSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['easyterms_session'], (result) => {
      resolve(result.easyterms_session || null);
    });
  });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EASYTERMS_AUTH') {
    // Store the session
    chrome.storage.local.set({ easyterms_session: message.session });
  }

  if (message.type === 'GET_SESSION') {
    getStoredSession().then(session => {
      sendResponse({ session });
    });
    return true; // Keep message channel open for async response
  }
});

// Handle extension icon click when popup is disabled
chrome.action.onClicked.addListener((tab) => {
  // This only fires if popup is not set
  chrome.tabs.create({ url: `${API_BASE}/dashboard` });
});
