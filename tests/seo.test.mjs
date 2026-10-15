import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {SEO,pagePath} from '../dist/seo-i18n.mjs';import {SITE,BASE_PATH,sitePath,siteRoute} from '../dist/site-config.mjs';
const pages=['index','match','universities','destinations','scholarships'];
test('all 15 language routes expose static content, new canonicals, metadata and base-safe assets',()=>{
 for(const lang of ['zh','en','my'])for(const page of pages){
  const html=fs.readFileSync(`dist/${lang}/${page==='index'?'':page+'/'}index.html`,'utf8'),url=new URL(pagePath(page,lang),SITE.url).href;
  assert.ok(html.includes(`<html lang="${lang==='zh'?'zh-CN':lang}"`));assert.ok(html.includes(`<title>${SEO[lang][page].title.replaceAll('&','&amp;')}</title>`));assert.ok(html.includes(`rel="canonical" href="${url}"`));
  for(const other of ['zh','en','my'])assert.ok(html.includes(`hreflang="${other}" href="${new URL(pagePath(page,other),SITE.url).href}"`));assert.ok(html.includes(`hreflang="x-default" href="${new URL(pagePath(page,'my'),SITE.url).href}"`));
  assert.doesNotMatch(html,/noindex|pyinnaya|chatgpt\.site/);assert.ok(html.includes('<h1'));assert.ok(html.includes('EducationalOrganization'));assert.ok(html.includes('https://www.facebook.com/profile.php?id=61595031160201'));assert.ok(html.includes('assets/share-card.png'));assert.ok(html.includes('og:image:width" content="1200"'));assert.ok(html.includes('og:image:height" content="630"'));
  if(page==='index')assert.ok(html.includes('class="graduate"'));if(page==='universities')assert.match(html,/Peking University/);if(page==='destinations')assert.match(html,/Xiamen University|厦门大学/);if(page==='scholarships')assert.match(html,/2026/);
  for(const match of html.matchAll(/(?:src|href)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){
   const path=match[1];assert.ok(path.startsWith(BASE_PATH),'Escapes project base: '+path);const local='dist/'+path.slice(BASE_PATH.length);assert.ok(fs.existsSync(local)||fs.existsSync(local+'index.html'),'Missing: '+local);
  }
 }
});
test('robots and sitemap cover exactly the 15 canonical URLs under the configured base',()=>{
 const robots=fs.readFileSync('dist/robots.txt','utf8'),xml=fs.readFileSync('dist/sitemap.xml','utf8');assert.match(robots,/User-agent: \*\nAllow: \//);assert.ok(robots.includes('Sitemap: '+SITE.url+'sitemap.xml'));
 const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,15);assert.equal(new Set(urls).size,15);for(const lang of ['zh','en','my'])for(const page of pages)assert.ok(urls.includes(new URL(pagePath(page,lang),SITE.url).href));
});
test('root defaults to Burmese, 404 exists, and route decoding supports subpaths',()=>{assert.ok(fs.readFileSync('dist/index.html','utf8').includes('content="0;url='+sitePath('index','my')));assert.ok(fs.existsSync('dist/404.html'));assert.ok(!fs.existsSync('dist/CNAME'));assert.deepEqual(siteRoute(BASE_PATH+'en/match/'),{lang:'en',page:'match'});assert.deepEqual(siteRoute(BASE_PATH+'zh/scholarships/'),{lang:'zh',page:'scholarships'});});
