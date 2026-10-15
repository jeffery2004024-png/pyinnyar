// A contact link opens Messenger only. No score or profile data is attached.
import {CONTACT} from './site-config.mjs';
import {SITE_COPY} from './site-copy.mjs';
import {messengerIcon,studentCasesHtml} from './site-components.mjs';
const locale=()=>document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang==='my'?'my':'en';
function sync(){
 const lang=locale(),t=SITE_COPY[lang];
 const cases=document.querySelector('#student-cases');if(cases&&cases.dataset.casesLang!==lang)cases.outerHTML=studentCasesHtml(lang);
 document.querySelectorAll('[data-shell-label]').forEach(el=>{const value=t[el.dataset.shellLabel];if(value&&el.textContent!==value)el.textContent=value;});
 document.querySelectorAll('[data-consult]').forEach(el=>{
  let a=el;
  if(el.tagName!=='A'){
   a=document.createElement('a');a.className=el.className;
   a.setAttribute('data-consult','');el.replaceWith(a);
  }
  a.href=CONTACT.messenger;a.target='_blank';a.rel='noopener noreferrer';a.classList.add('messenger-cta');a.setAttribute('data-messenger','');
  a.removeAttribute('data-t');a.removeAttribute('data-ui');a.removeAttribute('data-free-label');
  const floating=a.classList.contains('messenger-float');
  const label=floating?'Messenger':t.free;
  if(!a.querySelector('[data-messenger-icon]')||a.querySelector('span')?.textContent!==label)a.innerHTML=messengerIcon+`<span${floating?' class="float-label"':''}>${label}</span>`;
  const aria=t.free+' · '+t.newTab;if(a.getAttribute('aria-label')!==aria)a.setAttribute('aria-label',aria);
 });
}
new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
document.addEventListener('click',event=>{if(event.target.closest('.nav a')){document.querySelector('.nav')?.classList.remove('open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelector('.nav')?.classList.remove('open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');document.querySelectorAll('.more-tools[open]').forEach(e=>e.open=false);}});
// Leave a rail beside the document so the floating contact control cannot cover controls.
// Move above a raised software keyboard while keeping the current input visible.
if(window.visualViewport){const position=()=>{const lift=Math.max(0,window.innerHeight-visualViewport.height-visualViewport.offsetTop);document.documentElement.style.setProperty('--keyboard-lift',lift+'px');};visualViewport.addEventListener('resize',position);visualViewport.addEventListener('scroll',position);position();}
sync();
