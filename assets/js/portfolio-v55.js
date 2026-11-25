/* Preview reference browser. No fabricated engineering claims, scores or external tracking. */
(()=>{'use strict';
const root=document.querySelector('[data-pr-root]');if(!root)return;
const state={items:[],category:'All',q:''};
const list=root.querySelector('#prList'),count=root.querySelector('#prCount'),dialog=root.querySelector('#prDialog'),search=root.querySelector('#prSearch');
const clean=s=>String(s??'');
function category(c){state.category=c;root.querySelectorAll('[data-pr-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.prFilter===c)));render();document.querySelector('#prRegister')?.scrollIntoView({behavior:'smooth',block:'start'});}
function render(){
 const q=state.q.toLowerCase();let shown=state.items.filter(i=>(state.category==='All'||i.category===state.category)&&(!q||[i.title,i.company,i.category].join(' ').toLowerCase().includes(q)));
 count.textContent=shown.length+' references';list.replaceChildren();
 if(!shown.length){const p=document.createElement('p');p.className='pr-empty';p.textContent='No matching reference';list.append(p);return;}
 for(const i of shown){const b=document.createElement('button');b.type='button';b.className='pr-item';const h=document.createElement('h3');h.textContent=i.title;const small=document.createElement('small');small.textContent=(i.company.includes('PACO')?'PACO':'ROGE')+' · '+i.category;b.append(h,small);b.addEventListener('click',()=>open(i));list.append(b);}
}
function open(i){
 root.querySelector('#prDialogTitle').textContent=i.title;
 root.querySelector('#prDialogCompany').textContent=i.company;
 root.querySelector('#prDialogType').textContent=i.category;
 root.querySelector('#prDialogProof').textContent=i.sourceKind;
 root.querySelector('#prDialogStatus').textContent=i.verification;
 let a=root.querySelector('#prDialogSource');a.href=i.sourceUrl;a.textContent='Original source';
 dialog.showModal();
}
root.querySelectorAll('[data-pr-filter]').forEach(b=>b.addEventListener('click',()=>category(b.dataset.prFilter)));
search.addEventListener('input',e=>{state.q=e.target.value.trim();render()});
root.querySelector('#prClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
fetch('/content/project-references-review.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('reference dataset unavailable');return r.json()}).then(d=>{state.items=d.items||[];render()}).catch(()=>{count.textContent='References unavailable';const p=document.createElement('p');p.className='pr-empty';p.textContent='Review dataset could not be loaded.';list.replaceChildren(p)});
})();