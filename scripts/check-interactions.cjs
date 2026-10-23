// Interaction contracts run without network or a mail client.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/site.js'), 'utf8');
function setup(search, lang = 'en', mode = 'success') {
  const handlers = {}, buttonHandlers = {}, attrs = {'aria-expanded':'false'}, linkHandlers = {}, states = {};
  const elements = {requestType:{value:'Engineering services'}, message:{value:''}};
  const submit = {disabled:true}, note = {textContent:''};
  const formHandlers = {};
  const form = {elements, addEventListener:(e,f)=>formHandlers[e]=f, querySelector:()=>submit,
    querySelectorAll:()=>[], reset:()=>{states.reset=true;}};
  const menu = {getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v, addEventListener:(e,f)=>buttonHandlers[e]=f,focus:()=>states.focused=true};
  const nav = {querySelector:()=>({focus:()=>states.linkFocused=true}),classList:{toggle:(k,v)=>states[k]=v},querySelectorAll:()=>[{addEventListener:(e,f)=>linkHandlers[e]=f}]};
  const location = {search,href:'',pathname:'/contact.html'};
  const ctx = {URLSearchParams,encodeURIComponent,AbortController,setTimeout,clearTimeout,
    fetch:async (url, options)=>{
      states.request={url,options};
      if(mode==='network') throw new Error('offline');
      return {ok:mode!=='failure',json:async()=>({ok:mode!=='bad-response'})};
    },
    FormData:class{get(k){return {requestType:elements.requestType.value,name:'QA & 中文',company:'Test + Co',email:'qa@example.test',phone:'+66 123',message:elements.message.value,website:''}[k];}},document:{documentElement:{lang,classList:{add(){}}},querySelector:s=>s==='.menu-btn'?menu:s==='.nav-links'?nav:form,addEventListener:(e,f)=>handlers[e]=f,getElementById:()=>note},window:{location,matchMedia:()=>({addEventListener:(e,f)=>handlers.resize=f})}};
  vm.runInNewContext(source,ctx);
  return {handlers,buttonHandlers,attrs,linkHandlers,states,elements,submit,note,formHandlers,location};
}
async function run() {
let s=setup('?type=equipment&category=measurement', 'en', 'failure');
assert.equal(s.elements.requestType.value,'Testing instruments');
assert.match(s.elements.message.value,/Load Cells \/ Sensors \/ DAQ/);
assert.equal(s.submit.disabled,false);
await s.formHandlers.submit({preventDefault(){}});
const u=new URL(s.location.href);
assert.equal(u.protocol,'mailto:');assert.equal(u.pathname,'info@an-thai.com');
assert.equal(u.searchParams.get('subject'),'AN-THAI enquiry: Testing instruments');
assert.match(u.searchParams.get('body'),/Name: QA & 中文/);assert.match(u.searchParams.get('body'),/Company: Test \+ Co/);
assert.match(s.note.textContent,/Please send from your email app/);
assert.equal(s.states.reset,undefined);
assert.equal(s.submit.disabled,false);
s.buttonHandlers.click();assert.equal(s.attrs['aria-expanded'],'true');assert.equal(s.states.open,true);assert.equal(s.states.linkFocused,true);
s.handlers.keydown({key:'Escape'});assert.equal(s.attrs['aria-expanded'],'false');assert.equal(s.states.focused,true);
s.buttonHandlers.click();s.linkHandlers.click();assert.equal(s.states.open,false);
s.buttonHandlers.click();s.handlers.click({target:{closest:()=>null}});assert.equal(s.states.open,false);
s.buttonHandlers.click();s.handlers.resize();assert.equal(s.attrs['aria-expanded'],'false');
const mapped={testing:'Engineering services',engineering:'Engineering services',equipment:'Testing instruments',instruments:'Testing instruments',steel:'Steel / space-structure cooperation',powder:'CNBM powder-equipment cooperation'};
for (const [type,value] of Object.entries(mapped)) {
  s=setup('?type='+type);assert.equal(s.elements.requestType.value,value);
}
for (const query of ['?type=invalid&category=__proto__','?type=__proto__&category=constructor']) {
  s=setup(query);assert.equal(s.elements.requestType.value,'Engineering services');assert.equal(s.elements.message.value,'');
}
for (const lang of ['en','zh-CN','th']) {
  s=setup('?type=equipment&category=measurement',lang);
  const pending = s.formHandlers.submit({preventDefault(){}});
  assert.equal(s.submit.disabled,true);
  const request = JSON.parse(s.states.request.options.body);
  assert.equal(s.states.request.url,'/api/enquiry');
  assert.equal(s.states.request.options.method,'POST');
  assert.equal(request.lang,lang);
  assert.equal(request.website,'');
  assert.ok(request.category);
  await pending;
  assert.equal(s.states.reset,true);
  assert.equal(s.location.href,'');
  assert.equal(s.submit.disabled,false);
  assert.match(s.note.textContent,lang==='en'?/submitted/:lang==='zh-CN'?/已提交/:/ส่งคำสอบถามแล้ว/);
  for (const mode of ['failure','network','bad-response']) {
    s=setup('',lang,mode);
    await s.formHandlers.submit({preventDefault(){}});
    assert.match(s.location.href,/^mailto:/);
    assert.equal(s.states.reset,undefined);
    assert.equal(s.submit.disabled,false);
    assert.match(s.note.textContent,lang==='en'?/email app/:lang==='zh-CN'?/邮件应用/:/แอปอีเมล/);
  }
}
console.log('PASS: business-route context, equipment detail, safe query fallback, encoded mailto, menu toggle/Escape/link/outside/resize.');
console.log('PASS: en/zh/th JSON submission, pending state, success/reset, HTTP/network/bad-response fallback with retained values. No email sent.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
