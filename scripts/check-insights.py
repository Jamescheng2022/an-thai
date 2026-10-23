"""Exercise publication, visual contract and failure paths in isolation; never publish the draft."""
import copy
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
    assert all(x in html for x in [
        'BreadcrumbList', 'FAQPage', 'Article', 'og:image', 'twitter:image',
        'loading="lazy"', 'Related articles', '/contact.html',
        'insight-body-figure', 'figure-caption', 'figure-declaration'
    ])
    assert 'rel="alternate"' not in html
    assert 'sample-template.html' in (fixture/'dist/llms.txt').read_text(encoding='utf-8')

    # Verify localized card CTAs across indexes
    assert 'Read article' in (fixture/'dist/insights.html').read_text(encoding='utf-8')
    assert 'อ่านบทความ' in (fixture/'dist/th/insights.html').read_text(encoding='utf-8')
    assert '阅读文章' in (fixture/'dist/zh/insights.html').read_text(encoding='utf-8')

    # Basic invalid field tests
    for field, value in [('description', 'x'*161), ('image', 'assets/missing.webp')]:
        invalid = dict(sample, **{field:value})
        source.write_text(json.dumps(invalid), encoding='utf-8')
        try: module.load_articles(content)
        except AssertionError: pass
        else: raise AssertionError('Accepted invalid '+field)

    # Visual contract: body figure repeating cover image
    invalid_repeat_cover = copy.deepcopy(sample)
    invalid_repeat_cover['sections'][0]['figures'][0]['image'] = sample['image']
    source.write_text(json.dumps(invalid_repeat_cover), encoding='utf-8')
    try: module.load_articles(content)
    except AssertionError: pass
    else: raise AssertionError('Accepted body figure repeating cover image')

    # Visual contract: duplicate body figures
    invalid_duplicate_fig = copy.deepcopy(sample)
    invalid_duplicate_fig['sections'][1]['figures'][0]['image'] = invalid_duplicate_fig['sections'][0]['figures'][0]['image']
    source.write_text(json.dumps(invalid_duplicate_fig), encoding='utf-8')
    try: module.load_articles(content)
    except AssertionError: pass
    else: raise AssertionError('Accepted duplicate body figures')

    # Visual contract: missing body figure image
    invalid_missing_fig = copy.deepcopy(sample)
    invalid_missing_fig['sections'][0]['figures'][0]['image'] = 'assets/images/missing-photo.webp'
    source.write_text(json.dumps(invalid_missing_fig), encoding='utf-8')
    try: module.load_articles(content)
    except AssertionError: pass
    else: raise AssertionError('Accepted missing body figure image')

    # Visual contract: fewer than minimum required body figures (< 2 for <= 600 words)
    invalid_too_few_figs = copy.deepcopy(sample)
    invalid_too_few_figs['sections'][1]['figures'] = []
    source.write_text(json.dumps(invalid_too_few_figs), encoding='utf-8')
    try: module.load_articles(content)
    except AssertionError: pass
    else: raise AssertionError('Accepted article with fewer than 2 body figures for <= 600 words')

    # Visual contract: word count > 600 requires >= 3 body figures
    invalid_wordcount_threshold = copy.deepcopy(sample)
    invalid_wordcount_threshold['sections'][0]['paragraphs'].extend(['engineering technical analysis words ' * 50] * 3)
    source.write_text(json.dumps(invalid_wordcount_threshold), encoding='utf-8')
    try: module.load_articles(content)
    except AssertionError: pass
    else: raise AssertionError('Accepted >600 words with only 2 body figures')

    # Test FAQ omitted -> no FAQPage in JSON-LD
    sample['faq'] = []
    assert 'FAQPage' not in module.render(sample, [sample], (fixture/'dist/insights.html').read_text(encoding='utf-8'))

assert not (root/'dist/insights/sample-template.html').exists()
assert 'sample-template' not in (root/'dist/sitemap.xml').read_text(encoding='utf-8')
print('PASS: isolated sample render, inline figures, visual contract gates, localized index CTAs, FAQ/no FAQ, index, llms, sitemap and draft exclusion')
