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
    document.getElementById('search-ai').addEventListener('click', searchWithAI);
    
    // Setup profile save button
    document.getElementById('save-profile').addEventListener('click', saveProfileData);
    
    // Setup job actions
    document.getElementById('generate-application').addEventListener('click', generateApplication);
    document.getElementById('remove-job').addEventListener('click', removeSelectedJob);
    
    // Setup CV preview button
    document.getElementById('preview-cv').addEventListener('click', previewCVAndCoverLetter);
  });
  
  // Find Jobs Tab Functions
  function searchOnLinkedIn() {
    const role = encodeURIComponent(document.getElementById('role').value);
    const location = encodeURIComponent(document.getElementById('location').value);
    const experience = document.getElementById('experience').value;
    
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
    const role = encodeURIComponent(document.getElementById('role').value);
    const location = encodeURIComponent(document.getElementById('location').value);
    
    // LinkedIn feed with search parameters
    const url = `https://www.linkedin.com/feed/jobs/?keywords=${role}&location=${location}`;
    
    browser.tabs.create({ url });
  }
  
  function searchOnGoogle() {
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    
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
  
  function searchWithAI() {
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    const experience = document.getElementById('experience').value;
    
    // Create a more sophisticated prompt for Perplexity as requested
    let prompt = `Find recent open`;
    
    // Add location type (remote or specific location)
    if (location.toLowerCase().includes('remote')) {
      prompt += ` remote`;
    } else if (location) {
      prompt += ` ${location}`;
    }
    
    // Add job posting timeframe and variations of the role
    prompt += ` job postings for "${role}"`;
    
    // Add role variations
    const roleParts = role.split(' ');
    if (roleParts.length > 1) {
      prompt += ` OR "${roleParts[0]} ${roleParts[roleParts.length-1]}"`;
      prompt += ` OR "${roleParts[roleParts.length-1]}"`;
    }
    
    prompt += ` posted in the last 30 days.`;
    
    // Add exclusions
    if (location.toLowerCase().includes('remote')) {
      prompt += ` Exclude positions requiring location restrictions, specific time zones, or work authorization in specific countries.`;
    }
    
    // Add industry focus
    prompt += ` Focus on SaaS platforms, educational technology companies, and technology organizations.`;
    
    // Add responsibility focus based on role keywords
    if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead')) {
      prompt += ` Include roles that mention leadership, strategy, and team management as key responsibilities.`;
    } else if (role.toLowerCase().includes('developer') || role.toLowerCase().includes('engineer')) {
      prompt += ` Include roles that mention product development, coding, and technical implementation as key responsibilities.`;
    } else if (role.toLowerCase().includes('designer')) {
      prompt += ` Include roles that mention user experience, design systems, and creative problem-solving as key responsibilities.`;
    } else if (role.toLowerCase().includes('community') || role.toLowerCase().includes('support')) {
      prompt += ` Include roles that mention engagement, growth, and program development as key responsibilities.`;
    } else {
      prompt += ` Include details about required skills, experience level, and primary responsibilities.`;
    }
    
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
          
          jobItem.innerHTML = `
            <div class="job-title">${job.title}</div>
            <div class="job-company">${job.company}</div>
            <div class="job-location">${job.location || 'Location not specified'}</div>
          `;
          
          jobItem.addEventListener('click', () => {
            // Toggle selection
            document.querySelectorAll('.job-item').forEach(item => {
              item.classList.remove('selected');
            });
            
            jobItem.classList.add('selected');
            jobActions.classList.remove('hidden');
          });
          
          savedJobsList.appendChild(jobItem);
        });
      } else {
        savedJobsList.innerHTML = '<div class="empty-state">No saved jobs yet.</div>';
        jobActions.classList.add('hidden');
      }
    });
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
        const careerGoals = profileData.careerGoals || '';
        
        if (!cv.trim()) {
          alert('Please add your CV in the Profile tab first.');
          // Switch to profile tab
          document.querySelector('[data-tab="profile"]').click();
          return;
        }
        
        // Create prompt for Claude
        const prompt = createClaudePrompt(job, cv, careerGoals);
        
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
  
  function createClaudePrompt(job, cv, careerGoals) {
    return `I need help customizing my CV and creating a cover letter for a job application. Please structure your response as JSON that can be used with my template.
  
  JOB DETAILS:
  Title: ${job.title}
  Company: ${job.company}
  Location: ${job.location || 'Not specified'}
  Description: ${job.description || 'Not provided'}
  
  MY CURRENT CV:
  ${cv}
  
  CAREER GOALS:
  ${careerGoals}
  
  Please create a JSON object with exactly the following structure that will be used to populate my CV template:
  
  {
    "fullName": "Your full name extracted from my CV",
    "jobTitle": "Suggested job title based on the target role",
    "summary": "A compelling professional summary tailored to this role (max 2 sentences)",
    "email": "My email from the CV",
    "linkedin": "My LinkedIn URL (if in CV) or just 'linkedin.com/in/yourname' as placeholder",
    "phone": "My phone number from the CV",
    "location": "My location from the CV",
    
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
        ]
      }
    ],
    
    "education": [
      {
        "degree": "Degree name",
        "institution": "Institution name",
        "dates": "Start year - End year"
      }
    ],
    
    "skills": [
      "Skill category 1: Specific skills listed comma-separated",
      "Skill category 2: Specific skills listed comma-separated"
    ],
    
    "certifications": [
      "Certification 1 with year if available",
      "Certification 2 with year if available"
    ],
    
    "coverLetter": {
      "greeting": "Dear Hiring Manager,",
      "opening": "A compelling opening paragraph expressing interest in the role",
      "body": "2-3 paragraphs highlighting relevant experience and why I'm a good fit",
      "closing": "A brief closing paragraph with a call to action",
      "signature": "Sincerely,\\nMy Name"
    }
  }
  
  Important formatting requirements:
  1. Format the experience section with each job as:
     <div class="job">
       <div class="job-title">Job Title</div>
       <div class="job-company-date">
         <span>Company Name</span>
         <span>Start Date - End Date</span>
       </div>
       <div class="job-description">Brief description of responsibilities</div>
       <ul class="job-achievements">
         <li>Achievement 1</li>
         <li>Achievement 2</li>
         <li>Achievement 3</li>
       </ul>
     </div>
  
  2. Format the education section with each item as:
     <div class="education-item">
       <div class="education-title">Degree Name</div>
       <div class="education-inst-date">
         <span>Institution Name</span>
         <span>Start Year - End Year</span>
       </div>
     </div>
  
  3. Format skills as a list of paragraphs with categories in bold:
     <p><span class="skill-category">Category 1:</span> Skill 1, Skill 2, Skill 3</p>
     <p><span class="skill-category">Category 2:</span> Skill 4, Skill 5, Skill 6</p>
  
  4. Format certifications as a simple list:
     <p>Certification 1</p>
     <p>Certification 2</p>
  
  Please return ONLY the JSON object, with no additional explanation or commentary. Make sure all HTML formatting is included directly in the JSON string values.`;
  }
  
  // Profile Tab Functions
  function loadProfileData() {
    browser.storage.local.get('profileData').then(result => {
      if (result.profileData) {
        document.getElementById('cv').value = result.profileData.cv || '';
        document.getElementById('career-goals').value = result.profileData.careerGoals || '';
        
        if (result.profileData.templateStyle) {
          document.getElementById('template-style').value = result.profileData.templateStyle;
        }
      }
    });
  }
  
  function saveProfileData() {
    const profileData = {
      cv: document.getElementById('cv').value,
      careerGoals: document.getElementById('career-goals').value,
      templateStyle: document.getElementById('template-style').value
    };
    
    browser.storage.local.set({ profileData }).then(() => {
      alert('Profile saved successfully!');
    });
  }
  
  function previewCVAndCoverLetter() {
    const jsonInput = document.getElementById('cv-json').value;
    
    if (!jsonInput.trim()) {
      alert('Please paste the JSON output from Claude first.');
      return;
    }
    
    try {
      // Generate HTML for preview using the modern template
      const previewHTML = generateCVPreview(jsonInput);
      
      // Save HTML to temporary storage
      browser.storage.local.set({ previewHTML }).then(() => {
        // Open preview in new tab
        browser.tabs.create({ url: '/preview/preview.html' });
      });
    } catch (e) {
      alert('Error parsing JSON. Please make sure you pasted the correct format from Claude.');
    }
  }
  
  // Update the preview.html page to use the stored HTML
  // This goes in the preview/preview.html script section
  /*
  document.addEventListener('DOMContentLoaded', function() {
    browser.storage.local.get('previewHTML').then(result => {
      if (result.previewHTML) {
        // Replace the entire document with the generated HTML
        document.open();
        document.write(result.previewHTML);
        document.close();
      } else {
        document.body.innerHTML = '<p>No preview available. Please generate a CV first.</p>';
      }
    }).catch(error => {
      console.error("Error loading preview:", error);
      document.body.innerHTML = '<p>Error loading preview. Please try again.</p>';
    });
  });
  */

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
          <button onclick="window.print()">Print CV & Cover Letter</button>
          <button onclick="printCV()">Print CV Only</button>
          <button onclick="printCoverLetter()">Print Cover Letter Only</button>
          <button onclick="window.close()">Close Preview</button>
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