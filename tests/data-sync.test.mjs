import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { startDataSync, clearPrivateQueries } from '../src/lib/dataSync.js';

function realtime() {
 const handlers = new Map(); let status; let removed = false;
 const channel = { on(_type, { table }, handler) { handlers.set(table,handler); return this; }, subscribe(handler) { status = handler; return this; } };
 return { client: { channel: () => channel, removeChannel: () => { removed = true; } }, event: table => handlers.get(table)?.(), status: value => status(value), removed: () => removed };
}
async function eventually(check) {
 for(let i=0;i<100;i++) { if(check()) return; await delay(5); }
 assert.ok(check(), 'query did not update');
}
test('an external product change updates an active catalog observer and disconnect cleans up', async () => {
 const queryClient = new QueryClient({defaultOptions:{queries:{retry:false}}});
 let price = 20;
 const observer = new QueryObserver(queryClient, {queryKey:['catalog'],queryFn: async()=>[{id:'a',price}]});
 const unsubscribe = observer.subscribe(()=>{});
 const wire = realtime();
 const stop = startDataSync({client:wire.client,queryClient,batchMs:1});
 try {
  await eventually(()=>observer.getCurrentResult().data?.[0].price===20);
  price=35; wire.event('products');
  await eventually(()=>observer.getCurrentResult().data?.[0].price===35);
  stop(); price=40; wire.event('products'); await delay(15);
  assert.equal(observer.getCurrentResult().data[0].price,35);
  assert.equal(wire.removed(),true);
 } finally {stop();unsubscribe();queryClient.clear();}
});
test('private table events invalidate related management queries and reconnect repairs missed changes', async () => {
 const queryClient = new QueryClient(); const wire=realtime();
 for(const key of ['clients','sales','products','stock-logs','admin-access']) queryClient.setQueryData([key],[]);
 const stop=startDataSync({client:wire.client,queryClient,admin:true,batchMs:1});
 try {
  wire.event('sale_items');
  await eventually(()=>queryClient.getQueryState(['sales']).isInvalidated);
  assert.equal(queryClient.getQueryState(['clients']).isInvalidated,false);
  wire.status('SUBSCRIBED');
  await eventually(()=>queryClient.getQueryState(['clients']).isInvalidated);
  assert.equal(queryClient.getQueryState(['admin-access']).isInvalidated,true);
 } finally {stop();queryClient.clear();}
});
test('management polling recovers changes when realtime is unavailable',async()=>{
 const queryClient=new QueryClient(); const wire=realtime();
 queryClient.setQueryData(['clients'],[]);
 const stop=startDataSync({client:wire.client,queryClient,admin:true,batchMs:1,pollMs:10,isVisible:()=>true});
 try {await eventually(()=>queryClient.getQueryState(['clients']).isInvalidated);}
 finally {stop();queryClient.clear();}
});
test('changing account removes private cache while preserving the public catalog',()=>{
 const queryClient=new QueryClient();
 queryClient.setQueryData(['catalog'],[{id:'public'}]);queryClient.setQueryData(['clients'],[{id:'private'}]);queryClient.setQueryData(['admin-access','user-a'],{access_level:4});
 clearPrivateQueries(queryClient);
 assert.equal(queryClient.getQueryData(['clients']),undefined);assert.equal(queryClient.getQueryData(['admin-access','user-a']),undefined);
 assert.deepEqual(queryClient.getQueryData(['catalog']),[{id:'public'}]);queryClient.clear();
});
