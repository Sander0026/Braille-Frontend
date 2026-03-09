const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let count = 0;
walkDir('./src', function (filePath) {
    if (filePath.endsWith('.scss')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if \uFEFF exists anywhere EXCEPT the first character
        // Or just strip all BOMs
        if (content.includes('\uFEFF')) {
            // Remove all BOMs
            let newContent = content.replace(/\uFEFF/g, '');
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Removed BOM from: ${filePath}`);
            count++;
        }
    }
});
console.log(`Removed BOM from ${count} files.`);
