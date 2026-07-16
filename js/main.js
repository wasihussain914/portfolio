// ============================================================================
//  main.js — renders content from data.js and wires up all interactions.
//  Kept framework-free on purpose; the whole site is a handful of small modules.
// ============================================================================

import {
  profile, stats, education, experience, categories, projects, skills, skillCloud,
} from "./data.js";
import { buildPreview } from "./preview.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Handle to the 3D hero, resolved once scene.js loads (used by accent switcher).
let hero3D = null;

// ---------------------------------------------------------------------------
//  1. Populate static profile bits
// ---------------------------------------------------------------------------
function renderProfile() {
  $("#hero-blurb").textContent = profile.blurb;
  $("#about-blurb").textContent = profile.blurb;
  $("#about-location").textContent = profile.location;
  $("#link-github").href = profile.links.github;
  $("#link-linkedin").href = profile.links.linkedin;
  $("#footer-name").textContent = `© ${profile.fullName}`;

  const hs = $("#hero-stats");
  stats.forEach((s) => {
    const wrap = el("div", "stat");
    wrap.innerHTML = `<div class="stat-value" data-count="${s.value}" data-prefix="${s.prefix || ""}" data-suffix="${s.suffix || ""}">${s.prefix || ""}0${s.suffix || ""}</div><div class="stat-label">${s.label}</div>`;
    hs.appendChild(wrap);
  });

  const al = $("#about-links");
  [["GitHub", profile.links.github], ["LinkedIn", profile.links.linkedin], ["Résumé", profile.links.resume], ["Email", `mailto:${profile.email}`]]
    .forEach(([label, href]) => {
      const a = el("a", null, `${label} ↗`);
      a.href = href; a.target = "_blank"; a.rel = "noopener"; a.setAttribute("data-hover", "");
      al.appendChild(a);
    });

  const edu = $("#about-edu");
  education.forEach((e) => {
    edu.appendChild(el("div", "edu-card",
      `<div class="edu-school">${e.school}</div>
       <div class="edu-degree">${e.degree}</div>
       <div class="edu-meta">${e.location} · ${e.dates}</div>
       <div class="edu-note">${e.note}</div>`));
  });

  const ce = $("#contact-email");
  ce.textContent = profile.email; ce.href = `mailto:${profile.email}`; ce.setAttribute("data-hover", "");
  const cl = $("#contact-links");
  [["GitHub", profile.links.github], ["LinkedIn", profile.links.linkedin], ["Résumé", profile.links.resume]]
    .forEach(([label, href]) => {
      const a = el("a", "btn btn-ghost", `${label} ↗`);
      a.href = href; a.target = "_blank"; a.rel = "noopener"; a.setAttribute("data-hover", "");
      cl.appendChild(a);
    });
}

// ---------------------------------------------------------------------------
//  2. Awards ribbon — a marquee of the headline wins above the projects
// ---------------------------------------------------------------------------
function renderAwards() {
  const track = $("#awards-track");
  if (!track) return;
  const wins = projects.filter((p) => p.award).map((p) => ({ name: p.name, award: p.award }));
  // duplicate the set so the marquee loops seamlessly
  const html = wins.map((w) => `<span class="award-chip"><b>${w.name}</b> — ${w.award}</span>`).join("");
  track.innerHTML = html + html;
}

// ---------------------------------------------------------------------------
//  3. Experience timeline
// ---------------------------------------------------------------------------
function renderExperience() {
  const tl = $("#timeline");
  experience.forEach((x) => {
    const item = el("div", "tl-item reveal");
    item.innerHTML = `
      <span class="tl-dot"></span>
      <div class="tl-top">
        <div class="tl-org">${x.org}</div>
        <div class="tl-dates">${x.dates}</div>
      </div>
      <div class="tl-role">${x.role}</div>
      <span class="tl-tag">${x.tag}</span>
      <ul class="tl-highlights">${x.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>`;
    tl.appendChild(item);
  });
}

// ---------------------------------------------------------------------------
//  4. Projects — filters + 3D tilt cards + detail modal
// ---------------------------------------------------------------------------
function renderProjects() {
  const filters = $("#filters");
  categories.forEach((c, i) => {
    const count = c.key === "all" ? projects.length : projects.filter((p) => p.cats.includes(c.key)).length;
    const b = el("button", "filter-btn" + (i === 0 ? " active" : ""), `${c.label} <span class="filter-count">${count}</span>`);
    b.dataset.cat = c.key; b.setAttribute("data-hover", "");
    b.addEventListener("click", () => applyFilter(c.key, b));
    filters.appendChild(b);
  });

  const grid = $("#project-grid");
  projects.forEach((p, idx) => {
    const card = el("article", "p-card reveal");
    card.style.setProperty("--card-accent", p.accent);
    card.dataset.cats = p.cats.join(" ");
    card.dataset.idx = idx;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${p.name} — view details`);
    card.innerHTML = `
      <div class="p-glow"></div>
      <div class="p-body">
      ${p.award ? `<span class="p-award">${p.award}</span>` : ""}
      <div class="p-head">
        <span class="p-name">${p.name}</span>
        <span class="p-year">${p.year}</span>
      </div>
      ${p.subtitle ? `<div class="p-subtitle">${p.subtitle}</div>` : ""}
      <p class="p-blurb">${p.blurb}</p>
      <div class="p-metrics">${p.metrics.map((m) => `<span class="p-metric">${m}</span>`).join("")}</div>
      <div class="p-foot">
        <div class="p-stack">${p.stack.map((s) => `<span>${s}</span>`).join("")}</div>
        <span class="p-link">Details →</span>
      </div>
      </div>`;
    // Preview media strip (real video/image if provided, else themed canvas).
    const preview = buildPreview(p);
    card.insertBefore(preview, card.querySelector(".p-body"));
    if (preview._bind) preview._bind(card);
    attachTilt(card);
    const open = () => openProject(idx);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    grid.appendChild(card);
  });

  buildModal();
}

function applyFilter(cat, btn) {
  $$(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  $$(".p-card").forEach((card) => {
    const match = cat === "all" || card.dataset.cats.split(" ").includes(cat);
    card.classList.toggle("hide", !match);
  });
}

// 3D tilt on pointer move (respects reduced-motion by no-op)
function attachTilt(card) {
  if (reduced) return;
  const MAX = 9;
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateY(-6px)`;
    card.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    card.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  });
  card.addEventListener("mouseleave", () => { card.style.transform = ""; });
}

// ---- Project detail modal --------------------------------------------------
let modalEl, lastFocused;
function buildModal() {
  modalEl = el("div", "modal", `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" aria-label="Close" data-close>✕</button>
      <div class="modal-body"></div>
    </div>`);
  document.body.appendChild(modalEl);
  modalEl.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closeProject(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalEl.classList.contains("open")) closeProject(); });
}

function openProject(idx) {
  const p = projects[idx];
  lastFocused = document.activeElement;
  const catLabels = p.cats.map((k) => (categories.find((c) => c.key === k) || {}).label).filter(Boolean);
  $(".modal-body", modalEl).innerHTML = `
    <div class="modal-accent" style="background:${p.accent}"></div>
    ${p.award ? `<span class="p-award">${p.award}</span>` : ""}
    <h3 id="modal-title" class="modal-name">${p.name}</h3>
    ${p.subtitle ? `<div class="p-subtitle">${p.subtitle}</div>` : ""}
    <div class="modal-year">${p.year}</div>
    <p class="modal-blurb">${p.blurb}</p>
    <div class="modal-section-label">Impact</div>
    <div class="p-metrics">${p.metrics.map((m) => `<span class="p-metric">${m}</span>`).join("")}</div>
    <div class="modal-section-label">Built with</div>
    <div class="modal-stack">${p.stack.map((s) => `<span class="skill-tag">${s}</span>`).join("")}</div>
    <div class="modal-section-label">Tagged</div>
    <div class="modal-tags">${catLabels.map((c) => `<span class="modal-tag">${c}</span>`).join("")}</div>
    <div class="modal-actions">
      <a class="btn btn-primary" href="${p.url}" target="_blank" rel="noopener" data-hover>Open project ↗</a>
      <button class="btn btn-ghost" data-close data-hover>Close</button>
    </div>`;
  modalEl.style.setProperty("--modal-accent", p.accent);
  modalEl.classList.add("open");
  document.body.classList.add("modal-lock");
  const closeBtn = $(".modal-close", modalEl);
  if (closeBtn) closeBtn.focus();
}

function closeProject() {
  if (!modalEl) return;
  modalEl.classList.remove("open");
  document.body.classList.remove("modal-lock");
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

// ---------------------------------------------------------------------------
//  5. Skills bars
// ---------------------------------------------------------------------------
function renderSkills() {
  const bars = $("#skills-bars");
  Object.entries(skills).forEach(([group, items]) => {
    const g = el("div", "skill-group");
    g.innerHTML = `<div class="skill-group-title">${group}</div>
      <div class="skill-tags">${items.map((s) => `<span class="skill-tag">${s}</span>`).join("")}</div>`;
    bars.appendChild(g);
  });
}

// ---------------------------------------------------------------------------
//  6. Rotating role text
// ---------------------------------------------------------------------------
function initRoleRotator() {
  const node = $("#role-rotator");
  const roles = profile.roles;
  let ri = 0, ci = 0, deleting = false;
  function tick() {
    const word = roles[ri];
    node.textContent = word.slice(0, ci);
    if (!deleting && ci < word.length) { ci++; setTimeout(tick, 70); }
    else if (!deleting && ci === word.length) { deleting = true; setTimeout(tick, 1600); }
    else if (deleting && ci > 0) { ci--; setTimeout(tick, 35); }
    else { deleting = false; ri = (ri + 1) % roles.length; setTimeout(tick, 250); }
  }
  tick();
}

// ---------------------------------------------------------------------------
//  7. Scroll-driven behaviours: reveal, progress bar, nav state, counters,
//     active-section highlight
// ---------------------------------------------------------------------------
function initScroll() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((n) => io.observe(n));

  const bar = $("#scroll-progress");
  const nav = $("#nav");
  function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${(window.scrollY / Math.max(h, 1)) * 100}%`;
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // active-section nav highlight
  const navLinks = $$(".nav-links a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const id = "#" + en.target.id;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => sio.observe(s));

  // Vertical section-dot navigator — mirrors the nav links, tracks scroll.
  const dotsNav = $("#dots-nav");
  if (dotsNav) {
    const secs = [
      ["#hero", "Home"], ["#about", "About"], ["#experience", "Experience"],
      ["#projects", "Projects"], ["#skills", "Skills"], ["#contact", "Contact"],
    ];
    secs.forEach(([href, label]) => {
      const a = el("a", "dot", `<span class="dot-label">${label}</span>`);
      a.href = href; a.setAttribute("aria-label", label); a.dataset.for = href;
      dotsNav.appendChild(a);
    });
    const dots = $$(".dot", dotsNav);
    const dio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = "#" + en.target.id;
          dots.forEach((d) => d.classList.toggle("on", d.dataset.for === id));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => dio.observe(s));
  }

  const counters = $$("[data-count]");
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => cio.observe(c));
}

function animateCount(node) {
  const target = +node.dataset.count;
  const prefix = node.dataset.prefix || "";
  const suffix = node.dataset.suffix || "";
  const dur = 1500;
  const start = performance.now();
  function frame(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    let val = Math.round(target * eased);
    const disp = val >= 1000 ? val.toLocaleString() : val;
    node.textContent = `${prefix}${disp}${suffix}`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
//  8. Custom cursor + magnetic buttons + mobile nav
// ---------------------------------------------------------------------------
function initCursor() {
  if (window.matchMedia("(hover: none)").matches) return;
  const ring = $("#cursor"), dot = $("#cursor-dot");
  let rx = 0, ry = 0, dx = 0, dy = 0;
  window.addEventListener("mousemove", (e) => {
    dx = e.clientX; dy = e.clientY;
    dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
  });
  (function loop() {
    rx += (dx - rx) * 0.18; ry += (dy - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("[data-hover], a, button")) ring.classList.add("grow");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-hover], a, button")) ring.classList.remove("grow");
  });
}

function initMagnetic() {
  if (reduced || window.matchMedia("(hover: none)").matches) return;
  $$(".btn, .nav-cta").forEach((b) => {
    b.addEventListener("mousemove", (e) => {
      const r = b.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      b.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
    });
    b.addEventListener("mouseleave", () => { b.style.transform = ""; });
  });
}

function initNav() {
  const nav = $("#nav"), toggle = $("#nav-toggle");
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
  $$(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => nav.classList.remove("open")));
}

// ---------------------------------------------------------------------------
//  9. Accent theme switcher — recolours CSS + the live 3D scene, persisted
// ---------------------------------------------------------------------------
const THEMES = [
  { key: "violet", accent: "#7c5cff", glow: "rgba(124,92,255,0.5)", hex3d: 0x7c5cff },
  { key: "cyan", accent: "#22d3ee", glow: "rgba(34,211,238,0.5)", hex3d: 0x22d3ee },
  { key: "emerald", accent: "#22d3a6", glow: "rgba(34,211,166,0.5)", hex3d: 0x22d3a6 },
  { key: "rose", accent: "#f472b6", glow: "rgba(244,114,182,0.5)", hex3d: 0xf472b6 },
  { key: "amber", accent: "#fbbf24", glow: "rgba(251,191,36,0.5)", hex3d: 0xfbbf24 },
];
function applyTheme(t) {
  document.documentElement.style.setProperty("--accent", t.accent);
  document.documentElement.style.setProperty("--glow", t.glow);
  if (hero3D && hero3D.setAccent) hero3D.setAccent(t.hex3d);
  try { localStorage.setItem("pf-theme", t.key); } catch (_) {}
  $$(".swatch").forEach((s) => s.classList.toggle("on", s.dataset.key === t.key));
}
function initThemeSwitcher() {
  const wrap = $("#accent-switcher");
  if (!wrap) return;
  THEMES.forEach((t) => {
    const s = el("button", "swatch");
    s.dataset.key = t.key;
    s.style.background = t.accent;
    s.setAttribute("aria-label", `${t.key} accent`);
    s.setAttribute("data-hover", "");
    s.addEventListener("click", () => applyTheme(t));
    wrap.appendChild(s);
  });
  let saved = "violet";
  try { saved = localStorage.getItem("pf-theme") || "violet"; } catch (_) {}
  applyTheme(THEMES.find((t) => t.key === saved) || THEMES[0]);
}
function currentTheme3D() {
  let saved = "violet";
  try { saved = localStorage.getItem("pf-theme") || "violet"; } catch (_) {}
  return (THEMES.find((t) => t.key === saved) || THEMES[0]).hex3d;
}

// ---------------------------------------------------------------------------
//  10. Command palette (⌘K / Ctrl-K) — jump to a section, project, or link
// ---------------------------------------------------------------------------
function initCommandPalette() {
  const pal = el("div", "cmdk", `
    <div class="cmdk-backdrop" data-close></div>
    <div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">
      <input class="cmdk-input" type="text" placeholder="Jump to a section, project, or link…" aria-label="Search" />
      <ul class="cmdk-list" role="listbox"></ul>
      <div class="cmdk-hint"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
    </div>`);
  document.body.appendChild(pal);
  const input = $(".cmdk-input", pal);
  const list = $(".cmdk-list", pal);

  const items = [
    { label: "Home", hint: "section", type: "scroll", target: "#hero", icon: "◆" },
    { label: "About", hint: "section", type: "scroll", target: "#about", icon: "◆" },
    { label: "Experience", hint: "section", type: "scroll", target: "#experience", icon: "◆" },
    { label: "Projects", hint: "section", type: "scroll", target: "#projects", icon: "◆" },
    { label: "Skills", hint: "section", type: "scroll", target: "#skills", icon: "◆" },
    { label: "Contact", hint: "section", type: "scroll", target: "#contact", icon: "◆" },
    { label: "GitHub", hint: "link", type: "link", target: profile.links.github, icon: "↗" },
    { label: "LinkedIn", hint: "link", type: "link", target: profile.links.linkedin, icon: "↗" },
    { label: "Résumé (PDF)", hint: "link", type: "link", target: profile.links.resume, icon: "↗" },
    { label: "Email Wasi", hint: "link", type: "link", target: `mailto:${profile.email}`, icon: "↗" },
    ...projects.map((p, i) => ({ label: p.name, hint: p.award ? "🏆 project" : "project", type: "project", target: i, icon: "▸" })),
  ];

  let filtered = items.slice(), active = 0;
  function draw() {
    list.innerHTML = "";
    filtered.forEach((it, i) => {
      const li = el("li", "cmdk-item" + (i === active ? " active" : ""),
        `<span class="cmdk-ico">${it.icon}</span><span class="cmdk-label">${it.label}</span><span class="cmdk-hint-tag">${it.hint}</span>`);
      li.addEventListener("mouseenter", () => { active = i; draw(); });
      li.addEventListener("click", () => run(it));
      list.appendChild(li);
    });
  }
  function filter(q) {
    q = q.trim().toLowerCase();
    filtered = q ? items.filter((it) => it.label.toLowerCase().includes(q)) : items.slice();
    active = 0; draw();
  }
  function run(it) {
    close();
    if (it.type === "scroll") { const t = $(it.target); if (t) t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }
    else if (it.type === "link") { window.open(it.target, "_blank", "noopener"); }
    else if (it.type === "project") { openProject(it.target); }
  }
  function open() { pal.classList.add("open"); document.body.classList.add("modal-lock"); input.value = ""; filter(""); setTimeout(() => input.focus(), 20); }
  function close() { pal.classList.remove("open"); document.body.classList.remove("modal-lock"); }

  input.addEventListener("input", () => filter(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); draw(); scrollActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); draw(); scrollActive(); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) run(filtered[active]); }
  });
  function scrollActive() { const a = $(".cmdk-item.active", list); if (a) a.scrollIntoView({ block: "nearest" }); }
  pal.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) close(); });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.classList.contains("open") ? close() : open(); }
    else if (e.key === "Escape" && pal.classList.contains("open")) close();
    else if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName) && !pal.classList.contains("open")) { e.preventDefault(); open(); }
  });

  const trigger = $("#cmdk-trigger");
  if (trigger) trigger.addEventListener("click", open);
}

// ---------------------------------------------------------------------------
//  11. Konami easter egg — ↑↑↓↓←→←→ B A → confetti + a little message
// ---------------------------------------------------------------------------
function initKonami() {
  const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  document.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) { pos = 0; partyMode(); }
  });
}
function partyMode() {
  const layer = el("div", "confetti-layer");
  document.body.appendChild(layer);
  const colors = ["#7c5cff", "#22d3ee", "#f472b6", "#fbbf24", "#22d3a6", "#fff"];
  for (let i = 0; i < 140; i++) {
    const c = el("i", "confetti");
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[(Math.random() * colors.length) | 0];
    c.style.animationDelay = Math.random() * 0.6 + "s";
    c.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(c);
  }
  const toast = el("div", "egg-toast", "🪓 You found the secret. Now go hire Wasi.");
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => { toast.classList.remove("show"); }, 3200);
  setTimeout(() => { layer.remove(); toast.remove(); }, 4600);
}

// ---------------------------------------------------------------------------
//  12. Boot
// ---------------------------------------------------------------------------
function boot() {
  renderProfile();
  renderAwards();
  renderExperience();
  renderProjects();
  renderSkills();
  initRoleRotator();
  initScroll();
  initCursor();
  initMagnetic();
  initNav();
  initThemeSwitcher();
  initCommandPalette();
  initKonami();

  requestAnimationFrame(() => {
    $$(".hero .reveal").forEach((n) => n.classList.add("in"));
  });

  // Load the 3D layer lazily & tolerantly.
  import("./scene.js")
    .then(async (mod) => {
      try {
        hero3D = await mod.initHero($("#bg-canvas"), { accent: currentTheme3D() });
      } catch (e) { console.warn("[hero 3D] skipped:", e); }
      try { mod.initSkillSphere($("#skills-canvas"), skillCloud); } catch (e) { console.warn("[skill sphere] skipped:", e); }
    })
    .catch((e) => console.warn("[three.js] failed to load — running without 3D:", e));

  const loader = $("#loader");
  const hide = () => loader.classList.add("hidden");
  if (document.readyState === "complete") setTimeout(hide, 500);
  else window.addEventListener("load", () => setTimeout(hide, 500));
  setTimeout(hide, 3500);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
