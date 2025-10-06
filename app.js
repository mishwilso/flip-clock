// ---------- helpers ----------
const $ = s => document.querySelector(s);

// Flip piece (MM or SS)
function FlipPiece(label, value){
  const el = document.createElement('span');
  el.className = 'flip-clock__piece';
  el.innerHTML = `
    <b class="flip-clock__card card-figure">
      <b class="card__top"></b>
      <b class="card__bottom"></b>
      <b class="card__back"><b class="card__bottom"></b></b>
    </b>
    
  `;
  const top = el.querySelector('.card__top');
  const bottom = el.querySelector('.card__bottom');
  const back = el.querySelector('.card__back');
  const backBottom = el.querySelector('.card__back .card__bottom');

  const two = n => ('0' + n).slice(-2);

  this.update = (val)=>{
    val = two(val);
    if (val !== this.currentValue){
      if (this.currentValue != null){
        back.setAttribute('data-value', this.currentValue);
        bottom.setAttribute('data-value', this.currentValue);
      }
      this.currentValue = val;
      top.textContent = this.currentValue;
      backBottom.setAttribute('data-value', this.currentValue);

      el.classList.remove('flip');
      void el.offsetWidth;   // restart animation
      el.classList.add('flip');
    }
  };

  this.el = el;
  this.update(value);
}

// Countdown (mm:ss only)
function FlipCountdown(onEnd){
  this.root = document.createElement('div');
  this.root.className = 'flip-clock';

  const mm = new FlipPiece('MIN', 0);
  const ss = new FlipPiece('SEC', 0);
  this.root.append(mm.el, ss.el);

  let total = 0;      // seconds remaining
  let tickId = null;
  let running = false;

  const render = () => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    mm.update(m);
    ss.update(s);
  };

  const tick = () => {
    if (!running) return;
    if (total <= 0){
      stop();
      onEnd && onEnd();
      return;
    }
    total -= 1;
    render();
  };

  const start = () => {
    if (running || total <= 0) return;
    running = true;
    tickId = setInterval(tick, 1000);
  };
  const pause = () => {
    running = false;
    if (tickId) clearInterval(tickId), (tickId=null);
  };
  const reset = (seconds) => {
    pause();
    total = Math.max(0, Math.min(seconds|0, 99*60 + 59));
    render();
  };
  const stop = () => { pause(); };

  // public
  this.set = reset;
  this.start = start;
  this.pause = pause;
  this.stop = stop;
  this.isRunning = () => running;
}

// ---------- init ----------
const clockHost = $('#clock');
const timer = new FlipCountdown();
clockHost.appendChild(timer.root);

// buttons
const startBtn = $('#startBtn');
const pauseBtn = $('#pauseBtn');
const resetBtn = $('#resetBtn');

startBtn.addEventListener('click', ()=>{
  if (!timer.isRunning()){
    // If digits show 00:00, initialize from current inputs
    if (timer.root.querySelector('.card__top').textContent === '00'){
      applyInputs();       // set from overlay values
    }
  }
  timer.start();
});
pauseBtn.addEventListener('click', ()=> timer.pause());
resetBtn.addEventListener('click', ()=> { timer.pause(); applyInputs(); });

// ---------- overlay (settings) ----------
const overlay = $('#overlay');
const gearBtn = $('#gearBtn');
const closeOverlay = $('#closeOverlay');
const applyBtn = $('#applyBtn');
const sheetResetBtn = $('#sheetResetBtn');

const minInput = $('#minInput');
const secInput = $('#secInput');
const preset = $('#preset');
const colorPick = $('#colorPick');
const digitPick = $('#digitPick');

gearBtn.addEventListener('click', ()=>{
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
});
closeOverlay.addEventListener('click', ()=>{
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
});

function clampInputs(){
  const m = Math.min(99, Math.max(0, parseInt(minInput.value || '0', 10)));
  const s = Math.min(59, Math.max(0, parseInt(secInput.value || '0', 10)));
  minInput.value = String(m);
  secInput.value = String(s).padStart(2,'0');
  return m*60 + s;
}
function applyInputs(){
  const seconds = clampInputs();
  timer.set(seconds);
}

// apply / reset in the sheet
applyBtn.addEventListener('click', ()=>{
  applyInputs();
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
});
sheetResetBtn.addEventListener('click', ()=> applyInputs());

// ---------- palettes & colors ----------
const PALETTES = {
  tangerine: { face:'#2b1e11', faceBottom:'#4a3a2a', digit:'#fffef8', top:'#ffd7a0' },
  juice:     { face:'#1f521fff', faceBottom:'#2d753cff', digit:'#c7f6ccff', top:'#48aa6eff' },
  indigo:    { face:'#1f1b3a', faceBottom:'#322b5e', digit:'#f1efff', top:'#b9b3ff' },
  mint:      { face:'#10332f', faceBottom:'#174a46', digit:'#eafff8', top:'#b8fff0' },
  tomato:    { face:'#2c0f0f', faceBottom:'#4a1a1a', digit:'#ffecec', top:'#ffb3b3' },
};

function toHex(color){
  if (color.startsWith('#')) return color.length===4
    ? '#'+[1,2,3].map(i=>color[i]+color[i]).join('')
    : color;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if(!m) return '#222222';
  const [r,g,b] = m.slice(1,4).map(n=>parseInt(n,10));
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function shade(hex, percent){
  let c = hex.replace('#',''); if (c.length===3) c = c.split('').map(x=>x+x).join('');
  const num = parseInt(c,16);
  let r=(num>>16)&255, g=(num>>8)&255, b=num&255;
  r = Math.min(255, Math.max(0, r + Math.round(255*percent/100)));
  g = Math.min(255, Math.max(0, g + Math.round(255*percent/100)));
  b = Math.min(255, Math.max(0, b + Math.round(255*percent/100)));
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function applyPalette(p){
  document.documentElement.style.setProperty('--flip-face', p.face);
  document.documentElement.style.setProperty('--flip-face-bottom', p.faceBottom);
  document.documentElement.style.setProperty('--flip-digit', p.digit);
  document.documentElement.style.setProperty('--flip-digit-top', p.top);
  colorPick.value = toHex(p.face);
  digitPick.value = toHex(p.digit);
}

preset.addEventListener('change', ()=>{
  const val = preset.value;
  if (val === 'custom') return;
  applyPalette(PALETTES[val] || PALETTES.tangerine);
});
colorPick.addEventListener('input', ()=>{
  const face = colorPick.value;
  document.documentElement.style.setProperty('--flip-face', face);
  document.documentElement.style.setProperty('--flip-face-bottom', shade(face, -14));
});
digitPick.addEventListener('input', ()=>{
  const digit = digitPick.value;
  document.documentElement.style.setProperty('--flip-digit', digit);
  document.documentElement.style.setProperty('--flip-digit-top', shade(digit, -30));
});

// defaults
applyPalette(PALETTES.tangerine);
// initialize digits from inputs (10:00 default)
applyInputs();
