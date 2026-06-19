const fs = require('fs');
const cssPath = 'c:/Users/vedan/Downloads/itsahack2.0-integration1 (1)/OptiML_integration2/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

const startStr = '[data-theme="dark"] {';
const startIdx = css.indexOf(startStr);
const endIdx = css.indexOf('}', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newTheme = startStr + '\n' +
    '    --bg-page: #061B24;\n' +
    '    --bg-card: #092732;\n' +
    '    --bg-sidebar: #092732;\n' +
    '    --bg-input: #061B24;\n' +
    '    --bg-hover: #0D3745;\n' +
    '\n' +
    '    --text-primary: #F4F9FA;\n' +
    '    --text-secondary: #BBD5DD;\n' +
    '    --text-muted: #84ACB8;\n' +
    '\n' +
    '    --border: #164658;\n' +
    '    --border-focus: #F9B600;\n' +
    '\n' +
    '    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);\n' +
    '    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.25);\n' +
    '    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.35);\n' +
    '\n' +
    '    --primary: #F9B600;\n' +
    '    --primary-dark: #D49B00;\n' +
    '    --primary-light: #201700;\n' +
    '\n' +
    '    --accent-yellow: #F9B600;\n' +
    '    --accent-lavender: #41A8CA;\n' +
    '\n' +
    '    letter-spacing: 0.05em;\n';
    
  css = css.substring(0, startIdx) + newTheme + css.substring(endIdx);
  fs.writeFileSync(cssPath, css);
  console.log('Successfully updated dark mode based on scaleUp image!');
} else {
  console.log('Error: Could not locate [data-theme="dark"] block in styles.css');
}