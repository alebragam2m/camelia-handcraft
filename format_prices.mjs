import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let changed = false;
      // Patterns:
      // R$ {Number(prod.price).toFixed(2).replace('.', ',')}
      // R$ {(Number(item.price) * item.quantity).toFixed(2).replace('.', ',')}
      // R$ {fatDia.toFixed(2).replace('.', ',')}
      // R$ {metaFaturamento.atingido.toLocaleString('pt-BR')}
      
      const r1 = /R\$\s*\{\s*Number\(([^)]+)\)\.toFixed\([^)]+\)(?:\.replace\([^)]+\))?\s*\}/g;
      const r2 = /R\$\s*\{\s*\(\s*Number\(([^)]+)\)\s*\*\s*([^)]+)\)\.toFixed\([^)]+\)(?:\.replace\([^)]+\))?\s*\}/g;
      const r3 = /R\$\s*\{\s*([a-zA-Z0-9_.]+?)\.toFixed\([^)]+\)(?:\.replace\([^)]+\))?\s*\}/g;
      const r4 = /R\$\s*\{\s*([a-zA-Z0-9_.]+(?:\([^)]+\))?)\.toLocaleString\([^)]+\)\s*\}/g;

      // also R$ followed by hardcoded number?
      
      if (r1.test(content) || r2.test(content) || r3.test(content) || r4.test(content)) {
        if (!content.includes('formatCurrency')) {
          const importStr = `import { formatCurrency } from '../utils/formatCurrency';\n`;
          content = importStr + content;
        }
        
        content = content.replace(r1, '{formatCurrency($1)}');
        content = content.replace(r2, '{formatCurrency(Number($1) * $2)}');
        content = content.replace(r3, '{formatCurrency($1)}');
        content = content.replace(r4, '{formatCurrency($1)}');
        
        changed = true;
      }
      
      // Also match R$ without brackets
      // R$ {something} -> {formatCurrency(something)} if it doesn't have .toFixed
      // Let's just do manual changes for remaining hardcoded string R$ 10,00 values if necessary.

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
console.log('Done!');
