const fs = require('fs');
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
    
    // Fix encodings
    c = c.replace(/A imagem deve ter no m├íximo 2MB/g, 'A imagem deve ter no máximo 2MB');
    c = c.replace(/m├â┬íximo/g, 'máximo');
    c = c.replace(/Configura├â┬º├â┬Áes/g, 'Configurações');
    c = c.replace(/Configura├º├Áes/g, 'Configurações');
    c = c.replace(/Informa├â┬º├â┬Áes/g, 'Informações');
    c = c.replace(/Informa├º├Áes/g, 'Informações');
    c = c.replace(/Apresenta├â┬º├â┬úo/g, 'Apresentação');
    c = c.replace(/Apresenta├º├úo/g, 'Apresentação');
    c = c.replace(/edi├â┬º├â┬úo/g, 'edição');
    c = c.replace(/edi├º├úo/g, 'edição');
    c = c.replace(/din├â┬ómicos/g, 'dinâmicos');
    c = c.replace(/din├ómicos/g, 'dinâmicos');
    c = c.replace(/exclus├â┬úo/g, 'exclusão');
    c = c.replace(/exclus├úo/g, 'exclusão');
    c = c.replace(/Persist├â┬¬ncia/g, 'Persistência');
    c = c.replace(/Persist├¬ncia/g, 'Persistência');
    c = c.replace(/Se├â┬º├â┬Áes/g, 'Seções');
    c = c.replace(/Se├º├Áes/g, 'Seções');
    c = c.replace(/A├â┬º├â┬Áes/g, 'Ações');
    c = c.replace(/A├º├Áes/g, 'Ações');

    // Add zone where fakeAsync is used
    if (c.includes('fakeAsync') && !c.includes('zone.js')) {
        c = "import 'zone.js';\nimport 'zone.js/testing';\n" + c;
    }
    
    fs.writeFileSync(f, c, 'utf8');
});
