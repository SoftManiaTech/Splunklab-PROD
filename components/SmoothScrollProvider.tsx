"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import Lenis from "@studio-freight/lenis"

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null) // Ref to observe content changes

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth ease
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // MutationObserver to detect DOM changes and refresh Lenis
    const observer = new MutationObserver(() => {
      lenis.resize() // Recalculate scrollable height
    })

    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true, // Observe direct children additions/removals
        subtree: true, // Observe all descendants
        attributes: true, // Observe attribute changes (e.g., style, class)
        characterData: true, // Observe text content changes
      })
    }

    return () => {
      lenis.destroy()
      observer.disconnect() // Clean up observer
    }
  }, [])

  return <div ref={contentRef}>{children}</div>
}
