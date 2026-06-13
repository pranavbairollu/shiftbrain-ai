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
  HelpCircle
} from "lucide-react";
import { generateSurvivalPlan, ParsedShift, SurvivalItem } from "../lib/circadianEngine";

// Default shift: Concentrix night shift
const DEFAULT_SHIFT: ParsedShift = {
  date: new Date().toISOString().split("T")[0],
  start_time: "22:00",
  end_time: "07:00",
  shift_name: "Concentrix Support (Night Shift)"
};

interface SleepLog {
  id: string;
  duration: number;
  wakeTime: Date;
  dateString: string;
}

export default function Home() {
  // Roster State
  const [activeShift, setActiveShift] = useState<ParsedShift>(DEFAULT_SHIFT);
  const [showRosterEditor, setShowRosterEditor] = useState(false);
  const [shiftNameInput, setShiftNameInput] = useState(DEFAULT_SHIFT.shift_name);
  const [shiftDateInput, setShiftDateInput] = useState(DEFAULT_SHIFT.date);
  const [shiftStartInput, setShiftStartInput] = useState(DEFAULT_SHIFT.start_time);
  const [shiftEndInput, setShiftEndInput] = useState(DEFAULT_SHIFT.end_time);

  // Sleep Logging State
  const [showSleepLogger, setShowSleepLogger] = useState(false);
  const [logSleepDate, setLogSleepDate] = useState(new Date().toISOString().split("T")[0]);
  const [logSleepTime, setLogSleepTime] = useState("08:30");
  const [logSleepDuration, setLogSleepDuration] = useState("6.5");
  
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([
    { id: "1", duration: 6.5, wakeTime: new Date(Date.now() - 24 * 60 * 60 * 1000), dateString: "Yesterday" },
    { id: "2", duration: 5.5, wakeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), dateString: "2 days ago" },
    { id: "3", duration: 7.0, wakeTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), dateString: "3 days ago" },
  ]);

  // Checklist states
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  // Dynamic Decision States
  const [sleepDebt, setSleepDebt] = useState(3.5); // positive number representing deficit
  const [forecastAlert, setForecastAlert] = useState("Concentration drop predicted at 02:30 AM.");
  const [fatigueLevel, setFatigueLevel] = useState("High Risk");

  // OCR Optional States
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate sleep debt and dynamically update the Decision Alert Banner
  useEffect(() => {
    // 1. Calculate Sleep Debt
    const dailyBaseline = 8.0;
    const totalSleepReceived = sleepLogs.reduce((sum, log) => sum + log.duration, 0);
    const totalSleepRequired = dailyBaseline * sleepLogs.length;
    const debt = Math.max(0, totalSleepRequired - totalSleepReceived);
    setSleepDebt(debt);

    // 2. Generate dynamic forecast warnings based on active shift & checks
    const shiftStart = activeShift.start_time;
    const isNight = parseInt(shiftStart.split(":")[0]) >= 18 || parseInt(shiftStart.split(":")[0]) < 4;

    const isNapCompleted = Object.keys(completedActions).some(
      key => key.includes("nap") && completedActions[key]
    );
    const isCaffeineCompleted = Object.keys(completedActions).some(
      key => key.includes("caffeine") && completedActions[key]
    );

    if (isNight) {
      if (debt > 4) {
        if (isNapCompleted) {
          setForecastAlert("Concentration drop delayed to 04:30 AM (Nap active).");
          setFatigueLevel("Moderate Risk");
        } else {
          setForecastAlert("Concentration drop predicted at 02:30 AM. Fatigue risk: High.");
          setFatigueLevel("High Risk");
        }
      } else {
        if (isNapCompleted) {
          setForecastAlert("Alertness stable until shift end (07:00 AM).");
          setFatigueLevel("Low Risk");
        } else {
          setForecastAlert("Concentration drop predicted at 04:00 AM.");
          setFatigueLevel("Moderate Risk");
        }
      }
      
      if (isCaffeineCompleted) {
        setForecastAlert(prev => prev + " Morning sleep transition: Easy.");
      }
    } else {
      // Day shift cases
      if (debt > 4) {
        setForecastAlert("Fatigue warning during afternoon block (02:00 PM).");
        setFatigueLevel("Moderate Risk");
      } else {
        setForecastAlert("Alertness stable for daytime shift.");
        setFatigueLevel("Low Risk");
      }
    }
  }, [sleepLogs, completedActions, activeShift]);

  // Form Handlers
  const handleUpdateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveShift({
      date: shiftDateInput,
      start_time: shiftStartInput,
      end_time: shiftEndInput,
      shift_name: shiftNameInput
    });
    setShowRosterEditor(false);
    setCompletedActions({});
  };

  const handleLogSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = logSleepDate.split("-").map(Number);
    const [hours, minutes] = logSleepTime.split(":").map(Number);
    const wakeDateObj = new Date(year, month - 1, day, hours, minutes);

    const newLog: SleepLog = {
      id: Date.now().toString(),
      duration: parseFloat(logSleepDuration),
      wakeTime: wakeDateObj,
      dateString: "Today"
    };

    const cleanLogs = sleepLogs.filter(log => log.dateString !== "Today");
    setSleepLogs([newLog, ...cleanLogs]);
    setShowSleepLogger(false);
  };

  const toggleAction = (actionId: string) => {
    setCompletedActions(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  // OCR Upload Shortcut Handler
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
      setShiftDateInput(firstShift.date);
      setShiftStartInput(firstShift.start_time);
      setShiftEndInput(firstShift.end_time);
      setShiftNameInput(firstShift.shift_name);
      
      setActiveShift(firstShift);
      setCompletedActions({});
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || "Failed to scan image.");
    } finally {
      setLoadingOCR(false);
    }
  };

  // Get raw shifts from circadEngine
  const rawSurvivalPlan = generateSurvivalPlan(activeShift);

  // Map raw survival items into Decision checklist items (What, When, Why)
  const getDecisionPlan = (items: SurvivalItem[]) => {
    return items.map(item => {
      let why = "";
      if (item.type === "sleep" && item.title.includes("Core")) {
        why = `To pay down your accumulated ${sleepDebt.toFixed(1)}-hour sleep debt.`;
      } else if (item.type === "sleep" && item.title.includes("Nap")) {
        why = "Clears adenosine pressure to push your alertness limit to the end of the shift.";
      } else if (item.type === "caffeine") {
        why = "Required to allow sleep hormones to build up before your morning bedtime.";
      } else if (item.type === "light" && item.title.includes("Blue")) {
        why = "Morning sunlight triggers cortisol, which will block sleep hormones.";
      } else if (item.type === "wake") {
        why = "Natural light exposure halts melatonin and anchors daytime alertness.";
      } else if (item.type === "focus") {
        why = "Your brain is clinically freshest in this post-sleep window.";
      } else {
        why = "Supports active recovery during erratic rotation cycles.";
      }
      
      return {
        ...item,
        why
      };
    });
  };

  const decisionPlan = getDecisionPlan(rawSurvivalPlan);

  // Icon Mapper
  const getIcon = (type: string) => {
    switch (type) {
      case "sleep":
        return <Moon className="h-5 w-5 text-indigo-400" />;
      case "caffeine":
        return <Coffee className="h-5 w-5 text-amber-500" />;
      case "focus":
        return <BookOpen className="h-5 w-5 text-purple-400" />;
      case "shift":
        return <Briefcase className="h-5 w-5 text-slate-400" />;
      case "light":
        return <Sun className="h-5 w-5 text-sky-400" />;
      case "wake":
        return <Clock className="h-5 w-5 text-emerald-400" />;
      default:
        return <Compass className="h-5 w-5 text-slate-400" />;
    }
  };

  const getCardStyle = (type: string) => {
    switch (type) {
      case "sleep":
        return "border-indigo-950 bg-indigo-950/20 hover:bg-indigo-950/30 text-indigo-100 glow-card";
      case "caffeine":
        return "border-amber-950 bg-amber-950/20 hover:bg-amber-950/30 text-amber-100 glow-card-orange";
      case "focus":
        return "border-purple-950 bg-purple-950/20 hover:bg-purple-950/30 text-purple-100 glow-card";
      case "shift":
        return "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 text-slate-100";
      case "light":
        return "border-sky-950 bg-sky-950/20 hover:bg-sky-950/30 text-sky-100 glow-card";
      case "wake":
        return "border-emerald-950 bg-emerald-950/20 hover:bg-emerald-950/30 text-emerald-100 glow-card-green";
      default:
        return "border-slate-800 bg-slate-900/40 text-slate-100";
    }
  };

  const getBannerColor = (level: string) => {
    if (level === "Low Risk") return "border-emerald-950 bg-emerald-950/20 text-emerald-300";
    if (level === "Moderate Risk") return "border-amber-950 bg-amber-950/20 text-amber-300";
    return "border-red-950 bg-red-950/20 text-red-300";
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center px-4 py-8 md:py-12">
      {/* Brand Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-6 px-1">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="font-bold text-md tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            ShiftBrain AI
          </span>
        </div>
        
        {/* Manual Scheduler Toggle */}
        <button
          onClick={() => setShowRosterEditor(!showRosterEditor)}
          className="p-2 border border-slate-800 bg-slate-900/30 rounded-xl hover:border-slate-700 transition-colors"
          title="Configure Shift Schedule"
        >
          <Settings className="h-4 w-4 text-slate-400" />
        </button>
      </header>

      {/* Main Content Column */}
      <section className="w-full max-w-md flex flex-col gap-5">
        
        {/* 1. Dynamic Fatigue Forecast Alert Banner */}
        <div className={`rounded-2xl border p-5 flex gap-4 items-start transition-colors duration-300 ${getBannerColor(fatigueLevel)}`}>
          <div className="shrink-0 mt-0.5">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
              Shift Survival Alert ({fatigueLevel})
            </span>
            <p className="text-sm font-bold leading-snug mt-0.5">
              {forecastAlert}
            </p>
          </div>
        </div>

        {/* 2. Simplified Action Log Trigger */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-4 flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sleep Debt Status</span>
            <span className="text-xs font-semibold text-slate-300">
              {sleepDebt > 0 ? `-${sleepDebt.toFixed(1)} hours sleep deficit` : "No sleep debt. Performance optimized."}
            </span>
          </div>

          <button
            onClick={() => setShowSleepLogger(true)}
            className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Log Sleep
          </button>
        </div>

        {/* Manual Shift Editor Drawer / Modal */}
        {showRosterEditor && (
          <form onSubmit={handleUpdateShift} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Configure Current Shift</h4>
              
              {/* Optional OCR input */}
              <label className="text-[10px] text-blue-400 cursor-pointer flex items-center gap-1 hover:underline">
                <UploadCloud className="h-3 w-3" />
                {loadingOCR ? "Scanning..." : "OCR Roster Scan"}
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
              <p className="text-[10px] text-red-400 font-semibold">{ocrError}</p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Shift / Role Name</label>
              <input
                type="text"
                required
                value={shiftNameInput}
                onChange={(e) => setShiftNameInput(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={shiftDateInput}
                  onChange={(e) => setShiftDateInput(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Start Time</label>
                <input
                  type="time"
                  required
                  value={shiftStartInput}
                  onChange={(e) => setShiftStartInput(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">End Time</label>
                <input
                  type="time"
                  required
                  value={shiftEndInput}
                  onChange={(e) => setShiftEndInput(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-slate-100 font-bold py-2 rounded-xl text-xs transition-colors w-full mt-1"
            >
              Confirm Shift Timing
            </button>
          </form>
        )}

        {/* Sleep Logging Modal */}
        {showSleepLogger && (
          <form onSubmit={handleLogSleepSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-4 animate-fade-in">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-800 pb-2">Log Daily Sleep</h4>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Wake Date</label>
              <input
                type="date"
                required
                value={logSleepDate}
                onChange={(e) => setLogSleepDate(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Wake Time</label>
                <input
                  type="time"
                  required
                  value={logSleepTime}
                  onChange={(e) => setLogSleepTime(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Sleep Duration (hrs)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="1"
                  max="16"
                  value={logSleepDuration}
                  onChange={(e) => setLogSleepDuration(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSleepLogger(false)}
                className="flex-1 border border-slate-800 hover:bg-slate-950/20 text-slate-400 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-slate-100 font-bold py-2 rounded-xl text-xs"
              >
                Save Log
              </button>
            </div>
          </form>
        )}

        {/* 3. Daily Decision-First Checklist */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              Today's Decisions
            </h3>
            <span className="text-[9px] font-mono bg-slate-850 text-slate-400 px-2 py-0.5 rounded-md">
              What • When • Why
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {decisionPlan.map((item) => {
              const isChecked = !!completedActions[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleAction(item.id)}
                  className={`border rounded-xl p-4 flex gap-4 cursor-pointer transition-all duration-300 select-none ${
                    isChecked
                      ? "border-emerald-900 bg-emerald-950/5 hover:bg-emerald-950/10 text-slate-300 opacity-60"
                      : "border-slate-900 bg-slate-950/20 hover:border-slate-850 hover:bg-slate-950/30"
                  }`}
                >
                  {/* Custom Checkbox */}
                  <div className="shrink-0 mt-0.5">
                    {isChecked ? (
                      <div className="h-5 w-5 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                        <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                      </div>
                    ) : (
                      getIcon(item.type)
                    )}
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    {/* Action Header */}
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500">
                        {item.tag}
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${isChecked ? "text-emerald-500" : "text-slate-300"}`}>
                        {item.time_display}
                      </span>
                    </div>
                    
                    {/* What */}
                    <h4 className={`text-xs font-bold ${isChecked ? "line-through text-slate-500" : "text-slate-200"}`}>
                      {item.title}
                    </h4>

                    {/* Why */}
                    <div className="flex gap-1 items-start mt-1 bg-slate-900/40 p-2 rounded-lg border border-slate-850/50">
                      <HelpCircle className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
                      <p className={`text-[10px] leading-relaxed ${isChecked ? "text-slate-600" : "text-slate-400"}`}>
                        <span className="font-semibold text-slate-400">Why:</span> {item.why}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>
    </main>
  );
}

// Inline Check SVG for checklist items
function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
