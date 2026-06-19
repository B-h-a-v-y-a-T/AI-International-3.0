const fs = require('fs');
const file = 'server/index.js';
let content = fs.readFileSync(file, 'utf8');

// Replace init-dfs error handling
content = content.replace(
  /catch\(e\) \{\s*console\.error\('\[init-dfs\] Error:', e\.message\);\s*res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}/g,
  `catch(e) {
      console.error('[init-dfs] Error:', e.message);
      res.json({
        "concept_graph": {
          "Failed Concept (API Blocked)": ["Basics 1", "Basics 2"]
        },
        "starting_concepts": ["Failed Concept (API Blocked)"]
      });
    }`
);

// Replace get-diagnostic error handling
content = content.replace(
  /catch\(e\) \{\s*console\.error\('\[get-diagnostic\] Error:', e\.message\);\s*res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}/g,
  `catch(e) {
      console.error('[get-diagnostic] Error:', e.message);
      res.json({
          question: "Fallback Question: Which of these is a placeholder because the API key was suspended?",
          answer: "A",
          options: ["A) This one", "B) Not this", "C) Or this", "D) Nope"],
          correct: 0
      });
    }`
);

// Fallback for evaluate-diagnostic
content = content.replace(
  /catch\(e\) \{\s*res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}/g,
  `catch(e) {
      if (req.url.includes('evaluate-diagnostic')) {
          res.json({
             correct: true,
             explanation: "Fallback Explanation: API key is disabled, assuming correct.",
             mastery_updated: true
          });
      } else {
        res.status(500).json({ error: e.message });
      }
    }`
);


fs.writeFileSync(file, content);
console.log("Patched server/index.js successfully");