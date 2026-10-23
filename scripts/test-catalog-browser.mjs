import { chromium } from 'playwright';
import { expect } from 'playwright/test';
import { createServer } from 'vite';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { API,setupDatabase,routes,records,sql,state } from '../tests/integration/catalog-backend.mjs';
process.env.VITE_SUPABASE_URL=API;process.env.VITE_SUPABASE_ANON_KEY='synthetic-key';
await setupDatabase();
const server=await createServer({envFile:false,server:{host:'127.0.0.1',port:5189,strictPort:true},logLevel:'error'});
await server.listen();
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
const adminContext=await browser.newContext({viewport:{width:1440,height:1050}});
const visitorContext=await browser.newContext({viewport:{width:1280,height:900}});
await routes(adminContext,{admin:true});await routes(visitorContext);
const admin=await adminContext.newPage(),site=await visitorContext.newPage();
for(const page of [admin,site]){page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());page.setDefaultTimeout(12000);}
const report=async(name,run)=>{try{await run();results.push({name,pass:true});console.log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.message});console.error('FAIL '+name+': '+e.message.slice(0,500));}};
const save=()=>admin.getByRole('button',{name:'Salvar Mudanças',exact:true}).click();
const closeForm=()=>admin.locator('form').evaluate(form=>{
 const close=form.parentElement?.querySelector('button[type="button"]');
 if(!(close instanceof HTMLElement))throw new Error('Botão de fechar não encontrado');
 close.click();
});
const edit=async()=>{
 await admin.goto('http://127.0.0.1:5189/admin',{waitUntil:'domcontentloaded',timeout:15000});
 await admin.getByRole('button',{name:'📦 Produtos',exact:true}).click();
 await admin.getByText('Ver Tudo',{exact:true}).click();
 await admin.getByRole('heading',{name:'Peça Integração',exact:true}).click();
 await expect(admin.locator('[name="stock"]')).toBeVisible();
};
const refreshSite=async()=>{await site.reload({waitUntil:'domcontentloaded',timeout:15000});};
try{
 await admin.goto('http://127.0.0.1:5189/admin');
 await admin.getByRole('button',{name:'📦 Produtos',exact:true}).click();
 await admin.getByText('Ver Tudo',{exact:true}).click();
 await admin.getByRole('button',{name:'+ Novo em Ver Tudo',exact:true}).click();
 await report('Cadastrar produto no painel e persistir no PostgreSQL',async()=>{
  await admin.locator('[name="nome"]').fill('Peça Integração');
  await admin.locator('[name="price"]').fill('25.50');await admin.locator('[name="cost"]').fill('8');
  await admin.locator('[name="stock"]').fill('5');await admin.getByRole('button',{name:'Flores',exact:true}).click();
  await admin.getByRole('button',{name:'Cadastrar na Camélia',exact:true}).click();
  await expect(admin.getByRole('heading',{name:'Peça Integração',exact:true})).toBeVisible();
  const [row]=await records();assert.equal(row.stock,5);assert.equal(row.price,25.5);assert.equal(row.colecao,'Flores');
 });
 const [product]=await records();if(!product)throw Error('Cadastro base não foi concluído');
 await site.goto('http://127.0.0.1:5189/produtos');
 await report('Vitrine pública exibe novo produto sem custos/notas internas',async()=>{
  await expect(site.getByRole('heading',{name:'Peça Integração'})).toBeVisible();
  const [row]=await records('storefront_products');assert.equal(row.cost,undefined);assert.equal(row.technical_notes,undefined);
  await expect(site.getByRole('button',{name:/^Adicionar ao carrinho/})).toBeVisible();
 });
 const photo=await admin.evaluate(()=>{const c=document.createElement('canvas');c.width=160;c.height=200;const x=c.getContext('2d');x.fillStyle='#da758e';x.fillRect(0,0,160,200);return c.toDataURL('image/png').split(',')[1];});
 const file={name:'teste.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')};
 await report('Recortar capa, enviar fotos extras e exibir galeria no site',async()=>{
  await edit();await admin.locator('input[type="file"]').nth(0).setInputFiles(file);
  await admin.getByRole('button',{name:'Confirmar Enquadramento (Capa)',exact:true}).click();
  await expect(admin.getByAltText('Preview 1')).toBeVisible();
  for(let n=2;n<=4;n++){
   await admin.locator('input[type="file"]').first().setInputFiles({...file,name:`extra-${n}.png`});
   await expect(admin.getByAltText(`Preview ${n}`)).toBeVisible();
  }
  await save();await expect(admin.getByRole('heading',{name:'Editar Produto',exact:true})).toHaveCount(0);
  await site.goto('http://127.0.0.1:5189/produtos/'+product.id);
  await refreshSite();
  await expect(site.getByAltText('Amostra')).toHaveCount(4);
  for(const image of await site.getByRole('img').all())if((await image.getAttribute('src'))?.startsWith(API))await expect.poll(()=>image.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  const row=(await records())[0];assert.equal(state.uploads.size,4);assert.ok(row.image_4);
 });
 await report('Edição de preço chega à página já aberta por atualização periódica',async()=>{
  await edit();await admin.locator('[name="price"]').fill('32');await save();
  await site.waitForTimeout(32000);
  await expect(site.getByText('R$ 32,00',{exact:true})).toBeVisible({timeout:5000});
 });
 await report('Coleção usa a foto publicada e filtro encontra a peça',async()=>{
  await site.goto('http://127.0.0.1:5189/colecoes');await expect(site.getByRole('heading',{name:'Flores',exact:true})).toBeVisible();
  await expect(site.getByAltText('Flores')).toHaveAttribute('src',(await records())[0].image_url);
  await site.getByRole('heading',{name:'Flores',exact:true}).click();await expect(site.getByRole('heading',{name:'Peça Integração'})).toBeVisible();
 });
 await report('Ocultar e republicar atualiza vitrine aberta e acesso direto',async()=>{
  await edit();await admin.locator('[name="show_on_site"]').uncheck();await save();
  try{
   await refreshSite();
   await expect(site.getByRole('heading',{name:'Peça Integração'})).toHaveCount(0);
   await site.goto('http://127.0.0.1:5189/produtos/'+product.id);await refreshSite();await expect(site.getByText('Esta peça não está disponível na loja.',{exact:true})).toBeVisible();
  }finally{
   await edit();await admin.locator('[name="show_on_site"]').check();await save();await refreshSite();
  }
  assert.equal((await records())[0].show_on_site,true);
  await site.goto('http://127.0.0.1:5189/produtos',{waitUntil:'domcontentloaded',timeout:15000});
  await expect(site.getByRole('heading',{name:'Peça Integração'})).toBeVisible();
 });
 await report('Saída pelo PCP zera estoque e bloqueia compra no site aberto',async()=>{
  await admin.getByRole('button',{name:'📉 Estoque (PCP)',exact:true}).click();
  await admin.getByRole('button',{name:'Histórico PCP',exact:true}).click();await admin.getByRole('button',{name:'Ajuste Manual',exact:true}).click();
  await admin.locator('select').selectOption('Saída');await admin.getByPlaceholder('Qtd',{exact:true}).fill('5');await admin.getByPlaceholder('Motivo Contábil',{exact:true}).fill('Teste integração');
  await admin.getByRole('button',{name:'Salvar Calibração',exact:true}).click();
  await expect(admin.getByRole('button',{name:'Ajuste Manual',exact:true})).toBeVisible();
  assert.equal((await records())[0].stock,0);assert.equal((await records('inventory_logs')).length,1);
  await refreshSite();await expect(site.getByRole('button',{name:/^Adicionar ao carrinho/})).toHaveCount(0);
  await admin.getByRole('button',{name:'Fechar [X]',exact:true}).click();
 });
 await admin.getByRole('button',{name:'📦 Produtos',exact:true}).click();await admin.getByText('Ver Tudo',{exact:true}).click();
 await report('Edição de foto/descrição não sobrescreve estoque alterado por outra sessão',async()=>{
  await edit();await sql(`UPDATE products SET stock=3 WHERE id='${product.id}';`);
  await admin.locator('[name="description"]').fill('Descrição atualizada sem alterar saldo');
  await admin.getByRole('button',{name:'Salvar Mudanças',exact:true}).click();
  await expect(admin.getByRole('alert')).toContainText('O estoque mudou em outra tela');
  assert.equal((await records())[0].stock,3,'Saldo concorrente foi sobrescrito pelo formulário antigo');
  await closeForm();
 });
 await report('Salvar fica bloqueado enquanto há upload pendente',async()=>{
  await edit();await admin.getByTitle('Remover',{exact:true}).last().click();
  let release;state.uploadGate=new Promise(resolve=>{release=resolve;});
  try{
   await admin.locator('input[type="file"]').first().setInputFiles(file);await expect(admin.getByText('Enviando...',{exact:true})).toBeVisible();
   await expect(admin.locator('form button[type="submit"]')).toBeDisabled();
  }finally{release();state.uploadGate=null;}
  await expect(admin.getByAltText('Preview 4')).toBeVisible();await save();
 });
 // Recupera formulário aberto caso a asserção de upload tenha encontrado uma falha.
 if(await admin.getByRole('heading',{name:'Editar Produto',exact:true}).count())await closeForm();
 await report('Falha de persistência mantém formulário e dados anteriores no site',async()=>{
  await edit();state.failSave=true;await admin.locator('[name="nome"]').fill('Não deve publicar');await save();
  await expect(admin.getByRole('alert')).toContainText('Não foi possível salvar');assert.equal((await records())[0].nome,'Peça Integração');
  state.failSave=false;await closeForm();
 });
 await report('Remover foto extra elimina miniatura na página aberta',async()=>{
  await site.goto('http://127.0.0.1:5189/produtos/'+product.id);await refreshSite();await edit();
  await admin.getByTitle('Remover',{exact:true}).last().click();await save();await refreshSite();
  await expect(site.getByAltText('Amostra')).toHaveCount(3);
 });
 await report('Tela móvel mantém produto e galeria sem rolagem horizontal',async()=>{
  await site.setViewportSize({width:390,height:844});await expect(site.getByRole('heading',{name:'Peça Integração'})).toBeVisible();
  assert.equal(await site.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 });
 await mkdir('test-results/catalog',{recursive:true});
 await site.screenshot({path:'test-results/catalog/site-mobile.png',fullPage:true});await admin.screenshot({path:'test-results/catalog/admin.png',fullPage:true});
 assert.equal(state.unexpected.length,0,JSON.stringify(state.unexpected));assert.equal(errors.length,0,JSON.stringify(errors));
}finally{
 await mkdir('test-results/catalog',{recursive:true});await writeFile('test-results/catalog/report.json',JSON.stringify({results,errors,unexpected:state.unexpected},null,2));
 await browser.close();await server.close();
}
if(results.some(x=>!x.pass))process.exitCode=1;
console.log(`${results.filter(x=>x.pass).length}/${results.length} cenários aprovados.`);
