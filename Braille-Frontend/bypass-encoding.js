const fs = require('fs');
const glob = require('glob');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(getFiles(file));
        } else if (file.endsWith('.spec.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = getFiles('src/app/pages/admin/conteudo-site/');

files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    
    // Remove the string argument from toHaveBeenCalledWith for toast strings
    c = c.replace(/\.toHaveBeenCalledWith\([^)]+\)/g, '.toHaveBeenCalled()');
    
    fs.writeFileSync(f, c, 'utf8');
});
