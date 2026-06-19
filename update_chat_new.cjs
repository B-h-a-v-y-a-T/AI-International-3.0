const fs = require('fs');

let html = fs.readFileSync('chat.html', 'utf8');

const newStyles = `
        /* New Chat Aesthetics */
        .chat-main {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
            background: 
                radial-gradient(circle at 50% 0%, #FFFFFF 0%, #FFFFFF 20%, transparent 60%),
                radial-gradient(circle at 100% 60%, rgba(124, 58, 237, 0.5) 0%, transparent 50%),
                radial-gradient(circle at 0% 100%, rgba(249, 115, 22, 0.6) 0%, transparent 60%),
                #F8FAFC;
            background-size: cover;
            position: relative;
            transition: background 0.5s ease;
        }

        .chat-hero {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 680px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: all 0.5s cubic-bezier(0.2, 0.9, 0.2, 1);
        }

        .chat-hero.hidden {
            opacity: 0;
            pointer-events: none;
            transform: translate(-50%, -60%);
        }

        .chat-hero h1 {
            font-size: 36px;
            font-weight: 700;
            color: #1E293B;
            margin-bottom: 24px;
            text-align: center;
            letter-spacing: -0.5px;
        }

        .chat-input-container {
            width: 100%;
            max-width: 640px;
            background: rgba(246, 244, 240, 0.9);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04);
            border-radius: 28px;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            transition: all 0.5s cubic-bezier(0.2, 0.9, 0.2, 1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .chat-input-container.docked {
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
        }

        .chat-input-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
        }

        .chat-input-row button.icon-btn {
            background: none;
            border: none;
            color: #64748B;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .chat-input-row button.icon-btn:hover {
            background: rgba(0,0,0,0.05);
            color: #1E293B;
        }

        .chat-input-row input {
            flex: 1;
            background: transparent;
            border: none;
            font-size: 16px;
            color: #1E293B;
            padding: 8px 0;
            outline: none;
        }

        .chat-input-row input::placeholder {
            color: #94A3B8;
        }

        .chat-input-row .send-pill {
            background: #94A3B8;
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .chat-input-row input:not(:placeholder-shown) ~ .send-pill {
            background: #4F46E5;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 80px 20% 120px; /* Space for hidden header and docked input */
            display: flex;
            flex-direction: column;
            gap: 24px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
        }

        .chat-messages.visible {
            opacity: 1;
            pointer-events: auto;
        }
        
        /* Redesigning Bubbles */
        .bubble-wrapper { display: flex; flex-direction: column; margin-bottom: 20px;}
        .bubble-wrapper.user { align-items: flex-end; }
        .bubble-wrapper.ai { align-items: flex-start; }
        
        .chat-bubble {
            max-width: 80%;
            padding: 16px 20px;
            border-radius: 20px;
            font-size: 15px;
            line-height: 1.5;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            position: relative;
        }
        
        .chat-bubble.user {
            background: #F3F4F6;
            color: #1E293B;
            border-bottom-right-radius: 4px;
            font-weight: 500;
        }
        
        .chat-bubble.ai {
            background: white;
            color: #1E293B;
            border-bottom-left-radius: 4px;
            border: 1px solid rgba(0,0,0,0.04);
        }

        .top-nav {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 24px 32px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            z-index: 30;
            pointer-events: none; /* Let clicks pass unless on buttons */
        }
        
        .top-nav > * {
            pointer-events: auto;
        }
`;

// Inject styles
if (!html.includes('/* New Chat Aesthetics */')) {
    html = html.replace('</style>', newStyles + '\n    </style>');
}

const mainContent = `
        <main class="main-content chat-main" id="chatMain">
            <div class="top-nav">
                <div style="display:flex;gap:12px;align-items:center; background: rgba(255,255,255,0.5); padding: 8px 16px; border-radius: 20px; backdrop-filter: blur(10px);">
                    <div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px;">
                        <i data-lucide="meh" style="width:16px;height:16px;"></i>
                        Neutral
                    </div>
                </div>
            </div>

            <div class="chat-hero" id="chatHero">
                <h1 id="chatGreeting">What should we build, Param?</h1>
                
                <div class="chat-input-container" id="heroInputContainer">
                    <div class="chat-input-row">
                        <button class="icon-btn" title="Add context">
                            <i data-lucide="plus" style="width:20px;height:20px"></i>
                        </button>
                        <input type="text" id="chatInputHero" placeholder="Ask AI Tutor to help you learn..." onkeypress="handleKeyHero(event)" />
                        <div style="display:flex; gap:4px; align-items:center;">
                            <button class="icon-btn" title="Map relative">
                                <i data-lucide="map" style="width:18px;height:18px"></i>
                            </button>
                            <button class="icon-btn" id="micBtn" onclick="toggleMicHero()" title="Voice input">
                                <i data-lucide="mic" style="width:18px;height:18px"></i>
                            </button>
                            <button class="send-pill" onclick="sendMessageHero()" title="Send message">
                                <i data-lucide="arrow-up" style="width:18px;height:18px"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Messages Container (Hidden initially) -->
            <div class="chat-messages" id="chatMessages">
                <!-- Messages will appear here -->
            </div>
            
            <!-- Docked Input Container that takes over once clicked -->
            <div class="chat-input-container docked" id="dockedInputContainer" style="opacity: 0; pointer-events: none;">
                <div class="chat-input-row">
                    <button class="icon-btn" title="Add context">
                        <i data-lucide="plus" style="width:20px;height:20px"></i>
                    </button>
                    <input type="text" id="chatInputDocked" placeholder="Ask AI Tutor to help you learn..." onkeypress="handleKeyDocked(event)" />
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="icon-btn" title="Map relative">
                            <i data-lucide="map" style="width:18px;height:18px"></i>
                        </button>
                        <button class="icon-btn" id="micBtnDocked" onclick="toggleMicDocked()" title="Voice input">
                            <i data-lucide="mic" style="width:18px;height:18px"></i>
                        </button>
                        <button class="send-pill" onclick="sendMessageDocked()" title="Send message">
                            <i data-lucide="arrow-up" style="width:18px;height:18px"></i>
                        </button>
                    </div>
                </div>
            </div>
        </main>
`;

// Replace `chat-main` block completely
const startIdx = html.indexOf('<main class="chat-main">');
const endIdx = html.indexOf('</main>', startIdx) + 7;
if(startIdx !== -1) {
    html = html.substring(0, startIdx) + mainContent + html.substring(endIdx);
} else {
    // If it's already "main-content chat-main" or similar
    const startIdx2 = html.indexOf('<div class="chat-main"');
    if (startIdx2 !== -1) {
        let regex = /<div class="chat-main"[\s\S]*?<\/div>\s*<!-- chat-main end -->/;
        // fallback regex search
    }
    // We will just replace <div class="chat-layout"> ... <main class="..."> ... </main> 
    html = html.replace(/<main class="chat-main">[\s\S]*?<\/main>/, mainContent);
}

// Logic overrides
const jsOverrides = `

        // --- NEW CHAT LOGIC UI OVERRIDES ---
        let hasStartedChat = false;
        
        function initChatHero() {
            let lsUser = localStorage.getItem('ls-user');
            let name = "Vedant";
            if(lsUser) {
                try {
                    name = JSON.parse(lsUser).name.split(' ')[0] || "Vedant";
                } catch(e) {}
            }
            const g = document.getElementById('chatGreeting');
            if(g) {
                g.innerText = "What shall we learn today, " + name + "?";
            }
        }
        
        window.addEventListener('DOMContentLoaded', () => {
            initChatHero();
        });

        function transitionToChat() {
            if(hasStartedChat) return;
            hasStartedChat = true;
            document.getElementById('chatHero').classList.add('hidden');
            document.getElementById('chatMessages').classList.add('visible');
            
            // Move input control to docked
            document.getElementById('dockedInputContainer').style.opacity = '1';
            document.getElementById('dockedInputContainer').style.pointerEvents = 'auto';
            
            // Change background slightly on active chat (optional, keep it clean for now)
            document.getElementById('chatMain').style.background = 'radial-gradient(circle at 50% 0%, #FFFFFF 0%, #FFFFFF 30%, transparent 80%), radial-gradient(circle at 100% 60%, rgba(124, 58, 237, 0.2) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(249, 115, 22, 0.25) 0%, transparent 60%), #F8FAFC';
        }

        function handleKeyHero(e) {
            if (e.key === 'Enter') sendMessageHero();
        }
        function handleKeyDocked(e) {
            if (e.key === 'Enter') sendMessageDocked();
        }

        async function sendMessageHero() {
            const val = document.getElementById('chatInputHero').value.trim();
            if(!val) return;
            document.getElementById('chatInputDocked').value = val;
            transitionToChat();
            await processSendProxy(val);
        }
        
        async function sendMessageDocked() {
            const val = document.getElementById('chatInputDocked').value.trim();
            if(!val) return;
            await processSendProxy(val);
        }

        async function processSendProxy(msg) {
            if(isSending) return;
            isSending = true;
            
            document.getElementById('chatInputDocked').value = '';
            document.getElementById('chatInputHero').value = '';
            
            appendBubble(msg, 'user');
            chatHistory.push({ role: 'user', text: msg });
            showTyping();

            try {
                const res = await fetch(API + '/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: msg,
                        history: chatHistory.slice(-10),
                        userMood: currentEmotion.toLowerCase(),
                        language: typeof I18n !== 'undefined' ? I18n.getGeminiLang() : 'English'
                    })
                });
                const data = await res.json();
                removeTyping();

                if (!res.ok) throw new Error(data.error || 'Server error');

                const reply = data.reply || 'Sorry, I could not generate a response.';
                appendBubble(reply, 'ai');
                chatHistory.push({ role: 'assistant', text: reply });

                if (data.videos && data.videos.length > 0) { appendVideos(data.videos); }
                if (data.emotion) {
                    const emo = data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1);
                    setEmotion(emo);
                }
            } catch (err) {
                removeTyping();
                appendBubble('Sorry, I couldn\\'t connect right now. System overloaded.', 'ai');
            } finally {
                isSending = false;
            }
        }
        
        // Ensure appendBubble works seamlessly with redesigned UI
        function appendBubble(text, who) {
            const msgs = document.getElementById('chatMessages');
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const wrapper = document.createElement('div');
            wrapper.className = \`bubble-wrapper \${who}\`;
            wrapper.innerHTML = \`<div class="chat-bubble \${who}">\${formatText(text)}<div class="bubble-time" style="font-size:11px; opacity:0.6; margin-top:8px; text-align:right;">\${now}</div></div>\`;
            msgs.appendChild(wrapper);
            msgs.scrollTop = msgs.scrollHeight;
        }

        // Voice proxies
        function toggleMicHero() { toggleMic(); }
        function toggleMicDocked() { toggleMic(); }
`;

html = html.replace(/<script>.*?async function sendMessage\(\)[\s\S]*?<\/script>/, ''); // remove the original one if we override, wait, easier to just append the new logic which overwrites/bypasses. Actually Javascript function hoisting will prefer the latter if we redefine. To be safe, just append it before </body>.

html = html.replace('</body>', jsOverrides + '\n</body>');

fs.writeFileSync('chat.html', html);
console.log("Chat Updated to new look!");
