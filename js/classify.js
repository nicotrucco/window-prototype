/* Window — on-device scene classification (browser prototype)
   Strategy: MobileNet (TF.js, lazy-loaded) for objects + color heuristics
   for sky / sunset / night / green / water. Everything runs locally. */

(function () {
  let modelPromise = null;

  const KEYWORDS = {
    water:     ["seashore", "lakeside", "lakeshore", "sandbar", "breakwater", "dock", "boathouse", "canoe", "catamaran", "speedboat", "paddle", "pier", "fountain"],
    beach:     ["seashore", "sandbar", "coral reef"],
    mountains: ["alp", "volcano", "valley", "cliff", "promontory"],
    food:      ["pizza", "cheeseburger", "hotdog", "plate", "espresso", "bakery", "ice cream", "icecream", "banana", "orange", "burrito", "guacamole", "carbonara", "meat loaf", "mashed potato", "cup", "eggnog", "french loaf", "bagel", "pretzel", "broccoli", "mushroom", "strawberry", "pineapple", "lemon", "fig", "custard", "trifle", "chocolate", "wine bottle", "beer", "soup"],
    animal:    ["retriever", "terrier", "spaniel", "poodle", "puppy", "shepherd", "husky", "malamute", "beagle", "chihuahua", "pug", "corgi", "dalmatian", "boxer", "collie", "cat", "tabby", "siamese", "persian cat", "kitten", "bird", "parrot", "macaw", "finch", "robin", "horse", "pony", "rabbit", "hamster", "guinea pig", "squirrel", "fox", "hen", "cock", "duck", "goose", "peacock", "butterfly"],
    street:    ["streetcar", "traffic light", "traffic sign", "street sign", "cab", "taxi", "parking meter", "bus", "sports car", "convertible", "moving van", "trolleybus", "crosswalk", "motor scooter", "moped", "bicycle", "unicycle", "limousine", "jeep", "pickup", "ambulance", "fire engine", "minivan"],
    indoor:    ["desk", "desktop computer", "laptop", "notebook", "monitor", "screen", "bookcase", "bookshop", "library", "coffee mug", "keyboard", "mouse", "television", "sofa", "studio couch", "dining table", "lamp", "table lamp", "wardrobe", "quilt", "pillow", "window shade", "windsor tie", "radiator", "refrigerator", "microwave", "washer", "dishwasher", "printer", "modem", "remote control", "cellular telephone", "wall clock"]
  };

  function bucketFromPreds(preds) {
    for (const p of preds) {
      const name = p.className.toLowerCase();
      for (const bucket in KEYWORDS) {
        if (KEYWORDS[bucket].some(k => name.includes(k))) {
          return { bucket, prob: p.probability };
        }
      }
    }
    return null;
  }

  /* --- color heuristics on a small sample --- */
  function colorHeuristic(canvas) {
    const S = 48;
    const c = document.createElement("canvas");
    c.width = S; c.height = S;
    const ctx = c.getContext("2d");
    ctx.drawImage(canvas, 0, 0, S, S);
    const d = ctx.getImageData(0, 0, S, S).data;

    let lumaSum = 0, n = S * S;
    let topBlue = 0, topWarm = 0, green = 0, botBlue = 0;
    const topN = Math.floor(n / 3), botStart = n - topN;

    for (let i = 0; i < n; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      lumaSum += luma;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const isBlue = b > r * 1.15 && b > g * 1.05 && sat > 0.12;
      const isWarm = r > b * 1.35 && r > 90 && sat > 0.25;
      const isGreen = g > r * 1.12 && g > b * 1.12 && g > 60;
      if (i < topN) { if (isBlue) topBlue++; if (isWarm) topWarm++; }
      if (i >= botStart && isBlue) botBlue++;
      if (isGreen) green++;
    }

    const avgLuma = lumaSum / n;
    const fTopBlue = topBlue / topN, fTopWarm = topWarm / topN;
    const fGreen = green / n, fBotBlue = botBlue / topN;

    if (avgLuma < 42) return "night";
    if (fTopWarm > 0.38 && avgLuma < 170) return "sunset";
    if (fTopBlue > 0.45 && avgLuma > 95) return "sky";
    if (fGreen > 0.30) return "green";
    if (fBotBlue > 0.38) return "water";
    return null;
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* start loading the model in the background (call when camera opens) */
  window.warmClassifier = function () {
    if (modelPromise) return;
    modelPromise = (async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js");
      return mobilenet.load({ version: 2, alpha: 0.5 });
    })().catch(() => null);
  };

  /* classify a captured canvas → scene bucket (always resolves) */
  window.classifyCanvas = async function (canvas) {
    const heur = colorHeuristic(canvas);
    let mapped = null;
    try {
      if (modelPromise) {
        const model = await Promise.race([
          modelPromise,
          new Promise(r => setTimeout(() => r(null), 2200))
        ]);
        if (model) {
          const preds = await Promise.race([
            model.classify(canvas, 3),
            new Promise(r => setTimeout(() => r(null), 2000))
          ]);
          if (preds) mapped = bucketFromPreds(preds);
        }
      }
    } catch (e) { /* stay silent, fall through */ }

    if (mapped && mapped.prob >= 0.45) return mapped.bucket;
    if (heur === "night" || heur === "sunset" || heur === "sky") return heur;
    if (mapped && mapped.prob >= 0.28) return mapped.bucket;
    if (heur) return heur;
    return "default";
  };
})();
