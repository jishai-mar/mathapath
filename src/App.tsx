import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TutorProvider, useTutor } from "@/contexts/TutorContext";
import { TutorSessionProvider } from "@/contexts/TutorSessionContext";
import { ExerciseProvider } from "@/contexts/ExerciseContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// import { PersistentGilbert } from "@/components/tutor/PersistentGilbert";
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
import PracticeQuiz from "./pages/TestYourself";
import ExponentialTutorDemo from "./pages/ExponentialTutorDemo";
import PracticeQuestion from "./pages/PracticeQuestion";
import ScanWork from "./pages/ScanWork";
import NotFound from "./pages/NotFound";
import SetLearningGoal from "./pages/SetLearningGoal";
import TopicExam from "./pages/TopicExam";

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
      <Route path="/session-history" element={<SessionHistory />} />
      <Route path="/notebook" element={<Notebook />} />
      <Route path="/bookmarks" element={<Bookmarks />} />
      <Route path="/voice-tutor" element={<VoiceFirstTutoring />} />
      <Route path="/theory/:topicId" element={<TheoryTopic />} />
      <Route path="/practice-exam" element={<PracticeExam />} />
      <Route path="/practice-quiz" element={<PracticeQuiz />} />
      <Route path="/exponential-tutor" element={<ExponentialTutorDemo />} />
      <Route path="/practice-question/:subtopicId" element={<PracticeQuestion />} />
      <Route path="/scan-work" element={<ScanWork />} />
      <Route path="/set-goal" element={<SetLearningGoal />} />
      <Route path="/topic-exam/:topicId" element={<TopicExam />} />
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
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
              {/* <PersistentGilbert /> */}
            </ExerciseProvider>
          </TutorSessionProvider>
        </TutorProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
