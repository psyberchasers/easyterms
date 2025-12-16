/**
 * EasyTerms Embeddable Widget
 * 
 * Usage:
 * <script src="https://yourdomain.com/widget.js"></script>
 * <div id="easyterms-widget"></div>
 * <script>
 *   EasyTerms.init({
 *     container: '#easyterms-widget',
 *     theme: 'dark', // or 'light'
 *     onAnalysisComplete: function(analysis) {
 *       console.log('Analysis:', analysis);
 *     }
 *   });
 * </script>
 */

(function() {
  'use strict';

  var EasyTerms = {
    version: '1.0.0',
    baseUrl: 'https://contractlens.ngrok.io', // Change to your production URL
    
    init: function(options) {
      options = options || {};
      
      var container = typeof options.container === 'string' 
        ? document.querySelector(options.container) 
        : options.container || document.getElementById('easyterms-widget');
      
      if (!container) {
        console.error('EasyTerms: Container element not found');
        return;
      }

      var theme = options.theme || 'dark';
      var width = options.width || '100%';
      var height = options.height || '500px';

      // Create iframe
      var iframe = document.createElement('iframe');
      iframe.src = this.baseUrl + '/widget?theme=' + theme;
      iframe.style.width = width;
      iframe.style.height = height;
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.overflow = 'hidden';
      iframe.setAttribute('allowtransparency', 'true');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'clipboard-write');

      container.appendChild(iframe);

      // Listen for messages from widget
      window.addEventListener('message', function(event) {
        // Verify origin in production
        // if (event.origin !== EasyTerms.baseUrl) return;

        if (event.data && event.data.type === 'EASYTERMS_ANALYSIS_COMPLETE') {
          if (typeof options.onAnalysisComplete === 'function') {
            options.onAnalysisComplete(event.data.analysis);
          }
        }

        if (event.data && event.data.type === 'EASYTERMS_RESIZE') {
          iframe.style.height = event.data.height + 'px';
        }
      });

      return {
        destroy: function() {
          container.removeChild(iframe);
        }
      };
    },

    // Floating button mode (like Grammarly)
    initFloatingButton: function(options) {
      options = options || {};
      
      var button = document.createElement('div');
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
      button.style.cssText = 'position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;transition:transform 0.2s;';
      button.title = 'Analyze Contract with EasyTerms';
      
      button.addEventListener('mouseenter', function() {
        button.style.transform = 'scale(1.1)';
      });
      button.addEventListener('mouseleave', function() {
        button.style.transform = 'scale(1)';
      });

      var modal = null;

      button.addEventListener('click', function() {
        if (modal) {
          document.body.removeChild(modal);
          modal = null;
          return;
        }

        modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;bottom:90px;right:24px;width:400px;max-width:calc(100vw - 48px);height:600px;max-height:calc(100vh - 120px);background:#0a0a0a;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5);z-index:9998;overflow:hidden;';
        
        var closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;width:28px;height:28px;border:none;background:transparent;color:#888;font-size:24px;cursor:pointer;z-index:10;';
        closeBtn.addEventListener('click', function() {
          document.body.removeChild(modal);
          modal = null;
        });
        modal.appendChild(closeBtn);

        var iframe = document.createElement('iframe');
        iframe.src = EasyTerms.baseUrl + '/widget';
        iframe.style.cssText = 'width:100%;height:100%;border:none;';
        modal.appendChild(iframe);

        document.body.appendChild(modal);
      });

      document.body.appendChild(button);

      return {
        destroy: function() {
          document.body.removeChild(button);
          if (modal) document.body.removeChild(modal);
        }
      };
    }
  };

  // Expose globally
  window.EasyTerms = EasyTerms;

  // Auto-init if container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (document.getElementById('easyterms-widget')) {
        EasyTerms.init();
      }
    });
  } else {
    if (document.getElementById('easyterms-widget')) {
      EasyTerms.init();
    }
  }
})();

