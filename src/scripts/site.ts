import { animate, onScroll, svg, stagger } from 'animejs';
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('#navigation');
function closeMenu(){menu?.setAttribute('aria-expanded','false');nav?.classList.remove('open');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav?.classList.toggle('open',open);});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape' && menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let choice:string|null=null;try{choice=localStorage.getItem('waylan-motion');}catch{}
const enabled=choice==='off'?false:!reduced.matches;
const toggle=document.querySelector<HTMLButtonElement>('.motion-toggle');
if(toggle){toggle.textContent=`動態效果：${enabled?'開啟':'關閉'}`;toggle.setAttribute('aria-pressed',String(!enabled));toggle.addEventListener('click',()=>{try{localStorage.setItem('waylan-motion',enabled?'off':'on');}catch{}location.reload();});}
document.documentElement.classList.toggle('motion-off',!enabled);
if(enabled){
 const mobile=matchMedia('(max-width: 600px)').matches;
 animate('.hero-line',{y:[30,0],opacity:[0,1],delay:stagger(120),duration:900,ease:'outExpo'});
 const hero=document.querySelector<HTMLElement>('.hero');
 if(hero){
  animate('.geometry-plane',{rotate:(_: unknown,i=0)=>[i*3,i*12+35],transformOrigin:'50% 50%',autoplay:onScroll({target:hero,enter:'top top',leave:'top bottom',sync:.7}),ease:'linear'});
  animate('.orbit-dot',{rotate:[0,220],transformOrigin:'200px 200px',autoplay:onScroll({target:hero,enter:'top top',leave:'top bottom',sync:true}),ease:'linear'});
  const shape=hero.querySelector<SVGPathElement>('.morph-shape'),target=hero.querySelector<SVGPathElement>('.morph-target');
  if(shape&&target)animate(shape,{d:svg.morphTo(target),autoplay:onScroll({target:hero,enter:'top top',leave:'top bottom',sync:true}),ease:'linear'});
  animate('.hero-heading h1',{y:[0,mobile?-15:-45],autoplay:onScroll({target:hero,enter:'top top',leave:'top bottom',sync:true}),ease:'linear'});
 }
}
function progress(){const max=document.documentElement.scrollHeight-innerHeight;const el=document.querySelector<HTMLElement>('.reading-progress');if(el)el.style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,scrollY/max)):0})`;}
let frame=false;addEventListener('scroll',()=>{if(!frame){frame=true;requestAnimationFrame(()=>{progress();frame=false;});}},{passive:true});progress();
if(enabled){
 const small=matchMedia('(max-width: 600px)').matches;
 const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){animate(entry.target,{opacity:[.35,1],y:[small?16:28,0],duration:720,ease:'outCubic'});revealObserver.unobserve(entry.target);}}},{threshold:.08});
 document.querySelectorAll('[data-reveal]').forEach(el=>revealObserver.observe(el));
 document.querySelectorAll<HTMLElement>('[data-parallax]').forEach(el=>{animate(el,{y:[small?-8:-24,small?8:24],scale:[1.1,1.04],ease:'linear',autoplay:onScroll({target:el.parentElement!,enter:'bottom top',leave:'top bottom',sync:.75})});});
 document.querySelectorAll<HTMLElement>('.project-visual').forEach(el=>{
  if(el.querySelector('.system-node'))animate(el.querySelectorAll('.system-node'),{y:[22,0],opacity:[.3,1],delay:stagger(70),autoplay:onScroll({target:el,enter:'bottom top',leave:'center center',sync:true}),ease:'outCubic'});
  if(el.querySelector('.vision-scan'))animate(el.querySelector('.vision-scan')!,{top:['0%','95%'],autoplay:onScroll({target:el,enter:'bottom top',leave:'top bottom',sync:true}),ease:'linear'});
  if(el.querySelector('.registration-visual'))animate(el.querySelector('.registration-visual')!,{rotate:[-8,3],y:[15,-15],autoplay:onScroll({target:el,enter:'bottom top',leave:'top bottom',sync:true}),ease:'linear'});
  if(el.querySelector('.language-bracket'))animate(el.querySelectorAll('.language-bracket'),{x:(_: unknown,i=0)=>i===0?[-15,0]:[15,0],autoplay:onScroll({target:el,enter:'bottom top',leave:'center center',sync:true}),ease:'linear'});
 });
 const scene=document.querySelector<HTMLElement>('.process-section');
 if(scene && innerHeight>=650){
  scene.classList.add('motion-ready');
  const phases=scene.querySelectorAll<HTMLElement>('.process-stage');
  onScroll({target:scene,enter:'top top',leave:'bottom bottom',sync:true,onUpdate:self=>{const index=Math.min(2,Math.floor(self.progress*3));phases.forEach((p,i)=>{p.style.opacity=i===index?'1':'0';p.style.visibility=i===index?'visible':'hidden';p.setAttribute('aria-hidden',String(i!==index));});const meter=scene.querySelector<HTMLElement>('.process-meter span');if(meter)meter.style.transform=`scaleX(${Math.max(.05,self.progress)})`;}});
  animate('.process-diagram .layer',{y:(_: unknown,i=0)=>[0,-i*(small?10:30)],x:(_: unknown,i=0)=>[0,-i*(small?4:12)],rotate:(_: unknown,i=0)=>[0,small?0:-5+i*2],ease:'linear',autoplay:onScroll({target:scene,enter:'top top',leave:'bottom bottom',sync:true})});
 }
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){
  document.querySelectorAll<HTMLElement>('.project-image-link').forEach(link=>{const arrow=link.querySelector('.image-link-arrow');link.addEventListener('mouseenter',()=>{if(arrow)animate(arrow,{width:64,height:64,duration:220,ease:'outCubic'});});link.addEventListener('mouseleave',()=>{if(arrow)animate(arrow,{width:54,height:54,duration:220,ease:'outCubic'});});});
 }
}
const currentSectionObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('.site-header nav a').forEach(a=>{const active=a.getAttribute('href')===`/#${entry.target.id}`;if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}},{rootMargin:'-15% 0px -60% 0px'});
document.querySelectorAll('#work,#experience,#about').forEach(s=>currentSectionObserver.observe(s));
reduced.addEventListener('change',()=>location.reload());
async function recordVisit(){
 if(document.body.dataset.private==='true'||location.pathname==='/privacy/'||navigator.doNotTrack==='1'||(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl)return;
 try{if(localStorage.getItem('waylan-analytics')==='off')return;}catch{}
 if(document.visibilityState!=='visible')return;
 try{await fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:location.pathname,referrer:document.referrer}),keepalive:true,credentials:'same-origin'});}catch{/* Metrics must never interrupt reading. */}
}
if(document.visibilityState==='visible')void recordVisit();else document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void recordVisit();},{once:true});
