// --- Preloader & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const loaderFill = document.getElementById('loaderFill');
    const loadPercent = document.getElementById('loadPercent');
    const statusText = document.querySelector('.loader-status');

    // Блокируем скролл в самом начале
    document.body.style.overflow = 'hidden';

    // Массив статусов для атмосферности
    const statuses = [
        "INITIALIZING SYSTEM...",
        "CONNECTING TO DATABASE...",
        "MOUNTING SPRING BEANS...",
        "OPTIMIZING JVM...",
        "STARTING VIRTUAL MACHINE...",
        "SYSTEM READY"
    ];

    let width = 0;

    const loadingInterval = setInterval(() => {
        // Рандомный шаг для имитации реальной работы системы
        const increment = Math.floor(Math.random() * 3) + 1;
        width += increment;

        if (width >= 100) {
            width = 100;
            clearInterval(loadingInterval);

            // Финальные действия при 100%
            loaderFill.style.width = '100%';
            loadPercent.innerText = '100%';
            statusText.innerText = statuses[statuses.length - 1];

            setTimeout(() => {
                // Добавляем класс для красивого исчезновения
                preloader.classList.add('fade-out');

                // Разблокируем скролл
                setTimeout(() => {
                    document.body.style.overflow = 'visible';
                    // Можно запустить анимации появления контента здесь
                }, 800);
            }, 500);
        } else {
            // Обновляем прогресс и текст статуса
            loaderFill.style.width = width + '%';
            loadPercent.innerText = width + '%';

            // Меняем текст статуса в зависимости от прогресса
            const statusIndex = Math.floor((width / 100) * (statuses.length - 1));
            statusText.innerHTML = `${statuses[statusIndex]} <span id="loadPercent">${width}%</span>`;
        }
    }, 40); // 40ms дает плавный ход (около 2.5 - 3 секунд на всю загрузку)
});

// --- Settings & Theme ---
const settingsToggle = document.querySelector('.settings-toggle');
const settingsPanel = document.querySelector('.settings-panel');
settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('open'));


function toggleSettings() {
    document.getElementById('settingsPanel').classList.toggle('open');
}

function setTheme(color) {
    document.documentElement.style.setProperty('--primary', color);

    // Вычисляем RGB для использования в тенях (необязательно, но добавит лоска)
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);

    localStorage.setItem('selectedColor', color);
}


const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

const options = {
    threshold: 0.6 // Секция считается активной, когда видна на 60%
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').substring(1) === entry.target.id) {
                    link.classList.add('active');
                }
            });
        }
    });
}, options);

sections.forEach(section => observer.observe(section));

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        const navHeight = document.querySelector('.navbar').offsetHeight;

        window.scrollTo({
            top: targetSection.offsetTop - navHeight,
            behavior: 'smooth'
        });

        // Закрыть мобильное меню если открыто
        document.querySelector('.mobile-menu-overlay').classList.remove('active');
        document.querySelector('.burger').classList.remove('toggle');
    });
});

// Проверка сохраненного цвета при загрузке
window.addEventListener('DOMContentLoaded', () => {
    const savedColor = localStorage.getItem('selectedColor');
    if (savedColor) setTheme(savedColor);
});


const observerOptions = {
    threshold: 0.2
};

const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.timeline-item').forEach(item => {
    timelineObserver.observe(item);
});

// --- Typing Effect ---
// --- Typing Effect ---
const words = ["Java", "Spring Boot", "Architecture", "Clean Code"];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingDelay = 100; // Скорость печати
const erasingDelay = 50;  // Скорость удаления
const newWordDelay = 2000; // Пауза перед удалением

function typeText() {
    const element = document.getElementById('typing-text');
    if (!element) return; // Защита от ошибок, если элемента нет на странице

    const currentWord = words[wordIndex];

    if (isDeleting) {
        // Удаление текста
        charIndex--;
        element.textContent = currentWord.substring(0, charIndex);
    } else {
        // Печать текста
        charIndex++;
        element.textContent = currentWord.substring(0, charIndex);
    }

    // Логика управления скоростью и состоянием
    let typeSpeed = isDeleting ? erasingDelay : typingDelay;

    if (!isDeleting && charIndex === currentWord.length) {
        // Слово напечатано полностью
        typeSpeed = newWordDelay;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        // Слово полностью стерто
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length; // Переход к следующему слову
        typeSpeed = 500;
    }

    setTimeout(typeText, typeSpeed);
}

// Запуск эффекта ПОСЛЕ того, как прелоадер исчезнет
// Найди в своем коде место, где прелоадеру добавляется класс 'fade-out'
// И вызови typeText() там. Или просто в конце DOMContentLoaded:
document.addEventListener('DOMContentLoaded', () => {
    // Если прелоадера нет или он скрыт сразу:
    setTimeout(typeText, 1000);
});

// --- Scroll Logic (Progress, Navbar, Reveal, BackToTop) ---
const navbar = document.querySelector('.navbar');
const progressBar = document.getElementById('progressBar');
const backToTopBtn = document.querySelector('.scroll-to-top');

window.addEventListener('scroll', () => {
    // Вычисляем процент прокрутки
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;

    // Обновляем линию в логотипе
    const logoProgress = document.getElementById('logoProgress');
    if (logoProgress) {
        logoProgress.style.width = scrolled + '%';
    }

    // Твой старый код для navbar sticky
    navbar.classList.toggle('sticky', window.scrollY > 50);
});

function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    const windowHeight = window.innerHeight;
    reveals.forEach(reveal => {
        const elementTop = reveal.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) reveal.classList.add('active');
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Mobile Menu ---
const burger = document.querySelector('.burger');
const mobileMenu = document.querySelector('.mobile-menu-overlay');
const mobileLinks = document.querySelectorAll('.mobile-links a');

burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    burger.classList.toggle('toggle');
});

// Закрытие меню при клике на ссылку
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        burger.classList.remove('toggle');
    });
});

// --- Contact Form Handling ---
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Остановить перезагрузку страницы

    const btn = contactForm.querySelector('.submit-btn');
    const originalText = btn.innerHTML;

    // Имитация загрузки
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0"></div>';

    setTimeout(() => {
        // Успех
        btn.classList.add('success');
        contactForm.reset();

        // Возврат кнопки через 3 секунды
        setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = originalText;
        }, 3000);
    }, 1500);
});

// --- Modal Logic ---
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');

const projects = {
    'proj1': {
        title: 'Game manager',
        content: '<p>Менеджер игр созданных мной через веб-архитектуры</p><ul style="margin-top:10px; color:#aaa; list-style-position: inside;"><li>HTML</li><li>CSS</li></ul> <a href="tictactoe.html">Перейти -></a>'
    },
    'proj2': {
        title: 'C++ Game Engine',
        content: '<p>Написан с использованием OpenGL и GLSL шейдеров. Реализована система частиц, загрузка моделей .obj и физика твердых тел.</p>'
    },
    'proj3': {
        title: 'Analytics Dashboard',
        content: '<p>Fullstack приложение. Backend на Python (FastAPI), Frontend на React. Визуализация графиков в реальном времени.</p>'
    }
};


function openModal(id) {
    const project = projects[id];
    if(!project) return;

    modalBody.innerHTML = `<h2>${project.title}</h2>${project.content}`;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Блокировка скролла страницы
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Разблокировка скролла
}

// --- Vanilla Tilt (Desktop Only) ---
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (!isMobile) {
    const tiltElements = document.querySelectorAll('[data-tilt]');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const elRect = el.getBoundingClientRect();
            const x = e.clientX - elRect.left;
            const y = e.clientY - elRect.top;
            const midX = elRect.width / 2;
            const midY = elRect.height / 2;
            const rotateX = ((y - midY) / midY) * -10;
            const rotateY = ((x - midX) / midX) * 10;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}


let docTitle = document.title;
let titleIndex = 0;
let isReversing = false;

function typewriterTitle() {
    const fullText = "I love Java ❤ ";
    if (!isReversing) {
        document.title = fullText.substring(0, titleIndex + 1);
        titleIndex++;
        if (titleIndex === fullText.length) {
            isReversing = true;
            setTimeout(typewriterTitle, 2000); // Пауза в конце
            return;
        }
    } else {
        document.title = fullText.substring(0, titleIndex - 1);
        titleIndex--;
        if (titleIndex === 0) {
            isReversing = false;
        }
    }
    setTimeout(typewriterTitle, isReversing ? 100 : 200);
}
typewriterTitle();