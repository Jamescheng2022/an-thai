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

    # Published PIT article: validate real mobile assets, HTTPS sources and business CTA.
    pit_path = root/'content/insights/pile-integrity-test-report-review-checklist.json'
    pit = json.loads(pit_path.read_text(encoding='utf-8'))
    pit_source = content/(pit['slug']+'.json')
    pit_source.write_text(json.dumps(pit), encoding='utf-8')
    accepted = {article['slug']: article for article in module.load_articles(content)}
    pit_html = module.render(accepted[pit['slug']], list(accepted.values()),
                             (fixture/'dist/insights.html').read_text(encoding='utf-8'))
    assert '<picture>' in pit_html and 'pit-report-review-scope-mobile.svg' in pit_html
    assert 'https://store.astm.org/d5882-16.html' in pit_html
    assert 'href="/contact.html?type=engineering#enquiry-form"' in pit_html
    assert 'Discuss a pile-test report review' in pit_html
    for invalid_url in ['http://example.com/standard', 'javascript:alert(1)', 'https://example.com/has space']:
        bad = copy.deepcopy(pit)
        bad['sections'][-1]['links'][0]['url'] = invalid_url
        pit_source.write_text(json.dumps(bad), encoding='utf-8')
        try: module.load_articles(content)
        except AssertionError: pass
        else: raise AssertionError('Accepted unsafe source URL ' + invalid_url)
    assert '<source media="(max-width: 600px)" srcset="/assets/images/insights/pit-report-review-scope-mobile.svg" width="400" height="596">' in pit_html
    for s in pit['sections']:
        for fig in s.get('figures', []):
            if fig.get('mobile_image'):
                expected_source = (
                    f'<source media="(max-width: 600px)" srcset="/{fig["mobile_image"]}" '
                    f'width="{fig["mobile_width"]}" height="{fig["mobile_height"]}">'
                )
                assert expected_source in pit_html, f'Missing expected source element for {fig["mobile_image"]}'
    bad_mobile = copy.deepcopy(pit)
    bad_mobile['sections'][0]['figures'][0]['mobile_image'] = 'assets/images/insights/not-found.svg'
    pit_source.write_text(json.dumps(bad_mobile), encoding='utf-8')
    try: module.load_articles(content)
    except AssertionError: pass
    else: raise AssertionError('Accepted missing mobile image')
    for bad_dim in [0, -1, '400', 400.5, None]:
        bad_dim_fig = copy.deepcopy(pit)
        fig = bad_dim_fig['sections'][0]['figures'][0]
        if bad_dim is None:
            del fig['mobile_width']
        else:
            fig['mobile_width'] = bad_dim
        pit_source.write_text(json.dumps(bad_dim_fig), encoding='utf-8')
        try: module.load_articles(content)
        except AssertionError: pass
        else: raise AssertionError(f'Accepted invalid mobile_width: {bad_dim}')
    bad_no_height = copy.deepcopy(pit)
    del bad_no_height['sections'][0]['figures'][0]['mobile_height']
    pit_source.write_text(json.dumps(bad_no_height), encoding='utf-8')
    try: module.load_articles(content)
    except AssertionError: pass
    else: raise AssertionError('Accepted missing mobile_height')
    pit_source.write_text(json.dumps(pit), encoding='utf-8')

    # Basic invalid field tests
    for field, value in [('description', 'x'*161), ('image', 'assets/missing.webp')]:
        invalid = dict(sample, **{field:value})
        source.write_text(json.dumps(invalid), encoding='utf-8')
        try: module.load_articles(content)
        except AssertionError: pass
        else: raise AssertionError('Accepted invalid '+field)

    # Image path normalization unit checks across all alias styles
    expected_norm = 'assets/images/static-load.webp'
    for alias in [
        'assets/images/static-load.webp',
        '/assets/images/static-load.webp',
        './assets/images/static-load.webp',
        'assets/images/../images/static-load.webp',
        'assets/./images/static-load.webp',
        'assets%2Fimages%2Fstatic-load.webp',
        'assets/images/static%2Dload.webp',
        'ASSETS/IMAGES/STATIC-LOAD.WEBP',
        '/ASSETS/images/../images/STATIC-LOAD.webp',
        './assets%2Fimages/STATIC-LOAD.WEBP',
        'assets///images//static-load.webp',
    ]:
        assert module.normalize_image_path(alias) == expected_norm, f'Normalization failed for {alias}'

    # Visual contract: body figure repeating cover image (direct and via aliases)
    for cover_alias in [
        sample['image'],
        '/' + sample['image'],
        './' + sample['image'],
        sample['image'].upper(),
        'assets/images/../images/' + Path(sample['image']).name,
        sample['image'].replace('/', '%2F'),
    ]:
        invalid_repeat_cover = copy.deepcopy(sample)
        invalid_repeat_cover['sections'][0]['figures'][0]['image'] = cover_alias
        source.write_text(json.dumps(invalid_repeat_cover), encoding='utf-8')
        try: module.load_articles(content)
        except AssertionError as err:
            assert 'body figure repeats cover image' in str(err), f'Unexpected error: {err}'
        else: raise AssertionError(f'Accepted body figure repeating cover via alias: {cover_alias}')

    # Visual contract: duplicate body figures (direct and via aliases)
    base_fig = sample['sections'][0]['figures'][0]['image']
    for fig_alias in [
        base_fig,
        '/' + base_fig,
        './' + base_fig,
        'assets/images/../images/' + Path(base_fig).name,
        base_fig.upper(),
        base_fig.replace('/', '%2F'),
        './' + base_fig.upper(),
        '/' + base_fig.replace('/', '%2F'),
    ]:
        invalid_duplicate_fig = copy.deepcopy(sample)
        invalid_duplicate_fig['sections'][1]['figures'][0]['image'] = fig_alias
        source.write_text(json.dumps(invalid_duplicate_fig), encoding='utf-8')
        try: module.load_articles(content)
        except AssertionError as err:
            assert 'duplicate body figure images' in str(err) or 'body figure repeats cover image' in str(err), f'Unexpected error: {err}'
        else: raise AssertionError(f'Accepted duplicate body figure via alias: {fig_alias}')

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
