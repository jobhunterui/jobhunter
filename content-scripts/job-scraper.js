// Listen for messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrapeJobData") {
      const jobData = extractJobData();
      sendResponse({ jobData });
      return true;
    }
    return false;
  });
  
  // Function to extract job data from the current page
  function extractJobData() {
    // Initialize job data object
    const jobData = {
      title: "",
      company: "",
      location: "",
      description: ""
    };
    
    // Extract job title
    jobData.title = extractJobTitle();
    
    // Extract company name
    jobData.company = extractCompanyName();
    
    // Extract location
    jobData.location = extractLocation();
    
    // Extract job description
    jobData.description = extractJobDescription();
    
    return jobData;
  }
  
  function extractJobTitle() {
    // Try to find job title using common patterns
    const titleSelectors = [
      // Common job title selectors
      'h1',
      'h1.job-title',
      '.job-title',
      '.posting-headline h2',
      '.job-headline h2',
      '.job-header h1',
      '.job-header__title',
      '[data-test="job-title"]',
      '.jobsearch-JobInfoHeader-title',
      '.top-card-layout__title',
      '.jobs-unified-top-card__job-title'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    // Fallback to page title
    const titleMatch = document.title.match(/(.+?)(\s+at\s+|\s+\-\s+|\s+\|\s+)/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    return document.title || "Job Position";
  }
  
  function extractCompanyName() {
    // Try to find company name using common patterns
    const companySelectors = [
      '.company-name',
      '.job-company',
      '.posting-headline h3',
      '.job-header__company',
      '[data-test="company-name"]',
      '.jobsearch-InlineCompanyRating',
      '.top-card-layout__company-name',
      '.jobs-unified-top-card__company-name',
      '[data-test="employer-name"]',
      '.employer-name'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    // Try to extract from URL
    try {
      const url = new URL(window.location.href);
      const hostname = url.hostname;
      
      // Remove common TLDs
      const companyFromURL = hostname.replace(/\.(com|org|net|io|co|jobs)$/, '')
                                     .split('.')
                                     .pop();
      
      // Common ATS domains to check
      const atsPatterns = [
        { pattern: /lever\.co/i, extract: (url) => url.pathname.split('/')[1] },
        { pattern: /greenhouse\.io/i, extract: (url) => url.pathname.split('/')[2] },
        { pattern: /workable\.com/i, extract: (url) => url.pathname.split('/')[1] },
        { pattern: /ashbyhq\.com/i, extract: (url) => url.pathname.split('/')[2] }
      ];
      
      for (const ats of atsPatterns) {
        if (ats.pattern.test(hostname)) {
          const extracted = ats.extract(url);
          if (extracted) {
            // Convert dashes to spaces and capitalize
            return extracted
              .replace(/-/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      }
      
      // If no ATS pattern matched but we have something from the URL
      if (companyFromURL && companyFromURL.length > 1) {
        return companyFromURL
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (e) {
      console.error("Error extracting company from URL:", e);
    }
    
    return "Company";
  }
  
  function extractLocation() {
    // Try to find location using common patterns
    const locationSelectors = [
      '.job-location',
      '.location',
      '[data-test="location"]',
      '.jobsearch-JobInfoHeader-locationParentWrapper',
      '.top-card-layout__location',
      '.jobs-unified-top-card__workplace-type',
      '[data-test="job-location"]'
    ];
    
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return "";
  }
  
  function extractJobDescription() {
    // Try to find job description using common patterns
    const descriptionSelectors = [
      '.job-description',
      '.description',
      '#job-description',
      '.jobsearch-jobDescriptionText',
      '.show-more-less-html__markup',
      '[data-test="description"]',
      '.jobs-description-content',
      '.jobs-box__html-content',
      '.details-pane__content'
    ];
    
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim().substring(0, 5000); // Limit length to prevent storage issues
      }
    }
    
    // Fallback to getting main content
    const mainContent = document.querySelector('main') || document.querySelector('.main') || document.body;
    return mainContent.textContent.trim().substring(0, 5000); // Limit length
  }