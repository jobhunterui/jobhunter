// Tab switching functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
  
  // "Don't show again" and close functionality
  function setupCloseButton() {
    const closeButton = document.getElementById('close-welcome');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        const dontShowAgain = document.getElementById('dont-show-again').checked;
        
        // Send message to background script
        browser.runtime.sendMessage({
          action: 'closeWelcome',
          dontShowAgain: dontShowAgain
        }).then(() => {
          window.close();
        }).catch(error => {
          console.error("Error sending close message:", error);
        });
      });
    }
  }
  
  // Initialize everything when the DOM is fully loaded
  function init() {
    setupTabs();
    setupCloseButton();
    console.log("Welcome page initialized successfully");
  }
  
  // Run initialization when the document is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }