import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateQuestionQuality, GroundedQuestionSchema } from '../../../../server/lib/ai/tasks/generate-grounded-questions';

describe('Phase 12 MCQ Engine & Quality Rules', () => {
  it('should validate standard MCQ structure correctly', () => {
    const validQuestion = {
      questionText: 'What is the primary sampling unit in NSSO multi-stage stratified sampling?',
      questionType: 'mcq' as const,
      difficulty: 'medium' as const,
      competencyArea: 'Survey Methodology',
      topic: 'Sampling Methods',
      options: [
        { id: 'a', label: 'A', text: 'First stage units such as census villages or urban blocks' },
        { id: 'b', label: 'B', text: 'Individual household members' },
        { id: 'c', label: 'C', text: 'District administration offices' },
        { id: 'd', label: 'D', text: 'National statistical computing centers' },
      ],
      correctOption: 'a',
      explanation: 'In multi-stage sampling, rural census villages and urban frame survey blocks serve as primary sampling units.',
      evidenceSnippet: 'First stage units (FSU) are villages in rural sector and UFS blocks in urban sector.',
      source: {
        pageStart: 4,
        pageEnd: 5,
      },
    };

    const parsed = GroundedQuestionSchema.parse(validQuestion);
    expect(parsed.questionType).toBe('mcq');
    expect(parsed.options.length).toBe(4);

    const quality = validateQuestionQuality(validQuestion);
    expect(quality.valid).toBe(true);
    expect(quality.issues.length).toBe(0);
  });

  it('should reject questions with duplicate option choices', () => {
    const duplicateQuestion = {
      questionText: 'Which organization conducts large-scale socioeconomic surveys in India?',
      questionType: 'mcq' as const,
      difficulty: 'easy' as const,
      competencyArea: 'Official Statistics',
      topic: 'Survey Organizations',
      options: [
        { id: 'a', label: 'A', text: 'National Sample Survey Office' },
        { id: 'b', label: 'B', text: 'National Sample Survey Office' }, // duplicate
        { id: 'c', label: 'C', text: 'Reserve Bank of India' },
        { id: 'd', label: 'D', text: 'NITI Aayog' },
      ],
      correctOption: 'a',
      explanation: 'NSSO conducts multi-subject socio-economic surveys across India.',
      evidenceSnippet: 'NSSO is responsible for conducting large scale nationwide sample surveys.',
      source: { pageStart: 1, pageEnd: 1 },
    };

    const quality = validateQuestionQuality(duplicateQuestion);
    expect(quality.valid).toBe(false);
    expect(quality.issues).toContain('Question options contain duplicate choices');
  });

  it('should reject questions where correct option does not exist in choices', () => {
    const invalidCorrectQuestion = {
      questionText: 'What is the recommended range check for household size in NSS survey schedules?',
      questionType: 'mcq' as const,
      difficulty: 'medium' as const,
      competencyArea: 'Data Validation',
      topic: 'Logical Editing',
      options: [
        { id: 'a', label: 'A', text: '1 to 25 members' },
        { id: 'b', label: 'B', text: '50 to 100 members' },
        { id: 'c', label: 'C', text: 'Negative values only' },
        { id: 'd', label: 'D', text: 'Unbounded values' },
      ],
      correctOption: 'z', // Invalid option ID
      explanation: 'Household size range is logically validated between 1 and 25.',
      evidenceSnippet: 'Range checks enforce household member count between 1 and 25.',
      source: { pageStart: 12, pageEnd: 12 },
    };

    const quality = validateQuestionQuality(invalidCorrectQuestion);
    expect(quality.valid).toBe(false);
    expect(quality.issues).toContain('Specified correct option does not match any choice ID');
  });

  it('should perform deterministic scoring for submitted options', () => {
    const answerKey = [
      { id: 'q1', correctOptId: 'opt-101', marks: 1, topic: 'Sampling' },
      { id: 'q2', correctOptId: 'opt-202', marks: 1, topic: 'Data Validation' },
    ];

    const studentAnswers = [
      { questionId: 'q1', selectedOptionId: 'opt-101' }, // Correct
      { questionId: 'q2', selectedOptionId: 'opt-999' }, // Incorrect
    ];

    let score = 0;
    let total = 0;
    const topicScores: Record<string, { correct: number; total: number }> = {};

    for (const item of answerKey) {
      total += item.marks;
      if (!topicScores[item.topic]) topicScores[item.topic] = { correct: 0, total: 0 };
      topicScores[item.topic].total += 1;

      const userAns = studentAnswers.find(a => a.questionId === item.id);
      if (userAns && userAns.selectedOptionId === item.correctOptId) {
        score += item.marks;
        topicScores[item.topic].correct += 1;
      }
    }

    const percentage = Math.round((score / total) * 100);
    expect(score).toBe(1);
    expect(total).toBe(2);
    expect(percentage).toBe(50);
    expect(topicScores['Sampling'].correct).toBe(1);
    expect(topicScores['Data Validation'].correct).toBe(0);
  });
});
