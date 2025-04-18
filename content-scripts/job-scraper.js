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
    // First try to find company name using common selectors
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
      '.employer-name',
      '.company',
      '[itemprop="hiringOrganization"]',
      '.job-details-jobs-unified-top-card__primary-description',
      '.job-company-name',
      '.employer-info'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return cleanCompanyName(element.textContent.trim());
      }
    }
    
    // Look for company in page title
    const titleMatch = document.title.match(/(.+?)(\s+at\s+|\s+\-\s+|\s+\|\s+)(.+?)(\s+\-\s+|\s+\|\s+|$)/i);
    if (titleMatch) {
      if (titleMatch[3] && !titleMatch[3].toLowerCase().includes('job') && !titleMatch[3].toLowerCase().includes('career')) {
        return cleanCompanyName(titleMatch[3]);
      }
    }
  
    // Look for company in meta tags
    const metaTags = document.querySelectorAll('meta[property="og:site_name"], meta[name="author"], meta[name="publisher"]');
    for (const meta of metaTags) {
      if (meta.content && meta.content.trim()) {
        return cleanCompanyName(meta.content.trim());
      }
    }
    
    // Look for logos with alt text containing company name
    const logos = document.querySelectorAll('img[alt*="logo"], img[class*="logo"], img[src*="logo"]');
    for (const logo of logos) {
      if (logo.alt && logo.alt.trim() && logo.alt.toLowerCase().includes('logo')) {
        const altText = logo.alt.trim();
        // Extract company name from alt text (e.g., "Company Name Logo")
        const logoMatch = altText.match(/(.+?)\s+logo/i);
        if (logoMatch && logoMatch[1]) {
          return cleanCompanyName(logoMatch[1]);
        }
      }
    }
  
    // Try to extract from URL for common ATS platforms
    try {
      const url = new URL(window.location.href);
      const hostname = url.hostname;
      const pathname = url.pathname;
      
      // Lever
      if (hostname.includes('lever.co')) {
        // Format is usually: jobs.lever.co/companyname
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return cleanCompanyName(pathParts[0]);
        }
      }
      
      // Greenhouse
      if (hostname.includes('greenhouse.io')) {
        // Format is usually: boards.greenhouse.io/companyname
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return cleanCompanyName(pathParts[0]);
        }
      }
      
      // Workable
      if (hostname.includes('workable.com')) {
        // Format is usually: apply.workable.com/companyname
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return cleanCompanyName(pathParts[0]);
        }
      }
      
      // Ashby
      if (hostname.includes('ashbyhq.com')) {
        // Format is usually: jobs.ashbyhq.com/companyname
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return cleanCompanyName(pathParts[0]);
        }
      }
      
      // SmartRecruiters
      if (hostname.includes('smartrecruiters.com')) {
        // Format is usually: jobs.smartrecruiters.com/CompanyName
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return cleanCompanyName(pathParts[0]);
        }
      }
      
      // Jobvite
      if (hostname.includes('jobvite.com')) {
        // Format is usually: jobs.jobvite.com/companyname
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return cleanCompanyName(pathParts[0]);
        }
      }
      
      // If no ATS pattern matched, try generic hostname extraction
      // Remove common domains and get the remaining part
      const companyFromURL = hostname
        .replace(/\.(com|org|net|io|co|jobs)$/, '')
        .split('.')
        .filter(part => !['www', 'jobs', 'careers', 'job', 'work', 'apply', 'hire', 'boards'].includes(part))
        .pop();
      
      if (companyFromURL && companyFromURL.length > 1) {
        return cleanCompanyName(companyFromURL);
      }
    } catch (e) {
      console.error("Error extracting company from URL:", e);
    }
    
    return "Company";
  }
  
  // Helper function to clean up and format company names
  function cleanCompanyName(name) {
    return name
      .replace(/(-jobs|-careers|-job|-career|-hiring|-open-positions)$/i, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
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