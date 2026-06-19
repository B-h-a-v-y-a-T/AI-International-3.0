# Quick Start Guide - Database & Adaptive Learning

## ✅ Everything is Already Working!

The database and adaptive learning features are **already active** and working in the background. No setup needed!

---

## 🚀 What's Happening Automatically

### 1. Every Chat Message
- ✅ Logged to database
- ✅ Sentiment analyzed
- ✅ Risk score updated
- ✅ Adaptive tone calculated

### 2. After Each Quiz
- ✅ Results stored
- ✅ Weak topics identified
- ✅ Learning strategy adapted
- ✅ Difficulty adjusted

### 3. Continuous Monitoring
- ✅ Performance trends tracked
- ✅ Improvement monitored
- ✅ Risk factors detected
- ✅ Teaching approach optimized

---

## 📊 How to View Analytics (Optional)

### Option 1: Use API Endpoints

```bash
# Get learning recommendations
curl http://localhost:8050/learning_recommendations/student_123

# Get user analytics
curl http://localhost:8050/user_analytics/student_123
```

### Option 2: Use Python

```python
import db_helpers as dbh

# Get weak topics
weak_topics = dbh.get_weak_topics_for_user("student_123")
print(f"Weak topics: {weak_topics}")

# Get recommendations
recommendations = dbh.get_learning_recommendations("student_123")
print(recommendations)

# Get full analytics
analytics = dbh.get_user_analytics("student_123")
print(analytics)
```

---

## 🎯 How to Log Quiz Results

### From Frontend (JavaScript)

```javascript
async function logQuizResults(userId, quizId, results) {
    await fetch('http://localhost:8050/log_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            quiz_id: quizId,
            results: results
        })
    });
}

// Example usage
logQuizResults('student_123', 'quiz_001', [
    {
        topic: 'calculus',
        question: 'What is the derivative of x^2?',
        user_answer: '2x',
        correct_answer: '2x',
        is_correct: true
    },
    {
        topic: 'calculus',
        question: 'What is the integral of 2x?',
        user_answer: 'x^2',
        correct_answer: 'x^2 + C',
        is_correct: false
    }
]);
```

### From Backend (Python)

```python
import db_helpers as dbh

results = [
    {
        'topic': 'calculus',
        'question': 'What is the derivative of x^2?',
        'user_answer': '2x',
        'correct_answer': '2x',
        'is_correct': True
    }
]

dbh.log_quiz_completion('student_123', 'quiz_001', results)
```

---

## 🔍 Check What's Being Tracked

### View Database

```bash
cd backend
sqlite3 edtech.db

# View users
SELECT * FROM users;

# View performance
SELECT * FROM performance_data;

# View recent chats
SELECT * FROM chat_logs ORDER BY timestamp DESC LIMIT 10;

# View risk states
SELECT * FROM risk_state;
```

---

## 🧪 Test the System

```bash
cd backend
python test_database.py
```

Expected output:
```
Passed: 9/9
Failed: 0/9
ALL TESTS PASSED! System is ready to use.
```

---

## 📈 Understanding the Output

### Weak Topics
Topics where user scored < 60%

```python
['physics', 'calculus']
```

### Learning Strategy
```json
{
  "difficulty": "easy",
  "teaching_approach": "simplified",
  "practice_intensity": "high"
}
```

### Risk Assessment
```json
{
  "risk_level": "MEDIUM",
  "risk_score": 3.5,
  "adaptive_tone": "supportive"
}
```

---

## ⚠️ Important Notes

1. **User IDs**: Use consistent user IDs across all API calls
2. **Silent Operation**: Features run in background - no user alerts
3. **Privacy**: All data stored locally in SQLite
4. **Graceful Failure**: If database fails, chatbot continues normally
5. **No Breaking Changes**: Existing code works unchanged

---

## 🎓 Example Workflow

### 1. Student Takes Quiz

```javascript
// Quiz results
const results = [
    { topic: 'calculus', question: '...', user_answer: '...', correct_answer: '...', is_correct: false },
    { topic: 'algebra', question: '...', user_answer: '...', correct_answer: '...', is_correct: true }
];

// Log to database
await fetch('/log_quiz', {
    method: 'POST',
    body: JSON.stringify({ user_id: 'student_123', quiz_id: 'quiz_001', results })
});
```

### 2. System Analyzes Performance

```python
# Automatically happens in background
# - Identifies weak topics
# - Updates learning state
# - Adjusts difficulty
```

### 3. Get Recommendations

```javascript
// Get personalized recommendations
const response = await fetch('/learning_recommendations/student_123');
const data = await response.json();

console.log('Weak areas:', data.weak_areas);
console.log('Prioritized topics:', data.prioritized_topics);
```

### 4. Student Chats with Bot

```javascript
// Chat message
await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
        message: "I don't understand derivatives",
        user_id: 'student_123'
    })
});

// Automatically:
// - Logs chat
// - Analyzes sentiment
// - Updates risk score
// - Adapts tone if needed
```

---

## 🔧 Troubleshooting

### Database Not Found

```bash
cd backend
python -c "import database; print('Database initialized')"
```

### Check If Features Are Active

```python
from tutor_engine import DB_ENABLED
print(f"Database enabled: {DB_ENABLED}")
```

### Reset Database (if needed)

```bash
cd backend
rm edtech.db
python -c "import database"
```

---

## 📚 Full Documentation

See `DATABASE_README.md` for complete documentation.

---

## ✅ You're All Set!

The system is working automatically. Just use your chatbot normally and the adaptive learning features will enhance the experience silently in the background.

**No additional setup required!** 🎉
