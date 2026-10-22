import {COLORS,QUESTIONS,FINISH,ROUNDS} from '../data.js';
import {createGame,current,canShortcut,draw,answer,next,ranking,validSave} from '../route-engine.js';
import {renderMap,animateMove} from '../map.js';
import {icon,PAWNS,PAWN_NAMES} from '../icons.js';
import {diceMarkup,rollDice} from '../dice.js';
const $=id=>document.getElementById(id),KEY='moroshka-route-v1';let state=null,busy=false;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
try{const loaded=JSON.parse(localStorage.getItem(KEY));if(validSave(loaded))state=loaded;}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='Партия сохранена в этом браузере. На телефоне прокручивайте карту в сторону или увеличьте её.';}catch{$('saveStatus').textContent='Браузер не разрешил сохранить партию. При закрытии страницы прогресс может потеряться.';}}
function render(){
  renderMap($('map'),state?.players||[]);if(!state)return;const p=current(state);
  $('round').textContent=`РАУНД ${Math.min(state.round,ROUNDS)} / ${ROUNDS}`;
  $('turnLabel').textContent=state.phase==='finished'?'Путешествие завершено':`Ход игрока ${state.turn+1}`;
  $('turnName').textContent=state.phase==='finished'?'Итоги готовы':p.name;
  $('turnHint').textContent=state.phase==='finished'?'Все получили одинаковое число ходов. Откройте итоговую таблицу.':p.pos===FINISH?'Вы уже в Муравленко! Отвечайте на вопросы и собирайте ягодки до конца партии.':canShortcut(state)?'Развилка! Продолжайте путь или потратьте 1 запас на вопрос о Муравленко.':`Точка ${p.pos+1} из 32. Запасы: ${p.supply}/5. Откройте вопрос о Ямале.`;
  $('normal').hidden=['question','result'].includes(state.phase);$('normal').textContent=state.phase==='finished'?'Посмотреть итоги':'Открыть вопрос о Ямале';
  $('shortcut').hidden=!canShortcut(state);$('shortcut').textContent='Срез: вопрос о Муравленко';$('resume').hidden=!['question','result'].includes(state.phase);
  ['normal','shortcut','resume','newGame'].forEach(id=>$(id).disabled=busy);
  $('players').replaceChildren(...state.players.map((p,i)=>{const row=document.createElement('div');row.className='player-row'+(i===state.turn&&state.phase!=='finished'?' active':'');const dot=document.createElement('span');dot.className='player-color';dot.style.setProperty('--pawn',COLORS[i]);dot.innerHTML=icon(PAWNS[i]);const info=document.createElement('div'),name=document.createElement('strong'),caption=document.createElement('small');name.textContent=p.name;caption.textContent=`${PAWN_NAMES[i]} · ${p.pos===FINISH?'Финиш':`точка ${p.pos+1}/32`} · запас ${p.supply}`;info.append(name,caption);const score=document.createElement('span');score.className='score';score.innerHTML=`${p.berries} ${icon('berry')}`;score.setAttribute('aria-label',`${p.berries} ягодок`);row.append(dot,info,score);return row;}));
  $('log').replaceChildren(...state.log.map(msg=>{const li=document.createElement('li');li.textContent=msg;return li;}));
}
function names(){const old=[...$('names').querySelectorAll('input')].map(x=>x.value);$('names').replaceChildren(...Array.from({length:Number($('count').value)},(_,i)=>{const label=document.createElement('label');label.className='field';label.innerHTML=`<span style="color:${COLORS[i]}">${icon(PAWNS[i])}</span> Игрок ${i+1} · ${PAWN_NAMES[i]}`;const input=document.createElement('input');input.name=`player${i}`;input.maxLength=20;input.placeholder=`Игрок ${i+1}`;input.setAttribute('aria-label',`Имя игрока ${i+1}`);input.value=old[i]||state?.players[i]?.name||'';label.append(input);return label;}));}
function setup(){if(busy)return;if(state){$('count').value=String(state.players.length);$('setupCopy').textContent='Новая партия заменит сохранение после нажатия «Начать путешествие».';}names();$('setup').showModal();}
function openQuestion(rolling=false){
  const q=QUESTIONS.find(q=>q.id===state.pending.id),p=state.pending,done=state.phase==='result';
  $('deckName').textContent=q.deck==='city'?'МУРАВЛЕНКО · КОРОТКИЙ ПУТЬ':'ЯМАЛ · ОСНОВНОЙ ПУТЬ';
  $('questionTitle').textContent=q.text;
  $('questionHint').textContent=p.shortcut?'Цена попытки: 1 запас. Верно — 5 шагов, ошибка — остаётесь на месте.':'Верный ответ: бросок кубика и ягодка. Ошибка: один шаг вперёд.';
  $('answers').replaceChildren(...q.answers.map((text,i)=>{const b=document.createElement('button');b.type='button';b.className='answer'+(done&&i===q.correct?' correct':done&&i===p.choice?' wrong':'');b.disabled=done;const letter=document.createElement('b');letter.textContent=['А','Б','В'][i];b.append(letter,document.createTextNode(text));b.addEventListener('click',()=>choose(i));return b;}));
  $('feedback').hidden=!done;$('next').hidden=!done;$('next').disabled=rolling;
  $('diceTray').hidden=!(done&&p.correct&&p.die);
  if(!$('diceTray').hidden){$('diceTray').innerHTML=diceMarkup(rolling?1:(p.face||p.die*2))+`<p>${rolling?'Кубик вращается…':`На кубике ${p.face||p.die*2}: ${p.die} ${p.die===1?'шаг':'шага'} + 1 за верный ответ.`}</p>`;}
  if(done){const result=document.createElement('strong');result.textContent=p.correct?'Верно! В коллекции ещё одна ягодка.':'Теперь вы знаете ответ.';const fact=document.createElement('p');fact.textContent=q.fact;$('feedback').replaceChildren(result,fact);
    if(!rolling){const move=document.createElement('p');move.textContent=`Продвижение: ${p.to-p.from} шаг.${p.shortcut?' Потрачен 1 запас.':''}${p.extra?' '+p.extra:''}`;$('feedback').append(move);if(p.incident){const event=document.createElement('p');event.textContent=`Событие «${p.incident.title}». ${p.incident.text}${p.incident.supply?` Запас ${p.incident.supply>0?'+':''}${p.incident.supply} (в пределах 0–5).`:''}${p.incident.berries?' +1 ягодка.':''}`;$('feedback').append(event);}const source=document.createElement('a');source.href=q.source;source.target='_blank';source.rel='noopener';source.textContent='Источник факта';$('feedback').append(source);}
    $('next').textContent=rolling?'Кубик вращается…':state.round===ROUNDS&&state.turn===state.players.length-1?'Подвести итоги':'Сделать ход и передать очередь';
  }
  if(!$('question').open)$('question').showModal();
}
async function choose(choice){if(busy)return;const result=answer(state,choice);if(!result)return;save();busy=true;try{const animate=result.correct&&result.die;openQuestion(Boolean(animate));if(animate)await rollDice($('diceTray').querySelector('.dice-scene'),result.face||result.die*2);}finally{busy=false;openQuestion();$('next').focus();}}
function finish(){const ranks=ranking(state),top=ranks[0],winners=ranks.filter(p=>p.pos===top.pos&&p.berries===top.berries);$('finishTitle').textContent=winners.length>1?'Общая победа!':`${top.name} побеждает!`;$('finishCopy').textContent=winners.length>1?`${winners.map(p=>p.name).join(', ')} прошли одинаково далеко и собрали одинаковое число ягодок.`:'Сначала сравниваем продвижение, затем ягодки за правильные ответы.';$('scores').replaceChildren(...ranks.map(p=>{const row=document.createElement('div');row.className='result-row';const name=document.createElement('strong');name.textContent=p.name;const score=document.createElement('span');score.textContent=`${p.pos===FINISH?'Финиш':`Точка ${p.pos+1}`} · ягодки ${p.berries}`;row.append(name,score);return row;}));if(!$('finish').open)$('finish').showModal();}
$('newGame').addEventListener('click',setup);$('closeSetup').addEventListener('click',()=>$('setup').close());$('count').addEventListener('change',names);
$('setupForm').addEventListener('submit',e=>{e.preventDefault();if(busy)return;state=createGame([...$('names').querySelectorAll('input')].map(x=>x.value));$('setup').close();save();render();$('normal').focus();});
$('normal').addEventListener('click',()=>{if(busy)return;if(!state){setup();return}if(state.phase==='finished'){finish();return}if(draw(state)){save();render();openQuestion();}});
$('shortcut').addEventListener('click',()=>{if(!busy&&draw(state,true)){save();render();openQuestion();}});$('resume').addEventListener('click',()=>openQuestion());
$('next').addEventListener('click',async()=>{if(busy)return;const move={...state.pending},player=state.turn;if(!next(state))return;busy=true;$('question').close();save();render();try{await animateMove($('map'),player,move.from,move.to,move.shortcut);}finally{busy=false;render();if(state.phase==='finished')finish();else $('normal').focus();}});
$('question').addEventListener('cancel',e=>e.preventDefault());$('again').addEventListener('click',()=>{$('finish').close();setup();});$('closeFinish').addEventListener('click',()=>$('finish').close());
function zoom(){const open=$('mapFrame').classList.toggle('zoomed');document.body.classList.toggle('zoom-open',open);$('zoom').setAttribute('aria-pressed',String(open));$('zoom').setAttribute('aria-label',open?'Закрыть увеличенную карту':'Увеличить карту');$('zoom').innerHTML=icon(open?'close':'expand');} $('zoom').addEventListener('click',zoom);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('mapFrame').classList.contains('zoomed'))zoom();});
render();if(state){if(['question','result'].includes(state.phase))openQuestion();else if(state.phase==='finished')finish();}
