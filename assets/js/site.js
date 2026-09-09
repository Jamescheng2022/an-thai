// Native images load independently of this small interaction layer.
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
document.documentElement.classList.add('js');
function setMenu(open) {
  navLinks?.classList.toggle('open', open);
  menuBtn?.setAttribute('aria-expanded', String(open));
  menuBtn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) navLinks?.querySelector('a')?.focus();
}
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuBtn.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
window.matchMedia('(min-width: 1121px)').addEventListener('change', () => setMenu(false));

const quoteForm = document.querySelector('[data-quote-form]');
if (quoteForm) {
  const params = new URLSearchParams(window.location.search);
  const types = {testing: 'Testing service', equipment: 'Testing equipment'};
  if (Object.hasOwn(types, params.get('type'))) quoteForm.elements.requestType.value = types[params.get('type')];
  const categories = {
    pile: 'Pile Integrity Testing Instruments', dynamic: 'High-Strain / Dynamic Pile Testing Systems',
    ultrasonic: 'CSL / Ultrasonic Testing Systems', static: 'Static Load Test Instrumentation',
    field: 'Geotechnical & Field Testing Equipment', lab: 'Material / Laboratory Testing Equipment',
    measurement: 'Load Cells / Sensors / DAQ', support: 'Setup / Training / Technical Support'
  };
  const category = Object.hasOwn(categories, params.get('category')) ? categories[params.get('category')] : null;
  if (params.get('type') === 'equipment' && category) quoteForm.elements.message.value = `Equipment category: ${category}\n\nRequirements: `;
  quoteForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(quoteForm);
    const type = data.get('requestType') || 'Engineering enquiry';
    const body = `Name: ${data.get('name') || ''}\nCompany: ${data.get('company') || ''}\nEmail: ${data.get('email') || ''}\nPhone: ${data.get('phone') || ''}\nRequest: ${type}\n\n${data.get('message') || ''}`;
    const mailto = `mailto:info@an-thai.com?subject=${encodeURIComponent(`AN-THAI enquiry: ${type}`)}&body=${encodeURIComponent(body)}`;
    document.getElementById('enquiry-note').textContent = 'Your enquiry is prepared. Send it from your email app. If no app opens, email info@an-thai.com or anthaicheng@gmail.com directly. Nothing has been sent by this website.';
    window.location.href = mailto;
  });
  quoteForm.querySelector('button[type="submit"]').disabled = false;
}
