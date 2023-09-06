const fs = require('fs');
const path = require('path');
const saveProgress = require('./saveProgess');

function save(domain, progressData, htmlContent, textContent, saveProgress) {
    const websitesPerFolder = 1000;
    const subfolderName = `Folder_${progressData.currentFolderIndex}`;
    const resultsFolder = path.join(process.cwd(), 'crawled_results');
    const subfolderPath = path.join(resultsFolder, subfolderName);
    const domainName = domain;
  
    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath);
    }
  
    if (domainName) {
      const folderName = path.join(subfolderPath, domainName);
  
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
  
      if (htmlContent !== null) {
        fs.writeFileSync(path.join(folderName, `${domainName}.html`), htmlContent);
        // Increment the count of crawled websites
        progressData.crawledCount++;
      }
  
      if (textContent !== null) {
        fs.writeFileSync(path.join(folderName, `${domainName}.txt`), textContent);
      }
    }
  
    // Check if it's time to create a new folder
    if (progressData.crawledCount > 0 && progressData.crawledCount % websitesPerFolder === 0) {
      progressData.currentFolderIndex++;
      progressData.websitesInCurrentFolder = 0;
      saveProgress(progressData);
    }
  }

  module.exports = save;