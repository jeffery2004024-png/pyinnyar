"""Build the source-backed undergraduate scholarship explorer; reject unsafe claims."""
import json
from pathlib import Path
from datetime import date
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CHECKED = '2026-10-08'
TODAY = date.fromisoformat(CHECKED)
LANGS = ['zh', 'en', 'my']
PLACES = {('CN', 'mainland'), ('CN', 'hongkong-macao'), ('CN', 'taiwan'), ('TH', None), ('MY', None), ('SG', None)}

def translated(value, context):
    assert isinstance(value, dict) and all(isinstance(value.get(l), str) and value[l].strip() for l in LANGS), context

def sources(value, context):
    assert value, context
    for source in value:
        u = urlparse(source['url'])
        assert u.scheme == 'https' and u.netloc and source['title'], context
        assert date.fromisoformat(source['checkedAt']) <= TODAY, context

directory = json.loads((ROOT / 'dist/data/universities.json').read_text())['schools']
institutions = {s['id']: {'id': s['id'], 'country': s['country'], 'region': 'mainland' if s['country'] == 'CN' else None,
    'zh': s['zh'], 'en': s['en'], 'website': s.get('website'), 'admissionsUrl': s.get('admissionsUrl')} for s in directory if not s.get('military')}
guides = json.loads((ROOT / 'dist/data/destinations.json').read_text())['countries']
featured = set()
for country in guides:
    for guide in country.get('regions', [country]):
        for s in guide['universities']:
            featured.add(s['id'])
            if s['id'] not in institutions:
                institutions[s['id']] = {'id': s['id'], 'country': country['country'], 'region': guide['id'],
                    'zh': s['nameZh'], 'en': s['nameEn'], 'website': s['website'], 'admissionsUrl': s['admissionsUrl']}

awards, evidence = [], []
for filename in ['scholarships-china.json', 'scholarships-taiwan.json', 'scholarships-southeast-asia.json']:
    data = json.loads((ROOT / 'research' / filename).read_text())
    assert data['checkedAt'] == CHECKED, filename
    awards.extend(data['scholarships'])
    evidence.extend(data['schoolEvidence'])
assert len({a['id'] for a in awards}) == len(awards), 'Duplicate scholarship IDs'
assert len({e['schoolId'] for e in evidence}) == len(evidence), 'Duplicate evidence'
assert featured <= {e['schoolId'] for e in evidence}, 'Missing featured university review'
assert { (a['country'], a.get('region')) for a in awards } == PLACES, 'Missing destination coverage'
for a in awards:
    assert (a['country'], a.get('region')) in PLACES, a['id']
    assert a['levels'] == ['bachelor'], a['id']
    assert a['nationalityStatus'] in ['myanmar-explicit', 'international-eligible', 'verify', 'excluded'], a['id']
    assert a['status'] in ['open', 'closed', 'verify', 'ongoing'], a['id']
    assert a['cycle'] in ['2026', '2027', 'ongoing'], a['id']
    for key in ['name', 'provider', 'eligibility', 'coverage', 'application', 'obligations', 'timing']:
        translated(a[key], a['id'] + ':' + key)
    for school_id in a['institutionIds']:
        s = institutions[school_id]
        assert (s['country'], s['region']) == (a['country'], a.get('region')), a['id']
    sources(a['sources'], a['id'])
    if a.get('deadline'):
        deadline = date.fromisoformat(a['deadline'])
        assert deadline >= TODAY or a['status'] == 'closed', a['id'] + ': expired cycle must be closed'
    if a['status'] == 'open':
        assert a.get('deadline') and date.fromisoformat(a['deadline']) >= TODAY and a['nationalityStatus'] in ['myanmar-explicit', 'international-eligible'], a['id']
    if a['status'] == 'ongoing':
        assert not a.get('deadline'), a['id'] + ': standing scheme is not a verified window'
for e in evidence:
    assert e['schoolId'] in institutions and e['status'] in ['verified', 'verify', 'excluded'], e['schoolId']
    translated(e['note'], e['schoolId'])
    sources(e['sources'], e['schoolId'])
output = {'schemaVersion': 1, 'checkedAt': CHECKED, 'audience': 'Myanmar citizens', 'level': 'bachelor',
    'institutions': list(institutions.values()), 'scholarships': awards, 'schoolEvidence': evidence}
(ROOT / 'dist/data/scholarships.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
print(f'Scholarships: {len(awards)}; researched school reviews: {len(evidence)}; university query entries: {len(institutions)}; destinations: {len(PLACES)}')
