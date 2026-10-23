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
        image = Path(a['image'])
        assert not image.is_absolute() and '..' not in image.parts and image.parts[0] == 'assets', source
        assert (ROOT/image).is_file(), (source, 'missing image')
        assert all(type(a[k]) is int and a[k] > 0 for k in ['image_width', 'image_height']), source
        assert a['sections'] and all(s['heading'] and s['paragraphs'] for s in a['sections']), source
        articles.append(a)
    return sorted(articles, key=lambda a: (a['date'], a['slug']), reverse=True)

def render(a, articles, shell):
    e = escape
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
    sections = ''.join('<section><h2>'+e(s['heading'])+'</h2>'+''.join('<p>'+e(p)+'</p>' for p in s['paragraphs'])+'</section>' for s in a['sections'])
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

def generate():
    dist = ROOT/'dist'
    articles = load_articles(ROOT/'content/insights')
    target = dist/'insights'
    target.mkdir(exist_ok=True)
    shell = (dist/'insights.html').read_text(encoding='utf-8')
    sitemap = (dist/'sitemap.xml').read_text(encoding='utf-8')
    llms = (dist/'llms.txt').read_text(encoding='utf-8')+'\n## Insights\n\n- '+BASE+'insights.html\n'
    cards = ''.join(
        '<article class="insight-card">'
        '<a class="insight-card__media" href="/insights/'+a['slug']+'.html" tabindex="-1" aria-hidden="true">'
        '<img src="/'+e(a['image'])+'" alt="'+e(a['image_alt'])+'" width="'+str(a['image_width'])+'" height="'+str(a['image_height'])+'" loading="lazy" decoding="async">'
        '</a>'
        '<div class="insight-card__body">'
        '<div class="insight-card__meta">'
        '<time datetime="'+a['date']+'">'+a['date']+'</time>'
        '<span class="insight-card__sep" aria-hidden="true">·</span>'
        '<span class="insight-card__author">'+e(a['author'])+'</span>'
        '</div>'
        '<h2 class="insight-card__title"><a href="/insights/'+a['slug']+'.html">'+e(a['title'])+'</a></h2>'
        '<p class="insight-card__desc">'+e(a['description'])+'</p>'
        '<a class="insight-card__cta" href="/insights/'+a['slug']+'.html">Read article <span aria-hidden="true">→</span></a>'
        '</div>'
        '</article>'
        for a in articles
    )
    for a in articles:
        (target/(a['slug']+'.html')).write_text(render(a, articles, shell), encoding='utf-8')
        url = BASE+'insights/'+a['slug']+'.html'
        sitemap = sitemap.replace('</urlset>', '<url><loc>'+url+'</loc><lastmod>'+a['date']+'</lastmod></url>\n</urlset>')
        llms += '- ['+a['title']+']('+url+')\n'
    if cards:
        cards_block = '<div class="insights-grid">' + cards + '</div>'
        for page in [dist/'insights.html', dist/'th/insights.html', dist/'zh/insights.html']:
            html = page.read_text(encoding='utf-8')
            # Article titles stay English; only the index chrome is translated.
            page.write_text(re.sub(r'<!-- insights:start -->.*?<!-- insights:end -->', lambda _: cards_block, html, flags=re.S), encoding='utf-8')
    (dist/'sitemap.xml').write_text(sitemap, encoding='utf-8')
    (dist/'llms.txt').write_text(llms, encoding='utf-8')
    locs = {x.text for x in ET.fromstring(sitemap).iter() if x.tag.endswith('}loc')}
    for a in articles: assert BASE+'insights/'+a['slug']+'.html' in locs
    assert not (dist/'drafts').exists(), 'Drafts must never be packaged'
    print(f'PASS: {len(articles)} published articles: image, description and sitemap checks; drafts excluded')

if __name__ == '__main__': generate()
