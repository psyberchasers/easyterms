// EasyTerms Page Highlighter
// This script highlights concerning text and shows analysis results on the page

(function() {
  // Prevent multiple injections
  if (window.easytermsHighlighterLoaded) return;
  window.easytermsHighlighterLoaded = true;

  let analysisData = null;
  let panelVisible = false;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EASYTERMS_ANALYZING') {
      showLoadingOverlay();
      sendResponse({ success: true });
    }
    if (message.type === 'EASYTERMS_HIGHLIGHT') {
      hideLoadingOverlay();
      analysisData = message;
      highlightPage(message.analysis);
      showFloatingPanel(message);
      sendResponse({ success: true });
    }
    if (message.type === 'EASYTERMS_ERROR') {
      hideLoadingOverlay();
      showErrorOverlay(message.error);
      sendResponse({ success: true });
    }
    return true;
  });

  // Show loading overlay
  function showLoadingOverlay() {
    // Remove existing
    hideLoadingOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'easyterms-loading-overlay';
    overlay.innerHTML = `
      <div class="easyterms-loading-card">
        <div class="easyterms-loading-spinner"></div>
        <div class="easyterms-loading-logo">
          <svg width="32" height="32" viewBox="0 0 233 244" fill="none">
            <path opacity="0.6" d="M93.7252 219.53C101.68 218.783 98.2205 219.504 110.417 216.964C114.688 216.075 117.377 211.639 116.423 207.057C115.469 202.474 111.232 199.481 106.961 200.371C94.2305 203.022 98.9272 202.032 91.8855 202.693C84.9698 203.342 80.8453 202.724 77.566 201.165C75.3534 200.114 73.3171 198.757 71.5134 197.145C68.9206 194.828 66.8145 191.433 64.6936 184.906C62.5108 178.188 60.629 169.215 57.9355 156.281L52.8074 131.66C52.3352 129.394 51.2076 123.972 52.5937 119.502C53.4478 116.746 54.7703 114.317 56.3514 112.891C58.8991 110.593 62.0241 108.938 65.559 108.202L73.8569 106.797C76.8788 106.238 80.3677 105.405 83.5532 103.726C89.7581 100.454 93.7617 93.8504 94.0557 86.402C94.2064 82.5783 93.5172 78.7931 92.7827 75.5793L90.6545 66.8074C89.8277 62.8369 90.0924 59.1755 91.1438 55.6047C91.7565 53.5233 93.1462 51.4456 95.2449 49.4379C98.4265 46.3935 102.802 45.4602 105.475 44.8899C108.148 44.3198 110.97 43.7218 113.329 43.2305C127.844 40.2077 133.148 39.2267 137.445 39.9026C144.895 41.0747 151.297 45.4247 155.14 51.5809C156.102 53.1225 156.993 55.2259 158.018 58.9803C159.063 62.8077 160.097 67.7558 161.583 74.8892L170.623 118.297C171.573 122.862 175.794 125.844 180.05 124.957C184.306 124.071 186.985 119.652 186.034 115.087L176.936 71.3979C175.523 64.6135 174.378 59.1161 173.169 54.6859C171.923 50.1213 170.466 46.1228 168.194 42.4844C161.642 31.9859 151.041 25.0323 139.29 23.1836C131.958 22.0303 120.309 24.4597 108.004 27.0271C85.5306 31.704 72.1822 34.482 62.1029 40.8954C45.9169 51.1945 34.8194 68.2336 31.9214 87.7576C30.9553 94.265 31.3218 100.962 32.466 108.845C33.5899 116.589 35.557 126.035 38.0645 138.075L42.6321 160.008C45.1921 172.301 47.2652 182.257 49.792 190.033C52.416 198.109 55.8224 204.821 61.6032 209.986C64.5978 212.662 67.9375 214.879 71.5148 216.578C78.3399 219.822 85.55 220.297 93.7252 219.53Z" fill="#6500FF"/>
            <path opacity="0.6" d="M136.899 100.511C134.784 100.429 132.881 101.76 132.131 103.846L128.576 113.729C123.751 127.143 121.793 132.262 118.235 135.888C114.677 139.513 109.788 141.37 96.9926 145.909L87.5661 149.252C85.5759 149.958 84.2432 151.924 84.2259 154.179C84.2087 156.434 85.5105 158.501 87.4887 159.36L96.8584 163.429C109.577 168.953 114.434 171.186 117.935 175.083C121.436 178.982 123.314 184.249 127.931 198.028L131.332 208.179C132.05 210.322 133.931 211.799 136.047 211.881C138.162 211.962 140.065 210.631 140.816 208.545L144.37 198.663C149.195 185.248 151.152 180.129 154.71 176.503C158.269 172.878 163.158 171.022 175.953 166.482L185.38 163.139C187.37 162.433 188.703 160.467 188.72 158.212C188.737 155.958 187.435 153.89 185.457 153.031L176.087 148.962C163.369 143.438 158.512 141.206 155.011 137.308C151.51 133.409 149.632 128.142 145.015 114.363L141.614 104.212C140.896 102.069 139.015 100.592 136.899 100.511Z" fill="#BB93F9"/>
          </svg>
        </div>
        <div class="easyterms-loading-text">Analyzing page...</div>
        <div class="easyterms-loading-subtext">EasyTerms AI is reviewing this content</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Hide loading overlay
  function hideLoadingOverlay() {
    const overlay = document.querySelector('.easyterms-loading-overlay');
    if (overlay) overlay.remove();
  }

  // Show error overlay
  function showErrorOverlay(errorMessage) {
    const overlay = document.createElement('div');
    overlay.className = 'easyterms-error-overlay';
    overlay.innerHTML = `
      <div class="easyterms-error-card">
        <div class="easyterms-error-icon">✕</div>
        <div class="easyterms-error-text">Analysis failed</div>
        <div class="easyterms-error-subtext">${errorMessage || 'Please try again'}</div>
        <button class="easyterms-error-close">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.easyterms-error-close').addEventListener('click', () => {
      overlay.remove();
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 5000);
  }

  // Main highlight function
  function highlightPage(analysis) {
    if (!analysis) return;

    // Collect all text snippets to highlight
    const snippetsToHighlight = [];

    // Add concern snippets (high priority - red)
    if (analysis.concernSnippets && Array.isArray(analysis.concernSnippets)) {
      analysis.concernSnippets.forEach((snippet, index) => {
        if (snippet && snippet.length > 10) {
          snippetsToHighlight.push({
            text: snippet,
            type: 'concern',
            explanation: analysis.concernExplanations?.[index] || analysis.potentialConcerns?.[index] || 'Potential concern identified'
          });
        }
      });
    }

    // Add key terms originalText (colored by risk level)
    if (analysis.keyTerms && Array.isArray(analysis.keyTerms)) {
      analysis.keyTerms.forEach(term => {
        if (term.originalText && term.originalText.length > 10) {
          snippetsToHighlight.push({
            text: term.originalText,
            type: term.riskLevel || 'medium',
            explanation: term.explanation || term.title || 'Key term'
          });
        }
      });
    }

    // Highlight each snippet
    snippetsToHighlight.forEach(item => {
      highlightText(item.text, item.type, item.explanation);
    });
  }

  // Highlight specific text on the page
  function highlightText(searchText, riskType, explanation) {
    if (!searchText || searchText.length < 10) return;

    // Clean up the search text
    const cleanedSearch = searchText.trim().replace(/\s+/g, ' ');

    // Create a tree walker to find text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script, style, and our own elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
          if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains('easyterms-highlight') || parent.classList.contains('easyterms-panel')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    // Build full text from nodes for searching
    let fullText = '';
    const nodeMap = [];
    textNodes.forEach(node => {
      const start = fullText.length;
      fullText += node.textContent;
      nodeMap.push({ node, start, end: fullText.length });
    });

    // Normalize whitespace for matching
    const normalizedFullText = fullText.replace(/\s+/g, ' ');
    const normalizedSearch = cleanedSearch.replace(/\s+/g, ' ');

    // Find the match position (case insensitive)
    const matchIndex = normalizedFullText.toLowerCase().indexOf(normalizedSearch.toLowerCase());
    if (matchIndex === -1) {
      // Try partial match (first 50 chars)
      const partialSearch = normalizedSearch.substring(0, Math.min(50, normalizedSearch.length));
      const partialIndex = normalizedFullText.toLowerCase().indexOf(partialSearch.toLowerCase());
      if (partialIndex === -1) return;
      // Found partial match, continue with partial
      highlightRange(nodeMap, partialIndex, partialIndex + partialSearch.length, riskType, explanation, normalizedFullText);
      return;
    }

    highlightRange(nodeMap, matchIndex, matchIndex + normalizedSearch.length, riskType, explanation, normalizedFullText);
  }

  // Highlight a range of text across potentially multiple nodes
  function highlightRange(nodeMap, startOffset, endOffset, riskType, explanation, fullText) {
    // Map normalized offsets back to original positions
    let normalizedPos = 0;
    let originalPos = 0;
    let originalStart = 0;
    let originalEnd = 0;

    for (let i = 0; i < fullText.length; i++) {
      if (normalizedPos === startOffset) originalStart = i;
      if (normalizedPos === endOffset) {
        originalEnd = i;
        break;
      }
      if (fullText[i] !== ' ' || (i > 0 && fullText[i-1] !== ' ')) {
        normalizedPos++;
      }
      if (fullText[i] === ' ' && i > 0 && fullText[i-1] === ' ') {
        // Skip extra spaces in normalized counting
      } else {
        normalizedPos = Math.min(normalizedPos, endOffset);
      }
    }
    if (originalEnd === 0) originalEnd = fullText.length;

    // Find which nodes contain our range
    const nodesToHighlight = [];
    let currentOffset = 0;

    for (const item of nodeMap) {
      const nodeStart = item.start;
      const nodeEnd = item.end;

      // Check if this node overlaps with our target range
      if (nodeEnd > startOffset && nodeStart < endOffset) {
        const highlightStart = Math.max(0, startOffset - nodeStart);
        const highlightEnd = Math.min(item.node.textContent.length, endOffset - nodeStart);

        if (highlightStart < highlightEnd) {
          nodesToHighlight.push({
            node: item.node,
            start: highlightStart,
            end: highlightEnd
          });
        }
      }
    }

    // Highlight the nodes (in reverse to maintain positions)
    nodesToHighlight.reverse().forEach(item => {
      wrapTextNode(item.node, item.start, item.end, riskType, explanation);
    });
  }

  // Wrap part of a text node with highlight span
  function wrapTextNode(textNode, start, end, riskType, explanation) {
    const text = textNode.textContent;
    if (start >= end || start < 0 || end > text.length) return;

    const before = text.substring(0, start);
    const highlighted = text.substring(start, end);
    const after = text.substring(end);

    const span = document.createElement('span');
    span.className = `easyterms-highlight easyterms-${riskType}`;
    span.textContent = highlighted;
    span.setAttribute('data-easyterms-explanation', explanation);

    // Add click handler for tooltip
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      showTooltip(span, explanation, riskType);
    });

    // Replace the text node
    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));
    fragment.appendChild(span);
    if (after) fragment.appendChild(document.createTextNode(after));

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  // Show tooltip on highlight click
  function showTooltip(element, explanation, riskType) {
    // Remove existing tooltip
    const existing = document.querySelector('.easyterms-tooltip');
    if (existing) existing.remove();

    const rect = element.getBoundingClientRect();
    const tooltip = document.createElement('div');
    tooltip.className = `easyterms-tooltip easyterms-tooltip-${riskType}`;
    tooltip.innerHTML = `
      <div class="easyterms-tooltip-header">
        <span class="easyterms-tooltip-badge easyterms-badge-${riskType}">${riskType.toUpperCase()} RISK</span>
        <button class="easyterms-tooltip-close">&times;</button>
      </div>
      <div class="easyterms-tooltip-content">${explanation}</div>
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    const tooltipRect = tooltip.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    // Keep in viewport
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 16;
    }
    if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - tooltipRect.height - 8;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Close button handler
    tooltip.querySelector('.easyterms-tooltip-close').addEventListener('click', () => {
      tooltip.remove();
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeTooltip(e) {
        if (!tooltip.contains(e.target) && e.target !== element) {
          tooltip.remove();
          document.removeEventListener('click', closeTooltip);
        }
      });
    }, 100);
  }

  // Show floating panel with summary
  function showFloatingPanel(data) {
    // Remove existing panel
    const existing = document.querySelector('.easyterms-panel');
    if (existing) existing.remove();

    const analysis = data.analysis || {};
    const concerns = analysis.potentialConcerns || [];
    const keyTerms = analysis.keyTerms || [];
    const highRisk = keyTerms.filter(t => t.riskLevel === 'high').length;
    const mediumRisk = keyTerms.filter(t => t.riskLevel === 'medium').length;

    const panel = document.createElement('div');
    panel.className = 'easyterms-panel';
    panel.innerHTML = `
      <div class="easyterms-panel-header">
        <div class="easyterms-panel-logo">
          <svg width="20" height="20" viewBox="0 0 233 244" fill="none">
            <path opacity="0.6" d="M93.7252 219.53C101.68 218.783 98.2205 219.504 110.417 216.964C114.688 216.075 117.377 211.639 116.423 207.057C115.469 202.474 111.232 199.481 106.961 200.371C94.2305 203.022 98.9272 202.032 91.8855 202.693C84.9698 203.342 80.8453 202.724 77.566 201.165C75.3534 200.114 73.3171 198.757 71.5134 197.145C68.9206 194.828 66.8145 191.433 64.6936 184.906C62.5108 178.188 60.629 169.215 57.9355 156.281L52.8074 131.66C52.3352 129.394 51.2076 123.972 52.5937 119.502C53.4478 116.746 54.7703 114.317 56.3514 112.891C58.8991 110.593 62.0241 108.938 65.559 108.202L73.8569 106.797C76.8788 106.238 80.3677 105.405 83.5532 103.726C89.7581 100.454 93.7617 93.8504 94.0557 86.402C94.2064 82.5783 93.5172 78.7931 92.7827 75.5793L90.6545 66.8074C89.8277 62.8369 90.0924 59.1755 91.1438 55.6047C91.7565 53.5233 93.1462 51.4456 95.2449 49.4379C98.4265 46.3935 102.802 45.4602 105.475 44.8899C108.148 44.3198 110.97 43.7218 113.329 43.2305C127.844 40.2077 133.148 39.2267 137.445 39.9026C144.895 41.0747 151.297 45.4247 155.14 51.5809C156.102 53.1225 156.993 55.2259 158.018 58.9803C159.063 62.8077 160.097 67.7558 161.583 74.8892L170.623 118.297C171.573 122.862 175.794 125.844 180.05 124.957C184.306 124.071 186.985 119.652 186.034 115.087L176.936 71.3979C175.523 64.6135 174.378 59.1161 173.169 54.6859C171.923 50.1213 170.466 46.1228 168.194 42.4844C161.642 31.9859 151.041 25.0323 139.29 23.1836C131.958 22.0303 120.309 24.4597 108.004 27.0271C85.5306 31.704 72.1822 34.482 62.1029 40.8954C45.9169 51.1945 34.8194 68.2336 31.9214 87.7576C30.9553 94.265 31.3218 100.962 32.466 108.845C33.5899 116.589 35.557 126.035 38.0645 138.075L42.6321 160.008C45.1921 172.301 47.2652 182.257 49.792 190.033C52.416 198.109 55.8224 204.821 61.6032 209.986C64.5978 212.662 67.9375 214.879 71.5148 216.578C78.3399 219.822 85.55 220.297 93.7252 219.53Z" fill="#6500FF"/>
            <path opacity="0.6" d="M136.899 100.511C134.784 100.429 132.881 101.76 132.131 103.846L128.576 113.729C123.751 127.143 121.793 132.262 118.235 135.888C114.677 139.513 109.788 141.37 96.9926 145.909L87.5661 149.252C85.5759 149.958 84.2432 151.924 84.2259 154.179C84.2087 156.434 85.5105 158.501 87.4887 159.36L96.8584 163.429C109.577 168.953 114.434 171.186 117.935 175.083C121.436 178.982 123.314 184.249 127.931 198.028L131.332 208.179C132.05 210.322 133.931 211.799 136.047 211.881C138.162 211.962 140.065 210.631 140.816 208.545L144.37 198.663C149.195 185.248 151.152 180.129 154.71 176.503C158.269 172.878 163.158 171.022 175.953 166.482L185.38 163.139C187.37 162.433 188.703 160.467 188.72 158.212C188.737 155.958 187.435 153.89 185.457 153.031L176.087 148.962C163.369 143.438 158.512 141.206 155.011 137.308C151.51 133.409 149.632 128.142 145.015 114.363L141.614 104.212C140.896 102.069 139.015 100.592 136.899 100.511Z" fill="#BB93F9"/>
          </svg>
          <span>EasyTerms Analysis</span>
        </div>
        <button class="easyterms-panel-close">&times;</button>
      </div>
      <div class="easyterms-panel-body">
        <div class="easyterms-panel-risk easyterms-risk-${data.overallRisk || 'medium'}">
          ${(data.overallRisk || 'medium').toUpperCase()} RISK
        </div>
        <div class="easyterms-panel-stats">
          <div class="easyterms-stat">
            <span class="easyterms-stat-value easyterms-high">${highRisk}</span>
            <span class="easyterms-stat-label">High</span>
          </div>
          <div class="easyterms-stat">
            <span class="easyterms-stat-value easyterms-medium">${mediumRisk}</span>
            <span class="easyterms-stat-label">Medium</span>
          </div>
          <div class="easyterms-stat">
            <span class="easyterms-stat-value easyterms-concern">${concerns.length}</span>
            <span class="easyterms-stat-label">Concerns</span>
          </div>
        </div>
        ${concerns.length > 0 ? `
          <div class="easyterms-panel-concerns">
            <div class="easyterms-concerns-title">Key Concerns:</div>
            <ul>
              ${concerns.slice(0, 3).map(c => `<li>${c}</li>`).join('')}
              ${concerns.length > 3 ? `<li class="easyterms-more">+${concerns.length - 3} more</li>` : ''}
            </ul>
          </div>
        ` : ''}
        <div class="easyterms-panel-actions">
          <a href="https://easyterms.ai/dashboard/contracts/${data.contractId}" target="_blank" class="easyterms-panel-btn">
            View Full Analysis
          </a>
        </div>
        <div class="easyterms-panel-hint">
          Click highlighted text for details
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Close handler
    panel.querySelector('.easyterms-panel-close').addEventListener('click', () => {
      panel.classList.add('easyterms-panel-hidden');
      panelVisible = false;
    });

    // Toggle visibility
    panelVisible = true;

    // Make panel draggable
    makeDraggable(panel);
  }

  // Make element draggable
  function makeDraggable(element) {
    const header = element.querySelector('.easyterms-panel-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('easyterms-panel-close')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.left = `${startLeft + dx}px`;
      element.style.top = `${startTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      header.style.cursor = 'grab';
    });
  }

})();
