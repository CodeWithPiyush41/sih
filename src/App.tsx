import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider } from '@/context/AssessmentContext';
import { AuthProvider, ProtectedRoute } from '@/lib/auth/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';

// Officer Pages
import { StudentDashboard } from '@/pages/officer/StudentDashboard';
import { PersonalPracticeFlow } from '@/pages/officer/PersonalPracticeFlow';
import { MaterialsLibraryPage } from '@/pages/officer/MaterialsLibraryPage';
import { UploadPDFPage } from '@/pages/officer/UploadPDFPage';
import { AssessmentConfigPage } from '@/pages/officer/AssessmentConfigPage';
import { AssessmentQuestionPage } from '@/pages/officer/AssessmentQuestionPage';
import { CodingAssessmentPage } from '@/pages/officer/CodingAssessmentPage';
import { AssessmentResultPage } from '@/pages/officer/AssessmentResultPage';
import { AssessmentTakePage } from '@/pages/officer/AssessmentTakePage';
import { CompetencyPassportPage } from '@/pages/officer/CompetencyPassportPage';
import { SkillAnalysisPage } from '@/pages/officer/SkillAnalysisPage';
import { TargetedPracticePage } from '@/pages/officer/TargetedPracticePage';
import { LearningPathPage } from '@/pages/officer/LearningPathPage';
import { ProgressPage } from '@/pages/officer/ProgressPage';
import { AssistantPage } from '@/pages/officer/AssistantPage';

// Training Coordinator Pages
import { TeacherDashboard } from '@/pages/coordinator/TeacherDashboard';
import { TeacherStudentsPage } from '@/pages/coordinator/TeacherStudentsPage';
import { TeacherAssessmentsPage } from '@/pages/coordinator/TeacherAssessmentsPage';
import { TeacherAnalyticsPage } from '@/pages/coordinator/TeacherAnalyticsPage';
import { TeacherMaterialsPage } from '@/pages/coordinator/TeacherMaterialsPage';
import { TeacherStudentDetailPage } from '@/pages/coordinator/TeacherStudentDetailPage';
import { TeacherAssessmentDetailPage } from '@/pages/coordinator/TeacherAssessmentDetailPage';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminCoursesPage } from '@/pages/admin/AdminCoursesPage';
import { AdminAssignmentsPage } from '@/pages/admin/AdminAssignmentsPage';
import { AIStatusPage } from '@/pages/admin/AIStatusPage';
import { AdminIGOTImportPage } from '@/pages/admin/AdminIGOTImportPage';

// Shared Pages
import { SettingsPage } from '@/pages/SettingsPage';

import { ToastProvider } from '@/components/ui/ToastContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AssessmentProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/personal-practice"
              element={
                <ProtectedRoute allowedRole="student">
                  <PersonalPracticeFlow />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/materials"
              element={
                <ProtectedRoute allowedRole="student">
                  <MaterialsLibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/upload"
              element={
                <ProtectedRoute allowedRole="student">
                  <UploadPDFPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/config-assessment"
              element={
                <ProtectedRoute allowedRole="student">
                  <AssessmentConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assessments"
              element={
                <ProtectedRoute allowedRole="student">
                  <PersonalPracticeFlow />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assessments/:id"
              element={
                <ProtectedRoute allowedRole="student">
                  <AssessmentTakePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/coding-assessment/:assessmentId"
              element={
                <ProtectedRoute allowedRole="student">
                  <CodingAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results/:attemptId"
              element={
                <ProtectedRoute allowedRole="student">
                  <AssessmentResultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/passport"
              element={
                <ProtectedRoute allowedRole="student">
                  <CompetencyPassportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/skills"
              element={<Navigate to="/student/passport" replace />}
            />
            <Route
              path="/student/practice/:topic"
              element={
                <ProtectedRoute allowedRole="student">
                  <TargetedPracticePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/learning-path"
              element={
                <ProtectedRoute allowedRole="student">
                  <LearningPathPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/progress"
              element={
                <ProtectedRoute allowedRole="student">
                  <ProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assistant"
              element={
                <ProtectedRoute allowedRole="student">
                  <AssistantPage />
                </ProtectedRoute>
              }
            />

            {/* Teacher Protected Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students/:studentId"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherStudentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assessments"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherAssessmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assessments/:assessmentId"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherAssessmentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/materials"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherMaterialsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/analytics"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherAnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminAssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ai-status"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AIStatusPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/igot/import"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminIGOTImportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/igot"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminIGOTImportPage />
                </ProtectedRoute>
              }
            />

            {/* Settings Route */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          </AssessmentProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
