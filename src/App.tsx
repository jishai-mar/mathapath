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
import { PersistentGilbert } from "@/components/tutor/PersistentGilbert";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Smart router that handles auth state and redirects
function AppRoutes() {
  const { user, loading } = useAuth();
  const { isFirstTime, isLoading: tutorLoading } = useTutor();
  const [diagnosticCompleted, setDiagnosticCompleted] = useState<boolean | null>(null);
  const [checkingDiagnostic, setCheckingDiagnostic] = useState(true);

  useEffect(() => {
    const checkDiagnosticStatus = async () => {
      if (!user) {
        setDiagnosticCompleted(null);
        setCheckingDiagnostic(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('comprehensive_diagnostic_completed')
          .eq('id', user.id)
          .single();

        setDiagnosticCompleted(data?.comprehensive_diagnostic_completed ?? false);
      } catch {
        setDiagnosticCompleted(false);
      } finally {
        setCheckingDiagnostic(false);
      }
    };

    checkDiagnosticStatus();
  }, [user]);

  // Show nothing while loading to prevent flash
  if (loading || checkingDiagnostic || tutorLoading) {
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
          ) : !diagnosticCompleted ? (
            <ComprehensiveDiagnostic />
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
              <PersistentGilbert />
            </ExerciseProvider>
          </TutorSessionProvider>
        </TutorProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
