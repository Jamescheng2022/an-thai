// Interaction contracts run without network or a mail client.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/site.js'), 'utf8');
function setup(search) {
  const handlers = {}, buttonHandlers = {}, attrs = {'aria-expanded':'false'}, linkHandlers = {}, states = {};
  const elements = {requestType:{value:'Testing service'}, message:{value:''}};
  const submit = {disabled:true}, note = {textContent:''};
  const formHandlers = {};
  const form = {elements, addEventListener:(e,f)=>formHandlers[e]=f, querySelector:()=>submit};
  const menu = {getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v, addEventListener:(e,f)=>buttonHandlers[e]=f,focus:()=>states.focused=true};
  const nav = {querySelector:()=>({focus:()=>states.linkFocused=true}),classList:{toggle:(k,v)=>states[k]=v},querySelectorAll:()=>[{addEventListener:(e,f)=>linkHandlers[e]=f}]};
  const location = {search,href:''};
  const ctx = {URLSearchParams,encodeURIComponent,FormData:class{get(k){return {requestType:elements.requestType.value,name:'QA & 中文',company:'Test + Co',email:'qa@example.test',phone:'+66 123',message:elements.message.value}[k];}},document:{documentElement:{classList:{add(){}}},querySelector:s=>s==='.menu-btn'?menu:s==='.nav-links'?nav:form,addEventListener:(e,f)=>handlers[e]=f,getElementById:()=>note},window:{location,matchMedia:()=>({addEventListener:(e,f)=>handlers.resize=f})}};
  vm.runInNewContext(source,ctx);
  return {handlers,buttonHandlers,attrs,linkHandlers,states,elements,submit,note,formHandlers,location};
}
let s=setup('?type=equipment&category=measurement');
assert.equal(s.elements.requestType.value,'Testing equipment');
assert.match(s.elements.message.value,/Load Cells \/ Sensors \/ DAQ/);
assert.equal(s.submit.disabled,false);
s.formHandlers.submit({preventDefault(){}});
const u=new URL(s.location.href);
assert.equal(u.protocol,'mailto:');assert.equal(u.pathname,'chengjian1021@163.com');
assert.equal(u.searchParams.get('subject'),'AN-THAI enquiry: Testing equipment');
assert.match(u.searchParams.get('body'),/Name: QA & 中文/);assert.match(u.searchParams.get('body'),/Company: Test \+ Co/);
assert.match(s.note.textContent,/Nothing has been sent/);
s.buttonHandlers.click();assert.equal(s.attrs['aria-expanded'],'true');assert.equal(s.states.open,true);assert.equal(s.states.linkFocused,true);
s.handlers.keydown({key:'Escape'});assert.equal(s.attrs['aria-expanded'],'false');assert.equal(s.states.focused,true);
s.buttonHandlers.click();s.linkHandlers.click();assert.equal(s.states.open,false);
s.buttonHandlers.click();s.handlers.click({target:{closest:()=>null}});assert.equal(s.states.open,false);
s.buttonHandlers.click();s.handlers.resize();assert.equal(s.attrs['aria-expanded'],'false');
for (const query of ['?type=testing','?type=invalid&category=__proto__','?type=__proto__&category=constructor']) {
  s=setup(query);assert.equal(s.elements.requestType.value,'Testing service');assert.equal(s.elements.message.value,'');
}
console.log('PASS: equipment context, safe query fallback, encoded enquiry, truthful status, menu toggle/Escape/link/outside/resize. No email sent.');
