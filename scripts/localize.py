"""Generate complete static locales; untranslated visible content blocks the build."""
from html.parser import HTMLParser
from html import escape
from pathlib import Path
import json
import re
import os

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['index', 'services', 'equipment', 'portfolio', 'about', 'contact', '404']
ROWS = [line.split(' || ') for line in (ROOT / 'scripts/translations.txt').read_text().splitlines() if line.strip()]
assert all(len(row) == 3 and all(row) for row in ROWS), 'Malformed translation row'
assert len({r[0] for r in ROWS}) == len(ROWS), 'Duplicate translation key'
MAP = {r[0]: r[1:] for r in ROWS}
IDENTITY = {'AN-THAI', 'info@an-thai.com', 'anthaicheng@gmail.com', '+66 90 292 1749'}
LABELS = {'en': ['Language', 'Close menu', 'Open menu'], 'zh': ['语言', '关闭菜单', '打开菜单'], 'th': ['ภาษา', 'ปิดเมนู', 'เปิดเมนู']}
ENGLISH = {
 'CN / EN · PDF · 5.3 MB': 'CN / EN · PDF · 0.7 MB',
 'AN-THAI engineers carrying out field pile testing': 'Pile-testing scenes from the AN-THAI engineering brochure',
 'Static load test setup by AN-THAI': 'Static load-test setup shown in the AN-THAI brochure',
 'Testing and laboratory instruments used in AN-THAI work': 'Laboratory instruments illustrated in the AN-THAI partner laboratory brochure section',
 'Testing service / 工程检测': 'Testing service', 'Testing equipment / 检测设备': 'Testing equipment',
 'James Cheng · 程健': 'James Cheng',
}

def url(lang, page):
    prefix = '' if lang == 'en' else lang + '/'
    return 'https://an-thai.com/' + prefix + ('' if page == 'index' else page + '.html')

class Localizer(HTMLParser):
    def __init__(self, lang, page):
        super().__init__(convert_charrefs=True)
        self.lang, self.page = lang, page
        self.out, self.missing = [], set()
        self.script = False
        self.json_script = False
        self.count = 0
    def tr(self, value):
        key = value.strip()
        if not key: return value
        if self.lang == 'en':
            replacement = ENGLISH.get(key, key.split(' · ')[0] if re.search('[\u3400-\u9fff]', key) else key)
        elif key in MAP:
            replacement = MAP[key][0 if self.lang == 'zh' else 1]
            self.count += 1
        elif key in IDENTITY or not re.search('[A-Za-z\u3400-\u9fff]', key): replacement = key
        else:
            self.missing.add(key)
            replacement = key
        return value.replace(key, replacement)
    def handle_decl(self, decl): self.out.append('<!' + decl + '>')
    def handle_comment(self, data): self.out.append('<!--' + data + '-->')
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html': attrs['lang'] = {'en':'en','zh':'zh-CN','th':'th'}[self.lang]
        if tag == 'script':
            self.script = True
            self.json_script = attrs.get('type') == 'application/ld+json'
        for key in ['alt', 'placeholder', 'aria-label']:
            if key in attrs: attrs[key] = self.tr(attrs[key])
        if tag == 'meta':
            kind = attrs.get('name', attrs.get('property', ''))
            if kind in ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description']:
                attrs['content'] = self.tr(attrs['content'])
            if kind == 'og:url': attrs['content'] = url(self.lang, self.page)
            if kind == 'og:locale': attrs['content'] = {'en':'en_TH','zh':'zh_CN','th':'th_TH'}[self.lang]
        if tag == 'link' and attrs.get('rel') == 'canonical': attrs['href'] = url(self.lang, self.page)
        if tag == 'button' and 'menu-btn' in attrs.get('class',''):
            attrs['data-open-label'] = LABELS[self.lang][2]
            attrs['data-close-label'] = LABELS[self.lang][1]
        for key in ['href', 'src', 'srcset']:
            if key not in attrs or not attrs[key]: continue
            value = attrs[key]
            if value.startswith('assets/'):
                attrs[key] = value.replace('assets/', '/assets/')
            elif key == 'href' and re.match(r'^/?(index|services|equipment|portfolio|about|contact|404)\.html', value):
                attrs[key] = '/' + ('' if self.lang == 'en' else self.lang + '/') + value.lstrip('/')
        self.out.append('<' + tag + ''.join(' ' + k + ('' if v is None else '="' + escape(v, quote=True) + '"') for k,v in attrs.items()) + '>')
        if tag == 'div' and attrs.get('class') == 'nav-actions':
            links = ''.join('<a data-language="'+l+'" lang="'+({'zh':'zh-CN'}.get(l,l))+'" hreflang="'+({'zh':'zh-CN'}.get(l,l))+'" href="'+url(l,self.page).replace('https://an-thai.com','')+'"'+(' aria-current="true"' if l==self.lang else '')+'>'+label+'</a>' for l,label in [('en','EN'),('zh','中文'),('th','ไทย')])
            self.out.append('<nav class="language-switch" aria-label="'+LABELS[self.lang][0]+'">'+links+'</nav>')
    def handle_startendtag(self, tag, attrs): self.handle_starttag(tag,attrs)
    def handle_endtag(self, tag):
        if tag == 'head':
            if self.page == '404': self.out.append('<link rel="canonical" href="'+url(self.lang,self.page)+'">')
            for lang in ['en','zh','th']:
                self.out.append('<link rel="alternate" hreflang="'+({'zh':'zh-CN'}.get(lang,lang))+'" href="'+url(lang,self.page)+'">')
            self.out.append('<link rel="alternate" hreflang="x-default" href="'+url('en',self.page)+'">')
        if tag == 'script': self.script = False
        self.out.append('</'+tag+'>')
    def handle_data(self, data):
        if self.script:
            if self.json_script:
                obj = json.loads(data)
                def walk(x):
                    if isinstance(x,list): return [walk(v) for v in x]
                    if isinstance(x,dict):
                        out={k: ({'en':'en','zh':'zh-CN','th':'th'}[self.lang] if k=='inLanguage' else (self.tr(v) if k in ['name','description'] and isinstance(v,str) and v in MAP else walk(v))) for k,v in x.items()}
                        if x.get('@type') in ['Service','WebPage']:
                            out['url']=url(self.lang,self.page)
                            if '@id' in x:out['@id']=url(self.lang,self.page)+'#'+x['@id'].split('#')[-1]
                        return out
                    return x
                data = json.dumps(walk(obj), ensure_ascii=False)
            self.out.append(data)
        else: self.out.append(escape(self.tr(data), quote=False))

def generate():
    results=[]
    for lang in ['en','zh','th']:
        target = ROOT/'dist'/('' if lang=='en' else lang)
        target.mkdir(parents=True, exist_ok=True)
        for page in PAGES:
            p=Localizer(lang,page);p.feed((ROOT/(page+'.html')).read_text())
            if p.missing: raise RuntimeError(f'{lang}/{page}: missing translations: '+json.dumps(sorted(p.missing),ensure_ascii=False))
            (target/(page+'.html')).write_text(''.join(p.out))
            results.append({'language':lang,'page':page,'translated_items':p.count,'missing':0})
    sitemap=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for lang in ['en','zh','th']:
        for page in PAGES[:-1]:
            sitemap.append('<url><loc>'+url(lang,page)+'</loc>')
            for alt in ['en','zh','th']:
                sitemap.append('<xhtml:link rel="alternate" hreflang="'+({'zh':'zh-CN'}.get(alt,alt))+'" href="'+url(alt,page)+'"/>')
            sitemap.append('</url>')
    sitemap.append('</urlset>')
    (ROOT/'dist/sitemap.xml').write_text('\n'.join(sitemap))
    # Responsive browser QA harness: exists only on preview deployments.
    if os.environ.get('VERCEL_ENV') == 'preview':
        qa=ROOT/'dist/_qa';qa.mkdir(exist_ok=True)
        for page in PAGES:
            frames=''.join('<h2>'+lang+' / '+str(width)+'</h2><iframe title="'+lang+'-'+str(width)+'" width="'+str(width)+'" height="900" src="'+url(lang,page).replace('https://an-thai.com','')+'"></iframe>' for lang in ['en','zh','th'] for width in [390,820,1363])
            nav=' '.join('<a href="'+p+'.html">'+p+'</a>' for p in PAGES)
            (qa/(page+'.html')).write_text('<!doctype html><html lang="en"><head><meta name="robots" content="noindex,nofollow"><title>Responsive QA</title></head><body>'+nav+frames+'</body></html>')
    print(json.dumps({'pages':len(results),'coverage':results},ensure_ascii=False))

if __name__ == '__main__': generate()
