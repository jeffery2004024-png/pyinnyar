// Selection is explicit: default IELTS metadata alone is not a result.
export const OPTIONAL_EVIDENCE=['hsk','ielts','csca','sat','act','ap','universityYears','competitions'];
const present=value=>value!==''&&value!==null&&value!==undefined;
export function inferEvidence(profile){
 const selected=new Set(profile.academics.map(a=>a.type));
 for(const key of ['hsk','ielts','csca'])if(Object.entries(profile[key]).some(([k,v])=>k!=='kind'&&present(v)))selected.add(key);
 if(['sat','satMath','satReadingWriting'].some(k=>present(profile.extra[k])))selected.add('sat');
 if(['act','actWriting'].some(k=>present(profile.extra[k])))selected.add('act');
 if(profile.extra.ap.length)selected.add('ap');
 if(present(profile.extra.universityYears))selected.add('universityYears');
 if(profile.competitions.length)selected.add('competitions');
 return selected;
}
export function evidenceProfile(profile,selected){
 const active=structuredClone(profile);
 active.academics=active.academics.filter(a=>selected.has(a.type));
 for(const key of ['hsk','ielts','csca'])if(!selected.has(key))active[key]=key==='ielts'?{kind:'academic'}:{};
 if(!selected.has('sat'))for(const key of ['sat','satMath','satReadingWriting'])active.extra[key]='';
 if(!selected.has('act'))for(const key of ['act','actWriting'])active.extra[key]='';
 if(!selected.has('ap'))active.extra.ap=[];
 if(!selected.has('universityYears'))active.extra.universityYears='';
 if(!selected.has('competitions'))active.competitions=[];
 return active;
}
