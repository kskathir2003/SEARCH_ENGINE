const fs = require('fs');
const path = require('path');

function saveProgress(progressData) {
    fs.writeFileSync(path.join(__dirname, 'progress.json'), JSON.stringify(progressData, null, 2));
}

module.exports = saveProgress;