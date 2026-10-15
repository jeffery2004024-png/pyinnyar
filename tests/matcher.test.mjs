import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EMPTY_PROFILE,academicStats,validateProfile,evaluateRoute,matchProfile} from '../dist/matcher.mjs';
import {UI} from '../dist/portal-i18n.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data/universities.json',import.meta.url)));
const school={id:'fixture',country:'TH',en:'Fixture'};
const ged=(score=160)=>({type:'ged',completed:true,year:2026,subjects:['rla','math','science','social'].map(key=>({key,name:key,score,max:200}))});
const matric=()=>({type:'matriculation',completed:true,year:2026,system:'new',years:12,subjects:['myanmar','english','math','physics','chemistry','biology'].map(key=>({key,name:key,score:90,max:100}))});
const alevel=(grades=['B','C','C'])=>({type:'alevel',completed:true,resultType:'final',subjects:grades.map((grade,i)=>({key:['math','physics','chemistry','biology'][i],name:['Mathematics','Physics','Chemistry','Biology'][i],stage:'A-Level',grade}))});
const profile=(academic=ged())=>({...EMPTY_PROFILE(),academics:[academic],ielts:{kind:'academic',overall:6,listening:6,reading:6,writing:6,speaking:6}});
const route=(q={type:'ged',mode:'accepted',ged:{minEach:145}})=>({id:'fixture',level:'bachelor',qualifications:[q],language:{type:'ielts',overall:5.5,minEach:5}});
const find=(id)=>{for(const s of data.schools){const r=s.routes.find(r=>r.id===id);if(r)return [s,r];}throw Error(id);};

test('GED is never converted to a percentage, and every subject must pass',()=>{
 const p=profile(); assert.equal(academicStats(p.academics[0]).average,null);assert.equal(evaluateRoute(p,school,route()).status,'met');
 p.academics[0].subjects[0].score=144;assert.equal(evaluateRoute(p,school,route()).status,'gap');
 assert.equal(evaluateRoute(p,school,route({type:'ged',mode:'review'})).status,'gap');
});
test('MUIC requires a total600 beyond the GED145 credential, BU has its own IELTS bands',()=>{
 const mu=data.schools.find(s=>s.id==='th-mahidol'),bu=data.schools.find(s=>s.id==='th-bangkok');assert.ok(mu&&bu);
 const p=profile(ged(145));assert.ok(mu.routes.some(r=>r.qualifications[0].ged?.minTotal===600));
 assert.equal(evaluateRoute(p,mu,mu.routes.find(r=>r.qualifications[0].ged?.minTotal===600)).status,'gap');
 p.academics[0].subjects.forEach(s=>s.score=150);assert.equal(evaluateRoute(p,mu,mu.routes.find(r=>r.qualifications[0].ged?.minTotal===600)).status,'review');
 p.ielts={kind:'academic',overall:5,listening:5,reading:5,writing:5,speaking:5};assert.equal(evaluateRoute(p,bu,bu.routes.find(r=>!r.directoryOnly)).status,'review');p.ielts.speaking=4.5;assert.equal(evaluateRoute(p,bu,bu.routes.find(r=>!r.directoryOnly)).status,'gap');
});
test('IELTS Academic, half bands, official rounding and unknown components',()=>{
 const p=profile();p.ielts.kind='general';assert.equal(evaluateRoute(p,school,route()).status,'gap');
 p.ielts={kind:'academic',overall:6.5,listening:6,reading:6,writing:6.5,speaking:6.5};assert.deepEqual(validateProfile(p),[]);
 p.ielts.overall=6;assert.ok(validateProfile(p).includes('ieltsOverall'));p.ielts.overall=6.2;assert.ok(validateProfile(p).includes('ieltsScore'));
 p.ielts={kind:'academic',overall:6};assert.equal(evaluateRoute(p,school,route()).status,'incomplete');
});
test('AS cannot satisfy full A-Level count; predicted results stay under review',()=>{
 const p=profile(alevel()); const r=route({type:'alevel',mode:'accepted',alevel:{count:3,minGrade:'C',grades:['B','C','C']}});
 assert.equal(evaluateRoute(p,school,r).status,'met');p.academics[0].subjects[0].stage='AS';assert.equal(evaluateRoute(p,school,r).status,'gap');
 p.academics[0].subjects[0].grade='A*';assert.ok(validateProfile(p).includes('grade'));p.academics[0]=alevel();p.academics[0].resultType='predicted';assert.equal(evaluateRoute(p,school,r).status,'review');
});
test('subject prerequisites and published university points are applied individually',()=>{
 const p=profile(alevel(['B','C','C']));const r=route({type:'alevel',mode:'accepted',alevel:{subjects:[{key:'math',grade:'B'}],points:{minimum:12,map:{A:10,B:8,C:6,D:4,E:2}}}});
 assert.equal(evaluateRoute(p,school,r).status,'met');p.academics[0].subjects[0].grade='C';assert.equal(evaluateRoute(p,school,r).status,'gap');p.academics[0].subjects[0].grade='A*';assert.equal(evaluateRoute(p,school,r).status,'review');
});
test('HSK strict section minima and exact published replacement levels',()=>{
 const p=profile(matric());p.csca={math:90,chineseScience:90,chineseArts:90,physics:90,chemistry:90};p.hsk={level:'5',total:181,listening:60,reading:61,writing:60};
 let [s,r]=find('thu-bilingual');assert.ok(evaluateRoute(p,s,r).checks.some(c=>c.code==='hskComponent'&&c.kind==='gap'));
 p.hsk={level:'5',total:183,listening:61,reading:61,writing:61};assert.ok(evaluateRoute(p,s,r).checks.filter(c=>c.code==='hskComponent').every(c=>c.kind==='pass'));
 [s,r]=find('sjtu-cn');p.hsk={level:'6',total:180,writing:60};assert.ok(evaluateRoute(p,s,r).checks.some(c=>c.code==='hskTotal'&&c.kind==='pass'));p.hsk.total=179;assert.equal(evaluateRoute(p,s,r).status,'gap');
 p.hsk={level:'7-9',advancedBand:'9',writing:90};assert.ok(evaluateRoute(p,s,r).checks.some(c=>c.kind==='review'));
});
test('IELTS strict per-band requirements survive normalisation',()=>{
 const [s,r]=find('cn-jnu-2');const p=profile(matric());p.ielts={kind:'academic',overall:5.5,listening:5,reading:5.5,writing:5.5,speaking:6};assert.ok(evaluateRoute(p,s,r).checks.some(c=>c.code==='ieltsComponent'&&c.kind==='gap'&&c.exclusive));
});
test('CSCA has no invented pass score; missing papers are incomplete',()=>{
 const p=profile();const r={...route(),csca:{subjects:['math']}};assert.equal(evaluateRoute(p,school,r).status,'incomplete');p.csca.math=0;assert.equal(evaluateRoute(p,school,r).status,'met');
});
test('legacy Myanmar-only qualification cannot use a Malaysia bachelor path',()=>{
 const s=data.schools.find(s=>s.country==='MY'&&s.routes.some(r=>!r.directoryOnly));const r=s.routes.find(r=>!r.directoryOnly);const p=profile(matric());p.academics[0].system='legacy';p.academics[0].year=2023;p.academics[0].years=11;assert.equal(evaluateRoute(p,s,r).status,'gap');p.academics.push(alevel(['A','A','A']));assert.ok(!evaluateRoute(p,s,r).checks.some(c=>c.code==='newMyanmar'&&c.kind==='gap'));
});
test('multiple qualifications choose the viable alternative and awards never bypass thresholds',()=>{
 const p=profile(ged(140));p.academics.push(alevel());const r={...route(),qualifications:[...route().qualifications,{type:'alevel',mode:'accepted',alevel:{count:3,minGrade:'C'}}]};assert.equal(evaluateRoute(p,school,r).qualification,'alevel');
 const before=matchProfile(p,[{...school,routes:[r]}]);p.competitions=[{name:'Competition',award:'First',organizer:'Demo',year:2026}];assert.equal(matchProfile(p,[{...school,routes:[r]}])[0].status,before[0].status);
});
test('duplicates, impossible dates, malformed imports and ranges are rejected safely',()=>{
 const p=profile();p.extra.ap=[{name:'Calculus BC',score:5},{name:'Calculus BC',score:5}];assert.ok(validateProfile(p).includes('duplicateSubject'));
 p.extra.ap=[];p.hsk={level:'5',total:300,listening:70,reading:70,writing:70};assert.ok(validateProfile(p).includes('hskOverall'));
 p.hsk={date:'2026-02-31'};assert.ok(validateProfile(p).includes('testDate'));
 for(const a of [null,{}, {subjects:[null]}])assert.ok(validateProfile({...EMPTY_PROFILE(),academics:[a]}).length);
 assert.ok(validateProfile({...EMPTY_PROFILE(),extra:null}).length);assert.ok(validateProfile({...EMPTY_PROFILE(),competitions:[null]}).length);
});
test('expired evidence is a gap; future application validity remains conditional',()=>{
 const p=profile();const r={...route(),language:{type:'ielts',overall:6,validMonths:24}};p.ielts.date='2023-10-01';assert.equal(evaluateRoute(p,school,r).status,'gap');p.ielts.date='2026-07-01';assert.equal(evaluateRoute(p,school,r).status,'review');
});
test('directory and incomplete overview rules never yield a positive match',()=>{
 const p=profile();assert.equal(evaluateRoute(p,school,route({type:'ged',mode:'unknown'})).status,'unknown');assert.equal(evaluateRoute(p,school,route({type:'alevel',mode:'accepted'})).status,'unknown');assert.equal(matchProfile(p,[{...school,routes:[]}])[0].status,'unknown');assert.equal(evaluateRoute(p,school,{...route(),directoryOnly:true}).status,'unknown');
});
test('catalogue and sources are complete under the stated institutional counting rule',()=>{
 assert.equal(data.schools.length,143);assert.equal(data.schools.filter(s=>s.country==='CN').length,115);assert.equal(data.schools.filter(s=>s.tags.includes('985')).length,39);assert.equal(data.schools.filter(s=>s.military).length,3);assert.equal(new Set(data.schools.map(s=>s.id)).size,143);
 for(const s of data.schools)for(const r of s.routes){assert.ok(r.sources.length);assert.ok(r.sources.every(x=>/^https?:\/\//.test(x.url)));assert.ok(r.label.en);assert.ok(r.label.my);}
 const p=profile();assert.doesNotThrow(()=>matchProfile(p,data.schools.filter(s=>!s.military)));
});
test('every static interface key is present in all three languages',()=>{
 for(const key of Object.keys(UI.zh))for(const lang of ['en','my'])assert.ok(UI[lang][key],`${lang}:${key}`);
 const source=fs.readFileSync(new URL('../dist/portal.mjs',import.meta.url),'utf8');const keys=[...source.matchAll(/T\('([^']+)'\)/g)].map(m=>m[1]);for(const key of keys)assert.ok(UI.zh[key],key);
});
