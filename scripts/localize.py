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

IDENTITY = {'AT', 'AN-THAI', 'AN-THAI ENGINEERING', 'AN-THAI ENGINEERING COMPANY LIMITED', 'AN-THAI Engineering Company Limited', 'info@an-thai.com', 'anthaicheng@gmail.com', '+66 90 292 1749', '+66-90-292-1749', 'Bangkok, Thailand'}
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
        self.in_lang_switch = False

    def tr(self, value):
        key = value.strip()
        if not key: return value
        if self.lang == 'en':
            if ' · ' in key and re.search('[\u3400-\u9fff]', key):
                return key.split(' · ')[0]
            return value
        if key in MAP:
            replacement = MAP[key][0 if self.lang == 'zh' else 1]
            self.count += 1
            return value.replace(key, replacement)
        if key in IDENTITY or not re.search('[A-Za-z\u3400-\u9fff]', key) or key.startswith('/') or key.startswith('http'):
            return value
        self.missing.add(key)
        return value

    def handle_decl(self, decl):
        if not self.in_lang_switch:
            self.out.append('<!' + decl + '>')

    def handle_comment(self, data):
        if not self.in_lang_switch:
            self.out.append('<!--' + data + '-->')

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self.tag_stack.append((tag, attrs_dict))

        if tag in ['div', 'nav'] and 'lang-switch' in attrs_dict.get('class', ''):
            self.in_lang_switch = True
            links = []
            for l, l_upper, label, code in [('en', 'EN', 'EN', 'en'), ('zh', 'ZH', '中文', 'zh-CN'), ('th', 'TH', 'ไทย', 'th')]:
                l_url = f'/{l}/{self.page}.html' if l != 'en' else f'/{self.page}.html'
                if self.page == 'index':
                    l_url = f'/{l}/index.html' if l != 'en' else '/index.html'
                is_cur = (l == self.lang)
                curr_attr = ' aria-current="true" aria-pressed="true"' if is_cur else ' aria-pressed="false"'
                links.append(f'<a href="{l_url}" class="lang-btn" data-language="{l}" data-lang="{l_upper}" lang="{code}" hreflang="{code}"{curr_attr}>{label}</a>')
            self.out.append(f'<nav class="lang-switch" aria-label="{LABELS[self.lang][0]}">{"".join(links)}</nav>')
            return

        if self.in_lang_switch:
            return

        if tag == 'div' and attrs_dict.get('class') == 'nav-actions':
            self.out.append('<div class="nav-actions">')
            links = []
            for l, l_upper, label, code in [('en', 'EN', 'EN', 'en'), ('zh', 'ZH', '中文', 'zh-CN'), ('th', 'TH', 'ไทย', 'th')]:
                l_url = f'/{l}/{self.page}.html' if l != 'en' else f'/{self.page}.html'
                if self.page == 'index':
                    l_url = f'/{l}/index.html' if l != 'en' else '/index.html'
                is_cur = (l == self.lang)
                curr_attr = ' aria-current="true" aria-pressed="true"' if is_cur else ' aria-pressed="false"'
                links.append(f'<a href="{l_url}" class="lang-btn" data-language="{l}" data-lang="{l_upper}" lang="{code}" hreflang="{code}"{curr_attr}>{label}</a>')
            self.out.append(f'<nav class="language-switch" aria-label="{LABELS[self.lang][0]}">{"".join(links)}</nav>')
            return

        if tag == 'html':
            attrs_dict['lang'] = {'en':'en','zh':'zh-CN','th':'th'}[self.lang]
        if tag == 'script':
            self.script = True
            self.json_script = attrs_dict.get('type') == 'application/ld+json'

        # Translate attributes via i18n-data.js or legacy MAP
        aria_translated = False
        if 'data-i18n-aria' in attrs_dict:
            aria_key = attrs_dict['data-i18n-aria']
            if aria_key in I18N.get(self.lang_upper, {}):
                attrs_dict['aria-label'] = I18N[self.lang_upper][aria_key]
                aria_translated = True
                self.count += 1
            elif self.lang != 'en':
                self.missing.add(f"data-i18n-aria:{aria_key}")

        if 'data-i18n-ph' in attrs_dict:
            ph_key = attrs_dict['data-i18n-ph']
            if ph_key in I18N.get(self.lang_upper, {}):
                attrs_dict['placeholder'] = I18N[self.lang_upper][ph_key]
                self.count += 1
            elif self.lang != 'en':
                self.missing.add(f"data-i18n-ph:{ph_key}")

        for key in ['alt', 'placeholder', 'aria-label']:
            if key in attrs_dict:
                if key == 'aria-label' and aria_translated:
                    continue
                attrs_dict[key] = self.tr(attrs_dict[key])

        if tag == 'meta':
            kind = attrs_dict.get('name', attrs_dict.get('property', ''))
            if kind in ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description']:
                attrs_dict['content'] = self.tr(attrs_dict['content'])
            if kind == 'og:url': attrs_dict['content'] = url(self.lang, self.page)
            if kind == 'og:locale': attrs_dict['content'] = {'en':'en_TH','zh':'zh_CN','th':'th_TH'}[self.lang]

        if tag == 'link' and attrs_dict.get('rel') == 'canonical':
            attrs_dict['href'] = url(self.lang, self.page)

        if 'srcset' in attrs_dict and attrs_dict['srcset']:
            candidates = []
            for item in attrs_dict['srcset'].split(','):
                item = item.strip()
                if not item: continue
                tokens = item.split()
                url_candidate = tokens[0]
                desc = ' ' + ' '.join(tokens[1:]) if len(tokens) > 1 else ''
                if url_candidate.startswith('assets/'):
                    url_candidate = '/' + url_candidate
                elif url_candidate.startswith('./assets/'):
                    url_candidate = '/' + url_candidate[2:]
                elif url_candidate.startswith('../assets/'):
                    url_candidate = '/' + url_candidate[3:]
                candidates.append(url_candidate + desc)
            attrs_dict['srcset'] = ', '.join(candidates)

        for key in ['href', 'src']:
            if key not in attrs_dict or not attrs_dict[key]: continue
            value = attrs_dict[key]
            if value.startswith('assets/'):
                attrs_dict[key] = '/' + value
            elif value.startswith('./assets/'):
                attrs_dict[key] = '/' + value[2:]
            elif value.startswith('../assets/'):
                attrs_dict[key] = '/' + value[3:]
            elif key == 'href':
                clean_href = value.lstrip('./').lstrip('/')
                base_page = clean_href.split('#')[0].split('?')[0]
                hash_part = ('#' + clean_href.split('#')[1]) if '#' in clean_href else ''
                query_part = ('?' + clean_href.split('?')[1].split('#')[0]) if '?' in clean_href else ''
                p_prefix = '/' if self.lang == 'en' else f'/{self.lang}/'
                if base_page in ['insights/index.html', 'insights', 'insights/']:
                    attrs_dict[key] = f'{p_prefix}insights/index.html{query_part}{hash_part}'
                elif base_page == 'insights.html':
                    attrs_dict[key] = f'{p_prefix}insights.html{query_part}{hash_part}'
                elif base_page in ['cases/index.html', 'cases', 'cases/']:
                    attrs_dict[key] = f'{p_prefix}cases/index.html{query_part}{hash_part}'
                elif base_page.endswith('.html'):
                    p_name = base_page[:-5]
                    if p_name in PAGES:
                        attrs_dict[key] = f'{p_prefix}{p_name}.html{query_part}{hash_part}'

        svg_case_map = {
            'viewbox': 'viewBox',
            'preserveaspectratio': 'preserveAspectRatio',
            'gradientunits': 'gradientUnits',
            'gradienttransform': 'gradientTransform',
        }
        attrs_out = []
        for k, v in attrs_dict.items():
            out_k = svg_case_map.get(k, k)
            attrs_out.append(' ' + out_k + ('' if v is None else '="' + escape(v, quote=True) + '"'))
        self.out.append('<' + tag + ''.join(attrs_out) + '>')

    def handle_startendtag(self, tag, attrs):
        html_void_tags = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
        self.handle_starttag(tag, attrs)
        self.tag_stack.pop()
        if tag not in html_void_tags:
            self.out.append('</' + tag + '>')

    def handle_endtag(self, tag):
        if self.tag_stack:
            self.tag_stack.pop()

        if self.in_lang_switch:
            if tag in ['div', 'nav']:
                self.in_lang_switch = False
            return

        if tag == 'head':
            for lang in ['en','zh','th']:
                self.out.append('<link rel="alternate" hreflang="'+({'zh':'zh-CN'}.get(lang,lang))+'" href="'+url(lang,self.page)+'">')
            self.out.append('<link rel="alternate" hreflang="x-default" href="'+url('en',self.page)+'">')
        if tag == 'script':
            self.script = False
        self.out.append('</' + tag + '>')

    def handle_data(self, data):
        if self.in_lang_switch:
            return
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
                elif self.lang != 'en':
                    self.missing.add(f"data-i18n:{i18n_key}")
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
            results.append({
                'language': lang,
                'page': page,
                'translated_items': p.count,
                'missing': len(p.missing),
                'missing_items': sorted(list(p.missing))[:5]
            })
    print(json.dumps({'pages': len(results), 'coverage': results}, ensure_ascii=False))

if __name__ == '__main__':
    generate()
