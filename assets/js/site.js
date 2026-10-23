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
    success:'您的询盘已提交，我们会尽快回复。', pending:'正在提交询盘…',
    uncertain:'无法确认是否送达，您的询盘可能已经收到。如在 1 个工作日内未收到回复，请通过邮件发送。',
    limited:'请求过多，请直接发送邮件联系我们。', emailLink:'通过邮件发送',
    status:'无法确认在线提交。请在邮件应用中发送；如未打开，请直接发送至 info@an-thai.com 或 anthaicheng@gmail.com。',
    categories:['桩身完整性检测仪器','高应变／动力桩基检测系统','声波透射／超声检测系统','静载试验测量仪器','岩土与现场检测设备','材料／实验室检测设备','荷载传感器／传感器／数据采集系统','安装／培训／技术支持']
  } : lang === 'th' ? {
    category:'หมวดหมู่เครื่องมือ', requirements:'ข้อกำหนด', enquiry:'สอบถาม AN-THAI', labels:['ชื่อ','บริษัท','อีเมล','ช่องทางติดต่อ','ประเภทคำสอบถาม'],
    success:'ส่งคำสอบถามแล้ว เราจะติดต่อกลับโดยเร็ว', pending:'กำลังส่งคำสอบถาม…',
    uncertain:'เราไม่สามารถยืนยันการส่งได้ คำสอบถามของคุณอาจได้รับแล้ว หากไม่ได้รับการติดต่อกลับภายใน 1 วันทำการ โปรดส่งทางอีเมล',
    limited:'ส่งคำขอมากเกินไป โปรดติดต่อเราทางอีเมลโดยตรง', emailLink:'ส่งทางอีเมล',
    status:'ไม่สามารถยืนยันการส่งออนไลน์ได้ โปรดส่งจากแอปอีเมล หากแอปไม่เปิด ให้ส่งตรงถึง info@an-thai.com หรือ anthaicheng@gmail.com',
    categories:['เครื่องมือทดสอบความสมบูรณ์ของเสาเข็ม','ระบบทดสอบเสาเข็มแบบพลศาสตร์ความเครียดสูง','ระบบทดสอบคลื่นเสียงผ่านท่อ / อัลตราโซนิก','เครื่องมือวัดสำหรับการทดสอบรับน้ำหนักแบบสถิต','เครื่องมือทดสอบปฐพีและภาคสนาม','เครื่องมือทดสอบวัสดุ / ห้องปฏิบัติการ','โหลดเซลล์ / เซนเซอร์ / ระบบเก็บข้อมูล','การติดตั้ง / ฝึกอบรม / สนับสนุนทางเทคนิค']
  } : {category:'Equipment category',requirements:'Requirements',enquiry:'AN-THAI enquiry',labels:['Name','Company','Email','Phone','Request'],success:'Your enquiry has been submitted. We will be in touch soon.',pending:'Submitting your enquiry…',status:'Online submission could not be confirmed. Please send from your email app. If no app opens, email info@an-thai.com or anthaicheng@gmail.com directly.'};
  const params = new URLSearchParams(window.location.search);
  if (lang.startsWith('en')) Object.assign(copy, {
    uncertain:'We could not confirm delivery. Your enquiry may already have been received. If you don\'t hear from us within 1 business day, send it by email.',
    limited:'Too many requests, please email us directly.', emailLink:'Send by email'
  });
  let renderedAt = Date.now();
  let lastContent = '', enquiryId = '';
  function newEnquiryId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  if (!lang.startsWith('en')) quoteForm.querySelectorAll('input,textarea,select').forEach(field => {
    field.addEventListener('input', () => field.setCustomValidity(''));
    field.addEventListener('invalid', () => {
      field.setCustomValidity('');
      if (field.validity.valueMissing) field.setCustomValidity(lang.startsWith('zh') ? '请填写此项。' : 'กรุณากรอกข้อมูลในช่องนี้');
      else if (field.validity.typeMismatch) field.setCustomValidity(lang.startsWith('zh') ? '请输入有效的邮箱地址。' : 'กรุณากรอกอีเมลที่ถูกต้อง');
    });
  });
  const types = {testing:'Engineering services',engineering:'Engineering services',equipment:'Testing instruments',instruments:'Testing instruments',steel:'Steel / space-structure cooperation',powder:'CNBM powder-equipment cooperation'};
  if (Object.hasOwn(types, params.get('type'))) quoteForm.elements.requestType.value = types[params.get('type')];
  const categories = {
    pile: 'Pile Integrity Testing Instruments', dynamic: 'High-Strain / Dynamic Pile Testing Systems',
    ultrasonic: 'CSL / Ultrasonic Testing Systems', static: 'Static Load Test Instrumentation',
    field: 'Geotechnical & Field Testing Equipment', lab: 'Material / Laboratory Testing Equipment',
    measurement: 'Load Cells / Sensors / DAQ', support: 'Setup / Training / Technical Support'
  };
  const categoryIndex = Object.keys(categories).indexOf(params.get('category'));
  const category = categoryIndex >= 0 ? (copy.categories?.[categoryIndex] || categories[params.get('category')]) : null;
  if (['equipment','instruments'].includes(params.get('type')) && category) quoteForm.elements.message.value = `${copy.category}: ${category}\n\n${copy.requirements}: `;
  const submit = quoteForm.querySelector('button[type="submit"]');
  quoteForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    const data = new FormData(quoteForm);
    const type = quoteForm.elements.requestType.selectedOptions?.[0]?.textContent || data.get('requestType') || copy.enquiry;
    const body = ['name','company','email','phone'].map((key,i)=>`${copy.labels[i]}: ${data.get(key)||''}`).join('\n') + `\n${copy.labels[4]}: ${type}\n\n${data.get('message')||''}`;
    const mailto = `mailto:info@an-thai.com?subject=${encodeURIComponent(`${copy.enquiry}: ${type}`)}&body=${encodeURIComponent(body)}`;
    const note = document.getElementById('enquiry-note');
    function offerEmail(message, open = false) {
      note.textContent = message;
      const link = document.createElement('a');
      link.href = mailto;
      link.className = 'btn';
      link.textContent = copy.emailLink;
      note.append(' ', link);
      if (open) window.location.href = mailto;
    }
    note.textContent = copy.pending;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const payload = {};
      for (const field of ['name','company','email','phone','requestType','message','website']) payload[field] = data.get(field) || '';
      payload.category = category || '';
      payload.page = window.location.pathname;
      payload.lang = lang;
      const content = JSON.stringify(payload);
      if (content !== lastContent || !enquiryId) {
        enquiryId = newEnquiryId();
        lastContent = content;
      }
      payload.enquiryId = enquiryId;
      payload.renderedAt = renderedAt;
      const response = await fetch('/api/enquiry', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (response.status === 429) {
        offerEmail(copy.limited, true);
        return;
      }
      if (response.status === 400 || response.status === 403) {
        offerEmail(copy.status, true);
        return;
      }
      const result = await response.json();
      if (response.status === 503 && result.fallback === 'mailto') {
        offerEmail(copy.status, true);
        return;
      }
      if (!response.ok || result.ok !== true) throw new Error('Delivery unconfirmed');
      note.textContent = copy.success;
      quoteForm.reset();
      renderedAt = Date.now();
      enquiryId = '';
      lastContent = '';
    } catch {
      offerEmail(copy.uncertain);
    } finally {
      clearTimeout(timeout);
      submit.disabled = false;
    }
  });
  submit.disabled = false;
}

// Preserve enquiry context when changing language on the same page.
document.querySelectorAll?.('[data-language]').forEach(link => {
  const target = new URL(link.href);
  target.search = window.location.search;
  target.hash = window.location.hash;
  link.href = target.href;
});
