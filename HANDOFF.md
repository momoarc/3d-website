# PORTE PRESTIGE — Full Project Handoff
**Date:** 19 April 2026  
**For:** New chat session — continue optimisation without altering completed work  
**Owner:** momo · saf.lotfi.archi@gmail.com

---

## 1. What this project is

A premium, mobile-first e-commerce website for a **door seller in Algeria** focused on **COD (Cash on Delivery) lead generation**. No payment gateway, no cart — the goal is to capture a phone lead and have the owner call back to confirm the order.

The homepage features an **immersive 3D showroom** (Three.js) where the customer stands at the center and rotates to look at walls displaying different door categories. Clicking a wall navigates to the product catalogue.

---

## 2. Folder location on the user's computer

```
C:\Users\User\Documents\Claude\Projects\3d web site\
```

All files are editable from the Cowork workspace mounted at:
```
/sessions/.../mnt/3d web site/
```

---

## 3. Files in the project folder

| File | Lines | Purpose | Status |
|---|---|---|---|
| `index.html` | 1820 | Main website — SPA (all pages in one file) | ✅ Complete |
| `showroom.js` | 668 | 3D showroom engine v3.1 (Three.js) | ✅ Complete |
| `admin.html` | 1478 | Owner dashboard | ✅ Complete |
| `showroom-360.html` | 294 | Original reference file (archive, do not modify) | Archive |
| `steel-door.jpg` | — | Portes Blindées wall image (placeholder) | Temp |
| `wooden-door.jpg` | — | Portes d'Entrée wall image (placeholder) | Temp |
| `panel-door.jpg` | — | Portes Intérieures wall image (placeholder) | Temp |
| `glass-door.jpg` | — | Portes Vitrées wall image (placeholder) | Temp |
| `START-SERVER.bat` | — | Double-click to launch local server | ✅ |
| `CHECKPOINT.md` | — | Technical checkpoint reference | Docs |

---

## 4. How to run the site locally

The site uses ES modules (Three.js importmap) so it **cannot be opened directly via file://** — it needs a server.

**Method: double-click `START-SERVER.bat`**  
This runs `npx --yes http-server . -p 8080` (requires Node.js, which is installed).  
Chrome opens automatically at `http://localhost:8080`.

- **Main site:** `http://localhost:8080`
- **Admin panel:** `http://localhost:8080/admin.html` → password: `admin2024`

> The Three.js library loads from `https://unpkg.com/three@0.160.0` — internet required on first load, cached after.

---

## 5. Site architecture (index.html)

Single-page application with vanilla JS routing. No framework, no build step.

### Pages / routes
```javascript
showPage('home')      // 3D showroom hero
showPage('shop')      // product catalogue
showPage('shop', 'blindées')  // catalogue pre-filtered by category
showPage('order')     // COD lead capture form
showPage('about')
showPage('faq')
showPage('contact')
```

### Product overlay
Clicking a product card calls `openProduct(id)` which opens a full-screen overlay with gallery, specs, and CTA.

### localStorage keys (all data lives here — no backend)
| Key | Contents |
|---|---|
| `pp_showroom_walls` | Custom wall config array |
| `pp_showroom_room` | Room appearance (speed, radius, floorImage, ceilingImage) |
| `pp_orders` | COD lead submissions array |
| `pp_products` | Product catalogue array |
| `pp_settings` | Business info + tracking IDs + admin password |

### Tracking pixels (stubs — need real IDs)
- Meta Pixel — replace `YOUR_META_PIXEL_ID` in `<head>`
- TikTok Pixel — replace `YOUR_TIKTOK_PIXEL_ID` in `<head>`
- GA4 — replace `YOUR_GA4_ID` in `<head>`
- Events tracked: `PageView`, `ViewContent`, `Lead` (on COD form submit)

### COD form fields
`name, phone, wilaya (58 Algerian wilayas), commune, address, product, notes`  
On submit: saves to `pp_orders`, fires tracking events, shows confirmation.

### Algeria-specific
- 58 Wilayas in the order form dropdown
- Prices in DZD
- French language throughout
- WhatsApp CTA button (bottom-right, floating)

---

## 6. 3D Showroom engine (showroom.js v3.1)

### Key architectural decisions
- **Camera is fixed** at `(0, height/2, 0)` always looking toward `+Z`
- **roomGroup rotation** — all geometry (floor, ceiling, walls, gold frames) live inside a `THREE.Group`. The animation loop sets `roomGroup.rotation.y = yaw`. This makes floor and ceiling co-rotate with walls automatically.
- **Only `wallMeshes[]` is raycasted** — floor and ceiling can NEVER be clicked.
- **ES module** — imported by index.html via `<script type="module">` and importmap.

### Public API
```javascript
import { initShowroom } from './showroom.js';

const instance = initShowroom(
  containerEl,          // HTMLElement
  (category) => {},     // callback on wall click
  {                     // optional overrides
    walls: [...],       // override DEFAULT_WALLS
    room:  {...},       // override DEFAULT_ROOM
  }
);

instance.destroy();       // clean up (used by admin live-reload)
instance.reconfigure(w);  // replace walls without full rebuild
```

### How to customise walls (THE ONLY THING to edit for most changes)
```javascript
export const DEFAULT_WALLS = [
  { image: 'steel-door.jpg',  label: 'Portes Blindées',    category: 'blindées'   },
  { image: 'wooden-door.jpg', label: "Portes d'Entrée",    category: 'entrée'     },
  { image: 'panel-door.jpg',  label: 'Portes Intérieures', category: 'intérieure' },
  { image: 'glass-door.jpg',  label: 'Portes Vitrées',     category: 'verre'      },
  // ADD a wall → paste a new line
  // REMOVE a wall → delete a line
  // Minimum 2, maximum ~12
];
```

### How to add real floor/ceiling textures
In `DEFAULT_ROOM` (or via Admin → Showroom 360° → Sol/Plafond):
```javascript
floorImage:   'store-floor.jpg',    // file in site folder OR full https:// URL
ceilingImage: 'store-ceiling.jpg',
```

### Floor/ceiling radius formula
```javascript
// Circumradius — always covers wall corners regardless of wall count
const floorR = (cfg.radius / Math.cos(Math.PI / N)) * 1.05;
```
This was fixed in this session. Previously `radius * 1.08` was used, which left visible gaps for ≤6 walls.

### Performance optimisations in v3.1
- `MeshBasicMaterial` for floor/ceiling (zero lighting cost)
- `MeshLambertMaterial` for walls (no PBR, no per-fragment specular)
- Single shared `PlaneGeometry` for all N walls
- 2 lights only (AmbientLight + HemisphereLight)
- `LineSegments` for gold door frames (1 draw call, not 4 BoxGeometry per wall)
- DPR capped at 1.5
- `LinearToneMapping` (faster than ACESFilmic)
- `powerPreference: 'high-performance'` GPU hint
- Antialias OFF on mobile (DPR ≤ 1)
- DOM hotspot throttle: every 3rd frame on mobile, 2nd on desktop
- Pre-allocated Vector3 pool (`_v3`, `_v3b`, `_v3c`) — zero GC allocations in animation loop

### Admin ↔ Site live reload
The admin can update the showroom without the customer needing to refresh:
```javascript
// In admin.html
window.opener.__reloadShowroom(walls, room);

// In index.html (exposed on window)
window.__reloadShowroom = function(newWalls, newRoom) { ... };
```
This destroys the old instance, clears the canvas, and boots a new one with the updated config.

---

## 7. Admin dashboard (admin.html)

### Login
- Default password: `admin2024`
- Change in Settings → Mot de passe admin

### Pages / features
| Page | What it does |
|---|---|
| Dashboard | KPI cards: today's orders, new leads, delivered, returned |
| Orders | Full order list, search, filter by status, CSV export, WhatsApp/call actions |
| Pipeline | Kanban view with drag-free status change buttons |
| Products | Add / edit / delete products, toggle availability |
| Clients | Auto-generated from order history |
| Analytics | CSS bar charts: orders/day, top products, top wilayas, funnel |
| Showroom 360° | Edit wall images/labels/destinations, room speed/radius, floor/ceiling textures |
| Settings | Business info, tracking pixel IDs, password change |

### Order pipeline (8 stages)
```
Nouveau → Appelé → Confirmé → Expédié → En transit → Livré → Retourné → Annulé
```

### Floor/ceiling texture flow (just fixed this session)
1. Admin enters filename or URL in Showroom → Sol / Plafond fields
2. Clicks "Sauvegarder l'apparence"
3. Saves `{floorImage, ceilingImage, ...}` to `pp_showroom_room` in localStorage
4. If main site is open in another tab → live-reloads via `window.opener.__reloadShowroom(walls, room)`
5. Main site `bootShowroom()` now reads BOTH `pp_showroom_walls` AND `pp_showroom_room` on load

### Admin access options (proposed, not yet implemented)
- **Option A (current):** Bookmark `/admin.html` — secret URL, password-protected
- **Option B:** Hidden footer trigger — click logo/copyright 5× to open admin (can add in ~10 min)
- **Option C, recommended for production:** Separate domain — `admin.portePrestige.dz` vs `portePrestige.dz`

---

## 8. What is complete ✅

- [x] Full SPA website with all pages (home, shop, order, about, faq, contact)
- [x] 3D showroom — horizontal-only rotation, wall click navigation, auto-rotate, hotspots
- [x] Floor and ceiling co-rotate with walls (group rotation architecture)
- [x] Floor and ceiling unclickable (excluded from raycaster)
- [x] Floor/ceiling real texture support (floorImage / ceilingImage)
- [x] Floor/ceiling circumradius fix — no gap regardless of wall count
- [x] Admin reads room config from localStorage and passes to engine (texture bug fixed)
- [x] Admin live-reload passes both walls AND room config
- [x] COD order form with 58 Algerian wilayas
- [x] Admin dashboard — orders, pipeline, products, analytics, showroom editor
- [x] Tracking pixel stubs (Meta, TikTok, GA4)
- [x] WhatsApp floating CTA
- [x] Algeria-specific content (French, DZD, wilayas)
- [x] Mobile-first responsive layout
- [x] Gold frame borders on walls (LineSegments, 1 draw call)
- [x] Local server launcher (START-SERVER.bat)

---

## 9. What is NOT done yet / pending decisions

- [ ] **Real door images** — owner to provide photos of their actual doors
- [ ] **Real floor/ceiling photos** — owner to provide store interior photos  
- [ ] **Admin access method** — choose Option A/B/C above
- [ ] **Hosting / deployment** — Netlify, GitHub Pages, or shared hosting (recommend Netlify for zero cost)
- [ ] **Domain name** — e.g. `portePrestige.dz` (requires purchase)
- [ ] **Tracking pixel IDs** — owner to provide Meta / TikTok / GA4 IDs
- [ ] **Delivery partner integration** — Yalidine, Maystro, or manual workflow
- [ ] **3D SketchUp/Blender model** — owner said they will model the actual showroom; can replace flat walls when ready
- [ ] **Product content** — real product descriptions, prices, specs, photos
- [ ] **WhatsApp number** — replace placeholder number in code
- [ ] **Business info** — real name, address, phone in Settings

---

## 10. Key things NOT to break in the new chat

1. **Do not change the `roomGroup` rotation architecture** — everything depends on this
2. **Do not add floor/ceiling meshes to `wallMeshes[]`** — they must stay unclickable
3. **Do not change the importmap Three.js version** (`three@0.160.0`) — tested and working
4. **Do not split index.html into multiple files** without updating the SPA routing
5. **The `_loadShowroomConfig()` function in index.html** now reads both walls AND room — don't revert to walls-only
6. **`floorR = (cfg.radius / Math.cos(Math.PI / N)) * 1.05`** — don't replace with a fixed multiplier

---

## 11. Suggested next optimisations for the new chat

These are the most impactful remaining improvements, in priority order:

1. **Product pages** — richer product detail overlay (multiple images, specs table, related products)
2. **Shop page filtering & search** — currently filter by category only; add price range, search bar
3. **Order form UX** — add real-time wilaya → commune autocomplete
4. **Mobile navigation** — hamburger menu needs polish
5. **Loading performance** — lazy-load product images below the fold
6. **Admin access** — implement Option B (hidden trigger) or deploy Option C
7. **Deployment** — Netlify drag-and-drop (drop the folder, get a live URL in 30 seconds)
8. **SEO** — dynamic `<title>` per page, structured data (LocalBusiness schema), sitemap
9. **WhatsApp click-to-chat** — wire the actual number
10. **404 / error states** — empty catalogue, failed image loads, offline banner
