const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- UI Elements ---
const ui = {
    scoreEl: document.getElementById('scoreEl'),
    scoreBar: document.getElementById('scoreBar'),
    gameHUD: document.getElementById('gameHUD'),
    startModal: document.getElementById('startModal'),
    gameOverModal: document.getElementById('gameOverModal'),
    finalScoreEl: document.getElementById('finalScore'),
    highScoreDisplay: document.getElementById('highScoreDisplay'),
    gamesPlayedDisplay: document.getElementById('gamesPlayedDisplay'),
    startBtn: document.getElementById('startGameBtn'),
    restartBtn: document.getElementById('restartBtn'),
    abortBtn: document.getElementById('abortBtn'),
    backToMenuBtn: document.getElementById('backToMenuBtn'),
    consoleLines: document.getElementById('consoleLines'),
    shockwaveReadyBar: document.getElementById('shockwaveReadyBar')
};

// --- Config ---
const CONFIG = {
    colors: {
        primary: '#00f3ff',
        danger: '#ff003c',
        bgFade: 'rgba(3, 3, 4, 0.2)'
    },
    costs: { shockwave: 15 }
};

// --- State ---
let state = {
    animationId: null,
    score: 0,
    isActive: false, // Игра идет?
    particles: [],
    shockwaves: [],
    effects: [],
    spawnTimer: 0,
    mouse: { x: innerWidth / 2, y: innerHeight / 2 },
    highScore: parseInt(localStorage.getItem('neon_highScore')) || 0,
    gamesPlayed: parseInt(localStorage.getItem('neon_gamesPlayed')) || 0
};

// --- Helper: System Logger ---
const LOG_MESSAGES = [
    "System initializing...", "Loading core modules...", "Connecting to neural net...",
    "Optimizing graphics...", "Checking memory integrity...", "Synchronization complete.",
    "Waiting for user input...", "Core temperature: STABLE", "Threat level: ZERO"
];

class SystemLogger {
    constructor() {
        this.logIndex = 0;
        this.charIndex = 0;
        this.currentLine = "";
        this.typingSpeed = 30;
        this.timeout = null;
        this.startLog();
    }

    startLog() {
        this.typeNextLine();
    }

    typeNextLine() {
        if (!ui.consoleLines) return;

        const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
        const timestamp = new Date().toLocaleTimeString('en-US', {hour12: false});
        const fullText = `[${timestamp}] > ${msg}`;

        this.typeChar(fullText);
    }

    typeChar(text) {
        if (this.charIndex < text.length) {
            this.currentLine += text.charAt(this.charIndex);
            this.charIndex++;

            // Обновляем последнюю строку или добавляем новую
            let lines = ui.consoleLines.children;
            if (this.charIndex === 1) {
                const p = document.createElement('div');
                ui.consoleLines.appendChild(p);
                if (lines.length > 6) ui.consoleLines.removeChild(lines[0]);
            }
            lines[lines.length-1].innerText = this.currentLine;

            this.timeout = setTimeout(() => this.typeChar(text), Math.random() * 30 + 10);
        } else {
            this.charIndex = 0;
            this.currentLine = "";
            this.timeout = setTimeout(() => this.typeNextLine(), Math.random() * 2000 + 1000);
        }
    }
}
const sysLogger = new SystemLogger(); // Запуск логгера

// --- Resize ---
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
}
resize();
window.addEventListener('resize', resize);

window.addEventListener('mousemove', (e) => {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
});

// Управление способностью (ЛКМ)
window.addEventListener('mousedown', (e) => {
    // Не стреляем, если клик по кнопке интерфейса
    if (e.target.closest('button')) return;
    if (state.isActive) createShockwave();
});

// Кнопка Escape для выхода
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isActive) abortGame();
});

function updateMenuStats() {
    ui.highScoreDisplay.innerText = state.highScore + '%';
    ui.gamesPlayedDisplay.innerText = state.gamesPlayed;
}
updateMenuStats();

// --- Game Classes ---

class Player {
    constructor() {
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        this.radius = 12;
        this.history = [];
    }

    draw() {
        // Отрисовка хвоста
        for (let i = 0; i < this.history.length; i++) {
            ctx.beginPath();
            let ratio = i / this.history.length;
            ctx.arc(this.history[i].x, this.history[i].y, this.radius * ratio * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${ratio * 0.25})`;
            ctx.fill();
        }

        // Ядро
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = CONFIG.colors.primary;
        ctx.shadowBlur = 25;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update() {
        // Плавная интерполяция к мышке
        const dx = state.mouse.x - this.x;
        const dy = state.mouse.y - this.y;
        this.x += dx * 0.12;
        this.y += dy * 0.12;

        this.history.push({x: this.x, y: this.y});
        if (this.history.length > 15) this.history.shift();

        this.draw();
    }
}

class Particle {
    constructor(x, y, radius, color, velocity, type) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.targetRadius = radius;
        this.color = color;
        this.velocity = velocity;
        this.type = type; // 'enemy' or 'bonus'

        // Для волнового движения
        this.angleOffset = Math.random() * Math.PI * 2;
        this.oscillationSpeed = Math.random() * 0.05 + 0.02;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.radius), 0, Math.PI * 2);
        ctx.fillStyle = this.color;

        if (this.type === 'bonus') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
        } else {
            // У врагов легкий контур
            ctx.strokeStyle = 'rgba(255, 0, 60, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update(playerX, playerY) {
        if (this.radius < this.targetRadius) this.radius += 0.5;

        // 1. Базовое движение
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 2. Волновой эффект (Wobble)
        this.angleOffset += this.oscillationSpeed;
        const wobble = Math.sin(this.angleOffset) * 0.5;
        this.y += wobble;

        // 3. Магнетизм (только для бонусов)
        if (this.type === 'bonus') {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.hypot(dx, dy);

            // Если близко, притягиваемся
            if (dist < 200) {
                this.x += dx * 0.015;
                this.y += dy * 0.015;
            }
        }
        // 4. Легкое наведение для врагов на высокой сложности
        else if (this.type === 'enemy' && state.score > 50) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            this.x += dx * 0.002; // Очень слабое подруливание
            this.y += dy * 0.002;
        }

        this.draw();
    }
}

class Shockwave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.alpha = 1;
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 243, 255, ${this.alpha})`;
        ctx.lineWidth = 8;
        ctx.shadowColor = CONFIG.colors.primary;
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();
    }
    update() {
        this.radius += 15; // Быстрая волна
        this.alpha -= 0.05;
        this.draw();
    }
}

class Explosion {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.particles = [];
        for (let i=0; i<12; i++) {
            const ang = (Math.PI*2/12)*i;
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(ang)*4, vy: Math.sin(ang)*4,
                alpha: 1, life: Math.random()*0.05 + 0.02
            });
        }
    }
    update() {
        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            p.alpha -= p.life;
            if(p.alpha > 0) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }
}

// --- Logic ---

const player = new Player();

function createShockwave() {
    if (state.score >= CONFIG.costs.shockwave) {
        state.score -= CONFIG.costs.shockwave;
        updateUI();
        state.shockwaves.push(new Shockwave(player.x, player.y));
    }
}

function spawnParticles() {
    state.spawnTimer++;
    // Формула сложности: чем выше очки, тем чаще спавн
    const interval = Math.max(10, 45 - Math.floor(state.score / 25));

    if (state.spawnTimer % interval === 0) {
        const radius = Math.random() * 8 + 6;
        let x, y;

        // Спавн за пределами экрана
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -40 : window.innerWidth + 40;
            y = Math.random() * window.innerHeight;
        } else {
            x = Math.random() * window.innerWidth;
            y = Math.random() < 0.5 ? -40 : window.innerHeight + 40;
        }

        const isEnemy = Math.random() > 0.35; // 65% врагов
        const color = isEnemy ? CONFIG.colors.danger : CONFIG.colors.primary;
        const type = isEnemy ? 'enemy' : 'bonus';

        // Вектор скорости
        const angle = Math.atan2(window.innerHeight/2 - y, window.innerWidth/2 - x);
        const speed = (Math.random() * 2 + 2) + (state.score / 400);

        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        state.particles.push(new Particle(x, y, radius, color, velocity, type));
    }
}

function updateUI() {
    ui.scoreEl.innerText = state.score;
    const p = Math.min(state.score, 100);
    ui.scoreBar.style.width = `${p}%`;

    // Индикатор готовности способности (цвет + ширина)
    if (state.score < CONFIG.costs.shockwave) {
        ui.scoreBar.style.background = CONFIG.colors.danger;
        ui.scoreBar.style.boxShadow = `0 0 10px ${CONFIG.colors.danger}`;
        ui.shockwaveReadyBar.style.width = (state.score / CONFIG.costs.shockwave * 100) + '%';
        ui.shockwaveReadyBar.style.background = CONFIG.colors.danger;
    } else {
        ui.scoreBar.style.background = CONFIG.colors.primary;
        ui.scoreBar.style.boxShadow = `0 0 15px ${CONFIG.colors.primary}`;
        ui.shockwaveReadyBar.style.width = '100%';
        ui.shockwaveReadyBar.style.background = CONFIG.colors.primary;
    }
}

function stopGame(isGameOver) {
    state.isActive = false;
    document.body.classList.remove('game-running');
    ui.gameHUD.classList.add('hidden-ui');

    // Save Stats
    if (isGameOver) {
        state.gamesPlayed++;
        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('neon_highScore', state.highScore);
        }
        localStorage.setItem('neon_gamesPlayed', state.gamesPlayed);
        updateMenuStats();

        ui.finalScoreEl.innerText = state.score;
        ui.gameOverModal.classList.remove('hidden');
    } else {
        // Если это Abort, просто возвращаемся в меню
        returnToMenu();
    }
}

function returnToMenu() {
    ui.startModal.classList.remove('hidden');
    ui.gameOverModal.classList.add('hidden');
    ui.gameHUD.classList.add('hidden-ui');
    document.body.classList.remove('game-running');
    state.isActive = false;
    updateMenuStats();
}

function abortGame() {
    stopGame(false);
}

function animate() {
    state.animationId = requestAnimationFrame(animate);

    // 1. Очистка (оставляет шлейф)
    if (state.isActive) {
        ctx.fillStyle = CONFIG.colors.bgFade;
        ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio); // Коррекция для DPR
    } else {
        ctx.clearRect(0,0, canvas.width, canvas.height);
        return; // В меню canvas чистый, работает CSS фон
    }

    // 2. Игрок
    player.update();

    // 3. Ударные волны
    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
        let sw = state.shockwaves[i];
        sw.update();
        if (sw.alpha <= 0) {
            state.shockwaves.splice(i, 1);
        } else {
            // Толкаем частицы
            state.particles.forEach(p => {
                const dist = Math.hypot(sw.x - p.x, sw.y - p.y);
                if (dist < sw.radius + 40 && dist > sw.radius - 20) {
                    const ang = Math.atan2(p.y - sw.y, p.x - sw.x);
                    const force = 12 * sw.alpha; // Сильный толчок
                    p.velocity.x += Math.cos(ang) * force;
                    p.velocity.y += Math.sin(ang) * force;
                }
            });
        }
    }

    // 4. Частицы
    for (let i = state.particles.length - 1; i >= 0; i--) {
        let p = state.particles[i];
        p.update(player.x, player.y);

        // Удаление далеких
        if (p.x < -100 || p.x > window.innerWidth + 100 ||
            p.y < -100 || p.y > window.innerHeight + 100) {
            state.particles.splice(i, 1);
            continue;
        }

        // Коллизия с игроком
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist - p.radius - player.radius < 0) {
            // Эффект взрыва
            state.effects.push(new Explosion(p.x, p.y, p.color));

            if (p.type === 'enemy') {
                stopGame(true); // Game Over
            } else {
                state.score += 5;
                updateUI();
                state.particles.splice(i, 1);
            }
        }
    }

    // 5. Визуальные эффекты (взрывы)
    for (let i = state.effects.length - 1; i >= 0; i--) {
        state.effects[i].update();
        if (state.effects[i].particles[0].alpha <= 0) state.effects.splice(i, 1);
    }

    spawnParticles();
}

function initGame() {
    state.score = 0;
    state.particles = [];
    state.shockwaves = [];
    state.effects = [];
    state.isActive = true;

    player.x = window.innerWidth / 2;
    player.y = window.innerHeight / 2;
    player.history = [];

    ui.startModal.classList.add('hidden');
    ui.gameOverModal.classList.add('hidden');
    ui.gameHUD.classList.remove('hidden-ui');

    document.body.classList.add('game-running');
    updateUI();
    animate();
}

// Bindings
ui.startBtn.addEventListener('click', initGame);
ui.restartBtn.addEventListener('click', initGame);
ui.abortBtn.addEventListener('click', abortGame);
ui.backToMenuBtn.addEventListener('click', returnToMenu);