# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 14+ (React / TypeScript), Tailwind CSS, Framer Motion, and Supabase (PostgreSQL). Audio & AI Pipeline: Web Audio API with `@ricky0123/vad-react`, Deepgram Nova-2 / OpenAI Whisper, and OpenAI `gpt-4o-mini`.

## Users

Primary and secondary school teachers operating in bilingual or multilingual classroom environments (such as in Cyprus).

**The Situation:** Live classroom instruction. The teacher is standing, walking around the room, facilitating group discussions, or writing on a whiteboard—far away from a desk, keyboard, or mouse.

**Job to Be Done:** Actively manage classroom behavior, track student participation, and reinforce positive habits in real time without breaking teaching flow or requiring manual screen interaction.

## Product Purpose

Hands-free, ambient classroom tracking. Teachers teach naturally; Talli listens in the background and silently tallies merit or penalty points in real time.

## Positioning

Unlike traditional tools (e.g., ClassDojo) that require continuous tapping, clicking, or typing, Talli uses an ambient audio processing pipeline (Client VAD ⟶ Streaming STT ⟶ LLM Intent Parsing). It passively detects spoken student name cues and behavioral context in natural dialogue, applying points automatically with zero manual effort.

## Operating Context

Live classrooms. The app runs as a web app on the teacher's PC. The teacher is moving around the room, 2–3 meters away from the screen, and speaking in a natural flow.

## Capabilities and Constraints

*   **Privacy Strictness:** EU GDPR & AI Act Compliance (Streaming audio chunks are processed strictly in RAM; raw audio files are never written to disk or stored on servers).
*   **Design & UI:** High glanceability from 2–3 meters away, requiring large typography and high-contrast numerical indicators.
*   **Interactivity:** Optimized for standard PC web interactions while ensuring remote legibility.
*   **Motion:** Ambient micro-animations on score changes using Framer Motion.

## Brand Commitments

*   **Non-Punitive Color System:** Soft emerald green for point additions; warm amber/ochre (instead of harsh red) for deductions to prevent demotivating students.
*   **Logo:** Existing logo must be integrated into the navigation bar, branding components, and app favicon.

## Evidence on Hand

*   **Logo Asset:** `/Users/eliasliasides/Downloads/Talli Classroom Pulse Icon.png`

## Product Principles

1.  **Zero-Friction Instruction:** The tool must never require the teacher to break their natural teaching flow to interact with a screen.
2.  **Ambient but Legible:** UI must communicate state clearly from a distance (2-3 meters) without being distracting.
3.  **Encouragement over Punishment:** Interactions and visuals should reinforce positive habits; deductions should feel corrective rather than harsh.
4.  **Privacy by Default:** No audio data is ever retained; processing is strictly ephemeral.

## Accessibility & Inclusion

High contrast numerical indicators and large typography designed specifically for legibility across a classroom from a teacher's PC screen.
