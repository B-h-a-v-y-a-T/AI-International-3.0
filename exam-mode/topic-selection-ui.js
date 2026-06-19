(function (global) {
  const state = {
    mounted: false,
    visible: false,
    mountEl: null,
    summaryEl: null,
    clearBtnEl: null,
    onChange: null,
    selectedByUiSubject: {
      Physics: new Set(),
      Chemistry: new Set(),
      Mathematics: new Set()
    }
  };

  function getSubjects() {
    if (!global.JEETopicConfig || !Array.isArray(global.JEETopicConfig.subjects)) return [];
    return global.JEETopicConfig.subjects;
  }

  function resetStateSets() {
    state.selectedByUiSubject = {
      Physics: new Set(),
      Chemistry: new Set(),
      Mathematics: new Set()
    };
  }

  function buildSubjectMarkup(subject) {
    const topicItems = subject.topics
      .map(
        (topic) => `
        <label class="jee-topic-item">
          <input type="checkbox" data-subject="${subject.key}" data-topic="${topic}" />
          <span>${topic}</span>
        </label>`
      )
      .join("");

    return `
      <section class="jee-topic-subject">
        <h4>${subject.label}</h4>
        <div class="jee-topic-list">${topicItems}</div>
        <div class="jee-topic-tip">Tip: Cmd/Ctrl + click to select multiple topics.</div>
      </section>`;
  }

  function render() {
    if (!state.mountEl) return;
    const subjects = getSubjects();
    state.mountEl.innerHTML = `
      <div class="jee-topic-focus">
        <div class="jee-topic-head">
          <div class="jee-topic-title">
            <i data-lucide="plus-circle" style="width:20px;height:20px;color:#60a5fa"></i>
            <span>Select Topic Focus</span>
          </div>
          <button type="button" class="jee-topic-clear-btn" id="jeeTopicClearBtnInternal">Clear Topic Focus</button>
        </div>
        <p class="jee-topic-desc">Pick topic focus for each subject. Questions will be sampled only from selected topics while keeping 25 questions per subject.</p>
        <div class="jee-topic-summary" id="jeeTopicSummaryInternal">No focus selected (full exam mode).</div>
        <div class="jee-topic-grid">${subjects.map(buildSubjectMarkup).join("")}</div>
      </div>
    `;

    state.summaryEl = state.mountEl.querySelector("#jeeTopicSummaryInternal");
    state.clearBtnEl = state.mountEl.querySelector("#jeeTopicClearBtnInternal");

    bindEvents();
    if (global.lucide && typeof global.lucide.createIcons === "function") {
      global.lucide.createIcons();
    }
    syncChecksFromState();
    updateSummary();
  }

  function syncChecksFromState() {
    if (!state.mountEl) return;
    const checks = state.mountEl.querySelectorAll("input[type='checkbox'][data-subject][data-topic]");
    checks.forEach((checkbox) => {
      const uiSubject = checkbox.getAttribute("data-subject");
      const topic = checkbox.getAttribute("data-topic");
      checkbox.checked = state.selectedByUiSubject[uiSubject] && state.selectedByUiSubject[uiSubject].has(topic);
    });
  }

  function bindEvents() {
    if (!state.mountEl) return;
    state.mountEl.querySelectorAll("input[type='checkbox'][data-subject][data-topic]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const uiSubject = checkbox.getAttribute("data-subject");
        const topic = checkbox.getAttribute("data-topic");
        if (!state.selectedByUiSubject[uiSubject]) {
          state.selectedByUiSubject[uiSubject] = new Set();
        }

        if (checkbox.checked) {
          state.selectedByUiSubject[uiSubject].add(topic);
        } else {
          state.selectedByUiSubject[uiSubject].delete(topic);
        }

        updateSummary();
        emitChange();
      });
    });

    if (state.clearBtnEl) {
      state.clearBtnEl.addEventListener("click", () => {
        resetSelections();
      });
    }
  }

  function emitChange() {
    if (typeof state.onChange === "function") {
      state.onChange(getSelectedTopics());
    }
  }

  function getSelectedTopics() {
    const result = {
      Physics: [],
      Chemistry: [],
      Maths: []
    };

    const subjects = getSubjects();
    subjects.forEach((subject) => {
      const selected = Array.from(state.selectedByUiSubject[subject.key] || []);
      result[subject.examSubject] = selected;
    });

    return result;
  }

  function getSelectedCount() {
    return Object.values(getSelectedTopics()).reduce((sum, arr) => sum + arr.length, 0);
  }

  function updateSummary() {
    if (!state.summaryEl) return;
    const selected = getSelectedTopics();
    const total = getSelectedCount();

    if (!total) {
      state.summaryEl.textContent = "No focus selected (full exam mode).";
      return;
    }

    const parts = [];
    if (selected.Physics.length) parts.push(`Physics: ${selected.Physics.length}`);
    if (selected.Chemistry.length) parts.push(`Chemistry: ${selected.Chemistry.length}`);
    if (selected.Maths.length) parts.push(`Mathematics: ${selected.Maths.length}`);

    state.summaryEl.textContent = `Focused topics selected (${total}): ${parts.join(", ")}`;
  }

  function resetSelections() {
    resetStateSets();
    syncChecksFromState();
    updateSummary();
    emitChange();
  }

  function setVisible(visible) {
    state.visible = Boolean(visible);
    if (!state.mountEl) return;
    state.mountEl.style.display = state.visible ? "block" : "none";
  }

  function init(options) {
    const opts = options || {};
    if (!opts.mountId) return;

    state.mountEl = document.getElementById(opts.mountId);
    state.onChange = typeof opts.onChange === "function" ? opts.onChange : null;
    if (!state.mountEl) return;

    if (!state.mounted) {
      render();
      state.mounted = true;
    }

    setVisible(opts.visible !== false);
  }

  global.JEETopicSelector = {
    init,
    render,
    setVisible,
    resetSelections,
    getSelectedTopics,
    hasSelection: () => getSelectedCount() > 0
  };
})(window);
