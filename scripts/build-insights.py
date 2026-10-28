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

def build_cards(articles, lang='en'):
    cta = CTA_LABELS.get(lang, 'Read article')
    return ''.join(
        '<article class="insight-card">'
        f'<a class="insight-card__media" href="/insights/{a["slug"]}.html" tabindex="-1" aria-hidden="true">'
        f'<img src="/{e(a["image"])}" alt="{e(a["image_alt"])}" width="{a["image_width"]}" height="{a["image_height"]}" loading="lazy" decoding="async">'
        '</a>'
        '<div class="insight-card__body">'
        '<div class="insight-card__meta">'
        f'<time datetime="{a["date"]}">{a["date"]}</time>'
        '<span class="insight-card__sep" aria-hidden="true">·</span>'
        f'<span class="insight-card__author">{e(a["author"])}</span>'
        '</div>'
        f'<h2 class="insight-card__title"><a href="/insights/{a["slug"]}.html">{e(a["title"])}</a></h2>'
        f'<p class="insight-card__desc">{e(a["description"])}</p>'
        f'<a class="insight-card__cta" href="/insights/{a["slug"]}.html">{cta} <span aria-hidden="true">→</span></a>'
        '</div>'
        '</article>'
        for a in articles
    )

def generate():
    dist = ROOT/'dist'
    articles = load_articles(ROOT/'content/insights')
    target = dist/'insights'
    target.mkdir(exist_ok=True)
    shell = (dist/'insights.html').read_text(encoding='utf-8')
    sitemap = (dist/'sitemap.xml').read_text(encoding='utf-8')
    llms = (dist/'llms.txt').read_text(encoding='utf-8')+'\n## Insights\n\n- '+BASE+'insights.html\n'
    for a in articles:
        (target/(a['slug']+'.html')).write_text(render(a, articles, shell), encoding='utf-8')
        url = BASE+'insights/'+a['slug']+'.html'
        sitemap = sitemap.replace('</urlset>', '<url><loc>'+url+'</loc><lastmod>'+a['date']+'</lastmod></url>\n</urlset>')
        llms += '- ['+a['title']+']('+url+')\n'
    if articles:
        for page, lang in [(dist/'insights.html', 'en'), (dist/'th/insights.html', 'th'), (dist/'zh/insights.html', 'zh')]:
            html = page.read_text(encoding='utf-8')
            cards_block = '<div class="insights-grid">' + build_cards(articles, lang=lang) + '</div>'
            page.write_text(re.sub(r'<!-- insights:start -->.*?<!-- insights:end -->', lambda _: cards_block, html, flags=re.S), encoding='utf-8')
    (dist/'sitemap.xml').write_text(sitemap, encoding='utf-8')
    (dist/'llms.txt').write_text(llms, encoding='utf-8')
    locs = {x.text for x in ET.fromstring(sitemap).iter() if x.tag.endswith('}loc')}
    for a in articles: assert BASE+'insights/'+a['slug']+'.html' in locs
    assert not (dist/'drafts').exists(), 'Drafts must never be packaged'
    print(f'PASS: {len(articles)} published articles: image, visual contract, description and sitemap checks; drafts excluded')

if __name__ == '__main__': generate()
