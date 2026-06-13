# ShiftBrain AI: Algorithmic & Somnology Decision Log

This document outlines the scientific methodology, mathematical formulas, and algorithmic design choices implemented in ShiftBrain AI to manage circadian alignment and build user trust.

---

## 1. Sleep Debt Calculation & Quality Scaling

### The Problem
Traditional sleep trackers calculate sleep debt as a simple linear subtraction:
$$\text{Baseline Need (e.g. 8.0h)} - \text{Duration Logged}$$
However, this is biologically inaccurate. Sleep *quality* (dictated by sleep architecture, architecture consistency, and daytime ambient sleep disruptions) drastically alters cognitive recovery. Eight hours of highly fragmented daytime sleep does not recover the brain as effectively as eight hours of dark, quiet night sleep.

### Our Solution
We implemented a subjective-quality scaling model to compute **Effective Sleep**:
$$\text{Effective Sleep} = \text{Logged Duration} \times \left(0.5 + \frac{\text{Subjective Quality Rating}}{20}\right)$$

*   **10/10 Quality (Optimal):** Effective sleep equals $100\%$ of logged duration.
*   **5/10 Quality (Disrupted):** Effective sleep is scaled down to $75\%$ of logged duration.
*   **1/10 Quality (Severe Insomnia):** Effective sleep is scaled down to $55\%$ of logged duration.

This effective sleep value is subtracted from the user's daily baseline (default: 8.0h) to update a rolling sleep debt balance. This matches real-world somnology: poor sleep quality actively increases the worker's cumulative fatigue debt even if the physical time in bed was high.

---

## 2. Homeostatic Sleep Pressure (Wake Timer) & The Nap Offset

### The Problem
Continuous wakefulness causes the accumulation of adenosine in the brain, creating homeostatic sleep pressure. A simple timer tracking "hours awake" is useful, but it does not account for the restorative impact of short prophylactic or anchor naps, which clear adenosine.

### Our Solution
We implemented a dynamic sleep pressure offset:
1.  We track raw hours awake from the latest logged wake timestamp.
2.  If the user checks off their recommended **Pre-Shift Anchor Nap**, the engine automatically subtracts **4.0 hours** from their active homeostatic pressure wake-time calculation.
3.  This offset dynamically shifts the warning thresholds for cognitive impairment:
    *   **17+ Net Hours Awake:** Matches a cognitive deficit equivalent to a **0.05% Blood Alcohol Concentration (BAC)** (impaired motor control and slower reactions).
    *   **20+ Net Hours Awake:** Matches a **0.10% BAC** (equivalent to legal intoxication, causing extreme microsleep risks).
    *   By checking off the nap, the wake timer decreases, delaying these critical safety thresholds and reflecting the physiological boost of a nap.

---

## 3. Algorithmic Trust: Why Should the User Follow the Plan?

### The Problem
Shift workers are frequently bombarded with generic health tips ("go to sleep at the same time every night") that are impossible to follow. To prevent user churn, the app must build immediate trust. If the app tells a worker to wear sunglasses on a bright morning drive home, they need to know *why* to overcome counter-intuitive friction.

### Our Solution
Every task card in the timeline is designed around the **"What-When-Why"** paradigm:
*   **Clear Action (What):** Minimalist headers (e.g., "Wear Sunglasses (Commute Home)").
*   **Precise Time (When):** Chronologically sorted, localized intervals.
*   **Scientific Justification (Why):** Plain-language biology:
    *   *Melatonin/Cortisol Pathways:* Explains that exposure to morning daylight (10,000+ lux) during a post-shift commute suppresses melatonin and releases cortisol. Wearing sunglasses protects the eyes, allowing melatonin to rise naturally so they can sleep during the day.
    *   *Adenosine Clearance:* Explains that caffeine has a 5-6 hour half-life. Blocking caffeine 6 hours before sleep is necessary to clear adenosine receptors and ensure deep sleep cycles.

---

## 4. Circadian Logic and Midnight-Wrapping Timelines

### The Problem
Traditional calendars (like Google or Apple Calendar) break the day at 12:00 AM midnight. For a night-shift worker whose "morning" begins at 8:00 PM and "evening" ends at 12:00 PM the next day, this midnight split divides their active cycle into two separate days, causing massive cognitive friction.

### Our Solution
ShiftBrain models schedules relative to the **Active Wake-to-Sleep Cycle** instead of the calendar date:
*   In [circadianEngine.ts](file:///c:/Users/Pranav%20Bairollu/WebProjects/ShiftBrain%20AI/src/lib/circadianEngine.ts), if the shift ends chronologically before it starts, we detect a midnight wrap and adjust dates accordingly.
*   Timeline items display relative day labels (`+1 Day`, `-1 Day`) to help users map times to their local context while keeping their daily checklist unified in a single, continuous vertical flow.

---

## 5. Somnology & Research Foundations

The algorithms and recommendations in ShiftBrain are built upon established circadian and sleep science:
1.  **Sleep Debt & Impairment:** Studies by *Dawson & Reid (1997)* and *Williamson & Feyer (2000)* established that 17-19 hours of continuous wakefulness produces cognitive degradation equivalent to a BAC of 0.05%, and 20-24 hours matches 0.10% BAC.
2.  **Light and Melatonin Suppression:** Research on the intrinsically photosensitive retinal ganglion cells (ipRGCs) shows they are highly sensitive to blue light (460-480nm). Shielding eyes from morning light is proven to mitigate daytime sleep onset insomnia.
3.  **Prophylactic Naps:** Clinical trials on emergency medicine residents and aviation pilots confirm that a pre-shift anchor nap of 30-40 minutes significantly reduces lapses in attention during overnight duties.
