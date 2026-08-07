"use client";

import React, { useEffect, useRef } from "react";

export interface NotebookBackgroundProps {
  speed?: number;          // Default: 1
  density?: number;        // Default: 1
  scribbliness?: number;   // Default: 1
  particleScale?: number;  // Default: 1
  interactive?: boolean;   // Default: true
}

type SketchKind =
  | "math"
  | "sketch-star"
  | "sketch-bulb"
  | "sketch-plane"
  | "sketch-heart"
  | "sketch-bolt"
  | "sketch-check"
  | "sketch-note"
  | "sketch-smiley"
  | "sketch-pencil";

interface DoodleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  kind: SketchKind;
  text?: string;
  rotation: number;
  vRot: number;
  alpha: number;
  color: string;
}

interface MouseSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  kind: "cross" | "dot" | "star";
}

const PAPER_TEXTURES = [
  "/assets/crumpled-paper-1.jpg",
  "/assets/crumpled-paper-2.jpg",
  "/assets/crumpled-paper-3.jpg",
];

// Draw authentic hand-drawn vector sketch doodles
function drawSketchDoodle(
  ctx: CanvasRenderingContext2D,
  kind: SketchKind,
  size: number,
  color: string,
  alpha: number,
  text?: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.8, size / 9);
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "math" && text) {
    ctx.font = `900 ${size}px 'Courier New', monospace, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
  } else if (kind === "sketch-star") {
    const points: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      points.push([Math.cos(angle) * (size * 0.65), Math.sin(angle) * (size * 0.65)]);
    }
    points.push(points[0]);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
  } else if (kind === "sketch-bulb") {
    const r = size * 0.45;
    ctx.beginPath();
    ctx.arc(0, -size * 0.15, r, 0.25 * Math.PI, 0.75 * Math.PI, true);
    ctx.lineTo(-r * 0.4, size * 0.35);
    ctx.lineTo(r * 0.4, size * 0.35);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-r * 0.35, size * 0.35);
    ctx.lineTo(r * 0.35, size * 0.35);
    ctx.moveTo(-r * 0.25, size * 0.48);
    ctx.lineTo(r * 0.25, size * 0.48);
    ctx.stroke();

    // Filament loop
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -size * 0.05);
    ctx.lineTo(0, -size * 0.35);
    ctx.lineTo(r * 0.25, -size * 0.05);
    ctx.stroke();

    // Ray sparks
    [-0.75 * Math.PI, -0.5 * Math.PI, -0.25 * Math.PI].forEach((angle) => {
      const x1 = Math.cos(angle) * (r + 3);
      const y1 = -size * 0.15 + Math.sin(angle) * (r + 3);
      const x2 = Math.cos(angle) * (r + 9);
      const y2 = -size * 0.15 + Math.sin(angle) * (r + 9);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  } else if (kind === "sketch-plane") {
    const s = size * 0.65;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s, -s * 0.6);
    ctx.lineTo(-s * 0.3, 0);
    ctx.lineTo(-s, s * 0.6);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.3, 0);
    ctx.stroke();
  } else if (kind === "sketch-heart") {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.8);
    ctx.bezierCurveTo(-s * 1.3, s * 0.1, -s * 1.3, -s * 0.9, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 1.3, -s * 0.9, s * 1.3, s * 0.1, 0, s * 0.8);
    ctx.stroke();
  } else if (kind === "sketch-bolt") {
    const s = size * 0.55;
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s);
    ctx.lineTo(-s * 0.4, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(-s * 0.2, s);
    ctx.lineTo(s * 0.4, -s * 0.1);
    ctx.lineTo(0, -s * 0.1);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === "sketch-check") {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, 0);
    ctx.lineTo(-s * 0.2, s * 0.6);
    ctx.lineTo(s * 0.8, -s * 0.7);
    ctx.stroke();
  } else if (kind === "sketch-note") {
    const s = size * 0.45;
    ctx.beginPath();
    ctx.arc(-s * 0.4, s * 0.4, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.4, s * 0.2, s * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-s * 0.15, s * 0.4);
    ctx.lineTo(-s * 0.15, -s * 0.5);
    ctx.lineTo(s * 0.65, -s * 0.7);
    ctx.lineTo(s * 0.65, s * 0.2);
    ctx.stroke();
  } else if (kind === "sketch-smiley") {
    const r = size * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    // Eyes
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.2, r * 0.08, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.2, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Smile
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else if (kind === "sketch-pencil") {
    const s = size * 0.55;
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.3);
    ctx.lineTo(s * 0.4, -s * 0.3);
    ctx.lineTo(s * 0.9, 0);
    ctx.lineTo(s * 0.4, s * 0.3);
    ctx.lineTo(-s, s * 0.3);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-s * 0.6, -s * 0.3);
    ctx.lineTo(-s * 0.6, s * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

export function NotebookBackground({
  speed = 1,
  density = 1,
  scribbliness = 1,
  particleScale = 1.2,
  interactive = true,
}: NotebookBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);

    // Preload White Crumpled Paper Textures for Stop Motion
    const loadedImages: HTMLImageElement[] = [];
    PAPER_TEXTURES.forEach((src) => {
      const img = new Image();
      img.src = src;
      loadedImages.push(img);
    });

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    const sparks: MouseSpark[] = [];
    const colors = [
      "#0f172a", // Charcoal Black Ink
      "#0284c7", // Electric Cyan Ink
      "#ec4899", // Magenta Pink Ink
      "#eab308", // Sunshine Gold Marker
      "#16a34a", // Emerald Green Marker
      "#9333ea", // Purple Ink
      "#ea580c", // Vibrant Orange Marker
    ];

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };

      if (Math.random() > 0.3) {
        const kinds: ("cross" | "dot" | "star")[] = ["cross", "dot", "star"];
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3 - 1,
          size: 8 + Math.random() * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          kind: kinds[Math.floor(Math.random() * kinds.length)],
        });
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Handwritten Math Formulas & Authentic Vector Sketch Types
    const mathFormulas = ["E=mc²", "a²+b²=c²", "π", "∑", "√x", "Δt", "f(x)", "∞", "∫", "x+y=z", "100%", "A+", "÷", "×", "="];
    const sketchKinds: SketchKind[] = [
      "sketch-star",
      "sketch-bulb",
      "sketch-plane",
      "sketch-heart",
      "sketch-bolt",
      "sketch-check",
      "sketch-note",
      "sketch-smiley",
      "sketch-pencil",
    ];

    // Initialize Doodle Particles
    const particleCount = Math.floor(65 * density);
    const particles: DoodleParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isMath = Math.random() > 0.45;
      const kind = isMath ? "math" : sketchKinds[Math.floor(Math.random() * sketchKinds.length)];
      const text = isMath ? mathFormulas[Math.floor(Math.random() * mathFormulas.length)] : undefined;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4 * speed,
        vy: (Math.random() - 0.5) * 0.4 * speed,
        size: (18 + Math.random() * 22) * particleScale,
        kind,
        text,
        rotation: (Math.random() - 0.5) * 0.5,
        vRot: (Math.random() - 0.5) * 0.015 * scribbliness,
        alpha: 0.7 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Stop Motion Timing State
    let lastStepTime = 0;
    let currentFrameIndex = 0;

    // Animation Loop
    let time = 0;
    const render = (timestamp: number) => {
      time += 0.015 * speed;

      // Stop-Motion Paper Texture Frame Swap (Every ~200ms = 5 FPS stop-motion rate)
      if (timestamp - lastStepTime > 200) {
        lastStepTime = timestamp;
        currentFrameIndex = (currentFrameIndex + 1) % PAPER_TEXTURES.length;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Base White Paper Background
      ctx.fillStyle = "#faf9f6";
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Active Stop-Motion White Crumpled Paper Texture Frame
      const activeImg = loadedImages[currentFrameIndex];
      if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.drawImage(activeImg, 0, 0, width, height);
        ctx.restore();
      }

      // 3. Draw Notebook Grid Lines on Paper
      const gridSize = 40;
      ctx.lineWidth = 1;

      // Vertical Grid Lines (Cyan Tint)
      ctx.strokeStyle = "rgba(2, 132, 199, 0.12)";
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal Grid Lines (Pink Tint)
      ctx.strokeStyle = "rgba(236, 72, 153, 0.12)";
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 4. Red Notebook Margin Line (Vibrant Coral/Red Pencil)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(244, 63, 94, 0.65)";
      ctx.beginPath();
      ctx.moveTo(84, 0);
      ctx.lineTo(84, height);
      ctx.stroke();

      // 5. Update & Render Hand-Drawn Vector Sketch Doodles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Smooth organic hand-drawn wobble
        const organicWobble = Math.sin(time * 2 + idx * 1.5) * 0.04 * scribbliness;
        const currentRotation = p.rotation + organicWobble;

        // Wrap around screen
        if (p.x < -60) p.x = width + 60;
        if (p.x > width + 60) p.x = -60;
        if (p.y < -60) p.y = height + 60;
        if (p.y > height + 60) p.y = -60;

        // Mouse Repulsion
        if (interactive && mouseRef.current.active) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 160;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 4;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Draw Hand-Drawn Sketch / Math
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(currentRotation);

        drawSketchDoodle(ctx, p.kind, p.size, p.color, p.alpha, p.text);
        ctx.restore();
      });

      // 6. Render Hand-Drawn Mouse Trail Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.03;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;

        if (s.kind === "dot") {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.kind === "cross") {
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(s.x - s.size * 0.4, s.y);
          ctx.lineTo(s.x + s.size * 0.4, s.y);
          ctx.moveTo(s.x, s.y - s.size * 0.4);
          ctx.lineTo(s.x, s.y + s.size * 0.4);
          ctx.stroke();
        } else {
          ctx.lineWidth = 1.5;
          ctx.translate(s.x, s.y);
          drawSketchDoodle(ctx, "sketch-star", s.size * 0.8, s.color, s.alpha);
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [speed, density, scribbliness, particleScale, interactive]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
