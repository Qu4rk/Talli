"use client";

import React from "react";

interface WavySliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  color?: string;
  wavePattern?: number;
}

export default function WavySlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  color = "#1ac2ff",
  wavePattern = 1,
}: WavySliderProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // 3 Distinct Wavy Paths for variety
  const paths = [
    "M 0 12 Q 6.25 3, 12.5 12 T 25 12 T 37.5 12 T 50 12 T 62.5 12 T 75 12 T 87.5 12 T 100 12",
    "M 0 12 Q 8.33 1, 16.66 12 T 33.33 12 T 50 12 T 66.66 12 T 83.33 12 T 100 12",
    "M 0 12 Q 5 20, 10 12 T 20 12 T 30 12 T 40 12 T 50 12 T 60 12 T 70 12 T 80 12 T 90 12 T 100 12",
  ];

  const currentPath = paths[(wavePattern - 1) % paths.length];

  return (
    <div className="relative w-full max-w-md py-6 px-4 select-none">
      {/* SVG Wavy Track */}
      <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
        {/* Background Track Line */}
        <path
          d={currentPath}
          fill="none"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Active Colored Filled Track */}
        <path
          d={currentPath}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - percentage}
        />
      </svg>

      {/* Hidden Native Input range overlay */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
      />

      {/* Floating Neobrutalist Circle Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-[3px] border-black shadow-[3px_3px_0_0_#000000] pointer-events-none transition-transform active:scale-110 z-20 flex items-center justify-center"
        style={{ left: `calc(${percentage}% + ${(0.5 - percentage / 100) * 16}px)`, backgroundColor: color }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-black" />
      </div>
    </div>
  );
}
