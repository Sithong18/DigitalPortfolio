/* ════════════════════════════════════════════════════════════
   SITHONG // ALIEN HUD — MAIN.JS
   Extraterrestrial consciousness interface
   ════════════════════════════════════════════════════════════ */
'use strict';

/* ── Device ───────────────────────────────────────────────── */
const IS_TOUCH   = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
const IS_REDUCED = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ── vh fix ───────────────────────────────────────────────── */
function setVH() { document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px'); }
setVH();
window.addEventListener('resize', setVH, { passive: true });

/* ── Safe get ────────────────────────────────────────────── */
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ════════════════════════════════════════════════════════════
   BOOT SEQUENCE
   ════════════════════════════════════════════════════════════ */
function initBoot() {
  const boot    = $('bootScreen');
  const bar     = $('bootBar');
  const pctEl   = $('bootPct');
  const canvas  = $('bootCanvas');
  const hud     = $('hud');
  const lines   = $$('.boot-line');
  if (!boot || !hud) { hud && hud.classList.replace('hud-hidden', 'hud-visible'); return; }

  /* Particle grid on boot canvas */
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  let pts = [], bootRaf;

  if (!IS_REDUCED) {
    const N = IS_TOUCH ? 40 : 120;
    for (let i = 0; i < N; i++) pts.push({
      x: Math.random()*W, y: Math.random()*H,
      vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3,
      r: Math.random()*1.2+0.3, a:Math.random()*0.3+0.05,
    });
    function loop() {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W)p.vx*=-1;
        if(p.y<0||p.y>H)p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,255,204,${p.a})`; ctx.fill();
      });
      bootRaf = requestAnimationFrame(loop);
    }
    loop();
  }

  /* Reveal boot lines */
  lines.forEach((l, i) => {
    const delay = +l.dataset.delay || 0;
    setTimeout(() => l.style.animationDelay = '0s', delay);
    l.style.animation = `bootLineIn 0.3s ${delay}ms both`;
  });

  /* Progress bar */
  let prog = 0;
  return new Promise(resolve => {
    if (IS_REDUCED) { done(); resolve(); return; }
    const iv = setInterval(() => {
      prog = Math.min(prog + Math.random()*5+2, 100);
      bar.style.width = prog + '%';
      pctEl.textContent = Math.floor(prog) + '%';
      if (prog >= 100) {
        clearInterval(iv);
        bar.style.width = '100%'; pctEl.textContent = '100%';
        setTimeout(() => { cancelAnimationFrame(bootRaf); done(); resolve(); }, 600);
      }
    }, 50);
  });

  function done() {
    boot.classList.add('boot-done');
    setTimeout(() => { boot.style.display = 'none'; }, 800);
    hud.classList.remove('hud-hidden');
    hud.classList.add('hud-visible');
  }
}

/* ════════════════════════════════════════════════════════════
   BOOT: skip on click/keypress after 1.5s
   ════════════════════════════════════════════════════════════ */
let bootResolved = false;
function skipBoot() {
  if (bootResolved) return;
  bootResolved = true;
  const boot = $('bootScreen');
  const hud  = $('hud');
  if (boot) { boot.classList.add('boot-done'); setTimeout(()=>boot.style.display='none',800); }
  if (hud) { hud.classList.remove('hud-hidden'); hud.classList.add('hud-visible'); }
  initAll();
}
setTimeout(() => {
  document.addEventListener('keydown', skipBoot, { once: true });
  document.addEventListener('click',   skipBoot, { once: true });
  document.addEventListener('touchend',skipBoot, { once: true });
}, 1500);

/* ════════════════════════════════════════════════════════════
   CURSOR
   ════════════════════════════════════════════════════════════ */
function initCursor() {
  const el    = $('cursor');
  const label = $('curLabel');
  if (!el || IS_TOUCH) { if(el)el.style.display='none'; document.body.style.cursor='auto'; return; }

  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });

  function tick() {
    cx += (mx-cx)*0.15; cy += (my-cy)*0.15;
    el.style.transform = `translate(${cx-30}px,${cy-30}px)`;
    requestAnimationFrame(tick);
  }
  tick();

  function setHover(on, text='') {
    el.classList.toggle('cur-hover', on);
    if(label){ label.textContent=text; }
  }

  $$('a,button,.module-card,.mission-card,.svc-card,.sk-tab,.wf,.mob-item,.cs-link').forEach(node => {
    const txt = node.dataset.curLabel || (node.tagName==='A'?'OPEN':'INTERACT');
    node.addEventListener('mouseenter', () => setHover(true, txt));
    node.addEventListener('mouseleave', () => setHover(false));
  });
}

/* ════════════════════════════════════════════════════════════
   HERO CANVAS — neural lattice
   ════════════════════════════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = $('heroCanvas');
  if (!canvas || IS_REDUCED) return;
  const ctx = canvas.getContext('2d');
  let W,H,pts=[];
  const mouse = {x:-9999,y:-9999};

  class Node {
    constructor() { this.reset(true); }
    reset(init=false) {
      this.x  = Math.random()*W;
      this.y  = init ? Math.random()*H : -10;
      this.vx = (Math.random()-0.5)*0.4;
      this.vy = Math.random()*0.3+0.05;
      this.r  = Math.random()*1.5+0.2;
      this.a  = Math.random()*0.4+0.05;
    }
    update() {
      const dx=this.x-mouse.x, dy=this.y-mouse.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){this.vx+=dx/d*0.6;this.vy+=dy/d*0.6;}
      this.vx*=0.97; this.vy*=0.97;
      this.x+=this.vx; this.y+=this.vy;
      if(this.y>H+10) this.reset();
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,255,204,${this.a})`; ctx.fill();
    }
  }

  function init() {
    const section = canvas.parentElement;
    W = canvas.width  = section ? section.offsetWidth  : window.innerWidth;
    H = canvas.height = section ? section.offsetHeight : window.innerHeight;
    pts=[]; const N=IS_TOUCH?25:80;
    for(let i=0;i<N;i++) pts.push(new Node());
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<pts.length;i++){
      pts[i].update(); pts[i].draw();
      for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){
          ctx.beginPath();
          ctx.strokeStyle=`rgba(0,255,204,${0.1*(1-d/120)})`;
          ctx.lineWidth=0.5;
          ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  const hero = $('hero');
  if(!IS_TOUCH && hero){
    hero.addEventListener('mousemove',e=>{const r=hero.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;});
    hero.addEventListener('mouseleave',()=>{mouse.x=-9999;mouse.y=-9999;});
  }
  window.addEventListener('resize',init,{passive:true});
  init(); draw();
}

/* ════════════════════════════════════════════════════════════
   TYPED TEXT
   ════════════════════════════════════════════════════════════ */
function initTyped() {
  const el = $('bioTyped');
  if (!el) return;
  const phrases = ['Building impossible UIs.','Engineering the future.','Shipping at light speed.','Crafting digital worlds.','Open for collaboration.'];
  let idx=0,ci=0,del=false;
  function tick() {
    const phrase=phrases[idx];
    el.textContent = del ? phrase.slice(0,ci-1) : phrase.slice(0,ci+1);
    if(!del){ci++;if(ci>phrase.length){del=true;setTimeout(tick,2000);return;}}
    else{ci--;if(ci<0){del=false;idx=(idx+1)%phrases.length;setTimeout(tick,400);return;}}
    setTimeout(tick,del?45:85);
  }
  setTimeout(tick,1000);
}

/* ════════════════════════════════════════════════════════════
   CLOCK
   ════════════════════════════════════════════════════════════ */
function initClock() {
  const el = $('tbClock');
  if(!el) return;
  function update() {
    const n=new Date();
    el.textContent=[n.getHours(),n.getMinutes(),n.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':');
  }
  update(); setInterval(update,1000);
}

/* ════════════════════════════════════════════════════════════
   FPS MONITOR
   ════════════════════════════════════════════════════════════ */
function initFPS() {
  const el = $('spFps');
  if(!el) return;
  let last=performance.now(), frames=0;
  function loop(now) {
    frames++;
    if(now-last>=1000){ el.textContent=frames; frames=0; last=now; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ════════════════════════════════════════════════════════════
   SIDE PANEL GLITCH
   ════════════════════════════════════════════════════════════ */
function initSidePanelAnim() {
  const pwr = $('spPwr');
  const mem = $('spMem');
  if (!pwr||!mem) return;
  const bars = ['▓▓▓▓','▓▓▓▒','▓▓▒░','▓▒░░','▒░░░'];
  let ti=0;
  setInterval(()=>{
    pwr.textContent = (88+Math.floor(Math.random()*12))+'%';
    mem.textContent = bars[Math.floor(Math.random()*bars.length)];
    ti=(ti+1)%bars.length;
  },2000);
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION
   ════════════════════════════════════════════════════════════ */
function initNav() {
  const menuBtn  = $('tbMenu');
  const mobNav   = $('mobNav');
  const overlay  = $('mobOverlay');
  const closeBtn = $('mobClose');
  const scrollFl = $('scrollFill');
  const backTop  = $('backTop');

  function openMenu()  { mobNav&&mobNav.classList.add('open');    overlay&&overlay.classList.add('open');    menuBtn&&menuBtn.classList.add('open'); }
  function closeMenu() { mobNav&&mobNav.classList.remove('open'); overlay&&overlay.classList.remove('open'); menuBtn&&menuBtn.classList.remove('open'); }

  menuBtn  && menuBtn.addEventListener('click',  () => mobNav&&mobNav.classList.contains('open') ? closeMenu() : openMenu());
  overlay  && overlay.addEventListener('click',  closeMenu);
  closeBtn && closeBtn.addEventListener('click', closeMenu);
  $$('.mob-item').forEach(a => a.addEventListener('click', closeMenu));

  /* Swipe to close */
  let _tx=0;
  mobNav && mobNav.addEventListener('touchstart',e=>{_tx=e.touches[0].clientX;},{passive:true});
  mobNav && mobNav.addEventListener('touchend',  e=>{if(e.changedTouches[0].clientX-_tx>60)closeMenu();},{passive:true});

  /* Scroll effects */
  let ticking=false;
  window.addEventListener('scroll',()=>{
    if(!ticking){ requestAnimationFrame(()=>{ onScroll(); ticking=false; }); ticking=true; }
  },{passive:true});

  function onScroll() {
    const st  = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if(scrollFl) scrollFl.style.height = (max>0 ? st/max*100 : 0)+'%';
    if(backTop)  backTop.classList.toggle('show', st>600);

    /* Active nav link */
    const sections = $$('section[id]');
    let current='';
    sections.forEach(s=>{
      if(st >= s.offsetTop - 100) current=s.id;
    });
    $$('.tb-link,.mob-item').forEach(a=>{
      a.classList.toggle('active', a.dataset.sec===current);
    });
  }

  /* Smooth scroll */
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const href=a.getAttribute('href');
      const target=href&&href!=='#'?document.querySelector(href):null;
      if(!target)return;
      e.preventDefault();
      const off=($('hud-topbar')||document.querySelector('.hud-topbar'))?.offsetHeight||52;
      window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY-off,behavior:'smooth'});
    });
  });

  backTop && backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

/* ════════════════════════════════════════════════════════════
   REVEAL ON SCROLL
   ════════════════════════════════════════════════════════════ */
function initReveal() {
  const els = $$('.reveal');
  if(!els.length) return;
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const el  = entry.target;
      const del = parseFloat(el.dataset.delay||0)*1000;
      setTimeout(()=>{
        el.classList.add('visible');
        /* Animate vital bars */
        el.querySelectorAll('.v-fill').forEach(b=>{ if(b.dataset.w) b.style.width=b.dataset.w+'%'; });
        /* Animate module fill bars */
        el.querySelectorAll('.mc-fill').forEach(b=>{ if(b.dataset.w) b.style.width=b.dataset.w+'%'; });
      },del);
      io.unobserve(el);
    });
  },{threshold:0.12,rootMargin:'0px 0px -30px 0px'});
  els.forEach(el=>io.observe(el));
}

/* ════════════════════════════════════════════════════════════
   MODULE FILL BARS (active tab trigger)
   ════════════════════════════════════════════════════════════ */
function animateModuleBars(panel) {
  panel.querySelectorAll('.mc-fill').forEach(b=>{
    b.style.width='0%';
    setTimeout(()=>{ if(b.dataset.w) b.style.width=b.dataset.w+'%'; },50);
  });
}

/* ════════════════════════════════════════════════════════════
   COUNT UP
   ════════════════════════════════════════════════════════════ */
function initCountUp() {
  $$('.cu').forEach(el=>{
    const target = +el.dataset.n || 0;
    const io = new IntersectionObserver(entries=>{
      if(!entries[0].isIntersecting) return;
      const dur=1600, start=performance.now();
      function step(now){
        const p=Math.min((now-start)/dur,1);
        const e=p<0.5?2*p*p:-1+(4-2*p)*p;
        el.textContent=Math.floor(e*target);
        if(p<1)requestAnimationFrame(step); else el.textContent=target;
      }
      requestAnimationFrame(step);
      io.disconnect();
    },{threshold:0.5});
    io.observe(el);
  });
}

/* ════════════════════════════════════════════════════════════
   SKILL TABS
   ════════════════════════════════════════════════════════════ */
function initSkillTabs() {
  const tabs   = $$('.sk-tab');
  const panels = $$('.skill-panel');
  if(!tabs.length) return;
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $('sk-'+tab.dataset.tab);
      if(panel){ panel.classList.add('active'); animateModuleBars(panel); panel.querySelectorAll('.reveal:not(.visible)').forEach(r=>r.classList.add('visible')); }
    });
  });
  /* Animate initial active panel */
  const firstPanel = document.querySelector('.skill-panel.active');
  if(firstPanel) animateModuleBars(firstPanel);
}

/* ════════════════════════════════════════════════════════════
   WORK FILTER
   ════════════════════════════════════════════════════════════ */
function initWorkFilter() {
  const btns  = $$('.wf');
  const cards = $$('.mission-card');
  if(!btns.length) return;
  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      btns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card=>{
        const cats = (card.dataset.cat||'').split(' ');
        const show = filter==='all' || cats.includes(filter);
        card.dataset.hidden = show ? 'false' : 'true';
        card.style.display  = show ? '' : 'none';
      });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   CONTACT FORM
   ════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form    = $('contactForm');
  const success = $('formSuccess');
  const charEl  = $('charCount');
  const msgEl   = $('message');
  if(!form) return;

  if(msgEl&&charEl){
    msgEl.addEventListener('input',()=>{
      const n=msgEl.value.length;
      charEl.textContent=n;
      charEl.style.color=n>450?'var(--c2)':'';
    });
  }

  function setErr(id,msg){
    const e=$('err-'+id); const i=$(id)||form.querySelector(`[name="${id}"]`);
    if(e)e.textContent=msg; if(i)i.classList.toggle('cf-error',!!msg);
  }
  function clearErrs(){
    form.querySelectorAll('.cf-err').forEach(e=>e.textContent='');
    form.querySelectorAll('.cf-error').forEach(e=>e.classList.remove('cf-error'));
  }
  function validate(){
    clearErrs(); let ok=true;
    const f=form.fname?.value.trim(), l=form.lname?.value.trim(), e=form.email?.value.trim(), m=form.message?.value.trim(), t=form.terms?.checked;
    if(!f){setErr('fname','REQUIRED');ok=false;}
    if(!l){setErr('lname','REQUIRED');ok=false;}
    if(!e){setErr('email','REQUIRED');ok=false;}
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setErr('email','INVALID FORMAT');ok=false;}
    if(!m){setErr('message','REQUIRED');ok=false;}
    if(!t){setErr('terms','ACCEPTANCE REQUIRED');ok=false;}
    return ok;
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!validate()) return;
    const btn=form.querySelector('.cf-submit');
    if(btn){btn.classList.add('loading');btn.disabled=true;}

    /* ── Collect form data ── */
    const templateParams = {
      from_name  : ((form.fname?.value.trim()||'') + ' ' + (form.lname?.value.trim()||'')).trim(),
      from_email : form.email?.value.trim(),
      subject    : form.subject?.value || '(no subject)',
      message    : form.message?.value.trim(),
      reply_to   : form.email?.value.trim(),
    };

    /* ── Send via EmailJS ── */
    try {
      await emailjs.send(
        window.EMAILJS_SERVICE_ID,
        window.EMAILJS_TEMPLATE_ID,
        templateParams
      );
      /* Success */
      if(btn){btn.style.display='none';}
      form.querySelectorAll('.cf-group,.cf-row,.cf-check-group').forEach(g=>{g.style.opacity='0.3';g.style.pointerEvents='none';});
      if(success) success.classList.add('show');
    } catch(err) {
      /* Failure – re-enable form and show error */
      console.error('EmailJS error:', err);
      if(btn){btn.classList.remove('loading');btn.disabled=false;}
      const errBox = document.createElement('p');
      errBox.style.cssText='color:#ff4d6d;font-size:0.78rem;margin-top:0.75rem;text-align:center;letter-spacing:0.05em;';
      errBox.textContent = '⚠ TRANSMISSION FAILED — please try again or contact directly.';
      form.appendChild(errBox);
      setTimeout(()=>errBox.remove(), 5000);
    }
  });
}

/* ════════════════════════════════════════════════════════════
   AMBIENT AUDIO (web audio API - minimal)
   ════════════════════════════════════════════════════════════ */
function initAmbient() {
  const btn = $('ambientBtn');
  if(!btn) return;
  let ctx_a=null, playing=false, nodes=[];

  btn.addEventListener('click',()=>{
    if(!ctx_a) ctx_a=new (window.AudioContext||window.webkitAudioContext)();
    if(playing){ nodes.forEach(n=>{try{n.stop();}catch(e){}}); nodes=[]; playing=false; btn.classList.remove('active'); return; }
    /* Subtle drone tones */
    [55,110,165].forEach((freq,i)=>{
      const osc=ctx_a.createOscillator();
      const gain=ctx_a.createGain();
      osc.type=i===0?'sine':'triangle';
      osc.frequency.setValueAtTime(freq+Math.random()*2,ctx_a.currentTime);
      gain.gain.setValueAtTime(0.012/(i+1),ctx_a.currentTime);
      osc.connect(gain); gain.connect(ctx_a.destination);
      osc.start(); nodes.push(osc);
    });
    playing=true; btn.classList.add('active');
  });
}

/* ════════════════════════════════════════════════════════════
   HUD CARD HOVER (scanline + side indicators)
   ════════════════════════════════════════════════════════════ */
function initCardEffects() {
  if(IS_TOUCH||IS_REDUCED) return;
  $$('.mission-card,.svc-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-0.5;
      const y=(e.clientY-r.top)/r.height-0.5;
      card.style.transform=`perspective(600px) rotateX(${-y*4}deg) rotateY(${x*4}deg)`;
    });
    card.addEventListener('mouseleave',()=>{ card.style.transform=''; });
  });

  /* Update side indicators by section */
  const inds = $$('.sp-ind');
  const sections=['hero','about','skills','work','services','contact'];
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const idx=sections.indexOf(entry.target.id);
        inds.forEach((ind,i)=>ind.classList.toggle('active',i===idx));
      }
    });
  },{threshold:0.4});
  sections.forEach(id=>{const s=$(id);if(s)io.observe(s);});
}

/* ════════════════════════════════════════════════════════════
   GLITCH EFFECT on hero name
   ════════════════════════════════════════════════════════════ */
function initGlitch() {
  if(IS_REDUCED) return;
  const name=document.querySelector('.hero-name');
  if(!name) return;
  setInterval(()=>{
    if(Math.random()>0.92){
      name.style.textShadow='3px 0 var(--c2), -3px 0 var(--c4)';
      name.style.transform='skewX(-2deg)';
      setTimeout(()=>{ name.style.textShadow=''; name.style.transform=''; },100);
    }
  },3000);
}

/* ════════════════════════════════════════════════════════════
   RANDOM DATA FLICKER (HUD effect)
   ════════════════════════════════════════════════════════════ */
function initHUDFlicker() {
  if(IS_REDUCED) return;
  const sig = $('spSig');
  const bars=['████','███▓','██▓▒','█▓▒░','▓▒░░','▒░░░','░░░░','▒░░░','▓▒░░','██▓▒','███▓','████'];
  let i=0;
  if(sig) setInterval(()=>{ sig.textContent=bars[i++ % bars.length]; },400);
}

/* ════════════════════════════════════════════════════════════
   INIT ALL (called after boot)
   ════════════════════════════════════════════════════════════ */
function initAll() {
  try { initCursor(); } catch(e){}
  try { initHeroCanvas(); } catch(e){}
  try { initTyped(); } catch(e){}
  try { initClock(); } catch(e){}
  try { initFPS(); } catch(e){}
  try { initSidePanelAnim(); } catch(e){}
  try { initNav(); } catch(e){}
  try { initReveal(); } catch(e){}
  try { initCountUp(); } catch(e){}
  try { initSkillTabs(); } catch(e){}
  try { initWorkFilter(); } catch(e){}
  try { initContactForm(); } catch(e){}
  try { initAmbient(); } catch(e){}
  try { initCardEffects(); } catch(e){}
  try { initGlitch(); } catch(e){}
  try { initHUDFlicker(); } catch(e){}

  /* Trigger above-fold reveals */
  setTimeout(()=>{
    $$('.reveal').forEach(el=>{
      if(el.getBoundingClientRect().top < window.innerHeight*1.1){
        el.classList.add('visible');
        el.querySelectorAll('.v-fill').forEach(b=>{ if(b.dataset.w) b.style.width=b.dataset.w+'%'; });
        el.querySelectorAll('.mc-fill').forEach(b=>{ if(b.dataset.w) b.style.width=b.dataset.w+'%'; });
      }
    });
  }, 200);
}

/* ════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async ()=>{
  try {
    await initBoot();
    bootResolved = true;
    initAll();
  } catch(err) {
    console.error('Boot error:', err);
    const boot=$('bootScreen');
    const hud =$('hud');
    if(boot){ boot.style.display='none'; }
    if(hud){ hud.classList.remove('hud-hidden'); hud.classList.add('hud-visible'); }
    initAll();
  }
});
