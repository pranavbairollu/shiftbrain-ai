export interface ParsedShift {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  shift_name: string;
  commute_mins?: number; // Optional commute transit duration
}

export interface SurvivalItem {
  id: string;
  type: "sleep" | "caffeine" | "focus" | "shift" | "light" | "wake";
  time_display: string;
  time_sort: Date;
  title: string;
  description: string;
  tag?: string;
}

/**
 * Parses a time string (HH:MM) and date string (YYYY-MM-DD) into a native Date object.
 */
function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  // Using local time to avoid timezone offset issues during rendering
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Formats a Date object into a readable time string (e.g., 08:30 AM or 10:00 PM).
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Calculates a survival checklist based on a parsed shift.
 */
export function generateSurvivalPlan(shift: ParsedShift): SurvivalItem[] {
  const items: SurvivalItem[] = [];
  
  const shiftStart = parseDateTime(shift.date, shift.start_time);
  let shiftEnd = parseDateTime(shift.date, shift.end_time);
  const commuteMins = shift.commute_mins ?? 60; // Default to 60 mins commute
  
  // If end time is chronologically before start time, it means the shift crosses midnight
  if (shiftEnd < shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  const startHour = shiftStart.getHours();

  // Determine Shift Type
  // Night shift starts between 5 PM (17:00) and 4 AM (04:00), or ends after midnight
  const isNightShift = startHour >= 17 || startHour < 4;
  // Evening shift starts between 12 PM (12:00) and 5 PM (17:00)
  const isEveningShift = startHour >= 12 && startHour < 17;
  
  // 1. Add the Work Shift itself
  items.push({
    id: `shift-${shift.date}`,
    type: "shift",
    time_display: `${formatTime(shiftStart)} - ${formatTime(shiftEnd)}`,
    time_sort: shiftStart,
    title: shift.shift_name || "Work Shift",
    description: "Stay hydrated and take micro-breaks. Stand up and stretch every 90 minutes if you are at a desk.",
    tag: "Work Hours",
  });

  if (isNightShift) {
    // NIGHT SHIFT PROTOCOLS (e.g. 10 PM - 7 AM)

    // Commute Home (Wear Blue Blockers)
    const commuteStart = new Date(shiftEnd);
    const commuteEnd = new Date(shiftEnd);
    commuteEnd.setMinutes(commuteEnd.getMinutes() + commuteMins);
    items.push({
      id: `commute-home-${shift.date}`,
      type: "light",
      time_display: `${formatTime(commuteStart)} - ${formatTime(commuteEnd)}`,
      time_sort: commuteStart,
      title: "Wear Sunglasses / Blue Blockers (Commute Home)",
      description: `Put on dark sunglasses or orange blue-blocker glasses during your ${commuteMins}-minute commute home. Minimize exposure to bright morning sunlight to protect your melatonin levels.`,
      tag: "Circadian Protection",
    });

    // Core Sleep Window (commute duration + 30 mins wind down post-shift)
    const sleepStart = new Date(shiftEnd);
    sleepStart.setMinutes(sleepStart.getMinutes() + commuteMins + 30);
    const sleepEnd = new Date(sleepStart);
    sleepEnd.setHours(sleepEnd.getHours() + 7); // 7 hours core sleep

    items.push({
      id: `sleep-${shift.date}`,
      type: "sleep",
      time_display: `${formatTime(sleepStart)} - ${formatTime(sleepEnd)}`,
      time_sort: sleepStart,
      title: "Core Sleep Window",
      description: "Sleep in a pitch-black room. Use high-quality eye masks, earplugs, white noise, and keep the room cool (below 20°C).",
      tag: "Biological Recovery",
    });

    // Wake up & light seek
    const wakeStart = new Date(sleepEnd);
    const wakeEnd = new Date(sleepEnd);
    wakeEnd.setMinutes(wakeEnd.getMinutes() + 30);
    items.push({
      id: `wake-${shift.date}`,
      type: "wake",
      time_display: formatTime(wakeStart),
      time_sort: wakeStart,
      title: "Wake & Seek Bright Light",
      description: "Expose yourself to bright sunlight or a 10,000-lux light box for 15-30 minutes immediately. This resets your circadian clock and eliminates morning grogginess.",
      tag: "Circadian Reset",
    });

    // Study Block (1.5 hours post-wake, when cognitive capacity is high)
    const studyStart = new Date(sleepEnd);
    studyStart.setHours(studyStart.getHours() + 1);
    studyStart.setMinutes(studyStart.getMinutes() + 30);
    const studyEnd = new Date(studyStart);
    studyEnd.setMinutes(studyEnd.getMinutes() + 45); // 45-minute sprint

    items.push({
      id: `study-${shift.date}`,
      type: "focus",
      time_display: `${formatTime(studyStart)} - ${formatTime(studyEnd)}`,
      time_sort: studyStart,
      title: "Software Dev Focus Block",
      description: "Your cognitive resources are at their peak. Spend this 45-minute focus window studying software engineering (e.g., React, TypeScript, or Python) now before you get tired.",
      tag: "Upskilling Block",
    });

    // Caffeine Cutoff (6 hours before the next day's sleep window)
    const caffeineCutoff = new Date(sleepStart);
    caffeineCutoff.setHours(caffeineCutoff.getHours() - 6);
    items.push({
      id: `caffeine-${shift.date}`,
      type: "caffeine",
      time_display: formatTime(caffeineCutoff),
      time_sort: caffeineCutoff,
      title: "Caffeine Cutoff Milestone",
      description: "No more coffee, tea, energy drinks, or sweet chai. Switch to water or decaf options to protect your upcoming sleep quality.",
      tag: "Caffeine Cutoff",
    });

    // Optional Anchor Nap (1 hour prior to night shift)
    const napStart = new Date(shiftStart);
    napStart.setHours(napStart.getHours() - 2.5); // e.g. 7:30 PM if shift starts at 10 PM
    const napEnd = new Date(napStart);
    napEnd.setHours(napEnd.getHours() + 1); // 1 hour nap

    items.push({
      id: `nap-${shift.date}`,
      type: "sleep",
      time_display: `${formatTime(napStart)} - ${formatTime(napEnd)}`,
      time_sort: napStart,
      title: "Pre-Shift Anchor Nap",
      description: "Take a 45-60 minute nap to bank alertness before your night shift commences. Wake up with a splash of cold water.",
      tag: "Energy Banking",
    });

    // Commute to Work (Seek Bright Light / Alertness)
    const commuteToWorkStart = new Date(shiftStart);
    commuteToWorkStart.setMinutes(commuteToWorkStart.getMinutes() - commuteMins);
    const commuteToWorkEnd = new Date(shiftStart);
    items.push({
      id: `commute-work-${shift.date}`,
      type: "light",
      time_display: `${formatTime(commuteToWorkStart)} - ${formatTime(commuteToWorkEnd)}`,
      time_sort: commuteToWorkStart,
      title: "Commute to Work (Alertness)",
      description: `Leave home at ${formatTime(commuteToWorkStart)}. Expose yourself to bright light (natural sunlight or bright cab lighting) during your commute to maximize alertness before starting your shift.`,
      tag: "Transit Alertness",
    });

  } else if (isEveningShift) {
    // EVENING SHIFT PROTOCOLS (e.g. 2 PM - 11 PM)

    // Sleep Window
    const sleepStart = new Date(shiftEnd);
    sleepStart.setHours(sleepStart.getHours() + 2); // Sleep at 1 AM if shift ends at 11 PM
    const sleepEnd = new Date(sleepStart);
    sleepEnd.setHours(sleepEnd.getHours() + 7);
    sleepEnd.setMinutes(sleepEnd.getMinutes() + 30); // 7.5 hours sleep (waking at 8:30 AM)

    items.push({
      id: `sleep-${shift.date}`,
      type: "sleep",
      time_display: `${formatTime(sleepStart)} - ${formatTime(sleepEnd)}`,
      time_sort: sleepStart,
      title: "Night Sleep Window",
      description: "Standard night-to-morning sleep. Keep room dark, cold, and quiet.",
      tag: "Biological Recovery",
    });

    // Wake Up & Light
    const wakeStart = new Date(sleepEnd);
    items.push({
      id: `wake-${shift.date}`,
      type: "wake",
      time_display: formatTime(wakeStart),
      time_sort: wakeStart,
      title: "Wake & Seek Sunlight",
      description: "Walk outdoors or sit by a window immediately for 15 minutes of natural sunlight to anchor your daytime rhythm.",
      tag: "Circadian Reset",
    });

    // Focus Block (Morning peak energy)
    const studyStart = new Date(sleepEnd);
    studyStart.setHours(studyStart.getHours() + 1); // Study at 9:30 AM
    const studyEnd = new Date(studyStart);
    studyEnd.setMinutes(studyEnd.getMinutes() + 45);

    items.push({
      id: `study-${shift.date}`,
      type: "focus",
      time_display: `${formatTime(studyStart)} - ${formatTime(studyEnd)}`,
      time_sort: studyStart,
      title: "Software Dev Focus Block",
      description: "Your brain is fresh and rested. Study coding concepts or build your side-projects now before your shift starts.",
      tag: "Upskilling Block",
    });

    // Caffeine Cutoff (6 hours before sleep: 1 AM sleep -> Cutoff at 7 PM)
    const caffeineCutoff = new Date(sleepStart);
    caffeineCutoff.setHours(caffeineCutoff.getHours() - 6);

    items.push({
      id: `caffeine-${shift.date}`,
      type: "caffeine",
      time_display: formatTime(caffeineCutoff),
      time_sort: caffeineCutoff,
      title: "Caffeine Cutoff Milestone",
      description: "No coffee or soda after this hour. Switch to herbal tea or caffeine-free alternatives to prepare for sleep.",
      tag: "Caffeine Cutoff",
    });

  } else {
    // STANDARD DAY SHIFT PROTOCOLS (e.g. 8 AM - 5 PM)

    // Sleep Window
    const sleepStart = new Date(shiftStart);
    sleepStart.setDate(sleepStart.getDate() - 1); // Sleep night before
    sleepStart.setHours(22); // 10:00 PM sleep start
    sleepStart.setMinutes(30);
    const sleepEnd = new Date(shiftStart);
    sleepEnd.setHours(6); // 6:30 AM wake
    sleepEnd.setMinutes(30);

    items.push({
      id: `sleep-${shift.date}`,
      type: "sleep",
      time_display: `${formatTime(sleepStart)} - ${formatTime(sleepEnd)}`,
      time_sort: sleepStart,
      title: "Standard Night Sleep",
      description: "Protect your baseline sleep window to ensure cognitive readiness for your day shift.",
      tag: "Biological Recovery",
    });

    // Study Block (Evening post-work)
    const studyStart = new Date(shiftEnd);
    studyStart.setHours(studyStart.getHours() + 1); // Study at 6:00 PM
    const studyEnd = new Date(studyStart);
    studyEnd.setMinutes(studyEnd.getMinutes() + 45);

    items.push({
      id: `study-${shift.date}`,
      type: "focus",
      time_display: `${formatTime(studyStart)} - ${formatTime(studyEnd)}`,
      time_sort: studyStart,
      title: "Software Dev Focus Block",
      description: "Spend 45 minutes coding now before you relax for the evening. Keep your progression streak active.",
      tag: "Upskilling Block",
    });

    // Caffeine Cutoff (6 hours before 10:30 PM sleep -> Cutoff at 4:30 PM)
    const caffeineCutoff = new Date(sleepStart);
    caffeineCutoff.setHours(caffeineCutoff.getHours() - 6);

    items.push({
      id: `caffeine-${shift.date}`,
      type: "caffeine",
      time_display: formatTime(caffeineCutoff),
      time_sort: caffeineCutoff,
      title: "Caffeine Cutoff Milestone",
      description: "Avoid post-lunch caffeine to prevent disruption of your night sleep cycles.",
      tag: "Caffeine Cutoff",
    });
  }

  // Sort survival checklist chronologically
  return items.sort((a, b) => a.time_sort.getTime() - b.time_sort.getTime());
}
