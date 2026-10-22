import {COLORS,QUESTIONS,FINISH,ROUNDS,SHORTCUTS} from '../data.js?v=4';
import {createGame,current,canShortcut,draw,answer,next,ranking,validSave} from '../route-engine.js?v=4';
import {renderMap,animateMove} from '../map.js?v=4';
import {icon,PAWNS,PAWN_NAMES} from '../icons.js';
const $=id=>document.getElementById(id),KEY='moroshka-route-v2';let state=null,busy=false;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
try{const loaded=JSON.parse(localStorage.getItem(KEY));if(validSave(loaded))state=loaded;}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='Партия сохранена в этом браузере. На телефоне прокручивайте карту в сторону или увеличьте её.';}catch{$('saveStatus').textContent='Браузер не разрешил сохранить партию. При закрытии страницы прогресс может потеряться.';}}
function render(){
  renderMap($('map'),state?.players||[]);if(state){const pawn=$('map').querySelector(`[data-player="${state.turn}"]`);if(pawn){pawn.classList.add('active-pawn');const scroll=$('map').parentElement;scroll.scrollLeft=Math.max(0,pawn.offsetLeft-scroll.clientWidth/2);}}if(!state)return;const p=current(state);
  $('round').textContent=`РАУНД ${Math.min(state.round,ROUNDS)} / ${ROUNDS}`;
  $('turnLabel').textContent=state.phase==='finished'?'Путешествие завершено':`Ход игрока ${state.turn+1}`;
  $('turnName').textContent=state.phase==='finished'?'Итоги готовы':p.name;
  $('turnHint').textContent=state.phase==='finished'?'Все получили одинаковое число ходов. Откройте итоговую таблицу.':p.pos===FINISH?'Финиш! Остальные завершают этот раунд.':p.pos===8&&canShortcut(state)?'Речная развилка: на вёслах — длиннее, на моторной лодке — срез через реку.':canShortcut(state)?'Срез «'+SHORTCUTS[p.pos].name+'» экономит '+SHORTCUTS[p.pos].bonus+' клетку(и) за верный ответ.':'Клетка '+(p.pos+1)+' из 20. Ответьте верно, чтобы пройти одну клетку.';
  $('normal').hidden=['question','result'].includes(state.phase);$('normal').textContent=state.phase==='finished'?'Посмотреть итоги':p.pos===8?'На вёслах · открыть вопрос':canShortcut(state)?'Обычная тропа · открыть вопрос':'Открыть вопрос';
  $('shortcut').hidden=!canShortcut(state);$('shortcut').textContent=p.pos===8?'Моторная лодка · срез +2':SHORTCUTS[p.pos]?.name+' · срез +'+SHORTCUTS[p.pos]?.bonus;$('resume').hidden=!['question','result'].includes(state.phase);
  ['normal','shortcut','resume','newGame'].forEach(id=>$(id).disabled=busy);
  $('players').replaceChildren(...state.players.map((p,i)=>{const row=document.createElement('div');row.className='player-row'+(i===state.turn&&state.phase!=='finished'?' active':'');const dot=document.createElement('span');dot.className='player-color';dot.style.setProperty('--pawn',COLORS[i]);dot.innerHTML=icon(PAWNS[i]);const info=document.createElement('div'),name=document.createElement('strong'),caption=document.createElement('small');name.textContent=p.name;caption.textContent=`${PAWN_NAMES[i]} · ${p.pos===FINISH?'Финиш':`клетка ${p.pos+1}/20`}`;info.append(name,caption);const score=document.createElement('span');score.className='score';score.innerHTML=`${p.correct} ✓`;score.setAttribute('aria-label',`${p.correct} верных ответов`);row.append(dot,info,score);return row;}));
  $('log').replaceChildren(...state.log.map(msg=>{const li=document.createElement('li');li.textContent=msg;return li;}));
}
function names(){const old=[...$('names').querySelectorAll('input')].map(x=>x.value);$('names').replaceChildren(...Array.from({length:Number($('count').value)},(_,i)=>{const label=document.createElement('label');label.className='field';label.innerHTML=`<span style="color:${COLORS[i]}">${icon(PAWNS[i])}</span> Игрок ${i+1} · ${PAWN_NAMES[i]}`;const input=document.createElement('input');input.name=`player${i}`;input.maxLength=20;input.placeholder=`Игрок ${i+1}`;input.setAttribute('aria-label',`Имя игрока ${i+1}`);input.value=old[i]||state?.players[i]?.name||'';label.append(input);return label;}));}
function setup(){if(busy)return;if(state){$('count').value=String(state.players.length);$('setupCopy').textContent='Новая партия заменит сохранение после нажатия «Начать путешествие».';}names();$('setup').showModal();}
function openQuestion(rolling=false){
  const q=QUESTIONS.find(q=>q.id===state.pending.id),p=state.pending,done=state.phase==='result';
  $('deckName').textContent=(q.deck==='city'?'МУРАВЛЕНКО':'ЯМАЛ')+(p.shortcut?' · КОРОТКИЙ ПУТЬ':' · ОБЫЧНЫЙ ШАГ');
  $('questionTitle').textContent=q.text;
  const gatePos=p.from??current(state).pos;
  $('questionHint').textContent=p.shortcut?gatePos===8?'Моторная лодка: верный ответ доставит к дальнему причалу, минуя две речные клетки. Ошибка — остаётесь здесь.':'Верно: шаг +1 и срез ещё +'+SHORTCUTS[gatePos].bonus+'. Ошибка — остаётесь на месте.':gatePos>=8&&gatePos<=10?'Гребная лодка идёт по воде по одной клетке за верный ответ. Ошибка — стоите на месте.':'Верный ответ — один шаг. Ошибка — фишка остаётся на месте.';
  $('answers').replaceChildren(...p.order.map((original,i)=>{const text=q.answers[original];const b=document.createElement('button');b.type='button';b.className='answer'+(done&&original===q.correct?' correct':done&&i===p.choice?' wrong':'');b.disabled=done;const letter=document.createElement('b');letter.textContent=['А','Б','В'][i];b.append(letter,document.createTextNode(text));b.addEventListener('click',()=>choose(i));return b;}));
  $('feedback').hidden=!done;$('next').hidden=!done;$('next').disabled=rolling;
  if(done){const result=document.createElement('strong');result.textContent=p.correct?'Верно! Ответ засчитан.':'Теперь вы знаете ответ.';const fact=document.createElement('p');fact.textContent=q.fact;$('feedback').replaceChildren(result,fact);
    if(!rolling){const move=document.createElement('p');move.textContent=p.correct?`Продвижение: +${p.to-p.from} ${p.to-p.from===1?'клетка':'клетки'}.${p.bonus?` Срез сократил путь на ${p.bonus}.`:''}`:'Фишка остаётся на этой клетке.';$('feedback').append(move);const source=document.createElement('a');source.href=q.source;source.target='_blank';source.rel='noopener';source.textContent='Источник факта';$('feedback').append(source);}
    $('next').textContent=state.round===ROUNDS&&state.turn===state.players.length-1?'Подвести итоги':'Передать очередь';
  }
  if(!$('question').open)$('question').showModal();
}
function choose(choice){if(busy)return;const result=answer(state,choice);if(!result)return;save();openQuestion();$('next').focus();}
function finish(){const ranks=ranking(state),top=ranks[0],winners=ranks.filter(p=>p.pos===top.pos&&p.correct===top.correct);$('finishTitle').textContent=winners.length>1?'Общая победа!':`${top.name} побеждает!`;$('finishCopy').textContent=winners.length>1?`${winners.map(p=>p.name).join(', ')} прошли одинаково далеко и дали одинаковое число верных ответов.`:'Сравниваем продвижение, затем число верных ответов. У всех поровну ходов.';$('scores').replaceChildren(...ranks.map(p=>{const row=document.createElement('div');row.className='result-row';const name=document.createElement('strong');name.textContent=p.name;const score=document.createElement('span');score.textContent=`${p.pos===FINISH?'Финиш':`Точка ${p.pos+1}`} · верные ответы ${p.correct}`;row.append(name,score);return row;}));if(!$('finish').open)$('finish').showModal();}
$('newGame').addEventListener('click',setup);$('closeSetup').addEventListener('click',()=>$('setup').close());$('count').addEventListener('change',names);
$('setupForm').addEventListener('submit',e=>{e.preventDefault();if(busy)return;state=createGame([...$('names').querySelectorAll('input')].map(x=>x.value));$('setup').close();save();render();$('normal').focus();});
$('normal').addEventListener('click',()=>{if(busy)return;if(!state){setup();return}if(state.phase==='finished'){finish();return}if(draw(state)){save();render();openQuestion();}});
$('shortcut').addEventListener('click',()=>{if(!busy&&draw(state,true)){save();render();openQuestion();}});$('resume').addEventListener('click',()=>openQuestion());
$('next').addEventListener('click',async()=>{if(busy)return;const move={...state.pending},player=state.turn;if(!next(state))return;busy=true;$('question').close();save();render();try{await animateMove($('map'),player,move.from,move.to,move.shortcut);}finally{busy=false;render();if(state.phase==='finished')finish();else $('normal').focus();}});
$('question').addEventListener('cancel',e=>e.preventDefault());$('again').addEventListener('click',()=>{$('finish').close();setup();});$('closeFinish').addEventListener('click',()=>$('finish').close());
function zoom(){const open=$('mapFrame').classList.toggle('zoomed');document.body.classList.toggle('zoom-open',open);$('zoom').setAttribute('aria-pressed',String(open));$('zoom').setAttribute('aria-label',open?'Закрыть увеличенную карту':'Увеличить карту');$('zoom').innerHTML=icon(open?'close':'expand');} $('zoom').addEventListener('click',zoom);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('mapFrame').classList.contains('zoomed'))zoom();});
render();if(state){if(['question','result'].includes(state.phase))openQuestion();else if(state.phase==='finished')finish();}
