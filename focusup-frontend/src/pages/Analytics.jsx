import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FocusScoreBadge } from '../components/FocusScoreBadge'

export const Analytics = () => {
  const sessions = useFocusStore((s) => s.sessions)
  const user = useFocusStore((s) => s.user)

  const chartData = sessions.map((s, idx) => ({
    name: `S${idx + 1}`,
    planned: s.targetMinutes,
    actual: Math.round(s.elapsedSeconds / 60),
    active: Math.round(s.activeSeconds / 60),
    idle: Math.round(s.idleSeconds / 60),
    tabSwitches: s.tabSwitches,
  }))

  const totalPlanned = chartData.reduce((sum, d) => sum + d.planned, 0)
  const totalActual = chartData.reduce((sum, d) => sum + d.actual, 0)
  const totalActive = chartData.reduce((sum, d) => sum + d.active, 0)
  const totalIdle = chartData.reduce((sum, d) => sum + d.idle, 0)

  const activityData = [
    { name: 'Active Study', value: totalActive, fill: '#1f2933' },
    { name: 'Idle Time', value: totalIdle, fill: '#8bd3dd' },
  ]

  const focusPatternData = chartData.map((d) => ({
    session: d.name,
    focusRatio: d.idle > 0 ? Math.round((d.active / (d.active + d.idle)) * 100) : 100,
  }))

  return (
    <DoodleBackground>
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-ink">Your Analytics Dashboard</h2>
            <p className="text-ink/70">Visual insights into your focus patterns, activity, and study consistency.</p>
          </div>
          <div className="hidden lg:block">
            <FocusScoreBadge 
              score={user?.focusScore || 0} 
              size="small" 
              showLabel={false}
              showScore={true}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric title="Planned vs actual" value={`${totalActual}/${totalPlanned || 1} min`} hint="Aim to match or exceed planned time." />
          <Metric title="Active study time" value={`${totalActive} min`} hint="Scrolling, clicks, typing, touch." />
          <Metric title="Sessions logged" value={sessions.length} hint="More sessions give better insights." />
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-3xl bg-clay/60 p-8 text-center text-ink/70 shadow-soft">
            <p className="text-lg">No data yet. Complete a session to see charts and analytics.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Planned vs Actual Bar Chart */}
            <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
              <h3 className="mb-4 text-lg font-semibold text-ink">Planned vs Actual Study Time</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7ddcb" />
                    <XAxis dataKey="name" stroke="#1f2933" />
                    <YAxis stroke="#1f2933" />
                    <Tooltip cursor={{ fill: 'rgba(139, 211, 221, 0.1)' }} />
                    <Legend />
                    <Bar dataKey="planned" fill="#f1b24a" radius={[6, 6, 0, 0]} name="Planned (min)" />
                    <Bar dataKey="actual" fill="#1f2933" radius={[6, 6, 0, 0]} name="Actual (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Distribution Pie Chart */}
            <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
              <h3 className="mb-4 text-lg font-semibold text-ink">Active vs Idle Time (Total)</h3>
              <div className="flex h-[300px] w-full items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value}m (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} min`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active & Idle Time Breakdown */}
            <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
              <h3 className="mb-4 text-lg font-semibold text-ink">Active vs Idle Time per Session</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7ddcb" />
                    <XAxis dataKey="name" stroke="#1f2933" />
                    <YAxis stroke="#1f2933" />
                    <Tooltip cursor={{ fill: 'rgba(139, 211, 221, 0.1)' }} />
                    <Legend />
                    <Bar dataKey="active" fill="#1f2933" radius={[6, 6, 0, 0]} name="Active (min)" />
                    <Bar dataKey="idle" fill="#8bd3dd" radius={[6, 6, 0, 0]} name="Idle (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Focus Ratio Trend Line Chart */}
            <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
              <h3 className="mb-4 text-lg font-semibold text-ink">Focus Consistency Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={focusPatternData} margin={{ top: 16, right: 16, left: -16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7ddcb" />
                    <XAxis dataKey="session" stroke="#1f2933" />
                    <YAxis stroke="#1f2933" label={{ value: 'Focus %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `${value}%`} cursor={{ fill: 'rgba(139, 211, 221, 0.1)' }} />
                    <Line type="monotone" dataKey="focusRatio" stroke="#f1b24a" strokeWidth={3} dot={{ fill: '#1f2933', r: 5 }} name="Focus Ratio (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoodleBackground>
  )
}

const Metric = ({ title, value, hint }) => (
  <div className="rounded-3xl bg-white/80 p-5 shadow-soft">
    <p className="text-sm text-ink/60">{title}</p>
    <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
    <p className="mt-1 text-xs text-ink/60">{hint}</p>
  </div>
)
