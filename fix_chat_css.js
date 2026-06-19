const fs = require('fs');

let text = fs.readFileSync('chat.html', 'utf8');

const anchorStart = '.video-rec-play svg {';
const anchorEnd = '.chat-input-row {';

let startIdx = text.indexOf(anchorStart);
let endIdx = text.indexOf(anchorEnd);

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    const replacement = `.video-rec-play svg {
            width: 24px;
            height: 24px;
            color: white;
            opacity: 0.9;
        }

        .video-rec-info {
            flex: 1;
            min-width: 0;
        }

        .video-rec-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .video-rec-channel {
            font-size: 11px;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 4px;
        }
    
        /* New Chat Aesthetics */
        .chat-main {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
            flex: 1;
            margin-left: 0;
            background: 
                radial-gradient(circle at 50% 0%, #FFFFFF 0%, #FFFFFF 20%, transparent 60%),
                radial-gradient(circle at 100% 60%, rgba(124, 58, 237, 0.4) 0%, transparent 70%),
                radial-gradient(circle at 0% 100%, rgba(249, 115, 22, 0.45) 0%, transparent 70%),
                #F8FAFC;
            background-size: cover;
            position: relative;
            transition: all 0.3s ease;
        }
        @media(max-width: 900px) {
            .chat-main { margin-left: 0; }
        }

        .chat-hero {
            position: absolute;
            top: 45%;
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
            padding: 0 20px;
        }

        .chat-hero.hidden {
            opacity: 0;
            pointer-events: none;
            transform: translate(-50%, -60%);
        }

        .chat-hero h1 {
            font-size: 38px;
            font-weight: 800;
            color: #1E293B;
            margin-bottom: 28px;
            text-align: center;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 10px rgba(255,255,255,0.8);
        }

        .chat-input-container {
            width: 100%;
            max-width: 640px;
            background: #F4F0E8;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04);
            border-radius: 30px;
            padding: 12px 18px;
            display: flex;
            flex-direction: column;
            transition: all 0.5s cubic-bezier(0.2, 0.9, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .chat-input-container.docked {
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            background: rgba(244, 240, 232, 0.85);
            backdrop-filter: blur(10px);
        }

        `;
    
    text = text.substring(0, startIdx) + replacement + text.substring(endIdx);
    fs.writeFileSync('chat.html', text);
    console.log('Fixed chat.html CSS syntax structure');
} else {
    console.log('Could not find target block to replace.');
}
