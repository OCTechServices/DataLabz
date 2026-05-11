'use client'

import { useEffect, useRef } from 'react'
import type PhaserType from 'phaser'
import type { RoomWithCreator, WorldTheme } from '@/types/database'

interface Props {
  rooms: RoomWithCreator[]
  currentUserId: string
  theme: WorldTheme
}

interface ThemeCfg {
  // Room structure
  floorBg: number
  floorGrid: number
  wallTop: number
  wallAccent: number
  wallDeco: number
  skirting: number
  // Workstation
  deskBg: number
  deskBorder: number
  monitorBg: number
  monitorScreen: number
  monitorBorder: number
  // Characters
  skinA: number
  skinB: number
  // Text
  nameColor: string
  taskColor: string
  titleColor: string
  youColor: string
  dialogBg: number
  dialogBorder: number
  dialogText: string
  font: string
}

const THEMES: Record<WorldTheme, ThemeCfg> = {
  'pixel-light': {
    floorBg: 0xf0ece0,
    floorGrid: 0xd4d0e8,
    wallTop: 0x384088,
    wallAccent: 0x6878c0,
    wallDeco: 0xffffff,
    skirting: 0x5060a8,
    deskBg: 0xffffff,
    deskBorder: 0x384088,
    monitorBg: 0x2858b0,
    monitorScreen: 0x80d0f8,
    monitorBorder: 0x1828a0,
    skinA: 0xf8d098,
    skinB: 0xe8b870,
    nameColor: '#384088',
    taskColor: '#181848',
    titleColor: '#6878c0',
    youColor: '#c82020',
    dialogBg: 0xffffff,
    dialogBorder: 0x384088,
    dialogText: '#181848',
    font: '"Courier New", monospace',
  },
  'pixel-dark': {
    floorBg: 0x3a3a3e,
    floorGrid: 0x4e4e54,
    wallTop: 0x09090b,
    wallAccent: 0x3f3f46,
    wallDeco: 0x52525b,
    skirting: 0x3f3f46,
    deskBg: 0x27272a,
    deskBorder: 0x71717a,
    monitorBg: 0x18181b,
    monitorScreen: 0x22d3ee,
    monitorBorder: 0x52525b,
    skinA: 0xa1a1aa,
    skinB: 0x71717a,
    nameColor: '#e4e4e7',
    taskColor: '#f4f4f5',
    titleColor: '#71717a',
    youColor: '#facc15',
    dialogBg: 0x18181b,
    dialogBorder: 0x71717a,
    dialogText: '#f4f4f5',
    font: '"Courier New", monospace',
  },
  'glam': {
    floorBg: 0xfce7f3,
    floorGrid: 0xfbcfe8,
    wallTop: 0x9d174d,
    wallAccent: 0xdb2777,
    wallDeco: 0xfce7f3,
    skirting: 0xbe185d,
    deskBg: 0xfdf2f8,
    deskBorder: 0xec4899,
    monitorBg: 0xfdf4ff,
    monitorScreen: 0xe879f9,
    monitorBorder: 0xd946ef,
    skinA: 0xfde68a,
    skinB: 0xfcd34d,
    nameColor: '#9d174d',
    taskColor: '#500724',
    titleColor: '#db2777',
    youColor: '#7c3aed',
    dialogBg: 0xfdf2f8,
    dialogBorder: 0xec4899,
    dialogText: '#500724',
    font: '"Georgia", serif',
  },
}

function nameToColor(name: string): number {
  let hash = 5381
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) + hash + name.charCodeAt(i)
    hash = hash & hash
  }
  const h = (Math.abs(hash) % 360) / 360
  const s = 0.65, l = 0.50
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
  const g = Math.round(hue2rgb(p, q, h) * 255)
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  return (r << 16) | (g << 8) | b
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

export default function VirtualHive({ rooms, currentUserId, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<PhaserType.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const cfg = THEMES[theme]
    let destroyed = false

    import('phaser').then((mod) => {
      if (destroyed || !container) return
      const P = (mod as { default: typeof PhaserType }).default

      const COLS     = 4
      const DW       = 88    // desk width
      const DH       = 64    // desk height
      const GX       = 36    // gap x
      const GY       = 88    // gap y  (room for sprite above)
      const OX       = 44    // left margin
      const WALL_H   = 72    // top wall height
      const FLOOR_Y  = WALL_H + 8   // floor starts here
      const OY       = FLOOR_Y + 80 // first desk row y
      const rows     = Math.max(1, Math.ceil(rooms.length / COLS))
      const W        = container.clientWidth || 920
      const DIALOG_H = 56
      const H        = Math.max(480, OY + rows * (DH + GY) + 60 + DIALOG_H)

      gameRef.current?.destroy(true)

      gameRef.current = new P.Game({
        type: P.AUTO,
        parent: container,
        width: W,
        height: H,
        backgroundColor: cfg.floorBg,
        banner: false,
        scene: {
          create(this: PhaserType.Scene) {
            const sw = this.scale.width

            // ── Floor tiles ───────────────────────────────────────
            const floor = this.add.graphics()
            const ts = 32
            // Tile lines (vertical + horizontal)
            floor.lineStyle(1, cfg.floorGrid, 0.7)
            for (let x = 0; x <= sw; x += ts) {
              floor.lineBetween(x, FLOOR_Y, x, H - DIALOG_H)
            }
            for (let y = FLOOR_Y; y <= H - DIALOG_H; y += ts) {
              floor.lineBetween(0, y, sw, y)
            }

            // ── Top wall ─────────────────────────────────────────
            const wall = this.add.graphics()
            // Main wall fill
            wall.fillStyle(cfg.wallTop, 1)
            wall.fillRect(0, 0, sw, WALL_H)
            // Accent stripe at bottom of wall
            wall.fillStyle(cfg.wallAccent, 1)
            wall.fillRect(0, WALL_H - 16, sw, 16)
            // Skirting line
            wall.fillStyle(cfg.skirting, 1)
            wall.fillRect(0, WALL_H, sw, 4)

            // ── Back-wall whiteboard (floor-to-ceiling, data-lab) ────────
            const wbX = 60
            const wbY = 2
            const wbW = sw - 162
            const wbH = WALL_H - 4   // ~68px
            const wb = this.add.graphics()
            // Board surface
            wb.fillStyle(0xf4f4ec, 1)
            wb.fillRect(wbX, wbY, wbW, wbH)
            wb.lineStyle(3, 0x999988, 0.9)
            wb.strokeRect(wbX, wbY, wbW, wbH)
            // Tray at bottom
            wb.fillStyle(0xbbbb99, 1)
            wb.fillRect(wbX, wbY + wbH - 4, wbW, 4)

            // Section dividers
            wb.lineStyle(1, 0xcccc99, 0.5)
            wb.lineBetween(wbX + Math.floor(wbW * 0.30), wbY + 4, wbX + Math.floor(wbW * 0.30), wbY + wbH - 6)
            wb.lineBetween(wbX + Math.floor(wbW * 0.56), wbY + 4, wbX + Math.floor(wbW * 0.56), wbY + wbH - 6)
            wb.lineBetween(wbX + Math.floor(wbW * 0.74), wbY + 4, wbX + Math.floor(wbW * 0.74), wbY + wbH - 6)

            // Equations — left 30%
            const eqX = wbX + 6
            this.add.text(eqX, wbY + 3,  'y = Wx + b',          { fontFamily: 'monospace', fontSize: '7px', color: '#224488' }).setOrigin(0, 0)
            this.add.text(eqX, wbY + 13, '∇L = ∂E/∂w',          { fontFamily: 'monospace', fontSize: '7px', color: '#334499' }).setOrigin(0, 0)
            this.add.text(eqX, wbY + 23, 'σ(z) = 1/(1+e⁻ᶻ)',   { fontFamily: 'monospace', fontSize: '7px', color: '#224488' }).setOrigin(0, 0)
            this.add.text(eqX, wbY + 33, 'P(A|B) ∝ P(B|A)P(A)', { fontFamily: 'monospace', fontSize: '7px', color: '#334499' }).setOrigin(0, 0)
            this.add.text(eqX, wbY + 43, 'loss = -Σyᵢ log(ŷᵢ)', { fontFamily: 'monospace', fontSize: '7px', color: '#224488' }).setOrigin(0, 0)
            this.add.text(eqX, wbY + 53, 'f(x) = ReLU(Wx + b)', { fontFamily: 'monospace', fontSize: '7px', color: '#334499' }).setOrigin(0, 0)

            // Neural network diagram — 30–56%
            const nnSX = wbX + Math.floor(wbW * 0.32)
            const layerDefs = [3, 4, 3]
            const nnNodeColors = [0x3366ff, 0x22bb66, 0xff5544]
            layerDefs.forEach((nodeCount, li) => {
              const lx = nnSX + li * Math.floor(wbW * 0.08)
              const vSpacing = wbH / (nodeCount + 1)
              for (let ni = 0; ni < nodeCount; ni++) {
                const ny = wbY + (ni + 1) * vSpacing
                if (li < layerDefs.length - 1) {
                  const nextCount = layerDefs[li + 1]
                  const nextSpacing = wbH / (nextCount + 1)
                  const nlx = nnSX + (li + 1) * Math.floor(wbW * 0.08)
                  for (let nni = 0; nni < nextCount; nni++) {
                    wb.lineStyle(1, 0x8899dd, 0.4)
                    wb.lineBetween(lx + 4, ny, nlx, wbY + (nni + 1) * nextSpacing)
                  }
                }
                wb.fillStyle(nnNodeColors[li], 0.85)
                wb.fillCircle(lx, ny, 4)
                wb.lineStyle(1, 0x2244aa, 0.5)
                wb.strokeCircle(lx, ny, 4)
              }
            })

            // Sticky notes — 56–74%
            const snSX = wbX + Math.floor(wbW * 0.58)
            const stickyColors = [0xffee44, 0xff9944, 0x44ee99, 0xff88bb]
            stickyColors.forEach((sc, si) => {
              const snx = snSX + (si % 2) * 26
              const sny = wbY + 4 + Math.floor(si / 2) * 30
              wb.fillStyle(sc, 0.88)
              wb.fillRect(snx, sny, 22, 22)
              wb.lineStyle(1, 0x888877, 0.35)
              wb.strokeRect(snx, sny, 22, 22)
              wb.lineStyle(1, 0x666655, 0.28)
              wb.lineBetween(snx + 3, sny + 7,  snx + 19, sny + 7)
              wb.lineBetween(snx + 3, sny + 12, snx + 19, sny + 12)
              wb.lineBetween(snx + 3, sny + 17, snx + 15, sny + 17)
            })

            // Data pipeline — 74–100%
            const pfSX = wbX + Math.floor(wbW * 0.76)
            const pfStages = ['RAW', 'FEAT', 'MDL', 'OUT']
            const pfStep = Math.floor(wbW * 0.057)
            pfStages.forEach((stage, si) => {
              const bx2 = pfSX + si * pfStep
              const by2 = wbY + Math.floor(wbH / 2) - 7
              wb.fillStyle(0x3355bb, 0.75)
              wb.fillRoundedRect(bx2, by2, 20, 14, 2)
              wb.lineStyle(1, 0x2244aa, 0.9)
              wb.strokeRoundedRect(bx2, by2, 20, 14, 2)
              this.add.text(bx2 + 10, by2 + 7, stage, {
                fontFamily: 'monospace', fontSize: '5px', color: '#aaccff',
              }).setOrigin(0.5)
              if (si < pfStages.length - 1) {
                wb.lineStyle(1, 0x4466bb, 0.9)
                wb.lineBetween(bx2 + 20, by2 + 7, bx2 + pfStep, by2 + 7)
                wb.fillStyle(0x4466bb, 0.9)
                wb.fillTriangle(bx2 + pfStep, by2 + 4, bx2 + pfStep, by2 + 10, bx2 + pfStep + 4, by2 + 7)
              }
            })

            // ── Live metrics display panel (right of whiteboard) ─────────
            const mpX = sw - 100
            const mpW = 94
            const mpH = WALL_H - 4
            const mp = this.add.graphics()
            mp.fillStyle(0x0d1117, 1)
            mp.fillRect(mpX, 2, mpW, mpH)
            mp.lineStyle(2, 0x30d158, 0.8)
            mp.strokeRect(mpX, 2, mpW, mpH)
            // Live indicator dot
            mp.fillStyle(0x30d158, 1)
            mp.fillCircle(mpX + 7, 9, 3)
            this.add.text(mpX + 13, 5, 'LIVE', { fontFamily: 'monospace', fontSize: '6px', color: '#30d158' }).setOrigin(0, 0)
            // Metric bars
            const metricsData = [
              { label: 'ACC',   val: 0.82, color: 0x30d158 },
              { label: 'F1',    val: 0.76, color: 0x00aaff },
              { label: 'DRIFT', val: 0.23, color: 0xff6b35 },
              { label: 'FRESH', val: 0.91, color: 0xb8ff44 },
            ]
            metricsData.forEach((m, mi) => {
              const my = 15 + mi * 12
              this.add.text(mpX + 3, my, m.label, { fontFamily: 'monospace', fontSize: '5px', color: '#888888' }).setOrigin(0, 0)
              const maxBarW = mpW - 34
              mp.fillStyle(0x1c2128, 1)
              mp.fillRect(mpX + 28, my, maxBarW, 7)
              mp.fillStyle(m.color, 0.85)
              mp.fillRect(mpX + 28, my, Math.round(m.val * maxBarW), 7)
            })

            // ── Title ─────────────────────────────────────────────
            this.add.text(sw / 2, WALL_H / 2 - 6, '★  THE VIRTUAL HIVE  ★', {
              fontFamily: cfg.font,
              fontSize: '11px',
              color: cfg.wallDeco === 0xffffff ? '#ffffff' : '#f4f4f5',
              letterSpacing: 3,
            }).setOrigin(0.5)

            if (rooms.length === 0) {
              this.add.text(sw / 2, (FLOOR_Y + H - DIALOG_H) / 2, 'No builders online right now.', {
                fontFamily: cfg.font,
                fontSize: '14px',
                color: cfg.nameColor,
              }).setOrigin(0.5)
            }

            // ── Room decorations ──────────────────────────────────────────
            const d = this.add.graphics()
            const DECOR_X = OX + COLS * (DW + GX) - GX + 24

            // ─── LEFT WALL: Elaborate espresso bar ───────────────────────
            const cmx = 6, cmy = FLOOR_Y + 10
            // Counter backing
            d.fillStyle(0x3e2a1a, 1)
            d.fillRect(cmx, cmy, 52, 78)
            d.lineStyle(2, cfg.deskBorder, 0.5)
            d.strokeRect(cmx, cmy, 52, 78)
            // Counter surface
            d.fillStyle(0x6b5240, 1)
            d.fillRect(cmx, cmy + 38, 52, 8)
            d.lineStyle(1, 0x8b7060, 0.5)
            d.strokeRect(cmx, cmy + 38, 52, 8)
            // Espresso machine body
            d.fillStyle(0x888888, 1)
            d.fillRoundedRect(cmx + 4, cmy + 44, 26, 28, 2)
            d.lineStyle(2, 0x666666, 0.8)
            d.strokeRoundedRect(cmx + 4, cmy + 44, 26, 28, 2)
            // Group head
            d.fillStyle(0x555555, 1)
            d.fillRoundedRect(cmx + 6, cmy + 44, 22, 8, 1)
            d.fillStyle(0x333333, 1)
            d.fillCircle(cmx + 17, cmy + 48, 4)
            d.fillStyle(cfg.monitorScreen, 0.9)
            d.fillCircle(cmx + 17, cmy + 48, 2)
            // Portafilter arms
            d.fillStyle(0x888888, 1)
            d.fillRect(cmx + 4, cmy + 54, 5, 10)
            d.fillRect(cmx + 25, cmy + 54, 5, 10)
            d.fillStyle(0x555555, 1)
            d.fillRoundedRect(cmx + 2, cmy + 62, 9, 4, 1)
            d.fillRoundedRect(cmx + 23, cmy + 62, 9, 4, 1)
            // Steam wand
            d.fillStyle(0x9a9a9a, 1)
            d.fillRect(cmx + 30, cmy + 46, 3, 20)
            d.fillRect(cmx + 28, cmy + 64, 7, 3)
            // Machine display
            d.fillStyle(0x0d1117, 1)
            d.fillRoundedRect(cmx + 8, cmy + 46, 12, 7, 1)
            d.fillStyle(cfg.monitorScreen, 0.6)
            d.fillRect(cmx + 9, cmy + 47, 4, 2)
            d.fillRect(cmx + 9, cmy + 50, 8, 1)
            // Brew button
            d.fillStyle(0xc0392b, 1)
            d.fillCircle(cmx + 23, cmy + 50, 3)
            // Grinder
            d.fillStyle(0x555555, 1)
            d.fillRoundedRect(cmx + 34, cmy + 44, 14, 22, 2)
            d.fillStyle(0x333333, 1)
            d.fillRect(cmx + 36, cmy + 46, 10, 10)
            d.fillStyle(0x777777, 1)
            d.fillCircle(cmx + 41, cmy + 51, 4)
            // Cups on counter
            d.fillStyle(0xf0ece0, 0.9)
            d.fillRect(cmx + 6,  cmy + 30, 8, 6)
            d.fillRect(cmx + 18, cmy + 30, 8, 6)
            d.fillRect(cmx + 30, cmy + 30, 8, 6)
            d.fillStyle(0x7a5230, 0.7)
            d.fillRect(cmx + 7,  cmy + 31, 6, 2)
            d.fillRect(cmx + 19, cmy + 31, 6, 2)
            // Shelf above — coffee canisters
            d.fillStyle(0x7a5230, 0.65)
            d.fillRoundedRect(cmx + 4,  cmy + 8,  12, 18, 1)
            d.fillRoundedRect(cmx + 20, cmy + 8,  12, 18, 1)
            d.fillRoundedRect(cmx + 36, cmy + 8,  12, 18, 1)
            d.lineStyle(1, 0x5a3a18, 0.45)
            d.strokeRoundedRect(cmx + 4,  cmy + 8,  12, 18, 1)
            d.strokeRoundedRect(cmx + 20, cmy + 8,  12, 18, 1)
            d.strokeRoundedRect(cmx + 36, cmy + 8,  12, 18, 1)
            this.add.text(cmx + 26, cmy + 82, 'espresso bar', {
              fontFamily: cfg.font, fontSize: '7px', color: cfg.nameColor,
            }).setOrigin(0.5, 0)

            // ─── BOOKSHELF (right column, top) ───────────────────────────
            const bsx = DECOR_X, bsy = FLOOR_Y + 16
            d.fillStyle(cfg.deskBorder, 1)
            d.fillRect(bsx, bsy, 58, 100)
            d.fillStyle(cfg.deskBg, 1)
            d.fillRect(bsx + 3, bsy + 3, 52, 94)
            d.fillStyle(cfg.deskBorder, 0.4)
            d.fillRect(bsx + 3, bsy + 34, 52, 2)
            d.fillRect(bsx + 3, bsy + 66, 52, 2)
            const bookColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22]
            bookColors.forEach((bc, bi) => {
              const bw2 = 6 + (bi % 3)
              const bxo = bsx + 5 + bi * 8
              if (bxo + bw2 > bsx + 54) return
              d.fillStyle(bc, 0.9)
              d.fillRect(bxo, bsy + 6, bw2, 26)
              d.lineStyle(1, 0x000000, 0.15)
              d.strokeRect(bxo, bsy + 6, bw2, 26)
            })
            bookColors.slice(2).forEach((bc, bi) => {
              const bw2 = 5 + (bi % 4)
              const bxo = bsx + 5 + bi * 8
              if (bxo + bw2 > bsx + 54) return
              d.fillStyle(bc, 0.9)
              d.fillRect(bxo, bsy + 38, bw2, 26)
            })
            bookColors.reverse().forEach((bc, bi) => {
              const bw2 = 5 + (bi % 3)
              const bxo = bsx + 5 + bi * 8
              if (bxo + bw2 > bsx + 54) return
              d.fillStyle(bc, 0.85)
              d.fillRect(bxo, bsy + 70, bw2, 22)
            })
            this.add.text(bsx + 29, bsy + 106, 'data shelf', {
              fontFamily: cfg.font, fontSize: '7px', color: cfg.nameColor,
            }).setOrigin(0.5, 0)

            // ─── GLASS SERVER CLOSET (right column, top) ─────────────────
            const srx = DECOR_X + 68, sry = FLOOR_Y + 16
            // Glass enclosure
            d.fillStyle(0x88ccff, 0.10)
            d.fillRect(srx - 5, sry - 4, 64, 122)
            d.lineStyle(2, 0x88bbee, 0.40)
            d.strokeRect(srx - 5, sry - 4, 64, 122)
            d.lineStyle(1, 0x88bbee, 0.25)
            d.lineBetween(srx - 5, sry + 35, srx + 59, sry + 35)
            d.lineBetween(srx - 5, sry + 75, srx + 59, sry + 75)
            // Server rack inside
            d.fillStyle(0x1c1c1e, 1)
            d.fillRoundedRect(srx, sry, 50, 108, 2)
            d.lineStyle(2, cfg.deskBorder, 0.6)
            d.strokeRoundedRect(srx, sry, 50, 108, 2)
            for (let ru = 0; ru < 5; ru++) {
              const ruy = sry + 8 + ru * 19
              d.fillStyle(0x2c2c2e, 1)
              d.fillRoundedRect(srx + 4, ruy, 42, 14, 1)
              d.lineStyle(1, 0x48484a, 0.8)
              d.strokeRoundedRect(srx + 4, ruy, 42, 14, 1)
              const ledColor = ru % 3 === 0 ? 0x00ff88 : ru % 3 === 1 ? 0x0088ff : 0x00ff88
              d.fillStyle(ledColor, 1)
              d.fillCircle(srx + 10, ruy + 7, 2)
              for (let ab = 0; ab < 4; ab++) {
                const abH = 4 + Math.floor((ru * 7 + ab * 3) % 7)
                d.fillStyle(ledColor, 0.6)
                d.fillRect(srx + 18 + ab * 6, ruy + 14 - abH, 4, abH)
              }
            }
            d.fillStyle(0x48484a, 0.5)
            for (let vs = 0; vs < 8; vs++) {
              d.fillRect(srx + 6 + vs * 5, sry + 100, 3, 6)
            }
            this.add.text(srx + 21, sry + 122, 'server room', {
              fontFamily: cfg.font, fontSize: '7px', color: cfg.nameColor,
            }).setOrigin(0.5, 0)

            // ─── COLLABORATION TABLE ──────────────────────────────────────
            const ctX = DECOR_X, ctY = FLOOR_Y + 140
            // Table surface
            d.fillStyle(cfg.deskBg, 1)
            d.fillRoundedRect(ctX, ctY + 14, 116, 50, 3)
            d.lineStyle(2, cfg.deskBorder, 0.8)
            d.strokeRoundedRect(ctX, ctY + 14, 116, 50, 3)
            // Legs
            d.fillStyle(cfg.deskBorder, 0.5)
            d.fillRect(ctX + 6,  ctY + 60, 5, 10)
            d.fillRect(ctX + 105, ctY + 60, 5, 10)
            d.fillRect(ctX + 6,  ctY + 14, 5, 10)
            d.fillRect(ctX + 105, ctY + 14, 5, 10)
            // Chairs — top row
            d.fillStyle(cfg.deskBg, 0.65)
            d.fillRoundedRect(ctX + 10, ctY + 2,  20, 13, 2)
            d.fillRoundedRect(ctX + 48, ctY + 2,  20, 13, 2)
            d.fillRoundedRect(ctX + 86, ctY + 2,  20, 13, 2)
            d.lineStyle(1, cfg.deskBorder, 0.4)
            d.strokeRoundedRect(ctX + 10, ctY + 2,  20, 13, 2)
            d.strokeRoundedRect(ctX + 48, ctY + 2,  20, 13, 2)
            d.strokeRoundedRect(ctX + 86, ctY + 2,  20, 13, 2)
            // Chairs — bottom row
            d.fillStyle(cfg.deskBg, 0.65)
            d.fillRoundedRect(ctX + 10, ctY + 64, 20, 13, 2)
            d.fillRoundedRect(ctX + 48, ctY + 64, 20, 13, 2)
            d.fillRoundedRect(ctX + 86, ctY + 64, 20, 13, 2)
            d.lineStyle(1, cfg.deskBorder, 0.4)
            d.strokeRoundedRect(ctX + 10, ctY + 64, 20, 13, 2)
            d.strokeRoundedRect(ctX + 48, ctY + 64, 20, 13, 2)
            d.strokeRoundedRect(ctX + 86, ctY + 64, 20, 13, 2)
            // Mounted display at right end
            d.fillStyle(0x1a1a1a, 1)
            d.fillRoundedRect(ctX + 120, ctY + 12, 28, 48, 2)
            d.lineStyle(2, cfg.deskBorder, 0.6)
            d.strokeRoundedRect(ctX + 120, ctY + 12, 28, 48, 2)
            d.fillStyle(0x0d1117, 1)
            d.fillRect(ctX + 123, ctY + 15, 22, 40)
            const ctCodeColors = [0x30d158, 0x00aaff, 0xffa500, 0x30d158, 0xffffff, 0xff6b35]
            ctCodeColors.forEach((lc, li) => {
              const lw = 6 + Math.floor((li * 7 + 3) % 14)
              d.fillStyle(lc, 0.7)
              d.fillRect(ctX + 125, ctY + 18 + li * 6, lw, 2)
            })
            d.fillStyle(cfg.deskBorder, 0.45)
            d.fillRect(ctX + 131, ctY + 60, 8, 5)
            d.fillRect(ctX + 126, ctY + 64, 18, 3)
            this.add.text(ctX + 64, ctY + 82, 'collab table', {
              fontFamily: cfg.font, fontSize: '7px', color: cfg.nameColor,
            }).setOrigin(0.5, 0)

            // ─── PLANTS (corner + accent) ─────────────────────────────────
            const drawPlant = (px: number, py: number, scale: number = 1) => {
              const pg = this.add.graphics()
              pg.fillStyle(0xc2783a, 1)
              pg.fillRect(px - Math.round(9*scale), py, Math.round(18*scale), Math.round(12*scale))
              pg.fillStyle(0xa0622a, 1)
              pg.fillRect(px - Math.round(11*scale), py + Math.round(9*scale), Math.round(22*scale), Math.round(4*scale))
              pg.fillStyle(0x5a3a1a, 0.6)
              pg.fillRect(px - Math.round(8*scale), py + 2, Math.round(16*scale), 4)
              pg.fillStyle(0x3a6e20, 1)
              pg.fillRect(px - 1, py - Math.round(8*scale), 2, Math.round(9*scale))
              pg.fillStyle(0x3a7a20, 1)
              pg.fillCircle(px, py - Math.round(18*scale), Math.round(12*scale))
              pg.fillCircle(px - Math.round(9*scale), py - Math.round(12*scale), Math.round(8*scale))
              pg.fillCircle(px + Math.round(9*scale), py - Math.round(12*scale), Math.round(8*scale))
              pg.fillStyle(0x5aaa38, 0.7)
              pg.fillCircle(px - Math.round(3*scale), py - Math.round(22*scale), Math.round(7*scale))
              pg.fillCircle(px + Math.round(5*scale), py - Math.round(16*scale), Math.round(5*scale))
            }
            drawPlant(20, H - DIALOG_H - 52, 1.2)
            drawPlant(sw - 20, H - DIALOG_H - 52, 1.2)
            drawPlant(DECOR_X + 148, FLOOR_Y + 134, 0.8)
            drawPlant(18, FLOOR_Y + 95, 0.9)

            // ─── PING PONG TABLE ──────────────────────────────────────────
            const ptx = DECOR_X, pty = FLOOR_Y + 256
            const pt = this.add.graphics()
            pt.fillStyle(0x7b5314, 1)
            pt.fillRect(ptx + 2,  pty + 44, 5, 8)
            pt.fillRect(ptx + 83, pty + 44, 5, 8)
            pt.fillRect(ptx + 2,  pty + 26, 5, 8)
            pt.fillRect(ptx + 83, pty + 26, 5, 8)
            pt.fillStyle(0x1a6fa8, 1)
            pt.fillRoundedRect(ptx, pty, 90, 52, 2)
            pt.lineStyle(2, 0x0f4a72, 1)
            pt.strokeRoundedRect(ptx, pty, 90, 52, 2)
            pt.lineStyle(2, 0xffffff, 0.9)
            pt.strokeRect(ptx + 4, pty + 4, 82, 44)
            pt.lineStyle(1, 0xffffff, 0.5)
            pt.lineBetween(ptx + 45, pty + 4, ptx + 45, pty + 48)
            pt.fillStyle(0x999999, 1)
            pt.fillRect(ptx - 3, pty + 18, 4, 16)
            pt.fillRect(ptx + 89, pty + 18, 4, 16)
            pt.fillStyle(0xe8e8e8, 1)
            pt.fillRect(ptx, pty + 22, 90, 8)
            pt.lineStyle(1, 0xbbbbbb, 0.6)
            for (let nm = 0; nm < 18; nm++) {
              pt.lineBetween(ptx + nm * 5, pty + 22, ptx + nm * 5, pty + 30)
            }
            pt.lineBetween(ptx, pty + 26, ptx + 90, pty + 26)
            pt.fillStyle(0xdd2222, 1)
            pt.fillCircle(ptx + 18, pty + 12, 7)
            pt.lineStyle(1, 0x991111, 1)
            pt.strokeCircle(ptx + 18, pty + 12, 7)
            pt.fillStyle(0x7b4a2a, 1)
            pt.fillRect(ptx + 17, pty + 18, 3, 8)
            pt.fillStyle(0x22aa44, 1)
            pt.fillCircle(ptx + 72, pty + 40, 7)
            pt.lineStyle(1, 0x116622, 1)
            pt.strokeCircle(ptx + 72, pty + 40, 7)
            pt.fillStyle(0x7b4a2a, 1)
            pt.fillRect(ptx + 71, pty + 46, 3, 8)
            pt.fillStyle(0xffffff, 1)
            pt.fillCircle(ptx + 44, pty + 23, 3)
            pt.lineStyle(1, 0xcccccc, 0.5)
            pt.strokeCircle(ptx + 44, pty + 23, 3)
            this.add.text(ptx + 45, pty + 58, 'ping pong', {
              fontFamily: cfg.font, fontSize: '7px', color: cfg.nameColor,
            }).setOrigin(0.5, 0)

            // ─── SHADOW (black cat) ───────────────────────────────────────
            const catx = DECOR_X + 110, caty = FLOOR_Y + 276
            const cat = this.add.graphics()
            cat.lineStyle(4, 0x111111, 1)
            cat.lineBetween(catx + 7,  caty + 16, catx + 18, caty + 24)
            cat.lineBetween(catx + 18, caty + 24, catx + 28, caty + 20)
            cat.lineBetween(catx + 28, caty + 20, catx + 30, caty + 10)
            cat.lineBetween(catx + 30, caty + 10, catx + 24, caty + 4)
            cat.lineBetween(catx + 24, caty + 4,  catx + 18, caty + 8)
            cat.fillStyle(0x111111, 1)
            cat.fillCircle(catx + 18, caty + 8, 4)
            cat.fillStyle(0x111111, 1)
            cat.fillEllipse(catx, caty + 12, 22, 16)
            cat.fillCircle(catx, caty, 11)
            cat.fillTriangle(catx - 9, caty - 6, catx - 5, caty - 17, catx - 1, caty - 6)
            cat.fillTriangle(catx + 1,  caty - 6, catx + 5, caty - 17, catx + 9, caty - 6)
            cat.fillStyle(0xff8899, 0.65)
            cat.fillTriangle(catx - 7, caty - 8, catx - 5, caty - 14, catx - 2, caty - 8)
            cat.fillTriangle(catx + 2, caty - 8, catx + 5, caty - 14, catx + 7, caty - 8)
            cat.fillStyle(0xaaee00, 1)
            cat.fillEllipse(catx - 3, caty - 1, 6, 5)
            cat.fillEllipse(catx + 3, caty - 1, 6, 5)
            cat.fillStyle(0x111111, 1)
            cat.fillEllipse(catx - 3, caty - 1, 2, 4)
            cat.fillEllipse(catx + 3, caty - 1, 2, 4)
            cat.fillStyle(0xff5577, 1)
            cat.fillTriangle(catx - 2, caty + 4, catx + 2, caty + 4, catx, caty + 6)
            cat.lineStyle(1, 0x111111, 1)
            cat.lineBetween(catx - 12, caty + 2, catx - 5, caty + 3)
            cat.lineBetween(catx - 12, caty + 5, catx - 5, caty + 5)
            cat.lineBetween(catx - 12, caty + 8, catx - 5, caty + 7)
            cat.lineBetween(catx + 5, caty + 3, catx + 12, caty + 2)
            cat.lineBetween(catx + 5, caty + 5, catx + 12, caty + 5)
            cat.lineBetween(catx + 5, caty + 7, catx + 12, caty + 8)
            this.add.text(catx, caty + 26, 'Georgia', {
              fontFamily: cfg.font, fontSize: '7px', color: cfg.nameColor,
            }).setOrigin(0.5, 0)

            // ─── BISCUIT (white terrier cattle dog) ──────────────────────
            const dogx = catx + 52, dogy = caty + 8
            const dog = this.add.graphics()
            const tail = this.add.graphics()
            tail.lineStyle(4, 0xffffff, 1)
            tail.lineBetween(dogx - 18, dogy + 6, dogx - 28, dogy - 6)
            tail.lineStyle(2, 0x444444, 0.25)
            tail.lineBetween(dogx - 18, dogy + 6, dogx - 28, dogy - 6)
            dog.fillStyle(0xfafafa, 1)
            dog.fillEllipse(dogx, dogy + 10, 38, 22)
            dog.lineStyle(1, 0xcccccc, 0.5)
            dog.strokeEllipse(dogx, dogy + 10, 38, 22)
            dog.fillStyle(0x1a1a1a, 1)
            dog.fillEllipse(dogx - 9, dogy + 7,  11, 9)
            dog.fillEllipse(dogx + 8, dogy + 14,  9, 7)
            dog.fillEllipse(dogx + 14, dogy + 4,  7, 6)
            dog.fillStyle(0xfafafa, 1)
            dog.fillRect(dogx - 14, dogy + 19, 6, 12)
            dog.fillRect(dogx - 5,  dogy + 19, 6, 12)
            dog.fillRect(dogx + 4,  dogy + 19, 6, 12)
            dog.fillRect(dogx + 13, dogy + 19, 6, 12)
            dog.lineStyle(1, 0xcccccc, 0.4)
            dog.strokeRect(dogx - 14, dogy + 19, 6, 12)
            dog.strokeRect(dogx + 13, dogy + 19, 6, 12)
            dog.fillStyle(0x222222, 1)
            dog.fillRect(dogx - 14, dogy + 28, 6, 4)
            dog.fillRect(dogx - 5,  dogy + 28, 6, 4)
            dog.fillRect(dogx + 4,  dogy + 28, 6, 4)
            dog.fillRect(dogx + 13, dogy + 28, 6, 4)
            dog.fillStyle(0xfafafa, 1)
            dog.fillCircle(dogx + 18, dogy + 1, 13)
            dog.lineStyle(1, 0xcccccc, 0.4)
            dog.strokeCircle(dogx + 18, dogy + 1, 13)
            dog.fillStyle(0x1a1a1a, 1)
            dog.fillEllipse(dogx + 22, dogy - 4, 11, 9)
            dog.fillStyle(0xfafafa, 1)
            dog.fillEllipse(dogx + 8,  dogy - 10, 9, 16)
            dog.fillEllipse(dogx + 28, dogy - 10, 9, 16)
            dog.fillStyle(0x1a1a1a, 1)
            dog.fillEllipse(dogx + 8,  dogy - 16, 7, 7)
            dog.fillEllipse(dogx + 28, dogy - 16, 7, 7)
            dog.fillStyle(0x1a1a1a, 1)
            dog.fillCircle(dogx + 14, dogy + 1, 2)
            dog.fillStyle(0xfafafa, 1)
            dog.fillCircle(dogx + 22, dogy - 3, 3)
            dog.fillStyle(0x1a1a1a, 1)
            dog.fillCircle(dogx + 22, dogy - 3, 1.5)
            dog.fillStyle(0x222222, 1)
            dog.fillEllipse(dogx + 29, dogy + 7, 7, 5)
            dog.fillStyle(0x111111, 1)
            dog.fillCircle(dogx + 27, dogy + 7, 1)
            dog.fillCircle(dogx + 31, dogy + 7, 1)
            dog.fillStyle(0xff7799, 1)
            dog.fillEllipse(dogx + 29, dogy + 13, 6, 9)
            dog.fillStyle(0xee6688, 0.5)
            dog.fillRect(dogx + 29, dogy + 10, 1, 6)
            this.add.text(dogx, dogy + 36, 'Benny', {
              fontFamily: cfg.font, fontSize: '7px', color: cfg.nameColor,
            }).setOrigin(0.5, 0)

            rooms.forEach((room, i) => {
              const col = i % COLS
              const row = Math.floor(i / COLS)
              const dx  = OX + col * (DW + GX)
              const dy  = OY + row * (DH + GY)
              const cx  = dx + DW / 2
              const isAway = room.status === 'paused'
              const alpha  = isAway ? 0.35 : 1
              const shirtColor = nameToColor(room.profiles?.display_name ?? room.creator_id)

              // ── Workstation ─────────────────────────────────────
              const desk = this.add.graphics()

              // Desk surface — white with blue border (Pokemon PC style)
              desk.fillStyle(cfg.deskBg, 1)
              desk.fillRoundedRect(dx, dy, DW, DH, 3)
              desk.lineStyle(3, cfg.deskBorder, 1)
              desk.strokeRoundedRect(dx, dy, DW, DH, 3)

              // Monitor back (slightly taller box behind screen)
              desk.fillStyle(cfg.monitorBg, 1)
              desk.fillRoundedRect(dx + 14, dy + 6, DW - 28, 36, 2)
              desk.lineStyle(2, cfg.monitorBorder, 1)
              desk.strokeRoundedRect(dx + 14, dy + 6, DW - 28, 36, 2)

              // Monitor screen — dark terminal aesthetic
              desk.fillStyle(0x0d1117, 1)
              desk.fillRect(dx + 18, dy + 10, DW - 36, 28)
              // Terminal code lines (unique per desk)
              const termColors = [0x30d158, 0x00aaff, 0xffa500, 0x30d158, 0xff6b35]
              termColors.forEach((tc, ti) => {
                if (ti >= 4) return
                const lw = 6 + Math.floor((i * 11 + ti * 7) % 20)
                desk.fillStyle(tc, 0.72)
                desk.fillRect(dx + 20, dy + 12 + ti * 6, lw, 2)
              })
              // Cursor blink (static green block)
              desk.fillStyle(0x30d158, 0.85)
              desk.fillRect(dx + 20, dy + 36, 4, 2)

              // Keyboard (bottom of desk)
              desk.fillStyle(cfg.deskBorder, 0.3)
              desk.fillRoundedRect(dx + 16, dy + DH - 14, DW - 32, 8, 1)
              desk.lineStyle(1, cfg.deskBorder, 0.5)
              desk.strokeRoundedRect(dx + 16, dy + DH - 14, DW - 32, 8, 1)

              // ── Pixel character (above desk) ─────────────────────
              const sy = dy - 38   // feet position

              const sp = this.add.graphics()
              sp.setAlpha(alpha)

              // Shoes / feet
              sp.fillStyle(0x303030, 1)
              sp.fillRect(cx - 7, sy + 28, 6, 4)
              sp.fillRect(cx + 1, sy + 28, 6, 4)

              // Legs (dark pants)
              sp.fillStyle(0x2850a0, 1)
              sp.fillRect(cx - 7, sy + 16, 6, 13)
              sp.fillRect(cx + 1, sy + 16, 6, 13)

              // Body / shirt (unique per user)
              sp.fillStyle(shirtColor, 1)
              sp.fillRect(cx - 9, sy + 5, 18, 12)

              // Arms
              sp.fillStyle(shirtColor, 0.85)
              sp.fillRect(cx - 14, sy + 6, 5, 9)
              sp.fillRect(cx + 9, sy + 6, 5, 9)

              // Hands
              sp.fillStyle(cfg.skinA, 1)
              sp.fillRect(cx - 14, sy + 14, 5, 4)
              sp.fillRect(cx + 9, sy + 14, 5, 4)

              // Neck
              sp.fillStyle(cfg.skinA, 1)
              sp.fillRect(cx - 3, sy + 1, 6, 5)

              // Head
              sp.fillStyle(cfg.skinA, 1)
              sp.fillRect(cx - 7, sy - 10, 14, 12)

              // Hair / hat (user color, darker)
              const hairColor = Math.max(0, shirtColor - 0x303030)
              sp.fillStyle(hairColor, 1)
              sp.fillRect(cx - 7, sy - 10, 14, 4)
              sp.fillRect(cx - 8, sy - 8, 2, 6)
              sp.fillRect(cx + 6, sy - 8, 2, 6)

              // Eyes (small dark dots)
              sp.fillStyle(0x181818, 1)
              sp.fillRect(cx - 4, sy - 4, 2, 2)
              sp.fillRect(cx + 2, sy - 4, 2, 2)

              // Idle bob tween
              this.tweens.add({
                targets: sp,
                y: '-=3',
                duration: 800 + (i * 197) % 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              })

              // ── Task speech bubble ───────────────────────────────
              const taskRaw  = room.name
              const task     = taskRaw.length > 22 ? taskRaw.slice(0, 20) + '…' : taskRaw
              const bw       = Math.min(task.length * 5.8 + 18, DW + GX - 4)
              const bh       = 20
              const bx       = cx - bw / 2
              const by       = dy - 78

              const bubble = this.add.graphics()
              bubble.fillStyle(cfg.dialogBg, 0.92)
              bubble.fillRoundedRect(bx, by, bw, bh, 4)
              bubble.lineStyle(2, cfg.dialogBorder, 1)
              bubble.strokeRoundedRect(bx, by, bw, bh, 4)
              // Bubble tail
              bubble.fillStyle(cfg.dialogBg, 0.92)
              bubble.fillTriangle(cx - 5, by + bh, cx + 5, by + bh, cx, by + bh + 8)
              bubble.lineStyle(2, cfg.dialogBorder, 1)
              bubble.lineBetween(cx - 5, by + bh, cx, by + bh + 8)
              bubble.lineBetween(cx + 5, by + bh, cx, by + bh + 8)
              bubble.setAlpha(alpha)

              this.add.text(cx, by + bh / 2, task, {
                fontFamily: cfg.font,
                fontSize: '8px',
                color: cfg.taskColor,
              }).setOrigin(0.5).setAlpha(alpha)

              // ── Display name (below desk) ────────────────────────
              const displayName = room.profiles?.display_name ?? 'Builder'
              this.add.text(cx, dy + DH + 4, displayName, {
                fontFamily: cfg.font,
                fontSize: '9px',
                color: cfg.nameColor,
              }).setOrigin(0.5, 0).setAlpha(alpha)

              // ── "You" marker ─────────────────────────────────────
              if (room.creator_id === currentUserId) {
                this.add.text(cx, by - 12, '▲ YOU', {
                  fontFamily: cfg.font,
                  fontSize: '8px',
                  color: cfg.youColor,
                }).setOrigin(0.5)
              }
            })

            // ── Bottom dialog box (Pokemon style) ─────────────────
            const dlgY = H - DIALOG_H
            const dlg  = this.add.graphics()
            dlg.fillStyle(cfg.dialogBg, 1)
            dlg.fillRect(0, dlgY, sw, DIALOG_H)
            dlg.lineStyle(3, cfg.dialogBorder, 1)
            dlg.strokeRect(4, dlgY + 4, sw - 8, DIALOG_H - 8)

            const online  = rooms.filter(r => r.status === 'active').length
            const onBreak = rooms.filter(r => r.status === 'paused').length
            const msg = rooms.length === 0
              ? 'The hive is quiet. Be the first to lock in.'
              : `${online} builder${online !== 1 ? 's' : ''} locked in${onBreak > 0 ? `, ${onBreak} on a break` : ''}.`

            this.add.text(20, dlgY + DIALOG_H / 2 - 6, '▶', {
              fontFamily: cfg.font,
              fontSize: '12px',
              color: cfg.dialogText,
            }).setOrigin(0, 0.5)

            this.add.text(38, dlgY + DIALOG_H / 2 - 6, msg, {
              fontFamily: cfg.font,
              fontSize: '12px',
              color: cfg.dialogText,
              wordWrap: { width: sw - 60 },
            }).setOrigin(0, 0.5)
          },
        },
        scale: {
          mode: P.Scale.FIT,
          autoCenter: P.Scale.CENTER_HORIZONTALLY,
        },
      })
    })

    return () => {
      destroyed = true
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [rooms, theme, currentUserId])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ minHeight: 480 }}
    />
  )
}
