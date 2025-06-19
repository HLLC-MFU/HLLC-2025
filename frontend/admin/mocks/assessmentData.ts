import { Question, AssessmentResult, AssessmentStats, ActivityProgress, AssessmentType } from '@/types/assessment';

// Mock User Statistics
export const mockUserStats = {
  totalUsers: 4386,
  registeredUsers: 4049,
  submittedAssessments: 3537,
};

// Mock Skill Assessment Questions
export const mockSkillQuestions = {
  lifeSkills: [
    {
      id: "ls1",
      text: "How much have you learned about attitudes along with the way of life and how to live with others in higher education?",
      averageScore: 3.9960015737359695,
      category: "life-skills"
    },
    {
      id: "ls2",
      text: "How well did you receive useful information relating to your study field and how to be a grace graduate?",
      averageScore: 3.9960007844309082,
      category: "life-skills"
    },
    {
      id: "ls3",
      text: "How much motivation for your study path and self-improvement do you receive?",
      averageScore: 4.245940418439114,
      category: "life-skills"
    },
    {
      id: "ls4",
      text: "How much interpersonal skills do you have?",
      averageScore: 3.9960018121545495,
      category: "life-skills"
    },
    {
      id: "ls5",
      text: "How well do you understand and value cultural and social aspects, such as recognizing the diversity of society and culture?",
      averageScore: 3.7460475736205847,
      category: "life-skills"
    }
  ],
  coreSkills: [
    {
      id: "cs1",
      text: "Creativity",
      averageScore: 3.9960169740715195,
      category: "core-skills"
    },
    {
      id: "cs2",
      text: "Analytical Thinking",
      averageScore: 3.7460474609159853,
      category: "core-skills"
    },
    {
      id: "cs3",
      text: "Digital literacy",
      averageScore: 3.99601704114129,
      category: "core-skills"
    },
    {
      id: "cs4",
      text: "Curiosity and Life-long learning",
      averageScore: 3.9960015076193427,
      category: "core-skills"
    },
    {
      id: "cs5",
      text: "Resilience, Flexibility and Agility",
      averageScore: 3.996016936833162,
      category: "core-skills"
    },
    {
      id: "cs6",
      text: "Voluntary and Empathy",
      averageScore: 3.7460172283371262,
      category: "core-skills"
    },
    {
      id: "cs7",
      text: "Leadership and Social influence",
      averageScore: 3.9960168185551925,
      category: "core-skills"
    },
    {
      id: "cs8",
      text: "Collaboration",
      averageScore: 3.9959713690894985,
      category: "core-skills"
    },
    {
      id: "cs9",
      text: "Communication",
      averageScore: 4.246001663128377,
      category: "core-skills"
    },
    {
      id: "cs10",
      text: "Cultural and Civic literacy",
      averageScore: 3.7460018717591863,
      category: "core-skills"
    },
    {
      id: "cs11",
      text: "Entrepreneurial mindset",
      averageScore: 3.992033561603505,
      category: "core-skills"
    }
  ]
};

// Mock Student Results
export const mockStudentResults = [
  {
    _id: "ar1",
    userId: "6731401001",
    userName: "KANOKNIPHA SUDCHUKIAT",
    userType: "Student",
    school: "Agro-Industry",
    major: "Innovative Food Science and Technology",
    questionId: "q1", // Placeholder, will be updated in dashboard logic
    questionText: "Placeholder question text", // Placeholder
    userAnswer: "Placeholder answer", // Placeholder
    isCorrect: true, // Placeholder
    score: 0, // Placeholder
    timeSpent: 0, // Placeholder
    completedAt: "2024-03-15T10:00:00Z", // Placeholder
    assessmentType: "pretest", // Placeholder
    submitted: true,
    skillAnswers: {
      ls1: 4,
      ls2: 4,
      ls3: 4,
      ls4: 4,
      ls5: 3,
      cs1: 3,
      cs2: 3,
      cs3: 3,
      cs4: 4,
      cs5: 4,
      cs6: 0,
      cs7: 4,
      cs8: 4,
      cs9: 4,
      cs10: 4,
      cs11: 4
    }
  },
  {
    _id: "ar2",
    userId: "6731401002",
    userName: "KRIT SUDTAGU",
    userType: "Student",
    school: "Agro-Industry",
    major: "Innovative Food Science and Technology",
    questionId: "q1", // Placeholder, will be updated in dashboard logic
    questionText: "Placeholder question text", // Placeholder
    userAnswer: "Placeholder answer", // Placeholder
    isCorrect: true, // Placeholder
    score: 0, // Placeholder
    timeSpent: 0, // Placeholder
    completedAt: "2024-03-15T11:00:00Z", // Placeholder
    assessmentType: "pretest", // Placeholder
    submitted: true,
    skillAnswers: {
      ls1: 5,
      ls2: 5,
      ls3: 5,
      ls4: 5,
      ls5: 5,
      cs1: 5,
      cs2: 5,
      cs3: 5,
      cs4: 5,
      cs5: 5,
      cs6: 5,
      cs7: 5,
      cs8: 5,
      cs9: 5,
      cs10: 5,
      cs11: 5
    }
  },
  {
    _id: "ar3",
    userId: "6731401003",
    userName: "KANTINAN THONGSRI",
    userType: "Student",
    school: "Agro-Industry",
    major: "Innovative Food Science and Technology",
    questionId: "q1", // Placeholder, will be updated in dashboard logic
    questionText: "Placeholder question text", // Placeholder
    userAnswer: "Placeholder answer", // Placeholder
    isCorrect: false, // Placeholder
    score: 0, // Placeholder
    timeSpent: 0, // Placeholder
    completedAt: "2024-03-15T12:00:00Z", // Placeholder
    assessmentType: "pretest", // Placeholder
    submitted: false,
    skillAnswers: {
      ls1: 3,
      ls2: 3,
      ls3: 4,
      ls4: 3,
      ls5: 4,
      cs1: 4,
      cs2: 3,
      cs3: 3,
      cs4: 3,
      cs5: 4,
      cs6: 3,
      cs7: 3,
      cs8: 3,
      cs9: 3,
      cs10: 3,
      cs11: 3
    }
  },
  {
    _id: "ar4",
    userId: "6400000004",
    userName: "Random Student 1",
    userType: "Student",
    school: "School of Engineering",
    major: "Computer Science",
    questionId: "q1",
    questionText: "What is the main purpose of a learning management system?",
    userAnswer: "To facilitate online learning and course management",
    isCorrect: true,
    score: 100,
    timeSpent: 60,
    completedAt: "2024-03-10T09:30:00Z",
    assessmentType: "pretest",
    submitted: true,
    skillAnswers: {}
  },
  {
    _id: "ar5",
    userId: "6400000005",
    userName: "Random Student 2",
    userType: "Teacher",
    school: "School of Science",
    major: "Physics",
    questionId: "q3",
    questionText: "How does an LMS improve student engagement?",
    userAnswer: "By providing real-time feedback",
    isCorrect: false,
    score: 0,
    timeSpent: 90,
    completedAt: "2024-03-11T14:00:00Z",
    assessmentType: "posttest",
    submitted: true,
    skillAnswers: {}
  },
  {
    _id: "ar6",
    userId: "6400000006",
    userName: "Random Student 3",
    userType: "Admin",
    school: "School of Arts",
    major: "Graphic Design",
    questionId: "q5",
    questionText: "Complete the interactive tutorial on LMS navigation",
    userAnswer: "",
    isCorrect: false,
    score: 0,
    timeSpent: 120,
    completedAt: "2024-03-12T16:45:00Z",
    assessmentType: "activity",
    submitted: false,
    skillAnswers: {}
  },
  {
    _id: "ar7",
    userId: "6400000007",
    userName: "Random Student 4",
    userType: "Student",
    school: "School of Engineering",
    major: "Computer Science",
    questionId: "q2",
    questionText: "Which of the following is NOT a key feature of modern LMS?",
    userAnswer: "Social media integration",
    isCorrect: true,
    score: 100,
    timeSpent: 50,
    completedAt: "2024-03-13T10:15:00Z",
    assessmentType: "pretest",
    submitted: true,
    skillAnswers: {}
  }
];

// Mock Questions
export const mockQuestions: Question[] = [
  {
    _id: "q1",
    text: "What is the main purpose of a learning management system?",
    type: "multiple-choice",
    options: [
      "To manage student grades only",
      "To facilitate online learning and course management",
      "To replace traditional classrooms",
      "To store student information"
    ],
    correctAnswer: 1,
    difficulty: "easy",
    assessmentType: "pretest",
    explanation: "An LMS is designed to facilitate online learning and course management.",
    isActive: true,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z"
  },
  {
    _id: "q2",
    text: "Which of the following is NOT a key feature of modern LMS?",
    type: "multiple-choice",
    options: [
      "Content management",
      "Student tracking",
      "Social media integration",
      "Assessment tools"
    ],
    correctAnswer: 2,
    difficulty: "medium",
    assessmentType: "pretest",
    explanation: "Modern LMS focuses on content, tracking, and assessments, not primarily social media integration.",
    isActive: true,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z"
  },
  {
    _id: "q3",
    text: "How does an LMS improve student engagement?",
    type: "multiple-choice",
    options: [
      "By providing real-time feedback",
      "By offering interactive content",
      "By enabling communication tools",
      "All of the above"
    ],
    correctAnswer: 3,
    difficulty: "hard",
    assessmentType: "posttest",
    explanation: "All listed options contribute to improving student engagement in an LMS.",
    isActive: true,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z"
  },
  {
    _id: "q4",
    text: "What is the primary benefit of using analytics in an LMS?",
    type: "multiple-choice",
    options: [
      "To track student attendance",
      "To monitor student progress and improve learning outcomes",
      "To generate reports for administrators",
      "To store student data"
    ],
    correctAnswer: 1,
    difficulty: "medium",
    assessmentType: "posttest",
    explanation: "LMS analytics primarily help in monitoring student progress and improving learning outcomes.",
    isActive: true,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z"
  },
  {
    _id: "q5",
    text: "Complete the interactive tutorial on LMS navigation",
    type: "short-answer",
    options: [],
    correctAnswer: 0,
    difficulty: "easy",
    assessmentType: "activity",
    explanation: "This is an activity-based question.",
    isActive: true,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z"
  }
];

// Mock Assessment Results
export const mockResults: AssessmentResult[] = [
  {
    _id: "r1",
    userId: "u1",
    userName: "John Doe",
    questionId: "q1",
    questionText: "What is the main purpose of a learning management system?",
    userAnswer: 1,
    isCorrect: true,
    score: 100,
    timeSpent: 45,
    assessmentType: "pretest",
    createdAt: "2024-03-15T10:00:00Z"
  },
  {
    _id: "r2",
    userId: "u1",
    userName: "John Doe",
    questionId: "q2",
    questionText: "Which of the following is NOT a key feature of modern LMS?",
    userAnswer: 1,
    isCorrect: false,
    score: 0,
    timeSpent: 60,
    assessmentType: "pretest",
    createdAt: "2024-03-15T10:01:00Z"
  },
  {
    _id: "r3",
    userId: "u2",
    userName: "Jane Smith",
    questionId: "q1",
    questionText: "What is the main purpose of a learning management system?",
    userAnswer: 1,
    isCorrect: true,
    score: 100,
    timeSpent: 30,
    assessmentType: "pretest",
    createdAt: "2024-03-15T11:00:00Z"
  }
];

// Mock Assessment Stats
export const mockStats: Record<AssessmentType, AssessmentStats> = {
  pretest: {
    totalQuestions: 2,
    totalAttempts: 3,
    averageScore: 0.67,
    completionRate: 0.75,
    averageTimeSpent: 60,
    totalStudents: mockUserStats.registeredUsers,
    difficultyDistribution: {
      easy: 1,
      medium: 1,
      hard: 0
    },
    questionTypeDistribution: {
      "multiple-choice": 1,
      "true-false": 0,
      "short-answer": 0
    }
  },
  posttest: {
    totalQuestions: 2,
    totalAttempts: 2,
    averageScore: 0.75,
    completionRate: 0.5,
    averageTimeSpent: 90,
    totalStudents: mockUserStats.registeredUsers,
    difficultyDistribution: {
      easy: 0,
      medium: 1,
      hard: 1
    },
    questionTypeDistribution: {
      "multiple-choice": 1,
      "true-false": 0,
      "short-answer": 0
    }
  }
};

// Mock Activity Progress
export const mockActivityProgress: ActivityProgress[] = [
  {
    _id: "ap1",
    userId: "u1",
    userName: "John Doe",
    activityId: "q5",
    activityName: "LMS Navigation Tutorial",
    progress: 75,
    status: "in-progress",
    lastAccessed: "2024-03-15T14:30:00Z"
  },
  {
    _id: "ap2",
    userId: "u2",
    userName: "Jane Smith",
    activityId: "q5",
    activityName: "LMS Navigation Tutorial",
    progress: 100,
    status: "completed",
    lastAccessed: "2024-03-15T13:00:00Z"
  },
  {
    _id: "ap3",
    userId: "u3",
    userName: "Mike Johnson",
    activityId: "q5",
    activityName: "LMS Navigation Tutorial",
    progress: 0,
    status: "not-started",
    lastAccessed: "2024-03-15T09:00:00Z"
  }
]; 