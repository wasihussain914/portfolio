// ============================================================================
//  3D scenes — Three.js
//  1) Hero background: a deep particle field, floating wireframe polyhedra, a
//     constellation network and occasional shooting stars — all lit by real
//     UnrealBloom post-processing, reacting to the mouse and to scroll.
//  2) Skills sphere: a draggable rotating cloud of skill labels in 3D.
//
//  Everything degrades gracefully:
//   • if WebGL/three fail to load, main.js catches the rejected import and the
//     page still works with zero 3D;
//   • if the post-processing addons fail, the hero falls back to a plain
//     renderer.render() so the scene still shows.
// ============================================================================

import * as THREE from "three";

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A soft round sprite so bloomed points glow as circles rather than hard
// squares (the default PointsMaterial quad).
function makeDotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// Try to pull in the post-processing stack. Wrapped so a CDN hiccup on the
// addons never takes down the whole hero — we just render without bloom.
async function loadComposer() {
  try {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { FXAAShader }] =
      await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/UnrealBloomPass.js"),
        import("three/addons/postprocessing/ShaderPass.js"),
        import("three/addons/shaders/FXAAShader.js"),
      ]);
    return { EffectComposer, RenderPass, UnrealBloomPass, ShaderPass, FXAAShader };
  } catch (e) {
    console.warn("[hero] post-processing unavailable — rendering without bloom:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
//  Hero background scene
// ---------------------------------------------------------------------------
export async function initHero(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.05);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 14);

  // Accent palette can be re-tinted live by the accent switcher.
  let accent = new THREE.Color(opts.accent || 0x7c5cff);
  const accent2 = new THREE.Color(0x22d3ee);
  const accent3 = new THREE.Color(0xf472b6);

  // --- Particle starfield ---------------------------------------------------
  const mobile = window.innerWidth < 700;
  const COUNT = mobile ? 1700 : 3800;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const palette = [accent, accent2, accent3, new THREE.Color(0xffffff)];
  for (let i = 0; i < COUNT; i++) {
    const r = 6 + Math.pow(Math.random(), 0.6) * 34;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const dotTex = makeDotTexture();
  const pMat = new THREE.PointsMaterial({ size: 0.16, map: dotTex, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const stars = new THREE.Points(pGeo, pMat);
  scene.add(stars);

  // --- Constellation network ------------------------------------------------
  // A cluster of nodes near the centre, joined by lines whose opacity fades
  // with distance — gives the hero a "neural graph" feel behind the name.
  const NODE_N = mobile ? 26 : 46;
  const nodes = [];
  for (let i = 0; i < NODE_N; i++) {
    nodes.push(new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8 - 2,
    ));
  }
  const nodeVel = nodes.map(() => new THREE.Vector3(
    (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.006));
  const LINK_DIST = 5.2;
  const maxSegs = NODE_N * NODE_N;
  const linePos = new Float32Array(maxSegs * 2 * 3);
  const lineCol = new Float32Array(maxSegs * 2 * 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage));
  lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3).setUsage(THREE.DynamicDrawUsage));
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
  const constellation = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(constellation);

  // node glow dots
  const nodeGeo = new THREE.BufferGeometry();
  const nodeDotPos = new Float32Array(NODE_N * 3);
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodeDotPos, 3).setUsage(THREE.DynamicDrawUsage));
  const nodeMat = new THREE.PointsMaterial({ size: 0.34, map: dotTex, color: accent2, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const nodeDots = new THREE.Points(nodeGeo, nodeMat);
  scene.add(nodeDots);

  function updateConstellation() {
    let seg = 0;
    for (let i = 0; i < NODE_N; i++) {
      const a = nodes[i];
      a.add(nodeVel[i]);
      // gentle bounds so the cloud breathes in place
      ["x", "y", "z"].forEach((ax) => {
        const lim = ax === "y" ? 7 : ax === "z" ? 6 : 11;
        if (a[ax] > lim || a[ax] < -lim) nodeVel[i][ax] *= -1;
      });
      nodeDotPos[i * 3] = a.x; nodeDotPos[i * 3 + 1] = a.y; nodeDotPos[i * 3 + 2] = a.z;
      for (let j = i + 1; j < NODE_N; j++) {
        const b = nodes[j];
        const d = a.distanceTo(b);
        if (d < LINK_DIST) {
          const alpha = 1 - d / LINK_DIST;
          const o = seg * 6;
          linePos[o] = a.x; linePos[o + 1] = a.y; linePos[o + 2] = a.z;
          linePos[o + 3] = b.x; linePos[o + 4] = b.y; linePos[o + 5] = b.z;
          for (let k = 0; k < 2; k++) {
            lineCol[o + k * 3] = accent.r * alpha;
            lineCol[o + k * 3 + 1] = accent.g * alpha + accent2.g * alpha * 0.4;
            lineCol[o + k * 3 + 2] = accent2.b * alpha;
          }
          seg++;
        }
      }
    }
    lineGeo.setDrawRange(0, seg * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
    nodeGeo.attributes.position.needsUpdate = true;
  }

  // --- Floating wireframe polyhedra -----------------------------------------
  const shapes = [];
  const geos = [
    new THREE.IcosahedronGeometry(2.1, 0),
    new THREE.OctahedronGeometry(1.5, 0),
    new THREE.TorusGeometry(1.4, 0.42, 12, 32),
    new THREE.DodecahedronGeometry(1.6, 0),
    new THREE.TetrahedronGeometry(1.5, 0),
    new THREE.TorusKnotGeometry(1.1, 0.32, 64, 8, 2, 3),
  ];
  const shapeColors = [0x7c5cff, 0x22d3ee, 0xf472b6, 0x8b7cff, 0x35e0c0, 0xffb86c];
  geos.forEach((geo, i) => {
    const mat = new THREE.MeshBasicMaterial({ color: shapeColors[i], wireframe: true, transparent: true, opacity: 0.42 });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / geos.length) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * 7.8, Math.sin(angle * 1.3) * 3.2, -3 - i * 1.2);
    mesh.userData = {
      rot: new THREE.Vector3((Math.random() - 0.5) * 0.005, (Math.random() - 0.5) * 0.005, (Math.random() - 0.5) * 0.005),
      floatSpeed: 0.4 + Math.random() * 0.5,
      floatAmp: 0.4 + Math.random() * 0.5,
      baseY: mesh.position.y,
    };
    shapes.push(mesh);
    scene.add(mesh);
  });

  // Central glowing core icosahedron — the bright heart of the bloom.
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 1),
    new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.32 })
  );
  scene.add(core);
  const coreInner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.5 })
  );
  scene.add(coreInner);

  // --- Shooting stars -------------------------------------------------------
  const shooters = [];
  function spawnShooter(t) {
    const start = new THREE.Vector3((Math.random() - 0.5) * 40, 10 + Math.random() * 6, -6 - Math.random() * 8);
    const dir = new THREE.Vector3(-0.6 - Math.random() * 0.4, -0.7 - Math.random() * 0.3, 0).normalize();
    const geo = new THREE.BufferGeometry().setFromPoints([start.clone(), start.clone()]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    shooters.push({ line, start, dir, born: t, life: 1.1 + Math.random() * 0.5, speed: 26 + Math.random() * 10 });
  }
  function updateShooters(t) {
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      const age = t - s.born;
      if (age > s.life) { scene.remove(s.line); s.line.geometry.dispose(); s.line.material.dispose(); shooters.splice(i, 1); continue; }
      const head = s.start.clone().addScaledVector(s.dir, s.speed * age);
      const tail = head.clone().addScaledVector(s.dir, -2.4);
      s.line.geometry.setFromPoints([tail, head]);
      s.line.material.opacity = 0.9 * (1 - age / s.life);
    }
  }

  // --- Interaction state ----------------------------------------------------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = 0;
  const ripples = [];

  function onPointer(e) {
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    mouse.tx = (cx / window.innerWidth) * 2 - 1;
    mouse.ty = (cy / window.innerHeight) * 2 - 1;
  }
  window.addEventListener("mousemove", onPointer, { passive: true });
  window.addEventListener("touchmove", onPointer, { passive: true });
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  // Click near the hero sends a shock through the core.
  window.addEventListener("pointerdown", (e) => {
    if (e.clientY < window.innerHeight) ripples.push({ born: performance.now() });
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    if (fxaaPass) {
      const pr = renderer.getPixelRatio();
      fxaaPass.material.uniforms["resolution"].value.set(1 / (window.innerWidth * pr), 1 / (window.innerHeight * pr));
    }
  }
  window.addEventListener("resize", onResize);

  // --- Post-processing ------------------------------------------------------
  let composer = null, bloomPass = null, fxaaPass = null;
  const pp = prefersReduced ? null : await loadComposer();
  if (pp) {
    try {
      composer = new pp.EffectComposer(renderer);
      composer.addPass(new pp.RenderPass(scene, camera));
      bloomPass = new pp.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        mobile ? 0.7 : 0.95, // strength
        0.7,                 // radius
        0.12,                // threshold
      );
      composer.addPass(bloomPass);
      fxaaPass = new pp.ShaderPass(pp.FXAAShader);
      const pr = renderer.getPixelRatio();
      fxaaPass.material.uniforms["resolution"].value.set(1 / (window.innerWidth * pr), 1 / (window.innerHeight * pr));
      composer.addPass(fxaaPass);
      composer.setSize(window.innerWidth, window.innerHeight);
    } catch (e) {
      console.warn("[hero] composer setup failed — plain render:", e);
      composer = null;
    }
  }

  const clock = new THREE.Clock();
  let raf, running = true;
  let nextShoot = 1.5;
  function animate() {
    if (!running) return;
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    camera.position.x += (mouse.x * 2.4 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 1.6 - camera.position.y) * 0.04;
    const scrollNorm = scrollY / Math.max(window.innerHeight, 1);
    camera.position.z = 14 + scrollNorm * 6;
    camera.lookAt(0, -scrollNorm * 1.5, 0);

    if (!prefersReduced) {
      stars.rotation.y = t * 0.02;
      stars.rotation.x = t * 0.01;
      core.rotation.x = t * 0.15;
      core.rotation.y = t * 0.22;
      coreInner.rotation.x = -t * 0.4;
      coreInner.rotation.z = t * 0.3;

      // ripple pulse on the core after a click
      let pulse = 1 + Math.sin(t * 1.2) * 0.04;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const age = (performance.now() - ripples[i].born) / 1000;
        if (age > 0.9) { ripples.splice(i, 1); continue; }
        pulse += Math.sin(age * 12) * 0.25 * (1 - age / 0.9);
      }
      core.scale.setScalar(pulse);
      coreInner.scale.setScalar(1 + Math.sin(t * 2.4) * 0.15);

      shapes.forEach((m) => {
        m.rotation.x += m.userData.rot.x;
        m.rotation.y += m.userData.rot.y;
        m.rotation.z += m.userData.rot.z;
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.floatSpeed) * m.userData.floatAmp;
      });

      updateConstellation();

      if (t > nextShoot) { spawnShooter(t); nextShoot = t + 2.5 + Math.random() * 4; }
      updateShooters(t);
    }

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  animate();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; animate(); }
  });

  // Public handle so the accent switcher can re-tint the scene live.
  return {
    renderer,
    scene,
    setAccent(hex) {
      accent = new THREE.Color(hex);
      core.material.color = accent;
      pMat.needsUpdate = true;
    },
    setBloom(v) { if (bloomPass) bloomPass.strength = v; },
  };
}

// ---------------------------------------------------------------------------
//  Skills sphere — draggable 3D cloud of text sprites
// ---------------------------------------------------------------------------
export function initSkillSphere(canvas, labels) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function size() {
    const rect = canvas.getBoundingClientRect();
    const s = Math.max(rect.width, 1);
    renderer.setSize(s, s, false);
    return s;
  }
  size();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 15;

  const group = new THREE.Group();
  scene.add(group);

  const R = 6.4;
  const N = labels.length;
  const sprites = [];
  labels.forEach((text, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    const sprite = makeTextSprite(text);
    sprite.position.set(Math.cos(phi) * radius * R, y * R, Math.sin(phi) * radius * R);
    sprite.userData.text = text;
    sprites.push(sprite);
    group.add(sprite);
  });

  function makeTextSprite(text, highlight = false) {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const font = 44;
    ctx.font = `600 ${font}px "Space Grotesk", sans-serif`;
    const w = ctx.measureText(text).width;
    c.width = w + 40; c.height = font + 30;
    ctx.font = `600 ${font}px "Space Grotesk", sans-serif`;
    ctx.textBaseline = "middle";
    const grad = ctx.createLinearGradient(0, 0, c.width, 0);
    if (highlight) { grad.addColorStop(0, "#fff"); grad.addColorStop(1, "#f472b6"); }
    else { grad.addColorStop(0, "#e8ecf4"); grad.addColorStop(1, "#22d3ee"); }
    ctx.fillStyle = grad;
    ctx.fillText(text, 20, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set((c.width / c.height) * 1.15, 1.15, 1);
    sprite.userData.aspect = c.width / c.height;
    return sprite;
  }

  // Drag-to-rotate + inertia + hover highlight
  const rot = { x: 0.0006, y: 0.0022 };
  let dragging = false, moved = false, last = { x: 0, y: 0 };
  function down(e) { dragging = true; moved = false; last = pt(e); }
  function move(e) {
    if (!dragging) return;
    const p = pt(e);
    if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) > 3) moved = true;
    rot.y = (p.x - last.x) * 0.0009;
    rot.x = (p.y - last.y) * 0.0009;
    last = p;
  }
  function up() { dragging = false; }
  function pt(e) { return { x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY }; }
  canvas.addEventListener("mousedown", down); window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", down, { passive: true }); window.addEventListener("touchmove", move, { passive: true }); window.addEventListener("touchend", up);

  window.addEventListener("resize", size);

  let raf, running = true;
  function animate() {
    if (!running) return;
    raf = requestAnimationFrame(animate);
    if (!dragging && !prefersReduced) { rot.y += (0.0022 - rot.y) * 0.02; rot.x += (0.0006 - rot.x) * 0.02; }
    group.rotation.y += rot.y;
    group.rotation.x += rot.x;
    group.children.forEach((s) => {
      const z = s.position.clone().applyMatrix4(group.matrixWorld).z;
      s.material.opacity = THREE.MathUtils.mapLinear(z, -R, R, 0.25, 1);
    });
    renderer.render(scene, camera);
  }
  animate();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; animate(); }
  });

  return { renderer, scene };
}
