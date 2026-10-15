import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EMPTY_PROFILE,validateProfile} from '../dist/matcher.mjs';
import {inferEvidence,evidenceProfile} from '../dist/profile-selection.mjs';
import {BASE_PATH,CONTACT} from '../dist/site-config.mjs';
import {studentCasesHtml} from '../dist/site-components.mjs';
import {UI} from '../dist/portal-i18n.mjs';
import {SITE_COPY} from '../dist/site-copy.mjs';

test('unchecked score groups cannot affect matching or exported profiles; the editing draft is retained',()=>{
 const p=EMPTY_PROFILE();p.hsk={level:'5',total:250};p.ielts={kind:'academic',overall:7};p.csca={math:90};p.extra={ap:[{name:'Math',score:5}],sat:1500,satMath:790,satReadingWriting:710,act:33,actWriting:9,universityYears:1};p.competitions=[{name:'test fixture',award:'',organizer:'',year:''}];
 const all=inferEvidence(p);for(const k of ['hsk','ielts','csca','sat','act','ap','universityYears','competitions'])assert.ok(all.has(k));
 const before=structuredClone(p),active=evidenceProfile(p,new Set(['ielts']));
 assert.equal(active.ielts.overall,7);assert.deepEqual(active.hsk,{});assert.deepEqual(active.csca,{});assert.equal(active.extra.sat,'');assert.equal(active.extra.actWriting,'');assert.deepEqual(active.extra.ap,[]);assert.deepEqual(active.competitions,[]);assert.equal(validateProfile(active).length,0);assert.deepEqual(p,before);
 const restored=evidenceProfile(p,all);assert.equal(restored.hsk.total,250);assert.equal(restored.extra.satMath,790);
});
test('shared contact copy does not overwrite GED Social Studies subject names',()=>{assert.equal(UI.en.social,'Social Studies');assert.match(UI.my.social,/[\u1000-\u109f]/);assert.notEqual(UI.my.social,SITE_COPY.my.contactHeading);});
test('default language-test metadata is not treated as an existing result',()=>assert.equal(inferEvidence(EMPTY_PROFILE()).size,0));
test('all published routes have direct Messenger anchors, one floating link and shared branding',()=>{
 const keys=Object.keys(SITE_COPY.en);for(const lang of ['zh','en','my']){assert.deepEqual(Object.keys(SITE_COPY[lang]),keys);assert.equal(studentCasesHtml(lang),'');
 for(const page of ['index','match','universities','destinations','scholarships']){
  const html=fs.readFileSync(`dist/${lang}/${page==='index'?'':page+'/'}index.html`,'utf8');
  const contacts=[...html.matchAll(/<([a-z]+)\b([^>]*\bdata-consult\b[^>]*)>/g)];assert.ok(contacts.length>=3);
  for(const [,tag,attrs] of contacts){assert.equal(tag,'a');assert.ok(attrs.includes('href="'+CONTACT.messenger+'"'));assert.ok(attrs.includes('target="_blank"'));assert.match(attrs,/rel="[^"]*noopener/);}
  assert.equal((html.match(/class="[^"]*messenger-float/g)||[]).length,1);assert.doesNotMatch(html,/id="consultation"|class="consult-dock"/);
  assert.ok(html.includes(CONTACT.facebook.replaceAll('&','&amp;')));assert.ok(html.includes('src="'+BASE_PATH+'assets/favicon.svg"'));assert.ok(html.includes('id="site-navigation"'));assert.ok(html.includes('lang="my"'));assert.ok(html.includes('/improvements.css'));
  if(page==='index'){assert.equal((html.match(/<details><summary data-t="faq/g)||[]).length,8);assert.equal((html.match(/<li data-t="(?:CN|TH|MY|SG)Fact[12]"|<li data-t="tuition"/g)||[]).length,12);assert.ok(!html.includes('id="student-cases"'));if(lang!=='en')for(const caption of ['YOUR RESULTS. YOUR NEXT CHAPTER.','FROM MYANMAR, TO THE WORLD','YOUR BACKGROUND. YOUR PATH.','THE WORLD IS WAITING.'])assert.ok(!html.includes(caption));}
  if(page==='match'){assert.ok(html.includes('match-enhanced'));assert.ok(html.includes('class="match-loading wrap"'));}
 }
 }
 for(const k of ['viber','phone','email','address'])assert.equal(CONTACT[k],'');
});
