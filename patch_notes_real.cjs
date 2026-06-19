const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'server', 'index.js');
let content = fs.readFileSync(targetFile, 'utf8');

const apiString = `
// === QUICK REVISION NOTES API ===
app.post('/api/notes/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required for summarization.' });
    }

    if (!geminiModel) {
      return res.status(503).json({ error: 'AI summarization unavailable.' });
    }

    const prompt = \`Summarize the following notes into concise bullet points for quick revision.

    Notes:
    \${text}\`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ summary: responseText });
  } catch (error) {
    console.error("Summarization error:", error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// === PERSONALIZED QUIZ FROM NOTES API ===
app.post('/api/notes/quiz', async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes || notes.trim() === '') {
      return res.status(400).json({ error: 'Notes are required.' });
    }

    if (!geminiModel) {
      return res.status(503).json({ error: 'AI quiz generation unavailable.' });
    }

    const prompt = \`Create a strict JSON array of 5 multiple-choice questions based on the notes.
    Response MUST be valid JSON only.
    Format requirements for each question object:
    [
      {
        "question": "The question text",
        "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
        "answer": 0,
        "explanation": "Short explanation"
      }
    ]

    Notes:
    \${notes}\`;

    const result = await geminiModel.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/^\`\`\`json\\n|\\n\`\`\`$/g, '');
    } else if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.replace(/^\`\`\`\\n|\\n\`\`\`$/g, '');
    }

    try {
      const quizQuestions = JSON.parse(responseText);
      res.json({ questions: quizQuestions });
    } catch (parseError) {
      console.error("Failed to parse JSON quiz:", responseText);
      res.status(500).json({ error: 'Failed to parse AI quiz response as JSON.' });
    }
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

// Error handler
`;

if (!content.includes('/api/notes/summarize')) {
    content = content.replace('// Error handler', apiString);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("Successfully patched server/index.js");
} else {
    console.log("Already patched");
}
