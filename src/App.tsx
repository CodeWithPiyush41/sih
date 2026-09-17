import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AssessmentProvider } from '@/context/AssessmentContext';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { NewCoursePage } from '@/pages/teacher/NewCoursePage';
import { CourseOverviewPage } from '@/pages/teacher/CourseOverviewPage';
import { UploadPage } from '@/pages/teacher/UploadPage';
import { QuestionReviewPage } from '@/pages/teacher/QuestionReviewPage';
import { AnalyticsPage } from '@/pages/teacher/AnalyticsPage';
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentCoursePage } from '@/pages/student/StudentCoursePage';
import { AssessmentRunnerPage } from '@/pages/student/AssessmentRunnerPage';
import { ResultsPage } from '@/pages/student/ResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/courses/new" element={<NewCoursePage />} />
          <Route path="/teacher/courses/:courseId" element={<CourseOverviewPage />} />
          <Route path="/teacher/courses/:courseId/upload" element={<UploadPage />} />
          <Route path="/teacher/courses/:courseId/questions" element={<QuestionReviewPage />} />
          <Route path="/teacher/analytics" element={<AnalyticsPage />} />

          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/courses/:courseId" element={<StudentCoursePage />} />
          <Route
            path="/student/courses/:courseId/assessment/:assessmentId"
            element={<AssessmentRunnerPage />}
          />
          <Route
            path="/student/courses/:courseId/results/:attemptId"
            element={<ResultsPage />}
          />
        </Routes>
      </AssessmentProvider>
    </BrowserRouter>
  );
}
