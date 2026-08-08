import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Target,
  Trophy,
  Bot,
  Users,
  BarChart3,
  BookOpen,
  FileText,
  Play,
  Code,
  CheckCircle,
  Sparkles,
  Zap,
  Shield,
  Timer,
  TrendingUp,
  GraduationCap,
  Focus,
} from 'lucide-react'

const floatingShapes = [
  { color: 'from-teal/30 to-mint/20', size: 180, top: '10%', left: '5%', delay: 0, blur: 'blur-xl' },
  { color: 'from-blue-400/20 to-purple-400/15', size: 140, top: '18%', right: '8%', delay: 0.5, blur: 'blur-lg' },
  { color: 'from-accent/20 to-orange-300/15', size: 100, top: '50%', left: '7%', delay: 1.0, blur: 'blur-md' },
  { color: 'from-mint/20 to-teal/15', size: 120, top: '60%', right: '10%', delay: 1.5, blur: 'blur-lg' },
  { color: 'from-blue-300/15 to-teal/10', size: 160, top: '30%', left: '2%', delay: 2.0, blur: 'blur-xl' },
  { color: 'from-leaf/15 to-blue-400/10', size: 80, top: '40%', right: '3%', delay: 2.5, blur: 'blur-md' },
]

const features = [
  {
    icon: Target,
    title: 'Smart Focus Tracking',
    desc: 'AI monitors your attention and gently guides you back when you drift. Track tab switches, idle time, and focus scores in real time.',
    color: 'from-teal to-blue-500',
    highlight: true,
  },
  {
    icon: Trophy,
    title: 'Gamified Learning',
    desc: 'Earn badges, maintain streaks, and compete on leaderboards. Learning becomes an adventure you won\'t want to stop.',
    color: 'from-accent to-orange-400',
    highlight: false,
  },
  {
    icon: Bot,
    title: 'AI Study Assistant',
    desc: 'Stuck on a problem? Our friendly AI HelpBot is always ready to explain concepts and answer your questions.',
    color: 'from-purple-500 to-indigo-500',
    highlight: false,
  },
  {
    icon: Users,
    title: 'Study Groups',
    desc: 'Form groups with classmates, compete together, and hold each other accountable. Focus is contagious.',
    color: 'from-blue-500 to-cyan-500',
    highlight: false,
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    desc: 'Beautiful charts show your focus patterns. Discover when you study best and optimize your schedule.',
    color: 'from-leaf to-teal',
    highlight: false,
  },
  {
    icon: BookOpen,
    title: 'Multi-Mode Learning',
    desc: 'Study PDFs, watch educational videos, or code — all in one focused environment with distraction blocking.',
    color: 'from-rose-500 to-pink-500',
    highlight: false,
  },
]

const steps = [
  {
    num: '1',
    title: 'Choose Your Content',
    desc: 'Upload a PDF, paste a YouTube link, or open the code editor. FocusUp adapts to your learning style.',
    icon: FileText,
    color: 'from-teal to-blue-500',
  },
  {
    num: '2',
    title: 'Start Your Focus Session',
    desc: 'Set your timer and dive in. Our AI tracks your attention and helps you stay on track.',
    icon: Timer,
    color: 'from-blue-500 to-purple-500',
  },
  {
    num: '3',
    title: 'Earn & Compete',
    desc: 'Complete sessions to earn points, maintain streaks, and climb the leaderboard.',
    icon: TrendingUp,
    color: 'from-accent to-orange-400',
  },
]

const learningModes = [
  {
    icon: FileText,
    title: 'PDF Reader',
    desc: 'Study documents with focus tracking',
    color: 'from-blue-500 to-teal',
    gradient: 'from-blue-500/10 to-teal/5',
  },
  {
    icon: Play,
    title: 'YouTube Mode',
    desc: 'Watch educational videos mindfully',
    color: 'from-red-500 to-pink-500',
    gradient: 'from-red-500/10 to-pink-500/5',
  },
  {
    icon: Code,
    title: 'Code Editor',
    desc: 'Practice coding with syntax highlighting',
    color: 'from-purple-500 to-indigo-500',
    gradient: 'from-purple-500/10 to-indigo-500/5',
  },
]

export const HeroParallax = () => {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  return (
    <div className="bg-gradient-to-br from-sand via-white to-sand">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden min-h-screen flex items-center">
        {/* Layered background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(139,211,221,0.18),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(59,130,246,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(241,178,74,0.06),transparent_60%)]" />
        </div>

        {/* Floating Abstract Shapes */}
        {floatingShapes.map((shape, idx) => (
          <motion.div
            key={idx}
            className={`absolute rounded-full bg-gradient-to-br ${shape.color} ${shape.blur} border border-white/30 pointer-events-none`}
            style={{
              width: shape.size,
              height: shape.size,
              top: shape.top,
              left: shape.left,
              right: shape.right,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1],
              y: [0, -25, 0],
            }}
            transition={{
              duration: 8,
              delay: shape.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(31,41,51,1)_1px,transparent_1px),linear-gradient(90deg,rgba(31,41,51,1)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <motion.div
          className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {/* Brand mark */}
              <motion.div
                className="inline-flex items-center gap-3 rounded-full bg-white/70 backdrop-blur-md border border-ink/8 px-5 py-2 mb-10 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-leaf flex items-center justify-center shadow-md">
                  <Focus className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-ink tracking-tight">FocusUp</span>
                <span className="text-ink/30">|</span>
                <span className="text-sm text-ink/50">AI Study Partner</span>
              </motion.div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-ink leading-[1.05]">
                Learn Smarter.
                <br />
                <span className="text-teal">Stay Focused.</span>
                <br />
                <span className="text-accent">Grow Together.</span>
              </h1>

              {/* Subheadline */}
              <p className="mt-8 text-lg sm:text-xl leading-relaxed text-ink/55 max-w-2xl mx-auto">
                Transform your study sessions with AI-powered focus tracking, gamification, and collaborative learning.
                <br className="hidden sm:block" />
                Make every minute count.
              </p>

              {/* CTA Buttons */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/auth"
                  className="group relative rounded-full bg-gradient-to-r from-ink to-ink/85 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-ink/25 transition-all hover:scale-105 hover:shadow-2xl active:scale-95 flex items-center gap-2.5 whitespace-nowrap overflow-hidden"
                >
                  <span className="relative z-10">Start Learning Free</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-teal to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                <Link
                  to="/auth"
                  className="group rounded-full border-2 border-ink/12 bg-white/70 backdrop-blur-md px-8 py-4 text-base font-semibold text-ink transition-all hover:bg-white hover:border-ink/20 hover:shadow-lg flex items-center gap-2.5 whitespace-nowrap"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Play className="w-4 h-4 text-accent ml-0.5" />
                  </div>
                  See How It Works
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink/45">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-leaf" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-leaf" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-leaf" />
                  <span>Setup in 30 seconds</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sand to-transparent" />
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-teal/8 border border-teal/15 px-4 py-1.5 mb-5">
              <Sparkles className="w-4 h-4 text-teal" />
              <span className="text-sm font-semibold text-teal">Why FocusUp?</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-ink mb-5">
              Everything you need to<br />
              <span className="text-teal">study smarter</span>
            </h2>
            <p className="text-lg text-ink/55 max-w-2xl mx-auto leading-relaxed">
              The best productivity techniques combined with modern technology — the ultimate study companion.
            </p>
          </motion.div>

          {/* Bento-style feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className={`group relative rounded-3xl border p-7 transition-all duration-300 overflow-hidden ${
                  feature.highlight
                    ? 'bg-gradient-to-br from-white to-teal/5 border-teal/20 shadow-lg shadow-teal/8 lg:col-span-2 lg:row-span-2'
                    : 'bg-white border-ink/7 shadow-sm hover:shadow-lg hover:border-teal/20'
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: idx * 0.06, duration: 0.5 }}
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`font-semibold text-ink mb-3 ${feature.highlight ? 'text-2xl' : 'text-xl'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-ink/55 leading-relaxed ${feature.highlight ? 'text-base' : 'text-sm'}`}>
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-sand via-white to-sand" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-teal/5 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-teal/8 border border-teal/15 px-4 py-1.5 mb-5">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-teal">Simple Process</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-ink mb-5">How it works</h2>
            <p className="text-lg text-ink/55 max-w-2xl mx-auto">Get started in seconds. No complicated setup.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: idx * 0.12, duration: 0.6 }}
              >
                <div className="group rounded-3xl bg-white border border-ink/7 p-7 shadow-sm hover:shadow-xl hover:border-teal/20 transition-all duration-300 h-full">
                  {/* Step number + icon */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {step.num}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-ink/60" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-ink mb-2">{step.title}</h3>
                  <p className="text-ink/55 leading-relaxed text-sm">{step.desc}</p>
                </div>

                {/* Connector line (hidden on last) */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-teal/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Learning Modes */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-ink text-center mb-4">
              Three powerful{' '}
              <span className="text-teal">learning modes</span>
            </h3>
            <p className="text-lg text-ink/55 text-center mb-12">Choose how you want to learn. We'll track your focus either way.</p>

            <div className="grid md:grid-cols-3 gap-6">
              {learningModes.map((mode, idx) => (
                <motion.div
                  key={idx}
                  className={`group relative rounded-3xl bg-gradient-to-br ${mode.gradient} border border-ink/7 p-8 text-center hover:shadow-xl hover:border-teal/20 transition-all duration-300 overflow-hidden`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  {/* Inner white card */}
                  <div className="absolute inset-2 rounded-2xl bg-white/80 backdrop-blur-sm" />

                  <div className="relative z-10">
                    <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                      <mode.icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-ink mb-2">{mode.title}</h4>
                    <p className="text-ink/55 text-sm">{mode.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#1a2530] to-[#0f1922]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,211,221,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.08),transparent_50%)]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 border border-white/15 px-4 py-1.5 mb-10">
              <Shield className="w-4 h-4 text-leaf" />
              <span className="text-sm font-medium text-white/70">Free to start, no strings attached</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to transform your
              <br />
              <span className="text-mint">study sessions?</span>
            </h2>

            <p className="text-xl text-white/50 mb-12 max-w-xl mx-auto leading-relaxed">
              Join students who've already discovered the power of focused learning.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/auth"
                className="group relative rounded-full bg-gradient-to-r from-teal to-blue-500 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-teal/25 transition-all hover:scale-105 hover:shadow-2xl flex items-center gap-2.5 overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                to="/auth"
                className="group rounded-full border-2 border-white/15 bg-white/8 backdrop-blur px-8 py-4 text-lg font-semibold text-white/90 hover:bg-white/15 hover:border-white/25 transition-all flex items-center gap-2.5"
              >
                <Play className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                View Demo
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/35">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-leaf/60" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-leaf/60" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-leaf/60" />
                <span>30-second setup</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
