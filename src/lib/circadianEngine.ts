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
  relative_day?: string;
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
  
  // Helper to determine relative day string
  const getRelativeDayLabel = (targetDate: Date, refDate: Date): string => {
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const refDay = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const diffTime = targetDay.getTime() - refDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "";
    if (diffDays === 1) return "+1 Day";
    if (diffDays === -1) return "-1 Day";
    return `${diffDays > 0 ? "+" : ""}${diffDays} Days`;
  };

  // 1. Add the Work Shift itself
  items.push({
    id: `shift-${shift.date}`,
    type: "shift",
    time_display: `${formatTime(shiftStart)} - ${formatTime(shiftEnd)}`,
    time_sort: shiftStart,
    title: shift.shift_name || "Work Shift",
    description: "Stay hydrated and take micro-breaks. Stand up and stretch every 90 minutes if you are at a desk.",
    tag: "Work Hours",
    relative_day: getRelativeDayLabel(shiftStart, shiftStart),
  });

  if (isNightShift) {
    // NIGHT SHIFT PROTOCOLS (e.g. 5 PM - 3 AM, 10 PM - 7 AM)

    // Commute Home (Wear Blue Blockers)
    if (commuteMins > 0) {
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
        relative_day: getRelativeDayLabel(commuteStart, shiftStart),
      });
    }

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
      relative_day: getRelativeDayLabel(sleepStart, shiftStart),
    });

    // Wake up & light seek
    const wakeStart = new Date(sleepEnd);
    items.push({
      id: `wake-${shift.date}`,
      type: "wake",
      time_display: formatTime(wakeStart),
      time_sort: wakeStart,
      title: "Wake & Seek Bright Light",
      description: "Expose yourself to bright sunlight or a 10,000-lux light box for 15-30 minutes immediately. This resets your circadian clock and eliminates morning grogginess.",
      tag: "Circadian Reset",
      relative_day: getRelativeDayLabel(wakeStart, shiftStart),
    });

    // Commute to Work (Leave commuteMins before shift start)
    const commuteToWorkStart = new Date(shiftStart);
    commuteToWorkStart.setMinutes(commuteToWorkStart.getMinutes() - commuteMins);
    const commuteToWorkEnd = new Date(shiftStart);

    // Resolve Nap vs Commute Overlap:
    // If commute is 90 mins or longer, the home nap overlaps. We replace it with a cab nap recommendation.
    const isTransitNap = commuteMins >= 90;
    
    if (!isTransitNap) {
      // Normal Pre-Shift Nap
      const napStart = new Date(shiftStart);
      napStart.setHours(napStart.getHours() - 2.5); // 2.5 hours prior to shift
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
        relative_day: getRelativeDayLabel(napStart, shiftStart),
      });
    }

    if (commuteMins > 0) {
      items.push({
        id: `commute-work-${shift.date}`,
        type: "light",
        time_display: `${formatTime(commuteToWorkStart)} - ${formatTime(commuteToWorkEnd)}`,
        time_sort: commuteToWorkStart,
        title: isTransitNap ? "Commute to Work (Cab Nap)" : "Commute to Work (Alertness)",
        description: isTransitNap
          ? `Leave home at ${formatTime(commuteToWorkStart)}. Since you have a long ${commuteMins}-minute transit, use this time to take a 30-45 minute nap in the cab to bank energy. Wear an eye mask and earplugs.`
          : `Leave home at ${formatTime(commuteToWorkStart)}. Expose yourself to bright light (natural sunlight or bright cab lighting) during your commute to maximize alertness before starting your shift.`,
        tag: isTransitNap ? "Energy Banking" : "Transit Alertness",
        relative_day: getRelativeDayLabel(commuteToWorkStart, shiftStart),
      });
    }

    // Software Dev Study Block (typically 1.5 hours post-wake)
    let studyStart = new Date(sleepEnd);
    studyStart.setHours(studyStart.getHours() + 1);
    studyStart.setMinutes(studyStart.getMinutes() + 30);
    let studyEnd = new Date(studyStart);
    studyEnd.setMinutes(studyEnd.getMinutes() + 45); // 45-minute sprint

    // Resolve Focus Block vs Commute Overlap:
    // If study block overlaps with commute to work or shift, shift it earlier to 30 mins post-wake
    if (commuteMins > 0 && studyEnd > commuteToWorkStart) {
      studyStart = new Date(sleepEnd);
      studyStart.setMinutes(studyStart.getMinutes() + 30); // 30 mins post-wake
      studyEnd = new Date(studyStart);
      studyEnd.setMinutes(studyEnd.getMinutes() + 45);
    }

    items.push({
      id: `study-${shift.date}`,
      type: "focus",
      time_display: `${formatTime(studyStart)} - ${formatTime(studyEnd)}`,
      time_sort: studyStart,
      title: "Software Dev Focus Block",
      description: "Your cognitive resources are at their peak. Spend this 45-minute focus window studying software engineering (e.g., React, TypeScript, or Python) now before you get tired.",
      tag: "Upskilling Block",
      relative_day: getRelativeDayLabel(studyStart, shiftStart),
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
      relative_day: getRelativeDayLabel(caffeineCutoff, shiftStart),
    });

  } else if (isEveningShift) {
    // EVENING SHIFT PROTOCOLS (e.g. 2 PM - 11 PM)

    // Commute to Work
    const commuteToWorkStart = new Date(shiftStart);
    commuteToWorkStart.setMinutes(commuteToWorkStart.getMinutes() - commuteMins);
    const commuteToWorkEnd = new Date(shiftStart);
    if (commuteMins > 0) {
      items.push({
        id: `commute-work-${shift.date}`,
        type: "light",
        time_display: `${formatTime(commuteToWorkStart)} - ${formatTime(commuteToWorkEnd)}`,
        time_sort: commuteToWorkStart,
        title: "Commute to Work (Alertness)",
        description: `Leave home at ${formatTime(commuteToWorkStart)}. Expose yourself to bright daylight during your commute to lock in circadian alertness.`,
        tag: "Transit Alertness",
        relative_day: getRelativeDayLabel(commuteToWorkStart, shiftStart),
      });
    }

    // Commute Home
    const commuteStart = new Date(shiftEnd);
    const commuteEnd = new Date(shiftEnd);
    commuteEnd.setMinutes(commuteEnd.getMinutes() + commuteMins);
    if (commuteMins > 0) {
      items.push({
        id: `commute-home-${shift.date}`,
        type: "light",
        time_display: `${formatTime(commuteStart)} - ${formatTime(commuteEnd)}`,
        time_sort: commuteStart,
        title: "Commute Home (Wind Down)",
        description: `Head home starting at ${formatTime(commuteStart)}. Avoid excessive screens or bright lighting during transit to start your wind down.`,
        tag: "Circadian Transition",
        relative_day: getRelativeDayLabel(commuteStart, shiftStart),
      });
    }

    // Sleep Window (starts at least 30 mins after arriving home, or default 2 hours post shift)
    const sleepStart = new Date(shiftEnd);
    const minSleepStart = new Date(shiftEnd);
    minSleepStart.setMinutes(minSleepStart.getMinutes() + commuteMins + 30);
    const defaultSleepStart = new Date(shiftEnd);
    defaultSleepStart.setHours(defaultSleepStart.getHours() + 2);
    
    const finalSleepStart = minSleepStart > defaultSleepStart ? minSleepStart : defaultSleepStart;
    const sleepEnd = new Date(finalSleepStart);
    sleepEnd.setHours(sleepEnd.getHours() + 7);
    sleepEnd.setMinutes(sleepEnd.getMinutes() + 30); // 7.5 hours sleep

    items.push({
      id: `sleep-${shift.date}`,
      type: "sleep",
      time_display: `${formatTime(finalSleepStart)} - ${formatTime(sleepEnd)}`,
      time_sort: finalSleepStart,
      title: "Night Sleep Window",
      description: "Standard night-to-morning sleep. Keep room dark, cold, and quiet.",
      tag: "Biological Recovery",
      relative_day: getRelativeDayLabel(finalSleepStart, shiftStart),
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
      relative_day: getRelativeDayLabel(wakeStart, shiftStart),
    });

    // Focus Block (Morning peak energy)
    const studyStart = new Date(sleepEnd);
    studyStart.setHours(studyStart.getHours() + 1); // Study at 1 hour post-wake
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
      relative_day: getRelativeDayLabel(studyStart, shiftStart),
    });

    // Caffeine Cutoff (6 hours before sleep)
    const caffeineCutoff = new Date(finalSleepStart);
    caffeineCutoff.setHours(caffeineCutoff.getHours() - 6);

    items.push({
      id: `caffeine-${shift.date}`,
      type: "caffeine",
      time_display: formatTime(caffeineCutoff),
      time_sort: caffeineCutoff,
      title: "Caffeine Cutoff Milestone",
      description: "No coffee or soda after this hour. Switch to herbal tea or caffeine-free alternatives to prepare for sleep.",
      tag: "Caffeine Cutoff",
      relative_day: getRelativeDayLabel(caffeineCutoff, shiftStart),
    });

  } else {
    // STANDARD DAY SHIFT PROTOCOLS (e.g. 8 AM - 5 PM)

    // Commute to Work
    const commuteToWorkStart = new Date(shiftStart);
    commuteToWorkStart.setMinutes(commuteToWorkStart.getMinutes() - commuteMins);
    const commuteToWorkEnd = new Date(shiftStart);
    if (commuteMins > 0) {
      items.push({
        id: `commute-work-${shift.date}`,
        type: "light",
        time_display: `${formatTime(commuteToWorkStart)} - ${formatTime(commuteToWorkEnd)}`,
        time_sort: commuteToWorkStart,
        title: "Commute to Work (Alertness)",
        description: `Leave home at ${formatTime(commuteToWorkStart)}. Natural daylight during morning transit helps anchor your alertness.`,
        tag: "Transit Alertness",
        relative_day: getRelativeDayLabel(commuteToWorkStart, shiftStart),
      });
    }

    // Commute Home
    const commuteStart = new Date(shiftEnd);
    const commuteEnd = new Date(shiftEnd);
    commuteEnd.setMinutes(commuteEnd.getMinutes() + commuteMins);
    if (commuteMins > 0) {
      items.push({
        id: `commute-home-${shift.date}`,
        type: "light",
        time_display: `${formatTime(commuteStart)} - ${formatTime(commuteEnd)}`,
        time_sort: commuteStart,
        title: "Commute Home (Transition)",
        description: `Commute home starting at ${formatTime(commuteStart)}. Wind down after work.`,
        tag: "Circadian Transition",
        relative_day: getRelativeDayLabel(commuteStart, shiftStart),
      });
    }

    // Sleep Window (Night before)
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
      relative_day: getRelativeDayLabel(sleepStart, shiftStart),
    });

    // Study Block (Evening post-work) - starts at 1 hour post-shift, or at least 30 mins after arriving home
    const studyStart = new Date(shiftEnd);
    const minStudyStart = new Date(shiftEnd);
    minStudyStart.setMinutes(minStudyStart.getMinutes() + commuteMins + 30);
    const defaultStudyStart = new Date(shiftEnd);
    defaultStudyStart.setHours(defaultStudyStart.getHours() + 1);

    const finalStudyStart = minStudyStart > defaultStudyStart ? minStudyStart : defaultStudyStart;
    const studyEnd = new Date(finalStudyStart);
    studyEnd.setMinutes(studyEnd.getMinutes() + 45);

    items.push({
      id: `study-${shift.date}`,
      type: "focus",
      time_display: `${formatTime(finalStudyStart)} - ${formatTime(studyEnd)}`,
      time_sort: finalStudyStart,
      title: "Software Dev Focus Block",
      description: "Spend 45 minutes coding now before you relax for the evening. Keep your progression streak active.",
      tag: "Upskilling Block",
      relative_day: getRelativeDayLabel(finalStudyStart, shiftStart),
    });

    // Caffeine Cutoff (6 hours before sleep)
    const caffeineCutoff = new Date(shiftStart);
    caffeineCutoff.setHours(22 - 6); // 4:30 PM cutoff
    caffeineCutoff.setMinutes(30);

    items.push({
      id: `caffeine-${shift.date}`,
      type: "caffeine",
      time_display: formatTime(caffeineCutoff),
      time_sort: caffeineCutoff,
      title: "Caffeine Cutoff Milestone",
      description: "Avoid post-lunch caffeine to prevent disruption of your night sleep cycles.",
      tag: "Caffeine Cutoff",
      relative_day: getRelativeDayLabel(caffeineCutoff, shiftStart),
    });
  }

  // Sort survival checklist chronologically
  return items.sort((a, b) => a.time_sort.getTime() - b.time_sort.getTime());
}
