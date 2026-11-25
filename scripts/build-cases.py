"""Build V1.0 static Cases Directory, localized crawlable detail pages, and SourceRating AI index."""
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
        'title': 'Project Experience & Reference Records | AN-THAI Engineering',
        'desc': 'Evidence-gated engineering references in Thailand. AN-THAI direct client projects under NDA clearance; verified external PACO and Roge & Associates records labeled transparently.',
        'eyebrow': 'Evidence-Gated Portfolio & Reference Registry',
        'h1': 'Project Experience & Engineering References',
        'lead': 'Strict entity attribution and image evidence transparency. Historical external references from Pathumthani Concrete (PACO) and Roge & Associates are labeled as separate legal entities; AN-THAI direct client records await written NDA disclosure clearance.',
        'honestTitle': 'AN-THAI Direct Contract Disclosure Status: 0 Public Client Records (NDA Protection)',
        'honestBody': 'Out of respect for client NDAs, AN-THAI Engineering does not fabricate anonymous case titles or misattribute external contractor history as AN-THAI direct contracts. Below are 4 verified industry reference records with full source attribution and representative authorized photography.',
        'mosaicTitle': 'Explore Technical Disciplines',
        'filterAttr': 'Attribution:',
        'attrAll': 'All Records',
        'attrPaco': 'PACO Reference',
        'attrRoge': 'ROGE Profile',
        'filterSvc': 'Discipline:',
        'svcAll': 'All Disciplines',
        'svcPrecast': 'Precast & Spun Piles',
        'svcConsultancy': 'Civil Consultancy',
        'filterReg': 'Location:',
        'regAll': 'All Locations',
        'searchPh': 'Search project, pile standard, city...',
        'countTpl': '{n} verified records shown',
        'noMatch': 'No matching reference records for this filter combination.',
        'viewDetail': 'View Technical Record →',
        'askSimilar': 'Discuss Similar Scope',
        'srcLabel': 'Source:',
        'repPhotoTag': 'Representative AN-THAI brochure image (not jobsite photo)',
        'evSourceOk': 'Source Text Verified',
        'evPhotoRep': 'Representative Visual (Not Jobsite)',
        'evExternalSeparate': 'Separate Legal Entity Record',
        'detailBack': '← Back to Cases Directory',
        'detailAttrWarn': 'Attribution & Non-Affiliation Boundary:',
        'detailOrg': 'Origin Entity',
        'detailSvc': 'Engineering Discipline',
        'detailLocYr': 'Location / Period',
        'detailStd': 'Referenced Standards',
        'detailSrc': 'Original Source Record',
        'detailImgCheck': 'Image Evidence Gate',
        'detailImgPass': 'AN-THAI Authorized Representative Visual (commercialRightsApproved: true, projectMatch: false)',
        'detailSummaryH': '1. Factual Record Summary',
        'detailScopeH': '2. Verified Engineering Specifications',
        'detailDelivH': '3. Verified Scope / Capability Stated by Source',
        'extTitle': 'Need Similar Scope Execution or Independent Verification in Thailand?',
        'extBody': 'AN-THAI Engineering coordinates bilingual foundation testing (SLT, PDA, PIT, CSL), buyer-side structural steel procurement auditing, and engineering instrument supply under explicit written contract boundaries.',
        'extBtn': 'Request Scope Review / Quotation →',
        'extTestBtn': '01 Foundation Testing Scope',
        'extSteelBtn': '02 Steel Procurement Scope',
        'schemaOrgDesc': 'Independent technical engineering consultancy, foundation testing, steel procurement agency, and field instruments in Bangkok, Thailand.',
        'mosaicTiles': [
            ('precast', '/assets/images/hero-field.webp', 'Foundation Piling & Spun Piles', 'Filter Precast & Piling Records →'),
            ('all', '/assets/images/steel/steel-structure.webp', 'Infrastructure & Box Girders', 'Show All Civil Infrastructure →'),
            ('consultancy', '/assets/images/plate-load.webp', 'Engineering Consultancy', 'Filter Consultancy Profiles →'),
            ('all', '/assets/images/static-load.webp', 'Load Testing & Verification', 'Inspect All Verified Records →'),
        ],
    },
    'zh': {
        'title': '工程业绩与行业参考档案 | 安泰工程 AN-THAI Engineering',
        'desc': '严格按事实核验与版权审计公开的工程参考档案：明确区分安泰直签合同与 PACO、Roge & Associates 等独立法人历史参考资料。',
        'eyebrow': '事实核验与证据分级业绩档案库',
        'h1': '工程业绩与参考档案',
        'lead': '严格坚持实体归属隔离与图片证据透明。PACO（巴吞他尼混凝土）与 Roge & Associates（罗捷顾问）历史参考记录均明确标注为独立法人实体；安泰工程直签客户项目严格受保密协议保护，未经书面授权绝不擅自脱敏冒名发布。',
        'honestTitle': '安泰直签项目公开状态：0 条公开客户案例（严格遵守 NDA 保密原则）',
        'honestBody': '我们拒绝编造模糊化匿名案例或将外部合作伙伴历史项目冒充安泰自营业绩。以下 4 条为经原文核验的行业参考档案，并配以获得合法商业授权的代表性真图（明确标注非施工现场实景）。',
        'mosaicTitle': '按工程领域快速浏览',
        'filterAttr': '归属来源：',
        'attrAll': '全部档案',
        'attrPaco': 'PACO 参考',
        'attrRoge': 'ROGE 资质',
        'filterSvc': '工程类别：',
        'svcAll': '全部领域',
        'svcPrecast': '预制管桩与构件',
        'svcConsultancy': '工程咨询资质',
        'filterReg': '地区筛选：',
        'regAll': '全部地区',
        'searchPh': '搜索项目名称、标准或城市...',
        'countTpl': '当前显示 {n} 条已核验记录',
        'noMatch': '当前筛选条件下暂无匹配记录。',
        'viewDetail': '查看技术档案详情 →',
        'askSimilar': '咨询同类工程支持',
        'srcLabel': '来源核验：',
        'repPhotoTag': '安泰宣传册授权工程真图（非该项目现场实照）',
        'evSourceOk': '原文事实已核验',
        'evPhotoRep': '授权示意真图（非现场）',
        'evExternalSeparate': '独立法人参考档案',
        'detailBack': '← 返回业绩与参考目录',
        'detailAttrWarn': '法律实体归属与非关联边界声明：',
        'detailOrg': '记录所属实体',
        'detailSvc': '工程学科分类',
        'detailLocYr': '项目地点 / 年份',
        'detailStd': '涉及标准 / 规范',
        'detailSrc': '原始参考来源',
        'detailImgCheck': '图片三重证据状态',
        'detailImgPass': '安泰合法授权代表图（commercialRightsApproved: true, projectMatch: false）',
        'detailSummaryH': '一、原文事实摘要',
        'detailScopeH': '二、已核验工程技术参数',
        'detailDelivH': '三、原文载明交付或能力范围',
        'extTitle': '需要同类工程的泰国本地检测、审计或装备协同支持？',
        'extBody': '安泰工程提供中英泰三语桩基检测协同（SLT、PDA、PIT、CSL）、买方立场钢结构采购审计以及工程检测仪器选型供应，所有工作均签订清晰权责边界。',
        'extBtn': '提交同类项目需求 →',
        'extTestBtn': '01 基础检测与岩土工程',
        'extSteelBtn': '02 买方钢结构采购代理',
        'schemaOrgDesc': '位于泰国曼谷的独立工程技术咨询、桩基检测、钢结构买方采购及仪器服务机构。',
        'mosaicTiles': [
            ('precast', '/assets/images/hero-field.webp', '基础桩基与离心管桩', '筛选预制与桩基参考 →'),
            ('all', '/assets/images/steel/steel-structure.webp', '市政基础设施与预制箱梁', '浏览全部参考档案 →'),
            ('consultancy', '/assets/images/plate-load.webp', '泰国工程咨询资质', '筛选工程咨询档案 →'),
            ('all', '/assets/images/static-load.webp', '静载试验与合规验证', '查看全部核验记录 →'),
        ],
    },
    'th': {
        'title': 'ผลงานโครงการและข้อมูลอ้างอิง | AN-THAI Engineering',
        'desc': 'คลังข้อมูลอ้างอิงทางวิศวกรรมที่ผ่านการตรวจสอบข้อเท็จจริงและสิทธิ์การใช้งานภาพถ่าย แยกขอบเขตนิติบุคคลอิสระอย่างโปร่งใส',
        'eyebrow': 'คลังข้อมูลผลงานที่ผ่านการตรวจสอบหลักฐานแล้ว',
        'h1': 'ผลงานโครงการและข้อมูลอ้างอิง',
        'lead': 'โปร่งใสในการระบุนิติบุคคลเจ้าของผลงานและสิทธิ์การใช้ภาพถ่าย ข้อมูลจากบริษัท ปทุมธานีคอนกรีต (PACO) และบริษัท โรจน์ แอนด์ แอสโซซิเอทส์ จำกัด (ROGE) เป็นบันทึกอ้างอิงจากนิติบุคคลแยกต่างหาก สำหรับโครงการตรงของ AN-THAI อยู่ภายใต้ข้อตกลงรักษาความลับ (NDA)',
        'honestTitle': 'สถานะโครงการตรงของ AN-THAI: 0 โครงการที่เผยแพร่สาธารณะ (คุ้มครองตามสัญญา NDA)',
        'honestBody': 'AN-THAI ไม่สร้างโครงการสมมติและไม่แอบอ้างผลงานของบริษัทอื่นเป็นสัญญาตรงของตนเอง รายการด้านล่างจำนวน 4 รายการเป็นข้อมูลอ้างอิงที่ตรวจสอบแหล่งที่มาแล้ว พร้อมภาพประกอบลิขสิทธิ์แท้ของ AN-THAI (ระบุชัดเจนว่าไม่ใช่ภาพถ่ายหน้างานจริงของโครงการอ้างอิง)',
        'mosaicTitle': 'สำรวจตามสาขาวิศวกรรม',
        'filterAttr': 'แหล่งที่มา:',
        'attrAll': 'ทั้งหมด',
        'attrPaco': 'อ้างอิง PACO',
        'attrRoge': 'โปรไฟล์ ROGE',
        'filterSvc': 'สาขาวิศวกรรม:',
        'svcAll': 'ทุกสาขา',
        'svcPrecast': 'เสาเข็มและชิ้นส่วนหล่อสำเร็จ',
        'svcConsultancy': 'ที่ปรึกษาวิศวกรรมโยธา',
        'filterReg': 'พื้นที่:',
        'regAll': 'ทุกพื้นที่',
        'searchPh': 'ค้นหาชื่อโครงการ มาตรฐาน หรือพื้นที่...',
        'countTpl': 'แสดง {n} รายการที่ตรวจสอบแล้ว',
        'noMatch': 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขที่เลือก',
        'viewDetail': 'ดูรายละเอียดข้อมูลทางเทคนิค →',
        'askSimilar': 'สอบถามขอบเขตงานลักษณะเดียวกัน',
        'srcLabel': 'แหล่งอ้างอิง:',
        'repPhotoTag': 'ภาพประกอบลิขสิทธิ์ AN-THAI (ไม่ใช่ภาพหน้างานจริง)',
        'evSourceOk': 'ตรวจสอบข้อมูลต้นฉบับแล้ว',
        'evPhotoRep': 'ภาพประกอบตัวแทน (ไม่ใช่ภาพหน้างาน)',
        'evExternalSeparate': 'ข้อมูลนิติบุคคลอิสระแยกส่วน',
        'detailBack': '← กลับสู่หน้ารวมผลงานอ้างอิง',
        'detailAttrWarn': 'ขอบเขตนิติบุคคลและความสัมพันธ์ทางกฎหมาย:',
        'detailOrg': 'นิติบุคคลเจ้าของข้อมูล',
        'detailSvc': 'สาขาวิศวกรรม',
        'detailLocYr': 'สถานที่ / ปีอ้างอิง',
        'detailStd': 'มาตรฐานอ้างอิง',
        'detailSrc': 'แหล่งข้อมูลต้นฉบับ',
        'detailImgCheck': 'สถานะการตรวจสอบสิทธิ์ภาพ',
        'detailImgPass': 'ภาพตัวแทนที่ได้รับอนุญาตของ AN-THAI (commercialRightsApproved: true, projectMatch: false)',
        'detailSummaryH': '1. สรุปข้อเท็จจริงจากแหล่งข้อมูล',
        'detailScopeH': '2. ข้อมูลจำเพาะทางวิศวกรรมที่ตรวจสอบแล้ว',
        'detailDelivH': '3. ขอบเขตงานและศักยภาพตามต้นฉบับ',
        'extTitle': 'ต้องการทีมประสานงานทดสอบฐานรากหรือตรวจสอบจัดซื้อในประเทศไทย?',
        'extBody': 'AN-THAI ให้บริการประสานงานทดสอบเสาเข็ม (SLT, PDA, PIT, CSL) ตรวจสอบจัดซื้อเหล็กโครงสร้างฝั่งผู้ซื้อ และจัดหาเครื่องมือทดสอบภายใต้ขอบเขตสัญญาที่ชัดเจน',
        'extBtn': 'ปรึกษาขอบเขตงานวิศวกรรม →',
        'extTestBtn': '01 งานทดสอบฐานรากและปฐพี',
        'extSteelBtn': '02 ตัวแทนจัดซื้อเหล็กโครงสร้าง',
        'schemaOrgDesc': 'บริษัทที่ปรึกษาวิศวกรรมอิสระ งานทดสอบฐานราก จัดซื้อเหล็กฝั่งผู้ซื้อ และเครื่องมือทดสอบในกรุงเทพฯ ประเทศไทย',
        'mosaicTiles': [
            ('precast', '/assets/images/hero-field.webp', 'งานฐานรากและเสาเข็มสปัน', 'กรองข้อมูลงานเสาเข็ม →'),
            ('all', '/assets/images/steel/steel-structure.webp', 'โครงสร้างพื้นฐานและคานสะพาน', 'แสดงข้อมูลทั้งหมด →'),
            ('consultancy', '/assets/images/plate-load.webp', 'ที่ปรึกษาวิศวกรรมโยธา', 'กรองข้อมูลบริษัทที่ปรึกษา →'),
            ('all', '/assets/images/static-load.webp', 'การทดสอบกำลังรับน้ำหนัก', 'ดูข้อมูลทั้งหมดที่ยืนยันแล้ว →'),
        ],
    },
}


def load_i18n():
    raw = (ROOT / 'assets/js/i18n-data.js').read_text(encoding='utf-8')
    return json.loads(raw.split('window.ANTHAI_I18N =', 1)[1].rstrip(';\n '))


def page_url(lang, subpath):
    prefix = '' if lang == 'en' else lang + '/'
    return f'{BASE}{prefix}cases/{subpath}'


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
  <link rel="stylesheet" href="/assets/css/styles.css" />
  <link rel="stylesheet" href="/assets/css/portfolio-v1.css" />
  <script type="application/ld+json">{schemas_json}</script>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="site-header">
    <div class="container header-inner">
      <a href="{prefix}/index.html" data-page-id="home" class="brand">
        <span class="brand-mark" aria-hidden="true">AT</span>
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
            <a href="{prefix}/powder-equipment.html" role="menuitem" data-page-id="powder">
              <span data-i18n="svcMenu3">{tr("svcMenu3", "Powder-Process Equipment")}</span>
              <span class="nav-drop-sub">/powder-equipment.html</span>
            </a>
            <a href="{prefix}/testing-instruments.html" role="menuitem" data-page-id="instruments">
              <span data-i18n="svcMenu4">{tr("svcMenu4", "Testing Instruments")}</span>
              <span class="nav-drop-sub">/testing-instruments.html</span>
            </a>
          </div>
        </div>
        <a href="{prefix}/cases/index.html" data-page-id="cases" data-i18n="navCases" aria-current="page">{tr("navCases", "Cases")}</a>
        <a href="{prefix}/insights/index.html" data-page-id="insights" data-i18n="navInsights">{tr("navInsights", "Insights")}</a>
        <a href="{prefix}/about.html" data-page-id="about" data-i18n="navAbout">{tr("navAbout", "About")}</a>
        <a href="{prefix}/contact.html" data-page-id="contact" data-i18n="navContact">{tr("navContact", "Contact")}</a>
      </nav>

      <div class="header-controls">
        <nav class="lang-switch" aria-label="{lang_label}">{lang_btns}</nav>
        <button type="button" class="desk-btn" data-open-desk="">
          <span class="status-dot sr-status-dot" aria-hidden="true"></span>
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
        <a href="{prefix}/powder-equipment.html" data-page-id="powder" data-i18n="svcMenu3">{tr("svcMenu3", "Powder-Process Equipment")}</a>
        <a href="{prefix}/testing-instruments.html" data-page-id="instruments" data-i18n="svcMenu4">{tr("svcMenu4", "Testing Instruments")}</a>
      </div>
      <a href="{prefix}/cases/index.html" data-page-id="cases" data-i18n="navCases" aria-current="page">{tr("navCases", "Cases")}</a>
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
          <strong style="font-size:13px;">AN-THAI ENGINEERING COMPANY LIMITED</strong>
          <div class="mono" style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;">
            <a href="{prefix}/cases/index.html" data-i18n="navCases">{tr("navCases", "Cases")}</a>
            <a href="{prefix}/insights/index.html" data-i18n="navInsights">{tr("navInsights", "Insights")}</a>
            <a href="tel:+66902921749">+66 90 292 1749</a>
            <a href="mailto:info@an-thai.com">info@an-thai.com</a>
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
        <span class="status-dot sr-status-dot" aria-hidden="true"></span>
        <span id="bottomBarStatusText" data-i18n="bottomBarOffline">{tr("bottomBarOffline", "Direct Engineering Inquiry · info@an-thai.com · +66 90 292 1749")}</span>
      </div>
      <button id="bottomBarDeskBtn" type="button" class="btn btn-dark" style="padding:7px 14px;font-size:11px;flex-shrink:0;" data-open-desk="" data-i18n="bottomBarBtnOffline">{tr("bottomBarBtnOffline", "Inquiry / Email Brief →")}</button>
    </div>
  </div>

  <div id="deskDrawer" class="drawer-backdrop" role="dialog" aria-modal="true" aria-labelledby="drawerHeading" aria-hidden="true">
    <div class="drawer-panel">
      <div class="drawer-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="drawerHeading" style="font-weight:800;font-size:14px;" data-i18n="drawerTitle">{tr("drawerTitle", "AN-THAI · Inquiry Desk")}</span>
            <span class="status-dot sr-status-dot" aria-hidden="true"></span>
          </div>
          <div id="drawerStatusText" class="mono" style="font-size:10px;color:#fcd34d;margin-top:4px;" data-i18n="drawerStatusOffline">{tr("drawerStatusOffline", "Direct Inquiry Mode · Live Support Offline")}</div>
        </div>
        <button id="drawerCloseBtn" type="button" class="drawer-close" aria-label="Close drawer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="drawer-body">
        <div id="drawerOfflineView" class="drawer-stack">
          <div class="notice-box is-neutral">
            <strong style="display:block;margin-bottom:4px;" data-i18n="drawerOfflineTitle">{tr("drawerOfflineTitle", "Send a Structured Technical Brief")}</strong>
            <span data-i18n="drawerOfflineBody">{tr("drawerOfflineBody", "SourceRating live desk is currently offline / not configured for production. Use this structured brief to email info@an-thai.com, WhatsApp +66 90 292 1749, or copy your brief.")}</span>
          </div>
          <div class="field">
            <label for="drawerRoute" data-i18n="fRoute">{tr("fRoute", "Business Unit")}</label>
            <select id="drawerRoute">
              <option value="01 Foundation Testing & Geotech" data-i18n="fRoute1">{tr("fRoute1", "01 Foundation Testing & Geotech")}</option>
              <option value="02 Buyer-Side Steel Procurement Agency" data-i18n="fRoute2">{tr("fRoute2", "02 Buyer-Side Steel Procurement Agency")}</option>
              <option value="03 Powder-Process Equipment" data-i18n="fRoute3">{tr("fRoute3", "03 Powder-Process Equipment")}</option>
              <option value="04 Field Testing Instruments" data-i18n="fRoute4">{tr("fRoute4", "04 Field Testing Instruments")}</option>
            </select>
          </div>
          <div class="field"><label for="drawerLoc" data-i18n="fLoc">{tr("fLoc", "Project Location")}</label><input id="drawerLoc" type="text" data-i18n-ph="fLocPh" placeholder="{tr("fLocPh", "Rayong EEC / Bangkok / Port")}" /></div>
          <div class="field"><label for="drawerContact" data-i18n="fContact">{tr("fContact", "Email or Phone / WhatsApp *")}</label><input id="drawerContact" type="text" data-i18n-ph="fContactPh" placeholder="{tr("fContactPh", "name@company.com / +66...")}" /></div>
          <div class="field"><label for="drawerNotes" data-i18n="fNotes">{tr("fNotes", "Technical Requirements & Schedule *")}</label><textarea id="drawerNotes" rows="3" data-i18n-ph="fNotesPh" placeholder="{tr("fNotesPh", "Standards, drawing status, or target timeline...")}"></textarea></div>
          <div id="drawerFeedback" class="notice-box" hidden role="status" aria-live="polite"></div>
          <button id="drawerEmailBtn" type="button" class="btn btn-accent btn-full" data-i18n="drawerSendEmail">{tr("drawerSendEmail", "Open Email (info@an-thai.com) →")}</button>
          <button id="drawerCopyBtn" type="button" class="btn btn-outline btn-full" data-i18n="drawerCopyBrief">{tr("drawerCopyBrief", "Copy Structured Brief")}</button>
        </div>
        <div id="drawerLiveView" class="drawer-stack" hidden>
          <div id="liveMessagesMount" class="live-messages"></div>
          <div id="liveFeedback" class="notice-box" hidden role="status" aria-live="polite"></div>
          <div class="live-toolbar">
            <button id="liveHandoffBtn" type="button" class="btn btn-dark" style="padding:7px 12px;font-size:11px;" data-i18n="liveHandoffBtn">{tr("liveHandoffBtn", "Request Human Engineer")}</button>
            <button id="liveRefreshBtn" type="button" class="btn btn-outline" style="padding:7px 12px;font-size:11px;" data-i18n="liveRefreshBtn">{tr("liveRefreshBtn", "Refresh")}</button>
            <button id="liveClearBtn" type="button" class="btn btn-outline" style="padding:7px 12px;font-size:11px;" data-i18n="liveClearBtn">{tr("liveClearBtn", "New Session")}</button>
          </div>
          <form id="liveClaimForm" style="display:flex;gap:6px;">
            <label for="liveClaimEmail" class="sr-only">Email</label>
            <input id="liveClaimEmail" type="email" style="flex:1;padding:8px 10px;border:1px solid var(--line-soft);font-size:12px;background:#fff;" data-i18n-ph="liveClaimPh" placeholder="{tr("liveClaimPh", "Email to save history (optional)")}" />
            <button type="submit" class="btn btn-outline" style="padding:8px 12px;font-size:11px;" data-i18n="liveClaimBtn">{tr("liveClaimBtn", "Save Thread")}</button>
          </form>
        </div>
      </div>
      <div id="drawerLiveFooter" class="drawer-footer" hidden>
        <form id="liveMessageForm" style="display:flex;gap:8px;">
          <label for="liveMsgInput" class="sr-only">Message</label>
          <input id="liveMsgInput" type="text" style="flex:1;padding:9px 12px;border:1px solid var(--line-soft);font-size:13px;" data-i18n-ph="liveInputPh" placeholder="{tr("liveInputPh", "Write a message...")}" />
          <button type="submit" class="btn btn-dark" style="padding:9px 14px;" data-i18n="liveSendBtn">{tr("liveSendBtn", "Send")}</button>
        </form>
      </div>
    </div>
  </div>

  <script src="/assets/js/sourcerating-embed-adapter.js"></script>
  <script src="/assets/js/i18n-data.js"></script>
  <script src="/assets/js/site.js"></script>
  <script src="/assets/js/cases-v1.js"></script>
</body>
</html>'''


def org_name(item, lang):
    if lang == 'zh': return item.get('organizationZh', item['organization'])
    if lang == 'th': return item.get('organizationTh', item['organization'])
    return item['organization']


def attr_label(item, lang):
    t = item['attributionType']
    if lang == 'zh':
        return 'PACO 独立法人历史参考' if t == 'paco_original' else 'ROGE 独立法人资质参考'
    if lang == 'th':
        return 'อ้างอิงนิติบุคคล PACO' if t == 'paco_original' else 'อ้างอิงนิติบุคคล ROGE'
    return 'PACO (Separate Legal Entity)' if t == 'paco_original' else 'ROGE (Separate Legal Entity)'


def build_index_body(items, lang):
    ui = LOCALE_UI[lang]
    prefix = '' if lang == 'en' else f'/{lang}'
    tiles_html = ''.join(
        f'<button type="button" class="cases-sector-tile" data-filter-service="{svc}" data-scroll-cards>'
        f'<img src="{img}" alt="{e(title)}" width="900" height="560" loading="lazy" />'
        f'<span class="cases-sector-name">{e(title)}</span>'
        f'<span class="cases-sector-note">{e(note)}</span>'
        '</button>'
        for svc, img, title, note in ui['mosaicTiles']
    )

    cards_html = []
    for item in items:
        img = item['imageEvidence']
        title = item['title'][lang]
        summary = item['summary'][lang]
        search_blob = ' '.join([
            item['id'], item['serviceUnit'], item['projectType'], item['region'], item['year'],
            item['organization'], title, summary, ' '.join(item.get('aiSimilarityMetadata', {}).get('tags', []))
        ])
        cards_html.append(
            f'<article class="case-card" data-case-card data-attr="{e(item["attributionType"])}" data-service="{e(item["serviceFilter"])}" data-region="{e(item["region"])}" data-search="{e(search_blob)}">'
            '<div>'
            '<div class="case-card-media">'
            f'<img src="{e(img["displayImage"])}" alt="{e(img["caption"][lang])}" width="{img["displayWidth"]}" height="{img["displayHeight"]}" loading="lazy" />'
            f'<span class="case-card-attr">{e(attr_label(item, lang))}</span>'
            f'<span class="case-card-imgtag">{e(ui["repPhotoTag"])}</span>'
            '</div>'
            '<div class="case-card-body">'
            f'<div class="mono" style="font-size:10px;color:var(--ink-subtle);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;"><span>{e(item["serviceUnit"])}</span><span>{e(item["region"])} · {e(item["year"])}</span></div>'
            f'<h3 class="h3" style="margin:0;"><a href="{prefix}/cases/{item["slug"]}.html">{e(title)}</a></h3>'
            f'<p class="muted" style="font-size:12px;margin:0;line-height:1.5;">{e(summary)}</p>'
            '<div class="case-evidence-row">'
            f'<span class="ev-pill ev-pill--ok">{e(ui["evSourceOk"])}</span>'
            f'<span class="ev-pill ev-pill--warn">{e(ui["evPhotoRep"])}</span>'
            f'<span class="ev-pill">{e(ui["evExternalSeparate"])}</span>'
            '</div>'
            f'<div class="mono" style="font-size:10.5px;color:var(--ink-muted);">{e(ui["srcLabel"])} <a href="{e(item["sourceUrl"])}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">{e(item["sourceName"])}</a></div>'
            '</div>'
            '</div>'
            '<div class="case-card-footer">'
            f'<a href="{prefix}/cases/{item["slug"]}.html" class="unit-link">{e(ui["viewDetail"])}</a>'
            f'<a href="{prefix}/contact.html?type=engineering&amp;ref={e(item["id"])}#contactScopeForm" class="btn btn-outline" style="padding:6px 10px;font-size:11px;">{e(ui["askSimilar"])}</a>'
            '</div>'
            '</article>'
        )

    return f'''<section class="section">
      <div class="container cases-shell" data-cases-root>
        <div class="cases-top">
          <div style="max-width:740px;">
            <span class="mono" style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;">{e(ui["eyebrow"])}</span>
            <h1 class="h2" style="font-size:clamp(26px,4vw,38px);margin-top:4px;">{e(ui["h1"])}</h1>
            <p class="muted" style="margin-top:8px;">{e(ui["lead"])}</p>
          </div>
          <input id="casesSearchInput" class="cases-search" type="search" aria-label="{e(ui["searchPh"])}" placeholder="{e(ui["searchPh"])}" />
        </div>

        <div class="notice-box is-neutral">
          <strong style="display:block;margin-bottom:4px;">{e(ui["honestTitle"])}</strong>
          <span>{e(ui["honestBody"].replace(" 4 ", f" {len(items)} ").replace("จำนวน 4 ", f"จำนวน {len(items)} "))}</span>
        </div>

        <div>
          <h2 class="h3" style="margin-bottom:10px;">{e(ui["mosaicTitle"])}</h2>
          <div class="cases-mosaic">{tiles_html}</div>
        </div>

        <div id="casesGridAnchor" class="cases-filter-stack">
          <div class="cases-filter-row" role="group" aria-label="{e(ui["filterAttr"])}">
            <span class="cases-filter-label">{e(ui["filterAttr"])}</span>
            <button type="button" class="cases-filter-btn" data-filter-attr="all" aria-pressed="true">{e(ui["attrAll"])}</button>
            <button type="button" class="cases-filter-btn" data-filter-attr="paco_original" aria-pressed="false">{e(ui["attrPaco"])}</button>
            <button type="button" class="cases-filter-btn" data-filter-attr="roge_original" aria-pressed="false">{e(ui["attrRoge"])}</button>
          </div>
          <div class="cases-filter-row" role="group" aria-label="{e(ui["filterSvc"])}">
            <span class="cases-filter-label">{e(ui["filterSvc"])}</span>
            <button type="button" class="cases-filter-btn" data-filter-service="all" aria-pressed="true">{e(ui["svcAll"])}</button>
            <button type="button" class="cases-filter-btn" data-filter-service="precast" aria-pressed="false">{e(ui["svcPrecast"])}</button>
            <button type="button" class="cases-filter-btn" data-filter-service="consultancy" aria-pressed="false">{e(ui["svcConsultancy"])}</button>
          </div>
          <div class="cases-filter-row" role="group" aria-label="{e(ui["filterReg"])}">
            <span class="cases-filter-label">{e(ui["filterReg"])}</span>
            <button type="button" class="cases-filter-btn" data-filter-region="all" aria-pressed="true">{e(ui["regAll"])}</button>
            <button type="button" class="cases-filter-btn" data-filter-region="Bangkok" aria-pressed="false">Bangkok</button>
            <button type="button" class="cases-filter-btn" data-filter-region="Singapore" aria-pressed="false">Singapore</button>
            <button type="button" class="cases-filter-btn" data-filter-region="Thailand" aria-pressed="false">Thailand</button>
            <span id="casesMatchCount" class="mono" style="margin-left:auto;font-size:11px;color:var(--ink-subtle);" data-count-tpl="{e(ui["countTpl"])}">{e(ui["countTpl"].replace("{n}", str(len(items))))}</span>
          </div>
        </div>

        <div class="grid-2">{"".join(cards_html)}</div>
        <div id="casesNoMatch" class="notice-box is-neutral" hidden>{e(ui["noMatch"])}</div>
      </div>
    </section>'''


def build_detail_body(item, lang):
    ui = LOCALE_UI[lang]
    prefix = '' if lang == 'en' else f'/{lang}'
    img = item['imageEvidence']
    title = item['title'][lang]
    stds = ', '.join(item.get('aiSimilarityMetadata', {}).get('standards', [])) or '—'
    return f'''<section class="section">
      <div class="container case-detail-wrap">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <a href="{prefix}/cases/index.html" class="unit-link">{e(ui["detailBack"])}</a>
          <span class="mono" style="font-size:11px;color:var(--ink-subtle);">{e(item["id"])} · {e(attr_label(item, lang))}</span>
        </div>

        <div>
          <span class="mono" style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;">{e(item["serviceUnit"])} · {e(item["projectType"])}</span>
          <h1 class="h2" style="font-size:clamp(24px,3.8vw,34px);margin-top:4px;">{e(title)}</h1>
        </div>

        <div class="notice-box is-neutral">
          <strong style="display:block;margin-bottom:4px;">{e(ui["detailAttrWarn"])}</strong>
          <span>{e(org_name(item, lang))} — {e(item["entityRelationship"])}</span>
        </div>

        <figure class="case-detail-hero" style="margin:0;">
          <img src="{e(img["displayImage"])}" alt="{e(img["caption"][lang])}" width="{img["displayWidth"]}" height="{img["displayHeight"]}" />
          <figcaption class="case-detail-caption">{e(img["caption"][lang])}</figcaption>
        </figure>

        <div class="case-spec-grid">
          <div class="case-spec-cell"><span class="mono" style="font-size:10px;color:var(--ink-subtle);display:block;">{e(ui["detailOrg"])}</span><strong style="font-size:13px;">{e(org_name(item, lang))}</strong></div>
          <div class="case-spec-cell"><span class="mono" style="font-size:10px;color:var(--ink-subtle);display:block;">{e(ui["detailSvc"])}</span><strong style="font-size:13px;">{e(item["serviceUnit"])}</strong></div>
          <div class="case-spec-cell"><span class="mono" style="font-size:10px;color:var(--ink-subtle);display:block;">{e(ui["detailLocYr"])}</span><strong style="font-size:13px;">{e(item["region"])} · {e(item["year"])}</strong></div>
          <div class="case-spec-cell"><span class="mono" style="font-size:10px;color:var(--ink-subtle);display:block;">{e(ui["detailStd"])}</span><span style="font-size:13px;">{e(stds)}</span></div>
          <div class="case-spec-cell"><span class="mono" style="font-size:10px;color:var(--ink-subtle);display:block;">{e(ui["detailSrc"])}</span><a href="{e(item["sourceUrl"])}" target="_blank" rel="noopener noreferrer" style="font-size:13px;text-decoration:underline;color:var(--accent);">{e(item["sourceName"])}</a></div>
          <div class="case-spec-cell"><span class="mono" style="font-size:10px;color:var(--ink-subtle);display:block;">{e(ui["detailImgCheck"])}</span><span style="font-size:12px;">{e(ui["detailImgPass"])}</span></div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <h2 class="h3">{e(ui["detailSummaryH"])}</h2>
            <p class="muted" style="margin-top:6px;">{e(item["summary"][lang])}</p>
          </div>
          <div>
            <h2 class="h3">{e(ui["detailScopeH"])}</h2>
            <p class="muted" style="margin-top:6px;">{e(item["engineeringData"][lang])}</p>
          </div>
          <div>
            <h2 class="h3">{e(ui["detailDelivH"])}</h2>
            <p class="muted" style="margin-top:6px;">{e(item["verifiedDeliverables"][lang])}</p>
          </div>
        </div>

        <div class="team-extension-box">
          <h2 class="h3">{e(ui["extTitle"])}</h2>
          <p class="muted" style="font-size:13px;margin:0;">{e(ui["extBody"])}</p>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;">
            <a href="{prefix}/contact.html?type=engineering&amp;ref={e(item["id"])}#contactScopeForm" class="btn btn-accent">{e(ui["extBtn"])}</a>
            <a href="{prefix}/testing.html" class="btn btn-outline">{e(ui["extTestBtn"])}</a>
            <a href="{prefix}/steel-procurement.html" class="btn btn-outline">{e(ui["extSteelBtn"])}</a>
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


def write_ai_index(data, cleared_items, dist):
    payload = {
        'schemaVersion': '1.0',
        'sourceSite': 'an-thai.com',
        'anThaiDirectPublishedCount': data['anThaiDirectStatus']['publishedCount'],
        'ndaNotice': data['anThaiDirectStatus']['note'],
        'records': [
            {
                'id': item['id'],
                'slug': item['slug'],
                'urls': {
                    'en': f'/cases/{item["slug"]}.html',
                    'zh': f'/zh/cases/{item["slug"]}.html',
                    'th': f'/th/cases/{item["slug"]}.html',
                },
                'attributionType': item['attributionType'],
                'organization': item['organization'],
                'entityRelationship': item['entityRelationship'],
                'serviceUnit': item['serviceUnit'],
                'serviceFilter': item['serviceFilter'],
                'projectType': item['projectType'],
                'region': item['region'],
                'year': item['year'],
                'title': item['title'],
                'summary': item['summary'],
                'engineeringData': item['engineeringData'],
                'verifiedDeliverables': item['verifiedDeliverables'],
                'sourceName': item['sourceName'],
                'sourceUrl': item['sourceUrl'],
                'imageEvidence': item['imageEvidence'],
                'aiSimilarityMetadata': item['aiSimilarityMetadata'],
            }
            for item in cleared_items
        ],
    }
    raw = json.dumps(payload, ensure_ascii=False, indent=2) + '\n'
    (ROOT / 'content/cases-ai-index.json').write_text(raw, encoding='utf-8')
    if (dist / 'content').is_dir():
        (dist / 'content/cases-ai-index.json').write_text(raw, encoding='utf-8')
        sanitized_cases = {
            'schemaVersion': data.get('schemaVersion', '2.0'),
            'policy': data.get('policy', ''),
            'anThaiDirectStatus': data['anThaiDirectStatus'],
            'items': cleared_items,
        }
        (dist / 'content/cases.json').write_text(json.dumps(sanitized_cases, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def generate():
    dist = ROOT / 'dist'
    data = json.loads((ROOT / 'content/cases.json').read_text(encoding='utf-8'))
    items = [x for x in data['items'] if is_publicly_cleared(x)]
    i18n = load_i18n()

    write_ai_index(data, items, dist)

    sitemap_path = dist / 'sitemap.xml' if (dist / 'sitemap.xml').is_file() else ROOT / 'sitemap.xml'
    sitemap = sitemap_path.read_text(encoding='utf-8')
    llms_path = dist / 'llms.txt' if (dist / 'llms.txt').is_file() else ROOT / 'llms.txt'
    llms = llms_path.read_text(encoding='utf-8') + '\n## Verified Reference Cases\n\n'

    org_schema_base = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'AN-THAI Engineering Company Limited',
        'url': 'https://an-thai.com/',
        'email': 'info@an-thai.com',
        'telephone': '+66-90-292-1749',
    }

    # Clean non-production template copy from dist/cases/
    tpl_dist = dist / 'cases/case-template.html'
    if tpl_dist.exists():
        tpl_dist.unlink()

    generated_count = 0
    for lang, lang_code, lang_upper, _, _ in LANGS:
        ui = LOCALE_UI[lang]
        out_dir = (dist / 'cases') if lang == 'en' else (dist / lang / 'cases')
        out_dir.mkdir(parents=True, exist_ok=True)

        idx_html = build_shell(
            lang, lang_code, lang_upper, 'index.html',
            ui['title'], ui['desc'], build_index_body(items, lang),
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
        llms += f'- [{ui["h1"]} ({lang_upper})]({idx_url})\n'

        for item in items:
            subpath = f'{item["slug"]}.html'
            detail_title = f'{item["title"][lang]} | AN-THAI Engineering'
            detail_desc = item['summary'][lang][:158]
            detail_url = page_url(lang, subpath)
            detail_html = build_shell(
                lang, lang_code, lang_upper, subpath,
                detail_title, detail_desc, build_detail_body(item, lang),
                [org_schema_base, {
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    'name': item['title'][lang],
                    'description': detail_desc,
                    'inLanguage': lang_code,
                    'url': detail_url,
                }],
                i18n,
            )
            (out_dir / subpath).write_text(detail_html, encoding='utf-8')
            generated_count += 1
            if detail_url not in sitemap:
                sitemap = sitemap.replace('</urlset>', f'<url><loc>{detail_url}</loc><lastmod>2026-11-25</lastmod></url>\n</urlset>')
            if lang == 'en':
                llms += f'- [{item["title"]["en"]}]({detail_url})\n'

    if (dist / 'sitemap.xml').is_file():
        (dist / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
    if (dist / 'llms.txt').is_file():
        (dist / 'llms.txt').write_text(llms, encoding='utf-8')

    print(f'PASS: generated {generated_count} localized cases index/detail pages + cases-ai-index.json ({len(items)} verified references)')


if __name__ == '__main__':
    generate()
