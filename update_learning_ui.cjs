const fs = require('fs');

const dashboard = fs.readFileSync('dashboard.html', 'utf8');
const learning = fs.readFileSync('learning.html', 'utf8');

const sidebarMatch = dashboard.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
const topNavMatch = dashboard.match(/<!-- Top Navbar -->[\s\S]*?<!-- Hero Section -->/);
const bodyMatch = learning.match(/<!-- Header -->([\s\S]*?)<\/body>/);

if (!sidebarMatch || !topNavMatch || !bodyMatch) {
    console.error("Could not find a necessary section.");
    process.exit(1);
}

let topNav = topNavMatch[0].replace('<!-- Hero Section -->', '');
// Replace dashboard title with Learning Journey
topNav = topNav.replace('<div class="dash-title">Dashboard</div>', '<div class="dash-title">Learning Journey</div>');

let newBody = "<body>\n" +
"    <div class=\"app-layout\">\n" +
sidebarMatch[0] + "\n" +
"<main class=\"main-content\" style=\"background: linear-gradient(180deg, #F0E6FA 0%, #ffe0fd 100%); padding: 40px; position:relative; overflow:hidden; font-family: 'DM Sans', sans-serif;\">\n" +
topNav + "\n" +
"<!-- Header -->\n" +
bodyMatch[1] + "\n" +
"</main>\n" +
"    </div>\n" +
"</body>";

let newLearningHtml = learning.replace(/<body[^>]*>[\s\S]*?<\/body>/, newBody);

// Make sure styles.css is loaded properly
fs.writeFileSync('learning.html', newLearningHtml);
console.log("learning.html updated with dashboard layout!");
