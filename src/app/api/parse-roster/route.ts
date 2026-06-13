import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the endpoint runs on the Edge runtime if desired, or standard Node Serverless.
// We use standard serverless for buffer handling.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided in request." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "image/png";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only image files are supported." },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
      You are an expert scheduler and data extraction AI.
      Your task is to analyze the uploaded screenshot of a work shift roster or calendar.
      Extract all scheduled shifts for the user.
      
      Requirements:
      1. Identify dates and shift start/end times.
      2. If the year is not specified, assume the current year is 2026 (or derive from context).
      3. For each shift, output:
         - date: in YYYY-MM-DD format.
         - start_time: in HH:MM format (24-hour).
         - end_time: in HH:MM format (24-hour).
         - shift_name: a descriptive name (e.g. "Night Shift", "Amazon Voice Process", "Day Shift").
      
      Respond STRICTLY in JSON format with a root array named "shifts".
      Do not include markdown code block formatting (like \`\`\`json). Just the raw JSON.
      
      JSON Structure Example:
      {
        "shifts": [
          {
            "date": "2026-06-15",
            "start_time": "22:00",
            "end_time": "07:00",
            "shift_name": "Night Shift"
          }
        ]
      }
    `;

    const contentsPayload = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ];

    const generationConfig = {
      responseMimeType: "application/json",
    };

    let result;
    const modelCandidates = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Attempting OCR with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent({
          contents: contentsPayload,
          generationConfig,
        });
        if (result) {
          console.log(`OCR parsing succeeded with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.error(`Model ${modelName} failed:`, err);
        lastError = err;
      }
    }

    if (!result) {
      throw new Error(
        `Gemini API is currently overloaded or key has restricted access. Last error: ${lastError?.message || "Unknown error"}`
      );
    }

    let textResponse = result.response.text().trim();
    
    // Strip markdown code block wrappers if they were returned anyway
    if (textResponse.startsWith("```")) {
      textResponse = textResponse.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsedData = JSON.parse(textResponse);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Roster parsing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process roster image." },
      { status: 500 }
    );
  }
}
