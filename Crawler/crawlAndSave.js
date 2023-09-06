const crawl = require('./crawl')
const save = require('./save')

async function crawlAndSave(domain, progressData, saveProgress, browser) {
    const { htmlContent, textContent } = await crawl(domain, progressData, browser);
    save(domain, progressData, htmlContent, textContent, saveProgress);
}

module.exports = crawlAndSave;
