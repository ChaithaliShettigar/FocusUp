import { useState, useEffect } from 'react'
import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { analyticsAPI } from '../services/api'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FocusScoreBadge } from '../components/FocusScoreBadge'
import { Target, Activity, BarChart2 } from 'lucide-react'

export const Analytics = () => {
  const user = useFocusStore((s) => s.user)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch analytics from backend (MongoDB is source of truth)
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const [analyticsRes, dailyRes] = await Promise.all([
          analyticsAPI.getAnalytics(30),
          analyticsAPI.getDailyAnalytics(),
        ])
        if (analyticsRes.success && analyticsRes.analytics) {
          setAnalyticsData(analyticsRes.analytics)
        }
        if (dailyRes.success && dailyRes.data) {
          setDailyData(dailyRes.data)
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  // Build chart data from backend analytics
  const sessions = analyticsData?.sessions || []
  const chartData = sessions.map((s, idx) => ({
    name: s.subject || `S${idx + 1}`,
    planned: s.duration || 0,
    actual: s.duration || 0,
    active: s.duration || 0,
    idle: 0,
    tabSwitches: 0,
  }))

  const totalPlanned = analyticsData?.totalFocusTime || 0
  const totalActual = analyticsData?.totalFocusTime || 0
  const totalActive = analyticsData?.totalFocusTime || 0
  const totalIdle = 0

  const activityData = [
    { name: 'Active Study', value: totalActive, fill: '#1f2933' },
    { name: 'Idle Time', value: totalIdle, fill: '#8bd3dd' },
  ]

  const focusPatternData = sessions.map((s, idx) => ({
    session: s.subject || `S${idx + 1}`,
    focusRatio: s.focusScore || 0,
  }))

  if (loading) {
    return (
      <DoodleBackground>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal" />
        </div>
      </DoodleBackground>
    )
  }

  return (
    <DoodleBackground>
      <div className="flex flex-col gap-8 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight">Your Analytics Dashboard</h2>
            <p className="text-ink/70 mt-1 text-sm sm:text-base">Visual insights into your focus patterns, activity, and study consistency.</p>
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

        <div className="grid gap-6 md:grid-cols-3">
          <Metric 
            title="Planned vs actual" 
            value={`${totalActual}/${totalPlanned || 1} min`} 
            hint="Aim to match or exceed planned time"
            icon={Target}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
          />
          <Metric 
            title="Active study time" 
            value={`${totalActive} min`} 
            hint="Scrolling, typing, active interactions" 
            icon={Activity}
            iconBg="bg-teal-500/10"
            iconColor="text-teal-600"
          />
          <Metric 
            title="Sessions logged" 
            value={analyticsData?.totalSessions || 0} 
            hint="More sessions yield deeper insights" 
            icon={BarChart2}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-600"
          />
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-3xl bg-white/80 p-12 text-center text-ink/70 shadow-soft border border-white/70 backdrop-blur-md min-h-[220px] flex items-center justify-center">
            <p className="text-lg font-bold">No study session data logged yet. Complete a study session on the Learn page to generate detailed analytics charts.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Planned vs Actual Bar Chart */}
            <div className="rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300">
              <h3 className="mb-6 text-xl font-extrabold text-ink">Planned vs Actual Study Time</h3>
              <div className="h-[360px] w-full">
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
            <div className="rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300">
              <h3 className="mb-6 text-xl font-extrabold text-ink">Active vs Idle Time (Total)</h3>
              <div className="flex h-[360px] w-full items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value}m (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Focus Ratio Line Chart */}
            <div className="rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300 lg:col-span-2">
              <h3 className="mb-6 text-xl font-extrabold text-ink">Focus Quality Ratio per Session</h3>
              <div className="h-[360px] w-full">
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

const Metric = ({ title, value, hint, icon: Icon, iconBg = 'bg-teal-500/10', iconColor = 'text-teal-600' }) => (
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
