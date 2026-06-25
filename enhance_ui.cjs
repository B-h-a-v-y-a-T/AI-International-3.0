const fs = require('fs');

// 1. Update ai-tutor.css
let css = fs.readFileSync('ai-tutor.css', 'utf8');

// Fix bottom padding
css = css.replace('.tutor-input-area {\n  padding: 14px 20px 76px 20px;', '.tutor-input-area {\n  padding: 14px 20px 20px 20px;');
if (!css.includes('@media (max-width: 768px) {\n  .tutor-input-area')) {
    css += '\n\n@media (max-width: 768px) {\n  .tutor-input-area {\n    padding-bottom: 76px;\n  }\n}\n';
}

// Enhance Dashboard Panel background
css = css.replace('  border-left: 2px solid var(--border);\n  background: var(--bg-page);', '  border-left: none;\n  background: transparent;');

// Enhance Dash Card styling
const oldCardCss = `.tutor-dash-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}`;
const newCardCss = `.tutor-dash-card {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.tutor-dash-card:hover { 
  transform: translateY(-3px); 
  box-shadow: 0 12px 25px rgba(99, 102, 241, 0.15); 
  background: rgba(255, 255, 255, 0.9);
  border-color: var(--accent-lavender);
}`;

if (css.includes('background: var(--bg-card);\n  border: 2px solid var(--border);')) {
    css = css.replace(oldCardCss, newCardCss);
} else {
    // Attempt partial replacement if oldCardCss doesn't exactly match
    css = css.replace(/.*?\.tutor-dash-card \{[\s\S]*?overflow: hidden;\n\}/m, newCardCss);
}

// Enhance card headers to remove the thick border and look cleaner
css = css.replace('.tutor-dash-card-header {\n  padding: 12px 16px;\n  font-weight: 700;\n  font-size: 13px;\n  /* border-bottom: 2px solid var(--border); */\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  color: var(--text-primary);\n}', 
`.tutor-dash-card-header {
  padding: 16px;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
}`);

fs.writeFileSync('ai-tutor.css', css, 'utf8');


// 2. Update ai-tutor.js
let js = fs.readFileSync('ai-tutor.js', 'utf8');

// Make the Ask AI / Mode tabs do something useful (focus input, update placeholder)
if (!js.includes('input.placeholder = `Ask your tutor anything in')) {
    const oldModeFunc = `    };
    subtitleEl.textContent = subtitles[mode] || subtitles.ask;
  }
}`;
    const newModeFunc = `    };
    subtitleEl.textContent = subtitles[mode] || subtitles.ask;
  }
  
  // Update placeholder and focus input to show the button "worked"
  const input = document.getElementById('tutorInput');
  if(input) {
      const placeholders = {
          learn: 'What concept should we explore?',
          practice: 'Ready for some questions? Type a topic...',
          revise: 'What topic do you want to review?',
          exam: 'Type a subject to start a mock test...',
          ask: 'Ask your tutor anything...'
      };
      input.placeholder = placeholders[mode] || placeholders.ask;
      input.focus();
  }
}`;
    js = js.replace(oldModeFunc, newModeFunc);
    fs.writeFileSync('ai-tutor.js', js, 'utf8');
}

console.log('Enhancements applied!');
