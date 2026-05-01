const fs = require('fs');
const glob = require('glob'); // Not available? Just use standard fs.readdirSync recursively
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
    let content = fs.readFileSync(f, 'utf8');
    
    // Remove zone.js
    content = content.replace(/import ['"]zone\.js['"];/g, '');
    content = content.replace(/import ['"]zone\.js\/testing['"];/g, '');
    
    // Remove declare const jasmine
    content = content.replace(/declare const jasmine: any;/g, 'declare const vi: any;');
    content = content.replace(/declare const spyOn: any;/g, '');
    
    // Replace spies
    content = content.replace(/spyOn\(/g, 'vi.spyOn(');
    content = content.replace(/jasmine\.createSpy\([^)]*\)/g, 'vi.fn()');
    
    // SpyObj replace: 
    // siteConfigSpy = jasmine.createSpyObj('SiteConfigService', ['salvarSecao', 'carregarSecoes']);
    content = content.replace(/jasmine\.createSpyObj\([^,]+,\s*\[([^\]]+)\]\)/g, (match, p1) => {
        const methods = p1.split(',').map(m => m.trim().replace(/['"]/g, ''));
        const objStr = methods.map(m => m + ': vi.fn()').join(', ');
        return '{ ' + objStr + ' }';
    });

    content = content.replace(/jasmine\.createSpyObj\([^,]+,\s*\[\]\)/g, '{}');

    // Remove false expects of toBeFalse -> toBe(false) (Though I already fixed it)
    content = content.replace(/\.toBeFalse\(\)/g, '.toBe(false)');

    fs.writeFileSync(f, content, 'utf8');
});
console.log('Fixed to VI');
