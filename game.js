import {START_CASH, ROUND_LIMIT, CREDIT_LIMIT, rub, rentFor, mortgageValue, redemptionCost, resaleValue, repay} from './economy.js';
import {COLORS, DICE, CATEGORIES, TILES, BUSINESS_TILES, BUSINESS_BY_ID, CARD_BY_ID, PATH} from './game-data.js';
import {createGame, playerAt, holdingAt, businessAt, cellNumber, ownsGroup, currentRent, costFor, move, land, buyBusiness, declineBusiness, drawCard, nextTurn, upgrade, sellUpgrade, mortgage, redeem, borrowForPayment, completePayment, canRecover, bankrupt, rankings} from './engine.js';

const $=id=>document.getElementById(id);
const SAVE_KEY='severny-kapital-game-v2';
let game=null,detailIndex=-1,movingIndex=null;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function save(){try{if(game&&game.phase!=='moving')localStorage.setItem(SAVE_KEY,JSON.stringify(game))}catch(error){console.warn('Game save unavailable',error)}}
function load(){
  try{
    const value=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!value||value.version!==2||!ROUND_LIMIT[value.players?.length]||!['random','fixed'].includes(value.mode)||!Array.isArray(value.holdings)||!value.assignments||!value.decks||!value.businessDecks)return null;
    value.players.forEach((p,i)=>p.name=`Игрок ${i+1}`);
    value.holdings=value.holdings.filter(h=>h&&BUSINESS_BY_ID[h.business?.id]&&TILES[h.tileIndex]?.kind==='business').map(h=>({...h,business:BUSINESS_BY_ID[h.business.id]}));
    for(const [index,id] of Object.entries(value.assignments||{}))if(!BUSINESS_BY_ID[id]||TILES[index]?.kind!=='business')delete value.assignments[index];
    if(!['roll','offer','draw','settle','end','finished'].includes(value.phase))return null;
    return value;
  }catch{return null}
}
function update(message){if(message)game.message=message;render();save()}
function active(){return playerAt(game)}

function render(){
  if(!game)return;
  const player=active(),limit=ROUND_LIMIT[game.players.length];
  $('roundLabel').textContent=`РАУНД ${Math.min(limit,Math.floor(game.turnsTaken/game.players.length)+1)} / ${limit}`;
  $('modeBadge').textContent=game.mode==='random'?'СЛУЧАЙНЫЙ БИЗНЕС':'ЗАКРЕПЛЁННЫЙ БИЗНЕС';
  $('turnName').textContent=player.name;
  $('phaseHint').textContent={roll:'Бросайте два кубика.',moving:'Фишка движется.',offer:'Купите бизнес или заплатите штраф.',draw:'Нажмите подсвеченную стопку на поле.',settle:'Подготовьте платёж: активы, залог или кредит.',end:'Улучшайте бизнес или передавайте ход.',finished:'Партия завершена.'}[game.phase];
  $('cashValue').textContent=rub(player.cash);
  $('debtValue').textContent=`Кредит: ${rub(player.debt)} / ${rub(CREDIT_LIMIT)}`;
  $('perks').textContent=[player.discount?`✳ Карта «Морошка»: ${player.discount} примен.`:'',player.shieldCards?.length?'♞ Защита от следующей аренды':'',player.salaryBonus?`↗ Доплата за круг ${rub(player.salaryBonus)}`:''].filter(Boolean).join(' · ');
  $('eventText').textContent=game.message;
  $('playersList').replaceChildren(...game.players.map((p,i)=>{
    const row=document.createElement('div');row.className='player-row'+(i===game.turn?' current':'');row.style.setProperty('--player',COLORS[i]);
    const name=document.createElement('span');name.textContent=p.name+(p.bankrupt?' · БАНКРОТ':'');
    const score=document.createElement('strong');score.textContent=`${rub(p.cash)} · ${game.holdings.filter(h=>h.owner===i).length} карт`;
    row.append(name,score);return row;
  }));
  $('rollButton').hidden=game.phase!=='roll';$('nextButton').hidden=game.phase!=='end';
  $('repayButton').hidden=game.phase!=='end'||player.debt===0||player.cash===0;
  $('repayButton').textContent=`Погасить ${rub(Math.min(100,player.cash,player.debt))} кредита`;
  $('diceValue').textContent=game.lastDice?game.lastDice.map(n=>DICE[n-1]).join(' '):'⚀ ⚀';
  renderBoard();renderHoldings();
}

function renderBoard(){
  const board=$('board');board.replaceChildren();
  const center=document.createElement('div');center.className='board-center';
  center.innerHTML='<div class="center-pump" aria-hidden="true"><svg viewBox="0 0 160 100" fill="none"><path d="M18 88H143M69 88V43L90 88M69 43L48 88M47 37L121 21L134 30L50 49Z" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M41 34L25 30L19 45L39 49M112 28V72M103 72H121" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="69" cy="43" r="6" fill="currentColor"/></svg></div><div class="center-logo">СЕВЕРНЫЙ<br><span>КАПИТАЛ</span></div><p>МУРАВЛЕНКО / НАСТОЛЬНАЯ ИГРА</p>';
  const decks=document.createElement('div');decks.className='deck-piles';
  for(const [kind,label,icon] of [['chance','Северный шанс','✦'],['fund','Городские события','◇']]){
    const pile=document.createElement('button');pile.type='button';pile.className=`deck-pile ${kind}`;
    const enabled=game.phase==='draw'&&TILES[active().position].kind===kind;
    pile.disabled=!enabled;pile.setAttribute('aria-label',`${label}: ${enabled?'взять верхнюю карту':'ожидайте соответствующую клетку'}`);
    pile.innerHTML=`<span class="deck-symbol">${icon}</span><strong>${label}</strong><small>${game.decks[kind].length} карт в стопке</small>`;
    pile.addEventListener('click',()=>takeCard(kind));decks.append(pile);
  }
  center.append(decks);board.append(center);
  TILES.forEach((tile,index)=>{
    const cell=document.createElement('button');cell.type='button';cell.className='cell';
    const [row,col]=PATH[index];cell.style.gridRow=row;cell.style.gridColumn=col;
    const holding=holdingAt(game,index),business=businessAt(game,index),category=CATEGORIES[tile.category];
    const name=tile.kind==='business'?(business?.name||category.label):tile.name;
    const icon=business?.icon||tile.icon||category?.icon;
    const color=category?.color||({start:'#d56e3d',chance:'#e5bb73',fund:'#a8c8b7',tax:'#c98375',jackpot:'#ddad53'}[tile.kind]);
    cell.style.setProperty('--band',color);
    cell.setAttribute('aria-label',tile.kind==='business'?`Клетка №${cellNumber(index)}, ${name}${holding?.owner!==null&&holding?.owner!==undefined?`, владелец ${game.players[holding.owner].name}`:''}${holding?.mortgaged?' · заложено':''}`:name);
    if(holding?.owner!==null&&holding?.owner!==undefined){cell.classList.add('owner');cell.style.setProperty('--owner',COLORS[holding.owner])}
    if(holding?.mortgaged&&holding.owner!==null)cell.classList.add('mortgaged');
    const occupied=game.players.some((p,i)=>!p.bankrupt&&(i===game.turn&&movingIndex!==null?movingIndex:p.position)===index);
    if(occupied)cell.classList.add('active');
    const band=document.createElement('span');band.className='band';
    const number=document.createElement('span');number.className='cell-number';number.textContent=tile.kind==='business'?`№${String(cellNumber(index)).padStart(2,'0')}`:'';
    const symbol=document.createElement('span');symbol.className='cell-icon';symbol.textContent=icon;
    const label=document.createElement('span');label.className='cell-name';label.textContent=name;
    const price=document.createElement('span');price.className='cell-price';price.textContent=tile.kind==='business'?(business?rub(business.price):'ЗАКРЫТО'):tile.kind==='tax'?`−${rub(tile.amount)}`:'';
    const tokens=document.createElement('span');tokens.className='tokens';
    game.players.forEach((p,i)=>{if(!p.bankrupt&&(i===game.turn&&movingIndex!==null?movingIndex:p.position)===index){const token=document.createElement('i');token.className='token';token.style.setProperty('--token',COLORS[i]);token.setAttribute('aria-label',p.name);tokens.append(token)}});
    cell.append(band,number,symbol,label,price,tokens);cell.addEventListener('click',()=>inspect(index));board.append(cell);
  });
}
function renderHoldings(){
  const shelf=$('holdings');shelf.replaceChildren();const mine=game.holdings.filter(h=>h.owner===game.turn);
  if(!mine.length){const empty=document.createElement('div');empty.className='empty-shelf';empty.textContent='У вас пока нет карточек. Купленный бизнес появится здесь автоматически.';shelf.append(empty);return}
  mine.forEach(h=>{const card=document.createElement('button');card.type='button';card.className='holding-card';card.style.setProperty('--category',CATEGORIES[h.business.category].color);
    const cap=document.createElement('small');cap.textContent=`№${String(cellNumber(h.tileIndex)).padStart(2,'0')} · ${CATEGORIES[h.business.category].label.toUpperCase()}`;
    const title=document.createElement('strong');title.textContent=h.business.name;
    const info=document.createElement('small');info.textContent=h.mortgaged?'ЗАЛОЖЕНО · аренда 0 ₽':`Аренда ${rub(currentRent(game,h))} · ур. ${h.level}/2`;
    card.append(cap,title,info);card.addEventListener('click',()=>openDetail(h.tileIndex));shelf.append(card);
  });
}
function cardMarkup(business,index,holding=null){
  const category=CATEGORIES[business.category];const rent=holding?currentRent(game,holding):rentFor({business,level:0,mortgaged:false});
  return `<article class="dialog-card" style="--category:${category.color}"><div class="meta">КАРТА №${String(cellNumber(index)).padStart(2,'0')} / ${category.label.toUpperCase()}</div><div class="symbol">${business.icon}</div><h3>${business.name}</h3><div class="stat"><span>ПОКУПКА</span><strong>${rub(business.price)}</strong></div><div class="stat"><span>АРЕНДА${holding?` · УР. ${holding.level}`:''}</span><strong>${rub(rent)}</strong></div><div class="stat"><span>УЛУЧШЕНИЕ</span><strong>${rub(business.upgrade)}</strong></div>${business.oil?`<div class="stat"><span>ДОХОД ЗА КРУГ</span><strong>${rub(holding?.mortgaged?0:business.oil)}</strong></div>`:''}${holding?.mortgaged?'<p class="card-status">ЗАЛОЖЕНО · АРЕНДА И ДОХОД ОТКЛЮЧЕНЫ</p>':''}</article>`;
}
function inspect(index){
  const tile=TILES[index],business=businessAt(game,index);detailIndex=index;
  if(business){openDetail(index);return}
  const content=$('detailContent');
  if(tile.kind==='business')content.innerHTML=`<p class="eyebrow">ЗАКРЫТАЯ КЛЕТКА №${String(cellNumber(index)).padStart(2,'0')}</p><h2>${CATEGORIES[tile.category].label}</h2><p>При первом попадании откройте бизнес этой категории. После открытия карточка закрепится за клеткой.</p>`;
  else content.innerHTML=`<p class="eyebrow">КЛЕТКА ПОЛЯ</p><h2>${tile.name}</h2><p>${tile.kind==='chance'||tile.kind==='fund'?'При попадании нажмите соответствующую стопку в центре поля.':tile.kind==='tax'?`Платёж в банк: ${rub(tile.amount)}.`:tile.kind==='jackpot'?'Игровой приз от 80 до 160 ₽.':'За полный круг банк платит 200 ₽.'}</p>`;
  for(const id of ['upgradeButton','sellUpgradeButton','mortgageButton','redeemButton'])$(id).hidden=true;
  $('detailDialog').showModal();
}
function openDetail(index){
  const business=businessAt(game,index),h=holdingAt(game,index);if(!business){inspect(index);return}detailIndex=index;
  $('detailContent').innerHTML=`<p class="eyebrow">${h?.owner!==null&&h?.owner!==undefined?`ВЛАДЕЛЕЦ: ${game.players[h.owner].name.toUpperCase()}`:'СВОБОДНЫЙ БИЗНЕС'}</p>${cardMarkup(business,index,h)}`;
  const mine=h?.owner===game.turn&&game.phase==='end';
  $('upgradeButton').hidden=!mine||h.mortgaged||h.level>=2;
  if(!$('upgradeButton').hidden){const cost=costFor(active(),business,true);$('upgradeButton').textContent=`Улучшить за ${rub(cost)} → аренда ${rub(rentFor({business,level:h.level+1,mortgaged:false},ownsGroup(game,game.turn,business.category)))}`;$('upgradeButton').disabled=active().cash<cost}
  $('sellUpgradeButton').hidden=!mine||h.level===0;
  if(!$('sellUpgradeButton').hidden)$('sellUpgradeButton').textContent=`Продать улучшение за ${rub(resaleValue(h.upgradeCosts.at(-1)))}`;
  $('mortgageButton').hidden=!mine||h.mortgaged||h.level>0;
  if(!$('mortgageButton').hidden)$('mortgageButton').textContent=`Заложить за ${rub(mortgageValue(business))}`;
  $('redeemButton').hidden=!mine||!h.mortgaged;
  if(!$('redeemButton').hidden){$('redeemButton').textContent=`Выкупить залог за ${rub(redemptionCost(business))}`;$('redeemButton').disabled=active().cash<redemptionCost(business)}
  $('detailDialog').showModal();
}
function reopenDetail(){const index=detailIndex;$('detailDialog').close();render();openDetail(index);save()}
function showOffer(){const index=game.pendingTile,business=businessAt(game,index);$('offerCard').innerHTML=cardMarkup(business,index);const cost=costFor(active(),business);$('buyButton').textContent=`Купить за ${rub(cost)}`;$('buyButton').disabled=active().cash<cost;$('offerFineText').textContent=`Отказ — штраф 30 ₽. Карточка №${String(cellNumber(index)).padStart(2,'0')} останется открытой на этой клетке.`;if(!$('offerDialog').open)$('offerDialog').showModal()}
function showSettlement(){
  if(game.phase!=='settle')return;
  const payment=game.pendingPayment,player=active(),gap=Math.max(0,payment.amount-player.cash);
  $('settlementReason').textContent=payment.reason;
  $('settlementDue').textContent=`К ОПЛАТЕ: ${rub(payment.amount)}`;$('settlementCash').textContent=`НАЛИЧНЫЕ: ${rub(player.cash)}`;
  $('settlementHelp').textContent=`Не хватает ${rub(gap)}. Кредит: ${rub(player.debt)} / ${rub(CREDIT_LIMIT)}. Сначала можно продать улучшения, затем заложить предприятие; остаток покрыть кредитом.`;
  const select=$('settlementAsset'),selected=Number(select.value);select.replaceChildren(...game.holdings.filter(h=>h.owner===game.turn).map(h=>{const option=document.createElement('option');option.value=h.tileIndex;option.textContent=`№${String(cellNumber(h.tileIndex)).padStart(2,'0')} · ${h.business.name}${h.mortgaged?' (залог)':''}`;return option}));
  if([...select.options].some(option=>Number(option.value)===selected))select.value=String(selected);
  const h=holdingAt(game,Number(select.value));$('settlementSell').disabled=!h||h.level===0;$('settlementMortgage').disabled=!h||h.level>0||h.mortgaged;$('settlementBorrow').disabled=gap===0||player.debt>=CREDIT_LIMIT;$('settlementPay').disabled=gap>0;
  $('settlementBankrupt').hidden=canRecover(game);
  if(!$('settlementDialog').open)$('settlementDialog').showModal();
}
function showFinish(){const list=rankings(game);$('finishTitle').textContent=`${list[0].name} побеждает!`;$('finishScores').replaceChildren(...list.map((entry,rank)=>{const row=document.createElement('div');row.className='score-row';const name=document.createElement('span');name.textContent=`${rank+1}. ${entry.name}${entry.bankrupt?' · банкрот':''}`;const amount=document.createElement('strong');amount.textContent=entry.bankrupt?'—':rub(entry.total);row.append(name,amount);return row}));if(!$('finishDialog').open)$('finishDialog').showModal()}

async function roll(){
  if(game.phase!=='roll')return;
  const first=Math.floor(Math.random()*6)+1,second=Math.floor(Math.random()*6)+1;
  const path=move(game,first,second);render();
  for(const index of path){movingIndex=index;renderBoard();await delay(85)}
  movingIndex=null;land(game);render();save();
  if(game.phase==='offer')showOffer();else if(game.phase==='settle')showSettlement();
}
function takeCard(kind){
  if(game.phase!=='draw'||TILES[active().position].kind!==kind)return;
  const card=drawCard(game,kind);render();save();
  $('eventDeck').textContent=kind==='chance'?'СЕВЕРНЫЙ ШАНС':'ГОРОДСКИЕ СОБЫТИЯ';
  $('drawnCard').innerHTML=`<article class="dialog-card event"><div class="meta">${kind==='chance'?'СЕВЕРНЫЙ ШАНС':'ГОРОДСКИЕ СОБЫТИЯ'}</div><div class="symbol">${card.icon}</div><h3>${card.title}</h3><p>${card.text}</p><small>ВЫМЫШЛЕННОЕ ИГРОВОЕ СОБЫТИЕ</small></article>`;
  $('eventDialog').showModal();
}
function afterEventClose(){if(game?.phase==='settle')showSettlement()}
function finishPayment(){if(completePayment(game)){$('settlementDialog').close();update()}}
function changeAsset(operation){const index=Number($('settlementAsset').value);operation(game,index);render();showSettlement();save()}
function next(){if(!nextTurn(game))return;update();if(game.phase==='finished')showFinish()}
function newGame(count,mode){game=createGame(count,mode);render();save()}
function toggleZoom(){const frame=document.querySelector('.board-frame'),zoom=!frame.classList.contains('zoomed');frame.classList.toggle('zoomed',zoom);$('zoomButton').setAttribute('aria-pressed',String(zoom));$('zoomButton').setAttribute('aria-label',zoom?'Закрыть увеличенное поле':'Увеличить поле');$('zoomButton').textContent=zoom?'×':'⛶';document.body.classList.toggle('board-zoom-open',zoom)}

$('setupForm').addEventListener('submit',event=>{event.preventDefault();if(event.submitter?.value!=='start')return;const data=new FormData(event.currentTarget);$('setupDialog').close();newGame(Number(data.get('count')),data.get('mode'))});
$('newGameButton').addEventListener('click',()=>{if(game.phase!=='finished'&&!window.confirm('Начать новую партию? Текущая сохранённая партия будет заменена.'))return;$('setupDialog').showModal()});
$('againButton').addEventListener('click',()=>{$('finishDialog').close();$('setupDialog').showModal()});
$('rollButton').addEventListener('click',roll);$('nextButton').addEventListener('click',next);
$('buyButton').addEventListener('click',()=>{if(!buyBusiness(game))return;$('offerDialog').close();const index=active().position;update();openDetail(index)});
$('declineButton').addEventListener('click',()=>{if(!declineBusiness(game))return;$('offerDialog').close();update();if(game.phase==='settle')showSettlement()});
$('upgradeButton').addEventListener('click',()=>{if(upgrade(game,detailIndex))reopenDetail()});
$('sellUpgradeButton').addEventListener('click',()=>{if(sellUpgrade(game,detailIndex))reopenDetail()});
$('mortgageButton').addEventListener('click',()=>{if(mortgage(game,detailIndex))reopenDetail()});
$('redeemButton').addEventListener('click',()=>{if(redeem(game,detailIndex))reopenDetail()});
$('repayButton').addEventListener('click',()=>{const amount=repay(active(),100);update(`Погашено ${rub(amount)} кредита.`)});
$('settlementAsset').addEventListener('change',showSettlement);
$('settlementSell').addEventListener('click',()=>changeAsset(sellUpgrade));
$('settlementMortgage').addEventListener('click',()=>changeAsset(mortgage));
$('settlementBorrow').addEventListener('click',()=>{borrowForPayment(game);render();showSettlement();save()});
$('settlementPay').addEventListener('click',finishPayment);
$('settlementBankrupt').addEventListener('click',()=>{if(bankrupt(game)){$('settlementDialog').close();update()}});
$('zoomButton').addEventListener('click',toggleZoom);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.board-frame.zoomed'))toggleZoom()});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.close;if(id==='offerDialog'){$('declineButton').click();return}$(id).close();if(id==='eventDialog')afterEventClose()}));
$('eventDialog').addEventListener('cancel',event=>{event.preventDefault();$('eventDialog').close();afterEventClose()});
$('offerDialog').addEventListener('cancel',event=>event.preventDefault());
$('settlementDialog').addEventListener('cancel',event=>event.preventDefault());

game=load();
if(game){render();if(game.phase==='offer')showOffer();else if(game.phase==='settle')showSettlement();else if(game.phase==='finished')showFinish()}
else{newGame(2,'random');$('setupDialog').showModal()}
