import { createContext, useContext, useState, type ReactNode } from 'react';

interface AnswerState {
  [questionId: string]: string;
}

interface AssessmentContextValue {
  currentQuestionIndex: number;
  answers: AnswerState;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswer: (questionId: string, optionId: string) => void;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});

  const setAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const reset = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  return (
    <AssessmentContext.Provider
      value={{ currentQuestionIndex, answers, setCurrentQuestionIndex, setAnswer, reset }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
