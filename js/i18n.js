/* UCCO — the UI string table.

   0005 made Chileno a locale, and 08-08 delivered the phrase banks. That left
   the app half-built: Chilean phrases inside English chrome. This file is the
   other half — every user-visible string that isn't a phrase.

   Contract, unchanged from phrases.js: window.LOCALE decides, ?lang= forces it.
   Read a string with UI.t("key") and a formatted one with UI.f("key", ...args).

   Rules that keep this honest:
     - Nothing here is a phrase. Phrases are voice; these are furniture.
     - Static markup carries data-t="key" and UI.dress() fills it at boot, so a
       new string is a table entry, never a second hardcoded literal.
     - The Spanish is Chilean, matching the banks: tú/voseo, no neutral dubbing.
     - A missing key returns the English, never blank. Half a word beats none
       during a shoot.
*/

(function () {
  const EN = {
    /* --- opening --- */
    tagline: "look outside.",
    tap_open: "tap to open",
    turn: "turn it sideways",

    /* --- camera --- */
    cam_need: "window needs the camera to open.",
    cam_allow: "allow camera access, then try again.",
    retry: "try again",

    /* --- home --- */
    home_hd: "window",
    row_scene: "set scene",
    row_timer: "set timer",
    row_archive: "archive",
    scene_none: "none",
    no_windows: "no windows",
    last_window: "last window",
    last_window_ago: a => `last window · ${a}`,
    open_window: "open the window",
    aria_your_windows: "your windows",
    aria_voice_arm: "arm a scene by voice",
    aria_settings: "settings",
    aria_photo: "photo",
    aria_back: "back",
    aria_close: "close",

    /* --- instrument --- */
    ibar_scene: "scene",
    ibar_frame: "frame",
    folio: (n, t) => `frame ${n} of ${t}`,
    folio_scene: (s, n, t) => `${s} · frame ${n} of ${t}`,

    /* --- after the phrase lands --- */
    saved_note: "saved · stays on this device",
    locked_note: "locked until your scene ends",
    stay_outside: "stay outside",
    continue_plain: "continue",
    continue_to: app => `continue to ${app}`,
    share: "share",
    retake: "retake",
    skip: "skip",

    /* --- director (filming rig) --- */
    director: "director",
    random: "random",
    pinned_scene: s => `pinned · ${s}`,
    director_scene: s => `director · ${s}`,

    /* --- scenes --- */
    scenes: "scenes",
    voice_prompt: "tap and say “i'm going out”",
    voice_unsupported: "voice needs safari or chrome — tap a scene below",
    voice_listening: "listening…",
    voice_nomatch: "didn't catch a scene — try again",
    scene_foot: "a scene guards your apps until you end it.<br>your photos stay locked until then.",
    how_long: "how long",
    until_off: "until I turn it off",
    start_scene: "start the scene",
    cancel: "cancel",
    end_scene_confirm: s => `end your ${s} scene?\n\nyour photos will develop now.`,
    until_you_end: "until you turn it off",
    less_than_min: "less than a minute left",
    mins_left: m => `${m} min left`,
    hm_left: (h, m) => `${h}h ${m}m left`,
    h_left: h => `${h}h left`,

    /* --- archive --- */
    your_windows: "your windows",
    roll_in_camera: "the roll is still in the camera",
    roll_locked_sub: s => `your ${s} photos develop when the scene ends.`,
    roll_no: n => `roll no. ${n}`,
    developed: "developed",
    the_roll_of: s => `the ${s} roll`,
    n_windows_count: n => (n === 1 ? "1 window" : `${n} windows`),
    share_roll: "share the roll",
    done: "done",
    delete_one: "delete",
    clear_confirm: "delete every window? this can't be undone.",
    streak: d => `${d} day streak`,

    /* --- time --- */
    m_ago: m => `${m}m ago`,
    h_ago: h => `${h}h ago`,
    d_ago: d => `${d}d ago`,
    days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],

    /* --- expiry (tier.js) --- */
    fades_days: d => `fades in ${d} days`,
    fades_tomorrow: "fades tomorrow",
    fades_hours: h => `fades in ${h}h`,
    fades_hour: "fades within the hour",

    /* --- timer sheet --- */
    the_timer: "the timer",
    timer_blurb: "window opens once you've been in an app this long",
    minutes: "minutes",
    timer_hint: "the everyday mode. it stays on, quietly, and only steps in once you've actually fallen in.",
    n_min: m => `${m} min`,

    /* --- settings --- */
    settings: "settings",
    grp_plan: "plan",
    plan_free: "free",
    plan_trial: "free trial",
    plan_plus: "ucco+",
    plan_active: "active",
    plan_trial_left: d => `${d} days of everything`,
    plan_trial_over: "trial ended",
    restore: "restore purchases",
    nothing_restore: "nothing to restore",
    grp_guard: "the guard",
    watched_app: "watched app",
    threshold: "threshold",
    grp_app: "the app",
    voice: "voice",
    voice_browser: "browser",
    voice_none: "unsupported here",
    panes: "panes",
    panes_fade: "fade away",
    panes_keep: "keep them",
    terms: "terms · privacy",
    grp_filming: "filming",
    rehearse: "rehearse",
    reset_roll: "reset the roll",
    clear_all: "clear all windows",
    on: "on",
    off: "off",
    loop: "loop",
    set_hint: "director pins one phrase so takes repeat · rehearse loops the moment hands-free. filming rig, not user features.",
    version_note: "no account · everything stays on this device",

    /* --- classifier buckets, surfaced in the detail line --- */
    buckets: {
      green: "green", sky: "sky", water: "water", street: "street",
      indoor: "indoor", food: "food", people: "people", night: "night",
      default: "outside"
    }
  };

  /* Chilean, not neutral. Same register as the phrase banks: push, never
     scold; voseo where it falls naturally; no weón (0005's call, reversible). */
  const ES = {
    tagline: "mira afuera.",
    tap_open: "toca para abrir",
    turn: "ponlo de lado",

    cam_need: "ucco necesita la cámara para abrirse.",
    cam_allow: "dale acceso a la cámara y vuelve a intentar.",
    retry: "reintentar",

    home_hd: "ventana",
    row_scene: "elegir escena",
    row_timer: "poner el tiempo",
    row_archive: "archivo",
    scene_none: "ninguna",
    no_windows: "sin ventanas",
    last_window: "última ventana",
    last_window_ago: a => `última ventana · ${a}`,
    open_window: "abrir la ventana",
    aria_your_windows: "tus ventanas",
    aria_voice_arm: "activar una escena por voz",
    aria_settings: "ajustes",
    aria_photo: "foto",
    aria_back: "volver",
    aria_close: "cerrar",

    ibar_scene: "escena",
    ibar_frame: "cuadro",
    folio: (n, t) => `cuadro ${n} de ${t}`,
    folio_scene: (s, n, t) => `${s} · cuadro ${n} de ${t}`,

    saved_note: "guardada · se queda en este teléfono",
    locked_note: "guardada hasta que termine tu escena",
    stay_outside: "quedarse afuera",
    continue_plain: "seguir",
    continue_to: app => `seguir a ${app}`,
    share: "compartir",
    retake: "otra toma",
    skip: "saltar",

    director: "director",
    random: "al azar",
    pinned_scene: s => `fija · ${s}`,
    director_scene: s => `director · ${s}`,

    scenes: "escenas",
    voice_prompt: "toca y di “voy a salir”",
    voice_unsupported: "la voz necesita safari o chrome — toca una escena",
    voice_listening: "escuchando…",
    voice_nomatch: "no pillé la escena — intenta de nuevo",
    scene_foot: "una escena cuida tus apps hasta que la termines.<br>tus fotos quedan guardadas hasta entonces.",
    how_long: "cuánto rato",
    until_off: "hasta que yo la corte",
    start_scene: "empezar la escena",
    cancel: "cancelar",
    end_scene_confirm: s => `¿terminar tu escena de ${s}?\n\ntus fotos se revelan ahora.`,
    until_you_end: "hasta que la cortes",
    less_than_min: "queda menos de un minuto",
    mins_left: m => `quedan ${m} min`,
    hm_left: (h, m) => `quedan ${h}h ${m}m`,
    h_left: h => `quedan ${h}h`,

    your_windows: "tus ventanas",
    roll_in_camera: "el rollo sigue en la cámara",
    roll_locked_sub: s => `tus fotos de ${s} se revelan cuando termine la escena.`,
    roll_no: n => `rollo n.º ${n}`,
    developed: "revelado",
    the_roll_of: s => `el rollo de ${s}`,
    n_windows_count: n => (n === 1 ? "1 ventana" : `${n} ventanas`),
    share_roll: "compartir el rollo",
    done: "listo",
    delete_one: "borrar",
    clear_confirm: "¿borrar todas las ventanas? esto no se puede deshacer.",
    streak: d => `${d} días seguidos`,

    m_ago: m => `hace ${m}m`,
    h_ago: h => `hace ${h}h`,
    d_ago: d => `hace ${d}d`,
    days: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],

    fades_days: d => `se borra en ${d} días`,
    fades_tomorrow: "se borra mañana",
    fades_hours: h => `se borra en ${h}h`,
    fades_hour: "se borra dentro de la hora",

    the_timer: "el tiempo",
    timer_blurb: "la ventana se abre cuando llevas este rato en una app",
    minutes: "minutos",
    timer_hint: "el modo de todos los días. queda puesto, callado, y solo aparece cuando de verdad caíste.",
    n_min: m => `${m} min`,

    settings: "ajustes",
    grp_plan: "plan",
    plan_free: "gratis",
    plan_trial: "prueba gratis",
    plan_plus: "ucco+",
    plan_active: "activo",
    plan_trial_left: d => `${d} días con todo`,
    plan_trial_over: "la prueba terminó",
    restore: "restaurar compras",
    nothing_restore: "nada que restaurar",
    grp_guard: "la guardia",
    watched_app: "app vigilada",
    threshold: "límite",
    grp_app: "la app",
    voice: "voz",
    voice_browser: "navegador",
    voice_none: "no funciona acá",
    panes: "paneles",
    panes_fade: "que se vayan",
    panes_keep: "que se queden",
    terms: "términos · privacidad",
    grp_filming: "grabación",
    rehearse: "ensayar",
    reset_roll: "reiniciar el rollo",
    clear_all: "borrar todas las ventanas",
    on: "sí",
    off: "no",
    loop: "en loop",
    set_hint: "director fija una frase para repetir tomas · ensayar deja el momento en loop sin manos. equipo de grabación, no funciones de usuario.",
    version_note: "sin cuenta · todo se queda en este teléfono",

    buckets: {
      green: "verde", sky: "cielo", water: "agua", street: "calle",
      indoor: "interior", food: "comida", people: "gente", night: "noche",
      default: "afuera"
    }
  };

  const TABLE = { en: EN, es: ES };
  const L = TABLE[window.LOCALE] || EN;

  /* a miss falls back to English rather than to nothing */
  function raw(key) {
    return Object.prototype.hasOwnProperty.call(L, key) ? L[key] : EN[key];
  }
  function t(key) {
    const v = raw(key);
    return typeof v === "function" ? v() : (v == null ? "" : v);
  }
  function f(key) {
    const v = raw(key);
    if (typeof v !== "function") return v == null ? "" : String(v);
    return v.apply(null, [].slice.call(arguments, 1));
  }
  function bucket(b) {
    const m = raw("buckets") || EN.buckets;
    return m[b] || m.default || b;
  }
  function day(i) { return (raw("days") || EN.days)[i]; }

  /* Fill every data-t / data-t-html / data-t-aria in the markup. Called once at
     boot and safe to call again — it reads the table, never the DOM. */
  function dress(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-t]").forEach(el => {
      el.textContent = t(el.getAttribute("data-t"));
    });
    scope.querySelectorAll("[data-t-html]").forEach(el => {
      el.innerHTML = t(el.getAttribute("data-t-html"));
    });
    scope.querySelectorAll("[data-t-aria]").forEach(el => {
      el.setAttribute("aria-label", t(el.getAttribute("data-t-aria")));
    });
  }

  window.UI = { t, f, bucket, day, dress, locale: window.LOCALE };
})();
