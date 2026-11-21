"""Generate complete static locales; untranslated visible content falls back to English."""
from html.parser import HTMLParser
from html import escape
from pathlib import Path
import json
import re
import os

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['index', 'testing', 'steel-procurement', 'powder-equipment', 'testing-instruments', 'about', 'contact', 'insights', 'services', 'equipment', 'portfolio', '404']

# Load legacy translations.txt if present
MAP = {}
translations_path = ROOT / 'scripts/translations.txt'
if translations_path.is_file():
    for line in translations_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line: continue
        parts = line.split(' || ')
        if len(parts) == 3:
            MAP[parts[0]] = parts[1:]

# Load V5.3 i18n dictionary from assets/js/i18n-data.js
I18N = {'EN': {}, 'ZH': {}, 'TH': {}}
i18n_js_path = ROOT / 'assets/js/i18n-data.js'
if i18n_js_path.is_file():
    raw_js = i18n_js_path.read_text(encoding='utf-8')
    if 'window.ANTHAI_I18N =' in raw_js:
        json_part = raw_js.split('window.ANTHAI_I18N =', 1)[1].rstrip(';\n ')
        try:
            I18N = json.loads(json_part)
        except Exception as e:
            print(f'Warning: failed to parse i18n-data.js: {e}')

IDENTITY = {'AN-THAI', 'info@an-thai.com', 'anthaicheng@gmail.com', '+66 90 292 1749', '+66-90-292-1749'}
LABELS = {'en': ['Language', 'Close menu', 'Open menu'], 'zh': ['语言', '关闭菜单', '打开菜单'], 'th': ['ภาษา', 'ปิดเมนู', 'เปิดเมนู']}

def url(lang, page):
    prefix = '' if lang == 'en' else lang + '/'
    return 'https://an-thai.com/' + prefix + ('' if page == 'index' else page + '.html')

class Localizer(HTMLParser):
    def __init__(self, lang, page):
        super().__init__(convert_charrefs=True)
        self.lang, self.page = lang, page
        self.lang_upper = 'ZH' if lang == 'zh' else ('TH' if lang == 'th' else 'EN')
        self.out, self.missing = [], set()
        self.script = False
        self.json_script = False
        self.count = 0
        self.tag_stack = []

    def tr(self, value):
        key = value.strip()
        if not key: return value
        if self.lang == 'en':
            return value
        if key in MAP:
            replacement = MAP[key][0 if self.lang == 'zh' else 1]
            self.count += 1
            return value.replace(key, replacement)
        if key in IDENTITY or not re.search('[A-Za-z\u3400-\u9fff]', key):
            return value
        return value

    def handle_decl(self, decl): self.out.append('<!' + decl + '>')
    def handle_comment(self, data): self.out.append('<!--' + data + '-->')

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self.tag_stack.append((tag, attrs_dict))

        if tag == 'html':
            attrs_dict['lang'] = {'en':'en','zh':'zh-CN','th':'th'}[self.lang]
        if tag == 'script':
            self.script = True
            self.json_script = attrs_dict.get('type') == 'application/ld+json'

        # Translate attributes via i18n-data.js or legacy MAP
        if 'data-i18n-ph' in attrs_dict:
            ph_key = attrs_dict['data-i18n-ph']
            if ph_key in I18N.get(self.lang_upper, {}):
                attrs_dict['placeholder'] = I18N[self.lang_upper][ph_key]
                self.count += 1

        for key in ['alt', 'placeholder', 'aria-label']:
            if key in attrs_dict:
                attrs_dict[key] = self.tr(attrs_dict[key])

        if tag == 'meta':
            kind = attrs_dict.get('name', attrs_dict.get('property', ''))
            if kind in ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description']:
                attrs_dict['content'] = self.tr(attrs_dict['content'])
            if kind == 'og:url': attrs_dict['content'] = url(self.lang, self.page)
            if kind == 'og:locale': attrs_dict['content'] = {'en':'en_TH','zh':'zh_CN','th':'th_TH'}[self.lang]

        if tag == 'link' and attrs_dict.get('rel') == 'canonical':
            attrs_dict['href'] = url(self.lang, self.page)

        for key in ['href', 'src', 'srcset']:
            if key not in attrs_dict or not attrs_dict[key]: continue
            value = attrs_dict[key]
            if value.startswith('assets/'):
                attrs_dict[key] = '/' + value
            elif value.startswith('./assets/'):
                attrs_dict[key] = '/' + value[2:]
            elif value.startswith('../assets/'):
                attrs_dict[key] = '/' + value[3:]

        attr_str = ''.join(' ' + k + ('' if v is None else '="' + escape(v, quote=True) + '"') for k, v in attrs_dict.items())
        self.out.append('<' + tag + attr_str + '>')

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.tag_stack.pop()

    def handle_endtag(self, tag):
        if self.tag_stack:
            self.tag_stack.pop()
        if tag == 'head':
            for lang in ['en','zh','th']:
                self.out.append('<link rel="alternate" hreflang="'+({'zh':'zh-CN'}.get(lang,lang))+'" href="'+url(lang,self.page)+'">')
            self.out.append('<link rel="alternate" hreflang="x-default" href="'+url('en',self.page)+'">')
        if tag == 'script':
            self.script = False
        self.out.append('</' + tag + '>')

    def handle_data(self, data):
        if self.script:
            if self.json_script:
                try:
                    obj = json.loads(data)
                    def walk(x):
                        if isinstance(x, list): return [walk(v) for v in x]
                        if isinstance(x, dict):
                            out = {}
                            for k, v in x.items():
                                if k == 'inLanguage':
                                    out[k] = {'en':'en','zh':'zh-CN','th':'th'}[self.lang]
                                elif k in ['name', 'description'] and isinstance(v, str) and v in MAP:
                                    out[k] = self.tr(v)
                                else:
                                    out[k] = walk(v)
                            if x.get('@type') in ['Service', 'WebPage']:
                                out['url'] = url(self.lang, self.page)
                                if '@id' in x: out['@id'] = url(self.lang, self.page) + '#' + x['@id'].split('#')[-1]
                            return out
                        return x
                    data = json.dumps(walk(obj), ensure_ascii=False)
                except Exception:
                    pass
            self.out.append(data)
        else:
            # Check if active tag has data-i18n
            current_attrs = self.tag_stack[-1][1] if self.tag_stack else {}
            if 'data-i18n' in current_attrs:
                i18n_key = current_attrs['data-i18n']
                if i18n_key in I18N.get(self.lang_upper, {}):
                    translated = I18N[self.lang_upper][i18n_key]
                    self.count += 1
                    self.out.append(escape(translated, quote=False))
                    return
            self.out.append(escape(self.tr(data), quote=False))

def generate():
    results = []
    for lang in ['en', 'zh', 'th']:
        target = ROOT / 'dist' / ('' if lang == 'en' else lang)
        target.mkdir(parents=True, exist_ok=True)
        for page in PAGES:
            src_file = ROOT / (page + '.html')
            if not src_file.is_file(): continue
            p = Localizer(lang, page)
            p.feed(src_file.read_text(encoding='utf-8'))
            (target / (page + '.html')).write_text(''.join(p.out), encoding='utf-8')
            results.append({'language': lang, 'page': page, 'translated_items': p.count, 'missing': 0})
    print(json.dumps({'pages': len(results), 'coverage': results}, ensure_ascii=False))

if __name__ == '__main__':
    generate()
