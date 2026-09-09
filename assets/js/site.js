// Native images load independently of this small interaction layer.
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
document.documentElement.classList.add('js');
function setMenu(open) {
  navLinks?.classList.toggle('open', open);
  menuBtn?.setAttribute('aria-expanded', String(open));
  menuBtn?.setAttribute('aria-label', open ? (menuBtn.getAttribute('data-close-label') || 'Close menu') : (menuBtn.getAttribute('data-open-label') || 'Open menu'));
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

// Keep motion small and useful: reveal content as it enters the reading area.
const revealItems = document.querySelectorAll ? document.querySelectorAll('.reveal') : [];
if ('IntersectionObserver' in window && revealItems.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: .12});
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

const quoteForm = document.querySelector('[data-quote-form]');
if (quoteForm) {
  const lang = document.documentElement.lang || 'en';
  const copy = lang.startsWith('zh') ? {
    category:'设备类别', requirements:'需求', enquiry:'安泰询价', labels:['姓名','公司','邮箱','联系方式','需求类型'],
    status:'询价内容已准备好，请在邮件应用中发送。如未打开邮件应用，请直接联系 info@an-thai.com 或 anthaicheng@gmail.com。本网站尚未发送任何邮件。',
    categories:['桩身完整性检测仪器','高应变／动力桩基检测系统','声波透射／超声检测系统','静载试验测量仪器','岩土与现场检测设备','材料／实验室检测设备','荷载传感器／传感器／数据采集系统','安装／培训／技术支持']
  } : lang === 'th' ? {
    category:'หมวดหมู่เครื่องมือ', requirements:'ข้อกำหนด', enquiry:'สอบถาม AN-THAI', labels:['ชื่อ','บริษัท','อีเมล','ช่องทางติดต่อ','ประเภทคำสอบถาม'],
    status:'เตรียมคำสอบถามแล้ว โปรดส่งจากแอปอีเมล หากแอปไม่เปิด ให้ติดต่อ info@an-thai.com หรือ anthaicheng@gmail.com โดยตรง เว็บไซต์ยังไม่ได้ส่งอีเมลใด ๆ',
    categories:['เครื่องมือทดสอบความสมบูรณ์ของเสาเข็ม','ระบบทดสอบเสาเข็มแบบพลศาสตร์ความเครียดสูง','ระบบทดสอบคลื่นเสียงผ่านท่อ / อัลตราโซนิก','เครื่องมือวัดสำหรับการทดสอบรับน้ำหนักแบบสถิต','เครื่องมือทดสอบปฐพีและภาคสนาม','เครื่องมือทดสอบวัสดุ / ห้องปฏิบัติการ','โหลดเซลล์ / เซนเซอร์ / ระบบเก็บข้อมูล','การติดตั้ง / ฝึกอบรม / สนับสนุนทางเทคนิค']
  } : {category:'Equipment category',requirements:'Requirements',enquiry:'AN-THAI enquiry',labels:['Name','Company','Email','Phone','Request'],status:'Your enquiry is prepared. Send it from your email app. If no app opens, email info@an-thai.com or anthaicheng@gmail.com directly. Nothing has been sent by this website.'};
  const params = new URLSearchParams(window.location.search);
  if (!lang.startsWith('en')) quoteForm.querySelectorAll('input,textarea,select').forEach(field => {
    field.addEventListener('input', () => field.setCustomValidity(''));
    field.addEventListener('invalid', () => {
      field.setCustomValidity('');
      if (field.validity.valueMissing) field.setCustomValidity(lang.startsWith('zh') ? '请填写此项。' : 'กรุณากรอกข้อมูลในช่องนี้');
      else if (field.validity.typeMismatch) field.setCustomValidity(lang.startsWith('zh') ? '请输入有效的邮箱地址。' : 'กรุณากรอกอีเมลที่ถูกต้อง');
    });
  });
  const types = {testing: 'Testing service', equipment: 'Testing equipment'};
  if (Object.hasOwn(types, params.get('type'))) quoteForm.elements.requestType.value = types[params.get('type')];
  const categories = {
    pile: 'Pile Integrity Testing Instruments', dynamic: 'High-Strain / Dynamic Pile Testing Systems',
    ultrasonic: 'CSL / Ultrasonic Testing Systems', static: 'Static Load Test Instrumentation',
    field: 'Geotechnical & Field Testing Equipment', lab: 'Material / Laboratory Testing Equipment',
    measurement: 'Load Cells / Sensors / DAQ', support: 'Setup / Training / Technical Support'
  };
  const categoryIndex = Object.keys(categories).indexOf(params.get('category'));
  const category = categoryIndex >= 0 ? (copy.categories?.[categoryIndex] || categories[params.get('category')]) : null;
  if (params.get('type') === 'equipment' && category) quoteForm.elements.message.value = `${copy.category}: ${category}\n\n${copy.requirements}: `;
  quoteForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(quoteForm);
    const type = quoteForm.elements.requestType.selectedOptions?.[0]?.textContent || data.get('requestType') || copy.enquiry;
    const body = ['name','company','email','phone'].map((key,i)=>`${copy.labels[i]}: ${data.get(key)||''}`).join('\n') + `\n${copy.labels[4]}: ${type}\n\n${data.get('message')||''}`;
    const mailto = `mailto:info@an-thai.com?subject=${encodeURIComponent(`${copy.enquiry}: ${type}`)}&body=${encodeURIComponent(body)}`;
    document.getElementById('enquiry-note').textContent = copy.status;
    window.location.href = mailto;
  });
  quoteForm.querySelector('button[type="submit"]').disabled = false;
}

// Preserve enquiry context when changing language on the same page.
document.querySelectorAll?.('[data-language]').forEach(link => {
  const target = new URL(link.href);
  target.search = window.location.search;
  target.hash = window.location.hash;
  link.href = target.href;
});
