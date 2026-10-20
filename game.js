import {START_CASH, PASS_START, DECLINE_FINE, ROUND_LIMIT, rub, priceWithDiscount, rentFor, transfer, receive, repay, lap, netWorth} from './economy.js';

const $ = id => document.getElementById(id);
const COLORS = ['#d87648','#6aaba0','#dbbc62','#aa8cca'];
const DICE = ['⚀','⚁','⚂','⚃','⚄','⚅'];
const CATEGORIES = {
  leisure:{label:'ОТДЫХ',color:'#91b59f',icon:'♣'},
  culture:{label:'КУЛЬТУРА',color:'#d1a778',icon:'▣'},
  service:{label:'СЕРВИС',color:'#a9bec3',icon:'⌂'},
  transport:{label:'ТРАНСПОРТ',color:'#c6a89a',icon:'➤'},
  energy:{label:'ЭНЕРГИЯ',color:'#d48a5d',icon:'◆'}
};
const BUSINESSES = [
  {id:'park',name:'Парковый бульвар',category:'leisure',price:160,rent:25,upgrade:80,icon:'♣'},
  {id:'familypark',name:'Семейный парк',category:'leisure',price:180,rent:30,upgrade:90,icon:'♣'},
  {id:'ski',name:'Лыжная тропа',category:'leisure',price:170,rent:30,upgrade:85,icon:'❄'},
  {id:'square',name:'Сосновый сквер',category:'leisure',price:150,rent:25,upgrade:75,icon:'♠'},
  {id:'museum',name:'Городской музей',category:'culture',price:200,rent:35,upgrade:100,icon:'▣'},
  {id:'theater',name:'Дом культуры',category:'culture',price:180,rent:30,upgrade:90,icon:'♫'},
  {id:'festival',name:'Северная сцена',category:'culture',price:190,rent:35,upgrade:95,icon:'✦'},
  {id:'cafe',name:'Морошковое кафе',category:'service',price:170,rent:30,upgrade:85,icon:'✳'},
  {id:'market',name:'Северный рынок',category:'service',price:190,rent:35,upgrade:95,icon:'◇'},
  {id:'workshop',name:'Тёплая мастерская',category:'service',price:180,rent:30,upgrade:90,icon:'⌂'},
  {id:'station',name:'Автовокзал',category:'transport',price:220,rent:40,upgrade:110,icon:'➤'},
  {id:'express',name:'Полярный экспресс',category:'transport',price:240,rent:45,upgrade:120,icon:'➤'},
  {id:'route',name:'Северный маршрут',category:'transport',price:210,rent:40,upgrade:105,icon:'↗'},
  {id:'pump',name:'Нефтяная качалка',category:'energy',price:300,rent:55,upgrade:150,icon:'◆',oil:60},
  {id:'depot',name:'Энергостанция',category:'energy',price:260,rent:50,upgrade:130,icon:'ϟ'},
  {id:'terminal',name:'Топливный терминал',category:'energy',price:270,rent:50,upgrade:135,icon:'◆'}
];
const TILES = [
  {kind:'start',name:'Старт',icon:'↗'},
  {kind:'business',category:'leisure',fixed:'park'},
  {kind:'chance',name:'Северный шанс',icon:'✦'},
  {kind:'business',category:'culture',fixed:'museum'},
  {kind:'tax',name:'Городской сбор',icon:'−',amount:70},
  {kind:'business',category:'service',fixed:'cafe'},
  {kind:'jackpot',name:'Морошковый приз',icon:'★'},
  {kind:'business',category:'leisure',fixed:'familypark'},
  {kind:'chance',name:'Северный шанс',icon:'✦'},
  {kind:'business',category:'culture',fixed:'theater'},
  {kind:'fund',name:'Городской фонд',icon:'◇'},
  {kind:'business',category:'transport',fixed:'station'},
  {kind:'tax',name:'Зимний ремонт',icon:'−',amount:90},
  {kind:'business',category:'energy',fixed:'pump'},
  {kind:'fund',name:'Городской фонд',icon:'◇'},
  {kind:'business',category:'service',fixed:'market'},
  {kind:'jackpot',name:'Олений приз',icon:'★'},
  {kind:'business',category:'transport',fixed:'express'},
  {kind:'chance',name:'Северный шанс',icon:'✦'},
  {kind:'tax',name:'Коммунальные расходы',icon:'−',amount:80},
  {kind:'business',category:'leisure',fixed:'ski'},
  {kind:'fund',name:'Городской фонд',icon:'◇'},
  {kind:'business',category:'energy',fixed:'depot'},
  {kind:'chance',name:'Северный шанс',icon:'✦'}
];
const CARDS = {
  chance:[
    {title:'Карта «Морошка»',text:'Три покупки или улучшения в категориях «отдых», «культура» и «сервис» со скидкой 10%.',effect:'discount',value:3,icon:'✳'},
    {title:'Ягодная ярмарка',text:'Банк выплачивает вам 120 ₽ за удачную торговлю.',effect:'cash',value:120,icon:'✳'},
    {title:'Северная поставка',text:'Дополнительная выручка: получите 90 ₽.',effect:'cash',value:90,icon:'➤'},
    {title:'Ремонт оборудования',text:'Заплатите банку 80 ₽.',effect:'cash',value:-80,icon:'◆'},
    {title:'Оленья удача',text:'Следующая аренда, которую вы должны заплатить, отменяется.',effect:'shield',value:1,icon:'♞'},
    {title:'Тёплый вечер',text:'Банк выплачивает вам 70 ₽.',effect:'cash',value:70,icon:'⌂'},
    {title:'Внезапная метель',text:'Потратьте 60 ₽ на дорогу.',effect:'cash',value:-60,icon:'❄'},
    {title:'Премия за маршрут',text:'При следующем прохождении старта получите дополнительно 100 ₽.',effect:'salary',value:100,icon:'↗'}
  ],
  fund:[
    {title:'Дорога к отпуску',text:'Игровая компенсация: получите 120 ₽ из банка.',effect:'cash',value:120,icon:'➤'},
    {title:'Северная надбавка',text:'Игровая премия: получите 100 ₽.',effect:'cash',value:100,icon:'✦'},
    {title:'Районный коэффициент',text:'Разовый игровой бонус: получите 80 ₽.',effect:'cash',value:80,icon:'◇'},
    {title:'Семейный фестиваль',text:'Получите 90 ₽ на праздничной ярмарке.',effect:'cash',value:90,icon:'♫'},
    {title:'Городской субботник',text:'Вклад в город: заплатите банку 50 ₽.',effect:'cash',value:-50,icon:'♣'},
    {title:'Поддержка соседей',text:'Банк выплачивает вам 70 ₽.',effect:'cash',value:70,icon:'♡'},
    {title:'Ремонт крыши',text:'Заплатите банку 70 ₽.',effect:'cash',value:-70,icon:'⌂'},
    {title:'Спутник-олень',text:'Следующая аренда, которую вы должны заплатить, отменяется.',effect:'shield',value:1,icon:'♞'}
  ]
};
const PATH=[];
for(let c=0;c<7;c++)PATH.push([1,c+1]);
for(let r=1;r<7;r++)PATH.push([r+1,7]);
for(let c=5;c>=0;c--)PATH.push([7,c+1]);
for(let r=5;r>=1;r--)PATH.push([r+1,1]);

let state=null;
let detailIndex=-1;
const randomInt=max=>Math.floor(Math.random()*max);
function shuffle(list){const result=[...list];for(let i=result.length-1;i>0;i--){const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]]}return result}
function active(){return state.players[state.turn]}
function holdingAt(index){return state.holdings.find(h=>h.tileIndex===index)}
function discountFor(player,business){return player.discount>0&&['leisure','culture','service'].includes(business.category)?10:0}
function priceFor(player,business,upgrade=false){return priceWithDiscount(upgrade?business.upgrade:business.price,discountFor(player,business))}
function useDiscount(player,business){if(discountFor(player,business))player.discount--}
function setEvent(message){$('eventText').textContent=message}
function makePlayer(index){return {name:`Игрок ${index+1}`,position:0,cash:START_CASH,debt:0,discount:0,shield:0,salaryBonus:0}}
function startGame(count,mode){
  state={players:Array.from({length:count},(_,i)=>makePlayer(i)),mode,turn:0,turnsTaken:0,phase:'roll',holdings:[],pending:null,offered:null,decks:{chance:shuffle(CARDS.chance),fund:shuffle(CARDS.fund)},businessDecks:{},lastRoll:null};
  for(const category of Object.keys(CATEGORIES))state.businessDecks[category]=shuffle(BUSINESSES.filter(b=>b.category===category));
  $('modeBadge').textContent=mode==='random'?'РЕЖИМ: СЛУЧАЙНЫЕ КАРТЫ':'РЕЖИМ: ЗАКРЕПЛЁННЫЙ БИЗНЕС';
  $('diceValue').textContent='⚀ ⚀';setEvent('На старте у каждого 1 200 ₽. Бросайте кубики, покупайте бизнес и собирайте аренду.');render();
}
function render(){if(!state)return;const player=active(),limit=ROUND_LIMIT[state.players.length];$('roundLabel').textContent=`РАУНД ${Math.min(limit,Math.floor(state.turnsTaken/state.players.length)+1)} / ${limit}`;$('turnName').textContent=player.name;$('phaseHint').textContent={roll:'Бросайте два кубика.',moving:'Фишка движется по полю.',offer:'Выберите: покупка или штраф.',end:'Можно улучшить бизнес или передать ход.',finished:'Партия завершена.'}[state.phase];$('cashValue').textContent=rub(player.cash);$('debtValue').textContent=`Долг: ${rub(player.debt)}`;$('perks').textContent=[player.discount?`✳ Скидка «Морошка»: ${player.discount} примен.`:'',player.shield?'♞ Защита от следующей аренды':'',player.salaryBonus?`↗ Бонус к следующему кругу: ${rub(player.salaryBonus)}`:''].filter(Boolean).join(' · ');
  $('playersList').replaceChildren(...state.players.map((p,i)=>{const row=document.createElement('div');row.className='player-row'+(i===state.turn?' current':'');row.style.setProperty('--player',COLORS[i]);const name=document.createElement('span');name.textContent=p.name;const score=document.createElement('strong');score.textContent=`${rub(p.cash)} · ${state.holdings.filter(h=>h.owner===i).length} карт`;row.append(name,score);return row}));
  $('rollButton').hidden=state.phase!=='roll';$('nextButton').hidden=state.phase!=='end';$('repayButton').hidden=state.phase!=='end'||player.debt===0||player.cash===0;$('repayButton').textContent=`Погасить ${rub(Math.min(100,player.cash,player.debt))} долга`;
  renderBoard();renderHoldings();
}
function renderBoard(){
  const board=$('board');board.replaceChildren();
  const center=document.createElement('div');center.className='board-center';center.innerHTML='<div class="center-pump" aria-hidden="true"><svg viewBox="0 0 160 100" fill="none"><path d="M18 88H143M69 88V43L90 88M69 43L48 88M47 37L121 21L134 30L50 49Z" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M41 34L25 30L19 45L39 49M112 28V72M103 72H121" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="69" cy="43" r="6" fill="currentColor"/></svg></div><div class="center-logo">МОРО<span>ШКА</span></div><p>МУРАВЛЕНКО / НАСТОЛЬНАЯ ИГРА</p><p class="center-note">Рубль за рублем — постройте свой северный маршрут.</p>';board.append(center);
  TILES.forEach((tile,index)=>{const cell=document.createElement('button');cell.type='button';cell.className='cell';const [row,col]=PATH[index];cell.style.gridRow=row;cell.style.gridColumn=col;const holding=holdingAt(index),fixed=BUSINESSES.find(b=>b.id===tile.fixed),business=holding?.business||(state.mode==='fixed'?fixed:null);let name=tile.name||business?.name||CATEGORIES[tile.category].label;let icon=tile.icon||business?.icon||CATEGORIES[tile.category].icon;let color=tile.kind==='business'?CATEGORIES[tile.category].color:({start:'#d56e3d',chance:'#e5bb73',fund:'#a8c8b7',tax:'#c98375',jackpot:'#ddad53'}[tile.kind]);cell.style.setProperty('--band',color);cell.setAttribute('aria-label',`${index}: ${name}${holding?`, владелец ${state.players[holding.owner].name}`:''}`);if(holding){cell.classList.add('owner');cell.style.setProperty('--owner',COLORS[holding.owner])}if(state.players.some(p=>p.position===index))cell.classList.add('active');const band=document.createElement('span');band.className='band';const symbol=document.createElement('span');symbol.className='cell-icon';symbol.textContent=icon;const label=document.createElement('span');label.className='cell-name';label.textContent=name;const price=document.createElement('span');price.className='cell-price';price.textContent=tile.kind==='business'?(business?rub(business.price):'СЮРПРИЗ'):tile.kind==='tax'?`−${rub(tile.amount)}`:'';const tokens=document.createElement('span');tokens.className='tokens';state.players.forEach((p,i)=>{if(p.position===index){const token=document.createElement('i');token.className='token';token.style.setProperty('--token',COLORS[i]);token.setAttribute('aria-label',p.name);tokens.append(token)}});cell.append(band,symbol,label,price,tokens);cell.addEventListener('click',()=>inspect(index));board.append(cell)})
}
function renderHoldings(){const shelf=$('holdings');shelf.replaceChildren();const mine=state.holdings.filter(h=>h.owner===state.turn);if(!mine.length){const empty=document.createElement('div');empty.className='empty-shelf';empty.textContent='Пока нет карточек. Купленный бизнес появится здесь автоматически.';shelf.append(empty);return}mine.forEach(h=>{const card=document.createElement('button');card.type='button';card.className='holding-card';card.style.setProperty('--category',CATEGORIES[h.business.category].color);const cap=document.createElement('small');cap.textContent=CATEGORIES[h.business.category].label;const title=document.createElement('strong');title.textContent=h.business.name;const info=document.createElement('small');info.textContent=`Аренда ${rub(rentFor(h.business,h.level))} · ур. ${h.level}/2`;card.append(cap,title,info);card.addEventListener('click',()=>openDetail(h.tileIndex));shelf.append(card)})}
function cardMarkup(business,holding=null){const category=CATEGORIES[business.category];return `<article class="dialog-card" style="--category:${category.color}"><div class="meta">${category.label} / КАРТОЧКА БИЗНЕСА</div><div class="symbol">${business.icon}</div><h3>${business.name}</h3><div class="stat"><span>ПОКУПКА</span><strong>${rub(business.price)}</strong></div><div class="stat"><span>АРЕНДА${holding?` · УР. ${holding.level}`:''}</span><strong>${rub(rentFor(business,holding?.level||0))}</strong></div><div class="stat"><span>УЛУЧШЕНИЕ</span><strong>${rub(business.upgrade)}</strong></div>${business.oil?`<div class="stat"><span>ДОХОД ЗА КРУГ</span><strong>${rub(business.oil)}</strong></div>`:''}</article>`}
function inspect(index){const tile=TILES[index],holding=holdingAt(index),fixed=BUSINESSES.find(b=>b.id===tile.fixed),business=holding?.business||(state.mode==='fixed'?fixed:null);detailIndex=index;if(business){openDetail(index);return}const content=$('detailContent');if(tile.kind==='business')content.innerHTML=`<p class="eyebrow">СВОБОДНАЯ КЛЕТКА</p><h2>${CATEGORIES[tile.category].label}</h2><p>В случайном режиме карточка бизнеса открывается только при попадании фишки на клетку.</p>`;else content.innerHTML=`<p class="eyebrow">КЛЕТКА ПОЛЯ</p><h2>${tile.name}</h2><p>${tile.kind==='chance'||tile.kind==='fund'?'При попадании возьмите верхнюю карту этой колоды.':tile.kind==='tax'?`Заплатите банку ${rub(tile.amount)}.`:tile.kind==='jackpot'?'Банк выплатит случайный приз от 80 до 160 ₽.':`За полный круг получите ${rub(PASS_START)}.`}</p>`;$('upgradeButton').hidden=true;$('detailDialog').showModal()}
function openDetail(index){const holding=holdingAt(index),tile=TILES[index],business=holding?.business||BUSINESSES.find(b=>b.id===tile.fixed);if(!business){inspect(index);return}detailIndex=index;$('detailContent').innerHTML=`<p class="eyebrow">${holding?`ВЛАДЕЛЕЦ: ${state.players[holding.owner].name.toUpperCase()}`:'КАРТОЧКА БИЗНЕСА'}</p>${cardMarkup(business,holding)}`;const canUpgrade=holding&&holding.owner===state.turn&&holding.level<2&&state.phase==='end';$('upgradeButton').hidden=!canUpgrade;if(canUpgrade){const price=priceFor(active(),business,true);$('upgradeButton').textContent=`Улучшить за ${rub(price)} → аренда ${rub(rentFor(business,holding.level+1))}`;$('upgradeButton').disabled=active().cash<price}$('detailDialog').showModal()}
function drawBusiness(category){const deck=state.businessDecks[category];if(!deck.length)return null;return deck.shift()}
function showOffer(index){const tile=TILES[index],business=state.mode==='fixed'?BUSINESSES.find(b=>b.id===tile.fixed):drawBusiness(tile.category);if(!business){state.phase='end';setEvent('Все карточки этой категории уже в игре. Клетка свободна.');render();return}state.pending=index;state.offered=business;state.phase='offer';$('offerCard').innerHTML=cardMarkup(business);const price=priceFor(active(),business);$('buyButton').textContent=`Купить за ${rub(price)}`;$('buyButton').disabled=active().cash<price;$('offerFineText').textContent=`Отказ от покупки: штраф ${rub(DECLINE_FINE)} в банк. ${state.mode==='random'?'Карточка возвращается в конец колоды.':'Клетка остаётся свободной.'}`;$('offerDialog').showModal();setEvent(`Предложение: ${business.name} за ${rub(price)}.`);render()}
function buy(){if(state.phase!=='offer')return;const player=active(),business=state.offered,index=state.pending,price=priceFor(player,business);if(player.cash<price)return;player.cash-=price;useDiscount(player,business);state.holdings.push({tileIndex:index,business,owner:state.turn,level:0});state.pending=null;state.offered=null;state.phase='end';$('offerDialog').close();setEvent(`${player.name} купил «${business.name}» за ${rub(price)}. Карточка добавлена в портфель.`);render();openDetail(index)}
function decline(){if(state.phase!=='offer')return;const business=state.offered;if(state.mode==='random')state.businessDecks[business.category].push(business);const result=transfer(active(),DECLINE_FINE);state.pending=null;state.offered=null;state.phase='end';$('offerDialog').close();setEvent(`Отказ от «${business.name}»: ${rub(DECLINE_FINE)} в банк${result.borrowed?`, из них ${rub(result.borrowed)} в долг`:''}.`);render()}
function drawCard(kind){const deck=state.decks[kind];if(!deck.length)state.decks[kind]=shuffle(CARDS[kind]);const card=state.decks[kind].shift(),player=active();let result='';if(card.effect==='cash'){if(card.value>=0){receive(player,card.value);result=`Получено ${rub(card.value)}.`}else{const payment=transfer(player,-card.value);result=`Оплачено ${rub(-card.value)}${payment.borrowed?` (долг +${rub(payment.borrowed)})`:''}.`}}else if(card.effect==='discount'){player.discount=card.value;result='Бонус сохранён в вашей панели до трёх применений.'}else if(card.effect==='shield'){player.shield++;result='Защита сохранена до следующей аренды.'}else if(card.effect==='salary'){player.salaryBonus+=card.value;result='Доплата придёт при следующем прохождении старта.'}$('eventDeck').textContent=kind==='chance'?'СЕВЕРНЫЙ ШАНС':'ГОРОДСКОЙ ФОНД';$('drawnCard').innerHTML=`<article class="dialog-card event"><div class="meta">${kind==='chance'?'КАРТА ШАНСА':'КАРТА ФОНДА'}</div><div class="symbol">${card.icon}</div><h3>${card.title}</h3><p>${card.text}</p><p>${result}</p></article>`;$('eventDialog').showModal();setEvent(`${card.title}. ${result}`)}
function resolve(index){const tile=TILES[index],player=active(),holding=holdingAt(index);if(tile.kind==='business'){if(!holding){showOffer(index);return}if(holding.owner===state.turn)setEvent(`«${holding.business.name}» — ваше предприятие. Можно улучшить карточку в портфеле.`);else if(player.shield){player.shield--;setEvent(`Олень защитил от аренды «${holding.business.name}» (${rub(rentFor(holding.business,holding.level))}).`)}else{const due=rentFor(holding.business,holding.level),payment=transfer(player,due,state.players[holding.owner]);setEvent(`Аренда «${holding.business.name}»: ${rub(due)} игроку ${state.players[holding.owner].name}${payment.borrowed?` (заём ${rub(payment.borrowed)})`:''}.`)}}
  else if(tile.kind==='chance'||tile.kind==='fund')drawCard(tile.kind);
  else if(tile.kind==='tax'){const payment=transfer(player,tile.amount);setEvent(`${tile.name}: ${rub(tile.amount)} в банк${payment.borrowed?`, долг +${rub(payment.borrowed)}`:''}.`)}
  else if(tile.kind==='jackpot'){const prize=[80,120,160][randomInt(3)];receive(player,prize);setEvent(`${tile.name}: банк выплатил ${rub(prize)}.`)}
  else setEvent('Стартовая клетка. За прохождение полного круга банк платит 200 ₽.');
  state.phase='end';render()}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function roll(){if(state.phase!=='roll')return;state.phase='moving';render();const first=randomInt(6)+1,second=randomInt(6)+1,value=first+second;$('diceValue').textContent=`${DICE[first-1]} ${DICE[second-1]}`;const player=active();for(let step=0;step<value;step++){player.position=(player.position+1)%TILES.length;if(player.position===0){const oilIncome=state.holdings.filter(h=>h.owner===state.turn).reduce((sum,h)=>sum+(h.business.oil||0),0);const info=lap(player,oilIncome);setEvent(`Полный круг: +${rub(info.income)}${info.interest?`, проценты по долгу +${rub(info.interest)}`:''}.`)}renderBoard();await delay(90)}resolve(player.position)}
function upgrade(){const holding=holdingAt(detailIndex);if(!holding||state.phase!=='end'||holding.owner!==state.turn||holding.level>=2)return;const player=active(),price=priceFor(player,holding.business,true);if(player.cash<price)return;player.cash-=price;useDiscount(player,holding.business);holding.level++;$('detailDialog').close();setEvent(`«${holding.business.name}» улучшено до уровня ${holding.level}. Потрачено ${rub(price)}, аренда ${rub(rentFor(holding.business,holding.level))}.`);render();openDetail(detailIndex)}
function nextTurn(){if(state.phase!=='end')return;state.turnsTaken++;if(state.turnsTaken>=state.players.length*ROUND_LIMIT[state.players.length]){finish();return}state.turn=(state.turn+1)%state.players.length;state.phase='roll';$('diceValue').textContent='⚀ ⚀';setEvent(`${active().name}, бросайте кубики.`);render()}
function finish(){state.phase='finished';render();const ranked=state.players.map((player,index)=>({player,index,total:netWorth(player,state.holdings.filter(h=>h.owner===index))})).sort((a,b)=>b.total-a.total||b.player.cash-a.player.cash);$('finishTitle').textContent=`${ranked[0].player.name} побеждает!`;$('finishScores').replaceChildren(...ranked.map((entry,rank)=>{const row=document.createElement('div');row.className='score-row';const name=document.createElement('span');name.textContent=`${rank+1}. ${entry.player.name}`;const total=document.createElement('strong');total.textContent=rub(entry.total);row.append(name,total);return row}));$('finishDialog').showModal();setEvent(`Партия завершена после ${ROUND_LIMIT[state.players.length]} раундов. Капитал победителя — ${rub(ranked[0].total)}.`)}

$('setupForm').addEventListener('submit',event=>{event.preventDefault();if(event.submitter?.value!=='start')return;const data=new FormData(event.currentTarget);$('setupDialog').close();startGame(Number(data.get('count')),data.get('mode'))});
$('newGameButton').addEventListener('click',()=>{if(!$('setupDialog').open)$('setupDialog').showModal()});
$('againButton').addEventListener('click',()=>{$('finishDialog').close();$('setupDialog').showModal()});
$('rollButton').addEventListener('click',roll);$('nextButton').addEventListener('click',nextTurn);$('buyButton').addEventListener('click',buy);$('declineButton').addEventListener('click',decline);$('upgradeButton').addEventListener('click',upgrade);
$('repayButton').addEventListener('click',()=>{if(state.phase!=='end')return;const amount=repay(active(),100);setEvent(`Долг погашен на ${rub(amount)}.`);render()});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.close;if(id==='offerDialog'){decline();return}$(id).close()}));
$('offerDialog').addEventListener('cancel',event=>event.preventDefault());
startGame(2,'random');$('setupDialog').showModal();
