// ============================================================================
//  preview.js — project-card hover previews.
//  Real media (video/image) when a project defines `preview`; otherwise a
//  lightweight, category-themed canvas animation in the card's accent color.
//  Motion runs only while hovered/focused. Respects prefers-reduced-motion.
// ============================================================================

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Pick a visual theme from a project's categories (most distinctive wins).
const THEME_PRIORITY = ["security", "ai", "cloud", "web", "tools"];
export function themeFor(cats = []) {
  for (const t of THEME_PRIORITY) if (cats.includes(t)) return t;
  return "web";
}

// ---------------------------------------------------------------------------
//  Public: build the preview element for a project and return the node.
// ---------------------------------------------------------------------------
export function buildPreview(project) {
  const wrap = document.createElement("div");
  wrap.className = "p-preview";

  if (project.preview && project.preview.src) {
    return realMedia(wrap, project.preview);
  }
  return canvasPreview(wrap, themeFor(project.cats), project.accent || "#7c5cff");
}

// ---- Real media: <video> (hover-play) or <img> ----------------------------
function realMedia(wrap, media) {
  wrap.classList.add("has-media");
  if (media.type === "video") {
    const v = document.createElement("video");
    v.className = "p-preview-media";
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    if (media.poster) v.poster = media.poster;
    const s = document.createElement("source");
    s.src = media.src; s.type = media.mime || "video/mp4";
    v.appendChild(s);
    wrap.appendChild(v);
    const card = () => wrap.closest(".p-card");
    const play = () => { v.preload = "auto"; v.play().catch(() => {}); };
    const stop = () => { v.pause(); };
    wrap._bind = (c) => {
      c.addEventListener("mouseenter", play);
      c.addEventListener("mouseleave", stop);
      c.addEventListener("focus", play);
      c.addEventListener("blur", stop);
    };
  } else {
    const img = document.createElement("img");
    img.className = "p-preview-media";
    img.src = media.src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    wrap.appendChild(img);
  }
  return wrap;
}

// ---- Generated: themed canvas animation -----------------------------------
function canvasPreview(wrap, theme, accent) {
  wrap.classList.add("has-canvas");
  const canvas = document.createElement("canvas");
  canvas.className = "p-preview-media";
  wrap.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let raf = 0, t = 0, running = false;
  const rgb = hexToRgb(accent);

  const scene = makeScene(theme);

  function resize() {
    const r = wrap.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.layout(W, H);
    draw(); // repaint a static poster frame
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    scene.frame(ctx, W, H, t, rgb);
  }

  function loop() {
    t += 1;
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function start() {
    if (reduced || running) return;
    running = true; raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false; cancelAnimationFrame(raf);
  }

  // Expose binding so the card can drive hover/focus; also self-observe size.
  wrap._bind = (card) => {
    card.addEventListener("mouseenter", start);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focus", start);
    card.addEventListener("blur", stop);
  };

  // Lay out once visible; ResizeObserver handles the grid reflow/filtering.
  const ro = new ResizeObserver(() => resize());
  ro.observe(wrap);
  // Kick an initial layout on next frame (element not yet measured at build).
  requestAnimationFrame(resize);

  return wrap;
}

// ---------------------------------------------------------------------------
//  Scenes — each returns { layout(w,h), frame(ctx,w,h,t,rgb) }
// ---------------------------------------------------------------------------
function makeScene(theme) {
  switch (theme) {
    case "ai": return neuralScene();
    case "security": return meshScene();
    case "cloud": return flowScene();
    case "tools": return streamScene();
    default: return gridScene();
  }
}

const rgba = (rgb, a) => `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;

// Neural net: layered nodes, pulses travel along edges.
function neuralScene() {
  let layers = [], edges = [];
  return {
    layout(w, h) {
      layers = []; edges = [];
      const cols = 4, pad = 18;
      const counts = [3, 4, 4, 2];
      for (let c = 0; c < cols; c++) {
        const x = pad + (w - 2 * pad) * (c / (cols - 1));
        const n = counts[c], col = [];
        for (let i = 0; i < n; i++) {
          const y = pad + (h - 2 * pad) * ((i + 0.5) / n);
          col.push({ x, y });
        }
        layers.push(col);
      }
      for (let c = 0; c < layers.length - 1; c++)
        for (const a of layers[c]) for (const b of layers[c + 1])
          edges.push({ a, b, ph: Math.random() });
    },
    frame(ctx, w, h, t, rgb) {
      for (const e of edges) {
        ctx.strokeStyle = rgba(rgb, 0.12); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
        const p = (t * 0.01 + e.ph) % 1;
        const px = e.a.x + (e.b.x - e.a.x) * p, py = e.a.y + (e.b.y - e.a.y) * p;
        ctx.fillStyle = rgba(rgb, 0.9 * (1 - Math.abs(p - 0.5) * 1.4));
        ctx.beginPath(); ctx.arc(px, py, 1.6, 0, 7); ctx.fill();
      }
      for (const col of layers) for (const n of col) {
        const pulse = 2.6 + Math.sin(t * 0.05 + n.x + n.y) * 0.8;
        ctx.fillStyle = rgba(rgb, 0.95);
        ctx.beginPath(); ctx.arc(n.x, n.y, pulse, 0, 7); ctx.fill();
        ctx.fillStyle = rgba(rgb, 0.18);
        ctx.beginPath(); ctx.arc(n.x, n.y, pulse + 3, 0, 7); ctx.fill();
      }
    },
  };
}

// Security mesh: node cloud + connections + scanning sweep line.
function meshScene() {
  let nodes = [];
  return {
    layout(w, h) {
      nodes = [];
      const n = Math.max(10, Math.round((w * h) / 3400));
      for (let i = 0; i < n; i++)
        nodes.push({ x: Math.random() * w, y: Math.random() * h,
                     vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
    },
    frame(ctx, w, h, t, rgb) {
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 46) {
            ctx.strokeStyle = rgba(rgb, 0.14 * (1 - d / 46)); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      const sx = (t * 1.6) % (w + 60) - 30;
      const g = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
      g.addColorStop(0, rgba(rgb, 0)); g.addColorStop(0.5, rgba(rgb, 0.5)); g.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = g; ctx.fillRect(sx - 30, 0, 60, h);
      for (const p of nodes) {
        const near = Math.abs(p.x - sx) < 22;
        ctx.fillStyle = rgba(rgb, near ? 1 : 0.7);
        ctx.beginPath(); ctx.arc(p.x, p.y, near ? 2.6 : 1.6, 0, 7); ctx.fill();
      }
    },
  };
}

// Cloud flow: particles drift up-right and converge.
function flowScene() {
  let pts = [];
  return {
    layout(w, h) {
      pts = [];
      const n = Math.max(24, Math.round((w * h) / 1600));
      for (let i = 0; i < n; i++)
        pts.push({ x: Math.random() * w, y: Math.random() * h, s: 0.4 + Math.random() * 1.1 });
    },
    frame(ctx, w, h, t, rgb) {
      for (const p of pts) {
        const ang = Math.sin((p.y + t) * 0.01) * 0.8 - 0.3;
        p.x += Math.cos(ang) * p.s; p.y += Math.sin(ang) * p.s;
        if (p.x > w + 4) p.x = -4; if (p.x < -4) p.x = w + 4;
        if (p.y < -4) p.y = h + 4; if (p.y > h + 4) p.y = -4;
        ctx.fillStyle = rgba(rgb, 0.15 + p.s * 0.35);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
      }
    },
  };
}

// Tools: falling code-stream columns.
function streamScene() {
  let cols = [];
  const glyphs = "01{}<>/=;$*+#".split("");
  return {
    layout(w, h) {
      cols = [];
      const n = Math.max(6, Math.floor(w / 14));
      for (let i = 0; i < n; i++)
        cols.push({ x: (i + 0.5) * (w / n), y: Math.random() * h, speed: 0.6 + Math.random() * 1.2, len: 4 + (Math.random() * 5 | 0) });
    },
    frame(ctx, w, h, t, rgb) {
      ctx.font = "11px 'JetBrains Mono', monospace"; ctx.textAlign = "center";
      for (const c of cols) {
        c.y += c.speed;
        if (c.y - c.len * 13 > h) c.y = -Math.random() * 40;
        for (let k = 0; k < c.len; k++) {
          const y = c.y - k * 13;
          if (y < -13 || y > h + 13) continue;
          const a = k === 0 ? 0.95 : 0.5 * (1 - k / c.len);
          ctx.fillStyle = rgba(rgb, a);
          ctx.fillText(glyphs[(y + c.x | 0) % glyphs.length], c.x, y);
        }
      }
    },
  };
}

// Web: perspective grid that scrolls toward the viewer.
function gridScene() {
  return {
    layout() {},
    frame(ctx, w, h, t, rgb) {
      const horizon = h * 0.42, vx = w / 2;
      ctx.strokeStyle = rgba(rgb, 0.16); ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath(); ctx.moveTo(vx + i * 16, horizon);
        ctx.lineTo(vx + i * (w / 2), h); ctx.stroke();
      }
      for (let r = 0; r < 10; r++) {
        const p = ((r * 0.1) + (t * 0.004)) % 1;
        const y = horizon + (h - horizon) * p * p;
        ctx.strokeStyle = rgba(rgb, 0.10 + p * 0.22);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.fillStyle = rgba(rgb, 0.9);
      ctx.beginPath(); ctx.arc(vx, horizon, 2, 0, 7); ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.25);
      ctx.beginPath(); ctx.arc(vx, horizon, 6, 0, 7); ctx.fill();
    },
  };
}

function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
