const DEFAULT_WORDS = ['мороз','лед'];
let wordPool = [...DEFAULT_WORDS];

const btn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const input = document.getElementById('secretInput');
const feedback = document.getElementById('feedback');
const hint = document.getElementById('hint');
const snakesGroup = document.getElementById('snakes');
const wordLenSpan = document.getElementById('wordLen');

let audioCtx = null;
let currentSecret = null;
let snakePaths = [];
let snakeAnimationInterval = null;

let snakeSpeed = 0.8;      // базовая скорость смещения
let snakeSpeedTarget = 0.8; // текущая цель скорости
let snakeGlowTimeout = null;

// ---- helpers ----
const randInt = (a,b)=>Math.floor(Math.random()*(b-a+1)+a);
const pickNewSecret = ()=>{
    if(wordPool.length===0) wordPool=[...DEFAULT_WORDS];
    const idx = randInt(0, wordPool.length-1);
    const w = wordPool.splice(idx,1)[0];
    currentSecret = w;
    wordLenSpan.textContent = w.length;
    return w;
};

// ---- audio ----
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }
function playSuccess(){ try{ ensureAudio(); const t=audioCtx.currentTime; const o1=audioCtx.createOscillator(), o2=audioCtx.createOscillator(), g=audioCtx.createGain(); o1.type='sine'; o2.type='triangle'; o1.frequency.setValueAtTime(660,t); o2.frequency.setValueAtTime(880,t); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.6); o1.connect(g); o2.connect(g); g.connect(audioCtx.destination); o1.start(t); o2.start(t); o1.stop(t+0.62); o2.stop(t+0.62);}catch(e){} }
function playError(){ try{ ensureAudio(); const t=audioCtx.currentTime; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='square'; o.frequency.setValueAtTime(240,t); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18); o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.22);}catch(e){} }

// ---- feedback ----
function showFeedback(text,strong=false){
    feedback.textContent=text;
    feedback.classList.add('show');
    feedback.style.color = strong?'var(--accent-strong)':'var(--accent)';
    setTimeout(()=>feedback.classList.remove('show'),2400);
}

// ---- click handler ----
btn.addEventListener('click',()=>{
    const v=input.value.trim().toLowerCase();
    if(v === currentSecret){
        playSuccess();
        showFeedback('Слово угадано!', true);
        input.value='';
        pickNewSecret();
        flashSnakeSuccess(); // зелёное свечение змейки
        flashGreenLines() // вспышка футера
    } else {
        flashRedLines()
        playError();
        showFeedback('Неверно — попробуйте снова');
        flashSnake();
    }
});

// Enter key
input.addEventListener('keydown',(ev)=>{
    if(ev.key==='Enter'){ ev.preventDefault(); btn.click(); }
});

// ---- snakes ----
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
    snakesGroup.innerHTML='';
    const w=Math.max(1600,window.innerWidth);
    const h=Math.max(900,window.innerHeight);
    snakePaths=[];
    for(let i=0;i<7;i++){
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        const pts=randomControlPoints(w,h,randInt(5,9));
        const d=ptsToPath(pts);
        path.setAttribute('d',d);
        path.setAttribute('stroke-width',`${Math.random()*0.8+0.8}`);
        path.setAttribute('stroke-linecap','round');
        path.setAttribute('stroke-linejoin','round');
        path.setAttribute('stroke-dasharray','24 12'); // длинные полоски, меньше промежутка
        path.setAttribute('stroke-dashoffset',`${Math.random()*360}`);
        path.setAttribute('opacity','2'); // чуть светлее и ярче
        path.style.transition='stroke-dashoffset 0.05s linear, stroke 0.4s ease';
        snakesGroup.appendChild(path);
        snakePaths.push(path);
    }
}

// ---- animate snakes ----
function animateSnakes(){
    snakePaths.forEach(path=>{
        let offset = parseFloat(path.getAttribute('stroke-dashoffset'));
        offset -= snakeSpeed; // используем текущую скорость
        path.setAttribute('stroke-dashoffset', offset);
    });

    // плавно возвращаем скорость к норме
    snakeSpeed += (snakeSpeedTarget - snakeSpeed) * 0.08;

    requestAnimationFrame(animateSnakes);
}

// ---- flash snake on error ----
// при ошибке
function flashSnake(){
    snakeGlowTimeout && clearTimeout(snakeGlowTimeout);
    snakePaths.forEach(path=>{
        path.setAttribute('stroke','tomato');
    });
    snakeSpeedTarget = 3; // ускоряем
    snakeGlowTimeout = setTimeout(()=>{
        snakePaths.forEach(path=>{
            path.setAttribute('stroke','url(#gLine)');
        });
        snakeSpeedTarget = 0.8; // возвращаем норму
    }, 800);
}

// при успехе
function flashSnakeSuccess(){
    snakeGlowTimeout && clearTimeout(snakeGlowTimeout);
    snakePaths.forEach(path=>{
        path.setAttribute('stroke','limegreen');
    });
    snakeSpeedTarget = 2.5; // ускоряем
    snakeGlowTimeout = setTimeout(()=>{
        snakePaths.forEach(path=>{
            path.setAttribute('stroke','url(#gLine)');
        });
        snakeSpeedTarget = 0.8; // возвращаем норму
    }, 800);
}

// footer particles
const PARTICLE_COUNT = 90;
const PARTICLE_SIZE_MIN = 5;
const PARTICLE_SIZE_MAX = 7;
const PARTICLE_SPEED_Y_MIN = 0.3;
const PARTICLE_SPEED_Y_MAX = 1;
const PARTICLE_SPEED_X_MAX = 0.5;
const PARTICLE_ANGULAR_SPEED = 0.02;
const PARTICLE_MAX_LIFE_MIN = 80;
const PARTICLE_MAX_LIFE_MAX = 400;

// --- Настройки линий ---
const LINE_DISTANCE = 100;
const LINE_WIDTH = 1.9;
const LINE_BASE_COLOR = 'rgba(88,166,255,';  // синий
const LINE_ERROR_COLOR = 'rgba(255,50,50,';  // красный
const LINE_SUCCESS_COLOR = 'rgba(0,255,0,';  // зелёный
const LINE_MERCY = 0.08;

// --- Canvas ---
const canvas = document.getElementById('pageParticles');
const ctx = canvas.getContext('2d');
let particles = [];
let showRedLines = false;
let showGreenLines = false; // для правильного ответа

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Создание одной частицы ---
function createParticle() {
    return {
        x: Math.random() * canvas.width,
        y: canvas.height,
        radius: Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN,
        color: `rgba(88,166,255,${Math.random() * 0.5 + 0.3})`,
        speedY: Math.random() * (PARTICLE_SPEED_Y_MAX - PARTICLE_SPEED_Y_MIN) + PARTICLE_SPEED_Y_MIN,
        speedX: (Math.random() - 0.5) * PARTICLE_SPEED_X_MAX,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * PARTICLE_ANGULAR_SPEED,
        life: 0,
        maxLife: Math.random() * (PARTICLE_MAX_LIFE_MAX - PARTICLE_MAX_LIFE_MIN) + PARTICLE_MAX_LIFE_MIN
    };
}

// --- Инициализация ---
for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
}

// --- Рендер частиц и линий ---
function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < LINE_DISTANCE) {
                const alpha = LINE_MERCY + LINE_MERCY * Math.sin(Date.now() / 300 + (p1.x + p2.x)/50);

                // Выбор цвета линии
                let color = LINE_BASE_COLOR;
                if (showRedLines) color = LINE_ERROR_COLOR;
                else if (showGreenLines) color = LINE_SUCCESS_COLOR;

                ctx.strokeStyle = color + alpha + ')';
                ctx.lineWidth = LINE_WIDTH;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    // Рендер самих частиц
    particles.forEach(p => {
        p.x += p.speedX;
        p.y -= p.speedY;
        p.angle += p.angularSpeed;
        p.life++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life > p.maxLife) {
            Object.assign(p, createParticle());
        }
    });

    requestAnimationFrame(drawParticles);
}

drawParticles();

// --- Красный эффект при неверном вводе ---
function flashRedLines(duration = 600) {
    showRedLines = true;
    setTimeout(() => showRedLines = false, duration);
}

// --- Зелёный эффект при правильном вводе ---
function flashGreenLines(duration = 800) {
    showGreenLines = true;
    setTimeout(() => showGreenLines = false, duration);
}



// ---- init ----
pickNewSecret();
buildSnakes();
animateSnakes();
window.addEventListener('resize',()=>{ buildSnakes(); });
