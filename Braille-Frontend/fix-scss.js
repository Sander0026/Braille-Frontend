const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', function (filePath) {
    if (filePath.endsWith('.scss')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if it uses rgba($var, alpha) or rgba(#hex, alpha) or rgba(color, alpha)
        // We only replace if there are exactly 2 arguments and the first is not a number
        // Regex matches rgba(SOMETHING, NUMBER)
        const rgbaRegex = /rgba\s*\(\s*([^,]+?)\s*,\s*([0-9.]+%?)\s*\)/g;

        let hasChanges = false;
        let newContent = content.replace(rgbaRegex, (match, colorInfo, alphaInfo) => {
            // If colorInfo is a set of numbers like 255, 255, 255 - do not touch it
            // The regex catches everything up to the first comma, so if it's rgba(255,255,255,0.5)
            // the first group is "255", which means the original regex won't match the whole thing properly?
            // Wait: `rgba(255, 255, 255, 0.5)` has 4 arguments (3 commas). 
            // Our regex `rgba(..., ...)` matches only EXACTLY one comma inside the parentheses!
            // wait, `([^,]+?)` means NO commas inside the first argument. So `rgba(255, 255, 255, 0.5)` has commas, it wouldn't match.
            // It WOULD match `rgba($color, 0.5)` or `rgba(#fff, 0.5)`. That's perfect!
            hasChanges = true;
            return `color.change(${colorInfo.trim()}, $alpha: ${alphaInfo.trim()})`;
        });

        if (hasChanges) {
            // Check if @use 'sass:color'; is present
            if (!newContent.includes("@use 'sass:color'")) {
                // Add it to the top. Look for other @use if any
                if (newContent.includes('@use ')) {
                    newContent = newContent.replace(/(@use [^;]+;)/, "$1\n@use 'sass:color';");
                } else {
                    newContent = `@use 'sass:color';\n` + newContent;
                }
            }
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});
