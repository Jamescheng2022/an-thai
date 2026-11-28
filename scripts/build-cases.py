"""Build clean V1.0 Engineering Capabilities / Cases landing routes (hiding undisclosed external records)."""
from html import escape
from pathlib import Path
from urllib.parse import urlsplit
import json
import re

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://an-thai.com/'
e = escape

LANGS = [
    ('en', 'en', 'EN', 'EN', ''),
    ('zh', 'zh-CN', 'ZH', '中文', '/zh'),
    ('th', 'th', 'TH', 'ไทย', '/th'),
]

LOCALE_UI = {
    'en': {
        'title': 'Engineering Capabilities & Delivery Standards | AN-THAI Engineering',
        'desc': 'AN-THAI Engineering technical capabilities across foundation testing, buyer-side steel procurement, cement and mining process equipment, and testing instruments in Thailand.',
        'eyebrow': 'Technical Capabilities & Standards',
        'h1': 'Engineering Scope & Field Delivery Standards',
        'lead': 'From Bangkok and the Eastern Economic Corridor (EEC) to cross-border equipment supply, AN-THAI Engineering executes field testing, buyer-side fabrication QA/QC, and industrial process coordination under clear contractual scopes and traceable international codes.',
        'disciplinesTitle': 'Core Engineering & Procurement Disciplines',
        'disciplines': [
            ('/testing.html', '/assets/images/hero-field-clean.webp', 530, 318, '01 · Foundation Testing & Geotech', 'Static Load Testing (SLT), high-strain PDA/CAPWAP, low-strain PIT, Crosshole Sonic Logging (CSL), plate load tests, and soil boring per ASTM, TIS & EIT codes.', 'Explore Foundation Testing →', ''),
            ('/steel-procurement.html', '/assets/images/steel/steel-hero.webp', 1200, 670, '02 · Buyer-Side Steel Procurement', 'Independent buyer representation for structural steel & space frames: RFQ leveling, China fabricator qualification, NDT & welding inspection, MTC traceability, and pre-shipment release.', 'Explore Steel Procurement →', ''),
            ('/cement-mining-equipment.html', '/assets/images/cement-mining.webp', 1200, 670, '03 · Cement & Mining Process Equipment', 'Technical coordination and supply support for crushing, grinding (VRM/ball mill/roller press), pyro-processing peripherals, dust collection, conveying, electrical control, commissioning support, and spares.', 'Explore Cement & Mining Equipment →', ''),
            ('/testing-instruments.html', '/assets/images/field-instruments.webp', 1200, 670, '04 · Field Testing Instruments', 'Supply and technical support for pile integrity testers, CSL ultrasonic analyzers, hydraulic load cells, displacement transducers, and data acquisition systems.', 'Explore Testing Instruments →', ''),
        ],
        'credTitle': 'Project Credentials & Technical Documentation',
        'credBody': 'Representative method statements, anonymized sample test report formats, and discipline-specific track references are shared directly with prospective clients and engineering consultants during project scoping.',
        'credBtn': 'Discuss Project Scope →',
        'credWa': 'WhatsApp +66 90 292 1749',
        'credWeChat': 'WeChat QR',
        'viewDetail': 'View Technical Record →',
        'askSimilar': 'Discuss Similar Scope',
        'srcLabel': 'Reference:',
        'detailBack': '← Back to Capabilities',
        'detailAttrWarn': 'Attribution:',
        'detailOrg': 'Entity',
        'detailSvc': 'Engineering Discipline',
        'detailLocYr': 'Location / Year',
        'detailStd': 'Standards',
        'detailSrc': 'Reference',
        'detailImgCheck': 'Visual Type',
        'detailImgPass': 'Representative Engineering Visual',
        'detailSummaryH': '1. Summary',
        'detailScopeH': '2. Engineering Specifications',
        'detailDelivH': '3. Scope & Deliverables',
        'extTitle': 'Need Field Testing or Independent Procurement Support in Thailand?',
        'extBody': 'Reach our Bangkok bilingual engineering desk directly for test planning, fabricator audits, or instrument specifications.',
        'extBtn': 'Request Scope Review / Quotation →',
        'extTestBtn': '01 Foundation Testing Scope',
        'extSteelBtn': '02 Steel Procurement Scope',
    },
    'zh': {
        'title': '工程技术能力与交付标准 | 安泰工程 AN-THAI Engineering',
        'desc': '安泰工程在泰国提供地基与桩基检测、买方立场钢结构采购代理、水泥与矿山工艺装备协调及工程检测仪器供应服务。',
        'eyebrow': '工程交付能力与规范体系',
        'h1': '工程技术能力与交付标准',
        'lead': '立足曼谷与泰国东部经济走廊（EEC），安泰工程围绕国际工程规范（ASTM、BS、EN、ISO）与泰国本土标准（TIS、EIT、BMA），开展清晰的工程检测协调、买方钢构品控及工艺装备供应协调。',
        'disciplinesTitle': '四大核心工程与采购业务',
        'disciplines': [
            ('/zh/testing.html', '/assets/images/hero-field-clean.webp', 530, 318, '01 · 桩基检测与岩土工程', '严格遵循 ASTM、TIS 及 EIT 规范，协调执行静载试验（SLT）、高应变 PDA/CAPWAP、低应变 PIT、声波透射（CSL）、平板载荷试验及地质钻探取样。', '查看检测服务详情 →', ''),
            ('/zh/steel-procurement.html', '/assets/images/steel/steel-hero.webp', 1200, 670, '02 · 买方立场钢结构采购代理', '代表采购方提供重钢与网架结构可比性核价、中国制造厂产能与焊缝/无损检测核查、材质单（MTC）追溯与装船前放行把关。', '查看钢构采购详情 →', ''),
            ('/zh/cement-mining-equipment.html', '/assets/images/cement-mining.webp', 1200, 670, '03 · 水泥与矿山工艺装备', '面向水泥及矿山全流程产线提供设备技术协调与供货对接，覆盖破碎预均化、粉磨、烧成周边、选粉收尘、输送储运、矿山筛分、电控调试配合及备件。', '查看水泥矿山装备 →', ''),
            ('/zh/testing-instruments.html', '/assets/images/field-instruments.webp', 1200, 670, '04 · 工程检测仪器系统', '提供基桩完整性测试仪、声波透射超声记录仪、高精度荷载传感器、位移传感器及数据采集系统的选型供应与技术支持。', '查看检测仪器详情 →', ''),
        ],
        'credTitle': '代表性工程资料与技术范本',
        'credBody': '如贵方处于招投标、施工方案审查或设备选型阶段，欢迎直接联系曼谷技术团队索取对应学科的方法说明、报告范本及交付能力文件。',
        'credBtn': '提交项目需求沟通 →',
        'credWa': 'WhatsApp +66 90 292 1749',
        'credWeChat': '微信扫码',
        'viewDetail': '查看技术说明 →',
        'askSimilar': '咨询同类工程支持',
        'srcLabel': '参考来源：',
        'detailBack': '← 返回能力目录',
        'detailAttrWarn': '执行主体说明：',
        'detailOrg': '记录实体',
        'detailSvc': '工程学科分类',
        'detailLocYr': '项目地点 / 年份',
        'detailStd': '涉及标准 / 规范',
        'detailSrc': '参考来源',
        'detailImgCheck': '图片属性',
        'detailImgPass': '代表性工程摄影图',
        'detailSummaryH': '一、工程概述',
        'detailScopeH': '二、技术参数',
        'detailDelivH': '三、交付范围',
        'extTitle': '需要泰国本地桩基检测、钢构品控或检测仪器支持？',
        'extBody': '欢迎直接联络安泰工程曼谷中英泰三语团队获取技术方案与报价评估。',
        'extBtn': '提交项目需求 →',
        'extTestBtn': '01 基础检测与岩土工程',
        'extSteelBtn': '02 买方钢结构采购代理',
    },
    'th': {
        'title': 'ขีดความสามารถทางวิศวกรรมและมาตรฐานการส่งมอบ | AN-THAI Engineering',
        'desc': 'บริการทดสอบเสาเข็มและฐานราก จัดซื้อโครงสร้างเหล็กฝั่งผู้ซื้อ เครื่องจักรและระบบงานปูนซีเมนต์และเหมืองแร่ และเครื่องมือทดสอบภาคสนามในประเทศไทย',
        'eyebrow': 'ขีดความสามารถและมาตรฐานวิศวกรรม',
        'h1': 'ขีดความสามารถทางวิศวกรรมและมาตรฐานการส่งมอบ',
        'lead': 'AN-THAI Engineering ให้บริการประสานงานด้านการทดสอบฐานราก การตรวจสอบคุณภาพการจัดหาเหล็กโครงสร้างฝั่งผู้ซื้อ และเครื่องมือทดสอบในกรุงเทพฯ และพื้นที่ EEC ภายใต้มาตรฐานสากล (ASTM, BS, EN, ISO) และมาตรฐานไทย (มอก., วสท.)',
        'disciplinesTitle': '4 กลุ่มงานวิศวกรรมและการจัดหาหลัก',
        'disciplines': [
            ('/th/testing.html', '/assets/images/hero-field-clean.webp', 530, 318, '01 · งานทดสอบเสาเข็มและปฐพี', 'ประสานงานทดสอบรับน้ำหนักแบบสถิต (SLT), ทดสอบพลศาสตร์ (PDA/CAPWAP), ความสมบูรณ์เสาเข็ม (PIT/CSL), Plate Load และเจาะสำรวจดินตามมาตรฐาน ASTM และ วสท.', 'ดูรายละเอียดงานทดสอบ →', ''),
            ('/th/steel-procurement.html', '/assets/images/steel/steel-hero.webp', 1200, 670, '02 · ตัวแทนจัดหาเหล็กโครงสร้างฝั่งผู้ซื้อ', 'เป็นตัวแทนฝ่ายผู้ซื้อเปรียบเทียบ RFQ ตรวจสอบโรงงานผลิต ตรวจสอบรอยเชื่อม/NDT ตรวจสอบใบรับรองวัสดุ (MTC) และตรวจปล่อยสินค้าก่อนส่งมอบ', 'ดูรายละเอียดจัดหาเหล็ก →', ''),
            ('/th/cement-mining-equipment.html', '/assets/images/cement-mining.webp', 1200, 670, '03 · เครื่องจักรและระบบสำหรับอุตสาหกรรมปูนซีเมนต์และเหมืองแร่', 'ประสานงานเทคนิคและจัดหาเครื่องจักรระบบบดย่อย การบดละเอียด (VRM/Ball Mill/Roller Press) ระบบประกอบเตาเผา ลำเลียง ดักฝุ่น ควบคุมไฟฟ้าและเครื่องมือวัด (E&I) และอะไหล่', 'ดูรายละเอียดเครื่องจักรซีเมนต์และเหมือง →', ''),
            ('/th/testing-instruments.html', '/assets/images/field-instruments.webp', 1200, 670, '04 · เครื่องมือทดสอบวิศวกรรมภาคสนาม', 'จัดหาและให้คำปรึกษาเครื่องทดสอบความสมบูรณ์เสาเข็ม เครื่องวิเคราะห์คลื่นเสียง CSL เซนเซอร์วัดแรง โหลดเซลล์ และระบบบันทึกข้อมูลสนาม', 'ดูรายละเอียดเครื่องมือทดสอบ →', ''),
        ],
        'credTitle': 'เอกสารข้อมูลทางเทคนิคและตัวอย่างรายงาน',
        'credBody': 'หากท่านกำลังเตรียมแผนการทดสอบฐานรากหรือคัดเลือกผู้ผลิตเหล็กโครงสร้าง สามารถติดต่อทีมวิศวกรประจำกรุงเทพฯ เพื่อขอรับตัวอย่างรูปแบบรายงานและรายละเอียดขอบเขตงานได้โดยตรง',
        'credBtn': 'ปรึกษาขอบเขตโครงการ →',
        'credWa': 'WhatsApp +66 90 292 1749',
        'credWeChat': 'WeChat QR',
        'viewDetail': 'ดูรายละเอียด →',
        'askSimilar': 'สอบถามขอบเขตงาน',
        'srcLabel': 'ข้อมูลอ้างอิง:',
        'detailBack': '← กลับสู่หน้ารวมขีดความสามารถ',
        'detailAttrWarn': 'ข้อมูลขอบเขต:',
        'detailOrg': 'หน่วยงาน',
        'detailSvc': 'สาขาวิศวกรรม',
        'detailLocYr': 'สถานที่ / ปี',
        'detailStd': 'มาตรฐานอ้างอิง',
        'detailSrc': 'แหล่งข้อมูล',
        'detailImgCheck': 'ประเภทภาพ',
        'detailImgPass': 'ภาพประกอบงานวิศวกรรม',
        'detailSummaryH': '1. สรุปข้อมูล',
        'detailScopeH': '2. ข้อมูลจำเพาะทางวิศวกรรม',
        'detailDelivH': '3. ขอบเขตการส่งมอบ',
        'extTitle': 'ต้องการทีมประสานงานทดสอบฐานรากหรือตรวจสอบจัดซื้อในประเทศไทย?',
        'extBody': 'ติดต่อทีมวิศวกรประสานงาน 3 ภาษาในกรุงเทพฯ เพื่อขอรับคำปรึกษาและใบเสนอราคาได้โดยตรง',
        'extBtn': 'ปรึกษาขอบเขตงานวิศวกรรม →',
        'extTestBtn': '01 งานทดสอบฐานรากและปฐพี',
        'extSteelBtn': '02 ตัวแทนจัดหาเหล็กโครงสร้าง',
    },
}


def load_i18n():
    raw = (ROOT / 'assets/js/i18n-data.js').read_text(encoding='utf-8')
    return json.loads(raw.split('window.ANTHAI_I18N =', 1)[1].rstrip(';\n '))


def page_url(lang, subpath):
    prefix = '' if lang == 'en' else lang + '/'
    return f'{BASE}{prefix}cases/' if subpath == 'index.html' else f'{BASE}{prefix}cases/{subpath}'


def build_shell(lang, lang_code, lang_upper, subpath, title, desc, body_html, schemas, i18n):
    prefix = '' if lang == 'en' else f'/{lang}'
    canon = page_url(lang, subpath)
    alt_links = ''.join(
        f'<link rel="alternate" hreflang="{lc}" href="{page_url(l, subpath)}" />'
        for l, lc, _, _, _ in LANGS
    ) + f'<link rel="alternate" hreflang="x-default" href="{page_url("en", subpath)}" />'

    lang_btns = ''.join(
        f'<a href="{p}/cases/{subpath}" class="lang-btn" data-language="{l}" data-lang="{lu}" lang="{lc}" hreflang="{lc}"'
        + (' aria-current="true" aria-pressed="true"' if l == lang else ' aria-pressed="false"')
        + f'>{lbl}</a>'
        for l, lc, lu, lbl, p in LANGS
    )

    tr = lambda k, fallback: e(i18n.get(lang_upper, {}).get(k, fallback))
    lang_label = {'en': 'Language', 'zh': '语言', 'th': 'ภาษา'}[lang]
    schemas_json = json.dumps(schemas, ensure_ascii=False).replace('<', '\\u003c')

    return f'''<!DOCTYPE html>
<html lang="{lang_code}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}" />
  <link rel="canonical" href="{canon}" />
  {alt_links}
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="{{"en":"en_TH","zh":"zh_CN","th":"th_TH"}}['{lang}']" />
  <meta property="og:title" content="{e(title)}" />
  <meta property="og:description" content="{e(desc)}" />
  <meta property="og:url" content="{canon}" />
  <meta property="og:image" content="https://an-thai.com/assets/images/hero-field.webp" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" href="/assets/images/brand-logo.png" />
  <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" />
  <script>(function(){{try{{var d=document;d.documentElement.setAttribute('data-theme','blueprint');if(location.protocol!=='file:'){{var l=function(){{var s=d.createElement('script');s.src='/assets/themes/motion-core.js';d.head.appendChild(s);}};if(d.readyState!=='loading')l();else d.addEventListener('DOMContentLoaded',l);}}}}catch(e){{}}}})();</script>
  <link rel="stylesheet" href="/assets/css/styles.css" />
  <link rel="stylesheet" href="/assets/css/portfolio-v1.css" />
  <script type="application/ld+json">{schemas_json}</script>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="site-header">
    <div class="container header-inner">
      <a href="{prefix}/index.html" data-page-id="home" class="brand">
        <span class="brand-mark"><img src="/assets/images/brand-logo.webp" alt="AN-THAI" width="34" height="34" decoding="async" /></span>
        <span>
          <span class="brand-name">AN-THAI ENGINEERING</span>
          <span class="brand-sub" data-i18n="brandSub">{tr("brandSub", "THAILAND · SUBSTRUCTURE TO SUPERSTRUCTURE")}</span>
        </span>
      </a>

      <nav class="nav-desktop" aria-label="Main navigation">
        <a href="{prefix}/index.html" data-page-id="home" data-i18n="navHome">{tr("navHome", "Home")}</a>
        <div class="nav-dropdown" data-services-dropdown>
          <button type="button" class="nav-drop-btn" id="desktopServicesBtn" aria-expanded="false" aria-controls="desktopServicesMenu" aria-haspopup="true">
            <span data-i18n="navServices">{tr("navServices", "Services")}</span>
            <span class="nav-drop-caret" aria-hidden="true">▼</span>
          </button>
          <div id="desktopServicesMenu" class="nav-drop-menu" hidden role="menu">
            <a href="{prefix}/testing.html" role="menuitem" data-page-id="testing">
              <span data-i18n="svcMenu1">{tr("svcMenu1", "Foundation Testing & Geotechnical")}</span>
              <span class="nav-drop-sub">/testing.html</span>
            </a>
            <a href="{prefix}/steel-procurement.html" role="menuitem" data-page-id="steel">
              <span data-i18n="svcMenu2">{tr("svcMenu2", "Buyer-Side Steel Procurement")}</span>
              <span class="nav-drop-sub">/steel-procurement.html</span>
            </a>
            <a href="{prefix}/cement-mining-equipment.html" role="menuitem" data-page-id="powder">
              <span data-i18n="svcMenu3">{tr("svcMenu3", "Cement & Mining Equipment")}</span>
              <span class="nav-drop-sub">/cement-mining-equipment.html</span>
            </a>
            <a href="{prefix}/testing-instruments.html" role="menuitem" data-page-id="instruments">
              <span data-i18n="svcMenu4">{tr("svcMenu4", "Testing Instruments")}</span>
              <span class="nav-drop-sub">/testing-instruments.html</span>
            </a>
          </div>
        </div>
        <a href="{prefix}/insights/index.html" data-page-id="insights" data-i18n="navInsights">{tr("navInsights", "Insights")}</a>
        <a href="{prefix}/about.html" data-page-id="about" data-i18n="navAbout">{tr("navAbout", "About")}</a>
        <a href="{prefix}/contact.html" data-page-id="contact" data-i18n="navContact">{tr("navContact", "Contact")}</a>
      </nav>

      <div class="header-controls">
        <nav class="lang-switch" aria-label="{lang_label}">{lang_btns}</nav>
        <button type="button" class="desk-btn" data-open-desk="">
          <span id="headerDeskLabel" data-i18n="deskBtnOffline">{tr("deskBtnOffline", "Inquiry Desk")}</span>
        </button>
        <button id="mobileMenuBtn" type="button" class="menu-toggle" aria-label="Menu" aria-expanded="false" aria-controls="mobileNav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      </div>
    </div>

    <nav id="mobileNav" class="mobile-nav" aria-label="Mobile navigation">
      <a href="{prefix}/index.html" data-page-id="home" data-i18n="navHome">{tr("navHome", "Home")}</a>
      <button type="button" id="mobileServicesBtn" class="mobile-acc-btn" aria-expanded="false" aria-controls="mobileServicesPanel">
        <span data-i18n="navServices">{tr("navServices", "Services")}</span>
        <span class="nav-drop-caret" aria-hidden="true">▼</span>
      </button>
      <div id="mobileServicesPanel" class="mobile-acc-panel" hidden>
        <a href="{prefix}/testing.html" data-page-id="testing" data-i18n="svcMenu1">{tr("svcMenu1", "Foundation Testing & Geotechnical")}</a>
        <a href="{prefix}/steel-procurement.html" data-page-id="steel" data-i18n="svcMenu2">{tr("svcMenu2", "Buyer-Side Steel Procurement")}</a>
        <a href="{prefix}/cement-mining-equipment.html" data-page-id="powder" data-i18n="svcMenu3">{tr("svcMenu3", "Cement & Mining Equipment")}</a>
        <a href="{prefix}/testing-instruments.html" data-page-id="instruments" data-i18n="svcMenu4">{tr("svcMenu4", "Testing Instruments")}</a>
      </div>
      <a href="{prefix}/insights/index.html" data-page-id="insights" data-i18n="navInsights">{tr("navInsights", "Insights")}</a>
      <a href="{prefix}/about.html" data-page-id="about" data-i18n="navAbout">{tr("navAbout", "About")}</a>
      <a href="{prefix}/contact.html" data-page-id="contact" data-i18n="navContact">{tr("navContact", "Contact")}</a>
    </nav>
  </header>

  <main id="main-content">
    {body_html}

    <footer class="site-footer">
      <div class="container">
        <div class="footer-row">
          <span class="footer-brand">
            <span class="brand-mark"><img src="/assets/images/brand-logo.webp" alt="AN-THAI" width="28" height="28" loading="lazy" decoding="async" /></span>
            <strong style="font-size:13px;">AN-THAI ENGINEERING COMPANY LIMITED</strong>
          </span>
          <div class="mono" style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;">
            <a href="{prefix}/insights/index.html" data-i18n="navInsights">{tr("navInsights", "Insights")}</a>
            <a href="tel:+66902921749">+66 90 292 1749</a>
            <a href="mailto:info@an-thai.com">info@an-thai.com</a>
            <a href="https://wa.me/66902921749" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="https://line.me/ti/p/p0_XsfILmH" target="_blank" rel="noopener noreferrer nofollow">LINE</a>
            <a href="{prefix}/contact.html#direct-qr" data-i18n="navWeChatQr">{tr("navWeChatQr", "WeChat")}</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span data-i18n="footerCopy">{tr("footerCopy", "© 2026 AN-THAI Engineering Company Limited · Substructure to Superstructure")}</span>
          <span class="mono">Bangkok, Thailand</span>
        </div>
      </div>
    </footer>
  </main>

  <div class="bottom-bar" role="region" aria-label="Direct inquiry bar">
    <div class="container bottom-bar-inner">
      <div class="bottom-bar-text">
        <span id="bottomBarStatusText" data-i18n="bottomBarOffline">{tr("bottomBarOffline", "Direct Engineering Inquiry · info@an-thai.com · +66 90 292 1749")}</span>
      </div>
      <button id="bottomBarDeskBtn" type="button" class="btn btn-dark" style="padding:7px 14px;font-size:11px;flex-shrink:0;" data-open-desk="" data-i18n="bottomBarBtnOffline">{tr("bottomBarBtnOffline", "Request a Quote / Inquiry →")}</button>
    </div>
  </div>

  <div id="deskDrawer" class="drawer-backdrop" role="dialog" aria-modal="true" aria-labelledby="drawerHeading" aria-hidden="true">
    <div class="drawer-panel">
      <div class="drawer-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="drawerHeading" style="font-weight:800;font-size:14px;" data-i18n="drawerTitle">{tr("drawerTitle", "AN-THAI")}</span>
          </div>
          <div id="drawerStatusText" class="drawer-subtitle" data-i18n="drawerStatusOffline">{tr("drawerStatusOffline", "Direct Structured Inquiry · Bangkok Engineering Team")}</div>
        </div>
        <div class="drawer-header-actions">
          <button id="drawerCloseBtn" type="button" class="drawer-close" data-i18n-aria="drawerCloseAria" aria-label="Close drawer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body">
        <div id="drawerOfflineView" class="drawer-stack">
          <div class="notice-box is-neutral">
            <strong style="display:block;margin-bottom:4px;" data-i18n="drawerOfflineTitle">{tr("drawerOfflineTitle", "Send a Structured Technical Brief")}</strong>
            <span data-i18n="drawerOfflineBody">{tr("drawerOfflineBody", "Complete this structured brief to open an email to info@an-thai.com, reach us via WhatsApp (+66 90 292 1749), or copy your specification brief.")}</span>
          </div>
          <div class="field">
            <label for="drawerRoute" data-i18n="fRoute">{tr("fRoute", "Business Unit")}</label>
            <select id="drawerRoute">
              <option value="01 Foundation Testing & Geotech" data-i18n="fRoute1">{tr("fRoute1", "01 Foundation Testing & Geotech")}</option>
              <option value="02 Buyer-Side Steel Procurement Agency" data-i18n="fRoute2">{tr("fRoute2", "02 Buyer-Side Steel Procurement Agency")}</option>
              <option value="03 Cement & Mining Equipment" data-i18n="fRoute3">{tr("fRoute3", "03 Cement & Mining Equipment")}</option>
              <option value="04 Field Testing Instruments" data-i18n="fRoute4">{tr("fRoute4", "04 Field Testing Instruments")}</option>
            </select>
          </div>
          <div class="field"><label for="drawerLoc" data-i18n="fLoc">{tr("fLoc", "Project Location")}</label><input id="drawerLoc" type="text" data-i18n-ph="fLocPh" placeholder="{tr("fLocPh", "Rayong EEC / Bangkok / Port")}" /></div>
          <div class="field"><label for="drawerContact" data-i18n="fContact">{tr("fContact", "Email or Phone / WhatsApp *")}</label><input id="drawerContact" type="text" data-i18n-ph="fContactPh" placeholder="{tr("fContactPh", "name@company.com / +66...")}" /></div>
          <div class="field"><label for="drawerNotes" data-i18n="fNotes">{tr("fNotes", "Technical Requirements & Schedule *")}</label><textarea id="drawerNotes" rows="3" data-i18n-ph="fNotesPh" placeholder="{tr("fNotesPh", "Standards, drawing status, or target timeline...")}"></textarea></div>
          <div id="drawerFeedback" class="notice-box" hidden role="status" aria-live="polite"></div>
          <button id="drawerEmailBtn" type="button" class="btn btn-accent btn-full" data-i18n="drawerSendEmail">{tr("drawerSendEmail", "Open Email (info@an-thai.com) →")}</button>
          <button id="drawerCopyBtn" type="button" class="btn btn-outline btn-full" data-i18n="drawerCopyBrief">{tr("drawerCopyBrief", "Copy Structured Brief")}</button>
          <div class="drawer-channels">
            <div class="drawer-channels-label" data-i18n="drawerChannelsTitle">{tr("drawerChannelsTitle", "Direct Channels · Scan or Tap")}</div>
            <div class="drawer-msg-links">
              <a href="https://wa.me/66902921749" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="padding:7px 10px;font-size:11px;">WhatsApp</a>
              <a href="https://line.me/ti/p/p0_XsfILmH" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-line" style="padding:7px 10px;font-size:11px;">LINE</a>
            </div>
            <div class="drawer-qr-grid">
              <a href="https://line.me/ti/p/p0_XsfILmH" target="_blank" rel="noopener noreferrer nofollow" class="qr-mini-card">
                <div class="qr-mini-frame"><img src="/assets/images/contact-line-qr.webp" alt="LINE QR code for AN-THAI Engineering" width="600" height="600" loading="lazy" /></div>
                <span class="qr-mini-title">LINE</span>
                <span class="qr-mini-sub" data-i18n="lineActionLabel">{tr("lineActionLabel", "Open LINE →")}</span>
              </a>
              <a href="/assets/images/contact-wechat-qr.webp" target="_blank" rel="noopener noreferrer" class="qr-mini-card">
                <div class="qr-mini-frame"><img src="/assets/images/contact-wechat-qr.webp" alt="WeChat QR code for AN-THAI Engineering (James2021)" width="600" height="600" loading="lazy" /></div>
                <span class="qr-mini-title"><span data-i18n="wechatLabel">{tr("wechatLabel", "WeChat")}</span> · James2021</span>
                <span class="qr-mini-sub" data-i18n="qrWechatHint">{tr("qrWechatHint", "Scan QR in WeChat")}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="/assets/js/i18n-data.js"></script>
  <script src="/assets/js/sr-bridge-mock.js"></script>
  <script src="/assets/js/sourcerating-embed-adapter.js"></script>
  <script src="/assets/js/site.js"></script>
</body>
</html>'''


def build_capabilities_body(lang):
    ui = LOCALE_UI[lang]
    prefix = '' if lang == 'en' else f'/{lang}'
    cards = ''.join(
        f'<article class="case-card">'
        f'<div>'
        f'<div class="case-card-media">'
        f'<img src="{img}" alt="{e(title)}" width="{w}" height="{h}" loading="lazy" />'
        f'</div>'
        f'<div class="case-card-body">'
        f'<h3 class="h3" style="margin:0;"><a href="{href}">{e(title)}</a></h3>'
        f'<p class="muted" style="font-size:13px;margin:0;line-height:1.55;">{e(summary)}</p>'
        + f'</div>'
        f'</div>'
        f'<div class="case-card-footer">'
        f'<a href="{href}" class="unit-link">{e(cta)}</a>'
        f'</div>'
        f'</article>'
        for href, img, w, h, title, summary, cta, note in ui['disciplines']
    )

    return f'''<section class="section">
      <div class="container cases-shell">
        <div style="max-width:780px;">
          <h1 class="h2" style="font-size:clamp(26px,4vw,38px);margin-top:0;">{e(ui["h1"])}</h1>
          <p class="muted" style="margin-top:8px;">{e(ui["lead"])}</p>
        </div>

        <div>
          <h2 class="h3" style="margin-bottom:12px;">{e(ui["disciplinesTitle"])}</h2>
          <div class="grid-2">{cards}</div>
        </div>

        <div class="team-extension-box">
          <h2 class="h3">{e(ui["credTitle"])}</h2>
          <p class="muted" style="font-size:13px;margin:0;">{e(ui["credBody"])}</p>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;">
            <a href="{prefix}/contact.html" class="btn btn-accent">{e(ui["credBtn"])}</a>
            <a href="https://wa.me/66902921749" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">{e(ui["credWa"])}</a>
            <a href="https://line.me/ti/p/p0_XsfILmH" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-line">LINE</a>
            <a href="{prefix}/contact.html#direct-qr" class="btn btn-outline">{e(ui["credWeChat"])}</a>
          </div>
        </div>
      </div>
    </section>'''


def valid_https_url(raw):
    if not isinstance(raw, str) or not raw.startswith('https://'):
        return False
    if any(c.isspace() or ord(c) < 32 or ord(c) == 127 for c in raw):
        return False
    try:
        p = urlsplit(raw)
        _ = p.port
        return p.scheme == 'https' and bool(p.hostname) and not p.username and not p.password
    except ValueError:
        return False


def is_publicly_cleared(item):
    if item.get('status') != 'published_reference':
        return False
    if item.get('verified') is not True or item.get('publicCleared') is not True:
        return False
    slug = item.get('slug', '')
    if not isinstance(slug, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
        return False
    img = item.get('imageEvidence', {})
    if img.get('commercialRightsApproved') is not True:
        return False
    if type(img.get('displayWidth')) is not int or img['displayWidth'] <= 0:
        return False
    if type(img.get('displayHeight')) is not int or img['displayHeight'] <= 0:
        return False
    if not valid_https_url(item.get('sourceUrl')):
        return False
    return True


def generate():
    dist = ROOT / 'dist'
    data = json.loads((ROOT / 'content/cases.json').read_text(encoding='utf-8'))
    cleared_items = [x for x in data['items'] if is_publicly_cleared(x)]
    i18n = load_i18n()

    tpl_dist = dist / 'cases/case-template.html'
    if tpl_dist.exists():
        tpl_dist.unlink()

    # Keep dist/content clean when no external/direct cases are cleared for public display
    assert len(cleared_items) == 0, 'Expected 0 cleared cases for V1.0 customer-only release'

    sitemap_path = dist / 'sitemap.xml' if (dist / 'sitemap.xml').is_file() else ROOT / 'sitemap.xml'
    sitemap = sitemap_path.read_text(encoding='utf-8')

    org_schema_base = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'AN-THAI Engineering Company Limited',
        'url': 'https://an-thai.com/',
        'email': 'info@an-thai.com',
        'telephone': '+66-90-292-1749',
    }

    generated_count = 0
    for lang, lang_code, lang_upper, _, _ in LANGS:
        ui = LOCALE_UI[lang]
        out_dir = (dist / 'cases') if lang == 'en' else (dist / lang / 'cases')
        out_dir.mkdir(parents=True, exist_ok=True)
        idx_html = build_shell(
            lang, lang_code, lang_upper, 'index.html',
            ui['title'], ui['desc'], build_capabilities_body(lang),
            [org_schema_base, {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': ui['h1'], 'inLanguage': lang_code, 'url': page_url(lang, 'index.html')}],
            i18n,
        )
        (out_dir / 'index.html').write_text(idx_html, encoding='utf-8')
        generated_count += 1
        if lang == 'en':
            (ROOT / 'cases/index.html').write_text(idx_html, encoding='utf-8')

        idx_url = page_url(lang, 'index.html')
        if idx_url not in sitemap:
            sitemap = sitemap.replace('</urlset>', f'<url><loc>{idx_url}</loc><lastmod>2026-11-25</lastmod></url>\n</urlset>')

    if (dist / 'sitemap.xml').is_file():
        (dist / 'sitemap.xml').write_text(sitemap, encoding='utf-8')

    print(f'PASS: generated {generated_count} clean EN/ZH/TH capabilities landing pages (0 unapproved cases exposed)')


if __name__ == '__main__':
    generate()
