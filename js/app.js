/* Window — prototype app logic. Everything stays on this device.
   (Except browser speech recognition — see js/voice.js. Filming rig only.)

   0016 changed the shape of the app: home is a readout over the void, and the
   camera only goes live when the window is actually opened — instrument before
   the shutter, broadsheet after it, the contact sheet for the archive. */

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
  const DEFAULTS = { app: "Instagram", timer: 15, panes: "fade", director: false, loop: false };

  /* ---------- the roll (0017) ----------
     24 frames. It fills, it never breaks — miss a day and nothing is taken
     away, the roll simply doesn't grow. Completion is the pull, not fear. */
  const ROLL_SIZE = 24;
  const getRoll = () => {
    const n = parseInt(localStorage.getItem("window-roll-n") || "0", 10);
    return { n: isNaN(n) ? 0 : n % ROLL_SIZE, no: Math.floor((isNaN(n) ? 0 : n) / ROLL_SIZE) + 1, raw: isNaN(n) ? 0 : n };
  };
  const bumpRoll = () => {
    const r = getRoll();
    localStorage.setItem("window-roll-n", String(r.raw + 1));
    return getRoll();
  };
  const resetRoll = () => localStorage.setItem("window-roll-n", "0");
  let settings = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem("window-app-settings") || "{}")) };
  const saveSettings = () => localStorage.setItem("window-app-settings", JSON.stringify(settings));

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

     Mode comes off the URL so the shield can deep-link straight into the
     blocker: index.html?mode=window  ·  index.html#window                   */
  /* The shipping app opens as the app. The blocker is something that happens
     TO you, so it only ever arrives via the shield's deep link. */
  function readMode() {
    const q = new URLSearchParams(location.search).get("mode");
    if (q === "window" || q === "app") return q;
    const h = location.hash.replace("#", "");
    if (h === "window" || h === "app") return h;
    return "app";
  }
  function setMode(m) {
    state.mode = m;
    document.body.dataset.mode = m;
    /* belt and braces: the [data-mode] CSS alone lost on a real device —
       core-app ghosted into window mode — so the mode is enforced here too.
       .hidden carries !important and cannot be out-cascaded. */
    $("#core-app").classList.toggle("hidden", m !== "app");
    $("#core-window").classList.toggle("hidden", m !== "window");
    renderPickbar();
    renderIBar();
  }

  /* ---------- tiny IndexedDB ---------- */
  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open("window-app-db", 1);
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
    const s = JSON.parse(localStorage.getItem("window-app-streak") || "{}");
    if (s.last === today) return s.streak;
    const streak = s.last === dayBefore(today) ? (s.streak || 0) + 1 : 1;
    localStorage.setItem("window-app-streak", JSON.stringify({ streak, last: today }));
    return streak;
  }
  /* a streak you stopped feeding is not a streak — decay it on read */
  function getStreak() {
    const s = JSON.parse(localStorage.getItem("window-app-streak") || "{}");
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
  /* ---------- director mode (0002) ----------
     filming affordance, not a user feature. auto-detection is non-deterministic
     and you cannot shoot a take you can't repeat, so this pins one line and
     returns it every capture until it's unpinned. */
  let pinned = null;

  function renderPickbar() {
    const bar = $("#pickbar");
    if (!bar) return;
    if (!settings.director || state.mode !== "window") {
      bar.classList.add("hidden");
      return;
    }
    bar.classList.remove("hidden");

    const scene = window.Scenes.activeScene();
    /* before capture we don't know what the camera will see, so offer the
       scene's default bank — that's what a repeatable take needs anyway */
    const bank = bankFor(scene, "default");
    const list = $("#pickbar-list");
    list.innerHTML = "";

    const shuffle = document.createElement("button");
    shuffle.className = "chip" + (pinned ? "" : " on");
    shuffle.textContent = UI.t("random");
    shuffle.onclick = () => { pinned = null; renderPickbar(); };
    list.appendChild(shuffle);

    bank.forEach(p => {
      const b = document.createElement("button");
      b.className = "chip" + (p === pinned ? " on" : "");
      b.textContent = p;
      b.onclick = () => { pinned = (pinned === p ? null : p); renderPickbar(); };
      list.appendChild(b);
    });

    $("#pickbar-label").textContent = pinned
      ? UI.f("pinned_scene", window.Scenes.label(scene))
      : UI.f("director_scene", window.Scenes.label(scene));
  }

  /* recent memory is per scene and never larger than half the bank,
     or `fresh` empties and lines repeat inside one filming session */
  function pickPhrase(bucket) {
    if (settings.director && pinned) return pinned;
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
     Home is a readout over the void — no camera. The blocker deep link
     (?mode=window) still goes straight for the live window, because the
     blocker opens ON you, it doesn't ask.

     (Don't gate this on navigator.permissions.query({name:"camera"}) — Safari
     doesn't implement it, so the promise rejects and the veil never lifts.) */
  async function openWindow(fromTap) {
    if (state.opened) return;

    if (state.mode === "window") {
      const ok = await startCamera(true);
      if (!ok && !fromTap) {
        /* needs a gesture — put it back the way it was and wait for the tap */
        $("#shade").classList.remove("open");
        $("#cam-error").classList.remove("show");
        return;
      }
    }

    state.opened = true;
    $("#veil").classList.add("gone");
    /* the HUD rises only after the veil has actually cleared — WebKit was
       compositing the HUD's backdrop-filter layers over the veil on device */
    setTimeout(() => $("#hud").classList.add("up"), 900);
    resetCaptureUI();
    window.warmClassifier();
    refreshHud();
  }

  /* day names moved into the string table — see js/i18n.js */
  function resetCaptureUI() {
    state.captured = false;
    state.lastEntry = null;
    document.body.classList.remove("shot");
    $("#freeze").classList.remove("show");
    $("#phrase").classList.remove("show");
    $("#scrim").classList.remove("show");
    $("#hud-after").classList.add("hidden");
    const now = new Date();
    $("#stamp").textContent = `${UI.day(now.getDay())} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    renderIBar();
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
    landPhrase(pickPhrase(bucket), bucket, dataUrl);
  }

  function landPhrase(phrase, bucket, dataUrl) {
    $("#phrase-text").textContent = phrase;
    /* 0016/0017 — the folio numbers the window, and the roll fills. */
    const scene = window.Scenes.activeScene();
    const r = bumpRoll();
    const shot = r.n === 0 ? ROLL_SIZE : r.n;
    $("#folio").textContent = scene && scene !== "everyday"
      ? UI.f("folio_scene", window.Scenes.label(scene), shot, ROLL_SIZE)
      : UI.f("folio", shot, ROLL_SIZE);
    renderRollBar();
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
    $("#saved-note").textContent = UI.t(armed ? "locked_note" : "saved_note");
    $("#btn-share-now").classList.toggle("hidden", !!armed);

    /* 0017 — "stay outside" is the primary now; the way back stays available
       but stops shouting. 0003: the exit can never be a trap, so this button
       is never removed for pressure, only for having nowhere to go. */
    const cont = $("#btn-continue");
    if (settings.app !== "None") {
      cont.textContent = UI.f("continue_to", settings.app.toLowerCase());
      cont.classList.remove("hidden");
    } else cont.classList.add("hidden");
    $("#btn-done").textContent = UI.t("stay_outside");

    setTimeout(() => $("#hud-after").classList.remove("hidden"), 1100);

    /* rehearse — the moment on repeat, hands-free, so takes can be shot back
       to back without touching the phone. Filming rig only. */
    if (settings.loop) {
      clearTimeout(state.loopT);
      state.loopT = setTimeout(() => {
        if (!settings.loop || state.mode !== "window") return;
        resetCaptureUI();
        startCamera(true);
        setTimeout(() => {
          $("#shade").classList.add("open");
          setPanes(true);
        }, 420);
      }, 4200);
    }

    /* 0017 — frame 24 finishes the roll and it develops, right here. this
       outranks the rehearse loop: a finished roll is the bigger moment. */
    if (r.raw > 0 && r.n === 0) {
      clearTimeout(state.loopT);
      setTimeout(() => developCompletedRoll(r), 2600);
    }
  }

  /* the instrument bar — live readouts for the moment: which scene is armed,
     which frame the shutter is about to expose */
  function renderIBar() {
    const sceneEl = $("#ibar-scene"), frameEl = $("#ibar-frame");
    if (!sceneEl || !frameEl) return;
    sceneEl.textContent = window.Scenes.label(window.Scenes.activeScene());
    const r = getRoll();
    frameEl.textContent = `${Math.min(r.n + 1, ROLL_SIZE)} / ${ROLL_SIZE}`;
  }

  /* the roll, drawn as 24 cells that fill — the empty ones do the work */
  function renderRollBar() {
    const bar = $("#rollbar");
    if (!bar) return;
    const r = getRoll();
    const filled = r.n === 0 && r.raw > 0 ? ROLL_SIZE : r.n;
    if (!bar.childElementCount) {
      for (let i = 0; i < ROLL_SIZE; i++) bar.appendChild(document.createElement("i"));
    }
    [...bar.children].forEach((c, i) => c.classList.toggle("on", i < filled));
    const pill = $("#roll-pill");
    if (pill) pill.textContent = `${filled} / ${ROLL_SIZE}`;
  }

  function retake() {
    resetCaptureUI();
    $("#freeze").classList.remove("show");
  }

  /* hand the user back to whatever they were reaching for */
  function leaveToApp() {
    const scheme = APP_SCHEMES[settings.app];
    if (scheme) location.href = scheme;
    setTimeout(goHome, 500);
  }

  /* back to where the current mode lives: the live window, or home */
  function backToWindow() {
    closePanels();
    resetCaptureUI();
    if (state.mode === "window" && !state.stream) startCamera(false);
    refreshHud();
  }

  /* the sequence ends where it began. "stay outside" lands here too — in the
     shipping app it closes without lifting the shield; the prototype's nearest
     honest gesture is putting the camera away and returning to the readout. */
  function goHome() {
    clearTimeout(state.loopT);
    setMode("app");
    stopCamera();
    $("#shade").classList.remove("open");
    setPanes(false);
    closePanels();
    resetCaptureUI();
    refreshHud();
  }

  /* ---------- the HUD ---------- */
  const ago = iso => {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 60) return UI.f("m_ago", m);
    const h = Math.round(m / 60);
    if (h < 24) return UI.f("h_ago", h);
    return UI.f("d_ago", Math.round(h / 24));
  };

  async function refreshHud() {
    paintScene();
    const armed = window.Scenes.current();

    const sceneV = $("#row-scene-v");
    sceneV.textContent = armed ? window.Scenes.label(armed.scene) : UI.t("scene_none");
    sceneV.classList.toggle("accent", !!armed);
    $("#row-timer-v").textContent = UI.f("n_min", settings.timer);

    const all = (await dbAll()).sort((a, b) => b.id - a.id);
    const visible = armed ? all.filter(e => e.rollId !== armed.rollId) : all;
    $("#row-archive-v").textContent =
      all.length === 0 ? UI.t("no_windows") : UI.f("n_windows_count", all.length);

    const card = $("#btn-lastpic");
    if (visible.length) {
      card.classList.remove("hidden");
      $("#lastpic-img").src = visible[0].dataUrl;
      $("#home-last-meta").textContent = UI.f("last_window_ago", ago(visible[0].createdAt));
    } else {
      card.classList.add("hidden");
    }
    renderRollBar();
    renderIBar();
  }

  function startTick() {
    clearInterval(state.tick);
    state.tick = setInterval(() => {
      refreshHud();
      if (document.querySelector("#scenes.active")) renderScenes();
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
          <span class="scene-name">${window.Scenes.label(key)}</span>
          <span class="scene-blurb">${window.Scenes.blurb(key)}</span>
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
    $("#arm-title").textContent = window.Scenes.label(key);
    $("#arm-blurb").textContent = window.Scenes.blurb(key);
    document.documentElement.style.setProperty("--scene", s.accent);

    const box = $("#arm-duration");
    box.innerHTML = "";
    const opts = [
      { label: `${s.defaultHours}h`, hours: s.defaultHours },
      { label: "1h", hours: 1 },
      { label: "3h", hours: 3 },
      { label: UI.t("until_off"), hours: null }
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
    if (!confirm(UI.f("end_scene_confirm", window.Scenes.label(armed.scene)))) return;
    const done = window.Scenes.disarm();
    renderScenes();
    refreshHud();
    if (done) developRoll(done);
  }

  /* ---------- develop the roll ----------
     0016 — the develop moment IS the contact sheet: strips of three, frames
     exposing one at a time on a stagger (the darkroom test-strip method,
     via the .developing CSS). */
  function buildDevStrips(entries) {
    const grid = $("#dev-grid");
    grid.innerHTML = "";
    grid.classList.add("developing");
    let strip = null;
    entries.forEach((e, i) => {
      if (i % 3 === 0) {
        strip = document.createElement("div");
        strip.className = "strip";
        grid.appendChild(strip);
      }
      const cell = document.createElement("div");
      cell.className = "fr";
      cell.style.setProperty("--d", (i * 0.22) + "s");
      cell.innerHTML = `
        <img src="${e.dataUrl}" alt="">
        <div class="mull mull-v"></div><div class="mull mull-h"></div>
        <span class="fr-n">${i + 1}</span>`;
      strip.appendChild(cell);
    });
    /* square off the last strip — film comes in threes even when you don't */
    while (strip && strip.childElementCount % 3 !== 0) {
      const pad = document.createElement("div");
      pad.className = "fr pad";
      strip.appendChild(pad);
    }
  }

  async function developRoll(roll) {
    const all = (await dbAll()).filter(e => e.rollId === roll.rollId).sort((a, b) => a.id - b.id);
    if (!all.length) return;

    state.devRoll = { entries: all, scene: roll.scene };
    $("#dev-title").textContent = UI.f("the_roll_of", window.Scenes.label(roll.scene));
    $("#dev-count").textContent = UI.f("n_windows_count", all.length);
    document.documentElement.style.setProperty("--scene", window.Scenes.accent(roll.scene));
    buildDevStrips(all);
    $("#develop").classList.remove("hidden");
  }

  /* 0017 — frame 24 closes the roll of 24 and it develops on the spot */
  async function developCompletedRoll(r) {
    const entries = (await dbAll()).sort((a, b) => a.id - b.id).slice(-ROLL_SIZE);
    if (!entries.length) return;
    const armed = window.Scenes.current();
    state.devRoll = { entries, scene: armed ? armed.scene : "everyday" };
    $("#dev-title").textContent = UI.f("roll_no", r.raw / ROLL_SIZE);
    $("#dev-count").textContent = UI.f("n_windows_count", entries.length);
    buildDevStrips(entries);
    $("#develop").classList.remove("hidden");
  }

  /* ---------- archive ---------- */
  async function openArchive() {
    const armed = window.Scenes.current();
    const all = (await dbAll()).sort((a, b) => a.id - b.id);   /* oldest first — a roll reads forward */
    const lockedCount = armed ? all.filter(e => e.rollId === armed.rollId).length : 0;

    $("#archive-locked").classList.toggle("hidden", !armed || !lockedCount);
    /* the whole sentence, not the scene name alone — it sits mid-clause in
       English and after "de" in Spanish */
    if (armed) $("#archive-locked-sub").textContent =
      UI.f("roll_locked_sub", window.Scenes.label(armed.scene));

    /* 0016 — the archive is a contact sheet, not a grid of thumbnails.
       Strips of three with sprocket margins, frame numbers on the film base,
       and the unexposed cells left visibly empty: that is the roll still
       filling, which a grid cannot express.

       Numbering walks back from the roll counter so the newest photo carries
       the frame the counter says it is; older rolls wrap 24→1 behind it.
       A shot locked inside an armed scene renders latent — exposed but not
       developed, which is exactly what it is. */
    const PER_STRIP = 3;
    const roll = getRoll();
    let num = roll.n === 0 ? ROLL_SIZE : roll.n;
    const nums = new Array(all.length);
    for (let i = all.length - 1; i >= 0; i--) {
      nums[i] = num;
      num = num === 1 ? ROLL_SIZE : num - 1;
    }

    const grid = $("#archive-grid");
    grid.innerHTML = "";
    const frag = [];

    all.forEach((e, i) => {
      const cell = document.createElement("div");
      const n = nums[i];
      if (armed && e.rollId === armed.rollId) {
        cell.className = "fr unexposed latent";
        cell.innerHTML = `<span class="fr-n">${n}</span>`;
      } else {
        cell.className = "fr" + (window.Tier.isFading(e) ? " fading" : "");
        const fade = window.Tier.expiryLabel(e);
        cell.innerHTML = `
          <img src="${e.dataUrl}" alt="">
          <div class="mull mull-v"></div><div class="mull mull-h"></div>
          <span class="fr-n">${n}</span>
          ${fade ? `<span class="fr-fade">${fade}</span>` : ""}`;
        cell.onclick = () => openDetail(e);
      }
      frag.push(cell);
    });

    /* the rest of the current roll, visibly empty — the pull is completion */
    for (let k = roll.n + 1; k <= ROLL_SIZE; k++) {
      const cell = document.createElement("div");
      cell.className = "fr unexposed";
      cell.innerHTML = `<span class="fr-n">${k}</span>`;
      frag.push(cell);
    }

    let strip = null;
    frag.forEach((cell, i) => {
      if (i % PER_STRIP === 0) {
        strip = document.createElement("div");
        strip.className = "strip";
        grid.appendChild(strip);
      }
      cell.style.setProperty("--d", (i * 0.14) + "s");
      strip.appendChild(cell);
    });
    while (strip && strip.childElementCount % PER_STRIP !== 0) {
      const pad = document.createElement("div");
      pad.className = "fr pad";
      strip.appendChild(pad);
    }
    grid.classList.toggle("developing", !!state.justDeveloped);
    state.justDeveloped = false;

    /* the sheet's caption: which roll, how full */
    $("#af-roll").textContent = UI.f("roll_no", roll.no);
    $("#af-count").textContent = `${roll.n} / ${ROLL_SIZE}`;

    /* tier line in the header */
    const st = window.Tier.status();
    $("#head-streak").textContent =
      st === "trial" ? UI.f("plan_trial_left", window.Tier.trialDaysLeft())
      : (getStreak() ? UI.f("streak", getStreak()) : "");

    openPanel("archive");
  }

  function openDetail(e) {
    state.detailId = e.id;
    $("#detail-img").src = e.dataUrl;
    $("#detail-phrase").textContent = e.phrase;
    const d = new Date(e.createdAt);
    /* the fade countdown moved here when the grid became the sheet — the
       cells are too small to carry it, but the loss still has to be visible */
    const fade = window.Tier.expiryLabel(e);
    $("#detail-meta").textContent =
      `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${window.Scenes.label(e.scene || "everyday")} · ${UI.bucket(e.bucket)}`
      + (fade ? ` · ${fade}` : "");
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

  /* the shader visualiser. mounted lazily, and it only runs while listening —
     a fragment shader per frame is not something to leave spinning. Returns
     null with no WebGL, in which case the SVG mic underneath just stays put. */
  let siri = null;
  function micLive(on) {
    const mic = $("#btn-mic");
    mic.classList.toggle("live", on);
    if (on && siri === null) {
      const c = $("#mic-wave");
      siri = c && window.SiriWave ? window.SiriWave.mount(c, { size: 76, palette: "brand" }) : false;
    }
    if (!siri) return;
    on ? siri.start() : siri.stop();
    mic.classList.toggle("shaded", on && siri.running);
  }

  function resetVoiceUI() {
    const mic = $("#btn-mic");
    micLive(false);
    mic.classList.toggle("dead", !window.Voice.supported());
    $("#voice-heard").textContent = "";
    $("#voice-prompt").textContent =
      UI.t(window.Voice.supported() ? "voice_prompt" : "voice_unsupported");
  }

  function startVoice() {
    if (!window.Voice.supported()) return;
    if (window.Voice.isRunning()) { window.Voice.stop(); return; }
    const mic = $("#btn-mic");
    window.Voice.listen(
      (scene, transcript, isFinal) => {
        $("#voice-heard").textContent = transcript ? `“${transcript}”` : "";
        if (scene) {
          micLive(false);
          $("#voice-prompt").textContent = `${window.Scenes.label(scene)} —`;
          setTimeout(() => openArmSheet(scene), 420);
        } else if (isFinal && transcript) {
          $("#voice-prompt").textContent = UI.t("voice_nomatch");
        }
      },
      (st, msg) => {
        if (st === "listening") {
          micLive(true);
          $("#voice-prompt").textContent = UI.t("voice_listening");
          $("#voice-heard").textContent = "";
        } else {
          micLive(false);
          if (st === "error") $("#voice-prompt").textContent = msg || UI.t("retry");
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
      b.textContent = UI.f("n_min", m);
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

  /* ---------- settings sheet ----------
     0016 — grouped readouts: plan / the guard / the app / filming. Rows that
     hold a choice cycle it on tap; the value on the right is the whole UI. */
  function renderSettings() {
    /* plan — stated as fact. StoreKit ties the purchase to the Apple ID, so
       there is no account and nothing to sign into. */
    const st = window.Tier.status();
    $("#set-plan-k").textContent = UI.t(st === "window-plus" ? "plan_plus" : st === "trial" ? "plan_trial" : "plan_free");
    $("#set-plan-v").textContent =
      st === "window-plus" ? UI.t("plan_active")
      : st === "trial" ? UI.f("plan_trial_left", window.Tier.trialDaysLeft())
      : UI.t("plan_trial_over");

    /* the guard */
    $("#set-watched-v").textContent = settings.app === "None" ? UI.t("scene_none") : settings.app.toLowerCase();
    $("#set-threshold-v").textContent = UI.f("n_min", settings.timer);

    /* the app */
    $("#voice-support").textContent = UI.t(window.Voice.supported() ? "voice_browser" : "voice_none");
    $("#set-panes-v").textContent = UI.t(settings.panes === "fade" ? "panes_fade" : "panes_keep");

    /* filming */
    const dv = $("#set-director-v");
    dv.textContent = UI.t(settings.director ? "on" : "off");
    dv.classList.toggle("accent", !!settings.director);
    const lv = $("#set-loop-v");
    lv.textContent = UI.t(settings.loop ? "loop" : "off");
    lv.classList.toggle("accent", !!settings.loop);

    renderRollBar();
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
  /* 0017 — "stay outside" closes the moment without handing the phone back */
  $("#btn-done").onclick = goHome;
  $("#btn-share-now").onclick = () => shareEntry(state.lastEntry);
  $("#btn-continue").onclick = leaveToApp;

  /* the filming door — the shipping app reaches the moment only via the
     shield deep link, which left the prototype with no way in at all. */
  $("#btn-open-window").onclick = () => {
    setMode("window");
    resetCaptureUI();
    startCamera(true);
  };
  $("#btn-roll-reset").onclick = () => { resetRoll(); renderRollBar(); renderIBar(); };

  $("#row-scene").onclick = openScenes;
  $("#row-timer").onclick = openTimer;
  $("#row-archive").onclick = openArchive;
  /* the meter goes where the mic is */
  $("#home-meter").onclick = openScenes;
  /* opening the archive from the last window develops the sheet — every time,
     because that beat is the thing worth filming. */
  $("#btn-lastpic").onclick = () => { state.justDeveloped = true; openArchive(); };
  $("#btn-settings").onclick = openSettings;

  /* settings rows — tap cycles the value */
  const cycle = (arr, cur) => arr[(arr.indexOf(cur) + 1) % arr.length];
  $("#set-watched").onclick = () => {
    settings.app = cycle(Object.keys(APP_SCHEMES), settings.app);
    saveSettings(); renderSettings();
  };
  $("#set-threshold").onclick = () => {
    settings.timer = cycle(TIMER_OPTIONS, settings.timer);
    saveSettings(); renderSettings(); refreshHud();
  };
  $("#set-panes").onclick = () => {
    settings.panes = settings.panes === "fade" ? "keep" : "fade";
    saveSettings(); renderSettings();
    setPanes(settings.panes === "fade");
  };
  $("#set-director").onclick = () => {
    settings.director = !settings.director;
    if (!settings.director) pinned = null;
    saveSettings(); renderSettings(); renderPickbar();
  };
  $("#set-loop").onclick = () => {
    settings.loop = !settings.loop;
    if (!settings.loop) clearTimeout(state.loopT);
    saveSettings(); renderSettings();
  };
  /* prototype: StoreKit isn't here, but the row must be (App Store law) */
  $("#set-restore").onclick = () => {
    const v = $("#set-restore-v");
    v.textContent = UI.t("nothing_restore");
    setTimeout(() => { v.textContent = "›"; }, 1800);
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
  /* a developed roll ends the sequence — the moment closes back to home */
  $("#btn-dev-close").onclick = () => {
    $("#develop").classList.add("hidden");
    if (state.mode === "window") goHome();
    else refreshHud();
  };

  $("#sheet-back").onclick = closeSettings;
  $("#btn-clear").onclick = async () => {
    if (confirm(UI.t("clear_confirm"))) {
      await dbClear(); refreshHud(); closeSettings();
    }
  };

  /* the camera dies in the background — bring it back on return, but only in
     the moment: home has no live camera to restore */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (state.mode === "window" && state.opened && !state.captured &&
          !document.querySelector(".panel.active")) {
        startCamera(false);
      }
      refreshHud();
    } else {
      window.Voice.stop();
      stopCamera();
    }
  });

  /* ---------- boot ---------- */
  const BUILD = "app-v5";

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

  /* Fill every data-t in the markup from the string table BEFORE the first
     paint of real state. The English in index.html is the fallback if this file
     ever fails to load, not the source of truth. */
  UI.dress();

  setMode(readMode());
  paintScene();
  refreshHud();
  startTick();

  /* so "is this the new build?" is answerable at a glance instead of guessed */
  $("#build-stamp").textContent = `${BUILD} · ${state.mode}`;
  console.log("[window] build " + BUILD + " · mode " + state.mode);

  /* the deep link goes straight for the live window (the veil only stays up
     if the browser insists on a gesture). the app proper keeps its opening
     ritual: the veil waits for the tap, then home — no camera involved. */
  if (state.mode === "window") openWindow(false);
})();
