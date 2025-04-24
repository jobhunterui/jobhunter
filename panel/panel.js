document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
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
    
    // Load saved jobs
    loadSavedJobs();
    
    // Load profile data
    loadProfileData();
    
    // Setup search buttons
    document.getElementById('search-linkedin').addEventListener('click', searchOnLinkedIn);
    document.getElementById('search-linkedin-feed').addEventListener('click', searchOnLinkedInFeed);
    document.getElementById('search-google').addEventListener('click', searchOnGoogle);
    document.getElementById('search-docs').addEventListener('click', searchInDocsAndPages);
    document.getElementById('search-ai').addEventListener('click', searchWithAI);

    // Setup hiring phrases features
    document.getElementById('show-hiring-phrases').addEventListener('click', function() {
      const optionsEl = document.getElementById('hiring-phrases-options');
      const toggleEl = document.getElementById('show-hiring-phrases');
      
      if (optionsEl.classList.contains('hidden')) {
        optionsEl.classList.remove('hidden');
        toggleEl.classList.add('active');
      } else {
        optionsEl.classList.add('hidden');
        toggleEl.classList.remove('active');
      }
    });

    document.getElementById('add-custom-phrase').addEventListener('click', function() {
      const customPhraseInput = document.getElementById('custom-phrase');
      const phrase = customPhraseInput.value.trim();
      
      if (phrase) {
        // Create new checkbox option
        const phraseOption = document.createElement('div');
        phraseOption.className = 'phrase-option';
        
        const id = 'phrase-custom-' + Date.now();
        
        phraseOption.innerHTML = `
          <input type="checkbox" id="${id}" name="hiring-phrase" value="${phrase}" checked>
          <label for="${id}">"${phrase}"</label>
        `;
        
        // Insert before the custom phrase input
        const customPhraseDiv = document.querySelector('.custom-phrase');
        customPhraseDiv.parentNode.insertBefore(phraseOption, customPhraseDiv);
        
        // Clear input
        customPhraseInput.value = '';
        
        // Save custom phrases to storage
        saveHiringPhrases();
      }
    });

    // Load hiring phrases
    loadHiringPhrases();
    
    // Setup profile save button
    document.getElementById('save-profile').addEventListener('click', saveProfileData);
    
    // Setup job actions
    document.getElementById('generate-application').addEventListener('click', generateApplication);
    document.getElementById('remove-job').addEventListener('click', removeSelectedJob);

    // Setup refresh jobs button
    document.getElementById('refresh-jobs').addEventListener('click', function() {
      // Clear the jobs list and reload from storage
      document.getElementById('saved-jobs-list').innerHTML = '<div class="loading-jobs">Loading saved jobs...</div>';
      
      // Add a small delay to show the loading message
      setTimeout(() => {
        loadSavedJobs();
      }, 300);
    });
    
    // Setup CV preview button
    document.getElementById('preview-cv').addEventListener('click', previewCVAndCoverLetter);

    // Setup feature tracking for each button/action
    document.getElementById('search-linkedin').addEventListener('click', function() {
      const role = document.getElementById('role').value.trim();
      trackFeatureUsage('search', { platform: 'linkedin', search_term: role });
    });

    document.getElementById('search-linkedin-feed').addEventListener('click', function() {
      const role = document.getElementById('role').value.trim();
      trackFeatureUsage('search', { platform: 'linkedin_feed', search_term: role });
    });

    document.getElementById('search-google').addEventListener('click', function() {
      const role = document.getElementById('role').value.trim();
      trackFeatureUsage('search', { platform: 'job_boards', search_term: role });
    });

    document.getElementById('search-docs').addEventListener('click', function() {
      const role = document.getElementById('role').value.trim();
      trackFeatureUsage('search', { platform: 'docs_and_pages', search_term: role });
    });

    document.getElementById('search-ai').addEventListener('click', function() {
      const role = document.getElementById('role').value.trim();
      trackFeatureUsage('search', { platform: 'ai', search_term: role });
    });

    document.getElementById('refresh-jobs').addEventListener('click', function() {
      trackFeatureUsage('refresh_jobs');
    });

    document.getElementById('preview-cv').addEventListener('click', function() {
      trackFeatureUsage('preview_cv');
    });

    document.getElementById('save-profile').addEventListener('click', function() {
      trackFeatureUsage('save_profile');
    });

    // Track when tabs are clicked
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', function() {
        const tabId = button.getAttribute('data-tab');
        trackFeatureUsage('view_tab', { tab_name: tabId });
      });
    });

    // Track extension open
    trackFeatureUsage('extension_open');

    // Initialize data collection
    initializeDataCollection();

    // Set up interview prep button
    setupInterviewPrepButton();

    console.log("Event listeners set up completed");
  });

  // Hiring Phrases Management Functions
  function loadHiringPhrases() {
    browser.storage.local.get('hiringPhrases').then(result => {
      if (result.hiringPhrases && Array.isArray(result.hiringPhrases)) {
        const customPhraseDiv = document.querySelector('.custom-phrase');
        
        result.hiringPhrases.forEach(phrase => {
          // Check if this phrase already exists
          const exists = Array.from(document.querySelectorAll('input[name="hiring-phrase"]'))
            .some(input => input.value === phrase);
          
          if (!exists) {
            const phraseOption = document.createElement('div');
            phraseOption.className = 'phrase-option';
            
            const id = 'phrase-custom-' + Date.now() + Math.random().toString(36).substr(2, 5);
            
            phraseOption.innerHTML = `
              <input type="checkbox" id="${id}" name="hiring-phrase" value="${phrase}" checked>
              <label for="${id}">"${phrase}"</label>
            `;
            
            customPhraseDiv.parentNode.insertBefore(phraseOption, customPhraseDiv);
          }
        });
      }
    });
  }

  function saveHiringPhrases() {
    const defaultPhrases = [
      'we are hiring', 'join our team', 'job opening', 'open position', 
      'now hiring', 'looking for', 'immediate opening', 'career opportunities',
      'remote opportunity'
    ];
    
    const customPhrases = Array.from(document.querySelectorAll('input[name="hiring-phrase"]'))
      .filter(input => !defaultPhrases.includes(input.value))
      .map(input => input.value);
    
    browser.storage.local.set({ hiringPhrases: customPhrases });
  }

  // Common functions for getting selected hiring phrases
  function getSelectedHiringPhrases() {
    const selectedPhrases = Array.from(document.querySelectorAll('input[name="hiring-phrase"]:checked'))
      .map(input => input.value);
    
    if (selectedPhrases.length === 0) {
      alert('Please select at least one hiring phrase.');
      return null;
    }
    
    return selectedPhrases;
  }
  
  // Find Jobs Tab Functions
  function searchOnLinkedIn() {
    const role = encodeURIComponent(document.getElementById('role').value);
    const location = encodeURIComponent(document.getElementById('location').value);
    const experience = document.getElementById('experience').value;

    // Store search context for tracking
    storeLastSearch('linkedin', role, location, experience);
    
    let url = `https://www.linkedin.com/jobs/search/?keywords=${role}&location=${location}`;
    
    if (experience) {
      // Map experience levels to LinkedIn's experience filters
      const experienceMap = {
        'entry': '&f_E=1%2C2',  // Internship, Entry level
        'mid': '&f_E=3',        // Associate
        'senior': '&f_E=4',     // Mid-Senior level
        'lead': '&f_E=5%2C6'    // Director, Executive
      };
      
      url += experienceMap[experience] || '';
    }
    
    browser.tabs.create({ url });
  }
  
  function searchOnLinkedInFeed() {
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    const selectedPhrases = getSelectedHiringPhrases();
    const experience = document.getElementById('experience').value;

    // Store search context for tracking
    storeLastSearch('linkedinFeed', role, location, experience);
    
    if (!selectedPhrases) return;
    
    // Select a random phrase from selected options
    const randomPhrase = selectedPhrases[Math.floor(Math.random() * selectedPhrases.length)];
    
    // Generate the search URL for LinkedIn feed
    const searchParams = new URLSearchParams();
    searchParams.append('keywords', `${randomPhrase} ${role}`);
    
    if (location) {
      searchParams.append('geo', location);
    }
    
    const url = `https://www.linkedin.com/search/results/content/?${searchParams.toString()}`;
    browser.tabs.create({ url });
  }
  
  function searchOnGoogle() {
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    const experience = document.getElementById('experience').value;

    // Store search context for tracking
    storeLastSearch('jobBoard', role, location, experience);
    
    // List of specific ATS sites as requested
    const atsSites = [
      'jobs.lever.co',
      'boards.greenhouse.io',
      'apply.workable.com',
      'ashbyhq.com',
      'jobs.smartrecruiters.com'
    ];
    
    // Construct site search query exactly as specified
    const siteQuery = atsSites.map(site => `site:${site}`).join(' OR ');
    
    // Put the role in double quotes
    const query = `(${siteQuery}) "${role}" ${location}`;
    
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    browser.tabs.create({ url });
  }

  function searchInDocsAndPages() {
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    const selectedPhrases = getSelectedHiringPhrases();
    const experience = document.getElementById('experience').value;

    // Store search context for tracking
    storeLastSearch('docsAndPages', role, location, experience);
    
    if (!role) {
      alert('Please enter a job role to search for.');
      return;
    }
    
    if (!selectedPhrases) return;
    
    // Simplified document sites list
    const documentSites = [
      'docs.google.com',
      'notion.so',
      'coda.io'
    ];
    
    // Construct the site search query
    const siteQuery = documentSites.map(site => `site:${site}`).join(' OR ');
    
    // Select a random phrase or use all selected phrases
    const randomPhrase = selectedPhrases[Math.floor(Math.random() * selectedPhrases.length)];
    
    // Build the simple search query: platforms + hiring phrase + role
    let query = `(${siteQuery}) AND ("${randomPhrase}") AND "${role}"`;
    
    // Add location if provided
    if (location) {
      query += ` AND "${location}"`;
    }
    
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    browser.tabs.create({ url });
  }
  
  function searchWithAI() {
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    const experience = document.getElementById('experience').value;

    // Store search context for tracking
    storeLastSearch('AI', role, location, experience);
    
    if (!role) {
      alert('Please enter a job role to search for.');
      return;
    }
    
    // Create an improved prompt that's more focused on job search quality
    let prompt = `Find recent job postings for "${role}"`;
    
    // Add location context if provided
    if (location.toLowerCase().includes('remote')) {
      prompt += ` that are fully remote`;
    } else if (location) {
      prompt += ` in ${location}`;
    }
    
    // Add experience level context if provided
    if (experience) {
      const experienceText = {
        'entry': 'entry-level or junior',
        'mid': 'mid-level',
        'senior': 'senior-level',
        'lead': 'leadership or management level'
      }[experience] || '';
      
      if (experienceText) {
        prompt += ` for ${experienceText} candidates`;
      }
    }
    
    // Add time relevance
    prompt += ` posted in the last 30 days.`;
    
    // Add instructions for high-quality results
    prompt += ` For each position, provide:
  1. Job title and company
  2. Location and remote options
  3. Salary range if available
  4. Key responsibilities and required skills
  5. Direct application link
  6. Any notable benefits or company culture details
  
  Focus on active job listings from reputable companies with complete information. Exclude outdated or vague listings.`;
  
    const url = `https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`;
    
    browser.tabs.create({ url });
  }
  
  // Apply Tab Functions
  function loadSavedJobs() {
    browser.storage.local.get('savedJobs').then(result => {
      const savedJobsList = document.getElementById('saved-jobs-list');
      const jobActions = document.getElementById('job-actions');
      
      if (result.savedJobs && result.savedJobs.length > 0) {
        // Clear empty state
        savedJobsList.innerHTML = '';
        
        // Add job items
        result.savedJobs.forEach((job, index) => {
          const jobItem = document.createElement('div');
          jobItem.className = 'job-item';
          jobItem.setAttribute('data-index', index);
          
          // Add a URL display that's shortened if too long
          const displayUrl = job.url ? 
            (job.url.length > 40 ? job.url.substring(0, 37) + '...' : job.url) : 
            'URL not available';
          
          jobItem.innerHTML = `
            <div class="job-title">${job.title || 'Untitled Position'}</div>
            <div class="job-company">${job.company || 'Company not specified'}</div>
            <div class="job-location">${job.location || 'Location not specified'}</div>
            <div class="job-url"><a href="${job.url}" target="_blank" title="${job.url}">${displayUrl}</a></div>
            <div class="job-item-actions">
              <button class="view-details-btn">View Details</button>
            </div>
          `;
          
          // Add selection functionality and event listeners
          jobItem.addEventListener('click', (e) => {
            // Don't select if clicking on the view details button or the URL link
            if (e.target.classList.contains('view-details-btn') || 
                e.target.tagName === 'A') {
              return;
            }
            
            // Toggle selection
            document.querySelectorAll('.job-item').forEach(item => {
              item.classList.remove('selected');
            });
            
            jobItem.classList.add('selected');
            jobActions.classList.remove('hidden');
          });
          
          // Add view details functionality
          const viewDetailsBtn = jobItem.querySelector('.view-details-btn');
          viewDetailsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent selection of the job item
            showJobDetails(job);
          });

          addStatusTracking(jobItem, job, index);
          
          savedJobsList.appendChild(jobItem);
        });
      } else {
        savedJobsList.innerHTML = '<div class="empty-state">No saved jobs yet.</div>';
        jobActions.classList.add('hidden');
      }
    });
  }

  function addStatusTracking(jobItem, job, index) {
    const jobActions = jobItem.querySelector('.job-item-actions');
    
    // Create status selector
    const statusContainer = document.createElement('div');
    statusContainer.className = 'job-status-container';
    
    const statusLabel = document.createElement('span');
    statusLabel.className = 'status-label';
    statusLabel.textContent = 'Status: ';
    
    const statusSelect = document.createElement('select');
    statusSelect.className = 'job-status-select';
    statusSelect.setAttribute('data-index', index);
    
    // Define status options
    const statuses = [
      { value: 'reviewing', text: 'Reviewing', color: '#f39c12' },
      { value: 'applied', text: 'Applied', color: '#3498db' },
      { value: 'interviewing', text: 'Interviewing', color: '#9b59b6' },
      { value: 'offer', text: 'Offer Received', color: '#2ecc71' },
      { value: 'rejected', text: 'Rejected', color: '#e74c3c' },
      { value: 'accepted', text: 'Accepted', color: '#27ae60' },
      { value: 'declined', text: 'Declined', color: '#7f8c8d' }
    ];
    
    // Add options to select
    statuses.forEach(status => {
      const option = document.createElement('option');
      option.value = status.value;
      option.textContent = status.text;
      
      // Set selected if job has this status
      if (job.status === status.value) {
        option.selected = true;
      }
      
      statusSelect.appendChild(option);
    });
    
    // Default to 'reviewing' if no status is set
    if (!job.status) {
      statusSelect.value = 'reviewing';
    }
    
    // Add event listener to status select
    statusSelect.addEventListener('change', (e) => {
      e.stopPropagation(); // Prevent parent click
      updateJobStatus(index, e.target.value);
    });
    
    // Add elements to container
    statusContainer.appendChild(statusLabel);
    statusContainer.appendChild(statusSelect);
    
    // Add status color indicator
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator';
    const currentStatus = statuses.find(s => s.value === (job.status || 'reviewing'));
    statusIndicator.style.backgroundColor = currentStatus.color;
    statusContainer.appendChild(statusIndicator);
    
    // Add status container before job-item-actions
    jobItem.insertBefore(statusContainer, jobActions);
    
    // Update job item appearance based on status
    updateJobItemAppearance(jobItem, job.status || 'reviewing');
  }
  
  // Function to update job status
  function updateJobStatus(jobIndex, newStatus) {
    browser.storage.local.get('savedJobs').then(result => {
      const savedJobs = result.savedJobs || [];
      
      if (savedJobs[jobIndex]) {
        // Update job status
        savedJobs[jobIndex].status = newStatus;
        
        // Save updated jobs
        browser.storage.local.set({ savedJobs }).then(() => {
          // Update visual appearance
          const jobItem = document.querySelector(`.job-item[data-index="${jobIndex}"]`);
          if (jobItem) {
            updateJobItemAppearance(jobItem, newStatus);
            
            // Update status indicator color
            const statusIndicator = jobItem.querySelector('.status-indicator');
            const statuses = [
              { value: 'reviewing', color: '#f39c12' },
              { value: 'applied', color: '#3498db' },
              { value: 'interviewing', color: '#9b59b6' },
              { value: 'offer', color: '#2ecc71' },
              { value: 'rejected', color: '#e74c3c' },
              { value: 'accepted', color: '#27ae60' },
              { value: 'declined', color: '#7f8c8d' }
            ];
            
            const currentStatus = statuses.find(s => s.value === newStatus);
            if (statusIndicator && currentStatus) {
              statusIndicator.style.backgroundColor = currentStatus.color;
            }
          }
          
          // Track this status change
          trackFeatureUsage('update_job_status', {
            job_title: savedJobs[jobIndex].title || 'Unknown',
            new_status: newStatus
          });
        });
      }
    });
  }
  
  // Function to update job item appearance based on status
  function updateJobItemAppearance(jobItem, status) {
    // Remove any existing status classes
    const statusClasses = ['status-reviewing', 'status-applied', 'status-interviewing', 
                           'status-offer', 'status-rejected', 'status-accepted', 'status-declined'];
    
    jobItem.classList.remove(...statusClasses);
    
    // Add appropriate status class
    jobItem.classList.add(`status-${status}`);
  }
  
  // 2. Implement Interview Prep feature
  
  // Add this to the generateApplication function area
  function setupInterviewPrepButton() {
    const interviewPrepButton = document.createElement('button');
    interviewPrepButton.id = 'interview-prep';
    interviewPrepButton.textContent = 'Interview Prep';
    interviewPrepButton.className = 'interview-prep-button';
    
    // Add button to job actions area
    const jobActions = document.getElementById('job-actions');
    jobActions.appendChild(interviewPrepButton);
    
    // Add event listener
    interviewPrepButton.addEventListener('click', generateInterviewPrep);
  }
  
  // Function to generate interview prep materials
  function generateInterviewPrep() {
    const selectedJob = document.querySelector('.job-item.selected');
    
    if (selectedJob) {
      const jobIndex = parseInt(selectedJob.getAttribute('data-index'));
      
      // Get saved jobs and profile data
      Promise.all([
        browser.storage.local.get('savedJobs'),
        browser.storage.local.get('profileData')
      ]).then(([jobsResult, profileResult]) => {
        const savedJobs = jobsResult.savedJobs || [];
        const profileData = profileResult.profileData || {};
        
        const job = savedJobs[jobIndex];
        const cv = profileData.cv || '';
        
        if (!cv.trim()) {
          alert('Please add your CV in the Profile tab first.');
          // Switch to profile tab
          document.querySelector('[data-tab="profile"]').click();
          return;
        }
        
        // Track interview prep generation
        trackFeatureUsage('generate_interview_prep', {
          job_title: job.title || '',
          company: job.company || ''
        });
        
        // Create prompt for Claude
        const prompt = createInterviewPrepPrompt(job, cv);
        
        // Copy prompt to clipboard
        navigator.clipboard.writeText(prompt).then(() => {
          // Open Claude in a new tab
          browser.tabs.create({ url: 'https://claude.ai' });
          
          alert('Interview prep prompt copied to clipboard! Paste it into Claude to start your interview preparation session.');
        });
      });
    }
  }
  
  // Function to create interview prep prompt
  function createInterviewPrepPrompt(job, cv) {
    return `I want you to help me prepare for a job interview. Here are the details:
  
  JOB DETAILS:
  Title: ${job.title}
  Company: ${job.company}
  Location: ${job.location || 'Not specified'}
  Description: ${job.description || 'Not provided'}
  
  MY CURRENT CV:
  ${cv}
  
  Please act as an interactive interview coach and simulate a realistic job interview for this position. 
  
  First, analyze my CV and the job description to identify:
  1. Key skills and experience they're looking for
  2. Potential skill gaps I might have
  3. Likely interview questions for this role
  4. Parts of my background I should emphasize
  
  Then, start the interactive interview session where you:
  1. Ask me a relevant interview question
  2. Wait for my response
  3. Provide constructive feedback on my answer
  4. Move to the next question
  
  Include a mix of:
  - Technical questions related to the job
  - Behavioral questions
  - Questions about my experience and background
  - Questions about the company and industry
  - Challenging questions that might trip me up
  
  If I'm using a mobile device, remind me I can record my voice response instead of typing.
  
  At the end, provide overall feedback and tips to improve. Let's start the interview preparation now.`;
  }

  // Function to show job details
  function showJobDetails(job) {
    // Log this viewing
    trackFeatureUsage('view_job_details', { 
      job_title: job.title,
      company: job.company
    });
    
    // Check if this resulted from a search
    browser.storage.local.get('lastSearch').then(result => {
      const lastSearch = result.lastSearch;
      
      // If there was a recent search, log this as a search-to-selection
      if (lastSearch && lastSearch.timestamp) {
        // Check if the selection happened within 30 minutes of the search
        const searchTime = new Date(lastSearch.timestamp).getTime();
        const now = Date.now();
        const thirtyMinutesMs = 30 * 60 * 1000;
        
        if (now - searchTime < thirtyMinutesMs) {
          // Log this as a search result selection
          trackSearchToSelection(lastSearch, job);
        }
      }
    });
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'job-details-modal';
    
    // Create shortened description (first 300 chars)
    const shortDescription = job.description && job.description.length > 300 
      ? job.description.substring(0, 300) + '...' 
      : job.description || 'No description available';
    
    // Add content to modal
    modal.innerHTML = `
      <div class="job-details-content">
        <div class="job-details-header">
          <h3>${job.title || 'Untitled Position'}</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="job-details-body">
          <p><strong>Company:</strong> ${job.company || 'Not specified'}</p>
          <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
          <p><strong>URL:</strong> <a href="${job.url}" target="_blank">${job.url || 'Not available'}</a></p>
          <div class="job-description-preview">
            <h4>Description Preview:</h4>
            <p>${shortDescription}</p>
          </div>
          <div class="job-details-actions">
            <button class="view-full-description">View Full Description</button>
            <button class="open-original">Open Original Page</button>
            <button class="close-details">Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Show modal with fade-in effect
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Set up close button
    modal.querySelector('.close-modal').addEventListener('click', () => {
      closeModal(modal);
    });
    
    // Set up close details button
    modal.querySelector('.close-details').addEventListener('click', () => {
      closeModal(modal);
    });
    
    // Set up view full description button
    modal.querySelector('.view-full-description').addEventListener('click', () => {
      showFullDescription(job.description || 'No description available');
    });
    
    // Set up open original button
    modal.querySelector('.open-original').addEventListener('click', () => {
      if (job.url) {
        browser.tabs.create({ url: job.url });
      } else {
        alert('Original URL not available');
      }
    });
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  }

  // Function to show full description in a new modal
  function showFullDescription(description) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'job-details-modal full-description-modal';
    
    // Add content to modal
    modal.innerHTML = `
      <div class="job-details-content full-description-content">
        <div class="job-details-header">
          <h3>Full Job Description</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="job-details-body">
          <div class="full-description-text">
            ${description.replace(/\n/g, '<br>')}
          </div>
          <div class="job-details-actions">
            <button class="close-details">Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Show modal with fade-in effect
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Set up close button
    modal.querySelector('.close-modal').addEventListener('click', () => {
      closeModal(modal);
    });
    
    // Set up close details button
    modal.querySelector('.close-details').addEventListener('click', () => {
      closeModal(modal);
    });
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  }

  // Function to close modal
  function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300); // Wait for transition to complete
  }
  
  function removeSelectedJob() {
    const selectedJob = document.querySelector('.job-item.selected');
    
    if (selectedJob) {
      const jobIndex = parseInt(selectedJob.getAttribute('data-index'));
      
      browser.storage.local.get('savedJobs').then(result => {
        const savedJobs = result.savedJobs || [];
        
        // Remove job at index
        savedJobs.splice(jobIndex, 1);
        
        // Save updated jobs
        browser.storage.local.set({ savedJobs }).then(() => {
          loadSavedJobs();
          document.getElementById('job-actions').classList.add('hidden');
        });
      });
    }
  }
  
  function generateApplication() {
    const selectedJob = document.querySelector('.job-item.selected');
    
    if (selectedJob) {
      const jobIndex = parseInt(selectedJob.getAttribute('data-index'));
      
      // Get saved jobs and profile data
      Promise.all([
        browser.storage.local.get('savedJobs'),
        browser.storage.local.get('profileData')
      ]).then(([jobsResult, profileResult]) => {
        const savedJobs = jobsResult.savedJobs || [];
        const profileData = profileResult.profileData || {};
        
        const job = savedJobs[jobIndex];
        const cv = profileData.cv || '';
        
        if (!cv.trim()) {
          alert('Please add your CV in the Profile tab first.');
          // Switch to profile tab
          document.querySelector('[data-tab="profile"]').click();
          return;
        }
        
        // Log application generation for ML
        trackApplicationGeneration(job, cv);
        
        // Store the job for later matching with Claude's response
        browser.storage.local.set({ lastGeneratedJob: job });
        
        // Create prompt for Claude
        const prompt = createClaudePrompt(job, cv);
        
        // Copy prompt to clipboard
        navigator.clipboard.writeText(prompt).then(() => {
          // Open Claude in a new tab
          browser.tabs.create({ url: 'https://claude.ai' });
          
          // Show JSON input field in profile
          document.querySelector('.json-input').classList.remove('hidden');
          
          // Switch to profile tab
          document.querySelector('[data-tab="profile"]').click();
          
          alert('Prompt copied to clipboard! Paste it into Claude, then copy the JSON response back to the extension.');
        });
      });
    }
  }
  
  function createClaudePrompt(job, cv) {
    return `I need help creating:
    1. A tailored CV in JSON format to use with my template 
    2. A cover letter I can use directly
    
    JOB DETAILS:
    Title: ${job.title}
    Company: ${job.company}
    Location: ${job.location || 'Not specified'}
    Description: ${job.description || 'Not provided'}
    
    MY CURRENT CV:
    ${cv}
    
    First, please write me a great cover letter for this job that highlights my relevant experience and why I'm a good fit. Make it professional but engaging. Format the cover letter so it's ready to copy and paste directly into Google Docs or another word processor, with proper paragraphing, spacing, and a professional layout. Include my contact information at the top, the date, recipient details (if available from the job), and proper salutation and closing.
    
    Then, please provide my CV information in this exact JSON format that I'll copy back to my extension. It's critical that the JSON is well-formed and follows this exact structure:
    
    \`\`\`json
    {
      "fullName": "Your full name from my CV",
      "jobTitle": "A title that matches the job I'm applying for",
      "summary": "A concise professional summary tailored to this role",
      "email": "My email from CV",
      "linkedin": "My LinkedIn URL from CV (or create one based on my name)",
      "phone": "My phone number from CV",
      "location": "My location from CV",
      
      "experience": [
        {
          "jobTitle": "Position title",
          "company": "Company name",
          "dates": "Start date - End date (or Present)",
          "description": "Brief description of role focused on relevant responsibilities",
          "achievements": [
            "Achievement 1 with quantifiable results",
            "Achievement 2 with quantifiable results",
            "Achievement 3 with quantifiable results"
          ],
          "relevanceScore": 95
        }
      ],
      
      "education": [
        {
          "degree": "Degree name",
          "institution": "Institution name",
          "dates": "Start year - End year",
          "relevanceScore": 80
        }
      ],
      
      "skills": [
        "Technical: JavaScript, React, Node.js, Python, etc.",
        "Soft Skills: Communication, Leadership, Problem-solving, etc."
      ],
      
      "certifications": [
        "Certification 1 with year if available",
        "Certification 2 with year if available"
      ],
      
      "skillGapAnalysis": {
        "matchingSkills": ["List skills from my CV that match this job"],
        "missingSkills": ["Important skills mentioned in job that I don't have"],
        "overallMatch": 85
      }
    }
    \`\`\`
    
    Make sure the JSON follows this exact structure as my extension will parse it automatically. Prioritize skills and experience that are most relevant to the job description. For each experience and education item, add a relevanceScore from 0-100 indicating how relevant it is to this specific job. Also include the skillGapAnalysis section to help me understand my fit for the role.`;
  }
  
  // Profile Tab Functions

  // Load profile data
  function loadProfileData() {
    browser.storage.local.get('profileData').then(result => {
      if (result.profileData) {
        document.getElementById('cv').value = result.profileData.cv || '';
      }
    });
  }

  // Save profile data
  function saveProfileData() {
    const profileData = {
      cv: document.getElementById('cv').value
    };
    
    browser.storage.local.set({ profileData }).then(() => {
      alert('Profile saved successfully!');
    });
  }

  // Previews only CV
  function previewCVAndCoverLetter() {
    console.log("Preview button clicked!");
    
    const jsonInput = document.getElementById('cv-json').value;
    console.log("JSON input length:", jsonInput.length);
    
    if (!jsonInput.trim()) {
      alert('Please paste the JSON output from Claude first.');
      console.log("JSON input is empty - alert shown");
      return;
    }
    
    try {
      console.log("Attempting to parse JSON...");
      // Parse the JSON data
      const data = JSON.parse(jsonInput);
      console.log("JSON parsed successfully:", data);
      
      // Extract data for ML models from Claude's response
      extractDataFromClaudeResponse(jsonInput);
      
      // Create HTML content
      console.log("Creating HTML content...");
      const htmlContent = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional CV</title>
      <style>
          :root {
              --primary-color: #20BF55;
              --secondary-color: #104738;
              --text-color: #333;
              --light-text: #666;
              --accent-color: #0077B5;
              --background-color: #f5f5f5;
              --card-background: white;
              --heading-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              --body-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          }
  
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: var(--body-font);
          }
          
          body {
              background-color: var(--background-color);
              color: var(--text-color);
              line-height: 1.4;
              font-size: 14px;
              padding: 25px;
          }
          
          .cv-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: var(--card-background);
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
              padding: 30px;
          }
          
          /* Print button */
          .print-controls {
              max-width: 800px;
              margin: 20px auto;
              text-align: center;
          }
          
          .print-controls button {
              background-color: #0077B5;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 16px;
              cursor: pointer;
              border-radius: 4px;
              margin: 5px;
          }
          
          /* Header section */
          .header {
              display: table;
              width: 100%;
              margin-bottom: 25px;
              border-bottom: 1px solid #eee;
              padding-bottom: 15px;
          }
  
          .name-title {
              display: table-cell;
              width: 65%;
              vertical-align: top;
          }
  
          .contact-info {
              display: table-cell;
              width: 35%;
              vertical-align: top;
              text-align: right;
          }
          
          h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 2px;
          }
          
          h2 {
              font-size: 18px;
              font-weight: 500;
              color: var(--accent-color);
              margin-bottom: 10px;
          }
          
          .summary {
              font-size: 14px;
              margin-top: 8px;
              max-width: 95%;
              line-height: 1.4;
          }
          
          .contact-info-label {
              font-size: 13px;
              color: var(--light-text);
              margin-bottom: 2px;
              margin-top: 8px;
              font-weight: 500;
          }
          
          .contact-info-value {
              font-size: 13px;
              margin-bottom: 5px;
          }
          
          .contact-info a {
              color: var(--accent-color);
              text-decoration: none;
          }
          
          /* Main content layout */
          .content {
              display: table;
              width: 100%;
          }
  
          .left-column {
              display: table-cell;
              width: 65%;
              vertical-align: top;
              padding-right: 20px;
          }
  
          .right-column {
              display: table-cell;
              width: 35%;
              vertical-align: top;
          }
          
          /* Section styling */
          .section-title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 15px;
              color: var(--secondary-color);
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
          }
          
          /* Experience items */
          .job {
              margin-bottom: 15px;
          }
          
          .job-title {
              font-weight: 600;
              font-size: 15px;
              margin-bottom: 1px;
          }
          
          .job-company-date {
              display: table;
              width: 100%;
          }
          
          .job-company-date span:first-child {
              display: table-cell;
              text-align: left;
              font-size: 13px;
              color: var(--light-text);
              margin-bottom: 5px;
              font-style: italic;
          }
          
          .job-company-date span:last-child {
              display: table-cell;
              text-align: right;
              font-size: 13px;
              color: var(--light-text);
              margin-bottom: 5px;
              font-style: italic;
          }
          
          .job-description {
              font-size: 13px;
              margin-bottom: 3px;
              margin-top: 5px;
          }
          
          .job-achievements {
              padding-left: 18px;
              margin-top: 5px;
              font-size: 13px;
          }
          
          .job-achievements li {
              margin-bottom: 3px;
          }
          
          /* Education items */
          .education-item {
              margin-bottom: 12px;
          }
          
          .education-title {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 1px;
          }
          
          .education-inst-date {
              display: table;
              width: 100%;
          }
          
          .education-inst-date span:first-child {
              display: table-cell;
              text-align: left;
              font-size: 13px;
              color: var(--light-text);
              font-style: italic;
              margin-bottom: 3px;
          }
          
          .education-inst-date span:last-child {
              display: table-cell;
              text-align: right;
              font-size: 13px;
              color: var(--light-text);
              font-style: italic;
              margin-bottom: 3px;
          }
          
          /* Skills and other sections */
          .skills-list {
              margin-bottom: 15px;
          }
          
          .skill-category {
              font-weight: 600;
              display: inline;
          }
          
          /* Print styles */
          @media print {
              body {
                  padding: 0;
                  background-color: white;
                  font-size: 12px;
              }
              
              .cv-container {
                  box-shadow: none;
                  padding: 20px;
                  max-width: 100%;
              }
              
              .print-controls {
                  display: none;
              }
              
              h1 {
                  font-size: 22px;
              }
              
              h2 {
                  font-size: 16px;
              }
              
              .summary, .job-description, .job-achievements, .education-item, .skills-list {
                  font-size: 11px;
              }
              
              .section-title {
                  font-size: 14px;
              }
              
              .job, .education-item {
                  page-break-inside: avoid;
              }
              
              * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
          }
      </style>
  </head>
  <body>
      <div class="print-controls">
          <button onclick="window.print()">Print CV</button>
          <button onclick="window.close()">Close</button>
      </div>

      <div class="cv-container">
          <div class="header">
              <div class="name-title">
                  <h1>${data.fullName || ''}</h1>
                  <h2>${data.jobTitle || ''}</h2>
                  <p class="summary">${data.summary || ''}</p>
              </div>
              <div class="contact-info">
                  <div class="contact-info-label">Email</div>
                  <div class="contact-info-value"><a href="mailto:${data.email || ''}">${data.email || ''}</a></div>
          
                  <div class="contact-info-label">LinkedIn</div>
                  <div class="contact-info-value"><a href="${data.linkedin || ''}">${data.linkedin || ''}</a></div>
          
                  <div class="contact-info-label">Phone</div>
                  <div class="contact-info-value">${data.phone || ''}</div>
          
                  <div class="contact-info-label">Location</div>
                  <div class="contact-info-value">${data.location || ''}</div>
              </div>
          </div>
          
          <div class="content">
              <div class="left-column">
                  <h3 class="section-title">Work Experience</h3>
                  ${data.experience ? data.experience.map(exp => `
                      <div class="job">
                          <div class="job-title">${exp.jobTitle || ''}</div>
                          <div class="job-company-date">
                              <span>${exp.company || ''}</span>
                              <span>${exp.dates || ''}</span>
                          </div>
                          <div class="job-description">${exp.description || ''}</div>
                          ${exp.achievements ? `
                              <ul class="job-achievements">
                                  ${exp.achievements.map(achievement => `
                                      <li>${achievement}</li>
                                  `).join('')}
                              </ul>
                          ` : ''}
                      </div>
                  `).join('') : ''}
              </div>
          
              <div class="right-column">
                  <h3 class="section-title">Education</h3>
                  ${data.education ? data.education.map(edu => `
                      <div class="education-item">
                          <div class="education-title">${edu.degree || ''}</div>
                          <div class="education-inst-date">
                              <span>${edu.institution || ''}</span>
                              <span>${edu.dates || ''}</span>
                          </div>
                      </div>
                  `).join('') : ''}
          
                  <h3 class="section-title">Skills</h3>
                  <div class="skills-list">
                      ${data.skills ? data.skills.map(skill => `
                          <p>${skill}</p>
                      `).join('') : ''}
                  </div>
          
                  ${data.certifications && data.certifications.length > 0 ? `
                      <h3 class="section-title">Certifications</h3>
                      <div class="skills-list">
                          ${data.certifications.map(cert => `<p>${cert}</p>`).join('')}
                      </div>
                  ` : ''}
              </div>
          </div>
      </div>
  </body>
  </html>`;

      // Instead of using a data URL, we'll create a Blob and open it
      console.log("Creating blob...");
      const blob = new Blob([htmlContent], {type: 'text/html'});
      const blobUrl = URL.createObjectURL(blob);
      
      console.log("Opening new tab with blob URL...");
      // Open the blob URL in a new tab
      browser.tabs.create({ url: blobUrl }).then(() => {
        console.log("New tab created successfully");
      }).catch(err => {
        console.error("Error creating new tab:", err);
        alert("Error opening preview tab: " + err.message);
        
        // Try alternative method if the first one fails
        browser.tabs.create({ url: "about:blank" }).then(tab => {
          browser.tabs.executeScript(tab.id, {
            code: `document.documentElement.innerHTML = ${JSON.stringify(htmlContent)};`
          }).catch(error => {
            console.error("Error with executeScript:", error);
            alert("Could not create preview: " + error.message);
          });
        }).catch(error => {
          console.error("Error creating blank tab:", error);
          alert("Could not create preview: " + error.message);
        });
      });
      
    } catch (e) {
      console.error("Error parsing JSON:", e);
      alert('Error parsing JSON. Please make sure you pasted the correct format from Claude: ' + e.message);
    }
  }

  function generateCVPreview(jsonData) {
    // Load the modern template HTML
    const templateHTML = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional CV</title>
      <style>
          :root {
              --primary-color: #20BF55;
              --secondary-color: #104738;
              --text-color: #333;
              --light-text: #666;
              --accent-color: #0077B5;
              --background-color: #f5f5f5;
              --card-background: white;
              --heading-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              --body-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          }
  
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: var(--body-font);
          }
          
          body {
              background-color: var(--background-color);
              color: var(--text-color);
              line-height: 1.4;
              font-size: 14px;
              padding: 25px;
          }
          
          .cv-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: var(--card-background);
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
              padding: 30px;
          }
          
          /* Header section */
          .header {
              display: table;
              width: 100%;
              margin-bottom: 25px;
              border-bottom: 1px solid #eee;
              padding-bottom: 15px;
          }
  
          .name-title {
              display: table-cell;
              width: 65%;
              vertical-align: top;
          }
  
          .contact-info {
              display: table-cell;
              width: 35%;
              vertical-align: top;
              text-align: right;
          }
          
          h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 2px;
          }
          
          h2 {
              font-size: 18px;
              font-weight: 500;
              color: var(--accent-color);
              margin-bottom: 10px;
          }
          
          .summary {
              font-size: 14px;
              margin-top: 8px;
              max-width: 95%;
              line-height: 1.4;
          }
          
          .contact-info-label {
              font-size: 13px;
              color: var(--light-text);
              margin-bottom: 2px;
              margin-top: 8px;
              font-weight: 500;
          }
          
          .contact-info-value {
              font-size: 13px;
              margin-bottom: 5px;
          }
          
          .contact-info a {
              color: var(--accent-color);
              text-decoration: none;
          }
          
          /* Main content layout */
          .content {
              display: table;
              width: 100%;
          }
  
          .left-column {
              display: table-cell;
              width: 65%;
              vertical-align: top;
              padding-right: 20px;
          }
  
          .right-column {
              display: table-cell;
              width: 35%;
              vertical-align: top;
          }
          
          /* Section styling */
          .section-title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 15px;
              color: var(--secondary-color);
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
          }
          
          /* Experience items */
          .job {
              margin-bottom: 15px;
          }
          
          .job-title {
              font-weight: 600;
              font-size: 15px;
              margin-bottom: 1px;
          }
          
          .job-company-date {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              color: var(--light-text);
              margin-bottom: 5px;
              font-style: italic;
          }
          
          .job-description {
              font-size: 13px;
              margin-bottom: 3px;
          }
          
          .job-achievements {
              padding-left: 18px;
              margin-top: 5px;
              font-size: 13px;
          }
          
          .job-achievements li {
              margin-bottom: 3px;
          }
          
          /* Education items */
          .education-item {
              margin-bottom: 12px;
          }
          
          .education-title {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 1px;
          }
          
          .education-inst-date {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              color: var(--light-text);
              font-style: italic;
              margin-bottom: 3px;
          }
  
          .job-company-date, .education-inst-date {
              display: table;
              width: 100%;
          }
  
          .job-company-date span:first-child,
          .education-inst-date span:first-child {
              display: table-cell;
              text-align: left;
          }
  
          .job-company-date span:last-child,
          .education-inst-date span:last-child {
              display: table-cell;
              text-align: right;
          }
          
          /* Skills and other sections */
          .skills-list {
              margin-bottom: 15px;
          }
          
          .skill-category {
              font-weight: 600;
              display: inline;
          }
          
          /* Print styles */
          @media print {
              body {
                  padding: 0;
                  background-color: white;
                  font-size: 12px;
              }
              
              .cv-container {
                  box-shadow: none;
                  padding: 20px;
                  max-width: 100%;
              }
              
              h1 {
                  font-size: 22px;
              }
              
              h2 {
                  font-size: 16px;
              }
              
              .summary, .job-description, .job-achievements, .education-item, .skills-list {
                  font-size: 11px;
              }
              
              .section-title {
                  font-size: 14px;
              }
          }
  
          /* Enhanced print styles */
          @media print {
              body {
                  padding: 0;
                  background-color: white;
                  font-size: 12px;
              }
              
              .cv-container {
                  box-shadow: none;
                  padding: 20px;
                  max-width: 100%;
                  margin: 0;
              }
              
              h1 {
                  font-size: 22px;
              }
              
              h2 {
                  font-size: 16px;
              }
              
              .summary, .job-description, .job-achievements, .education-item, .skills-list {
                  font-size: 11px;
              }
              
              .section-title {
                  font-size: 14px;
              }
              
              /* Ensure page breaks don't occur in the middle of sections */
              .job, .education-item {
                  page-break-inside: avoid;
              }
              
              /* Ensure colors print properly - using the prefixed version only */
              * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
          }
  
          /* Responsive styles */
          @media (max-width: 768px) {
              .content, .header {
                  display: block; /* Change from table to block for mobile */
              }
              .name-title, .contact-info, .left-column, .right-column {
                  display: block;
                  width: 100%;
                  text-align: left;
              }
              
              .contact-info {
                  text-align: left;
                  margin-top: 15px;
              }
              
              .left-column, .right-column {
                  width: 100%;
              }
          }
          
          /* Cover Letter Styles */
          .cover-letter-container {
              max-width: 800px;
              margin: 50px auto 0;
              background-color: var(--card-background);
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
              padding: 30px;
          }
          
          .cover-letter-header {
              margin-bottom: 30px;
          }
          
          .cover-letter-applicant {
              margin-bottom: 20px;
          }
          
          .cover-letter-recipient {
              margin-bottom: 20px;
          }
          
          .cover-letter-greeting {
              margin-bottom: 20px;
          }
          
          .cover-letter-content {
              margin-bottom: 20px;
          }
          
          .cover-letter-closing {
              margin-bottom: 10px;
          }
          
          .cover-letter-signature {
              margin-top: 30px;
          }
          
          .print-controls {
              max-width: 800px;
              margin: 20px auto;
              text-align: center;
          }
          
          .print-controls button {
              background-color: var(--accent-color);
              color: white;
              border: none;
              padding: 10px 15px;
              margin: 0 5px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
          }
          
          .print-controls button:hover {
              background-color: #005582;
          }
          
          @media print {
              .print-controls {
                  display: none;
              }
              
              .cover-letter-container {
                  break-before: page;
              }
          }
      </style>
  </head>
  <body>
      <div class="print-controls">
          <button onclick="window.print()">Print CV</button>
          <button onclick="window.close()">Close</button>
          <p class="print-tip">If our print button doesn't work, press CTRL+P (or CMD+P on Mac) to print.</p>
      </div>
  
      <div class="cv-container">
          <div class="header">
              <div class="name-title">
                  <h1>{{fullName}}</h1>
                  <h2>{{jobTitle}}</h2>
                  <p class="summary">{{summary}}</p>
              </div>
              <div class="contact-info">
                  <div class="contact-info-label">Email</div>
                  <div class="contact-info-value"><a href="mailto:{{email}}">{{email}}</a></div>
          
                  <div class="contact-info-label">LinkedIn</div>
                  <div class="contact-info-value"><a href="{{linkedin}}">{{linkedin}}</a></div>
          
                  <div class="contact-info-label">Phone</div>
                  <div class="contact-info-value">{{phone}}</div>
          
                  <div class="contact-info-label">Location</div>
                  <div class="contact-info-value">{{location}}</div>
              </div>
          </div>
          
          <div class="content">
              <div class="left-column">
                  <h3 class="section-title">Work experience</h3>
                  {{experience}}
              </div>
          
              <div class="right-column">
                  <h3 class="section-title">Education & Learning</h3>
                  {{education}}
          
                  <h3 class="section-title">Skills</h3>
                  <div class="skills-list">
                      {{skills}}
                  </div>
          
                  <h3 class="section-title">Certifications</h3>
                  <div class="skills-list">
                      {{certifications}}
                  </div>
              </div>
          </div>
      </div>
      
      <div class="cover-letter-container">
          <div class="cover-letter-header">
              <h1>Cover Letter</h1>
          </div>
          
          <div class="cover-letter-applicant">
              <p>{{fullName}}</p>
              <p>{{email}}</p>
              <p>{{phone}}</p>
              <p>{{location}}</p>
          </div>
          
          <div class="cover-letter-greeting">
              <p>{{coverLetterGreeting}}</p>
          </div>
          
          <div class="cover-letter-content">
              {{coverLetterBody}}
          </div>
          
          <div class="cover-letter-closing">
              <p>{{coverLetterClosing}}</p>
          </div>
          
          <div class="cover-letter-signature">
              <p>{{coverLetterSignature}}</p>
          </div>
      </div>
      
      <script>
          function printCV() {
              document.querySelector('.cover-letter-container').style.display = 'none';
              window.print();
              document.querySelector('.cover-letter-container').style.display = 'block';
          }
          
          function printCoverLetter() {
              document.querySelector('.cv-container').style.display = 'none';
              window.print();
              document.querySelector('.cv-container').style.display = 'block';
          }
      </script>
  </body>
  </html>`;
  
    try {
      const data = JSON.parse(jsonData);
      
      // Replace placeholders with actual data
      let filledTemplate = templateHTML
        .replace('{{fullName}}', data.fullName || '')
        .replace('{{jobTitle}}', data.jobTitle || '')
        .replace('{{summary}}', data.summary || '')
        .replace('{{email}}', data.email || '')
        .replace('{{linkedin}}', data.linkedin || '')
        .replace('{{phone}}', data.phone || '')
        .replace('{{location}}', data.location || '');
      
      // Handle experience section - using the HTML directly from JSON
      let experienceHTML = '';
      if (data.experience && Array.isArray(data.experience)) {
        experienceHTML = data.experience.join('\n');
      }
      filledTemplate = filledTemplate.replace('{{experience}}', experienceHTML);
      
      // Handle education section - using the HTML directly from JSON
      let educationHTML = '';
      if (data.education && Array.isArray(data.education)) {
        educationHTML = data.education.join('\n');
      }
      filledTemplate = filledTemplate.replace('{{education}}', educationHTML);
      
      // Handle skills section - using the HTML directly from JSON
      let skillsHTML = '';
      if (data.skills && Array.isArray(data.skills)) {
        skillsHTML = data.skills.map(skill => `<p>${skill}</p>`).join('\n');
      }
      filledTemplate = filledTemplate.replace('{{skills}}', skillsHTML);
      
      // Handle certifications section - using the HTML directly from JSON
      let certificationsHTML = '';
      if (data.certifications && Array.isArray(data.certifications)) {
        certificationsHTML = data.certifications.map(cert => `<p>${cert}</p>`).join('\n');
      }
      filledTemplate = filledTemplate.replace('{{certifications}}', certificationsHTML);
      
      // Handle cover letter sections
      if (data.coverLetter) {
        filledTemplate = filledTemplate
          .replace('{{coverLetterGreeting}}', data.coverLetter.greeting || '')
          .replace('{{coverLetterBody}}', data.coverLetter.body.split('\n').map(para => `<p>${para}</p>`).join('\n') || '')
          .replace('{{coverLetterClosing}}', data.coverLetter.closing || '')
          .replace('{{coverLetterSignature}}', data.coverLetter.signature.replace(/\\n/g, '<br>') || '');
      }
      
      return filledTemplate;
    } catch (e) {
      console.error("Error generating CV preview:", e);
      return `<html><body><h1>Error</h1><p>There was an error generating your CV preview: ${e.message}</p></body></html>`;
    }
  }
  
  function generateCVAndCoverLetterHTML(data, templateStyle) {
    // Implement different styles based on templateStyle
    const styles = {
      professional: {
        fontFamily: '"Calibri", "Helvetica Neue", sans-serif',
        primaryColor: '#2c3e50',
        secondaryColor: '#3498db',
        backgroundColor: '#ffffff'
      },
      creative: {
        fontFamily: '"Montserrat", "Avenir Next", sans-serif',
        primaryColor: '#8e44ad',
        secondaryColor: '#e74c3c',
        backgroundColor: '#f9f9f9'
      },
      minimal: {
        fontFamily: '"Open Sans", "Segoe UI", sans-serif',
        primaryColor: '#333333',
        secondaryColor: '#7f8c8d',
        backgroundColor: '#ffffff'
      },
      academic: {
        fontFamily: '"Georgia", "Times New Roman", serif',
        primaryColor: '#34495e',
        secondaryColor: '#16a085',
        backgroundColor: '#ffffff'
      }
    };
    
    const style = styles[templateStyle] || styles.professional;
    
    // Generate HTML with embedded CSS
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CV & Cover Letter Preview</title>
        <style>
          body {
            font-family: ${style.fontFamily};
            color: ${style.primaryColor};
            background-color: ${style.backgroundColor};
            margin: 0;
            padding: 20px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .page {
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 40px;
            background-color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          h1, h2, h3 {
            color: ${style.primaryColor};
          }
          
          h1 {
            margin-top: 0;
            border-bottom: 2px solid ${style.secondaryColor};
            padding-bottom: 10px;
          }
          
          h2 {
            border-bottom: 1px solid ${style.secondaryColor};
            padding-bottom: 5px;
            margin-top: 25px;
          }
          
          .contact-info {
            margin-bottom: 20px;
            color: ${style.secondaryColor};
          }
          
          .experience-item, .education-item {
            margin-bottom: 15px;
          }
          
          .experience-title, .education-degree {
            font-weight: bold;
          }
          
          .experience-company, .education-institution {
            color: ${style.secondaryColor};
          }
          
          .experience-dates, .education-dates {
            font-style: italic;
            font-size: 0.9em;
          }
          
          ul.skills-list, ul.responsibilities-list, ul.certifications-list {
            padding-left: 20px;
          }

          .print-tip {
            margin: 5px 0;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          
          .print-buttons {
            margin-bottom: 20px;
            text-align: center;
          }
          
          .print-buttons button {
            padding: 10px 20px;
            background-color: ${style.secondaryColor};
            color: white;
            border: none;
            border-radius: 4px;
            margin: 0 10px;
            cursor: pointer;
            font-size: 14px;
          }
          
          @media print {
            .print-buttons {
              display: none;
            }
            
            .page {
              margin: 0;
              border: none;
              padding: 0;
              box-shadow: none;
            }
            
            @page {
              size: A4;
              margin: 2cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="print-buttons">
            <button onclick="window.print()">Print Both</button>
            <button onclick="printCV()">Print CV Only</button>
            <button onclick="printCoverLetter()">Print Cover Letter Only</button>
            <button onclick="window.close()">Close Preview</button>
          </div>
          
          <!-- CV Page -->
          <div id="cv-page" class="page">
            <h1>${data.tailoredCV.name}</h1>
            
            <div class="contact-info">
              ${data.tailoredCV.contactInfo.email} | ${data.tailoredCV.contactInfo.phone} | ${data.tailoredCV.contactInfo.location}
            </div>
            
            <div class="summary">
              ${data.tailoredCV.summary}
            </div>
            
            <h2>Experience</h2>
            ${data.tailoredCV.experience.map(exp => `
              <div class="experience-item">
                <div class="experience-title">${exp.title}</div>
                <div class="experience-company">${exp.company}</div>
                <div class="experience-dates">${exp.dates}</div>
                <ul class="responsibilities-list">
                  ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
            
            <h2>Education</h2>
            ${data.tailoredCV.education.map(edu => `
              <div class="education-item">
                <div class="education-degree">${edu.degree}</div>
                <div class="education-institution">${edu.institution}</div>
                <div class="education-dates">${edu.dates}</div>
              </div>
            `).join('')}
            
            <h2>Skills</h2>
            <ul class="skills-list">
              ${data.tailoredCV.skills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
            
            ${data.tailoredCV.certifications && data.tailoredCV.certifications.length > 0 ? `
              <h2>Certifications</h2>
              <ul class="certifications-list">
                ${data.tailoredCV.certifications.map(cert => `<li>${cert}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          
          <!-- Cover Letter Page -->
          <div id="cover-letter-page" class="page">
            <h1>Cover Letter</h1>
            
            <div class="contact-info" style="margin-bottom: 30px;">
              ${data.tailoredCV.name}<br>
              ${data.tailoredCV.contactInfo.email}<br>
              ${data.tailoredCV.contactInfo.phone}<br>
              ${data.tailoredCV.contactInfo.location}
            </div>
            
            <div class="cover-letter-content">
              <p>${data.coverLetter.greeting}</p>
              
              <p>${data.coverLetter.opening}</p>
              
              ${data.coverLetter.body.split('\n').map(para => `<p>${para}</p>`).join('')}
            
            <p>${data.coverLetter.closing}</p>
            
            <p>${data.coverLetter.signature}</p>
          </div>
        </div>
      </div>
      
      <script>
        function printCV() {
          document.getElementById('cover-letter-page').style.display = 'none';
          window.print();
          document.getElementById('cover-letter-page').style.display = 'block';
        }
        
        function printCoverLetter() {
          document.getElementById('cv-page').style.display = 'none';
          window.print();
          document.getElementById('cv-page').style.display = 'block';
        }
      </script>
    </body>
    </html>
    `;
  }

  // ============== CONSOLIDATED DATA COLLECTION SYSTEM ===============

  // Configuration parameters
  const DATA_COLLECTION = {
    // Google Apps Script endpoint
    endpointUrl: 'https://script.google.com/macros/s/AKfycbyJSZQKHvaubK4UaXgQuMEBbH1eXFYedlKz6kwsKaLUuEY3xmx2xcJ82MmWXTU26VAD/exec',
    // Queue processing settings
    queue: {
      processingInterval: 1000,      // Process queue items every 1 second
      maxRetries: 5,                 // Maximum number of retries per item
      maxConcurrentRequests: 3,      // Max concurrent requests to avoid overwhelming the API
      retryDelayBase: 2000,          // Base delay before retry (will be multiplied by 2^retryCount)
      maxRetryDelay: 60000,          // Maximum retry delay (1 minute)
      persistenceInterval: 30000,    // Save queue to storage every 30 seconds
      maxQueueSize: 1000             // Maximum number of items in the queue
    },
    // Storage keys
    storage: {
      queueKey: 'dataCollectionQueue',
      activeRequestsKey: 'dataCollectionActiveRequests',
      userIdKey: 'userId'
    }
  };

  // Queue state
  let dataQueue = [];                // Main queue of items to be sent
  let activeRequests = 0;            // Number of active requests
  let queueProcessor = null;         // Interval ID for queue processor
  let queueInitialized = false;      // Flag to prevent multiple initializations
  let lastQueuePersistence = 0;      // Last time queue was persisted to storage

  // Initialize the data collection system
  function initializeDataCollection() {
    if (queueInitialized) return;
    
    console.log("Initializing data collection system...");
    
    // Load queue from storage
    Promise.all([
      browser.storage.local.get(DATA_COLLECTION.storage.queueKey),
      browser.storage.local.get(DATA_COLLECTION.storage.activeRequestsKey)
    ]).then(([queueResult, activeResult]) => {
      // Restore queue state
      if (queueResult[DATA_COLLECTION.storage.queueKey]) {
        dataQueue = queueResult[DATA_COLLECTION.storage.queueKey];
        console.log(`Loaded ${dataQueue.length} items from persistent queue`);
      }
      
      // Restore active requests count (default to 0 if not found)
      activeRequests = activeResult[DATA_COLLECTION.storage.activeRequestsKey] || 0;
      
      // Reset active requests if it's an unreasonable value (might happen if extension crashed)
      if (activeRequests > DATA_COLLECTION.queue.maxConcurrentRequests) {
        console.warn(`Resetting unreasonable active requests count: ${activeRequests}`);
        activeRequests = 0;
      }
      
      // Start queue processor
      startQueueProcessor();
      
      // Mark as initialized
      queueInitialized = true;
      lastQueuePersistence = Date.now();
      
      console.log("Data collection system initialized");
    });
    
    // Set up unload handler to persist queue when extension is closed
    window.addEventListener('beforeunload', persistQueue);
  }

  // Start the queue processor
  function startQueueProcessor() {
    if (queueProcessor) {
      clearInterval(queueProcessor);
    }
    
    queueProcessor = setInterval(() => {
      processQueue();
      
      // Periodically persist queue to storage
      if (Date.now() - lastQueuePersistence > DATA_COLLECTION.queue.persistenceInterval) {
        persistQueue();
      }
    }, DATA_COLLECTION.queue.processingInterval);
  }

  // Persist queue to storage
  function persistQueue() {
    if (dataQueue.length > 0) {
      browser.storage.local.set({
        [DATA_COLLECTION.storage.queueKey]: dataQueue,
        [DATA_COLLECTION.storage.activeRequestsKey]: activeRequests
      }).then(() => {
        console.log(`Persisted ${dataQueue.length} items to queue storage`);
        lastQueuePersistence = Date.now();
      }).catch(error => {
        console.error("Error persisting queue:", error);
      });
    }
  }

  // Add an item to the queue
  function queueDataItem(dataItem) {
    // Initialize if needed
    if (!queueInitialized) {
      initializeDataCollection();
    }
    
    // Check queue size
    if (dataQueue.length >= DATA_COLLECTION.queue.maxQueueSize) {
      console.warn(`Queue size limit reached (${DATA_COLLECTION.queue.maxQueueSize}). Dropping oldest item.`);
      dataQueue.shift(); // Remove oldest item
    }
    
    // Add item to queue with metadata
    dataQueue.push({
      data: dataItem,
      status: 'pending',
      retryCount: 0,
      timestamp: Date.now(),
      id: generateUniqueId()
    });
    
    console.log(`Added item to queue. Queue size: ${dataQueue.length}`);
    
    // If queue is getting large, persist it immediately
    if (dataQueue.length > 10) {
      persistQueue();
    }
  }

  // Generate a unique ID for queue items
  function generateUniqueId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  }

  // Process the queue
  function processQueue() {
    // Skip if there's nothing to process
    if (dataQueue.length === 0) return;
    
    // Process as many items as we can based on concurrency limit
    while (dataQueue.length > 0 && activeRequests < DATA_COLLECTION.queue.maxConcurrentRequests) {
      // Find the next pending item
      const itemIndex = dataQueue.findIndex(item => item.status === 'pending');
      if (itemIndex === -1) break; // No pending items
      
      const queueItem = dataQueue[itemIndex];
      
      // Mark as processing and increment active requests
      queueItem.status = 'processing';
      activeRequests++;
      
      // Send the request
      sendDataRequest(queueItem, itemIndex);
    }
  }

  // Calculate retry delay with exponential backoff
  function calculateRetryDelay(retryCount) {
    const delay = Math.min(
      DATA_COLLECTION.queue.retryDelayBase * Math.pow(2, retryCount),
      DATA_COLLECTION.queue.maxRetryDelay
    );
    
    // Add jitter to prevent all retries happening at once
    return delay + (Math.random() * 1000);
  }

  // Send a data request to the Google Apps Script
  function sendDataRequest(queueItem, queueIndex) {
    fetch(DATA_COLLECTION.endpointUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queueItem.data),
    })
    .then(() => {
      // Request completed successfully
      console.log(`Request completed successfully: ${queueItem.id}`);
      
      // Remove from queue
      dataQueue.splice(queueIndex, 1);
      activeRequests--;
    })
    .catch(error => {
      // Request failed
      console.error(`Request failed: ${queueItem.id}`, error);
      
      // Decrement active requests
      activeRequests--;
      
      // Handle retry logic
      if (queueItem.retryCount < DATA_COLLECTION.queue.maxRetries) {
        // Schedule retry with exponential backoff
        queueItem.retryCount++;
        queueItem.status = 'waiting';
        queueItem.nextRetry = Date.now() + calculateRetryDelay(queueItem.retryCount);
        
        console.log(`Scheduled retry ${queueItem.retryCount}/${DATA_COLLECTION.queue.maxRetries} for item ${queueItem.id} in ${Math.round((queueItem.nextRetry - Date.now())/1000)}s`);
        
        // Set a timeout to mark the item as pending again after the delay
        setTimeout(() => {
          if (dataQueue.includes(queueItem)) {
            queueItem.status = 'pending';
            console.log(`Item ${queueItem.id} is now pending for retry`);
          }
        }, queueItem.nextRetry - Date.now());
      } else {
        // Max retries reached, mark as failed
        console.warn(`Max retries reached for item ${queueItem.id}. Marking as failed.`);
        queueItem.status = 'failed';
        
        // Keep failed items in the queue for possible manual retry later
        // They will be persisted to storage
      }
    });
  }

  // Create or get anonymous user ID
  async function getOrCreateUserId() {
    try {
      const result = await browser.storage.local.get(DATA_COLLECTION.storage.userIdKey);
      let userId = result[DATA_COLLECTION.storage.userIdKey];
      
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 15);
        await browser.storage.local.set({ [DATA_COLLECTION.storage.userIdKey]: userId });
        console.log("Created new user ID:", userId);
      }
      
      return userId;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return 'temp_' + Math.random().toString(36).substring(2, 15);
    }
  }

  // Main function to track events - use this for all data tracking
  async function trackEvent(eventType, eventData = {}) {
    try {
      const userId = await getOrCreateUserId();
      
      // Create data object with common fields
      const data = {
        type: eventType,
        timestamp: new Date().toISOString(),
        user_id: userId,
        ...eventData
      };
      
      // Add to queue
      queueDataItem(data);
      
      return true;
    } catch (error) {
      console.error("Error tracking event:", error);
      return false;
    }
  }

  // SPECIFIC EVENT TRACKING FUNCTIONS

  // Track feature usage (button clicks, tab views, etc.)
  function trackFeatureUsage(featureName, additionalData = {}) {
    return trackEvent('feature_usage', {
      feature: featureName,
      ...additionalData
    });
  }

  // Track when a job is saved
  function trackJobSaved(job) {
    return trackEvent('job_saved', {
      job_title: job.title || 'Unknown Title',
      company: job.company || 'Unknown Company',
      location: job.location || '',
      url: job.url || '',
      source_domain: job.url ? new URL(job.url).hostname : '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      experience_level: job.experienceLevel || '',
      description_snippet: job.description ? 
        job.description.substring(0, 200) + (job.description.length > 200 ? '...' : '') : ''
    });
  }

  // Track search to selection behavior
  function trackSearchToSelection(searchData, selectedJob) {
    return trackEvent('search_to_selection', {
      search_platform: searchData.platform || '',
      search_term: searchData.role || '',
      search_location: searchData.location || '',
      selected_job_title: selectedJob.title || '',
      selected_job_company: selectedJob.company || '',
      time_to_selection: searchData.timestamp ? 
        Math.round((Date.now() - new Date(searchData.timestamp).getTime()) / 1000) + ' seconds' : 'unknown'
    });
  }

  // Track when a user generates an application
  function trackApplicationGeneration(job, cv) {
    return trackEvent('application_generated', {
      job_title: job.title || '',
      company: job.company || '',
      has_cv: cv ? 'yes' : 'no'
    });
  }

  // Track CV and job matching data
  function trackCVJobMatch(job, cv, cvSkills, claudeData) {
    return trackEvent('cv_job_match', {
      job_title: job.title || '',
      company: job.company || '',
      job_location: job.location || '',
      cv_skills: Array.isArray(cvSkills) ? cvSkills.join(', ') : '',
      matched_job_title: claudeData.jobTitle || '',
      tailored_summary: claudeData.summary || '',
      education: Array.isArray(claudeData.education) ?
        claudeData.education.map(e => `${e.degree}: ${e.institution}`).join('; ') : '',
      highlighted_experience: Array.isArray(claudeData.experience) ?
        claudeData.experience.map(e => e.jobTitle).join('; ') : ''
    });
  }

  // Function to store the last search for tracking
  function storeLastSearch(platform, role, location, experience) {
    browser.storage.local.set({
      lastSearch: {
        platform: platform,
        role: role,
        location: location,
        experience: experience,
        timestamp: new Date().toISOString()
      }
    });
    
    // Track this search event
    trackFeatureUsage('search', {
      platform: platform,
      search_term: role,
      search_location: location,
      experience_level: experience
    });
  }

  // Extract CV and job data from Claude's JSON response
  function extractDataFromClaudeResponse(jsonData) {
    try {
      // Parse the JSON data from Claude
      const data = JSON.parse(jsonData);
      
      // Get stored job and CV data to associate with this response
      browser.storage.local.get(['lastGeneratedJob', 'profileData']).then(result => {
        const job = result.lastGeneratedJob || {};
        const cv = result.profileData?.cv || '';
        
        // Extract skills from Claude's JSON
        const cvSkills = [];
        if (data.skills && Array.isArray(data.skills)) {
          // Extract all skills that Claude identified
          data.skills.forEach(skillSet => {
            const skills = skillSet.split(':');
            if (skills.length > 1) {
              // Get the skills after the category
              const skillList = skills[1].split(',').map(s => s.trim());
              cvSkills.push(...skillList);
            } else {
              cvSkills.push(skillSet);
            }
          });
        }
        
        // Track the enriched data
        trackCVJobMatch(job, cv, cvSkills, data);
      });
      
    } catch (error) {
      console.error("Error extracting data from Claude response:", error);
    }
  }

  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "trackJobSaved") {
      trackEvent('job_saved', message.jobData);
      return Promise.resolve({success: true});
    }
    return false;
  });