"""Normalise official-source research into conservative, programme-specific rules."""
import json
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
R=BASE/'research'
DATE='2026-10-08'
def read(name):return json.loads((R/(name+'.json')).read_text())
def triple(zh,en,my):return {'zh':zh,'en':en,'my':my}
REVIEW=triple('学历材料、专业先修科目及招生审核仍由学校确认。','Credentials, programme prerequisites and admissions assessment remain subject to university review.','လက်မှတ်များ၊ ဘာသာရပ်လိုအပ်ချက်နှင့် ဝင်ခွင့်စစ်ဆေးမှုကို ကျောင်းမှ အတည်ပြုရန် လိုပါတယ်။')
BASELINE=triple('这是通用或不完整要求，不能据此判定具体项目可申请。','These are general or incomplete conditions, insufficient to establish eligibility for a specific course.','ယေဘုယျ သို့မဟုတ် မပြည့်စုံသောလိုအပ်ချက်များဖြစ်၍ သင်တန်းတစ်ခုဝင်ခွင့်ကို မဆုံးဖြတ်နိုင်ပါ။')
MAP={'mathematics':'math','chineseHumanities':'chineseArts','chineseStem':'chineseScience','Mathematics':'math','Physics':'physics','Chemistry':'chemistry','Biology':'biology'}
LABELS=dict(zip('thu-bilingual|thu-en|uibe-buct-joint|tju-cn|tju-sie|tju-en|heu-cn-eng|heu-en-eng|heu-chinese|fudan-data-en|sjtu-cn|tongji-mbbs-en|ecnu-general|ecnu-special|ecnu-communication|dhu-cn|dhu-en|nju-cn|nju-chinese|nju-english|jiangnan-cn|jiangnan-humanities|jiangnan-textile-en|jiangnan-design-en|zju-general|zju-gcm|xmu-humanities|xmu-stem|xmu-en|hust-stem|hust-humanities|hust-en|csu-stem|csu-humanities-med|sysu-literature|sysu-biomed|xjtu-cn|xjtu-en|changan-cn|changan-humanities|changan-en'.split('|'),[
'Chinese-English bilingual bachelor programmes','English-taught bachelor programmes','International Development Cooperation + Polymer Materials joint dual degree','Chinese-taught bachelors (excluding School of International Education)','School of International Education bachelor programmes','English-taught bachelor programmes','Chinese-taught engineering bachelors','English-taught AI / Civil Engineering dual degree','Chinese Language bachelor','Data Science and Big Data Technology (English UIPDB)','Chinese-taught bachelors (Medicine recruited separately)','Six-year English-taught MBBS','General Chinese-taught bachelors (special schools separate)','English / International Chinese Culture / Design programmes','School of Communication Chinese-taught bachelors','Chinese-taught bachelors','English-taught bachelors','Chinese-taught bachelors (Chinese Language and English separate)','Chinese Language, first-year entry','English major (Chinese-taught bachelor route)','Chinese-taught bachelors (Humanities separate)','Chinese-taught Humanities bachelors','Textile Engineering (English)','Industrial Design (English)','General undergraduate requirements (programme review required)','Global Communication and Management (English)','Chinese-taught Humanities / Social Sciences / Business / Law / Arts','Chinese-taught STEM / Medicine / Sports','English-taught bachelors','Chinese-taught STEM / Medicine (AI separate)','Chinese-taught Business / Humanities / AI','English-taught bachelors','Chinese-taught STEM bachelors','Chinese-taught Medicine / Humanities','Chinese Language and Literature, Guangzhou campus','Biomedical Engineering, Shenzhen campus','Chinese-taught bachelors','English-taught bachelors','Chinese-taught bachelors (Humanities separate)','School of Humanities Chinese-taught bachelors','English-taught bachelors']))

def qual_mode(status):return {'accepted':'accepted','rejected':'rejected','not_accepted':'rejected','conditional':'review','unknown':'unknown'}.get(status,'unknown')
def source_list(values):
 out=[];seen=set()
 for s in values or []:
  if not isinstance(s,dict) or not s.get('url') or s['url'] in seen:continue
  seen.add(s['url']);out.append({k:s.get(k) for k in ['url','title','year','checkedAt']})
 return out

def hsk(raw):
 if raw.get('alternatives'):return {'type':'hsk','alternatives':[{k:v for k,v in hsk(r).items() if k!='type'} for r in raw['alternatives']]}
 result={'type':'hsk','level':raw.get('minimumLevel',raw.get('level',4)), 'acceptHigher':False}
 if raw.get('minimumTotal') is not None:result['total']=raw['minimumTotal']
 result['exclusive']=bool(raw.get('exclusive'))
 sections=raw.get('sections',{}).copy()
 if raw.get('sectionMinimum') is not None:sections.update({k:{'minimum':raw['sectionMinimum']} for k in ['listening','reading','writing']})
 if raw.get('writingMinimum') is not None:sections['writing']={'minimum':raw['writingMinimum']}
 if raw.get('sectionExclusive'):
  for component in sections.values():component['exclusive']=True
 result['sections']=sections
 return result

def ielts(raw):
 result={'type':'ielts'}
 overall=raw.get('overallMinimum',raw.get('overall',raw.get('minimumOverall')))
 if overall is not None:result['overall']=overall
 result.update(raw.get('bands') or {})
 for k in ['listening','reading','writing','speaking','minEach']:
  if raw.get(k) is not None:result[k]=raw[k]
 if raw.get('minEachBand') is not None:result['minEach']=raw['minEachBand']
 if raw.get('sectionMinimum') is not None:result['minEach']=raw['sectionMinimum']
 result['sectionExclusive']=bool(raw.get('sectionExclusive'))
 if raw.get('validityYears'):result['validMonths']=raw['validityYears']*12
 return result

china=read('china');schools=[]
updates={}
for name in ['china-north','china-central','china-south']:
 if (R/(name+'.json')).exists():
  for s in read(name).get('universities',[]):updates[s['nameZh']]=s
for original in china['universities']:
 u={**original,**updates.get(original['nameZh'],{})}
 s={'id':original['id'],'country':'CN','zh':u['nameZh'],'en':u.get('nameEn') or original['nameEn'],'city':u.get('city') or original.get('city'),'tags':(['985'] if original['classification985'] else [])+['211'],'military':original.get('military',False),'website':u.get('officialUrl') or original.get('officialUrl'),'admissionsUrl':u.get('admissionsUrl'),'sources':source_list(u.get('sources')),'routes':[]}
 for raw in u.get('rules',[]):
  machine=raw.get('machineRule',{});qualifications=[]
  for kind,q in (raw.get('qualification') or u.get('requirements',{})).items():
   if kind not in ['matriculation','chineseSchool','ged','alevel']:continue
   qr={'type':kind,'mode':qual_mode(q.get('status'))}
   aa=machine.get('academicAverage',{})
   if aa.get('minimum') is not None and kind in ['matriculation','chineseSchool'] and aa.get('scale',100)==100:qr.update(minAverage=aa['minimum'],useReportedAverage=True)
   qualifications.append(qr)
  if not qualifications:qualifications=[{'type':t,'mode':'unknown'} for t in ['matriculation','chineseSchool','ged','alevel']]
  languages=[]
  if machine.get('hsk'):languages.append(hsk(machine['hsk']))
  if machine.get('ielts'):languages.append(ielts(machine['ielts']))
  for lng in languages:
   if raw.get('languageCertificatesValidityYears'):lng['validMonths']=raw['languageCertificatesValidityYears']*12
  language={'type':'allOf','options':languages} if len(languages)>1 else languages[0] if languages else {'type':'none'} if raw.get('languageRequirementStatus')=='explicit_no_entry_hsk_required' or machine.get('language',{}).get('hskExemptForThisProgram') else {'type':'review'}
  year=raw.get('year')
  label_en=raw.get('labelEn') or LABELS.get(raw['id']) or ('Chinese-taught undergraduate route' if raw.get('teachingLanguage') in ['zh','zh-en'] else 'English-taught undergraduate route' if raw.get('teachingLanguage')=='en' else 'Undergraduate application route')
  notes=[REVIEW]
  age=machine.get('age',{})
  if age.get('maximum') is not None:
   mx=age['maximum'];op='<' if age.get('exclusive') else '≤';notes.append(triple(f'年龄要求 {op}{mx}；请按简章规定的日期和例外条件核实。',f'Age requirement {op}{mx}; confirm the prospectus reference date and exceptions.',f'အသက်လိုအပ်ချက် {op}{mx}၊ ကြေညာချက်ပါရက်နှင့် ခြွင်းချက်ကို အတည်ပြုရန် လိုသည်။'))
  rawnotes=raw.get('otherRequirements',[])
  if rawnotes:notes.append(triple('补充条件详见下方原文研究说明及官方简章；语言豁免、面试或专业测试不可自动推定。','Check the original notes and official prospectus below for additional conditions. Language waivers, interviews and programme tests are not assumed.','ထပ်ဆောင်းလိုအပ်ချက်အတွက် မူရင်းမှတ်စုနှင့် တရားဝင်ကြေညာချက်ကို ကြည့်နိုင်သည်။ ဘာသာစကားကင်းလွတ်ခွင့်နှင့် အင်တာဗျူးကို အလိုအလျောက် မယူဆပါ။'))
  route={'id':raw['id'],'label':{'zh':raw.get('label',label_en),'en':label_en,'my':raw.get('labelMy',label_en)},'level':'bachelor','teaching':'zh' if raw.get('teachingLanguage') in ['zh','zh-en'] else 'en' if raw.get('teachingLanguage')=='en' else 'any','cycle':year,'qualifications':qualifications,'language':language,'reviewNotes':notes,'rawNotes':rawnotes,'rawNotesEn':raw.get('otherRequirementsEn',rawnotes),'sources':source_list([p for p in s['sources'] if p['url']==raw.get('sourceUrl')]) or s['sources']}
  if machine.get('hskk',{}).get('required'):route['reviewNotes'].append(triple('另需HSKK中级口语成绩；请由顾问核实官方成绩单。','HSKK Intermediate speaking evidence is also required; verify the official report with an adviser.','HSKK အလယ်အဆင့် စကားပြောအထောက်အထားလည်း လိုအပ်၍ အကြံပေးနှင့် အတည်ပြုရန် လိုသည်။'))
  csca=machine.get('csca',{})
  if csca.get('required'):
   route['csca']={'subjects':[MAP.get(k,k) for k in csca.get('subjects',[]) if MAP.get(k,k) in ['math','physics','chemistry','chineseArts','chineseScience']],'subjectsUnknown':bool(csca.get('subjectReviewRequired')) or not csca.get('subjects') or any(MAP.get(k,k) not in ['math','physics','chemistry','chineseArts','chineseScience'] for k in csca.get('subjects',[]))}
   if csca.get('minimumScore') is not None:route['csca']['minimum']=csca['minimumScore']
  if not route['sources'] and raw.get('sourceUrl'):route['sources']=[{'url':raw['sourceUrl'],'title':raw.get('label',label_en),'year':year,'checkedAt':DATE}]
  s['routes'].append(route)
 schools.append(s)

asia=read('thailand-malaysia')
for u in asia['schools']:
 req=u['requirements'];qmap=req.get('qualifications',{})
 s={'id':u['id'],'country':{'Thailand':'TH','Malaysia':'MY'}[u['country']],'zh':u['nameZh'],'en':u['nameEn'],'city':u.get('city'),'tags':[u['classification']],'website':u['admissionsUrl'],'sources':source_list(u['sources']),'routes':[]}
 year=next((src['year'] for src in s['sources'] if src.get('year')),None)
 generic_q=[{'type':kind,'mode':qual_mode(q.get('status')),**({'newMyanmarOnly':True,'minYears':12} if s['country']=='MY' and kind=='matriculation' else {})} for kind,q in qmap.items()]
 baseline={'id':u['id']+'-overview','label':triple(req['scope'],req['scope'],req['scope']),'level':'bachelor','teaching':'en','cycle':year,'qualifications':generic_q,'language':ielts(req.get('ielts',{})),'reviewNotes':[BASELINE,REVIEW],'rawNotes':[req.get('evidence','')]+req.get('additional',[])+[kind+': '+v.get('note','') for kind,v in qmap.items()],'sources':s['sources'],'directoryOnly':True}
 s['routes'].append(baseline)
 if s['country']=='MY':
  s['newMyanmarBachelorPolicy']=True
  mqa=next(src for other in asia['schools'] for src in other['sources'] if 'mqa.gov.my' in src['url'])
  s['sources']=source_list(s['sources']+[mqa])
 machine_rules=u.get('machineRules',[])
 if u['id']=='my-taylor':machine_rules.append({'scope':'Bachelor of Business (Honours)','qualification':'alevel','academic':{'subjectCount':2,'minGrade':'D'},'ielts':{'overall':None},'otherRequired':req['additional']})
 for index,r in enumerate(machine_rules):
  kind=r['qualification'];a=r.get('academic',{});q={'type':kind,'mode':'rejected' if r.get('disallowed') else 'accepted'}
  if kind=='ged' and not r.get('disallowed'):q['ged']={'minEach':a.get('allGedSubjectsMin',145),**({'minTotal':a['gedTotalMin']} if a.get('gedTotalMin') else {}),**({'subjects':{'science':a['scienceMin']}} if a.get('scienceMin') else {})}
  if kind=='alevel':
   al={}
   if a.get('subjectCount'):al.update(count=a['subjectCount'],minGrade=a.get('minGrade','E'))
   if a.get('sortedMinGrades'):al['grades']=a['sortedMinGrades']
   if a.get('excludedSubjects'):al['excludedSubjects']=a['excludedSubjects']
   if a.get('subjects'):al['subjects']=[{'key':MAP.get(v['subject'],v['subject'].lower()),'grade':v['minGrade']} for v in a['subjects']]
   if a.get('oneOf') or a.get('anyOfSubjects'):al['anySubjects']=[{'key':MAP.get(v['subject'],v['subject'].lower()),'grade':v['minGrade']} for v in a.get('oneOf',a.get('anyOfSubjects',[]))]
   if a.get('pointsMin'):al['points']={'minimum':a['pointsMin'],'map':a['pointsMap'],'best':a.get('bestSubjectsCount'),'aStarBonus':a.get('aStarMaxBonus',0)}
   if a.get('subjectsAtGrade'):al.update(count=a['subjectsAtGrade']['count'],minGrade=a['subjectsAtGrade']['minGrade'])
   q['alevel']=al
  language=ielts(r.get('ielts',{}));rawnotes=r.get('otherRequired',[])
  if r.get('ielts',{}).get('mode')=='exemption':language={'type':'review'};rawnotes+=['IELTS5 is a placement/intensive-English exemption, not a mandatory academic entry cutoff.']
  notes=[REVIEW]
  if rawnotes:notes.append(triple('以下附加要求需要审核：作品集、面试、科目先修或材料认证（见原文说明）。','Additional requirements need review: portfolio, interview, prerequisite subjects or document validation (see original notes).','လက်ရာစုစည်းမှု၊ အင်တာဗျူး၊ ကြိုတင်ဘာသာရပ်နှင့် လက်မှတ်အတည်ပြုမှုတို့ကို စစ်ဆေးရန်လိုပါတယ် (မူရင်းမှတ်စုကြည့်ပါ)။'))
  if r.get('ielts',{}).get('conflictRequiresReview'):notes.append(triple('学校英语入学和直接入学院页面门槛不同，需招生办确认。','University English admission and direct faculty-enrolment thresholds differ; confirm with admissions.','အင်္ဂလိပ်ဝင်ခွင့်နှင့် ဌာနတိုက်ရိုက်ဝင်ခွင့်အမှတ် ကွာခြား၍ အတည်ပြုရန် လိုသည်။'))
  s['routes'].append({'id':u['id']+'-'+str(index),'label':triple(r['scope'],r['scope'],r['scope']),'level':'bachelor','teaching':'en','cycle':year,'qualifications':[q],'language':language,'reviewNotes':notes,'rawNotes':rawnotes,'sources':s['sources']})
 schools.append(s)

sg=read('singapore-exams')
labels={'nus-other':'NUS Other High School Qualifications','nus-alevel':'NUS International A-Level','ntu-myanmar':'NTU Myanmar Matriculation route','ntu-alevel':'NTU UK / International A-Level','smu-myanmar-nonlaw':'SMU Myanmar route (non-Law)','smu-alevel-nonlaw':'SMU A-Level route (non-Law)','sutd-myanmar':'SUTD Myanmar Matriculation route','sit-international':'SIT International Qualifications','suss-myanmar':'SUSS Myanmar qualification route','jcu-foundation-myanmar':'JCU Pre-University Foundation (Myanmar)','jcu-general-bachelor':'JCU Undergraduate general requirements','sim-uol-foundation':'SIM / University of London International Foundation','kaplan-diploma':'Kaplan Diploma routes','psb-diploma-myanmar':'PSB designated Diplomas (Myanmar)'}
for u in sg['schools']:
 s={'id':u['id'],'country':'SG','zh':u['name']['zh'],'en':u['name']['en'],'city':'Singapore','tags':[u['type']],'website':u['sources'][0]['url'],'sources':source_list(u['sources']),'routes':[]}
 for p in u['pathways']:
  a=p.get('academic',{});kind={'myanmar':'matriculation'}.get(p['credential'],p['credential']);kinds=[kind] if kind in ['matriculation','alevel'] else ['matriculation','chineseSchool','ged','alevel']
  qualifications=[]
  for typ in kinds:
   q={'type':typ,'mode':'accepted' if p['id'] in ['jcu-foundation-myanmar','psb-diploma-myanmar'] else 'review'}
   if a.get('minAverage') is not None and typ=='matriculation':q['minAverage']=a['minAverage']
   if p.get('minFormalYears') or a.get('minFormalYears'):q['minYears']=p.get('minFormalYears',a.get('minFormalYears'))
   if a.get('minFullALevelSubjects') and typ=='alevel':q['alevel']={'count':a['minFullALevelSubjects'],'minGrade':'E'}
   qualifications.append(q)
  lng=p.get('language',{});language={'type':'review'}
  if lng.get('ieltsAcademic'):language=ielts(lng['ieltsAcademic'])
  elif lng.get('anyOf'):
   options=[]
   for v in lng['anyOf']:
    if v.get('ieltsAcademic'):options.append(ielts(v['ieltsAcademic']))
    # SAT alternatives with additional component constraints remain a manual route;
    # only the NTU total-only alternative can be checked without omitting conditions.
    if p['id']=='ntu-myanmar' and v.get('sat',{}).get('total'):options.append({'type':'sat','total':v['sat']['total']})
   if options:language={'type':'anyOf','options':options} if len(options)>1 else options[0]
  elif lng.get('ieltsRequired') is False:language={'type':'none'}
  elif lng.get('generalIeltsMinimum'):language={'type':'ielts','overall':lng['generalIeltsMinimum']}
  elif lng.get('validityYears'):language={'type':'ielts','validMonths':lng['validityYears']*12}
  sources=source_list(p.get('sources')) or s['sources'];cycle=next((src['year'] for src in sources if src.get('year')),None)
  additional=[]
  if a.get('completedUniversityYears'):additional.append({'type':'universityYears','min':a['completedUniversityYears']})
  if p['id']=='ntu-myanmar':additional.append({'type':'apOrAlevel','count':3,'minScore':4})
  if p['id']=='nus-other':additional.append({'type':'standardisedAny','options':[{'apCount':5,'apMin':3},{'apCount':3,'apMin':3,'satReadingWriting':600,'satMath':650},{'apCount':3,'apMin':3,'act':29,'actWriting':8}]})
  rawnotes=p.get('manualChecks',[])
  if p.get('additionalTests'):rawnotes.append('Additional official tests: '+json.dumps(p['additionalTests'],ensure_ascii=False))
  if p.get('progression'):rawnotes.append('Progression is separate: '+json.dumps(p['progression'],ensure_ascii=False))
  if p.get('courseScope'):rawnotes.append('Designated courses: '+', '.join(p['courseScope']))
  if a.get('goodPassRequired') or a.get('goodPassCertificate') or a.get('eachSubjectGoodPass'):rawnotes.append('The published wording “good pass” is not converted to a fabricated grade cutoff.')
  note=[REVIEW]
  if p['level']!='bachelor':note.append(triple('这是预科或文凭衔接，不是本科直入；升入本科另有条件。','This is a foundation or diploma pathway, not direct bachelor entry. Degree progression has separate conditions.','ဤလမ်းကြောင်းသည် အကြိုတန်း သို့မဟုတ် ဒီပလိုမာဖြစ်ပြီး ဘွဲ့ကြိုတိုက်ရိုက်ဝင်ခွင့် မဟုတ်ပါ။'))
  s['routes'].append({'id':p['id'],'label':triple(labels[p['id']],labels[p['id']],labels[p['id']]),'level':p['level'],'teaching':'en','cycle':cycle,'qualifications':qualifications,'language':language,'additional':additional,'reviewNotes':note,'rawNotes':rawnotes,'sources':sources})
 schools.append(s)

out={'schemaVersion':1,'checkedAt':DATE,'targetYear':2027,'catalogSources':china['catalogSources'],'classificationNote':china['classificationNote'],'schools':schools,'examSources':source_list([src for schema in sg['examSchemas'].values() for src in schema.get('sources',[])])+[{'url':'https://csca.cn/about/examintro','title':'CSCA official exam information','checkedAt':DATE}]}
assert len(set(s['id'] for s in schools))==len(schools)
assert sum('985' in s['tags'] for s in schools)==39
for s in schools:
 for r in s['routes']:
  assert r['sources'],(s['id'],r['id'])
  assert all(src['url'].startswith(('https://','http://')) for src in r['sources'])
path=BASE/'dist/data/universities.json';path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'schools':len(schools),'countries':{c:sum(s['country']==c for s in schools) for c in ['CN','TH','MY','SG']},'withRules':sum(bool(s['routes']) for s in schools),'routes':sum(len(s['routes']) for s in schools)},ensure_ascii=False))
