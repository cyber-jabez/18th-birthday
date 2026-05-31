/* ==========================================
   GLOBAL MUSIC SYSTEM
   Works across all pages except music.html
   ========================================== */

(() => {
  "use strict";

  // Skip custom music player page
  const page = window.location.pathname.split("/").pop() || "index.html";

  if (page === "music.html") return;

  // ==========================================
  // PAGE MUSIC MAP
  // ==========================================

  const pageMusic = {
    "index.html": "countdown.mp3",
    "main.html": "main.mp3",
    "about.html": "about.mp3",
    "school.html": "school.mp3",
    "chat.html": "chat.mp3",
    "wishes.html": "wishes.mp3",
    "letters.html": "letters.mp3",
    "future.html": "future.mp3",
    "ending.html": "ending.mp3"
  };

  const currentSong = pageMusic[page];

  if (!currentSong) return;

  // ==========================================
  // AUDIO
  // ==========================================

  let audio = document.getElementById("globalMusic");

  if (!audio) {
    audio = new Audio();
    audio.id = "globalMusic";
    audio.preload = "auto";
    audio.loop = true;
  }

  audio.volume = Number(localStorage.getItem("musicVolume")) || 0.4;

  // ==========================================
  // FADE IN
  // ==========================================

  function fadeIn(target = 0.4) {
    audio.volume = 0;

    const interval = setInterval(() => {
      if (audio.volume >= target) {
        audio.volume = target;
        clearInterval(interval);
        return;
      }

      audio.volume += 0.02;
    }, 100);
  }

  // ==========================================
  // PLAY MUSIC
  // ==========================================

  const previousSong = sessionStorage.getItem("currentSong");

  if (previousSong !== currentSong) {
    audio.src = currentSong;

    const playPromise = audio.play();

    if (playPromise) {
      playPromise
        .then(() => {
          fadeIn(audio.volume || 0.4);
        })
        .catch(() => {
          console.log("Autoplay blocked until user interaction.");
        });
    }

    sessionStorage.setItem("currentSong", currentSong);
  }

  // ==========================================
  // CLICK TO START IF AUTOPLAY BLOCKED
  // ==========================================

  function unlockAudio() {
    audio.play().catch(() => {});
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
  }

  document.addEventListener("click", unlockAudio);
  document.addEventListener("touchstart", unlockAudio);

  // ==========================================
  // SAVE VOLUME
  // ==========================================

  window.setMusicVolume = function (value) {
    audio.volume = value;
    localStorage.setItem("musicVolume", value);
  };

})();

