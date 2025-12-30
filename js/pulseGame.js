const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('scoreEl');
const startModal = document.getElementById('startModal');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreEl = document.getElementById('finalScore');
const startBtn = document.getElementById('startGameBtn');
const restartBtn = document.getElementById('restartBtn');

// Game State
let animationId;
let score = 0;
let gameActive = false;
let particles = [];
let enemies = [];
let spawnTimer = 0;

// Mouse Position (плавное движение игрока)
const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
const playerPos = { x: innerWidth / 2, y: innerHeight / 2 };

// Canvas Setup
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

// --- Classes ---

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
    }

    update() {
        // Linear Interpolation (Lerp) for smoothness
        // Игрок движется к мышке с задержкой, создавая ощущение плавности
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        this.x += dx * 0.1;
        this.y += dy * 0.1;

        this.draw();
    }
}

class Particle {
    constructor(x, y, radius, color, velocity, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.type = type; // 'bonus' (blue) or 'enemy' (red)
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}

// Эффект взрыва частиц при подборе
class EffectParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5
        };
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02; // Fade out
        this.draw();
    }
}

// --- Game Logic ---

const player = new Player(window.innerWidth / 2, window.innerHeight / 2, 15, 'white');
let effects = [];

function spawnParticles() {
    spawnTimer++;
    if (spawnTimer % 40 === 0) { // Каждые ~40 кадров
        const radius = Math.random() * (20 - 5) + 5;
        let x, y;

        // Спавн за пределами экрана
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = Math.random() > 0.3 ? '#ff0055' : '#00f3ff'; // Красных больше
        const type = color === '#ff0055' ? 'enemy' : 'bonus';

        // Вычисляем угол, чтобы частицы летели примерно в центр
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle) * (Math.random() * 2 + 1),
            y: Math.sin(angle) * (Math.random() * 2 + 1)
        };

        particles.push(new Particle(x, y, radius, color, velocity, type));
    }
}

function initGame() {
    score = 0;
    scoreEl.innerText = score;
    particles = [];
    effects = [];
    gameActive = true;
    startModal.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    animate();
}

function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    finalScoreEl.innerText = score;
    gameOverModal.classList.remove('hidden');
}

function animate() {
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);

    // Эффект шлейфа (вместо полной очистки экрана рисуем полупрозрачный прямоугольник)
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.update();

    // Обновление эффектов взрывов
    effects.forEach((effect, index) => {
        if (effect.alpha <= 0) {
            effects.splice(index, 1);
        } else {
            effect.update();
        }
    });

    // Частицы
    particles.forEach((particle, index) => {
        particle.update();

        // Удаление частиц за экраном (оптимизация)
        if (particle.x + particle.radius < 0 ||
            particle.x - particle.radius > canvas.width ||
            particle.y + particle.radius < 0 ||
            particle.y - particle.radius > canvas.height) {
            // Удаляем, только если они улетели ДАЛЕКО (чтобы не исчезали при спавне)
            // Здесь простая логика: удаляем если прошло достаточно времени (можно улучшить)
        }

        // Проверка столкновений
        const dist = Math.hypot(player.x - particle.x, player.y - particle.y);

        if (dist - particle.radius - player.radius < 1) {
            // Столкновение!

            // Создаем взрыв
            for (let i = 0; i < 8; i++) {
                effects.push(new EffectParticle(particle.x, particle.y, particle.color));
            }

            if (particle.type === 'enemy') {
                endGame();
            } else {
                score += 10; // +10% синхронизации
                scoreEl.innerText = score;
                particles.splice(index, 1);
            }
        }
    });

    spawnParticles();
}

// Event Listeners
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);