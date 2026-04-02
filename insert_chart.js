const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');
const lines = content.split('\n');

// The chart section to INSERT before the "Linha 3" block
const chartCode = `                 {/* Linha 3: Gráfico de Faturamento Mensal + Top Produtos */}
                 {(() => {
                   const monthLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                   const now = new Date();
                   const sixMonths = Array.from({length: 6}, (_, i) => {
                     const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
                     return { month: d.getMonth(), year: d.getFullYear(), label: monthLabels[d.getMonth()] };
                   });
                   const monthlyData = sixMonths.map(m => ({
                     ...m,
                     total: vendas.filter(v => {
                       const d = new Date(v.created_at);
                       return d.getMonth() === m.month && d.getFullYear() === m.year;
                     }).reduce((a, v) => a + Number(v.total_amount || 0), 0)
                   }));
                   const maxVal = Math.max(...monthlyData.map(m => m.total), 1);
                   const topProd = [...produtos].filter(p => !p.is_insumo).sort((a,b) => Number(b.price||0) - Number(a.price||0)).slice(0, 5);
                   const maxPrice = Math.max(...topProd.map(p => Number(p.price||0)), 1);
                   return (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                       <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                         <h3 className="text-secundaria text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><span>📊</span> Faturamento — Últimos 6 Meses</h3>
                         <div className="flex items-end gap-3" style={{height:'120px'}}>
                           {monthlyData.map((m, i) => {
                             const h = maxVal > 0 ? (m.total / maxVal) * 100 : 0;
                             const isCurrent = i === 5;
                             return (
                               <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                                 <div className="relative w-full flex-1 group flex items-end">
                                   <div className={\`w-full rounded-t-lg transition-all duration-700 \${isCurrent ? 'bg-primaria' : 'bg-secundaria/25 hover:bg-secundaria/50'}\`} style={{height:\`\${Math.max(h,3)}%\`}}>
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-secundaria text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                       {m.total > 0 ? \`R\$\xa0\${m.total.toFixed(0)}\` : '—'}
                                     </div>
                                   </div>
                                 </div>
                                 <span className={\`text-[10px] font-bold uppercase \${isCurrent ? 'text-primaria' : 'text-gray-400'}\`}>{m.label}</span>
                               </div>
                             );
                           })}
                         </div>
                         <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest">Passe o mouse sobre as barras para ver o valor exato</p>
                       </div>
                       <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                         <h3 className="text-secundaria text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><span>🌸</span> Produtos em Destaque</h3>
                         <div className="space-y-4">
                           {topProd.length === 0 && <p className="text-xs text-gray-400">Nenhum produto cadastrado.</p>}
                           {topProd.map((p, i) => (
                             <div key={p.id} className="flex items-center gap-3">
                               <span className="text-[10px] font-bold text-gray-400 w-4">{i+1}</span>
                               <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold text-secundaria truncate">{p.nome}</p>
                                 <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                   <div className="h-full bg-primaria rounded-full transition-all duration-500" style={{width:\`\${(Number(p.price||0)/maxPrice)*100}%\`}}></div>
                                 </div>
                               </div>
                               <span className="text-[10px] font-bold text-gray-500 shrink-0">R\${Number(p.price||0).toFixed(0)}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   );
                 })()}
`;

// Find the exact line index where "Linha 3" starts
const startIdx = lines.findIndex(l => l.includes('Linha 3'));
console.log('Inserting chart BEFORE line:', startIdx + 1);

// Insert chart code before the "Linha 3" line
const newLines = [
  ...lines.slice(0, startIdx),
  ...chartCode.split('\n'),
  ...lines.slice(startIdx)
];

fs.writeFileSync('src/pages/AdminDashboard.jsx', newLines.join('\n'), 'utf8');
console.log('Done! Total lines now:', newLines.length);
