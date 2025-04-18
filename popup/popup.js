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
    const role = encodeURIComponent(document.getElementById('role').value);
    const location = encodeURIComponent(document.getElementById('location').value);
    
    // List of common ATS sites
    const atsSites = [
      'jobs.lever.co',
      'boards.greenhouse.io',
      'apply.workable.com',
      'ashbyhq.com',
      'jobs.ashbyhq.com',
      'wellfound.com',
      'jobs.smartrecruiters.com',
      'jobvite.com',
      'hire.jobvite.com'
    ];
    
    // Construct site search query
    const siteQuery = atsSites.map(site => `site:${site}`).join(' OR ');
    
    // Construct full query with role and location
    const query = `(${siteQuery}) ${role} ${location}`;
    
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    browser.tabs.create({ url });
  }
  
  function searchWithAI() {
    const role = encodeURIComponent(document.getElementById('role').value);
    const location = encodeURIComponent(document.getElementById('location').value);
    const experience = document.getElementById('experience').value;
    
    // Create prompt for Perplexity
    let prompt = `Find job openings for ${role} positions`;
    
    if (location) {
      prompt += ` in ${location}`;
    }
    
    if (experience) {
      prompt += ` at the ${experience} level`;
    }
    
    prompt += `. Include direct application links when possible. Focus on the most relevant job boards and company career pages. Highlight roles with good compensation and growth potential.`;
    
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
    return `I need help customizing my CV and creating a cover letter for a job application. Here are the details:
  
  JOB DETAILS:
  Title: ${job.title}
  Company: ${job.company}
  Location: ${job.location || 'Not specified'}
  Description: ${job.description || 'Not provided'}
  
  MY CURRENT CV:
  ${cv}
  
  CAREER GOALS:
  ${careerGoals}
  
  Please help me by:
  1. Analyzing the job description and identifying key skills and requirements
  2. Tailoring my CV to highlight relevant experience and skills for this position
  3. Creating a compelling cover letter that addresses why I'm a good fit for this role
  4. Formatting the result as a JSON object with the following structure:
  
  {
    "tailoredCV": {
      "name": "",
      "contactInfo": {
        "email": "",
        "phone": "",
        "location": ""
      },
      "summary": "",
      "experience": [
        {
          "title": "",
          "company": "",
          "dates": "",
          "responsibilities": ["", ""]
        }
      ],
      "education": [
        {
          "degree": "",
          "institution": "",
          "dates": ""
        }
      ],
      "skills": ["", ""],
      "certifications": ["", ""]
    },
    "coverLetter": {
      "greeting": "",
      "opening": "",
      "body": "",
      "closing": "",
      "signature": ""
    }
  }
  
  Please return ONLY the JSON object, with no additional explanation or commentary.`;
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
    
    try {
      const data = JSON.parse(jsonInput);
      const templateStyle = document.getElementById('template-style').value;
      
      // Generate HTML for preview
      const previewHTML = generateCVAndCoverLetterHTML(data, templateStyle);
      
      // Save HTML to temporary storage
      browser.storage.local.set({ previewHTML }).then(() => {
        // Open preview in new tab
        browser.tabs.create({ url: '/preview/preview.html' });
      });
    } catch (e) {
      alert('Error parsing JSON. Please make sure you pasted the correct format from Claude.');
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