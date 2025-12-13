import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  SectionHeader, 
  FeatureCard, 
  StepCard, 
  BackgroundOrbs 
} from '@/components/ui/premium-components';
import { 
  Sparkles, 
  Brain, 
  Target, 
  TrendingUp, 
  Play, 
  BookOpen,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Calculator
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text">Math</span>Path
            </span>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex"
            >
              Sign in
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="press-effect bg-primary hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 hero-pattern noise">
        <BackgroundOrbs />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered Personalized Learning
            </span>
          </motion.div>
          
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Master Math Through
            <br />
            <span className="gradient-text">Deep Understanding</span>
          </motion.h1>
          
          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Not just practice — real comprehension. Our AI tutor identifies your gaps, 
            adapts to how you think, and guides you to genuine mathematical fluency.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="press-effect text-lg px-8 py-6 bg-primary hover:bg-primary/90 glow-primary"
            >
              <Target className="w-5 h-5 mr-2" />
              Start Diagnostic Test
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="press-effect text-lg px-8 py-6"
            >
              Sign In
            </Button>
          </motion.div>
          
          {/* Trust indicators */}
          <motion.div
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Personalized from day one</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Unlimited practice</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="How MathPath Works"
            subtitle="Four steps to transform your mathematical understanding"
            className="mb-16"
          />
          
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-2">
              <StepCard
                step={1}
                title="Take the Diagnostic"
                description="A friendly assessment that maps your current knowledge across all topics. No pressure — it's designed to understand how you think."
                icon={Target}
                index={0}
              />
              <StepCard
                step={2}
                title="Get Your Learning Profile"
                description="AI analyzes your strengths, gaps, and common misconceptions to create a personalized learning path just for you."
                icon={Brain}
                index={1}
              />
              <StepCard
                step={3}
                title="Learn with Theory & Video"
                description="Each concept comes with clear explanations, worked examples, and animated videos that build real understanding."
                icon={Play}
                index={2}
              />
              <StepCard
                step={4}
                title="Practice Adaptively"
                description="Exercises adjust to your level in real-time. Struggling? Get easier problems and guidance. Excelling? Face tougher challenges."
                icon={TrendingUp}
                index={3}
              />
            </div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="relative h-full flex flex-col justify-center items-center text-center">
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Brain className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">AI-Powered Adaptation</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Every interaction teaches the AI more about how you learn, 
                    making each session more effective than the last.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 sm:py-32 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="Why Students Love MathPath"
            subtitle="Built for understanding, not just memorization"
            className="mb-16"
          />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Brain}
              title="Tutor-Like Guidance"
              description="Our AI explains the 'why' behind every step, just like a patient human tutor would."
              index={0}
            />
            <FeatureCard
              icon={Zap}
              title="Unlimited Exercises"
              description="AI generates fresh problems at exactly your level. Never run out of practice material."
              index={1}
            />
            <FeatureCard
              icon={BookOpen}
              title="Theory + Video"
              description="Every topic includes clear explanations, worked examples, and animated video lessons."
              index={2}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Track Progress"
              description="See your mastery grow with detailed insights into strengths and areas to improve."
              index={3}
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <SectionHeader
            title="Why This Works"
            subtitle="Traditional apps give you problems. We give you understanding."
            className="mb-12"
          />
          
          <motion.div
            className="grid sm:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            <div className="p-6">
              <div className="text-4xl font-bold gradient-text mb-2">100%</div>
              <div className="text-muted-foreground">Personalized to you</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold gradient-text mb-2">∞</div>
              <div className="text-muted-foreground">AI-generated exercises</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-muted-foreground">Available whenever you need</div>
            </div>
          </motion.div>
          
          <motion.div
            className="mt-12 p-8 rounded-2xl glass border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-lg text-muted-foreground mb-6">
              "Static problem sets can't see where you're confused. MathPath's AI notices 
              your mistakes, identifies the underlying misconception, and teaches you 
              the concept — not just the answer."
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Built for real students, by educators</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Actually
              <br />
              <span className="gradient-text">Understand Math?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Start with a free diagnostic test. In 15 minutes, you'll have a 
              personalized learning profile and a clear path forward.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="press-effect text-lg px-10 py-6 bg-primary hover:bg-primary/90 glow-primary"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Free Diagnostic
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold">MathPath</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2024 MathPath. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
