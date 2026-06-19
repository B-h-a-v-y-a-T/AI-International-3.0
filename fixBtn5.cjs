const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'videos.html');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add `.topic-btn` css
const cssToInsert = `
        .filter-row {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 8px;
            margin-bottom: 24px;
        }

        .filter-row::-webkit-scrollbar {
            height: 4px;
        }

        .filter-row::-webkit-scrollbar-thumb {
            background-color: var(--border);
            border-radius: var(--radius-full);
        }

        .topic-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 50px;
            border: 2px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .topic-btn:hover {
            border-color: var(--primary);
            color: var(--primary);
        }

        .topic-btn.active {
            background: var(--primary);
            color: #fff;
            border-color: var(--primary);
        }

        .topic-btn i {
            width: 16px;
            height: 16px;
        }
`;

if (!content.includes('.topic-btn {')) {
    content = content.replace('</style>', cssToInsert + '\n    </style>');
}

// 2. Add TOPIC_ICONS map and update renderTopicPills
const startIdx = content.indexOf('function renderTopicPills() {');
const endIdx = content.indexOf('filterVideos();', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
    let scriptBlock = content.substring(startIdx, endIdx);
    
    // Replace innerHTML setting string
    const htmlRegex = /container\.innerHTML = \[\s*`<button class="topic-btn \$\{activeSubject === 'all' \? 'active' : ''\}" onclick="filterSubject\('all',\s?this\)" data-i18n="vid\.all_subjects">.*?<\/button>`,\s*\.\.\.topics\.map\(t => \{\s*const key = t\.toLowerCase\(\);\s*return `<button class="topic-btn \$\{activeSubject === key \? 'active' : ''\}" onclick="filterSubject\('\$\{key\}',this\)">\$\{t\}<\/button>`;\s*\}\)\s*\]\.join\(''\);/gs;

    // Use regular string to build the replace manually to avoid missing due to slight differences.
    const newTopicLogic = `
            const TOPIC_ICONS = {
                'physics': 'atom',
                'chemistry': 'flask-conical',
                'maths': 'calculator',
                'biology': 'microscope',
                'english': 'book-open',
                'history': 'landmark',
                'computer science': 'monitor-play',
                'economics': 'trending-up',
                'geography': 'map'
            };

            container.innerHTML = [
                \`<button class="topic-btn \${activeSubject === 'all' ? 'active' : ''}" onclick="filterSubject('all',this)" data-i18n="vid.all_subjects">All Subjects</button>\`,
                ...topics.map(t => {
                    const key = t.toLowerCase();
                    const iconName = TOPIC_ICONS[key] || 'hash';
                    return \`<button class="topic-btn \${activeSubject === key ? 'active' : ''}" onclick="filterSubject('\${key}',this)"><i data-lucide="\${iconName}"></i> \${t}</button>\`;
                })
            ].join('');
`;

    // Remove the old assignments entirely using substring replacement
    const replacementStart = scriptBlock.indexOf('container.innerHTML = [');
    const replacementEnd = scriptBlock.indexOf('].join(\'\');') + 11;
    
    scriptBlock = scriptBlock.substring(0, replacementStart) + newTopicLogic + scriptBlock.substring(replacementEnd);

    content = content.substring(0, startIdx) + scriptBlock + content.substring(endIdx);
    
    // Also add a line to call lucide.createIcons() right after renderTopicPills() happens or inside it if needed.
    // wait, renderTopicPills already does so at the end.
    
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully styled UI and added icons.');
}
