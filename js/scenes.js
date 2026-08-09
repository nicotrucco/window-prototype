/* Window — scene state machine (prototype simulation)

   In the native app a scene applies real ManagedSettings shields over app categories.
   A web page can't shield anything, so here a scene is simulated: it sets the voice,
   locks the archive, and groups captures into a roll that "develops" on disarm.
   The UI and the state machine are the same ones that port to SwiftUI. */

(function () {
  const KEY = "window-app-scene";

  /* armed = { scene, armedAt, endsAt|null, rollId } */
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (e) { return null; }
  }
  function write(v) {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  }

  /* a timed scene that has run out disarms itself on next read */
  function current() {
    const a = read();
    if (!a) return null;
    if (a.endsAt && Date.now() >= a.endsAt) return null;
    return a;
  }

  function isArmed() { return !!current(); }

  /* the voice in play right now — armed scene, or everyday */
  function activeScene() {
    const a = current();
    return (a && window.SCENES[a.scene]) ? a.scene : window.FALLBACK_SCENE;
  }

  function arm(scene, hours) {
    if (!window.SCENES[scene] || !window.SCENES[scene].armable) return null;
    const now = Date.now();
    const armed = {
      scene,
      armedAt: now,
      endsAt: hours ? now + hours * 3600 * 1000 : null,
      rollId: "roll-" + now
    };
    write(armed);
    return armed;
  }

  /* returns the roll that just finished, so the caller can develop it */
  function disarm() {
    const a = read();
    write(null);
    return a;
  }

  function remainingMs() {
    const a = current();
    if (!a || !a.endsAt) return null;
    return Math.max(0, a.endsAt - Date.now());
  }

  function remainingLabel() {
    const ms = remainingMs();
    if (ms === null) return "until you turn it off";
    const mins = Math.round(ms / 60000);
    if (mins < 1) return "less than a minute left";
    if (mins < 60) return `${mins} min left`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h ${m}m left` : `${h}h left`;
  }

  function label(scene) {
    return (window.SCENES[scene] && window.SCENES[scene].label) || scene;
  }
  function accent(scene) {
    return (window.SCENES[scene] && window.SCENES[scene].accent) || "#ECE4D4";
  }

  /* match a spoken transcript against scene names + synonyms */
  function matchTranscript(text) {
    const t = (text || "").toLowerCase().trim();
    if (!t) return null;
    let best = null;
    for (const key of window.ARMABLE_SCENES) {
      const s = window.SCENES[key];
      const words = [s.label, key.replace("-", " "), ...(s.say || [])];
      for (const w of words) {
        if (t.includes(w.toLowerCase())) {
          /* longest match wins — "going out" beats "out" */
          if (!best || w.length > best.len) best = { scene: key, len: w.length };
        }
      }
    }
    return best ? best.scene : null;
  }

  window.Scenes = {
    current, isArmed, activeScene, arm, disarm,
    remainingMs, remainingLabel, label, accent, matchTranscript
  };
})();
