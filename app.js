/* «Тропа единства», редакция 2.2 — сценарий v2.1 + подарочный купон (coupon.js) и серверная проверка. */
(() => {
  'use strict';
  const KEY = 'amur_tropa_game_v2';
  const TARGET = 'ЕДИНСТВО';
  const LETTERS = ['Н','Д','Е','Т','И','С','В','О'];
  const CORRECT_WORD_INDICES = [2,1,4,0,5,3,6,7];
  const ORDER = ['1611','1612','1613','2005'];
  const ORDER_VIEW = [
    {id:'2005',text:'Впервые отмечают современный День народного единства'},
    {id:'1613',text:'Михаила Романова избирают царём'},
    {id:'1611',text:'В Нижнем Новгороде собирают Второе ополчение'},
    {id:'1612',text:'Ополчение освобождает Москву'}
  ];
  const FESTIVALS = ['Масленица','Сабантуй','Сагаалган','Бакалдын'];
  const FESTIVAL_DESC = [
    'Встреча родов после зимы у эвенков',
    'Праздник после весеннего сева, народные состязания',
    'Начало нового года по традиционному лунному календарю',
    'Народные гуляния и проводы зимы'
  ];
  const MATCH = {0:3,1:1,2:2,3:0};
  const PAGES = [
    {
      title:'Герой не по инструкции', eyebrow:'История · 1611 год', art:'city',plan:'Проверить, бывает ли герой без короны',
      nestor:'1611 год. Страна переживает Смуту. В Нижнем Новгороде Кузьма Минин призывает жителей помочь собрать ополчение.',
      morok:'В моём списке спасителей есть цари и воеводы. А этот Минин почему-то не проходит ни по одной графе!',
      question:'Кем был Кузьма Минин?', kind:'choice',
      options:[['king','Царём'],['starosta','Земским старостой'],['voevoda','Воеводой']],right:'starosta',hintHide:'king',
      fact:'Минин был нижегородским земским старостой. Он помог собрать средства для Второго ополчения; во главе войска встал князь Дмитрий Пожарский.',
      morokWin:'Я уже заказал трон. Придётся переделать его в скамейку для ополченцев.',
      mistakes:['В моём списке тоже нет подходящей графы. Попробуй ещё раз.','Нестор, не подсказывай! Я ещё надеюсь найти у Минина корону.'],prize:'С'
    },
    {
      title:'Праздник раньше победы', eyebrow:'История · порядок событий', art:'timeline',plan:'Поменять местами всё, кроме собственного имени',
      nestor:'Морок вырвал четыре записи из Летописи и поменял их местами. Теперь непонятно, что случилось раньше.',
      morok:'В моей версии сначала отмечают победу, а потом решают, стоит ли за неё бороться. Экономия времени!',
      question:'Расставь четыре события по порядку.', kind:'order',
      fact:'1611 — сбор Второго ополчения; 1612 — освобождение Москвы; 1613 — избрание Михаила Романова. В современной России праздник впервые отметили в 2005 году.',
      morokWin:'Четыре события — и все снова на месте. Кто разрешил вам разбираться в моих бумагах?',
      mistakes:['Этот порядок мне очень нравится. Истории — не очень. Попробуй ещё раз.','Я так старательно всё перемешал. Не вздумай наводить порядок!'],prize:'Е'
    },
    {
      title:'Пословица с подвохом', eyebrow:'Народная мудрость', art:'proverb',plan:'Внести пироги в народную мудрость',
      nestor:'Морок признал, что люди сумели объединиться в тяжёлый момент. Но утверждает: в обычной жизни каждый всё равно сам за себя.',
      morok:'И пословицу я уже поправил: теперь она про пироги. Они куда убедительнее взаимовыручки!',
      question:'Как на самом деле заканчивается пословица «Дружно — не грузно, а врозь — ...»?', kind:'choice',
      options:[['alone','хоть плачь'],['real','хоть брось'],['pie','каждому по пирогу']],right:'real',hintHide:'alone',
      fact:'«Дружно — не грузно, а врозь — хоть брось». Вместе легче справиться с тем, что одному не под силу.',
      morokWin:'Я требую вернуть пироги. Хотя бы в качестве компенсации за редактуру!',
      mistakes:['Пословица пока сопротивляется моей редактуре. Попробуй ещё раз.','Я всё ещё настаиваю на пирогах. Нестор почему-то против.'],prize:'НО'
    },
    {
      title:'Река под прикрытием', eyebrow:'Приамурье · Благовещенск', art:'river',plan:'Засекретить реку при помощи двух букв',
      nestor:'Морок решил, что всё это было слишком давно. Теперь он взялся за наш край: спрятал название одной из рек у Благовещенска.',
      morok:'Операция «Совершенно секретная река»! Шифр лежит на виду. Это, между прочим, психологический ход.',
      question:'В слове «ЗЕМЛЯ» спрятано название реки, впадающей в Амур у Благовещенска. Убери две лишние буквы.', kind:'letters',
      fact:'Получилась ЗЕЯ. Эта река впадает в Амур у Благовещенска — здесь встречаются две большие реки.',
      morokWin:'Секрет продержался двенадцать секунд. Увольняю себя из собственной разведки.',
      mistakes:['Эта буква ещё пригодится названию реки.','Если убрать не те буквы, у реки появится новое имя. Я не против, но Нестор требует настоящее.'],prize:'И'
    },
    {
      title:'Арка вопреки Мороку', eyebrow:'Приамурье · память города', art:'arch',plan:'Доказать, что забытое вернуть невозможно',
      nestor:'Арку в Благовещенске возвели в 1891 году, а позже разобрали. И всё-таки история на этом не закончилась.',
      morok:'Река, конечно, никуда не делась. А вот арка! Разобрали — значит, навсегда. Я уже поставил печать.',
      question:'Как жители смогли воссоздать утраченную арку?',kind:'choice',
      options:[['blueprint','Спроектировали совершенно новую арку без опоры на старые материалы'],['archive','Использовали старые фотографии и архивные сведения, собрали средства'],['alone','Перенесли в город похожую старинную арку']],right:'archive',hintHide:'alone',
      fact:'Арку воссоздали в 2005 году по архивным материалам. Помогали жители города, организации и предприниматели.',
      morokWin:'Мою печать «Навсегда утрачено» опять придётся отменять. У вас что, есть отдел по отмене Морока?',
      mistakes:['Я предлагал обойтись без архивов. Нестор почему-то против. Попробуй ещё раз.','Смотри, где люди могли опереться на сведения о настоящей старой арке.'],prize:'В'
    },
    {
      title:'Праздники не по списку', eyebrow:'Народы России · традиции', art:'festival',plan:'Запретить дружбу из-за разных праздников',
      nestor:'Когда с историей города не вышло, Морок придумал последний довод: если люди по-разному празднуют, им точно не договориться.',
      morok:'Я даже издал указ: «Разные праздники — дружба запрещена». Осталось выяснить, кто что отмечает. Я запутался первым.',
      question:'Узнай, какая традиция связана с каждым праздником.',kind:'match',
      fact:'Масленица — проводы зимы; Сабантуй — праздник, известный у татар и башкир; Сагаалган — бурятский Новый год; Бакалдын — эвенкийский праздник встречи после зимы. Разные традиции не мешают людям быть вместе.',
      morokWin:'Я хотел рассадить всех по разным праздникам, а они ещё и друг к другу в гости ходят! Куда жаловаться?',
      mistakes:['В моей ведомости тоже всё перепутано. Давай ещё раз.','Незнакомое название — не страшно. В описании есть подсказка.'],prize:'ТД'
    }
  ];
  const MOODS = ['Преисполнен важности','Подозревает подвох','Защищает пироги','Провалил секретную операцию','Нервно шуршит документами','Перепроверяет свои убеждения'];
  const app = document.querySelector('#app');
  const initial = () => ({version:2,stage:'intro',page:0,feathers:3,used:0,errors:0,mistakes:0,rescued:false,hinted:false,solved:false,choices:[],pairs:{},selectedFestival:null,removed:[],feedback:'',collected:'',startedAt:null,endedAt:null,wordPlaced:Array(8).fill(null),wordHinted:false,wordMistakes:0,wordSolved:false});
  function load(){
    try {
      const item = JSON.parse(localStorage.getItem(KEY));
      if(!item || item.version!==2 || !['intro','page','word','ending','certificate'].includes(item.stage) || !Number.isInteger(item.page) || item.page<0 || item.page>5) return initial();
      const base=initial();
      const obj={...base,...item};
      obj.feathers=Math.max(0,Math.min(3,Number(obj.feathers)||0));
      obj.used=Math.max(0,Math.min(3,Number(obj.used)||0));
      obj.errors=Math.max(0,Math.min(99,Number(obj.errors)||0));
      if(!Array.isArray(obj.choices))obj.choices=[];
      if(!Array.isArray(obj.removed))obj.removed=[];
      if(!Array.isArray(obj.wordPlaced)||obj.wordPlaced.length!==8)obj.wordPlaced=Array(8).fill(null);
      if(typeof obj.pairs!=='object'||obj.pairs===null)obj.pairs={};
      obj.feedback='';
      return obj;
    } catch {return initial()}
  }
  let state=load();
  function save(){ try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){/* private mode: playable without persistence */} }
  function h(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}
  function icon(name){
    if(name==='feather')return '<span aria-hidden="true" class="feather-icon">❧</span>';
    if(name==='diamond')return '<span aria-hidden="true">◆</span>';
    return '';
  }
  function ornament(){return `<svg class="ornament" viewBox="0 0 300 16" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><path d="M0 8H112M188 8H300" stroke="currentColor" stroke-width="1"/><path d="m125 8 8-7 8 7-8 7z m17 0 8-7 8 7-8 7z m17 0 8-7 8 7-8 7z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`}
  function avatar(who){
    const svg=who==='morok'?`<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="#5b4b62" d="M8 30c-7-9-1-13 2-18-3-8 7-11 12-8 8-2 16 7 11 17 4 8-2 15-10 15H13Z"/><path fill="#e8dde8" d="M11 16q4-3 8 1m4-1q4-3 8 1" stroke="#e8dde8" stroke-width="1.5" fill="none"/><circle cx="16" cy="21" r="2.5" fill="#fff"/><circle cx="27" cy="21" r="2.5" fill="#fff"/><circle cx="16" cy="21" r="1"/><circle cx="27" cy="21" r="1"/><path d="M18 28q4 3 8-1" stroke="#fff" stroke-width="1.2" fill="none"/></svg>`:
    `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 39q0-17 15-17t15 17" fill="#a52721"/><path d="M9 15 20 3l11 12v7H9Z" fill="#a52721"/><ellipse cx="20" cy="20" rx="10" ry="11" fill="#edc8a2"/><path d="M12 24q-3 17 8 15 12 1 9-15-5 4-8 3t-9-3" fill="#f6f1e7"/><path d="M13 19h4m6 0h4" stroke="#493b32" stroke-width="1.5"/><path d="M17 25q3 2 6 0" fill="none" stroke="#aa735d" stroke-width="1.4"/></svg>`;
    return `<span class="avatar ${who}">${svg}</span>`;
  }
  function dialogue(who,text){
    return `<div class="line ${who}">${avatar(who)}<div class="bubble"><strong>${who==='morok'?'Морок':'Нестор Амурский'}</strong>${h(text)}</div></div>`;
  }
  function art(type){
    const decorations=`<path d="M16 23h55M249 23h55M16 147h55M249 147h55" stroke="#b99568" stroke-width="1.2"/><g fill="none" stroke="#a52721" stroke-width="1.5"><path d="m80 24 8-8 8 8-8 8z"/><path d="m224 24 8-8 8 8-8 8z"/></g>`;
    const drawings={
      intro:`<rect x="95" y="34" width="129" height="109" rx="6" fill="#bd8f5e" transform="rotate(-4 160 88)"/><rect x="97" y="30" width="126" height="109" rx="6" fill="#9d3024" transform="rotate(-4 160 88)"/><rect x="108" y="40" width="103" height="88" rx="3" fill="none" stroke="#e3c294" stroke-width="2" transform="rotate(-4 160 88)"/><path d="M161 55l10 17-10 17-10-17zM147 90q15 10 29 0" fill="none" stroke="#f0d6b0" stroke-width="2.5"/><path d="M232 55q20-35 34-4t-17 35m-194 25q-10-18 10-29t18 15" fill="none" stroke="#857b82" stroke-width="5" opacity=".6"/>`,
      city:`<path d="M30 137h260" stroke="#9c7653" stroke-width="2"/><path d="M48 137V81l22-20 22 20v56M99 137V65l28-16 28 16v72M163 137V93l20-12 20 12v44M214 137V65l24-21 25 21v72" fill="#d5b08a" stroke="#936647" stroke-width="2"/><path d="M56 87h28m23-13h40m74-1h34" stroke="#fff2d9" stroke-width="3"/><path d="M124 47V25m0 0-9 8h18z" stroke="#a52721" stroke-width="2" fill="#a52721"/><circle cx="162" cy="43" r="14" fill="#e6c88b" opacity=".65"/>`,
      timeline:`<path d="M34 83H285" stroke="#a52721" stroke-width="3" stroke-dasharray="4 8"/><g fill="#fbf3e7" stroke="#a52721" stroke-width="2"><rect x="36" y="61" width="58" height="44" rx="6"/><rect x="112" y="61" width="58" height="44" rx="6"/><rect x="188" y="61" width="58" height="44" rx="6"/></g><g fill="#8a3324" font-size="21" font-family="Georgia"><text x="57" y="89">?</text><text x="133" y="89">?</text><text x="209" y="89">?</text></g><path d="m257 79 20 4-20 5z" fill="#a52721"/>`,
      proverb:`<rect x="51" y="42" width="218" height="95" rx="8" fill="#fffaed" stroke="#c6aa7a" stroke-width="2"/><path d="M74 72h170M74 93h170M74 114h90" stroke="#d6c2a0" stroke-width="3"/><g fill="#a52721" font-family="Georgia" font-size="29" font-weight="bold"><text x="95" y="85">« ДРУЖНО »</text></g><path d="M228 114l-10 7-8-7" fill="none" stroke="#a52721" stroke-width="2"/>`,
      river:`<path d="M31 15q45 36 80 69t89 36 88 36" stroke="#537d99" stroke-width="25" fill="none" opacity=".78"/><path d="M240 9q-45 45-90 71t-39 71" stroke="#8eb1ba" stroke-width="21" fill="none" opacity=".8"/><circle cx="153" cy="83" r="16" fill="#fff7e9" stroke="#a52721" stroke-width="3"/><path d="m153 74 0 18m-9-9h18" stroke="#a52721" stroke-width="1.6"/><text x="170" y="61" font-size="18" fill="#6b4c32" font-family="Georgia">?</text><text x="219" y="136" font-size="13" fill="#fff" font-family="Georgia">АМУР</text>`,
      arch:`<g fill="#f8e4c5" stroke="#9b693f" stroke-width="2.5"><path d="M72 139V44h176v95h-40V91a48 48 0 0 0-96 0v48z"/><path d="M66 45V32h188v13z"/><path d="M78 32 102 15l24 17 38-19 39 19 24-17 20 17"/></g><path d="M112 139V91a48 48 0 0 1 96 0v48" fill="#e4d3bf"/><path d="M90 55v63M230 55v63" stroke="#a52721" stroke-width="3"/><text x="140" y="40" fill="#a52721" font-family="Georgia" font-size="12">1891</text>`,
      festival:`<path d="M36 38q124 34 248 0" fill="none" stroke="#87694f" stroke-width="2"/><path d="m52 42 13 30 15-24zm52 9 13 30 15-25zm53 3 13 30 15-30zm53-5 13 28 15-34zm53-12 13 31 10-34z" fill="#a52721" opacity=".85"/><circle cx="160" cy="107" r="29" fill="#f5d4a7" stroke="#b8884a" stroke-width="2"/><path d="M142 107q18-25 36 0m-36 0q18 25 36 0" stroke="#a52721" stroke-width="3" fill="none"/><g stroke="#aa855c" fill="none" stroke-width="2"><circle cx="75" cy="112" r="19"/><circle cx="245" cy="112" r="19"/></g>`
    };
    return `<div class="illustration"><svg viewBox="0 0 320 168" role="img" aria-label="Иллюстрация: ${type==='arch'?'Триумфальная арка':type==='river'?'две реки':type==='festival'?'традиционные праздники':'страница летописи'}"><g>${decorations}${drawings[type]||drawings.intro}</g></svg></div>`;
  }
  function header(){return `<div class="stage-head"><div class="progress-row"><span class="progress-note">СТРАНИЦА ${state.page+1} / 6</span><span class="feathers">${icon('feather')} ${state.feathers} / 3</span></div><div class="track" aria-label="Восстановлено ${state.page} из шести страниц">${Array.from({length:6},(_,i)=>`<span class="${i<state.page || i===state.page&&state.solved?'done':''}"></span>`).join('')}</div></div>`}
  function button(label,action,options=''){return `<button type="button" class="${options.includes('secondary')?'secondary':'primary'}" data-action="${action}">${label}</button>`}
  function actions(){
    if(state.solved)return `<div class="action-bar">${button(state.page===5?'Собрать слово силы →':'Следующая страница →','next')}</div>`;
    return `<div class="action-bar"><button type="button" class="secondary hint" data-action="hint" ${state.feathers<=0||state.hinted?'disabled':''} aria-label="Использовать волшебное перо">${icon('feather')} Подсказка ${state.feathers>0?'':'(нет)'}</button></div>`;
  }
  function optionList(page){return `<div class="choices">${page.options.filter(o=>!state.hinted||o[0]!==page.hintHide).map(([id,txt],i)=>`<button class="choice" type="button" data-action="choice" data-value="${id}"><span class="index">${i+1}.</span><span class="choice-text">${h(txt)}</span><span class="endmark" aria-hidden="true">›</span></button>`).join('')}</div>`}
  function orderQuestion(){
    const selected=state.choices;
    return `<div class="timeline-picks" aria-label="Выбранная последовательность">${ORDER.map((id,i)=>`<div class="timeline-dot ${i<selected.length?'done':''}">${selected[i] ? '✓ '+(i+1) : 'Шаг '+(i+1)}</div>`).join('')}</div><div class="choices">${ORDER_VIEW.map((e,i)=>`<button type="button" class="choice ${selected.includes(e.id)?'correct':''}" data-action="order" data-value="${e.id}" ${selected.includes(e.id)?'disabled':''}><span class="index">${i+1}.</span><span class="choice-text">${h(e.text)}</span><span class="endmark">${selected.includes(e.id)?'✓':'›'}</span></button>`).join('')}</div>`;
  }
  function letterQuestion(){
    return `<p class="question-help">Нажми на две лишние буквы. Останется название реки.</p><div class="letters-line">${['З','Е','М','Л','Я'].map((x,i)=>`<button type="button" class="letter-tile ${state.removed.includes(i)?'removed':''}" data-action="remove-letter" data-value="${i}" ${state.removed.includes(i)?'disabled':''} aria-label="Буква ${x}">${x}</button>`).join('')}</div>`;
  }
  function matchQuestion(){
    const current=FESTIVALS.findIndex((_,i)=>state.pairs[i]===undefined);
    const done=Object.keys(state.pairs).length;
    if(current<0)return `<div class="festival-done">Все четыре пары восстановлены!</div>`;
    return `<div class="festival-step"><div class="festival-count">ПРАЗДНИК ${done+1} ИЗ 4</div><div class="festival-name">${h(FESTIVALS[current])}</div><p class="question-help">Какое описание подходит?</p><div class="choices">${FESTIVAL_DESC.map((txt,i)=>`<button type="button" class="choice ${Object.values(state.pairs).includes(i)?'correct':''}" data-action="description" data-value="${i}" ${Object.values(state.pairs).includes(i)?'disabled':''}><span class="choice-text">${h(txt)}</span><span class="endmark" aria-hidden="true">›</span></button>`).join('')}</div></div><div class="festival-found">${FESTIVALS.map((n,i)=>`<span class="${state.pairs[i]!==undefined?'found':''}">${state.pairs[i]!==undefined?'✓ ':''}${h(n)}</span>`).join('')}</div>`;
  }
  function question(page){let body;
    switch(page.kind){case 'choice':body=optionList(page);break;case 'order':body=orderQuestion();break;case 'letters':body=letterQuestion();break;case 'match':body=matchQuestion();break;default:body='';}
    return `<section class="question-panel" aria-label="Испытание ${state.page+1}"><h2 class="question-heading">${h(page.question)}</h2>${page.kind==='order'?'<p class="question-help">Нажимай на события от раннего к позднему.</p>':''}${page.kind==='match'?'':''}${body}</section>`;
  }
  function feedback(){
    const p=PAGES[state.page];
    if(state.solved){return `<div class="feedback success" role="status"><strong>✦ Страница восстановлена · ${p.prize.split('').join(' · ')}</strong>${state.rescued?'<p><strong>Нестор:</strong> Я помогу. Здесь важнее узнать историю, чем застрять на загадке.</p>':''}<p>${h(p.fact)}</p><p class="mock"><strong>Морок:</strong> ${h(state.rescued?'А вот помогать было необязательно! Я надеялся, что вы тут надолго застрянете.':p.morokWin)}</p></div>`}
    if(!state.feedback)return '';
    return `<div class="feedback error" role="status"><strong>Морок вмешивается:</strong><p>${h(state.feedback)}</p><p class="soft-note">Попробуй ещё раз${state.feathers>0?' или используй волшебное перо':''}.</p></div>`;
  }
  function renderIntro(){
    return `<section class="intro"><div class="intro-top"><div class="eyebrow">Сказочное дело № 1612</div><h1 class="display">Тропа<br>единства</h1>${ornament()}<p class="lead">Морок украл шесть страниц Летописи.<br>И уже выступает с официальным заявлением.</p></div>${art('intro')}<div class="story">${dialogue('morok','Шесть страниц изъяты! Мой вывод: «Единство — выдумка». Жалобы не принимаются.')} ${dialogue('nestor','Печать у тебя вверх ногами. А ты, Хранитель, верни шесть страниц: они дадут восемь букв для слова, которое рассеет его чары.')}${dialogue('morok','Я против! И прошу записать моё возражение крупными буквами.')}</div><div class="action-bar">${button('Разобраться с Мороком →','start')}</div><p class="bottom-caption">Примерно 7 минут · 6 испытаний · 3 подсказки<br>Без регистрации и таймера · Семейная игра</p></section>`;
  }
  function renderPage(){const p=PAGES[state.page];return `${header()}<section class="game-stage">${art(p.art)}<div><div class="eyebrow">${h(p.eyebrow)}</div><h1 class="stage-title">${h(p.title)}</h1></div><div class="story">${state.page===4?dialogue('morok',p.morok)+dialogue('nestor',p.nestor):dialogue('nestor',p.nestor)+dialogue('morok',p.morok)}</div>${state.solved?'':question(p)}${feedback()}${actions()}${!state.solved&&state.hinted?'<p class="hint-note">Подсказка использована на этой странице</p>':''}</section>`}
  function renderWord(){const full=state.wordPlaced.every(n=>n!==null);return `<div class="stage-head"><div class="progress-row"><span class="progress-note">ФИНАЛЬНОЕ ИСПЫТАНИЕ</span><span class="feathers">${icon('feather')} ${state.feathers} / 3</span></div><div class="track">${Array.from({length:6},()=>'<span class="done"></span>').join('')}</div></div><section class="game-stage">${art('intro')}<h1 class="stage-title">Слово сильнее Морока</h1><div class="story">${dialogue('nestor','Шесть страниц на месте. Из них мы получили восемь букв. Собери последнее слово — и туман исчезнет.')}${dialogue('morok','Я просил оставить слово «ПРОВАЛ», а вы зачем-то собрали восемь букв. Совершенно не по инструкции!')}</div><section class="question-panel"><h2 class="question-heading">Собери слово силы</h2><p class="question-help">Нажимай на буквы в нужном порядке. Они появятся в пустых ячейках.</p><div class="final-letters">${state.wordPlaced.map((n,i)=>`<div class="final-slot ${n===null?'':'filled'}" aria-label="Буква ${i+1}">${n===null?'·':LETTERS[n]}</div>`).join('')}</div><div class="final-options">${LETTERS.map((l,i)=>`<button type="button" class="choice" data-action="word-letter" data-value="${i}" ${state.wordPlaced.includes(i)||state.wordSolved?'disabled':''} aria-label="Выбрать ${l}">${l}</button>`).join('')}</div></section>${state.wordSolved?`<div class="feedback success"><strong>ЕДИНСТВО!</strong><p>Слово силы разрушило чары Морока. Теперь осталось узнать, как он объяснит своё поражение.</p></div><div class="action-bar">${button('Узнать, что стало с Мороком →','ending')}</div>`:full?`<div class="feedback error" role="status"><strong>Пока не получилось</strong><p>Морок снова перепутал буквы. Попробуй собрать другое слово.</p></div><div class="action-bar">${button('Переставить буквы','word-reset','secondary')}</div>`:`<div class="action-bar"><button type="button" class="secondary hint" data-action="word-hint" ${state.feathers===0||state.wordHinted?'disabled':''}>${icon('feather')} Подсказка</button><button type="button" class="secondary" data-action="word-back" ${state.wordPlaced.every(x=>x===null)||state.wordSolved?'disabled':''}>← Убрать букву</button></div>`}</section>`}
  function renderEnding(){return `<section class="ending"><div class="eyebrow">Летопись спасена!</div><h1 class="subheading">У Морока плохие новости</h1>${art('intro')}<div class="story">${dialogue('morok','Я проверил ваши страницы. И ополчение собрали, и арку вернули, и на разные праздники друг к другу ходят. Это портит мне весь доклад!')}${dialogue('nestor','Тогда исправь вывод. Единство не означает, что все одинаковы. Оно начинается там, где люди готовы услышать и поддержать друг друга.')}${dialogue('morok','Исправить вывод?! Я вообще-то уже поставил печать! И подпись! И ещё одну печать для убедительности!')}${dialogue('nestor','Тогда начни с того, что переверни печать. Ты опять поставил её вверх ногами.')}${dialogue('morok','Я не исправился! Я просто… временно пересматриваю свою позицию. И печать.')}</div><div class="action-bar">${button('Получить грамоту →','certificate')}</div></section>`}
  function getRank(){const penalty=state.errors+state.used;return penalty===0?'Великий Хранитель Летописи':penalty<=3?'Хранитель Летописи':'Ученик Летописца'}
  function duration(){if(!state.startedAt||!state.endedAt)return '—';const seconds=Math.max(0,Math.round((state.endedAt-state.startedAt)/1000));return `${Math.floor(seconds/60)} мин ${String(seconds%60).padStart(2,'0')} сек`}
  function renderCertificate(){return `<section class="certificate"><div class="eyebrow" style="text-align:center">Тропа единства · завершено</div><div class="certificate-paper"><div class="seal" aria-hidden="true">❖</div><div class="display">Грамота<br>Хранителя</div><div class="eyebrow">Летопись восстановлена</div><div class="certificate-word">ЕДИНСТВО</div><div>Присваивается звание</div><div class="rank">${h(getRank())}</div>${ornament()}<p class="lead">Ты восстановил шесть страниц, заставил Морока усомниться в собственных теориях и сохранил Летопись.</p><div class="bottom-caption">Время прохождения: ${h(duration())}<br>Амурские сезоны · 2026</div></div><div id="coupon-slot" class="not-print-coupon"></div><div class="action-bar not-print">${button('Поделиться результатом','share')}<button type="button" class="secondary" data-action="print">Грамота</button></div><p class="bottom-caption">Хочешь повторить загадки? Нажми «Начать заново» внизу — купон останется, но новый не выпускается.</p></section>`}
  let showCoupon=false;
  function renderCouponScreen(){return `<section class="certificate"><div class="eyebrow" style="text-align:center">Тропа единства</div><h1 class="subheading" style="text-align:center">Мой подарочный купон</h1><div id="coupon-slot"></div><div class="action-bar">${button('← Вернуться к игре','close-coupon','secondary')}</div></section>`}
  function updateFooter(){const b=document.querySelector('#my-coupon');if(b)b.hidden=!(window.TropaCoupon&&window.TropaCoupon.has())||showCoupon}
  function render(){app.innerHTML=showCoupon?renderCouponScreen():state.stage==='intro'?renderIntro():state.stage==='page'?renderPage():state.stage==='word'?renderWord():state.stage==='ending'?renderEnding():renderCertificate();save();
    const slot=app.querySelector('#coupon-slot');if(slot&&window.TropaCoupon)window.TropaCoupon.mount(slot,{allowIssue:!showCoupon&&state.stage==='certificate'});
    updateFooter()}
  function wrong(text){state.errors+=1;state.mistakes+=1;const p=PAGES[state.page];state.feedback=p.mistakes[Math.min(state.mistakes-1,p.mistakes.length-1)]||text||'Морок ликует: «Попробуй ещё раз!»';if(state.mistakes>=3){state.rescued=true;completePage()}else render();}
  function completePage(){state.solved=true;state.feedback='';state.collected+=PAGES[state.page].prize;render();}
  function clearPage(){state.solved=false;state.hinted=false;state.mistakes=0;state.rescued=false;state.feedback='';state.choices=[];state.pairs={};state.selectedFestival=null;state.removed=[];}
  function hint(){if(state.feathers<=0||state.solved||state.hinted)return;state.feathers--;state.used++;state.hinted=true;state.feedback='';switch(PAGES[state.page].kind){
    case 'order':state.choices.push(ORDER[state.choices.length]);if(state.choices.length===ORDER.length)completePage();else render();break;
    case 'letters':if(!state.removed.includes(2))state.removed.push(2);else if(!state.removed.includes(3))state.removed.push(3);if(state.removed.length===2)completePage();else render();break;
    case 'match':for(let i=0;i<4;i++){if(state.pairs[i]===undefined){state.pairs[i]=MATCH[i];state.selectedFestival=null;break}}if(Object.keys(state.pairs).length===4)completePage();else render();break;
    default:render();
  }}
  function onChoice(value){const page=PAGES[state.page];if(state.solved)return;if(value===page.right){completePage();return}wrong('Хитрая уловка Морока! Это не тот ответ.');}
  function onOrder(value){if(state.solved||state.choices.includes(value))return;const expected=ORDER[state.choices.length];if(value===expected){state.choices.push(value);state.feedback='';if(state.choices.length===ORDER.length)completePage();else render()}else{wrong('Морок перепутал даты! Попробуй выбрать следующее событие ещё раз.')}}
  function onRemove(value){const index=Number(value);if(state.solved||state.removed.includes(index))return;if(index===2||index===3){state.removed.push(index);state.feedback='';if(state.removed.length===2)completePage();else render()}else wrong('Эта буква нужна! Попробуй убрать другую.')}
  function onFestival(value){const index=Number(value);if(state.solved||state.pairs[index]!==undefined)return;state.selectedFestival=index;state.feedback='';render()}
  function onDescription(value){const index=Number(value);if(state.solved)return;const current=FESTIVALS.findIndex((_,i)=>state.pairs[i]===undefined);if(current<0||Object.values(state.pairs).includes(index))return;if(index===MATCH[current]){state.pairs[current]=index;state.feedback='';if(Object.keys(state.pairs).length===4)completePage();else render()}else wrong('Это описание относится к другому празднику.')}
  function onWordLetter(value){if(state.wordSolved||state.wordPlaced.every(x=>x!==null))return;const id=Number(value);if(!Number.isInteger(id)||id<0||id>7||state.wordPlaced.includes(id))return;const pos=state.wordPlaced.findIndex(x=>x===null);state.wordPlaced[pos]=id;if(state.wordPlaced.every(x=>x!==null)){if(state.wordPlaced.map(i=>LETTERS[i]).join('')===TARGET){state.wordSolved=true}else{state.errors++;state.wordMistakes++;if(state.wordMistakes>=3){state.wordPlaced=[...CORRECT_WORD_INDICES];state.wordSolved=true}}}render()}
  function wordReset(){state.wordPlaced=state.wordHinted?[2,null,null,null,null,null,null,7]:Array(8).fill(null);render()}
  function wordBack(){if(state.wordSolved)return;for(let i=7;i>=0;i--){if(state.wordPlaced[i]!==null&&!(state.wordHinted&&(i===0||i===7))){state.wordPlaced[i]=null;break}}render()}
  function wordHint(){if(state.feathers<=0||state.wordHinted||state.wordSolved)return;state.feathers--;state.used++;state.wordHinted=true;state.wordPlaced=[2,null,null,null,null,null,null,7];render()}
  function navigate(){window.scrollTo({top:0,behavior:'instant'});setTimeout(()=>{const el=app.querySelector('h1');if(el)el.setAttribute('tabindex','-1')},0)}
  function share(){const txt=`Я прошёл онлайн-квест «Тропа единства» от «Амурских сезонов» и получил звание «${getRank()}»!`;
    if(navigator.share){navigator.share({title:'Тропа единства',text:txt}).catch(()=>{})}
    else if(navigator.clipboard){navigator.clipboard.writeText(txt).then(()=>alert('Результат скопирован.')).catch(()=>alert(txt))}
    else alert(txt);
  }
  function action(name,value){
    switch(name){
      case 'start':state.stage='page';state.startedAt=Date.now();clearPage();break;
      case 'choice':onChoice(value);return;
      case 'order':onOrder(value);return;
      case 'remove-letter':onRemove(value);return;
      case 'festival':onFestival(value);return;
      case 'description':onDescription(value);return;
      case 'hint':hint();return;
      case 'next':if(!state.solved)return;if(state.page===5){state.stage='word';state.wordPlaced=Array(8).fill(null)}else{state.page++;clearPage()}break;
      case 'word-letter':onWordLetter(value);return;
      case 'word-reset':wordReset();return;
      case 'word-back':wordBack();return;
      case 'word-hint':wordHint();return;
      case 'ending':if(!state.wordSolved)return;state.stage='ending';break;
      case 'certificate':state.stage='certificate';state.endedAt=Date.now();break;
      case 'share':share();return;
      case 'print':window.print();return;
      case 'close-coupon':showCoupon=false;break;
      default:return;
    }
    render();navigate();
  }
  document.querySelector('#app').addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn||btn.disabled)return;action(btn.dataset.action,btn.dataset.value)});
  document.querySelector('#restart').addEventListener('click',()=>{const keep=window.TropaCoupon&&window.TropaCoupon.has();if(confirm('Начать приключение сначала? Прогресс игры будет сброшен.'+(keep?' Подарочный купон сохранится.':''))){state=initial();showCoupon=false;render();navigate()}});
  const myCoupon=document.querySelector('#my-coupon');if(myCoupon)myCoupon.addEventListener('click',()=>{showCoupon=true;render();navigate()});
  render();
})();
