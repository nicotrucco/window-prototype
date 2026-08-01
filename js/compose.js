/* Window — share composites.

   The whole growth thesis is that the pause produces something worth posting.
   Sharing the bare camera roll photo doesn't do that — the frame and the phrase ARE
   the brand. So we burn them in: photo behind the 4-pane window, phrase in Fraunces
   underneath, wordmark at the foot. 4:5, which is what Instagram and TikTok want. */

(function () {
  const VOID = "#060606";
  const FRAME = "#ECE4D4";
  const MUTED = "#948B7E";

  const loadImg = src => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

  /* make sure Fraunces is actually rasterised before we draw with it */
  async function readyFonts() {
    if (!document.fonts) return;
    try {
      await Promise.all([
        document.fonts.load("italic 500 64px Fraunces"),
        document.fonts.load("500 28px 'Hanken Grotesk'")
      ]);
      await document.fonts.ready;
    } catch (e) { /* fall back to serif/sans, still readable */ }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* draw the window device with an image behind the glass */
  function drawWindow(ctx, img, x, y, w, h, opts) {
    const o = opts || {};
    const border = o.border != null ? o.border : Math.round(w * 0.045);
    const mull = o.mull != null ? o.mull : Math.round(w * 0.038);
    const radius = o.radius != null ? o.radius : Math.round(w * 0.055);

    ctx.save();
    if (o.rotate) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(o.rotate * Math.PI / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    /* warm glow bleeding onto the void */
    ctx.save();
    ctx.shadowColor = "rgba(236,228,212,0.20)";
    ctx.shadowBlur = Math.round(w * 0.14);
    ctx.fillStyle = FRAME;
    roundRect(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();

    /* glass */
    const gx = x + border, gy = y + border;
    const gw = w - border * 2, gh = h - border * 2;
    ctx.save();
    roundRect(ctx, gx, gy, gw, gh, Math.round(radius * 0.4));
    ctx.clip();
    ctx.fillStyle = "#0B0B0B";
    ctx.fillRect(gx, gy, gw, gh);

    if (img) {
      /* cover-fit */
      const scale = Math.max(gw / img.width, gh / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, gx + (gw - dw) / 2, gy + (gh - dh) / 2, dw, dh);
    }
    ctx.restore();

    /* mullions */
    ctx.fillStyle = FRAME;
    ctx.fillRect(gx + gw / 2 - mull / 2, gy, mull, gh);
    ctx.fillRect(gx, gy + gh / 2 - mull / 2, gw, mull);

    ctx.restore();
  }

  function wrapLines(ctx, text, maxW) {
    const words = (text || "").split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  /* ---------- single moment: photo + phrase ---------- */
  async function moment(entry) {
    await readyFonts();
    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    ctx.fillStyle = VOID;
    ctx.fillRect(0, 0, W, H);

    const img = await loadImg(entry.dataUrl).catch(() => null);

    const fw = Math.round(W * 0.72);
    const fh = Math.round(fw * 4 / 3);
    const fx = Math.round((W - fw) / 2);
    const fy = Math.round(H * 0.085);
    drawWindow(ctx, img, fx, fy, fw, fh, { rotate: -1.4 });

    /* phrase */
    ctx.textAlign = "center";
    ctx.fillStyle = "#F6EFDF";
    let size = 60;
    ctx.font = `italic 500 ${size}px Fraunces, Georgia, serif`;
    let lines = wrapLines(ctx, entry.phrase, W * 0.78);
    while (lines.length > 3 && size > 34) {
      size -= 6;
      ctx.font = `italic 500 ${size}px Fraunces, Georgia, serif`;
      lines = wrapLines(ctx, entry.phrase, W * 0.78);
    }

    const phraseTop = fy + fh + Math.round(H * 0.075);
    lines.forEach((ln, i) => {
      ctx.fillText(ln, W / 2, phraseTop + i * size * 1.28);
    });

    /* wordmark foot */
    ctx.font = `500 26px 'Hanken Grotesk', system-ui, sans-serif`;
    ctx.fillStyle = MUTED;
    ctx.globalAlpha = 0.75;
    const sceneName = entry.scene && entry.scene !== "everyday"
      ? `ucco · ${window.Scenes.label(entry.scene)}`
      : "ucco · look outside";
    ctx.fillText(sceneName.toLowerCase(), W / 2, H - 62);
    ctx.globalAlpha = 1;

    return c;
  }

  /* ---------- developed roll: contact sheet ---------- */
  async function roll(entries, sceneKey) {
    await readyFonts();
    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    ctx.fillStyle = VOID;
    ctx.fillRect(0, 0, W, H);

    const shots = entries.slice(0, 6);
    const cols = shots.length <= 1 ? 1 : shots.length <= 4 ? 2 : 3;
    const rows = Math.ceil(shots.length / cols);

    const pad = 46;
    const gridW = W - pad * 2;
    const cellW = Math.floor((gridW - pad * (cols - 1)) / cols);
    const cellH = Math.round(cellW * 4 / 3);
    const gridH = rows * cellH + (rows - 1) * pad;
    const top = Math.round((H - gridH) / 2) - 40;

    const imgs = await Promise.all(shots.map(e => loadImg(e.dataUrl).catch(() => null)));

    imgs.forEach((img, i) => {
      const r = Math.floor(i / cols), col = i % cols;
      const x = pad + col * (cellW + pad);
      const y = top + r * (cellH + pad);
      drawWindow(ctx, img, x, y, cellW, cellH, {
        rotate: i % 2 ? 1.8 : -2,
        border: Math.round(cellW * 0.05),
        mull: Math.round(cellW * 0.04),
        radius: Math.round(cellW * 0.06)
      });
    });

    /* header */
    ctx.textAlign = "center";
    ctx.fillStyle = "#F6EFDF";
    ctx.font = `italic 500 54px Fraunces, Georgia, serif`;
    const name = window.Scenes.label(sceneKey || "everyday");
    ctx.fillText(`the ${name} roll`, W / 2, Math.max(96, top - 58));

    /* foot */
    ctx.font = `500 27px 'Hanken Grotesk', system-ui, sans-serif`;
    ctx.fillStyle = window.Scenes.accent(sceneKey);
    const n = entries.length;
    ctx.fillText(`${n} window${n === 1 ? "" : "s"}`, W / 2, H - 108);

    ctx.font = `500 24px 'Hanken Grotesk', system-ui, sans-serif`;
    ctx.fillStyle = MUTED;
    ctx.globalAlpha = 0.72;
    ctx.fillText("ucco · look outside", W / 2, H - 60);
    ctx.globalAlpha = 1;

    return c;
  }

  const toBlob = canvas => new Promise(res => canvas.toBlob(res, "image/jpeg", 0.92));

  /* share a canvas via the native sheet, falling back to a download */
  async function shareCanvas(canvas, text, filename) {
    const blob = await toBlob(canvas);
    if (!blob) return false;
    const file = new File([blob], filename || "window.jpg", { type: "image/jpeg" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return true;
      } catch (e) {
        if (e && e.name === "AbortError") return false;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename || "window.jpg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  }

  window.Compose = { moment, roll, shareCanvas };
})();
