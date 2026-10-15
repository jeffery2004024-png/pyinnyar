// Public business channels. Leave unknown channels empty; empty fields are not rendered.
export const CONTACT = Object.freeze({
  "messenger": "https://m.me/1353286931204662",
  "facebook": "https://www.facebook.com/profile.php?id=61595031160201",
  "viber": "",
  "phone": "",
  "email": "",
  "address": "",
  "whatsapp": "",
  "wechat": "",
  "instagram": ""
});

// Single source of truth for deployment origin and base path. Keep a trailing slash.
export const SITE = Object.freeze({
 url: 'https://jeffery2004024-png.github.io/pyinnyar/',
 name: 'PyinNyar study abroad',
 defaultLanguage: 'my',
 languages: ['my','zh','en']
});
export const BASE_PATH = new URL(SITE.url).pathname;
export const assetPath = file => BASE_PATH + file.replace(/^\/+/, '');
export const sitePath = (page='index', lang=SITE.defaultLanguage) => BASE_PATH + lang + '/' + (page==='index'?'':page+'/');
export function siteRoute(pathname){
 let value=pathname.startsWith(BASE_PATH)?pathname.slice(BASE_PATH.length):pathname.replace(/^\//,'');
 value=value.replace(/\.html$/,'').replace(/\/+$/,'');
 const bits=value.split('/').filter(Boolean),lang=SITE.languages.includes(bits[0])?bits.shift():SITE.defaultLanguage;
 return {lang,page:!bits.length||bits[0]==='index'?'index':bits[0]};
}
