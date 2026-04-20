# PORTE PRESTIGE — Project Checkpoint
**Date:** 19 April 2026  
**Status:** Active development — v3.1 showroom engine

---

## Files in the project folder

| File | Purpose | Status |
|---|---|---|
| `index.html` | Main website (SPA — all pages in one file) | ✅ Working |
| `showroom.js` | 3D showroom engine (Three.js, v3.1) | ✅ Working |
| `admin.html` | Owner dashboard (orders, products, showroom config) | ✅ Working |
| `showroom-360.html` | Original reference file (not modified) | Archive |
| `steel-door.jpg` | Portes Blindées wall image | ✅ |
| `wooden-door.jpg` | Portes d'Entrée wall image | ✅ |
| `panel-door.jpg` | Portes Intérieures wall image | ✅ |
| `glass-door.jpg` | Portes Vitrées wall image | ✅ |
| `START-SERVER.bat` | One-click local server (Node.js / npx http-server) | ✅ |

---

## Site architecture

Single-page application (SPA) with vanilla JS routing.  
No framework, no build step — open `index.html` and it works.

### Pages inside index.html
- `home` — 3D showroom hero
- `shop` — product catalogue with category filter
- `order` — COD lead capture form
- `about` — company info
- `faq` — frequently asked questions
- `contact` — contact form + map placeholder
- Product detail overlay (opens over any page)

### Data storage (localStorage)
| Key | Contents |
|---|---|
| `pp_showroom_walls` | Custom wall config (image, label, category) |
| `pp_showroom_room` | Room appearance (rotation speed, radius, floor/ceiling images) |
| `pp_orders` | All COD lead submissions |
| `pp_products` | Product catalogue |
| `pp_settings` | Business settings (name, phone, WhatsApp, password) |

---

## 3D Showroom engine (showroom.js v3.1)

### Architecture
- Camera is **fixed** at center (0, height/2, 0) always looking +Z
- A `THREE.Group` called `roomGroup` holds ALL geometry (floor, ceiling, walls, frames)
- Rotation is applied to the group: `roomGroup.rotation.y = yaw`
- This makes floor and ceiling co-rotate with walls — naturally, zero extra code
- Only `wallMeshes[]` is passed to the raycaster → floor/ceiling can never be clicked

### Customizing walls (the ONLY block to edit)
```js
export const DEFAULT_WALLS = [
  { image: 'steel-door.jpg',  label: 'Portes Blindées',    category: 'blindées'   },
  { image: 'wooden-door.jpg', label: "Portes d'Entrée",    category: 'entrée'     },
  { image: 'panel-door.jpg',  label: 'Portes Intérieures', category: 'intérieure' },
  { image: 'glass-door.jpg',  label: 'Portes Vitrées',     category: 'verre'      },
  // ADD or DELETE lines here — minimum 2, maximum ~12
];
```

### Floor/ceiling real textures
In `DEFAULT_ROOM` (or via Admin → Showroom 360°):
```js
floorImage:   'sol-magasin.jpg',      // filename in site folder OR https:// URL
ceilingImage: 'plafond-magasin.jpg',
```

### Performance optimisations applied
- `MeshBasicMaterial` for floor/ceiling (zero lighting cost)
- `MeshLambertMaterial` for walls (no PBR)
- Single shared `PlaneGeometry` for all walls
- DPR capped at 1.5
- LinearToneMapping (faster than ACESFilmic)
- 2 lights only (AmbientLight + HemisphereLight)
- `LineSegments` for gold frames (1 draw call per frame, not 4 boxes)
- Zero GC allocations in animation loop (pre-allocated Vector3 pool)
- DOM hotspot throttle: every 2nd frame desktop, every 3rd frame mobile
- `antialias: false` on mobile, `powerPreference: 'high-performance'` GPU hint
- Adaptive frame skip (mobile vs desktop)

---

## Admin dashboard (admin.html)

### Features
- Password login (default: `admin2024`, changeable in Settings)
- **Dashboard** — today's orders, new leads, conversion KPIs
- **Orders** — full CRUD, status pipeline, CSV export, WhatsApp/call
- **Pipeline** — Kanban view across 8 stages
- **Products** — add/edit/delete product catalogue
- **Clients** — client list derived from orders
- **Analytics** — bar charts (orders/day, top products, top wilayas)
- **Showroom 360°** — edit wall images/labels, room appearance, floor/ceiling textures
- **Settings** — business info, tracking IDs (Meta/TikTok/GA4), password

### Order pipeline (8 stages)
Nouveau → Appelé → Confirmé → Expédié → En transit → Livré → Retourné → Annulé

### Tracking stubs (ready to activate)
Add your real IDs in Settings → Pixels:
- Meta Pixel ID
- TikTok Pixel ID
- GA4 Measurement ID

---

## Known bugs fixed in this session
1. Floor/ceiling textures ignored — `bootShowroom()` was not reading `pp_showroom_room` from localStorage
2. Floor/ceiling circle too small for fewer walls — now uses `radius / cos(π/N)` (circumradius)

## Pending / not yet started
- Real door images (owner to provide)
- Real store floor/ceiling photos
- Hosting / deployment (Netlify, GitHub Pages, or shared hosting)
- Domain name setup
- Meta/TikTok/GA4 pixel IDs (owner to provide)
- Delivery partner API integration (Yalidine, Maystro, etc.)
- 3D model from SketchUp/Blender (owner said they will model the showroom — can replace flat walls)
