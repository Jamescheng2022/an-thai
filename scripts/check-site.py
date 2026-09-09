#!/usr/bin/env python3
"""Buildless static checks. Run with Python 3; no third-party dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json, re, sys, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
class Document(HTMLParser):
 def __init__(self,path):
  super().__init__(convert_charrefs=True);self.tags=[];self.scripts=[];self.in_json=False;self.buffer='';self.feed(path.read_text())
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs);self.tags.append((tag,attrs))
  if tag=='script' and attrs.get('type')=='application/ld+json':self.in_json=True;self.buffer=''
 def handle_data(self,data):
  if self.in_json:self.buffer+=data
 def handle_endtag(self,tag):
  if tag=='script' and self.in_json:self.scripts.append(json.loads(self.buffer));self.in_json=False
errors=[];pages={p.name:Document(p) for p in ROOT.glob('*.html')}
def check(ok,msg):
 if not ok:errors.append(msg)
refs=set();ids={n:[a['id'] for _,a in d.tags if 'id' in a] for n,d in pages.items()}
for name,d in pages.items():
 check(len(ids[name])==len(set(ids[name])),f'{name}: duplicate IDs')
 check(sum(t=='h1' for t,_ in d.tags)==1,f'{name}: one h1')
 check(any(t=='html' and a.get('lang')=='en' for t,a in d.tags),f'{name}: lang')
 check(any(t=='meta' and a.get('name')=='description' and a.get('content') for t,a in d.tags),f'{name}: description')
 canonical=[a.get('href') for t,a in d.tags if t=='link' and a.get('rel')=='canonical']
 if name=='404.html':check(any(a.get('name')=='robots' and 'noindex' in a.get('content','') for _,a in d.tags),'404: noindex')
 else:
  check(canonical==['https://an-thai.com/'+('' if name=='index.html' else name)],f'{name}: canonical')
  types={g['@type'] for s in d.scripts for g in s.get('@graph',[])}
  check({'Organization','ProfessionalService'}<=types,f'{name}: business schema')
  if name in ['services.html','equipment.html']:check('Service' in types,f'{name}: service schema')
 labels={a.get('for') for t,a in d.tags if t=='label'}
 for t,a in d.tags:
  if t=='img':
   check(bool(a.get('alt')),f'{name}: missing alt');check(a.get('width') and a.get('height'),f'{name}: image dimensions')
  if t in ['input','textarea','select']:check(a.get('id') in labels,f'{name}: input label {a.get("name")}')
  if t=='button' and 'menu-btn' in a.get('class',''):check(a.get('aria-expanded')=='false' and a.get('aria-controls') in ids[name],f'{name}: menu ARIA')
  urls=[a[k] for k in ['href','src'] if k in a]
  if 'srcset' in a:urls += [x.strip().split()[0] for x in a['srcset'].split(',')]
  for url in urls:
   u=urlsplit(url)
   if u.scheme or u.netloc:continue
   path=unquote(u.path).lstrip('/') or (name if u.fragment else 'index.html')
   check((ROOT/path).is_file(),f'{name}: missing {path}');refs.add(path)
   if u.fragment and path in pages:check(u.fragment in ids[path],f'{name}: broken #{u.fragment} in {path}')
for name in pages:
 s=(ROOT/name).read_text()
 check(not re.search(r'Founded in 2005|Login|Register|Unsplash|AI Chat|placeholder@|example\.com',s,re.I),f'{name}: forbidden legacy content')
manifest=json.loads((ROOT/'ASSET_MANIFEST.json').read_text())
import hashlib
for a in manifest['assets']:
 p=ROOT/a['path'];check(p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'],f'asset hash {a["path"]}')
locs=[x.text for x in ET.parse(ROOT/'sitemap.xml').iter() if x.tag.endswith('}loc')]
check(set(locs)=={'https://an-thai.com/'+('' if p=='index.html' else p) for p in pages if p!='404.html'},'sitemap routes')
check('Sitemap: https://an-thai.com/sitemap.xml' in (ROOT/'robots.txt').read_text(),'robots sitemap')
check(not list((ROOT/'assets').rglob('*.b64')),'legacy image chunks')
check('loadBrochureSprite' not in (ROOT/'assets/js/site.js').read_text(),'legacy sprite JS')
result={'status':'PASS' if not errors else 'FAIL','pages':len(pages),'referenced_local_files':len(refs),'image_files':len(manifest['assets']),'image_bytes_total':sum(a['bytes'] for a in manifest['assets']),'errors':errors,'limitations':['Static validation does not certify browser layout, mobile devices, hosting status codes or legal/business credentials.']}
print(json.dumps(result,indent=2));sys.exit(bool(errors))
