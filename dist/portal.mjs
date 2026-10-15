import {messengerHtml} from './site-components.mjs';
import {inferEvidence,evidenceProfile,OPTIONAL_EVIDENCE} from './profile-selection.mjs';
import {UI} from './portal-i18n.mjs';
import {EMPTY_PROFILE,TYPES,GRADES,COUNTRIES,CHECKED_DATE,TODAY,academicStats,validateProfile,matchProfile,num} from './matcher.mjs';

const page=document.body.dataset.page;
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang=(document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang==='my'?'my':'en');
const T=key=>UI[lang][key]||UI.en[key]||key;
const L=(zh,en,my)=>({zh,en,my})[lang];
let profile=EMPTY_PROFILE(),data=null,results=null,hasMatched=false,timer=null,limit=20;
const initialParams=new URLSearchParams(location.search);
let filters={country:COUNTRIES.includes(initialParams.get('country'))?initialParams.get('country'):'all',status:'assessed',category:'all',query:initialParams.get('school')?.slice(0,150)||''};
const names={myanmar:'Myanmar language',english:'English',math:'Mathematics',physics:'Physics',chemistry:'Chemistry',biology:'Biology',geography:'Geography',history:'History',economics:'Economics',chinese:'Chinese',rla:'Reasoning through Language Arts',science:'Science',social:'Social Studies',other:''};
const subjectKeys=['myanmar','english','math','physics','chemistry','biology','geography','history','economics','chinese','other'];
const drafts={};
function defaultAcademic(type){
 const list=type==='matriculation'?['myanmar','english','math','physics','chemistry','biology']:type==='ged'?['rla','math','science','social']:type==='alevel'?['math','physics','chemistry']:['chinese','english','math'];
 return {type,completed:false,year:'',years:'',system:'unknown',schoolName:'',issuer:'',diploma:'',reportedAverage:'',board:'Cambridge',resultType:'final',subjects:list.map(key=>({key,name:names[key],score:'',max:type==='ged'?200:100,stage:'A-Level',grade:''}))};
}
TYPES.forEach(type=>drafts[type]=defaultAcademic(type));
try{const stored=localStorage.getItem('pyinnyar-profile-v1');if(stored){const candidate=JSON.parse(stored);if(validateProfile(candidate).length===0){profile=candidate;profile.academics.forEach(a=>drafts[a.type]=a);}}}catch{}
const initialQualification=new URLSearchParams(location.search).get('qualification');
if(page==='match'&&TYPES.includes(initialQualification)&&!profile.academics.some(a=>a.type===initialQualification))profile.academics.push(drafts[initialQualification]);
let wizardStep=1,selectedEvidence=inferEvidence(profile);
const activeProfile=()=>evidenceProfile(profile,selectedEvidence);
const option=(value,label,current)=>`<option value="${esc(value)}"${String(value)===String(current)?' selected':''}>${esc(label)}</option>`;
function field(label,value,attrs=''){return `<label class="field"><span>${esc(label)}</span><input value="${esc(value)}" ${attrs}></label>`;}
function select(label,current,choices,attrs=''){return `<label class="field"><span>${esc(label)}</span><select ${attrs}>${choices.map(([v,l])=>option(v,l,current)).join('')}</select></label>`;}
function safeUrl(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.href:'#';}catch{return '#';}}
function countryPills(){return `<div class="country-pills">${COUNTRIES.map(c=>`<span class="country-pill">${T(c)}</span>`).join('')}</div>`;}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
function applyLanguage(next){
 if(!UI[next])return;lang=next;document.documentElement.lang={zh:'zh-CN',my:'my',en:'en'}[lang];try{localStorage.setItem('pyinnyar-language',lang);}catch{}
 $$('[data-ui]').forEach(el=>{el.textContent=T(el.dataset.ui);});$$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 document.title=`${T(page==='match'?'scores':'directory')} · PyinNyar study abroad`;
 $('.menu-toggle').setAttribute('aria-label',L('打开导航','Open navigation','လမ်းညွှန်ဖွင့်ရန်'));
 $('.nav a[data-ui="'+(page==='match'?'scores':'directory')+'"]').setAttribute('aria-current','page');
 if(data){if(page==='match')renderMatchPage();else renderDirectory();}
}

function readProfile(){
 if(page!=='match'||wizardStep!==2||!$('#profile-form'))return;
 $$('[data-model]').forEach(input=>{const keys=input.dataset.model.split('.');let target=profile;for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)]=input.value;});
 $$('[data-acad]').forEach(block=>{
  const type=block.dataset.acad,a=drafts[type];
  block.querySelectorAll('[data-field]').forEach(input=>a[input.dataset.field]=input.type==='checkbox'?input.checked:input.value);
  a.subjects=[...block.querySelectorAll('[data-subject]')].map(row=>{const old=a.subjects[Number(row.dataset.subject)]||{};const s={...old};row.querySelectorAll('[data-sfield]').forEach(input=>s[input.dataset.sfield]=input.value);if(s.key!=='other')s.name=names[s.key]||s.name;if(type==='alevel'&&s.stage==='AS'&&s.grade==='A*')s.grade='';return s;});
 });
 profile.academics=TYPES.filter(type=>selectedEvidence.has(type)).map(type=>drafts[type]);
 if(selectedEvidence.has('competitions'))profile.competitions=$$('[data-competition]').map(row=>{const c={name:'',award:'',organizer:'',year:''};row.querySelectorAll('[data-cfield]').forEach(input=>c[input.dataset.cfield]=input.value);return c;});
 if(selectedEvidence.has('ap'))profile.extra.ap=$$('[data-ap]').map(row=>{const s={name:'',score:''};row.querySelectorAll('[data-apfield]').forEach(input=>s[input.dataset.apfield]=input.value);return s;});
}
function summaryHtml(){return profile.academics.map(a=>{const stat=academicStats(a);return `<p><strong>${esc(T(a.type))}</strong><br>${esc(a.type==='alevel'?`${stat.passes} ${T('passSubjects')}`:a.type==='ged'?`${stat.total} / 800`:`${stat.average===null?'—':stat.average.toFixed(1)+'%'} · ${stat.count} ${T('subject')}`)}</p>`;}).join('')+`<p>HSK ${esc(profile.hsk.level||'—')} · IELTS ${esc(profile.ielts.overall||'—')}</p><p>${T('competitions')}: ${profile.competitions.length}</p>`;}
function academicSummary(a){const s=academicStats(a);return `<span>${T(a.type==='alevel'?'passSubjects':'total')}: <strong>${a.type==='alevel'?s.passes:s.total}</strong></span>${s.average!==null&&s.average!==undefined?`<span>${T('average')}: <strong>${s.average.toFixed(1)}%</strong></span>`:''}${!s.complete?`<span>${T('missingScores')}</span>`:''}`;}

function subjectRow(a,s,index){
 const full=a.type==='alevel';const readonly=a.type==='ged';
 let subject=readonly?`<span>${esc(T(s.key==='science'?'scienceSubject':s.key))}</span>`:`<select data-sfield="key" aria-label="${esc(T('subject')+' '+(index+1))}">${subjectKeys.filter(k=>a.type!=='alevel'||k!=='myanmar').map(key=>option(key,T(key),s.key)).join('')}</select><input class="custom-subject" data-sfield="name" value="${esc(s.name)}" maxlength="150" aria-label="${esc(T('subject')+' '+(index+1))}" ${s.key!=='other'?'hidden':''}>`;
 if(full) return `<tr data-subject="${index}"><td class="subject-cell">${subject}</td><td>${`<select data-sfield="stage" aria-label="${esc(T('stage')+' '+(index+1))}">${['A-Level','AS'].map(v=>option(v,v,s.stage)).join('')}</select>`}</td><td class="grade-cell"><select data-sfield="grade" aria-label="${esc(T('grade')+' '+(index+1))}">${option('', '—',s.grade)}${GRADES.filter(g=>s.stage!=='AS'||g!=='A*').map(v=>option(v,v,s.grade)).join('')}</select></td><td><button type="button" class="remove-row" data-remove-subject="${index}" data-type="${a.type}" aria-label="${esc(T('remove')+' '+(index+1))}">×</button></td></tr>`;
 return `<tr data-subject="${index}"><td class="subject-cell">${subject}</td><td><input data-sfield="score" type="number" inputmode="decimal" min="${readonly?100:0}" max="${esc(s.max)}" step="${a.type==='chineseSchool'?'0.01':'1'}" value="${esc(s.score)}" aria-label="${esc(T(s.key==='science'?'scienceSubject':s.key)||s.name)+' '+esc(T('score'))}"></td><td>${a.type==='chineseSchool'?`<input data-sfield="max" type="number" min="1" max="10000" step="0.01" value="${esc(s.max)}" aria-label="${esc(T(s.key))+' '+esc(T('maximum'))}">`:esc(s.max)}</td><td>${readonly?'':`<button type="button" class="remove-row" data-remove-subject="${index}" data-type="${a.type}" aria-label="${esc(T('remove')+' '+(index+1))}">×</button>`}</td></tr>`;
}
function academicBlock(type){
 const a=drafts[type],enabled=profile.academics.some(x=>x.type===type);
 return `<div class="academic-block" data-acad="${type}" ${!enabled?'hidden':''}><h3>${T(type)}</h3><label class="check-field"><input type="checkbox" data-field="completed"${a.completed?' checked':''}>${T('completed')}</label><div class="input-grid three">${field(T('examYear'),a.year,'data-field="year" type="number" min="1990" max="2035" step="1"')}${type==='matriculation'?select(T('system'),a.system,[['unknown',T('unknownSystem')],['legacy',T('legacy')],['new',T('new')]],'data-field="system"'):field(T('schoolName'),a.schoolName,'data-field="schoolName" maxlength="150"')}${field(T('schoolYears'),a.years,'data-field="years" type="number" min="1" max="16" step="1"')}</div>${type==='chineseSchool'?`<div class="input-grid">${field(T('issuer'),a.issuer,'data-field="issuer" maxlength="150"')}${field(T('diploma'),a.diploma,'data-field="diploma" maxlength="150"')}</div>`:''}${['matriculation','chineseSchool'].includes(type)?field(L('成绩单注明的综合平均百分比（可选）','School-certified overall percentage (optional)','ကျောင်းအတည်ပြု ပျမ်းမျှရာခိုင်နှုန်း (ရွေးချယ်နိုင်)'),a.reportedAverage,'data-field="reportedAverage" type="number" min="0" max="100" step="0.01"'):''}${type==='alevel'?`<div class="input-grid">${select(L('考试局','Exam board','စာမေးပွဲအဖွဲ့'),a.board,[['Cambridge','Cambridge'],['Edexcel','Pearson Edexcel'],['other',T('other')]],'data-field="board"')}${select(L('成绩状态','Result status','အမှတ်အခြေအနေ'),a.resultType,[['final',L('正式成绩','Final results','တရားဝင်အမှတ်')],['predicted',L('预估成绩','Predicted results','မျှော်မှန်းအမှတ်')]],'data-field="resultType"')}</div>`:''}${type==='matriculation'?`<div class="preset-actions"><button type="button" class="tool-button" data-preset="science">${T('science')}</button><button type="button" class="tool-button" data-preset="arts">${T('arts')}</button></div>`:''}<div class="transcript-wrap"><table class="transcript ${type==='alevel'?'alevel':''}"><thead><tr><th>${T('subject')}</th><th>${T(type==='alevel'?'stage':'score')}</th><th>${T(type==='alevel'?'grade':'maximum')}</th><th></th></tr></thead><tbody>${a.subjects.map((s,i)=>subjectRow(a,s,i)).join('')}</tbody></table></div>${type!=='ged'?`<button type="button" class="text-link" data-add-subject="${type}">${T('addSubject')}</button>`:''}<div class="academic-summary" data-academic-summary="${type}">${academicSummary(a)}</div><p class="field-hint">${T({matriculation:'matricHint',chineseSchool:'chineseHint',ged:'gedHint',alevel:'alevelHint'}[type])}</p></div>`;
}

function hskFields(){const h=profile.hsk,advanced=h.level==='7-9';return `<div class="language-block"><h3>HSK</h3><div class="input-grid three">${select(T('level'),h.level,[['','—'],...['1','2','3','4','5','6'].map(v=>[v,'HSK '+v]),['7-9','HSK 7–9']],'data-model="hsk.level"')}${advanced?select(T('hskBand'),h.advancedBand,[['','—'],['below7',T('below7')],['7','7'],['8','8'],['9','9']],'data-model="hsk.advancedBand"'):field(T('hskTotal'),h.total,`data-model="hsk.total" type="number" min="0" max="${['1','2'].includes(h.level)?200:300}" step="1"`)}${field(T('testDate'),h.date,`data-model="hsk.date" type="date" max="${TODAY}"`)}</div><div class="input-grid three">${(advanced?['listening','reading','writing','speaking','translation']:['1','2'].includes(h.level)?['listening','reading']:['listening','reading','writing']).map(k=>field(T(k)+' (0–100)',h[k],`data-model="hsk.${k}" type="number" min="0" max="100" step="1"`)).join('')}</div><p class="field-hint">${T('hskHint')}</p></div>`;}
function ieltsFields(){const i=profile.ielts;return `<div class="language-block"><h3>IELTS</h3><div class="input-grid three">${select(T('ieltsKind'),i.kind,[['academic',T('academic')],['general',T('general')]],'data-model="ielts.kind"')}${field(T('overall'),i.overall,'data-model="ielts.overall" type="number" min="0" max="9" step="0.5"')}${field(T('testDate'),i.date,`data-model="ielts.date" type="date" max="${TODAY}"`)}</div><div class="input-grid four">${['listening','reading','writing','speaking'].map(k=>field(T(k),i[k],`data-model="ielts.${k}" type="number" min="0" max="9" step="0.5"`)).join('')}</div><p class="field-hint">${T('ieltsHint')}</p></div>`;}
function extraFields(){return `${selectedEvidence.has('csca')?`<div class="language-block"><h3>CSCA</h3><div class="input-grid three">${['math','physics','chemistry','chineseArts','chineseScience'].map(k=>field(T(k),profile.csca[k],`data-model="csca.${k}" type="number" min="0" max="100" step="1"`)).join('')}</div><p class="field-hint">${T('cscaHint')}</p><a class="external-reference" href="https://csca.cn/about/examintro" target="_blank" rel="noopener noreferrer">${T('paper')} ↗</a></div>`:''}${selectedEvidence.has('sat')?`<div class="language-block"><h3>SAT</h3><div class="input-grid three">${field(T('sat'),profile.extra.sat,'data-model="extra.sat" type="number" min="400" max="1600" step="1"')}${field('SAT Math (200–800)',profile.extra.satMath,'data-model="extra.satMath" type="number" min="200" max="800" step="1"')}${field('SAT Reading & Writing (200–800)',profile.extra.satReadingWriting,'data-model="extra.satReadingWriting" type="number" min="200" max="800" step="1"')}</div></div>`:''}${selectedEvidence.has('act')?`<div class="language-block"><h3>ACT</h3><div class="input-grid">${field(T('act'),profile.extra.act,'data-model="extra.act" type="number" min="1" max="36" step="1"')}${field('ACT Writing (2–12)',profile.extra.actWriting,'data-model="extra.actWriting" type="number" min="2" max="12" step="1"')}</div></div>`:''}${selectedEvidence.has('ap')?`<div class="language-block"><h3>AP</h3>${profile.extra.ap.map((a,index)=>`<div class="input-grid" data-ap="${index}">${field('AP '+T('subject'),a.name,'data-apfield="name" maxlength="150"')}${field('AP '+T('score')+' (1–5)',a.score,'data-apfield="score" type="number" min="1" max="5" step="1"')}<button type="button" class="text-link" data-remove-ap="${index}">${T('remove')}</button></div>`).join('')}<button type="button" class="text-link" data-add-ap>${T('addAp')}</button></div>`:''}${selectedEvidence.has('universityYears')?`<div class="language-block"><h3>${T('otherEvidence')}</h3>${field(T('universityYears'),profile.extra.universityYears,'data-model="extra.universityYears" type="number" min="0" max="8" step="0.5"')}</div>`:''}`;}
function competitionsHtml(){return `${profile.competitions.length===0?`<p class="field-hint">${T('noCompetition')}</p>`:''}${profile.competitions.map((c,index)=>`<div class="competition-row" data-competition="${index}"><button type="button" class="remove-row" data-remove-competition="${index}" aria-label="${T('remove')}">×</button>${field(T('competitionName'),c.name,'data-cfield="name" maxlength="300"')}<div class="input-grid">${field(T('award'),c.award,'data-cfield="award" maxlength="300"')}${field(T('year'),c.year,'data-cfield="year" type="number" min="1990" max="2035" step="1"')}</div>${field(T('organizer'),c.organizer,'data-cfield="organizer" maxlength="300"')}</div>`).join('')}<button type="button" class="tool-button" data-add-competition>${T('addCompetition')}</button>`;}

function progressHtml(){return `<nav class="wizard-progress" aria-label="${T('title')}"><ol>${[1,2,3].map(n=>`<li class="${wizardStep===n?'current':wizardStep>n?'complete':''}"${wizardStep===n?' aria-current="step"':''}><span>${n}</span><b>${T('step'+n)}</b></li>`).join('')}</ol></nav>`;}
function toolsHtml(){return `<details class="more-tools"><summary>${T('more')} <span aria-hidden="true">⌄</span></summary><div class="profile-tools"><p>${T('moreHint')}</p><button type="button" class="tool-button" id="save-profile">${T('save')}</button><button type="button" class="tool-button" id="export-profile">${T('export')}</button><button type="button" class="tool-button" id="import-profile">${T('import')}</button><button type="button" class="tool-button danger" id="clear-profile">${T('clear')}</button><input type="file" id="profile-file" accept="application/json,.json" hidden></div></details>`;}
function selectionHtml(){return `<section class="form-section evidence-selection"><h2 id="wizard-heading" tabindex="-1">${T('selectionTitle')}</h2><p class="form-section-intro">${T('selectionIntro')}</p><fieldset><legend>${T('academics')}</legend><div class="qualification-options">${TYPES.map(type=>`<label class="qualification-option"><input type="checkbox" data-evidence="${type}"${selectedEvidence.has(type)?' checked':''}>${T(type)}</label>`).join('')}</div></fieldset><fieldset><legend>${T('language')} / ${T('additional')}</legend><div class="qualification-options optional-options">${OPTIONAL_EVIDENCE.map(type=>`<label class="qualification-option"><input type="checkbox" data-evidence="${type}"${selectedEvidence.has(type)?' checked':''}>${T({sat:'sat',act:'act',ap:'ap',universityYears:'otherEvidence'}[type]||type)}</label>`).join('')}</div></fieldset><p class="selection-error" id="selection-error" role="alert" hidden>${T('chooseRequired')}</p><button type="button" class="button" id="wizard-next">${T('next')} <span aria-hidden="true">→</span></button></section>`;}
function entryHtml(){const languageSelected=['hsk','ielts','csca','sat','act','ap','universityYears'].some(k=>selectedEvidence.has(k));return `<form id="profile-form" class="profile-form"><h2 id="wizard-heading" class="entry-title" tabindex="-1">${T('step2')}</h2><div class="profile-settings">${field(T('target'),profile.targetYear,'data-model="targetYear" type="number" min="2026" max="2035" step="1" required')}${select(T('teaching'),profile.teaching,[['any',T('any')],['zh',T('zh')],['en',T('en')]],'data-model="teaching"')}</div><section id="academic-section" class="form-section"><div class="form-section-heading"><h2>${T('academics')}</h2></div><p class="form-section-intro">${T('academicIntro')}</p>${TYPES.filter(type=>selectedEvidence.has(type)).map(academicBlock).join('')}</section>${languageSelected?`<section id="language-section" class="form-section"><div class="form-section-heading"><h2>${T('language')} / ${T('additional')}</h2></div><p class="form-section-intro">${T('languageIntro')}</p>${selectedEvidence.has('hsk')?hskFields():''}${selectedEvidence.has('ielts')?ieltsFields():''}${extraFields()}</section>`:''}${selectedEvidence.has('competitions')?`<section id="competition-section" class="form-section"><div class="form-section-heading"><h2>${T('competitions')}</h2></div><p class="form-section-intro">${T('competitionsIntro')}</p>${competitionsHtml()}</section>`:''}<div id="validation" class="validation-box" role="alert" hidden></div><div class="wizard-actions"><button type="button" class="text-link" id="wizard-back">← ${T('previous')}</button><button class="button" type="submit">${T('match')} <span aria-hidden="true">→</span></button></div></form>`;}
function renderMatchPage(){
 $('#page').innerHTML=`<section class="portal-hero"><p class="eyebrow">${T('eyebrow')}</p><h1>${T('title')}</h1><p>${T('intro')}</p>${countryPills()}</section><div class="privacy-bar"><span>◇</span><span>${T('privacy')}</span></div>${progressHtml()}<div class="wizard-toolbar">${wizardStep===3?`<button type="button" class="text-link" id="edit-scores">← ${T('editScores')}</button>`:'<span></span>'}${toolsHtml()}</div>${wizardStep===1?selectionHtml():wizardStep===2?entryHtml():''}<section id="matching-results" class="results-section" ${wizardStep===3?'':'hidden'}></section>`;
 bindForm();
 if(wizardStep===3)updateMatches(false);
 document.documentElement.classList.add('match-ready');
 document.querySelector('.match-loading')?.setAttribute('hidden','');
}
function goStep(next){readProfile();wizardStep=next;renderMatchPage();const heading=$('#wizard-heading')||$('#matching-results h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}}

function bindForm(){
 $$('[data-evidence]').forEach(input=>input.addEventListener('change',()=>{const type=input.dataset.evidence;if(input.checked)selectedEvidence.add(type);else selectedEvidence.delete(type);profile.academics=TYPES.filter(type=>selectedEvidence.has(type)).map(type=>drafts[type]);$('#selection-error').hidden=true;}));
 $('#wizard-next')?.addEventListener('click',()=>{if(!TYPES.some(type=>selectedEvidence.has(type))){$('#selection-error').hidden=false;$('#selection-error').scrollIntoView({block:'center'});return;}goStep(2);});
 $('#wizard-back')?.addEventListener('click',()=>goStep(1));
 $('#edit-scores')?.addEventListener('click',()=>goStep(2));

 $('#profile-form')?.addEventListener('submit',event=>{event.preventDefault();readProfile();if(showValidation(true)){$('#validation').scrollIntoView({behavior:'smooth',block:'center'});return;}hasMatched=true;goStep(3);toast(T('newResults'));});
 $('#profile-form')?.addEventListener('input',()=>{readProfile();updateSummary();});
 $('#profile-form')?.addEventListener('change',event=>{
  readProfile();const input=event.target;
  if(input.matches('[data-enable],[data-sfield="key"],[data-sfield="stage"],[data-model="hsk.level"]')){renderMatchPage();return;}
  if(input.matches('[data-sfield="max"]')){const row=input.closest('[data-subject]');row.querySelector('[data-sfield="score"]').max=input.value;}
  if(hasMatched&&wizardStep===3)updateMatches(false);
 });
 $$('[data-add-subject]').forEach(button=>button.addEventListener('click',()=>{readProfile();const a=drafts[button.dataset.addSubject];if(a.subjects.length>=30)return;a.subjects.push({key:'other',name:'',score:'',max:100,stage:'A-Level',grade:''});renderMatchPage();}));
 $$('[data-remove-subject]').forEach(button=>button.addEventListener('click',()=>{readProfile();drafts[button.dataset.type].subjects.splice(Number(button.dataset.removeSubject),1);renderMatchPage();}));
 $$('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
  readProfile();const a=drafts.matriculation,keys=button.dataset.preset==='science'?['physics','chemistry','biology']:['geography','history','economics'];
  for(let index=3;index<Math.min(6,a.subjects.length);index++){if(num(a.subjects[index].score)===null){const key=keys[index-3];a.subjects[index]={key,name:names[key],score:'',max:100};}}
  renderMatchPage();toast(T('replaceSubjects'));
 }));
 $('[data-add-competition]')?.addEventListener('click',()=>{readProfile();if(profile.competitions.length>=20)return;profile.competitions.push({name:'',award:'',organizer:'',year:''});renderMatchPage();});
 $$('[data-remove-competition]').forEach(button=>button.addEventListener('click',()=>{readProfile();profile.competitions.splice(Number(button.dataset.removeCompetition),1);renderMatchPage();}));
 $('[data-add-ap]')?.addEventListener('click',()=>{readProfile();if(profile.extra.ap.length>=20)return;profile.extra.ap.push({name:'',score:''});renderMatchPage();});
 $$('[data-remove-ap]').forEach(button=>button.addEventListener('click',()=>{readProfile();profile.extra.ap.splice(Number(button.dataset.removeAp),1);renderMatchPage();}));
 $('#save-profile').addEventListener('click',()=>{readProfile();if(showValidation())return;try{localStorage.setItem('pyinnyar-profile-v1',JSON.stringify(activeProfile()));toast(T('saved'));}catch{toast(T('localUnavailable'));}});
 $('#export-profile').addEventListener('click',()=>{readProfile();if(showValidation())return;download(JSON.stringify(activeProfile(),null,2),'pyinnyar-profile.json','application/json');});
 $('#import-profile').addEventListener('click',()=>$('#profile-file').click());
 $('#profile-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>200000)throw new Error('size');const candidate=JSON.parse(await file.text());if(candidate.version!==1||validateProfile(candidate).length)throw new Error('validation');profile={...EMPTY_PROFILE(),...candidate};TYPES.forEach(type=>drafts[type]=defaultAcademic(type));profile.academics.forEach(a=>drafts[a.type]=a);selectedEvidence=inferEvidence(profile);wizardStep=1;hasMatched=false;renderMatchPage();toast(T('imported'));}catch{toast(T('invalidImport'));}});
 $('#clear-profile').addEventListener('click',()=>$('#clear-dialog').showModal());
}
let liveTimer;
function updateSummary(){if($('#profile-summary'))$('#profile-summary').innerHTML=summaryHtml();$$('[data-academic-summary]').forEach(el=>el.innerHTML=academicSummary(drafts[el.dataset.academicSummary]));}
function showValidation(requireAcademic=false){
 const codes=validateProfile(activeProfile());const messages=[];
 if(requireAcademic&&profile.academics.length===0)messages.push(T('noAcademic'));
 codes.forEach(code=>messages.push(['hskScore','hskOverall'].includes(code)?T('hskError'):code==='matricSubjects'?T('matricCountError'):['score','max','gedSubjects'].includes(code)?T('scoreError'):['ieltsScore','ieltsOverall'].includes(code)?T('ieltsError'):['grade','stage'].includes(code)?T('gradeError'):code==='duplicateSubject'?T('duplicateError'):T('genericError')));
 if(!$('#validation')){if(messages.length)toast(messages[0]);return messages.length>0;}
 $('#validation').hidden=messages.length===0;$('#validation').innerHTML=`<strong>${T('validation')}</strong><ul>${[...new Set(messages)].map(message=>`<li>${esc(message)}</li>`).join('')}</ul>`;
 return messages.length>0;
}
function updateMatches(announce){
 if(showValidation(true)){$('#matching-results').hidden=false;$('#matching-results').innerHTML=`<div class="empty-state">${T('validation')}</div>`;results=null;return false;}
 results=matchProfile(activeProfile(),data.schools.filter(s=>!s.military));renderResults();if(announce)toast(T('newResults'));return true;
}
function download(text,filename,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([type.startsWith('text/')?'\uFEFF':'',text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}

function schoolName(s){return lang==='zh'?s.zh:s.en;}
function routeName(r){return r.label?.[lang]||r.label?.en||r.label?.zh||r.id;}
function sourcesHtml(sources){return `<ul class="source-links">${(sources||[]).map(s=>`<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title||s.url)} ↗</a><small>${T('cycle')}: ${esc(s.year||'—')} · ${T('checked')}: ${esc(s.checkedAt||CHECKED_DATE)}</small></li>`).join('')}</ul>`;}
function checkText(c){
 const req=c.required,actual=c.actual??T('notProvided'),q=c.qualification?T(c.qualification):'';
 const comparison=`${T('required')}: ${c.exclusive?'>':'≥'} ${req??'—'} · ${T('actual')}: ${actual}`;
 switch(c.code){
  case 'recognition':return `${q}: ${c.kind==='pass'?T('accepted'):T('conditional')}`;
  case 'recognitionUnknown':return `${q}: ${T('unknownQualification')}`;
  case 'notAccepted':return `${q}: ${T('rejected')}`;
  case 'qualification':return `${T('academics')}: ${q} — ${T('notProvided')}`;
  case 'qualificationUnknown':return T('unknownQualification');
  case 'graduation':return `${q}: ${L('需要最终毕业证或按学校规定补交','Final qualification needed, or submission under university rules','နောက်ဆုံးကျောင်းပြီးလက်မှတ် လိုအပ်ပါတယ်')}`;
  case 'transcript':return `${q}: ${T('missingScores')}`;
  case 'years':return `${T('schoolYears')} — ${comparison}`;
  case 'newMyanmar':return L('本科资格需2024起新十二年制；旧制只能考虑衔接路径','Bachelor eligibility requires the new 12-year Myanmar qualification from 2024; legacy qualifications need a progression route','ဘွဲ့ကြိုအတွက် ၂၀၂၄ မှစ၍ ၁၂ နှစ်စနစ်သစ် လိုအပ်ပြီး စနစ်ဟောင်းသည် ဆက်လက်တက်ရောက်ရေးလမ်းကြောင်း လိုပါတယ်');
  case 'academicAverage':return `${T('average')} — ${comparison}`;
  case 'reportedAverage':return `${L('学校认定的综合平均百分比','School-certified overall percentage','ကျောင်းအတည်ပြု ပျမ်းမျှရာခိုင်နှုန်း')} — ${comparison}`;
  case 'subjectEach':return `${L('各科最低分','Minimum subject score','တစ်ဘာသာချင်း အနည်းဆုံးအမှတ်')} — ${comparison}`;
  case 'gedEach':return `GED ${L('每科','each subject','တစ်ဘာသာချင်း')} — ${comparison}`;
  case 'gedTotal':return `GED ${T('total')} — ${comparison}`;
  case 'gedSubject':return `GED ${T(c.subject==='science'?'scienceSubject':c.subject)} — ${comparison}`;
  case 'alevelCount':return `A-Level ${T('subject')} ≥ ${req}, ${T('grade')} ≥ ${c.grade||'E'} · ${T('actual')}: ${actual}`;
  case 'alevelGrades':return `A-Level ${L('最佳科目等级组合','best-subject grade combination','အကောင်းဆုံးဘာသာရပ်အဆင့်တွဲ')}: ${req} · ${T('actual')}: ${actual}`;
  case 'alevelSubject':return `A-Level ${T(c.subject)}: ${req} · ${T('actual')}: ${actual}`;
  case 'alevelAnySubject':return `A-Level ${L('至少满足一个科目条件','at least one subject condition','ဘာသာရပ်လိုအပ်ချက် အနည်းဆုံးတစ်ခု')}: ${req}`;
  case 'alevelPoints':return `A-Level ${L('按学校公布的计分表','university-specific points','ကျောင်းသတ်မှတ်အမှတ်')} — ${comparison}`;
  case 'predicted':return L('预估成绩仍需学校确认并补交最终成绩','Predicted results need university approval and final results later','မျှော်မှန်းအမှတ်များကို ကျောင်းအတည်ပြုရန်နှင့် နောက်ဆုံးအမှတ်ဖြည့်ရန် လိုပါတယ်');
  case 'hsk':return `HSK ${T('required')}: ${req} · ${T('actual')}: ${actual}`;
  case 'hskLevel':return `HSK ${T('level')} — ${comparison}`;
  case 'hskTotal':return `HSK ${c.level} ${T('total')} — ${comparison}`;
  case 'hskComponent':return `HSK ${T(c.component)} — ${comparison}`;
  case 'higherHsk':return L('更高HSK等级的替代总分未在该规则中明确，需确认','A higher HSK level’s replacement threshold is not specified here; confirm with the university','HSK အဆင့်ပိုမြင့်မှု၏ အစားထိုးအမှတ် မဖော်ပြထား၍ အတည်ပြုပါ');
  case 'hskAdvanced':return L('HSK七至九级不自动换算为HSK五/六级条件','HSK 7–9 is not automatically converted to HSK 5/6 entry conditions','HSK ၇–၉ ကို HSK ၅/၆ လိုအပ်ချက်အဖြစ် အလိုအလျောက် မပြောင်းပါ');
  case 'ieltsOverall':return `IELTS ${T('overall')} — ${comparison}`;
  case 'ieltsComponent':return `IELTS ${T(c.component)} — ${comparison}`;
  case 'ieltsAcademic':return L('该规则需要IELTS Academic，General Training不能替代','This route needs IELTS Academic; General Training cannot replace it','ဤလမ်းကြောင်းအတွက် IELTS Academic လိုအပ်ပြီး General Training ဖြင့် မအစားထိုးနိုင်ပါ');
  case 'ieltsThresholdUnknown':return L('官网要求英语证明，但没有公开统一IELTS最低分','English evidence is required, but no common IELTS minimum is published','အင်္ဂလိပ်အထောက်အထား လိုအပ်သော်လည်း IELTS အနည်းဆုံးအမှတ် မထုတ်ပြန်ထားပါ');
  case 'hskDate':case 'ieltsDate':return `${c.code==='hskDate'?'HSK':'IELTS'}: ${L('需考试日期，证书有效期','test date needed; validity','စာမေးပွဲရက်စွဲလို၊ သက်တမ်း')} ${req} ${L('个月','months','လ')}`;
  case 'validAtApplication':return L(`证书需在实际申请时仍处于${req}个月有效期，须按申请日期再核对`,`Certificate must remain valid within ${req} months on the actual application date; recheck then`,`လျှောက်ထားရက်တွင် ${req} လသက်တမ်းအတွင်း ဖြစ်ရန် ပြန်စစ်ပါ`);
  case 'csca':return `CSCA ${T(c.subject)} — ${c.required!==undefined?comparison:c.kind==='pass'?L('已录入；学校未公布统一最低分','entered; no common minimum published','ဖြည့်ထား၊ အနည်းဆုံးအမှတ်မဖော်ပြ'):L('需要录入该科成绩；没有自设及格线','score required; no invented cutoff','ဤဘာသာအမှတ် လိုအပ်၊ စိတ်ကြိုက်အောင်မှတ် မသတ်မှတ်')}`;
  case 'cscaSubjectUnknown':return L('CSCA必需，但选考科目须按具体专业再确认','CSCA is required; confirm papers for your exact programme','CSCA လိုအပ်ပြီး သင်တန်းအလိုက် ဘာသာရပ်ကို အတည်ပြုပါ');
  case 'apOrAlevel':return L(`另需≥${req}科AP（每科≥${c.minimum}）或≥${req}科完整A-Level，科目先修要求另审`,`Additionally ≥${req} AP subjects (each ≥${c.minimum}) or ≥${req} full A-Level subjects; prerequisites need review`,`ထပ်မံ AP ${req} ဘာသာ (တစ်ဘာသာ ≥${c.minimum}) သို့မဟုတ် A-Level ${req} ဘာသာလိုပြီး ဘာသာရပ်လိုအပ်ချက် အတည်ပြုပါ`);
  case 'universityYears':return `${T('universityYears')} — ${comparison}`;
  case 'apCount':return `AP ≥${req} ${T('subject')}, ${T('score')} ≥${c.minimum} · ${T('actual')}: ${actual}`;
  case 'sat':case 'satMath':case 'satReadingWriting':case 'act':case 'actWriting':return `${{sat:'SAT',satMath:'SAT Math',satReadingWriting:'SAT Reading & Writing',act:'ACT',actWriting:'ACT Writing'}[c.code]} — ${comparison}`;
  case 'cycle':return L(`${c.year}年规则仅作${c.target}年规划参考，需核实新年度简章`,`${c.year} rules support ${c.target} planning; confirm the new prospectus`,`${c.year} စည်းမျဉ်းကို ${c.target} စီစဉ်ရန်သာသုံးပြီး ကြေညာချက်သစ်ကို အတည်ပြုပါ`);
  case 'custom':return typeof c.text==='object'?(c.text[lang]||c.text.en||c.text.zh):c.text;
  case 'unverified':return T('noRules');
  default:return T('matchingScope');
 }
}
function checkList(checks){return `<ul class="match-checks">${checks.map(c=>`<li class="check-${c.kind}"><span class="check-symbol">${{pass:'✓',gap:'×',missing:'○',review:'◇'}[c.kind]}</span><span>${esc(checkText(c))}</span></li>`).join('')}</ul>`;}

function additionalRequirements(r){return (r.additional||[]).map(req=>{
 if(req.type==='universityYears')return `<p class="rule-line">${T('universityYears')} ≥${req.min}</p>`;
 if(req.type==='apOrAlevel')return `<p class="rule-line">AP ≥${req.count} ${T('subject')} (${T('score')} ≥${req.minScore}) ${L('或','or','သို့မဟုတ်')} A-Level ≥${req.count} ${T('subject')}</p>`;
 if(req.type==='standardisedAny')return `<p class="rule-line">${req.options.map(o=>[`AP ≥${o.apCount} ${T('subject')} (${T('score')} ≥${o.apMin})`,o.satReadingWriting?`SAT Reading & Writing ≥${o.satReadingWriting}`:'',o.satMath?`SAT Math ≥${o.satMath}`:'',o.act?`ACT ≥${o.act}`:'',o.actWriting?`ACT Writing ≥${o.actWriting}`:''].filter(Boolean).join(' + ')).join(' '+L('或','OR','သို့မဟုတ်')+' ')}</p>`;
 return '';
}).join('');}
function requirementHtml(s,r){
 const qualifications=r.qualifications||[];
 return `<div class="route-detail"><h4>${esc(routeName(r))} <span class="tag">${esc(r.cycle||'—')}</span></h4><p class="rule-note">${esc(T(r.level==='foundation'?'foundation':r.level==='diploma'?'diplomaLevel':'bachelorLevel'))} · ${T('programScope')}</p><table class="requirement-table"><tbody>${TYPES.map(type=>{const q=qualifications.find(q=>q.type===type);const status=q?.mode;return `<tr><td>${esc(T(type))}</td><td>${T(status==='accepted'?'accepted':status==='rejected'?'rejected':status==='review'?'conditional':'unknownQualification')}${q?.minAverage!==undefined?`<br>${T('average')} ≥${q.minAverage}%`:''}${q?.minYears?`<br>${T('schoolYears')} ≥${q.minYears}`:''}${q?.newMyanmarOnly?`<br>${L('仅2024起新十二年制本科资格','New 12-year Myanmar qualification from 2024 only','၂၀၂၄ မှစ၍ ၁၂ နှစ်စနစ်သစ်သာ')}`:''}${q?.ged?`<br>GED ${L('每科','each subject','တစ်ဘာသာချင်း')} ≥${q.ged.minEach}${q.ged.minTotal?`; ${T('total')} ≥${q.ged.minTotal}`:''}`:''}${q?.alevel?.count?`<br>A-Level ≥${q.alevel.count} ${T('subject')} ${q.alevel.minGrade||'E'}`:''}${q?.alevel?.grades?`<br>A-Level ${q.alevel.grades.join(' / ')}`:''}${q?.alevel?.points?`<br>A-Level ${T('score')} ≥${q.alevel.points.minimum} (${Object.entries(q.alevel.points.map).map(([g,v])=>g+'='+v).join(', ')}${q.alevel.points.best?'; '+L('最佳','best','အကောင်းဆုံး')+' '+q.alevel.points.best:''}${q.alevel.points.aStarBonus?'; A* '+L('额外最多','bonus max','အပိုအများဆုံး')+' '+q.alevel.points.aStarBonus:''})`:''}${q?.alevel?.subjects?`<br>${q.alevel.subjects.map(v=>T(v.key)+' ≥'+v.grade).join(' · ')}`:''}${q?.alevel?.anySubjects?`<br>${L('任一','One of','တစ်ခုခု')}: ${q.alevel.anySubjects.map(v=>T(v.key)+' ≥'+v.grade).join(' / ')}`:''}${q?.ged?.subjects?`<br>${Object.entries(q.ged.subjects).map(([k,v])=>T(k==='science'?'scienceSubject':k)+' ≥'+v).join(' · ')}`:''}</td></tr>`;}).join('')}</tbody></table><div class="rule-lines">${languageRequirement(r.language)}${additionalRequirements(r)}${r.csca?`<p class="rule-line">CSCA: ${r.csca.subjects.map(k=>T(k)).join(' / ')||T('needs')}${r.csca.minimum!==undefined?` ≥${r.csca.minimum}`:''}${r.csca.subjectsUnknown?' · '+T('needs'):''}</p>`:''}</div>${(r.reviewNotes||[]).length?`<p class="rule-note">${r.reviewNotes.map(n=>esc(n[lang]||n.en||n.zh||n)).join('<br>')}</p>`:''}${r.rawNotes?.length?`<details class="official-research"><summary>${L('原文研究说明（中文 / 英文）','Research notes (Chinese / English)','သုတေသနမှတ်စု (တရုတ် / အင်္ဂလိပ်)')}</summary><p class="rule-note">${(lang==='zh'?r.rawNotes:r.rawNotesEn||r.rawNotes).map(esc).join('<br>')}</p></details>`:''}${sourcesHtml(r.sources||s.sources)}</div>`;
}
function languageRequirement(rule){if(!rule)return `<p>${T('needs')}</p>`;if(rule.type==='anyOf'||rule.type==='allOf')return `<p class="rule-note">${L(rule.type==='anyOf'?'满足任一语言证明路径':'以下语言要求均需核对',rule.type==='anyOf'?'One language evidence route':'Check every language requirement',rule.type==='anyOf'?'ဘာသာစကားလမ်းကြောင်းတစ်ခု':'ဘာသာစကားလိုအပ်ချက်အားလုံး')}</p>${rule.options.map(languageRequirement).join('')}`;if(rule.type==='hsk'){if(rule.alternatives)return '<p class="rule-note">'+L('满足任一HSK路径','One of these HSK routes','HSK လမ်းကြောင်းတစ်ခုခု')+'</p>'+rule.alternatives.map(r=>languageRequirement({type:'hsk',validMonths:rule.validMonths,...r})).join('');return `<p class="rule-line">HSK ${rule.level}${rule.total!==undefined?` ${rule.exclusive?'>':'≥'}${rule.total}`:''}${Object.entries(rule.sections||{}).map(([k,v])=>` · ${T(k)} ${v.exclusive?'>':'≥'}${v.minimum}`).join('')}${rule.validMonths?' · '+L('有效期','validity','သက်တမ်း')+' '+rule.validMonths+' '+L('个月','months','လ'):''}</p>`;}if(rule.type==='ielts')return `<p class="rule-line">IELTS Academic ${rule.overall!==undefined?'≥'+rule.overall:T('needs')}${['listening','reading','writing','speaking'].filter(k=>rule[k]!==undefined||rule.minEach!==undefined).map(k=>' · '+T(k)+' '+(rule.sectionExclusive?'>':'≥')+(rule[k]??rule.minEach)).join('')}${rule.validMonths?' · '+L('有效期','validity','သက်တမ်း')+' '+rule.validMonths+' '+L('个月','months','လ'):''}</p>`;if(rule.type==='sat')return `<p class="rule-line">SAT ≥${rule.total}</p>`;return `<p class="rule-line">${rule.type==='none'?L('此路径没有单独的语言数字门槛','No separate language score threshold on this route','ဤလမ်းကြောင်းတွင် ဘာသာစကားအနည်းဆုံးအမှတ် သီးခြားမဖော်ပြ'):T('needs')}</p>`;}

function schoolCard(s,result){
 const status=result?.status||(s.routes?.length?'official':'catalogOnly');const tag=s.military?T('military'):s.tags?.map(tag=>T(tag)).join(' · ')||T('coverage');
 const sources=s.sources||[];
 return `<article class="school-card"><div class="school-card-main"><div class="school-meta"><span>${T(s.country)}</span><span>·</span><span>${esc(s.city||T('unknownCity'))}</span><span class="tag">${esc(tag)}</span></div><h3>${esc(schoolName(s))}</h3>${lang==='zh'?`<p class="school-english">${esc(s.en)}</p>`:`<p class="school-english">${esc(s.zh)}</p>`}<span class="status-badge status-${status}">${T(status)}</span>${result?.route?`<p class="route-preview">${T('route')}: <strong>${esc(routeName(result.route))}</strong><br>${esc(T(result.route.level==='foundation'?'foundation':result.route.level==='diploma'?'diplomaLevel':'bachelorLevel'))} · ${result.route.cycle||'—'}</p>`:''}${!result&&s.routes?.length?`<p class="route-preview">${s.routes.length} ${T('routesCount')}</p>`:''}<button type="button" class="consult-card" data-consult data-consult-context="${esc(schoolName(s))}" data-consult-country="${s.country}">${L('免费咨询','Free consultation','အခမဲ့ ဆွေးနွေးရန်')} ↗</button></div><details class="school-details"><summary>${T('details')}</summary><div class="school-details-body">${result?`<p class="rule-note">${T('matchingScope')}</p>${checkList(result.checks)}`:''}${result?.alternatives?.length>1?`<h4>${T('routes')}</h4>${result.alternatives.slice(1).map(alt=>`<details class="official-research"><summary>${esc(routeName(alt.route))} · ${T(alt.status)}</summary>${checkList(alt.checks)}</details>`).join('')}`:''}${!s.routes?.length?`<p>${T('noRules')}</p>`:s.routes.map(r=>requirementHtml(s,r)).join('')}<h4>${T('sources')}</h4>${sourcesHtml(sources)}${!sources.length?`<p class="rule-note">${T('noRules')}</p>`:''}<a class="external-reference" href="scholarships.html?country=${s.country}&school=${encodeURIComponent(s.id)}">${L('查看该校奖学金','View university scholarships','ဤတက္ကသိုလ် ပညာသင်ဆုကြည့်ပါ')} ↗</a> <a class="external-reference" href="${esc(safeUrl(s.website||s.admissionsUrl))}" target="_blank" rel="noopener noreferrer">${L('学校官网','University website','ကျောင်းဝက်ဘ်ဆိုက်')} ↗</a></div></details></article>`;
}

function filterHtml(isMatch){return `<div class="filters">${field(T('search'),filters.query,`id="search-school" type="search" placeholder="${esc(T('searchPlaceholder'))}"`)}${select(T('allCountries'),filters.country,[['all',T('allCountries')],...COUNTRIES.map(c=>[c,T(c)])],'id="filter-country"')}${isMatch?select(T('allStatus'),filters.status,[['assessed',L('已核实规则的结果','Results with researched rules','စစ်ဆေးထားသောစည်းမျဉ်းပါရလဒ်')],['all',T('allStatus')],...['met','review','incomplete','gap','unknown'].map(s=>[s,T(s)])],'id="filter-status"'):select(T('filterClassification'),filters.category,[['all',T('allClasses')],['985','985'],['211','211'],['official',T('official')],['catalogOnly',T('catalogOnly')]],'id="filter-category"')}</div>`;}
function filterList(items,isMatch){const query=filters.query.trim().toLowerCase();return items.filter(item=>{const s=isMatch?item.school:item;return (filters.country==='all'||s.country===filters.country)&&(!query||`${s.zh} ${s.en} ${s.city}`.toLowerCase().includes(query))&&(isMatch?(filters.status==='all'||filters.status==='assessed'&&item.status!=='unknown'||item.status===filters.status):filters.category==='all'||filters.category==='985'&&s.tags.includes('985')||filters.category==='211'&&s.tags.includes('211')||filters.category==='official'&&s.routes.length>0||filters.category==='catalogOnly'&&s.routes.length===0);});}
function bindFilters(isMatch){
 $('#search-school').addEventListener('input',event=>{filters.query=event.target.value;limit=20;renderSchoolList(isMatch);});
 $('#filter-country').addEventListener('change',event=>{filters.country=event.target.value;limit=20;renderSchoolList(isMatch);});
 $(isMatch?'#filter-status':'#filter-category').addEventListener('change',event=>{filters[isMatch?'status':'category']=event.target.value;limit=20;renderSchoolList(isMatch);if(isMatch)$$('[data-status]').forEach(b=>b.classList.toggle('active',b.dataset.status===filters.status));});
}
function renderSchoolList(isMatch){
 const list=filterList(isMatch?results:data.schools,isMatch);
 $('#list-count').textContent=`${list.length} ${T('count')}`;
 $('#school-list').innerHTML=list.length?list.slice(0,limit).map(item=>schoolCard(isMatch?item.school:item,isMatch?item:null)).join(''):`<div class="empty-state">${T('noResults')}</div>`;
 $('#more-holder').innerHTML=list.length>limit?`<button class="show-more" id="show-more">${L('显示更多学校','Show more universities','ကျောင်းများထပ်ကြည့်ရန်')} (${Math.min(limit,list.length)} / ${list.length})</button>`:'';
 $('#show-more')?.addEventListener('click',()=>{limit+=20;renderSchoolList(isMatch);});
}
function renderResults(){
 const section=$('#matching-results');section.hidden=false;
 const statuses=['met','review','incomplete','gap','unknown'];
 section.innerHTML=`<p class="eyebrow">${T('resultsEyebrow')}</p><h2>${T('resultsTitle')}</h2><p class="result-explanation">${T('resultNote')}</p><div class="result-stats">${statuses.map(status=>`<button type="button" class="result-stat ${filters.status===status?'active':''}" data-status="${status}"><strong>${results.filter(r=>r.status===status).length}</strong><span>${T(status)}</span></button>`).join('')}</div>${filterHtml(true)}<div class="filter-footer"><span id="list-count"></span><span>${T('checked')}: ${CHECKED_DATE}</span></div><div class="school-list" id="school-list"></div><div id="more-holder"></div><div class="result-bottom"><button type="button" class="button" id="export-results">${T('exportResults')} ↓</button><a class="text-link" href="universities.html">${T('fullCatalogue')}</a></div><p class="rule-note">${T('awardSummary')}: ${activeProfile().competitions.length}. ${T('competitionsIntro')}</p><section class="result-consultation"><div><h3>${T('resultCtaTitle')}</h3><p>${T('resultCtaText')}</p></div>${messengerHtml(lang)}</section>`;
 bindFilters(true);renderSchoolList(true);
 $$('[data-status]').forEach(button=>button.addEventListener('click',()=>{filters.status=button.dataset.status;limit=20;renderResults();}));
 $('#export-results').addEventListener('click',exportReport);
}
function coverageHtml(){const stats=COUNTRIES.map(country=>{const list=data.schools.filter(s=>s.country===country);return `<div class="coverage-stat"><strong>${list.length}</strong><span>${T(country)}</span><small>${list.filter(s=>s.routes.length).length} ${T('verified')}</small></div>`;}).join('');return `<div class="coverage-panel"><p>${T('coverageIntro')}</p><div class="coverage-stats">${stats}</div><p>${T('coverageNotice')}</p></div>`;}
function renderDirectory(){
 $('#page').innerHTML=`<section class="portal-hero"><p class="eyebrow">${T('directoryEyebrow')}</p><h1>${T('directoryTitle')}</h1><p>${T('directoryIntro')}</p>${countryPills()}</section>${coverageHtml()}<p class="directory-note">${T('catalogNote')}</p>${filterHtml(false)}<div class="filter-footer"><span id="list-count"></span><a class="text-link" href="match.html">${T('start')}</a></div><div class="school-list" id="school-list"></div><div id="more-holder"></div><p class="directory-note">${T('checked')}: ${CHECKED_DATE} · <a class="external-reference" href="${esc(data.catalogSources?.[0]?.url||'https://www.moe.gov.cn/')}" target="_blank" rel="noopener noreferrer">${L('中国目录官方来源','Official Chinese directory source','တရုတ်တရားဝင်စာရင်းရင်းမြစ်')} ↗</a></p>`;
 $('#page').insertAdjacentHTML('beforeend',`<details class="official-research directory-note"><summary>${T('paper')}</summary>${sourcesHtml(data.examSources)}</details>`);
 bindFilters(false);renderSchoolList(false);
}
function exportReport(){const report={title:T('reportTitle'),language:lang,checkedAt:CHECKED_DATE,profile:activeProfile(),notice:T('resultNote'),results:results.filter(r=>r.status!=='unknown').map(r=>({school:schoolName(r.school),country:T(r.school.country),status:T(r.status),route:r.route?routeName(r.route):null,level:r.route?.level,cycle:r.route?.cycle,reasons:r.checks.map(c=>({status:c.kind,reason:checkText(c)})),sources:r.route?.sources||r.school.sources}))};download(JSON.stringify(report,null,2),'pyinnyar-matching-report.json','application/json');}

$$('[data-lang]').forEach(button=>button.addEventListener('click',()=>{readProfile();applyLanguage(button.dataset.lang);}));
$('.menu-toggle').addEventListener('click',()=>{const open=$('.nav').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));});
$('#cancel-clear').addEventListener('click',()=>$('#clear-dialog').close());
$('#confirm-clear').addEventListener('click',()=>{profile=EMPTY_PROFILE();TYPES.forEach(type=>drafts[type]=defaultAcademic(type));try{localStorage.removeItem('pyinnyar-profile-v1');}catch{}hasMatched=false;results=null;selectedEvidence=new Set();wizardStep=1;$('#clear-dialog').close();renderMatchPage();toast(T('cleared'));});
applyLanguage(lang);
try{const response=await fetch('data/universities.json');if(!response.ok)throw new Error('load');data=await response.json();if(!Array.isArray(data.schools))throw new Error('format');if(page==='match')renderMatchPage();else renderDirectory();}catch{$('#page').innerHTML=`<div class="empty-state">${T('loadError')} <button type="button" id="reload-page" class="tool-button">${T('reload')}</button></div>`;document.documentElement.classList.add('match-ready');document.querySelector('.match-loading')?.setAttribute('hidden','');$('#reload-page').addEventListener('click',()=>location.reload());}
