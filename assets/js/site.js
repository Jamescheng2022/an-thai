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
    const body = encodeURIComponent(`Name: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\nRequest: ${type}\n\n${message}`);
    window.location.href = `mailto:chengjian1021@163.com?subject=${subject}&body=${body}`;
  });
}
