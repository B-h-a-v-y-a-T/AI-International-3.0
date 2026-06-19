const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'revision.html');
let content = fs.readFileSync(targetFile, 'utf8');

const appJsString = '<script src="app.js"></script>';
const startIdx = content.indexOf(appJsString);

if (startIdx > -1) {
    const afterAppJsIdx = startIdx + appJsString.length;
    // Find the first <script> that follows
    const nextScriptIdx = content.indexOf('<script>', afterAppJsIdx);
    if (nextScriptIdx > -1) {
        // Just slice EVERYTHING off from here, it's the giant quiz script!
        // We will replace it with the closing tags just to be well-formed, or just slice it and let the browser auto-close.
        const cleaned = content.substring(0, nextScriptIdx) + '\n</body>\n</html>';
        fs.writeFileSync(targetFile, cleaned, 'utf8');
        console.log("Successfully chopped off the old quiz script from revision.html");
    } else {
        console.log("No extra <script> found after app.js");
    }
} else {
    console.log("Could not find app.js script tag in revision.html");
}