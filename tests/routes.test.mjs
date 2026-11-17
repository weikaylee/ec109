import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {valid,MEALS,makePairs} from '../lib/survey.ts';
let who=null,calls=0;const identity=async()=>who;const database=()=>{calls++;return {rpc:async()=>({data:'saved',error:null}),from:()=>({update:()=>({eq:()=>({is:async()=>({error:null})})})})}};const sameOrigin=r=>r.headers.get('origin')===new URL(r.url).origin;const noStore={};
const code=ts.transpileModule(fs.readFileSync('app/api/responses/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import .*?;\s*$/gm,'').replace(/export /g,'');
const api=new Function('database','identity','sameOrigin','noStore','valid','MEALS','participantKey',code+';return {GET,POST,DELETE}')(database,identity,sameOrigin,noStore,valid,MEALS,async()=>null);
const req=(method,body)=>new Request('https://survey.test/api/responses',{method,headers:{origin:'https://survey.test','content-type':'application/json'},body:JSON.stringify(body)});
assert.equal((await api.POST(req('POST',{}))).status,401);
assert.equal(calls,0);
assert.equal((await api.DELETE(req('DELETE',{id:crypto.randomUUID()}))).status,200);
assert.equal(calls,1);
const crossOrigin=new Request('https://survey.test/api/responses',{method:'DELETE',headers:{origin:'https://other.test','content-type':'application/json'},body:JSON.stringify({id:crypto.randomUUID()})});
assert.equal((await api.DELETE(crossOrigin)).status,403);
assert.equal(calls,1);
const resultsApi=new Function('database','sameOrigin','noStore',code+';return {GET}')( ()=>({from:()=>({select:()=>({is:()=>({order:()=>({range:async()=>({data:[{payload:{id:'response'},created:'today'}],error:null})})})})})}),sameOrigin,noStore);
const results=await resultsApi.GET();
assert.equal(results.status,200);
assert.deepEqual(await results.json(),[{id:'response',submittedAt:'today'}]);
console.log('PASS: results and deletion work without authentication; cross-origin deletion is rejected.');

// Session setup errors must remain unavailable, rather than granting a session.
const {sessionConfigurationReady}=await import('../lib/config.ts');
const configured={SUPABASE_URL:'https://project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-publishable',SUPABASE_SERVICE_ROLE_KEY:'test-service',PARTICIPANT_ID_SECRET:'a'.repeat(32)};
assert.equal(sessionConfigurationReady(configured),true);
for(const key of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'])assert.equal(sessionConfigurationReady({...configured,[key]:''}),false);
assert.equal(sessionConfigurationReady({...configured,SUPABASE_URL:'https://YOUR_PROJECT.supabase.co'}),false);
assert.equal(sessionConfigurationReady({...configured,SUPABASE_URL:'invalid'}),false);
assert.equal(sessionConfigurationReady({...configured,SUPABASE_PUBLISHABLE_KEY:'',PARTICIPANT_ID_SECRET:''}),true);
const {storageDiagnostic}=await import('../lib/storage-error.ts');
const sessionCode=ts.transpileModule(fs.readFileSync('app/api/session/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import .*?;\s*$/gm,'').replace(/export /g,'');
let identityCalls=0;
const sessionApi=new Function('database','identity','noStore','sessionConfigurationReady','storageDiagnostic',sessionCode+';return {GET}')(database,async()=>{identityCalls++;return null},{'Cache-Control':'private, no-store, max-age=0'},()=>false,storageDiagnostic);
const unavailable=await sessionApi.GET(new Request('https://survey.test/api/session'));
assert.equal(unavailable.status,503);
assert.match((await unavailable.json()).error,/not configured/);
assert.equal(identityCalls,0);
assert.match(unavailable.headers.get('Cache-Control'),/no-store/);
console.log('PASS: missing, placeholder and malformed storage settings fail closed with actionable errors.');

let browserKey=null;
const anonymousApi=new Function('database','identity','sameOrigin','noStore','valid','MEALS','participantKey',code+';return {GET,POST,DELETE}')(database,identity,sameOrigin,noStore,valid,MEALS,async()=>browserKey);
browserKey='anonymous:test-browser';
assert.equal((await anonymousApi.POST(req('POST',{}))).status,400);
const browserSession=new Function('database','identity','noStore','sessionConfigurationReady','participantKey','storageDiagnostic',sessionCode+';return {GET}')( ()=>({rpc:async()=>({data:{response_id:'test-id',submitted_at:null},error:null})}),async()=>null,{},()=>true,async()=>browserKey,storageDiagnostic);
const initialized=await browserSession.GET(new Request('https://survey.test/api/session'));
assert.equal(initialized.status,200);
assert.deepEqual(await initialized.json(),{authenticated:true,admin:false,id:'test-id',submitted:false});
const adminSession=await browserSession.GET(new Request('https://survey.test/api/session?admin=1'));
assert.deepEqual(await adminSession.json(),{authenticated:false,admin:false});
console.log('PASS: anonymous browsers initialize without email auth; legacy admin session remains separate.');
const survey={id:crypto.randomUUID(),version:2,ratings:Object.fromEntries(MEALS.map((m,i)=>[m,String(i+1)])),ranking:MEALS,year:'Senior',house:'Avery',...makePairs(MEALS,Object.fromEntries(MEALS.map((m,i)=>[m,String(i+1)])))};
survey.pairs=survey.pairs.map(p=>({...p,choices:Array(9).fill(p.inc)}));
let saved=false;
const submissionApi=new Function('database','identity','sameOrigin','noStore','valid','MEALS','participantKey',code+';return {POST}')( ()=>({rpc:async(name,args)=>{assert.equal(name,'submit_response');assert.equal(args.p_key,browserKey);assert.equal(args.p_id,survey.id);const data=saved?'already_submitted':'saved';saved=true;return {data,error:null}}}),async()=>{throw Error('Participant submission must not require email auth')},sameOrigin,noStore,valid,MEALS,async()=>browserKey);
assert.equal((await submissionApi.POST(req('POST',survey))).status,200);
assert.equal((await submissionApi.POST(req('POST',survey))).status,409);
console.log('PASS: completed anonymous submissions save through the database RPC and duplicates return 409.');

for (const [failure,expected] of [
  [{code:'PGRST202'},'STORAGE_SCHEMA'],
  [{code:'42P01'},'STORAGE_SCHEMA'],
  [{code:'42501'},'STORAGE_ACCESS'],
  [{message:'Invalid API key'},'STORAGE_ACCESS'],
  [{message:'TypeError: fetch failed'},'STORAGE_CONNECTION'],
  [{message:'secret-should-not-leak'},'STORAGE_UNAVAILABLE']
]) {
  const failing=new Function('database','identity','noStore','sessionConfigurationReady','participantKey','storageDiagnostic',sessionCode+';return {GET}')(()=>({rpc:async()=>({data:null,error:failure})}),async()=>null,{'Cache-Control':'no-store'},()=>true,async()=>browserKey,storageDiagnostic);
  const response=await failing.GET(new Request('https://survey.test/api/session'));
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal(body.code,expected);
  assert.equal(JSON.stringify(body).includes('secret-should-not-leak'),false);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
}
console.log('PASS: session failures distinguish schema, permissions, connectivity, and unknown errors without exposing raw errors.');
