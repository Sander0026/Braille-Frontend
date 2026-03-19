const fs = require('fs');
try {
  const content = fs.readFileSync('result_completo.json', 'utf16le');
  
  // Como o JSON pode estar poluído com logs do browser, usamos regex flexível para capturar erro/message
  const regex = /"message":\s*"([^"]+)"/g;
  let match;
  console.log("=== RAZÕES DE FALHAS DO CYPRESS ===");
  while ((match = regex.exec(content)) !== null) {
      if(match[1].includes('AssertionError') || match[1].includes('Timed out')) {
        console.log("-> " + match[1]);
      }
  }
} catch (e) {
  console.log("Erro ao ler JSON: ", e);
}
