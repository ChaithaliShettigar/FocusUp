import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Star, Users, Award, ArrowRight } from 'lucide-react'

export const HeroParallax = () => {
  return (
    <div className="bg-gradient-to-br from-teal/5 via-blue-50 to-teal/10">
      <section className="relative isolate overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,211,221,0.25),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.2),transparent_50%)]" />
        
        {/* Floating Education Icons */}
        {[
          { emoji: '🎓', top: '15%', left: '8%', delay: 0 },
          { emoji: '📚', top: '25%', right: '12%', delay: 0.35 },
          { emoji: '💡', top: '60%', left: '10%', delay: 0.7 },
          { emoji: '✨', top: '70%', right: '15%', delay: 1.05 },
          { emoji: '🎯', top: '40%', left: '5%', delay: 1.4 },
          { emoji: '🚀', top: '50%', right: '8%', delay: 1.75 },
        ].map((icon, idx) => (
          <motion.div
            key={idx}
            className="absolute w-[130px] h-[130px] rounded-full bg-gradient-to-br from-teal/40 to-blue-400/30 backdrop-blur-md border-2 border-teal/30 shadow-xl shadow-teal/20 flex items-center justify-center text-[80%] select-none pointer-events-none"
            style={{ top: icon.top, left: icon.left, right: icon.right }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.7, 0.9, 0.7],
              scale: [1, 1.05, 1],
              y: [0, -36, 0],
              rotate: [-9, 9, -9],
            }}
            transition={{
              duration: 6,
              delay: icon.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="text-7xl filter brightness-[0.85] contrast-[1.1]">{icon.emoji}</span>
          </motion.div>
        ))}
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <h1 className="text-6xl font-bold tracking-tight text-ink sm:text-8xl leading-tight">
                Learn Smarter.
                <span className="block text-teal">Stay Focused.</span>
                <span className="block text-gold">Grow Together.</span>
              </h1>
              <p className="mt-8 text-xl leading-relaxed text-ink/70 max-w-2xl mx-auto">
                Transform your study sessions with AI-powered focus tracking, gamification, and collaborative learning. Make every minute count.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/dashboard" className="rounded-full bg-gradient-to-r from-ink to-ink/80 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap">
                  Start Learning with FocusUp <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="rounded-full border-2 border-ink/20 bg-white/50 px-8 py-4 text-base font-semibold text-ink">Watch Demo</button>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-ink/60">
                <div className="flex items-center gap-2"><span>⭐</span><span>4.9/5 rating</span></div>
                <div className="flex items-center gap-2"><span>🎓</span><span>Used by 500+ schools</span></div>
                <div className="flex items-center gap-2"><span>🏆</span><span>Award-winning platform</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white/60 to-teal/5">
        <div className="mx-auto max-w-7xl">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-3">Why FocusUp?</p>
            <h2 className="text-4xl font-bold text-ink mb-4">Everything you need to study smarter</h2>
            <p className="text-lg text-ink/70 max-w-2xl mx-auto">
              We've combined the best productivity techniques with modern technology to create the ultimate study companion.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🎯', title: 'Smart Focus Tracking', desc: 'AI monitors your attention and gently guides you back when you drift. Track tab switches, idle time, and focus scores.' },
              { icon: '🏆', title: 'Gamified Learning', desc: 'Earn badges, maintain streaks, and compete on leaderboards. Learning becomes an adventure you don\'t want to stop.' },
              { icon: '🤖', title: 'AI Study Assistant', desc: 'Stuck on a problem? Our friendly AI HelpBot is always ready to explain concepts and answer your questions.' },
              { icon: '👥', title: 'Study Groups', desc: 'Form groups with classmates, compete together, and hold each other accountable. Focus is contagious!' },
              { icon: '📊', title: 'Progress Analytics', desc: 'Beautiful charts show your focus patterns. Discover when you study best and optimize your schedule.' },
              { icon: '📚', title: 'Multi-Mode Learning', desc: 'Study PDFs, watch educational videos, or code—all in one focused environment with distraction blocking.' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className="rounded-3xl bg-white/95 border-2 border-teal/20 p-8 shadow-lg shadow-teal/10 hover:shadow-2xl hover:shadow-teal/20 hover:border-teal/40 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-ink mb-3">{feature.title}</h3>
                <p className="text-ink/70">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-b from-teal/5 to-blue-50/50">
        <div className="mx-auto max-w-7xl">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-3">Simple Process</p>
            <h2 className="text-4xl font-bold text-ink mb-4">How it works</h2>
            <p className="text-lg text-ink/70 max-w-2xl mx-auto">Get started in seconds. No complicated setup required.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: '1', title: 'Choose Your Content', desc: 'Upload a PDF, paste a YouTube link, or open the code editor. FocusUp adapts to your learning style.', icon: '📄' },
              { num: '2', title: 'Start Your Focus Session', desc: 'Set your timer and dive in. Our AI tracks your attention and helps you stay on track.', icon: '⏱️' },
              { num: '3', title: 'Earn & Compete', desc: 'Complete sessions to earn points, maintain streaks, and climb the leaderboard. Learning has never been this fun!', icon: '🎉' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                className="relative"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.2, duration: 0.6 }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal to-blue-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-teal/30"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {step.num}
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-ink mb-2">{step.title}</h3>
                    <p className="text-ink/70 mb-4">{step.desc}</p>
                    <div className="text-6xl">{step.icon}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Three Powerful Learning Modes */}
          <motion.div className="mt-24" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="text-3xl font-bold text-ink text-center mb-4">Three powerful learning modes</h3>
            <p className="text-lg text-ink/70 text-center mb-12">Choose how you want to learn. We'll track your focus either way.</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: '📄', title: 'PDF Reader', desc: 'Study documents with focus tracking', color: 'from-blue-500 to-teal' },
                { icon: '📺', title: 'YouTube Mode', desc: 'Watch educational videos mindfully', color: 'from-red-500 to-pink-500' },
                { icon: '💻', title: 'Code Editor', desc: 'Practice coding with syntax highlighting', color: 'from-purple-500 to-indigo-500' },
              ].map((mode, idx) => (
                <motion.div
                  key={idx}
                  className="rounded-2xl bg-white/95 border-2 border-teal/20 p-8 text-center shadow-lg shadow-teal/10 hover:shadow-xl hover:shadow-teal/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                >
                  <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${mode.color} flex items-center justify-center mb-4`}>
                    <span className="text-3xl">{mode.icon}</span>
                  </div>
                  <h4 className="text-xl font-semibold text-ink mb-2">{mode.title}</h4>
                  <p className="text-ink/70">{mode.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gradient-to-b from-blue-50/50 to-white/60">
        <div className="mx-auto max-w-7xl">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-3">Student Love</p>
            <h2 className="text-4xl font-bold text-ink mb-4">Loved by students worldwide</h2>
            <p className="text-lg text-ink/70">Join thousands of students who've transformed their study habits.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Sarah Chen', role: 'Computer Science Student', quote: 'The AI helper is incredible for understanding complex topics. It\'s like having a study buddy available 24/7.', emoji: '👩‍💻' },
              { name: 'Marcus Johnson', role: 'Medical Student', quote: 'I used to get distracted every 5 minutes. Now I regularly hit 45-minute focus sessions. The streak feature is addictive!', emoji: '👨‍⚕️' },
              { name: 'Emily Park', role: 'High School Senior', quote: 'Study groups feature is amazing. My friends and I compete daily, and we\'ve all seen our grades improve.', emoji: '📚' },
              { name: 'David Martinez', role: 'Engineering Student', quote: 'FocusUp completely transformed how I study. The gamification keeps me motivated every single day.', emoji: '⚡' },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                className="rounded-3xl bg-white/95 border-2 border-teal/20 p-6 shadow-lg shadow-teal/10 hover:shadow-xl hover:shadow-teal/20"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <div className="text-4xl mb-4">{testimonial.emoji}</div>
                <p className="text-ink/80 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-ink">{testimonial.name}</p>
                  <p className="text-sm text-ink/60">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-teal to-blue-600 bg-clip-text text-transparent mb-2">10K+</p>
              <p className="text-ink/70">Active Students</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gold mb-2">500+</p>
              <p className="text-ink/70">Schools</p>
            </div>
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-teal to-blue-600 bg-clip-text text-transparent mb-2">2M+</p>
              <p className="text-ink/70">Focus Hours</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gold mb-2">4.9</p>
              <p className="text-ink/70">Average Rating</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-teal/20 via-blue-100/50 to-teal/20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6">Ready to transform your<br />study sessions?</h2>
            <p className="text-xl text-ink/70 mb-10">
              Join thousands of students who've already discovered the power of focused learning. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border-2 border-teal/30 bg-white/70 px-8 py-4 text-lg font-semibold text-ink hover:bg-white transition-all"
              >
                View Demo Dashboard
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-ink/60">
              <span>✓ Free forever plan available</span>
              <span>✓ No credit card required</span>
              <span>✓ Setup in 30 seconds</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating Join Badge */}
      <motion.div
        className="fixed bottom-8 right-8 bg-gradient-to-r from-teal to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl shadow-teal/30 z-50 flex items-center gap-3"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        whileHover={{ scale: 1.05 }}
      >
        <Users className="w-5 h-5" />
        <span className="font-semibold">Join 10,000+ focused students</span>
      </motion.div>
    </div>
  )
}
