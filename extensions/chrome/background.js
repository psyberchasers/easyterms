// EasyTerms Background Service Worker
const API_BASE = 'https://easyterms.ai';

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  // For selected text
  chrome.contextMenus.create({
    id: 'analyze-selection',
    title: 'Analyze selected text with EasyTerms',
    contexts: ['selection'],
  });

  // For links (PDFs)
  chrome.contextMenus.create({
    id: 'analyze-link',
    title: 'Analyze this document with EasyTerms',
    contexts: ['link'],
  });

  // For page - highlight on page
  chrome.contextMenus.create({
    id: 'analyze-page-highlight',
    title: 'Analyze & highlight this page',
    contexts: ['page'],
  });

  // For page - open in EasyTerms (fallback)
  chrome.contextMenus.create({
    id: 'analyze-page',
    title: 'Analyze in EasyTerms (full view)',
    contexts: ['page'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Check if user is logged in
  const session = await getStoredSession();
  if (!session) {
    // Open login page
    chrome.tabs.create({ url: `${API_BASE}/login?extension=true` });
    return;
  }

  // Handle selected text
  if (info.menuItemId === 'analyze-selection' && info.selectionText) {
    const text = info.selectionText;
    if (text.length < 100) {
      // Too short
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Text too short',
        message: 'Please select more text to analyze (at least 100 characters).'
      });
      return;
    }

    // Store text and open analysis page
    await chrome.storage.local.set({
      pendingAnalysis: {
        type: 'text',
        content: text,
        source: tab.url,
        title: tab.title
      }
    });
    chrome.tabs.create({ url: `${API_BASE}/dashboard/upload-contract?from=extension` });
    return;
  }

  // Handle link click (PDF link)
  if (info.menuItemId === 'analyze-link' && info.linkUrl) {
    if (isPdfUrl(info.linkUrl)) {
      chrome.tabs.create({
        url: `${API_BASE}/dashboard/upload-contract?url=${encodeURIComponent(info.linkUrl)}`,
      });
    } else {
      // Try to fetch and analyze
      await chrome.storage.local.set({
        pendingAnalysis: {
          type: 'url',
          url: info.linkUrl,
          source: tab.url
        }
      });
      chrome.tabs.create({ url: `${API_BASE}/dashboard/upload-contract?from=extension` });
    }
    return;
  }

  // Handle page analysis with highlight
  if (info.menuItemId === 'analyze-page-highlight') {
    await analyzeAndHighlightPage(tab, session);
    return;
  }

  // Handle page analysis (open in EasyTerms)
  if (info.menuItemId === 'analyze-page') {
    // Check if it's a PDF
    if (tab.url && isPdfUrl(tab.url)) {
      chrome.tabs.create({
        url: `${API_BASE}/dashboard/upload-contract?url=${encodeURIComponent(tab.url)}`,
      });
      return;
    }

    // Extract page content
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageContent
      });

      if (results && results[0] && results[0].result) {
        const content = results[0].result;

        if (content.text.length < 200) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Not enough content',
            message: 'This page doesn\'t have enough text to analyze.'
          });
          return;
        }

        // Store content and open analysis page
        await chrome.storage.local.set({
          pendingAnalysis: {
            type: 'text',
            content: content.text,
            source: tab.url,
            title: content.title || tab.title
          }
        });
        chrome.tabs.create({ url: `${API_BASE}/dashboard/upload-contract?from=extension` });
      }
    } catch (error) {
      console.error('Failed to extract page content:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Extraction failed',
        message: 'Could not extract content from this page.'
      });
    }
  }
});

// Analyze page and highlight directly on the page
async function analyzeAndHighlightPage(tab, session) {
  // Check if it's a PDF - can't highlight PDFs inline
  if (tab.url && isPdfUrl(tab.url)) {
    chrome.tabs.create({
      url: `${API_BASE}/dashboard/upload-contract?url=${encodeURIComponent(tab.url)}`,
    });
    return;
  }

  try {
    // Show analyzing notification
    chrome.notifications.create('analyzing', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Analyzing page...',
      message: 'EasyTerms is analyzing this page. This may take a moment.'
    });

    // Extract page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent
    });

    if (!results || !results[0] || !results[0].result) {
      throw new Error('Failed to extract content');
    }

    const content = results[0].result;

    if (content.text.length < 200) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Not enough content',
        message: 'This page doesn\'t have enough text to analyze.'
      });
      return;
    }

    // Create a text file blob and send to analyze API
    const textBlob = new Blob([content.text], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', textBlob, `${content.title || 'page'}.txt`);
    formData.append('industry', 'music');

    // Call the analyze-upload API
    const response = await fetch(`${API_BASE}/api/contracts/analyze-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Analysis failed');
    }

    const analysisResult = await response.json();

    // Clear analyzing notification
    chrome.notifications.clear('analyzing');

    // Inject CSS first
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['highlight.css']
    });

    // Inject the highlight script with the analysis data
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['highlight.js']
    });

    // Send the analysis data to the content script
    await chrome.tabs.sendMessage(tab.id, {
      type: 'EASYTERMS_HIGHLIGHT',
      analysis: analysisResult.analysis,
      contractId: analysisResult.contractId,
      overallRisk: analysisResult.overallRisk,
      summary: analysisResult.summary
    });

    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Analysis Complete',
      message: `Found ${analysisResult.analysis?.potentialConcerns?.length || 0} concerns. Check the highlighted text on the page.`
    });

  } catch (error) {
    console.error('Failed to analyze page:', error);
    chrome.notifications.clear('analyzing');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Analysis failed',
      message: error.message || 'Could not analyze this page. Try the full view option.'
    });
  }
}

// Function to extract page content (injected into page)
function extractPageContent() {
  // Try to find main content area
  const selectors = [
    'article',
    '[role="main"]',
    'main',
    '.terms-content',
    '.legal-content',
    '.content',
    '#content',
    '.post-content',
    '.entry-content',
    '.terms',
    '.tos',
    '.privacy-policy',
    '.legal'
  ];

  let mainContent = null;

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText.length > 500) {
      mainContent = element;
      break;
    }
  }

  // Fallback to body
  if (!mainContent) {
    mainContent = document.body;
  }

  // Get text content
  let text = mainContent.innerText;

  // Clean up - remove excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  // Get title
  let title = document.title;
  const h1 = document.querySelector('h1');
  if (h1) {
    title = h1.innerText;
  }

  return {
    text: text,
    title: title,
    url: window.location.href
  };
}

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
  console.log('EasyTerms Background: Received message', message.type);

  if (message.type === 'EASYTERMS_AUTH') {
    // Store the session
    chrome.storage.local.set({ easyterms_session: message.session }, () => {
      console.log('EasyTerms Background: Session stored!', message.session.user?.email);
      sendResponse({ success: true });
    });
    return true; // Keep message channel open
  }

  if (message.type === 'GET_SESSION') {
    getStoredSession().then(session => {
      sendResponse({ session });
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_PENDING_ANALYSIS') {
    chrome.storage.local.get(['pendingAnalysis'], (result) => {
      sendResponse({ analysis: result.pendingAnalysis });
      // Clear it after reading
      chrome.storage.local.remove(['pendingAnalysis']);
    });
    return true;
  }

  // Default response
  sendResponse({ received: true });
  return true;
});

// Handle extension icon click when popup is disabled
chrome.action.onClicked.addListener((tab) => {
  // This only fires if popup is not set
  chrome.tabs.create({ url: `${API_BASE}/dashboard` });
});
