export const COLORS = ['#d87648', '#6aaba0', '#dbbc62', '#aa8cca'];
export const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export const CATEGORIES = {
  leisure: {label: 'Отдых', color: '#91b59f', icon: '♣'},
  culture: {label: 'Культура', color: '#d1a778', icon: '▣'},
  service: {label: 'Сервис', color: '#a9bec3', icon: '⌂'},
  transport: {label: 'Транспорт', color: '#c6a89a', icon: '➤'},
  energy: {label: 'Энергия', color: '#d48a5d', icon: '◆'}
};

export const BUSINESSES = [
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
export const BUSINESS_BY_ID = Object.fromEntries(BUSINESSES.map(b => [b.id, b]));

export const TILES = [
  {kind:'start',name:'Старт',icon:'↗'},
  {kind:'business',category:'leisure',fixed:'park'},
  {kind:'chance',name:'Северный шанс',icon:'✦'},
  {kind:'business',category:'culture',fixed:'museum'},
  {kind:'tax',name:'Городской сбор',icon:'−',amount:70},
  {kind:'business',category:'service',fixed:'cafe'},
  {kind:'jackpot',name:'Северный приз',icon:'★'},
  {kind:'business',category:'leisure',fixed:'familypark'},
  {kind:'chance',name:'Северный шанс',icon:'✦'},
  {kind:'business',category:'culture',fixed:'theater'},
  {kind:'fund',name:'Городские события',icon:'◇'},
  {kind:'business',category:'transport',fixed:'station'},
  {kind:'tax',name:'Зимний ремонт',icon:'−',amount:90},
  {kind:'business',category:'energy',fixed:'pump'},
  {kind:'fund',name:'Городские события',icon:'◇'},
  {kind:'business',category:'service',fixed:'market'},
  {kind:'jackpot',name:'Олений приз',icon:'★'},
  {kind:'business',category:'transport',fixed:'express'},
  {kind:'chance',name:'Северный шанс',icon:'✦'},
  {kind:'tax',name:'Коммунальные расходы',icon:'−',amount:80},
  {kind:'business',category:'leisure',fixed:'ski'},
  {kind:'fund',name:'Городские события',icon:'◇'},
  {kind:'business',category:'energy',fixed:'depot'},
  {kind:'chance',name:'Северный шанс',icon:'✦'}
];
export const BUSINESS_TILES = TILES.map((tile,index) => tile.kind === 'business' ? index : -1).filter(index => index >= 0);
export const BUSINESS_NUMBER = Object.fromEntries(BUSINESS_TILES.map((tileIndex,index) => [tileIndex,index+1]));
export const CATEGORY_COUNTS = Object.fromEntries(Object.keys(CATEGORIES).map(category => [category,BUSINESS_TILES.filter(index => TILES[index].category === category).length]));
export const PATH = [];
for(let c=0;c<7;c++) PATH.push([1,c+1]);
for(let r=1;r<7;r++) PATH.push([r+1,7]);
for(let c=5;c>=0;c--) PATH.push([7,c+1]);
for(let r=5;r>=1;r--) PATH.push([r+1,1]);

export const CARDS = {
  chance: [
    {id:'moroshka',title:'Карта «Морошка»',text:'Три покупки или улучшения в категориях «отдых», «культура» и «сервис» со скидкой 10%.',effect:'discount',value:3,icon:'✳'},
    {id:'fair',title:'Ягодная ярмарка',text:'Получите 120 ₽ из банка.',effect:'cash',value:120,icon:'✳'},
    {id:'supply',title:'Северная поставка',text:'Получите 90 ₽ из банка.',effect:'cash',value:90,icon:'➤'},
    {id:'repair',title:'Ремонт оборудования',text:'Заплатите банку 80 ₽.',effect:'cash',value:-80,icon:'◆'},
    {id:'deer',title:'Оленья удача',text:'Сохраните карту: следующая аренда для вас бесплатна.',effect:'shield',value:1,icon:'♞'},
    {id:'evening',title:'Тёплый вечер',text:'Получите 70 ₽ из банка.',effect:'cash',value:70,icon:'⌂'},
    {id:'storm',title:'Внезапная метель',text:'Заплатите банку 60 ₽.',effect:'cash',value:-60,icon:'❄'},
    {id:'routebonus',title:'Премия за маршрут',text:'При следующем прохождении старта получите дополнительно 100 ₽.',effect:'salary',value:100,icon:'↗'}
  ],
  fund: [
    {id:'vacation',title:'Дорога к отпуску',text:'Игровая компенсация: получите 120 ₽ из банка.',effect:'cash',value:120,icon:'➤'},
    {id:'northbonus',title:'Северная надбавка',text:'Игровая премия: получите 100 ₽.',effect:'cash',value:100,icon:'✦'},
    {id:'coefficient',title:'Районный коэффициент',text:'Разовый игровой бонус: получите 80 ₽.',effect:'cash',value:80,icon:'◇'},
    {id:'festival',title:'Семейный фестиваль',text:'Получите 90 ₽ из банка.',effect:'cash',value:90,icon:'♫'},
    {id:'cleanup',title:'Городской субботник',text:'Заплатите банку 50 ₽.',effect:'cash',value:-50,icon:'♣'},
    {id:'neighbors',title:'Поддержка соседей',text:'Получите 70 ₽ из банка.',effect:'cash',value:70,icon:'♡'},
    {id:'roof',title:'Ремонт крыши',text:'Заплатите банку 70 ₽.',effect:'cash',value:-70,icon:'⌂'},
    {id:'reindeer',title:'Спутник-олень',text:'Сохраните карту: следующая аренда для вас бесплатна.',effect:'shield',value:1,icon:'♞'}
  ]
};
export const CARD_BY_ID = Object.fromEntries(Object.values(CARDS).flat().map(card => [card.id,card]));
