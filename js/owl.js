/* Samples owl1.jpg into a colored character grid that fills the hero stage. */

function mountOwl(canvas, src) {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const ramp = ".:-=+*#%@";
  let ready = false;

  function paint() {
    const box = canvas.parentElement.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(box.width));
    const cssH = Math.max(1, Math.floor(box.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (!ready || cssW < 8 || cssH < 8) return;

    const cell = Math.max(4, Math.min(6, Math.round(Math.min(cssW, cssH) / 108)));
    const cols = Math.max(1, Math.floor(cssW / cell));
    const rows = Math.max(1, Math.floor(cssH / cell));

    const sample = document.createElement("canvas");
    sample.width = cols;
    sample.height = rows;
    const sampler = sample.getContext("2d", { willReadFrequently: true });
    sampler.imageSmoothingEnabled = true;
    sampler.imageSmoothingQuality = "high";
    const scale = Math.min(cols / img.width, rows / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    sampler.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
    const pixels = sampler.getImageData(0, 0, cols, rows).data;

    const fontSize = Math.ceil(cell * 1.35);
    ctx.font = fontSize + 'px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        if (r < 14 && g < 14 && b < 14) continue;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const index = Math.min(ramp.length - 1, Math.floor(lum * ramp.length));
        const across = cols < 2 ? 1 : x / (cols - 1);
        const down = rows < 2 ? 1 : y / (rows - 1);
        const left = smooth(across / 0.3);
        const bottom = smooth((1 - down) / 0.22);
        ctx.globalAlpha = left * bottom;
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillText(ramp[index], (x + 0.5) * cell, (y + 0.5) * cell);
      }
    }
    ctx.globalAlpha = 1;
  }

  function smooth(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  img.onload = function () {
    ready = true;
    paint();
  };
  img.src = src;

  if (window.ResizeObserver) {
    const watch = new ResizeObserver(paint);
    watch.observe(canvas.parentElement);
  } else {
    window.addEventListener("resize", paint);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(paint);
  }
}

window.mountOwl = mountOwl;
