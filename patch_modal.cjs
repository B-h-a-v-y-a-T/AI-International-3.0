const fs = require('fs');
const path = require('path');

const examFile = path.join(__dirname, 'exam.html');
let code = fs.readFileSync(examFile, 'utf8');

const warningModalHtml = `
    <!-- Warning Modal -->
    <div class="modal-overlay" id="warningModal" style="display:none;align-items:center;justify-content:center;z-index:99999;">
        <div class="modal-box" style="padding:30px;max-width:400px;text-align:center;">
            <div style="font-size:20px;font-weight:800;margin-bottom:15px;color:#ef4444;">âš ï¸ Secure Mode</div>
            <div style="font-size:14px;color:var(--text-muted);margin-bottom:25px;line-height:1.6;">
                This exam runs in strict secure mode.<br><br>
                <strong>Switching tabs or exiting fullscreen will automatically end your exam.</strong>
            </div>
            <div style="display:flex;gap:12px">
                <button onclick="closeWarningModal()" class="btn btn-secondary" style="flex:1">Cancel</button>
                <button onclick="startSecureExam()" class="btn btn-primary" style="flex:1">Start Exam</button>
            </div>
        </div>
    </div>
`;
if (!code.includes('id="warningModal"')) {
    code = code.replace('<div class="modal-overlay" id="submitModal">', warningModalHtml + '\n    <div class="modal-overlay" id="submitModal">');
}

fs.writeFileSync(examFile, code);
console.log('exam.html modal injected');