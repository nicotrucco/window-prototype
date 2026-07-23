/* Window — prototype app logic. Everything stays on this device. */

(function () {
  const $ = s => document.querySelector(s);

  /* ---------- settings ---------- */
  const APP_SCHEMES = {
    Instagram: "instagram://app",
    TikTok: "tiktok://",
    X: "twitter://",
    YouTube: "youtube://",
    None: null
  };
  const DEFAULTS = { persona: "calm", phraseMode: "auto", manualPhrase: "", app: "Instagram" };
  let settings = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem("window-settings") || "{}")) };
  const saveSettings = () => localStorage.setItem("window-settings", JSON.stringify(settings));

  /* ---------- state ---------- */
  const state = { stream: null, facing: "environment", captured: false, wakeLock: null, detailId: null };

  /* ---------- tiny IndexedDB ---------- */
  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open("window-db", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("entries", { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  const dbTx = (mode, fn) => idb().then(d => new Promise((res, rej) => {
    const t = d.transaction("entries", mode);
    const out = fn(t.objectStore("entries"));
    t.oncomplete = () => res(out && out.result);
    t.onerror = () => rej(t.error);
  }));
  const dbPut = e => dbTx("readwrite", s => s.put(e));
  const dbAll = () => dbTx("readonly", s => s.getAll());
  const dbDel = id => dbTx("readwrite", s => s.delete(id));
  const dbClear = () => dbTx("readwrite", s => s.clear());

  /* ---------- screens ---------- */
  function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $("#" + id).classList.add("active");
  }

  /* ---------- streak ---------- */
  const pad = n => String(n).padStart(2, "0");
  function dstr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function updateStreak() {
    const today = dstr(new Date());
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = dstr(y);
    const s = JSON.parse(localStorage.getItem("window-streak") || "{}");
    if (s.last === today) return s.streak;
    const streak = s.last === yesterday ? (s.streak || 0) + 1 : 1;
    localStorage.setItem("window-streak", JSON.stringify({ streak, last: today }));
    return streak;
  }
  const getStreak = () => (JSON.parse(localStorage.getItem("window-streak") || "{}").streak || 0);

  /* ---------- phrases ---------- */
  function bankFor(persona, bucket) {
    const P = window.PHRASES;
    return (P[persona] && P[persona][bucket]) || (P[persona] && P[persona].default) ||
           P.calm[bucket] || P.calm.default;
  }
  function pickPhrase(bucket) {
    const recent = JSON.parse(localStorage.getItem("window-recent") || "[]");
    const bank = bankFor(settings.persona, bucket);
    const fresh = bank.filter(p => !recent.includes(p));
    const pool = fresh.length ? fresh : bank;
    const phrase = pool[Math.floor(Math.random() * pool.length)];
    localStorage.setItem("window-recent", JSON.stringify([phrase, ...recent].slice(0, 8)));
    return phrase;
  }

  /* ---------- camera ---------- */
  const video = $("#cam");
  async function startCamera() {
    stopCamera();
    $("#cam-error").classList.remove("show");
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      video.srcObject = state.stream;
      video.classList.toggle("mirror", state.facing === "user");
      await video.play();
      requestAnimationFrame(() => setTimeout(() => $("#shade").classList.add("open"), 250));
      try { state.wakeLock = await navigator.wakeLock?.request("screen"); } catch (e) {}
    } catch (e) {
      $("#shade").classList.add("open");
      $("#cam-error").classList.add("show");
    }
  }
  function stopCamera() {
    if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
    try { state.wakeLock?.release(); } catch (e) {}
  }

  /* ---------- the window moment ---------- */
  function openMoment() {
    state.captured = false;
    $("#shade").classList.remove("open");
    $("#freeze").classList.remove("show");
    $("#phrase").classList.remove("show");
    $("#scrim").classList.remove("show");
    $("#controls-after").classList.add("hidden");
    $("#pickbar").classList.add("hidden");
    $("#controls-capture").classList.remove("hidden");
    const now = new Date();
    $("#stamp").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())} · today`;
    show("moment");
    startCamera();
    window.warmClassifier();
  }

  function grabFrame() {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w) return null;
    const max = 1080, scale = Math.min(1, max / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    const ctx = c.getContext("2d");
    if (state.facing === "user") { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, c.width, c.height);
    return c;
  }

  async function capture() {
    const canvas = grabFrame();
    if (!canvas) return;
    state.captured = true;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const freeze = $("#freeze");
    freeze.src = dataUrl; freeze.classList.add("show");
    $("#controls-capture").classList.add("hidden");

    const bucket = await window.classifyCanvas(canvas);

    if (settings.phraseMode === "manual" && !settings.manualPhrase.trim()) {
      showPickbar(bucket, phrase => landPhrase(phrase, bucket, dataUrl));
      return;
    }
    const phrase = settings.phraseMode === "manual"
      ? settings.manualPhrase.trim()
      : pickPhrase(bucket);
    landPhrase(phrase, bucket, dataUrl);
  }

  function landPhrase(phrase, bucket, dataUrl) {
    $("#pickbar").classList.add("hidden");
    $("#phrase-text").textContent = phrase;
    $("#scrim").classList.add("show");
    $("#phrase").classList.add("show");
    dbPut({
      id: Date.now(), createdAt: new Date().toISOString(),
      dataUrl, bucket, phrase, persona: settings.persona, app: settings.app
    });
    updateStreak();
    const cont = $("#btn-continue");
    if (settings.app !== "None") {
      cont.textContent = `Continue to ${settings.app}`;
      cont.classList.remove("hidden");
    } else cont.classList.add("hidden");
    setTimeout(() => $("#controls-after").classList.remove("hidden"), 1100);
  }

  function showPickbar(bucket, onPick) {
    const chips = $("#pickbar-chips");
    chips.innerHTML = "";
    const opts = [...new Set([...bankFor(settings.persona, bucket), ...bankFor(settings.persona, "default")])].slice(0, 8);
    opts.forEach(p => {
      const b = document.createElement("button");
      b.className = "chip"; b.textContent = p;
      b.onclick = () => onPick(p);
      chips.appendChild(b);
    });
    $("#pickbar").classList.remove("hidden");
  }

  function retake() {
    state.captured = false;
    $("#freeze").classList.remove("show");
    $("#phrase").classList.remove("show");
    $("#scrim").classList.remove("show");
    $("#controls-after").classList.add("hidden");
    $("#pickbar").classList.add("hidden");
    $("#controls-capture").classList.remove("hidden");
  }

  function goHome() {
    stopCamera();
    refreshHome();
    show("home");
  }

  /* ---------- home ---------- */
  async function refreshHome() {
    $("#streak-n").textContent = getStreak();
    const all = await dbAll();
    const n = all.length;
    $("#total-n").textContent = `${n} window${n === 1 ? "" : "s"} opened`;
    $("#persona-now").textContent = settings.persona;
  }

  /* ---------- archive ---------- */
  async function openArchive() {
    const all = (await dbAll()).sort((a, b) => b.id - a.id);
    const grid = $("#archive-grid");
    grid.innerHTML = "";
    $("#archive-empty").classList.toggle("hidden", all.length > 0);
    all.forEach(e => {
      const d = new Date(e.createdAt);
      const el = document.createElement("div");
      el.className = "thumb";
      el.innerHTML = `
        <div class="winframe"><div class="glass">
          <img src="${e.dataUrl}" alt="">
          <div class="mull mull-v"></div><div class="mull mull-h"></div>
        </div></div>
        <p class="thumb-date">${d.getDate()}/${d.getMonth() + 1} · ${pad(d.getHours())}:${pad(d.getMinutes())}</p>`;
      el.onclick = () => openDetail(e);
      grid.appendChild(el);
    });
    show("archive");
  }

  function openDetail(e) {
    state.detailId = e.id;
    $("#detail-img").src = e.dataUrl;
    $("#detail-phrase").textContent = e.phrase;
    const d = new Date(e.createdAt);
    $("#detail-meta").textContent = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${e.persona} · ${e.bucket}`;
    $("#detail").classList.remove("hidden");
  }

  async function shareDetail() {
    const e = (await dbAll()).find(x => x.id === state.detailId);
    if (!e) return;
    try {
      const blob = await (await fetch(e.dataUrl)).blob();
      const file = new File([blob], "window.jpg", { type: "image/jpeg" });
      await navigator.share({ files: [file], text: `${e.phrase} — window` });
    } catch (err) { /* user cancelled or unsupported */ }
  }

  /* ---------- settings sheet ---------- */
  function renderChips(sel, items, current, onPick) {
    const box = $(sel);
    box.innerHTML = "";
    items.forEach(it => {
      const b = document.createElement("button");
      b.className = "chip" + (it === current ? " on" : "");
      b.textContent = it;
      b.onclick = () => { onPick(it); renderSettings(); };
      box.appendChild(b);
    });
  }
  function renderSettings() {
    renderChips("#persona-chips", window.PERSONAS, settings.persona, v => { settings.persona = v; saveSettings(); refreshHome(); });
    renderChips("#app-chips", Object.keys(APP_SCHEMES), settings.app, v => { settings.app = v; saveSettings(); });
    document.querySelectorAll("#mode-chips .chip").forEach(c => {
      c.classList.toggle("on", c.dataset.mode === settings.phraseMode);
      c.onclick = () => { settings.phraseMode = c.dataset.mode; saveSettings(); renderSettings(); };
    });
    $("#manual-box").classList.toggle("hidden", settings.phraseMode !== "manual");
    $("#manual-phrase").value = settings.manualPhrase;
    const sug = $("#suggest-chips");
    sug.innerHTML = "";
    const P = window.PHRASES[settings.persona] || window.PHRASES.calm;
    const lines = [...new Set(Object.values(P).flat())].sort(() => Math.random() - .5).slice(0, 6);
    lines.forEach(p => {
      const b = document.createElement("button");
      b.className = "chip"; b.textContent = p;
      b.onclick = () => { settings.manualPhrase = p; saveSettings(); renderSettings(); };
      sug.appendChild(b);
    });
  }
  function openSettings() { renderSettings(); $("#sheet-back").classList.remove("hidden"); $("#settings-sheet").classList.add("open"); }
  function closeSettings() { $("#sheet-back").classList.add("hidden"); $("#settings-sheet").classList.remove("open"); }

  /* ---------- wire up ---------- */
  $("#splash").onclick = openMoment;
  $("#btn-capture").onclick = capture;
  $("#btn-skip").onclick = goHome;
  $("#btn-flip").onclick = () => { state.facing = state.facing === "user" ? "environment" : "user"; startCamera(); };
  $("#btn-retry-cam").onclick = () => startCamera();
  $("#btn-retake").onclick = retake;
  $("#btn-done").onclick = goHome;
  $("#btn-continue").onclick = () => {
    const scheme = APP_SCHEMES[settings.app];
    if (scheme) location.href = scheme;
    setTimeout(goHome, 500);
  };
  $("#btn-open").onclick = openMoment;
  $("#btn-archive").onclick = openArchive;
  $("#btn-archive-back").onclick = goHome;
  $("#btn-detail-close").onclick = () => $("#detail").classList.add("hidden");
  $("#btn-share").onclick = shareDetail;
  $("#btn-delete").onclick = async () => {
    await dbDel(state.detailId);
    $("#detail").classList.add("hidden");
    openArchive();
  };
  $("#btn-settings").onclick = openSettings;
  $("#sheet-back").onclick = closeSettings;
  $("#manual-phrase").oninput = e => { settings.manualPhrase = e.target.value; saveSettings(); };
  $("#btn-clear").onclick = async () => {
    if (confirm("delete every window? this can't be undone.")) { await dbClear(); refreshHome(); closeSettings(); }
  };

  /* keep camera alive when returning from background */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" &&
        $("#moment").classList.contains("active") && !state.captured) {
      startCamera();
    }
  });

  /* ---------- boot ---------- */
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  refreshHome();
})();
