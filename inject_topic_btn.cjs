
const fs = require("fs");
const file = "videos.html";
let data = fs.readFileSync(file, "utf8");

const styling = `
        .topic-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            border-radius: var(--radius-full);
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            background: transparent;
            border: 1.5px solid var(--border);
            cursor: pointer;
            transition: var(--transition);
        }
        .topic-btn:hover {
            border-color: var(--primary);
            color: var(--primary);
            background: var(--primary-light);
        }
        .topic-btn.active {
            border-color: var(--primary);
            background: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 600;
        }
`;

if (!data.includes(".topic-btn {")) {
  data = data.replace(".filter-row {", styling + "\n        .filter-row {");
  fs.writeFileSync(file, data, "utf8");
  console.log("Injected Styles.");
} else {
  console.log("Already has it.");
}

