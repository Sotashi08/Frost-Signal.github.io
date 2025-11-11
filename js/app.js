
/* -------------------------
   Категории слов (>=20 слов в каждой)
   -------------------------*/
const CATEGORIES = {
    "Фрукты": [
        "яблоко","банан","апельсин","груша","виноград","киви","ананас","персик","слива","арбуз",
        "манго","лимон","мандарин","клубника","черника","вишня","дыня","ежевика","абрикос","грейпфрут"
    ],
    "Животные": [
        "кошка","собака","слон","тигр","лев","обезьяна","зебра","жираф","кролик","медведь",
        "волк","лиса","кит","дельфин","акула","пингвин","орел","черепаха","еж","коза"
    ],
    "Города": [
        "москва","париж","лондон","токио","пекин","берлин","каир","рим","киев",
        "петербург","мадрид","стамбул","вашингтон","шанхай","сидней","мехико","бангкок","дубай"
    ],
    "Цвета": [
        "красный","синий","зеленый","желтый","черный","белый","оранжевый","фиолетовый","розовый","коричневый",
        "серый","бирюзовый","золотой","серебряный","малиновый","лимонный","бирюзовый","шоколадный","лавандовый","сиреневый"
    ],
    "Транспорт": [
        "автомобиль","самолет","поезд","велосипед","метро","автобус","корабль","мотоцикл","трамвай","пароход",
        "вертолет","скутер","троллейбус","пароход","яхта","карт","самокат","фургон","ракета","кабриолет"
    ],
    "Профессии": [
        "учитель","врач","инженер","пожарный","полицейский","повар","программист","певец","художник","актёр",
        "доктор","журналист","строитель","дизайнер","фотограф","психолог","таксист","фермер","пилот","скульптор"
    ],
    "Мебель": [
        "стул","стол","кровать","шкаф","диван","комод","полка","кресло",
        "табурет","диванчик","тумбочка","банкетка","этажерка","шкафчик","кроватка","сервант","канапе"
    ],
    "Спорт": [
        "футбол","баскетбол","теннис","волейбол","плавание","бег","хоккей","гимнастика","бокс","гольф",
        "регби","сёрфинг","лыжи","сноуборд","фигурное","шахматы","бадминтон","скейтборд"
    ],
    "Еда": [
        "суп","пицца","борщ","салат","хлеб","рис","макароны","картофель","яйцо","молоко",
        "сыр","колбаса","курица","рыба","овощи","фрукты","торт","шоколад","печенье","йогурт"
    ],
    "Музыка": [
        "пианино","гитара","скрипка","барабан","труба","флейта","саксофон","виолончель","гармонь","орган",
        "арфа","банджо","кларнет","тромбон","укулеле","балалайка","маракасы","клавишные","мелодика","фортепиано"
    ]
};

/* -------------------------
   Пользовательский словарь (будет заполнен выбранной категорией)
   -------------------------*/
let DEFAULT_WORDS = []; // теперь управляется через категории
let wordPool = [];

/* -------------------------
   DOM элементы
   -------------------------*/
const btn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const input = document.getElementById('secretInput');
const feedback = document.getElementById('feedback');
const hint = document.getElementById('hint');
const snakesGroup = document.getElementById('snakes');
const wordLenSpan = document.getElementById('wordLen');

/* -------------------------
   Новые DOM элементы подсказок
   -------------------------*/
let hintContainer = null;     // обёртка под инпутом (mask + progress + button)
let maskDisplay = null;       // отображение _ _ а _ _
let progressBarInner = null;  // inner div прогресса
let revealBtn = null;         // кнопка "Открыть букву"
let revealStat = null;        // текст "Открыто X / Y"

/* -------------------------
   Аудио и состояние
   -------------------------*/
let audioCtx = null;
let currentSecret = null;
let currentCategory = null;
let snakePaths = [];
let snakeAnimationFrame = null;
let snakeGlowTimeout = null;
let snakeSpeed = 0.8;
let snakeSpeedTarget = 0.8;

/* -------------------------
   Подсказки: состояние + ограничения
   -------------------------*/
let revealedIndices = [];         // массив булевых флагов по индексам слова
let revealedLettersSet = new Set();// какие буквы уже открыты
let wrongAttempts = 0;             // счётчик неверных подряд попыток
let revealCount = 0;               // сколько раз открыто (букв-уникальных)
let maxReveals = 0;                // лимит раскрытий (уникальных букв)
let revealCooldown = false;        // временный блок (кулдаун)
const REVEAL_COOLDOWN_MS = 1500;   // пауза между подсказками
const AUTO_REVEAL_AFTER = 3;       // автоподсказка после N неверных попыток

/* -------------------------
   Adaptive / Particles config
   (kept intact — снизу идёт оригинальный код)
   -------------------------*/
/* основные параметры (можешь менять) */
const PARTICLE_COUNT = 65;
const PARTICLE_SIZE_MIN = 4;
const PARTICLE_SIZE_MAX = 6;
const PARTICLE_SPEED_Y_MIN = 0.3;
const PARTICLE_SPEED_Y_MAX = 1;
const PARTICLE_SPEED_X_MAX = 0.5;
const PARTICLE_ANGULAR_SPEED = 0.02;
const PARTICLE_MAX_LIFE_MIN = 75;
const PARTICLE_MAX_LIFE_MAX = 320;
const PARTICLE_LIFE_OVERRIDE = null;

const LINE_DISTANCE = 150;
const LINE_WIDTH = 1.9;
const LINE_BASE_COLOR = 'rgba(88,166,255,';
const LINE_ERROR_COLOR = 'rgba(255,50,50,';
const LINE_SUCCESS_COLOR = 'rgba(0,255,0,';
const LINE_MERCY = 0.08;

const MOBILE_MAX_WIDTH = 720;
const PARTICLE_COUNT_MOBILE = 30;
const LINE_DISTANCE_MOBILE = 70;
const LINE_ANIM_ENABLED_MOBILE = false;
const PARTICLE_LIFE_MIN_MOBILE = 60;
const PARTICLE_LIFE_MAX_MOBILE = 160;
const FRAME_SKIP_MOBILE = 2;

let isMobile = window.innerWidth <= MOBILE_MAX_WIDTH || /Mobi|Android/i.test(navigator.userAgent);
let ACTIVE_PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
let ACTIVE_LINE_DISTANCE = isMobile ? LINE_DISTANCE_MOBILE : LINE_DISTANCE;
let LINE_ANIM_ENABLED = isMobile ? LINE_ANIM_ENABLED_MOBILE : true;
let FRAME_SKIP = isMobile ? FRAME_SKIP_MOBILE : 0;
let _frameCounter = 0;

/* -------------------------
   Particles canvas
   -------------------------*/
const canvas = document.getElementById('pageParticles');
const ctx = canvas.getContext('2d');
let particles = [];
let showRedLines = false;
let showGreenLines = false;

/* -------------------------
   Утилиты
   -------------------------*/
const rand = (a,b)=>Math.random()*(b-a)+a;
const randInt = (a,b)=>Math.floor(Math.random()*(b-a+1)+a);
const shuffle = arr => {
    for(let i=arr.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
};

/* -------------------------
   ---- НОВОЕ: подготовка и UI подсказок
   -------------------------*/
function ensureHintUI(){
    if(hintContainer) return;

    // контейнер ниже формы (secretContainer)
    const secretContainer = document.getElementById('secretContainer');
    hintContainer = document.createElement('div');
    hintContainer.className = 'hint-ui';
    hintContainer.style.width = '100%';
    hintContainer.style.marginTop = '12px';
    hintContainer.style.display = 'flex';
    hintContainer.style.flexDirection = 'column';
    hintContainer.style.gap = '8px';
    secretContainer.after(hintContainer);

    // mask (строка типа "_ _ о _ _")
    maskDisplay = document.createElement('div');
    maskDisplay.id = 'maskDisplay';
    maskDisplay.style.fontFamily = 'inherit';
    maskDisplay.style.color = 'var(--accent)';
    maskDisplay.style.letterSpacing = '3px';
    maskDisplay.style.fontWeight = '600';
    maskDisplay.style.fontSize = '15px';
    maskDisplay.style.textAlign = 'center';
    maskDisplay.style.padding = '6px 8px';
    maskDisplay.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.006))';
    maskDisplay.style.border = '1px solid rgba(255,255,255,0.03)';
    maskDisplay.style.borderRadius = '8px';
    hintContainer.appendChild(maskDisplay);

    // progress bar + stat
    const progWrap = document.createElement('div');
    progWrap.style.display = 'flex';
    progWrap.style.alignItems = 'center';
    progWrap.style.gap = '10px';
    progWrap.style.justifyContent = 'space-between';

    const barOuter = document.createElement('div');
    barOuter.style.flex = '1';
    barOuter.style.height = '8px';
    barOuter.style.background = 'rgba(255,255,255,0.03)';
    barOuter.style.borderRadius = '6px';
    barOuter.style.overflow = 'hidden';
    barOuter.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.02)';

    progressBarInner = document.createElement('div');
    progressBarInner.style.height = '100%';
    progressBarInner.style.width = '0%';
    progressBarInner.style.background = 'linear-gradient(90deg,#58A6FF,#84C0FF)';
    progressBarInner.style.transition = 'width 360ms ease';
    barOuter.appendChild(progressBarInner);

    revealStat = document.createElement('div');
    revealStat.style.minWidth = '110px';
    revealStat.style.textAlign = 'right';
    revealStat.style.fontSize = '12px';
    revealStat.style.color = 'var(--muted)';

    progWrap.appendChild(barOuter);
    progWrap.appendChild(revealStat);
    hintContainer.appendChild(progWrap);

    // button row
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'center';
    btnRow.style.marginTop = '0px';

    revealBtn = document.createElement('button');
    revealBtn.type = 'button';
    revealBtn.textContent = 'Открыть букву';
    revealBtn.className = 'pushable';
    // minimal style tweak
    revealBtn.style.padding = '8px 12px';
    revealBtn.style.fontSize = '13px';
    revealBtn.style.minWidth = '160px';
    revealBtn.style.borderRadius = '10px';
    revealBtn.style.border = '1px solid rgba(255,255,255,0.04)';
    revealBtn.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))';
    btnRow.appendChild(revealBtn);

    hintContainer.appendChild(btnRow);

    // handler
    revealBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        requestRevealLetter();
    });
}

/* -------------------------
   Выбрать категорию + слово
   -------------------------*/
function pickCategoryAndFillPool(){
    const keys = Object.keys(CATEGORIES);
    const cat = keys[randInt(0, keys.length-1)];
    currentCategory = cat;
    DEFAULT_WORDS = CATEGORIES[cat].slice();
    wordPool = shuffle(DEFAULT_WORDS.slice());
}

/* -------------------------
   Выбрать новое секретное слово
   (обновляет UI подсказок)
   -------------------------*/
const pickNewSecret = ()=>{
    // если пула нет — заполняем
    if(!wordPool || wordPool.length === 0) {
        pickCategoryAndFillPool();
    }
    if(wordPool.length === 0){
        // fallback
        wordPool = ['мороз','лед'];
    }
    const idx = randInt(0, wordPool.length-1);
    const w = wordPool.splice(idx,1)[0].toLowerCase();
    currentSecret = w;
    if (wordLenSpan) wordLenSpan.textContent = w.length;

    // ensure hint UI exists
    ensureHintUI();

    // Reset hint state
    revealedIndices = Array(w.length).fill(false);
    revealedLettersSet.clear();
    wrongAttempts = 0;
    revealCount = 0;

    // calculate unique letters and limit
    const uniq = Array.from(new Set(w.split('')));
    maxReveals = Math.max(1, Math.floor(uniq.length / 2)); // можно изменить правило
    updateMaskDisplay();
    updateProgressUI();

    // update hint line with category + len
    if(hint){
        hint.innerHTML = `Категория: <strong>${currentCategory}</strong> — слово из <strong id="wordLen">${w.length}</strong> букв`;
    }
    return w;
};

/* -------------------------
   Подсказки: показ маски и прогресс
   -------------------------*/
function updateMaskDisplay(){
    if(!maskDisplay || !currentSecret) return;
    const chars = currentSecret.split('');
    const tokens = chars.map((ch,i)=> revealedIndices[i] ? ch : '•');
    // разделять пробелом чтобы было читабельно
    maskDisplay.textContent = tokens.join(' ');
}

function updateProgressUI(){
    if(!progressBarInner || !revealStat || !currentSecret) return;
    const totalUnique = Array.from(new Set(currentSecret.split(''))).length;
    const opened = revealedLettersSet.size;
    const percent = Math.round((opened / totalUnique) * 100);
    progressBarInner.style.width = `${percent}%`;
    revealStat.textContent = `Открыто ${opened} / ${totalUnique} букв`;
    // состояние кнопки
    if(revealBtn){
        if(opened >= Math.min(totalUnique, maxReveals)) {
            revealBtn.disabled = true;
            revealBtn.style.opacity = '0.6';
            revealBtn.textContent = `Подсказки исчерпаны`;
        } else if(revealCooldown){
            revealBtn.disabled = true;
            revealBtn.style.opacity = '0.6';
            revealBtn.textContent = `Ждите...`;
        } else {
            revealBtn.disabled = false;
            revealBtn.style.opacity = '1';
            revealBtn.textContent = `Открыть букву (${opened}/${Math.min(totalUnique, maxReveals)})`;
        }
    }
}

/* -------------------------
   Reveal logic (reveal all occurrences of random unrevealed letter)
   -------------------------*/
function revealRandomLetter(){
    if(!currentSecret) return;
    if(revealCooldown) return;
    const chars = currentSecret.split('');
    // compute set of unrevealed indices
    const candidateIndices = [];
    for(let i=0;i<chars.length;i++){
        if(!revealedIndices[i]) candidateIndices.push(i);
    }
    if(candidateIndices.length === 0) return; // nothing to reveal

    // pick a random index among unrevealed ones
    const pickIdx = candidateIndices[randInt(0, candidateIndices.length-1)];
    const letter = chars[pickIdx];

    // if letter already in revealedLettersSet (shouldn't happen because indices unrevealed),
    // try another index; otherwise proceed
    if(revealedLettersSet.has(letter)){
        // this means only duplicate positions left — still reveal those duplicates
    }

    // reveal all positions where this letter occurs
    let newlyRevealed = 0;
    for(let i=0;i<chars.length;i++){
        if(chars[i] === letter && !revealedIndices[i]){
            revealedIndices[i] = true;
            newlyRevealed++;
        }
    }

    // register letter as revealed
    const beforeSize = revealedLettersSet.size;
    revealedLettersSet.add(letter);
    if(revealedLettersSet.size > beforeSize) revealCount++;

    // play small sound and visual feedback
    playSuccess();
    // small snake flash
    flashSnakeSuccess(500);

    // cooldown and update UI
    revealCooldown = true;
    updateMaskDisplay();
    updateProgressUI();

    setTimeout(()=>{
        revealCooldown = false;
        updateProgressUI();
    }, REVEAL_COOLDOWN_MS);

    return newlyRevealed;
}

/* Request reveal with abuse checks and auto rules */
function requestRevealLetter(){
    if(!currentSecret) return;
    const totalUnique = Array.from(new Set(currentSecret.split(''))).length;
    // max reveals allowed (cap)
    const allowed = Math.min(totalUnique, maxReveals);

    if(revealedLettersSet.size >= allowed){
        // nothing allowed
        showFeedback('Уже всё открыто или лимит подсказок исчерпан.');
        return;
    }
    if(revealCooldown){
        showFeedback('Подождите немного перед следующей подсказкой.');
        return;
    }
    // perform reveal
    revealRandomLetter();
}

/* -------------------------
   Click handler (обновлён, включает авто-подсказку)
   -------------------------*/
btn.addEventListener('click', ()=>{
    const v = (input.value || '').trim().toLowerCase();
    if(!currentSecret){
        showFeedback('Сначала загрузите слово...');
        return;
    }
    if(v === currentSecret){
        playSuccess();
        showFeedback('Слово угадано!', true);
        input.value = '';
        // small celebration
        flashSnakeSuccess();
        flashGreenLines(900);

        // pick new secret after a short delay so user sees success
        setTimeout(()=> {
            pickCategoryAndFillPoolIfNeededAndPick();
        }, 450);
    } else {
        wrongAttempts++;
        flashRedLines(800);
        playError();
        showFeedback('Неверно — попробуйте снова');
        flashSnake();

        // авто-подсказка если пользователь промахнулся AUTO_REVEAL_AFTER раз
        if(wrongAttempts >= AUTO_REVEAL_AFTER){
            wrongAttempts = 0; // reset counter
            // reveal one letter (if allowed)
            if(revealedLettersSet.size < Math.min(Array.from(new Set(currentSecret.split(''))).length, maxReveals)){
                revealRandomLetter();
                showFeedback('Небольшая подсказка — открыта буква.');
            }
        }
    }
});

/* Enter key */
input.addEventListener('keydown',(ev)=>{
    if(ev.key==='Enter'){ ev.preventDefault(); btn.click(); }
});

/* -------------------------
   Вспомогательная функция: pick new category+word nicely
   -------------------------*/
function pickCategoryAndFillPoolIfNeededAndPick(){
    // если в пуле мало слов (<1), обновим категорию
    if(!wordPool || wordPool.length < 1) pickCategoryAndFillPool();
    pickNewSecret();
}

/* -------------------------
   Audio (unchanged)
   -------------------------*/
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }
function playSuccess(){ try{ ensureAudio(); const t=audioCtx.currentTime; const o1=audioCtx.createOscillator(), o2=audioCtx.createOscillator(), g=audioCtx.createGain(); o1.type='sine'; o2.type='triangle'; o1.frequency.setValueAtTime(660,t); o2.frequency.setValueAtTime(880,t); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.6); o1.connect(g); o2.connect(g); g.connect(audioCtx.destination); o1.start(t); o2.start(t); o1.stop(t+0.62); o2.stop(t+0.62);}catch(e){} }
function playError(){ try{ ensureAudio(); const t=audioCtx.currentTime; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='square'; o.frequency.setValueAtTime(240,t); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18); o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.22);}catch(e){} }

/* -------------------------
   Feedback (unchanged)
   -------------------------*/
function showFeedback(text,strong=false){
    if(!feedback) return;
    feedback.textContent=text;
    feedback.classList.add('show');
    feedback.style.color = strong?'var(--accent-strong)':'var(--accent)';
    setTimeout(()=>feedback.classList.remove('show'),2400);
}

/* -------------------------
   Snakes (SVG) - сборка (unchanged)
   -------------------------*/
function randomControlPoints(width,height,count=6){
    const pts=[];
    const step=width/(count-1);
    for(let i=0;i<count;i++){
        const x=i*step + Math.random()*step*0.24 - step*0.12;
        const y=Math.random()*(height-80)+40;
        pts.push({x,y});
    }
    return pts;
}
function ptsToPath(pts){
    if(!pts.length) return '';
    let d=`M ${pts[0].x} ${pts[0].y}`;
    for(let i=1;i<pts.length;i++){
        const p0=pts[i-1], p1=pts[i];
        const midX=(p0.x+p1.x)/2;
        d+=` Q ${p0.x+(midX-p0.x)*0.5} ${p0.y} ${midX} ${(p0.y+p1.y)/2}`;
        d+=` T ${p1.x} ${p1.y}`;
    }
    return d;
}
function buildSnakes(){
    if(!snakesGroup) return;
    snakesGroup.innerHTML='';
    snakePaths=[];
    const w=Math.max(1600,window.innerWidth);
    const h=Math.max(900,window.innerHeight);
    for(let i=0;i<7;i++){
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        const pts=randomControlPoints(w,h,randInt(5,9));
        const d=ptsToPath(pts);
        path.setAttribute('d',d);
        path.setAttribute('stroke-width',`${Math.random()*0.8+0.8}`);
        path.setAttribute('stroke-linecap','round');
        path.setAttribute('stroke-linejoin','round');
        path.setAttribute('stroke-dasharray','24 12');
        path.setAttribute('stroke-dashoffset',`${Math.random()*360}`);
        path.setAttribute('opacity','1');
        path.style.transition='stroke-dashoffset 0.05s linear, stroke 0.4s ease';
        snakesGroup.appendChild(path);
        snakePaths.push(path);
    }
}

/* -------------------------
   Animate snakes (unchanged)
   -------------------------*/
function animateSnakes(){
    if(!snakePaths || !snakePaths.length) return;
    snakePaths.forEach(path=>{
        let offset = parseFloat(path.getAttribute('stroke-dashoffset')) || 0;
        offset -= snakeSpeed;
        path.setAttribute('stroke-dashoffset', offset);
    });
    snakeSpeed += (snakeSpeedTarget - snakeSpeed) * 0.08;
    snakeAnimationFrame = requestAnimationFrame(animateSnakes);
}
function flashSnake(duration = 800){
    if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);
    snakePaths.forEach(path=>path.setAttribute('stroke','tomato'));
    snakeSpeedTarget = 3;
    snakeGlowTimeout = setTimeout(()=>{
        snakePaths.forEach(path=>path.setAttribute('stroke','url(#gLine)'));
        snakeSpeedTarget = 0.8;
    }, duration);
}
function flashSnakeSuccess(duration = 800){
    if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);
    snakePaths.forEach(path=>path.setAttribute('stroke','limegreen'));
    snakeSpeedTarget = 2.5;
    snakeGlowTimeout = setTimeout(()=>{
        snakePaths.forEach(path=>path.setAttribute('stroke','url(#gLine)'));
        snakeSpeedTarget = 0.8;
    }, duration);
}

/* -------------------------
   Particles (canvas) — оставил как было (адаптив/оптимизации)
   -------------------------*/
function resizeCanvas(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', () => {
    resizeCanvas();
    const prevMobile = isMobile;
    isMobile = window.innerWidth <= MOBILE_MAX_WIDTH || /Mobi|Android/i.test(navigator.userAgent);
    ACTIVE_PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
    ACTIVE_LINE_DISTANCE = isMobile ? LINE_DISTANCE_MOBILE : LINE_DISTANCE;
    LINE_ANIM_ENABLED = isMobile ? LINE_ANIM_ENABLED_MOBILE : true;
    FRAME_SKIP = isMobile ? FRAME_SKIP_MOBILE : 0;
    if(prevMobile !== isMobile){
        particles = [];
        for(let i=0;i<ACTIVE_PARTICLE_COUNT;i++) particles.push(createParticle());
        if(isMobile) document.body.classList.add('low-power'); else document.body.classList.remove('low-power');
    }
});
resizeCanvas();

function createParticle(success=false){
    const size = Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN;
    const lifeMin = isMobile ? PARTICLE_LIFE_MIN_MOBILE : PARTICLE_MAX_LIFE_MIN;
    const lifeMax = isMobile ? PARTICLE_LIFE_MAX_MOBILE : PARTICLE_MAX_LIFE_MAX;
    const maxLife = PARTICLE_LIFE_OVERRIDE ? PARTICLE_LIFE_OVERRIDE : (Math.random() * (lifeMax - lifeMin) + lifeMin);
    return {
        x: Math.random() * canvas.width,
        y: canvas.height,
        radius: success ? Math.max(2, size * 1.6) : size,
        color: success ? 'limegreen' : `rgba(88,166,255,${Math.random() * 0.45 + 0.28})`,
        speedY: (Math.random() * (PARTICLE_SPEED_Y_MAX - PARTICLE_SPEED_Y_MIN) + PARTICLE_SPEED_Y_MIN) * (success ? 1.6 : 1),
        speedX: (Math.random() - 0.5) * PARTICLE_SPEED_X_MAX,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * PARTICLE_ANGULAR_SPEED,
        life: 0,
        maxLife: Math.round(maxLife)
    };
}

ACTIVE_PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
particles = [];
for(let i=0;i<ACTIVE_PARTICLE_COUNT;i++) particles.push(createParticle());

function drawParticles(){
    if(FRAME_SKIP > 0){
        _frameCounter++;
        if(_frameCounter % (FRAME_SKIP + 1) !== 0){
            requestAnimationFrame(drawParticles);
            return;
        }
    }
    if(!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let i=0;i<particles.length;i++){
        for(let j=i+1;j<particles.length;j++){
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < ACTIVE_LINE_DISTANCE){
                const base = LINE_MERCY;
                const shimmer = LINE_ANIM_ENABLED ? (LINE_MERCY * Math.sin(Date.now() / 300 + (p1.x + p2.x)/50)) : 0;
                const alpha = base + shimmer;
                let color = LINE_BASE_COLOR;
                if(showRedLines) color = LINE_ERROR_COLOR;
                else if(showGreenLines) color = LINE_SUCCESS_COLOR;
                const opacityFactor = isMobile ? (0.06 * (1 - dist / ACTIVE_LINE_DISTANCE)) : (alpha * (1 - dist / ACTIVE_LINE_DISTANCE));
                ctx.strokeStyle = color + opacityFactor + ')';
                ctx.lineWidth = LINE_WIDTH;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    for(let i=0;i<particles.length;i++){
        const p = particles[i];
        p.x += p.speedX;
        p.y -= p.speedY;
        p.angle += p.angularSpeed;
        p.life++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0,0,p.radius,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
        if(p.life > p.maxLife){
            particles[i] = createParticle();
        }
    }
    requestAnimationFrame(drawParticles);
}

function flashRedLines(duration = 600){
    showRedLines = true;
    setTimeout(()=> { showRedLines = false; }, duration);
}
function flashGreenLines(duration = 800){
    showGreenLines = true;
    setTimeout(()=> { showGreenLines = false; }, duration);
}

/* -------------------------
   Инициализация (новая последовательность)
   -------------------------*/
pickCategoryAndFillPool();  // выберем категорию и заполним пул
pickNewSecret();
buildSnakes();
if(snakeAnimationFrame) cancelAnimationFrame(snakeAnimationFrame);
animateSnakes();
drawParticles();

/* очищаем таймеры/frames при уходе страницы (хорошая практика) */
window.addEventListener('beforeunload', () => {
    if(snakeAnimationFrame) cancelAnimationFrame(snakeAnimationFrame);
    if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);
});



// --- Site Panel (optimized toggle, focus + scroll lock) ---
const siteLauncherBtn = document.getElementById('siteLauncherBtn');
const sitePanel = document.getElementById('sitePanel');
const siteBackdrop = document.getElementById('siteBackdrop');
const openSiteBtns = document.querySelectorAll('.open-site-btn');

// store last focused element to restore focus on close
let lastFocusedEl = null;

function isPanelOpen(){
    return sitePanel && sitePanel.getAttribute('aria-hidden') === 'false';
}

function openPanel(){
    if(!sitePanel) return;
    lastFocusedEl = document.activeElement;
    sitePanel.setAttribute('aria-hidden','false');
    // lock scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // move focus to the first actionable element in panel
    const firstBtn = sitePanel.querySelector('.open-site-btn, .btn, a[href]');
    if(firstBtn) firstBtn.focus();
}

function closePanel(){
    if(!sitePanel) return;
    sitePanel.setAttribute('aria-hidden','true');
    // restore scroll
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    // restore focus
    try{ if(lastFocusedEl) lastFocusedEl.focus(); }catch(e){}
}

// toggle (launcher acts as open/close)
function togglePanel(){
    if(isPanelOpen()) closePanel(); else openPanel();
}

// handlers
siteLauncherBtn && siteLauncherBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    togglePanel();
});

// backdrop click closes
siteBackdrop && siteBackdrop.addEventListener('click', (e)=>{
    if(isPanelOpen()) closePanel();
});

// keyboard: Esc closes panel
document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && isPanelOpen()){
        e.preventDefault();
        closePanel();
    }
});

// open site in same tab (current behavior)
openSiteBtns.forEach(btn=>{
    btn.addEventListener('click', (e)=>{
        const url = btn.dataset.url;
        if(!url) return;
        // small UX improvement: close panel, then navigate so user sees transition
        closePanel();
        // slight delay to let close transition start (tweakable)
        setTimeout(()=> { window.location.href = url; }, 220);
    }, { passive: true });
});
