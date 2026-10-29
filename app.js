/* «Тропа единства», редакция 2.3 — правки по режиссуре и дизайну (29.10.2026) + подарочный купон (coupon.js). */
(() => {
  'use strict';
  const KEY = 'amur_tropa_game_v3';
  const TARGET = 'ЕДИНСТВО';
  const LETTERS = ['Н','Д','Е','Т','И','С','В','О'];
  const CORRECT_WORD_INDICES = [2,1,4,0,5,3,6,7];
  const ORDER = ['1611','1612','1613','2005'];
  const ORDER_VIEW = [
    {id:'2005',text:'Впервые отмечают современный День народного единства'},
    {id:'1613',text:'В освобождённой Москве Земский собор избирает царём Михаила Романова'},
    {id:'1611',text:'В Нижнем Новгороде собирают Второе ополчение'},
    {id:'1612',text:'Ополчение освобождает Москву'}
  ];
  const FESTIVALS = ['Масленица','Сабантуй','Сагаалган','Бакалдын'];
  const FESTIVAL_DESC = [
    'Эвенки Приамурья: праздник встречи — родные и друзья съезжаются из дальних мест',
    'Татары и башкиры: бег в мешках и борьба на кушаках после весеннего сева',
    'Буряты: Белый месяц, Новый год по лунному календарю',
    'Русские: блины и чучело зимы'
  ];
  const MATCH = {0:3,1:1,2:2,3:0};
  /* word.text — слово ответа, word.marks — индексы букв, которые игрок получает (подсвечиваются киноварью). */
  const PAGES = [
    {
      title:'Герой не по инструкции', plan:'Проверить, бывает ли герой без короны',
      nestor:'1611 год, страна в Смуте. В Нижнем Новгороде Кузьма Минин призывает жителей собрать ополчение.',
      morok:'В моём списке спасителей только знатные. А этот Минин не проходит ни по одной графе!',
      question:'Кем был Кузьма Минин?', kind:'choice',
      options:[['king','Стрелецким сотником'],['starosta','Земским старостой'],['voevoda','Боярином']],right:'starosta',hintHide:'king',
      rightText:'земским старостой',
      fact:'Минин торговал мясом, а горожане выбрали его земским старостой. Он собрал средства на Второе ополчение, а войско повёл князь Дмитрий Пожарский. Торговец и князь — вместе.',
      morokWin:'Я уже заказал трон. Придётся переделать его в скамейку для ополченцев.',
      mistakes:['В моём списке тоже нет подходящей графы. Ха!','Нестор, не подсказывай! Я ещё надеюсь найти у Минина корону.'],
      word:{text:'староста',marks:[0,1]}, prize:'СТ'
    },
    {
      title:'Праздник раньше победы', plan:'Поменять местами всё, кроме собственного имени',
      nestor:'Морок вырвал из Летописи четыре записи и перемешал их.',
      morok:'У меня сначала празднуют победу, а потом решают, бороться ли. Экономия времени!',
      question:'Расставь четыре события по порядку.', help:'Нажимай на события от раннего к позднему.', kind:'order',
      rightText:'сбор ополчения → освобождение Москвы → избрание царя → первый праздник',
      fact:'1611 — сбор ополчения, 1612 — освобождение Москвы, 1613 — избрание царя. Праздник 4 ноября — в память об освобождении Москвы ополчением осенью 1612 года, впервые его отметили в 2005-м. Вот почему у нашего дела номер 1612!',
      morokWin:'Четыре события — и все снова на месте. Кто разрешил вам разбираться в моих бумагах?',
      mistakes:['Этот порядок мне очень нравится. Истории — не очень.','Я так старательно всё перемешал. Не вздумай наводить порядок!'],
      seal:true, prize:''
    },
    {
      title:'Пословица с подвохом', plan:'Внести пироги в народную мудрость',
      nestor:'Морок признал, что люди объединились в тяжёлый момент. Но уверяет: в обычной жизни каждый сам за себя.',
      morok:'И пословицу я уже поправил: «каждому по пирогу». Теперь она честная — и никто никому не нужен!',
      question:'Как на самом деле заканчивается пословица «Дружно — не грузно, а врозь — ...»?', kind:'choice',
      options:[['alone','хоть плачь'],['real','хоть брось'],['pie','каждому по пирогу']],right:'real',hintHide:'alone',
      rightText:'«хоть брось»',
      fact:'«Дружно — не грузно, а врозь — хоть брось». Даже сундук вдвоём нести легче, чем одному.',
      morokWin:'Я требую вернуть пироги. Хотя бы в качестве компенсации за редактуру!',
      mistakes:['Пословица пока сопротивляется моей редактуре.','Я всё ещё настаиваю на пирогах. Нестор категорически против.'],
      word:{text:'брось',marks:[2]}, prize:'О'
    },
    {
      title:'Река под прикрытием', plan:'Засекретить реку при помощи двух букв',
      nestor:'Морок решил, что всё это было слишком давно, и взялся за наш край: спрятал реку у Благовещенска.',
      morok:'Операция «Совершенно секретная река»! Амур — отдельно, безымянная река — отдельно. Шифр лежит на виду.',
      question:'В слове «ЗЕМЛЯ» Морок спрятал реку. Убери две лишние буквы.', kind:'letters',
      rightText:'ЗЕЯ (убрать М и Л)',
      fact:'Получилась ЗЕЯ — крупнейший левый приток Амура. У Благовещенска Зея и Амур сливаются и дальше текут вместе.',
      morokWin:'Секрет продержался позорно мало. Увольняю себя из собственной разведки.',
      mistakes:['Ха! Эта буква тебе нужна, и я не скажу зачем.','Если убрать не те буквы, у реки появится новое имя. Мне нравится, Нестору — нет.'],
      word:{text:'зея',marks:[1]}, prize:'Е'
    },
    {
      title:'Арка вопреки Мороку', plan:'Доказать, что разрушенное не вернуть',
      morokFirst:true,
      morok:'Река, конечно, никуда не делась. А вот царская арка на набережной! Разрушена — значит, навсегда. Печать уже стоит.',
      nestor:'Триумфальную арку построили на берегу Амура в 1891 году, а в 1936-м разрушили. Но история на этом не закончилась.',
      question:'Как жители вернули арку городу?', kind:'choice',
      options:[['blueprint','По сохранившимся чертежам из Петербурга'],['archive','По старым фотографиям и архивам, всем городом'],['alone','Собрали из уцелевших старых кирпичей']],right:'archive',hintHide:'alone',
      rightText:'по старым фотографиям и архивам, всем городом',
      fact:'Чертежи не сохранились — арку воссоздали по старым фотографиям, на деньги жителей и предприятий, без бюджета. И открыли 4 ноября 2005 года — в самый первый День народного единства.',
      morokWin:'В мой же праздник?! Это уже личное.',
      mistakes:['Я предлагал обойтись без архивов. Нестор почему-то против.','Подумаешь, арка. Я бы на их месте вообще не рылся в старых снимках… ой.'],
      word:{text:'архивам',marks:[3,4]}, prize:'ИВ'
    },
    {
      title:'Праздники не по списку', plan:'Запретить дружбу из-за разных праздников',
      nestor:'Последний довод Морока: если люди празднуют по-разному, им не договориться.',
      morok:'Я даже издал указ: «Разные праздники — дружба запрещена». Осталось выяснить, кто что отмечает. Я запутался первым.',
      question:'Узнай, какая традиция связана с каждым праздником.', kind:'match',
      rightText:'Масленица — русские, Сабантуй — татары и башкиры, Сагаалган — буряты, Бакалдын — эвенки',
      fact:'Масленица — русские проводы зимы, Сабантуй — праздник татар и башкир, Сагаалган — бурятский Новый год, Бакалдын — эвенкийский праздник встречи. Разные традиции не мешают людям быть вместе.',
      morokWin:'Я хотел рассадить всех по разным праздникам, а они ещё и друг к другу в гости ходят! Куда жаловаться?',
      mistakes:['В моей ведомости тоже всё перепутано.','Незнакомое название? Отлично, значит, вы друг другу чужие!'],
      word:{text:'бакалдын',marks:[5,7]}, prize:'ДН'
    }
  ];
  const app = document.querySelector('#app');
  const initial = () => ({version:3,stage:'intro',page:0,feathers:3,used:0,errors:0,mistakes:0,rescued:false,hinted:false,solved:false,choices:[],pairs:{},removed:[],feedback:'',collected:'',seal:false,startedAt:null,endedAt:null,wordPlaced:Array(8).fill(null),wordHinted:false,wordMistakes:0,wordSolved:false});
  function load(){
    try {
      const item = JSON.parse(localStorage.getItem(KEY));
      if(!item || item.version!==3 || !['intro','page','word','ending','certificate'].includes(item.stage) || !Number.isInteger(item.page) || item.page<0 || item.page>5) return initial();
      const obj={...initial(),...item};
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
  function save(){ try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){/* приватный режим: играть можно без сохранения */} }
  function h(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}
  /* Неразрывные пробелы после коротких слов — без висячих предлогов. */
  function typo(s){return h(s).replace(/(^|[\s(«])([А-Яа-яЁё]{1,2})\s/g,'$1$2 ').replace(/\s—/g,' —')}

  /* ---------- фирменные значки (SVG вместо системных символов) ---------- */
  const ICON={
    feather:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3c-7 1-12 6-13 13l-3 5 1 .6 3-4.6c7-1 11-6 12-14z" fill="currentColor"/><path d="M8 16c3-3 6-6 9-10" stroke="#fffdf8" stroke-width="1.2" fill="none"/></svg>',
    seal:'<svg class="seal-ico" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="m32 4 6 8 10-2 2 10 9 5-5 9 5 9-9 5-2 10-10-2-6 8-6-8-10 2-2-10-9-5 5-9-5-9 9-5 2-10 10 2z"/><circle cx="32" cy="32" r="15"/></g><path d="m32 21 11 11-11 11-11-11z" fill="currentColor"/><path d="m32 27 5 5-5 5-5-5z" fill="#fffdf8"/></svg>',
    check:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 5 5L20 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    diamond:'<svg class="ico-d" viewBox="0 0 10 10" aria-hidden="true"><path d="m5 0 5 5-5 5-5-5z" fill="currentColor"/></svg>'
  };
  function ornament(){return `<svg class="ornament" viewBox="0 0 300 16" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><path d="M0 8H112M188 8H300" stroke="currentColor" stroke-width="1"/><path d="m125 8 8-7 8 7-8 7z m17 0 8-7 8 7-8 7z m17 0 8-7 8 7-8 7z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`}

  /* ---------- герои ---------- */
  function avatar(who,mood){
    if(who==='nestor') return `<span class="avatar nestor"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 48q0-18 18-18t18 18" fill="#a52721"/><path d="M11 19 24 5l13 14v8H11Z" fill="#a52721"/><path d="m20 8 4-4 4 4" fill="none" stroke="#fffdf8" stroke-width="1.5"/><ellipse cx="24" cy="24" rx="11" ry="12" fill="#edc8a2"/><path d="M14 28q-3 18 10 16 13 1 10-16-5 5-10 4t-10-4" fill="#fffdf8"/><path d="M17 23h4m6 0h4" stroke="#493b32" stroke-width="1.8" stroke-linecap="round"/><path d="M21 30q3 2 6 0" fill="none" stroke="#aa735d" stroke-width="1.5"/><path d="M38 47 46 26" stroke="#493b32" stroke-width="1.6"/><path d="M46 26c-4 2-6 6-6 10 3-2 6-6 6-10z" fill="#fffdf8" stroke="#493b32" stroke-width="1"/></svg></span>`;
    const brows={proud:'M14 19q5-4 9 0m3 0q4-4 9 0',angry:'M14 16l9 4m3 0 9-4',confused:'M14 19q5-3 9 0m3-3q4 1 9 4'}[mood||'proud'];
    const mouth={proud:'M18 32q6 4 12-1',angry:'M18 34q6-4 12 0',confused:'M18 33q3-2 6 0t6 0'}[mood||'proud'];
    return `<span class="avatar morok"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#346D95" d="M7 38c-8-9-3-17 2-21-2-9 8-13 14-10 9-4 19 5 15 14 8 6 3 18-6 18H13Z"/><path fill="#9FBBCD" opacity=".55" d="M5 30q6-5 12 0t12 0 12 0v4q-6 5-12 0t-12 0-12 0z"/><path d="${brows}" stroke="#e8f0f5" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="19" cy="24" r="3" fill="#fff"/><circle cx="30" cy="24" r="3" fill="#fff"/><circle cx="19" cy="24" r="1.3" fill="#1a2a35"/><circle cx="30" cy="24" r="1.3" fill="#1a2a35"/><path d="${mouth}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><g><circle cx="38" cy="30" r="2.6" fill="#5a3b2b"/><rect x="37" y="31" width="2" height="5.5" fill="#5a3b2b"/><rect x="32.5" y="36" width="11" height="5" rx="1.2" fill="#a52721" stroke="#fff" stroke-width=".8"/></g></svg></span>`;
  }
  function dialogue(who,text,mood){
    return `<div class="line ${who}">${avatar(who,mood)}<div class="bubble"><strong>${who==='morok'?'Морок':'Нестор Амурский'}</strong>${typo(text)}</div></div>`;
  }

  /* ---------- иллюстрации ---------- */
  function art(type,fog){
    const drawings={
      intro:`<rect x="95" y="34" width="129" height="109" rx="6" fill="#bd8f5e" transform="rotate(-4 160 88)"/><rect x="97" y="30" width="126" height="109" rx="6" fill="#a52721" transform="rotate(-4 160 88)"/><rect x="108" y="40" width="103" height="88" rx="3" fill="none" stroke="#e3c294" stroke-width="2" transform="rotate(-4 160 88)"/><path d="M161 55l10 17-10 17-10-17z" fill="none" stroke="#f0d6b0" stroke-width="2.5"/>`,
      final:`<path d="M160 52c-26-12-52-12-78-4v84c26-8 52-8 78 4 26-12 52-12 78-4V48c-26-8-52-8-78 4z" fill="#fffaf0" stroke="#a52721" stroke-width="2.5"/><path d="M160 52v84" stroke="#a52721" stroke-width="2"/><path d="M96 70h48M96 84h48M96 98h40M176 70h48M176 84h48M176 98h40" stroke="#d9c3a5" stroke-width="3"/><g fill="#a52721"><path d="m160 20 5 5-5 5-5-5z"/><path d="m120 26 4 4-4 4-4-4z"/><path d="m200 26 4 4-4 4-4-4z"/></g>`
    };
    const decorations=`<path d="M16 23h55M249 23h55M16 147h55M249 147h55" stroke="#b99568" stroke-width="1.2"/><g fill="none" stroke="#a52721" stroke-width="1.5"><path d="m80 24 8-8 8 8-8 8z"/><path d="m224 24 8-8 8 8-8 8z"/></g>`;
    const label=type==='final'?'Раскрытая Летопись, туман рассеялся':'Летопись в тумане';
    return `<div class="illustration${fog?' fogged':''}"><svg viewBox="0 0 320 168" role="img" aria-label="${label}"><g>${decorations}${drawings[type]||drawings.intro}</g></svg></div>`;
  }
  /* На игровых страницах вместо мелкой картинки — фирменная орнаментальная лента; туман уходит, когда страница восстановлена. */
  function band(fog){
    let rh='';for(let i=0;i<15;i++){const x=12+i*21;rh+=`<path d="m${x} 22 9-9 9 9-9 9z" fill="${i%5===2?'#a52721':'none'}" stroke="#a52721" stroke-width="1.3"/>`}
    return `<div class="band${fog?' fogged':''}" aria-hidden="true"><svg viewBox="0 0 330 44" preserveAspectRatio="xMidYMid meet"><path d="M0 8H330M0 36H330" stroke="#c9a77f" stroke-width="1"/>${rh}</svg></div>`;
  }

  /* ---------- шапка игры ---------- */
  function collectedStrip(){
    const letters=state.collected.split('');
    const seal=state.seal?`<span class="got-seal" title="Печать «4 ноября»">${ICON.seal}</span>`:'';
    return `<div class="collected" aria-label="Собрано букв: ${letters.length} из 8">${Array.from({length:8},(_,i)=>`<span class="${letters[i]?'got':''}">${letters[i]||''}</span>`).join('')}${seal}</div>`;
  }
  function header(label){
    return `<div class="stage-head"><div class="progress-row"><span class="progress-note">${label||`СТРАНИЦА ${state.page+1} / 6`}</span><span class="feathers" aria-label="Волшебных перьев: ${state.feathers} из 3">${ICON.feather} ${state.feathers} / 3</span></div>${collectedStrip()}</div>`;
  }
  function button(label,action,cls){return `<button type="button" class="${cls||'primary'}" data-action="${action}">${label}</button>`}

  /* ---------- вопросы ---------- */
  function actions(){
    if(state.solved)return `<div class="action-bar">${button(state.page===5?'Собрать слово силы →':'Следующая страница →','next')}</div>`;
    const label=state.hinted?'Подсказка использована':state.feathers>0?`Подсказка (осталось ${state.feathers})`:'Перья закончились';
    return `<div class="action-bar"><button type="button" class="secondary hint" data-action="hint" ${state.feathers<=0||state.hinted?'disabled':''}>${ICON.feather} ${label}</button></div>`;
  }
  function choiceButton(action,value,text,extra){
    return `<button class="choice${extra&&extra.cls?' '+extra.cls:''}" type="button" data-action="${action}" data-value="${h(value)}" ${extra&&extra.disabled?'disabled':''}><span class="choice-text">${typo(text)}</span><span class="endmark" aria-hidden="true">${extra&&extra.mark||'›'}</span></button>`;
  }
  function optionList(page){return `<div class="choices">${page.options.filter(o=>!state.hinted||o[0]!==page.hintHide).map(([id,txt])=>choiceButton('choice',id,txt)).join('')}</div>`}
  function orderQuestion(){
    const sel=state.choices;
    return `<div class="timeline-picks" aria-label="Выбранная последовательность">${ORDER.map((id,i)=>`<div class="timeline-dot ${i<sel.length?'done':''}">${sel[i]||'Шаг '+(i+1)}</div>`).join('')}</div><div class="choices">${ORDER_VIEW.map(e=>sel.includes(e.id)?'':choiceButton('order',e.id,e.text)).join('')}</div>`;
  }
  function letterQuestion(){
    return `<div class="letters-line">${['З','Е','М','Л','Я'].map((x,i)=>`<button type="button" class="letter-tile ${state.removed.includes(i)?'removed':''}" data-action="remove-letter" data-value="${i}" ${state.removed.includes(i)?'disabled':''} aria-label="Буква ${x}">${x}</button>`).join('')}</div>`;
  }
  function matchQuestion(){
    const current=FESTIVALS.findIndex((_,i)=>state.pairs[i]===undefined);
    if(current<0)return '';
    const used=Object.values(state.pairs);
    return `<div class="festival-step"><div class="festival-count">ПРАЗДНИК ${Object.keys(state.pairs).length+1} ИЗ 4</div><div class="festival-name">${h(FESTIVALS[current])}</div><div class="choices">${FESTIVAL_DESC.map((txt,i)=>used.includes(i)?'':choiceButton('description',i,txt)).join('')}</div></div>`;
  }
  function question(page){
    const body={choice:optionList,order:orderQuestion,letters:letterQuestion,match:matchQuestion}[page.kind](page);
    return `<section class="question-panel" aria-label="Испытание ${state.page+1}"><h2 class="question-heading">${typo(page.question)}</h2>${page.help?`<p class="question-help">${h(page.help)}</p>`:''}${body}</section>`;
  }
  function markedWord(w){return `<span class="answer-word">${w.text.toUpperCase().split('').map((c,i)=>w.marks.includes(i)?`<mark>${c}</mark>`:c).join('')}</span>`}
  function feedback(){
    const p=PAGES[state.page];
    if(state.solved){
      const reward=p.seal?`<div class="reward">${ICON.seal}<span>Печать «4 ноября» — ею в финале скрепим слово силы</span></div>`:`<div class="reward"><span>Буквы из ответа:</span>${markedWord(p.word)}</div>`;
      return `<div class="feedback success" role="status"><strong>Страница восстановлена</strong>${reward}${state.rescued?`<p><b>Нестор:</b> ${typo('Я помогу. Здесь важнее узнать историю, чем застрять на загадке. Правильный ответ: '+p.rightText+'.')}</p>`:''}<p>${typo(p.fact)}</p><div class="mock-line">${avatar('morok','angry')}<p>${typo(state.rescued?'А вот помогать было необязательно! Я надеялся, что вы тут надолго застрянете.':p.morokWin)}</p></div></div>`;
    }
    if(!state.feedback)return '';
    return `<div class="feedback error" role="status"><div class="mock-line">${avatar('morok','proud')}<p><b>Морок:</b> ${typo(state.feedback)}</p></div><p class="soft-note">Попробуй ещё раз${state.feathers>0&&!state.hinted?' или используй волшебное перо':''}.</p></div>`;
  }

  /* ---------- экраны ---------- */
  function renderIntro(){
    return `<section class="intro"><div class="intro-top"><div class="eyebrow">Сказочное дело № 1612</div><h1 class="display">Тропа<br>единства</h1>${ornament()}<p class="lead">${typo('Морок украл страницы Летописи и объявил единство выдумкой.')}</p></div>${art('intro',true)}<div class="story story-big">${dialogue('morok','Шесть страниц изъяты! Официальный вывод: единство — выдумка. Печать поставлена.')}${dialogue('nestor','Вверх ногами. Я — Нестор, хранитель Летописи Приамурья: она помнит, как люди справлялись с бедой вместе. А это Морок — туман ещё со времён Смуты.')}${dialogue('nestor','Где вырваны страницы, там туман. Будь Хранителем: верни шесть страниц — они дадут буквы для слова, которое разгонит туман.')}${dialogue('morok','Я против! Прошу записать моё возражение крупными буквами.','angry')}</div><div class="action-bar">${button('Разобраться с Мороком →','start')}</div><p class="bottom-caption">Примерно 7 минут · 6 страниц + слово силы · 3 подсказки<br>Без регистрации и таймера · Семейная игра</p></section>`;
  }
  function renderPage(){
    const p=PAGES[state.page];
    const story=p.morokFirst?dialogue('morok',p.morok)+dialogue('nestor',p.nestor):dialogue('nestor',p.nestor)+dialogue('morok',p.morok);
    return `${header()}<section class="game-stage">${band(!state.solved)}<div><div class="eyebrow plan">План Морока: ${typo(p.plan.toLowerCase())}</div><h1 class="stage-title">${typo(p.title)}</h1></div><div class="story">${story}</div>${state.solved?'':question(p)}${feedback()}${actions()}</section>`;
  }
  function renderWord(){
    const full=state.wordPlaced.every(n=>n!==null);
    const slots=`<div class="final-letters">${state.wordPlaced.map((n,i)=>`<div class="final-slot ${n===null?'':'filled'}" aria-label="Буква ${i+1}">${n===null?'':LETTERS[n]}</div>`).join('')}</div>`;
    const tiles=`<div class="final-options">${LETTERS.map((l,i)=>`<button type="button" class="choice" data-action="word-letter" data-value="${i}" ${state.wordPlaced.includes(i)||state.wordSolved?'disabled':''} aria-label="Выбрать ${l}">${l}</button>`).join('')}</div>`;
    let tail;
    if(state.wordSolved) tail=`<div class="feedback success sealed"><div class="reward">${ICON.seal}<span>Печать «4 ноября» скрепляет слово</span></div><strong>ЕДИНСТВО!</strong><p>${typo('Слово силы разогнало туман. Осталось узнать, как Морок объяснит своё поражение.')}</p></div><div class="action-bar">${button('Узнать, что стало с Мороком →','ending')}</div>`;
    else if(full) tail=`<div class="feedback error" role="status"><div class="mock-line">${avatar('morok','proud')}<p><b>Морок:</b> Мне нравится! Но туман почему-то не уходит.</p></div></div><div class="action-bar">${button('Переставить буквы','word-reset','secondary')}</div>`;
    else tail=`<div class="action-bar"><button type="button" class="secondary hint" data-action="word-hint" ${state.feathers===0||state.wordHinted?'disabled':''}>${ICON.feather} ${state.wordHinted?'Подсказка использована':`Подсказка (осталось ${state.feathers})`}</button><button type="button" class="secondary" data-action="word-back" ${state.wordPlaced.every(x=>x===null)||state.wordSolved?'disabled':''}>← Убрать</button></div>`;
    return `${header('СЛОВО СИЛЫ')}<section class="game-stage">${art(state.wordSolved?'final':'intro',!state.wordSolved)}<h1 class="stage-title">Слово сильнее Морока</h1><div class="story">${dialogue('nestor','Шесть страниц на месте. Ты уже догадался, какое слово? Всё равно собери: туман уходит только перед собранным словом.')}${dialogue('morok','Никто не догадается — я перемешал буквы! Из них отлично складывается «НЕДОВИСТ». Ну, почти.')}</div><section class="question-panel"><h2 class="question-heading">Собери слово силы</h2><p class="question-help">Нажимай на буквы по порядку — они встанут в пустые ячейки.</p>${slots}${tiles}</section>${tail}</section>`;
  }
  function renderEnding(){
    return `<section class="ending"><div class="eyebrow">Летопись спасена!</div><h1 class="subheading">У Морока плохие новости</h1>${art('final',false)}<div class="story story-big">${dialogue('morok','Я проверил ваши страницы. Ополчение собрали, праздник в его честь завели, пословицу вернули, реки у вас сливаются, арку отстроили, на чужие праздники ходите. Это портит мне весь доклад!','angry')}${dialogue('nestor','Тогда исправь вывод. Единство не значит, что все одинаковы. Оно начинается там, где люди готовы услышать и поддержать друг друга.')}${dialogue('morok','Исправить вывод?! Я уже поставил печать! И подпись! И ещё одну печать для убедительности!','angry')}${dialogue('nestor','Тогда начни с того, что переверни печать. Опять вверх ногами.')}${dialogue('morok','Я не исправился! Я просто… временно пересматриваю свою позицию. И печать.','confused')}</div><div class="action-bar">${button('Получить грамоту →','certificate')}</div></section>`;
  }
  function getRank(){const penalty=state.errors+state.used;return penalty===0?'Великий Хранитель Летописи':penalty<=3?'Хранитель Летописи':'Ученик Летописца'}
  function duration(){if(!state.startedAt||!state.endedAt)return '—';const s=Math.max(0,Math.round((state.endedAt-state.startedAt)/1000));return `${Math.floor(s/60)} мин ${String(s%60).padStart(2,'0')} сек`}
  function renderCertificate(){
    return `<section class="certificate"><div class="eyebrow center">Тропа единства пройдена</div><div class="certificate-paper"><div class="seal">${ICON.seal}</div><div class="cert-title">Грамота<br>Хранителя</div><div class="eyebrow">Летопись восстановлена</div><div class="certificate-word">ЕДИНСТВО</div><div>Присваивается звание</div><div class="rank">${h(getRank())}</div>${ornament()}<p class="lead">${typo('Шесть страниц вернулись в Летопись, туман рассеялся, а Морок усомнился в собственных теориях.')}</p><div class="bottom-caption">Время прохождения: ${h(duration())}</div><img class="cert-mark" src="img/mark-red.png" alt="Амурские сезоны" width="150" height="56"><div class="bottom-caption">2026</div></div><div id="coupon-slot"></div><div class="action-bar not-print">${button('Поделиться результатом','share')}${button('Сохранить / распечатать','print','secondary')}</div><p class="bottom-caption">${typo('Хочешь повторить загадки? Нажми «Начать заново» внизу — купон останется, но новый не выпускается.')}</p></section>`;
  }
  let showCoupon=false;
  function renderCouponScreen(){return `<section class="certificate"><div class="eyebrow center">Тропа единства</div><h1 class="subheading center">Мой подарочный купон</h1><div id="coupon-slot"></div><div class="action-bar">${button('← Вернуться к игре','close-coupon','secondary')}</div></section>`}
  function updateFooter(){const b=document.querySelector('#my-coupon');if(b)b.hidden=!(window.TropaCoupon&&window.TropaCoupon.has())||showCoupon}
  function render(){
    app.innerHTML=showCoupon?renderCouponScreen():state.stage==='intro'?renderIntro():state.stage==='page'?renderPage():state.stage==='word'?renderWord():state.stage==='ending'?renderEnding():renderCertificate();
    save();
    const slot=app.querySelector('#coupon-slot');
    if(slot&&window.TropaCoupon)window.TropaCoupon.mount(slot,{allowIssue:!showCoupon&&state.stage==='certificate'});
    updateFooter();
  }

  /* ---------- логика ---------- */
  function wrong(){state.errors+=1;state.mistakes+=1;const p=PAGES[state.page];state.feedback=p.mistakes[Math.min(state.mistakes-1,p.mistakes.length-1)];if(state.mistakes>=3){state.rescued=true;completePage()}else render();}
  function completePage(){const p=PAGES[state.page];state.solved=true;state.feedback='';if(p.seal)state.seal=true;else state.collected+=p.prize;render();}
  function clearPage(){state.solved=false;state.hinted=false;state.mistakes=0;state.rescued=false;state.feedback='';state.choices=[];state.pairs={};state.removed=[];}
  function hint(){if(state.feathers<=0||state.solved||state.hinted)return;state.feathers--;state.used++;state.hinted=true;state.feedback='';switch(PAGES[state.page].kind){
    case 'order':state.choices.push(ORDER[state.choices.length]);if(state.choices.length===ORDER.length)completePage();else render();break;
    case 'letters':if(!state.removed.includes(2))state.removed.push(2);else if(!state.removed.includes(3))state.removed.push(3);if(state.removed.length===2)completePage();else render();break;
    case 'match':for(let i=0;i<4;i++){if(state.pairs[i]===undefined){state.pairs[i]=MATCH[i];break}}if(Object.keys(state.pairs).length===4)completePage();else render();break;
    default:render();
  }}
  function onChoice(value){const page=PAGES[state.page];if(state.solved)return;if(value===page.right){completePage();return}wrong();}
  function onOrder(value){if(state.solved||state.choices.includes(value))return;if(value===ORDER[state.choices.length]){state.choices.push(value);state.feedback='';if(state.choices.length===ORDER.length)completePage();else render()}else wrong()}
  function onRemove(value){const i=Number(value);if(state.solved||state.removed.includes(i))return;if(i===2||i===3){state.removed.push(i);state.feedback='';if(state.removed.length===2)completePage();else render()}else wrong()}
  function onDescription(value){const i=Number(value);if(state.solved)return;const current=FESTIVALS.findIndex((_,k)=>state.pairs[k]===undefined);if(current<0||Object.values(state.pairs).includes(i))return;if(i===MATCH[current]){state.pairs[current]=i;state.feedback='';if(Object.keys(state.pairs).length===4)completePage();else render()}else wrong()}
  function onWordLetter(value){if(state.wordSolved||state.wordPlaced.every(x=>x!==null))return;const id=Number(value);if(!Number.isInteger(id)||id<0||id>7||state.wordPlaced.includes(id))return;state.wordPlaced[state.wordPlaced.findIndex(x=>x===null)]=id;if(state.wordPlaced.every(x=>x!==null)){if(state.wordPlaced.map(i=>LETTERS[i]).join('')===TARGET){state.wordSolved=true}else{state.errors++;state.wordMistakes++;if(state.wordMistakes>=3){state.wordPlaced=[...CORRECT_WORD_INDICES];state.wordSolved=true}}}render()}
  function wordReset(){state.wordPlaced=state.wordHinted?[2,null,null,null,null,null,null,7]:Array(8).fill(null);render()}
  function wordBack(){if(state.wordSolved)return;for(let i=7;i>=0;i--){if(state.wordPlaced[i]!==null&&!(state.wordHinted&&(i===0||i===7))){state.wordPlaced[i]=null;break}}render()}
  function wordHint(){if(state.feathers<=0||state.wordHinted||state.wordSolved)return;state.feathers--;state.used++;state.wordHinted=true;state.wordPlaced=[2,null,null,null,null,null,null,7];render()}
  function navigate(){window.scrollTo({top:0,behavior:'instant'})}
  function share(){
    const url=location.origin+location.pathname;
    const txt=`Моё звание — «${getRank()}»! Пройди «Тропу единства» от «Амурских сезонов»:`;
    if(navigator.share){navigator.share({title:'Тропа единства',text:txt,url}).catch(()=>{})}
    else if(navigator.clipboard){navigator.clipboard.writeText(txt+' '+url).then(()=>alert('Ссылка и звание скопированы.')).catch(()=>alert(txt+' '+url))}
    else alert(txt+' '+url);
  }
  function action(name,value){
    switch(name){
      case 'start':state.stage='page';state.startedAt=Date.now();clearPage();break;
      case 'choice':onChoice(value);return;
      case 'order':onOrder(value);return;
      case 'remove-letter':onRemove(value);return;
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
  app.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn||btn.disabled)return;action(btn.dataset.action,btn.dataset.value)});
  document.querySelector('#restart').addEventListener('click',()=>{const keep=window.TropaCoupon&&window.TropaCoupon.has();if(confirm('Начать приключение сначала? Прогресс игры будет сброшен.'+(keep?' Подарочный купон сохранится.':''))){state=initial();showCoupon=false;render();navigate()}});
  const myCoupon=document.querySelector('#my-coupon');if(myCoupon)myCoupon.addEventListener('click',()=>{showCoupon=true;render();navigate()});
  render();
})();
