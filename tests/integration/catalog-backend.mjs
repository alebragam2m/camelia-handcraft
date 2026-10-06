import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
export const API='http://127.0.0.1:54399';
export function docker(args,input='') {
 return new Promise((resolve,reject)=>{
  const p=spawn('docker',args);let out='',err='';
  p.stdout.on('data',b=>{out+=b;});p.stderr.on('data',b=>{err+=b;});
  p.on('error',reject);p.on('close',code=>code?reject(Error(err)):resolve(out.trim()));
  p.stdin.on('error',reject);p.stdin.end(input);
 });
}
export const sql=(input,db='camelia_catalog_test')=>docker(['exec','-i','camelia-roadmap-db','psql','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-U','postgres','-d',db],input);
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
export async function setupDatabase(){
 if(await sql("select count(*) from pg_database where datname='camelia_catalog_test';",'postgres')==='0') await docker(['exec','camelia-roadmap-db','createdb','-U','postgres','camelia_catalog_test']);
 await sql(readFileSync(new URL('../database/catalog-fixture.sql',import.meta.url),'utf8'));
 const source=readFileSync(new URL('../../supabase/schema-current.sql',import.meta.url),'utf8');
 const view=source.slice(source.indexOf('CREATE VIEW public.storefront_products'),source.indexOf('GRANT SELECT ON public.storefront_products')+'GRANT SELECT ON public.storefront_products TO anon, authenticated;'.length);
 await sql('DROP VIEW IF EXISTS public.storefront_products;'+view);
 const start=source.indexOf('CREATE OR REPLACE FUNCTION public.handle_inventory_adjustment(');
 const end=source.indexOf('$function$;',start);
 await sql(source.slice(start,end+11));
}
export async function records(table='products'){
 if(!['products','storefront_products','inventory_logs'].includes(table))throw Error('Tabela inválida');
 return JSON.parse(await sql(`SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]') FROM public.${table} t;`));
}
export const state={uploads:new Map(),uploadGate:null,failUpload:false,failSave:false,failCatalog:false,unexpected:[],writes:[]};
export const adminUser={id:'00000000-0000-4000-8000-000000000001',email:'admin@example.test',aud:'authenticated',role:'authenticated',email_confirmed_at:'2026-01-01T00:00:00Z',app_metadata:{},user_metadata:{}};
export async function routes(context,{admin=false}={}){
 if(admin)await context.addInitScript(({user})=>localStorage.setItem('camelia_v4_auth_token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user})),{user:adminUser});
 await context.routeWebSocket('**/realtime/**',ws=>ws.close());
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  const send=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body),headers:{'access-control-allow-origin':'*'}});
  if(url.origin==='http://127.0.0.1:5189')return route.continue();
  if(url.origin!==API){if(url.hostname.endsWith('supabase.co'))state.unexpected.push(url.origin);return route.abort();}
  try{
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
   if(url.pathname==='/auth/v1/user')return send(adminUser);
   if(url.pathname.startsWith('/storage/v1/object/public/')){
    const key=url.pathname.replace('/storage/v1/object/public/','');const file=state.uploads.get(key);
    return file?route.fulfill({status:200,body:file.buffer,contentType:file.type}):route.fulfill({status:404});
   }
   if(url.pathname.startsWith('/storage/v1/object/')&&request.method()==='POST'){
    if(state.uploadGate)await state.uploadGate;
    if(state.failUpload)return send({message:'Falha simulada de upload'},503);
    const raw=request.postDataBuffer();const type=request.headers()['content-type'];
    const boundary=type.split('boundary=')[1];
    const start=raw.indexOf(Buffer.from('filename='));const headersEnd=raw.indexOf(Buffer.from('\r\n\r\n'),start);
    const finish=raw.indexOf(Buffer.from('\r\n--'+boundary),headersEnd+4);
    const head=raw.subarray(start,headersEnd).toString();
    const key=url.pathname.replace('/storage/v1/object/','');
    state.uploads.set(key,{buffer:raw.subarray(headersEnd+4,finish),type:/Content-Type: ([^\r]+)/i.exec(head)?.[1]||'image/png'});
    return send({Key:key});
   }
   const table=url.pathname.replace('/rest/v1/','');
   if(table==='admin_users')return send({access_level:4,is_active:true});
   if(['clients','sales','suppliers','financial_transactions','shipping_rates'].includes(table))return send([]);
   if(table==='rpc/handle_inventory_adjustment'){
    const b=request.postDataJSON();const output=await sql(`select public.handle_inventory_adjustment(${quote(b.p_product_id)},${Number(b.p_quantity)},${quote(b.p_type)},${quote(b.p_notes||'')});`);
    return send(JSON.parse(output));
   }
   if(!['products','storefront_products','inventory_logs'].includes(table)){state.unexpected.push(table);return send({message:'Rota não prevista'},500);}
   if(request.method()==='GET'){
    if(table==='storefront_products'&&state.failCatalog)return send({message:'Catálogo indisponível'},503);
    let rows=await records(table);
    for(const field of ['id','product_id'])if(url.searchParams.get(field)?.startsWith('eq.'))rows=rows.filter(row=>row[field]===url.searchParams.get(field).slice(3));
    if(request.headers().accept?.includes('vnd.pgrst.object'))return send(rows[0]||null);
    return send(rows);
   }
   if(table!=='products'||!admin)return send({message:'Não autorizado'},403);
   if(state.failSave)return send({message:'Falha simulada ao salvar'},503);
   const id=url.searchParams.get('id')?.slice(3);const payload=request.postDataJSON();
   state.writes.push({method:request.method(),payload});
   let returned=[];
   if(request.method()==='POST'){
    const row={id:randomUUID(),created_at:new Date().toISOString(),...payload};
    returned=JSON.parse(await sql(`WITH saved AS (INSERT INTO products SELECT * FROM jsonb_populate_record(NULL::products,${quote(JSON.stringify(row))}::jsonb) RETURNING *) SELECT jsonb_agg(to_jsonb(saved)) FROM saved;`));
   }else if(request.method()==='PATCH'){
    const allowed=Object.keys((await records())[0]||{});
    const fields=Object.keys(payload);if(fields.some(k=>!allowed.includes(k)))throw Error('Coluna inválida');
    let where=`id=${quote(id)}`;
    if(url.searchParams.has('stock'))where+=` AND p.stock=${Number(url.searchParams.get('stock').slice(3))}`;
    returned=JSON.parse(await sql(`WITH saved AS (UPDATE products p SET ${fields.map(k=>`${k}=r.${k}`).join(',')} FROM jsonb_populate_record(NULL::products,${quote(JSON.stringify(payload))}::jsonb) r WHERE p.${where} RETURNING p.*) SELECT COALESCE(jsonb_agg(to_jsonb(saved)),'[]') FROM saved;`));
   }else if(request.method()==='DELETE'){await sql(`DELETE FROM products WHERE id=${quote(id)};`);return send(null);}
   return returned.length?send(returned[0]):send({code:'PGRST116',message:'Nenhum registro atualizado'},406);
  }catch(error){console.error('Fixture:',error.message);return send({message:'Erro na fixture'},500);}
 });
}
