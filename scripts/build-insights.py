"""Render trusted editorial JSON with escaped text; no runtime dependencies."""
from pathlib import Path
from html import escape
from datetime import date
import json
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
        cover_image = Path(a['image'])
        assert not cover_image.is_absolute() and '..' not in cover_image.parts and cover_image.parts[0] == 'assets', source
        assert (ROOT/cover_image).is_file(), (source, 'missing cover image')
        assert all(type(a[k]) is int and a[k] > 0 for k in ['image_width', 'image_height']), source
        assert a['sections'] and all(s['heading'] and s['paragraphs'] for s in a['sections']), source

        # Validate inline body visuals per visual contract
        body_figures = []
        body_image_paths = []
        for s in a['sections']:
            figs = s.get('figures', [])
            if 'figure' in s and isinstance(s['figure'], dict):
                figs = [s['figure']] + list(figs)
            for fig in figs:
                assert isinstance(fig, dict), (source, 'invalid figure format')
                for fkey in ['image', 'image_alt', 'caption', 'declaration']:
                    assert isinstance(fig.get(fkey), str) and fig[fkey].strip(), (source, fkey)
                fig_image = Path(fig['image'])
                assert not fig_image.is_absolute() and '..' not in fig_image.parts and fig_image.parts[0] == 'assets', source
                assert (ROOT/fig_image).is_file(), (source, f'missing body figure image: {fig["image"]}')
                assert fig['image'] != a['image'], (source, 'body figure repeats cover image')
                assert all(type(fig.get(k)) is int and fig[k] > 0 for k in ['width', 'height']), (source, 'figure dimensions')
                body_figures.append(fig)
                body_image_paths.append(fig['image'])

        assert len(body_image_paths) == len(set(body_image_paths)), (source, 'duplicate body figure images')
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
            figures_html += (
                '<figure class="insight-body-figure">'
                f'<img src="/{e(fig["image"])}" alt="{e(fig["image_alt"])}" width="{fig["width"]}" height="{fig["height"]}" loading="lazy" decoding="async">'
                '<figcaption>'
                f'<span class="figure-caption">{e(fig["caption"])}</span>'
                f'<span class="figure-declaration">{e(fig["declaration"])}</span>'
                '</figcaption>'
                '</figure>'
            )
        return f'<section class="insight-section">{h}{p}{figures_html}</section>'

    sections = ''.join(render_section(s) for s in a['sections'])
    faqs = '<section class="insight-faq"><h2>Frequently asked questions</h2><div class="faq-list">'+''.join('<details open><summary>'+e(f['question'])+'</summary><p>'+e(f['answer'])+'</p></details>' for f in faq)+'</div></section>' if faq else ''
    related = [x for x in articles if x['slug'] != a['slug']][:3]
    related_html = ''.join('<li><a href="/insights/'+x['slug']+'.html"><span>'+e(x['title'])+'</span><span class="arrow" aria-hidden="true">→</span></a></li>' for x in related)
    related_html = '<ul class="insight-related-list">'+related_html+'</ul>' if related else '<p><a class="arrow-link" href="/insights.html">Browse all Insights <span>→</span></a></p>'
    caption = e(a.get('image_caption') or a['image_alt'])
    values = {'title':e(a['title']), 'author':e(a['author']), 'date':e(a['date']),
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
