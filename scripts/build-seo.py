"""Build crawlable language variants using the site's real content and official-source data."""
from html.parser import HTMLParser
from html import escape
from pathlib import Path
from urllib.parse import urlsplit
import sys,json,re
DATA=json.load(sys.stdin)
ROOT=Path('dist');ORIGIN=DATA['origin'];BASE=DATA['basePath'];SITE_URL=DATA['siteUrl'];LANGS=['zh','en','my'];PAGES=['index','match','universities','destinations','scholarships'];VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
def path(page,lang): return BASE+lang+'/'+('' if page=='index' else page+'/')
def tr(v,lang):return v if isinstance(v,str) else (v or {}).get(lang) or (v or {}).get('en') or (v or {}).get('zh') or ''
def e(v):return escape(str(v or ''),quote=True)
def sources(items):return '<ul>'+''.join('<li><a href="'+e(i['url'])+'" target="_blank" rel="noopener noreferrer">'+e(i['title'])+' ↗</a></li>' for i in items or [])+'</ul>'
def fallback(page,lang):
 u=DATA['UI'][lang];d={**u,**DATA['S'][lang],**DATA['D'][lang]};copy=DATA['SEO'][lang][page]
 out='<section class="seo-preview"><h1>'+e(copy['title'].split('｜')[0].split(' | ')[0])+'</h1><p>'+e(copy['description'])+'</p>'
 if page=='match':
  out+='<p>'+e(DATA['HOME'][lang]['matchCountries'])+'</p><ul>'+''.join('<li>'+e(d[k])+'</li>' for k in ['matriculation','chineseSchool','ged','alevel'])+'</ul><p>HSK · IELTS Academic · CSCA · SAT · AP</p><p>'+e(u['loading'])+'</p>'
 elif page=='universities':
  data=json.loads((ROOT/'data/universities.json').read_text());out+='<p>'+e(tr(data['classificationNote'],lang))+'</p><div class="school-list">'
  for s in data['schools']:
   name=s['zh'] if lang=='zh' else s['en'];out+='<article class="school-card"><div class="school-card-main"><p>'+e(d[s['country']])+' · '+e(s['city'])+'</p><h2>'+e(name)+'</h2><p>'+e(s['en'] if lang=='zh' else s['zh'])+'</p>'
   out+='<p>'+e(u['official'] if s['routes'] else u['catalogOnly'])+'</p>'
   for r in s['routes']:out+='<h3>'+e(tr(r['label'],lang))+'</h3>'+sources(r.get('sources'))
   out+=sources(s['sources'])+'<a href="'+e(s['website'] or s['admissionsUrl'])+'" target="_blank" rel="noopener noreferrer">'+e(d['officialSchool'])+'</a></div></article>'
  out+='</div>'
 elif page=='destinations':
  data=json.loads((ROOT/'data/destinations.json').read_text())
  for country in data['countries']:
   out+='<section><h2>'+e(d[country['country']])+'</h2><p>'+e(tr(country['overview'],lang))+'</p>'
   for c in country.get('regions',[country]):
    if c.get('title'):out+='<h3>'+e(tr(c['title'],lang))+'</h3><p>'+e(tr(c['overview'],lang))+'</p>'
    for section in c.get('sections',[]):out+='<h3>'+e(tr(section.get('title'),lang))+'</h3><p>'+e(tr(section.get('text') or section.get('body'),lang))+'</p>'+sources(section.get('sources'))
    for school in c.get('universities',[]):out+='<article><h3>'+e(school['nameZh'] if lang=='zh' else school['nameEn'])+'</h3><p>'+e(tr(school['description'],lang))+'</p>'+sources(school.get('sources'))+'</article>'
   out+='</section>'
 elif page=='scholarships':
  data=json.loads((ROOT/'data/scholarships.json').read_text());out+='<p>'+e(d['scope'])+'</p>'
  for a in data['scholarships']:
   # Include qualification and timing caveats in the same visible static article.
   out+='<article class="seo-award"><h2>'+e(tr(a['name'],lang))+'</h2><p>'+e(tr(a['provider'],lang))+' · '+e(d[a['country']])+'</p><dl>'
   for key in ['eligibility','coverage','application','obligations','timing']:out+='<dt>'+e(d[key])+'</dt><dd>'+e(tr(a[key],lang))+'</dd>'
   if a.get('deadline'):out+='<dt>'+e(d['deadline'])+'</dt><dd>'+e(a['deadline'])+'</dd>'
   out+='</dl>'+sources(a.get('sources'))+'</article>'
 return out+'</section>'
class Localize(HTMLParser):
 def __init__(self,page,lang):super().__init__(convert_charrefs=False);self.page=page;self.lang=lang;self.out=[];self.depth=0;self.replace_button=False;self.home=DATA['HOME'][lang];self.ui=DATA['UI'][lang];self.ui={**self.ui,**DATA['S'][lang],**DATA['D'][lang]} if page=='destinations' else {**self.ui,**DATA['S'][lang]} if page=='scholarships' else self.ui
 def handle_decl(self,data):self.out.append('<!'+data+'>')
 def handle_comment(self,data):
  if not self.depth:self.out.append('<!--'+data+'-->')
 def handle_starttag(self,tag,attrs):
  if self.depth:
   if tag not in VOID:self.depth+=1
   return
  attrs=dict(attrs);content=None
  if 'data-consult' in attrs:
   if tag=='button':tag='a';self.replace_button=True
   attrs.pop('type',None);attrs.pop('data-t',None);attrs.pop('data-free-label',None)
   attrs['href']=DATA['CONTACT']['messenger'];attrs['target']='_blank';attrs['rel']='noopener noreferrer'
   attrs['class']=' '.join(dict.fromkeys((attrs.get('class','')+' messenger-cta').split()))
   attrs['aria-label']=DATA['SITE_COPY'][self.lang]['free']+' · '+DATA['SITE_COPY'][self.lang]['newTab']
   content=DATA['messengerIcon']+'<span>'+e('Messenger' if 'messenger-float' in attrs['class'] else DATA['SITE_COPY'][self.lang]['free'])+'</span>'
  if tag=='html':attrs['lang']={'zh':'zh-CN','en':'en','my':'my'}[self.lang];attrs['data-seo-page']=self.page
  if tag=='meta' and attrs.get('name')=='description':attrs['content']=DATA['SEO'][self.lang][self.page]['description']
  if tag=='title':content=e(DATA['SEO'][self.lang][self.page]['title'])
  if 'data-t' in attrs:content=self.home.get(attrs['data-t'])
  if 'data-ui' in attrs:content=e(self.ui.get(attrs['data-ui'],attrs['data-ui']))
  if 'data-free-label' in attrs:content=e(DATA['CONSULTATION'][self.lang]['free'])+' ↗'
  if 'data-lang' in attrs:attrs['aria-pressed']=str(attrs['data-lang']==self.lang).lower()
  if tag=='img' and 'graduate' in attrs.get('class',''):attrs['alt']=self.home['imageAlt']
  initial=self.home['paths']['my'];ids={'pathTag':initial['tag'],'pathTitle':initial['title'],'pathDescription':initial['description'],'pathList':''.join('<li>'+e(v)+'</li>' for v in initial['list']),'pathCta':initial['cta']}
  if self.page=='index' and attrs.get('id') in ids:content=ids[attrs['id']]
  for key in ['src','href']:
   if key not in attrs:continue
   value=attrs[key];parsed=urlsplit(value)
   if parsed.scheme or parsed.netloc:continue
   if key=='src' or tag=='link':attrs[key]=BASE+value.removeprefix(BASE).lstrip('/')
   elif tag=='a':
    if value.startswith('#'):attrs[key]=path(self.page,self.lang)+value
    else:
     name=parsed.path.removeprefix(BASE).strip('/').removesuffix('.html');name=re.sub(r'^(en|my|zh)/','',name)
     if name in PAGES or name=='':attrs[key]=path(name or 'index',attrs.get('data-locale-link') or self.lang)+('?' + parsed.query if parsed.query else '')+('#'+parsed.fragment if parsed.fragment else '')
  self.out.append('<'+tag+''.join(' '+k+('="'+e(v)+'"' if v is not None else '') for k,v in attrs.items())+'>')
  if content is not None and tag not in VOID:self.out.append(content);self.depth=1
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if tag not in VOID:self.handle_endtag(tag)
 def handle_endtag(self,tag):
  if self.depth:
   self.depth-=1
   if self.depth:return
  if self.replace_button and tag=='button':tag='a';self.replace_button=False
  self.out.append('</'+tag+'>')
 def handle_data(self,text):
  if not self.depth:self.out.append(text)
 def handle_entityref(self,name):
  if not self.depth:self.out.append('&'+name+';')
 def handle_charref(self,name):
  if not self.depth:self.out.append('&#'+name+';')
def metadata(page,lang):
 copy=DATA['SEO'][lang][page];url=ORIGIN+path(page,lang)
 graph={'@context':'https://schema.org','@graph':[{'@type':'EducationalOrganization','@id':SITE_URL+'#organization','name':'PyinNyar study abroad','url':SITE_URL,'logo':SITE_URL+'assets/favicon.svg','areaServed':{'@type':'Country','name':'Myanmar'},'sameAs':[DATA['CONTACT']['facebook']]},{'@type':'WebSite','@id':SITE_URL+'#website','url':SITE_URL,'name':'PyinNyar study abroad','inLanguage':['zh-CN','my','en'],'publisher':{'@id':SITE_URL+'#organization'}},{'@type':'WebPage','@id':url+'#webpage','url':url,'name':copy['title'],'description':copy['description'],'inLanguage':{'zh':'zh-CN','my':'my','en':'en'}[lang],'isPartOf':{'@id':SITE_URL+'#website'}}]}
 tags=['<link rel="stylesheet" href="'+BASE+'improvements.css">','<base href="'+BASE+'">','<meta name="site-base" content="'+BASE+'">','<meta name="site-origin" content="'+ORIGIN+'">','<meta name="robots" content="index,follow,max-image-preview:large">','<link rel="canonical" href="'+url+'">']
 if page=='match':tags+=['<script>document.documentElement.classList.add("match-enhanced")</script>','<noscript><style>.match-loading{display:none!important}</style></noscript>']
 if DATA.get('googleSiteVerification'):tags.append('<meta name="google-site-verification" content="'+e(DATA['googleSiteVerification'])+'">')
 tags+=['<link rel="alternate" hreflang="'+l+'" href="'+ORIGIN+path(page,l)+'">' for l in LANGS]
 tags+=['<link rel="alternate" hreflang="x-default" href="'+ORIGIN+path(page,'my')+'">']
 values={'og:type':'website','og:site_name':'PyinNyar study abroad','og:title':copy['title'],'og:description':copy['description'],'og:url':url,'og:locale':{'zh':'zh_CN','en':'en_US','my':'my_MM'}[lang],'og:image:width':'1200','og:image:height':'630','og:image:type':'image/png','og:image:alt':'PyinNyar study abroad — guidance for Myanmar students','og:image':SITE_URL+'assets/share-card.png'}
 tags+=['<meta property="'+k+'" content="'+e(v)+'">' for k,v in values.items()]
 tags+=['<meta name="'+k+'" content="'+e(v)+'">' for k,v in {'twitter:card':'summary_large_image','twitter:title':copy['title'],'twitter:description':copy['description'],'twitter:image':SITE_URL+'assets/share-card.png'}.items()]
 tags+=['<link rel="stylesheet" href="'+BASE+'seo.css">','<script type="module" src="'+BASE+'seo.mjs"></script>','<script type="application/ld+json">'+json.dumps(graph,ensure_ascii=False).replace('<','\\u003c')+'</script>']
 return '<!-- SEO START -->'+''.join(tags)+'<!-- SEO END -->'
for page in PAGES:
 template=(Path('templates')/(page+'.html')).read_text()
 template=re.sub(r'<!-- SEO START -->.*?<!-- SEO END -->','',template,flags=re.S)
 template=re.sub(r'<!-- LANG LINKS START -->.*?<!-- LANG LINKS END -->','',template,flags=re.S)
 template=re.sub(r'<a class="[^"]*messenger-float[^"]*".*?</a>','',template,flags=re.S)
 template=re.sub(r'<div class="match-loading wrap".*?(?=<main)','',template,flags=re.S)
 for lang in LANGS:
  html=template
  html=re.sub(r'<header\b.*?</header>',DATA['CHROME'][lang]['headers'][page],html,count=1,flags=re.S)
  html=re.sub(r'<footer\b.*?</footer>',DATA['CHROME'][lang]['footer'],html,count=1,flags=re.S)
  html=html.replace('<!-- STUDENT CASES -->',DATA['CHROME'][lang]['cases'])
  html=html.replace('</body>',DATA['CHROME'][lang]['floating']+'</body>')
  if page=='match':
   loader='<div class="match-loading wrap" role="status" aria-live="polite"><p>'+e(DATA['SITE_COPY'][lang]['matchLoading'])+'</p><div class="skeleton skeleton-title"></div><div class="skeleton"></div><div class="skeleton skeleton-card"></div></div>'
   html=html.replace('<main',loader+'<main',1)
  if page!='index':html=re.sub(r'<div id="page" class="wrap">.*?</div></main>','<div id="page" class="wrap">'+fallback(page,lang)+'</div></main>',html,flags=re.S)
  links='<nav class="seo-language-links" aria-label="Languages">'+''.join('<a data-locale-link="'+l+'" href="'+path(page,l)+'" lang="'+{'zh':'zh-CN','en':'en','my':'my'}[l]+'">'+{'zh':'中文','en':'English','my':'မြန်မာ'}[l]+'</a>' for l in LANGS)+'</nav>'
  html=html.replace('</footer>','<!-- LANG LINKS START -->'+links+'<!-- LANG LINKS END --></footer>')
  parser=Localize(page,lang);parser.feed(html);html=''.join(parser.out);html=html.replace('</head>',metadata(page,lang)+'</head>')
  directory=ROOT/lang if page=='index' else ROOT/lang/page;directory.mkdir(exist_ok=True,parents=True);(directory/'index.html').write_text(html)
urlset=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for page in PAGES:
 for lang in LANGS:
  urlset.append('<url><loc>'+ORIGIN+path(page,lang)+'</loc>')
  for l in LANGS:urlset.append('<xhtml:link rel="alternate" hreflang="'+l+'" href="'+ORIGIN+path(page,l)+'" />')
  urlset.append('<xhtml:link rel="alternate" hreflang="x-default" href="'+ORIGIN+path(page,'my')+'" /></url>')
urlset.append('</urlset>');(ROOT/'sitemap.xml').write_text('\n'.join(urlset)+'\n')
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+SITE_URL+'sitemap.xml\n')
print('Generated 15 localized HTML pages, robots.txt and sitemap.xml.')
