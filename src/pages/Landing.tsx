import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  Eye, 
  Layers, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Sigma
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-hero-gradient opacity-90" />
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-[80px]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        {/* Navbar */}
        <header className="w-full px-6 py-6 flex justify-center sticky top-0 z-50 backdrop-blur-sm">
          <div className="flex w-full max-w-6xl items-center justify-between rounded-full glass px-6 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-8 text-primary">
                <Sigma className="w-full h-full" />
              </div>
              <h2 className="text-foreground text-lg font-bold tracking-tight hidden sm:block font-sans">
                MathPath
              </h2>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium" href="#features">
                Features
              </a>
              <a className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium" href="#how-it-works">
                How It Works
              </a>
              <a className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium" href="#diagnostic">
                Diagnostic
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                className="hidden sm:flex text-muted-foreground hover:text-foreground text-sm font-medium"
                onClick={() => navigate("/auth")}
              >
                Log In
              </button>
              <Button 
                className="rounded-full shadow-primary-glow"
                onClick={() => navigate("/auth")}
              >
                Start Free
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-20 sm:pt-20">
          <motion.div 
            className="w-full max-w-4xl flex flex-col items-center text-center gap-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Tag */}
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Reimagining Education
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl sm:text-7xl font-medium tracking-tight leading-[1.1] text-gradient-hero drop-shadow-sm"
            >
              Master math through <br />
              <span className="italic text-foreground">understanding</span>,<br /> 
              not memorization.
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={fadeInUp}
              className="max-w-2xl text-lg sm:text-xl text-muted-foreground font-light leading-relaxed"
            >
              Mathematics is a language, not a list of rules. Move beyond rote learning and start your journey to true fluency and intuition.
            </motion.p>

            {/* Interactive Input */}
            <motion.div 
              variants={fadeInUp}
              className="w-full max-w-2xl mt-8"
            >
              <label className="input-glow flex flex-col sm:flex-row w-full items-stretch rounded-full bg-card/50 border border-white/10 p-2 transition-all duration-300 hover:bg-card/70 group">
                <div className="flex items-center pl-4 pr-2 text-muted-foreground">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none text-lg py-3 px-2 font-light" 
                  placeholder="I want to understand calculus..." 
                  type="text"
                />
                <Button 
                  className="mt-2 sm:mt-0 min-w-[140px] rounded-full shadow-primary-glow transition-all transform hover:scale-105 active:scale-95"
                  onClick={() => navigate("/auth")}
                >
                  Start Journey
                </Button>
              </label>
              <p className="mt-4 text-sm text-muted-foreground/70">
                Popular: {" "}
                <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors underline decoration-border underline-offset-4">
                  Linear Algebra
                </span>, {" "}
                <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors underline decoration-border underline-offset-4">
                  Derivatives
                </span>, {" "}
                <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors underline decoration-border underline-offset-4">
                  Number Theory
                </span>
              </p>
            </motion.div>
          </motion.div>
        </main>

        {/* Features Section */}
        <section id="features" className="w-full px-6 py-20 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="flex flex-col gap-4 mb-12 text-center sm:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl text-foreground font-medium">
                Why MathPath?
              </h2>
              <p className="text-muted-foreground max-w-xl font-sans">
                We stripped away the fluff to focus on building intuition first. See the patterns behind the formulas.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Eye,
                  title: "Visual Intuition",
                  description: "Don't just solve for X. See how X changes the shape of the graph. Interactive visualizations make abstract concepts concrete."
                },
                {
                  icon: Layers,
                  title: "First Principles",
                  description: "Build understanding from the ground up. We deconstruct complex theorems into simple, logical building blocks."
                },
                {
                  icon: Clock,
                  title: "Personalized Pacing",
                  description: "No deadlines, no pressure. Learn at the speed of your curiosity with an adaptive engine that knows when you're ready to move on."
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group premium-card p-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="feature-icon mb-6">
                    <feature.icon className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-foreground font-sans">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-sans">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Diagnostic Section */}
        <section id="diagnostic" className="w-full px-6 py-20 bg-gradient-to-b from-transparent to-black/20">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
            {/* Left: Card */}
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl">
                {/* Image Area */}
                <div 
                  className="h-64 w-full bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-700"
                  style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop')",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>

                {/* Content */}
                <div className="relative -mt-20 p-8 pt-0">
                  <div className="mb-4 inline-flex items-center rounded-full bg-primary/20 border border-primary/20 px-3 py-1 backdrop-blur-md">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Recommended</span>
                  </div>
                  <h3 className="mb-2 text-2xl text-foreground">Diagnostic Assessment</h3>
                  <p className="mb-6 text-muted-foreground font-sans">
                    Not sure where to start? Our adaptive diagnostic tool finds the gaps in your knowledge and creates a custom roadmap just for you.
                  </p>
                  <button 
                    onClick={() => navigate("/auth")}
                    className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors border border-white/5 group-hover:border-primary/30"
                  >
                    <span className="font-bold text-foreground font-sans">Take the 5-minute quiz</span>
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right: Content/Stats */}
            <motion.div 
              className="w-full lg:w-1/2 flex flex-col gap-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div>
                <h2 className="text-3xl sm:text-4xl text-foreground font-medium mb-4">
                  Join 10,000+ thinkers rethinking math.
                </h2>
                <p className="text-muted-foreground text-lg font-sans">
                  From high school students to curious professionals, our community is rediscovering the beauty of mathematics.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1 font-sans">500+</div>
                  <div className="text-sm text-muted-foreground font-sans">Interactive Lessons</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1 font-sans">24/7</div>
                  <div className="text-sm text-muted-foreground font-sans">AI Tutor Support</div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="inline-block h-10 w-10 rounded-full ring-2 ring-card bg-muted"
                    />
                  ))}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card ring-2 ring-card border border-white/10">
                    <span className="text-xs font-medium text-muted-foreground">+2k</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-sans">active learners this week.</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl text-foreground font-medium mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
                A personalized learning journey designed to build true mathematical understanding.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Diagnostic", description: "Take a quick assessment to identify your current level and knowledge gaps." },
                { step: "02", title: "Theory", description: "Learn concepts through intuitive explanations and step-by-step examples." },
                { step: "03", title: "Practice", description: "Solve adaptive exercises that adjust to your skill level in real-time." },
                { step: "04", title: "Mastery", description: "Track your progress and achieve true understanding, not just memorization." }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  className="relative p-6 rounded-2xl bg-card/30 border border-white/5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl font-bold text-primary/20 mb-4 font-sans">{item.step}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2 font-sans">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-sans">{item.description}</p>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why It Works Section */}
        <section className="w-full px-6 py-20 bg-gradient-to-t from-transparent to-black/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl text-foreground font-medium mb-4">
                Why It Works
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Eye, text: "Diagnoses misconceptions before they become habits" },
                { icon: CheckCircle2, text: "Explains like a tutor, not a textbook" },
                { icon: Layers, text: "Adapts to your unique learning style" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <p className="text-muted-foreground font-sans">{item.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Testimonial Placeholder */}
            <motion.div 
              className="mt-16 p-8 rounded-2xl bg-card/30 border border-white/5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-lg text-foreground italic mb-4">
                "For the first time, I actually understand why the formulas work, not just how to use them."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="size-10 rounded-full bg-muted" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground font-sans">Pilot Student</p>
                  <p className="text-xs text-muted-foreground font-sans">Mechina Program</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-white/5 bg-black/20 backdrop-blur-lg mt-auto">
          <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="size-6 text-muted-foreground">
                <Sigma className="w-full h-full" />
              </div>
              <span className="text-muted-foreground font-medium font-sans">MathPath © 2024</span>
            </div>
            <div className="flex gap-8">
              <a className="text-muted-foreground hover:text-primary transition-colors text-sm font-sans" href="#">Terms</a>
              <a className="text-muted-foreground hover:text-primary transition-colors text-sm font-sans" href="#">Privacy</a>
              <a className="text-muted-foreground hover:text-primary transition-colors text-sm font-sans" href="#">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
