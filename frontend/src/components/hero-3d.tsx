"use client"

import { useEffect, useRef } from "react"

/**
 * The Regent orb: a wireframe sphere (the wallet) inside three inclined
 * brass orbits (the mandate boundaries — budget, slippage, expiry), each
 * patrolled by an agent mote. Hand-rolled 3D projection on a 2D canvas:
 * no WebGL, no dependencies, ~60fps, static frame under reduced motion.
 */

type Vec3 = { x: number; y: number; z: number }

const TAU = Math.PI * 2

function rotate(p: Vec3, rotY: number, rotX: number): Vec3 {
  const cy = Math.cos(rotY)
  const sy = Math.sin(rotY)
  const cx = Math.cos(rotX)
  const sx = Math.sin(rotX)
  const x1 = p.x * cy + p.z * sy
  const z1 = -p.x * sy + p.z * cy
  const y2 = p.y * cx - z1 * sx
  const z2 = p.y * sx + z1 * cx
  return { x: x1, y: y2, z: z2 }
}

function buildSphere(): Vec3[][] {
  const lines: Vec3[][] = []
  const SEGMENTS = 72

  for (const latDeg of [-54, -27, 0, 27, 54]) {
    const lat = (latDeg * Math.PI) / 180
    const r = Math.cos(lat)
    const y = Math.sin(lat)
    const ring: Vec3[] = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * TAU
      ring.push({ x: r * Math.cos(a), y, z: r * Math.sin(a) })
    }
    lines.push(ring)
  }

  for (let m = 0; m < 8; m++) {
    const meridian = (m / 8) * Math.PI
    const line: Vec3[] = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * TAU
      const x = Math.cos(a) * Math.cos(meridian)
      const z = Math.cos(a) * Math.sin(meridian)
      line.push({ x, y: Math.sin(a), z })
    }
    lines.push(line)
  }

  return lines
}

const ORBITS = [
  { radius: 1.5, incline: 0.42, phase: 0, speed: 0.00022 },
  { radius: 1.78, incline: -0.58, phase: 2.1, speed: -0.00016 },
  { radius: 2.06, incline: 1.05, phase: 4.4, speed: 0.00011 },
]

function orbitPoint(orbit: (typeof ORBITS)[number], angle: number): Vec3 {
  const flat = { x: orbit.radius * Math.cos(angle), y: 0, z: orbit.radius * Math.sin(angle) }
  return rotate(flat, orbit.phase, orbit.incline)
}

export function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const styles = getComputedStyle(document.documentElement)
    const brass = styles.getPropertyValue("--color-brass").trim() || "#c9a35e"
    const brassBright = styles.getPropertyValue("--color-brass-bright").trim() || "#e2c280"

    const sphere = buildSphere()
    const stars = Array.from({ length: 110 }, () => {
      const a = Math.random() * TAU
      const b = Math.acos(2 * Math.random() - 1)
      const r = 2.7 + Math.random() * 1.3
      return {
        x: r * Math.sin(b) * Math.cos(a),
        y: r * Math.cos(b),
        z: r * Math.sin(b) * Math.sin(a),
        size: 0.6 + Math.random() * 1.1,
      }
    })

    let width = 0
    let height = 0
    let dpr = 1
    const mouse = { x: 0, y: 0 }
    const parallax = { x: 0, y: 0 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onPointerMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1
    }

    const render = (t: number) => {
      parallax.x += (mouse.x - parallax.x) * 0.04
      parallax.y += (mouse.y - parallax.y) * 0.04

      const rotY = t * 0.00012 + parallax.x * 0.35
      const rotX = 0.32 + parallax.y * 0.22
      const cx = width / 2
      const cy = height / 2
      const scale = Math.min(width, height) * 0.21
      const persp = 5.2

      const toScreen = (p: Vec3) => {
        const r = rotate(p, rotY, rotX)
        const f = persp / (persp - r.z)
        return { x: cx + r.x * scale * f, y: cy + r.y * scale * f, z: r.z, f }
      }

      ctx.clearRect(0, 0, width, height)

      // stars
      for (const star of stars) {
        const s = toScreen(star)
        const alpha = 0.1 + 0.16 * ((star.z + 4) / 8)
        ctx.fillStyle = `rgba(236, 230, 217, ${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, star.size * s.f * 0.7, 0, TAU)
        ctx.fill()
      }

      // core glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.5)
      glow.addColorStop(0, "rgba(201, 163, 94, 0.16)")
      glow.addColorStop(1, "rgba(201, 163, 94, 0)")
      ctx.fillStyle = glow
      ctx.fillRect(cx - scale * 1.6, cy - scale * 1.6, scale * 3.2, scale * 3.2)

      // wireframe sphere — back-facing segments drawn dimmer
      for (const line of sphere) {
        ctx.beginPath()
        let prev = toScreen(line[0])
        for (let i = 1; i < line.length; i++) {
          const cur = toScreen(line[i])
          const depth = (prev.z + cur.z) / 2
          ctx.strokeStyle = `rgba(236, 230, 217, ${(0.035 + 0.075 * ((depth + 1) / 2)).toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(prev.x, prev.y)
          ctx.lineTo(cur.x, cur.y)
          ctx.stroke()
          prev = cur
        }
      }

      // orbits + agent motes
      for (const orbit of ORBITS) {
        ctx.beginPath()
        for (let i = 0; i <= 96; i++) {
          const s = toScreen(orbitPoint(orbit, (i / 96) * TAU))
          if (i === 0) ctx.moveTo(s.x, s.y)
          else ctx.lineTo(s.x, s.y)
        }
        ctx.strokeStyle = "rgba(201, 163, 94, 0.22)"
        ctx.lineWidth = 1
        ctx.stroke()

        const head = t * orbit.speed + orbit.phase
        for (let i = 12; i >= 0; i--) {
          const s = toScreen(orbitPoint(orbit, head - i * 0.05 * Math.sign(orbit.speed || 1)))
          const fade = 1 - i / 13
          ctx.fillStyle =
            i === 0
              ? brassBright
              : `rgba(201, 163, 94, ${(0.5 * fade * fade).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(s.x, s.y, (i === 0 ? 2.6 : 1.6 * fade) * s.f, 0, TAU)
          ctx.fill()
        }
      }

      // core
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.16)
      core.addColorStop(0, brassBright)
      core.addColorStop(0.55, brass)
      core.addColorStop(1, "rgba(201, 163, 94, 0)")
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, scale * 0.16, 0, TAU)
      ctx.fill()
    }

    resize()

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    if (reducedMotion) {
      render(8000)
    } else {
      const loop = (t: number) => {
        render(t)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      window.addEventListener("pointermove", onPointerMove, { passive: true })
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (reducedMotion) render(8000)
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onPointerMove)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
}
