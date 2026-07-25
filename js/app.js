/* Window — prototype app logic. Everything stays on this device.
   (Except browser speech recognition — see js/voice.js. Filming rig only.)

   The camera stage is permanent: there is no "home screen". The phone is the
   window for the whole session, and every surface floats over the live view. */

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
  const TIMER_OPTIONS = [5, 10, 15, 30, 45];
  const DEFAULTS = { phraseMode: "auto", manualPhrase: "", app: "Instagram", timer: 15, panes: "fade" };
  let settings = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem("window-settings") || "{}")) };
  const saveSettings = () => localStorage.setItem("window-settings", JSON.stringify(settings));

  /* ---------- state ---------- */
  const state = {
    stream: null, facing: "environment", captured: false,
    wakeLock: null, detailId: null, lastEntry: null,
    pendingArm: null, pendingHours: null, devRoll: null,
    tick: null, opened: false, mode: "app"
  };

  /* ---------- the two looks ----------
     app     you opened it — set scene, set timer
     window  it opened on you — photo or skip, a phrase, gone

     Mode comes off the URL so the shield (or a Shortcuts automation, or a
     second home-screen icon) can deep-link straight into the blocker:
       index.html?mode=window   ·   index.html#window                        */
  function readMode() {
    const q = new URLSearchParams(location.search).get("mode");
    if (q === "window" || q === "app") return q;
    const h = location.hash.replace("#", "");
    if (h === "window" || h === "app") return h;
    /* Default depends on where it's running. The deployed build is the filming
       rig on the phone, so it lands straight in the window moment. localhost is
       the workbench, so it opens the whole app. ?mode= overrides either way. */
    const local = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)$/i.test(location.hostname);
    return local ? "app" : "window";
  }
  function setMode(m) {
    state.mode = m;
    document.body.dataset.mode = m;
  }

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

  /* ---------- panels float over the permanent stage ---------- */
  function openPanel(id) {
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    if (id) $("#" + id).classList.add("active");
  }
  const closePanels = () => openPanel(null);

  /* ---------- scene accent drives the whole UI ---------- */
  function paintScene() {
    document.documentElement.style.setProperty(
      "--scene", window.Scenes.accent(window.Scenes.activeScene())
    );
  }

  /* ---------- streak ---------- */
  const pad = n => String(n).padStart(2, "0");
  const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function dayBefore(s) {
    const d = new Date(s + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return dstr(d);
  }
  function bumpStreak() {
    const today = dstr(new Date());
    const s = JSON.parse(localStorage.getItem("window-streak") || "{}");
    if (s.last === today) return s.streak;
    const streak = s.last === dayBefore(today) ? (s.streak || 0) + 1 : 1;
    localStorage.setItem("window-streak", JSON.stringify({ streak, last: today }));
    return streak;
  }
  /* a streak you stopped feeding is not a streak — decay it on read */
  function getStreak() {
    const s = JSON.parse(localStorage.getItem("window-streak") || "{}");
    if (!s.last) return 0;
    const today = dstr(new Date());
    return (s.last === today || s.last === dayBefore(today)) ? (s.streak || 0) : 0;
  }

  /* ---------- phrases ---------- */
  function bankFor(scene, bucket) {
    const P = window.PHRASES;
    const S = P[scene] || P[window.FALLBACK_SCENE];
    return S[bucket] || S.default || P[window.FALLBACK_SCENE].default;
  }
  /* recent memory is per scene and never larger than half the bank,
     or `fresh` empties and lines repeat inside one filming session */
  function pickPhrase(bucket) {
    const scene = window.Scenes.activeScene();
    const key = "window-recent-" + scene;
    const recent = JSON.parse(localStorage.getItem(key) || "[]");
    const bank = bankFor(scene, bucket);
    const keep = Math.max(2, Math.floor(bank.length / 2));
    const fresh = bank.filter(p => !recent.includes(p));
    const pool = fresh.length ? fresh : bank;
    const phrase = pool[Math.floor(Math.random() * pool.length)];
    localStorage.setItem(key, JSON.stringify([phrase, ...recent].slice(0, keep)));
    return phrase;
  }

  /* ---------- the panes ----------
     crossfades the photographed frame to the variant with the mullions cut
     away, so the window genuinely opens out instead of fading CSS bars. */
  function setPanes(gone) {
    document.querySelector(".window")
      .classList.toggle("open", gone && settings.panes === "fade");
  }

  /* ---------- camera ---------- */
  const video = $("#cam");
  async function startCamera(withShade) {
    stopCamera();
    $("#cam-error").classList.remove("show");
    if (withShade) { $("#shade").classList.remove("open"); setPanes(false); }
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      video.srcObject = state.stream;
      video.classList.toggle("mirror", state.facing === "user");
      await video.play();
      requestAnimationFrame(() => setTimeout(() => {
        $("#shade").classList.add("open");
        /* the panes announce the window, then get out of the way of the view */
        setTimeout(() => setPanes(true), 1150);
      }, 200));
      try { state.wakeLock = await navigator.wakeLock?.request("screen"); } catch (e) {}
      return true;
    } catch (e) {
      $("#shade").classList.add("open");
      $("#cam-error").classList.add("show");
      return false;
    }
  }
  function stopCamera() {
    if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
    try { state.wakeLock?.release(); } catch (e) {}
    state.wakeLock = null;
  }

  /* ---------- opening ----------
     Try to go straight into the live window. Browsers only demand a user
     gesture for the camera when permission hasn't been granted yet, so on
     every run after the first this opens with no tap at all — which is the
     whole point of the blocker: it opens ON you, it doesn't ask.

     (The old check used navigator.permissions.query({name:"camera"}), which
     Safari doesn't implement — it rejects, so the veil never lifted.) */
  async function openWindow(fromTap) {
    if (state.opened) return;

    const ok = await startCamera(true);
    if (!ok && !fromTap) {
      /* needs a gesture — put it back the way it was and wait for the tap */
      $("#shade").classList.remove("open");
      $("#cam-error").classList.remove("show");
      return;
    }

    state.opened = true;
    $("#veil").classList.add("gone");
    $("#hud").classList.add("up");
    resetCaptureUI();
    window.warmClassifier();
    refreshHud();
  }

  function resetCaptureUI() {
    state.captured = false;
    state.lastEntry = null;
    document.body.classList.remove("shot");
    $("#freeze").classList.remove("show");
    $("#phrase").classList.remove("show");
    $("#scrim").classList.remove("show");
    $("#hud-after").classList.add("hidden");
    $("#pickbar").classList.add("hidden");
    const now = new Date();
    $("#stamp").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())} · today`;
  }

  /* ---------- capture ---------- */
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

  function fireFlash() {
    const f = $("#flash");
    f.classList.remove("fire");
    void f.offsetWidth;                 /* restart the animation */
    f.classList.add("fire");
    try { navigator.vibrate && navigator.vibrate(12); } catch (e) {}  /* no-op on iOS */
  }

  async function capture() {
    const canvas = grabFrame();
    if (!canvas) return;
    state.captured = true;
    fireFlash();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const freeze = $("#freeze");
    freeze.src = dataUrl; freeze.classList.add("show");
    document.body.classList.add("shot");

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

    const armed = window.Scenes.current();
    const entry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      dataUrl, bucket, phrase,
      scene: window.Scenes.activeScene(),
      rollId: armed ? armed.rollId : null,
      app: settings.app
    };
    state.lastEntry = entry;
    dbPut(entry).then(refreshHud);
    bumpStreak();

    /* during a scene the photo is locked away — no lingering */
    $("#saved-note").textContent = armed
      ? "locked until your scene ends"
      : "saved · stays on this device";
    $("#btn-share-now").classList.toggle("hidden", !!armed);

    const cont = $("#btn-continue");
    if (settings.app !== "None") {
      cont.textContent = `continue to ${settings.app.toLowerCase()}`;
      cont.classList.remove("hidden");
    } else cont.classList.add("hidden");

    setTimeout(() => $("#hud-after").classList.remove("hidden"), 1100);
  }

  function showPickbar(bucket, onPick) {
    const chips = $("#pickbar-chips");
    chips.innerHTML = "";
    const scene = window.Scenes.activeScene();
    const opts = [...new Set([...bankFor(scene, bucket), ...bankFor(scene, "default")])].slice(0, 10);
    opts.forEach(p => {
      const b = document.createElement("button");
      b.className = "chip"; b.textContent = p;
      b.onclick = () => onPick(p);
      chips.appendChild(b);
    });
    $("#pickbar").classList.remove("hidden");
  }

  function retake() {
    resetCaptureUI();
    $("#freeze").classList.remove("show");
  }

  /* hand the user back to whatever they were reaching for */
  function leaveToApp() {
    const scheme = APP_SCHEMES[settings.app];
    if (scheme) location.href = scheme;
    setTimeout(() => { setMode("app"); backToWindow(); }, 500);
  }

  /* back to the live window */
  function backToWindow() {
    closePanels();
    resetCaptureUI();
    if (!state.stream) startCamera(false);
    refreshHud();
  }

  /* ---------- the HUD ---------- */
  async function refreshHud() {
    paintScene();
    const armed = window.Scenes.current();

    const sq = $("#btn-set-scene");
    $("#sq-scene-v").textContent = armed ? window.Scenes.label(armed.scene) : "none";
    sq.querySelector(".sq-k").textContent = armed ? window.Scenes.remainingLabel() : "set scene";
    sq.classList.toggle("on", !!armed);

    $("#sq-timer-v").textContent = `${settings.timer} min`;

    const all = (await dbAll()).sort((a, b) => b.id - a.id);
    const visible = armed ? all.filter(e => e.rollId !== armed.rollId) : all;
    const img = $("#lastpic-img");
    if (visible.length) {
      img.src = visible[0].dataUrl;
      img.classList.add("show");
    } else {
      img.classList.remove("show");
      img.removeAttribute("src");
    }
  }

  function startTick() {
    clearInterval(state.tick);
    state.tick = setInterval(() => {
      const armed = window.Scenes.current();
      const shown = $("#btn-set-scene").classList.contains("on");
      if (armed || shown) { refreshHud(); renderScenes(); }
    }, 20000);
  }

  /* ---------- scenes ---------- */
  function renderScenes() {
    if (!$("#scene-list")) return;
    paintScene();
    const list = $("#scene-list");
    list.innerHTML = "";
    const armed = window.Scenes.current();

    window.ARMABLE_SCENES.forEach(key => {
      const s = window.SCENES[key];
      const on = armed && armed.scene === key;
      const row = document.createElement("button");
      row.className = "scene-row" + (on ? " on" : "");
      row.innerHTML = `
        <span class="scene-dot" style="background:${s.accent}"></span>
        <span class="scene-copy">
          <span class="scene-name">${s.label}</span>
          <span class="scene-blurb">${s.blurb}</span>
        </span>
        <span class="scene-state">${on ? window.Scenes.remainingLabel() : "start"}</span>`;
      row.onclick = () => on ? confirmDisarm() : openArmSheet(key);
      list.appendChild(row);
    });
  }

  function openScenes() {
    renderScenes();
    resetVoiceUI();
    openPanel("scenes");
  }

  function openArmSheet(key) {
    state.pendingArm = key;
    const s = window.SCENES[key];
    $("#arm-title").textContent = s.label;
    $("#arm-blurb").textContent = s.blurb;
    document.documentElement.style.setProperty("--scene", s.accent);

    const box = $("#arm-duration");
    box.innerHTML = "";
    const opts = [
      { label: `${s.defaultHours}h`, hours: s.defaultHours },
      { label: "1h", hours: 1 },
      { label: "3h", hours: 3 },
      { label: "until I turn it off", hours: null }
    ];
    const seen = new Set();
    const uniq = opts.filter(o => {
      const k = String(o.hours);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    state.pendingHours = uniq[0].hours;
    uniq.forEach((o, i) => {
      const b = document.createElement("button");
      b.className = "chip" + (i === 0 ? " on" : "");
      b.textContent = o.label;
      b.onclick = () => {
        state.pendingHours = o.hours;
        [...box.children].forEach(c => c.classList.remove("on"));
        b.classList.add("on");
      };
      box.appendChild(b);
    });

    $("#arm-back").classList.remove("hidden");
    $("#arm-sheet").classList.add("open");
  }
  function closeArmSheet() {
    $("#arm-back").classList.add("hidden");
    $("#arm-sheet").classList.remove("open");
    state.pendingArm = null;
    paintScene();
  }
  function doArm() {
    if (!state.pendingArm) return;
    window.Scenes.arm(state.pendingArm, state.pendingHours);
    closeArmSheet();
    renderScenes();
    backToWindow();
  }

  /* light friction on the way out — never a trap */
  function confirmDisarm() {
    const armed = window.Scenes.current();
    if (!armed) return;
    if (!confirm(`end your ${window.Scenes.label(armed.scene)} scene?\n\nyour photos will develop now.`)) return;
    const done = window.Scenes.disarm();
    renderScenes();
    refreshHud();
    if (done) developRoll(done);
  }

  /* ---------- develop the roll ---------- */
  async function developRoll(roll) {
    const all = (await dbAll()).filter(e => e.rollId === roll.rollId).sort((a, b) => a.id - b.id);
    if (!all.length) return;

    state.devRoll = { entries: all, scene: roll.scene };
    $("#dev-title").textContent = `the ${window.Scenes.label(roll.scene)} roll`;
    $("#dev-count").textContent = `${all.length} window${all.length === 1 ? "" : "s"}`;
    document.documentElement.style.setProperty("--scene", window.Scenes.accent(roll.scene));

    const grid = $("#dev-grid");
    grid.innerHTML = "";
    all.slice(0, 9).forEach((e, i) => {
      const el = document.createElement("div");
      el.className = "winframe";
      el.style.animationDelay = (i * 90) + "ms";
      el.innerHTML = `<div class="glass">
          <img src="${e.dataUrl}" alt="">
          <div class="mull mull-v"></div><div class="mull mull-h"></div>
        </div>`;
      grid.appendChild(el);
    });
    $("#develop").classList.remove("hidden");
  }

  /* ---------- archive ---------- */
  async function openArchive() {
    const armed = window.Scenes.current();
    const all = (await dbAll()).sort((a, b) => b.id - a.id);
    const visible = armed ? all.filter(e => e.rollId !== armed.rollId) : all;
    const lockedCount = all.length - visible.length;

    const st = getStreak();
    $("#head-streak").textContent = st ? `${st} day streak` : "";

    $("#archive-locked").classList.toggle("hidden", !armed || !lockedCount);
    if (armed) $("#locked-scene").textContent = window.Scenes.label(armed.scene);

    const grid = $("#archive-grid");
    grid.innerHTML = "";
    $("#archive-empty").classList.toggle("hidden", visible.length > 0 || !!lockedCount);

    visible.forEach(e => {
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
    openPanel("archive");
  }

  function openDetail(e) {
    state.detailId = e.id;
    $("#detail-img").src = e.dataUrl;
    $("#detail-phrase").textContent = e.phrase;
    const d = new Date(e.createdAt);
    $("#detail-meta").textContent =
      `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${window.Scenes.label(e.scene || "everyday")} · ${e.bucket}`;
    $("#detail").classList.remove("hidden");
  }

  /* ---------- sharing (composited, not the bare photo) ---------- */
  async function shareEntry(entry) {
    if (!entry) return;
    try {
      const canvas = await window.Compose.moment(entry);
      await window.Compose.shareCanvas(canvas, `${entry.phrase} — window`, "window.jpg");
    } catch (e) {}
  }
  async function shareDetail() {
    const e = (await dbAll()).find(x => x.id === state.detailId);
    shareEntry(e);
  }
  async function shareRoll() {
    if (!state.devRoll) return;
    try {
      const canvas = await window.Compose.roll(state.devRoll.entries, state.devRoll.scene);
      await window.Compose.shareCanvas(
        canvas, `the ${window.Scenes.label(state.devRoll.scene)} roll — window`, "window-roll.jpg");
    } catch (e) {}
  }

  /* ---------- voice arming ---------- */
  function resetVoiceUI() {
    const mic = $("#btn-mic");
    mic.classList.remove("live");
    mic.classList.toggle("dead", !window.Voice.supported());
    $("#voice-heard").textContent = "";
    $("#voice-prompt").textContent = window.Voice.supported()
      ? "tap and say “i'm going out”"
      : "voice needs safari or chrome — tap a scene below";
  }

  function startVoice() {
    if (!window.Voice.supported()) return;
    if (window.Voice.isRunning()) { window.Voice.stop(); return; }
    const mic = $("#btn-mic");
    window.Voice.listen(
      (scene, transcript, isFinal) => {
        $("#voice-heard").textContent = transcript ? `“${transcript}”` : "";
        if (scene) {
          mic.classList.remove("live");
          $("#voice-prompt").textContent = `${window.Scenes.label(scene)} —`;
          setTimeout(() => openArmSheet(scene), 420);
        } else if (isFinal && transcript) {
          $("#voice-prompt").textContent = "didn't catch a scene — try again";
        }
      },
      (st, msg) => {
        if (st === "listening") {
          mic.classList.add("live");
          $("#voice-prompt").textContent = "listening…";
          $("#voice-heard").textContent = "";
        } else {
          mic.classList.remove("live");
          if (st === "error") $("#voice-prompt").textContent = msg || "try again";
        }
      }
    );
  }

  /* ---------- timer sheet ---------- */
  function openTimer() {
    const box = $("#timer-chips");
    box.innerHTML = "";
    TIMER_OPTIONS.forEach(m => {
      const b = document.createElement("button");
      b.className = "chip" + (m === settings.timer ? " on" : "");
      b.textContent = `${m} min`;
      b.onclick = () => {
        settings.timer = m; saveSettings();
        [...box.children].forEach(c => c.classList.remove("on"));
        b.classList.add("on");
        refreshHud();
      };
      box.appendChild(b);
    });
    $("#timer-back").classList.remove("hidden");
    $("#timer-sheet").classList.add("open");
  }
  function closeTimer() {
    $("#timer-back").classList.add("hidden");
    $("#timer-sheet").classList.remove("open");
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
    const sup = $("#voice-support");
    sup.textContent = window.Voice.supported() ? "available" : "unsupported here";
    sup.classList.toggle("ok", window.Voice.supported());

    renderChips("#app-chips", Object.keys(APP_SCHEMES), settings.app, v => { settings.app = v; saveSettings(); });

    document.querySelectorAll("#mode-chips .chip").forEach(c => {
      c.classList.toggle("on", c.dataset.mode === settings.phraseMode);
      c.onclick = () => { settings.phraseMode = c.dataset.mode; saveSettings(); renderSettings(); };
    });
    document.querySelectorAll("#pane-chips .chip").forEach(c => {
      c.classList.toggle("on", c.dataset.panes === settings.panes);
      c.onclick = () => {
        settings.panes = c.dataset.panes; saveSettings(); renderSettings();
        setPanes(settings.panes === "fade");
      };
    });

    $("#manual-box").classList.toggle("hidden", settings.phraseMode !== "manual");
    $("#manual-phrase").value = settings.manualPhrase;

    const sug = $("#suggest-chips");
    sug.innerHTML = "";
    const P = window.PHRASES[window.Scenes.activeScene()] || window.PHRASES.everyday;
    const lines = [...new Set(Object.values(P).flat())].sort(() => Math.random() - .5).slice(0, 8);
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
  $("#veil").onclick = () => openWindow(true);

  $("#btn-capture").onclick = capture;
  /* skip is the friendly part of friendly friction: it always lets you through */
  $("#btn-skip").onclick = leaveToApp;
  $("#btn-retry-cam").onclick = () => startCamera(false);
  $("#btn-retake").onclick = retake;
  $("#btn-done").onclick = backToWindow;
  $("#btn-share-now").onclick = () => shareEntry(state.lastEntry);
  $("#btn-continue").onclick = leaveToApp;

  $("#btn-set-scene").onclick = openScenes;
  $("#btn-set-timer").onclick = openTimer;
  $("#btn-lastpic").onclick = openArchive;
  $("#btn-settings").onclick = openSettings;
  $("#btn-as-blocker").onclick = () => {
    closeSettings();
    setMode("window");
    backToWindow();
  };

  $("#btn-scenes-back").onclick = backToWindow;
  $("#btn-mic").onclick = startVoice;
  $("#btn-arm-go").onclick = doArm;
  $("#btn-arm-cancel").onclick = closeArmSheet;
  $("#arm-back").onclick = closeArmSheet;

  $("#btn-timer-done").onclick = closeTimer;
  $("#timer-back").onclick = closeTimer;

  $("#btn-archive-back").onclick = backToWindow;
  $("#btn-detail-close").onclick = () => $("#detail").classList.add("hidden");
  $("#btn-share").onclick = shareDetail;
  $("#btn-delete").onclick = async () => {
    await dbDel(state.detailId);
    $("#detail").classList.add("hidden");
    openArchive();
    refreshHud();
  };

  $("#btn-share-roll").onclick = shareRoll;
  $("#btn-dev-close").onclick = () => { $("#develop").classList.add("hidden"); refreshHud(); };

  $("#sheet-back").onclick = closeSettings;
  $("#manual-phrase").oninput = e => { settings.manualPhrase = e.target.value; saveSettings(); };
  $("#btn-clear").onclick = async () => {
    if (confirm("delete every window? this can't be undone.")) {
      await dbClear(); refreshHud(); closeSettings();
    }
  };

  /* the camera dies in the background — bring it back on return */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (state.opened && !state.captured && !document.querySelector(".panel.active")) {
        startCamera(false);
      }
      refreshHud();
    } else {
      window.Voice.stop();
      stopCamera();
    }
  });

  /* ---------- boot ---------- */
  const BUILD = "v5";

  if ("serviceWorker" in navigator) {
    /* updateViaCache:"none" stops Safari serving a stale sw.js out of the HTTP
       cache, which is how an installed PWA ends up never noticing a new build */
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
      .then(reg => reg.update())
      .catch(() => {});

    /* when a new worker takes over, reload once so the page isn't left running
       half the old build — guarded so it can't loop */
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
  }

  setMode(readMode());
  paintScene();
  refreshHud();
  startTick();

  /* so "is this the new build?" is answerable at a glance instead of guessed */
  $("#build-stamp").textContent = `${BUILD} · ${state.mode}`;
  console.log("[window] build " + BUILD + " · mode " + state.mode);

  /* open straight into the live window; the veil only stays up if the browser
     insists on a gesture, and then one tap does it */
  openWindow(false);
})();
