// Global variables
let currentTabIndex = 0;
const tabIds = ["overview", "find-jobs", "apply", "profile"];

// Initialize the welcome page
function init() {
  setupTabs();
  setupNavigation();
  setupCloseButtons();
  updateNavigationButtons();
  console.log("Welcome page initialized successfully");
}

// Set up tab switching functionality
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      switchToTab(index);
    });
  });
}

// Set up next/previous navigation
function setupNavigation() {
  const nextButton = document.getElementById('next-button');
  const prevButton = document.getElementById('prev-button');
  const finishButton = document.getElementById('finish-button');
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (currentTabIndex < tabIds.length - 1) {
        switchToTab(currentTabIndex + 1);
      }
    });
  }
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentTabIndex > 0) {
        switchToTab(currentTabIndex - 1);
      }
    });
  }
  
  if (finishButton) {
    finishButton.addEventListener('click', () => {
      savePreferencesAndClose();
    });
  }
}

// Switch to a specific tab
function switchToTab(tabIndex) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Remove active class from all buttons and contents
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to specified tab button and content
  tabButtons[tabIndex].classList.add('active');
  document.getElementById(tabIds[tabIndex]).classList.add('active');
  
  // Update the current tab index
  currentTabIndex = tabIndex;
  
  // Update navigation buttons
  updateNavigationButtons();
  
  // Update progress indicator
  updateProgressIndicator();
}

// Update the navigation buttons based on current tab
function updateNavigationButtons() {
  const nextButton = document.getElementById('next-button');
  const prevButton = document.getElementById('prev-button');
  const finishButton = document.getElementById('finish-button');
  const skipButton = document.getElementById('skip-button');
  
  // Show/hide previous button
  if (prevButton) {
    prevButton.style.display = currentTabIndex === 0 ? 'none' : 'inline-block';
  }
  
  // Show/hide next button
  if (nextButton) {
    nextButton.style.display = currentTabIndex === tabIds.length - 1 ? 'none' : 'inline-block';
  }
  
  // Show/hide finish button
  if (finishButton) {
    finishButton.style.display = currentTabIndex === tabIds.length - 1 ? 'inline-block' : 'none';
  }
  
  // Skip button is always visible
  if (skipButton) {
    skipButton.style.display = 'inline-block';
  }
}

// Update the progress indicator
function updateProgressIndicator() {
  const progressDots = document.querySelectorAll('.progress-dot');
  
  progressDots.forEach((dot, index) => {
    if (index === currentTabIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Setup close/skip buttons
function setupCloseButtons() {
  const skipButton = document.getElementById('skip-button');
  
  if (skipButton) {
    skipButton.addEventListener('click', () => {
      savePreferencesAndClose();
    });
  }
}

// Save preferences and close the welcome modal
function savePreferencesAndClose() {
  const dontShowAgain = document.getElementById('dont-show-again').checked;
  
  // Send message to background script
  browser.runtime.sendMessage({
    action: 'closeWelcome',
    dontShowAgain: dontShowAgain
  }).then(() => {
    window.close();
  }).catch(error => {
    console.error("Error sending close message:", error);
    // Try to close anyway if messaging fails
    window.close();
  });
}

// Run initialization when the document is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}