import fs from 'fs';
const files = [
  'c:/Dev/camelia-handcraft/src/pages/AdminDashboard.jsx',
  'c:/Dev/camelia-handcraft/src/pages/ProductsPage.jsx',
  'c:/Dev/camelia-handcraft/src/pages/ProductDetail.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\.atual/g, '.stock');
  content = content.replace(/atual\s*:/g, 'stock:');
  fs.writeFileSync(file, content);
});
console.log('Successfully replaced "atual" with "stock" in React codebase.');
