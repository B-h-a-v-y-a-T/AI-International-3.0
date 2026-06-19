const fs = require('fs');
const path = require('path');

const jsFile = path.join(__dirname, 'server', 'index.js');
let jsContent = fs.readFileSync(jsFile, 'utf8');

// The replacement logic: Convert Gemini code wrapper back properly then Groq it
jsContent = jsContent.replace(/const result = await \/\/ \[DISABLED_GEMINI\]\s*geminiModel\.generateContent\(prompt\);\n\s*preview = \(result\.response\.text\(\) \|\| ''\)\.trim\(\);/gs, 
`const result = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
        preview = (result.choices[0]?.message?.content || '').trim();`);

jsContent = jsContent.replace(/const result = await \/\/ \[DISABLED_GEMINI\]\s*geminiModel\.generateContent\(prompt\);\n\s*const raw = result\.response\.text\(\);/gs,
`const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
          });
          const raw = response.choices[0]?.message?.content || '';`);

jsContent = jsContent.replace(/const result = await \/\/ \[DISABLED_GEMINI\]\s*geminiModel\.generateContent\(prompt\);\n\s*let text = result\.response\.text\(\)\.trim\(\);/gs,
`const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      let text = (response.choices[0]?.message?.content || '').trim();`);

jsContent = jsContent.replace(/const result = await \/\/ \[DISABLED_GEMINI\]\s*geminiModel\.generateContent\(prompt\);\n\s*res\.json\(\{ errorType: result\.response\.text\(\)\.trim\(\) \}\);/g,
`const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      res.json({ errorType: (response.choices[0]?.message?.content || '').trim() });`);


jsContent = jsContent.replace(/const result = await \/\/ \[DISABLED_GEMINI\]\s*geminiModel\.generateContent\(prompt\);\n\s*const lesson = result\.response\.text\(\)\.trim\(\);/g,
`const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      const lesson = (response.choices[0]?.message?.content || '').trim();`);


jsContent = jsContent.replace(/const result = await \/\/ \[DISABLED_GEMINI\]\s*geminiModel\.generateContent\(prompt\);\n\s*const responseText = result\.response\.text\(\);/gs,
`const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      const responseText = response.choices[0]?.message?.content || "";`);

// And for the timeout promise code block:
jsContent = jsContent.replace(/const geminiPromise = \/\/ \[DISABLED_GEMINI\]\s*geminiModel\.generateContent\(fullPrompt\);\n\s*const timeoutPromise = new Promise\(\(_, reject\) => setTimeout\(\(\) => reject\(new Error\('Gemini timeout'\)\), 8000\)\);\n\s*const result = await Promise\.race\(\[geminiPromise, timeoutPromise\]\);\n\n\s*const raw = result\.response\.text\(\)\.trim\(\);/gs,
`const groqPromise = groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: fullPrompt }]
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 8000));
        const response = await Promise.race([groqPromise, timeoutPromise]);
        const raw = (response.choices[0]?.message?.content || '').trim();`);

jsContent = jsContent.replace(/if \(!geminiModel\)/g, "if (!groqClient)");

// Overwrite the initial genAI declaration explicitly if there are remnants
jsContent = jsContent.replace(/let groqClient;\nif \(process\.env\.GROQ_API_KEY\) \{.*?\}/s,
`let groqClient;
if (process.env.GROQ_API_KEY) {
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq AI initialized with llama-3.1-8b-instant!');
  } catch(e) {
    console.error("Groq init failed", e);
  }
} else {
  console.warn('⚠️ WARNING: GROQ_API_KEY not found. AI Chatbot features will be disabled. ⚠️');
}`);

fs.writeFileSync(jsFile, jsContent, 'utf8');
console.log("Replaced Groq strings in index.js");

const pyFile = path.join(__dirname, 'backend', 'gemini_service.py');
let pyContent = fs.readFileSync(pyFile, 'utf8');
pyContent = pyContent.replace('def generate_explanation(context: Dict[str, Any]) -> Dict[str, Any]:', 
`def generate_explanation(context: Dict[str, Any]) -> Dict[str, Any]:
    global _model
    if not _model:
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key:
            from groq import Groq
            _model = Groq(api_key=api_key)
            
    fallback = {"explanation": "", "mascot_message": ""}
    if not _model: return fallback
    prompt = _build_prompt(context)
    try:
        res = _model.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600
        )
        text = res.choices[0].message.content if res.choices else ""
        return {"explanation": text, "mascot_message": text}
    except Exception as e:
        print(f"[Groq Error]: {e}")
        return fallback

def _old_generate_explanation(context: Dict[str, Any]) -> Dict[str, Any]:`);
fs.writeFileSync(pyFile, pyContent, 'utf8');
console.log("Replaced Groq strings in gemini_service.py");
