import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-xl text-foreground">MathPath</h1>
        <Button variant="ghost" onClick={() => navigate("/auth")}>
          Log in
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <motion.div
          className="max-w-xl text-center space-y-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-4xl sm:text-5xl text-foreground leading-tight">
            Learn math by talking,
            <br />
            <span className="text-muted-foreground">not memorizing</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            A personal AI tutor that guides you through concepts at your pace. 
            Just start a conversation.
          </p>

          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="rounded-full px-8 h-12 text-base"
            >
              Start learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Simple footer */}
      <footer className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No credit card required. Start for free.
        </p>
      </footer>
    </div>
  );
}
