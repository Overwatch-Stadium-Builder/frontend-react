import React, { useEffect, useRef } from "react";
import ExternalLinkConfirm from "./ExternalLinkConfirm";

type LinkWrapperProps = {
  children: React.ReactNode;
};

const LinkWrapper: React.FC<LinkWrapperProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Function to process links and add the external link check
    const processAnchors = () => {
      const container = containerRef.current;
      if (!container) return;

      const anchors = container.querySelectorAll('a:not([data-external-processed])');
      anchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href) return;

        // Skip links that are already processed or are internal navigation
        if (anchor.hasAttribute('data-external-processed') ||
            href.startsWith('/') ||
            href.startsWith('#') ||
            href.startsWith('javascript:')) {
          return;
        }

        try {
          // Check if it's an external link
          const url = new URL(href);
          const currentHostname = window.location.hostname;
          
          if (url.hostname !== currentHostname) {
            // For external links, add event listener
            anchor.addEventListener('click', (e) => {
              e.preventDefault();
              
              // Create and show confirmation dialog
              const confirmDialog = document.createElement('dialog');
              confirmDialog.className = 'external-link-confirm';
              
              confirmDialog.innerHTML = `
                <div class="p-4 max-w-md">
                  <h3 class="text-lg font-semibold mb-2">External Link Warning</h3>
                  <p class="mb-2">You're about to visit an external website:</p>
                  <div class="bg-gray-100 p-2 rounded mb-4 break-all">
                    <code>${href}</code>
                  </div>
                  <p class="mb-4 text-sm text-gray-600">
                    Please be cautious and never share passwords, API keys, or other sensitive information on websites you don't trust.
                  </p>
                  <div class="flex justify-end gap-2">
                    <button class="px-3 py-1 border rounded" id="cancel-btn">Cancel</button>
                    <button class="px-3 py-1 bg-primary text-white rounded" id="continue-btn">Continue</button>
                  </div>
                </div>
              `;
              
              document.body.appendChild(confirmDialog);
              confirmDialog.showModal();
              
              const cancelBtn = confirmDialog.querySelector('#cancel-btn');
              const continueBtn = confirmDialog.querySelector('#continue-btn');
              
              cancelBtn?.addEventListener('click', () => {
                confirmDialog.close();
                confirmDialog.remove();
              });
              
              continueBtn?.addEventListener('click', () => {
                confirmDialog.close();
                confirmDialog.remove();
                window.open(href, '_blank', 'noopener,noreferrer');
              });
            });
            
            // Add icon to indicate external link
            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ml-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
            anchor.appendChild(iconSpan);
          }
        } catch (e) {
          // If URL parsing fails, it's likely not a valid URL
          console.error("Invalid URL:", href);
        }
        
        // Mark as processed
        anchor.setAttribute('data-external-processed', 'true');
      });
    };

    // Process immediately, then observe for changes
    processAnchors();

    // Set up MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      // Check if any mutation added nodes
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
      });
      
      if (shouldProcess) {
        processAnchors();
      }
    });

    // Start observing
    observer.observe(containerRef.current, { 
      childList: true, 
      subtree: true 
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};

export default LinkWrapper;
