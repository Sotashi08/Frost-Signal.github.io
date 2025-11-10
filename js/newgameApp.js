/* Frost Punk TicTacToe PvP/PvC with Particles & Snakes */

const CONFIG={PARTICLES:{COUNT_DESKTOP:65,COUNT_MOBILE:30,SIZE_MIN:4,SIZE_MAX:6,SPEED_Y_MIN:0.3,SPEED_Y_MAX:1,SPEED_X_MAX:0.5,ANGULAR_SPEED:0.02,LIFE_MIN_DESKTOP:75,LIFE_MAX_DESKTOP:320,LIFE_MIN_MOBILE:60,LIFE_MAX_MOBILE:160,LIFE_OVERRIDE:null},LINES:{DISTANCE_DESKTOP:150,DISTANCE_MOBILE:70,WIDTH:1.9,COLOR_BASE:'rgba(88,166,255,',COLOR_ERROR:'rgba(255,50,50,',COLOR_SUCCESS:'rgba(0,255,0,',MERCY:0.08,ANIM_MOBILE:false},MOBILE_MAX_WIDTH:720,FRAME_SKIP_MOBILE:2,SNAKES:{COUNT:7,STROKE_WIDTH_MIN:0.8,STROKE_WIDTH_MAX:1.6}};

const boardWrap=document.getElementById('boardWrap');
const board=document.getElementById('board');
const winLine=document.getElementById('winLine');
const feedback=document.getElementById('feedback');
const scoreText=document.getElementById('score');
const resetBtn=document.getElementById('resetBtn');
const pvpBtn=document.getElementById('pvpBtn');
const pvcBtn=document.getElementById('pvcBtn');
const snakesGroup=document.getElementById('snakes');
const canvas=document.getElementById('pageParticles');
const ctx=canvas.getContext('2d');

let cells=[],currentPlayer='X',gameOver=false,scores={X:0,O:0},aiEnabled=false;
let isMobile=window.innerWidth<=CONFIG.MOBILE_MAX_WIDTH,particles=[],snakePaths=[],snakeAnimationFrame=null,snakeGlowTimeout=null;
let ACTIVE_PARTICLE_COUNT=isMobile?CONFIG.PARTICLES.COUNT_MOBILE:CONFIG.PARTICLES.COUNT_DESKTOP;
let ACTIVE_LINE_DISTANCE=isMobile?CONFIG.LINES.DISTANCE_MOBILE:CONFIG.LINES.DISTANCE_DESKTOP;
let LINE_ANIM_ENABLED=isMobile?CONFIG.LINES.ANIM_MOBILE:true;
let FRAME_SKIP=isMobile?CONFIG.FRAME_SKIP_MOBILE:0,_frameCounter=0;
let showRedLines=false,showGreenLines=false,snakeSpeed=0.8,snakeSpeedTarget=0.8;

/* ---------- BOARD ---------- */
function initBoard(){
    board.innerHTML='';cells=[];
    for(let i=0;i<9;i++){
        const div=document.createElement('div');
        div.className='cell';
        div.dataset.index=i;
        div.addEventListener('click',onCellClick);
        board.appendChild(div);
        cells.push(div);
    }
    winLine.innerHTML='';
    currentPlayer='X'; gameOver=false;
    feedback.textContent='';
}
function onCellClick(e){
    const idx=parseInt(e.target.dataset.index);
    if(gameOver||cells[idx].textContent) return;
    cells[idx].textContent=currentPlayer;
    if(checkWin()){
        scores[currentPlayer]++;
        scoreText.textContent=`Счет: X: ${scores.X} | O: ${scores.O}`;
        flashSnakeSuccess();
        showWinLine();
        gameOver=true;
        return;
    }
    if(cells.every(c=>c.textContent)){gameOver=true;feedback.textContent='Ничья!'; flashRedLines(); return;}
    currentPlayer=currentPlayer==='X'?'O':'X';
    if(aiEnabled&&!gameOver&&currentPlayer==='O') setTimeout(aiMove,300);
}

/* ---------- AI ---------- */
function aiMove(){
    // medium: случайный ход в свободные, но ищем выигрыш/блок
    let move=null;
    const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    // проверка выигрыша
    for(const w of wins){
        const vals=w.map(i=>cells[i].textContent);
        if(vals.filter(v=>'O'===v).length===2 && vals.includes('')){move=w[vals.indexOf('')]; break;}
        if(vals.filter(v=>'X'===v).length===2 && vals.includes('')){move=w[vals.indexOf('')]; break;}
    }
    if(move===null){const empty=cells.map((c,i)=>c.textContent===''?i:null).filter(v=>v!==null);move=empty[Math.floor(Math.random()*empty.length)];}
    if(move!==null) cells[move].click();
}

/* ---------- WIN CHECK ---------- */
function checkWin(){
    const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(const w of wins){
        if(cells[w[0]].textContent===currentPlayer&&cells[w[1]].textContent===currentPlayer&&cells[w[2]].textContent===currentPlayer){
            winLine.dataset.cells=w.join(','); return true;
        }
    }
    return false;
}
function showWinLine(){
    const idxs=winLine.dataset.cells.split(',').map(Number);
    const rects=idxs.map(i=>cells[i].getBoundingClientRect());
    const parentRect=boardWrap.getBoundingClientRect();
    const x1=(rects[0].left+rects[0].right)/2-parentRect.left;
    const y1=(rects[0].top+rects[0].bottom)/2-parentRect.top;
    const x2=(rects[2].left+rects[2].right)/2-parentRect.left;
    const y2=(rects[2].top+rects[2].bottom)/2-parentRect.top;
    winLine.innerHTML=`<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="limegreen" stroke-width="6"/>`;
    let line=winLine.querySelector('line'); let t=0; const steps=30;
    const anim=setInterval(()=>{t++; line.setAttribute('x2',x1+(x2-x1)*t/steps); line.setAttribute('y2',y1+(y2-y1)*t/steps); if(t>=steps) clearInterval(anim);},16);
}

/* ---------- MODE SWITCH ---------- */
pvpBtn.addEventListener('click',()=>{aiEnabled=false;pvpBtn.classList.add('active');pvcBtn.classList.remove('active');initBoard();});
pvcBtn.addEventListener('click',()=>{aiEnabled=true;pvpBtn.classList.remove('active');pvcBtn.classList.add('active');initBoard();});
resetBtn.addEventListener('click',initBoard);

/* ---------- SNAKES ---------- */
function randomControlPoints(w,h,count=6){const pts=[];const step=w/(count-1);for(let i=0;i<count;i++) pts.push({x:i*step+Math.random()*step*0.24-step*0.12,y:Math.random()*(h-80)+40});return pts;}
function ptsToPath(pts){let d=`M ${pts[0].x} ${pts[0].y}`;for(let i=1;i<pts.length;i++){const p0=pts[i-1],p1=pts[i];const midX=(p0.x+p1.x)/2; d+=` Q ${p0.x+(midX-p0.x)*0.5} ${p0.y} ${midX} ${(p0.y+p1.y)/2}`; d+=` T ${p1.x} ${p1.y}`;} return d;}
function buildSnakes(){if(!snakesGroup) return;snakesGroup.innerHTML='';snakePaths=[];const w=Math.max(1600,window.innerWidth);const h=Math.max(900,window.innerHeight);for(let i=0;i<CONFIG.SNAKES.COUNT;i++){const path=document.createElementNS('http://www.w3.org/2000/svg','path');const pts=randomControlPoints(w,h,Math.floor(Math.random()*4)+5);path.setAttribute('d',ptsToPath(pts));path.setAttribute('stroke-width',`${Math.random()*0.8+0.8}`);path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-dasharray','24 12');path.setAttribute('stroke-dashoffset',`${Math.random()*360}`);path.setAttribute('opacity','1');path.style.transition='stroke-dashoffset 0.05s linear, stroke 0.4s ease';snakesGroup.appendChild(path);snakePaths.push(path);}}
function animateSnakes(){if(!snakePaths.length) return;snakePaths.forEach(path=>{let offset=parseFloat(path.getAttribute('stroke-dashoffset'))||0;offset-=snakeSpeed;path.setAttribute('stroke-dashoffset',offset);});snakeSpeed+=(snakeSpeedTarget-snakeSpeed)*0.08;snakeAnimationFrame=requestAnimationFrame(animateSnakes);}
function flashSnake(duration=800){if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);snakePaths.forEach(p=>p.setAttribute('stroke','tomato'));snakeSpeedTarget=3;snakeGlowTimeout=setTimeout(()=>{snakePaths.forEach(p=>p.setAttribute('stroke','url(#gLine)'));snakeSpeedTarget=0.8;},duration);}
function flashSnakeSuccess(duration=800){if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);snakePaths.forEach(p=>p.setAttribute('stroke','limegreen'));snakeSpeedTarget=2.5;snakeGlowTimeout=setTimeout(()=>{snakePaths.forEach(p=>p.setAttribute('stroke','url(#gLine)'));snakeSpeedTarget=0.8;},duration);}

/* ---------- PARTICLES ---------- */
function resizeCanvas(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener('resize',()=>{resizeCanvas();const prevMobile=isMobile;isMobile=window.innerWidth<=CONFIG.MOBILE_MAX_WIDTH;ACTIVE_PARTICLE_COUNT=isMobile?CONFIG.PARTICLES.COUNT_MOBILE:CONFIG.PARTICLES.COUNT_DESKTOP;ACTIVE_LINE_DISTANCE=isMobile?CONFIG.LINES.DISTANCE_MOBILE:CONFIG.LINES.DISTANCE_DESKTOP;LINE_ANIM_ENABLED=isMobile?CONFIG.LINES.ANIM_MOBILE:true;FRAME_SKIP=isMobile?CONFIG.FRAME_SKIP_MOBILE:0;if(prevMobile!==isMobile){particles=[];for(let i=0;i<ACTIVE_PARTICLE_COUNT;i++) particles.push(createParticle()); if(isMobile) document.body.classList.add('low-power'); else document.body.classList.remove('low-power');}});
resizeCanvas();

function createParticle(success=false){const size=rand(CONFIG.PARTICLES.SIZE_MIN,CONFIG.PARTICLES.SIZE_MAX);const lifeMin=isMobile?CONFIG.PARTICLES.LIFE_MIN_MOBILE:CONFIG.PARTICLES.LIFE_MIN_DESKTOP;const lifeMax=isMobile?CONFIG.PARTICLES.LIFE_MAX_MOBILE:CONFIG.PARTICLES.LIFE_MAX_DESKTOP;const maxLife=CONFIG.PARTICLES.LIFE_OVERRIDE?CONFIG.PARTICLES.LIFE_OVERRIDE:Math.round(rand(lifeMin,lifeMax));return{x:Math.random()*canvas.width,y:canvas.height,radius:success?Math.max(2,size*1.6):size,color:success? 'limegreen':`rgba(88,166,255,${rand(0.28,0.73)})`,speedY:rand(CONFIG.PARTICLES.SPEED_Y_MIN,CONFIG.PARTICLES.SPEED_Y_MAX)*(success?1.6:1),speedX:(Math.random()-0.5)*CONFIG.PARTICLES.SPEED_X_MAX,angle:Math.random()*Math.PI*2,angularSpeed:(Math.random()-0.5)*CONFIG.PARTICLES.ANGULAR_SPEED,life:0,maxLife:maxLife};}
function drawParticles(){if(FRAME_SKIP>0){_frameCounter++;if(_frameCounter%(FRAME_SKIP+1)!==0){requestAnimationFrame(drawParticles);return;}}ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=0;i<particles.length;i++){const p=particles[i];p.x+=p.speedX;p.y-=p.speedY;p.angle+=p.angularSpeed;p.life++;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();ctx.restore();if(p.life>p.maxLife) particles[i]=createParticle();}
    for(let i=0;i<particles.length;i++){for(let j=i+1;j<particles.length;j++){const p1=particles[i],p2=particles[j],dx=p1.x-p2.x,dy=p1.y-p2.y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<ACTIVE_LINE_DISTANCE){const base=CONFIG.LINES.MERCY,shimmer=LINE_ANIM_ENABLED?CONFIG.LINES.MERCY*Math.sin(Date.now()/300+(p1.x+p2.x)/50):0,alpha=base+shimmer;let color=CONFIG.LINES.COLOR_BASE;if(showRedLines) color=CONFIG.LINES.COLOR_ERROR; else if(showGreenLines) color=CONFIG.LINES.COLOR_SUCCESS;const opacity=isMobile?0.06*(1-dist/ACTIVE_LINE_DISTANCE):alpha*(1-dist/ACTIVE_LINE_DISTANCE);ctx.strokeStyle=color+opacity+')';ctx.lineWidth=CONFIG.LINES.WIDTH;ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();}}}requestAnimationFrame(drawParticles);}
function flashRedLines(duration=600){showRedLines=true; setTimeout(()=>{showRedLines=false;},duration);}
function flashGreenLines(duration=800){showGreenLines=true; setTimeout(()=>{showGreenLines=false;},duration);}

/* ---------- UTILS ---------- */
function rand(a,b){return Math.random()*(b-a)+a;}


/* ---------- INIT ---------- */
initBoard();
buildSnakes();
animateSnakes();
for(let i=0;i<ACTIVE_PARTICLE_COUNT;i++) particles.push(createParticle());
drawParticles();

window.addEventListener('beforeunload',()=>{if(snakeAnimationFrame) cancelAnimationFrame(snakeAnimationFrame); if(snakeGlowTimeout) clearTimeout(snakeGlowTimeout);});

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
