// onboarding.js — Fixed for consistent topic keys and proper plan structure

let currentStep = 0;
const totalSteps = 4;
const userProfile = {
    id: Date.now().toString(),
    domain: null,
    dailyTime: null,
    level: null,
    timeline: null,
    createdAt: new Date().toISOString()
};

const btnNext = document.getElementById('btn-next');
const btnBack = document.getElementById('btn-back');
const btnFinish = document.getElementById('btn-finish');
const progressBarFill = document.getElementById('progress-bar-fill');
const stepTitle = document.getElementById('step-title');

const stepHeaders = {
    0: 'Welcome to AdaptEd Ai!',
    1: 'What is your target domain?',
    2: 'What is your daily time commitment?',
    3: 'What is your current level?',
    4: 'What is your target timeline?'
};

const mascotSay = {
    0: 'Ready to build your dream study plan? Let’s go!',
    1: 'Cool! What are we studying for today?',
    2: 'Got it. How much time can you spare for me?',
    3: 'Nice! How confident are you feeling right now?',
    4: 'Almost there! When is the big day?',
    success: 'YAY! Your personalized path is ready!'
};

const mascotAvatar = document.getElementById('mascot-avatar');
const mascotSpeech = document.getElementById('mascot-speech');

function updateMascot(step, type = 'normal') {
    if (!mascotSpeech) return;
    
    mascotSpeech.classList.remove('show');
    
    setTimeout(() => {
        mascotSpeech.textContent = mascotSay[step] || mascotSay[0];
        mascotSpeech.classList.add('show');
    }, 200);

    mascotAvatar.classList.remove('happy', 'thinking');
    if (type === 'happy') mascotAvatar.classList.add('happy');
    if (type === 'thinking') mascotAvatar.classList.add('thinking');
}

// Attach event listeners
document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', function() {
        const field = this.getAttribute('data-field');
        const value = this.getAttribute('data-value');
        const stepContainer = this.closest('.step-content');
        stepContainer.querySelectorAll('.option-card').forEach(c => {
            c.classList.remove('selected');
        });
        this.classList.add('selected');
        userProfile[field] = value;
        
        // Interaction: Mascot gets happy when selection is made
        updateMascot(currentStep, 'happy');
        
        checkStepValidity();
    });
});

btnNext.addEventListener('click', () => {
    if (currentStep < totalSteps) {
        currentStep++;
        updateUI();
        // Mascot state: thinking while waiting for input on new step
        updateMascot(currentStep, 'thinking');
    }
});

btnBack.addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        updateUI();
        updateMascot(currentStep);
    }
});

btnFinish.addEventListener('click', async () => {
    updateMascot('success', 'happy');
    await generateAndSavePlan();
});

function checkStepValidity() {
    let isValid = false;
    switch (currentStep) {
        case 0: isValid = true; break;
        case 1: isValid = !!userProfile.domain; break;
        case 2: isValid = !!userProfile.dailyTime; break;
        case 3: isValid = !!userProfile.level; break;
        case 4: isValid = !!userProfile.timeline; break;
    }
    if (currentStep < totalSteps) {
        btnNext.disabled = !isValid;
    } else {
        btnFinish.disabled = !isValid;
    }
}

function updateUI() {
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    
    const nextStepEl = document.getElementById(`step-${currentStep}`);
    if (nextStepEl) {
        nextStepEl.classList.remove('hidden');
        nextStepEl.classList.add('active');
    }

    if (stepTitle) stepTitle.textContent = stepHeaders[currentStep];
    
    if (progressBarFill) {
        progressBarFill.style.width = ((currentStep / totalSteps) * 100) + '%';
    }
    
    checkStepValidity();
    
    if (currentStep === 0) {
        btnBack.classList.add('invisible');
    } else {
        btnBack.classList.remove('invisible');
    }
    
    if (currentStep === totalSteps) {
        btnNext.classList.add('hidden');
        btnFinish.classList.remove('hidden');
    } else {
        btnNext.classList.remove('hidden');
        btnFinish.classList.add('hidden');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function generateAndSavePlan() {
    // ── Topic mapping: domain → QuestionBank topic keys (MUST match exactly) ──
    const domainTopicMap = {
        "JEE":            ["kinematics","laws_of_motion","work_energy_power","electrostatics","calculus","probability","organic_chemistry","chemical_bonding"],
        "NEET":           ["kinematics","laws_of_motion","organic_chemistry","chemical_bonding","electrostatics"],
        "College Exams":  ["calculus","probability","kinematics","organic_chemistry"],
        "Placements / DSA": ["calculus","probability","kinematics","laws_of_motion"]
    };

    const selectedTopics = domainTopicMap[userProfile.domain] || domainTopicMap["JEE"];

    // ── Build nodes from topics ──
    let nodes = [];
    let topicCount;
    if (userProfile.level === "Beginner") topicCount = Math.min(6, selectedTopics.length);
    else if (userProfile.level === "Intermediate") topicCount = Math.min(5, selectedTopics.length);
    else topicCount = Math.min(4, selectedTopics.length);

    if (userProfile.timeline === "< 1 year") topicCount = Math.min(3, topicCount);

    // Reference TopicMetadata from question-bank.js (loaded on page)
    const meta = (typeof TopicMetadata !== 'undefined') ? TopicMetadata : {};

    for (let i = 0; i < topicCount; i++) {
        const topic = selectedTopics[i];
        const tm = meta[topic] || {};
        const nodeType = (i === 0) ? "concept" : (i === topicCount - 1) ? "test" : "practice";
        nodes.push({
            id: "node_" + i,
            topic: topic,
            subject: tm.subject || "physics",
            displayName: tm.displayName || topic.replace(/_/g, " "),
            resourceLinks: tm.resourceLinks || [],
            status: (i === 0) ? "active" : "locked",
            type: nodeType
        });

        // Verify topic exists in QuestionBank
        if (typeof QuestionBank !== 'undefined' && !QuestionBank[topic]) {
            console.error("Topic mismatch: no questions for", topic);
        }
    }

    const learningPlan = {
        nodes: nodes,
        currentNodeId: "node_0",
        domain: userProfile.domain,
        level: userProfile.level,
        timeline: userProfile.timeline,
        time: userProfile.dailyTime,
        createdAt: new Date().toISOString()
    };

    const userState = {
        masteryLevel: userProfile.level === "Beginner" ? 0 : userProfile.level === "Intermediate" ? 40 : 70,
        weakTopics: [],
        strongTopics: [],
        failureCount: {},
        lastActive: new Date().toISOString()
    };

    btnFinish.disabled = true;
    btnFinish.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating Path...`;

    if (!window.DataAgent || typeof window.DataAgent.ready !== 'function') {
        throw new Error('Data Agent is not available on onboarding page.');
    }

    await window.DataAgent.ready();
    await window.DataAgent.resetLearningData();
    await window.DataAgent.saveUserProfile(userProfile);
    await window.DataAgent.saveLearningPlan(learningPlan);
    await window.DataAgent.saveUserState(userState);

    console.log('[Onboarding] ✅ Generated new plan:', learningPlan);
    console.log('[Onboarding] ✅ Initialized userState:', userState);
    console.log('[Onboarding] ✅ Topics match QuestionBank keys:', nodes.map(n => n.topic));

    // Redirect to learning journey
    setTimeout(() => { window.location.href = 'learning.html'; }, 600);
}

// Initial setup
updateUI();
updateMascot(0, 'happy');