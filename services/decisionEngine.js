// const { GoogleGenAI } = require("@google/genai");

// exports.getGeminiDecision = async (data) => {
//   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//   const prompt = `
// You are an AI assistant that detects whether a user needs support while filling out a form or interacting with a system.

// Analyze the user interaction metrics and determine:
// 1. Whether the user likely needs support
// 2. The type of support needed
// 3. An overall difficulty score (0-100)

// Metrics:
// - Time on step: ${data?.timeOnStep} seconds
// - Backspace count: ${data?.backspaceCount}
// - Idle seconds: ${data?.idleSeconds}
// - Navigation loops: ${data?.navLoops}
// - Failed validations: ${data?.failedValidations}
// - Field revisits: ${data?.fieldRevisits}
// - Cursor hesitations: ${data?.cursorHesitations}
// - Rapid clicks: ${data?.rapidClicks}

// Support Types:
// - "G" = General confusion
// - "S" = Struggling with validation/errors
// - "N" = Navigation difficulty
// - "H" = Hesitation or uncertainty
// - null = No support needed

// Rules:
// - The decision MUST be based completely on behavioral analysis.

// Respond ONLY with valid JSON in this exact structure:
// {
//   "needSupport": boolean,
//   "type": "G" | "S" | "N" | "H" | null,
//   "score": number
// }
// `;

//   const response = await fetch(
//     `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: prompt }],
//           },
//         ],
//       }),
//     },
//   );

//   const result = await response.json();

//   if (result?.error) {
//     console.log(result?.error?.message);
//   }

//   const text = result.candidates[0].content.parts[0].text;

//   // Convert string → JSON safely
//   try {
//     return JSON.parse(text);
//   } catch (err) {
//     console.log("API Error:", err);
//     return { needSupport: false, type: null, score: 0 };
//   }
// };


const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Gemini client helper
const geminiAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Build prompt (same for both models)
const buildPrompt = (data) => `
You are an AI assistant that detects whether a user needs support while filling out a form or interacting with a system.

Analyze the user interaction metrics and determine:
1. Whether the user likely needs support
2. The type of support needed
3. An overall difficulty score (0-100)

Metrics:
- Time on step: ${data?.timeOnStep} seconds
- Backspace count: ${data?.backspaceCount}
- Idle seconds: ${data?.idleSeconds}
- Navigation loops: ${data?.navLoops}
- Failed validations: ${data?.failedValidations}
- Field revisits: ${data?.fieldRevisits}
- Cursor hesitations: ${data?.cursorHesitations}
- Rapid clicks: ${data?.rapidClicks}

Support Types:
- "G" = General confusion
- "S" = Struggling with validation/errors
- "N" = Navigation difficulty
- "H" = Hesitation or uncertainty
- null = No support needed

Respond ONLY in JSON:
{
  "needSupport": boolean,
  "type": "G" | "S" | "N" | "H" | null,
  "score": number
}
`;

// Helpers
const cleanJSON = (text) => {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
};

const parseSafe = (text) => {
  try {
    return JSON.parse(cleanJSON(text));
  } catch {
    return null;
  }
};

// Gemini call
const callGemini = async (prompt) => {
  const response = await fetch(
    `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const result = await response.json();

  if (result?.error) throw new Error(result.error.message);

  const text = result.candidates[0].content.parts[0].text;

  const parsed = parseSafe(text);
  if (!parsed) throw new Error("Invalid Gemini JSON");

  return parsed;
};

// GPT call
const callGPT = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0].message.content;

  const parsed = parseSafe(text);
  if (!parsed) throw new Error("Invalid GPT JSON");

  return parsed;
};

// Random model selector
const pickModel = () => {
  return Math.random() < 0.5 ? "gemini" : "gpt";
};

// MAIN SERVICE
exports.getDecision = async (data) => {
  const prompt = buildPrompt(data);

  const primary = pickModel();
  const fallback = primary === "gemini" ? "gpt" : "gemini";

  let result;

  // TRY PRIMARY
  try {
    if (primary === "gemini") {
      result = await callGemini(prompt);
    } else {
      result = await callGPT(prompt);
    }

    return {
      ...result,
      modelUsed: primary,
    };
  } catch (err) {
    console.log(`Primary model failed (${primary}):`, err.message);

    // TRY FALLBACK
    try {
      if (fallback === "gemini") {
        result = await callGemini(prompt);
      } else {
        result = await callGPT(prompt);
      }

      return {
        ...result,
        modelUsed: fallback,
        fallbackUsed: true,
      };
    } catch (err2) {
      console.log("Fallback also failed:", err2.message);

      // FINAL SAFE RESPONSE
      return {
        needSupport: false,
        type: null,
        score: 0,
        modelUsed: "none",
        error: "Both models failed",
      };
    }
  }
};