import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "At least 6 characters");

type View = "login" | "signup" | "forgot";

export default function Auth() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.issues[0].message);
      return;
    }

    if (view !== "forgot") {
      const passResult = passwordSchema.safeParse(password);
      if (!passResult.success) {
        setError(passResult.error.issues[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (view === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setError("Invalid email or password");
        }
      } else if (view === "signup") {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message.includes("already") ? "Email already registered" : error.message);
        } else {
          toast.success("Account created!");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          setError(error.message);
        } else {
          toast.success("Reset link sent!");
          setView("login");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const title = view === "login" ? "Welcome back" : view === "signup" ? "Create account" : "Reset password";
  const subtitle =
    view === "login"
      ? "Continue your learning journey"
      : view === "signup"
        ? "Start learning with your AI tutor"
        : "We'll send you a reset link";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg text-foreground">MathPath</h1>
        <div className="w-5" />
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl text-foreground">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="h-11"
              />
            </div>

            {view !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : view === "login" ? (
                "Log in"
              ) : view === "signup" ? (
                "Sign up"
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="text-center space-y-3 text-sm">
            {view === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}

            {view === "signup" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-primary hover:underline"
                >
                  Log in
                </button>
              </p>
            )}

            {view === "forgot" && (
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-muted-foreground hover:text-foreground"
              >
                Back to login
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
