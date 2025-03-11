'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

// Particle type definition
type Particle = {
  x: number
  y: number
  baseX: number
  baseY: number
  size: number
  color: string
  scatteredColor: string
  life: number
  vx: number
  vy: number
}

export default function CenteredLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const animationRef = useRef<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const logoPositionRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const svg = svgRef.current
    if (!canvas || !svg) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const updateCanvasSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height
      setIsMobile(width < 768)
      
      // Clear existing particles when resizing
      particlesRef.current = []
      
      // Update logo position
      const svgRect = svg.getBoundingClientRect()
      logoPositionRef.current = {
        x: (width - svgRect.width) / 2,
        y: (height - svgRect.height) / 2,
        width: svgRect.width,
        height: svgRect.height
      }
    }

    updateCanvasSize()

    // Create particles from SVG
    const createParticlesFromSVG = () => {
      // Get SVG data
      const svgRect = svg.getBoundingClientRect()
      const svgData = new XMLSerializer().serializeToString(svg)
      const img = new Image()
      
      img.onload = () => {
        // Create a temporary canvas to draw the SVG
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return

        // Clear temp canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        
        // Draw the SVG in the center of the canvas
        const x = (canvas.width - svgRect.width) / 2
        const y = (canvas.height - svgRect.height) / 2
        tempCtx.drawImage(img, x, y, svgRect.width, svgRect.height)
        
        // Get image data
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        const data = imageData.data
        
        // Create particles
        const newParticles: Particle[] = []
        const particleCount = isMobile ? 10000 : 25000
        
        for (let i = 0; i < particleCount; i++) {
          // Try to find a white pixel
          for (let attempt = 0; attempt < 100; attempt++) {
            const x = Math.floor(Math.random() * canvas.width)
            const y = Math.floor(Math.random() * canvas.height)
            const index = (y * canvas.width + x) * 4
            
            // Check if pixel is white (part of the SVG)
            if (data[index + 3] > 128) {
              newParticles.push({
                x,
                y,
                baseX: x,
                baseY: y,
                size: Math.random() * 0.7 + 0.2, // Even smaller particles
                color: 'white',
                scatteredColor: '#6366f1', // Purple color
                life: Math.random() * 100 + 50,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8
              })
              break
            }
          }
        }
        
        particlesRef.current = newParticles
      }
      
      // Set the image source to the SVG data
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }

    // Check if mouse is over logo area
    const isMouseOverLogo = (mouseX: number, mouseY: number) => {
      const { x, y, width, height } = logoPositionRef.current
      return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height
    }

    // Animate particles
    const animate = () => {
      if (!ctx || !canvas) return
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Fill background
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Get mouse position
      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const mouseOverLogo = isMouseOverLogo(mouseX, mouseY)
      
      // Use a smaller radius when over the logo for more focused effect
      const maxDistance = mouseOverLogo ? 80 : 120
      
      // Update and draw particles
      const particles = particlesRef.current
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Calculate distance from mouse
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Add some natural movement regardless of mouse position
        p.vx += (Math.random() - 0.5) * 0.3
        p.vy += (Math.random() - 0.5) * 0.3
        
        // Dampen velocity
        p.vx *= 0.92
        p.vy *= 0.92
        
        // Move particles away from mouse - black hole effect
        if (distance < maxDistance && (isTouchingRef.current || !('ontouchstart' in window))) {
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          
          // Stronger force when over the logo
          const forceMagnitude = mouseOverLogo ? 30 : 20
          const moveX = Math.cos(angle) * force * forceMagnitude
          const moveY = Math.sin(angle) * force * forceMagnitude
          
          // Add repulsion force to velocity
          p.vx -= moveX
          p.vy -= moveY
          
          // Increase velocity for particles close to the center
          if (distance < maxDistance * 0.3) {
            // More dramatic acceleration when over logo
            const velocityMultiplier = mouseOverLogo ? 1.2 : 1.1
            p.vx *= velocityMultiplier
            p.vy *= velocityMultiplier
          }
          
          ctx.fillStyle = p.scatteredColor
        } else {
          // Return to original position with easing
          // Slower return when affected by logo interaction
          const returnSpeed = mouseOverLogo && distance < maxDistance * 2 ? 0.01 : 0.03
          p.vx += (p.baseX - p.x) * returnSpeed
          p.vy += (p.baseY - p.y) * returnSpeed
          
          ctx.fillStyle = p.color
        }
        
        // Apply velocity
        p.x += p.vx
        p.y += p.vy
        
        // Draw particle
        ctx.fillRect(p.x, p.y, p.size, p.size)
        
        // Update particle life
        p.life--
        if (p.life <= 0) {
          // Replace dead particle
          particles[i] = {
            ...p,
            life: Math.random() * 100 + 50,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    createParticlesFromSVG()
    animationRef.current = requestAnimationFrame(animate)

    // Event handlers
    const handleResize = () => {
      updateCanvasSize()
      createParticlesFromSVG()
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    const handleTouchStart = () => {
      isTouchingRef.current = true
    }

    const handleTouchEnd = () => {
      isTouchingRef.current = false
    }

    // Add event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isMobile]) // Only depend on isMobile, not particles

  return (
    <div className="flex items-center justify-center h-screen w-full">
      {/* Hidden SVG for particle generation */}
      <div className="absolute opacity-0 pointer-events-none">
        <svg 
          ref={svgRef}
          viewBox="0 0 3000 1880" 
          fill="white"
          width="1200"
          height="750"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform="translate(0.000000,1880.000000) scale(0.100000,-0.100000)">
            <path d="M12750 15170 l-1600 -920 -30 -1330 c-10 -720 0 -1320 20 -1320 30 0 380 200 780 440 l730 450 50 -2850 50 -2860 880 -450 c480 -250 910 -420 950 -380 40 30 90 2150 100 4690 40 4420 -10 5460 -260 5460 -40 0 -790 -420 -1670 -930z m1670 -4800 c20 -2290 0 -4050 -40 -3900 -60 220 -250 370 -830 680 l-750 400 0 2920 c0 1610 -20 2930 -50 2930 -20 0 -280 -150 -570 -340 -1060 -670 -980 -690 -980 270 l0 840 1580 900 1570 900 20 -710 c20 -390 40 -2590 50 -4890z M15530 15880 c-40 -70 -90 -590 -110 -1150 -40 -970 -30 -1020 190 -1160 130 -80 1240 -690 2460 -1350 2290 -1230 2430 -1270 2430 -720 0 230 -230 370 -2400 1540 l-2400 1280 0 790 c0 430 20 790 50 790 20 0 1440 -750 3150 -1670 l3100 -1670 0 -1110 0 -1110 -1720 -1000 c-1390 -810 -1740 -1060 -1760 -1250 -20 -130 -80 -280 -140 -340 -70 -70 -80 -10 -30 200 40 170 90 720 110 1240 10 520 70 970 130 1000 130 80 180 890 50 1000 -50 50 -720 430 -1490 840 -1230 670 -1420 740 -1550 610 -130 -130 -150 -820 -150 -5040 0 -2680 30 -4910 70 -4950 70 -70 1650 820 1760 990 80 130 70 -30 100 3260 l20 2550 450 290 c250 150 480 260 510 240 20 -30 0 -170 -60 -320 -160 -420 -130 -2050 30 -2120 140 -50 3560 1890 3690 2100 50 60 70 760 50 1560 l-20 1450 -3100 1670 c-1700 920 -3150 1680 -3220 1680 -60 0 -150 -60 -200 -120z m2550 -4460 c280 -140 520 -310 520 -370 0 -50 -300 -270 -650 -480 l-650 -380 -10 -2170 c-10 -1190 -30 -2500 -50 -2910 l-30 -740 -680 -430 c-490 -310 -720 -520 -810 -760 -120 -330 -130 -320 -70 160 30 270 50 2480 50 4920 l0 4440 930 -510 c500 -270 1160 -620 1450 -770z M9790 10170 c-860 -510 -1640 -980 -1730 -1060 -130 -110 -160 -330 -150 -1200 0 -580 40 -1250 70 -1490 l70 -430 3190 -1700 c1760 -930 3230 -1660 3270 -1620 100 110 150 1920 60 2190 -50 140 -780 590 -2330 1430 -1250 670 -2280 1200 -2300 1180 -20 -20 330 -230 790 -470 450 -240 850 -480 880 -530 30 -50 100 -90 150 -90 180 -10 540 -210 540 -300 0 -50 50 -60 100 -30 60 30 100 10 100 -50 0 -120 1100 -720 1200 -660 40 30 100 -20 140 -100 30 -80 120 -150 210 -150 120 0 150 -140 150 -670 0 -380 20 -860 50 -1080 50 -390 40 -390 -60 -100 -90 270 -420 470 -2620 1640 -1390 740 -2790 1500 -3120 1680 l-600 340 30 1130 30 1130 1620 940 c880 520 1670 950 1740 970 100 30 130 -150 130 -750 l0 -780 -1010 -590 c-960 -560 -1000 -600 -970 -900 20 -210 80 -310 190 -300 80 10 590 270 1120 580 l970 570 0 830 c0 940 -140 1460 -380 1450 -100 0 -870 -420 -1730 -920z M19530 10700 c-290 -170 -530 -330 -530 -360 0 -60 880 420 1050 570 160 160 10 90 -520 -210z" />
          </g>
        </svg>
      </div>
      
      {/* Canvas for particles */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Visible SVG (can be removed if you only want particles) */}
      <div className="w-[1200px] h-[750px] flex items-center justify-center relative z-10 opacity-0">
        <svg 
          viewBox="0 0 3000 1880" 
          fill="white"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform="translate(0.000000,1880.000000) scale(0.100000,-0.100000)">
            <path d="M12750 15170 l-1600 -920 -30 -1330 c-10 -720 0 -1320 20 -1320 30 0 380 200 780 440 l730 450 50 -2850 50 -2860 880 -450 c480 -250 910 -420 950 -380 40 30 90 2150 100 4690 40 4420 -10 5460 -260 5460 -40 0 -790 -420 -1670 -930z m1670 -4800 c20 -2290 0 -4050 -40 -3900 -60 220 -250 370 -830 680 l-750 400 0 2920 c0 1610 -20 2930 -50 2930 -20 0 -280 -150 -570 -340 -1060 -670 -980 -690 -980 270 l0 840 1580 900 1570 900 20 -710 c20 -390 40 -2590 50 -4890z M15530 15880 c-40 -70 -90 -590 -110 -1150 -40 -970 -30 -1020 190 -1160 130 -80 1240 -690 2460 -1350 2290 -1230 2430 -1270 2430 -720 0 230 -230 370 -2400 1540 l-2400 1280 0 790 c0 430 20 790 50 790 20 0 1440 -750 3150 -1670 l3100 -1670 0 -1110 0 -1110 -1720 -1000 c-1390 -810 -1740 -1060 -1760 -1250 -20 -130 -80 -280 -140 -340 -70 -70 -80 -10 -30 200 40 170 90 720 110 1240 10 520 70 970 130 1000 130 80 180 890 50 1000 -50 50 -720 430 -1490 840 -1230 670 -1420 740 -1550 610 -130 -130 -150 -820 -150 -5040 0 -2680 30 -4910 70 -4950 70 -70 1650 820 1760 990 80 130 70 -30 100 3260 l20 2550 450 290 c250 150 480 260 510 240 20 -30 0 -170 -60 -320 -160 -420 -130 -2050 30 -2120 140 -50 3560 1890 3690 2100 50 60 70 760 50 1560 l-20 1450 -3100 1670 c-1700 920 -3150 1680 -3220 1680 -60 0 -150 -60 -200 -120z m2550 -4460 c280 -140 520 -310 520 -370 0 -50 -300 -270 -650 -480 l-650 -380 -10 -2170 c-10 -1190 -30 -2500 -50 -2910 l-30 -740 -680 -430 c-490 -310 -720 -520 -810 -760 -120 -330 -130 -320 -70 160 30 270 50 2480 50 4920 l0 4440 930 -510 c500 -270 1160 -620 1450 -770z M9790 10170 c-860 -510 -1640 -980 -1730 -1060 -130 -110 -160 -330 -150 -1200 0 -580 40 -1250 70 -1490 l70 -430 3190 -1700 c1760 -930 3230 -1660 3270 -1620 100 110 150 1920 60 2190 -50 140 -780 590 -2330 1430 -1250 670 -2280 1200 -2300 1180 -20 -20 330 -230 790 -470 450 -240 850 -480 880 -530 30 -50 100 -90 150 -90 180 -10 540 -210 540 -300 0 -50 50 -60 100 -30 60 30 100 10 100 -50 0 -120 1100 -720 1200 -660 40 30 100 -20 140 -100 30 -80 120 -150 210 -150 120 0 150 -140 150 -670 0 -380 20 -860 50 -1080 50 -390 40 -390 -60 -100 -90 270 -420 470 -2620 1640 -1390 740 -2790 1500 -3120 1680 l-600 340 30 1130 30 1130 1620 940 c880 520 1670 950 1740 970 100 30 130 -150 130 -750 l0 -780 -1010 -590 c-960 -560 -1000 -600 -970 -900 20 -210 80 -310 190 -300 80 10 590 270 1120 580 l970 570 0 830 c0 940 -140 1460 -380 1450 -100 0 -870 -420 -1730 -920z M19530 10700 c-290 -170 -530 -330 -530 -360 0 -60 880 420 1050 570 160 160 10 90 -520 -210z" />
          </g>
        </svg>
      </div>
      
      {/* GitHub attribution */}
      <div className="absolute bottom-4 text-muted/70 text-xs z-20">
        <p className="font-semibold">
          Inspired by:{' '}
          <Link
            href="https://v0.dev/chat/community/logo-particles-v0-aws-AdFqYlEFVdC" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
          >
            @v0.dev/chat/community/logo-particles
          </Link>
        </p>
      </div>
    </div>
  )
} 