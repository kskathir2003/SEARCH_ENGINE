const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');
const crawlAndSave = require('./crawlAndSave');

const concurrencyLimit = 5;
const urlsToCrawl = [];
const csvFilePath = path.join(__dirname, 'urls.csv');
const progressFilePath = path.join(__dirname, 'progress.json'); // Path to progress file

let progressData = {
  crawledCount: 0,
  currentFolderIndex: 1, // Initial folder index
  websitesInCurrentFolder: 0, // Websites saved in the current folder
};

const resultsFolder = path.join(process.cwd(), 'crawled_results');
if (!fs.existsSync(resultsFolder)) {
  fs.mkdirSync(resultsFolder);
}

if (fs.existsSync(progressFilePath)) {
  try {
    const progressJson = fs.readFileSync(progressFilePath, 'utf8');
    progressData = JSON.parse(progressJson);
  } catch (error) {
    console.error('Error loading progress data:', error);
  }
}

fs.createReadStream(csvFilePath)
  .pipe(csv(['Rank', 'Domain']))
  .on('data', (row) => {
    const rank = parseInt(row.Rank);
    const domain = row.Domain;
    urlsToCrawl.push({ rank, domain });
  })
  .on('end', () => {
    console.log('URLs reading completed.');
    crawlUrlsConcurrently();
  });

async function crawlUrlsConcurrently() {
  let startIndex = 0; // Initialize startIndex
  const browser = await puppeteer.launch();

  for (let i = startIndex; i < urlsToCrawl.length; i += concurrencyLimit) {
    const currentBatch = urlsToCrawl.slice(i, i + concurrencyLimit);

    await Promise.all(
      currentBatch.map(async ({ rank, domain }) => {
        await crawlAndSave(domain, progressData, browser);
      })
    );

    await delay(2000); // Adding a 2-second delay between batches to avoid excessive parallelism
  }

  await browser.close(); // Close the browser after all batches are processed
  console.log('URLs crawling completed.');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

