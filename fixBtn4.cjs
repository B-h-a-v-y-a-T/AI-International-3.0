const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'videos.html');
let content = fs.readFileSync(targetFile, 'utf8');

// Find the index of `function renderTopicPills()`
const startIdx = content.indexOf('function renderTopicPills() {');
if (startIdx !== -1) {
    const endIdx = content.indexOf('filterVideos();', startIdx);
    
    if (endIdx !== -1) {
        let chunk = content.substring(startIdx, endIdx);
        
        // Remove ALL references to emoji and replace with raw text. 
        // We will carefully replace the container.innerHTML block.
        
        const oldContainerStr = "container.innerHTML = [\n                  `<button class=\"topic-btn ${activeSubject === 'all' ? 'active' : ''}\" onclick=\"filterSubject('all',this)\" data-i18n=\"vid.all_subjects\">ðŸ“š All Subjects</button>`,\n                  ...topics.map(t => {\n                      const key = t.toLowerCase();\n                      const emoji = TOPIC_EMOJI[t] || 'ðŸ“˜';\n                      return `<button class=\"topic-btn ${activeSubject === key ? 'active' : ''}\" onclick=\"filterSubject('${key}',this)\">${emoji} ${t}</button>`;\n                  })\n              ].join('');";
        
        // Due to windows carriage returns vs mac matching let's use regex that ignores whitespaces for specific tokens
        chunk = chunk.replace(/data-i18n="vid\.all_subjects">.*? All Subjects<\/button>/, 'data-i18n="vid.all_subjects">All Subjects</button>');
        chunk = chunk.replace(/const emoji = TOPIC_EMOJI\[t\] \|\| '.*?';/, '');
        chunk = chunk.replace(/>\$\{emoji\} \$\{t\}<\/button>/, '>${t}</button>');
        
        content = content.substring(0, startIdx) + chunk + content.substring(endIdx);
        fs.writeFileSync(targetFile, content, 'utf8');
        console.log('Successfully patched videos.html topic pills!');
    }
}
