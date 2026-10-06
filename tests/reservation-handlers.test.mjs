import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutHandler } from '../server/checkout.js';
import { createCancelCheckoutHandler } from '../server/cancel-checkout.js';
import { createWebhookHandler, processCheckoutEvent } from '../server/webhook.js';
import { recoverSession } from '../server/reservations.js';
const key = '10000000-0000-4000-8000-000000000001';
const customer = {nome:'Teste',email:'cliente@example.test',telefone:'123',endereco:'Rua',cidade:'Belém',estado:'PA'};
function fixture(options={}) {
 const calls=[];
 const payload={mode:'payment',expires_at:Math.floor(Date.now()/1000)+3600,metadata:{requestId:key,saleId:'sale'},line_items:[],customer_email:customer.email};
 const attempt={sale_id:'sale',state:'reserved',session_id:null,payload,created_at:new Date().toISOString(),...options.attempt};
 const session={id:'cs_test_12345678',mode:'payment',currency:'brl',amount_total:1500,payment_status:'unpaid',status:'open',metadata:payload.metadata,url:'https://checkout.stripe.com/test',...options.session};
 let dbFailure=!!options.applyFailure;
 const supabase={auth:{getUser:async()=>options.auth || {data:{user:{id:'actor',email:customer.email,email_confirmed_at:'yes'}}}},
  rpc:async(name,args)=>{
   calls.push({name,args});
   if(name==='reserve_checkout') return options.reserveError ? {error:options.reserveError} : {data:attempt};
   if(name==='cancel_checkout_attempt') return {data: options.absent ? null : attempt};
   if(name==='apply_checkout_session') {
     if(dbFailure){dbFailure=false;return {error:{message:'PRIVATE',code:'08006'}};}
     attempt.session_id=session.id;
     if(session.payment_status==='paid') attempt.state='paid';
     else if(session.status==='expired') attempt.state='expired';
     return {data:{state:attempt.state}};
   }
   throw Error('RPC desconhecida');
  },from(){throw Error('Checkout não pode fazer escrita parcial em tabela.');}};
 const stripe={checkout:{sessions:{
  create:async(body,config)=>{calls.push({create:body,config});if(options.createFailure) throw Error('PRIVATE STRIPE');return session;},
  retrieve:async id=>{calls.push({retrieve:id});return session;},
  expire:async id=>{calls.push({expire:id});if(options.expireRace){session.status='complete';session.payment_status='paid';throw Error('paid');}session.status='expired';return session;},
  list:async()=>({data:options.list || [],has_more:false}),
 }},webhooks:{constructEvent:()=>{if(options.badSignature)throw Error('PRIVATE');return {id:'evt_1',type:'checkout.session.completed',data:{object:session}};}}};
 const req={method:'POST',headers:{},body:{requestId:key,cartItems:[{id:'00000000-0000-0000-0000-000000000001',quantity:1,price:10}],customer:{...customer}}};
 const response=()=>({code:null,body:null,status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
 const deps={supabase,stripe,siteUrl:'https://shop.example.test',logger:{error(){}}};
 return {calls,attempt,session,req,response,deps};
}
test('guest checkout reserves atomically without table writes or customer reuse',async()=>{
 const f=fixture(),res=f.response();await createCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.code,200);assert.equal(f.calls[0].args.p_actor_id,null);
 assert.equal(f.calls[0].args.p_origin,'https://shop.example.test');
 assert.equal(f.calls.find(x=>x.create).config.idempotencyKey,'checkout:'+key);
 assert.equal(f.calls.find(x=>x.create).create.customer,undefined);
});
test('server authenticates account and rejects impersonation before reservation',async()=>{
 for(const auth of [{error:{}},{data:{user:{email:customer.email}}},{data:{user:{email:'other@example.test',email_confirmed_at:'yes'}}}]){
  const f=fixture({auth}),res=f.response();f.req.headers.authorization='Bearer token';
  await createCheckoutHandler(f.deps)(f.req,res);assert.ok([401,403].includes(res.code));assert.equal(f.calls.length,0);
 }
 const f=fixture(),res=f.response();f.req.headers.authorization='Bearer token';await createCheckoutHandler(f.deps)(f.req,res);
 assert.equal(f.calls[0].args.p_actor_id,'actor');assert.equal(res.code,200);
});
test('invalid attempt, invalid customer, and more than 99 products stop before writes',async()=>{
 for(const change of [{requestId:'invalid'},{customer:{...customer,email:'invalid'}},{cartItems:Array.from({length:100},()=>({id:'a'}))}]){
 const f=fixture(),res=f.response();Object.assign(f.req.body,change);await createCheckoutHandler(f.deps)(f.req,res);assert.equal(res.code,400);assert.equal(f.calls.length,0);
 }
});
test('database rejects stock/price/freight and provider errors remain private',async()=>{
 for(const message of ['Estoque insuficiente.','O preço mudou.','Frete indisponível.']){
 const f=fixture({reserveError:{code:'P0001',message}}),res=f.response();await createCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.code,409);assert.equal(f.calls.some(x=>x.create),false);
 }
 const f=fixture({createFailure:true}),res=f.response();await createCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.code,500);assert.doesNotMatch(JSON.stringify(res.body),/PRIVATE/);assert.equal(f.calls.some(x=>x.expire),false);
});
test('lost database response after Stripe retries the exact payload and idempotency key',async()=>{
 const f=fixture({applyFailure:true});const handler=createCheckoutHandler(f.deps);
 const first=f.response();await handler(f.req,first);assert.equal(first.code,500);
 const second=f.response();await handler(f.req,second);assert.equal(second.code,200);
 const creates=f.calls.filter(x=>x.create);assert.equal(creates.length,2);assert.deepEqual(creates[0],creates[1]);
 assert.equal(f.calls.some(x=>x.expire),false);
});
test('existing session is reused without another Stripe creation',async()=>{
 const f=fixture({attempt:{session_id:'cs_test_12345678'}}),res=f.response();await createCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.code,200);assert.equal(f.calls.some(x=>x.create),false);
});
test('paid retry returns status page; expired retry is terminal',async()=>{
 const f=fixture({session:{status:'complete',payment_status:'paid'}}),res=f.response();await createCheckoutHandler(f.deps)(f.req,res);
 assert.match(res.body.url,/pagamento-sucesso/);
 const expired=fixture({attempt:{state:'expired'}}),out=expired.response();await createCheckoutHandler(expired.deps)(expired.req,out);
 assert.equal(out.code,409);assert.equal(out.body.terminal,true);assert.equal(expired.calls.some(x=>x.create),false);
});
test('return origin is configured, never taken from the request',async()=>{
 const f=fixture(),res=f.response();f.deps.siteUrl='http://evil.test';await createCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.code,500);assert.equal(f.calls.length,0);
});
test('ambiguous old attempt never creates a fresh session or releases inventory',async()=>{
 const f=fixture();f.attempt.payload.expires_at=1;
 await assert.rejects(recoverSession(f.deps.stripe,key,f.attempt));assert.equal(f.calls.length,0);
 const found=fixture();found.attempt.payload.expires_at=1;
 found.deps.stripe.checkout.sessions.list=async()=>({data:[found.session],has_more:false});
 assert.equal((await recoverSession(found.deps.stripe,key,found.attempt)).id,found.session.id);
 assert.equal(found.calls.some(x=>x.create),false);
});
test('cancel releases only after Stripe confirms expiration',async()=>{
 const f=fixture(),res=f.response();await createCancelCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.code,200);assert.equal(res.body.state,'expired');
 const expiration=f.calls.findIndex(x=>x.expire), apply=f.calls.findIndex(x=>x.name==='apply_checkout_session');assert.ok(apply>expiration);
});
test('payment winning cancellation race preserves paid order',async()=>{
 const f=fixture({expireRace:true}),res=f.response();await createCancelCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.code,409);assert.equal(res.body.state,'paid');
});
test('cancel of attempt never reserved permits local recovery without touching Stripe',async()=>{
 const f=fixture({absent:true}),res=f.response();await createCancelCheckoutHandler(f.deps)(f.req,res);
 assert.equal(res.body.state,'expired');assert.equal(f.calls.some(x=>x.create),false);
});
test('webhook signature is required and failed database application requests redelivery',async()=>{
 const f=fixture({badSignature:true}),res=f.response();await createWebhookHandler({...f.deps,secret:'test',readBody:async()=>Buffer.from('test')})(f.req,res);
 assert.equal(res.code,400);assert.equal(f.calls.length,0);
 const fail=fixture({applyFailure:true}),out=fail.response();await createWebhookHandler({...fail.deps,secret:'test',readBody:async()=>Buffer.from('test')})(fail.req,out);
 assert.equal(out.code,500);
});
test('delayed expiration event consults current paid Stripe state before transition',async()=>{
 const f=fixture({session:{status:'complete',payment_status:'paid'}});
 await processCheckoutEvent(f.deps,{id:'evt_old',type:'checkout.session.expired',data:{object:{id:f.session.id,status:'expired'}}});
 const applied=f.calls.find(x=>x.name==='apply_checkout_session');assert.equal(applied.args.p_session.payment_status,'paid');assert.equal(applied.args.p_event_id,'evt_old');
});
test('failed asynchronous payment is authenticated by webhook and forwarded for stock release',async()=>{
 const f=fixture();
 await processCheckoutEvent(f.deps,{id:'evt_failed',type:'checkout.session.async_payment_failed',data:{object:{id:f.session.id}}});
 const applied=f.calls.find(x=>x.name==='apply_checkout_session');
 assert.equal(applied.args.p_session.async_payment_failed,true);
 assert.equal(applied.args.p_event_id,'evt_failed');
});
