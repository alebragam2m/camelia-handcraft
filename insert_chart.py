import re

with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The chart JSX to insert - using single quotes to avoid issues with Python strings
chart = (
    '\n'
    '                 {/* Gráfico Faturamento Mensal + Top Produtos */}\n'
    '                 {(() => {\n'
    '                   const mLbls = [\'Jan\',\'Fev\',\'Mar\',\'Abr\',\'Mai\',\'Jun\',\'Jul\',\'Ago\',\'Set\',\'Out\',\'Nov\',\'Dez\'];\n'
    '                   const now = new Date();\n'
    '                   const sixMonths = Array.from({length: 6}, (_, i) => {\n'
    '                     const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);\n'
    '                     return { month: d.getMonth(), year: d.getFullYear(), label: mLbls[d.getMonth()] };\n'
    '                   });\n'
    '                   const monthlyData = sixMonths.map(m => ({\n'
    '                     ...m,\n'
    '                     total: vendas.filter(v => { const d = new Date(v.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).reduce((a, v) => a + Number(v.total_amount || 0), 0)\n'
    '                   }));\n'
    '                   const maxVal = Math.max(...monthlyData.map(m => m.total), 1);\n'
    '                   const topProd = [...produtos].filter(p => !p.is_insumo).sort((a,b) => Number(b.price||0) - Number(a.price||0)).slice(0, 5);\n'
    '                   const maxPrc = Math.max(...topProd.map(p => Number(p.price||0)), 1);\n'
    '                   return (\n'
    '                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">\n'
    '                       <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">\n'
    '                         <h3 className="text-secundaria text-sm font-bold uppercase tracking-widest mb-1">📊 Faturamento — Últimos 6 Meses</h3>\n'
    '                         <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-widest">Passe o mouse sobre as barras para ver o valor</p>\n'
    '                         <div className="flex items-end gap-2" style={{height:\'110px\'}}>\n'
    '                           {monthlyData.map((m, i) => {\n'
    '                             const h = (m.total / maxVal) * 100;\n'
    '                             return (\n'
    '                               <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">\n'
    '                                 <div className="relative w-full flex-1 group flex items-end">\n'
    '                                   <div className={i===5 ? \'w-full rounded-t-lg bg-primaria\' : \'w-full rounded-t-lg bg-secundaria/20 hover:bg-secundaria/50\'} style={{height: Math.max(h, 4) + \'%\', transition: \'all 0.5s\'}}>\n'
    '                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-secundaria text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">\n'
    '                                       {m.total > 0 ? formatCurrency(m.total) : \'—\'}\n'
    '                                     </div>\n'
    '                                   </div>\n'
    '                                 </div>\n'
    '                                 <span className={i===5 ? \'text-[9px] font-bold uppercase text-primaria\' : \'text-[9px] font-bold uppercase text-gray-400\'}>{m.label}</span>\n'
    '                               </div>\n'
    '                             );\n'
    '                           })}\n'
    '                         </div>\n'
    '                       </div>\n'
    '                       <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">\n'
    '                         <h3 className="text-secundaria text-sm font-bold uppercase tracking-widest mb-6">🌸 Produtos em Destaque</h3>\n'
    '                         <div className="space-y-4">\n'
    '                           {topProd.length === 0 && <p className="text-xs text-gray-400">Nenhum produto cadastrado.</p>}\n'
    '                           {topProd.map((p, i) => (\n'
    '                             <div key={p.id} className="flex items-center gap-3">\n'
    '                               <span className="text-[10px] font-bold text-gray-300 w-4">{i+1}</span>\n'
    '                               <div className="flex-1 min-w-0">\n'
    '                                 <p className="text-xs font-bold text-secundaria truncate">{p.nome}</p>\n'
    '                                 <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">\n'
    '                                   <div className="h-full bg-primaria rounded-full" style={{width: (Number(p.price||0)/maxPrc*100)+\'%\', transition:\'all 0.5s\'}}></div>\n'
    '                                 </div>\n'
    '                               </div>\n'
    '                               <span className="text-[10px] font-bold text-gray-500 shrink-0">{formatCurrency(Number(p.price||0))}</span>\n'
    '                             </div>\n'
    '                           ))}\n'
    '                         </div>\n'
    '                       </div>\n'
    '                     </div>\n'
    '                   );\n'
    '                 })()}\n\n'
)

marker = '{/* Linha 3: Receita Vital'
idx = content.find(marker)
if idx == -1:
    print('MARKER NOT FOUND - searching for alternatives...')
    # Try to find by nearby unique text
    alt = 'Since Day 1'
    idx2 = content.find(alt)
    print(f'Alt marker at index: {idx2}')
    # Find the start of this block
    block_start = content.rfind('{/*', 0, idx2)
    print(f'Block start: {block_start}')
    print(f'Snippet: {content[block_start:block_start+50]}')
else:
    new_content = content[:idx] + chart + content[idx:]
    with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'SUCCESS - chart inserted at index {idx}')
    print(f'New file length: {len(new_content)}')
