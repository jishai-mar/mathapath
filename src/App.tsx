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

// Pages
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ComprehensiveDiagnostic from "./pages/ComprehensiveDiagnostic";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  const { isLoading: tutorLoading } = useTutor();
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
          .from("profiles")
          .select("comprehensive_diagnostic_completed")
          .eq("id", user.id)
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

  if (loading || checkingDiagnostic || tutorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <Landing />
          ) : !diagnosticCompleted ? (
            <ComprehensiveDiagnostic />
          ) : (
            <Home />
          )
        }
      />
      <Route path="/auth" element={<Auth />} />
      <Route path="/diagnostic" element={<ComprehensiveDiagnostic />} />
      <Route path="/profile" element={<Profile />} />
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
            </ExerciseProvider>
          </TutorSessionProvider>
        </TutorProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
