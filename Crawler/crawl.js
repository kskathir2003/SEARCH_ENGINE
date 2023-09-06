const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const RobotsParser = require('robots-parser');

async function crawl(domain, progressData, browser) {
  const domainWithProtocol = `https://${domain}`;

  try {
    if (!browser) {
      // If the browser instance doesn't exist, create a new one
      browser = await puppeteer.launch();
    }
    const page = await browser.newPage();

    page.setDefaultTimeout(30000);

    const robotsTxtUrl = `${domainWithProtocol}/robots.txt`;
    const response = await fetch(robotsTxtUrl);
    const robotsTxtContent = await response.text();

    const robotsTxtParser = new RobotsParser(robotsTxtUrl, robotsTxtContent);
    const isAllowed = robotsTxtParser.isAllowed(domainWithProtocol);

    if (isAllowed) {
      console.log(`Crawling is allowed for URL: ${domainWithProtocol}`);
    } else {
      console.log(`Crawling is NOT allowed for URL: ${domainWithProtocol}`);
    }

    await page.goto(domainWithProtocol);

    const htmlContent = await page.content();
    const textContent = await page.evaluate(() => document.body.innerText);

    await page.close(); // Close the page after crawling

    return { htmlContent, textContent };
  } catch (error) {
    console.error(`Error crawling ${domain}:`, error);
    return { htmlContent: null, textContent: null };
  }
}

module.exports = crawl;