import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Read API key from .env.local
const envContent = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const match = envContent.match(/GEMINI_API_KEY=["']?([^"'\s]+)["']?/);
const apiKey = match ? match[1] : null;

if (!apiKey) {
  console.error("No API key found in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const models = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-1.5-pro"
];

async function runTest() {
  for (const modelName of models) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: 'Respond with a JSON object containing a greeting key: {"greeting": "hello"}.'
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      console.log(`Success for ${modelName}! Response:\n${result.response.text().trim()}`);
    } catch (err) {
      console.error(`Error for ${modelName}:`, err.message);
    }
  }
}

runTest();
