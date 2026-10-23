"""Exercise publication and failure paths in isolation; never publish the draft."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('insights', root/'scripts/build-insights.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with tempfile.TemporaryDirectory(prefix='.insights-check-', dir=root) as temporary:
    fixture = Path(temporary)
    for directory in ['dist', 'templates', 'assets']:
        shutil.copytree(root/directory, fixture/directory)
    content = fixture/'content/insights'
    content.mkdir(parents=True)
    sample = json.loads((root/'drafts/insights/sample-template.json').read_text(encoding='utf-8'))
    source = content/'sample-template.json'
    source.write_text(json.dumps(sample), encoding='utf-8')
    module.ROOT = fixture
    module.generate()
    html = (fixture/'dist/insights/sample-template.html').read_text(encoding='utf-8')
    assert all(x in html for x in ['BreadcrumbList', 'FAQPage', 'Article', 'og:image', 'twitter:image', 'loading="lazy"', 'Related articles', '/contact.html'])
    assert 'rel="alternate"' not in html
    assert 'sample-template.html' in (fixture/'dist/llms.txt').read_text(encoding='utf-8')
    for locale in ['', 'th/', 'zh/']:
        assert 'sample-template.html' in (fixture/('dist/'+locale+'insights.html')).read_text(encoding='utf-8')
    for field, value in [('description', 'x'*161), ('image', 'assets/missing.webp')]:
        invalid = dict(sample, **{field:value})
        source.write_text(json.dumps(invalid), encoding='utf-8')
        try: module.load_articles(content)
        except AssertionError: pass
        else: raise AssertionError('Accepted invalid '+field)
    sample['faq'] = []
    assert 'FAQPage' not in module.render(sample, [sample], (fixture/'dist/insights.html').read_text(encoding='utf-8'))
assert not (root/'dist/insights/sample-template.html').exists()
assert 'sample-template' not in (root/'dist/sitemap.xml').read_text(encoding='utf-8')
print('PASS: isolated sample render, FAQ/no FAQ, index, llms, sitemap, invalid image/description and draft exclusion')
