/* Window — arming by voice: "yo window, i'm going out"

   PROTOTYPE ONLY. This uses the Web Speech API, which on Safari is *server-side*
   recognition — audio leaves the device. That is fine for a filming rig but it is NOT
   the product behaviour: the native app uses SFSpeechRecognizer with
   requiresOnDeviceRecognition = true, so nothing leaves the phone. Do not let this
   prototype's implementation leak into any privacy claim.

   Support is patchy (and flakier inside an installed PWA), so every path here fails
   soft — tapping a scene always works. Filming must never be blocked by the mic. */

(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, running = false;

  const supported = () => !!SR;

  /* onResult(sceneKeyOrNull, transcript, isFinal), onState("listening"|"stopped"|"error") */
  function listen(onResult, onState) {
    if (!SR) { onState && onState("error", "no speech support"); return false; }
    stop();

    try {
      rec = new SR();
    } catch (e) {
      onState && onState("error", "mic unavailable");
      return false;
    }

    rec.lang = (navigator.language || "en-US");
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => { running = true; onState && onState("listening"); };

    rec.onresult = e => {
      let text = "";
      let isFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      const scene = window.Scenes.matchTranscript(text);
      onResult && onResult(scene, text.trim(), isFinal);
      /* stop as soon as we've heard a scene — no need to wait for the final result */
      if (scene) { try { rec.stop(); } catch (err) {} }
    };

    rec.onerror = ev => {
      running = false;
      const msg = ev && ev.error === "not-allowed"
        ? "mic permission denied"
        : "didn't catch that";
      onState && onState("error", msg);
    };

    rec.onend = () => { running = false; onState && onState("stopped"); };

    try {
      rec.start();
      return true;
    } catch (e) {
      running = false;
      onState && onState("error", "couldn't start listening");
      return false;
    }
  }

  function stop() {
    if (rec) {
      try { rec.onend = null; rec.onerror = null; rec.stop(); } catch (e) {}
      rec = null;
    }
    running = false;
  }

  window.Voice = { supported, listen, stop, isRunning: () => running };
})();
