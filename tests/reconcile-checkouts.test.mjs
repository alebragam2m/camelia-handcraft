import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCheckouts } from '../server/reconcile-checkouts.js';

test('reconciliation repairs known expired sessions and preserves ambiguous reservations', async () => {
  const rows = [
    {request_id:'first',sale_id:'sale1',session_id:'cs_known',stripe_payload:{expires_at:1},created_at:'2026-01-01T00:00:00Z'},
    {request_id:'second',sale_id:'sale2',session_id:null,stripe_payload:{expires_at:1},created_at:'2026-01-01T00:00:00Z'},
  ];
  const calls=[];
  const query={select(){return this;},eq(){return this;},lt(){return this;},order(){return this;},limit(){return this;},
    gt(key,value){calls.push({key,value});return this;},then(resolve){return Promise.resolve({data:rows}).then(resolve);}};
  const supabase={from:()=>query,rpc:async(name,args)=>{calls.push({name,args});return {data:{state:'expired'}};}};
  const stripe={checkout:{sessions:{retrieve:async()=>({id:'cs_known',status:'expired',payment_status:'unpaid'}),list:async()=>({data:[],has_more:false}),create:async()=>assert.fail('Não pode criar sessão antiga')}}};
  const result=await reconcileCheckouts({supabase,stripe},'cursor');
  assert.deepEqual(result.results,[{requestId:'first',state:'expired'},{requestId:'second',state:'needs_review'}]);
  assert.equal(result.nextCursor,null);
  assert.equal(calls.filter(x=>x.name==='apply_checkout_session').length,1);
  assert.deepEqual(calls[0],{key:'request_id',value:'cursor'});
});
