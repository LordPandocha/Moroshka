import {renderMap} from './map.js';
import {icon,PAWNS,PAWN_NAMES} from './icons.js';
import {COLORS} from './data.js';
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
renderMap(document.getElementById('previewMap'),[{name:'Олень',pos:7},{name:'Песец',pos:13}]);
document.getElementById('pawnShowcase').innerHTML=PAWNS.map((name,i)=>`<div class="pawn-sample" style="--pawn:${COLORS[i]}">${icon(name)}<span>${PAWN_NAMES[i]}</span></div>`).join('');
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.feature,.step,.map-showcase,.kit,.faq,.cta').forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});const hero=document.querySelector('.hero-photo>img');const pause=new IntersectionObserver(([entry])=>hero.style.animationPlayState=entry.isIntersecting?'running':'paused');pause.observe(hero);}
