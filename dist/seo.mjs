import {SEO,pagePath} from './seo-i18n.mjs';
import {SITE,BASE_PATH,siteRoute} from './site-config.mjs';
const page=document.documentElement.dataset.seoPage||'index';
const locale=()=>document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang==='my'?'my':'en';
function linkPages(lang){
 document.querySelectorAll('a[href]').forEach(a=>{
  const value=a.getAttribute('href');if(!value||/^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(value))return;
  const url=new URL(value,document.baseURI);if(url.origin!==location.origin)return;
  if(!url.pathname.startsWith(BASE_PATH))return;
  const target=siteRoute(url.pathname).page;
  if(!['index','match','universities','destinations','scholarships'].includes(target))return;
  const href=pagePath(target,a.dataset.localeLink||lang)+url.search+url.hash;
  if(value!==href)a.setAttribute('href',href);
 });
}
function sync(){
 const lang=locale(),url=new URL(pagePath(page,lang),SITE.url).href,copy=SEO[lang][page];
 const path=pagePath(page,lang);if(location.pathname!==path)history.replaceState(null,'',path+location.search+location.hash);
 document.title=copy.title;document.querySelector('meta[name=description]').content=copy.description;document.querySelector('link[rel=canonical]').href=url;
 for(const [property,value] of Object.entries({'og:title':copy.title,'og:description':copy.description,'og:url':url,'og:locale':{zh:'zh_CN',en:'en_US',my:'my_MM'}[lang],'twitter:title':copy.title,'twitter:description':copy.description}))document.querySelector(`meta[property="${property}"],meta[name="${property}"]`).content=value;
 linkPages(lang);
}
new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
new MutationObserver(()=>linkPages(locale())).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});sync();
