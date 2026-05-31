/* =============================================
   js/music.js — Complete music player
   Server-side playlist edition
   ============================================= */

(function () {
  'use strict';

  /* ====================================================
     🎵 YOUR PLAYLIST — Edit this array to add songs
     Each song needs:
       url    : relative path to the audio file
       name   : song title shown in the player
       artist : artist name (use '—' if unknown)
       cover  : path to cover image (optional, leave '' to use default artwork)
     
     FOLDER STRUCTURE:
       project/
       ├── music.html
       ├── music.js
       ├── music.css
       └── music/
           ├── song1.mp3
           ├── song2.mp3
           └── ...
     
     EXAMPLE:
       url: './music/song1.mp3'
     ====================================================
  */
  const SERVER_PLAYLIST = [
    {
      url:    'Still With You.mp3',
      name:   'Still with you',
      artist: 'Jungkook',
      cover:  '3.jpg',
    },
    {
      url:    'Spring Day.mp3',
      name:   'Spring Day',
      artist: 'BTS',
      cover:  '4.jpg',
    },
    {
      url:    'Senorita.mp3',
      name:   'Senorita',
      artist: 'Kim Taehyung (ai cover)',
      cover:  '5.jpg',
    },
    {
      url:    'Perfect.mp3',
      name:   'Perfect',
      artist: 'Ed Sheeran',
      cover:  '2.jpg',
    },
    {
      url:    'piano.mp3',
      name:   'Christmas Tree',
      artist: 'Kim Tae-hyung',
      cover:  '1.jpg',
    },
    {
      url:    'Magic Shop.mp3',
      name:   'Magic Shop',
      artist: 'BTS',
      cover:  '6.jpg',
    },
    // Add more songs here - example:
    // {
    //   url:    './music/another-song.mp3',
    //   name:   'Another Song',
    //   artist: 'Artist Name',
    //   cover:  './music/covers/cover.jpg',
    // },
  ];
  /* ==================================================== */

  /* ---- DOM refs ---- */
  const audio         = document.getElementById('audioPlayer');
  const playBtn       = document.getElementById('playBtn');
  const playIcon      = document.getElementById('playIcon');
  const pauseIcon     = document.getElementById('pauseIcon');
  const prevBtn       = document.getElementById('prevBtn');
  const nextBtn       = document.getElementById('nextBtn');
  const shuffleBtn    = document.getElementById('shuffleBtn');
  const repeatBtn     = document.getElementById('repeatBtn');
  const muteBtn       = document.getElementById('muteBtn');
  const seekbar       = document.getElementById('seekbar');
  const seekFill      = document.getElementById('seekFill');
  const seekThumb     = document.getElementById('seekThumb');
  const volSlider     = document.getElementById('volSlider');
  const volFill       = document.getElementById('volFill');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl   = document.getElementById('totalTime');
  const songTitle     = document.getElementById('songTitle');
  const songArtist    = document.getElementById('songArtist');
  const playlistList  = document.getElementById('playlistList');
  const playlistEmpty = document.getElementById('playlistEmpty');
  const rainToggle    = document.getElementById('rainToggle');
  const artworkFrame  = document.getElementById('artworkFrame');
  const artworkImg    = document.getElementById('artworkImg');
  const artCanvas     = document.getElementById('artworkCanvas');
  const vizCanvas     = document.getElementById('visualizer');
  const bgCanvas      = document.getElementById('musicBg');
  const rainContainer = document.getElementById('rainContainer');
  const lyricsBody     = document.getElementById('lyricsBody');
  const playlistCount  = document.getElementById('playlistCount');

  /* ---- State ---- */
  let playlist       = [];
  let currentIndex   = -1;
  let isPlaying      = false;
  let isShuffle      = false;
  let isRepeat       = false;
  let isMuted        = false;
  let volume         = 1;
  let isDraggingSeek = false;
  let shuffleOrder   = [];
  let rainMode       = false;

  /* ---- Audio Context / Visualizer ---- */
  let audioCtx = null;
  let analyser  = null;
  let source    = null;
  let vizRAF    = null;

  function initAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source    = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  /* ---- Formatters ---- */
  function fmtTime(s) {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ---- Load playlist from server config ---- */
  function initPlaylist() {
    playlist = SERVER_PLAYLIST.map(t => ({
      url:      t.url,
      name:     t.name    || 'Unknown Title',
      artist:   t.artist  || '—',
      cover:    t.cover   || '',
      duration: 0,
    }));
    rebuildPlaylistUI();
    if (playlistCount) playlistCount.textContent = playlist.length + ' songs';
    if (playlist.length > 0) {
      loadTrack(0);
    }
  }

  /* ---- Rebuild playlist UI ---- */
  function rebuildPlaylistUI() {
    playlistEmpty.style.display = playlist.length ? 'none' : 'block';
    playlistList.innerHTML = '';
    playlist.forEach((track, i) => {
      const li = document.createElement('li');
      li.className = 'playlist-item' + (i === currentIndex ? ' active' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
      li.innerHTML = `
        <span class="pli-num">${i + 1}</span>
        <span class="pli-playing" aria-hidden="true">♪</span>
        <div class="pli-info">
          <div class="pli-title">${escHtml(track.name)}</div>
          <div class="pli-artist">${escHtml(track.artist)}</div>
        </div>
        <span class="pli-dur">${track.duration ? fmtTime(track.duration) : ''}</span>
      `;
      li.addEventListener('click', () => {
        if (currentIndex === i) {
          togglePlay();
        } else {
          loadTrack(i);
          playAudio();
        }
      });
      playlistList.appendChild(li);
    });
  }

  /* ---- Load track ---- */
  function loadTrack(idx) {
    if (idx < 0 || idx >= playlist.length) return;
    const wasPlaying = isPlaying;
    currentIndex = idx;
    const track = playlist[idx];

    audio.src = track.url;
    audio.crossOrigin = 'anonymous';
    audio.load();

    songTitle.textContent  = track.name;
    songArtist.textContent = track.artist;
    seekFill.style.width   = '0%';
    seekThumb.style.left   = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent   = '0:00';

    // Cover art
    if (track.cover) {
      artworkImg.src = track.cover;
      artworkImg.classList.remove('hidden');
      artCanvas.classList.add('hidden');
    } else {
      artworkImg.classList.add('hidden');
      artCanvas.classList.remove('hidden');
      drawDefaultArtwork();
    }

    rebuildPlaylistUI();
    artworkFrame.classList.remove('playing');

    audio.addEventListener('loadedmetadata', function onMeta() {
      totalTimeEl.textContent = fmtTime(audio.duration);
      track.duration = audio.duration;
      rebuildPlaylistUI();
      audio.removeEventListener('loadedmetadata', onMeta);
    });

    try { localStorage.setItem('varsha_last_track', idx); } catch(e) {}

    if (wasPlaying) playAudio();
  }

  /* ---- Playback ---- */
  function playAudio() {
    if (!audio.src) return;
    initAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audio.play().then(() => {
      isPlaying = true;
      updatePlayBtn();
      artworkFrame.classList.add('playing');
      startViz();
    }).catch(err => {
      console.warn('Playback error:', err);
    });
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    updatePlayBtn();
    artworkFrame.classList.remove('playing');
  }

  function togglePlay() {
    if (!audio.src) return;
    isPlaying ? pauseAudio() : playAudio();
  }

  function updatePlayBtn() {
    playIcon.classList.toggle('hidden', isPlaying);
    pauseIcon.classList.toggle('hidden', !isPlaying);
  }

  /* ---- Next / Prev ---- */
  function nextTrack() {
    if (!playlist.length) return;
    if (isShuffle) {
      buildShuffleOrder();
      const pos  = shuffleOrder.indexOf(currentIndex);
      const next = shuffleOrder[(pos + 1) % shuffleOrder.length];
      loadTrack(next);
    } else {
      loadTrack((currentIndex + 1) % playlist.length);
    }
    playAudio();
  }

  function prevTrack() {
    if (!playlist.length) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (isShuffle) {
      buildShuffleOrder();
      const pos  = shuffleOrder.indexOf(currentIndex);
      const prev = shuffleOrder[(pos - 1 + shuffleOrder.length) % shuffleOrder.length];
      loadTrack(prev);
    } else {
      loadTrack((currentIndex - 1 + playlist.length) % playlist.length);
    }
    playAudio();
  }

  function buildShuffleOrder() {
    if (shuffleOrder.length !== playlist.length) {
      shuffleOrder = Array.from({length: playlist.length}, (_, i) => i);
      for (let i = shuffleOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
      }
    }
  }

  /* ---- Audio events ---- */
  audio.addEventListener('timeupdate', () => {
    if (!isDraggingSeek && audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      seekFill.style.width = pct + '%';
      seekThumb.style.left = pct + '%';
      currentTimeEl.textContent = fmtTime(audio.currentTime);
      updateLyricsHighlight();
    }
  });

  audio.addEventListener('ended', () => {
    if (isRepeat) {
      audio.currentTime = 0;
      playAudio();
    } else if (playlist.length > 1) {
      nextTrack();
    } else {
      isPlaying = false;
      updatePlayBtn();
      artworkFrame.classList.remove('playing');
    }
  });

  audio.addEventListener('loadeddata', () => {
    totalTimeEl.textContent = fmtTime(audio.duration);
  });

  audio.addEventListener('error', (e) => {
    console.error('Audio error:', audio.error);
    const errorMsg = audio.error?.message || 'Unknown error';
    const code = audio.error?.code;
    let message = 'Playback error: ';
    switch(code) {
      case 1: message += 'Audio fetching aborted'; break;
      case 2: message += 'Network error'; break;
      case 3: message += 'Decoding error'; break;
      case 4: message += 'Audio format not supported'; break;
      default: message += errorMsg;
    }
    console.warn(message, 'File:', audio.src);
  });

  /* ---- Controls ---- */
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);

  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
    shuffleBtn.setAttribute('aria-pressed', isShuffle);
    shuffleOrder = [];
  });

  repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
    repeatBtn.setAttribute('aria-pressed', isRepeat);
  });

  /* ---- Seekbar ---- */
  function seekTo(pct) {
    if (!audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
    seekFill.style.width = pct + '%';
    seekThumb.style.left = pct + '%';
  }

  function getSeekPct(e, el) {
    const rect = el.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return Math.min(100, Math.max(0, (x / rect.width) * 100));
  }

  seekbar.addEventListener('mousedown', e => {
    isDraggingSeek = true;
    seekTo(getSeekPct(e, seekbar));
  });
  document.addEventListener('mousemove', e => {
    if (isDraggingSeek) seekTo(getSeekPct(e, seekbar));
  });
  document.addEventListener('mouseup', () => { isDraggingSeek = false; });

  seekbar.addEventListener('touchstart', e => {
    isDraggingSeek = true;
    seekTo(getSeekPct(e, seekbar));
  }, {passive: true});
  seekbar.addEventListener('touchmove', e => {
    if (isDraggingSeek) seekTo(getSeekPct(e, seekbar));
  }, {passive: true});
  seekbar.addEventListener('touchend', () => { isDraggingSeek = false; });

  /* ---- Volume ---- */
  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v));
    audio.volume = isMuted ? 0 : volume;
    volFill.style.width = (volume * 100) + '%';
    volSlider.setAttribute('aria-valuenow', Math.round(volume * 100));
    try { localStorage.setItem('varsha_volume', volume); } catch(e) {}
  }

  volSlider.addEventListener('click', e => {
    const rect = volSlider.getBoundingClientRect();
    setVolume((e.clientX - rect.left) / rect.width);
  });

  let draggingVol = false;
  volSlider.addEventListener('mousedown', () => draggingVol = true);
  document.addEventListener('mousemove', e => {
    if (!draggingVol) return;
    const rect = volSlider.getBoundingClientRect();
    setVolume((e.clientX - rect.left) / rect.width);
  });
  document.addEventListener('mouseup', () => draggingVol = false);

  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    audio.volume = isMuted ? 0 : volume;
    volFill.style.width = isMuted ? '0%' : (volume * 100) + '%';
  });

  /* ---- Keyboard shortcuts ---- */
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    switch (e.code) {
      case 'Space':       e.preventDefault(); togglePlay(); break;
      case 'ArrowRight':  e.preventDefault(); audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); break;
      case 'ArrowLeft':   e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 10); break;
      case 'ArrowUp':     e.preventDefault(); setVolume(volume + 0.1); break;
      case 'ArrowDown':   e.preventDefault(); setVolume(volume - 0.1); break;
      case 'KeyN':        nextTrack(); break;
      case 'KeyP':        prevTrack(); break;
      case 'KeyS':        shuffleBtn.click(); break;
      case 'KeyR':        repeatBtn.click(); break;
      case 'KeyM':        muteBtn.click(); break;
    }
  });

  /* ---- Rain Mode ---- */
  let rainDrops   = [];
  let rainInterval = null;

  rainToggle.addEventListener('click', () => {
    rainMode = !rainMode;
    document.body.classList.toggle('rain-mode', rainMode);
    rainToggle.setAttribute('aria-pressed', rainMode);
    rainMode ? startRain() : stopRain();
  });

  function startRain() {
    rainDrops.forEach(d => d.remove());
    rainDrops = [];
    for (let i = 0; i < 180; i++) {
      setTimeout(() => createRaindrop(), Math.random() * 2000);
    }
    rainInterval = setInterval(() => createRaindrop(), 30);
  }

  function stopRain() {
    clearInterval(rainInterval);
    rainDrops.forEach(d => {
      d.style.transition = 'opacity 1s';
      d.style.opacity    = '0';
      setTimeout(() => d.remove(), 1000);
    });
    rainDrops = [];
  }

  function createRaindrop() {
    const drop     = document.createElement('div');
    drop.className = 'raindrop';
    const height   = 15 + Math.random() * 35;
    const duration = 0.6 + Math.random() * 0.8;
    drop.style.left             = (Math.random() * 100) + '%';
    drop.style.height           = height + 'px';
    drop.style.opacity          = (0.3 + Math.random() * 0.5).toString();
    drop.style.animationDuration = duration + 's';
    drop.style.animationDelay   = (Math.random() * -2) + 's';
    rainContainer.appendChild(drop);

setTimeout(() => {
  drop.remove();
}, duration * 1000);
  }

  /* ---- Visualizer ---- */
  function startViz() {
    if (!analyser) return;
    if (vizRAF) cancelAnimationFrame(vizRAF);
    const ctx = vizCanvas.getContext('2d');

    function resizeViz() {
      vizCanvas.width  = vizCanvas.offsetWidth  * window.devicePixelRatio;
      vizCanvas.height = vizCanvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeViz();
    window.addEventListener('resize', resizeViz);

    const bufLen  = analyser.frequencyBinCount;
    const dataArr = new Uint8Array(bufLen);

    function draw() {
      vizRAF = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArr);

      const W = vizCanvas.offsetWidth;
      const H = vizCanvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const barW = (W / bufLen) * 2.5;
      let x = 0;

      for (let i = 0; i < bufLen; i++) {
        const v    = dataArr[i] / 255;
        const h    = v * H * 0.9;
        const hue  = 270 + v * 50;
        const alpha = 0.5 + v * 0.5;

        const g = ctx.createLinearGradient(0, H - h, 0, H);
        g.addColorStop(0, `hsla(${hue}, 80%, 75%, ${alpha})`);
        g.addColorStop(1, `hsla(${hue - 20}, 60%, 50%, 0.3)`);
        ctx.fillStyle = g;
        ctx.fillRect(x, H - h, barW - 1, h);
        x += barW + 1;
      }
    }
    draw();
  }

  /* ---- Default artwork ---- */
  function drawDefaultArtwork() {
    artworkImg.classList.add('hidden');
    artCanvas.classList.remove('hidden');
    const ctx = artCanvas.getContext('2d');
    const W = artCanvas.width, H = artCanvas.height;
    const cx = W / 2, cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(cx, cy * .8, 0, cx, cy, W * .6);
    bg.addColorStop(0,   '#2d1a5e');
    bg.addColorStop(0.5, '#1a0a3e');
    bg.addColorStop(1,   '#0d0720');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, W / 2, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (W / 2) * (i / 4.5), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(168,85,247,${0.08 * (5 - i)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font          = '60px serif';
    ctx.fillStyle     = 'rgba(192,132,252,0.3)';
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.fillText('♪', cx, cy);
  }

  /* ---- Lyrics placeholder ---- */
  function updateLyricsHighlight() {
    if (!window.lyricsData || !lyricsBody) return;
    const t = audio.currentTime;
    const lines = lyricsBody.querySelectorAll('.lyrics-line');
    lines.forEach(l => {
      const ts     = parseFloat(l.dataset.ts     || -1);
      const tsNext = parseFloat(l.dataset.tsNext || 9999);
      if (t >= ts && t < tsNext) {
        l.classList.add('active');
        l.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        l.classList.remove('active');
      }
    });
  }

  /* ---- Background canvas (star field) ---- */
  (function bgStars() {
    const ctx = bgCanvas.getContext('2d');
    let stars = [];

    function resize() {
      bgCanvas.width  = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      stars = Array.from({ length: Math.floor(bgCanvas.width * bgCanvas.height / 7000) }, () => ({
        x:   Math.random() * bgCanvas.width,
        y:   Math.random() * bgCanvas.height,
        r:   Math.random() * 1.4 + 0.3,
        a:   Math.random(),
        da:  (Math.random() * 0.005 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
        hue: 270 + Math.random() * 50,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      const g = ctx.createRadialGradient(
        bgCanvas.width / 2, bgCanvas.height * .4, 0,
        bgCanvas.width / 2, bgCanvas.height * .4, bgCanvas.width
      );
      g.addColorStop(0,   rainMode ? '#08011a' : '#160d35');
      g.addColorStop(0.7, '#0b0520');
      g.addColorStop(1,   '#03010a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

      for (const s of stars) {
        s.a += s.da;
        if (s.a > 1 || s.a < 0) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},80%,80%,${s.a})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
  })();

  /* ---- Init ---- */
  drawDefaultArtwork();
  setVolume(1);

  try {
    const savedVol = parseFloat(localStorage.getItem('varsha_volume'));
    if (!isNaN(savedVol)) setVolume(savedVol);
  } catch(e) {}

  // Load the server playlist on startup
  initPlaylist();

})();
