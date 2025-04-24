// Clear existing context menus and create new ones when extension loads
browser.contextMenus.removeAll().then(() => {
  browser.contextMenus.create({
    id: "save-job",
    title: "Save Job to Job Hunter",
    contexts: ["page"]
  }, () => {
    if (browser.runtime.lastError) {
      console.error("Error creating context menu:", browser.runtime.lastError);
    } else {
      console.log("Context menu created successfully");
    }
  });
}).catch(error => {
  console.error("Error removing existing context menus:", error);
});

// Check if we should show the welcome page on startup
browser.runtime.onStartup.addListener(() => {
  checkAndShowWelcome();
});

// Check if we should show the welcome page on install/update
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First install - always show welcome page
    showWelcomePage();
  } else if (details.reason === 'update') {
    // Check if we should show welcome on update
    // Only show on major version changes
    const previousVersion = details.previousVersion || '';
    const currentVersion = browser.runtime.getManifest().version;
    
    const previousMajor = parseInt(previousVersion.split('.')[0]) || 0;
    const currentMajor = parseInt(currentVersion.split('.')[0]) || 0;
    
    if (currentMajor > previousMajor) {
      showWelcomePage();
    } else {
      checkAndShowWelcome();
    }
  }
});

// Handle browser action clicks (toolbar icon)
browser.browserAction.onClicked.addListener(() => {
  // Open the sidebar panel
  browser.sidebarAction.open();
});

// Function to check welcome preferences and show welcome if needed
function checkAndShowWelcome() {
  browser.storage.local.get('welcomePreferences').then(result => {
    const prefs = result.welcomePreferences || {};
    
    // If dontShowAgain is not set or is false, show welcome
    if (!prefs.dontShowAgain) {
      showWelcomePage();
    }
  }).catch(error => {
    console.error("Error checking welcome preferences:", error);
  });
}

// Function to open the welcome page
function showWelcomePage() {
  browser.tabs.create({ url: browser.runtime.getURL("welcome.html") });
}

// Listen for messages from welcome page
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'closeWelcome') {
    // Save preferences
    browser.storage.local.set({ 
      welcomePreferences: { 
        dontShowAgain: message.dontShowAgain,
        lastShown: new Date().toISOString()
      }
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error("Error saving welcome preferences:", error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Keep the messaging channel open for the async response
  }
  
  if (message.action === "jobSaved") {
    // Handle job saved confirmation
    return Promise.resolve({ success: true });
  }
  
  return false;
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-job") {
    // Send message to content script to scrape job data
    browser.tabs.sendMessage(tab.id, { action: "scrapeJobData" })
      .then(response => {
        if (response && response.jobData) {
          // Save the job data
          saveJobData(response.jobData, tab.url);
        }
      })
      .catch(error => {
        console.error("Error scraping job data:", error);
      });
  }
});

// Track job saved event
function trackJobSaved(job) {
  browser.runtime.sendMessage({
    action: "trackJobSaved",
    jobData: {
      job_title: job.title || 'Unknown Title',
      company: job.company || 'Unknown Company',
      location: job.location || '',
      url: job.url || '',
      source_domain: job.url ? new URL(job.url).hostname : '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      experience_level: job.experienceLevel || '',
      description_snippet: job.description ? 
        job.description.substring(0, 200) + (job.description.length > 200 ? '...' : '') : ''
    }
  });
}

// Function to save job data
function saveJobData(jobData, url) {
  // Get existing saved jobs
  browser.storage.local.get('savedJobs').then(result => {
    const savedJobs = result.savedJobs || [];
    
    // Add URL to job data
    jobData.url = url;
    
    // Check if job already exists (by URL)
    const jobExists = savedJobs.some(job => job.url === url);
    
    if (!jobExists) {
      // Add new job
      savedJobs.push(jobData);
      
      // Save updated jobs
      browser.storage.local.set({ savedJobs }).then(() => {
        // Track this job save
        trackJobSaved(jobData);
        
        // Show notification
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/icon-48.png"),
          title: "Job Saved",
          message: `"${jobData.title}" at ${jobData.company} has been saved to Job Hunter.`
        });
        
        // Open the sidebar panel if not already open
        browser.sidebarAction.open();
      });
    } else {
      // Show notification
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/icon-48.png"),
        title: "Job Already Saved",
        message: `This job is already in your saved jobs.`
      });
    }
  });
}

function trackSiteSelectionSearch(type, searchData, selectedSites) {
  browser.runtime.sendMessage({
    action: "trackFeatureUsage",
    feature: `search_${type}_selected`,
    searchTerm: searchData.role || '',
    searchLocation: searchData.location || '',
    selectedSites: selectedSites.join(',')
  }).catch(error => {
    console.error("Error sending tracking message:", error);
  });
}