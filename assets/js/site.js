const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
if(menuBtn && navLinks){
  menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));
}
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>navLinks?.classList.remove('open')));

const quoteForm = document.querySelector('[data-quote-form]');
if(quoteForm){
  quoteForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const data = new FormData(quoteForm);
    const type = data.get('requestType') || 'Engineering enquiry';
    const name = data.get('name') || '';
    const company = data.get('company') || '';
    const email = data.get('email') || '';
    const phone = data.get('phone') || '';
    const message = data.get('message') || '';
    const subject = encodeURIComponent(`AN-THAI enquiry: ${type}`);
    const body = encodeURIComponent(
      `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\nRequest: ${type}\n\n${message}`
    );
    window.location.href = `mailto:chengjian1021@163.com?subject=${subject}&body=${body}`;
  });
}

// Load the approved AN-THAI brochure photography without depending on third-party image hosts.
async function loadBrochureSprite(){
  const parts = ['part-01.b64','part-02.b64','part-03.b64','part-04.b64','part-05a1.b64','part-05a2.b64','part-05b.b64','part-06a.b64','part-06b.b64','part-07.b64','part-08.b64'].map(name=>`assets/images/brochure-sprite/${name}`);
  try{
    const chunks = await Promise.all(parts.map(async path=>{
      const response = await fetch(path,{cache:'force-cache'});
      if(!response.ok) throw new Error(`Unable to load ${path}`);
      return (await response.text()).trim();
    }));
    document.documentElement.style.setProperty('--brochure-sprite',`url("data:image/webp;base64,${chunks.join('')}")`);
    document.documentElement.classList.add('brochure-ready');
  }catch(error){
    console.warn('AN-THAI brochure imagery could not be loaded; using visual fallback.',error);
  }
}
loadBrochureSprite();
