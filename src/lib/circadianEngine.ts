export interface ParsedShift {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  shift_name: string;
  commute_mins?: number; // Optional commute transit duration
  is_off_day?: boolean; // Mark shift as a rest/week off day
  off_day_mode?: "recovery" | "growth" | "fitness" | "social" | "reset";
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

function generateOffDayPlan(dateStr: string, mode: "recovery" | "growth" | "fitness" | "social" | "reset"): SurvivalItem[] {
  const items: SurvivalItem[] = [];
  
  // Helper to parse target time on the off day date
  const timeAt = (timeStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  switch (mode) {
    case "recovery":
      items.push({
        id: `off-wake-${dateStr}`,
        type: "wake",
        time_display: "08:00 AM",
        time_sort: timeAt("08:00"),
        title: "Wake & Bright Light Reset",
        description: "Expose your eyes to 15-30 mins of bright morning sunlight immediately. This resets your cortisol curve.",
        tag: "Circadian Reset"
      });
      items.push({
        id: `off-light-${dateStr}`,
        type: "light",
        time_display: "09:30 AM",
        time_sort: timeAt("09:30"),
        title: "Light Stretching & Yoga",
        description: "Spend 15 mins on light physical alignment. Release physical tension accumulated from long shift sitting.",
        tag: "Decompression"
      });
      items.push({
        id: `off-recharge-${dateStr}`,
        type: "focus",
        time_display: "11:00 AM",
        time_sort: timeAt("11:00"),
        title: "Quiet Mindfulness / Reading",
        description: "Read fiction, meditate, or rest with no active stimulation. Let your brain wander and recover.",
        tag: "Cognitive Recovery"
      });
      items.push({
        id: `off-walk-${dateStr}`,
        type: "light",
        time_display: "03:00 PM",
        time_sort: timeAt("15:00"),
        title: "Zone 1 Nature Recovery Walk",
        description: "A gentle 30-minute walk in natural afternoon light to maintain aerobic baseline and reduce cortisol.",
        tag: "Active Recovery"
      });
      items.push({
        id: `off-caffeine-cutoff-${dateStr}`,
        type: "caffeine",
        time_display: "05:00 PM",
        time_sort: timeAt("17:00"),
        title: "Caffeine Cutoff Milestone",
        description: "Stop all caffeine now. Adenosine clearance is vital tonight to maximize deep recovery sleep.",
        tag: "Sleep Protection"
      });
      items.push({
        id: `off-fasting-${dateStr}`,
        type: "caffeine",
        time_display: "08:00 PM - 11:00 PM",
        time_sort: timeAt("20:00"),
        title: "Digestive Fasting Window",
        description: "Begin 3-hour pre-sleep fasting window. Keeping digestion quiet ensures maximum sleep quality.",
        tag: "Metabolic Health"
      });
      items.push({
        id: `off-sleep-${dateStr}`,
        type: "sleep",
        time_display: "11:00 PM - 08:00 AM",
        time_sort: timeAt("23:00"),
        title: "Deep Sleep Debt Recovery",
        description: "Aim for a full 9-hour recovery sleep window in a cold, pitch-black room. Restore your cellular homeostasis.",
        tag: "Biological Recovery"
      });
      break;

    case "growth":
      items.push({
        id: `off-wake-${dateStr}`,
        type: "wake",
        time_display: "07:30 AM",
        time_sort: timeAt("07:30"),
        title: "Wake & Bright Light Reset",
        description: "Expose your eyes to sunlight. Anchor your day early for peak daytime cognitive focus.",
        tag: "Circadian Reset"
      });
      items.push({
        id: `off-caffeine-intake-${dateStr}`,
        type: "caffeine",
        time_display: "08:30 AM",
        time_sort: timeAt("08:30"),
        title: "Strategic Morning Caffeine",
        description: "Enjoy clean black coffee or green tea to prime adenosine pathways for focused deep work.",
        tag: "Focus Fuel"
      });
      items.push({
        id: `off-sprint1-${dateStr}`,
        type: "focus",
        time_display: "09:00 AM - 11:00 AM",
        time_sort: timeAt("09:00"),
        title: "Deep Upskilling Sprint 1 (Coding)",
        description: "2-hour code sprint. Put phone on DND and build out React, TypeScript, or system architecture.",
        tag: "Upskilling Block"
      });
      items.push({
        id: `off-walk-${dateStr}`,
        type: "light",
        time_display: "11:30 AM",
        time_sort: timeAt("11:30"),
        title: "Cognitive Recovery Walk",
        description: "A brisk 20-minute walk to clear metabolic fatigue and boost neural plasticity before session 2.",
        tag: "Active Rest"
      });
      items.push({
        id: `off-sprint2-${dateStr}`,
        type: "focus",
        time_display: "02:00 PM - 03:30 PM",
        time_sort: timeAt("14:00"),
        title: "Deep Upskilling Sprint 2 (Portfolio)",
        description: "90-minute building block. Integrate APIs, polish CSS transitions, or refactor repository code.",
        tag: "Portfolio Build"
      });
      items.push({
        id: `off-caffeine-cutoff-${dateStr}`,
        type: "caffeine",
        time_display: "04:00 PM",
        time_sort: timeAt("16:00"),
        title: "Caffeine Cutoff Milestone",
        description: "Cut off caffeine to prepare for early restorative sleep. Consolidate what you studied today.",
        tag: "Sleep Protection"
      });
      items.push({
        id: `off-admin-${dateStr}`,
        type: "focus",
        time_display: "05:00 PM - 06:00 PM",
        time_sort: timeAt("17:00"),
        title: "Career Admin & GitHub Sync",
        description: "60-minute cleanup. Sync code changes to GitHub, update resume, or check job descriptions.",
        tag: "Career Strategy"
      });
      items.push({
        id: `off-fasting-${dateStr}`,
        type: "caffeine",
        time_display: "08:00 PM - 11:00 PM",
        time_sort: timeAt("20:00"),
        title: "Digestive Fasting Window",
        description: "3-hour fasting window to keep sleep undisturbed by digestion.",
        tag: "Metabolic Health"
      });
      items.push({
        id: `off-sleep-${dateStr}`,
        type: "sleep",
        time_display: "11:00 PM - 07:30 AM",
        time_sort: timeAt("23:00"),
        title: "Restorative Sleep Window",
        description: "Deep, undisturbed sleep is when your brain commits studied coding concepts to long-term memory.",
        tag: "Biological Recovery"
      });
      break;

    case "fitness":
      items.push({
        id: `off-wake-${dateStr}`,
        type: "wake",
        time_display: "07:00 AM",
        time_sort: timeAt("07:00"),
        title: "Wake & Hydrate Reset",
        description: "Drink 500ml water with sea salt and get immediate sunlight to jumpstart metabolism.",
        tag: "Circadian Reset"
      });
      items.push({
        id: `off-prep-${dateStr}`,
        type: "focus",
        time_display: "08:00 AM - 09:00 AM",
        time_sort: timeAt("08:00"),
        title: "Fueling & Nutrition Meal Prep",
        description: "Prepare high-protein, clean meals for the upcoming shift week. Protects against night shift junk food cravings.",
        tag: "Meal Prep"
      });
      items.push({
        id: `off-gym-${dateStr}`,
        type: "light",
        time_display: "10:00 AM - 11:30 AM",
        time_sort: timeAt("10:00"),
        title: "Deep Gym / Strength Session",
        description: "90-minute heavy resistance or endurance session. Stimulates hypertrophy, joint stability, and cardiovascular capacity.",
        tag: "Strength & Cardio"
      });
      items.push({
        id: `off-caffeine-cutoff-${dateStr}`,
        type: "caffeine",
        time_display: "03:30 PM",
        time_sort: timeAt("15:30"),
        title: "Caffeine Cutoff Milestone",
        description: "Cut off caffeine to prevent central nervous system over-arousal. Deep sleep is when muscle recovery occurs.",
        tag: "Sleep Protection"
      });
      items.push({
        id: `off-mobility-${dateStr}`,
        type: "light",
        time_display: "04:30 PM - 05:00 PM",
        time_sort: timeAt("16:30"),
        title: "Active Mobility Walk",
        description: "30-minute zone 1 walk to clear lactic acid, promote blood flow, and enhance recovery.",
        tag: "Active Recovery"
      });
      items.push({
        id: `off-fasting-${dateStr}`,
        type: "caffeine",
        time_display: "07:30 PM - 10:30 PM",
        time_sort: timeAt("19:30"),
        title: "Digestive Fasting Window",
        description: "3-hour pre-sleep fasting window. Fasting before sleep triggers autophagy and tissue repair.",
        tag: "Metabolic Health"
      });
      items.push({
        id: `off-sleep-${dateStr}`,
        type: "sleep",
        time_display: "10:30 PM - 07:00 AM",
        time_sort: timeAt("22:30"),
        title: "Deep Recovery Sleep Window",
        description: "Target a solid 8.5 hours. Growth hormone peaks during slow-wave deep sleep to rebuild muscle fibers.",
        tag: "Biological Recovery"
      });
      break;

    case "social":
      items.push({
        id: `off-wake-${dateStr}`,
        type: "wake",
        time_display: "08:00 AM",
        time_sort: timeAt("08:00"),
        title: "Wake & Bright Light Reset",
        description: "Sunlight exposure to secure mood, dopamine synthesis, and daytime alertness.",
        tag: "Circadian Reset"
      });
      items.push({
        id: `off-streak-${dateStr}`,
        type: "focus",
        time_display: "09:30 AM - 10:15 AM",
        time_sort: timeAt("09:30"),
        title: "Micro Study Sprint (Streak Maintenance)",
        description: "Quick 45-minute code session to keep your progression streak alive without dominating your social day.",
        tag: "Upskilling Block"
      });
      items.push({
        id: `off-outing-${dateStr}`,
        type: "light",
        time_display: "11:30 AM - 02:30 PM",
        time_sort: timeAt("11:30"),
        title: "Social Connection / Outing",
        description: "3-hour block to catch up with friends or family. Engage in active listening and step outside BPO shop-talk.",
        tag: "Relationships"
      });
      items.push({
        id: `off-caffeine-cutoff-${dateStr}`,
        type: "caffeine",
        time_display: "04:30 PM",
        time_sort: timeAt("16:30"),
        title: "Caffeine Cutoff Milestone",
        description: "No coffee or tea. Stick to water/juices during late afternoon hangs.",
        tag: "Sleep Protection"
      });
      items.push({
        id: `off-dinner-${dateStr}`,
        type: "light",
        time_display: "06:30 PM - 08:30 PM",
        time_sort: timeAt("18:30"),
        title: "Dinner & Digital Disconnect",
        description: "Enjoy dinner with family, a partner, or friends. Disconnect from digital messaging and be present.",
        tag: "Social Connection"
      });
      items.push({
        id: `off-fasting-${dateStr}`,
        type: "caffeine",
        time_display: "08:30 PM - 11:30 PM",
        time_sort: timeAt("20:30"),
        title: "Digestive Fasting Window",
        description: "Fasting window before sleep to prevent indigestion or restless night cycles.",
        tag: "Metabolic Health"
      });
      items.push({
        id: `off-sleep-${dateStr}`,
        type: "sleep",
        time_display: "11:30 PM - 08:00 AM",
        time_sort: timeAt("23:30"),
        title: "Restful Night Sleep Window",
        description: "Full night recovery sleep to feel fully connected and refreshed tomorrow.",
        tag: "Biological Recovery"
      });
      break;

    case "reset":
      items.push({
        id: `off-wake-${dateStr}`,
        type: "wake",
        time_display: "07:30 AM",
        time_sort: timeAt("07:30"),
        title: "Wake & Bright Light Reset",
        description: "Sunlight exposure to establish circadian baseline.",
        tag: "Circadian Reset"
      });
      items.push({
        id: `off-clean-${dateStr}`,
        type: "focus",
        time_display: "09:00 AM - 10:30 AM",
        time_sort: timeAt("09:00"),
        title: "Workspace Clean & Declutter",
        description: "90-minute cleaning block. Organize desk, laundry, and clean room. Clear physical space clears mental fog.",
        tag: "Organize Space"
      });
      items.push({
        id: `off-admin-${dateStr}`,
        type: "focus",
        time_display: "11:30 AM - 12:30 PM",
        time_sort: timeAt("11:30"),
        title: "Financial & Personal Admin Review",
        description: "60-minute admin session. Pay bills, log expenses, clean up personal inbox, and organize documents.",
        tag: "Life Admin"
      });
      items.push({
        id: `off-errands-${dateStr}`,
        type: "light",
        time_display: "03:00 PM - 04:00 PM",
        time_sort: timeAt("15:00"),
        title: "Errands Run & Store Restock",
        description: "Go outdoors. Pick up healthy groceries, toiletries, and cleaning supplies for the upcoming shift cycle.",
        tag: "Weekly Prep"
      });
      items.push({
        id: `off-caffeine-cutoff-${dateStr}`,
        type: "caffeine",
        time_display: "04:30 PM",
        time_sort: timeAt("16:30"),
        title: "Caffeine Cutoff Milestone",
        description: "Ensure quiet sleep tonight by switching to decaf/water.",
        tag: "Sleep Protection"
      });
      items.push({
        id: `off-plan-${dateStr}`,
        type: "focus",
        time_display: "05:30 PM - 06:00 PM",
        time_sort: timeAt("17:30"),
        title: "Roster Planning & Shift Prep",
        description: "30-minute planning session. Audit next week's schedule, set calendar alerts, and coordinate focus blocks.",
        tag: "Shift Readiness"
      });
      items.push({
        id: `off-fasting-${dateStr}`,
        type: "caffeine",
        time_display: "08:00 PM - 11:00 PM",
        time_sort: timeAt("20:00"),
        title: "Digestive Fasting Window",
        description: "3-hour fasting window to maximize slow-wave deep sleep quality.",
        tag: "Metabolic Health"
      });
      items.push({
        id: `off-sleep-${dateStr}`,
        type: "sleep",
        time_display: "11:00 PM - 07:30 AM",
        time_sort: timeAt("23:00"),
        title: "Standard Night Sleep",
        description: "Standard night recovery block to head into the new work week with full biological battery.",
        tag: "Biological Recovery"
      });
      break;
  }
  return items;
}

/**
 * Calculates a survival checklist based on a parsed shift.
 */
export function generateSurvivalPlan(shift: ParsedShift): SurvivalItem[] {
  const isOffDay = shift.is_off_day || /off|rest|wo|holiday|vacation|leave/i.test(shift.shift_name);
  if (isOffDay) {
    const mode = shift.off_day_mode || "recovery";
    return generateOffDayPlan(shift.date, mode);
  }

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

    // Digestive Wind-Down (3 hours before sleep window)
    const digestStart = new Date(sleepStart);
    digestStart.setHours(digestStart.getHours() - 3);
    items.push({
      id: `digest-${shift.date}`,
      type: "caffeine",
      time_display: `${formatTime(digestStart)} - ${formatTime(sleepStart)}`,
      time_sort: digestStart,
      title: "Digestive Wind-Down (Fasting Window)",
      description: "Avoid heavy meals and simple sugars now. Shift workers experience insulin resistance at night; keeping this 3-hour pre-sleep fasting window protects your metabolic health and sleep quality.",
      tag: "Nutrition & Fasting",
      relative_day: getRelativeDayLabel(digestStart, shiftStart),
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

    // Digestive Wind-Down (3 hours before sleep window)
    const digestStart = new Date(finalSleepStart);
    digestStart.setHours(digestStart.getHours() - 3);
    items.push({
      id: `digest-${shift.date}`,
      type: "caffeine",
      time_display: `${formatTime(digestStart)} - ${formatTime(finalSleepStart)}`,
      time_sort: digestStart,
      title: "Digestive Wind-Down (Fasting Window)",
      description: "Avoid heavy meals and simple sugars now. Shift workers experience insulin resistance at night; keeping this 3-hour pre-sleep fasting window protects your metabolic health and sleep quality.",
      tag: "Nutrition & Fasting",
      relative_day: getRelativeDayLabel(digestStart, shiftStart),
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

    // Digestive Wind-Down (3 hours before sleep window)
    const digestStart = new Date(sleepStart);
    digestStart.setHours(digestStart.getHours() - 3);
    items.push({
      id: `digest-${shift.date}`,
      type: "caffeine",
      time_display: `${formatTime(digestStart)} - ${formatTime(sleepStart)}`,
      time_sort: digestStart,
      title: "Digestive Wind-Down (Fasting Window)",
      description: "Avoid heavy meals and simple sugars now. Shift workers experience insulin resistance at night; keeping this 3-hour pre-sleep fasting window protects your metabolic health and sleep quality.",
      tag: "Nutrition & Fasting",
      relative_day: getRelativeDayLabel(digestStart, shiftStart),
    });
  }

  // Sort survival checklist chronologically
  return items.sort((a, b) => a.time_sort.getTime() - b.time_sort.getTime());
}
