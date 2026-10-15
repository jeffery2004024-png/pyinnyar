// Run only against the retained legacy host after the new deployment passes QA.
import fs from 'node:fs';import path from 'node:path';import {SITE} from '../dist/site-config.mjs';import {legacyTarget} from './legacy-redirect.mjs';
const output=process.argv[2];if(!output)throw Error('Pass the legacy dist directory; this never overwrites the new site.');
const marker=path.resolve(output);if(marker===path.resolve('dist'))throw Error('Refusing to replace the new website with legacy redirects.');
const html=(route)=>{
 const target=legacyTarget(route,SITE.url),links=['my','zh','en'].map(l=>`<a lang="${l}" href="${new URL(l+'/',SITE.url)}">${{my:'မြန်မာ',zh:'中文',en:'English'}[l]}</a>`).join(' · ');
 return `<!doctype html><html lang="my"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PyinNyar — လိပ်စာအသစ် · 网站已迁移 · We have moved</title><meta name="description" content="PyinNyar ၏ ဝဘ်ဆိုက်လိပ်စာအသစ်။ PyinNyar 官网新地址。 Visit the new PyinNyar website."><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0;url=${target}"><style>body{margin:0;background:#f8f7f1;color:#173f35;font:17px/2 system-ui,'Myanmar Sangam MN',sans-serif}main{max-width:760px;margin:10vh auto;padding:28px}a{color:#173f35;overflow-wrap:anywhere}h1{line-height:1.7}</style><script>const target=${JSON.stringify(target)};document.addEventListener('DOMContentLoaded',()=>{document.getElementById('continue').href=target+location.search+location.hash});location.replace(target+location.search+location.hash);</script></head><body><main><h1>PyinNyar study abroad</h1><p lang="my">ဝဘ်ဆိုက်လိပ်စာအသစ်သို့ ပြောင်းရွှေ့ထားသည်။ အလိုအလျောက် မရောက်လျှင် အောက်ပါလင့်ခ်ကို နှိပ်နိုင်သည်။</p><p lang="zh-CN">官网已迁移至新地址，正在为你跳转。若未自动跳转，请点击下方链接。</p><p lang="en">Our website has moved. You are being redirected. If it does not open automatically, follow the link below.</p><p><a id="continue" href="${target}">${target}</a></p><nav>${links}</nav></main></body></html>`;
};
const routes=[];for(const prefix of ['', 'my/', 'en/', 'zh/'])for(const page of ['index','match','universities','destinations','scholarships']){
 const route='/'+prefix+(page==='index'?'':page);const file=path.join(output,prefix,page+'.html');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html(route));routes.push(route);
}
const dynamic=html('/').replace('const target='+JSON.stringify(legacyTarget('/',SITE.url))+';',`const map=${legacyTarget.toString()};const target=map(location.pathname,${JSON.stringify(SITE.url)});`);
fs.writeFileSync(path.join(output,'404.html'),dynamic);
console.log('Legacy redirects prepared:',routes.length,'routes →',SITE.url);
