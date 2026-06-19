(function (global) {
  const SUBJECT_ORDER = ["Physics", "Chemistry", "Maths"];

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function toUiSubject(examSubject) {
    if (examSubject === "Maths") return "Mathematics";
    return examSubject;
  }

  function getEligibleTopics(examSubject, selectedTopicMap) {
    const chosen = Array.isArray(selectedTopicMap[examSubject]) ? selectedTopicMap[examSubject] : [];
    if (chosen.length) return chosen;

    const cfg = global.JEETopicConfig;
    if (!cfg || !Array.isArray(cfg.subjects)) return [];
    const uiSubject = toUiSubject(examSubject);
    const subject = cfg.subjects.find((s) => s.key === uiSubject || s.examSubject === examSubject);
    return subject ? subject.topics.slice() : [];
  }

  function evenAllocation(total, topics) {
    if (!topics.length) return {};
    const base = Math.floor(total / topics.length);
    let rem = total % topics.length;
    const order = shuffle(topics);
    const out = {};

    topics.forEach((topic) => {
      out[topic] = base;
    });

    for (let i = 0; i < rem; i++) {
      out[order[i]] += 1;
    }

    return out;
  }

  function takeUniqueQuestions(pool, need, usedIds) {
    const out = [];
    const randomPool = shuffle(pool);
    for (let i = 0; i < randomPool.length && out.length < need; i++) {
      const q = randomPool[i];
      if (usedIds.has(q.id)) continue;
      usedIds.add(q.id);
      out.push(q);
    }
    return out;
  }

  function buildSubjectSet(examSubject, count, selectedTopicMap, usedIds) {
    const db = global.SATHEEQuestionDB;
    const eligibleTopics = getEligibleTopics(examSubject, selectedTopicMap);
    const alloc = evenAllocation(count, eligibleTopics);
    const chosen = [];

    eligibleTopics.forEach((topic) => {
      const topicPool = db.getQuestions(examSubject, topic);
      const required = alloc[topic] || 0;
      const picked = takeUniqueQuestions(topicPool, required, usedIds);
      chosen.push(...picked);
    });

    if (chosen.length < count) {
      const needed = count - chosen.length;
      const mergedPool = shuffle(
        eligibleTopics.flatMap((topic) => db.getQuestions(examSubject, topic))
      );
      const topUp = takeUniqueQuestions(mergedPool, needed, usedIds);
      chosen.push(...topUp);
    }

    return shuffle(chosen).slice(0, count);
  }

  function buildJeePaper(selectedTopicMap) {
    const cfg = global.JEETopicConfig;
    const fixed = (cfg && cfg.fixedPattern) || { Physics: 25, Chemistry: 25, Maths: 25 };
    const usedIds = new Set();
    const subjectSets = [];
    let hasShortfall = false;

    SUBJECT_ORDER.forEach((subject) => {
      const count = Number(fixed[subject] || 0);
      const set = buildSubjectSet(subject, count, selectedTopicMap || {}, usedIds);
      if (set.length < count) hasShortfall = true;
      subjectSets.push(...set);
    });

    return {
      questions: subjectSets,
      meta: {
        total: subjectSets.length,
        reusedCount: 0,
        hasShortfall,
        pattern: fixed,
        selectedTopics: selectedTopicMap || {}
      }
    };
  }

  global.JEEQuestionSelectionEngine = {
    buildJeePaper
  };
})(window);
