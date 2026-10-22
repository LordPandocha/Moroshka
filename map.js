import {POINTS,GATES,CAMPS,EVENTS,COLORS,FINISH,SHORTCUTS} from './data.js?v=4';
import {icon,PAWNS} from './icons.js';

const art=new URL('./assets/siberia-river-v3.webp',import.meta.url).href;
const svgNS='http://www.w3.org/2000/svg';
const scaled=([x,y])=>[x*9,y*7.2];

function curvedRoute(points){
  const p=points.map(scaled);
  let d='M'+p[0][0]+' '+p[0][1];
  for(let i=0;i<p.length-1;i++){
    const a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],e=p[Math.min(p.length-1,i+2)];
    const c1=[b[0]+(c[0]-a[0])/7,b[1]+(c[1]-a[1])/7];
    const c2=[c[0]-(e[0]-b[0])/7,c[1]-(e[1]-b[1])/7];
    d+=' C'+c1[0]+' '+c1[1]+' '+c2[0]+' '+c2[1]+' '+c[0]+' '+c[1];
  }
  return d;
}

function addPath(svg,d,stroke,width,extra={}){
  const path=document.createElementNS(svgNS,'path');
  const attrs={d,fill:'none',stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...extra};
  Object.entries(attrs).forEach(([name,value])=>path.setAttribute(name,String(value)));
  svg.append(path);
}

function drawTrail(svg,points){
  const d=curvedRoute(points);
  addPath(svg,d,'#3b2c22',14,{'stroke-opacity':'.48'});
  addPath(svg,d,'#7a5636',10);
  addPath(svg,d,'#f6e4bd',6);
  addPath(svg,d,'#fffdf0',1.2,{'stroke-dasharray':'2 13'});
}

function drawCrossing(svg){
  // The river runs north–south. Both choices cross west→east between the same two piers.
  const rowing=curvedRoute(POINTS.slice(8,12));
  addPath(svg,rowing,'#074c70',9,{'stroke-opacity':'.65'});
  addPath(svg,rowing,'#f1ffff',3,{'stroke-dasharray':'4 9'});
  const motor=curvedRoute([POINTS[8],[53,47],POINTS[11]]);
  addPath(svg,motor,'#074c70',10,{'stroke-opacity':'.65'});
  addPath(svg,motor,'#fff9e9',4,{'stroke-dasharray':'7 8'});
}

function drawShortcuts(svg){
  GATES.filter(g=>g!==8).forEach(g=>{
    const d=curvedRoute([POINTS[g],POINTS[g+1+SHORTCUTS[g].bonus]]);
    addPath(svg,d,'#fff6dc',8,{'stroke-dasharray':'3 8'});
    addPath(svg,d,'#b95431',3,{'stroke-dasharray':'3 8'});
  });
}

export function renderMap(root,players=[]){
  root.replaceChildren();
  const image=document.createElement('img');
  image.className='map-art';
  image.src=art;
  image.alt='Рисованная игровая карта: от Муравленко через лес и две речные переправы к северному берегу';
  image.decoding='async';
  const svg=document.createElementNS(svgNS,'svg');
  svg.setAttribute('class','route-overlay');
  svg.setAttribute('viewBox','0 0 900 720');
  svg.setAttribute('aria-hidden','true');
  drawTrail(svg,POINTS.slice(0,9));
  drawCrossing(svg);
  drawTrail(svg,POINTS.slice(11));
  drawShortcuts(svg);
  root.append(image,svg);

  const layer=document.createElement('div');
  layer.className='map-points';
  POINTS.forEach(([x,y],i)=>{
    const node=document.createElement('div');
    node.className='point'+(i===0?' start':'')+(i===9||i===10?' water':'')+(GATES.includes(i)?' gate':'')+(CAMPS.includes(i)?' camp':'')+(EVENTS.includes(i)?' event':'')+(i===FINISH?' finish':'');
    node.style.left=x+'%';
    node.style.top=y+'%';
    node.innerHTML=i===FINISH?icon('berry'):String(i+1).padStart(2,'0');
    node.title=i===0?'Муравленко · старт':i===FINISH?'Северный берег · финиш':'Этап '+(i+1)+(i===8?' · выбор лодки':i===9||i===10?' · на вёслах':GATES.includes(i)?' · развилка':'');
    layer.append(node);
    if(i===0||i===FINISH){
      const label=document.createElement('span');
      label.className='map-label';
      label.style.left=x+'%';
      label.style.top=(y+4)+'%';
      label.textContent=i===0?'МУРАВЛЕНКО · СТАРТ':'СЕВЕРНЫЙ БЕРЕГ';
      layer.append(label);
    }
  });
  root.append(layer);
  const badgePlaces={3:[23,62],8:[38,42],13:[77,62]};
  GATES.forEach(g=>{
    const badge=document.createElement('span');
    badge.className='shortcut-label';
    badge.style.left=badgePlaces[g][0]+'%';
    badge.style.top=badgePlaces[g][1]+'%';
    badge.textContent=SHORTCUTS[g].name+' · +'+SHORTCUTS[g].bonus;
    root.append(badge);
  });

  const pawns=document.createElement('div');
  pawns.className='map-pawns';
  players.forEach((p,n)=>{
    const pawn=document.createElement('div');
    pawn.className='pawn pawn-'+PAWNS[n]+(p.pos===0?' at-start':'');
    pawn.dataset.player=n;
    pawn.style.setProperty('--pawn',COLORS[n]);
    const half=p.pos===0?15:22;
    pawn.style.left='calc('+POINTS[p.pos][0]+'% - '+half+'px + '+(n%2?14:-14)+'px)';
    pawn.style.top='calc('+POINTS[p.pos][1]+'% - '+half+'px + '+(n<2?-14:14)+'px)';
    pawn.title=p.name+' · точка '+(p.pos+1);
    pawn.setAttribute('aria-label',pawn.title);
    pawn.innerHTML=icon(PAWNS[n])+'<small>'+(n+1)+'</small>';
    const tag=document.createElement('b');
    tag.className='pawn-name';
    tag.textContent=p.name;
    pawn.append(tag);
    pawns.append(pawn);
  });
  root.append(pawns);
}

export async function animateMove(root,index,from,to,shortcut=false){
  if(from===to||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const pawn=root.querySelector('[data-player="'+index+'"]');
  if(!pawn)return;
  const end=POINTS[to],rect=root.getBoundingClientRect();
  const points=shortcut?
    from===8?[POINTS[from],[53,47],end]:
    [POINTS[from],[(POINTS[from][0]+end[0])/2,(POINTS[from][1]+end[1])/2-2],end]:
    POINTS.slice(from,to+1);
  const frames=points.map(([x,y])=>({transform:'translate('+((x-end[0])*rect.width/100)+'px,'+((y-end[1])*rect.height/100)+'px)'}));
  await pawn.animate(frames,{duration:Math.min(1000,300+(to-from)*100),easing:'ease-in-out'}).finished.catch(()=>{});
}
