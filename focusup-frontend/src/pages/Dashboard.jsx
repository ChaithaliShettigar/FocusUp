import { Link } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { getFocusScoreLevelInfo } from '../components/FocusScoreBadge'
import { Award, Flame, Clock, Activity, Play, Zap, ArrowRight, BookOpen, Sparkles, Target, ShieldCheck } from 'lucide-react'

export const Dashboard = () => {
  const focusScore = useFocusStore((s) => s.focusScore)
  const user = useFocusStore((s) => s.user)
  const streak = useFocusStore((s) => s.streak)
  const sessions = useFocusStore((s) => s.sessions)
  const currentSessionId = useFocusStore((s) => s.currentSessionId)
  const tabSwitches = useFocusStore((s) => s.tabSwitches)
  const currentSession = sessions.find((s) => s.id === currentSessionId)

  const currentScore = user?.focusScore || focusScore
  const scoreInfo = getFocusScoreLevelInfo(currentScore)

  return (
    <DoodleBackground>
      <div className="flex flex-col gap-8 h-full flex-1 pb-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-ink/60">Welcome to FocusUp</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight mt-1">Your focus control center</h2>
          </div>
          <Link
            to="/learn"
            className="group flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-sand shadow-md hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            <span>Add learning content</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Top Stat Cards - Taller & Larger */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Focus score"
            value={
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl">{scoreInfo.emoji}</span>
                <span>{Math.round(currentScore)}</span>
                <span className="text-xs font-bold text-ink/40">/ 100</span>
              </div>
            }
            hint={`Tier: ${scoreInfo.label}`}
            icon={Award}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Study streak"
            value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
            hint="Complete a session today to extend"
            icon={Flame}
            iconBg="bg-orange-500/10"
            iconColor="text-orange-600"
          />
          <StatCard
            title="Sessions"
            value={sessions.length}
            hint="Total sessions completed"
            icon={Clock}
            iconBg="bg-teal-500/10"
            iconColor="text-teal-600"
          />
          <StatCard
            title="Tab switches"
            value={tabSwitches}
            hint="Fewer switches = maximum focus"
            icon={Activity}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-600"
          />
        </div>

        {/* Active Session / Start Session Banner */}
        {currentSession ? (
          <div className="rounded-3xl bg-gradient-to-r from-white/95 via-white/85 to-teal-50/50 p-8 sm:p-10 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md min-h-[140px] flex items-center transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-6 w-full">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-700 animate-pulse shrink-0">
                  <Play size={26} className="fill-teal-700 ml-1" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Active Focus Session</p>
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-ping" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">Target: {currentSession.targetMinutes} min</h3>
                  <p className="text-sm font-semibold text-ink/60 mt-1">
                    Elapsed {Math.round(currentSession.elapsedSeconds / 60)} min • Active {Math.round(currentSession.activeSeconds / 60)} min • Idle {Math.round(currentSession.idleSeconds / 60)} min
                  </p>
                </div>
              </div>
              <Link
                to="/analytics"
                className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-sand shadow-md hover:scale-105 hover:shadow-lg transition-all"
              >
                View Analytics →
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white/80 hover:bg-white/95 p-8 sm:p-10 text-ink/80 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md min-h-[130px] flex flex-wrap items-center justify-between gap-6 transition-all duration-300">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shrink-0">
                <Zap size={26} />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-ink">Ready to boost your focus?</h4>
                <p className="text-sm font-medium text-ink/60 mt-1">No active session right now. Open a PDF, YouTube video, or code project from the Learn page to set your timer.</p>
              </div>
            </div>
            <Link
              to="/learn"
              className="shrink-0 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-sand shadow-md hover:scale-105 hover:shadow-xl transition-all"
            >
              Start Focus Session →
            </Link>
          </div>
        )}

        {/* Lower Focus Control Widgets to Fill Screen */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Widget 1: Focus Progress */}
          <div className="group relative overflow-hidden rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300 flex flex-col justify-between min-h-[230px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                  <Target size={16} />
                  <span>Score Goal</span>
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/10 text-teal-700">{scoreInfo.label}</span>
              </div>
              <h3 className="text-xl font-extrabold text-ink mt-4">Level Progress</h3>
              <p className="text-xs font-medium text-ink/60 leading-relaxed mt-1">Complete focus sessions with zero tab switches to unlock Legendary status.</p>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-ink mb-2">
                <span>Current Score</span>
                <span>{Math.round(currentScore)} / 100</span>
              </div>
              <div className="w-full bg-ink/10 h-3.5 rounded-full overflow-hidden p-0.5 border border-ink/5">
                <div
                  className="bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-400 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(8, currentScore))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Widget 2: Quick Learning Hub */}
          <div className="group relative overflow-hidden rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300 flex flex-col justify-between min-h-[230px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <BookOpen size={16} />
                  <span>Study Hub</span>
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-ink mt-4">Quick Study Launcher</h3>
              <p className="text-xs font-medium text-ink/60 leading-relaxed mt-1">Import fresh PDFs, YouTube lectures, or join live study rooms with peers.</p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Link
                to="/learn"
                className="flex-1 text-center rounded-full bg-ink px-4 py-3 text-xs font-bold text-sand hover:scale-105 transition-all shadow-sm"
              >
                + Add Content
              </Link>
              <Link
                to="/groups"
                className="flex-1 text-center rounded-full border border-ink/20 bg-white px-4 py-3 text-xs font-bold text-ink hover:bg-sand/40 transition-all"
              >
                Join Groups
              </Link>
            </div>
          </div>

          {/* Widget 3: Daily Pro Tip */}
          <div className="group relative overflow-hidden rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300 flex flex-col justify-between min-h-[230px] md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Sparkles size={16} />
                  <span>Focus Pro Tip</span>
                </span>
                <ShieldCheck size={18} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-extrabold text-ink mt-4">Tab Switch Defense</h3>
              <p className="text-xs font-medium text-ink/70 leading-relaxed mt-1">
                Staying focused inside the active study window trains deep attention and increases your streak multipliers automatically.
              </p>
            </div>
            <div className="mt-6 pt-3.5 border-t border-ink/5 flex items-center justify-between text-xs">
              <span className="font-semibold text-ink/50">Intervention Mode</span>
              <span className="font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active</span>
            </div>
          </div>
        </div>
      </div>
    </DoodleBackground>
  )
}

const StatCard = ({ title, value, hint, icon: Icon, iconBg = 'bg-teal-500/10', iconColor = 'text-teal-600' }) => (
  <div className="group relative overflow-hidden rounded-3xl bg-white/80 hover:bg-white/95 p-8 sm:p-9 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between min-h-[210px]">
    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/10 to-amber-400/10 blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold tracking-wide text-ink/60 uppercase">{title}</p>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ${iconColor} transition-transform group-hover:scale-110 duration-300 shadow-xs`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      <div className="mt-4 text-4xl sm:text-5xl font-black text-ink tracking-tight">
        {value}
      </div>
    </div>

    {hint && (
      <div className="mt-5 border-t border-ink/5 pt-3.5">
        <p className="text-xs font-semibold text-ink/60">{hint}</p>
      </div>
    )}
  </div>
)
