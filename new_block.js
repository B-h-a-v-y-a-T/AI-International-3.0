  let builderQuestions = [];
  let currentQbResults = [];

  function renderBuilderQuestions() {
    const list = qs("selectedQuestionsList");
    const countSpan = qs("selectedQCount");
    if (!list || !countSpan) return;

    countSpan.textContent = builderQuestions.length;

    if (builderQuestions.length === 0) {
      list.innerHTML = `<div class="text-muted small" style="padding:10px;">Select questions from the bank or add custom ones.</div>`;
      return;
    }

    list.innerHTML = builderQuestions.map((q, idx) => {
      const topRow = `<div class="row" style="background:#f1f5f9; padding:8px; border-radius:6px; justify-content:space-between;">
        <div style="font-weight:600; font-size:13px;">Q${idx + 1} (${q.topic || 'Custom'} - ${q.difficulty || 'medium'})</div>
        <div class="row" style="gap:4px;">
          <button class="btn btn-sm" onclick="window.editBuilderQ(${idx})" style="padding:2px 6px;">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="window.removeBuilderQ(${idx})" style="padding:2px 6px;">X</button>
        </div>
      </div>`;
      const qText = `<div class="small" style="margin-top:4px;">${q.question}</div>`;
      return `<div style="border:1px solid #e2e8f0; padding:4px; border-radius:6px; background:#fff; margin-bottom:4px;">${topRow}${qText}</div>`;
    }).join("");
  }

  window.addBuilderQ = (qId) => {
    const q = currentQbResults.find(x => x.id === qId);
    if (!q) return;
    builderQuestions.push(JSON.parse(JSON.stringify(q)));
    renderBuilderQuestions();
  };

  window.removeBuilderQ = (idx) => {
    builderQuestions.splice(idx, 1);
    renderBuilderQuestions();
  };

  window.editBuilderQ = (idx) => {
    const q = builderQuestions[idx];
    const newText = prompt(`Edit Question ${idx+1}`, q.question);
    if (newText !== null && newText.trim() !== '') {
      q.question = newText.trim();
      renderBuilderQuestions();
    }
  };

  qs("addCustomQBtn")?.addEventListener("click", () => {
    const topic = prompt("Topic", "general");
    if (!topic) return;
    const newText = prompt("Enter Question text");
    if (!newText) return;
    builderQuestions.push({
      id: "c_" + Date.now(),
      topic,
      difficulty: "medium",
      question: newText,
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctIndex: 0
    });
    renderBuilderQuestions();
  });

  async function loadQuestionBankPreview() {
    const topics = parseCsv(qs("qbTopicsInput")?.value || "");
    const difficulty = qs("qbDifficultySelect")?.value || "all";
    const search = qs("qbSearchInput")?.value || "";

    const query = new URLSearchParams();
    if (topics.length) query.set("topics", topics.join(","));
    if (difficulty) query.set("difficulty", difficulty);
    if (search) query.set("search", search);
    query.set("limit", "15");

    const data = await apiRequest(`/api/admin/question-bank?${query.toString()}`, { method: "GET" });
    currentQbResults = Array.isArray(data.questions) ? data.questions : [];

    const previewRow = qs("questionBankPreview");
    if (!previewRow) return;

    if (!currentQbResults.length) {
      previewRow.innerHTML = "<div class='text-muted small' style='padding:10px;'>No questions match the filters.</div>";       
      return;
    }

    previewRow.innerHTML = currentQbResults.map((q) => {
      return `
      <div style="border: 1px solid var(--border); border-radius:6px; padding:8px; margin-bottom:6px; background:#fff;">
        <div class="row" style="justify-content:space-between; margin-bottom:4px;">
          <span class="badge" style="font-size:10px;">${q.topic} - ${q.difficulty}</span>
          <button class="btn btn-sm btn-primary" onclick="window.addBuilderQ('${q.id}')" style="padding:2px 8px;">+ Add</button>
        </div>
        <div style="font-size:13px;">${q.question}</div>
      </div>
      `;
    }).join("");
  }

  async function generateDoubtQuiz() {
    const title = qs("doubtQuizTitle")?.value?.trim() || "Doubt Quiz";
    const questionCount = Number(qs("doubtQuestionCount")?.value || 8);
    const selectedTopics = parseCsv(qs("doubtTopicsInput")?.value || "");       
    const userIds = parseCsv(qs("doubtAssignToInput")?.value || "");
    const assignAllStudents = !!qs("doubtAssignAllStudents")?.checked;

    await apiRequest("/api/admin/doubt-quizzes/generate", {
      method: "POST",
      body: JSON.stringify({
        title,
        questionCount,
        selectedTopics,
        userIds,
        assignAllStudents,
      }),
    });

    await Promise.all([loadQuizLists(), loadHeatmap()]);
    alert("Doubt quiz generated.");
  }

  async function createAdminQuiz() {
    const title = qs("adminQuizTitle")?.value?.trim();
    if (!title) {
      alert("Quiz title is required.");
      return;
    }

    if (builderQuestions.length === 0) {
      alert("Please add at least 1 question to the quiz.");
      return;
    }

    const difficulty = qs("adminQuizDifficulty")?.value || "medium";
    const userIds = parseCsv(qs("adminQuizAssignTo")?.value || "");
    const assignAllStudents = !!qs("adminQuizAssignAllStudents")?.checked;      
    
    const topicsSet = new Set(builderQuestions.map(q => q.topic).filter(Boolean));
    const autoGenerate = false;

    await apiRequest("/api/admin/quizzes", {
      method: "POST",
      body: JSON.stringify({
        title,
        topics: Array.from(topicsSet),
        difficulty,
        questionCount: builderQuestions.length,
        autoGenerate,
        questions: builderQuestions,
        userIds,
        assignAllStudents,
      }),
    });

    builderQuestions = [];
    renderBuilderQuestions();
    qs("adminQuizTitle").value = "";

    await loadQuizLists();
    alert("Admin quiz successfully created and assigned.");
  }
