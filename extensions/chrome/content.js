// Content script for EasyTerms website
// Relays authentication session to the extension and handles text analysis

(function() {
  console.log('EasyTerms Extension: Content script loaded');

  // Check for extension session in localStorage
  function checkForSession() {
    const sessionStr = localStorage.getItem('easyterms_extension_session');
    console.log('EasyTerms Extension: Checking for session...', sessionStr ? 'Found!' : 'Not found');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        // Send to extension
        chrome.runtime.sendMessage({ type: 'EASYTERMS_AUTH', session: session }, (response) => {
          console.log('EasyTerms Extension: Session sent to extension', response);
        });
        // Clear it so we don't send again
        localStorage.removeItem('easyterms_extension_session');
        console.log('EasyTerms Extension: Session sent to extension successfully');

        // Show success message on page
        showSuccessMessage();
      } catch (e) {
        console.error('EasyTerms Extension: Failed to parse session', e);
      }
    }
  }

  // Show success message overlay
  function showSuccessMessage() {
    const overlay = document.createElement('div');
    overlay.id = 'easyterms-extension-success';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          max-width: 400px;
        ">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style="color: #fafafa; font-size: 20px; font-weight: 500; margin: 0 0 8px;">Signed in!</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px;">You're now signed in to the EasyTerms extension.</p>
          <p style="color: #71717a; font-size: 12px; margin: 0 0 16px;">You can close this tab and return to the extension.</p>
          <button onclick="window.close()" style="
            background: #a855f7;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          ">Close this tab</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Check for pending analysis from extension
  function checkForPendingAnalysis() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'extension') {
      chrome.runtime.sendMessage({ type: 'GET_PENDING_ANALYSIS' }, (response) => {
        if (response && response.analysis) {
          // Store in localStorage for the React app to pick up
          localStorage.setItem('easyterms_pending_analysis', JSON.stringify(response.analysis));
          // Dispatch event to notify the app
          window.dispatchEvent(new CustomEvent('easyterms-pending-analysis', {
            detail: response.analysis
          }));
          console.log('EasyTerms Extension: Pending analysis loaded', response.analysis);
        }
      });
    }
  }

  // Check if this is an extension auth page
  const params = new URLSearchParams(window.location.search);
  const isExtensionAuth = params.get('extension') === 'true';

  // Check immediately
  checkForSession();
  checkForPendingAnalysis();

  // Also listen for storage events (in case set after page load)
  window.addEventListener('storage', (e) => {
    if (e.key === 'easyterms_extension_session' && e.newValue) {
      console.log('EasyTerms Extension: Storage event detected');
      checkForSession();
    }
  });

  // Poll more aggressively if this is extension auth
  if (isExtensionAuth) {
    console.log('EasyTerms Extension: Auth page detected, polling for session...');
    // Poll every 500ms for up to 10 seconds
    let attempts = 0;
    const interval = setInterval(() => {
      checkForSession();
      attempts++;
      if (attempts >= 20 || document.getElementById('easyterms-extension-success')) {
        clearInterval(interval);
      }
    }, 500);
  } else {
    // Normal polling for non-auth pages
    setTimeout(checkForSession, 500);
    setTimeout(checkForSession, 1500);
  }

  setTimeout(checkForPendingAnalysis, 500);
})();
