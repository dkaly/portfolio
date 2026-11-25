/* Jaguar from the first two strides of jaguar2.mp4. Scroll picks the frame
   directly. The characters are stamped from a prepared grid, so a scroll
   does not redraw the whole cat with the text engine. */

function mountJaguar(canvas) {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const ramp = ".:-=+*#%@";
  const frames = 48;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ready = false;
  let frameH = 1;
  let cache = null;
  let cacheKey = "";
  let masks = null;
  let maskCell = 0;
  let pixels = null;
  let queued = false;
  let range = null;
  let pinned = false;
  let frozen = false;
  let viewW = 0;
  let viewH = 0;
  let blank = true;

  function smooth(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function span(start, end, y) {
    if (end <= start + 40) return 0;
    return Math.max(0, Math.min(1, (y - start) / (end - start)));
  }

  function measure() {
    const hero = document.querySelector(".hero");
    const footer = document.querySelector(".footer");
    viewW = canvas.clientWidth;
    viewH = canvas.clientHeight;
    if (!hero || !footer) return;
    const vh = window.innerHeight || 1;
    const start = hero.offsetTop + hero.offsetHeight * 0.05;
    const end = footer.offsetTop - vh * 0.72;
    range = {
      start: start,
      end: end,
      done: start + 0.8 * (end - start),
      vh: vh,
      footerTop: footer.offsetTop,
      emergeStart: hero.offsetTop + hero.offsetHeight * 0.22,
      emergeEnd: hero.offsetTop + hero.offsetHeight * 0.64
    };
  }

  function place(y) {
    if (!range) return;
    const next = y >= range.done;
    if (next === pinned) return;
    pinned = next;
    frozen = false;
    if (pinned) {
      const fixedTop = canvas.getBoundingClientRect().top;
      canvas.style.position = "absolute";
      canvas.style.top = (range.done + fixedTop) + "px";
      canvas.style.right = "1.2vw";
    } else {
      canvas.style.position = "";
      canvas.style.top = "";
      canvas.style.right = "";
    }
  }

  function bakeMasks(cell) {
    const plate = document.createElement("canvas");
    plate.width = cell;
    plate.height = cell * ramp.length;
    const pen = plate.getContext("2d", { willReadFrequently: true });
    pen.font = Math.ceil(cell * 1.45) + 'px "IBM Plex Mono", ui-monospace, monospace';
    pen.textAlign = "center";
    pen.textBaseline = "middle";
    pen.fillStyle = "#fff";
    for (let i = 0; i < ramp.length; i++) {
      pen.fillText(ramp[i], cell * 0.5, i * cell + cell * 0.5);
    }
    const data = pen.getImageData(0, 0, plate.width, plate.height).data;
    const next = new Array(ramp.length);
    for (let i = 0; i < ramp.length; i++) {
      const mask = new Uint8Array(cell * cell);
      const off = i * cell * cell * 4;
      for (let p = 0; p < mask.length; p++) mask[p] = data[off + p * 4 + 3];
      next[i] = mask;
    }
    masks = next;
    maskCell = cell;
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

  function paint() {
    const y = window.scrollY || window.pageYOffset || 0;
    if (!viewW) measure();
    place(y);
    if (pinned && frozen) return;
    if (!ready || !range || viewW < 40 || viewH < 40) return;
    if (window.matchMedia("(max-width: 900px)").matches) return;

    const sample = pinned ? range.done : y;
    const reveal = span(range.emergeStart, range.emergeEnd, sample);
    const foot = range.footerTop - sample;
    let depart = 1;
    if (foot < range.vh * 0.28) depart = 0;
    else if (foot < range.vh * 0.9) depart = smooth((foot - range.vh * 0.28) / (range.vh * 0.62));
    if (reveal <= 0 || depart <= 0) {
      if (!blank && canvas.width) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        blank = true;
      }
      return;
    }

    const cell = viewW < 280 ? 4 : 5;
    const scale = Math.min(viewW / img.width, viewH / frameH);
    const cols = Math.max(8, Math.round((img.width * scale) / cell));
    const rows = Math.max(8, Math.round((frameH * scale) / cell));
    const left = ((viewW - cols * cell) / 2) | 0;
    const top = ((viewH - rows * cell) * 0.46) | 0;
    ensureCache(cols, rows);
    if (maskCell !== cell) bakeMasks(cell);

    if (canvas.width !== viewW || canvas.height !== viewH) {
      canvas.width = viewW;
      canvas.height = viewH;
      pixels = ctx.createImageData(viewW, viewH);
    }
    const out = pixels.data;
    out.fill(0);

    const shown = smooth(Math.min(1, reveal / 0.72));
    const pos = reduced ? 20 : Math.min(1, span(range.start, range.end, sample) / 0.8) * (frames - 1);
    const i0 = pos | 0;
    const i1 = Math.min(frames - 1, i0 + 1);
    const blend = pos - i0;
    const a = cache[i0];
    const b = cache[i1];
    const width = viewW;

    for (let row = 0; row < rows; row++) {
      const down = rows < 2 ? 0 : row / (rows - 1);
      const emerge = smooth((shown - down * 0.62) / 0.24);
      const paws = down > 0.72 ? smooth((1 - down) / 0.28) : 1;
      const fade = emerge * paws * depart;
      if (fade < 0.04) continue;
      const py = top + row * cell;
      if (py < 0 || py + cell > viewH) continue;
      for (let col = 0; col < cols; col++) {
        const i = (row * cols + col) * 4;
        const r = a[i] * (1 - blend) + b[i] * blend;
        const g = a[i + 1] * (1 - blend) + b[i + 1] * blend;
        const bl = a[i + 2] * (1 - blend) + b[i + 2] * blend;
        if (r < 18 && g < 18 && bl < 18) continue;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
        const sat = Math.max(r, g, bl) - Math.min(r, g, bl);
        if (sat < 14 && lum < 0.5) continue;
        const glyph = Math.min(ramp.length - 1, (lum * ramp.length) | 0);
        const mask = masks[glyph];
        const px = left + col * cell;
        if (px < 0 || px + cell > width) continue;
        const rr = r | 0;
        const gg = g | 0;
        const bb = bl | 0;
        const gain = fade * 255;
        for (let gy = 0; gy < cell; gy++) {
          let dest = ((py + gy) * width + px) * 4;
          const mo = gy * cell;
          for (let gx = 0; gx < cell; gx++) {
            const alpha = mask[mo + gx];
            if (alpha > 12) {
              out[dest] = rr;
              out[dest + 1] = gg;
              out[dest + 2] = bb;
              out[dest + 3] = (alpha * gain) >>> 8;
            }
            dest += 4;
          }
        }
      }
    }

    ctx.putImageData(pixels, 0, 0);
    blank = false;
    if (pinned) frozen = true;
  }

  function requestPaint() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      paint();
    });
  }

  function onScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    if (!range) measure();
    place(y);
    requestPaint();
  }

  img.onload = function () {
    frameH = img.height / frames;
    ready = true;
    const go = function () {
      measure();
      paint();
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    else go();
  };
  img.src = "media/jaguar-sheet.jpg?v=3";

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    range = null;
    viewW = 0;
    cache = null;
    pinned = false;
    frozen = false;
    canvas.style.position = "";
    canvas.style.top = "";
    canvas.style.right = "";
    requestPaint();
  });
}

window.mountJaguar = mountJaguar;
