# ShiftBrain: The Shift Worker Survival Companion

ShiftBrain is a mobile-first, circadian-adaptation web application designed to help night-shift and rotational workers manage their sleep, caffeine, upskilling focus blocks, and light exposure. 

Designed around **Duolingo-like clarity, Notion cleanliness, and Apple Health calm**, ShiftBrain prioritizes action over metrics, passing the **5-second test** to guide fatigued workers with a single tap.

---

## 🌟 Core Features

1.  **Next Best Action Hero:** A prominent card at the top of the dashboard prompting the user with exactly *what* to do right now, *when* to do it, and *why* it matters biologically.
2.  **Multimodal OCR Roster Scanner:** Drag-and-drop or take a screenshot of your work shift portal (Excel sheet, Kronos table, or WhatsApp image). Gemini AI instantly parses dates and times to build your plan.
3.  **Upcoming Timeline (Concept B):** A truncated, clean vertical timeline displaying only the next 3 steps in the day to minimize cognitive clutter. Full 24h timelines can be expanded with a single tap.
4.  **Caring Safety Alerts:** Factual, Apple-style wellness notices that warn users when they have exceeded safe continuous wake limits (17h and 20h thresholds).
5.  **Interactive Onboarding Flow:** A simple 3-step setup flow to collect sleep goals, average commute times, and establish baseline schedules.
6.  **Telemetry & Controls Footer:** A clean bottom panel displaying calculated sleep debt, wake timers, sleep logs, and manual schedule adjustments.
7.  **Push Notification Simulator:** Test simulated Apple Health-style alerts for caffeine cutoffs, anchor naps, and blue-blocker glasses.

---

## 🛠️ Technology Stack
*   **Core Framework:** Next.js (App Router, React 19, TypeScript)
*   **Styling:** Tailwind CSS v4 & PostCSS (Custom warm Sand & Sage palette)
*   **AI Integration:** `@google/generative-ai` (Gemini 2.5 Flash & 3.5 Flash)
*   **Icons:** Lucide React
*   **Database Foundations:** Supabase & PostgreSQL (Schema defined in `schema.sql`)

---

## 🚀 Local Quick-Start Guide

### Step 1: Clone & Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### Step 2: Set Up Environment Variables
Create a `.env.local` file in the root of the project:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
```
*(Get a free API key from [Google AI Studio](https://aistudio.google.com/))*

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your device or in browser mobile simulator mode.

---

## 🧠 Problem-Solving & Decisions Log
We encountered and solved several complex circadian-math and LLM-parsing bugs during development:
*   **Midnight-wrapping schedules**
*   **Nap and commute overlap resolution**
*   **Gemini 503 Service Overloads**
*   **Markdown JSON wrapping crashes**

Read the complete guide on how we tackled each problem in [PROBLEM_SOLVING.md](file:///c:/Users/Pranav%20Bairollu/WebProjects/ShiftBrain%20AI/PROBLEM_SOLVING.md).

---

## 📜 Database Foundation
The production-ready database schema is located in [schema.sql](file:///c:/Users/Pranav%20Bairollu/WebProjects/ShiftBrain%20AI/schema.sql). Simply run these queries in your Supabase SQL editor to launch the tables and indices.
