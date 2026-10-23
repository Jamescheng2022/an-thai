// Interaction contracts run without network or a mail client.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/site.js'), 'utf8');
function setup(search, lang = 'en', mode = 'success', cryptoMode = 'uuid') {
  const handlers = {}, buttonHandlers = {}, attrs = {'aria-expanded':'false'}, linkHandlers = {}, states = {};
  const elements = {requestType:{value:'Engineering services'}, message:{value:''}};
  const submit = {disabled:true}, note = {textContent:''};
  note.append = (...items) => {states.emailLink = items.at(-1);};
  states.mode = mode;
  states.requests = [];
  states.elapsed = 0;
  const formHandlers = {};
  const form = {elements, addEventListener:(e,f)=>formHandlers[e]=f, querySelector:()=>submit,
    querySelectorAll:()=>[], reset:()=>{states.reset=true;}};
  const menu = {getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v, addEventListener:(e,f)=>buttonHandlers[e]=f,focus:()=>states.focused=true};
  const nav = {querySelector:()=>({focus:()=>states.linkFocused=true}),classList:{toggle:(k,v)=>states[k]=v},querySelectorAll:()=>[{addEventListener:(e,f)=>linkHandlers[e]=f}]};
  const location = {search,href:'',pathname:'/contact.html'};
  const webcrypto = require('node:crypto').webcrypto;
  const ctx = {URLSearchParams,encodeURIComponent,AbortController,clearTimeout,
    performance:{now:()=>states.elapsed},
    Date:class extends Date {static now(){throw new Error('Client must not use wall-clock time');}},
    crypto:cryptoMode==='uuid'?webcrypto:cryptoMode==='bytes'?{getRandomValues:bytes=>webcrypto.getRandomValues(bytes)}:{},
    setTimeout:(fn,delay)=>{if(states.mode==='timeout'){queueMicrotask(fn);return 0;}return setTimeout(fn,delay);},
    fetch:async (url, options)=>{
      states.request={url,options};
      states.requests.push(states.request);
      if(states.mode==='network') throw new Error('offline');
      if(states.mode==='timeout') return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('timeout'))));
      const status = {failure:503,invalid:400,retry:400,limited:429,uncertain:502}[states.mode] || 200;
      return {status,ok:status===200,json:async()=>({ok:status===200 && states.mode!=='bad-response',retry:states.mode==='retry',fallback:status===503?'mailto':undefined})};
    },
    FormData:class{get(k){return {requestType:elements.requestType.value,name:'QA & 中文',company:'Test + Co',email:'qa@example.test',phone:'+66 123',message:elements.message.value,website:''}[k];}},document:{documentElement:{lang,classList:{add(){}}},createElement:()=>({}),querySelector:s=>s==='.menu-btn'?menu:s==='.nav-links'?nav:form,addEventListener:(e,f)=>handlers[e]=f,getElementById:()=>note},window:{location,matchMedia:()=>({addEventListener:(e,f)=>handlers.resize=f})}};
  vm.runInNewContext(source,ctx);
  states.elapsed = 5000;
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
  assert.equal(request.elapsedMs,5000);
  assert.equal(request.renderedAt,undefined);
  assert.match(request.enquiryId,/^[0-9a-f-]{36}$/);
  await s.formHandlers.submit({preventDefault(){}});
  assert.equal(s.states.requests.length,1); // Second click while in flight is ignored.
  await pending;
  assert.equal(s.states.reset,true);
  assert.equal(s.location.href,'');
  assert.equal(s.submit.disabled,false);
  assert.match(s.note.textContent,lang==='en'?/submitted/:lang==='zh-CN'?/已提交/:/ส่งคำสอบถามแล้ว/);
  for (const mode of ['failure','invalid','limited']) {
    s=setup('',lang,mode);
    await s.formHandlers.submit({preventDefault(){}});
    assert.match(s.location.href,/^mailto:/);
    assert.equal(s.states.reset,undefined);
    assert.equal(s.submit.disabled,false);
    assert.match(s.states.emailLink.href,/^mailto:/);
    assert.match(s.note.textContent,mode==='limited'?(lang==='en'?/Too many requests/:lang==='zh-CN'?/请求过多/:/มากเกินไป/):(lang==='en'?/email app/:lang==='zh-CN'?/邮件应用/:/แอปอีเมล/));
  }
  for (const mode of ['network','timeout','uncertain','bad-response']) {
    s=setup('',lang,mode);
    s.elements.message.value='Retain my enquiry';
    await s.formHandlers.submit({preventDefault(){}});
    assert.equal(s.location.href,'');
    assert.equal(s.states.reset,undefined);
    assert.equal(s.elements.message.value,'Retain my enquiry');
    assert.equal(s.submit.disabled,false);
    assert.match(s.note.textContent,lang==='en'?/may already have been received.*1 business day/:lang==='zh-CN'?/可能已经收到.*1 个工作日/:/อาจได้รับแล้ว.*1 วันทำการ/);
    assert.match(s.states.emailLink.href,/^mailto:/);
    assert.ok(s.states.emailLink.textContent);
    const first = JSON.parse(s.states.request.options.body);
    s.states.elapsed += 1000;
    await s.formHandlers.submit({preventDefault(){}});
    const retry = JSON.parse(s.states.request.options.body);
    assert.equal(retry.enquiryId,first.enquiryId);
    assert.equal(retry.elapsedMs,first.elapsedMs + 1000);
    s.elements.message.value='Changed enquiry';
    await s.formHandlers.submit({preventDefault(){}});
    assert.notEqual(JSON.parse(s.states.request.options.body).enquiryId,first.enquiryId);
  }
  s=setup('',lang,'retry');
  s.elements.message.value='Keep my details';
  s.states.elapsed=2000;
  await s.formHandlers.submit({preventDefault(){}});
  assert.equal(s.location.href,'');
  assert.equal(s.states.reset,undefined);
  assert.equal(s.elements.message.value,'Keep my details');
  assert.equal(s.submit.disabled,false);
  assert.match(s.note.textContent,lang==='en'?/Please check your details and submit again/:lang==='zh-CN'?/请检查您的信息并再次提交/:/โปรดตรวจสอบข้อมูลและส่งอีกครั้ง/);
  const tooFastId=JSON.parse(s.states.request.options.body).enquiryId;
  s.states.elapsed=3000;
  s.states.mode='success';
  await s.formHandlers.submit({preventDefault(){}});
  assert.equal(JSON.parse(s.states.request.options.body).enquiryId,tooFastId);
  assert.equal(JSON.parse(s.states.request.options.body).elapsedMs,3000);
  assert.equal(s.states.reset,true);

  s=setup('',lang,'timeout');
  s.elements.message.value='Possibly delivered';
  await s.formHandlers.submit({preventDefault(){}});
  const uncertainId=JSON.parse(s.states.request.options.body).enquiryId;
  for (const mode of ['network','limited','failure','invalid','retry','uncertain']) {
    s.states.mode=mode;
    await s.formHandlers.submit({preventDefault(){}});
    assert.equal(JSON.parse(s.states.request.options.body).enquiryId,uncertainId);
    assert.equal(s.location.href,'');
    assert.equal(s.states.reset,undefined);
    assert.equal(s.elements.message.value,'Possibly delivered');
    assert.match(s.states.emailLink.href,/^mailto:/);
    assert.match(s.note.textContent,lang==='en'?/may already have been received/:lang==='zh-CN'?/可能已经收到/:/อาจได้รับแล้ว/);
  }
  s.elements.message.value='A separate enquiry';
  s.states.mode='limited';
  await s.formHandlers.submit({preventDefault(){}});
  assert.notEqual(JSON.parse(s.states.request.options.body).enquiryId,uncertainId);
  assert.match(s.location.href,/^mailto:/);
}
for (const mode of ['uuid','bytes','random']) {
  s=setup('','en','network',mode);
  await s.formHandlers.submit({preventDefault(){}});
  const first = JSON.parse(s.states.request.options.body).enquiryId;
  assert.match(first,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  await s.formHandlers.submit({preventDefault(){}});
  assert.equal(JSON.parse(s.states.request.options.body).enquiryId,first);
  s.states.mode='success';
  await s.formHandlers.submit({preventDefault(){}});
  await s.formHandlers.submit({preventDefault(){}});
  assert.notEqual(JSON.parse(s.states.request.options.body).enquiryId,first);
}
console.log('PASS: business-route context, equipment detail, safe query fallback, encoded mailto, menu toggle/Escape/link/outside/resize.');
console.log('PASS: en/zh/th monotonic elapsed time without wall clock, in-flight guard, success/reset, definite-failure fallback.');
console.log('PASS: en/zh/th retryable 400 keeps input and allows resubmission with the same ID.');
console.log('PASS: timeout -> retries -> 429/503/network/400 retains uncertain outcome per ID and never auto-opens mailto.');
console.log('PASS: en/zh/th network/timeout/uncertain responses preserve content, show explicit email button, never auto-open mailto.');
console.log('PASS: stable retry IDs, changed-content/new-success IDs, randomUUID/getRandomValues/random fallbacks. No email sent.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
