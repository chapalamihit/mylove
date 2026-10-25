/* Our Little Story: plain JavaScript, no modules, no network requests. Works from file:// */
(function () {
  "use strict";

  /* ---- Optional music: put a file in assets/audio/ and type its name here, e.g. "assets/audio/song.mp3" ---- */
  var MUSIC_FILE = "";
  var MUSIC_VOLUME = 0.35;

  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PHOTOS = {
    portrait: { src: "assets/images/couple-portrait-1.jpeg", alt: "The two of you at a sunlit outdoor café, she rests her chin on her hand and smiles." },
    selfie1:  { src: "assets/images/couple-selfie-1.jpeg",  alt: "A close selfie of the two of you smiling." },
    selfie2:  { src: "assets/images/couple-selfie-2.jpeg",  alt: "A selfie of the two of you under a shaded roof." },
    playful:  { src: "assets/images/couple-playful.jpeg",   alt: "A playful selfie: she winks and blows a little kiss." }
  };

  /* ---- petals & stars (deterministic, light) ---- */
  var COLORS = ["#F3D6D8", "#D9949F", "#F3D6D8", "#E8B4BC"];
  document.querySelectorAll(".petals").forEach(function (box) {
    var n = parseInt(box.getAttribute("data-count"), 10) || 10;
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.className = "petal";
      s.style.left = ((i * 37 + 8) % 100) + "%";
      s.style.width = (10 + (i * 5) % 9) + "px";
      s.style.height = (8 + (i * 3) % 8) + "px";
      s.style.background = COLORS[i % 4];
      s.style.setProperty("--dur", (15 + (i * 3) % 9) + "s");
      s.style.setProperty("--delay", "-" + ((i * 2.3) % 14) + "s");
      s.style.setProperty("--drift", ((i % 2 ? 1 : -1) * (30 + (i * 11) % 70)) + "px");
      box.appendChild(s);
    }
  });
  var stars = document.querySelector(".stars");
  for (var k = 0; k < 14; k++) {
    var st = document.createElement("span");
    st.className = "star";
    st.style.left = ((k * 29 + 5) % 100) + "%";
    st.style.top = ((k * 17 + 7) % 60) + "%";
    st.style.setProperty("--delay", ((k % 5) * 0.8) + "s");
    stars.appendChild(st);
  }

  /* ---- scroll reveals (fallback: everything visible if IntersectionObserver is missing) ---- */
  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { document.documentElement.classList.add("no-io"); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- progress bar + gentle parallax ---- */
  var ticking = false;
  var bar = $("progressBar"), memory = document.querySelector(".memory"), memMedia = document.querySelector(".memory-media");
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
      if (!reduce && memory) {
        var r = memory.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom > 0 && r.top < vh) {
          var p = (vh - r.top) / (vh + r.height); /* 0..1 */
          memMedia.style.transform = "translate3d(0," + ((p - 0.5) * 8).toFixed(2) + "%,0)";
        }
      }
      ticking = false;
    });
  }

  /* ---- start ---- */
  $("openBtn").addEventListener("click", function () {
    var opening = $("opening"), story = $("story");
    opening.classList.add("leaving");
    setTimeout(function () {
      opening.hidden = true;
      document.body.classList.remove("locked");
      story.hidden = false;
      window.scrollTo(0, 0);
      requestAnimationFrame(function () { story.classList.add("show"); });
      initReveals();
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }, reduce ? 0 : 800);
    startMusic(); /* inside the click: browsers allow audio now */
  });

  /* ---- music (only after interaction; hidden if no file configured) ---- */
  var bgm = $("bgm"), musicBtn = $("musicBtn");
  function setMusicUI(on) {
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Mute music" : "Play music");
  }
  function startMusic() {
    if (!MUSIC_FILE) return;
    bgm.src = MUSIC_FILE; bgm.volume = MUSIC_VOLUME;
    musicBtn.hidden = false;
    var pr = bgm.play();
    if (pr && pr.then) pr.then(function () { setMusicUI(true); }, function () { setMusicUI(false); });
  }
  bgm.addEventListener("error", function () { musicBtn.hidden = true; });
  musicBtn.addEventListener("click", function () {
    if (bgm.paused) { bgm.play().then(function () { setMusicUI(true); }, function () {}); }
    else { bgm.pause(); setMusicUI(false); }
  });

  /* ---- lightbox ---- */
  var lb = $("lightbox"), lbImg = $("lbImg"), lbClose = $("lbClose"), lastFocus = null;
  function openLB(key) {
    var p = PHOTOS[key]; if (!p) return;
    lastFocus = document.activeElement;
    lbImg.src = p.src; lbImg.alt = p.alt;
    lb.hidden = false; document.body.style.overflow = "hidden";
    lbClose.focus();
  }
  function closeLB() {
    lb.hidden = true; document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-photo]") : null;
    if (t) openLB(t.getAttribute("data-photo"));
  });
  lb.addEventListener("click", function (e) { if (e.target !== lbImg) closeLB(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLB(); });

  /* ---- letter -> proposal ---- */
  $("moreBtn").addEventListener("click", function () {
    var prop = $("proposal");
    prop.hidden = false;
    this.hidden = true;
    setTimeout(function () { prop.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 80);
  });

  /* ---- proposal answers ---- */
  var MOMENT = "Take all the time you need. Some questions deserve a moment to feel special. ♡";
  $("momentBtn").addEventListener("click", function () { $("momentMsg").textContent = MOMENT; });

  var GLYPHS = ["❀", "♥", "✦", "✦", "❀"], PAL = ["#D9949F", "#8E304B", "#F3D6D8"];
  function celebrate() {
    if (reduce) return;
    var box = $("burst"); box.innerHTML = "";
    for (var i = 0; i < 56; i++) {
      var g = GLYPHS[i % GLYPHS.length], a = Math.random() * Math.PI * 2, d = 140 + Math.random() * 380;
      var b = document.createElement("span");
      b.className = "bit"; b.textContent = g;
      b.style.color = g === "✦" ? "#C5A36A" : PAL[Math.floor(Math.random() * 3)];
      b.style.fontSize = (14 + Math.random() * 18) + "px";
      b.style.setProperty("--x", (Math.cos(a) * d).toFixed(0) + "px");
      b.style.setProperty("--y", (Math.sin(a) * d * 0.8 - 120 + Math.random() * 240).toFixed(0) + "px");
      b.style.setProperty("--r", Math.round((Math.random() - 0.5) * 540) + "deg");
      b.style.setProperty("--t", (1.8 + Math.random() * 1.6).toFixed(2) + "s");
      box.appendChild(b);
    }
    setTimeout(function () { box.innerHTML = ""; }, 4000);
  }

  $("yesBtn").addEventListener("click", function () {
    $("askView").hidden = true;
    $("yesView").hidden = false;
    celebrate();
    $("successTitle").focus();
  });

  $("replayBtn").addEventListener("click", function () {
    $("yesView").hidden = true;
    $("askView").hidden = false;
    $("momentMsg").textContent = "";
    $("burst").innerHTML = "";
    $("proposal").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    $("yesBtn").focus({ preventScroll: true });
  });

  /* ---- share: only where the browser supports it (not on file://) ---- */
  var shareBtn = $("shareBtn");
  if (navigator.share && location.protocol !== "file:") {
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", function () {
      navigator.share({ title: document.title, text: "A little something made with love.", url: location.href }).catch(function () {});
    });
  }
})();
