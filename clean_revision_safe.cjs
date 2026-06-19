const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'revision.html');
let content = fs.readFileSync(targetFile, 'utf8');

const appJsString = '<script src="app.js"></script>';
const startIdx = content.indexOf(appJsString);

if (startIdx > -1) {
    const splitPoint = startIdx + appJsString.length;
    // Find where the body ends, usually </body> is around the end
    const lastBodyIdx = content.lastIndexOf('</body>');
    if (lastBodyIdx > -1) {
        // Replace it all!
        const correctEnd = "\n</body>\n</html>";
        const newContent = content.substring(0, splitPoint) + correctEnd;
        fs.writeFileSync(targetFile, newContent, 'utf8');
        console.log("Successfully cleaned leftover scripts from revision.html");
    } else {
        console.log("Could not find </body>");
    }
} else {
    console.log("Could not find app.js script tag");
}
