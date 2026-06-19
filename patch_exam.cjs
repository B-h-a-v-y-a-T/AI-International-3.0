const fs = require('fs');
const path = require('path');

const examFile = path.join(__dirname, 'exam.html');
let code = fs.readFileSync(examFile, 'utf8');

// 1. Replace button onclick
code = code.replace('onclick="beginExam()"', 'onclick="showWarningModal()"');

// 2. Add warning modal markup
const warningModalHtml = `
    <!-- â”€â”€ Warning Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
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
    code = code.replace('<!-- â”€â”€ Confirm Submit Modal â”€â”€', warningModalHtml + '\n    <!-- â”€â”€ Confirm Submit Modal â”€â”€');
}

if (!code.includes('function showWarningModal()')) {
    const insertCode = `
        function showWarningModal() { document.getElementById('warningModal').style.display = 'flex'; }
        function closeWarningModal() { document.getElementById('warningModal').style.display = 'none'; }

        function startSecureExam() {
            closeWarningModal();
            document.addEventListener("visibilitychange", handleVisibilityChange);
            window.addEventListener("blur", handleBlur);
            document.addEventListener("fullscreenchange", handleFullscreenChange);
            beginExam();
        }

        function handleVisibilityChange() {
            if (_examActive && document.hidden) terminateExam("tab switching");
        }
        function handleBlur() {
            if (_examActive && !document.hidden) terminateExam("losing window focus"); 
            // Avoid double firing with visibilitychange
        }
        function handleFullscreenChange() {
            if (_examActive && !document.fullscreenElement) terminateExam("exiting fullscreen");
        }

        function terminateExam(reason) {
            if (!_examActive) return;
            alert('âŒ Exam ended due to ' + reason + '.');
            finalSubmit();
        }
    \n`;
    
    code = code.replace('let _startedAt = 0;', 'let _startedAt = 0;' + insertCode);
}

const finalSubmitInject = `
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
`;
if (!code.includes('removeEventListener("visibilitychange"')) {
    code = code.split('closeModal();').join('closeModal();\n' + finalSubmitInject);
}

fs.writeFileSync(examFile, code);
console.log('exam.html patched');