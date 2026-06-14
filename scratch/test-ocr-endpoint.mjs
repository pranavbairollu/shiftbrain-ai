import fs from "fs";
import path from "path";

async function testOCR() {
  const imagePath = "C:\\Users\\Pranav Bairollu\\.gemini\\antigravity-ide\\brain\\8d7ae352-40de-465f-b732-57cc526b22f3\\concentrix_excel_roster_1781352276484.png";
  if (!fs.existsSync(imagePath)) {
    console.error("Image file does not exist at:", imagePath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: "image/png" });
  formData.append("file", blob, "roster.png");

  console.log("Sending POST request to http://localhost:3000/api/parse-roster...");
  try {
    const response = await fetch("http://localhost:3000/api/parse-roster", {
      method: "POST",
      body: formData,
    });

    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error during fetch:", err);
  }
}

testOCR();
