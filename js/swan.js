/* Swan from swan2.mp4, held on center. The top of the footer is the waterline:
   the bird sits on it, and the ripples begin just underneath. */

function mountSwan(canvas, footer) {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const ramp = ".:-=+*#%@";
  const frames = 83;
  const duration = 8.27;
  const waterFrac = 0.5814;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ready = false;
  let frameH = 1;
  let cache = null;
  let cacheKey = "";

  function paint(now) {
    const box = canvas.getBoundingClientRect();
    const foot = footer.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(box.width));
    const cssH = Math.max(1, Math.floor(box.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(1, Math.floor(cssW * dpr));
    const bh = Math.max(1, Math.floor(cssH * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (!ready || cssW < 40 || cssH < 40) return;

    const waterY = foot.top - box.top;
    if (waterY < 24 || waterY > cssH - 8) return;

    const cell = cssW < 720 ? 4 : 5;
    const above = waterY - cell;
    let artH = above / waterFrac;
    let artW = artH * (img.width / frameH);
    const maxW = Math.min(cssW * 0.74, 740);
    if (artW > maxW) {
      artW = maxW;
      artH = artW * (frameH / img.width);
    }
    const cols = Math.max(8, Math.round(artW / cell));
    const rows = Math.max(6, Math.round(artH / cell));
    const waterRow = Math.max(1, Math.min(rows - 2, Math.round(rows * waterFrac)));
    const left = Math.max(cell, (cssW - cols * cell) * (cssW < 800 ? 0.5 : 0.62));

    const t = reduced ? 0 : (now || 0);
    ensureCache(cols, rows);
    const pos = reduced ? 12 : ((t / 1000) / duration * frames) % frames;
    const i0 = Math.floor(pos) % frames;
    const i1 = (i0 + 1) % frames;
    const blend = pos - Math.floor(pos);
    const a = cache[i0];
    const b = cache[i1];

    ctx.font = Math.ceil(cell * 1.45) + 'px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawRipples(cssW, waterY, cell, left, cols * cell, t);

    for (let y = 0; y < rows; y++) {
      const below = y - waterRow;
      if (below > 5) continue;
      const fade = below < 0 ? 1 : Math.max(0, 0.9 - below * 0.16);
      const py = y < waterRow
        ? waterY - (waterRow - y) * cell + cell * 0.5
        : waterY + (y - waterRow) * cell + cell * 0.5;
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = a[i] * (1 - blend) + b[i] * blend;
        const g = a[i + 1] * (1 - blend) + b[i + 1] * blend;
        const bl = a[i + 2] * (1 - blend) + b[i + 2] * blend;
        if (r < 24 && g < 24 && bl < 24) continue;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
        const glyph = Math.min(ramp.length - 1, Math.floor(lum * ramp.length));
        ctx.globalAlpha = fade;
        ctx.fillStyle = "rgb(" + (r | 0) + "," + (g | 0) + "," + (bl | 0) + ")";
        ctx.fillText(ramp[glyph], left + (x + 0.5) * cell, py);
      }
    }
    ctx.globalAlpha = 1;
  }

  function ensureCache(cols, rows) {
    const key = cols + "x" + rows;
    if (cache && cacheKey === key) return;
    const sample = document.createElement("canvas");
    sample.width = cols;
    sample.height = rows;
    const sampler = sample.getContext("2d", { willReadFrequently: true });
    sampler.imageSmoothingEnabled = true;
    const next = new Array(frames);
    for (let i = 0; i < frames; i++) {
      sampler.clearRect(0, 0, cols, rows);
      sampler.drawImage(img, 0, i * frameH, img.width, frameH, 0, 0, cols, rows);
      next[i] = sampler.getImageData(0, 0, cols, rows).data;
    }
    cache = next;
    cacheKey = key;
  }

  function drawRipples(cssW, waterY, cell, artLeft, artWidth, t) {
    const marks = ".-~";
    for (let row = 0; row < 4; row++) {
      const y = waterY + row * cell + cell * 0.5;
      const fade = 1 - row / 5;
      for (let x = cell * 0.5; x < cssW; x += cell) {
        const along = x * 0.05 + t * 0.0007 + row * 1.35;
        const crest = Math.sin(along) * 0.65 + Math.sin(x * 0.017 - t * 0.0003) * 0.35;
        const near = x > artLeft - cell * 4 && x < artLeft + artWidth + cell * 4;
        const gate = near ? 0.16 : 0.34;
        if (crest < gate + row * 0.08) continue;
        const glyph = crest > 0.78 ? 2 : crest > 0.55 ? 1 : 0;
        ctx.globalAlpha = (0.16 + crest * 0.28) * fade;
        ctx.fillStyle = "#8e8a82";
        ctx.fillText(marks[glyph], x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  let last = 0;
  function frame(now) {
    if (now - last > 50) {
      last = now;
      paint(now);
    }
    if (!reduced) requestAnimationFrame(frame);
  }

  img.onload = function () {
    frameH = img.height / frames;
    ready = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        paint(0);
        if (!reduced) requestAnimationFrame(frame);
      });
    } else {
      paint(0);
      if (!reduced) requestAnimationFrame(frame);
    }
  };
  img.src = "media/swan-sheet.jpg";

  window.addEventListener("resize", function () { paint(last); });
}

window.mountSwan = mountSwan;
