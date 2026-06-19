const fs = require('fs');

const idxPath = 'server/index.js';
let code = fs.readFileSync(idxPath, 'utf8');

const regex = /\/\/ ── Main chat endpoint ────────────────────────────────────────────────────────\r?\napp\.post\('\/api\/chat', async \(req, res\) => \{[\s\S]+?\}\);\r?\n\r?\n\/\/ Emotion detection \(standalone\)/;

const newChatPost = `// ── Main chat endpoint ────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [], userMood = null, language = 'English' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    // Note: Node 18+ has native fetch. If it fails, we fall back.
    const pythonRes = await fetch('http://127.0.0.1:8050/process_student_input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        performance: { 'Math': 0.8 },
        previous_performance: { 'Math': 0.6 }
      })
    });
    
    if (!pythonRes.ok) {
        throw new Error('Python backend error: ' + pythonRes.status);
    }

    const data = await pythonRes.json();
    
    const replyStr = \`\${data.mascot_message}\n\n**Insights:**\n\${data.explanation}\n\n*Action: \${data.selected_action} | Difficulty: \${data.difficulty} | Reward: \${data.reward}* \n\n*Weak concepts detected: \${data.weak_concepts.join(', ')}*\`;
    
    return res.json({
      emotion: data.mood,
      reply: replyStr,
      sentimentScore: 0,
      source: 'python_fastapi',
      videos: []
    });
  } catch (err) {
    console.error('Python backend proxy error:', err.message);
    return res.status(500).json({ error: 'Failed to connect to Python backend. Ensure Python uvicorn server is running on 8050.' });
  }
});

// Emotion detection (standalone)`;

const newCode = code.replace(regex, newChatPost);

if(newCode === code) {
    console.log("Regex didn't match.");
} else {
    fs.writeFileSync(idxPath, newCode);
    console.log("Patched successfully!");
}