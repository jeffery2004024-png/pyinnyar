import {SITE_COPY} from './site-copy.mjs';
import {CONSULTATION} from './consultation-i18n.mjs';
import {UI} from './portal-i18n.mjs';
import {S} from './scholarships-i18n.mjs';
import {D,BACKGROUND} from './destinations-i18n.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const countries=['CN','TH','MY','SG'];
let lang=(document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang==='my'?'my':'en');
const t=k=>D[lang][k]||S[lang][k]||UI[lang][k]||D.en[k]||UI.en[k]||k;
const tr=v=>typeof v==='string'?v:v?.[lang]||v?.en||v?.zh||'';
const safe=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};
let selected=countries.includes(location.hash.slice(1))?location.hash.slice(1):null;
let background=new URLSearchParams(location.search).get('background')||'';if(!BACKGROUND[background])background='';
const regionIds=['mainland','hongkong-macao','taiwan'];
let region=new URLSearchParams(location.search).get('region')||'mainland';if(!regionIds.includes(region))region='mainland';
let info,schools,query='',limit=12;
const cities={CN:'3 REGIONS',TH:'BANGKOK',MY:'KUALA LUMPUR',SG:'SINGAPORE'};
const names={CN:'CHINA',TH:'THAILAND',MY:'MALAYSIA',SG:'SINGAPORE'};
const strokes={CN:'M18 75h124M29 75V47h101v28M24 46h110l-17-13H41L24 46Zm29-13V23h51v10M48 23h61l-11-9H59L48 23ZM51 51v24m29-24v24m28-24v24',TH:'M16 77h130M24 77V59h115v18M41 59V37h83v22M31 37h103L83 16 31 37ZM68 59V43h30v16M83 16V7M14 59h132M38 77V65m88 12V65',MY:'M30 80V28h35v52m39 0V28h35v52M27 28h41L48 10 27 28Zm74 0h41l-20-18-21 18ZM65 43h39v8H65M35 39h24m-24 12h24m-24 12h24m51-24h24m-24 12h24m-24 12h24M18 80h132',SG:'M18 78h133M27 75V45h25v30m9 0V38h28v37m10 0V45h27v30M22 42c24 12 64 12 112 0M30 36V24m90 12V24M17 84c10-5 18-5 28 0s18 5 28 0 18-5 28 0 18 5 28 0 18-5 28 0'};
function art(c){return `<svg viewBox="0 0 166 100" fill="none" aria-hidden="true"><circle cx="126" cy="18" r="14" fill="currentColor" opacity=".08"/><path d="${strokes[c]}" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function sourcesHTML(values){return `<details class="destination-sources"><summary>${t('sources')}</summary><ul>${(values||[]).map(s=>`<li><a href="${esc(safe(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${t('checked')}: ${esc(s.checkedAt||info.checkedAt)}</small></li>`).join('')}</ul></details>`;}
function header(){document.documentElement.lang={zh:'zh-CN',en:'en',my:'my'}[lang];document.title=t('destinations')+' · PyinNyar study abroad';$$('[data-ui]').forEach(e=>e.textContent=t(e.dataset.ui));$$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));$('.nav a[data-ui="destinations"]').setAttribute('aria-current','page');$('.menu-toggle').setAttribute('aria-label',lang==='zh'?'打开导航':lang==='en'?'Open navigation':'လမ်းညွှန်ဖွင့်ရန်');try{localStorage.setItem('pyinnyar-language',lang);}catch{}}
function countryCards(){return countries.map((c,i)=>`<button type="button" class="destination-card country-${c}" data-country="${c}" aria-pressed="${selected===c}" aria-controls="country-content"><span class="country-number">0${i+1} / ${t(c)}</span><span class="country-illustration">${art(c)}</span><span class="country-card-name">${t(c)}</span><span class="country-card-tag">${t(c+'tag')}</span><span class="country-card-bottom">${t('browse')}<span>${lang==='en'?cities[c]:({zh:{CN:'三个地区',TH:'曼谷',MY:'吉隆坡',SG:'新加坡'},my:{CN:'ဒေသသုံးခု',TH:'ဘန်ကောက်',MY:'ကွာလာလမ်ပူ',SG:'စင်ကာပူ'}})[lang][c]}</span></span></button>`).join('');}
function render(){
 $('#page').innerHTML=`<section class="destination-hero"><div><p class="eyebrow">${SITE_COPY[lang].destinationEyebrow}</p><h1>${esc(t('title')).replace(/\n/g,'<br>')}</h1><p>${t('intro')}</p></div><div class="destination-stamp" aria-hidden="true"><span>${SITE_COPY[lang].heroEyebrow}</span><svg viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="46"/><ellipse cx="60" cy="60" rx="21" ry="46"/><path d="M14 60h92M22 34h76M22 86h76M60 14v92"/></svg><span>${SITE_COPY[lang].matchEyebrow}</span></div></section><div class="choose-label"><h2>${t('choose')}</h2><span>01 — 04</span></div><div class="destination-grid">${countryCards()}</div><div class="destination-nationality"><span>◇</span><div><strong>${t('nationality')}</strong><p>${t('nationalityNote')}</p></div></div><section id="country-content" class="country-content" aria-live="polite">${selected?'':`<div class="destination-empty">${t('selectFirst')}</div>`}</section>`;
 $$('[data-country]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.country;query='';limit=12;history.replaceState(null,'','#'+selected);$$('[data-country]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.country===selected)));renderCountry();$('#country-content').scrollIntoView({behavior:'smooth',block:'start'});}));
 if(selected)renderCountry();
}
function regionTitle(c,key){return t(key).replace('{region}',tr(c.title));}
function regionNavigation(c){
 return `<div class="region-choice-heading"><h2>${t('regionChoose')}</h2><p>${t('regionNote')}</p></div><div class="china-region-tabs" role="tablist" aria-label="${esc(t('regionChoose'))}">${c.regions.map((r,i)=>`<button type="button" role="tab" id="region-tab-${r.id}" data-region="${r.id}" aria-controls="region-content" aria-selected="${region===r.id}" tabindex="${region===r.id?0:-1}"><span class="region-number">0${i+1}</span><span><strong>${esc(tr(r.title))}</strong><small>${esc(tr(r.tag))}</small></span><span class="region-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;
}
function sectionsHTML(c){return c.sections.map((s,i)=>`<article><span class="information-index">${String(i+1).padStart(2,'0')}</span><h3>${esc(tr(s.title))}</h3><p>${esc(tr(s.body)).replace(/\n/g,'<br>')}</p>${sourcesHTML(s.sources)}</article>`).join('');}
function scholarshipURL(id=''){return 'scholarships.html?country='+selected+(selected==='CN'?'&region='+region:'')+(id?'&school='+encodeURIComponent(id):'');}
function universitiesHTML(c){
 return c.universities.map(u=>{
 const school=schools.find(s=>s.id===u.id);const monogram=u.nameEn.split(' ').filter(x=>!/^(of|the|and)$/i.test(x)).map(x=>x[0]).join('').slice(0,4);
 return `<article><div class="university-monogram">${esc(monogram)}</div><h3>${esc(lang==='zh'?u.nameZh:u.nameEn)}</h3><p class="university-second-name">${esc(lang==='zh'?u.nameEn:u.nameZh)}</p><p class="featured-meta">${esc(tr(u.location))} · ${esc(tr(u.type))}</p><p>${esc(tr(u.description))}</p>${sourcesHTML(u.sources)}${school?`<a class="text-link" href="universities.html?country=${selected}&school=${encodeURIComponent(school.en)}">${t('requirements')}</a>`:`<div class="regional-university-links"><a class="text-link" href="${esc(safe(u.website))}" target="_blank" rel="noopener noreferrer">${t('schoolAbout')}</a><a class="text-link" href="${esc(safe(u.admissionsUrl))}" target="_blank" rel="noopener noreferrer">${t('officialAdmissions')}</a></div>`}<a class="text-link" href="${scholarshipURL(u.id)}">${t('viewScholarships')}</a></article>`;
 }).join('');
}
function updateRegion(next,focus=false){
 if(!regionIds.includes(next))return;region=next;query='';limit=12;
 const params=new URLSearchParams(location.search);params.set('region',region);history.replaceState(null,'',location.pathname+'?'+params.toString()+'#CN');renderCountry();if(focus)$('#region-tab-'+region).focus();
}
function renderCountry(){
 const country=info.countries.find(x=>x.country===selected),regional=selected==='CN'&&country.regions;
 const c=regional?country.regions.find(r=>r.id===region):country;
 const catalogue=!regional||region==='mainland',list=schools.filter(x=>x.country===selected&&!x.military);
 const backgroundHTML=`<div class="destination-background"><div><h3>${t('backgroundTitle')}</h3><p>${t('backgroundNote')}</p></div><label><span>${t('background')}</span><select id="destination-background">${[['',t('allBackgrounds')],...Object.keys(BACKGROUND).map(k=>[k,t(k)])].map(([v,l])=>`<option value="${v}" ${v===background?'selected':''}>${esc(l)}</option>`).join('')}</select></label><div id="background-advice"></div></div>`;
 const directoryHTML=`<div class="destination-section-heading"><span>03</span><h2>${regional?t('mainlandDirectory'):t('schools')}</h2></div><p class="destination-section-note">${regional?t('mainlandDirectoryNote'):t('schoolsNote')}</p><div class="destination-school-filter"><label><span>${t('search')}</span><input id="destination-search" type="search" value="${esc(query)}" placeholder="${esc(t('searchHint'))}" maxlength="150"></label><a class="text-link" href="universities.html?country=${selected}">${regional?t('mainlandDirectoryLink'):t('countryDirectory')}</a></div><div class="destination-school-count" id="destination-school-count"></div><div class="destination-school-list" id="destination-school-list"></div><div id="destination-more"></div><div class="destination-next"><div><p class="eyebrow">${SITE_COPY[lang].step3}</p><h2>${t('matching')}</h2><p>${regional?t('mainlandMatchingNote'):t('matchingNote')}</p></div><a class="button" href="match.html?country=${selected}${background?'&qualification='+background:''}">${regional?t('mainlandMatch'):t('match')}</a></div>`;
 $('#country-content').innerHTML=`<div class="country-heading"><div><p class="eyebrow">${t('selected')} / ${t(selected)}</p><h2>${t(selected)}</h2><p>${esc(tr(country.overview))}</p></div><div class="country-heading-art">${art(selected)}</div></div>${regional?regionNavigation(country):''}<div ${regional?`id="region-content" role="tabpanel" aria-labelledby="region-tab-${region}" tabindex="0"`:''}>${regional?`<div class="region-overview"><p class="eyebrow">${String(regionIds.indexOf(region)+1).padStart(2,'0')} / ${esc(tr(c.title))}</p><h2>${esc(regionTitle(c,'regionGuide'))}</h2><p>${esc(tr(c.overview))}</p></div>`:''}<section class="scholarship-callout"><div><h3>${t('scholarships')}</h3><p>${t('scholarshipNote')}</p></div><a class="text-link" href="${scholarshipURL()}">${t('countryScholarships')}</a></section>${catalogue?backgroundHTML:''}<div class="destination-section-heading"><span>01</span><h2>${regional?t('regionalPreparation'):t('guidance')}</h2></div><div class="country-information">${sectionsHTML(c)}</div><div class="destination-section-heading"><span>02</span><h2>${regional?esc(regionTitle(c,'regionUniversities')):t('featured')}</h2></div><p class="destination-section-note">${t('featuredNote')}</p><div class="featured-universities">${universitiesHTML(c)}</div>${catalogue?directoryHTML:`<div class="regional-next"><p>${t('regionalNext')}</p><a class="text-link" href="destinations.html?region=mainland#CN">${t('backMainland')}</a></div>`}<p class="destination-source-note">${t('checked')}: ${info.checkedAt} · ${t('sourceNote')}</p></div>`;
 $$('[data-region]').forEach(b=>{
 b.addEventListener('click',()=>updateRegion(b.dataset.region,true));
 b.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const current=regionIds.indexOf(region),index=e.key==='Home'?0:e.key==='End'?2:(current+(e.key==='ArrowRight'?1:2))%3;updateRegion(regionIds[index],true);});
 });
 if(catalogue){
 $('#destination-background').addEventListener('change',e=>{background=e.target.value;const params=new URLSearchParams(location.search);if(background)params.set('background',background);else params.delete('background');history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():'')+'#'+selected);renderBackground();$('.destination-next .button').href='match.html?country='+selected+(background?'&qualification='+background:'');});
 $('#destination-search').addEventListener('input',e=>{query=e.target.value;limit=12;renderSchools(list);});renderBackground();renderSchools(list);
 }
}
function renderBackground(){$('#background-advice').innerHTML=background?`<p>${esc(tr(BACKGROUND[background]))}</p><a class="text-link" href="match.html?qualification=${background}&country=${selected}">${t('qualificationCta')}</a>`:'';}
function schoolName(s){return lang==='zh'?s.zh:s.en;}
function renderSchools(list){
 const q=query.trim().toLowerCase();const filtered=list.filter(s=>!q||`${s.zh} ${s.en} ${s.city}`.toLowerCase().includes(q));
 $('#destination-school-count').textContent=filtered.length+' '+t('count');
 $('#destination-school-list').innerHTML=filtered.length?filtered.slice(0,limit).map(s=>{const routes=s.routes.filter(r=>!r.directoryOnly);return `<article class="destination-school"><div class="destination-school-top"><span>${esc(s.tags.map(t).join(' · '))}</span><span>↗</span></div><h3>${esc(schoolName(s))}</h3><p class="university-second-name">${esc(lang==='zh'?s.en:s.zh)}</p><dl><div><dt>${t('location')}</dt><dd>${esc(s.city||t('unknownCity'))}</dd></div><div><dt>${t('programmes')}</dt><dd>${routes.length||t('noProgrammes')}</dd></div></dl><p class="destination-school-note">${routes.length?esc(routes.slice(0,2).map(r=>tr(r.label)).join(' / '))+'. ':''}${t('generalSchool')}</p><div class="destination-school-links"><a href="${esc(safe(s.website||s.admissionsUrl))}" target="_blank" rel="noopener noreferrer">${t('schoolAbout')}</a><a href="universities.html?country=${selected}&school=${encodeURIComponent(s.en)}">${t('requirements')}</a><a href="${scholarshipURL(s.id)}">${t('viewScholarships')}</a></div><button type="button" class="consult-card" data-consult data-consult-context="${esc(schoolName(s))}" data-consult-country="${selected}">${CONSULTATION[lang].free} ↗</button></article>`;}).join(''):`<div class="destination-empty">${t('none')}</div>`;
 $('#destination-more').innerHTML=filtered.length>limit?`<button type="button" class="show-more" id="destination-show-more">${t('more')} (${Math.min(limit,filtered.length)} / ${filtered.length})</button>`:'';
 $('#destination-show-more')?.addEventListener('click',()=>{limit+=12;renderSchools(list);});
}
$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;header();if(info)render();}));
$('.menu-toggle').addEventListener('click',()=>{const open=$('.nav').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));});
addEventListener('hashchange',()=>{selected=countries.includes(location.hash.slice(1))?location.hash.slice(1):null;query='';limit=12;if(info)render();});
header();$('#page').textContent=t('loading');
try{const r=await Promise.all([fetch('data/destinations.json'),fetch('data/universities.json')]);if(r.some(x=>!x.ok))throw Error('load');const [a,b]=await Promise.all(r.map(x=>x.json()));info=a;schools=b.schools;if(!info.countries||!Array.isArray(schools))throw Error('data');render();}catch{$('#page').innerHTML=`<div class="destination-empty">${t('error')}</div>`;}
