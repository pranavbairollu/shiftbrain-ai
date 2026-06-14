"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Moon, 
  Coffee, 
  BookOpen, 
  Sun, 
  Briefcase, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Settings,
  Compass,
  Zap,
  HelpCircle,
  ChevronRight,
  Check,
  X,
  Sparkles
} from "lucide-react";
import { generateSurvivalPlan, ParsedShift, SurvivalItem } from "../lib/circadianEngine";

// Default shift: Concentrix night shift
const DEFAULT_SHIFT: ParsedShift = {
  date: new Date().toISOString().split("T")[0],
  start_time: "17:30",
  end_time: "03:00",
  shift_name: "Concentrix Support (Night Shift)",
  commute_mins: 60
};

interface SleepLog {
  id: string;
  duration: number;
  wakeTime: Date;
  dateString: string;
  quality: number; // Subjective quality (1-10)
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actions?: Array<{
    type: string;
    payload: any;
    requires_approval: boolean;
    approved?: boolean;
    declined?: boolean;
  }>;
}

export default function Home() {
  // Onboarding & Local Storage States
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingSleepGoal, setOnboardingSleepGoal] = useState<string>("8.0");
  const [onboardingCommute, setOnboardingCommute] = useState<number>(60);
  const [userName, setUserName] = useState<string>("Pranav");
  const [onboardingName, setOnboardingName] = useState<string>("Pranav");
  const [userNameInput, setUserNameInput] = useState<string>("Pranav");
  
  // Roster State
  const [activeShift, setActiveShift] = useState<ParsedShift | null>(null);
  const [showRosterEditor, setShowRosterEditor] = useState(false);
  const [shiftNameInput, setShiftNameInput] = useState(DEFAULT_SHIFT.shift_name);
  const [shiftDateInput, setShiftDateInput] = useState(DEFAULT_SHIFT.date);
  const [shiftStartInput, setShiftStartInput] = useState(DEFAULT_SHIFT.start_time);
  const [shiftEndInput, setShiftEndInput] = useState(DEFAULT_SHIFT.end_time);
  const [commuteMinsInput, setCommuteMinsInput] = useState<number>(DEFAULT_SHIFT.commute_mins || 60);
  const [isOffDay, setIsOffDay] = useState<boolean>(false);
  const [offDayMode, setOffDayMode] = useState<"recovery" | "growth" | "fitness" | "social" | "reset">("recovery");

  // Sleep Logging State
  const [showSleepLogger, setShowSleepLogger] = useState(false);
  const [logSleepDate, setLogSleepDate] = useState(new Date().toISOString().split("T")[0]);
  const [logSleepTime, setLogSleepTime] = useState("08:30");
  const [logSleepDuration, setLogSleepDuration] = useState("6.5");
  const [logSleepQuality, setLogSleepQuality] = useState<number>(9); // Default to 9 (Yes, slept well)
  
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);

  // Checklist states
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  // Dynamic Decision States
  const [sleepDebt, setSleepDebt] = useState(0);
  const [netHoursAwake, setNetHoursAwake] = useState(0);
  const [safetyAlert, setSafetyAlert] = useState<string | null>(null);

  // OCR Optional States
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation & Display States
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [showSimulatedNotif, setShowSimulatedNotif] = useState<string | null>(null);

  // Chat States
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onboarded = localStorage.getItem("sb_onboarded") === "true";
    setHasOnboarded(onboarded);

    const savedName = localStorage.getItem("sb_user_name") || "Pranav";
    setUserName(savedName);
    setOnboardingName(savedName);
    setUserNameInput(savedName);

    const savedShift = localStorage.getItem("sb_active_shift");
    if (savedShift) {
      try {
        const parsed = JSON.parse(savedShift);
        setActiveShift(parsed);
        setShiftNameInput(parsed.shift_name || DEFAULT_SHIFT.shift_name);
        setShiftDateInput(parsed.date || DEFAULT_SHIFT.date);
        setShiftStartInput(parsed.start_time || DEFAULT_SHIFT.start_time);
        setShiftEndInput(parsed.end_time || DEFAULT_SHIFT.end_time);
        setCommuteMinsInput(parsed.commute_mins !== undefined ? parsed.commute_mins : 60);
        setIsOffDay(!!parsed.is_off_day);
        setOffDayMode(parsed.off_day_mode || "recovery");
      } catch (e) {
        setActiveShift(DEFAULT_SHIFT);
      }
    } else if (onboarded) {
      setActiveShift(DEFAULT_SHIFT);
    }

    const savedLogs = localStorage.getItem("sb_sleep_logs");
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs).map((l: any) => ({
          ...l,
          wakeTime: new Date(l.wakeTime)
        }));
        setSleepLogs(parsed);
      } catch (e) {
        loadDefaultSleepLogs();
      }
    } else {
      loadDefaultSleepLogs();
    }

    const savedChecks = localStorage.getItem("sb_completed_actions");
    if (savedChecks) {
      try {
        setCompletedActions(JSON.parse(savedChecks));
      } catch (e) {}
    }

    const savedChat = localStorage.getItem("sb_chat_history");
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        setChatMessages(parsed);
      } catch (e) {}
    } else {
      setChatMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hey Pranav! I'm ShiftBuddy, your biological co-pilot. I can see your active roster, sleep logs, and current sleep debt. Ask me anything about vocal care, surviving night shifts, or scheduling upskilling sprints!",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  const saveChatMessages = (msgs: ChatMessage[]) => {
    setChatMessages(msgs);
    localStorage.setItem("sb_chat_history", JSON.stringify(msgs));
  };

  const handleSendChatMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    const updatedMsgs = [...chatMessages, userMsg];
    saveChatMessages(updatedMsgs);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
          context: {
            userName: userName,
            activeShift: activeShift,
            sleepDebt: sleepDebt,
            netHoursAwake: netHoursAwake,
            sleepLogs: sleepLogs.map(l => ({
              duration: l.duration,
              dateString: l.dateString,
              quality: l.quality
            })),
            sleepGoal: onboardingSleepGoal
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to connect to AI Coach.");
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Sorry, I had trouble parsing that. Please try again.",
        timestamp: new Date().toISOString(),
        actions: data.actions || []
      };

      // Automatically execute non-approval actions
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach((act: any) => {
          if (!act.requires_approval) {
            executeAction(act.type, act.payload);
          }
        });
      }

      saveChatMessages([...updatedMsgs, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again shortly.",
        timestamp: new Date().toISOString()
      };
      saveChatMessages([...updatedMsgs, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const executeAction = (actionType: string, payload: any) => {
    switch (actionType) {
      case "UPDATE_SHIFT": {
        const current = activeShift || DEFAULT_SHIFT;
        const updated = {
          ...current,
          ...payload
        };
        saveActiveShift(updated);
        if (payload.start_time) setShiftStartInput(payload.start_time);
        if (payload.end_time) setShiftEndInput(payload.end_time);
        if (payload.shift_name) setShiftNameInput(payload.shift_name);
        if (payload.commute_mins !== undefined) setCommuteMinsInput(payload.commute_mins);
        if (payload.is_off_day !== undefined) setIsOffDay(payload.is_off_day);
        if (payload.off_day_mode) setOffDayMode(payload.off_day_mode);
        break;
      }
      case "LOG_SLEEP": {
        const wakeDateObj = payload.wakeTime ? new Date(payload.wakeTime) : new Date();
        const newLog: SleepLog = {
          id: Date.now().toString(),
          duration: payload.duration,
          wakeTime: wakeDateObj,
          dateString: payload.dateString || "Today",
          quality: payload.quality || 9
        };
        const cleanLogs = sleepLogs.filter(log => log.dateString !== newLog.dateString);
        saveSleepLogs([newLog, ...cleanLogs]);
        break;
      }
      case "SWITCH_OFFDAY_MODE": {
        const current = activeShift || DEFAULT_SHIFT;
        const updated = {
          ...current,
          is_off_day: true,
          off_day_mode: payload.off_day_mode,
          shift_name: `Week Off (${payload.off_day_mode.toUpperCase()})`
        };
        saveActiveShift(updated);
        setOffDayMode(payload.off_day_mode);
        setIsOffDay(true);
        break;
      }
      case "TOGGLE_TASK": {
        const updatedChecks = {
          ...completedActions,
          [payload.id]: payload.completed
        };
        saveCompletedActions(updatedChecks);
        break;
      }
      case "ADD_NOTE": {
        const updatedChecks = {
          ...completedActions,
          [payload.text]: true
        };
        saveCompletedActions(updatedChecks);
        break;
      }
      default:
        console.warn("Unhandled action type:", actionType);
    }
  };

  const handleApproveActions = (msgId: string) => {
    const updated = chatMessages.map(msg => {
      if (msg.id === msgId) {
        if (msg.actions) {
          msg.actions.forEach(act => {
            if (act.requires_approval) {
              executeAction(act.type, act.payload);
            }
          });
        }
        return {
          ...msg,
          actions: msg.actions?.map(act => ({ ...act, approved: true }))
        };
      }
      return msg;
    });
    saveChatMessages(updated);
  };

  const handleDeclineActions = (msgId: string) => {
    const updated = chatMessages.map(msg => {
      if (msg.id === msgId) {
        return {
          ...msg,
          actions: msg.actions?.map(act => ({ ...act, declined: true }))
        };
      }
      return msg;
    });
    saveChatMessages(updated);
  };

  // Auto scroll to chat bottom on new message or load
  useEffect(() => {
    if (chatOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen, chatLoading]);

  const loadDefaultSleepLogs = () => {
    const defaultLogs = [
      { id: "1", duration: 7.5, wakeTime: new Date(Date.now() - 10 * 60 * 60 * 1000), dateString: "Today", quality: 8 },
      { id: "2", duration: 6.5, wakeTime: new Date(Date.now() - 24 * 60 * 60 * 1000), dateString: "Yesterday", quality: 7 },
      { id: "3", duration: 5.5, wakeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), dateString: "2 days ago", quality: 6 },
    ];
    setSleepLogs(defaultLogs);
  };

  // Save changes to local storage helper
  const saveActiveShift = (shift: ParsedShift | null) => {
    setActiveShift(shift);
    if (shift) {
      localStorage.setItem("sb_active_shift", JSON.stringify(shift));
    } else {
      localStorage.removeItem("sb_active_shift");
    }
  };

  const saveSleepLogs = (logs: SleepLog[]) => {
    setSleepLogs(logs);
    localStorage.setItem("sb_sleep_logs", JSON.stringify(logs));
  };

  const saveCompletedActions = (actions: Record<string, boolean>) => {
    setCompletedActions(actions);
    localStorage.setItem("sb_completed_actions", JSON.stringify(actions));
  };

  // Recalculate sleep debt and dynamically update the Decision Alert Banner
  useEffect(() => {
    if (sleepLogs.length === 0) return;

    // 1. Calculate Sleep Debt using subjective quality scaling (Effective Sleep)
    const dailyBaseline = parseFloat(onboardingSleepGoal) || 8.0;
    const totalSleepReceived = sleepLogs.reduce((sum, log) => {
      const effFactor = 0.5 + (log.quality / 20.0); // 10/10 -> 100% effective, 5/10 -> 75% effective
      return sum + (log.duration * effFactor);
    }, 0);
    const totalSleepRequired = dailyBaseline * sleepLogs.length;
    const debt = Math.max(0, totalSleepRequired - totalSleepReceived);
    setSleepDebt(debt);

    // 2. Calculate continuous wake time and sleep pressure
    let latestLog: SleepLog | null = null;
    if (sleepLogs.length > 0) {
      latestLog = sleepLogs.reduce((latest, current) => {
        const currentVal = new Date(current.wakeTime).getTime();
        const latestVal = new Date(latest.wakeTime).getTime();
        return currentVal > latestVal ? current : latest;
      }, sleepLogs[0]);
    }

    let hoursAwakeRaw = 0;
    let computedNetHoursAwake = 0;

    if (latestLog && activeShift) {
      const currentPlan = generateSurvivalPlan(activeShift);
      const napItem = currentPlan.find(item => item.type === "sleep" && item.title.toLowerCase().includes("nap"));
      const isNapCompleted = napItem ? !!completedActions[napItem.id] : false;

      const wakeDate = new Date(latestLog.wakeTime);
      const diffMs = Date.now() - wakeDate.getTime();
      hoursAwakeRaw = Math.max(0, diffMs / (1000 * 60 * 60));
      
      const napReduction = isNapCompleted ? 4.0 : 0.0;
      computedNetHoursAwake = Math.max(0, hoursAwakeRaw - napReduction);
      setNetHoursAwake(computedNetHoursAwake);
    }

    // 3. Apple Health-Style Quiet Safety Alerts
    if (latestLog && hoursAwakeRaw >= 0) {
      if (computedNetHoursAwake >= 20) {
        setSafetyAlert(`You've been awake for ${computedNetHoursAwake.toFixed(1)}h. For your safety, avoid driving or complex tasks and rest as soon as possible.`);
      } else if (computedNetHoursAwake >= 17) {
        setSafetyAlert(`You've been awake for ${computedNetHoursAwake.toFixed(1)}h. Your reaction speed and focus may be slower. Please prepare to sleep soon.`);
      } else {
        setSafetyAlert(null);
      }
    } else {
      setSafetyAlert(null);
    }
  }, [sleepLogs, completedActions, activeShift, onboardingSleepGoal]);

  // Dynamic Companion Greeting helper (Concept C)
    const getCompanionGreeting = () => {
    if (!activeShift) return "Set a work schedule to generate your plan.";
    if (activeShift.is_off_day) {
      const capitalizedMode = activeShift.off_day_mode ? activeShift.off_day_mode.charAt(0).toUpperCase() + activeShift.off_day_mode.slice(1) : "Recovery";
      return `Today is your off day, focused on ${capitalizedMode}. Zero shifts. Focus on yourself.`;
    }
    
    const now = new Date();
    const shiftStart = new Date(`${activeShift.date}T${activeShift.start_time}`);
    let shiftEnd = new Date(`${activeShift.date}T${activeShift.end_time}`);
    if (shiftEnd < shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const diffStartMs = shiftStart.getTime() - now.getTime();
    const diffEndMs = shiftEnd.getTime() - now.getTime();

    if (diffStartMs > 0) {
      const hours = Math.floor(diffStartMs / (1000 * 60 * 60));
      const mins = Math.floor((diffStartMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) {
        return `Your shift starts in ${hours} hours. Here is your anchor plan:`;
      } else {
        return `Your shift starts in ${mins} minutes. Prepare to check in:`;
      }
    } else if (diffEndMs > 0) {
      return "You are currently on your shift. Stay hydrated and alert.";
    } else {
      const hoursAgo = Math.floor(-diffEndMs / (1000 * 60 * 60));
      if (hoursAgo < 24) {
        return `Your shift ended ${hoursAgo} hours ago. Rest well today.`;
      }
      return "Plan configured. Here is your next recommended action:";
    }
  };

  // Form Handlers
  const handleUpdateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOffDay && shiftStartInput === shiftEndInput) {
      setFormError("Shift start and end times cannot be identical.");
      return;
    }
    setFormError(null);
    const updated = {
      date: shiftDateInput,
      start_time: isOffDay ? "08:00" : shiftStartInput,
      end_time: isOffDay ? "08:00" : shiftEndInput,
      shift_name: isOffDay ? `Week Off (${offDayMode.toUpperCase()})` : shiftNameInput,
      commute_mins: isOffDay ? 0 : commuteMinsInput,
      is_off_day: isOffDay,
      off_day_mode: offDayMode
    };
    localStorage.setItem("sb_user_name", userNameInput);
    setUserName(userNameInput);
    saveActiveShift(updated);
    setShowRosterEditor(false);
    saveCompletedActions({});
  };

  const handleLogSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = logSleepDate.split("-").map(Number);
    const [hours, minutes] = logSleepTime.split(":").map(Number);
    const wakeDateObj = new Date(year, month - 1, day, hours, minutes);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    let dateLabel = "Today";
    
    if (logSleepDate !== todayStr) {
      const selDate = new Date(year, month - 1, day);
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((selDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === -1) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = logSleepDate;
      }
    }

    const newLog: SleepLog = {
      id: Date.now().toString(),
      duration: parseFloat(logSleepDuration),
      wakeTime: wakeDateObj,
      dateString: dateLabel,
      quality: logSleepQuality
    };

    const cleanLogs = sleepLogs.filter(log => log.dateString !== dateLabel);
    saveSleepLogs([newLog, ...cleanLogs]);
    setShowSleepLogger(false);
  };

  const toggleAction = (actionId: string) => {
    const updatedChecks = {
      ...completedActions,
      [actionId]: !completedActions[actionId]
    };
    saveCompletedActions(updatedChecks);
  };

  // OCR Upload Handlers
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setLoadingOCR(true);
    setOcrError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-roster", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "OCR parsing failed.");
      }

      const data = await response.json();
      if (!data.shifts || data.shifts.length === 0) {
        throw new Error("No shifts could be extracted from image.");
      }

      const firstShift = data.shifts[0];

      // Strict schema validation to prevent client-side crashes
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      if (
        !firstShift.date || !dateRegex.test(firstShift.date) ||
        !firstShift.start_time || !timeRegex.test(firstShift.start_time) ||
        !firstShift.end_time || !timeRegex.test(firstShift.end_time)
      ) {
        throw new Error("Scanned roster data is incomplete or has invalid dates/times. Please adjust manually.");
      }

      setShiftDateInput(firstShift.date);
      setShiftStartInput(firstShift.start_time);
      setShiftEndInput(firstShift.end_time);
      setShiftNameInput(firstShift.shift_name || "Scanned Process");
      setCommuteMinsInput(firstShift.commute_mins || onboardingCommute || 60);
      
      const newShift = {
        date: firstShift.date,
        start_time: firstShift.start_time,
        end_time: firstShift.end_time,
        shift_name: firstShift.shift_name || "Scanned Process",
        commute_mins: firstShift.commute_mins || onboardingCommute || 60
      };

      saveActiveShift(newShift);
      saveCompletedActions({});
      
      // If we are onboarding, step forward
      if (!hasOnboarded && onboardingStep === 3) {
        finishOnboarding();
      }
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || "Failed to scan image.");
    } finally {
      setLoadingOCR(false);
    }
  };

  // Get raw shifts from circadianEngine
  const rawSurvivalPlan = activeShift ? generateSurvivalPlan(activeShift) : [];

  // Map raw survival items into Decision checklist items (What, When, Why)
  const getDecisionPlan = (items: SurvivalItem[]) => {
    return items.map(item => {
      let why = "";
      if (activeShift?.is_off_day) {
        if (item.title.includes("Sleep Debt Recovery") || item.title.includes("Restorative Sleep")) {
          why = `Compensates for sleep debt and consolidates cellular restoration. Currently clearing ${sleepDebt.toFixed(1)}h of deficit.`;
        } else if (item.title.includes("Sprint 1") || item.title.includes("Sprint 2")) {
          why = "Leverages rest periods for deep mental work to accelerate your software career progression.";
        } else if (item.title.includes("Mindfulness") || item.title.includes("Recharge")) {
          why = "Quiets down the amygdala and reduces neurological stress from shift switching.";
        } else if (item.title.includes("Gym") || item.title.includes("Strength")) {
          why = "Stimulates muscular development, oxygen flow, and endocrine health after days of static shift desk work.";
        } else if (item.title.includes("Meal Prep")) {
          why = "Secures clean nutrition for the upcoming work week, preventing fatigue-induced night bingeing.";
        } else if (item.title.includes("Outing") || item.title.includes("Social")) {
          why = "Nurtures human bonds and emotional well-being outside the workplace BPO bubble.";
        } else if (item.title.includes("Clean") || item.title.includes("Declutter") || item.title.includes("Workspace")) {
          why = "Restores neatness to your physical workspace, which directly calms the pre-frontal cortex.";
        } else if (item.title.includes("Admin") || item.title.includes("Planning")) {
          why = "Unclutters schedule anxiety and prevents billing or calendar overlaps next week.";
        } else if (item.title.includes("Walk")) {
          why = "Exposes eyes to sunset sky cues to naturalize your nighttime wind-down.";
        } else {
          why = "Re-aligns your physiological baseline without BPO/shift stress.";
        }
      } else {
        if (item.type === "sleep" && item.title.includes("Core")) {
          why = `Helps clear your accumulated ${sleepDebt.toFixed(1)}-hour sleep debt.`;
        } else if (item.type === "sleep" && item.title.includes("Nap")) {
          why = "Clears adenosine build-up to prevent you from crashing at 2:00 AM.";
        } else if (item.type === "caffeine") {
          why = "Protects melatonin receptor pathways so you can fall asleep quickly in the morning.";
        } else if (item.type === "light" && item.title.includes("Blue")) {
          why = "Morning sunlight triggers wake hormones (cortisol) and blocks melatonin.";
        } else if (item.type === "light" && item.title.includes("Alertness")) {
          why = "Bright light signals the brain to wake up and shakes off pre-shift grogginess.";
        } else if (item.type === "wake") {
          why = "Halts melatonin production and sets your circadian starting point.";
        } else if (item.type === "focus") {
          why = "Your brain has the highest cognitive capacity right now—perfect for code upskilling.";
        } else {
          why = "Eases your body's circadian transition between shifts.";
        }
      }
      
      return {
        ...item,
        why
      };
    });
  };

  const decisionPlan = getDecisionPlan(rawSurvivalPlan);

  // Concept A: Next Best Action Extraction
  const nextBestAction = decisionPlan.find(item => !completedActions[item.id]);
  const nextBestActionIndex = nextBestAction ? decisionPlan.indexOf(nextBestAction) : -1;

  // Concept B: Truncated Upcoming timeline (next 3 items after next best action)
  const upcomingTimelineItems = nextBestActionIndex !== -1
    ? decisionPlan.slice(nextBestActionIndex + 1, nextBestActionIndex + 4)
    : decisionPlan.slice(0, 3);

  // Icon Mapper
  const getIcon = (type: string, title?: string) => {
    const titleLower = title?.toLowerCase() || "";
    if (titleLower.includes("gym") || titleLower.includes("strength") || titleLower.includes("workout")) {
      return <Zap className="h-4 w-4 text-orange-500" />;
    }
    if (titleLower.includes("clean") || titleLower.includes("declutter") || titleLower.includes("workspace")) {
      return <Sparkles className="h-4 w-4 text-cyan-500" />;
    }
    if (titleLower.includes("social") || titleLower.includes("relationships") || titleLower.includes("outing") || titleLower.includes("dinner") || titleLower.includes("family")) {
      return <HelpCircle className="h-4 w-4 text-rose-500" />;
    }
    switch (type) {
      case "sleep":
        return <Moon className="h-4 w-4 text-indigo-500" />;
      case "caffeine":
        return <Coffee className="h-4 w-4 text-amber-500" />;
      case "focus":
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      case "shift":
        return <Briefcase className="h-4 w-4 text-stone-500" />;
      case "light":
        return <Sun className="h-4 w-4 text-yellow-600" />;
      case "wake":
        return <Clock className="h-4 w-4 text-teal-600" />;
      default:
        return <Compass className="h-4 w-4 text-stone-500" />;
    }
  };

  const getTagColorClass = (type: string) => {
    switch (type) {
      case "sleep": return "tag-sleep";
      case "caffeine": return "tag-caffeine";
      case "focus": return "tag-focus";
      case "shift": return "bg-stone-100 text-stone-700";
      case "light": return "tag-light";
      case "wake": return "tag-commute";
      default: return "bg-stone-100 text-stone-700";
    }
  };

  // Onboarding utilities
  const finishOnboarding = () => {
    localStorage.setItem("sb_onboarded", "true");
    localStorage.setItem("sb_user_name", onboardingName);
    setUserName(onboardingName);
    setUserNameInput(onboardingName);
    setHasOnboarded(true);
    if (!activeShift) {
      saveActiveShift(DEFAULT_SHIFT);
    }
  };

  const resetTutorial = () => {
    localStorage.removeItem("sb_onboarded");
    localStorage.removeItem("sb_active_shift");
    localStorage.removeItem("sb_completed_actions");
    localStorage.removeItem("sb_user_name");
    setCompletedActions({});
    setActiveShift(null);
    setHasOnboarded(false);
    setOnboardingStep(1);
    setUserName("Pranav");
    setOnboardingName("Pranav");
    setUserNameInput("Pranav");
  };

  // Helper to trigger simulated push notifications
  const triggerNotificationSim = (type: string) => {
    let text = "";
    if (type === "caffeine") {
      text = "Caffeine Cutoff: Stop coffee/tea now so you can fall asleep quickly at 4:30 AM.";
    } else if (type === "nap") {
      text = "Anchor Nap: Time for a 20-minute nap to bank alertness before your shift starts.";
    } else if (type === "light") {
      text = "Blue Blockers: Put on your sunglasses for the commute home to protect your sleep.";
    } else {
      text = "Shift Update: Your survival timeline has been recalculated successfully.";
    }
    
    setShowSimulatedNotif(text);
    setTimeout(() => {
      setShowSimulatedNotif(null);
    }, 4500);
  };

  // Onboarding screens layout
  if (!hasOnboarded) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-[#1A1D1A] flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-[#EBEAE5] p-8 shadow-sm flex flex-col gap-6">
          
          {/* Progress Indicator */}
          <div className="flex gap-2">
            {[1, 2, 3].map(step => (
              <div 
                key={step} 
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  onboardingStep >= step ? "bg-emerald-600" : "bg-[#EBEAE5]"
                }`}
              />
            ))}
          </div>

          {onboardingStep === 1 && (
            <div className="flex flex-col gap-5 text-center py-4">
              <img src="/logo.png" alt="ShiftBrain Logo" className="mx-auto w-16 h-16 object-contain rounded-2xl shadow-sm border border-[#EBEAE5]" />
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold font-display tracking-tight">Align your biology to your work.</h1>
                <p className="text-sm text-[#5F6660] leading-relaxed">
                  Shift rotations shouldn't break your body. ShiftBrain builds a personalized timeline to help you protect your sleep, stabilize energy, and upskill.
                </p>
              </div>
              <button
                onClick={() => setOnboardingStep(2)}
                className="bg-[#1A1D1A] text-white hover:bg-black font-semibold py-3 rounded-2xl text-sm transition-colors mt-2"
              >
                Get Started
              </button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1 text-center">
                <h2 className="text-xl font-bold font-display tracking-tight">Set your baseline.</h2>
                <p className="text-xs text-[#5F6660]">These dictate your daily recovery plans.</p>
              </div>

              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F6660]">Your Name</label>
                  <input
                    type="text"
                    required
                    value={onboardingName}
                    onChange={(e) => setOnboardingName(e.target.value)}
                    className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-sm text-[#1A1D1A] focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F6660]">Daily Sleep Need (hours)</label>
                  <select
                    value={onboardingSleepGoal}
                    onChange={(e) => setOnboardingSleepGoal(e.target.value)}
                    className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-sm text-[#1A1D1A] focus:outline-none focus:border-emerald-600"
                  >
                    {["9.0", "8.5", "8.0", "7.5", "7.0", "6.5"].map(h => (
                      <option key={h} value={h}>{h} hours</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F6660]">Average Commute Time (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={onboardingCommute}
                    onChange={(e) => setOnboardingCommute(parseInt(e.target.value) || 0)}
                    className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-sm text-[#1A1D1A] focus:outline-none focus:border-emerald-600"
                  />
                  <div className="flex gap-1.5 mt-1">
                    {[
                      { label: "30m (PG)", val: 30 },
                      { label: "60m (BPO Cab)", val: 60 },
                      { label: "90m (Far Transit)", val: 90 }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setOnboardingCommute(preset.val)}
                        className={
                          onboardingCommute === preset.val
                            ? "flex-1 py-1.5 rounded-lg text-[9px] font-semibold border transition-all bg-[#1A1D1A] text-white border-[#1A1D1A]"
                            : "flex-1 py-1.5 rounded-lg text-[9px] font-semibold border transition-all bg-white text-stone-700 border-[#EBEAE5] hover:bg-stone-50"
                        }
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="flex-1 border border-[#EBEAE5] hover:bg-stone-50 text-[#5F6660] font-semibold py-3 rounded-2xl text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setOnboardingStep(3)}
                  className="flex-1 bg-[#1A1D1A] text-white hover:bg-black font-semibold py-3 rounded-2xl text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1 text-center">
                <h2 className="text-xl font-bold font-display tracking-tight">Sync your roster.</h2>
                <p className="text-xs text-[#5F6660]">Upload your shift calendar to activate the companion.</p>
              </div>

              <div className="flex flex-col gap-4 py-2">
                {/* OCR Dropzone */}
                <label className="border border-dashed border-[#C5C4BE] hover:bg-[#FAF9F6] rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center gap-2 transition-colors">
                  <UploadCloud className="h-8 w-8 text-[#5F6660]" />
                  <span className="text-xs font-semibold">{loadingOCR ? "Analyzing image..." : "Upload Roster Screenshot"}</span>
                  <span className="text-[10px] text-[#5F6660]">Upload your Excel roster crop, portal snip, or WhatsApp schedule image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleOcrUpload}
                    disabled={loadingOCR}
                  />
                </label>

                {ocrError && (
                  <p className="text-[10px] text-red-500 text-center font-semibold">{ocrError}</p>
                )}

                <div className="text-center text-xs text-[#5F6660]">or</div>

                <button
                  onClick={() => {
                    saveActiveShift(DEFAULT_SHIFT);
                    finishOnboarding();
                  }}
                  className="border border-[#EBEAE5] hover:bg-stone-50 font-semibold py-2.5 rounded-xl text-xs text-[#1A1D1A]"
                >
                  Skip & Use Shift Template
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="flex-1 border border-[#EBEAE5] text-[#5F6660] font-semibold py-3 rounded-2xl text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Active Hub screen layout
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#1A1D1A] flex flex-col items-center px-4 py-6 md:py-10">
      
      {/* Brand Header */}
      <header className="w-full max-w-sm flex justify-between items-center mb-5 px-1">
        <div className="flex items-center gap-1.5 animate-fade-in">
          <img src="/logo.png" alt="ShiftBrain Logo" className="h-6 w-6 object-contain rounded-lg shadow-sm border border-[#EBEAE5] bg-[#1A1D1A]" />
          <span className="font-bold text-lg font-display tracking-tight">
            ShiftBrain
          </span>
        </div>
        
        <div className="flex gap-2">
          {/* AI Coach Toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-2 border rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              chatOpen 
                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                : "border-[#EBEAE5] bg-white text-[#5F6660] hover:bg-stone-50"
            }`}
            title="ShiftBuddy AI Coach"
          >
            <Sparkles className="h-4 w-4" />
          </button>

          {/* Scheduler Toggle */}
          <button
            onClick={() => setShowRosterEditor(!showRosterEditor)}
            className="p-2 border border-[#EBEAE5] bg-white rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
            title="Adjust Schedule"
          >
            <Settings className="h-4 w-4 text-[#5F6660]" />
          </button>
        </div>
      </header>

      {/* Roster Scanner Inline Form Modal */}
      {showRosterEditor && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-end sm:items-center justify-center p-4">
          <form onSubmit={handleUpdateShift} className="w-full max-w-sm bg-white rounded-3xl border border-[#EBEAE5] p-6 flex flex-col gap-4 animate-fade-in shadow-xl">
            <div className="flex justify-between items-center border-b border-[#EBEAE5] pb-2">
              <h4 className="text-xs font-bold uppercase text-[#5F6660] tracking-wider">Configure Current Shift</h4>
              
              <button 
                type="button" 
                onClick={() => setShowRosterEditor(false)}
                className="text-[#5F6660] hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#5F6660] uppercase">Scan from portal</span>
                <label className="text-xs text-emerald-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                  <UploadCloud className="h-3 w-3" />
                  {loadingOCR ? "Reading..." : "OCR Roster Scan"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleOcrUpload}
                    disabled={loadingOCR}
                  />
                </label>
              </div>
              {ocrError && (
                <p className="text-[10px] text-red-500 font-semibold">{ocrError}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#5F6660] uppercase">Your Name</label>
              <input
                type="text"
                required
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-xs text-[#1A1D1A] focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#5F6660] uppercase">Shift Type</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsOffDay(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    !isOffDay 
                      ? "bg-[#1A1D1A] text-white border-[#1A1D1A]" 
                      : "bg-white text-stone-700 border-[#EBEAE5] hover:bg-stone-50"
                  }`}
                >
                  Working Day
                </button>
                <button
                  type="button"
                  onClick={() => setIsOffDay(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isOffDay 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                      : "bg-white text-stone-700 border-[#EBEAE5] hover:bg-stone-50"
                  }`}
                >
                  Day Off / Week Off
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#5F6660] uppercase">Date</label>
              <input
                type="date"
                required
                value={shiftDateInput}
                onChange={(e) => setShiftDateInput(e.target.value)}
                className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-xs font-mono text-[#1A1D1A] focus:outline-none focus:border-emerald-600"
              />
            </div>

            {!isOffDay ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#5F6660] uppercase">Shift Name / Role</label>
                  <input
                    type="text"
                    required
                    value={shiftNameInput}
                    onChange={(e) => setShiftNameInput(e.target.value)}
                    className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-xs text-[#1A1D1A] focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 col-span-1">
                    <label className="text-[10px] font-bold text-[#5F6660] uppercase">Commute (m)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="240"
                      value={commuteMinsInput}
                      onChange={(e) => setCommuteMinsInput(parseInt(e.target.value) || 0)}
                      className="bg-white border border-[#EBEAE5] rounded-xl px-2 py-2 text-xs font-mono text-[#1A1D1A] focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-1">
                    <label className="text-[10px] font-bold text-[#5F6660] uppercase">Start</label>
                    <input
                      type="time"
                      required
                      value={shiftStartInput}
                      onChange={(e) => setShiftStartInput(e.target.value)}
                      className="bg-white border border-[#EBEAE5] rounded-xl px-2 py-2 text-xs font-mono text-[#1A1D1A] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-1">
                    <label className="text-[10px] font-bold text-[#5F6660] uppercase">End</label>
                    <input
                      type="time"
                      required
                      value={shiftEndInput}
                      onChange={(e) => setShiftEndInput(e.target.value)}
                      className="bg-white border border-[#EBEAE5] rounded-xl px-2 py-2 text-xs font-mono text-[#1A1D1A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <label className="text-[10px] font-bold text-[#5F6660] uppercase">Select Rest Day Focus Mode</label>
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  {[
                    { mode: "recovery", label: "🛋️ Recovery", desc: "Sleep debt paydown & decompression", span: "col-span-2" },
                    { mode: "growth", label: "🚀 Growth", desc: "Deep coding sprints & portfolio building", span: "col-span-1" },
                    { mode: "fitness", label: "🏋️ Fitness", desc: "Meal prep & gym workout sessions", span: "col-span-1" },
                    { mode: "social", label: "🍕 Social", desc: "Connect with friends and family", span: "col-span-1" },
                    { mode: "reset", label: "🧹 Reset", desc: "Clean room & administrative chores", span: "col-span-1" }
                  ].map(item => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setOffDayMode(item.mode as any)}
                      className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${item.span} ${
                        offDayMode === item.mode
                          ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600/35"
                          : "border-[#EBEAE5] bg-white hover:bg-stone-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-[#1A1D1A]">{item.label}</span>
                      <span className="text-[9px] text-[#5F6660] leading-snug">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <p className="text-[10px] text-red-500 font-semibold">{formError}</p>
            )}

            <button
              type="submit"
              className="bg-[#1A1D1A] hover:bg-black text-white font-semibold py-2.5 rounded-xl text-xs transition-colors w-full mt-1"
            >
              Confirm Shift Settings
            </button>
          </form>
        </div>
      )}

      {/* Sleep Logging Modal */}
      {showSleepLogger && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-end sm:items-center justify-center p-4">
          <form onSubmit={handleLogSleepSubmit} className="w-full max-w-sm bg-white rounded-3xl border border-[#EBEAE5] p-6 flex flex-col gap-4 animate-fade-in shadow-xl">
            <div className="flex justify-between items-center border-b border-[#EBEAE5] pb-2">
              <h4 className="text-xs font-bold uppercase text-[#5F6660] tracking-wider">Log Daily Sleep</h4>
              <button 
                type="button" 
                onClick={() => setShowSleepLogger(false)}
                className="text-[#5F6660] hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#5F6660] uppercase">Wake Date</label>
              <input
                type="date"
                required
                value={logSleepDate}
                onChange={(e) => setLogSleepDate(e.target.value)}
                className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-xs font-mono text-[#1A1D1A] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#5F6660] uppercase">Wake Time</label>
                <input
                  type="time"
                  required
                  value={logSleepTime}
                  onChange={(e) => setLogSleepTime(e.target.value)}
                  className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-xs font-mono text-[#1A1D1A] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#5F6660] uppercase">Duration (hours)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="1"
                  max="16"
                  value={logSleepDuration}
                  onChange={(e) => setLogSleepDuration(e.target.value)}
                  className="bg-white border border-[#EBEAE5] rounded-xl px-3 py-2 text-xs font-mono text-[#1A1D1A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="text-[10px] font-bold text-[#5F6660] uppercase">Did you sleep well?</label>
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={() => setLogSleepQuality(9)}
                   className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                     logSleepQuality === 9 
                       ? "bg-emerald-650 text-white border-emerald-600 bg-emerald-600 shadow-sm" 
                       : "bg-white text-stone-700 border-[#EBEAE5] hover:bg-stone-50"
                   }`}
                 >
                   👍 Yes, slept well
                 </button>
                 <button
                   type="button"
                   onClick={() => setLogSleepQuality(5)}
                   className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                     logSleepQuality === 5 
                       ? "bg-amber-600 text-white border-amber-600 shadow-sm" 
                       : "bg-white text-stone-700 border-[#EBEAE5] hover:bg-stone-50"
                   }`}
                 >
                   👎 No, restless sleep
                 </button>
               </div>
             </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowSleepLogger(false)}
                className="flex-1 border border-[#EBEAE5] hover:bg-stone-50 text-[#5F6660] py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#1A1D1A] hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold"
              >
                Save Sleep Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Simulated Apple Health Push Notification Banner */}
      {showSimulatedNotif && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto bg-black/90 text-white p-4 rounded-2xl border border-stone-850 shadow-2xl flex gap-3 items-start animate-fade-in">
          <div className="h-6 w-6 rounded-md bg-emerald-700 flex items-center justify-center text-[10px] font-bold">SB</div>
          <div className="flex flex-col gap-0.5 w-full">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400">SHIFTBRAIN • NOW</span>
              <button onClick={() => setShowSimulatedNotif(null)} className="text-stone-500 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs leading-snug font-medium text-stone-100">{showSimulatedNotif}</p>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <section className="w-full max-w-sm flex flex-col gap-5">
        
        {/* Companion Greeting (Concept C) */}
        <div className="flex flex-col px-1">
          <span className="text-xl font-bold font-display tracking-tight text-[#1A1D1A]">
            Good evening, {userName}.
          </span>
          <span className="text-xs text-[#5F6660] mt-0.5">
            {getCompanionGreeting()}
          </span>
        </div>

        {/* 1. Next Best Action (Hero Card - Concept A) */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6660] px-1">
            Next Best Action
          </span>

          {nextBestAction ? (
            <div className="action-card p-5 flex flex-col gap-4 border-l-4 border-l-emerald-600 bg-white">
              <div className="flex justify-between items-start">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getTagColorClass(nextBestAction.type)}`}>
                  {nextBestAction.tag || "Core"}
                </span>
                <span className="text-xs font-bold font-mono text-[#1A1D1A]">
                  {nextBestAction.time_display}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-[#1A1D1A] leading-tight">
                  {nextBestAction.title}
                </h3>
                
                {/* Rationalized Why */}
                <p className="text-xs text-[#5F6660] leading-relaxed italic bg-stone-50 p-2.5 rounded-lg border border-[#EBEAE5]">
                  <span className="font-semibold not-italic text-[#1A1D1A]">Why:</span> {nextBestAction.why}
                </p>
              </div>

              {/* Large Tap Action Button */}
              <button
                onClick={() => toggleAction(nextBestAction.id)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="h-4 w-4 stroke-[3]" /> Mark Complete
              </button>
            </div>
          ) : (
            <div className="action-card p-5 text-center flex flex-col items-center justify-center gap-3 bg-white">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-bold text-[#1A1D1A]">Plan Completed</h3>
                <p className="text-xs text-[#5F6660]">You've completed all survival tasks. Sleep well!</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Apple-Style Safety Alert (Factual & Caring) */}
        {safetyAlert && (
          <div className="bg-[#FAF0EF] border border-[#F5D5D0] rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="shrink-0 mt-0.5 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-xs text-red-950 font-medium leading-relaxed">
              {safetyAlert}
            </p>
          </div>
        )}

        {/* 3. Timeline View (Next 3 Actions - Concept B) */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6660]">
              {showFullTimeline ? "Full Day Timeline" : "Upcoming Timeline"}
            </span>
            <button
              onClick={() => setShowFullTimeline(!showFullTimeline)}
              className="text-[10px] text-emerald-600 font-bold hover:underline"
            >
              {showFullTimeline ? "Show Next 3 Only" : "Show Full Day"}
            </button>
          </div>

          <div className="flex flex-col relative pl-5">
            {/* Vertical Line */}
            <div className="timeline-line" />

            {(showFullTimeline ? decisionPlan : upcomingTimelineItems).map((item, index) => {
              const isChecked = !!completedActions[item.id];
              const isNextAction = nextBestAction && item.id === nextBestAction.id;

              // If it's already checked or we are rendering timeline list, style appropriately
              return (
                <div 
                  key={item.id} 
                  onClick={() => toggleAction(item.id)}
                  className={`flex gap-3 items-start py-3 cursor-pointer transition-all ${
                    isChecked ? "opacity-45" : ""
                  } ${isNextAction ? "font-semibold text-emerald-700" : ""}`}
                >
                  {/* Custom checkmark dot */}
                  <div className="absolute left-0 mt-0.5 z-10">
                    {isChecked ? (
                      <div className="h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center border border-emerald-600">
                        <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                      </div>
                    ) : (
                      <div className={`h-4 w-4 rounded-full border bg-white flex items-center justify-center transition-colors ${
                        isNextAction ? "border-emerald-600 text-emerald-600" : "border-[#C5C4BE] text-stone-400"
                      }`}>
                        {getIcon(item.type, item.title)}
                      </div>
                    )}
                  </div>

                  {/* Task details */}
                  <div className="flex flex-col gap-0.5 w-full pl-2">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wide ${isChecked ? "line-through text-stone-400" : "text-[#5F6660]"}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-stone-900 shrink-0">
                        {item.time_display}
                      </span>
                    </div>
                    
                    {/* Inline clean rationale */}
                    <span className="text-[10px] text-[#5F6660] leading-snug">
                      {item.description}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty upcoming timeline handler */}
            {(showFullTimeline ? decisionPlan : upcomingTimelineItems).length === 0 && (
              <p className="text-xs text-[#5F6660] italic py-2 pl-2">No upcoming items.</p>
            )}
          </div>
        </div>

        {/* 4. Status & Controls Footer Panel (Apple-Notion Simplicity / Wins Ledger) */}
        {activeShift?.is_off_day ? (
          <div className="action-card p-4 flex flex-col gap-3.5 bg-white mt-2 border border-[#EBEAE5]">
            <div className="flex justify-between items-center border-b border-[#EBEAE5] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">✨</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6660]">Today's Wins Ledger</span>
              </div>
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                {activeShift.off_day_mode || "RECOVERY"} MODE
              </span>
            </div>

            {/* List of checked off outcomes */}
            {(() => {
              const getOffDayOutcomeText = (itemId: string, title: string) => {
                const titleLower = title.toLowerCase();
                if (titleLower.includes("sleep debt") || titleLower.includes("restorative sleep")) {
                  return `Banked recovery sleep & restored energy`;
                }
                if (titleLower.includes("sprint 1") || titleLower.includes("sprint 2")) {
                  return `Completed deep upskilling coding sprint`;
                }
                if (titleLower.includes("mindfulness") || titleLower.includes("recharge")) {
                  return `Quieted stress response & decompressed`;
                }
                if (titleLower.includes("gym") || titleLower.includes("strength") || titleLower.includes("workout")) {
                  return `Completed gym strength session`;
                }
                if (titleLower.includes("meal prep")) {
                  return `Prepared high-protein shift fuel nutrition`;
                }
                if (titleLower.includes("outing") || titleLower.includes("dinner")) {
                  return `Nurtured relationships & disconnected`;
                }
                if (titleLower.includes("clean") || titleLower.includes("declutter")) {
                  return `Decluttered physical room workspace`;
                }
                if (titleLower.includes("admin") || titleLower.includes("planning")) {
                  return `Completed calendar & life admin`;
                }
                if (titleLower.includes("walk")) {
                  return `Completed active aerobic recovery walk`;
                }
                if (titleLower.includes("sunlight") || titleLower.includes("bright light")) {
                  return `Anchored morning circadian baseline`;
                }
                if (titleLower.includes("caffeine cutoff")) {
                  return `Protected upcoming sleep pathways`;
                }
                if (titleLower.includes("caffeine") || titleLower.includes("coffee")) {
                  return `Optimized mental alertness window`;
                }
                if (titleLower.includes("stretching") || titleLower.includes("yoga")) {
                  return `Decompressed muscle tension`;
                }
                return `Completed: ${title}`;
              };

              const completedWins = decisionPlan
                .filter(item => completedActions[item.id])
                .map(item => getOffDayOutcomeText(item.id, item.title));
              
              return (
                <div className="flex flex-col gap-2">
                  {completedWins.length === 0 ? (
                    <div className="text-center py-4 flex flex-col items-center justify-center gap-2 bg-stone-50 rounded-2xl border border-dashed border-[#C5C4BE]">
                      <Sparkles className="h-5 w-5 text-stone-400 animate-pulse" />
                      <p className="text-[10px] text-[#5F6660] font-medium max-w-[200px]">
                        Wins Ledger is empty. Complete tasks on your timeline to celebrate real-world outcomes.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {completedWins.map((win, idx) => (
                          <div key={idx} className="bg-emerald-50 text-emerald-950 border border-emerald-100/70 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in shadow-sm">
                            <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                            <span>{win}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Notion-style Clean Utility Actions */}
            <div className="flex justify-between items-center border-t border-[#EBEAE5] pt-3 mt-1 text-xs">
              <button
                onClick={() => setShowSleepLogger(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Log Sleep
              </button>

              <button
                onClick={() => setShowRosterEditor(true)}
                className="text-[#1A1D1A] hover:underline font-semibold text-xs"
              >
                ✎ Change Focus Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="action-card p-4 flex flex-col gap-3.5 bg-white mt-2">
            <div className="flex justify-between items-center border-b border-[#EBEAE5] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6660]">Telemetry & Controls</span>
              <span className="text-[9px] text-stone-400">Checked naps subtract 4.0h</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#5F6660] uppercase font-bold tracking-wider">Sleep Deficit</span>
                <span className="font-semibold text-stone-900 mt-0.5">
                  {sleepDebt > 0 ? `${sleepDebt.toFixed(1)} hours debt` : "Fully Calibrated"}
                </span>
                <span className="text-[9px] text-[#5F6660] leading-snug mt-0.5">
                  {sleepDebt > 0 
                    ? `Focus is slightly slower today.` 
                    : "Ideal focus capacity."}
                </span>
              </div>

              <div className="flex flex-col border-l border-[#EBEAE5] pl-4">
                <span className="text-[10px] text-[#5F6660] uppercase font-bold tracking-wider">Wake Pressure</span>
                <span className="font-semibold text-stone-900 mt-0.5">
                  {netHoursAwake.toFixed(1)}h awake
                </span>
                <span className="text-[9px] text-[#5F6660] leading-snug mt-0.5">
                  Continuous awake monitoring.
                </span>
              </div>
            </div>

            {/* Notion-style Clean Utility Actions */}
            <div className="flex justify-between items-center border-t border-[#EBEAE5] pt-3 mt-1 text-xs">
              <button
                onClick={() => setShowSleepLogger(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Log Sleep
              </button>

              <button
                onClick={() => setShowRosterEditor(true)}
                className="text-[#1A1D1A] hover:underline font-semibold text-xs"
              >
                ✎ Change Shift
              </button>
            </div>
          </div>
        )}

        {/* 5. Notification Simulator (Founder Feature Check - Dev Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="border border-[#EBEAE5] rounded-2xl p-4 flex flex-col gap-2.5 bg-stone-50">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#5F6660]">Simulation Panel</span>
            <div className="flex gap-2 justify-between">
              <button
                onClick={() => triggerNotificationSim("caffeine")}
                className="flex-1 bg-[#FAF9F6] hover:bg-stone-100 border border-[#EBEAE5] text-stone-700 py-1.5 rounded-lg text-[9px] font-bold"
              >
                Caffeine Cutoff
              </button>
              <button
                onClick={() => triggerNotificationSim("nap")}
                className="flex-1 bg-[#FAF9F6] hover:bg-stone-100 border border-[#EBEAE5] text-stone-700 py-1.5 rounded-lg text-[9px] font-bold"
              >
                Anchor Nap
              </button>
              <button
                onClick={() => triggerNotificationSim("light")}
                className="flex-1 bg-[#FAF9F6] hover:bg-stone-100 border border-[#EBEAE5] text-stone-700 py-1.5 rounded-lg text-[9px] font-bold"
              >
                Blue Blockers
              </button>
            </div>
          </div>
        )}

        {/* Technical resets for development testing */}
        <div className="flex justify-between items-center text-[10px] text-stone-400 py-2 border-t border-[#EBEAE5]">
          <span>App v1.1 • Muted Light</span>
          <button 
            onClick={resetTutorial} 
            className="hover:text-red-600 transition-colors font-semibold"
          >
            Reset Companion Tutorial
          </button>
        </div>

      </section>

      {/* ShiftBuddy AI Coach bottom sheet drawer */}
      {chatOpen && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-end justify-center p-0">
          {/* Dismiss tap area */}
          <div className="absolute inset-0 bg-transparent" onClick={() => setChatOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl border-t border-[#EBEAE5] shadow-2xl flex flex-col h-[75vh] animate-slide-up z-10">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#EBEAE5]">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sm tracking-tight font-display">ShiftBuddy AI Coach</span>
                </div>
                <span className="text-[9px] text-[#5F6660] font-semibold mt-0.5">
                  Syncing: {sleepDebt.toFixed(1)}h Sleep Debt • {activeShift?.is_off_day ? "Rest Mode" : "Shift Mode"}
                </span>
              </div>
              
              <button 
                type="button" 
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-50 text-stone-500 hover:text-black transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message History list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3.5 scrollbar-thin">
              {chatMessages.map(msg => {
                const pendingActions = msg.actions?.filter(act => act.requires_approval && !act.approved && !act.declined) || [];
                const hasApproved = msg.actions?.some(act => act.approved);
                const hasDeclined = msg.actions?.some(act => act.declined);

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div 
                      className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-[#1A1D1A] text-white rounded-tr-none"
                          : "bg-[#F5F4EE] text-[#1A1D1A] rounded-tl-none border border-[#EBEAE5]"
                      }`}
                    >
                      <div>{msg.content}</div>

                      {/* Pending Action Card */}
                      {msg.role === "assistant" && pendingActions.length > 0 && (
                        <div className="mt-3 p-3 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 flex flex-col gap-2 shadow-sm text-[10px]">
                          <span className="font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                            ⚡ Suggested Action
                          </span>
                          <div className="flex flex-col gap-1.5 border-t border-emerald-100/60 pt-1.5 mt-0.5">
                            {pendingActions.map((act, idx) => (
                              <div key={idx} className="flex flex-col gap-0.5">
                                <span className="font-semibold text-emerald-900 text-[10px]">{act.type.replace('_', ' ')}</span>
                                <span className="text-stone-600 font-mono text-[9px] bg-white p-1 rounded border border-stone-250/30 whitespace-pre-wrap leading-tight break-all">
                                  {JSON.stringify(act.payload, null, 2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleApproveActions(msg.id)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[9px] shadow-sm transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineActions(msg.id)}
                              className="flex-1 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 font-bold rounded-lg text-[9px] transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Approved Status Badge */}
                      {msg.role === "assistant" && hasApproved && (
                        <div className="mt-2 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-150 flex items-center gap-1 w-max">
                          ✓ Action Applied
                        </div>
                      )}

                      {/* Declined Status Badge */}
                      {msg.role === "assistant" && hasDeclined && (
                        <div className="mt-2 text-[9px] font-bold text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-300 flex items-center gap-1 w-max">
                          ✗ Action Dismissed
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[8px] text-stone-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="self-start flex flex-col items-start max-w-[85%]">
                  <div className="bg-[#F5F4EE] text-[#1A1D1A] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs border border-[#EBEAE5] shadow-sm flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-500 animate-bounce" />
                  </div>
                </div>
              )}
              {/* Dummy element to anchor scroll to bottom */}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggestion Chips */}
            {chatMessages.length <= 2 && (
              <div className="px-5 pb-2 flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-[#5F6660] uppercase tracking-wider">Suggested Questions:</span>
                <div className="flex flex-col gap-1.5">
                  {[
                    "I slept 4 hours today. How do I survive?",
                    "What is my peak coding study window today?",
                    "My throat is sore from voice calls. Any tips?",
                    "Give me a schedule reset for my Day Off."
                  ].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendChatMessage(chip)}
                      className="text-left text-[10px] font-semibold text-[#1A1D1A] bg-[#FAF9F6] border border-[#EBEAE5] hover:bg-stone-50 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage(chatInput);
              }}
              className="p-4 border-t border-[#EBEAE5] flex gap-2 bg-stone-50 rounded-b-3xl"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask ShiftBuddy a question..."
                disabled={chatLoading}
                className="flex-1 bg-white border border-[#EBEAE5] rounded-xl px-3 py-2.5 text-xs text-[#1A1D1A] focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/35"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="bg-[#1A1D1A] hover:bg-black text-white px-4 rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
