const fs = require('fs');

// comunicados-lista
let f = 'src/app/pages/admin/conteudo-site/components/comunicados-lista/comunicados-lista.spec.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/import 'zone\.js';\nimport 'zone\.js\/testing';/g, '');
c = c.replace(/,\s*fakeAsync\s*,\s*tick\s*/g, '');
c = c.replace(/fakeAsync\(\(\) => \{/g, 'async () => {');
c = c.replace(/tick\(150\);/g, 'await new Promise(r => setTimeout(r, 150));');
fs.writeFileSync(f, c, 'utf8');

// conteudo-dinamico
f = 'src/app/pages/admin/conteudo-site/components/conteudo-dinamico/conteudo-dinamico.component.spec.ts';
c = fs.readFileSync(f, 'utf8');
c = c.replace(/import 'zone\.js';\nimport 'zone\.js\/testing';/g, '');
c = c.replace(/,\s*fakeAsync\s*,\s*tick\s*/g, '');
c = c.replace(/fakeAsync\(\(\) => \{/g, 'async () => {');
c = c.replace(/tick\(\);/g, 'await new Promise(r => setTimeout(r, 10));');
fs.writeFileSync(f, c, 'utf8');
