const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'chat.html');
let text = fs.readFileSync(filePath, 'utf8');

const newTryBlock = `            try {
                // Call dynamic ai backend
                const analyzeRes = await fetch('http://localhost:5050/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: "default_user",
                        message: msg
                    })
                });
                if (!analyzeRes.ok) throw new Error('Analyze API error');
                const data = await analyzeRes.json();
                
                let riskData = { risk_score: 0, level: 'low', top_reason: '' };
                try {
                    const riskRes = await fetch('http://localhost:5050/risk');
                    if (riskRes.ok) {
                        riskData = await riskRes.json();
                    }
                } catch(e) { console.error("Risk API fetch error:", e); }

                removeTyping();

                let reply = "Understood. Let's keep going!";
                if (data.action === "practice") {
                    reply = "Let's try a practice question to strengthen your understanding.";
                } else if (data.action === "revise") {
                    reply = "It seems you're struggling. Let's revisit the basics.";
                } else if (data.action === "support") {
                    reply = "You're doing okay. Take it step by step. I'm here with you.";
                } else if (data.action === "normal") {
                    reply = "Good progress. Let's continue.";
                }

                appendBubble(reply, 'ai');
                chatHistory.push({ role: 'assistant', text: reply });

                let emoUI = '🙂 Normal';
                if (data.emotion) {
                    const el = data.emotion.toLowerCase();
                    if (el.includes('confus')) emoUI = '😕 Confused';
                    else if (el.includes('frustrat')) emoUI = '😤 Frustrated';
                }
                
                const riskLvl = riskData.level ? riskData.level.toUpperCase() : 'LOW';
                const rsnStr = riskData.top_reason || 'N/A';
                
                if (typeof updateDynamicHeaderBadges === 'function') {
                    updateDynamicHeaderBadges(emoUI, riskLvl, rsnStr);
                }
            } catch (err) {
                removeTyping();
                appendBubble('Sorry, I couldn\\'t connect right now. Please check if your backend is running on port 5050.', 'ai');
                console.error(err);
            }`;

// We will replace both the try-catch in sendMessage and processSendProxy
const regex1 = /try\s*\{\s*const res = await fetch\(API \+ '\/api\/chat'[\s\S]*?catch\s*\(err\)\s*\{[\s\S]*?console\.error\('Chat error:', err\);\s*\}/;
const regex2 = /try\s*\{\s*const res = await fetch\(API \+ '\/api\/chat'[\s\S]*?catch\s*\(err\)\s*\{[\s\S]*?console\.error\(err\);\s*\}/;

text = text.replace(regex1, newTryBlock);
text = text.replace(regex2, newTryBlock);

const badgeFunction = `
        function updateDynamicHeaderBadges(emoBadge, riskLevel, reasonStr) {
            let hdr = document.querySelector('.chat-header p');
            if(!hdr) return;
            
            let rColor = "#10B981"; // Low = green
            if(riskLevel === "MEDIUM") rColor = "#F59E0B"; 
            if(riskLevel === "HIGH") rColor = "#EF4444"; 

            hdr.innerHTML = \`Emotion: <span style="font-weight:bold;margin-right:10px">\${emoBadge}</span> Risk: <span style="font-weight:bold;color:\${rColor};cursor:help" title="\${reasonStr}">\${riskLevel}</span>\`;
        }

        async function sendMessage() {`;

text = text.replace('async function sendMessage() {', badgeFunction);

fs.writeFileSync(filePath, text, 'utf8');
console.log("Patched successfully with proper template literals!");
