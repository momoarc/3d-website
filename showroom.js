/**
 * ============================================================
 * PORTE PRESTIGE — Showroom 360°  v3.1  (optimised)
 * ============================================================
 *
 * PERFORMANCE WINS vs v2:
 *  • roomGroup rotation  → floor & ceiling co-rotate with walls
 *  • MeshLambertMaterial → no PBR / no per-fragment specular
 *  • 2 lights only       → was 1 ambient + N spotlights
 *  • LineSegments frames → 1 draw-call gold border, not 4 boxes
 *  • DPR capped at 1.5   → was 2.0
 *  • 256 px floor tex    → was 512 px
 *  • Circle 32 seg       → was 64 seg
 *  • DOM throttle        → hotspots updated every 2nd/3rd frame only
 *  • Pre-allocated vec3  → zero GC allocations in animation loop
 *  • LinearToneMapping   → was ACESFilmic
 *
 * NEW IN v3.1:
 *  • Shared PlaneGeometry → 1 geo object for all walls (was N)
 *  • No .clone() in loop  → fixed V3 alloc bug in _updateHotspots
 *  • powerPreference hint → GPU picks high-perf adapter
 *  • Conditional antialias → OFF on mobile (DPR≤1), ON on desktop
 *  • Adaptive frame-skip  → every 3rd frame on mobile, 2nd on desktop
 *
 * ── HOW TO USE ──────────────────────────────────────────────
 *   import { initShowroom } from './showroom.js';
 *   initShowroom(containerEl, (category) => showPage('shop', category));
 * ============================================================
 */

import * as THREE from 'three';

/* ════════════════════════════════════════════════════════════════
   ██████████████████████████████████████████████████████████████
   ██                                                          ██
   ██   🎨  WALLS — THE ONLY BLOCK YOU NEED TO EDIT           ██
   ██                                                          ██
   ██   ▸ ADD a wall    →  paste a new { … } line below        ██
   ██   ▸ REMOVE a wall →  delete one { … } line               ██
   ██   ▸ Minimum 2 · Maximum ~12 (8 recommended)              ██
   ██                                                          ██
   ██   image     file in the site folder  OR  full URL        ██
   ██   label     text shown on the hotspot & tooltip          ██
   ██   category  page opened on click (see list below)        ██
   ██                                                          ██
   ██   VALID category values:                                 ██
   ██     'blindées'  'entrée'  'intérieure'  'verre'          ██
   ██     'aluminium'  'shop'  'order'                         ██
   ██                                                          ██
   ██████████████████████████████████████████████████████████████
   ════════════════════════════════════════════════════════════════ */
export const DEFAULT_WALLS = [

  // ── WALL 1 ── (faces camera at start-up) ─────────────────────
  { image: 'steel-door.jpg',  label: 'Portes Blindées',    category: 'blindées'   },

  // ── WALL 2 ──────────────────────────────────────────────────
  { image: 'wooden-door.jpg', label: "Portes d'Entrée",    category: 'entrée'     },

  // ── WALL 3 ──────────────────────────────────────────────────
  { image: 'panel-door.jpg',  label: 'Portes Intérieures', category: 'intérieure' },

  // ── WALL 4 ──────────────────────────────────────────────────
  { image: 'glass-door.jpg',  label: 'Portes Vitrées',     category: 'verre'      },

  /* ── TO ADD A 5th WALL, uncomment and edit the line below: ──
  { image: 'aluminium-door.jpg', label: 'Portes Aluminium', category: 'aluminium' },
  */

];
/* ════════════════════════════════════════════════════════════════
   END OF WALLS BLOCK
   ════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────
   ROOM APPEARANCE — safe to tweak
   ───────────────────────────────────────────────────────────── */
export const DEFAULT_ROOM = {
  radius:        5.2,       // distance center → each wall (meters)
  height:        3.8,       // room / wall height (meters)
  fov:           72,        // camera field of view (degrees)

  // ── Colours ───────────────────────────────────────────────
  fogColor:      0x0b0906,
  fogNear:       5,
  fogFar:        13,
  wallBaseColor: 0x1c1510,  // placeholder before texture loads
  goldColor:     0xc9a84c,  // frame outline colour
  floorColor:    0x130e0a,  // used when no floorImage is set
  ceilingColor:  0x0d0b08,  // used when no ceilingImage is set

  // ── Textures — set a filename (in site folder) or full URL ─
  // Place the real store photo in the same folder as index.html
  // then write its filename here.  Leave null for the default.
  floorImage:    null,      // e.g.  'store-floor.jpg'
  ceilingImage:  null,      // e.g.  'store-ceiling.jpg'

  // ── Controls ──────────────────────────────────────────────
  rotationSpeed:   0.004,   // drag sensitivity  (0.002=slow · 0.008=fast)
  arrowStep:       Math.PI / 4, // 45° per arrow click / key press
  easing:          0.10,    // camera lerp  (0=instant · 0.2=very smooth)
  autoRotateSpeed: 0.0003,  // idle auto-spin  (0 = disabled)
  autoRotateDelay: 4000,    // ms idle before auto-spin resumes
};


/* ─────────────────────────────────────────────────────────────
   PUBLIC API
   ───────────────────────────────────────────────────────────── */
/**
 * initShowroom(container, onNavigate, options?)
 *   container  – HTMLElement the canvas goes inside
 *   onNavigate – callback(category) fired on wall click
 *   options    – { walls?, room? }  override defaults
 * Returns { destroy, reconfigure }
 */
export function initShowroom(container, onNavigate, options = {}) {
  const v = new Showroom360(container, onNavigate, options);
  return { destroy: () => v.destroy(), reconfigure: (w) => v.reconfigure(w) };
}


/* ─────────────────────────────────────────────────────────────
   INTERNAL ENGINE
   ───────────────────────────────────────────────────────────── */
class Showroom360 {

  constructor(container, onNavigate, options) {
    this.container  = container;
    this.onNavigate = onNavigate || (() => {});
    this.cfg        = { ...DEFAULT_ROOM, ...(options.room || {}) };
    this.walls      = this._loadWalls(options.walls);

    // Rotation state
    this.yaw         = 0;       // current angle
    this.targetYaw   = 0;       // eased-toward target
    this.isDown      = false;
    this.lastX       = 0;
    this.dragStart   = null;
    this.hoveredWall = null;
    this.wallMeshes  = [];      // only these are raycasted / clickable
    this.hotspotEls  = [];
    this._listeners  = [];
    this._raf        = null;
    this._autoTimer  = null;
    this._autoOn     = false;
    this._frame      = 0;       // frame counter for throttle

    // Pre-allocated objects — zero GC pressure in animation loop
    this._v3    = new THREE.Vector3();
    this._v3b   = new THREE.Vector3();
    this._v3c   = new THREE.Vector3(); // extra slot — no more .clone() in loop
    this._ptr   = new THREE.Vector2();
    this._ray   = new THREE.Raycaster();

    // Adaptive frame-skip: mobile gets every-3rd, desktop every-2nd
    this._hsSkip = window.devicePixelRatio <= 1 ? 3 : 2;

    this._initRenderer();
    this._initScene();
    this._buildRoom();
    this._buildHotspots();
    this._bindControls();
    this._animate();
  }


  /* ── WALLS CONFIG ──────────────────────────────────────── */
  _loadWalls(override) {
    if (override) return override;
    try {
      const s = localStorage.getItem('pp_showroom_walls');
      if (s) return JSON.parse(s);
    } catch (_) {}
    return DEFAULT_WALLS;
  }


  /* ── RENDERER ──────────────────────────────────────────── */
  _initRenderer() {
    this.W = this.container.clientWidth  || window.innerWidth;
    this.H = this.container.clientHeight || window.innerHeight;

    // antialias ON desktop (DPR>1 already smooths mobile), OFF on mobile for speed
    const isMobile = window.devicePixelRatio <= 1;
    this.renderer = new THREE.WebGLRenderer({
      antialias:       !isMobile,           // ← skip AA on mobile
      powerPreference: 'high-performance',  // ← hint to GPU driver
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // ← capped 1.5
    this.renderer.setSize(this.W, this.H);
    this.renderer.toneMapping         = THREE.LinearToneMapping;          // ← faster than ACES
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled   = false;

    const c = this.renderer.domElement;
    c.style.cssText = 'display:block;position:absolute;inset:0;';
    c.style.cursor  = 'grab';
    this.container.appendChild(c);
  }


  /* ── SCENE & CAMERA ────────────────────────────────────── */
  _initScene() {
    const { cfg } = this;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(cfg.fogColor);
    this.scene.fog = new THREE.Fog(cfg.fogColor, cfg.fogNear, cfg.fogFar);

    // Camera is FIXED — we rotate the room group, not the camera
    this.camera = new THREE.PerspectiveCamera(cfg.fov, this.W / this.H, 0.1, 100);
    this.camera.position.set(0, cfg.height / 2, 0);
    this.camera.lookAt(0, cfg.height / 2, 10); // always faces +Z

    // ── LIGHTS  (2 only — cheap) ───────────────────────────
    this.scene.add(new THREE.AmbientLight(0xfff0dc, 0.85));      // warm fill
    this.scene.add(new THREE.HemisphereLight(0xffe8c8, 0x100c08, 0.55)); // sky/ground
  }


  /* ── ROOM (all children go in roomGroup) ──────────────── */
  _buildRoom() {
    const { scene, cfg, walls } = this;
    const loader  = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    this.roomGroup = new THREE.Group();
    scene.add(this.roomGroup);

    const N         = walls.length;
    const angleStep = (Math.PI * 2) / N;
    const wallW     = 2 * cfg.radius * Math.tan(Math.PI / N);

    // Circumradius: distance from center to each wall CORNER.
    // For a regular N-gon whose inradius (center→wall-midpoint) = cfg.radius,
    // the corner distance = cfg.radius / cos(π/N).
    // We add 5% margin so the circle fully covers gaps at any wall count.
    const floorR    = (cfg.radius / Math.cos(Math.PI / N)) * 1.05;

    // ── FLOOR ─────────────────────────────────────────────
    const floorMat = new THREE.MeshBasicMaterial({         // ← MeshBasicMaterial: free
      color: cfg.floorColor,
    });
    if (cfg.floorImage) {
      loader.load(cfg.floorImage, (tex) => {
        tex.colorSpace  = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        floorMat.map   = tex;
        floorMat.color.set(0xffffff);
        floorMat.needsUpdate = true;
      });
    } else {
      floorMat.map   = this._makeFloorTex();                // procedural fallback
      floorMat.color.set(0xffffff);
    }
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(floorR, 32),      // ← 32 segments (was 64)
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.roomGroup.add(floor);

    // ── CEILING ───────────────────────────────────────────
    const ceilMat = new THREE.MeshBasicMaterial({ color: cfg.ceilingColor });
    if (cfg.ceilingImage) {
      loader.load(cfg.ceilingImage, (tex) => {
        tex.colorSpace  = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        ceilMat.map   = tex;
        ceilMat.color.set(0xffffff);
        ceilMat.needsUpdate = true;
      });
    }
    const ceil = new THREE.Mesh(
      new THREE.CircleGeometry(floorR, 32),
      ceilMat
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = cfg.height;
    this.roomGroup.add(ceil);

    // Ceiling emissive strip (light panel illusion)
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(cfg.radius * 0.45, 0.11),
      new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: 0.82 })
    );
    strip.rotation.x = Math.PI / 2;
    strip.position.y = cfg.height - 0.005;
    this.roomGroup.add(strip);

    // ── WALLS ─────────────────────────────────────────────
    let loaded = 0;
    this.wallMeshes = [];

    // ONE shared geometry for all walls — saves N-1 geometry objects
    const sharedWallGeo = new THREE.PlaneGeometry(wallW, cfg.height);

    walls.forEach((data, i) => {
      const angle = i * angleStep;
      const cx = Math.sin(angle) * cfg.radius;
      const cz = Math.cos(angle) * cfg.radius;
      const cy = cfg.height / 2;

      // Wall material — MeshLambertMaterial: no PBR, very fast
      const mat = new THREE.MeshLambertMaterial({
        color: cfg.wallBaseColor,
        emissive: new THREE.Color(0x000000),
      });

      loader.load(data.image,
        (tex) => {
          tex.colorSpace  = THREE.SRGBColorSpace;
          tex.minFilter   = THREE.LinearFilter;
          mat.map         = tex;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
          loaded++;
          this._setLoadProgress(Math.round(loaded / N * 100));
          if (loaded === N) this._onLoaded();
        },
        undefined,
        () => { loaded++; if (loaded === N) this._onLoaded(); }
      );

      // ← shared geometry — no per-wall PlaneGeometry allocation
      const mesh = new THREE.Mesh(sharedWallGeo, mat);
      mesh.position.set(cx, cy, cz);
      mesh.lookAt(0, cy, 0);
      mesh.userData = { ...data, index: i, angle };
      this.roomGroup.add(mesh);
      this.wallMeshes.push(mesh);

      // Gold border — one LineSegments draw call, not 4 boxes
      const frame = new THREE.LineSegments(
        this._rectFrameGeo(wallW, cfg.height),
        new THREE.LineBasicMaterial({ color: cfg.goldColor })
      );
      frame.position.copy(mesh.position);
      frame.rotation.copy(mesh.rotation);
      // Push 1 cm in front of wall so lines are always visible
      this._v3b.set(0, 0, 1).applyEuler(mesh.rotation).multiplyScalar(0.01);
      frame.position.add(this._v3b);
      this.roomGroup.add(frame);
    });
  }


  /* ── HELPERS ───────────────────────────────────────────── */

  /** Procedural parquet floor texture (256 px — half the old size) */
  _makeFloorTex() {
    const S   = 256;
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = S;
    const ctx = cvs.getContext('2d');

    ctx.fillStyle = '#1a1108';
    ctx.fillRect(0, 0, S, S);

    // Plank grid
    ctx.strokeStyle = 'rgba(255,210,90,0.06)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= S; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    }

    // Fine grain
    ctx.strokeStyle = 'rgba(255,200,80,0.025)';
    ctx.lineWidth   = 0.5;
    for (let i = 0; i <= S; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
    }

    const tex   = new THREE.CanvasTexture(cvs);
    tex.wrapS   = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  /** Rectangle frame as LineSegments (no diagonal, no boxes) */
  _rectFrameGeo(w, h) {
    const hw = w / 2, hh = h / 2;
    // 4 segments × 2 vertices each = 8 positions
    const pos = new Float32Array([
      -hw, -hh, 0,   hw, -hh, 0,   // bottom
       hw, -hh, 0,   hw,  hh, 0,   // right
       hw,  hh, 0,  -hw,  hh, 0,   // top
      -hw,  hh, 0,  -hw, -hh, 0,   // left
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }


  /* ── CSS HOTSPOT DOTS ──────────────────────────────────── */
  _buildHotspots() {
    if (!document.getElementById('pp-hs-style')) {
      const s = document.createElement('style');
      s.id    = 'pp-hs-style';
      s.textContent = `
        .pp-hs{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;
          opacity:0;transition:opacity .35s;display:flex;flex-direction:column;align-items:center;gap:7px;z-index:20;}
        .pp-hs-ring{width:44px;height:44px;border-radius:50%;border:2px solid rgba(201,168,76,.9);
          background:rgba(201,168,76,.1);position:relative;display:flex;align-items:center;
          justify-content:center;transition:transform .18s,background .18s;}
        .pp-hs-ring::before{content:'';position:absolute;inset:-8px;border-radius:50%;
          border:1.5px solid rgba(201,168,76,.35);animation:ppPulse 2.2s ease-out infinite;}
        .pp-hs-ring::after{content:'→';color:#c9a84c;font-size:15px;font-weight:700;}
        .pp-hs:hover .pp-hs-ring{transform:scale(1.14);background:rgba(201,168,76,.26);}
        .pp-hs-lbl{background:rgba(8,7,5,.9);backdrop-filter:blur(12px);
          border:1px solid rgba(201,168,76,.35);border-radius:4px;padding:5px 13px;
          font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
          color:#c9a84c;white-space:nowrap;font-family:system-ui,sans-serif;}
        @keyframes ppPulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.1);opacity:0}}
      `;
      document.head.appendChild(s);
    }

    this.hotspotEls = this.walls.map((wall, i) => {
      const el  = document.createElement('div');
      el.className = 'pp-hs';
      el.innerHTML = `<div class="pp-hs-ring"></div><div class="pp-hs-lbl">${wall.label}</div>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); this.onNavigate(wall.category); });
      this.container.appendChild(el);
      return { el, meshIndex: i };
    });
  }

  /** Called every 2nd frame — throttled to reduce layout thrashing */
  _updateHotspots() {
    const { camera, W, H, roomGroup, wallMeshes, hotspotEls } = this;

    hotspotEls.forEach(({ el, meshIndex }) => {
      const mesh = wallMeshes[meshIndex];
      if (!mesh) return;

      // World position of wall centre (accounts for group rotation)
      mesh.getWorldPosition(this._v3);

      // Shift toward camera center so dot sits at lower-third of wall
      this._v3.y = this.cfg.height * 0.28;
      this._v3.x *= 0.78;
      this._v3.z *= 0.78;

      // Visibility: camera always looks +Z; wall is visible when its
      // world Z is positive (i.e., between camera and scene +Z side)
      const wallWorldDir = this._v3b.copy(this._v3).normalize();
      // Camera looks toward +Z ≡ (0,0,1)
      const dot = wallWorldDir.z;

      if (dot < 0.12) {
        el.style.opacity       = '0';
        el.style.pointerEvents = 'none';
        return;
      }

      // Project to screen space — use pre-allocated _v3c, NO .clone()
      this._v3c.copy(this._v3).project(camera);
      const sx   = ((this._v3c.x + 1) / 2) * W;
      const sy   = ((-this._v3c.y + 1) / 2) * H;
      const fade = Math.min(1, (dot - 0.12) * 2.8);

      el.style.left          = sx + 'px';
      el.style.top           = sy + 'px';
      el.style.opacity       = fade.toFixed(2);
      el.style.pointerEvents = fade > 0.3 ? 'auto' : 'none';
    });
  }


  /* ── CONTROLS ──────────────────────────────────────────── */
  _bindControls() {
    const add = (el, t, fn, o) => {
      el.addEventListener(t, fn, o);
      this._listeners.push({ el, t, fn, o });
    };

    add(this.container, 'pointerdown',  e => this._onDown(e));
    add(this.container, 'pointermove',  e => this._onMove(e));
    add(this.container, 'pointerup',    e => this._onUp(e));
    add(this.container, 'pointercancel',e => this._onUp(e));
    add(this.container, 'click',        e => this._onClick(e));

    const btnL = document.getElementById('showroom-arrow-left');
    const btnR = document.getElementById('showroom-arrow-right');
    if (btnL) add(btnL, 'click', () => this._step(+1));
    if (btnR) add(btnR, 'click', () => this._step(-1));

    add(window, 'keydown', e => {
      if (e.key === 'ArrowLeft')  this._step(+1);
      if (e.key === 'ArrowRight') this._step(-1);
    });
    add(window, 'resize', () => this._onResize());
  }

  _step(dir) {
    this.targetYaw += dir * this.cfg.arrowStep;
    this._rescheduleAuto();
  }

  _onDown(e) {
    this.isDown    = true;
    this.lastX     = e.clientX;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.renderer.domElement.style.cursor = 'grabbing';
    this._stopAuto();
    this.container.setPointerCapture?.(e.pointerId);
  }

  _onMove(e) {
    if (!this.isDown) { this._hoverTip(e); return; }
    const dx = e.clientX - this.lastX;
    this.lastX      = e.clientX;
    this.targetYaw -= dx * this.cfg.rotationSpeed;
  }

  _onUp(e) {
    this.isDown = false;
    this.renderer.domElement.style.cursor = 'grab';
    this._rescheduleAuto();
  }

  _onClick(e) {
    if (!this.dragStart) return;
    const d = Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);
    this.dragStart = null;
    if (d > 6) return;
    const hit = this._pick(e.clientX, e.clientY);
    if (hit) this.onNavigate(hit.userData.category);
  }

  _hoverTip(e) {
    const tip  = document.getElementById('showroom-tooltip');
    const wall = this._pick(e.clientX, e.clientY);

    if (wall !== this.hoveredWall) {
      if (this.hoveredWall) {
        this.hoveredWall.material.emissive.setHex(0x000000);
        this.hoveredWall.material.emissiveIntensity = 0;
      }
      this.hoveredWall = wall;
      if (wall) {
        wall.material.emissive.setHex(0xc9a84c);
        wall.material.emissiveIntensity = 0.1;
      }
    }

    if (wall && tip) {
      const r = this.container.getBoundingClientRect();
      tip.textContent  = wall.userData.label;
      tip.style.left   = (e.clientX - r.left + 14) + 'px';
      tip.style.top    = (e.clientY - r.top  - 10) + 'px';
      tip.style.opacity = '1';
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      if (tip) tip.style.opacity = '0';
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  _pick(cx, cy) {
    const r    = this.container.getBoundingClientRect();
    this._ptr.x =  ((cx - r.left) / r.width)  * 2 - 1;
    this._ptr.y = -((cy - r.top)  / r.height) * 2 + 1;
    this._ray.setFromCamera(this._ptr, this.camera);
    const hits = this._ray.intersectObjects(this.wallMeshes, false);
    return hits.length ? hits[0].object : null;
  }


  /* ── AUTO-ROTATE ───────────────────────────────────────── */
  _rescheduleAuto() {
    this._stopAuto();
    if (!this.cfg.autoRotateSpeed) return;
    this._autoTimer = setTimeout(() => { this._autoOn = true; }, this.cfg.autoRotateDelay);
  }
  _stopAuto() {
    clearTimeout(this._autoTimer);
    this._autoOn = false;
  }


  /* ── LOAD PROGRESS ─────────────────────────────────────── */
  _setLoadProgress(pct) {
    const bar = document.getElementById('showroom-progress-bar');
    const txt = document.getElementById('showroom-progress-text');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  }

  _onLoaded() {
    const ov = document.getElementById('showroom-loading');
    if (ov) {
      ov.style.transition = 'opacity 0.7s';
      ov.style.opacity    = '0';
      setTimeout(() => { if (ov) ov.style.display = 'none'; }, 750);
    }
    const hint = document.getElementById('showroom-hint');
    if (hint) {
      hint.style.opacity = '1';
      setTimeout(() => { hint.style.opacity = '0'; }, 3800);
    }
    this._rescheduleAuto();
  }


  /* ── ANIMATION LOOP ────────────────────────────────────── */
  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    this._frame++;

    // Auto-rotate
    if (this._autoOn && !this.isDown) {
      this.targetYaw -= this.cfg.autoRotateSpeed;
    }

    // Smooth easing
    this.yaw += (this.targetYaw - this.yaw) * this.cfg.easing;

    // Rotate the whole room group — floor + ceiling + walls move together
    this.roomGroup.rotation.y = this.yaw;

    // Hotspot DOM update — every 2nd frame desktop, every 3rd frame mobile
    if (this._frame % this._hsSkip === 0) this._updateHotspots();

    this.renderer.render(this.scene, this.camera);
  }


  /* ── RESIZE ─────────────────────────────────────────────── */
  _onResize() {
    this.W = this.container.clientWidth;
    this.H = this.container.clientHeight;
    this.camera.aspect = this.W / this.H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.W, this.H);
  }


  /* ── PUBLIC: RECONFIGURE ───────────────────────────────── */
  reconfigure(newWalls) {
    const c  = this.container;
    const cb = this.onNavigate;
    this.destroy();
    const fresh = new Showroom360(c, cb, { walls: newWalls });
    Object.assign(this, fresh);
  }


  /* ── DESTROY ────────────────────────────────────────────── */
  destroy() {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._autoTimer);
    this._listeners.forEach(({ el, t, fn, o }) => el.removeEventListener(t, fn, o));
    this._listeners = [];
    this.hotspotEls.forEach(({ el }) => el.parentNode?.removeChild(el));
    this.hotspotEls = [];
    this.renderer.dispose();
    this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement);
  }
}
