"""Check every generated page, locale target, asset, anchor, metadata and schema."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re

root=Path(__file__).resolve().parent.parent/'dist'
class Doc(HTMLParser):
    def __init__(self, html):
        super().__init__();self.tags=[];self.ids=set();self.script=False;self.text=[];self.schemas=[];self.feed(html)
    def handle_starttag(self,t,a):
        a=dict(a);self.tags.append((t,a))
        if 'id' in a:self.ids.add(a['id'])
        if t=='script':self.script=a.get('type')=='application/ld+json'
    def handle_endtag(self,t):
        if t=='script':self.script=False
    def handle_data(self,d):
        if self.script:self.schemas.append(json.loads(d))
        else:self.text.append(d)
for preview in (root/'_qa').glob('*.html'):
    assert 'noindex,nofollow' in preview.read_text(encoding='utf-8'), preview
docs={p.relative_to(root).as_posix():Doc(p.read_text(encoding='utf-8')) for p in root.rglob('*.html') if '_qa' not in p.relative_to(root).parts}
assert len(docs)==24 + len(list((root/'insights').glob('*.html'))), len(docs)
links=0
for name,d in docs.items():
    language='zh-CN' if name.startswith('zh/') else 'th' if name.startswith('th/') else 'en'
    assert ('html',{'lang':language}) in d.tags, name
    alternatives=[a for t,a in d.tags if t=='link' and a.get('rel')=='alternate']
    article=name.startswith('insights/')
    assert {a['hreflang'] for a in alternatives}==(set() if article else {'en','zh-CN','th','x-default'}),name
    assert len([a for t,a in d.tags if t=='link' and a.get('rel')=='canonical'])==1,name
    assert len([a for t,a in d.tags if t=='h1'])==1,name
    assert len([a for t,a in d.tags if t=='a' and 'data-language' in a])==(0 if article else 3),name
    for t,a in d.tags:
        if t=='img':assert a.get('alt','').strip(),name
        for key in ['href','src']:
            if key not in a:continue
            u=urlsplit(a[key])
            if u.netloc and u.netloc!='an-thai.com':continue
            if u.scheme and u.scheme not in ['http','https']:continue
            target=u.path.lstrip('/') if u.path.startswith('/') else str(Path(name).parent/u.path)
            if not u.path:target=name
            if target.endswith('/') or target in ['', '.']:target=target.rstrip('/')+'/index.html' if target not in ['', '.'] else 'index.html'
            assert (root/target).exists(),(name,a[key],target)
            if u.fragment and target in docs:assert unquote(u.fragment) in docs[target].ids,(name,a[key])
            links+=1
    if language in ['en','th'] and not name.endswith('insights.html'):assert not re.search('[\u3400-\u9fff]', ''.join(d.text).replace('中文','')),name
    print('PASS',name,language,'navigation, alternate languages, links, images, metadata, JSON-LD')
print('PASS:',len(docs),'pages;',links,'local links and assets checked')
