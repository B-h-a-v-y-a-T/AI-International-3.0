const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'revision.html');
fs.copyFileSync(path.join(__dirname, 'quiz.html'), targetFile);
let content = fs.readFileSync(targetFile, 'utf8');

const revisionUi = `
<style>
.revision-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
.card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-bottom: 24px; }
textarea { width: 100%; min-height: 150px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; font-family: inherit; font-size: 14px; resize: vertical; box-sizing: border-box;}
.btn-primary { background: #f97316; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s; }
.btn-primary:hover { background: #ea580c; }
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { background: #e5e7eb; }

/* Generated Summary Styles */
.summary-box { background: #fdf8f6; border-left: 4px solid #f97316; padding: 16px; margin-top: 20px; border-radius: 0 8px 8px 0; }
.summary-box ul { padding-left: 20px; margin: 0; }
.summary-box li { margin-bottom: 8px; line-height: 1.5; color: #374151; }

/* Quiz Styles */
.quiz-question { margin-bottom: 20px; padding: 16px; border: 1px solid #f3f4f6; border-radius: 8px; }
.quiz-options { display: grid; gap: 10px; margin-top: 10px; }
.quiz-option { padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: white; }
.quiz-option:hover { border-color: #f97316; background: #fff7ed; }
.quiz-option.selected { border-color: #f97316; background: #fff7ed; font-weight: 500; }
.quiz-option.correct { border-color: #22c55e; background: #f0fdf4; color: #166534; }
.quiz-option.incorrect { border-color: #ef4444; background: #fef2f2; color: #991b1b; }

.hidden { display: none !important; }
.loader { border: 4px solid #f3f3f3; border-top: 4px solid #f97316; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.explanation { margin-top: 10px; padding: 12px; border-radius: 8px; font-size: 14px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; display: none; }
</style>

<div class="revision-container">
    <div class="header" style="margin-bottom: 24px;">
        <h1 style="font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 8px; line-height: 1.2;">Quick Revision & Practice</h1>
        <p style="color: #6b7280; font-size: 16px;">Paste your notes or study material below to generate concise revision points and a personalized quiz.</p>
    </div>

    <!-- Input Section -->
    <div class="card" id="inputSection">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Paste Your Notes Here</h3>
        <textarea id="notesInput" placeholder="e.g., Photosynthesis is the process used by plants, algae and certain bacteria..."></textarea>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn-primary" id="btnGenerateSummary">
                <i data-lucide="zap"></i> Generate Summary
            </button>
        </div>
        <div id="loadingSummary" class="hidden" style="text-align: center; margin-top: 16px; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <div class="loader"></div> <span>Extracting key points...</span>
        </div>
    </div>

    <!-- Results Section -->
    <div class="card hidden" id="summarySection">
        <h3 style="font-size: 18px; font-weight: 600; color: #1f2937;">Revision Notes</h3>
        <div id="summaryContent" class="summary-box"></div>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
            <button class="btn-secondary" id="btnBackToInput">Edit Notes</button>
            <button class="btn-primary" id="btnGenerateQuiz">
                <i data-lucide="brain-circuit"></i> Generate Quiz from Notes
            </button>
        </div>
        <div id="loadingQuiz" class="hidden" style="text-align: center; margin-top: 16px; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <div class="loader"></div> <span>Creating personalized questions from your notes...</span>
        </div>
    </div>

    <!-- Quiz Section -->
    <div class="card hidden" id="quizSection">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937;">Personalized Quiz</h3>
            <span id="quizScore" style="font-weight: 600; color: #f97316; display: none; font-size: 18px;">Score: 0 / 5</span>
        </div>
        <div id="quizContainer"></div>
        <div style="display: flex; justify-content: flex-end; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
            <button class="btn-primary hidden" id="btnSubmitQuiz" style="margin-right: 12px;">Submit Quiz</button>
            <button class="btn-secondary hidden" id="btnRestartQuiz" style="margin-right: 12px;">Back to Notes</button>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {

    const inputSection = document.getElementById('inputSection');
    const summarySection = document.getElementById('summarySection');
    const quizSection = document.getElementById('quizSection');
    
    const notesInput = document.getElementById('notesInput');
    const summaryContent = document.getElementById('summaryContent');
    const quizContainer = document.getElementById('quizContainer');
    
    const btnGenerateSummary = document.getElementById('btnGenerateSummary');
    const btnGenerateQuiz = document.getElementById('btnGenerateQuiz');
    const btnBackToInput = document.getElementById('btnBackToInput');
    const btnSubmitQuiz = document.getElementById('btnSubmitQuiz');
    const btnRestartQuiz = document.getElementById('btnRestartQuiz');
    
    const loadingSummary = document.getElementById('loadingSummary');
    const loadingQuiz = document.getElementById('loadingQuiz');
    
    let generatedNotes = "";
    let generatedQuestions = [];
    let userSelections = [];

    // Attempt to load marked.js if not present for markdown parsing
    if (typeof marked === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        document.head.appendChild(script);
    }

    function refreshIcons() {
        if (typeof lucide !== 'undefined') { 
            lucide.createIcons(); 
        }
    }
    setTimeout(refreshIcons, 100);

    btnGenerateSummary.addEventListener('click', async () => {
        const text = notesInput.value.trim();
        if (!text) { alert('Please paste some notes first.'); return; }

        btnGenerateSummary.disabled = true;
        loadingSummary.classList.remove('hidden');

        try {
            const res = await fetch('/api/notes/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            
            if (res.ok) {
                generatedNotes = data.summary;
                summaryContent.innerHTML = typeof marked !== 'undefined' ? marked.parse(generatedNotes) : '<pre style="white-space: pre-wrap; font-family: inherit;">' + generatedNotes + '</pre>';
                
                inputSection.classList.add('hidden');
                summarySection.classList.remove('hidden');
                quizSection.classList.add('hidden');
                refreshIcons();
            } else {
                alert(data.error || 'Failed to generate summary.');
            }
        } catch (err) {
            alert('A network error occurred.');
            console.error(err);
        } finally {
            btnGenerateSummary.disabled = false;
            loadingSummary.classList.add('hidden');
        }
    });

    btnBackToInput.addEventListener('click', () => {
        summarySection.classList.add('hidden');
        inputSection.classList.remove('hidden');
    });

    btnGenerateQuiz.addEventListener('click', async () => {
        btnGenerateQuiz.disabled = true;
        loadingQuiz.classList.remove('hidden');

        try {
            const res = await fetch('/api/notes/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: generatedNotes }) 
            });
            const data = await res.json();
            
            if (res.ok && data.questions) {
                generatedQuestions = data.questions;
                renderQuiz(generatedQuestions);
                
                summarySection.classList.add('hidden');
                quizSection.classList.remove('hidden');
                document.getElementById('quizScore').style.display = 'none';
                btnSubmitQuiz.classList.remove('hidden');
                btnRestartQuiz.classList.add('hidden');
                refreshIcons();
            } else {
                alert(data.error || 'Failed to generate quiz.');
            }
        } catch (err) {
            alert('A network error occurred.');
            console.error(err);
        } finally {
            btnGenerateQuiz.disabled = false;
            loadingQuiz.classList.add('hidden');
        }
    });

    function renderQuiz(questions) {
        userSelections = new Array(questions.length).fill(-1);
        quizContainer.innerHTML = '';
        
        questions.forEach((q, qIndex) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'quiz-question';
            qDiv.innerHTML = \`<p style="font-weight: 600; margin-bottom: 12px; color: #1f2937;">\${qIndex + 1}. \${q.question}</p>\`;
            
            const optDiv = document.createElement('div');
            optDiv.className = 'quiz-options';
            
            q.options.forEach((opt, optIndex) => {
                const btn = document.createElement('div');
                btn.className = 'quiz-option';
                btn.textContent = opt;
                btn.onclick = () => selectOption(qIndex, optIndex, optDiv);
                optDiv.appendChild(btn);
            });
            
            const expl = document.createElement('div');
            expl.className = 'explanation';
            expl.id = \`explanation-\${qIndex}\`;
            expl.innerHTML = \`<strong style="color: #64748b;">Explanation:</strong> \${q.explanation || 'No explanation provided.'}\`;
            
            qDiv.appendChild(optDiv);
            qDiv.appendChild(expl);
            quizContainer.appendChild(qDiv);
        });
    }

    function selectOption(qIndex, oIndex, optDiv) {
        userSelections[qIndex] = oIndex;
        const opts = optDiv.querySelectorAll('.quiz-option');
        opts.forEach((opt, idx) => {
            if (idx === oIndex) opt.classList.add('selected');
            else opt.classList.remove('selected');
        });
    }

    btnSubmitQuiz.addEventListener('click', () => {
        if (userSelections.includes(-1)) {
            if(!confirm("You haven't answered all questions. Submit anyway?")) return;
        }

        let score = 0;
        
        generatedQuestions.forEach((q, qIndex) => {
            const qDiv = quizContainer.children[qIndex];
            const optDiv = qDiv.querySelector('.quiz-options');
            const opts = optDiv.querySelectorAll('.quiz-option');
            const selectedOptIndex = userSelections[qIndex];
            // Convert to integer just in case LLM outputs string digit
            const correctOptIndex = parseInt(q.answer, 10);
            
            opts.forEach((opt, idx) => {
                opt.style.pointerEvents = 'none'; 
                if (idx === correctOptIndex) {
                    opt.classList.add('correct');
                } else if (idx === selectedOptIndex && idx !== correctOptIndex) {
                    opt.classList.add('incorrect');
                }
            });
            
            if (selectedOptIndex === correctOptIndex) {
                score++;
            }
            
            const expl = document.getElementById(\`explanation-\${qIndex}\`);
            if (expl) expl.style.display = 'block';
        });

        const scoreSpan = document.getElementById('quizScore');
        scoreSpan.textContent = \`Score: \${score} / \${generatedQuestions.length}\`;
        scoreSpan.style.display = 'block';
        
        btnSubmitQuiz.classList.add('hidden');
        btnRestartQuiz.classList.remove('hidden');
    });

    btnRestartQuiz.addEventListener('click', () => {
        quizSection.classList.add('hidden');
        summarySection.classList.remove('hidden');
    });
});
</script>
`;

const mainRegex = /(<main class="main-content"[^>]*>)([\s\S]*?)(<\/main>)/;

if (mainRegex.test(content)) {
    content = content.replace(mainRegex, (match, p1, p2, p3) => {
        return p1 + '\n' + revisionUi + '\n' + p3;
    });
    
    // Change Title
    content = content.replace(/<title>.*?<\/title>/, '<title>Quick Revision – AdaptEd Ai</title>');
    
    // De-activate quiz.html pill on the sidebar just in case
    content = content.replace(/<a class="nav-item active"[^>]*data-page="quiz.html"[^>]*>/, '<a class="nav-item" data-page="quiz.html" href="quiz.html">');
    // Active revision.html pill
    content = content.replace(/<a class="nav-item"[^>]*data-page="revision.html"[^>]*>/, '<a class="nav-item active" data-page="revision.html" href="revision.html">');

    // Nuke the quiz logic block completely so it doesn't collide
    // We wipe `<script>` tags that have the big quiz logic. It's usually after app.js
    const appJsStr = '<script src="app.js"></script>';
    const startIdx = content.indexOf(appJsStr);
    if(startIdx > -1) {
        let afterApp = content.substring(0, startIdx + appJsStr.length);
        afterApp += '\n</body>\n</html>';
        content = afterApp;
    }

    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Rigorous layout restoration and injection successful.');
} else {
    console.log('Regex fail. Could not find <main> tagging safely.');
}
