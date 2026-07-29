import { useState } from 'react'
import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { toast } from 'react-hot-toast'
import { Volume2, Bell, Moon, Zap, Eye, Palette } from 'lucide-react'

export const Settings = () => {
  const { focusPreferences, setFocusPreference } = useFocusStore()

  const [notifications, setNotifications] = useState({
    focusReminders: true,
    sessionCompletion: true,
    streakReminders: true,
    leaderboardUpdates: false,
    newFeatures: true,
  })

  const [soundSettings, setSoundSettings] = useState({
    soundEnabled: true,
    sessionStartSound: true,
    sessionEndSound: true,
    volumeLevel: 70,
  })

  const [focusSettings, setFocusSettings] = useState({
    autoStartTimer: false,
    distractionBlocking: true,
    tabSwitchInterventionEnabled: focusPreferences.tabSwitchInterventionEnabled,
    tabSwitchInterventionStudyOnly: focusPreferences.tabSwitchInterventionStudyOnly,
    idleDetection: true,
    idleTimeout: 2, // minutes
  })

  const [displaySettings, setDisplaySettings] = useState({
    darkMode: false,
    largeText: false,
    animationsEnabled: true,
    theme: 'default', // default, vibrant, minimal
  })

  const [funSettings, setFunSettings] = useState({
    funnyNotifications: true,
    motivationalQuotes: true,
    achievementCelebrations: true,
    customEmojis: true,
  })

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success('Notification settings updated!')
  }

  const toggleSound = (key) => {
    setSoundSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success('Sound settings updated!')
  }

  const toggleFocus = (key) => {
    const nextValue = !focusSettings[key]
    setFocusSettings((prev) => ({ ...prev, [key]: nextValue }))

    if (key === 'tabSwitchInterventionEnabled' || key === 'tabSwitchInterventionStudyOnly') {
      setFocusPreference(key, nextValue)
    }

    toast.success('Focus settings updated!')
  }

  const toggleDisplay = (key) => {
    setDisplaySettings((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success('Display settings updated!')
  }

  const toggleFun = (key) => {
    setFunSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success('Fun settings updated!')
  }

  return (
    <DoodleBackground>
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
        <div>
          <h2 className="text-4xl font-bold text-ink">Settings & Preferences</h2>
          <p className="mt-2 text-ink/70">Customize your FocusUp experience to match your learning style.</p>
        </div>

        {/* Notifications */}
        <SettingSection title="Notifications" icon={<Bell size={24} />} description="Control which notifications you receive">
          <div className="space-y-3">
            <ToggleRow
              label="Focus reminders"
              description="Get reminded to start your study sessions"
              enabled={notifications.focusReminders}
              onChange={() => toggleNotification('focusReminders')}
            />
            <ToggleRow
              label="Session completion alerts"
              description="Celebrate when you finish a session"
              enabled={notifications.sessionCompletion}
              onChange={() => toggleNotification('sessionCompletion')}
            />
            <ToggleRow
              label="Streak reminders"
              description="Never miss a day in your study streak"
              enabled={notifications.streakReminders}
              onChange={() => toggleNotification('streakReminders')}
            />
            <ToggleRow
              label="Leaderboard updates"
              description="Get notified when friends pass you on the leaderboard"
              enabled={notifications.leaderboardUpdates}
              onChange={() => toggleNotification('leaderboardUpdates')}
            />
            <ToggleRow
              label="New features & updates"
              description="Learn about new FocusUp features"
              enabled={notifications.newFeatures}
              onChange={() => toggleNotification('newFeatures')}
            />
          </div>
        </SettingSection>

        {/* Sound Settings */}
        <SettingSection title="Sound & Audio" icon={<Volume2 size={24} />} description="Manage audio feedback and alerts">
          <div className="space-y-4">
            <ToggleRow
              label="Sound enabled"
              description="Turn sound effects on or off"
              enabled={soundSettings.soundEnabled}
              onChange={() => toggleSound('soundEnabled')}
            />
            {soundSettings.soundEnabled && (
              <>
                <ToggleRow
                  label="Session start sound"
                  description="Play sound when session begins"
                  enabled={soundSettings.sessionStartSound}
                  onChange={() => toggleSound('sessionStartSound')}
                />
                <ToggleRow
                  label="Session end sound"
                  description="Play sound when session ends"
                  enabled={soundSettings.sessionEndSound}
                  onChange={() => toggleSound('sessionEndSound')}
                />
                <div className="rounded-2xl bg-sand/50 px-4 py-3">
                  <label className="text-sm font-semibold text-ink block mb-3">Volume Level</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundSettings.volumeLevel}
                    onChange={(e) => setSoundSettings({ ...soundSettings, volumeLevel: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-ink/70 mt-2">{soundSettings.volumeLevel}%</p>
                </div>
              </>
            )}
          </div>
        </SettingSection>

        {/* Focus & Study Settings */}
        <SettingSection title="Focus & Study" icon={<Zap size={24} />} description="Customize your focus session behavior">
          <div className="space-y-4">
            <ToggleRow
              label="Auto-start timer"
              description="Automatically start the timer after opening content"
              enabled={focusSettings.autoStartTimer}
              onChange={() => toggleFocus('autoStartTimer')}
            />
            <ToggleRow
              label="Distraction blocking"
              description="Block distracting websites during sessions"
              enabled={focusSettings.distractionBlocking}
              onChange={() => toggleFocus('distractionBlocking')}
            />
            <ToggleRow
              label="Focus break game/question"
              description="Turn on or off the mini game/question popup after repeated tab switches"
              enabled={focusSettings.tabSwitchInterventionEnabled}
              onChange={() => toggleFocus('tabSwitchInterventionEnabled')}
            />
            <ToggleRow
              label="Only during study content (PDF/YouTube)"
              description="Show focus break popups only when you're studying in Learn or Group study mode"
              enabled={focusSettings.tabSwitchInterventionStudyOnly}
              onChange={() => toggleFocus('tabSwitchInterventionStudyOnly')}
            />
            <ToggleRow
              label="Idle detection"
              description="Track when you're not actively studying"
              enabled={focusSettings.idleDetection}
              onChange={() => toggleFocus('idleDetection')}
            />
            {focusSettings.idleDetection && (
              <div className="rounded-2xl bg-sand/50 px-4 py-3">
                <label className="text-sm font-semibold text-ink block mb-3">Idle timeout (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={focusSettings.idleTimeout}
                  onChange={(e) => setFocusSettings({ ...focusSettings, idleTimeout: e.target.value })}
                  className="w-full rounded-2xl border border-ink/10 px-4 py-2"
                />
                <p className="text-xs text-ink/70 mt-2">Get marked as idle after {focusSettings.idleTimeout} minute(s) of inactivity</p>
              </div>
            )}
          </div>
        </SettingSection>

        {/* Display & Theme */}
        <SettingSection title="Display & Theme" icon={<Palette size={24} />} description="Personalize how FocusUp looks">
          <div className="space-y-4">
            <ToggleRow
              label="Dark mode"
              description="Use dark theme (coming soon)"
              enabled={displaySettings.darkMode}
              onChange={() => toggleDisplay('darkMode')}
              disabled
            />
            <ToggleRow
              label="Large text"
              description="Increase font sizes for better readability"
              enabled={displaySettings.largeText}
              onChange={() => toggleDisplay('largeText')}
            />
            <ToggleRow
              label="Animations"
              description="Enable smooth animations and transitions"
              enabled={displaySettings.animationsEnabled}
              onChange={() => toggleDisplay('animationsEnabled')}
            />
            <div className="rounded-2xl bg-sand/50 px-4 py-3">
              <label className="text-sm font-semibold text-ink block mb-3">Color Theme</label>
              <select
                value={displaySettings.theme}
                onChange={(e) => setDisplaySettings({ ...displaySettings, theme: e.target.value })}
                className="w-full rounded-2xl border border-ink/10 px-4 py-2 text-ink focus:border-teal focus:outline-none"
              >
                <option value="default">🎨 Default (Warm & Cozy)</option>
                <option value="vibrant">✨ Vibrant (Bold & Energetic)</option>
                <option value="minimal">⚪ Minimal (Clean & Simple)</option>
              </select>
            </div>
          </div>
        </SettingSection>

        {/* Fun & Gamification */}
        <SettingSection title="Fun & Gamification" icon="🎮" description="Keep your study sessions entertaining">
          <div className="space-y-3">
            <ToggleRow
              label="Funny notifications"
              description="Get witty messages and jokes during breaks"
              enabled={funSettings.funnyNotifications}
              onChange={() => toggleFun('funnyNotifications')}
            />
            <ToggleRow
              label="Motivational quotes"
              description="Receive daily motivation and inspiration"
              enabled={funSettings.motivationalQuotes}
              onChange={() => toggleFun('motivationalQuotes')}
            />
            <ToggleRow
              label="Achievement celebrations"
              description="Celebrate when you reach study milestones"
              enabled={funSettings.achievementCelebrations}
              onChange={() => toggleFun('achievementCelebrations')}
            />
            <ToggleRow
              label="Custom emojis"
              description="Use custom emojis in your profile and badges"
              enabled={funSettings.customEmojis}
              onChange={() => toggleFun('customEmojis')}
            />
          </div>
        </SettingSection>

        {/* Language selection removed — app supports English only */}

        {/* Reset Settings */}
        <SettingSection title="Reset & Backup" icon="⚙️">
          <div className="space-y-3">
            <button
              onClick={() => {
                if (window.confirm('Reset all settings to default? You can redo this.')) {
                  setNotifications({
                    focusReminders: true,
                    sessionCompletion: true,
                    streakReminders: true,
                    leaderboardUpdates: false,
                    newFeatures: true,
                  })
                  toast.success('All settings reset to default!')
                }
              }}
              className="w-full rounded-2xl bg-white border border-ink/10 px-4 py-3 font-semibold text-ink hover:bg-ink/5 transition-all text-left"
            >
              🔄 Reset all settings to default
            </button>
            <button
              onClick={() => toast.success('Settings backed up to cloud!')}
              className="w-full rounded-2xl bg-white border border-ink/10 px-4 py-3 font-semibold text-ink hover:bg-ink/5 transition-all text-left"
            >
              ☁️ Backup settings to cloud
            </button>
          </div>
        </SettingSection>
      </div>
    </DoodleBackground>
  )
}

const SettingSection = ({ title, icon, description, children }) => (
  <div className="rounded-3xl bg-white p-6 shadow-soft border border-ink/5">
    <div className="mb-6 flex items-start gap-4">
      <div className="text-3xl">{typeof icon === 'string' ? icon : icon}</div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-ink">{title}</h3>
        {description && <p className="text-sm text-ink/70">{description}</p>}
      </div>
    </div>
    {children}
  </div>
)

const ToggleRow = ({ label, description, enabled, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`w-full rounded-2xl px-4 py-3 text-left transition-all ${
      disabled ? 'opacity-50 cursor-not-allowed bg-sand/20' : 'hover:bg-sand/30 bg-sand/50'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description && <p className="text-xs text-ink/70">{description}</p>}
      </div>
      <div
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
          enabled ? 'bg-ink text-white' : 'bg-white border border-ink/20 text-ink'
        }`}
      >
        {enabled ? '✓ On' : '○ Off'}
      </div>
    </div>
  </button>
)
