import confetti from "canvas-confetti";
import React from "react";

/**
 * Calculates normalized (x, y) coordinates of the click event or target element relative to viewport
 */
function getEventOrigin(e?: React.MouseEvent): { x: number; y: number } {
  if (!e || !e.currentTarget) {
    return { x: 0.5, y: 0.5 };
  }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return {
    x: Math.min(0.95, Math.max(0.05, (rect.left + rect.width / 2) / window.innerWidth)),
    y: Math.min(0.95, Math.max(0.05, (rect.top + rect.height / 2) / window.innerHeight)),
  };
}

/**
 * 1st Place Gold Champion Confetti Explosion
 * Dual-stage gold starburst firing directly from the origin button
 */
export function triggerGoldConfetti(e?: React.MouseEvent) {
  const origin = getEventOrigin(e);

  // Stage 1: Energetic gold starburst from button
  confetti({
    particleCount: 140,
    spread: 110,
    startVelocity: 48,
    origin,
    colors: ["#FFD700", "#FFA500", "#FACC15", "#FFFFFF", "#FF66A3"],
    shapes: ["star", "circle"] as confetti.Shape[],
    scalar: 1.25,
    ticks: 280,
  });

  // Stage 2: Secondary cascading gold glitter shower
  setTimeout(() => {
    confetti({
      particleCount: 70,
      angle: 90,
      spread: 130,
      startVelocity: 28,
      origin: { x: origin.x, y: Math.max(0.1, origin.y - 0.08) },
      colors: ["#FFD700", "#FFF8DC", "#FACC15", "#4ADE80"],
      shapes: ["circle", "star"] as confetti.Shape[],
      gravity: 0.85,
      scalar: 0.95,
      ticks: 320,
    });
  }, 180);
}

/**
 * 2nd Place Silver Sparkle Burst
 * Crisp platinum silver & electric cyan starburst
 */
export function triggerSilverConfetti(e?: React.MouseEvent) {
  const origin = getEventOrigin(e);

  confetti({
    particleCount: 110,
    spread: 95,
    startVelocity: 42,
    origin,
    colors: ["#E2E8F0", "#1AC2FF", "#FFFFFF", "#94A3B8", "#38BDF8"],
    shapes: ["star", "circle"] as confetti.Shape[],
    scalar: 1.15,
    ticks: 240,
  });
}

/**
 * 3rd Place Bronze / Copper Burst
 * Warm copper & amber burst
 */
export function triggerBronzeConfetti(e?: React.MouseEvent) {
  const origin = getEventOrigin(e);

  confetti({
    particleCount: 95,
    spread: 90,
    startVelocity: 38,
    origin,
    colors: ["#FB923C", "#F59E0B", "#FACC15", "#FFFFFF", "#FF66A3"],
    shapes: ["circle", "square"] as confetti.Shape[],
    scalar: 1.05,
    ticks: 220,
  });
}

/**
 * Grand Class Celebration ("Celebrate All Achievers!")
 * Dual bottom side cannons crossing screen + delayed fireworks top rainfall
 */
export function triggerGrandCelebration(e?: React.MouseEvent) {
  const origin = getEventOrigin(e);

  // 1. Initial burst from button
  confetti({
    particleCount: 100,
    spread: 110,
    startVelocity: 45,
    origin,
    colors: ["#FACC15", "#1AC2FF", "#FF66A3", "#4ADE80", "#C084FC"],
    shapes: ["star", "circle"] as confetti.Shape[],
    scalar: 1.3,
  });

  // 2. Dual Side Cannons
  const defaults = {
    origin: { y: 0.85 },
    colors: ["#FACC15", "#1AC2FF", "#FF66A3", "#4ADE80", "#C084FC", "#FFFFFF"],
    shapes: ["star", "circle", "square"] as confetti.Shape[],
  };

  // Left Cannon
  confetti({
    ...defaults,
    particleCount: 90,
    angle: 60,
    spread: 70,
    startVelocity: 60,
    origin: { x: 0.05, y: 0.85 },
  });

  // Right Cannon
  confetti({
    ...defaults,
    particleCount: 90,
    angle: 120,
    spread: 70,
    startVelocity: 60,
    origin: { x: 0.95, y: 0.85 },
  });

  // 3. Delayed Fireworks Rainfall
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 120,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.2 },
      colors: ["#FFD700", "#FF66A3", "#1AC2FF", "#4ADE80"],
      shapes: ["star", "circle"] as confetti.Shape[],
      decay: 0.92,
      scalar: 1.3,
      ticks: 350,
    });
  }, 250);
}

/**
 * Mini Point Award Confetti Burst
 * Quick micro-burst for point additions
 */
export function triggerMiniPointConfetti(e?: React.MouseEvent) {
  const origin = getEventOrigin(e);

  confetti({
    particleCount: 45,
    spread: 60,
    startVelocity: 25,
    origin,
    colors: ["#4ADE80", "#FACC15", "#1AC2FF"],
    shapes: ["circle", "star"] as confetti.Shape[],
    scalar: 0.85,
    ticks: 150,
  });
}
