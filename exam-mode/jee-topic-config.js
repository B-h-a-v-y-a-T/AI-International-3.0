(function (global) {
  const SUBJECTS = [
    {
      key: "Physics",
      label: "Physics",
      examSubject: "Physics",
      topics: [
        "Mechanics",
        "Electromagnetism",
        "Thermodynamics",
        "Optics",
        "Modern Physics",
        "Waves",
        "Kinematics"
      ]
    },
    {
      key: "Chemistry",
      label: "Chemistry",
      examSubject: "Chemistry",
      topics: [
        "Atomic Structure",
        "Chemical Bonding",
        "Equilibrium",
        "Organic Chemistry",
        "Electrochemistry",
        "Thermochemistry",
        "Chemical Kinetics"
      ]
    },
    {
      key: "Mathematics",
      label: "Mathematics",
      examSubject: "Maths",
      topics: [
        "Algebra",
        "Calculus",
        "Coordinate Geometry",
        "Probability",
        "Combinatorics",
        "Trigonometry",
        "Vectors and 3D Geometry"
      ]
    }
  ];

  const FIXED_PATTERN = Object.freeze({
    Physics: 25,
    Chemistry: 25,
    Maths: 25
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

  global.JEETopicConfig = Object.freeze({
    subjects: SUBJECTS,
    fixedPattern: FIXED_PATTERN,
    toExamSubject,
    toUiSubject,
    getAllTopicsByExamSubject
  });
})(window);
