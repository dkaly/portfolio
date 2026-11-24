/* Five pale ASCII butterflies. Plates are the angles from butterfly.mp4:
   side, three-quarter, and head-on, with the wings opening and closing.
   They wander until the pointer itself moves, then orbit it. Scrolling
   leaves the pointer where it is, so that does not pull them in. */

const CELL = 5;
const COLS = 18;
const ROWS = 16;
const HEADINGS = 24;
const FLAPS = 7;
const RAMP = ".:-=+*#%@";

function mountButterflies(canvas) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return;

  const ctx = canvas.getContext("2d");
  const sprites = new Array(HEADINGS * FLAPS);
  let spritesReady = false;

  const mouse = { x: 0, y: 0, last: -1e9, seen: false };
  let prevX = null;
  let prevY = null;

  window.addEventListener("mousemove", function (e) {
    if (prevX === null) {
      prevX = e.clientX;
      prevY = e.clientY;
      return;
    }
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    if (dx * dx + dy * dy < 1) return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.last = performance.now();
    mouse.seen = true;
  }, { passive: true });

  const butterflies = [];
  for (let i = 0; i < 5; i++) butterflies.push(spawnButterfly());

  function spawnButterfly() {
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      heading: Math.random() * Math.PI * 2,
      speed: 32 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
      flapSpeed: 6.5 + Math.random() * 3.5,
      wander: Math.random() * Math.PI * 2,
      orbit: Math.random() * Math.PI * 2,
      orbitSpeed: (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random() * 1.8),
      radius: 72 + Math.random() * 76,
      drift: Math.random() * Math.PI * 2
    };
  }

  function bakeSprites() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const font = Math.ceil(CELL * 1.35) + 'px "IBM Plex Mono", ui-monospace, monospace';
    for (let h = 0; h < HEADINGS; h++) {
      for (let f = 0; f < FLAPS; f++) {
        const heading = (h / HEADINGS) * Math.PI * 2;
        const flap = -1.05 + (f / (FLAPS - 1)) * 2.2;
        const grid = rasterButterfly(heading, flap);
        const sprite = document.createElement("canvas");
        sprite.width = Math.floor(COLS * CELL * dpr);
        sprite.height = Math.floor(ROWS * CELL * dpr);
        const sctx = sprite.getContext("2d");
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sctx.font = font;
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            const v = grid[y * COLS + x];
            if (v < 0.14) continue;
            const index = Math.min(RAMP.length - 1, Math.floor(v * RAMP.length));
            const ink = Math.round(186 + v * 68);
            sctx.fillStyle = "rgb(" + ink + "," + ink + "," + Math.max(0, ink - 8) + ")";
            sctx.fillText(RAMP[index], (x + 0.5) * CELL, (y + 0.5) * CELL);
          }
        }
        sprites[h * FLAPS + f] = sprite;
      }
    }
    spritesReady = true;
  }

  function resize() {
    const cssW = window.innerWidth || 1;
    const cssH = window.innerHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(cssW * dpr));
    const h = Math.max(1, Math.floor(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cssW: cssW, cssH: cssH };
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.034, (now - last) / 1000);
    last = now;
    const view = resize();
    const chasing = mouse.seen && now - mouse.last < 420;
    butterflies.forEach(function (b) {
      stepButterfly(b, dt, chasing, view.cssW, view.cssH);
    });
    ctx.clearRect(0, 0, view.cssW, view.cssH);
    if (spritesReady) {
      butterflies.forEach(function (b, i) {
        drawButterfly(b, now, i);
      });
    }
    requestAnimationFrame(frame);
  }

  function stepButterfly(b, dt, chasing, width, height) {
    if (chasing) {
      b.orbit += b.orbitSpeed * dt;
      b.drift += dt * 1.7;
      const rad = b.radius + Math.sin(b.drift) * 8;
      const tx = mouse.x + Math.cos(b.orbit) * rad;
      const ty = mouse.y + Math.sin(b.orbit) * rad * 0.78;
      const dx = tx - b.x;
      const dy = ty - b.y;
      const dist = Math.hypot(dx, dy) || 1;
      const chase = Math.atan2(dy, dx);
      const dir = b.orbitSpeed >= 0 ? 1 : -1;
      const tangent = Math.atan2(Math.cos(b.orbit) * dir, -Math.sin(b.orbit) * dir);
      const far = Math.min(1, dist / 120);
      const desired = lerpAngle(tangent, chase, far);
      b.heading = turnTo(b.heading, desired, (5 + far * 4) * dt);
      const cruise = Math.abs(b.orbitSpeed) * rad;
      const want = cruise + far * 160;
      b.speed += (want - b.speed) * Math.min(1, dt * 4);
    } else {
      b.wander += dt * 0.65;
      const drift = Math.sin(b.wander) * 0.9 + Math.sin(b.wander * 0.41 + b.phase) * 0.45;
      b.heading += drift * dt;
      const margin = 48;
      if (b.x < margin) b.heading = turnTo(b.heading, 0, 2.4 * dt);
      else if (b.x > width - margin) b.heading = turnTo(b.heading, Math.PI, 2.4 * dt);
      if (b.y < margin) b.heading = turnTo(b.heading, Math.PI / 2, 2.4 * dt);
      else if (b.y > height - margin) b.heading = turnTo(b.heading, -Math.PI / 2, 2.4 * dt);
      const cruise = 34 + (b.phase % 1) * 22;
      b.speed += (cruise - b.speed) * Math.min(1, dt * 2);
    }

    b.x += Math.cos(b.heading) * b.speed * dt;
    b.y += Math.sin(b.heading) * b.speed * dt;

    if (!chasing) {
      if (b.x < -40) b.x = width + 40;
      else if (b.x > width + 40) b.x = -40;
      if (b.y < -40) b.y = height + 40;
      else if (b.y > height + 40) b.y = -40;
    }
  }

  function drawButterfly(b, now) {
    const flight = -b.heading;
    let heading = flight % (Math.PI * 2);
    if (heading < 0) heading += Math.PI * 2;
    const hi = Math.round((heading / (Math.PI * 2)) * HEADINGS) % HEADINGS;
    const wave = Math.sin(now / 1000 * b.flapSpeed + b.phase);
    const flap = -1.05 + ((wave + 1) / 2) * 2.2;
    let fi = Math.round(((flap + 1.05) / 2.2) * (FLAPS - 1));
    fi = Math.max(0, Math.min(FLAPS - 1, fi));
    const sprite = sprites[hi * FLAPS + fi];
    const w = COLS * CELL * 0.5;
    const h = ROWS * CELL * 0.5;
    ctx.drawImage(sprite, b.x - w / 2, b.y - h / 2, w, h);
  }

  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(bakeSprites);
  } else {
    bakeSprites();
  }
}

function rasterButterfly(heading, flap) {
  const S = 96;
  const data = new Uint8Array(S * S);
  const scale = S * 0.36;
  const cx = (S - 1) / 2;
  const cy = (S - 1) / 2;
  const c = Math.cos(heading);
  const s = Math.sin(heading);

  function proj(x, y, z) {
    const sx = z * c + x * s;
    const sy = z * s + y;
    return [cx + sx * scale, cy - sy * scale];
  }

  function disk(x, y, z, rad, val) {
    const p = proj(x, y, z);
    const r = Math.max(1.3, rad * scale);
    const x0 = Math.max(0, Math.floor(p[0] - r));
    const x1 = Math.min(S - 1, Math.ceil(p[0] + r));
    const y0 = Math.max(0, Math.floor(p[1] - r));
    const y1 = Math.min(S - 1, Math.ceil(p[1] + r));
    const rr = r * r;
    const v = val | 0;
    for (let iy = y0; iy <= y1; iy++) {
      for (let ix = x0; ix <= x1; ix++) {
        const dx = ix - p[0];
        const dy = iy - p[1];
        if (dx * dx + dy * dy <= rr) {
          const i = iy * S + ix;
          if (data[i] < v) data[i] = v;
        }
      }
    }
  }

  for (let i = 0; i < 16; i++) {
    const t = -0.55 + (1.15 * i) / 15;
    disk(0, 0, t, 0.045 + 0.02 * Math.max(0, 0.3 - Math.abs(t)), 255);
  }

  function wing(side, z0, span, chord, liftScale) {
    for (let iu = 0; iu < 12; iu++) {
      const u = (iu + 0.5) / 12;
      const x = side * (0.16 + span * u);
      const half = chord * Math.pow(Math.sin(u * Math.PI), 1.15);
      const y = liftScale * Math.abs(x) * Math.sin(flap);
      const xFold = x * (0.2 + 0.8 * Math.max(0, Math.cos(flap)));
      for (let iv = 0; iv < 5; iv++) {
        const v = -1 + (2 * (iv + 0.5)) / 5;
        const z = z0 + v * half;
        const rim = 0.55 + 0.45 * Math.max(Math.abs(v), u * 0.7);
        disk(xFold, y, z, 0.09, 80 + 160 * (1 - rim * 0.65));
      }
    }
  }

  wing(1, 0.05, 0.72, 0.34, 1.35);
  wing(-1, 0.05, 0.72, 0.34, 1.35);
  wing(1, -0.22, 0.48, 0.26, 1.15);
  wing(-1, -0.22, 0.48, 0.26, 1.15);

  const grid = new Float32Array(COLS * ROWS);
  const cw = S / COLS;
  const ch = S / ROWS;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x0 = Math.floor(col * cw);
      const y0 = Math.floor(row * ch);
      const x1 = Math.max(x0 + 1, Math.floor((col + 1) * cw));
      const y1 = Math.max(y0 + 1, Math.floor((row + 1) * ch));
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1 && y < S; y++) {
        for (let x = x0; x < x1 && x < S; x++) {
          sum += data[y * S + x];
          n++;
        }
      }
      grid[row * COLS + col] = n ? sum / n / 255 : 0;
    }
  }
  return grid;
}

function angDiff(a, b) {
  let d = b - a;
  d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return d;
}

function turnTo(from, to, maxStep) {
  const d = angDiff(from, to);
  if (d > maxStep) return from + maxStep;
  if (d < -maxStep) return from - maxStep;
  return from + d;
}

function lerpAngle(a, b, t) {
  return a + angDiff(a, b) * t;
}

window.mountButterflies = mountButterflies;
