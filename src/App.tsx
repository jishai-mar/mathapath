import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TutorProvider, useTutor } from "@/contexts/TutorContext";
import { TutorSessionProvider } from "@/contexts/TutorSessionContext";
import { ExerciseProvider } from "@/contexts/ExerciseContext";
import { AppProvider } from "@/contexts/AppContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { GlobalTutorButton } from "@/components/tutor/GlobalTutorButton";
import { FloatingTutorWidget } from "@/components/session/FloatingTutorWidget";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// Pages
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Practice from "./pages/Practice";
import DiagnosticTest from "./pages/DiagnosticTest";
import ComprehensiveDiagnostic from "./pages/ComprehensiveDiagnostic";
import LearningProfile from "./pages/LearningProfile";
import Profile from "./pages/Profile";
import MeetYourTutor from "./pages/MeetYourTutor";
import SessionHistory from "./pages/SessionHistory";
import Notebook from "./pages/Notebook";
import Bookmarks from "./pages/Bookmarks";
import VoiceFirstTutoring from "./pages/VoiceFirstTutoring";
import TheoryTopic from "./pages/TheoryTopic";
import PracticeExam from "./pages/PracticeExam";
import LevelAssessment from "./pages/TestYourself";
import ExponentialTutorDemo from "./pages/ExponentialTutorDemo";
import PracticeQuestion from "./pages/PracticeQuestion";
import ScanWork from "./pages/ScanWork";
import NotFound from "./pages/NotFound";
import SetLearningGoal from "./pages/SetLearningGoal";
import TopicExam from "./pages/TopicExam";
import LearningPathScreen from "./pages/LearningPathScreen";
import LessonScreen from "./pages/LessonScreen";
import TopicMasteryTest from "./pages/TopicMasteryTest";
import TopicTheoryBlocks from "./pages/TopicTheoryBlocks";
import AdminTheoryGenerator from "./pages/AdminTheoryGenerator";
import History from "./pages/History";
import { TOPIC_DATABASE_IDS } from "./data/topicDatabaseMapping";

// Helper component to redirect /theory/:topicSlug to /topic-theory/:topicId
function TheorySlugRedirect() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const databaseId = topicSlug ? TOPIC_DATABASE_IDS[topicSlug] : null;
  
  if (databaseId) {
    return <Navigate to={`/topic-theory/${databaseId}`} replace />;
  }
  
  // If no valid mapping, redirect to dashboard
  return <Navigate to="/" replace />;
}

const queryClient = new QueryClient();

// Smart router that handles auth state and redirects
function AppRoutes() {
  const { user, loading } = useAuth();
  const { isFirstTime, isLoading: tutorLoading } = useTutor();

  // Show nothing while loading to prevent flash
  if (loading || tutorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public landing page for non-authenticated users */}
      <Route 
        path="/" 
        element={
          !user ? (
            <Landing />
          ) : isFirstTime ? (
            <MeetYourTutor />
          ) : (
            <Dashboard />
          )
        } 
      />
      <Route path="/auth" element={<Auth />} />
      <Route path="/diagnostic" element={<ComprehensiveDiagnostic />} />
      <Route path="/diagnostic/:topicId" element={<DiagnosticTest />} />
      <Route path="/practice/:topicId" element={<Practice />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/learning-profile" element={<LearningProfile />} />
      <Route path="/meet-tutor" element={<MeetYourTutor />} />
      <Route path="/session-history" element={<History />} />
      <Route path="/notebook" element={<Notebook />} />
      <Route path="/bookmarks" element={<Bookmarks />} />
      <Route path="/voice-tutor" element={<VoiceFirstTutoring />} />
      {/* Theory routes */}
      <Route path="/theory/:topicSlug" element={<TheorySlugRedirect />} />
      <Route path="/theory-legacy/:topicId" element={<TheoryTopic />} />
      <Route path="/practice-exam" element={<PracticeExam />} />
      <Route path="/find-your-level" element={<LevelAssessment />} />
      <Route path="/exponential-tutor" element={<ExponentialTutorDemo />} />
      <Route path="/practice-question/:subtopicId" element={<PracticeQuestion />} />
      <Route path="/scan-work" element={<ScanWork />} />
      <Route path="/set-goal" element={<SetLearningGoal />} />
      <Route path="/topic-exam/:topicId" element={<TopicExam />} />
      <Route path="/learning-path/:topicId" element={<LearningPathScreen />} />
      <Route path="/lesson/:topicId/:lessonId" element={<LessonScreen />} />
      <Route path="/topic-mastery-test/:topicId" element={<TopicMasteryTest />} />
      <Route path="/topic-theory/:topicId" element={<TopicTheoryBlocks />} />
      <Route path="/admin/theory-generator" element={<AdminTheoryGenerator />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TutorProvider>
          <TutorSessionProvider>
            <ExerciseProvider>
              <AppProvider>
                <SessionProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppRoutes />
                    <GlobalTutorButton />
                    <FloatingTutorWidget />
                  </BrowserRouter>
                </SessionProvider>
              </AppProvider>
            </ExerciseProvider>
          </TutorSessionProvider>
        </TutorProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
