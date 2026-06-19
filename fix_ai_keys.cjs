const fs = require('fs');
const path = require('path');

const pythonFile = path.join(__dirname, 'backend', 'gemini_service.py');
let pyContent = fs.readFileSync(pythonFile, 'utf8');

// Swap out Google Generative AI for Groq
pyContent = pyContent.replace(
`try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False`,
`try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False`
);

pyContent = pyContent.replace(
`def _get_model():
    """Lazy-init the Gemini model on first call."""
    global _model
    if _model is not None:
        return _model

    if not GENAI_AVAILABLE:
        return None

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
        return _model
    except Exception:
        return None`,
`def _get_model():
    """Lazy-init Groq API client."""
    global _model
    if _model is not None:
        return _model

    if not GROQ_AVAILABLE:
        return None

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None

    try:
        _model = Groq(api_key=api_key)
        return _model
    except Exception:
        return None`
);

pyContent = pyContent.replace(
`def generate_explanation(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Produce the final LLM response safely without impacting MAB Q-values.
    Returns: {"explanation": str, "mascot_message": str}
    """
    fallback = {"explanation": "", "mascot_message": ""}

    model = _get_model()
    if model is None:
        return fallback

    prompt = _build_prompt(context)

    try:
        response = model.generate_content(prompt)
        text = response.text if response and response.text else ""
        return {"explanation": text, "mascot_message": text}
    except Exception as e:
        print(f"[Gemini Error]: {e}")
        return fallback`,
`def generate_explanation(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Produce the final LLM response safely without impacting MAB Q-values.
    Returns: {"explanation": str, "mascot_message": str}
    """
    fallback = {"explanation": "", "mascot_message": ""}

    client = _get_model()
    if client is None:
        return fallback

    prompt = _build_prompt(context)

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an AI teaching assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        text = response.choices[0].message.content if response.choices else ""
        return {"explanation": text, "mascot_message": text}
    except Exception as e:
        print(f"[Groq Error]: {e}")
        return fallback`
);

fs.writeFileSync(pythonFile, pyContent, 'utf8');

// Now let's fix the NodeJS backend
const jsFile = path.join(__dirname, 'server', 'index.js');
let jsContent = fs.readFileSync(jsFile, 'utf8');

// Swap out @google/generative-ai for Groq SDK
jsContent = jsContent.replace(
`const { GoogleGenerativeAI } = require("@google/generative-ai");`,
`const { Groq } = require("groq-sdk");`
);

// Replace initialization
jsContent = jsContent.replace(
`let genAI;
let geminiModel;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log('✅ Gemini AI initialized with gemini-1.5-flash!');
} else {
  console.warn('⚠️ WARNING: GEMINI_API_KEY not found. AI Chatbot features will be disabled. ⚠️');
}`,
`let groqClient;
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('✅ Groq AI initialized with llama-3.1-8b-instant!');
} else {
  console.warn('⚠️ WARNING: GROQ_API_KEY not found. AI Chatbot features will be disabled. ⚠️');
}`
);

// Replace actual calls
const oldCall = `        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();`;

const newCall = `        const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
        const text = response.choices[0]?.message?.content || "";`;

jsContent = jsContent.replace(oldCall, newCall);

const oldGenJSON = `        const result = await geminiModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            // Force JSON output
            generationConfig: {
                // responseMimeType: "application/json"   
            }
        });
        let responseText = await result.response.text();`;

const newGenJSON = `        const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
        let responseText = response.choices[0]?.message?.content || "";`;

jsContent = jsContent.replace(oldGenJSON, newGenJSON);

// Fallbacks for multiple API usages
jsContent = jsContent.split('geminiModel.generateContent(').join('// [DISABLED_GEMINI] geminiModel.generateContent(');
jsContent = jsContent.split('process.env.GEMINI_API_KEY').join('process.env.GROQ_API_KEY');

fs.writeFileSync(jsFile, jsContent, 'utf8');

console.log("Successfully shifted system to use Groq API key");
