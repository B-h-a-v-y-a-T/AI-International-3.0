const fs = require('fs');
const path = require('path');

const jsFile = path.join(__dirname, 'server', 'index.js');
let jsContent = fs.readFileSync(jsFile, 'utf8');

// Wipe the `let geminiModel;` block and `initGemini()` thoroughly
jsContent = jsContent.replace(/let genAI = null;\nlet geminiModel = null;\n\nasync function initGemini\(\) \{[\s\S]*?initGemini\(\)\.catch\(\(\) => \{ \}\);/m, 
`let groqClient = null;
async function initGroq() {
  if (!process.env.GROQ_API_KEY) {
    console.log('⚠️ GROQ_API_KEY not set — using offline emotional-support fallback.');
    return;
  }
  const { Groq } = require("groq-sdk");
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('✅ Groq AI initialized with llama-3.1-8b-instant!');
}
initGroq().catch(() => {});`);

// Replace all instances of `if (geminiModel)` with `if (groqClient)`
jsContent = jsContent.replace(/if\s*\(\s*geminiModel\s*\)/g, 'if (groqClient)');

// Replace `gemini: !!geminiModel`
jsContent = jsContent.replace(/gemini:\s*!!geminiModel/g, 'ai: !!groqClient');

// Replace `geminiModel = null;` inside error handler
jsContent = jsContent.replace(/geminiModel\s*=\s*null;/g, 'groqClient = null;');

// Replace Chatbot print mode
jsContent = jsContent.replace(/\$\{geminiModel \? 'Gemini AI' : 'Rule-based fallback'\}/g, "${groqClient ? 'Groq AI' : 'Rule-based fallback'}");

// Replace `const GoogleGenerativeAI` 
jsContent = jsContent.replace(/const \{ GoogleGenerativeAI \} = require\("@google\/generative-ai"\);/g, `const { Groq } = require("groq-sdk");`);

// Replace `GEMINI_KEY` instances
jsContent = jsContent.replace(/GEMINI_KEY/g, "process.env.GROQ_API_KEY");

fs.writeFileSync(jsFile, jsContent, 'utf8');
console.log("Deep cleaned GEMINI traces from Node backend.");
