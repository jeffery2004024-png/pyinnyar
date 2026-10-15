"""Assemble source-backed trilingual destination guides; no inferred eligibility."""
import json
from copy import deepcopy
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
COUNTRIES = ['CN', 'TH', 'MY', 'SG']
LANGUAGES = ['zh', 'en', 'my']
schools = {s['id']: s for s in json.loads((ROOT / 'dist/data/universities.json').read_text())['schools']}


def trilingual(value, context):
    assert isinstance(value, dict), context
    for language in LANGUAGES:
        assert isinstance(value.get(language), str) and value[language].strip(), (context, language)


def sources(items, context):
    assert items, context
    for source in items:
        assert source.get('title') and source.get('checkedAt'), context
        assert urlparse(source['url']).scheme == 'https' and urlparse(source['url']).netloc, context


def validate_guide(guide, country, linked):
    assert guide['sections'] and guide['universities']
    section_ids = set()
    for section in guide['sections']:
        assert section['id'] not in section_ids
        section_ids.add(section['id'])
        for field in ['title', 'body']:
            trilingual(section[field], f'{country} {section["id"]} {field}')
        sources(section['sources'], f'{country} {section["id"]}')
    university_ids = set()
    for university in guide['universities']:
        assert university['id'] not in university_ids
        university_ids.add(university['id'])
        if linked:
            assert university['id'] in schools and schools[university['id']]['country'] == country, university['id']
        else:
            assert university['id'] not in schools, university['id']
            for key in ['website', 'admissionsUrl']:
                assert urlparse(university[key]).scheme == 'https' and urlparse(university[key]).netloc, university['id']
        assert university.get('nameZh') and university.get('nameEn')
        for field in ['location', 'type', 'description']:
            trilingual(university[field], f'{university["id"]} {field}')
        sources(university['sources'], university['id'])


countries = []
for filename in ['destination-china.json', 'destination-thailand-malaysia.json', 'destination-singapore.json']:
    data = json.loads((ROOT / 'research' / filename).read_text())
    countries.extend(data.get('countries', [data]))
assert len(countries) == 4 and {c['country'] for c in countries} == set(COUNTRIES)
china = next(c for c in countries if c['country'] == 'CN')
mainland = deepcopy(china)
mainland.update(id='mainland', title={'zh':'大陆', 'en':'Mainland China', 'my':'တရုတ်ပြည်မ'},
                tag={'zh':'地区介绍与大陆高校', 'en':'Regional guide & mainland universities', 'my':'ဒေသနှင့် ပြည်မတက္ကသိုလ်များ'})
mainland['overview']['zh'] = mainland['overview']['zh'].replace('中国提供', '大陆提供')
mainland['overview']['en'] = mainland['overview']['en'].replace('China offers', 'Mainland China offers')
mainland['overview']['my'] = mainland['overview']['my'].replace('တရုတ်နိုင်ငံတွင်', 'တရုတ်ပြည်မတွင်')
mainland['overview'] = {
    'zh':'可从北京、杭州、厦门等城市的高校开始认识大陆的学习选择。中文和英文授课项目并存，申请准备重点是高中学历认可、目标专业的语言及CSCA要求，以及录取后的学习签证。',
    'en':'Explore mainland study options through universities in Beijing, Hangzhou and Xiamen. Chinese- and English-taught programmes are available. Check high school credential recognition, programme language and CSCA requirements, then prepare the study visa after admission.',
    'my':'Beijing၊ Hangzhou နှင့် Xiamen မြို့များရှိ တက္ကသိုလ်များမှ တရုတ်ပြည်မ၏ ပညာသင်ရွေးချယ်မှုကို လေ့လာနိုင်သည်။ တရုတ်နှင့် အင်္ဂလိပ်ဘာသာသင်တန်းများ ရှိသည်။ အထက်တန်းလက်မှတ်အသိအမှတ်ပြုမှု၊ ဘာသာစကားနှင့် CSCA လိုအပ်ချက်ကို စစ်ပြီး ဝင်ခွင့်ရလျှင် ပညာသင်ဗီဇာကို ပြင်ဆင်ရန် လိုသည်။'
}
china['regions'] = [mainland]
for filename in ['destination-hongkong-macao.json', 'destination-taiwan.json']:
    region = json.loads((ROOT / 'research' / filename).read_text())
    region['introductionOnly'] = True
    china['regions'].append(region)
china['overview'] = {
    'zh':'分三个部分了解大陆、港澳和台湾的学习选择。每个部分分别介绍地区留学路径和当地高校；请按拟就读地区、申请身份和具体课程核对规则。',
    'en':'Explore mainland China, Hong Kong and Macao, and Taiwan in three parts. Each introduces regional study pathways and local universities. Check rules for the destination, applicant status and chosen course.',
    'my':'တရုတ်ပြည်မ၊ ဟောင်ကောင်နှင့် မကာအို၊ ထိုင်ဝမ်ကို အပိုင်းသုံးပိုင်းဖြင့် လေ့လာနိုင်သည်။ ဒေသအလိုက် ပညာသင်လမ်းကြောင်းနှင့် တက္ကသိုလ်များကို မိတ်ဆက်ထားသည်။ သက်ဆိုင်ရာဒေသ၊ လျှောက်ထားသူအမျိုးအစားနှင့် သင်တန်း၏ စည်းကမ်းကို စစ်ဆေးရန် လိုသည်။'
}
china.pop('sections')
china.pop('universities')
all_guides = []
for country in countries:
    code = country['country']
    trilingual(country['overview'], f'{code} overview')
    if code == 'CN':
        assert [r['id'] for r in country['regions']] == ['mainland','hongkong-macao','taiwan']
        for region in country['regions']:
            for key in ['title', 'tag', 'overview']:
                trilingual(region[key], f'{region["id"]} {key}')
            validate_guide(region, code, region['id'] == 'mainland')
            all_guides.append(region)
    else:
        validate_guide(country, code, True)
        all_guides.append(country)
output = {'schemaVersion': 2, 'checkedAt': '2026-10-08', 'audience': 'Myanmar citizens',
          'countries': sorted(countries, key=lambda c: COUNTRIES.index(c['country']))}
(ROOT / 'dist/data/destinations.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
print(f'Destinations: {len(countries)}; China regions: {len(china["regions"])}; guide sections: {sum(len(c["sections"]) for c in all_guides)}; detailed introductions: {sum(len(c["universities"]) for c in all_guides)}')
