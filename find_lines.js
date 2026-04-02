const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');
const lines = content.split('\n');

// Find the line with "Linha 3: Receita" comment
const startIdx = lines.findIndex(l => l.includes('Linha 3'));
// Find the closing of the visao_geral tab (look for empty line then closing divs)
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('</div>') && lines[i+1] && lines[i+1].trim() === '' && lines[i+2] && lines[i+2].includes('</div>') && lines[i+3] && lines[i+3].includes(')}'));

console.log('Start replace at:', startIdx + 1);
console.log('End replace at:', endIdx + 1);
for(let i = startIdx; i <= endIdx + 3; i++) {
  console.log(i+1, ':', lines[i]);
}
