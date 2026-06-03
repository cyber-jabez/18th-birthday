/* =============================================
   js/countdown.js
   Countdown timer + particle canvas + midnight transition
   30-second birthday screen with server song
   ============================================= */

(function () {
  'use strict';

  /* Duration (ms) the cinematic birthday screen shows before redirect */
  const BIRTHDAY_SCREEN_DURATION = 6000; // 6 seconds

  /* ---- Config ---- */
  const TARGET_DATE = new Date('2026-06-04T00:00:00');
  //const TARGET_DATE = new Date(Date.now() + 10000);
  const START_DATE  = new Date('2026-05-25T00:00:00');

  const QUOTES = [
    "The story isn't written yet.",
    "A new chapter begins soon.",
    "The future arrives one second at a time.",
    "Some moments are worth waiting for.",
    "Every countdown leads somewhere beautiful.",
    "The best chapters always begin quietly.",
    "Time moves, and so do you.",
    "Not yet — but almost.",
  ];

  /* ---- Elements ---- */
  const daysEl      = document.getElementById('days');
  const hoursEl     = document.getElementById('hours');
  const minsEl      = document.getElementById('minutes');
  const secsEl      = document.getElementById('seconds');
  const fillEl      = document.getElementById('progressFill');
  const pctEl       = document.getElementById('progressPct');
  const quoteEl     = document.getElementById('rotatingQuote');
  const overlay     = document.getElementById('midnightOverlay');
  const transTitle  = document.getElementById('transitionTitle');
  const partCanvas  = document.getElementById('particleCanvas');
  const tranCanvas  = document.getElementById('transitionCanvas');

  /* ---- Particle System ---- */
  const pCtx = partCanvas.getContext('2d');
  let particles = [];
  let animFrame;

  function resizeCanvas() {
    partCanvas.width  = window.innerWidth;
    partCanvas.height = window.innerHeight;
  }

  function randRange(a, b) { return a + Math.random() * (b - a); }

  function createParticles() {
    particles = [];
    const count = Math.floor((window.innerWidth * window.innerHeight) / 8000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: randRange(0, partCanvas.width),
        y: randRange(0, partCanvas.height),
        r: randRange(0.4, 2.2),
        vx: randRange(-0.15, 0.15),
        vy: randRange(-0.25, -0.05),
        alpha: randRange(0.1, 0.7),
        hue: randRange(270, 310),
      });
    }
  }

  function drawBg() {
    const w = partCanvas.width, h = partCanvas.height;
    const grad = pCtx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.8);
    grad.addColorStop(0, '#160d35');
    grad.addColorStop(0.5, '#0b0520');
    grad.addColorStop(1, '#03010a');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, w, h);

    const neb = pCtx.createRadialGradient(w*0.6, h*0.4, 0, w*0.6, h*0.4, w*0.35);
    neb.addColorStop(0, 'rgba(107,33,168,0.12)');
    neb.addColorStop(1, 'rgba(107,33,168,0)');
    pCtx.fillStyle = neb;
    pCtx.fillRect(0, 0, w, h);
  }

  function animateParticles() {
    pCtx.clearRect(0, 0, partCanvas.width, partCanvas.height);
    drawBg();
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = partCanvas.height + 5; p.x = randRange(0, partCanvas.width); }
      if (p.x < 0)  p.x = partCanvas.width;
      if (p.x > partCanvas.width) p.x = 0;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha})`;
      pCtx.fill();
    }
    animFrame = requestAnimationFrame(animateParticles);
  }

  /* ---- Quotes rotation ---- */
  let qIdx = 0;
  function nextQuote() {
    quoteEl.classList.add('fade-out');
    setTimeout(() => {
      qIdx = (qIdx + 1) % QUOTES.length;
      quoteEl.textContent = '"' + QUOTES[qIdx] + '"';
      quoteEl.classList.remove('fade-out');
    }, 600);
  }
  quoteEl.textContent = '"' + QUOTES[0] + '"';
  setInterval(nextQuote, 5000);

  /* ---- Helpers ---- */
  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

  function flashEl(el) {
    el.classList.remove('tick');
    void el.offsetWidth;
    el.classList.add('tick');
    setTimeout(() => el.classList.remove('tick'), 200);
  }

  function updateProgress(now) {
    const total = TARGET_DATE - START_DATE;
    const elapsed = now - START_DATE;
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    fillEl.style.width = pct + '%';
    pctEl.textContent = pct.toFixed(1) + '%';
  }

  /* ---- Main countdown loop ---- */
  let prevSec = -1, prevMin = -1, prevHour = -1, prevDay = -1;
  let triggered = false;

  function tick() {
    const now = new Date();
    const diff = TARGET_DATE - now;

    if (diff <= 0 && !triggered) {
      triggered = true;
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      startMidnightTransition();
      return;
    }

    if (diff <= 0) return;

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    if (secs  !== prevSec)  { secsEl.textContent  = pad(secs);  flashEl(secsEl);  prevSec  = secs;  }
    if (mins  !== prevMin)  { minsEl.textContent  = pad(mins);  flashEl(minsEl);  prevMin  = mins;  }
    if (hours !== prevHour) { hoursEl.textContent = pad(hours); flashEl(hoursEl); prevHour = hours; }
    if (days  !== prevDay)  { daysEl.textContent  = pad(days);  flashEl(daysEl);  prevDay  = days;  }

    updateProgress(now);
  }

  /* ====================================================
     CINEMATIC TRANSITION
  ==================================================== */
  function startMidnightTransition() {
    cancelAnimationFrame(animFrame);

    const wrapper = document.getElementById('countdownWrapper');
    wrapper.style.transition = 'opacity 1.2s ease';
    wrapper.style.opacity = '0';

    setTimeout(() => {
      overlay.classList.add('active');
      initTransitionCanvas();
    }, 1300);
  }

  /* ---- Cinematic Transition Canvas ---- */
  let tFrame;
  let tTimer  = 0;
  let tPhase  = 0;

  /* Dust motes floating upward */
  let dustMotes = [];
  function spawnDust(tc) {
    return {
      x:   randRange(0, tc.width),
      y:   tc.height + 5,
      vx:  randRange(-0.3, 0.3),
      vy:  randRange(-0.6, -0.2),
      r:   randRange(0.5, 1.8),
      hue: randRange(265, 315),
      alpha: randRange(0.2, 0.6),
    };
  }

  function initTransitionCanvas() {
    const tc  = tranCanvas;
    tc.width  = window.innerWidth;
    tc.height = window.innerHeight;
    const ctx = tc.getContext('2d');
    tTimer = 0;
    tPhase = 0;
    dustMotes = Array.from({ length: 60 }, () => {
      const m = spawnDust(tc);
      m.y = randRange(0, tc.height); /* pre-scatter */
      return m;
    });
    animCinematic(ctx, tc);
  }

  let titleShown = false;

  function animCinematic(ctx, tc) {
    const W = tc.width, H = tc.height;
    tTimer++;

    /* ── Phase 0 (0–80 frames): deep black with slow vignette bloom ── */
    if (tPhase === 0) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      /* faint radial bloom growing from center */
      const prog  = tTimer / 80;
      const bloom = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.55 * prog);
      bloom.addColorStop(0,   `rgba(80,20,140,${0.18 * prog})`);
      bloom.addColorStop(0.5, `rgba(50,10,100,${0.09 * prog})`);
      bloom.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, W, H);

      if (tTimer >= 80) { tPhase = 1; tTimer = 0; }
    }

    /* ── Phase 1 (0–120 frames): curtain-of-light rays fan out ── */
    else if (tPhase === 1) {
      /* Fade bg from black to deep purple */
      const t = tTimer / 120;
      ctx.fillStyle = `rgb(${Math.round(t*8)},${Math.round(t*3)},${Math.round(t*22)})`;
      ctx.fillRect(0, 0, W, H);

      /* Light rays from top center */
      const cx = W / 2, cy = -H * 0.15;
      const rayCount = 14;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < rayCount; i++) {
        const angle = ((i / (rayCount - 1)) - 0.5) * Math.PI * 0.9;
        const spread = 0.022 + 0.008 * Math.sin(i * 1.3);
        const len    = H * 1.6;
        const alpha  = (0.05 + 0.06 * Math.sin(i * 0.7)) * Math.min(1, tTimer / 50);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.sin(angle - spread) * len,
          cy + Math.cos(angle - spread) * len
        );
        ctx.lineTo(
          cx + Math.sin(angle + spread) * len,
          cy + Math.cos(angle + spread) * len
        );
        ctx.closePath();

        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, len);
        rg.addColorStop(0,   `rgba(200,140,255,${alpha * 1.6})`);
        rg.addColorStop(0.4, `rgba(150, 80,240,${alpha})`);
        rg.addColorStop(1,   'rgba(80,20,160,0)');
        ctx.fillStyle = rg;
        ctx.fill();
      }
      ctx.restore();

      /* Rising dust motes */
      _tickDust(ctx, tc);

      if (tTimer >= 120) { tPhase = 2; tTimer = 0; }
    }

    /* ── Phase 2 (0–100 frames): scene settles — bg dims to midnight ── */
    else if (tPhase === 2) {
      const t = tTimer / 100;

      /* Blend from purple-tinted to near-black */
      const r = Math.round(8  * (1 - t));
      const g = Math.round(3  * (1 - t));
      const b = Math.round(22 * (1 - t) + 10);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, W, H);

      /* Rays fade out */
      const cx = W / 2, cy = -H * 0.15;
      const rayCount = 14;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < rayCount; i++) {
        const angle  = ((i / (rayCount - 1)) - 0.5) * Math.PI * 0.9;
        const spread = 0.022 + 0.008 * Math.sin(i * 1.3);
        const len    = H * 1.6;
        const alpha  = (0.05 + 0.06 * Math.sin(i * 0.7)) * (1 - t);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.sin(angle - spread) * len, cy + Math.cos(angle - spread) * len);
        ctx.lineTo(cx + Math.sin(angle + spread) * len, cy + Math.cos(angle + spread) * len);
        ctx.closePath();
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, len);
        rg.addColorStop(0,   `rgba(200,140,255,${alpha * 1.6})`);
        rg.addColorStop(0.4, `rgba(150,80,240,${alpha})`);
        rg.addColorStop(1,   'rgba(80,20,160,0)');
        ctx.fillStyle = rg;
        ctx.fill();
      }
      ctx.restore();

      _tickDust(ctx, tc);

      if (tTimer >= 100) { tPhase = 3; tTimer = 0; }
    }

    /* ── Phase 3: hold — midnight canvas + dust + text revealed ── */
    else if (tPhase === 3) {
      ctx.fillStyle = '#03010a';
      ctx.fillRect(0, 0, W, H);

      /* Soft nebula glow behind text */
      const glow = ctx.createRadialGradient(W/2, H*0.48, 0, W/2, H*0.48, W * 0.38);
      glow.addColorStop(0,   'rgba(107,33,168,0.18)');
      glow.addColorStop(0.5, 'rgba(80,20,130,0.08)');
      glow.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      _tickDust(ctx, tc);

      /* Horizontal rule lines (cinematic letterbox feel) */
      const lineAlpha = Math.min(1, tTimer / 30) * 0.15;
      ctx.strokeStyle = `rgba(192,132,252,${lineAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(W * 0.12, H * 0.28); ctx.lineTo(W * 0.88, H * 0.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.12, H * 0.72); ctx.lineTo(W * 0.88, H * 0.72); ctx.stroke();

      if (!titleShown) {
        titleShown = true;
        transTitle.classList.add('show');
      }

      /* After BIRTHDAY_SCREEN_DURATION → out */
      if (tTimer > Math.ceil(BIRTHDAY_SCREEN_DURATION / (1000 / 60))) {
        cancelAnimationFrame(tFrame);
        overlay.style.transition = 'opacity 1.4s ease';
        overlay.style.opacity    = '0';
        setTimeout(() => { window.location.href = 'main.html'; }, 1500);
        return;
      }
    }

    tFrame = requestAnimationFrame(() => animCinematic(ctx, tc));
  }

  function _tickDust(ctx, tc) {
    for (let i = dustMotes.length - 1; i >= 0; i--) {
      const m = dustMotes[i];
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < -10) {
        dustMotes[i] = spawnDust(tc);
        continue;
      }
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${m.hue},70%,80%,${m.alpha})`;
      ctx.fill();
    }
  }

  /* ---- Init ---- */
  /* Set cinematic birthday screen content */
  if (transTitle) {
    transTitle.innerHTML = `
      <p class="t-happy">Happy Birthday</p>
      <h1 class="t-name">Varsha</h1>
      <p class="t-sub">A new chapter begins</p>
    `;
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });

  resizeCanvas();
  createParticles();
  animateParticles();
  tick();
  setInterval(tick, 1000);
document.addEventListener(
  "click",
  () => {

    const soundNotice =
      document.getElementById("soundNotice");

    if (soundNotice) {

      soundNotice.classList.add("hide");

      setTimeout(() => {
        soundNotice.remove();
      }, 1000);

    }

  },
  { once:true }
);
})();
