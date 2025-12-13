import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Brain, 
  Target, 
  TrendingUp, 
  Play, 
  MessageCircle,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  GraduationCap,
  BarChart3,
  Infinity,
  Clock,
  type LucideIcon
} from 'lucide-react';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

function AnimatedTutorBoard() {
  return (
    <motion.div 
      className="relative w-full max-w-lg aspect-square"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10 rounded-3xl blur-3xl" />
      <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50 overflow-hidden p-6">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="relative h-full flex flex-col justify-center space-y-6">
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.6 }}>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-lg text-foreground/80">f(x) = 2x² + 3x - 5</span>
          </motion.div>
          <motion.div className="flex items-center gap-3 pl-6" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.6 }}>
            <span className="text-muted-foreground font-mono">→</span>
            <span className="font-mono text-foreground/70">x = (-3 ± √49) / 4</span>
          </motion.div>
          <motion.div className="flex items-center gap-3 pl-6" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.6 }}>
            <span className="text-muted-foreground font-mono">→</span>
            <span className="font-mono text-primary font-semibold">x = 1 or x = -2.5</span>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4, type: "spring" }}>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </motion.div>
          </motion.div>
          <motion.div className="absolute bottom-6 right-6 max-w-[200px]" initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.6, duration: 0.5 }}>
            <div className="relative p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <p className="text-xs text-foreground/80 pl-4">"Great work! You correctly applied the quadratic formula."</p>
            </div>
          </motion.div>
        </div>
        <motion.div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-primary/20" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute bottom-4 left-4 w-12 h-12 rounded-full border border-accent/20" animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} />
      </div>
    </motion.div>
  );
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      <motion.div className="absolute w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 60%)', top: '-30%', right: '-20%' }} animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 60%)', bottom: '-20%', left: '-15%' }} animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)', top: '40%', left: '30%' }} animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
    </div>
  );
}

function PremiumFeatureCard({ icon: Icon, title, description, gradient }: { icon: LucideIcon; title: string; description: string; gradient: string }) {
  return (
    <motion.div className="group relative p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 overflow-hidden" variants={fadeInUp} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--accent) / 0.1) 100%)' }} />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function StepItem({ number, icon: Icon, title, description, isLast = false }: { number: number; icon: LucideIcon; title: string; description: string; isLast?: boolean }) {
  return (
    <motion.div className="relative flex flex-col items-center text-center" variants={fadeInUp}>
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">{number}</div>
      </div>
      <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[200px]">{description}</p>
      {!isLast && <motion.div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-[2px]" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.8 }} style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.1))', transformOrigin: 'left' }} />}
    </motion.div>
  );
}

function ClaimCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <motion.div className="flex flex-col items-center text-center p-6" variants={scaleIn}>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 border border-primary/10">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">{description}</p>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const navOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <motion.nav className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: `hsl(var(--background) / ${navOpacity})`, backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border) / 0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">M</span>
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">Math<span className="text-primary">Path</span></span>
          </motion.div>
          <motion.div className="flex items-center gap-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Button variant="ghost" onClick={() => navigate('/auth')} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">Sign in</Button>
            <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">Get Started<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </motion.div>
        </div>
      </motion.nav>

      <section className="relative min-h-screen flex items-center pt-20">
        <HeroBackground />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"><Sparkles className="w-4 h-4" />AI-Powered Math Tutor</span>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">Master Math Through<br /><span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">Deep Understanding</span></motion.h1>
              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">Not just practice — real comprehension. Our AI tutor diagnoses your gaps, adapts to how you think, and guides you to genuine mathematical fluency.</motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button size="lg" onClick={() => navigate('/auth')} className="text-base px-6 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/30 transition-all hover:scale-[1.02]"><Target className="w-5 h-5 mr-2" />Start Diagnostic Test</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-base px-6 py-6 border-border/50 hover:bg-card/50">Sign In</Button>
              </motion.div>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><span>Free diagnostic test</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><span>Personalized from day one</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><span>No credit card</span></div>
              </motion.div>
            </motion.div>
            <div className="hidden lg:block"><AnimatedTutorBoard /></div>
          </div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="text-primary text-sm font-medium mb-4 block">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Your Path to Mathematical Mastery</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Four steps to transform your understanding — personalized to how you learn.</p>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <StepItem number={1} icon={Target} title="Diagnostic" description="A friendly assessment that maps your knowledge across all topics." />
            <StepItem number={2} icon={Brain} title="Personalized Theory" description="Clear explanations and worked examples tailored to your gaps." />
            <StepItem number={3} icon={MessageCircle} title="Guided Practice" description="AI-generated exercises that adapt in real-time to your level." />
            <StepItem number={4} icon={TrendingUp} title="Progress & Mastery" description="Track your growth and watch your understanding deepen." isLast />
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="text-primary text-sm font-medium mb-4 block">FEATURES</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Everything You Need to Excel</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built for understanding, not memorization. Every feature is designed to help you learn deeply.</p>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <PremiumFeatureCard icon={Brain} title="Tutor-Like Guidance" description="Our AI explains the 'why' behind every step — like a patient tutor by your side." gradient="bg-gradient-to-br from-primary/5 to-transparent" />
            <PremiumFeatureCard icon={Infinity} title="Unlimited Exercises" description="AI generates fresh problems at exactly your level. Never run out of practice." gradient="bg-gradient-to-br from-accent/5 to-transparent" />
            <PremiumFeatureCard icon={Play} title="Theory + Video" description="Every topic includes clear explanations, worked examples, and animated lessons." gradient="bg-gradient-to-br from-success/5 to-transparent" />
            <PremiumFeatureCard icon={BarChart3} title="Progress Tracking" description="See your mastery grow with insights into strengths and areas to improve." gradient="bg-gradient-to-br from-warning/5 to-transparent" />
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="text-primary text-sm font-medium mb-4 block">WHY IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Traditional Apps Give You Problems.<br /><span className="text-primary">We Give You Understanding.</span></h2>
          </motion.div>
          <motion.div className="grid sm:grid-cols-3 gap-4 mb-16" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <ClaimCard icon={Lightbulb} title="Diagnoses Misconceptions" description="AI identifies where your understanding breaks down, not just what's wrong." />
            <ClaimCard icon={GraduationCap} title="Explains Like a Tutor" description="Step-by-step guidance that teaches the 'why' behind every solution." />
            <ClaimCard icon={Zap} title="Adapts to Your Level" description="Exercises automatically adjust based on your progress and struggles." />
          </motion.div>
          <motion.div className="max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30">
              <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">Pilot Student</div>
              <blockquote className="text-lg text-foreground/90 leading-relaxed mb-4">"I used to just memorize formulas. Now I actually understand why they work. The AI caught mistakes I didn't even know I was making."</blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">S</div>
                <div><div className="font-medium text-sm">Student Feedback</div><div className="text-xs text-muted-foreground">Mechina Math Program</div></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
          <motion.div className="absolute w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 60%)', bottom: '-30%', left: '50%', transform: 'translateX(-50%)' }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">Ready to Actually<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Understand Math?</span></h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">Start with a free diagnostic. In 15 minutes, you'll have a personalized learning profile and a clear path forward.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-base px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/35 transition-all hover:scale-[1.02]"><Sparkles className="w-5 h-5 mr-2" />Start Free Diagnostic</Button>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>15 min diagnostic</span></div>
              <div className="flex items-center gap-2"><Zap className="w-4 h-4" /><span>Instant results</span></div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/30 py-12 bg-card/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center"><span className="text-sm font-bold text-primary-foreground">M</span></div>
              <span className="font-semibold">MathPath</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <div className="text-sm text-muted-foreground">© 2024 MathPath. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
