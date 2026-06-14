import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

function repairJson(jsonStr: string) {
  jsonStr = jsonStr.trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Continue to repair
  }

  let message = "ShiftBuddy is here to help.";
  const messageRegex = /"message"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/;
  const match = jsonStr.match(messageRegex);
  if (match) {
    message = match[1];
  } else {
    const partialMessageRegex = /"message"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)$/;
    const partialMatch = jsonStr.match(partialMessageRegex);
    if (partialMatch) {
      message = partialMatch[1] + "...";
    }
  }

  const actions: any[] = [];
  const actionsStartMatch = jsonStr.match(/"actions"\s*:\s*\[/);
  if (actionsStartMatch) {
    const startIndex = (actionsStartMatch.index || 0) + actionsStartMatch[0].length;
    const actionsPart = jsonStr.substring(startIndex);
    
    let currentObjectStr = "";
    let openBraces = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < actionsPart.length; i++) {
      const char = actionsPart[i];
      if (escape) {
        currentObjectStr += char;
        escape = false;
        continue;
      }
      if (char === "\\") {
        currentObjectStr += char;
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        currentObjectStr += char;
        continue;
      }
      if (inString) {
        currentObjectStr += char;
        continue;
      }

      if (char === '{') {
        openBraces++;
        currentObjectStr += char;
      } else if (char === '}') {
        openBraces--;
        currentObjectStr += char;
        if (openBraces === 0) {
          try {
            const obj = JSON.parse(currentObjectStr);
            actions.push(obj);
          } catch (e) {
            console.error("Failed to parse individual action object:", currentObjectStr, e);
          }
          currentObjectStr = "";
        }
      } else if (openBraces > 0) {
        currentObjectStr += char;
      } else if (char === ']') {
        break;
      }
    }
  }

  return {
    message,
    actions
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const userName = context?.userName || "Pranav";
    const activeShift = context?.activeShift;
    const sleepDebt = context?.sleepDebt || 0;
    const netHoursAwake = context?.netHoursAwake || 0;
    const sleepLogs = context?.sleepLogs || [];
    const sleepGoal = context?.sleepGoal || "8.0";
    
    let shiftContext = "No active shift is currently configured.";
    if (activeShift) {
      if (activeShift.is_off_day) {
        shiftContext = `Today is an off/rest day. Focus mode: ${activeShift.off_day_mode || "recovery"}.`;
      } else {
        shiftContext = `Active shift: "${activeShift.shift_name}" on date ${activeShift.date} starting at ${activeShift.start_time} and ending at ${activeShift.end_time} with a ${activeShift.commute_mins || 60}m commute.`;
      }
    }
    
    let sleepContext = `Current sleep debt: ${sleepDebt.toFixed(1)} hours. Continuous hours awake: ${netHoursAwake.toFixed(1)}h. Sleep baseline target: ${sleepGoal}h daily.`;
    if (sleepLogs.length > 0) {
      const formattedLogs = sleepLogs.slice(0, 3).map((l: any) => {
        return `${l.duration}h sleep (quality score: ${l.quality === 9 ? "good" : "restless"})`;
      }).join("; ");
      sleepContext += ` Recent sleep logs: ${formattedLogs}.`;
    }

    const systemPrompt = `You are "ShiftBuddy", the biological co-pilot and schedule action engine of ShiftBrain AI, customized for ${userName}, a 20-year-old Concentrix BPO employee (Amazon Voice night shift).

You analyze user messages and output BOTH a supportive, brief conversational message and a list of structured actions to modify their ShiftBrain dashboard.

Current User Context:
- User Profile Name: ${userName}
- Shift State: ${shiftContext}
- Circadian & Sleep Telemetry: ${sleepContext}

CRITICAL: Output must be extremely concise to fit token limit. Return at most ONE action in the actions array. Keep message under 10 words. Keep descriptions under 6 words.

Your response must strictly match this JSON schema:
{
  "message": "Friendly, direct, under 10 words advising what you are doing.",
  "actions": [
    {
      "type": "UPDATE_SHIFT" | "LOG_SLEEP" | "RESCHEDULE_STUDY" | "SWITCH_OFFDAY_MODE" | "TOGGLE_TASK" | "ADD_NOTE" | "CREATE_CUSTOM_BLOCK",
      "payload": { ... },
      "requires_approval": true | false
    }
  ]
}

Action Rules & Payloads:
1. UPDATE_SHIFT: payload: { date?: string, start_time?: string, end_time?: string, shift_name?: string, commute_mins?: number, is_off_day?: boolean }. Set requires_approval to true.
2. LOG_SLEEP: payload: { duration: number, wakeTime: string (ISO timestamp), dateString: string, quality: 9 (good) | 5 (restless) }. Set requires_approval to true.
3. RESCHEDULE_STUDY: payload: { study_start: string (HH:MM), study_duration: number (minutes) }. Set requires_approval to true.
4. SWITCH_OFFDAY_MODE: payload: { off_day_mode: "recovery" | "growth" | "fitness" | "social" | "reset" }. Set requires_approval to true.
5. TOGGLE_TASK: payload: { id: string, completed: boolean }. Set requires_approval to false.
6. ADD_NOTE: payload: { text: string (under 6 words), category: string (Recovery/Growth/Fitness/Social/Reset) }. Set requires_approval to false.
7. CREATE_CUSTOM_BLOCK: payload: { id: string, title: string, time_display: string, time_sort: string (ISO), description: string (under 6 words), tag: string }. Set requires_approval to true.

Strict Guidelines:
- If sleep debt is > 6 hours, advise against heavy upskilling/coding blocks. Reschedule study time, or add a note.
- For night shifts, protect day sleep. Suggest pre-shift naps.
- Suggest local BPO context where helpful (chai cutoffs, etc).
- Always return clean JSON. Do not output anything outside the JSON.`;

    // Map conversation history
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    let result;
    const modelCandidates = ["gemini-3.5-flash", "gemini-2.5-flash"];
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Attempting chat generation with model: ${modelName}`);
        const chatModel = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemPrompt
        });
        result = await chatModel.generateContent({
          contents: contents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7, // Set temperature to 0.7 for natural phrasing
            responseMimeType: "application/json",
          }
        });
        if (result) {
          console.log(`Chat generation succeeded with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.error(`Chat model ${modelName} failed:`, err);
        lastError = err;
      }
    }

    if (!result) {
      throw new Error(`All Gemini chat models failed. Last error: ${lastError?.message}`);
    }

    let responseText = result.response.text().trim();
    console.log("ShiftBuddy Raw Response:", responseText);

    // Strip markdown code block wrappers if returned
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const parsed = repairJson(responseText);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ 
      message: "Sorry, I had trouble parsing the data. Can you try again?",
      actions: [] 
    });
  }
}
