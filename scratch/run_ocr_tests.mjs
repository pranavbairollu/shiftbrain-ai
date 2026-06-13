import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure environment variable is set
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const TEST_DIR = "./scratch/test-rosters";
const GROUND_TRUTH_PATH = "./scratch/ground_truth.json";
const REPORT_PATH = "./scratch/benchmark_report.md";

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

async function runOCRTest() {
  console.log("🚀 Starting ShiftBrain AI OCR Parsing Benchmark...");

  // Create test directories if not exist
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    console.log(`📁 Created test directory: ${TEST_DIR}`);
    console.log("👉 Please drop your 20 test screenshots into this folder.");
  }

  // Create placeholder ground truth file if not exists
  if (!fs.existsSync(GROUND_TRUTH_PATH)) {
    const defaultGroundTruth = {
      "sample-roster.png": [
        {
          date: "2026-06-15",
          start_time: "22:00",
          end_time: "07:00",
          shift_name: "Amazon Voice Process"
        }
      ]
    };
    fs.writeFileSync(GROUND_TRUTH_PATH, JSON.stringify(defaultGroundTruth, null, 2));
    console.log(`📝 Created default ground truth template at: ${GROUND_TRUTH_PATH}`);
  }

  // Read ground truth
  let groundTruth = {};
  try {
    groundTruth = JSON.parse(fs.readFileSync(GROUND_TRUTH_PATH, "utf8"));
  } catch (err) {
    console.error("❌ Error parsing ground truth JSON:", err.message);
    process.exit(1);
  }

  const imageFiles = fs.readdirSync(TEST_DIR).filter(file => 
    [".png", ".jpg", ".jpeg", ".webp"].includes(path.extname(file).toLowerCase())
  );

  if (imageFiles.length === 0) {
    console.log("\n⚠️ No test images found in './scratch/test-rosters/'.");
    console.log("Place your BPO roster screenshots there and structure their ground truth in 'ground_truth.json'.");
    process.exit(0);
  }

  console.log(`📊 Found ${imageFiles.length} image files to test.`);

  let totalImages = imageFiles.length;
  let parseSuccesses = 0;
  let totalGroundTruthShifts = 0;
  let dateMatches = 0;
  let timeMatches = 0;
  let totalProcessingTimeMs = 0;
  
  const results = [];

  for (const filename of imageFiles) {
    console.log(`\n🔍 Parsing [${filename}]...`);
    const imagePath = path.join(TEST_DIR, filename);
    const base64Data = fs.readFileSync(imagePath).toString("base64");
    const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";

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
    `;

    const expected = groundTruth[filename] || [];
    totalGroundTruthShifts += expected.length;

    const startTime = Date.now();
    let apiSuccess = false;
    let actualShifts = [];
    let errorMsg = null;

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              },
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.response.text();
      const data = JSON.parse(responseText);
      actualShifts = data.shifts || [];
      apiSuccess = true;
      parseSuccesses++;
    } catch (err) {
      errorMsg = err.message;
      console.error(`❌ Failed parsing ${filename}:`, errorMsg);
    }

    const duration = Date.now() - startTime;
    totalProcessingTimeMs += duration;

    // Compare actual against expected
    let imgDateCorrect = 0;
    let imgTimeCorrect = 0;

    actualShifts.forEach(act => {
      // Find matching shift in expected by date
      const match = expected.find(exp => exp.date === act.date);
      if (match) {
        imgDateCorrect++;
        if (match.start_time === act.start_time && match.end_time === act.end_time) {
          imgTimeCorrect++;
        }
      }
    });

    dateMatches += imgDateCorrect;
    timeMatches += imgTimeCorrect;

    results.push({
      filename,
      expectedCount: expected.length,
      extractedCount: actualShifts.length,
      success: apiSuccess,
      duration,
      dateAccuracy: expected.length > 0 ? (imgDateCorrect / expected.length) * 100 : 0,
      timeAccuracy: expected.length > 0 ? (imgTimeCorrect / expected.length) * 100 : 0,
      errorMsg
    });

    console.log(`⏱️ Duration: ${duration}ms | Extracted: ${actualShifts.length}/${expected.length} shifts`);
  }

  // Aggregate Metrics
  const avgDuration = totalProcessingTimeMs / totalImages;
  const extractionSuccessRate = (parseSuccesses / totalImages) * 100;
  const overallDateAccuracy = totalGroundTruthShifts > 0 ? (dateMatches / totalGroundTruthShifts) * 100 : 0;
  const overallTimeAccuracy = totalGroundTruthShifts > 0 ? (timeMatches / totalGroundTruthShifts) * 100 : 0;

  // Build Markdown Report
  let mdReport = `# ShiftBrain AI OCR Parser Benchmark Report\n\n`;
  mdReport += `Generated on: ${new Date().toISOString()}\n\n`;
  mdReport += `## Summary Metrics\n\n`;
  mdReport += `| Metric | Value |\n`;
  mdReport += `| :--- | :--- |\n`;
  mdReport += `| **Total Test Images** | ${totalImages} |\n`;
  mdReport += `| **JSON Extraction Rate** | ${extractionSuccessRate.toFixed(1)}% |\n`;
  mdReport += `| **Date Accuracy (Matching Ground Truth)** | ${overallDateAccuracy.toFixed(1)}% |\n`;
  mdReport += `| **Time Accuracy (Matching Ground Truth)** | ${overallTimeAccuracy.toFixed(1)}% |\n`;
  mdReport += `| **Average Latency** | ${avgDuration.toFixed(0)}ms |\n\n`;

  mdReport += `## Detailed Results\n\n`;
  mdReport += `| Filename | Status | Target Shifts | Parsed Shifts | Date Acc | Time Acc | Speed |\n`;
  mdReport += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  results.forEach(res => {
    mdReport += `| ${res.filename} | ${res.success ? "✅ Success" : "❌ Error"} | ${res.expectedCount} | ${res.extractedCount} | ${res.dateAccuracy.toFixed(0)}% | ${res.timeAccuracy.toFixed(0)}% | ${res.duration}ms |\n`;
  });

  fs.writeFileSync(REPORT_PATH, mdReport);

  console.log("\n📊 --- BENCHMARK COMPLETE ---");
  console.log(`Overall Extraction Success Rate: ${extractionSuccessRate.toFixed(1)}%`);
  console.log(`Overall Date Accuracy: ${overallDateAccuracy.toFixed(1)}%`);
  console.log(`Overall Time Accuracy: ${overallTimeAccuracy.toFixed(1)}%`);
  console.log(`Average Latency: ${avgDuration.toFixed(0)}ms`);
  console.log(`📝 Detailed markdown report saved to: ${REPORT_PATH}`);
}

runOCRTest();
