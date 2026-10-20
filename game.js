import * as THREE from './vendor/three.module.js';
import {START_CASH, LAP_SALARY, ROUNDS, rub, discounted, rentFor, netWorth, pay} from './economy.js';

const TILE_DATA = [
  {name:'Старт',kind:'start',icon:'↗',text:'Каждый полный круг приносит 200 ₽ зарплаты.'},
  {name:'Парковый бульвар',kind:'plot',icon:'♣',price:3,rent:1,text:'Любимое пространство для прогулок. Купите его и получайте аренду.'},
  {name:'Морошковая поляна',kind:'berry',icon:'✳',reward:2,text:'Ягоды поспели! Возьмите 2 морошки.'},
  {name:'Городской музей',kind:'plot',icon:'▣',price:4,rent:2,text:'Эколого-краеведческий музей хранит истории города. Его можно купить в игре.'},
  {name:'Северный ветер',kind:'storm',icon:'❄',text:'Метель забирает 2 морошки. Олень может защитить вас.'},
  {name:'Оленья тропа',kind:'deer',icon:'♞',text:'Встреча с оленем: получите жетон защиты от метели.'},
  {name:'Джекпот',kind:'jackpot',icon:'★',text:'Северный джекпот! Случайный приз ждёт вас.'},
  {name:'Дом культуры',kind:'plot',icon:'♫',price:3,rent:1,text:'Площадка для встреч и праздников. Купите её в свой маршрут.'},
  {name:'Лесная тропа',kind:'berry',icon:'✳',reward:2,text:'Найдите 2 морошки среди северных сосен.'},
  {name:'Сосновый сквер',kind:'plot',icon:'♠',price:3,rent:1,text:'Тихое место среди деревьев. Купите его в свой маршрут.'},
  {name:'Помощь соседу',kind:'bonus',icon:'♡',reward:2,text:'Вы помогли соседу и получили 2 морошки.'},
  {name:'Морошковая поляна',kind:'berry',icon:'✳',reward:3,text:'Большая корзинка ягод! Возьмите 3 морошки.'},
  {name:'Северное сияние',kind:'bonus',icon:'✧',reward:1,text:'Вдохновение под северным небом. Получите 1 морошку.'},
  {name:'Нефтяная вышка',kind:'plot',icon:'◆',price:4,rent:2,text:'Игровое напоминание об истории освоения месторождений. Купите клетку.'},
  {name:'Оленья тропа',kind:'deer',icon:'♞',text:'Олень станет вашим спутником и защитит от одной метели.'},
  {name:'Тёплый дом',kind:'plot',icon:'⌂',price:3,rent:1,text:'Окошки светятся даже в зимний вечер. Купите уютный уголок.'},
  {name:'Джекпот',kind:'jackpot',icon:'★',text:'Проверьте, что принёс северный джекпот.'},
  {name:'Полярный экспресс',kind:'plot',icon:'➤',price:4,rent:2,text:'По игровому маршруту мчится полярный экспресс. Купите станцию.'},
  {name:'Морошковая поляна',kind:'berry',icon:'✳',reward:2,text:'Ещё две ягоды для вашей корзинки.'},
  {name:'Зимний вечер',kind:'storm',icon:'❄',text:'Снегопад замедляет путь и забирает 2 морошки. Олень защищает.'},
  {name:'Семейный парк',kind:'plot',icon:'♣',price:3,rent:1,text:'Место для прогулок всей семьёй. Купите его в игре.'},
  {name:'Добрая встреча',kind:'bonus',icon:'♡',reward:2,text:'Друзья угостили вас морошкой. Получите 2 ягоды.'},
  {name:'Ямальская тайга',kind:'plot',icon:'♠',price:4,rent:2,text:'Сказочный участок тайги на нашем поле. Его можно купить.'},
  {name:'Ягодный привал',kind:'berry',icon:'✳',reward:2,text:'Перед новым кругом возьмите ещё 2 морошки.'}
];

const PRICES = {1:[160,30,90,'отдых'],3:[180,35,100,'культура'],7:[170,30,90,'культура'],9:[150,25,80,'отдых'],13:[320,70,160,'энергия'],15:[190,35,100,'сервис'],17:[240,45,120,'транспорт'],20:[180,35,100,'отдых'],22:[220,40,110,'природа']};
for (const [index, [price,rent,upgrade,category]] of Object.entries(PRICES)) Object.assign(TILE_DATA[index],{price,rent,upgrade,category});
TILE_DATA[13].name='Нефтяная качалка';
TILE_DATA[13].text='Промышленный актив: аренда при визите соперника и 80 ₽ добычного дохода за каждый круг владельца.';
for(const index of [2,8,11,12,18,23]){TILE_DATA[index].kind='chance';TILE_DATA[index].icon='✦';TILE_DATA[index].name='Северный шанс';TILE_DATA[index].text='Возьмите карту северного шанса.'}
for(const index of [5,10,14,21]){TILE_DATA[index].kind='fund';TILE_DATA[index].icon='◇';TILE_DATA[index].name='Городской фонд';TILE_DATA[index].text='Возьмите карту городского фонда.'}
TILE_DATA[4]={name:'Северные расходы',kind:'tax',icon:'−',cost:80,text:'Платёж в банк: 80 ₽.'};
TILE_DATA[19]={name:'Зимние расходы',kind:'tax',icon:'−',cost:100,text:'Платёж в банк: 100 ₽.'};
TILE_DATA[6]={name:'Морошковый джекпот',kind:'jackpot',icon:'★',text:'Случайный денежный приз.'};
TILE_DATA[16]={name:'Олений джекпот',kind:'jackpot',icon:'★',text:'Случайный денежный приз.'};
const CARDS = {
 chance:[
  {title:'Карта «Морошка»',text:'Три покупки или улучшения предприятий категорий «отдых», «культура» и «сервис» со скидкой 10%.',type:'discount',value:3},
  {title:'Удачная ярмарка',text:'Продажа северных сувениров: получите из банка 140 ₽.',type:'cash',value:140},
  {title:'Помощь оленеводам',text:'Передайте в городской фонд 70 ₽.',type:'cash',value:-70},
  {title:'Северная поставка',text:'Банк выплачивает вам 100 ₽.',type:'cash',value:100},
  {title:'Ремонт техники',text:'Потратьте 90 ₽ на ремонт.',type:'cash',value:-90}
 ],
 fund:[
  {title:'Дорога к отпуску',text:'Игровая компенсация поездки: получите 120 ₽. Реальная льгота зависит от условий закона и работодателя.',type:'cash',value:120},
  {title:'Северная надбавка',text:'Игровая премия за труд на Севере: получите 100 ₽.',type:'cash',value:100},
  {title:'Районный коэффициент',text:'Разовый игровой бонус к зарплате: получите 80 ₽.',type:'cash',value:80},
  {title:'Городской субботник',text:'Вклад в город: заплатите 60 ₽ в банк.',type:'cash',value:-60},
  {title:'Семейный фестиваль',text:'Городской фонд выплачивает 110 ₽.',type:'cash',value:110}
 ]
};

const POSITIONS = [];
for(let c=0;c<7;c++) POSITIONS.push([0,c]);
for(let r=1;r<7;r++) POSITIONS.push([r,6]);
for(let c=5;c>=0;c--) POSITIONS.push([6,c]);
for(let r=5;r>=1;r--) POSITIONS.push([r,0]);
const COLORS = [0xf18b50,0x77c8bb,0xecc867,0xb89fe1];
const DICE = ['⚀','⚁','⚂','⚃','⚄','⚅'];
const kindColors = {start:0xf2ad70,plot:0xe7e2cb,chance:0xd3b182,fund:0xa5c3bd,tax:0xb7776d,jackpot:0xf4b257};
const $ = id => document.getElementById(id);
const sceneWrap = $('sceneWrap');
const setupDialog = $('setupDialog');
const tileDialog = $('tileDialog');
const winnerDialog = $('winnerDialog');
const roundLabel = $('roundLabel');
const rollButton = $('rollButton');
const endTurnButton = $('endTurnButton');
const choiceActions = $('choiceActions');
let renderer, scene, camera, board, raycaster;
let tileMeshes = [], ownerMarkers = [], tokenMeshes = [];
let players = [], owners = Array(TILE_DATA.length).fill(null);
let turn = 0, turnsTaken = 0, phase = 'setup', pendingTile = -1;
let theta = .62, phi = .94, distance = 19;
let pointerStart = null;
let sceneVisible = true;
const pumpBeams=[];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

function coord(index){const [r,c]=POSITIONS[index];return new THREE.Vector3((c-3)*1.52,0,(r-3)*1.52)}
function material(color,roughness=.86){return new THREE.MeshStandardMaterial({color,roughness,metalness:.04})}
function mesh(geometry,mat,x,y,z,parent=board){const part=new THREE.Mesh(geometry,mat);part.position.set(x,y,z);part.castShadow=true;part.receiveShadow=true;parent.add(part);return part}
function box(w,h,d,mat,x,y,z,parent=board){return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent)}
function sphere(rad,mat,x,y,z,parent=board){return mesh(new THREE.SphereGeometry(rad,12,9),mat,x,y,z,parent)}
function cone(rad,h,mat,x,y,z,parent=board){return mesh(new THREE.ConeGeometry(rad,h,7),mat,x,y,z,parent)}

function labelTexture(title,icon){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,384,256);ctx.fillStyle='#15313a';ctx.textAlign='center';
  ctx.font='bold 68px Arial';ctx.fillText(icon,192,84);
  ctx.font='bold 29px Manrope, Arial';
  const words=title.split(' ');let lines=[''];
  words.forEach(word=>{const test=lines[lines.length-1]+' '+word;if(ctx.measureText(test).width>340&&lines[lines.length-1])lines.push(word);else lines[lines.length-1]=test.trim()});
  lines.slice(0,3).forEach((line,i)=>ctx.fillText(line,192,145+i*34));
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex;
}

function pine(x,z,size=1,parent=board){
  const trunk=material(0x7d5845),leaf=material(0x214c4a);
  box(.09*size,.4*size,.09*size,trunk,x,.26*size,z,parent);
  cone(.31*size,.66*size,leaf,x,.64*size,z,parent);
  cone(.24*size,.55*size,leaf,x,.94*size,z,parent);
  cone(.17*size,.43*size,leaf,x,1.18*size,z,parent);
}
function house(x,z,size=1,parent=board){
  const wall=material(0xe9d9ad),roof=material(0xb8674b),light=new THREE.MeshStandardMaterial({color:0xf6c573,emissive:0xe58e46,emissiveIntensity:.25});
  box(.5*size,.46*size,.43*size,wall,x,.28*size,z,parent);
  const top=cone(.4*size,.29*size,roof,x,.67*size,z,parent);top.rotation.y=Math.PI/4;
  box(.12*size,.12*size,.006*size,light,x,.32*size,z+.218*size,parent);
}
function deer(x,z,size=1,parent=board){
  const fur=material(0xb8916c),antler=material(0xe6d0a2);
  const body=sphere(.24*size,fur,x,.43*size,z,parent);body.scale.set(1.5,.8,.75);
  box(.1*size,.32*size,.1*size,fur,x-.2*size,.18*size,z-.12*size,parent);
  box(.1*size,.32*size,.1*size,fur,x+.18*size,.18*size,z+.1*size,parent);
  const neck=box(.13*size,.39*size,.14*size,fur,x+.29*size,.62*size,z,parent);neck.rotation.z=-.22;
  sphere(.14*size,fur,x+.38*size,.85*size,z,parent);
  for(const side of [-1,1]){const a=box(.025*size,.32*size,.025*size,antler,x+.37*size,1.08*size,z+side*.09*size,parent);a.rotation.x=side*.38;}
}
function oilPump(x,z,parent=board){
  const steel=material(0x8d6654),dark=material(0x183f49);
  box(.58,.05,.4,dark,x,.05,z,parent);box(.06,.52,.06,steel,x-.12,.3,z,parent);
  const pivot=new THREE.Group();pivot.position.set(x-.12,.61,z);parent.add(pivot);
  box(.8,.08,.1,steel,.2,0,0,pivot);
  box(.14,.17,.14,material(0xe1a85a),-.29,-.08,0,pivot);
  box(.045,.34,.045,dark,.54,-.23,0,pivot);
  pumpBeams.push(pivot);
}
function cloudberry(x,z,parent=board){
  const orange=material(0xf3954d),green=material(0x4c8466);
  for(let i=0;i<4;i++){const angle=i*Math.PI/2;sphere(.08,orange,x+Math.cos(angle)*.09,.33,z+Math.sin(angle)*.09,parent)}
  sphere(.09,orange,x,.39,z,parent);cone(.13,.15,green,x,.52,z,parent);
}
function tileDecoration(tile,x,z,group){
  if(tile.kind==='berry'){cloudberry(x-.33,z-.35,group);cloudberry(x+.35,z+.33,group)}
  if(tile.kind==='plot'&&tile.icon==='♠')pine(x-.38,z-.37,.42,group);
  if(tile.kind==='plot'&&tile.icon==='♣')pine(x-.38,z-.37,.35,group);
  if(tile.kind==='plot'&&tile.icon==='⌂')house(x-.36,z-.35,.5,group);
  if(tile.icon==='◆')oilPump(x-.3,z-.3,group);
  if(tile.kind==='deer')deer(x-.26,z-.28,.55,group);
  if(tile.kind==='jackpot')sphere(.16,material(0xf5c376),x-.35,.48,z-.33,group);
}

function makeBoard(){
  board=new THREE.Group();scene.add(board);
  const edge=material(0x9c744f),side=material(0x6e503b),top=material(0x244f50),snow=material(0xeff1df),path=material(0x8fa99c);
  box(11.05,.45,11.05,side,0,-.39,0);
  box(10.95,.12,10.95,edge,0,-.11,0);
  box(10.55,.09,10.55,top,0,-.025,0);
  box(7.3,.08,7.3,path,0,.055,0);
  box(6.6,.04,6.6,snow,0,.11,0);
  const center=box(5.45,.14,5.45,material(0x326067),0,.18,0);center.receiveShadow=true;
  box(2.6,.14,1.45,material(0x4a7b77),0,.31,.35);
  for(let i=0;i<16;i++){const a=i*2.3999;const radius=1.5+(i%3)*.43;pine(Math.cos(a)*radius,Math.sin(a)*radius,.45+(i%4)*.13)}
  house(-.5,-.4,.8);house(.65,-.75,.64);house(.35,.9,.58);
  oilPump(-1.3,.1);deer(1.4,.35,.85);
  const disc=mesh(new THREE.CylinderGeometry(.7,.7,.12,32),material(0xf1b46d),0,.37,.25);
  disc.receiveShadow=true;
  for(let i=0;i<TILE_DATA.length;i++){
    const tile=TILE_DATA[i],pos=coord(i),group=new THREE.Group();board.add(group);
    const topMat=material(kindColors[tile.kind]);
    const tileMesh=box(1.46,.16,1.46,topMat,pos.x,.22,pos.z,group);
    tileMesh.userData.tileIndex=i;tileMeshes.push(tileMesh);
    const tex=labelTexture(tile.name,tile.icon);
    const label=new THREE.Mesh(new THREE.PlaneGeometry(1.27,.9),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
    label.rotation.x=-Math.PI/2;label.position.set(pos.x,.306,pos.z+.1);group.add(label);
    const marker=mesh(new THREE.CylinderGeometry(.115,.115,.04,16),material(0xffffff),pos.x+.52,.34,pos.z-.52,group);
    marker.visible=false;ownerMarkers.push(marker);
    tileDecoration(tile,pos.x,pos.z,group);
  }
}

function makeToken(color,index){
  const token=new THREE.Group();board.add(token);
  const coat=material(color,.38),cream=material(0xfff2d8);
  const base=mesh(new THREE.CylinderGeometry(.19,.23,.11,20),coat,0,.44,0,token);
  base.castShadow=true;
  cone(.18,.38,coat,0,.66,0,token);
  sphere(.14,cream,0,.9,0,token);
  const pom=sphere(.085,coat,0,1.03,0,token);
  pom.castShadow=true;
  token.userData.index=index;tokenMeshes.push(token);return token;
}
function tokenPosition(player,index){const pos=coord(player.position);const offsets=[[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]];return new THREE.Vector3(pos.x+offsets[index][0],0,pos.z+offsets[index][1])}
function updateTokens(){tokenMeshes.forEach((token,index)=>{token.visible=Boolean(players[index]);if(players[index])token.position.copy(tokenPosition(players[index],index))});render()}
function updateOwnerMarkers(){ownerMarkers.forEach((marker,index)=>{const owner=owners[index];marker.visible=owner!==null; if(owner!==null)marker.material.color.setHex(COLORS[owner])});render()}

function initThree(){
  try{
    renderer=new THREE.WebGLRenderer({canvas:$('gameCanvas'),antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x153846);
    scene.fog=new THREE.Fog(0x153846,25,45);
    camera=new THREE.PerspectiveCamera(40,1,.1,90);
    scene.add(new THREE.HemisphereLight(0xdaf7f3,0x4b5e63,2.7));
    const light=new THREE.DirectionalLight(0xffdbab,3.6);light.position.set(-5,13,7);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-9;light.shadow.camera.right=9;light.shadow.camera.top=9;light.shadow.camera.bottom=-9;scene.add(light);
    const rim=new THREE.DirectionalLight(0x7dc6d3,1.5);rim.position.set(6,5,-8);scene.add(rim);
    const ground=mesh(new THREE.CircleGeometry(19,64),material(0x153846),0,-.65,0,scene);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
    raycaster=new THREE.Raycaster();makeBoard();for(let i=0;i<4;i++)makeToken(COLORS[i],i);
    resize();updateCamera();$('sceneStatus').textContent='ПОЛЕ ГОТОВО';
    new ResizeObserver(resize).observe(sceneWrap);
    new IntersectionObserver(entries=>{sceneVisible=entries[0].isIntersecting;if(sceneVisible)render()},{threshold:.01}).observe(sceneWrap);
    let last=0;function animate(time){requestAnimationFrame(animate);if(!sceneVisible||document.hidden||reducedMotion.matches||time-last<32)return;last=time;pumpBeams.forEach((beam,i)=>beam.rotation.z=Math.sin(time*.0013+i)*.2);render()}requestAnimationFrame(animate);
  }catch(error){console.error(error);$('sceneFallback').hidden=false;$('sceneStatus').textContent='WEBGL НЕДОСТУПЕН';}
}
function resize(){if(!renderer)return;const rect=sceneWrap.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();render()}
function updateCamera(){camera.position.set(Math.sin(theta)*Math.sin(phi)*distance,Math.cos(phi)*distance,Math.cos(theta)*Math.sin(phi)*distance);camera.lookAt(0,0,0);render()}
function render(){if(renderer&&sceneVisible)renderer.render(scene,camera)}

const canvas=$('gameCanvas');
canvas.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY,theta,phi,id:event.pointerId};canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{if(!pointerStart||event.pointerId!==pointerStart.id)return;const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;theta=pointerStart.theta-dx*.006;phi=Math.max(.35,Math.min(1.35,pointerStart.phi+dy*.005));updateCamera()});
canvas.addEventListener('pointerup',event=>{if(!pointerStart||event.pointerId!==pointerStart.id)return;const moved=Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>8;pointerStart=null;if(!moved)inspectTile(event)});
canvas.addEventListener('pointercancel',()=>pointerStart=null);
canvas.addEventListener('wheel',event=>{event.preventDefault();distance=Math.max(13,Math.min(29,distance+event.deltaY*.015));updateCamera()},{passive:false});
$('resetCamera').addEventListener('click',()=>{theta=.62;phi=.94;distance=19;updateCamera()});
function inspectTile(event){if(!renderer)return;const rect=canvas.getBoundingClientRect();const mouse=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(tileMeshes);if(!hits.length)return;const index=hits[0].object.userData.tileIndex;showDeed(index)}
function showDeed(index){const tile=TILE_DATA[index],level=owners[index]===null?0:(players[owners[index]].levels[index]||0);$('tileDialogType').textContent=tile.kind==='plot'?'КАРТОЧКА ПРЕДПРИЯТИЯ':'КЛЕТКА ПОЛЯ';$('tileDialogIcon').textContent=tile.icon;$('tileDialogTitle').textContent=tile.name;$('tileDialogText').textContent=tile.text+(tile.price?` Цена ${rub(tile.price)} · аренда ${rub(rentFor(tile,level))} · улучшение ${rub(tile.upgrade)} · уровень ${level}/2.`:'');tileDialog.showModal()}

function setEvent(text){$('eventText').textContent=text}
function activePlayer(){return players[turn]}
function updateUI(){
  const current=activePlayer();roundLabel.textContent=`РАУНД ${Math.min(ROUNDS,Math.floor(turnsTaken/players.length)+1)} / ${ROUNDS}`;
  $('turnName').textContent=current.name;$('turnColor').style.background=`#${COLORS[turn].toString(16).padStart(6,'0')}`;
  $('turnSubtitle').textContent=phase==='roll'?'Бросайте два кубика!':phase==='choice'?'Решите, покупать ли актив.':phase==='end'?'Улучшите актив или передайте ход.':'Идёт ход...';
  $('playersList').replaceChildren(...players.map((p,i)=>{const row=document.createElement('div');row.className='player-row'+(i===turn?' active':'');const name=document.createElement('span');name.className='player-name';const dot=document.createElement('i');dot.className='player-dot';dot.style.background=`#${COLORS[i].toString(16).padStart(6,'0')}`;name.append(dot,document.createTextNode(p.name));const score=document.createElement('strong');score.textContent=`${rub(p.cash)} · ${p.owned.length} активов${p.bankrupt?' · БАНКРОТ':''}`;row.append(name,score);return row}));
  $('walletAmount').textContent=rub(current.cash);
  $('discountStatus').textContent=current.discount>0?`Карта «Морошка»: осталось ${current.discount} примен.`:'Карта «Морошка» не активна';
  const upgrade=$('upgradeSelect');upgrade.replaceChildren(...current.owned.filter(index=>(current.levels[index]||0)<2).map(index=>{const option=document.createElement('option');option.value=index;option.textContent=`${TILE_DATA[index].name} · ${rub(discounted(TILE_DATA[index].upgrade,discountFor(current,TILE_DATA[index])))}`;return option}));
  $('upgradeButton').disabled=phase!=='end'||!upgrade.options.length||current.cash<discounted(TILE_DATA[Number(upgrade.value)]?.upgrade||0,discountFor(current,TILE_DATA[Number(upgrade.value)]));
  $('upgradeArea').hidden=phase!=='end'||!upgrade.options.length;
  rollButton.hidden=phase!=='roll';rollButton.disabled=phase!=='roll';choiceActions.hidden=phase!=='choice';endTurnButton.hidden=phase!=='end';
}
function startGame(count){
  players=Array.from({length:count},(_,i)=>({name:`Игрок ${i+1}`,cash:START_CASH,position:0,owned:[],levels:{},discount:0,bankrupt:false}));
  owners=Array(TILE_DATA.length).fill(null);turn=0;turnsTaken=0;phase='roll';pendingTile=-1;
  $('diceFace').textContent='⚀ ⚀';$('diceText').textContent='Первый ход за вами.';setEvent('На старте у каждого 1 500 ₽. Покупайте активы, собирайте аренду и улучшайте предприятия.');updateTokens();updateOwnerMarkers();updateUI();
}
function pause(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function roll(){
  if(phase!=='roll')return;phase='moving';updateUI();const a=Math.floor(Math.random()*6)+1,b=Math.floor(Math.random()*6)+1,value=a+b;
  $('diceFace').textContent=`${DICE[a-1]} ${DICE[b-1]}`;$('diceText').textContent=`Выпало ${a} + ${b} = ${value}.`;
  const player=activePlayer();
  for(let step=0;step<value;step++){
    player.position=(player.position+1)%TILE_DATA.length;
    if(player.position===0){player.cash+=LAP_SALARY;const oil=owners[13]===turn?80:0;player.cash+=oil;setEvent(`Полный круг: зарплата ${rub(LAP_SALARY)}${oil?` и доход нефтяной качалки ${rub(oil)}`:''}.`)}
    updateTokens();await pause(160);
  }
  resolveTile(player.position);updateUI();
}
function discountFor(player,tile){return player.discount>0&&['отдых','культура','сервис'].includes(tile?.category)?10:0}
function charge(amount,recipient=null){const player=activePlayer();const result=pay(player,amount);if(recipient!==null)players[recipient].cash+=result.paid;if(result.shortfall){player.bankrupt=true;for(const index of player.owned)owners[index]=null;player.owned=[];player.levels={};updateOwnerMarkers()}return result}
function cardDraw(kind){const cards=CARDS[kind],card=cards[Math.floor(Math.random()*cards.length)],player=activePlayer();if(card.type==='discount')player.discount=card.value;else if(card.value>=0)player.cash+=card.value;else charge(-card.value);$('cardType').textContent=kind==='chance'?'СЕВЕРНЫЙ ШАНС':'ГОРОДСКОЙ ФОНД';$('cardTitle').textContent=card.title;$('cardText').textContent=card.text;$('cardDialog').showModal();return `${card.title}: ${card.text}`}
function resolveTile(index){
  const tile=TILE_DATA[index],player=activePlayer();let event='';
  if(tile.kind==='plot'){
    const owner=owners[index];
    const price=discounted(tile.price,discountFor(player,tile));
    if(owner===null){if(player.cash>=price){pendingTile=index;phase='choice';event=`${tile.name}: карточка актива доступна за ${rub(price)}. Базовая аренда — ${rub(tile.rent)}.`;$('buyButton').textContent=`Купить за ${rub(price)}`;showDeed(index)}
      else{phase='end';event=`${tile.name} свободно, но для покупки нужны ${rub(price)}.`}}
    else if(owner===turn){phase='end';event=`${tile.name} уже ваше. Отдохните перед следующим ходом.`}
    else{const due=rentFor(tile,players[owner].levels[index]||0),result=charge(due,owner);phase='end';event=`Аренда «${tile.name}»: ${rub(result.paid)} → ${players[owner].name}${result.shortfall?' (банкротство)':''}.`}
  }else if(tile.kind==='chance'||tile.kind==='fund'){phase='end';event=cardDraw(tile.kind)}
  else if(tile.kind==='tax'){const result=charge(tile.cost);phase='end';event=`${tile.name}: оплачено ${rub(result.paid)} в банк.`}
  else if(tile.kind==='jackpot'){phase='end';const prize=[100,150,200][Math.floor(Math.random()*3)];player.cash+=prize;event=`${tile.name}: банк выплачивает ${rub(prize)}!`}
  else{phase='end';event=tile.text}
  setEvent(event);$('diceText').textContent=`${player.name} попал на «${tile.name}».`;
}
function buy(){if(phase!=='choice'||pendingTile<0)return;const tile=TILE_DATA[pendingTile],player=activePlayer(),discount=discountFor(player,tile),price=discounted(tile.price,discount);if(player.cash<price)return;player.cash-=price;if(discount)player.discount--;player.owned.push(pendingTile);owners[pendingTile]=turn;setEvent(`${player.name} купил «${tile.name}» за ${rub(price)}${discount?' со скидкой карты «Морошка»':''}.`);pendingTile=-1;phase='end';updateOwnerMarkers();updateUI()}
function upgrade(){if(phase!=='end')return;const index=Number($('upgradeSelect').value),tile=TILE_DATA[index],player=activePlayer();if(!tile||owners[index]!==turn||(player.levels[index]||0)>=2)return;const discount=discountFor(player,tile),price=discounted(tile.upgrade,discount);if(player.cash<price)return;player.cash-=price;player.levels[index]=(player.levels[index]||0)+1;if(discount)player.discount--;setEvent(`Улучшено «${tile.name}» до уровня ${player.levels[index]}. Потрачено ${rub(price)}, новая аренда ${rub(rentFor(tile,player.levels[index]))}.`);updateUI()}
function pass(){if(phase!=='choice')return;setEvent(`${activePlayer().name} оставил «${TILE_DATA[pendingTile].name}» свободным.`);pendingTile=-1;phase='end';updateUI()}
function finishTurn(){if(phase!=='end')return;turnsTaken++;if(turnsTaken>=players.length*ROUNDS||players.filter(p=>!p.bankrupt).length<=1){finishGame();return}do{turn=(turn+1)%players.length}while(players[turn].bankrupt);phase='roll';$('diceFace').textContent='⚀ ⚀';$('diceText').textContent='Теперь ваш ход.';setEvent(`${activePlayer().name}, бросайте кубики!`);updateUI()}
function finishGame(){phase='finished';const ranked=players.map((p,i)=>({name:p.name,cash:p.cash,total:p.bankrupt?-1:netWorth(p,TILE_DATA),index:i})).sort((a,b)=>b.total-a.total||b.cash-a.cash);const winner=ranked[0];$('winnerTitle').textContent=`${winner.name} победил!`;$('winnerText').textContent=`Капитал ${rub(winner.total)}: наличные ${rub(winner.cash)} + стоимость активов и улучшений. ${ranked.slice(1).map(p=>`${p.name}: ${p.total<0?'банкрот':rub(p.total)}`).join(' · ')}`;setEvent(`Партия завершена. Победил ${winner.name}!`);updateUI();winnerDialog.showModal()}

$('setupForm').addEventListener('submit',event=>{if(event.submitter?.value!=='start')return;const count=Number(new FormData(event.currentTarget).get('playerCount'));startGame(count)});
$('newGameButton').addEventListener('click',()=>setupDialog.showModal());
$('playAgainButton').addEventListener('click',()=>{setTimeout(()=>setupDialog.showModal(),0)});
rollButton.addEventListener('click',roll);$('buyButton').addEventListener('click',buy);$('passButton').addEventListener('click',pass);$('upgradeButton').addEventListener('click',upgrade);$('upgradeSelect').addEventListener('change',updateUI);endTurnButton.addEventListener('click',finishTurn);
initThree();setupDialog.showModal();
