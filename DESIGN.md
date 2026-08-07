# Talli — Design & Technical System Specification

## 🎨 Visual Identity & Aesthetic World

* **Design Aesthetic:** Youthful, Playful **Neobrutalist Deep Ocean** with handwritten marker typography and vibrant pop accents.
* **Primary Theme:** White Crumpled Paper Theme (`#faf9f6` crumpled notebook paper canvas with stop-motion frame stepping) featuring high-contrast text (`text-black`), vibrant neobrutalist pop accent cards, and thick black borders (`border-[3px] border-black`).
* **Colorway Tokens:**
  * **Electric Cyan:** `#1ac2ff` (Classroom / Hardware Cards)
  * **Magenta / Pop Pink:** `#ff66a3` (Launchpad / Attention Cards)
  * **Vibrant Gold:** `#facc15` (1st Place Gold Podium / Profile Cards / Header Avatar)
  * **Emerald Green:** `#4ade80` (Primary Actions / +1 & +2 Points / Boosts)
  * **Neon Purple:** `#c084fc` (Settings Header / Modals)
  * **Bronze / Silver:** `#fb923c` / `#e2e8f0` (2nd & 3rd Place Podiums)
* **Typography System:**
  * **Logo & Handwritten Brand Accent:** `Permanent_Marker` (Google Font via `next/font/google`) rendered with `rotate-[-2deg]` tilt for the "Talli" header logo.
  * **Body & UI:** Inter / Geist Sans with ultra-bold headings (`font-black tracking-tighter`).

---

## ⚡ Background Engine: Stop-Motion White Crumpled Paper Canvas

* **Component:** `<NotebookBackground />` (`src/components/backgrounds/NotebookBackground.tsx`).
* **Engine:** Mounted universally in `src/app/layout.tsx`. High-performance Stop-Motion HTML5 Canvas rendering:
  * **Texture Assets:** Preloaded white crumpled paper texture frames (`crumpled-paper-1.jpg`, `crumpled-paper-2.jpg`, `crumpled-paper-3.jpg`).
  * **Stop-Motion Frame Rate:** Swaps paper texture frames at 5.5 FPS (~180ms) with discrete flip/offset transforms to create a tactile stop-motion paper effect.
  * **Hand-Drawn Vector Sketch Doodles:** Procedurally stroke-rendered pencil/marker sketches (stars, lightbulbs, paper airplanes, hearts, lightning bolts, checkmarks, music notes, smileys, and wooden pencils) plus handwritten math formulas (`E=mc²`, `a²+b²=c²`, `π`, `∑`, `√x`, `Δt`, `f(x)`, `∞`, `∫`), completely replacing generic system color emojis.
  * **Ruled Grid & Margin:** Subtle cyan & pink grid lines with a red pencil margin line.
  * **Interactive Physics & Mouse Sparks:** Mouse repulsion pushes doodles; mouse movement spawns multi-colored ink/pencil particle trails (`✦`, `★`, `✨`).

---

## 🗂️ App Architecture & Routes

1. **Hub Launchpad (`/`):**
   * Centered launchpad with Good Morning greeting, active classroom launcher, and schedule card.
2. **Classroom Live Tracking (`/classroom`):**
   * **Zone A (70%):** Interactive student grid. Student cards feature initials, IDs, tabular scores, hover controls (`+1`, `-1`), un-clipped floating badges, and **2.0-second auto-fading** green/red glow outlines.
   * **Zone B (30%):** Real-time AI detection activity feed and pending interaction queue (`Approve` / `Dismiss` / keyboard `Enter`/`Escape`).
   * **Zone C (Top):** Active class switcher, live VAD toggle (`Spacebar`), and navigation shortcuts.
3. **Student Roster Management (`/students`):**
   * Full student roster, tag filtering (`Top Speaker`, `Engaged`, `Science Whiz`), student search, point editing, and **Add Student Modal**.
4. **Student Rewards & Behavioral Reports (`/reports`):**
   * **Top 3 Achievers Podium (Gold 🥇, Silver 🥈, Bronze 🥉):** Features **"Celebrate 1st Place! 🎉"** buttons triggering multi-colored `canvas-confetti` particle explosions.
   * **Teacher Focus Group:** Displays lowest-scoring students needing support with a **"+2 Encouragement Boost"** button.
   * **Session History:** Historical session table with CSV download exporter (`.csv`).
5. **Settings & Hardware Controls (`/settings`):**
   * Microphone device selection, interactive VAD voice meter test animation, teacher display name, and **3 Custom SVG Wavy Path Range Sliders** (`WavySlider.tsx`).

---

## 🔒 Shared Global State (`src/context/AppContext.tsx`)

* `activeClass`: Active class selection (`4a`, `5b`).
* `students`: Live array of students synced across all pages.
* `updateStudentScore(id, delta, eventText)`: Updates score, sets `recentEvent`, and executes a `2000ms` `setTimeout` to automatically clear `recentEvent` (triggering Framer Motion smooth fade-out).
* `reports`: Session history records.
* `settings`: Mic selection, AI confidence thresholds, VAD sensitivity.

---

## 🚀 Dev Server Stability Guidelines

1. **Dev Server Port:** Runs on **Port 3000** (`npm run dev`).
2. **Cache Protection:** Avoid running `npm run build` while `npm run dev` is active in background tasks to prevent `.next` cache mismatch (`404` for CSS chunks). If build is executed, restart `npm run dev` fresh (`npx kill-port 3000 3001 3002 && rm -rf .next && npm run dev`).
