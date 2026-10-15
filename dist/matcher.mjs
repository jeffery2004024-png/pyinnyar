export const TYPES = ['matriculation','chineseSchool','ged','alevel'];
export const GRADES = ['A*','A','B','C','D','E','U'];
export const COUNTRIES = ['CN','TH','MY','SG'];
export const CHECKED_DATE = '2026-10-08';
export const TODAY = new Date().toISOString().slice(0,10);
export const EMPTY_PROFILE = () => ({version:1,targetYear:2027,teaching:'any',academics:[],hsk:{},ielts:{kind:'academic'},csca:{},extra:{ap:[],universityYears:'',sat:'',act:''},competitions:[]});
export const num = x => x === '' || x === undefined || x === null ? null : Number(x);

export function academicStats(academic) {
  const subjects = academic.subjects || [];
  if(academic.type==='alevel') {
    const passes=subjects.filter(s=>s.stage!=='AS' && GRADES.includes(s.grade) && s.grade!=='U' && s.name?.trim());
    return {passes:passes.length,grades:passes.map(s=>s.grade),complete:subjects.length>0 && subjects.every(s=>s.name?.trim() && GRADES.includes(s.grade))};
  }
  const filled=subjects.filter(s=>num(s.score)!==null);
  const total=filled.reduce((sum,s)=>sum+Number(s.score),0);
  // Reporting only: never reuse a GED scaled score as a percentage.
  const average=academic.type==='ged' ? null : filled.length ? filled.reduce((sum,s)=>sum+Number(s.score)/Number(s.max||100)*100,0)/filled.length : null;
  return {total,count:filled.length,average,min:filled.length?Math.min(...filled.map(s=>Number(s.score))):null,complete:subjects.length>0&&subjects.every(s=>num(s.score)!==null&&s.name?.trim())};
}

export function validateProfile(profile) {
  const errors=[];
  if(!profile || typeof profile!=='object') return ['profile'];
  if(profile.version!==1) errors.push('version');
  for(const key of ['hsk','ielts','csca','extra'])if(!profile[key]||typeof profile[key]!=='object'||Array.isArray(profile[key]))errors.push('profile');
  if(!Number.isInteger(Number(profile.targetYear)) || Number(profile.targetYear)<2026 || Number(profile.targetYear)>2035) errors.push('year');
  if(!['any','zh','en'].includes(profile.teaching)) errors.push('teaching');
  if(!Array.isArray(profile.academics)||profile.academics.length>4) return [...errors,'academics'];
  const seen=new Set();
  profile.academics.forEach(a=>{
    if(!a||typeof a!=='object'){errors.push('qualification');return;}
    if(!TYPES.includes(a.type)||seen.has(a.type)){errors.push('qualification');return;} seen.add(a.type);
    if(typeof a.completed!=='boolean')errors.push('completed');
    if(num(a.year)!==null && (!Number.isInteger(Number(a.year)) || Number(a.year)<1990||Number(a.year)>2035))errors.push('examYear');
    if(!Array.isArray(a.subjects)||a.subjects.length>30){errors.push('subjects');return;}
    if(a.subjects.some(s=>!s||typeof s!=='object')){errors.push('subjects');return;}
    if(a.type==='matriculation'&&a.subjects.length!==6)errors.push('matricSubjects');
    if(a.type==='ged' && (a.subjects.length!==4 || new Set(a.subjects.map(s=>s.key)).size!==4 || a.subjects.some(s=>!['rla','math','science','social'].includes(s.key))))errors.push('gedSubjects');
    if(num(a.years)!==null && (!Number.isInteger(Number(a.years))||Number(a.years)<1||Number(a.years)>16))errors.push('schoolYears');
    if(num(a.reportedAverage)!==null&&(!Number.isFinite(Number(a.reportedAverage))||Number(a.reportedAverage)<0||Number(a.reportedAverage)>100))errors.push('score');
    a.subjects.forEach(s=>{
      if(typeof s.name!=='string'||s.name.length>150)errors.push('subjectName');
      if(a.type==='alevel') {if(s.grade && (!GRADES.includes(s.grade)||s.stage==='AS'&&s.grade==='A*'))errors.push('grade');if(!['A-Level','AS'].includes(s.stage))errors.push('stage');}
      else {const value=num(s.score),max=num(s.max);if(max===null||!Number.isFinite(max)||max<=0||max>10000)errors.push('max');if(value!==null&&(!Number.isFinite(value)||value<0||value>max||(a.type==='ged'&&(value<100||max!==200||!Number.isInteger(value)))||(a.type==='matriculation'&&(max!==100||!Number.isInteger(value)))))errors.push('score');}
    });
    const names=a.subjects.map(s=>(s.key&&s.key!=='other'?s.key:s.name||'').trim().normalize('NFKC').toLowerCase()).filter(Boolean);
    if(new Set(names).size!==names.length)errors.push('duplicateSubject');
  });
  const h=profile.hsk||{};
  if(h.level && !['1','2','3','4','5','6','7-9'].includes(String(h.level)))errors.push('hskLevel');
  if(num(h.total)!==null && h.level!=='7-9'){const max=['1','2'].includes(String(h.level))?200:300;if(!h.level||!Number.isInteger(Number(h.total))||Number(h.total)<0||Number(h.total)>max)errors.push('hskScore');}
  if(h.level==='7-9'&&h.advancedBand&&!['7','8','9','below7'].includes(String(h.advancedBand)))errors.push('hskLevel');
  ['listening','reading','writing','speaking','translation'].forEach(k=>{const n=num(h[k]);if(n!==null&&(!Number.isInteger(n)||n<0||n>100))errors.push('hskScore');});
  const hskParts=['1','2'].includes(String(h.level))?['listening','reading']:['listening','reading','writing'];
  if(h.level&&h.level!=='7-9'&&num(h.total)!==null&&hskParts.every(k=>num(h[k])!==null)&&hskParts.reduce((sum,k)=>sum+Number(h[k]),0)!==Number(h.total))errors.push('hskOverall');
  const i=profile.ielts||{};
  if(i.kind && !['academic','general'].includes(i.kind))errors.push('ieltsKind');
  ['overall','listening','reading','writing','speaking'].forEach(k=>{const n=num(i[k]);if(n!==null&&(!Number.isFinite(n)||n<0||n>9||n*2!==Math.round(n*2)))errors.push('ieltsScore');});
  if(['listening','reading','writing','speaking'].every(k=>num(i[k])!==null)&&num(i.overall)!==null){const mean=['listening','reading','writing','speaking'].reduce((sum,k)=>sum+Number(i[k]),0)/4;const rounded=Math.round(mean*2)/2;if(rounded!==Number(i.overall))errors.push('ieltsOverall');}
  Object.values(profile.csca||{}).forEach(v=>{const n=num(v);if(n!==null&&(!Number.isInteger(n)||n<0||n>100))errors.push('csca');});
  const extra=profile.extra||{};
  if(num(extra.sat)!==null&&(!Number.isInteger(Number(extra.sat))||Number(extra.sat)<400||Number(extra.sat)>1600))errors.push('sat');
  if(num(extra.act)!==null&&(!Number.isInteger(Number(extra.act))||Number(extra.act)<1||Number(extra.act)>36))errors.push('act');
  ['satMath','satReadingWriting'].forEach(k=>{const n=num(extra[k]);if(n!==null&&(!Number.isInteger(n)||n<200||n>800))errors.push('sat');});
  if(num(extra.sat)!==null&&num(extra.satMath)!==null&&num(extra.satReadingWriting)!==null&&Number(extra.sat)!==Number(extra.satMath)+Number(extra.satReadingWriting))errors.push('sat');
  if(num(extra.actWriting)!==null&&(!Number.isInteger(Number(extra.actWriting))||Number(extra.actWriting)<2||Number(extra.actWriting)>12))errors.push('act');
  if(num(extra.universityYears)!==null&&(!Number.isFinite(Number(extra.universityYears))||Number(extra.universityYears)<0||Number(extra.universityYears)>8))errors.push('universityYears');
  if(!Array.isArray(extra.ap)||extra.ap.length>20)errors.push('ap');else {extra.ap.forEach(s=>{if(!s||typeof s.name!=='string'||s.name.length>150||num(s.score)!==null&&(!Number.isInteger(Number(s.score))||Number(s.score)<1||Number(s.score)>5))errors.push('ap');});const apNames=extra.ap.map(s=>String(s?.name||'').trim().normalize('NFKC').toLowerCase()).filter(Boolean);if(new Set(apNames).size!==apNames.length)errors.push('duplicateSubject');}
  if(!Array.isArray(profile.competitions)||profile.competitions.length>20)errors.push('competitions');else profile.competitions.forEach(c=>{if(!c||typeof c!=='object'){errors.push('competition');return;}['name','award','organizer'].forEach(k=>{if(typeof c[k]!=='string'||c[k].length>300)errors.push('competition');});if(num(c.year)!==null&&(!Number.isInteger(Number(c.year))||Number(c.year)<1990||Number(c.year)>2035))errors.push('competitionYear');});
  ['hsk','ielts'].forEach(k=>{const date=profile[k]?.date;if(date){const parsed=new Date(`${date}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date>TODAY)errors.push('testDate');}});
  return [...new Set(errors)];
}

const check=(kind,code,detail={})=>({kind,code,...detail});
function threshold(value,minimum,code,detail={}) {const n=num(value);return check(n===null?'missing':n>=minimum?'pass':'gap',code,{required:minimum,actual:n,...detail});}

function evaluateQualification(academic,rule) {
  const checks=[];
  if(!academic)return [check('missing','qualification',{qualification:rule.type})];
  if(rule.mode==='rejected')return [check('gap','notAccepted',{qualification:rule.type})];
  if(rule.mode==='unknown')checks.push(check('review','recognitionUnknown',{qualification:rule.type}));
  else if(rule.mode!=='accepted')checks.push(check('review','recognition',{qualification:rule.type}));else checks.push(check('pass','recognition',{qualification:rule.type}));
  if(!academic.completed)checks.push(check('missing','graduation',{qualification:rule.type}));
  const stats=academicStats(academic);
  if(!stats.complete)checks.push(check('missing','transcript',{qualification:rule.type}));
  if(rule.minYears)checks.push(threshold(academic.years,rule.minYears,'years'));
  if(rule.newMyanmarOnly){
    const old=academic.system==='legacy'||num(academic.year)!==null&&Number(academic.year)<2024;
    checks.push(check(old?'gap':academic.system==='new'&&num(academic.year)!==null?'pass':'missing','newMyanmar'));
  }
  if(rule.minAverage!==undefined){const average=rule.useReportedAverage?num(academic.reportedAverage):stats.complete?stats.average:null;checks.push(threshold(average,rule.minAverage,rule.useReportedAverage?'reportedAverage':'academicAverage'));}
  if(rule.minEach!==undefined) {
    const values=academic.subjects.map(s=>num(s.score));
    checks.push(threshold(stats.complete?Math.min(...values):null,rule.minEach,academic.type==='ged'?'gedEach':'subjectEach'));
  }
  if(rule.alevel) {
    const a=rule.alevel;
    const passes=academic.subjects.filter(s=>s.stage==='A-Level'&&s.name?.trim()&&GRADES.includes(s.grade)&&s.grade!=='U'&&!(a.excludedSubjects||[]).map(x=>x.toLowerCase()).includes(s.name.trim().toLowerCase()));
    if(a.count)checks.push(threshold(passes.filter(s=>!a.minGrade||GRADES.indexOf(s.grade)<=GRADES.indexOf(a.minGrade)).length,a.count,'alevelCount',{grade:a.minGrade||'E'}));
    if(a.grades){const required=[...a.grades].map(g=>GRADES.indexOf(g)).sort((a,b)=>a-b);const actual=passes.map(s=>GRADES.indexOf(s.grade)).sort((a,b)=>a-b);const met=required.every((grade,index)=>actual[index]!==undefined&&actual[index]<=grade);checks.push(check(met?'pass':stats.complete?'gap':'missing','alevelGrades',{required:a.grades.join(' / '),actual:passes.map(s=>s.grade).join(' / ')}));}
    (a.subjects||[]).forEach(req=>{const found=passes.find(s=>s.key===req.key);checks.push(check(!found?'missing':GRADES.indexOf(found.grade)<=GRADES.indexOf(req.grade)?'pass':'gap','alevelSubject',{subject:req.key,required:req.grade,actual:found?.grade}));});
    if(a.anySubjects){const found=a.anySubjects.some(req=>passes.some(s=>s.key===req.key&&GRADES.indexOf(s.grade)<=GRADES.indexOf(req.grade)));checks.push(check(found?'pass':stats.complete?'gap':'missing','alevelAnySubject',{required:a.anySubjects.map(s=>s.key+' '+s.grade).join(' / ')}));}
    if(a.points){const defined=passes.every(s=>a.points.map[s.grade]!==undefined);const points=passes.map(s=>a.points.map[s.grade]||0).sort((a,b)=>b-a).slice(0,a.points.best||passes.length).reduce((sum,n)=>sum+n,0)+(a.points.aStarBonus&&passes.some(s=>s.grade==='A*')?a.points.aStarBonus:0);checks.push(check(!defined?'review':points>=a.points.minimum?'pass':stats.complete?'gap':'missing','alevelPoints',{required:a.points.minimum,actual:defined?points:null}));}
    if(academic.resultType==='predicted')checks.push(check('review','predicted'));
  }
  if(rule.ged && academic.type==='ged') {
    checks.push(threshold(stats.complete?stats.min:null,rule.ged.minEach||145,'gedEach'));
    if(rule.ged.minTotal)checks.push(threshold(stats.complete?stats.total:null,rule.ged.minTotal,'gedTotal'));
    Object.entries(rule.ged.subjects||{}).forEach(([key,minimum])=>checks.push(threshold(academic.subjects.find(s=>s.key===key)?.score,minimum,'gedSubject',{subject:key})));
  }
  if(academic.type==='ged'&&!rule.ged)checks.push(threshold(stats.complete?stats.min:null,145,'gedEach'));
  if(rule.ap){const count=(rule.ap.count||0);const list=academic?.subjects||[];void list;checks.push(check('review','additionalAcademic'));}
  (rule.notes||[]).forEach(text=>checks.push(check('review','custom',{text})));
  return checks;
}

function evaluateLanguage(profile,rule) {
  if(!rule)return [check('review','languageUnknown')];
  if(rule.type==='none')return [];
  if(rule.type==='anyOf')return rule.options.map(r=>evaluateLanguage(profile,r)).sort((a,b)=>rankChecks(a)-rankChecks(b))[0];
  if(rule.type==='allOf')return rule.options.flatMap(r=>evaluateLanguage(profile,r));
  if(rule.type==='sat')return [threshold(profile.extra.sat,rule.total,'sat')];
  if(rule.type==='review')return [check('review','languageUnknown')];
  if(rule.type==='hsk'){
    const h=profile.hsk||{},checks=[];
    if(rule.alternatives){const specific=rule.alternatives.find(r=>String(r.level)===String(h.level));if(specific)return evaluateLanguage(profile,{type:'hsk',validMonths:rule.validMonths,...specific});if(!h.level)return [check('missing','hsk',{required:rule.alternatives.map(r=>'HSK '+r.level+' / '+r.total).join(' or '),actual:null})];return [check(h.level==='7-9'||Number(h.level)>Math.max(...rule.alternatives.map(r=>r.level))?'review':'gap','hsk',{required:rule.alternatives.map(r=>'HSK '+r.level+' / '+r.total).join(' or '),actual:'HSK '+h.level})];}
    if(!h.level)return [check('missing','hsk',{required:`HSK ${rule.level}${rule.total!==undefined?' / '+rule.total:''}`,actual:null})];
    if(h.level==='7-9')return [check('review','hskAdvanced')];
    const actual=Number(h.level);
    if(actual<rule.level)checks.push(check('gap','hsk',{required:`HSK ${rule.level}${rule.total!==undefined?' / '+rule.total:''}`,actual:`HSK ${h.level}${num(h.total)!==null?' / '+h.total:''}`}));
    else if(actual>rule.level && !rule.acceptHigher)checks.push(check('review','higherHsk'));
    else {checks.push(check('pass','hskLevel',{required:rule.level,actual:actual}));if(rule.total!==undefined){const c=threshold(h.total,rule.total,'hskTotal',{level:h.level});if(rule.exclusive&&num(h.total)===rule.total)c.kind='gap';checks.push(c);}}
    Object.entries(rule.sections||{}).forEach(([component,req])=>{const c=threshold(h[component],req.minimum,'hskComponent',{component,exclusive:!!req.exclusive});if(req.exclusive&&num(h[component])===req.minimum)c.kind='gap';checks.push(c);});
    if(rule.validMonths)checks.push(dateCheck(h.date,rule.validMonths,profile.targetYear,'hskDate'));
    return checks;
  }
  if(rule.type==='ielts') {
    const i=profile.ielts||{},checks=[];
    if(i.kind==='general')return [check('gap','ieltsAcademic')];
    if(rule.overall!==undefined)checks.push(threshold(i.overall,rule.overall,'ieltsOverall'));
    else checks.push(check('review','ieltsThresholdUnknown'));
    ['listening','reading','writing','speaking'].forEach(k=>{const minimum=rule[k]??rule.minEach;if(minimum!==undefined){const c=threshold(i[k],minimum,'ieltsComponent',{component:k,exclusive:!!rule.sectionExclusive});if(rule.sectionExclusive&&num(i[k])===minimum)c.kind='gap';checks.push(c);}});
    if(rule.validMonths)checks.push(dateCheck(i.date,rule.validMonths,profile.targetYear,'ieltsDate'));
    return checks;
  }
  return [check('review','languageUnknown')];
}
function dateCheck(date,months,year,code){if(!date)return check('missing',code,{required:months});const tested=new Date(`${date}T00:00:00Z`);const now=new Date(`${TODAY}T00:00:00Z`);if(Number.isNaN(tested.getTime())||tested>now)return check('gap',code,{required:months});const expiry=new Date(tested);expiry.setUTCMonth(expiry.getUTCMonth()+months);if(expiry<now)return check('gap',code,{required:months});return check('review','validAtApplication',{date,year,required:months});}

export function evaluateRoute(profile,school,route) {
  if(route.directoryOnly)return {status:'unknown',school,route,checks:[check('review','unverified')]};
  const candidates=route.qualifications||[];
  if(!candidates.length)return {status:'unknown',school,route,checks:[check('review','unverified')]};
  const alternatives=candidates.filter(q=>profile.academics.some(a=>a.type===q.type));
  let selected;
  if(!alternatives.length)selected={checks:[check('review','qualificationUnknown')],qualification:null};
  else selected=alternatives.map(q=>({qualification:q.type,checks:evaluateQualification(profile.academics.find(a=>a.type===q.type),q)})).sort((a,b)=>rankChecks(a.checks)-rankChecks(b.checks))[0];
  const checks=[...selected.checks,...evaluateLanguage(profile,route.language)];
  if(school.country==='MY'&&route.level==='bachelor'&&school.newMyanmarBachelorPolicy&&profile.academics.length===1&&profile.academics[0].type==='matriculation'){
    const a=profile.academics[0];const old=a.system==='legacy'||num(a.year)!==null&&Number(a.year)<2024;checks.push(check(old?'gap':a.system==='new'&&num(a.year)!==null&&num(a.years)>=12?'pass':'missing','newMyanmar'));
  }
  if(route.csca){(route.csca.subjects||[]).forEach(key=>{const value=profile.csca[key];checks.push(route.csca.minimum!==undefined?threshold(value,route.csca.minimum,'csca',{subject:key}):check(num(value)===null?'missing':'pass','csca',{subject:key}));});if(route.csca.subjectsUnknown)checks.push(check('review','cscaSubjectUnknown'));}
  (route.additional||[]).forEach(req=>{
    if(req.type==='apOrAlevel'){
      const ap=(profile.extra.ap||[]).filter(s=>s.name?.trim()&&num(s.score)>=req.minScore).length;
      const levels=profile.academics.find(a=>a.type==='alevel');const count=levels?academicStats(levels).passes:0;
      checks.push(check(ap>=req.count||count>=req.count?'pass':'missing','apOrAlevel',{required:req.count,minimum:req.minScore}));
    }else if(req.type==='universityYears')checks.push(threshold(profile.extra.universityYears,req.min,'universityYears'));
    else if(req.type==='sat')checks.push(threshold(profile.extra.sat,req.min,'sat'));
    else if(req.type==='standardisedAny'){
      const choices=req.options.map(option=>{const list=[];const ap=(profile.extra.ap||[]).filter(s=>s.name?.trim()&&num(s.score)>=option.apMin).length;if(option.apCount)list.push(threshold(ap,option.apCount,'apCount',{minimum:option.apMin}));if(option.satMath)list.push(threshold(profile.extra.satMath,option.satMath,'satMath'));if(option.satReadingWriting)list.push(threshold(profile.extra.satReadingWriting,option.satReadingWriting,'satReadingWriting'));if(option.act)list.push(threshold(profile.extra.act,option.act,'act'));if(option.actWriting)list.push(threshold(profile.extra.actWriting,option.actWriting,'actWriting'));return list;});checks.push(...choices.sort((a,b)=>rankChecks(a)-rankChecks(b))[0]);
    }
    else if(req.type==='review')checks.push(check('review','custom',{text:req.text}));
  });
  (route.reviewNotes||[]).forEach(text=>checks.push(check('review','custom',{text})));
  if(route.cycle && Number(route.cycle)!==Number(profile.targetYear))checks.push(check('review','cycle',{year:route.cycle,target:profile.targetYear}));
  const status=checks.some(c=>c.kind==='gap')?'gap':checks.some(c=>['recognitionUnknown','qualificationUnknown'].includes(c.code))?'unknown':checks.some(c=>c.kind==='missing')?'incomplete':checks.some(c=>c.kind==='review')?'review':'met';
  return {status,school,route,qualification:selected.qualification,checks};
}
const statusRank={met:0,review:1,incomplete:2,gap:3,unknown:4};
function rankChecks(checks){return checks.some(c=>['recognitionUnknown','qualificationUnknown'].includes(c.code))?4:checks.some(c=>c.kind==='gap')?3:checks.some(c=>c.kind==='missing')?2:checks.some(c=>c.kind==='review')?1:0;}
export function matchProfile(profile,schools) {
  const errors=validateProfile(profile);if(errors.length)throw new Error(`Invalid profile: ${errors.join(', ')}`);
  return schools.map(school=>{
    let routes=(school.routes||[]).filter(r=>profile.teaching==='any'||r.teaching===profile.teaching||r.teaching==='any');
    if(!routes.length)return {status:'unknown',school,route:null,checks:[check('review','unverified')]};
    const evaluated=routes.map(r=>evaluateRoute(profile,school,r)).sort((a,b)=>statusRank[a.status]-statusRank[b.status]);
    return {...evaluated[0],alternatives:evaluated};
  }).sort((a,b)=>statusRank[a.status]-statusRank[b.status]||a.school.en.localeCompare(b.school.en));
}
