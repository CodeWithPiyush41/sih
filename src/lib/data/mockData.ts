import type {
  Course,
  Topic,
  Question,
  Assessment,
  Attempt,
  TopicScore,
  StudentCourseSummary,
} from '@/lib/types';
import { computeRecommendedReviewOrder } from '@/lib/recommend';

export const mockUsers = [
  { id: 't1', name: 'Dr. Elena Vasquez', role: 'teacher' as const },
  { id: 's1', name: 'Maya Chen', role: 'student' as const },
  { id: 's2', name: 'Jordan Park', role: 'student' as const },
  { id: 's3', name: 'Aisha Okafor', role: 'student' as const },
  { id: 's4', name: 'Liam Murphy', role: 'student' as const },
];

export const mockCourses: Course[] = [
  {
    id: 'c1',
    teacherId: 't1',
    name: 'Java Programming',
    description: 'Fundamentals of object-oriented programming in Java, from syntax to design patterns.',
    createdAt: '2025-08-15T10:00:00Z',
  },
  {
    id: 'c2',
    teacherId: 't1',
    name: 'Data Structures & Algorithms',
    description: 'Core data structures, algorithmic complexity, and problem-solving techniques.',
    createdAt: '2025-09-01T10:00:00Z',
  },
];

export const mockTopics: Topic[] = [
  // Java Programming topics
  { id: 't1', courseId: 'c1', name: 'Variables & data types', prerequisiteTopicIds: [] },
  { id: 't2', courseId: 'c1', name: 'Control flow', prerequisiteTopicIds: ['t1'] },
  { id: 't3', courseId: 'c1', name: 'Methods & parameters', prerequisiteTopicIds: ['t1', 't2'] },
  { id: 't4', courseId: 'c1', name: 'Classes & objects', prerequisiteTopicIds: ['t1', 't3'] },
  { id: 't5', courseId: 'c1', name: 'Inheritance & polymorphism', prerequisiteTopicIds: ['t4'] },
  { id: 't6', courseId: 'c1', name: 'Exception handling', prerequisiteTopicIds: ['t2', 't3'] },
  { id: 't7', courseId: 'c1', name: 'Collections framework', prerequisiteTopicIds: ['t4', 't6'] },
  // DSA topics
  { id: 't8', courseId: 'c2', name: 'Arrays', prerequisiteTopicIds: [] },
  { id: 't9', courseId: 'c2', name: 'Linked lists', prerequisiteTopicIds: ['t8'] },
  { id: 't10', courseId: 'c2', name: 'Stacks & queues', prerequisiteTopicIds: ['t9'] },
  { id: 't11', courseId: 'c2', name: 'Trees & BSTs', prerequisiteTopicIds: ['t10'] },
  { id: 't12', courseId: 'c2', name: 'Sorting algorithms', prerequisiteTopicIds: ['t8'] },
  { id: 't13', courseId: 'c2', name: 'Big-O analysis', prerequisiteTopicIds: ['t8', 't12'] },
];

export const mockQuestions: Question[] = [
  // t1 — Variables & data types
  {
    id: 'q1',
    courseId: 'c1',
    topicId: 't1',
    prompt: 'Which keyword declares a constant in Java?',
    options: [
      { id: 'a', text: 'static' },
      { id: 'b', text: 'final' },
      { id: 'c', text: 'const' },
      { id: 'd', text: 'immutable' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'approved',
  },
  {
    id: 'q2',
    courseId: 'c1',
    topicId: 't1',
    prompt: 'What is the default value of an int field in Java?',
    options: [
      { id: 'a', text: 'null' },
      { id: 'b', text: '0' },
      { id: 'c', text: 'undefined' },
      { id: 'd', text: '1' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'approved',
  },
  {
    id: 'q3',
    courseId: 'c1',
    topicId: 't1',
    prompt: 'Which data type stores a single character literal?',
    options: [
      { id: 'a', text: 'String' },
      { id: 'b', text: 'char' },
      { id: 'c', text: 'text' },
      { id: 'd', text: 'letter' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'pending_review',
  },
  // t2 — Control flow
  {
    id: 'q4',
    courseId: 'c1',
    topicId: 't2',
    prompt: 'Which loop guarantees at least one execution?',
    options: [
      { id: 'a', text: 'for' },
      { id: 'b', text: 'while' },
      { id: 'c', text: 'do-while' },
      { id: 'd', text: 'for-each' },
    ],
    correctOptionId: 'c',
    difficulty: 'easy',
    status: 'approved',
  },
  {
    id: 'q5',
    courseId: 'c1',
    topicId: 't2',
    prompt: 'What does the break statement do inside a switch?',
    options: [
      { id: 'a', text: 'Skips to the next case' },
      { id: 'b', text: 'Exits the switch block' },
      { id: 'c', text: 'Restarts the switch' },
      { id: 'd', text: 'Throws an exception' },
    ],
    correctOptionId: 'b',
    difficulty: 'medium',
    status: 'pending_review',
  },
  // t3 — Methods & parameters
  {
    id: 'q6',
    courseId: 'c1',
    topicId: 't3',
    prompt: 'What does void mean in a method signature?',
    options: [
      { id: 'a', text: 'The method is private' },
      { id: 'b', text: 'The method returns nothing' },
      { id: 'c', text: 'The method is empty' },
      { id: 'd', text: 'The method is deprecated' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'approved',
  },
  {
    id: 'q7',
    courseId: 'c1',
    topicId: 't3',
    prompt: 'Which keyword passes a parameter by reference in Java?',
    options: [
      { id: 'a', text: 'ref' },
      { id: 'b', text: 'out' },
      { id: 'c', text: 'No keyword — Java is pass-by-value' },
      { id: 'd', text: 'byref' },
    ],
    correctOptionId: 'c',
    difficulty: 'hard',
    status: 'pending_review',
  },
  // t4 — Classes & objects
  {
    id: 'q8',
    courseId: 'c1',
    topicId: 't4',
    prompt: 'Which keyword is used to create a new object instance?',
    options: [
      { id: 'a', text: 'create' },
      { id: 'b', text: 'new' },
      { id: 'c', text: 'make' },
      { id: 'd', text: 'instance' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'approved',
  },
  {
    id: 'q9',
    courseId: 'c1',
    topicId: 't4',
    prompt: 'What is a constructor in Java?',
    options: [
      { id: 'a', text: 'A method that destroys objects' },
      { id: 'b', text: 'A special method called when an object is created' },
      { id: 'c', text: 'A static utility method' },
      { id: 'd', text: 'A loop initializer' },
    ],
    correctOptionId: 'b',
    difficulty: 'medium',
    status: 'pending_review',
  },
  // t5 — Inheritance & polymorphism
  {
    id: 'q10',
    courseId: 'c1',
    topicId: 't5',
    prompt: 'Which keyword extends a parent class?',
    options: [
      { id: 'a', text: 'implements' },
      { id: 'b', text: 'extends' },
      { id: 'c', text: 'inherits' },
      { id: 'd', text: 'super' },
    ],
    correctOptionId: 'b',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q11',
    courseId: 'c1',
    topicId: 't5',
    prompt: 'What is runtime polymorphism achieved through?',
    options: [
      { id: 'a', text: 'Method overloading' },
      { id: 'b', text: 'Method overriding' },
      { id: 'c', text: 'Static methods' },
      { id: 'd', text: 'Final methods' },
    ],
    correctOptionId: 'b',
    difficulty: 'hard',
    status: 'pending_review',
  },
  // t6 — Exception handling
  {
    id: 'q12',
    courseId: 'c1',
    topicId: 't6',
    prompt: 'Which block executes whether an exception is thrown or not?',
    options: [
      { id: 'a', text: 'try' },
      { id: 'b', text: 'catch' },
      { id: 'c', text: 'finally' },
      { id: 'd', text: 'throw' },
    ],
    correctOptionId: 'c',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q13',
    courseId: 'c1',
    topicId: 't6',
    prompt: 'Which keyword explicitly throws an exception?',
    options: [
      { id: 'a', text: 'catch' },
      { id: 'b', text: 'throws' },
      { id: 'c', text: 'throw' },
      { id: 'd', text: 'raise' },
    ],
    correctOptionId: 'c',
    difficulty: 'easy',
    status: 'pending_review',
  },
  // t7 — Collections
  {
    id: 'q14',
    courseId: 'c1',
    topicId: 't7',
    prompt: 'Which collection allows duplicate elements and maintains insertion order?',
    options: [
      { id: 'a', text: 'HashSet' },
      { id: 'b', text: 'TreeSet' },
      { id: 'c', text: 'ArrayList' },
      { id: 'd', text: 'HashMap' },
    ],
    correctOptionId: 'c',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q15',
    courseId: 'c1',
    topicId: 't7',
    prompt: 'Which interface does HashMap implement?',
    options: [
      { id: 'a', text: 'List' },
      { id: 'b', text: 'Set' },
      { id: 'c', text: 'Map' },
      { id: 'd', text: 'Queue' },
    ],
    correctOptionId: 'c',
    difficulty: 'medium',
    status: 'pending_review',
  },
  // DSA questions
  {
    id: 'q16',
    courseId: 'c2',
    topicId: 't8',
    prompt: 'What is the time complexity of accessing an array element by index?',
    options: [
      { id: 'a', text: 'O(n)' },
      { id: 'b', text: 'O(1)' },
      { id: 'c', text: 'O(log n)' },
      { id: 'd', text: 'O(n²)' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'approved',
  },
  {
    id: 'q17',
    courseId: 'c2',
    topicId: 't9',
    prompt: 'What is the key advantage of a linked list over an array?',
    options: [
      { id: 'a', text: 'Faster random access' },
      { id: 'b', text: 'Dynamic size without reallocation' },
      { id: 'c', text: 'Better cache locality' },
      { id: 'd', text: 'Lower memory overhead' },
    ],
    correctOptionId: 'b',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q18',
    courseId: 'c2',
    topicId: 't10',
    prompt: 'Which data structure uses LIFO ordering?',
    options: [
      { id: 'a', text: 'Queue' },
      { id: 'b', text: 'Stack' },
      { id: 'c', text: 'Tree' },
      { id: 'd', text: 'Heap' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'pending_review',
  },
  {
    id: 'q19',
    courseId: 'c2',
    topicId: 't11',
    prompt: 'In a BST, what is the inorder traversal time complexity?',
    options: [
      { id: 'a', text: 'O(1)' },
      { id: 'b', text: 'O(log n)' },
      { id: 'c', text: 'O(n)' },
      { id: 'd', text: 'O(n²)' },
    ],
    correctOptionId: 'c',
    difficulty: 'medium',
    status: 'pending_review',
  },
  {
    id: 'q20',
    courseId: 'c2',
    topicId: 't12',
    prompt: 'What is the average time complexity of quicksort?',
    options: [
      { id: 'a', text: 'O(n)' },
      { id: 'b', text: 'O(n log n)' },
      { id: 'c', text: 'O(n²)' },
      { id: 'd', text: 'O(log n)' },
    ],
    correctOptionId: 'b',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q21',
    courseId: 'c2',
    topicId: 't13',
    prompt: 'Which complexity represents the tightest upper bound on an algorithm?',
    options: [
      { id: 'a', text: 'Big-O' },
      { id: 'b', text: 'Big-Omega' },
      { id: 'c', text: 'Big-Theta' },
      { id: 'd', text: 'Little-o' },
    ],
    correctOptionId: 'a',
    difficulty: 'hard',
    status: 'pending_review',
  },
];

export const mockAssessments: Assessment[] = [
  {
    id: 'a1',
    courseId: 'c1',
    title: 'Java Fundamentals Quiz',
    questionIds: ['q1', 'q2', 'q4', 'q6', 'q8', 'q10', 'q12', 'q14'],
    createdAt: '2025-08-20T10:00:00Z',
  },
  {
    id: 'a2',
    courseId: 'c1',
    title: 'Advanced Java Concepts',
    questionIds: ['q3', 'q5', 'q7', 'q9', 'q11', 'q13', 'q15'],
    createdAt: '2025-09-05T10:00:00Z',
  },
  {
    id: 'a3',
    courseId: 'c2',
    title: 'DSA Basics',
    questionIds: ['q16', 'q17', 'q18', 'q19', 'q20', 'q21'],
    createdAt: '2025-09-10T10:00:00Z',
  },
];

export const mockAttempts: Attempt[] = [
  {
    id: 'att1',
    assessmentId: 'a1',
    studentId: 's1',
    answers: [
      { questionId: 'q1', selectedOptionId: 'b', correct: true },
      { questionId: 'q2', selectedOptionId: 'b', correct: true },
      { questionId: 'q4', selectedOptionId: 'c', correct: true },
      { questionId: 'q6', selectedOptionId: 'b', correct: true },
      { questionId: 'q8', selectedOptionId: 'b', correct: true },
      { questionId: 'q10', selectedOptionId: 'a', correct: false },
      { questionId: 'q12', selectedOptionId: 'c', correct: true },
      { questionId: 'q14', selectedOptionId: 'c', correct: true },
    ],
    submittedAt: '2025-08-22T14:30:00Z',
  },
  {
    id: 'att2',
    assessmentId: 'a2',
    studentId: 's1',
    answers: [
      { questionId: 'q3', selectedOptionId: 'b', correct: true },
      { questionId: 'q5', selectedOptionId: 'b', correct: true },
      { questionId: 'q7', selectedOptionId: 'a', correct: false },
      { questionId: 'q9', selectedOptionId: 'b', correct: true },
      { questionId: 'q11', selectedOptionId: 'b', correct: true },
      { questionId: 'q13', selectedOptionId: 'c', correct: true },
      { questionId: 'q15', selectedOptionId: 'c', correct: true },
    ],
    submittedAt: '2025-09-07T14:30:00Z',
  },
];

// Student enrollment map
const enrollments: Record<string, string[]> = {
  s1: ['c1', 'c2'],
  s2: ['c1'],
  s3: ['c1', 'c2'],
  s4: ['c2'],
};

// Pre-computed topic scores per student per course
const studentTopicScores: Record<string, Record<string, TopicScore[]>> = {
  s1: {
    c1: [
      { topicId: 't1', topicName: 'Variables & data types', scorePercent: 100, questionsAnswered: 2, questionsCorrect: 2 },
      { topicId: 't2', topicName: 'Control flow', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't3', topicName: 'Methods & parameters', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't4', topicName: 'Classes & objects', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't5', topicName: 'Inheritance & polymorphism', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't6', topicName: 'Exception handling', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't7', topicName: 'Collections framework', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
    ],
    c2: [
      { topicId: 't8', topicName: 'Arrays', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't9', topicName: 'Linked lists', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't10', topicName: 'Stacks & queues', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't11', topicName: 'Trees & BSTs', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't12', topicName: 'Sorting algorithms', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't13', topicName: 'Big-O analysis', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
    ],
  },
  s2: {
    c1: [
      { topicId: 't1', topicName: 'Variables & data types', scorePercent: 50, questionsAnswered: 2, questionsCorrect: 1 },
      { topicId: 't2', topicName: 'Control flow', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't3', topicName: 'Methods & parameters', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't4', topicName: 'Classes & objects', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't5', topicName: 'Inheritance & polymorphism', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't6', topicName: 'Exception handling', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't7', topicName: 'Collections framework', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
    ],
  },
  s3: {
    c1: [
      { topicId: 't1', topicName: 'Variables & data types', scorePercent: 100, questionsAnswered: 2, questionsCorrect: 2 },
      { topicId: 't2', topicName: 'Control flow', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't3', topicName: 'Methods & parameters', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't4', topicName: 'Classes & objects', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't5', topicName: 'Inheritance & polymorphism', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't6', topicName: 'Exception handling', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't7', topicName: 'Collections framework', scorePercent: 50, questionsAnswered: 2, questionsCorrect: 1 },
    ],
    c2: [
      { topicId: 't8', topicName: 'Arrays', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't9', topicName: 'Linked lists', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't10', topicName: 'Stacks & queues', scorePercent: 100, questionsAnswered: 1, questionsCorrect: 1 },
      { topicId: 't11', topicName: 'Trees & BSTs', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't12', topicName: 'Sorting algorithms', scorePercent: 50, questionsAnswered: 2, questionsCorrect: 1 },
      { topicId: 't13', topicName: 'Big-O analysis', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
    ],
  },
  s4: {
    c2: [
      { topicId: 't8', topicName: 'Arrays', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't9', topicName: 'Linked lists', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't10', topicName: 'Stacks & queues', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't11', topicName: 'Trees & BSTs', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't12', topicName: 'Sorting algorithms', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
      { topicId: 't13', topicName: 'Big-O analysis', scorePercent: 0, questionsAnswered: 1, questionsCorrect: 0 },
    ],
  },
};

// Data access functions — components call these, never the raw arrays

export function getCoursesForTeacher(teacherId: string): Course[] {
  return mockCourses.filter((c) => c.teacherId === teacherId);
}

export function getCourseById(courseId: string): Course | undefined {
  return mockCourses.find((c) => c.id === courseId);
}

export function getTopicsForCourse(courseId: string): Topic[] {
  return mockTopics.filter((t) => t.courseId === courseId);
}

export function getQuestionsForCourse(courseId: string): Question[] {
  return mockQuestions.filter((q) => q.courseId === courseId);
}

export function getQuestionsForTopic(topicId: string): Question[] {
  return mockQuestions.filter((q) => q.topicId === topicId);
}

export function getAssessmentsForCourse(courseId: string): Assessment[] {
  return mockAssessments.filter((a) => a.courseId === courseId);
}

export function getAssessmentById(assessmentId: string): Assessment | undefined {
  return mockAssessments.find((a) => a.id === assessmentId);
}

export function getQuestionsByIds(questionIds: string[]): Question[] {
  return questionIds
    .map((id) => mockQuestions.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined);
}

export function getEnrolledCoursesForStudent(studentId: string): Course[] {
  const courseIds = enrollments[studentId] ?? [];
  return courseIds
    .map((id) => mockCourses.find((c) => c.id === id))
    .filter((c): c is Course => c !== undefined);
}

export function getStudentCountForCourse(courseId: string): number {
  return Object.values(enrollments).filter((ids) => ids.includes(courseId)).length;
}

export function getStudentIdsForCourse(courseId: string): string[] {
  return Object.entries(enrollments)
    .filter(([, ids]) => ids.includes(courseId))
    .map(([sid]) => sid);
}

export function getStudentName(studentId: string): string {
  return mockUsers.find((u) => u.id === studentId)?.name ?? 'Unknown student';
}

export function getTopicScoresForStudent(studentId: string, courseId: string): TopicScore[] {
  return studentTopicScores[studentId]?.[courseId] ?? [];
}

export function getStudentCourseSummary(studentId: string, courseId: string): StudentCourseSummary {
  const course = getCourseById(courseId);
  const topicScores = getTopicScoresForStudent(studentId, courseId);
  const topics = getTopicsForCourse(courseId);

  const overall = topicScores.length > 0
    ? Math.round(topicScores.reduce((sum, t) => sum + t.scorePercent, 0) / topicScores.length)
    : 0;

  const weakest = topicScores.length > 0
    ? topicScores.reduce((min, t) => (t.scorePercent < min.scorePercent ? t : min), topicScores[0])
    : null;

  const recommendedOrder = computeRecommendedReviewOrder(topicScores, topics);

  return {
    courseId,
    courseName: course?.name ?? 'Unknown course',
    overallScorePercent: overall,
    topicScores,
    weakestTopic: weakest,
    recommendedReviewOrder: recommendedOrder,
  };
}

export function getClassWideTopicScores(courseId: string): TopicScore[] {
  const studentIds = getStudentIdsForCourse(courseId);
  const topics = getTopicsForCourse(courseId);

  return topics.map((topic) => {
    const allScores = studentIds
      .map((sid) => getTopicScoresForStudent(sid, courseId).find((ts) => ts.topicId === topic.id))
      .filter((ts): ts is TopicScore => ts !== undefined);

    const avg = allScores.length > 0
      ? Math.round(allScores.reduce((sum, ts) => sum + ts.scorePercent, 0) / allScores.length)
      : 0;

    const totalAnswered = allScores.reduce((sum, ts) => sum + ts.questionsAnswered, 0);
    const totalCorrect = allScores.reduce((sum, ts) => sum + ts.questionsCorrect, 0);

    return {
      topicId: topic.id,
      topicName: topic.name,
      scorePercent: avg,
      questionsAnswered: totalAnswered,
      questionsCorrect: totalCorrect,
    };
  });
}

export function getAttemptsForStudent(studentId: string): Attempt[] {
  return mockAttempts.filter((a) => a.studentId === studentId);
}

export function getAttemptById(attemptId: string): Attempt | undefined {
  return mockAttempts.find((a) => a.id === attemptId);
}

export function computeAttemptScores(attempt: Attempt): TopicScore[] {
  const questions = getQuestionsByIds(attempt.answers.map((a) => a.questionId));
  const topics = getTopicsForCourse(questions[0]?.courseId ?? '');

  const byTopic = new Map<string, { answered: number; correct: number }>();

  for (const answer of attempt.answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;
    const entry = byTopic.get(question.topicId) ?? { answered: 0, correct: 0 };
    entry.answered += 1;
    if (answer.correct) entry.correct += 1;
    byTopic.set(question.topicId, entry);
  }

  return topics
    .map((topic) => {
      const entry = byTopic.get(topic.id) ?? { answered: 0, correct: 0 };
      return {
        topicId: topic.id,
        topicName: topic.name,
        scorePercent: entry.answered > 0 ? Math.round((entry.correct / entry.answered) * 100) : 0,
        questionsAnswered: entry.answered,
        questionsCorrect: entry.correct,
      };
    })
    .filter((ts) => ts.questionsAnswered > 0);
}
