'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ShowroomWall } from '@/lib/types'

interface Showroom3DProps {
  onWallClick?: (destination: string) => void
  walls?: Array<{ image: string; label: string; destination: string }>
}

// Default walls empty - configure via admin panel
const DEFAULT_WALLS: ShowroomWall[] = []

const ROOM_CFG = {
  radius: 5.2,
  height: 3.8,
  fov: 72,
  fogColor: 0x0b0906,
  fogNear: 5,
  fogFar: 13,
  wallBaseColor: 0x1c1510,
  goldColor: 0xc9a84c,
  floorColor: 0x130e0a,
  ceilingColor: 0x0d0b08,
  rotationSpeed: 0.004,
  arrowStep: Math.PI / 4,
  easing: 0.10,
  autoRotateSpeed: 0.0003,
  autoRotateDelay: 4000,
}

export default function Showroom3D({ onWallClick, walls: propWalls }: Showroom3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hotspots, setHotspots] = useState<Array<{ x: number; y: number; opacity: number; label: string; destination: string }>>([])
  const engineRef = useRef<ShowroomEngine | null>(null)
  const [activeWalls, setActiveWalls] = useState<ShowroomWall[]>(propWalls || DEFAULT_WALLS)

  // Fetch showroom config
  useEffect(() => {
    if (propWalls) return
    fetch('/api/showroom')
      .then(r => r.json())
      .then(data => {
        if (data.walls && data.walls.length > 0) {
          setActiveWalls(data.walls)
        }
      })
      .catch(() => {})
  }, [propWalls])

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    let engine: ShowroomEngine | null = null

    const initEngine = async () => {
      const THREE = await import('three')

      engine = new ShowroomEngine(
        THREE,
        container,
        activeWalls,
        (pct) => setLoadProgress(pct),
        () => {
          setLoaded(true)
          setShowHint(true)
          setTimeout(() => setShowHint(false), 4000)
        },
        (dest) => onWallClick?.(dest),
        (hs) => setHotspots(hs),
      )
      engineRef.current = engine
    }

    initEngine()

    return () => {
      if (engine) {
        engine.destroy()
      }
      engineRef.current = null
    }
  }, [activeWalls, onWallClick])

  const handleStep = useCallback((dir: number) => {
    engineRef.current?.step(dir)
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b0906]">
      {/* Canvas container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading Screen */}
      {!loaded && (
        <div className="absolute inset-0 z-50 bg-[#0b0906] flex flex-col items-center justify-center gap-4 pointer-events-none">
          <div className="font-serif text-3xl md:text-4xl font-medium text-[#c9a84c] tracking-wider">
            Maison Dorée
          </div>
          <div className="text-[10px] tracking-[5px] uppercase text-[#606060]">
            Chargement du Showroom
          </div>
          <div className="w-56 h-[3px] bg-white/[0.07] rounded overflow-hidden mt-1">
            <div
              className="h-full bg-[#c9a84c] rounded transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-[#606060] tracking-wider">{loadProgress}%</div>
        </div>
      )}

      {/* Hotspot Overlays */}
      {hotspots.map((hs, i) => (
        <div
          key={i}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center gap-2 transition-opacity duration-300"
          style={{
            left: `${hs.x}px`,
            top: `${hs.y}px`,
            opacity: hs.opacity,
            pointerEvents: hs.opacity > 0.3 ? 'auto' : 'none',
          }}
          onClick={() => onWallClick?.(hs.destination)}
        >
          <div className="relative w-11 h-11 rounded-full border-2 border-[#c9a84c]/90 bg-[#c9a84c]/10 flex items-center justify-center hover:scale-110 hover:bg-[#c9a84c]/25 transition-transform duration-200">
            <div className="absolute -inset-2 rounded-full border-[1.5px] border-[#c9a84c]/35 animate-hotspot-ring" />
            <span className="text-[#c9a84c] text-sm font-bold">→</span>
          </div>
          <div className="bg-[#08070a]/90 backdrop-blur-xl border border-[#c9a84c]/35 rounded px-3 py-1.5 text-[10px] font-semibold tracking-[2.5px] uppercase text-[#c9a84c] whitespace-nowrap">
            {hs.label}
          </div>
        </div>
      ))}

      {/* Drag hint */}
      {showHint && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-3 bg-[#08070a]/78 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 transition-opacity duration-700">
          <svg width="15" height="15" fill="none" stroke="#c9a84c" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="text-[10px] tracking-[3px] uppercase text-white/70">Glissez pour explorer</span>
          <svg width="15" height="15" fill="none" stroke="#c9a84c" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      )}

      {/* Arrow Buttons */}
      <button
        onClick={() => handleStep(1)}
        className="absolute top-1/2 left-5 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#08070a]/70 backdrop-blur-xl border border-[#c9a84c]/25 text-white/80 text-2xl flex items-center justify-center cursor-pointer hover:bg-[#c9a84c]/15 hover:border-[#c9a84c]/60 transition-all duration-200"
        aria-label="Rotation gauche"
      >
        ‹
      </button>
      <button
        onClick={() => handleStep(-1)}
        className="absolute top-1/2 right-5 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#08070a]/70 backdrop-blur-xl border border-[#c9a84c]/25 text-white/80 text-2xl flex items-center justify-center cursor-pointer hover:bg-[#c9a84c]/15 hover:border-[#c9a84c]/60 transition-all duration-200"
        aria-label="Rotation droite"
      >
        ›
      </button>
    </div>
  )
}

// ─── Internal Three.js Engine ──────────────────────────────────────────────

interface HotspotData {
  x: number
  y: number
  opacity: number
  label: string
  destination: string
}

class ShowroomEngine {
  private THREE: typeof import('three')
  private container: HTMLDivElement
  private walls: ShowroomWall[]
  private onProgress: (pct: number) => void
  private onLoaded: () => void
  private onNavigate: (dest: string) => void
  private onHotspots: (hs: HotspotData[]) => void

  private renderer: any
  private scene: any
  private camera: any
  private roomGroup: any
  private wallMeshes: any[] = []

  private yaw = 0
  private targetYaw = 0
  private isDown = false
  private lastX = 0
  private dragStart: { x: number; y: number } | null = null
  private hoveredWall: any = null

  private _raf: number = 0
  private _autoTimer: ReturnType<typeof setTimeout> | null = null
  private _autoOn = false
  private _frame = 0
  private _hsSkip = 2
  private _listeners: Array<{ el: any; t: string; fn: any }> = []
  private W: number
  private H: number
  private cfg = ROOM_CFG

  // Pre-allocated objects
  private _v3: any
  private _v3b: any
  private _v3c: any
  private _ptr: any
  private _ray: any

  constructor(
    THREE: typeof import('three'),
    container: HTMLDivElement,
    walls: ShowroomWall[],
    onProgress: (pct: number) => void,
    onLoaded: () => void,
    onNavigate: (dest: string) => void,
    onHotspots: (hs: HotspotData[]) => void,
  ) {
    this.THREE = THREE
    this.container = container
    this.walls = walls
    this.onProgress = onProgress
    this.onLoaded = onLoaded
    this.onNavigate = onNavigate
    this.onHotspots = onHotspots

    this._v3 = new THREE.Vector3()
    this._v3b = new THREE.Vector3()
    this._v3c = new THREE.Vector3()
    this._ptr = new THREE.Vector2()
    this._ray = new THREE.Raycaster()

    this.W = container.clientWidth || window.innerWidth
    this.H = container.clientHeight || window.innerHeight

    this._hsSkip = window.devicePixelRatio <= 1 ? 3 : 2

    this._initRenderer(THREE)
    this._initScene(THREE)
    this._buildRoom(THREE)
    this._bindControls()
    this._animate()
  }

  private _initRenderer(THREE: typeof import('three')) {
    const isMobile = window.devicePixelRatio <= 1
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(this.W, this.H)
    this.renderer.toneMapping = THREE.LinearToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = false

    const c = this.renderer.domElement
    c.style.cssText = 'display:block;position:absolute;inset:0;'
    c.style.cursor = 'grab'
    this.container.appendChild(c)
  }

  private _initScene(THREE: typeof import('three')) {
    const { cfg } = this
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(cfg.fogColor)
    this.scene.fog = new THREE.Fog(cfg.fogColor, cfg.fogNear, cfg.fogFar)

    this.camera = new THREE.PerspectiveCamera(cfg.fov, this.W / this.H, 0.1, 100)
    this.camera.position.set(0, cfg.height / 2, 0)
    this.camera.lookAt(0, cfg.height / 2, 10)

    this.scene.add(new THREE.AmbientLight(0xfff0dc, 0.85))
    this.scene.add(new THREE.HemisphereLight(0xffe8c8, 0x100c08, 0.55))
  }

  private _buildRoom(THREE: typeof import('three')) {
    const { scene, cfg, walls } = this
    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'

    this.roomGroup = new THREE.Group()
    scene.add(this.roomGroup)

    const N = walls.length
    const angleStep = (Math.PI * 2) / N
    const wallW = 2 * cfg.radius * Math.tan(Math.PI / N)
    const floorR = (cfg.radius / Math.cos(Math.PI / N)) * 1.05

    // Floor
    const floorMat = new THREE.MeshBasicMaterial({ color: cfg.floorColor })
    floorMat.map = this._makeFloorTex(THREE)
    floorMat.color.set(0xffffff)
    const floor = new THREE.Mesh(new THREE.CircleGeometry(floorR, 32), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    this.roomGroup.add(floor)

    // Ceiling
    const ceilMat = new THREE.MeshBasicMaterial({ color: cfg.ceilingColor })
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(floorR, 32), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.y = cfg.height
    this.roomGroup.add(ceil)

    // Ceiling emissive strip
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(cfg.radius * 0.45, 0.11),
      new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: 0.82 })
    )
    strip.rotation.x = Math.PI / 2
    strip.position.y = cfg.height - 0.005
    this.roomGroup.add(strip)

    // Walls
    let loadCount = 0
    this.wallMeshes = []
    const sharedWallGeo = new THREE.PlaneGeometry(wallW, cfg.height)

    walls.forEach((data, i) => {
      const angle = i * angleStep
      const cx = Math.sin(angle) * cfg.radius
      const cz = Math.cos(angle) * cfg.radius
      const cy = cfg.height / 2

      const mat = new THREE.MeshLambertMaterial({
        color: cfg.wallBaseColor,
        emissive: new THREE.Color(0x000000),
      })

      loader.load(
        data.image,
        (tex: any) => {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.minFilter = THREE.LinearFilter
          mat.map = tex
          mat.color.set(0xffffff)
          mat.needsUpdate = true
          loadCount++
          this.onProgress(Math.round((loadCount / N) * 100))
          if (loadCount === N) this.onLoaded()
        },
        undefined,
        () => {
          loadCount++
          if (loadCount === N) this.onLoaded()
        }
      )

      const mesh = new THREE.Mesh(sharedWallGeo, mat)
      mesh.position.set(cx, cy, cz)
      mesh.lookAt(0, cy, 0)
      mesh.userData = { ...data, index: i, angle }
      this.roomGroup.add(mesh)
      this.wallMeshes.push(mesh)

      // Gold frame
      const frame = new THREE.LineSegments(
        this._rectFrameGeo(THREE, wallW, cfg.height),
        new THREE.LineBasicMaterial({ color: cfg.goldColor })
      )
      frame.position.copy(mesh.position)
      frame.rotation.copy(mesh.rotation)
      this._v3b.set(0, 0, 1).applyEuler(mesh.rotation).multiplyScalar(0.01)
      frame.position.add(this._v3b)
      this.roomGroup.add(frame)
    })
  }

  private _makeFloorTex(THREE: typeof import('three')) {
    const S = 256
    const cvs = document.createElement('canvas')
    cvs.width = cvs.height = S
    const ctx = cvs.getContext('2d')!

    ctx.fillStyle = '#1a1108'
    ctx.fillRect(0, 0, S, S)

    ctx.strokeStyle = 'rgba(255,210,90,0.06)'
    ctx.lineWidth = 1
    for (let i = 0; i <= S; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(255,200,80,0.025)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= S; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(cvs)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 4)
    return tex
  }

  private _rectFrameGeo(THREE: typeof import('three'), w: number, h: number) {
    const hw = w / 2, hh = h / 2
    const pos = new Float32Array([
      -hw, -hh, 0,  hw, -hh, 0,
       hw, -hh, 0,  hw,  hh, 0,
       hw,  hh, 0, -hw,  hh, 0,
      -hw,  hh, 0, -hw, -hh, 0,
    ])
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }

  private _bindControls() {
    const add = (el: any, t: string, fn: any, o?: any) => {
      el.addEventListener(t, fn, o)
      this._listeners.push({ el, t, fn, o })
    }

    add(this.container, 'pointerdown', (e: PointerEvent) => this._onDown(e))
    add(this.container, 'pointermove', (e: PointerEvent) => this._onMove(e))
    add(this.container, 'pointerup', () => this._onUp())
    add(this.container, 'pointercancel', () => this._onUp())
    add(this.container, 'click', (e: MouseEvent) => this._onClick(e))
    add(window, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') this.step(1)
      if (e.key === 'ArrowRight') this.step(-1)
    })
    add(window, 'resize', () => this._onResize())
  }

  step(dir: number) {
    this.targetYaw += dir * this.cfg.arrowStep
    this._rescheduleAuto()
  }

  private _onDown(e: PointerEvent) {
    this.isDown = true
    this.lastX = e.clientX
    this.dragStart = { x: e.clientX, y: e.clientY }
    this.renderer.domElement.style.cursor = 'grabbing'
    this._stopAuto()
    this.container.setPointerCapture?.(e.pointerId)
  }

  private _onMove(e: PointerEvent) {
    if (!this.isDown) return
    const dx = e.clientX - this.lastX
    this.lastX = e.clientX
    this.targetYaw -= dx * this.cfg.rotationSpeed
  }

  private _onUp() {
    this.isDown = false
    this.renderer.domElement.style.cursor = 'grab'
    this._rescheduleAuto()
  }

  private _onClick(e: MouseEvent) {
    if (!this.dragStart) return
    const d = Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y)
    this.dragStart = null
    if (d > 6) return
    const hit = this._pick(e.clientX, e.clientY)
    if (hit) this.onNavigate(hit.userData.destination)
  }

  private _pick(cx: number, cy: number) {
    const r = this.container.getBoundingClientRect()
    this._ptr.x = ((cx - r.left) / r.width) * 2 - 1
    this._ptr.y = -((cy - r.top) / r.height) * 2 + 1
    this._ray.setFromCamera(this._ptr, this.camera)
    const hits = this._ray.intersectObjects(this.wallMeshes, false)
    return hits.length ? hits[0].object : null
  }

  private _updateHotspots() {
    const { camera, W, H, wallMeshes } = this
    const result: HotspotData[] = []

    this.walls.forEach((wall, i) => {
      const mesh = wallMeshes[i]
      if (!mesh) return

      mesh.getWorldPosition(this._v3)
      this._v3.y = this.cfg.height * 0.28
      this._v3.x *= 0.78
      this._v3.z *= 0.78

      const wallWorldDir = this._v3b.copy(this._v3).normalize()
      const dot = wallWorldDir.z

      if (dot < 0.12) {
        result.push({ x: 0, y: 0, opacity: 0, label: wall.label, destination: wall.destination })
        return
      }

      this._v3c.copy(this._v3).project(camera)
      const sx = ((this._v3c.x + 1) / 2) * W
      const sy = ((-this._v3c.y + 1) / 2) * H
      const fade = Math.min(1, (dot - 0.12) * 2.8)

      result.push({ x: sx, y: sy, opacity: fade, label: wall.label, destination: wall.destination })
    })

    this.onHotspots(result)
  }

  private _rescheduleAuto() {
    this._stopAuto()
    if (!this.cfg.autoRotateSpeed) return
    this._autoTimer = setTimeout(() => { this._autoOn = true }, this.cfg.autoRotateDelay)
  }

  private _stopAuto() {
    if (this._autoTimer) clearTimeout(this._autoTimer)
    this._autoOn = false
  }

  private _animate() {
    this._raf = requestAnimationFrame(() => this._animate())
    this._frame++

    if (this._autoOn && !this.isDown) {
      this.targetYaw -= this.cfg.autoRotateSpeed
    }

    this.yaw += (this.targetYaw - this.yaw) * this.cfg.easing
    this.roomGroup.rotation.y = this.yaw

    if (this._frame % this._hsSkip === 0) this._updateHotspots()

    this.renderer.render(this.scene, this.camera)
  }

  private _onResize() {
    this.W = this.container.clientWidth
    this.H = this.container.clientHeight
    this.camera.aspect = this.W / this.H
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.W, this.H)
  }

  destroy() {
    cancelAnimationFrame(this._raf)
    if (this._autoTimer) clearTimeout(this._autoTimer)
    this._listeners.forEach(({ el, t, fn, o }) => el.removeEventListener(t, fn, o))
    this._listeners = []
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
