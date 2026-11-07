"""Reject cover/body re-crops and duplicate subjects, independent of filenames."""
import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent.parent
sample = json.loads((root/'content/insights/pile-integrity-test-report-review-checklist.json').read_text())
with tempfile.TemporaryDirectory() as tmp:
    fixture = Path(tmp)
    (fixture/'scripts').mkdir()
    (fixture/'content/insights').mkdir(parents=True)
    checker = fixture/'scripts/check-editorial-photo.py'
    shutil.copyfile(root/'scripts/check-editorial-photo.py', checker)
    source = fixture/'content/insights/sample.json'
    def check(article, valid):
        source.write_text(json.dumps(article), encoding='utf-8')
        result = subprocess.run([sys.executable, str(checker)], capture_output=True, text=True)
        assert (result.returncode == 0) == valid, result.stdout + result.stderr
        if not valid:
            assert 'source visual' in result.stderr or 'source_visual_ids' in result.stderr, result.stderr
    check(sample, True)
    repeated_cover = copy.deepcopy(sample)
    repeated_cover['sections'][2]['figures'][0]['source_visual_ids'] = sample['source_visual_ids'][:1]
    check(repeated_cover, False)
    repeated_body = copy.deepcopy(sample)
    repeated_body['sections'][2]['figures'][0]['source_visual_ids'] = sample['sections'][0]['figures'][0]['source_visual_ids']
    check(repeated_body, False)
    missing = copy.deepcopy(sample)
    del missing['source_visual_ids']
    check(missing, False)
    invalid_id = copy.deepcopy(sample)
    invalid_id['source_visual_ids'] = ['']
    check(invalid_id, False)
    singular_figure_repeat = copy.deepcopy(sample)
    singular_figure_repeat['sections'][2]['figure'] = copy.deepcopy(singular_figure_repeat['sections'][2]['figures'][0])
    singular_figure_repeat['sections'][2]['figure']['source_visual_ids'] = sample['source_visual_ids'][:1]
    check(singular_figure_repeat, False)
print('PASS: distinct subjects accepted; montage crop, repeated body (plural and singular figure), missing and blank source IDs rejected')
