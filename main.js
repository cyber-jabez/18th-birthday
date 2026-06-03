/* =============================================
   js/main.js — star canvas for main hub
   ============================================= */
(function () {
  'use strict';

  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const n = Math.floor(window.innerWidth * window.innerHeight / 5000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        da: (Math.random() * 0.006 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
        hue: 270 + Math.random() * 50,
      });
    }
  }

  function drawBg() {
    const w = canvas.width, h = canvas.height;
    const g = ctx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.4, w);
    g.addColorStop(0, '#160d35');
    g.addColorStop(0.6, '#0b0520');
    g.addColorStop(1, '#03010a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBg();
    for (const s of stars) {
      s.a += s.da;
      if (s.a > 1 || s.a < 0) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue}, 80%, 80%, ${s.a})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();
