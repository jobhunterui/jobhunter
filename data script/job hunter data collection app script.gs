// Google Apps Script to handle data collection in Sheets
// Go to Extensions > Apps Script in your Google Sheet and paste this code

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the sheet based on data type
    let sheetName;
    
    switch(data.type) {
      case 'job_saved':
        sheetName = 'JobData';
        break;
      case 'application_generated':
        sheetName = 'ApplicationData';
        break;
      case 'search_to_selection':
        sheetName = 'SearchBehavior';
        break;
      case 'feature_usage':
        sheetName = 'FeatureUsage';
        break;
      case 'cv_job_match':
        sheetName = 'CVJobMatches';
        break;
      default:
        sheetName = 'OtherData';
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      
      // Add headers based on the data type
      if (sheetName === 'JobData') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Job Title', 
          'Company', 
          'Location', 
          'URL', 
          'Source Domain',
          'Skills', 
          'Experience Level',
          'Description Snippet'
        ]);
      } 
      else if (sheetName === 'ApplicationData') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Job Title', 
          'Company',
          'Has CV'
        ]);
      }
      else if (sheetName === 'SearchBehavior') {
        sheet.appendRow([
          'Timestamp', 
          'User ID',
          'Search Platform', 
          'Search Term', 
          'Search Location', 
          'Selected Job Title',
          'Selected Job Company',
          'Time To Selection'
        ]);
      }
      else if (sheetName === 'FeatureUsage') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Feature', 
          'Additional Data'
        ]);
      }
      else if (sheetName === 'CVJobMatches') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Job Title',
          'Company',
          'Job Location',
          'CV Skills',
          'Matched Job Title',
          'Tailored Summary',
          'Education',
          'Highlighted Experience'
        ]);
      }
      else {
        // Generic headers for other data
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Type', 
          'Data'
        ]);
      }
      
      // Format headers
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#f1f3f4').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    // Prepare row data based on the data type
    let rowData;
    
    switch(data.type) {
      case 'job_saved':
        rowData = [
          data.timestamp,
          data.user_id,
          data.job_title,
          data.company,
          data.location,
          data.url,
          data.source_domain,
          data.skills,
          data.experience_level,
          data.description_snippet
        ];
        break;
        
      case 'application_generated':
        rowData = [
          data.timestamp,
          data.user_id,
          data.job_title,
          data.company,
          data.has_cv
        ];
        break;
        
      case 'search_to_selection':
        rowData = [
          data.timestamp,
          data.user_id,
          data.search_platform,
          data.search_term,
          data.search_location,
          data.selected_job_title,
          data.selected_job_company,
          data.time_to_selection
        ];
        break;
        
      case 'feature_usage':
        // Extract feature-specific data and additional data
        const featureData = { ...data };
        delete featureData.timestamp;
        delete featureData.user_id;
        delete featureData.type;
        delete featureData.feature;
        
        rowData = [
          data.timestamp,
          data.user_id,
          data.feature,
          JSON.stringify(featureData)
        ];
        break;
        
      case 'cv_job_match':
        rowData = [
          data.timestamp,
          data.user_id,
          data.job_title,
          data.company,
          data.job_location,
          data.cv_skills,
          data.matched_job_title,
          data.tailored_summary,
          data.education,
          data.highlighted_experience
        ];
        break;
        
      default:
        // Generic data row for other data types
        rowData = [
          data.timestamp,
          data.user_id,
          data.type,
          JSON.stringify(data)
        ];
    }
    
    // Append the data row
    sheet.appendRow(rowData);
    
    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error
    console.error(error);
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Create a simple endpoint for testing
function doGet() {
  return ContentService.createTextOutput("Job Hunter Data Collection API is running").setMimeType(ContentService.MimeType.TEXT);
}

// Helper function to set up the sheets
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create necessary sheets if they don't exist
  ['JobData', 'ApplicationData', 'SearchBehavior', 'FeatureUsage', 'CVJobMatches'].forEach(sheetName => {
    if (!ss.getSheetByName(sheetName)) {
      const sheet = ss.insertSheet(sheetName);
      
      if (sheetName === 'JobData') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Job Title', 
          'Company', 
          'Location', 
          'URL', 
          'Source Domain',
          'Skills', 
          'Experience Level',
          'Description Snippet'
        ]);
      } 
      else if (sheetName === 'ApplicationData') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Job Title', 
          'Company',
          'Has CV'
        ]);
      }
      else if (sheetName === 'SearchBehavior') {
        sheet.appendRow([
          'Timestamp', 
          'User ID',
          'Search Platform', 
          'Search Term', 
          'Search Location', 
          'Selected Job Title',
          'Selected Job Company',
          'Time To Selection'
        ]);
      }
      else if (sheetName === 'FeatureUsage') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Feature', 
          'Additional Data'
        ]);
      }
      else if (sheetName === 'CVJobMatches') {
        sheet.appendRow([
          'Timestamp', 
          'User ID', 
          'Job Title',
          'Company',
          'Job Location',
          'CV Skills',
          'Matched Job Title',
          'Tailored Summary',
          'Education',
          'Highlighted Experience'
        ]);
      }
      
      // Format headers
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#f1f3f4').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });
}

// Create a menu item to set up sheets
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Job Hunter')
    .addItem('Set Up Sheets', 'setupSheets')
    .addToUi();
}