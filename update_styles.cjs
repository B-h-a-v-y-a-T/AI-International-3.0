const fs = require('fs');
let file = 'styles.css';
let css = fs.readFileSync(file, 'utf8');

const oldRegex = /\.word-reveal\s*\{[\s\S]*?\}\s*@keyframes revealWord\s*\{[\s\S]*?\}\s*\}/;

const newStyle = `.word-reveal {
    display: inline-block;
    margin-right: 0.25em;
    opacity: 0;
    transform: translateY(20px) scale(0.5);
    animation: popUpText 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes popUpText {
    0% {
        opacity: 0;
        transform: translateY(20px) scale(0.5);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}`;

if (oldRegex.test(css)) {
    css = css.replace(oldRegex, newStyle);
    fs.writeFileSync(file, css);
    console.log('Fixed pop-up animation!');
} else {
    console.log('Could not match regex... maybe check file manually.');
}
