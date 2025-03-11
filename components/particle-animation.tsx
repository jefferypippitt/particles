'use client'

import { JP_LOGO_PATH } from '@/lib/logo-path'
import React, { useRef, useEffect, useState } from 'react'



export default function ParticleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas to full window size
    const updateCanvasSize = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768)
    }

    updateCanvasSize()

    let particles: {
      x: number
      y: number
      size: number
      baseX: number
      baseY: number
      density: number
      color: string
    }[] = []

    // Create text image
    function createTextImage() {
      if (!ctx || !canvas) return null
      
      ctx.fillStyle = 'white'
      ctx.font = isMobile ? 'bold 12px Verdana' : 'bold 16px Verdana'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Create a temporary canvas for the SVG
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return null
      
      const svgSize = isMobile ? 200 : 300
      tempCanvas.width = svgSize
      tempCanvas.height = svgSize
      
      // Draw SVG path
      tempCtx.fillStyle = 'white'
      const path = new Path2D(JP_LOGO_PATH)
      tempCtx.translate(svgSize / 2, svgSize / 2)
      tempCtx.scale(0.15, 0.15) // Scale the SVG to fit
      tempCtx.fill(path)
      
      return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    }

    // Create a particle
    function createParticle(scale: number) {
      if (!canvas) return null
      
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = (Math.random() * 1.5 + 0.5) * scale
      const color = 'white'
      const baseX = x
      const baseY = y
      const density = (Math.random() * 30) + 1

      return {
        x,
        y,
        size,
        baseX,
        baseY,
        density,
        color
      }
    }

    // Create initial particles
    function createInitialParticles(scale: number) {
      const imageData = createTextImage()
      if (!imageData || !canvas) return
      
      particles = []
      const particleCount = isMobile ? 4000 : 9000
      
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle(scale)
        if (particle) {
          particles.push(particle)
        }
      }
    }

    // Animation loop
    function animate(scale: number) {
      if (!ctx || !canvas) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        const dx = mousePositionRef.current.x - particles[i].x
        const dy = mousePositionRef.current.y - particles[i].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const forceDirectionX = dx / distance
        const forceDirectionY = dy / distance
        const maxDistance = isMobile ? 100 : 150
        const force = (maxDistance - distance) / maxDistance
        const directionX = forceDirectionX * force * particles[i].density
        const directionY = forceDirectionY * force * particles[i].density

        if (distance < maxDistance && (isTouchingRef.current || !('ontouchstart' in window))) {
          particles[i].x -= directionX
          particles[i].y -= directionY
          ctx.fillStyle = '#6366f1' // Purple color when scattered
        } else {
          if (particles[i].x !== particles[i].baseX) {
            const dx = particles[i].x - particles[i].baseX
            particles[i].x -= dx / 10
          }
          if (particles[i].y !== particles[i].baseY) {
            const dy = particles[i].y - particles[i].baseY
            particles[i].y -= dy / 10
          }
          ctx.fillStyle = particles[i].color
        }

        ctx.beginPath()
        ctx.arc(particles[i].x, particles[i].y, particles[i].size, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()
      }

      requestAnimationFrame(() => animate(scale))
    }

    const scale = isMobile ? 1 : 2
    createInitialParticles(scale)
    animate(scale)

    // Event handlers
    const handleResize = () => {
      updateCanvasSize()
      createInitialParticles(isMobile ? 1 : 2)
    }

    const handleMove = (x: number, y: number) => {
      mousePositionRef.current = { x, y }
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleTouchStart = () => {
      isTouchingRef.current = true
    }

    const handleTouchEnd = () => {
      isTouchingRef.current = false
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile])

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
} 