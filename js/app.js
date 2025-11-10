/* app.js — обновлённая и слегка отрефакторенная версия
   Сохранена логика: змейки, партиклы, звуки, проверка слова, зелёный/красный flash.
   Добавлены: адаптивные константы, настройка времени жизни частиц (PARTICLE_LIFE_OVERRIDE),
   оптимизация рендера на мобильных (меньше частиц, статичные линии), безопасный resize.
*/

/* -------------------------
   Пользовательский словарь
   -------------------------*/
const DEFAULT_WORDS = ['мороз','лед'];
let wordPool = [...DEFAULT_WORDS];

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
   Аудио и состояние
   -------------------------*/
let audioCtx = null;
let currentSecret = null;
let snakePaths = [];
let snakeAnimationFrame = null;
let snakeGlowTimeout = null;
let snakeSpeed = 0.8;
let snakeSpeedTarget = 0.8;

/* -------------------------
   Adaptive / Particles config
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

/* константа для принудительного времени жизни (null = случайно в диапазоне) */
const PARTICLE_LIFE_OVERRIDE = null; // можно поставить число (в кадрах/итерациях) чтобы задать фиксированное время жизни

/* линии/эффекты */
const LINE_DISTANCE = 150;
const LINE_WIDTH = 1.9;
const LINE_BASE_COLOR = 'rgba(88,166,255,';  // синий
const LINE_ERROR_COLOR = 'rgba(255,50,50,';  // красный
const LINE_SUCCESS_COLOR = 'rgba(0,255,0,';  // зелёный
const LINE_MERCY = 0.08;

/* мобильные настройки */
const MOBILE_MAX_WIDTH = 720;
const PARTICLE_COUNT_MOBILE = 30;
const LINE_DISTANCE_MOBILE = 70;
const LINE_ANIM_ENABLED_MOBILE = false;
const PARTICLE_LIFE_MIN_MOBILE = 60;
const PARTICLE_LIFE_MAX_MOBILE = 160;
const FRAME_SKIP_MOBILE = 2; // обновлять не каждый кадр (для экономии)

/* состояние адаптива (изменится в resize) */
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

/* -------------------------
   Слово - выбор
   -------------------------*/
const pickNewSecret = ()=>{
    if(wordPool.length===0) wordPool=[...DEFAULT_WORDS];
    const idx = randInt(0, wordPool.length-1);
    const w = wordPool.splice(idx,1)[0];
    currentSecret = w;
    if (wordLenSpan) wordLenSpan.textContent = w.length;
    return w;
};

/* -------------------------
   Audio
   -------------------------*/
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }
function playSuccess(){ try{ ensureAudio(); const t=audioCtx.currentTime; const o1=audioCtx.createOscillator(), o2=audioCtx.createOscillator(), g=audioCtx.createGain(); o1.type='sine'; o2.type='triangle'; o1.frequency.setValueAtTime(660,t); o2.frequency.setValueAtTime(880,t); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.6); o1.connect(g); o2.connect(g); g.connect(audioCtx.destination); o1.start(t); o2.start(t); o1.stop(t+0.62); o2.stop(t+0.62);}catch(e){} }
function playError(){ try{ ensureAudio(); const t=audioCtx.currentTime; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='square'; o.frequency.setValueAtTime(240,t); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18); o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.22);}catch(e){} }

/* -------------------------
   Feedback
   -------------------------*/
function showFeedback(text,strong=false){
    if(!feedback) return;
    feedback.textContent = text;
    feedback.classList.add('show');
    feedback.style.color = strong ? 'var(--accent-strong)' : 'var(--accent)';
    setTimeout(()=> { feedback.classList.remove('show'); }, 2400);
}

/* -------------------------
   Click handler
   -------------------------*/
btn.addEventListener('click', ()=>{
    const v = (input.value || '').trim().toLowerCase();
    if(v === currentSecret){
        playSuccess();
        showFeedback('Слово угадано!', true);
        input.value = '';
        pickNewSecret();
        flashSnakeSuccess();
        flashGreenLines(900);
    } else {
        flashRedLines(800);
        playError();
        showFeedback('Неверно — попробуйте снова');
        flashSnake();
    }
});

/* Enter key */
input.addEventListener('keydown', (ev)=>{
    if(ev.key === 'Enter'){ ev.preventDefault(); btn.click(); }
});

/* -------------------------
   Snakes (SVG) - сборка
   -------------------------*/
function randomControlPoints(width,height,count=6){
    const pts = [];
    const step = width/(count-1);
    for(let i=0;i<count;i++){
        const x = i*step + Math.random()*step*0.24 - step*0.12;
        const y = Math.random()*(height-80)+40;
        pts.push({x,y});
    }
    return pts;
}
function ptsToPath(pts){
    if(!pts || !pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for(let i=1;i<pts.length;i++){
        const p0 = pts[i-1], p1 = pts[i];
        const midX = (p0.x + p1.x)/2;
        d += ` Q ${p0.x + (midX - p0.x)*0.5} ${p0.y} ${midX} ${(p0.y + p1.y)/2}`;
        d += ` T ${p1.x} ${p1.y}`;
    }
    return d;
}

function buildSnakes(){
    if(!snakesGroup) return;
    snakesGroup.innerHTML = '';
    snakePaths = [];
    const w = Math.max(1600, window.innerWidth);
    const h = Math.max(900, window.innerHeight);
    for(let i=0;i<7;i++){
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        const pts = randomControlPoints(w,h, randInt(5,9));
        const d = ptsToPath(pts);
        path.setAttribute('d', d);
        path.setAttribute('stroke-width', `${Math.random()*0.8 + 0.8}`);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-dasharray', '24 12');
        path.setAttribute('stroke-dashoffset', `${Math.random()*360}`);
        path.setAttribute('opacity', '1'); // корректное значение (раньше было '2')
        path.style.transition = 'stroke-dashoffset 0.05s linear, stroke 0.4s ease';
        snakesGroup.appendChild(path);
        snakePaths.push(path);
    }
}

/* -------------------------
   Animate snakes
   -------------------------*/
function animateSnakes(){
    if(!snakePaths || !snakePaths.length) return;
    snakePaths.forEach(path=>{
        let offset = parseFloat(path.getAttribute('stroke-dashoffset')) || 0;
        offset -= snakeSpeed;
        path.setAttribute('stroke-dashoffset', offset);
    });
    // плавно возвращаем скорость к цели
    snakeSpeed += (snakeSpeedTarget - snakeSpeed) * 0.08;
    snakeAnimationFrame = requestAnimationFrame(animateSnakes);
}

/* flash snake on error */
function flashSnake(duration = 800){
    if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);
    snakePaths.forEach(path => path.setAttribute('stroke','tomato'));
    snakeSpeedTarget = 3;
    snakeGlowTimeout = setTimeout(()=>{
        snakePaths.forEach(path => path.setAttribute('stroke','url(#gLine)'));
        snakeSpeedTarget = 0.8;
    }, duration);
}

/* flash snake on success */
function flashSnakeSuccess(duration = 800){
    if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);
    snakePaths.forEach(path => path.setAttribute('stroke','limegreen'));
    snakeSpeedTarget = 2.5;
    snakeGlowTimeout = setTimeout(()=>{
        snakePaths.forEach(path => path.setAttribute('stroke','url(#gLine)'));
        snakeSpeedTarget = 0.8;
    }, duration);
}

/* -------------------------
   Particles (canvas)
   -------------------------*/
function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => {
    resizeCanvas();

    // обновляем mobile-режим при ресайзе
    const prevMobile = isMobile;
    isMobile = window.innerWidth <= MOBILE_MAX_WIDTH || /Mobi|Android/i.test(navigator.userAgent);
    ACTIVE_PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
    ACTIVE_LINE_DISTANCE = isMobile ? LINE_DISTANCE_MOBILE : LINE_DISTANCE;
    LINE_ANIM_ENABLED = isMobile ? LINE_ANIM_ENABLED_MOBILE : true;
    FRAME_SKIP = isMobile ? FRAME_SKIP_MOBILE : 0;

    // если сменился режим (desktop <-> mobile), пересоздаём частицы, чтобы избежать эффектных багов
    if(prevMobile !== isMobile){
        particles = [];
        for(let i=0;i<ACTIVE_PARTICLE_COUNT;i++) particles.push(createParticle());
        // CSS hint
        if(isMobile) document.body.classList.add('low-power'); else document.body.classList.remove('low-power');
    }
});
resizeCanvas();

/* create particle — учитываем override времени жизни */
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

/* инициализация частиц (адаптивно) */
ACTIVE_PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
particles = [];
for(let i=0;i<ACTIVE_PARTICLE_COUNT;i++) particles.push(createParticle());

/* drawParticles с оптимизациями */
function drawParticles(){
    // frame skip для мобилок/слабых устройств
    if(FRAME_SKIP > 0){
        _frameCounter++;
        if(_frameCounter % (FRAME_SKIP + 1) !== 0){
            requestAnimationFrame(drawParticles);
            return;
        }
    }

    if(!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // линии между частицами
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

                // уменьшение яркости на мобилке
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

    // частицы
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
            // перезаписываем в том же индексе (не push/pop — стабильнее)
            particles[i] = createParticle();
        }
    }

    requestAnimationFrame(drawParticles);
}

/* вспышка линий (ошибка) */
function flashRedLines(duration = 600){
    showRedLines = true;
    setTimeout(()=> { showRedLines = false; }, duration);
}

/* вспышка линий (успех) */
function flashGreenLines(duration = 800){
    showGreenLines = true;
    setTimeout(()=> { showGreenLines = false; }, duration);
}

/* -------------------------
   Инициализация
   -------------------------*/
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


// --- Site Panel ---
const siteLauncherBtn = document.getElementById('siteLauncherBtn');
const sitePanel = document.getElementById('sitePanel');
const siteBackdrop = document.getElementById('siteBackdrop');
const openSiteBtns = document.querySelectorAll('.open-site-btn');

function togglePanel() {
    const isHidden = sitePanel.getAttribute('aria-hidden') === 'true';
    sitePanel.setAttribute('aria-hidden', !isHidden);
}

// --- Event Listeners ---
siteLauncherBtn.addEventListener('click', togglePanel);
siteBackdrop.addEventListener('click', togglePanel);

// --- Open sites in new window ---
openSiteBtns.forEach(btn=>{
    btn.addEventListener('click', (e)=>{
        const url = btn.dataset.url;
        if(url) window.open(url,'_blank');
    });
});

// --- Keyboard Esc to close ---
document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && sitePanel.getAttribute('aria-hidden')==='false'){
        sitePanel.setAttribute('aria-hidden','true');
    }
});
