"""Render trusted editorial JSON with escaped text; no runtime dependencies."""
from pathlib import Path
from html import escape
from datetime import date
from urllib.parse import unquote, urlsplit
import json
import posixpath
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://an-thai.com/'
e = escape

CTA_LABELS = {
    'en': 'Read article',
    'zh': '阅读文章',
    'th': 'อ่านบทความ'
}

CTA_ROUTES = {'engineering', 'steel', 'powder', 'instruments'}

def valid_https_reference(raw):
    if not isinstance(raw, str) or not raw.startswith('https://'):
        return False
    if any(c.isspace() or ord(c) < 32 or ord(c) == 127 for c in raw):
        return False
    try:
        part = urlsplit(raw)
        return part.scheme == 'https' and bool(part.hostname) and not part.username and not part.password
    except ValueError:
        return False

def normalize_image_path(raw_path):
    if not isinstance(raw_path, str):
        return ''
    s = unquote(raw_path.strip())
    s = s.replace('\\', '/')
    s = posixpath.normpath(s)
    s = s.lstrip('/')
    while s.startswith('./'):
        s = s[2:].lstrip('/')
    return s.lower()

def parse_svg_dimensions(svg_path):
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        if not root.tag.endswith('svg'):
            return None
        w_attr = root.attrib.get('width')
        h_attr = root.attrib.get('height')
        if w_attr and h_attr:
            w_str = w_attr.strip()
            h_str = h_attr.strip()
            if w_str.lower().endswith('px'):
                w_str = w_str[:-2].strip()
            if h_str.lower().endswith('px'):
                h_str = h_str[:-2].strip()
            if not w_str.endswith('%') and not h_str.endswith('%'):
                return int(float(w_str)), int(float(h_str))
        viewbox = root.attrib.get('viewBox')
        if viewbox:
            parts = [float(val) for val in viewbox.replace(',', ' ').split()]
            if len(parts) == 4:
                return int(parts[2]), int(parts[3])
    except (ET.ParseError, ValueError):
        return None
    return None


def count_words(a):
    text_chunks = [a['title'], a['description']]
    for s in a.get('sections', []):
        text_chunks.append(s.get('heading', ''))
        text_chunks.extend(s.get('paragraphs', []))
        figures = s.get('figures', [])
        if 'figure' in s and isinstance(s['figure'], dict):
            figures = [s['figure']] + list(figures)
        for fig in figures:
            text_chunks.extend([fig.get('caption', ''), fig.get('declaration', '')])
    for faq in a.get('faq', []):
        text_chunks.extend([faq.get('question', ''), faq.get('answer', '')])
    full_text = ' '.join(str(chunk) for chunk in text_chunks)
    return len(re.findall(r"\b[A-Za-z0-9'-]+\b", full_text))

def load_articles(directory):
    articles = []
    for source in sorted(directory.glob('*.json')):
        a = json.loads(source.read_text(encoding='utf-8'))
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', a['slug']), source
        assert a['slug'] == source.stem, source
        for key in ['title', 'description', 'author', 'image_alt']:
            assert isinstance(a[key], str) and a[key].strip(), (source, key)
        assert len(a['description']) <= 160, (source, 'description exceeds 160 characters')
        date.fromisoformat(a['date'])
        assert isinstance(a.get('image'), str) and a['image'].strip(), (source, 'image')
        canonical_cover = normalize_image_path(a['image'])
        assert canonical_cover.startswith('assets/') and '..' not in Path(canonical_cover).parts, (source, 'invalid cover image')
        assert (ROOT/canonical_cover).is_file(), (source, 'missing cover image')
        a['image'] = canonical_cover
        assert all(type(a[k]) is int and a[k] > 0 for k in ['image_width', 'image_height']), source
        if canonical_cover.endswith('.svg'):
            assert parse_svg_dimensions(ROOT/canonical_cover) == (a['image_width'], a['image_height']), (source, 'cover SVG dimensions mismatch')
        assert a['sections'] and all(s['heading'] and s['paragraphs'] for s in a['sections']), source

        # Validate inline body visuals per visual contract
        body_figures = []
        body_image_canonicals = []
        for s in a['sections']:
            figs = s.get('figures', [])
            if 'figure' in s and isinstance(s['figure'], dict):
                figs = [s['figure']] + list(figs)
            for fig in figs:
                assert isinstance(fig, dict), (source, 'invalid figure format')
                for fkey in ['image', 'image_alt', 'caption', 'declaration']:
                    assert isinstance(fig.get(fkey), str) and fig[fkey].strip(), (source, fkey)
                canonical_fig = normalize_image_path(fig['image'])
                assert canonical_fig.startswith('assets/') and '..' not in Path(canonical_fig).parts, (source, f'invalid figure image: {fig["image"]}')
                assert (ROOT/canonical_fig).is_file(), (source, f'missing body figure image: {fig["image"]}')
                assert canonical_fig != canonical_cover, (source, 'body figure repeats cover image')
                assert all(type(fig.get(k)) is int and fig[k] > 0 for k in ['width', 'height']), (source, 'figure dimensions')
                if canonical_fig.endswith('.svg'):
                    assert parse_svg_dimensions(ROOT/canonical_fig) == (fig['width'], fig['height']), (source, 'figure SVG dimensions mismatch')
                fig['image'] = canonical_fig
                if any(key in fig for key in ('mobile_image', 'mobile_width', 'mobile_height')):
                    assert all(key in fig for key in ('mobile_image', 'mobile_width', 'mobile_height')), (source, 'incomplete mobile figure fields')
                    canonical_mobile = normalize_image_path(fig['mobile_image'])
                    assert canonical_mobile.startswith('assets/') and '..' not in Path(canonical_mobile).parts, (source, 'invalid mobile image path')
                    assert (ROOT/canonical_mobile).is_file(), (source, 'missing mobile image')
                    assert canonical_mobile not in (canonical_fig, canonical_cover), (source, 'mobile image repeats desktop or cover')
                    assert all(type(fig[key]) is int and fig[key] > 0 for key in ('mobile_width', 'mobile_height')), (source, 'mobile figure dimensions')
                    if canonical_mobile.endswith('.svg'):
                        assert parse_svg_dimensions(ROOT/canonical_mobile) == (fig['mobile_width'], fig['mobile_height']), (source, 'mobile SVG dimensions mismatch')
                    fig['mobile_image'] = canonical_mobile
                    body_image_canonicals.append(canonical_mobile)
                body_figures.append(fig)
                body_image_canonicals.append(canonical_fig)

        assert len(body_image_canonicals) == len(set(body_image_canonicals)), (source, 'duplicate body figure images')
        for s in a['sections']:
            if 'links' in s:
                assert isinstance(s['links'], list), (source, 'invalid source link list')
                for link in s['links']:
                    assert isinstance(link, dict), (source, 'invalid source link')
                    assert isinstance(link.get('label'), str) and link['label'].strip(), (source, 'missing source label')
                    assert valid_https_reference(link.get('url')), (source, 'invalid source URL')
        if 'cta_route' in a:
            assert a['cta_route'] in CTA_ROUTES, (source, 'unknown CTA route')
        for field in ('cta_label', 'cta_note'):
            if field in a:
                assert isinstance(a[field], str) and a[field].strip(), (source, field)
        word_count = count_words(a)
        min_figures = 2 if word_count <= 600 else 3 if word_count <= 1200 else 4
        assert len(body_figures) >= min_figures, (
            source,
            f'Visual contract failed: word count {word_count} requires >= {min_figures} distinct body visuals, got {len(body_figures)}'
        )

        articles.append(a)
    return sorted(articles, key=lambda a: (a['date'], a['slug']), reverse=True)

def render(a, articles, shell):
    url = BASE+'insights/'+a['slug']+'.html'
    image = BASE+a['image']
    graph = [
        {'@type':'Article', 'headline':a['title'], 'description':a['description'],
         'image':image, 'datePublished':a['date'], 'author':{'@type':'Organization', 'name':a['author']},
         'publisher':{'@type':'Organization', 'name':'AN-THAI Engineering Company Limited'},
         'mainEntityOfPage':url, 'inLanguage':'en'},
        {'@type':'BreadcrumbList', 'itemListElement':[
            {'@type':'ListItem', 'position':1, 'name':'Home', 'item':BASE},
            {'@type':'ListItem', 'position':2, 'name':'Insights', 'item':BASE+'insights.html'},
            {'@type':'ListItem', 'position':3, 'name':a['title'], 'item':url}]}]
    faq = a.get('faq', [])
    if faq:
        graph.append({'@type':'FAQPage', 'mainEntity':[{'@type':'Question', 'name':f['question'],
            'acceptedAnswer':{'@type':'Answer', 'text':f['answer']}} for f in faq]})

    def render_section(s):
        h = '<h2>' + e(s['heading']) + '</h2>'
        p = ''.join('<p>' + e(para) + '</p>' for para in s['paragraphs'])
        figs = s.get('figures', [])
        if 'figure' in s and isinstance(s['figure'], dict):
            figs = [s['figure']] + list(figs)
        figures_html = ''
        for fig in figs:
            img = (
                f'<img src="/{e(fig["image"], quote=True)}" alt="{e(fig["image_alt"], quote=True)}" width="{fig["width"]}" height="{fig["height"]}" loading="lazy" decoding="async">'
            )
            if fig.get('mobile_image'):
                img = (
                    '<picture>'
                    f'<source media="(max-width: 600px)" srcset="/{e(fig["mobile_image"], quote=True)}" width="{fig["mobile_width"]}" height="{fig["mobile_height"]}">'
                    + img + '</picture>'
                )
            figures_html += (
                '<figure class="insight-body-figure">' + img
                + '<figcaption>'
                f'<span class="figure-caption">{e(fig["caption"])}</span>'
                f'<span class="figure-declaration">{e(fig["declaration"])}</span>'
                '</figcaption></figure>'
            )
        links_html = ''
        if s.get('links'):
            links_html = '<ul class="insight-source-links">' + ''.join(
                f'<li><a href="{e(link["url"], quote=True)}" rel="noopener noreferrer">{e(link["label"])}</a></li>'
                for link in s['links']
            ) + '</ul>'
        return f'<section class="insight-section">{h}{p}{figures_html}{links_html}</section>'

    sections = ''.join(render_section(s) for s in a['sections'])
    faqs = '<section class="insight-faq"><h2>Frequently asked questions</h2><div class="faq-list">'+''.join('<details open><summary>'+e(f['question'])+'</summary><p>'+e(f['answer'])+'</p></details>' for f in faq)+'</div></section>' if faq else ''
    related = [x for x in articles if x['slug'] != a['slug']][:3]
    related_html = ''.join('<li><a href="/insights/'+x['slug']+'.html"><span>'+e(x['title'])+'</span><span class="arrow" aria-hidden="true">→</span></a></li>' for x in related)
    related_html = '<ul class="insight-related-list">'+related_html+'</ul>' if related else '<p><a class="arrow-link" href="/insights.html">Browse all Insights <span>→</span></a></p>'
    caption = e(a.get('image_caption') or a['image_alt'])
    route = a.get('cta_route')
    cta_href = '/contact.html?type=' + route + '#enquiry-form' if route in CTA_ROUTES else '/contact.html'
    cta_label = a.get('cta_label') or 'Contact AN-THAI'
    cta_note = a.get('cta_note') or 'Connect with AN-THAI to discuss the relevant project scope and requirements.'
    values = {'title':e(a['title']), 'author':e(a['author']), 'date':e(a['date']),
        'cta_href':e(cta_href, quote=True), 'cta_label':e(cta_label), 'cta_note':e(cta_note),
        'image':e('/'+a['image']), 'image_alt':e(a['image_alt']), 'image_caption':caption,
        'width':str(a['image_width']), 'height':str(a['image_height']),
        'sections':sections, 'faq':faqs, 'related':related_html}
    body = (ROOT/'templates/article.html').read_text(encoding='utf-8')
    for key, value in values.items(): body = body.replace('{{'+key+'}}', value)
    shell = re.sub(r'<main.*?</main>', lambda _:body, shell, flags=re.S)
    shell = re.sub(r'<title>.*?</title>', lambda _:'<title>'+e(a['title'])+' | AN-THAI Engineering</title>', shell)
    shell = re.sub(r'<link rel="alternate"[^>]*>', '', shell)
    shell = re.sub(r'<nav class="language-switch".*?</nav>', '', shell, flags=re.S)
    article_lang_nav = (
        '<nav class="lang-switch" aria-label="Language">'
        f'<a href="/insights/{e(a["slug"], quote=True)}.html" class="lang-btn" data-language="en" data-lang="EN" lang="en" hreflang="en" aria-current="true" aria-pressed="true">EN</a>'
        '<a href="/zh/insights/index.html" class="lang-btn" data-language="zh" data-lang="ZH" lang="zh-CN" hreflang="zh-CN" aria-pressed="false">中文</a>'
        '<a href="/th/insights/index.html" class="lang-btn" data-language="th" data-lang="TH" lang="th" hreflang="th" aria-pressed="false">ไทย</a>'
        '</nav>'
    )
    shell = re.sub(r'<nav class="lang-switch"[^>]*>.*?</nav>', lambda _: article_lang_nav, shell, flags=re.S)
    shell = re.sub(r'<meta (?:name="(?:description|twitter:[^"]*)"|property="og:[^"]*")[^>]*>', '', shell)
    shell = re.sub(r'<link rel="canonical"[^>]*>', '', shell)
    shell = re.sub(r'<script type="application/ld\+json">.*?</script>', '', shell, flags=re.S)
    head = '<link rel="canonical" href="'+url+'"><meta name="description" content="'+e(a['description'], quote=True)+'">'
    for attr, key, value in [
        ('property','og:site_name','AN-THAI Engineering'),
        ('property','og:locale','en_TH'),
        ('property','og:type','article'),
        ('property','og:title',a['title']),
        ('property','og:description',a['description']),
        ('property','og:url',url),
        ('property','og:image',image),
        ('property','og:image:alt',a['image_alt']),
        ('name','twitter:card','summary_large_image'),
        ('name','twitter:title',a['title']),
        ('name','twitter:description',a['description']),
        ('name','twitter:image',image),
        ('name','twitter:image:alt',a['image_alt'])
    ]:
        head += '<meta '+attr+'="'+key+'" content="'+e(value, quote=True)+'">'
    head += '<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph}, ensure_ascii=False).replace('<','\\u003c')+'</script>'
    return shell.replace('</head>', head+'</head>')

def derive_units(a):
    raw_units = a.get('units')
    if isinstance(raw_units, list) and raw_units:
        return ' '.join(str(u).strip() for u in raw_units if str(u).strip())
    if isinstance(raw_units, str) and raw_units.strip():
        return raw_units.strip()
    route = a.get('cta_route', 'engineering')
    return {
        'engineering': 'testing',
        'steel': 'steel',
        'powder': 'powder',
        'instruments': 'instruments',
    }.get(route, 'testing')


def build_cards(articles, lang='en'):
    cta = CTA_LABELS.get(lang, 'Read article')
    lang_badge = '' if lang == 'en' else ('<span class="lang-pill" style="margin-left:8px;font-size:11px;font-weight:600;background:var(--surface-alt);border:1px solid var(--line-soft);padding:2px 6px;border-radius:4px;">' + ('EN 英文原稿' if lang == 'zh' else 'EN ต้นฉบับ') + '</span>')
    cta_suffix = '' if lang == 'en' else (' (' + ('英文原稿' if lang == 'zh' else 'ต้นฉบับ EN') + ')')
    return ''.join(
        f'<article class="insight-card" data-article-units="{e(derive_units(a), quote=True)}">'
        f'<a class="insight-card__media" href="/insights/{a["slug"]}.html" tabindex="-1" aria-hidden="true">'
        f'<img src="/{e(a["image"])}" alt="{e(a["image_alt"])}" width="{a["image_width"]}" height="{a["image_height"]}" loading="lazy" decoding="async">'
        '</a>'
        '<div class="insight-card__body">'
        '<div class="insight-card__meta">'
        f'<time datetime="{a["date"]}">{a["date"]}</time>'
        '<span class="insight-card__sep" aria-hidden="true">·</span>'
        f'<span class="insight-card__author">{e(a["author"])}</span>'
        f'{lang_badge}'
        '</div>'
        f'<h2 class="insight-card__title"><a href="/insights/{a["slug"]}.html">{e(a["title"])}</a></h2>'
        f'<p class="insight-card__desc">{e(a["description"])}</p>'
        f'<a class="insight-card__cta" href="/insights/{a["slug"]}.html">{cta}{cta_suffix} <span aria-hidden="true">→</span></a>'
        '</div>'
        '</article>'
        for a in articles
    )


def build_latest_home_cards(articles, lang='en'):
    cta_map = {
        'en': 'Read Article →',
        'zh': '阅读文章（英文原稿）→',
        'th': 'อ่านบทความ (ต้นฉบับ EN) →',
    }
    cta = cta_map.get(lang, 'Read Article →')
    unit_labels = {
        'testing': '01 Testing',
        'steel': '02 Steel',
        'powder': '03 Cement & Mining',
        'instruments': '04 Instruments',
    }
    cards = []
    for a in articles[:3]:
        units = derive_units(a)
        primary_unit = units.split()[0] if units else 'testing'
        unit_label = unit_labels.get(primary_unit, '01 Testing')
        cards.append(
            f'<article class="insight-card" data-article-unit="{e(primary_unit, quote=True)}">'
            '<div>'
            f'<div class="insight-meta"><span>{unit_label}</span><span>{a["date"]}</span></div>'
            f'<h3 class="h3" style="margin-top:6px;">{e(a["title"])}</h3>'
            f'<p class="muted" style="margin-top:6px;font-size:12px;">{e(a["description"])}</p>'
            '</div>'
            f'<a href="/insights/{a["slug"]}.html" class="unit-link" data-i18n="insReadOrig">{cta}</a>'
            '</article>'
        )
    return '<div class="grid-3">' + ''.join(cards) + '</div>'


def _load_i18n_dict():
    p = ROOT / 'assets/js/i18n-data.js'
    if not p.is_file():
        return {}
    raw = p.read_text(encoding='utf-8')
    if 'window.ANTHAI_I18N =' not in raw:
        return {}
    try:
        return json.loads(raw.split('window.ANTHAI_I18N =', 1)[1].rstrip(';\n '))
    except Exception:
        return {}


def _localize_insights_subdir(base_html, lang, i18n):
    lang_code = {'en': 'en', 'zh': 'zh-CN', 'th': 'th'}[lang]
    lang_upper = {'en': 'EN', 'zh': 'ZH', 'th': 'TH'}[lang]
    canon = f'{BASE}insights/' if lang == 'en' else f'{BASE}{lang}/insights/'
    alt_links = (
        f'<link rel="alternate" hreflang="en" href="{BASE}insights/" />'
        f'<link rel="alternate" hreflang="zh-CN" href="{BASE}zh/insights/" />'
        f'<link rel="alternate" hreflang="th" href="{BASE}th/insights/" />'
        f'<link rel="alternate" hreflang="x-default" href="{BASE}insights/" />'
    )
    out = re.sub(r'<html lang="[^"]*">', f'<html lang="{lang_code}">', base_html, count=1)
    out = re.sub(r'<link rel="alternate"[^>]*>\s*', '', out)
    out = re.sub(r'<link rel="canonical" href="[^"]*"\s*/?>', f'<link rel="canonical" href="{canon}" />\n  {alt_links}', out, count=1)
    out = re.sub(r'<meta property="og:url" content="[^"]*"\s*/?>', f'<meta property="og:url" content="{canon}" />', out, count=1)
    out = out.replace('../assets/', '/assets/').replace('./assets/', '/assets/')
    if lang != 'en':
        for slug in ['index', 'testing', 'steel-procurement', 'cement-mining-equipment', 'powder-equipment', 'testing-instruments', 'about', 'contact']:
            out = out.replace(f'href="../{slug}.html', f'href="/{lang}/{slug}.html')
            out = out.replace(f'href="/{slug}.html', f'href="/{lang}/{slug}.html')
        out = out.replace('href="../cases/index.html"', f'href="/{lang}/cases/index.html"')
        out = out.replace('href="../insights/index.html"', f'href="/{lang}/insights/index.html"')
        out = out.replace('href="/cases/index.html"', f'href="/{lang}/cases/index.html"')
        out = out.replace('href="/insights/index.html"', f'href="/{lang}/insights/index.html"')
    else:
        out = out.replace('href="../', 'href="/')

    lang_btns = ''.join(
        f'<a href="{"/insights/index.html" if l == "en" else f"/{l}/insights/index.html"}" class="lang-btn" data-language="{l}" data-lang="{lu}" lang="{lc}" hreflang="{lc}"'
        + (' aria-current="true" aria-pressed="true"' if l == lang else ' aria-pressed="false"')
        + f'>{lbl}</a>'
        for l, lc, lu, lbl in [('en', 'en', 'EN', 'EN'), ('zh', 'zh-CN', 'ZH', '中文'), ('th', 'th', 'TH', 'ไทย')]
    )
    lang_label = {'en': 'Language', 'zh': '语言', 'th': 'ภาษา'}[lang]
    out = re.sub(r'<nav class="lang-switch"[^>]*>.*?</nav>', f'<nav class="lang-switch" aria-label="{lang_label}">{lang_btns}</nav>', out, flags=re.S)

    trans = i18n.get(lang_upper, {})
    if trans and lang != 'en':
        def _repl_i18n(m):
            before, key, after, inner = m.group(1), m.group(2), m.group(3), m.group(4)
            if key in trans:
                return f'{before}{key}{after}>{e(trans[key], quote=False)}<'
            return m.group(0)
        out = re.sub(r'(<[^>]*\bdata-i18n=")([^"]+)("[^>]*)>([^<]*)<', _repl_i18n, out)
    return out


def generate():
    dist = ROOT/'dist'
    articles = load_articles(ROOT/'content/insights')
    target = dist/'insights'
    target.mkdir(exist_ok=True)
    root_insights = ROOT/'insights'
    root_insights.mkdir(exist_ok=True)
    shell = (dist/'insights.html').read_text(encoding='utf-8') if (dist/'insights.html').is_file() else (ROOT/'insights.html').read_text(encoding='utf-8')
    sitemap = (dist/'sitemap.xml').read_text(encoding='utf-8') if (dist/'sitemap.xml').is_file() else (ROOT/'sitemap.xml').read_text(encoding='utf-8')
    llms = ((dist/'llms.txt').read_text(encoding='utf-8') if (dist/'llms.txt').is_file() else (ROOT/'llms.txt').read_text(encoding='utf-8'))+'\n## Insights\n\n- '+BASE+'insights.html\n'
    for a in articles:
        rendered = render(a, articles, shell)
        (target/(a['slug']+'.html')).write_text(rendered, encoding='utf-8')
        (root_insights/(a['slug']+'.html')).write_text(rendered, encoding='utf-8')
        url = BASE+'insights/'+a['slug']+'.html'
        if url not in sitemap:
            sitemap = sitemap.replace('</urlset>', '<url><loc>'+url+'</loc><lastmod>'+a['date']+'</lastmod></url>\n</urlset>')
        llms += '- ['+a['title']+']('+url+')\n'

    i18n = _load_i18n_dict()
    if (dist/'insights/index.html').exists():
        base_idx = (dist/'insights/index.html').read_text(encoding='utf-8')
        for l_sub, p_sub in [('en', dist/'insights/index.html'), ('zh', dist/'zh/insights/index.html'), ('th', dist/'th/insights/index.html')]:
            p_sub.parent.mkdir(parents=True, exist_ok=True)
            p_sub.write_text(_localize_insights_subdir(base_idx, l_sub, i18n), encoding='utf-8')

    if articles:
        for page, lang in [
            (dist/'insights.html', 'en'), (dist/'insights/index.html', 'en'),
            (dist/'th/insights.html', 'th'), (dist/'th/insights/index.html', 'th'),
            (dist/'zh/insights.html', 'zh'), (dist/'zh/insights/index.html', 'zh'),
        ]:
            if page.exists():
                html = page.read_text(encoding='utf-8')
                assert '<!-- insights:start -->' in html and '<!-- insights:end -->' in html, f'Missing insights markers in {page}'
                cards_block = '<!-- insights:start -->\n        <div class="insights-grid">' + build_cards(articles, lang=lang) + '</div>\n        <!-- insights:end -->'
                page.write_text(re.sub(r'<!-- insights:start -->.*?<!-- insights:end -->', lambda _: cards_block, html, flags=re.S), encoding='utf-8')

        # Update Homepage Latest Insights blocks in dist/ (top 3 newest articles across EN/ZH/TH)
        for home_path, lang in [
            (dist/'index.html', 'en'), (dist/'zh/index.html', 'zh'), (dist/'th/index.html', 'th'),
        ]:
            if home_path.exists():
                home_html = home_path.read_text(encoding='utf-8')
                if '<!-- latest-insights:start -->' in home_html:
                    latest_block = '<!-- latest-insights:start -->\n        ' + build_latest_home_cards(articles, lang=lang) + '\n        <!-- latest-insights:end -->'
                    home_path.write_text(re.sub(r'<!-- latest-insights:start -->.*?<!-- latest-insights:end -->', lambda _: latest_block, home_html, flags=re.S), encoding='utf-8')

    if (dist/'sitemap.xml').is_file(): (dist/'sitemap.xml').write_text(sitemap, encoding='utf-8')
    if (dist/'llms.txt').is_file(): (dist/'llms.txt').write_text(llms, encoding='utf-8')
    locs = {x.text for x in ET.fromstring(sitemap).iter() if x.tag.endswith('}loc')}
    for a in articles: assert BASE+'insights/'+a['slug']+'.html' in locs
    assert not (dist/'drafts').exists(), 'Drafts must never be packaged'
    print(f'PASS: {len(articles)} published articles: image, visual contract, description and sitemap checks; drafts excluded')

if __name__ == '__main__': generate()
