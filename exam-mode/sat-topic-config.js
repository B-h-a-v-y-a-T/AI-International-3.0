(function (global) {
  const SUBJECTS = [
    {
      key: "Reading and Writing",
      label: "Reading and Writing",
      examSubject: "Reading and Writing",
      topics: [
        "Craft and Structure",
        "Information and Ideas",
        "Standard English Conventions",
        "Expression of Ideas"
      ]
    },
    {
      key: "Math",
      label: "Math",
      examSubject: "Math",
      topics: [
        "Algebra",
        "Advanced Math",
        "Problem-Solving and Data Analysis",
        "Geometry and Trigonometry"
      ]
    }
  ];

  const FIXED_PATTERN = Object.freeze({
    "Reading and Writing": 54,
    "Math": 44
  });

  function getSubjectByExamName(examSubject) {
    return SUBJECTS.find((s) => s.examSubject === examSubject) || null;
  }

  function getSubjectByUiName(uiSubject) {
    return SUBJECTS.find((s) => s.key === uiSubject) || null;
  }

  function toExamSubject(uiSubject) {
    const subject = getSubjectByUiName(uiSubject);
    return subject ? subject.examSubject : uiSubject;
  }

  function toUiSubject(examSubject) {
    const subject = getSubjectByExamName(examSubject);
    return subject ? subject.key : examSubject;
  }

  function getAllTopicsByExamSubject() {
    const out = {};
    SUBJECTS.forEach((subject) => {
      out[subject.examSubject] = [...subject.topics];
    });
    return out;
  }

  global.SATTopicConfig = Object.freeze({
    examName: "SAT",
    subjects: SUBJECTS,
    fixedPattern: FIXED_PATTERN,
    toExamSubject,
    toUiSubject,
    getAllTopicsByExamSubject
  });
})(window);
