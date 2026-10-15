import {SITE_COPY} from './site-copy.mjs';
import {CONSULTATION} from './consultation-i18n.mjs';
import {UI} from './portal-i18n.mjs';
import {S} from './scholarships-i18n.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang=(document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang==='my'?'my':'en');
const t=k=>S[lang][k]||UI[lang][k]||S.en[k]||UI.en[k]||k;
const tr=v=>typeof v==='string'?v:v?.[lang]||v?.en||v?.zh||'';
const safe=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:'#';}catch{return '#';}};
const places=[['CN','mainland'],['CN','hongkong-macao'],['CN','taiwan'],['TH',null],['MY',null],['SG',null]];
const params=new URLSearchParams(location.search);
let country=params.get('country')||'CN',region=params.get('region')||'mainland',schoolId=params.get('school')||'',query='',onlyOpen=false,data,openIds=new Set();
if(!places.some(p=>p[0]===country))country='CN';if(country!=='CN')region=null;else if(!places.some(p=>p[0]==='CN'&&p[1]===region))region='mainland';
const label=p=>t(p[1]||p[0]);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const status=a=>a.deadline&&a.deadline<today()?'closed':a.status;
const schoolName=s=>lang==='zh'?s.zh:s.en;
function sources(sources){return `<ul class="scholarship-source">${(sources||[]).map(s=>`<li><a href="${esc(safe(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${t('checked')}: ${esc(s.checkedAt||data.checkedAt)}</small></li>`).join('')}</ul>`;}
function sync(){const p=new URLSearchParams();p.set('country',country);if(region)p.set('region',region);if(schoolId)p.set('school',schoolId);history.replaceState(null,'',location.pathname+'?'+p);}
function header(){document.documentElement.lang={zh:'zh-CN',en:'en',my:'my'}[lang];document.title=t('scholarships')+' · PyinNyar study abroad';$$('[data-ui]').forEach(e=>e.textContent=t(e.dataset.ui));$$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));try{localStorage.setItem('pyinnyar-language',lang);}catch{}}
function scoped(s){return s.country===country&&(s.region||null)===region;}
function remember(){openIds=new Set($$('.scholarship-card[open]').map(e=>e.dataset.award));}
function render(){
 $('#page').innerHTML=`<section class="scholarship-hero"><a class="text-link" href="destinations.html${country==='CN'?'?region='+region:''}#${country}">← ${t('backDestinations')}</a><p class="eyebrow">${SITE_COPY[lang].scholarshipEyebrow}</p><h1>${t('title')}</h1><p>${t('intro')}</p></section><h2 class="scholarship-group">${t('choose')}</h2><div class="scholarship-locations" role="group" aria-label="${esc(t('choose'))}">${places.map((p,i)=>`<button type="button" data-place="${i}" aria-pressed="${p[0]===country&&p[1]===region}">${label(p)}</button>`).join('')}</div><div class="scholarship-filters"><label><span>${t('school')}</span><select id="scholarship-school"><option value="">${t('allSchools')}</option>${data.institutions.filter(scoped).map(s=>`<option value="${esc(s.id)}" ${s.id===schoolId?'selected':''}>${esc(schoolName(s))}</option>`).join('')}</select></label><label><span>${t('search')}</span><input type="search" id="scholarship-search" maxlength="150" value="${esc(query)}" placeholder="${esc(t('searchHint'))}"></label><label class="open-filter"><input type="checkbox" id="scholarship-open" ${onlyOpen?'checked':''}>${t('onlyOpen')}</label></div><p class="scholarship-scope">${t('scope')}</p><div id="scholarship-results" aria-live="polite"></div>`;
 $$('[data-place]').forEach(b=>b.addEventListener('click',()=>{remember();[country,region]=places[Number(b.dataset.place)];schoolId='';query='';sync();render();$(`[data-place="${b.dataset.place}"]`).focus();}));
 $('#scholarship-school').addEventListener('change',e=>{remember();schoolId=e.target.value;sync();renderResults();});
 $('#scholarship-search').addEventListener('input',e=>{remember();query=e.target.value;renderResults();});
 $('#scholarship-open').addEventListener('change',e=>{remember();onlyOpen=e.target.checked;renderResults();});renderResults();
}
function awardCard(a){
 const nationality=['myanmar-explicit','international-eligible'].includes(a.nationalityStatus)?a.nationalityStatus:a.nationalityStatus==='excluded'?'excluded':'nationalityVerify';
 const institutions=a.institutionIds.map(id=>data.institutions.find(s=>s.id===id)).filter(Boolean);
 return `<details class="scholarship-card" data-award="${esc(a.id)}" ${openIds.has(a.id)?'open':''}><summary><div class="scholarship-badges"><span class="scholarship-badge badge-${esc(status(a))}">${t(status(a))}</span><span class="scholarship-badge">${t('undergraduate')} · ${esc(a.cycle==='ongoing'?t('standing'):a.cycle)}</span></div><h3>${esc(tr(a.name))}</h3><p>${esc(tr(a.provider))}</p><p>${institutions.length?esc(institutions.map(schoolName).join(' / ')):t('regional')}</p><div class="scholarship-badges"><span class="scholarship-badge badge-${esc(a.nationalityStatus)}">${t(nationality)}</span></div><span class="scholarship-open">${t('details')}<b aria-hidden="true">＋</b></span></summary><div class="scholarship-detail"><dl>${['eligibility','coverage','application','obligations','timing'].map(k=>`<dt>${t(k)}</dt><dd>${esc(tr(a[k]))}</dd>`).join('')}${a.deadline?`<dt>${t('deadline')}</dt><dd>${esc(a.deadline)}</dd>`:''}</dl><h4>${t('official')}</h4>${sources(a.sources)}<button type="button" class="consult-card" data-consult data-consult-context="${esc(tr(a.name))}" data-consult-country="${a.country}">${CONSULTATION[lang].free} ↗</button></div></details>`;
}
function renderResults(){
 const selected=data.institutions.find(s=>s.id===schoolId),q=query.trim().toLowerCase();
 const awards=data.scholarships.filter(a=>scoped(a)&&(!schoolId||!a.institutionIds.length||a.institutionIds.includes(schoolId))&&(!onlyOpen||status(a)==='open')&&(!q||[...Object.values(a.name),...Object.values(a.provider),...Object.values(a.coverage),...a.institutionIds.map(id=>{const s=data.institutions.find(x=>x.id===id);return s?s.zh+' '+s.en:'';})].join(' ').toLowerCase().includes(q)));
 const evidence=selected&&data.schoolEvidence.find(e=>e.schoolId===schoolId);
 const schoolHTML=selected?`<section class="school-evidence"><span class="eyebrow">${t('schoolEvidence')}</span><h2>${esc(schoolName(selected))}</h2><span class="scholarship-badge">${t(evidence?.status==='verified'?'verified':evidence?.status==='excluded'?'excluded':'pending')}</span><p>${esc(evidence?tr(evidence.note):t('unknown'))}</p>${evidence?.sources?.length?sources(evidence.sources):''}<a class="text-link" href="${esc(safe(selected.admissionsUrl||selected.website))}" target="_blank" rel="noopener noreferrer">${t('officialSchool')}</a></section>`:'';
 $('#scholarship-results').innerHTML=schoolHTML+`<p class="scholarship-count">${awards.length} ${t('results')} · ${t('checked')}: ${data.checkedAt}</p>`+(awards.length?['university','regional'].map(g=>{const subset=awards.filter(a=>g==='regional'?!a.institutionIds.length:a.institutionIds.length);return subset.length?`<h2 class="scholarship-group">${t(g==='regional'?'regionalHeading':'universityHeading')}</h2><div class="scholarship-list">${subset.map(awardCard).join('')}</div>`:'';}).join(''):`<div class="destination-empty">${onlyOpen?t('emptyOpen'):t('none')}</div>`);
}
$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{remember();lang=b.dataset.lang;header();if(data)render();}));
$('.menu-toggle').addEventListener('click',()=>{const open=$('.nav').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));});
header();$('#page').textContent=t('loading');
try{const response=await fetch('data/scholarships.json');if(!response.ok)throw Error('load');data=await response.json();if(!Array.isArray(data.scholarships)||!Array.isArray(data.institutions))throw Error('data');const school=data.institutions.find(s=>s.id===schoolId);if(school){country=school.country;region=school.region||null;}else schoolId='';sync();render();}catch{$('#page').innerHTML=`<div class="destination-empty">${t('error')}</div>`;}
