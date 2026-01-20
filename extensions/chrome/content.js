// Content script for EasyTerms website
// Relays authentication session to the extension

(function() {
  // Check for extension session in localStorage
  function checkForSession() {
    const sessionStr = localStorage.getItem('easyterms_extension_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        // Send to extension
        chrome.runtime.sendMessage({ type: 'EASYTERMS_AUTH', session: session });
        // Clear it so we don't send again
        localStorage.removeItem('easyterms_extension_session');
        console.log('EasyTerms: Session sent to extension');
      } catch (e) {
        console.error('EasyTerms: Failed to parse session', e);
      }
    }
  }

  // Check immediately
  checkForSession();

  // Also listen for storage events (in case set after page load)
  window.addEventListener('storage', (e) => {
    if (e.key === 'easyterms_extension_session' && e.newValue) {
      checkForSession();
    }
  });

  // Poll a few times in case of race condition
  setTimeout(checkForSession, 500);
  setTimeout(checkForSession, 1500);
  setTimeout(checkForSession, 3000);
})();
