<p align="center">
  <img src="./public/assets/logo-transparent.png" width="100" height="100" alt="Talli Logo" />
</p>

<p align="center">
  <img src="./public/assets/readme-hero-pure.svg?v=12" width="100%" alt="Talli Ambient Classroom Intelligence Hero Banner" />
</p>

<p align="center">
  <a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=700&size=16&duration=2800&pause=900&color=000000&center=true&vCenter=true&width=720&height=38&lines=Continuous+Modern+Greek+Speech+Recognition+(el-GR);Automated+Cyprus+Primary+Classroom+Behavior+Analytics;Greek+Vocative+Declension+Engine+(%CE%93%CE%B9%CE%AC%CE%BD%CE%BD%CE%B7%CF%82+%E2%86%92+%CE%93%CE%B9%CE%AC%CE%BD%CE%BD%CE%B7);Sub-Second+Multi-Student+Praise+%26+Correction+Parsing" alt="Typing SVG" /></a>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Framework-Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 14"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5"></a>
  <a href="https://deepgram.com"><img src="https://img.shields.io/badge/STT-Deepgram%20Nova--2%20(el--GR)-FF66A3?style=for-the-badge&logo=deepgram&logoColor=black" alt="Deepgram STT"></a>
  <a href="https://github.com/ricky0123/vad"><img src="https://img.shields.io/badge/VAD-Silero%20ONNX%20WASM-4ADE80?style=for-the-badge&logo=onnx&logoColor=black" alt="Silero VAD"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Styling-TailwindCSS%20Neobrutalism-1AC2FF?style=for-the-badge&logo=tailwindcss&logoColor=black" alt="TailwindCSS"></a>
  <a href="https://openrouter.ai"><img src="https://img.shields.io/badge/LLM-OpenRouter%20Gemini%202.5-C084FC?style=for-the-badge&logo=openai&logoColor=black" alt="OpenRouter LLM"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-FACC15?style=for-the-badge&logo=open-source-initiative&logoColor=black" alt="MIT License"></a>
</p>

---

## Executive Summary

**Talli** is an ambient classroom copilot purpose-built for primary school teachers in Cyprus across all 36 standard class sections (Grades **A'1** through **F'6**). 

In active primary classrooms, manual tablet or whiteboard point logging breaks teaching flow. Talli eliminates manual entry by **passively monitoring spoken Greek classroom dialogue**, detecting praise and correction triggers, converting spoken Greek vocatives into official roster names, and dispatching merit points in real time.

---

## Live STT & Multi-Student Parsing Console

<p align="center">
  <img src="./public/assets/readme-stt-demo.svg" width="100%" alt="Real-time STT Console Terminal Demo" />
</p>

---

## Greek Vocative Declension Engine

In Modern Greek, teachers address students using the **vocative case** rather than official nominative roster names (e.g., nominative *Γιάννης* → vocative *Γιάννη*, *Ανδρέας* → *Ανδρέα*, *Νίκος* → *Νίκο*, *Πέτρος* → *Πέτρο*, *Κώστας* → *Κώστα*). 

Talli features an automated Greek declension parser that resolves spoken vocatives back to roster student records.

<p align="center">
  <img src="./public/assets/readme-greek-vocative.svg?v=4" width="100%" alt="Greek Vocative Declension Engine Transformation Flow" />
</p>

---

## System Architecture & Processing Pipeline

<p align="center">
  <img src="./public/assets/readme-pipeline.svg" width="100%" alt="Talli End-to-End Processing Pipeline" />
</p>

### Pipeline Stages

1. **Voice Activity Slicing:** Microphone audio is continuously monitored and sliced into 4.8-second PCM buffers using `@ricky0123/vad-web` (Silero VAD in WebAssembly).
2. **Speech-to-Text Stream:** Audio buffers pass to the Deepgram Nova-2 API tuned for `el-GR` Modern Greek speech with dynamic roster keyword boosting.
3. **Accent-Insensitive Vocative Engine:** Transcripts are processed through `removeAccents` normalization and OpenRouter LLM schema parsers to resolve direct Greek vocatives.
4. **Instant Score Dispatch:** Cues exceeding the auto-approve confidence threshold (default 85%) immediately trigger point increments and confetti animations.
5. **Pending Review Queue:** Low-confidence cues are saved to an interactive review queue presented at session completion.

---

## Neobrutalist Design Tokens

<p align="center">
  <img src="./public/assets/readme-palette.svg" width="100%" alt="Neobrutalist Design System Palette" />
</p>

| Token Name | Hex Code | System Application |
| :--- | :---: | :--- |
| Hot Pink | `#FF66A3` | Primary Action Launchpads & Discipline Highlights |
| Electric Blue | `#1AC2FF` | Active Class Configuration & Student Roster Cards |
| Emerald Green | `#4ADE80` | Live Praise Events, Confetti & End Session CTA |
| Sunburst Yellow | `#FACC15` | Report Summaries & Session History Cards |
| Vibrant Purple | `#C084FC` | Voice Cue Reference Guide & Settings Header |
| Pitch Black | `#000000` | Hard 3px Outer Borders & Offset Shadows (`4px`, `8px`, `12px`) |

---

## Spoken Greek Voice Cue Specifications

| Spoken Cue Pattern | Target Roster Student | Classification | Point Delta |
| :--- | :--- | :---: | :---: |
| *"Μπράβο Ελένη, εξαιρετική απάντηση!"* | Eleni M. | Praise | `+1 PTS` |
| *"Πολύ ωραία Γιάννη!"* | Yiannis P. | Praise | `+1 PTS` |
| *"Σταμάτα Νίκο, πρόσεχε στο μάθημα!"* | Nikos L. | Discipline | `-1 PTS` |
| *"Έλα ρε Ανδρέα, ησυχία!"* | Andreas T. | Discipline | `-1 PTS` |
| *"Μπράβο Μαρία, πολύ ωραία Κώστα!"* | Maria K. &amp; Kostas S. | Multi-Praise | `+1 PTS Each` |

---

## Core Capabilities & UX Features

### Single-Pass Multi-Student Passing
Teachers frequently praise multiple students in a single utterance (e.g., *"Μπράβο Ελένη, πολύ ωραία Γιάννη!"*). Talli evaluates compound statements in a single pass, updating multiple student scores simultaneously.

### 2-Step End-of-Session Pending Review
Uncertain speech cues (< 85% confidence) are stored in a pending queue. Clicking **"End Session"** triggers a 2-step review modal:
- **Step 1:** Review pending items with individual **Approve (✓)** / **Discard (✕)** controls or bulk action shortcuts.
- **Step 2:** Final summary screen calculating overall participation rates, triggering confetti celebrations, and exporting reports.

### Non-Clattering Smart Class Switcher
The class selection bar automatically caps quick-access pills to at most **4 featured classes** (active class + top 3 enrolled classes) while providing a dropdown selector for all **36 Cyprus Primary Classes** (`Τάξη Α'1` – `Τάξη ΣΤ'6`).

---

## Technology Stack

| Component | Technology / Library |
| :--- | :--- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | TailwindCSS + Neobrutalist Utility System |
| Motion | Framer Motion + Canvas Confetti |
| Audio VAD | `@ricky0123/vad-web` (Silero VAD ONNX WASM) |
| Speech STT | Deepgram API (`nova-2` el-GR) |
| NLP Parsing | OpenRouter API (`google/gemini-2.5-flash` JSON Schema) |

---

## Getting Started

### Requirements
- Node.js `v18.x` or higher
- npm or yarn

### 1. Installation
```bash
git clone https://github.com/Qu4rk/Talli.git
cd Talli
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Execution
```bash
npm run dev
```
Navigate to `http://localhost:3000` in Google Chrome or Microsoft Edge.

---

## Repository Structure

```text
Talli/
├── public/
│   ├── assets/                 # Animated Neobrutalist SVG assets & hero graphics
│   │   ├── logo-transparent.png
│   │   ├── readme-hero.svg
│   │   ├── readme-stt-demo.svg
│   │   ├── readme-vocative.svg
│   │   ├── readme-pipeline.svg
│   │   └── readme-palette.svg
│   └── silero_vad.onnx         # ONNX WASM VAD model binaries
├── src/
│   ├── app/
│   │   ├── api/listen/         # Deepgram STT & OpenRouter intent parser endpoint
│   │   ├── classroom/          # Live classroom tracking & 2-step pending review modal
│   │   ├── reports/            # Student rewards podium & session history
│   │   ├── settings/           # Audio sensitivity, microphone hardware & model config
│   │   ├── students/           # Class roster & subcategory tag management
│   │   └── page.tsx            # Main Neobrutalist dashboard hub
│   ├── components/             # Header, SessionSetupModal & WavySlider
│   ├── context/                # AppContext & Cyprus 36-class schema
│   ├── hooks/                  # useClassroomListener VAD audio processor
│   └── lib/                    # Confetti effects & Greek accent utilities
└── README.md
```

---

## License

This software is released under the **MIT License**.
