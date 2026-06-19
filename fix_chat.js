const fs = require('fs');

let content = fs.readFileSync('chat.html', 'utf8');

// Replace all occurrences
content = content.replace(/fetch\('http:\/\/localhost:5050\/analyze'/g, "fetch('http://localhost:5050/api/chat'");
content = content.replace(/user_id: "default_user",\s+/g, '');
content = content.replace(/Analyze API error/g, 'Chat API error');

// Remove risk API calls and related logic
content = content.replace(/let riskData = \{ risk_score: 0, level: 'low', top_reason: '' \};\s+try \{\s+const riskRes = await fetch\('http:\/\/localhost:5050\/risk'\);\s+if \(riskRes\.ok\) \{\s+riskData = await riskRes\.json\(\);\s+\}\s+\} catch\(e\) \{ console\.error\("Risk API fetch error:", e\); \}\s+/g, '');

// Simplify reply logic
content = content.replace(/let reply = "Understood\. Let's keep going!";\s+if \(data\.action === "practice"\) \{\s+reply = "Let's try a practice question to strengthen your understanding\.";\s+\} else if \(data\.action === "revise"\) \{\s+reply = "It seems you're struggling\. Let's revisit the basics\.";\s+\} else if \(data\.action === "support"\) \{\s+reply = "You're doing okay\. Take it step by step\. I'm here with you\.";\s+\} else if \(data\.action === "normal"\) \{\s+reply = "Good progress\. Let's continue\.";\s+\}\s+appendBubble\(reply, 'ai'\);\s+chatHistory\.push\(\{ role: 'assistant', text: reply \}\);\s+let emoUI = '🙂 Normal';\s+if \(data\.emotion\) \{\s+const el = data\.emotion\.toLowerCase\(\);\s+if \(el\.includes\('confus'\)\) emoUI = '😕 Confused';\s+else if \(el\.includes\('frustrat'\)\) emoUI = '😤 Frustrated';\s+\}\s+const riskLvl = riskData\.level \? riskData\.level\.toUpperCase\(\) : 'LOW';\s+const rsnStr = riskData\.top_reason \|\| 'N\/A';\s+if \(typeof updateDynamicHeaderBadges === 'function'\) \{\s+updateDynamicHeaderBadges\(emoUI, riskLvl, rsnStr\);\s+\}/g, "appendBubble(data.reply || 'Got it!', 'ai');\n                chatHistory.push({ role: 'assistant', text: data.reply });");

fs.writeFileSync('chat.html', content);
console.log('Fixed chat.html');
