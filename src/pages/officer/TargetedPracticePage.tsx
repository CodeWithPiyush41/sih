import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PracticeCard } from '@/components/learning/PracticeCard';
import { mockTargetedPractice, mockTopics, mockSkillScores } from '@/lib/mock';
import { PracticeRecommendation } from '@/types';

export function TargetedPracticePage() {
  const navigate = useNavigate();
  const { topic } = useParams();

  // Find topic details dynamically or fallback to mock
  const topicName = topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : 'Data Validation';
  const foundTopic = mockTopics.find(t => t.name.toLowerCase() === topic?.toLowerCase());
  const score = mockSkillScores.find(s => s.topicId === foundTopic?.id)?.score || 38;

  const dynamicPractice: PracticeRecommendation = {
    ...mockTargetedPractice,
    topicName: topicName,
    currentScorePercent: score,
    previousScore: score,
    focusConcepts: foundTopic ? [`Understanding ${topicName}`, `Applying ${topicName} principles`, 'Advanced concepts'] : mockTargetedPractice.focusConcepts,
  };

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Targeted Practice Modules"
        subtitle={`Focused remediation quizzes designed specifically for your identified skill gaps in ${topicName}.`}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <PracticeCard
          recommendation={dynamicPractice}
          onStartPractice={() => navigate('/student/assessments')}
        />
      </div>
    </DashboardLayout>
  );
}
