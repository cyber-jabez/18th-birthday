/* =============================================
   main.js — ENHANCED
   Features:
   1. Star canvas (original, enhanced with shooting stars)
   2. Intro / loading screen
   3. Cursor sparkle trail
   4. Confetti burst on enter
   5. Typewriter effect for hero subtitle
   6. Name shimmer (CSS-driven, triggered here)
   7. Card ripple effect on click
   8. Scroll progress bar
   9. Explore progress tracker
   ============================================= */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     1. STAR CANVAS  (background, always running)
  ───────────────────────────────────────────── */
  const starCanvas = document.getElementById('starCanvas');
  const sCtx = starCanvas ? starCanvas.getContext('2d') : null;
  let stars = [];
  let shootingStars = [];

  function resizeStars() {
    if (!starCanvas) return;
    starCanvas.width  = window.innerWidth;
    starCanvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const n = Math.floor(window.innerWidth * window.innerHeight / 4500);
    for (let i = 0; i < n; i++) {
      stars.push({
        x:   Math.random() * starCanvas.width,
        y:   Math.random() * starCanvas.height,
        r:   Math.random() * 1.5 + 0.3,
        a:   Math.random(),
        da:  (Math.random() * 0.006 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
        hue: 270 + Math.random() * 50,
      });
    }
  }

  function spawnShootingStar() {
    shootingStars.push({
      x:     Math.random() * starCanvas.width,
      y:     Math.random() * starCanvas.height * 0.5,
      len:   Math.random() * 120 + 60,
      speed: Math.random() * 6 + 4,
      angle: Math.PI / 6 + Math.random() * 0.3,
      life:  1,
      decay: Math.random() * 0.02 + 0.015,
    });
  }

  function drawBg() {
    const w = starCanvas.width, h = starCanvas.height;
    const g = sCtx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.4, w);
    g.addColorStop(0, '#160d35');
    g.addColorStop(0.6, '#0b0520');
    g.addColorStop(1, '#03010a');
    sCtx.fillStyle = g;
    sCtx.fillRect(0, 0, w, h);
  }

  function drawStars() {
    if (!sCtx) return;
    sCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    drawBg();

    // regular stars
    for (const s of stars) {
      s.a += s.da;
      if (s.a > 1 || s.a < 0) s.da *= -1;
      sCtx.beginPath();
      sCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sCtx.fillStyle = `hsla(${s.hue}, 80%, 80%, ${s.a})`;
      sCtx.fill();
    }

    // shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      const tailX = ss.x - Math.cos(ss.angle) * ss.len;
      const tailY = ss.y - Math.sin(ss.angle) * ss.len;

      const grad = sCtx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, `hsla(280, 80%, 80%, 0)`);
      grad.addColorStop(1, `hsla(280, 80%, 95%, ${ss.life})`);

      sCtx.beginPath();
      sCtx.moveTo(tailX, tailY);
      sCtx.lineTo(ss.x, ss.y);
      sCtx.strokeStyle = grad;
      sCtx.lineWidth = 2;
      sCtx.stroke();

      // move
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.life -= ss.decay;
      if (ss.life <= 0) shootingStars.splice(i, 1);
    }

    requestAnimationFrame(drawStars);
  }

  // Spawn shooting stars periodically
  function scheduleShootingStar() {
    spawnShootingStar();
    setTimeout(scheduleShootingStar, Math.random() * 3000 + 1500);
  }

  window.addEventListener('resize', resizeStars);
  resizeStars();
  drawStars();
  setTimeout(scheduleShootingStar, 2000);


  /* ─────────────────────────────────────────────
     2. INTRO SCREEN CANVAS (mini star field)
  ───────────────────────────────────────────── */
  const introCanvas = document.getElementById('introCanvas');
  const iCtx = introCanvas ? introCanvas.getContext('2d') : null;
  let introParticles = [];

  function resizeIntro() {
    if (!introCanvas) return;
    introCanvas.width  = window.innerWidth;
    introCanvas.height = window.innerHeight;
    buildIntroParticles();
  }

  function buildIntroParticles() {
    introParticles = [];
    const n = 80;
    for (let i = 0; i < n; i++) {
      introParticles.push({
        x:    Math.random() * introCanvas.width,
        y:    Math.random() * introCanvas.height,
        r:    Math.random() * 2 + 0.5,
        a:    Math.random(),
        da:   (Math.random() * 0.01 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
        vx:   (Math.random() - 0.5) * 0.3,
        vy:   (Math.random() - 0.5) * 0.3,
        hue:  260 + Math.random() * 60,
      });
    }
  }

  let introAnimFrame;
  function animateIntro() {
    if (!iCtx) return;
    iCtx.clearRect(0, 0, introCanvas.width, introCanvas.height);
    for (const p of introParticles) {
      p.a += p.da;
      if (p.a > 1 || p.a < 0) p.da *= -1;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = introCanvas.width;
      if (p.x > introCanvas.width) p.x = 0;
      if (p.y < 0) p.y = introCanvas.height;
      if (p.y > introCanvas.height) p.y = 0;
      iCtx.beginPath();
      iCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      iCtx.fillStyle = `hsla(${p.hue}, 80%, 80%, ${p.a})`;
      iCtx.fill();
    }
    introAnimFrame = requestAnimationFrame(animateIntro);
  }

  resizeIntro();
  animateIntro();
  window.addEventListener('resize', resizeIntro);


  /* ─────────────────────────────────────────────
     3. CURSOR SPARKLE TRAIL
  ───────────────────────────────────────────── */
  const sparkleCanvas = document.getElementById('sparkleCanvas');
  const spCtx = sparkleCanvas ? sparkleCanvas.getContext('2d') : null;
  let sparkles = [];
  let mouseX = -200, mouseY = -200;

  // Custom cursor dot
  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);

  function resizeSparkle() {
    if (!sparkleCanvas) return;
    sparkleCanvas.width  = window.innerWidth;
    sparkleCanvas.height = window.innerHeight;
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
    // Spawn sparkle particles
    for (let i = 0; i < 2; i++) {
      sparkles.push({
        x:     mouseX + (Math.random() - 0.5) * 10,
        y:     mouseY + (Math.random() - 0.5) * 10,
        r:     Math.random() * 3 + 1,
        a:     0.9,
        da:    Math.random() * 0.04 + 0.025,
        vx:    (Math.random() - 0.5) * 2,
        vy:    -(Math.random() * 2 + 0.5),
        hue:   260 + Math.random() * 60,
        shape: Math.random() < 0.3 ? 'star' : 'circle',
      });
    }
  });

  function drawStar4(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 - Math.PI / 4;
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      const inner = (i * Math.PI) / 2;
      ctx.lineTo(cx + Math.cos(inner) * r * 0.35, cy + Math.sin(inner) * r * 0.35);
    }
    ctx.closePath();
  }

  function drawSparkles() {
    if (!spCtx) return;
    spCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.a -= s.da;
      if (s.a <= 0) { sparkles.splice(i, 1); continue; }
      spCtx.save();
      spCtx.globalAlpha = s.a;
      spCtx.fillStyle = `hsl(${s.hue}, 90%, 85%)`;
      if (s.shape === 'star') {
        drawStar4(spCtx, s.x, s.y, s.r * 1.5);
        spCtx.fill();
      } else {
        spCtx.beginPath();
        spCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        spCtx.fill();
      }
      spCtx.restore();
    }
    requestAnimationFrame(drawSparkles);
  }

  window.addEventListener('resize', resizeSparkle);
  resizeSparkle();
  drawSparkles();


  /* ─────────────────────────────────────────────
     4. CONFETTI  (burst on entering main page)
  ───────────────────────────────────────────── */
  const confettiCanvas = document.getElementById('confettiCanvas');
  const cCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
  let confettiPieces = [];
  let confettiActive = false;

  function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  const confettiColors = [
    '#a855f7','#c084fc','#e9d5ff','#7c3aed',
    '#f0abfc','#d946ef','#818cf8','#fff'
  ];

  function launchConfetti() {
    confettiPieces = [];
    confettiActive = true;
    const total = 140;
    for (let i = 0; i < total; i++) {
      confettiPieces.push({
        x:      Math.random() * confettiCanvas.width,
        y:      -10 - Math.random() * 60,
        w:      Math.random() * 8 + 4,
        h:      Math.random() * 14 + 6,
        color:  confettiColors[Math.floor(Math.random() * confettiColors.length)],
        angle:  Math.random() * Math.PI * 2,
        spin:   (Math.random() - 0.5) * 0.2,
        vx:     (Math.random() - 0.5) * 3,
        vy:     Math.random() * 4 + 2,
        life:   1,
        decay:  Math.random() * 0.004 + 0.002,
        shape:  Math.random() < 0.3 ? 'circle' : 'rect',
      });
    }
    animateConfetti();
  }

  function animateConfetti() {
    if (!cCtx) return;
    cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;
    for (const p of confettiPieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      p.life -= p.decay;
      if (p.life <= 0) continue;
      alive = true;
      cCtx.save();
      cCtx.globalAlpha = p.life;
      cCtx.translate(p.x, p.y);
      cCtx.rotate(p.angle);
      cCtx.fillStyle = p.color;
      if (p.shape === 'circle') {
        cCtx.beginPath();
        cCtx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        cCtx.fill();
      } else {
        cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      cCtx.restore();
    }
    if (alive) requestAnimationFrame(animateConfetti);
    else confettiActive = false;
  }


  /* ─────────────────────────────────────────────
     5. INTRO SCREEN LOGIC  (enter button)
     Only shown once — when arriving from the
     countdown page. All other visits skip it.
  ───────────────────────────────────────────── */
  const introScreen  = document.getElementById('introScreen');
  const introEnter   = document.getElementById('introEnter');
  const mainContent  = document.getElementById('mainContent');

  function enterMainPage() {
    if (!introScreen) return;
    introScreen.classList.add('hide');
    setTimeout(() => {
      introScreen.style.display = 'none';
      cancelAnimationFrame(introAnimFrame);
    }, 950);
    // Show main content
    mainContent.classList.add('visible');
    // Confetti burst
    setTimeout(launchConfetti, 400);
    // Typewriter
    setTimeout(startTypewriter, 800);
    // Progress
    updateProgress();
  }

  // Check if this is a fresh arrival from the countdown transition
  let fromCountdown = false;
  try { fromCountdown = localStorage.getItem('varsha18_fromCountdown') === '1'; } catch {}

  if (fromCountdown) {
    // Clear the flag immediately so it never shows again on reload/revisit
    try { localStorage.removeItem('varsha18_fromCountdown'); } catch {}

    // Show the intro screen; wire up the Enter button
    if (introEnter) {
      introEnter.addEventListener('click', enterMainPage);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && introScreen && !introScreen.classList.contains('hide')) {
          enterMainPage();
        }
      });
    }
  } else {
    // Not from countdown — skip intro entirely, go straight to main content
    if (introScreen) {
      introScreen.style.display = 'none';
      cancelAnimationFrame(introAnimFrame);
    }
    if (mainContent) mainContent.classList.add('visible');
    startTypewriter();
    updateProgress();
  }


  /* ─────────────────────────────────────────────
     6. TYPEWRITER EFFECT
  ───────────────────────────────────────────── */
  const typewriterEl = document.getElementById('typewriterText');
  const fullText = 'A small collection of memories, wishes, music, and words — created for your 18th birthday.';
  let twIndex = 0;
  let twTimer;

  function startTypewriter() {
    if (!typewriterEl) return;
    typewriterEl.innerHTML = '<span class="typewriter-cursor"></span>';
    twIndex = 0;
    twTimer = setInterval(typeStep, 38);
  }

  function typeStep() {
    if (twIndex < fullText.length) {
      const char = fullText[twIndex];
      typewriterEl.innerHTML =
        fullText.slice(0, twIndex + 1) +
        '<span class="typewriter-cursor"></span>';
      twIndex++;
    } else {
      clearInterval(twTimer);
      // Remove cursor after a beat
      setTimeout(() => {
        const cur = typewriterEl.querySelector('.typewriter-cursor');
        if (cur) cur.style.display = 'none';
      }, 2000);
    }
  }


  /* ─────────────────────────────────────────────
     7. CARD RIPPLE EFFECT
  ───────────────────────────────────────────── */
  document.querySelectorAll('.nav-card').forEach(card => {
    card.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top:  ${e.clientY - rect.top  - size / 2}px;
      `;
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });


  /* ─────────────────────────────────────────────
     8. SCROLL PROGRESS BAR
  ───────────────────────────────────────────── */
  const scrollBar = document.getElementById('scrollBar');
  window.addEventListener('scroll', () => {
    if (!scrollBar) return;
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollBar.style.width = pct + '%';
  });


  /* ─────────────────────────────────────────────
     9. EXPLORE PROGRESS TRACKER
  ───────────────────────────────────────────── */
  const progressFill  = document.getElementById('progressFill');
  const progressLabel = document.querySelector('.progress-label');
  const VISITED_KEY   = 'varsha18_visited';

  function getVisited() {
    try { return JSON.parse(localStorage.getItem(VISITED_KEY)) || []; }
    catch { return []; }
  }

  function updateProgress() {
    const visited = getVisited();
    const total   = 8;
    const count   = visited.length;
    const pct     = (count / total) * 100;
    if (progressFill)  progressFill.style.width  = pct + '%';
    if (progressLabel) progressLabel.textContent = `${count} of ${total} explored`;

    // Mark visited cards
    document.querySelectorAll('.nav-card[data-page]').forEach(card => {
      if (visited.includes(card.dataset.page)) {
        card.classList.add('explored');
      }
    });
  }

  // Track clicks
  document.querySelectorAll('.nav-card[data-page]').forEach(card => {
    card.addEventListener('click', function () {
      const page    = this.dataset.page;
      const visited = getVisited();
      if (!visited.includes(page)) {
        visited.push(page);
        try { localStorage.setItem(VISITED_KEY, JSON.stringify(visited)); } catch {}
      }
    });
  });

  // Click-to-sparkle anywhere on page
  document.addEventListener('click', (e) => {
    if (e.target.closest('#introScreen')) return;
    for (let i = 0; i < 12; i++) {
      sparkles.push({
        x:     e.clientX + (Math.random() - 0.5) * 20,
        y:     e.clientY + (Math.random() - 0.5) * 20,
        r:     Math.random() * 5 + 2,
        a:     1,
        da:    Math.random() * 0.03 + 0.015,
        vx:    (Math.random() - 0.5) * 5,
        vy:    -(Math.random() * 5 + 1),
        hue:   260 + Math.random() * 60,
        shape: Math.random() < 0.5 ? 'star' : 'circle',
      });
    }
  });

})();
