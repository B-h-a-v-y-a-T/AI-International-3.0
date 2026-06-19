const fs = require('fs');
const content = fs.readFileSync('server/admin-quiz-engine.js', 'utf8');
const startMatch = content.indexOf('const QUESTION_BANK = {');
let start = startMatch + 'const QUESTION_BANK = '.length;
let braceCount = 0;
let end = start;
let started = false;
for (let i = start; i < content.length; i++) {
  if (content[i] === '{') { braceCount++; started = true; }
  else if (content[i] === '}') { braceCount--; }
  
  if (started && braceCount === 0) {
    end = i + 1;
    break;
  }
}
try {
  // Safe evaluation instead of tricky JSON parsing since keys might not be quoted initially
  const rawObj = eval('(' + content.substring(start, end) + ')');
  const db = { questions: [], meta: {} };
  
  for (const subjectOrTopic in rawObj) {
     const arr = rawObj[subjectOrTopic];
     for (const q of arr) {
        const id = q.id || 'qb-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const options = q.options || [];
        const correctIndex = q.correctIndex || 0;
        const correctAnswer = options[correctIndex] || '';
        
        db.questions.push({
           id,
           subject: q.subject || 'general',
           topic: q.topic || subjectOrTopic,
           difficulty: q.difficulty || 'medium',
           question: q.question,
           options,
           correctAnswer,
           correctIndex, // Preserved for compatibility
           explanation: q.explanation || ''
        });
        
        db.meta[id] = {
           usageCount: 0,
           successRate: 0,
           avgTime: 0,
           lastUsed: null
        };
     }
  }
  
  fs.writeFileSync('server/data/question-bank.json', JSON.stringify(db, null, 2));
  console.log('Successfully extracted ' + db.questions.length + ' questions into question-bank.json');
} catch (e) {
  console.error('Eval error: ', e);
}
