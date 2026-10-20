import {START_CASH, PASS_START, DECLINE_FINE, ROUND_LIMIT, CREDIT_LIMIT, priceWithDiscount, rentFor, mortgageValue, redemptionCost, resaleValue, availableCredit, borrow, repay, lap, netWorth} from './economy.js';
import {BUSINESSES, BUSINESS_BY_ID, TILES, BUSINESS_TILES, CATEGORY_COUNTS, CATEGORIES, CARDS, CARD_BY_ID} from './game-data.js';

const shuffled = (items, rng) => {
  const result = [...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]]}
  return result;
};
export const playerAt = game => game.players[game.turn];
export const holdingAt = (game,index) => game.holdings.find(h => h.tileIndex === index);
export const businessAt = (game,index) => BUSINESS_BY_ID[game.assignments[index]] || null;
export const cellNumber = index => BUSINESS_TILES.indexOf(index)+1;
export const discountFor = (player,business) => player.discount>0 && ['leisure','culture','service'].includes(business.category) ? 10 : 0;
export const costFor = (player,business,upgrade=false) => priceWithDiscount(upgrade?business.upgrade:business.price,discountFor(player,business));

export function createGame(count,mode,rng=Math.random){
  if(!ROUND_LIMIT[count] || !['random','fixed'].includes(mode))throw Error('Invalid game setup');
  const assignments={};
  if(mode==='fixed')BUSINESS_TILES.forEach(index => assignments[index]=TILES[index].fixed);
  return {
    version:2,mode,turn:0,turnsTaken:0,phase:'roll',assignments,holdings:[],pendingPayment:null,pendingTile:null,lastCard:null,lastDice:null,
    players:Array.from({length:count},(_,i)=>({name:`Игрок ${i+1}`,cash:START_CASH,debt:0,position:0,discount:0,shieldCards:[],salaryBonus:0,salaryCard:null,heldDiscount:null,bankrupt:false})),
    businessDecks:Object.fromEntries(Object.keys(CATEGORIES).map(category=>[category,shuffled(BUSINESSES.filter(b=>b.category===category).map(b=>b.id),rng)])),
    decks:Object.fromEntries(Object.entries(CARDS).map(([kind,cards])=>[kind,shuffled(cards.map(c=>c.id),rng)])),
    message:'У каждого игрока 1 200 ₽. Бросайте кубики и открывайте предприятия.'
  };
}

export function ownsGroup(game,owner,category){
  const group=game.holdings.filter(h=>h.owner===owner&&h.business.category===category&&!h.mortgaged);
  return group.length===CATEGORY_COUNTS[category];
}
export function currentRent(game,holding){return rentFor(holding,ownsGroup(game,holding.owner,holding.business.category))}
export function consumeDiscount(game,business){
  const player=playerAt(game);
  if(!discountFor(player,business))return;
  player.discount--;
  if(player.discount===0&&player.heldDiscount){game.decks.chance.push(player.heldDiscount);player.heldDiscount=null}
}

export function move(game,first,second){
  if(game.phase!=='roll'||![first,second].every(n=>Number.isInteger(n)&&n>=1&&n<=6))throw Error('Cannot roll');
  game.phase='moving';game.lastDice=[first,second];const path=[];const player=playerAt(game);
  for(let step=0;step<first+second;step++){
    player.position=(player.position+1)%TILES.length;path.push(player.position);
    if(player.position===0){
      const oilIncome=game.holdings.filter(h=>h.owner===game.turn&&!h.mortgaged).reduce((sum,h)=>sum+(h.business.oil||0),0);
      const result=lap(player,oilIncome);
      if(player.salaryCard){game.decks.chance.push(player.salaryCard);player.salaryCard=null}
      game.message=`Полный круг: получено ${result.income} ₽${result.interest?`, проценты по кредиту ${result.interest} ₽`:''}.`;
    }
  }
  return path;
}

function payNow(game,amount,payee,reason){
  const payer=playerAt(game);payer.cash-=amount;
  if(payee!==null)game.players[payee].cash+=amount;
  game.message=reason;game.phase='end';
}
export function requestPayment(game,amount,payee,reason){
  if(!Number.isFinite(amount)||amount<0)throw Error('Invalid payment');
  const player=playerAt(game);
  if(player.cash>=amount){payNow(game,amount,payee,reason);return}
  game.pendingPayment={amount,payee,reason};game.phase='settle';
  game.message=`Для платежа ${amount} ₽ не хватает ${amount-player.cash} ₽. Продайте улучшение, заложите бизнес или возьмите кредит.`;
}
export function canRecover(game){
  const player=playerAt(game),potential=game.holdings.filter(h=>h.owner===game.turn).reduce((sum,h)=>sum+(h.upgradeCosts||[]).reduce((s,c)=>s+resaleValue(c),0)+(h.mortgaged?0:mortgageValue(h.business)),0);
  return player.cash+availableCredit(player)+potential >= game.pendingPayment.amount;
}
export function completePayment(game){
  if(game.phase!=='settle')return false;
  const {amount,payee,reason}=game.pendingPayment;
  if(playerAt(game).cash<amount)return false;
  game.pendingPayment=null;payNow(game,amount,payee,reason);return true;
}
export function borrowForPayment(game){
  if(game.phase!=='settle')return 0;
  const gap=game.pendingPayment.amount-playerAt(game).cash;
  const amount=borrow(playerAt(game),gap);
  game.message=`Банк выдал ${amount} ₽ кредита. Лимит непогашенного кредита — ${CREDIT_LIMIT} ₽.`;
  return amount;
}
export function sellUpgrade(game,index){
  if(!['end','settle'].includes(game.phase))return 0;
  const h=holdingAt(game,index);
  if(!h||h.owner!==game.turn||h.level===0||h.mortgaged)return 0;
  const cost=h.upgradeCosts.pop();h.level--;const amount=resaleValue(cost);playerAt(game).cash+=amount;
  game.message=`Улучшение «${h.business.name}» продано банку за ${amount} ₽.`;return amount;
}
export function mortgage(game,index){
  if(!['end','settle'].includes(game.phase))return 0;
  const h=holdingAt(game,index);
  if(!h||h.owner!==game.turn||h.level!==0||h.mortgaged)return 0;
  h.mortgaged=true;const amount=mortgageValue(h.business);playerAt(game).cash+=amount;
  game.message=`«${h.business.name}» заложено за ${amount} ₽. Аренды и дохода пока нет.`;return amount;
}
export function redeem(game,index){
  if(game.phase!=='end')return false;
  const h=holdingAt(game,index);
  if(!h||h.owner!==game.turn||!h.mortgaged)return false;
  const cost=redemptionCost(h.business);if(playerAt(game).cash<cost)return false;
  playerAt(game).cash-=cost;h.mortgaged=false;
  game.message=`«${h.business.name}» выкуплено из залога за ${cost} ₽.`;return true;
}
export function bankrupt(game){
  if(game.phase!=='settle'||canRecover(game))return false;
  const player=playerAt(game),payment=game.pendingPayment;
  if(payment.payee!==null)game.players[payment.payee].cash+=player.cash;
  player.cash=0;player.bankrupt=true;
  for(const h of game.holdings.filter(h=>h.owner===game.turn))h.owner=null;
  if(player.heldDiscount)game.decks.chance.push(player.heldDiscount);
  for(const id of player.shieldCards)game.decks[CARD_BY_ID[id].id==='deer'?'chance':'fund'].push(id);
  if(player.salaryCard)game.decks.chance.push(player.salaryCard);
  player.discount=0;player.heldDiscount=null;player.shieldCards=[];player.salaryCard=null;
  game.pendingPayment=null;game.phase='end';game.message=`${player.name} обанкротился. Бизнес возвращён банку, названия клеток сохранены.`;return true;
}

export function land(game){
  if(game.phase!=='moving')throw Error('Not moving');
  const player=playerAt(game),index=player.position,tile=TILES[index],holding=holdingAt(game,index);
  if(tile.kind==='business'){
    if(!game.assignments[index])game.assignments[index]=game.businessDecks[tile.category].shift();
    if(!game.assignments[index]){game.phase='end';game.message='В этой категории закончились карточки бизнеса.';return}
    if(!holding||holding.owner===null){game.pendingTile=index;game.phase='offer';game.message=`Предложение: ${businessAt(game,index).name}.`;return}
    if(holding.owner===game.turn){game.phase='end';game.message=`«${holding.business.name}» уже принадлежит вам.`;return}
    if(holding.mortgaged){game.phase='end';game.message=`«${holding.business.name}» заложено — аренда не взимается.`;return}
    const due=currentRent(game,holding);
    if(player.shieldCards.length){const id=player.shieldCards.shift();game.decks[id==='deer'?'chance':'fund'].push(id);game.phase='end';game.message=`Олень защитил от аренды ${due} ₽.`;return}
    requestPayment(game,due,holding.owner,`Аренда «${holding.business.name}»: ${due} ₽ → ${game.players[holding.owner].name}.`);return;
  }
  if(tile.kind==='chance'||tile.kind==='fund'){game.phase='draw';game.message=`Возьмите верхнюю карту из стопки «${tile.name}» в центре поля.`;return}
  if(tile.kind==='tax'){requestPayment(game,tile.amount,null,`${tile.name}: ${tile.amount} ₽ в банк.`);return}
  if(tile.kind==='jackpot'){const prize=[80,120,160][Math.floor(Math.random()*3)];player.cash+=prize;game.phase='end';game.message=`${tile.name}: банк выплатил ${prize} ₽.`;return}
  game.phase='end';game.message=`Старт: за полный круг банк платит ${PASS_START} ₽.`;
}

export function buyBusiness(game){
  if(game.phase!=='offer')return false;
  const index=game.pendingTile,business=businessAt(game,index),player=playerAt(game),price=costFor(player,business);
  if(player.cash<price)return false;
  player.cash-=price;consumeDiscount(game,business);
  const existing=holdingAt(game,index);
  if(existing){existing.owner=game.turn;existing.level=0;existing.upgradeCosts=[];existing.mortgaged=false}
  else game.holdings.push({tileIndex:index,business,owner:game.turn,level:0,upgradeCosts:[],mortgaged:false});
  game.pendingTile=null;game.phase='end';game.message=`«${business.name}» куплено за ${price} ₽. Карточка №${cellNumber(index)} добавлена в портфель.`;return true;
}
export function declineBusiness(game){
  if(game.phase!=='offer')return false;
  const name=businessAt(game,game.pendingTile).name;game.pendingTile=null;
  requestPayment(game,DECLINE_FINE,null,`Отказ от «${name}»: штраф ${DECLINE_FINE} ₽. Карточка осталась на клетке.`);return true;
}
export function upgrade(game,index){
  if(game.phase!=='end')return false;
  const h=holdingAt(game,index),player=playerAt(game);
  if(!h||h.owner!==game.turn||h.mortgaged||h.level>=2)return false;
  const cost=costFor(player,h.business,true);if(player.cash<cost)return false;
  player.cash-=cost;consumeDiscount(game,h.business);h.level++;h.upgradeCosts.push(cost);
  game.message=`«${h.business.name}» улучшено до уровня ${h.level}; аренда ${currentRent(game,h)} ₽.`;return true;
}
export function drawCard(game,kind){
  if(game.phase!=='draw'||TILES[playerAt(game).position].kind!==kind)return null;
  const id=game.decks[kind].shift(),card=CARD_BY_ID[id],player=playerAt(game);
  if(!card)throw Error('Deck is empty');
  game.lastCard={kind,id};
  if(card.effect==='discount'){player.discount=card.value;player.heldDiscount=id;game.phase='end';game.message=`Карта «Морошка» сохранена: ${card.value} скидки.`}
  else if(card.effect==='shield'){player.shieldCards.push(id);game.phase='end';game.message=`«${card.title}» сохранена до следующей аренды.`}
  else if(card.effect==='salary'){player.salaryBonus+=card.value;player.salaryCard=id;game.phase='end';game.message=`Доплата ${card.value} ₽ придёт при следующем прохождении старта.`}
  else {game.decks[kind].push(id);if(card.value>=0){player.cash+=card.value;game.phase='end';game.message=`${card.title}: получено ${card.value} ₽.`}else requestPayment(game,-card.value,null,`${card.title}: уплачено ${-card.value} ₽.`)}
  return card;
}
export function nextTurn(game){
  if(game.phase!=='end')return false;
  do{
    game.turnsTaken++;
    if(game.turnsTaken>=game.players.length*ROUND_LIMIT[game.players.length]){game.phase='finished';game.message=`Партия завершена после ${ROUND_LIMIT[game.players.length]} раундов.`;return true}
    game.turn=(game.turn+1)%game.players.length;
  }while(game.players[game.turn].bankrupt);
  game.phase='roll';game.lastCard=null;game.lastDice=null;game.message=`${playerAt(game).name}, бросайте кубики.`;return true;
}
export function rankings(game){return game.players.map((player,index)=>({index,name:player.name,bankrupt:player.bankrupt,total:netWorth(player,game.holdings.filter(h=>h.owner===index))})).sort((a,b)=>Number(a.bankrupt)-Number(b.bankrupt)||b.total-a.total)}
