// Create context menu when extension is installed/updated
browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: "save-job",
      title: "Save Job to Job Hunter",
      contexts: ["page"]
    });
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
          // Show notification
          browser.notifications.create({
            type: "basic",
            iconUrl: browser.runtime.getURL("icons/icon-48.png"),
            title: "Job Saved",
            message: `"${jobData.title}" at ${jobData.company} has been saved to Job Hunter.`
          });
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
  
  // Listen for messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "jobSaved") {
      // Handle job saved confirmation
      return Promise.resolve({ success: true });
    }
    return false;
  });