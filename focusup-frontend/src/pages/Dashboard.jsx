import { Link } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { FocusScoreBadgeCompact } from '../components/FocusScoreBadge'

export const Dashboard = () => {
  const focusScore = useFocusStore((s) => s.focusScore)
  const user = useFocusStore((s) => s.user)
  const streak = useFocusStore((s) => s.streak)
  const sessions = useFocusStore((s) => s.sessions)
  const currentSessionId = useFocusStore((s) => s.currentSessionId)
  const currentSession = sessions.find((s) => s.id === currentSessionId)

  return (
    <DoodleBackground>
      <div className="flex flex-col gap-6 min-h-screen">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/60">Welcome to FocusUp</p>
            <h2 className="text-4xl font-bold text-ink">Your focus control center</h2>
          </div>
          <Link
            to="/learn"
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand shadow-soft hover:scale-105 transition-transform"
          >
            Add learning content
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="rounded-3xl bg-white/80 p-5 shadow-soft h-full flex items-center justify-center">
              <FocusScoreBadgeCompact score={user?.focusScore || focusScore} />
            </div>
          </div>
          <StatCard title="Study streak" value={`${streak} days`} hint="Complete a session to extend" />
          <StatCard title="Sessions" value={sessions.length} hint="All-time sessions you logged" />
          <StatCard title="Tab switches" value={useFocusStore((s) => s.tabSwitches)} hint="Stay inside FocusUp for fewer switches" />
        </div>

        {currentSession ? (
          <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">Active focus session</p>
                <h3 className="text-xl font-semibold text-ink">Target: {currentSession.targetMinutes} min</h3>
                <p className="text-sm text-ink/60">
                  Elapsed {Math.round(currentSession.elapsedSeconds / 60)} min • Active {Math.round(
                    currentSession.activeSeconds / 60
                  )} min • Idle {Math.round(currentSession.idleSeconds / 60)} min
                </p>
              </div>
              <Link
                to="/analytics"
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
              >
                View analytics
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white/70 p-6 text-ink/80 shadow-soft">
            No active session. Start one from the Learn page by opening a PDF or YouTube link and setting a timer.
          </div>
        )}

        <div className="mt-auto">
          <p className="text-center text-sm text-ink/60 py-8">
            FocusUp respects zero-state: nothing is prefilled. Add your own content to begin.
          </p>
        </div>
      </div>
    </DoodleBackground>
  )
}

const StatCard = ({ title, value, hint }) => (
  <div className="rounded-3xl bg-white/80 p-5 shadow-soft">
    <p className="text-sm text-ink/60">{title}</p>
    <div className="mt-2 text-3xl font-bold text-ink">{value}</div>
    <p className="mt-2 text-xs text-ink/60">{hint}</p>
  </div>
)
