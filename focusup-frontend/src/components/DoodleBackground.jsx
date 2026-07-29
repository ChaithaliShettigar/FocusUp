export const DoodleBackground = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-sand">
      <div className="absolute inset-0 doodle-surface opacity-80" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-28">{children}</div>
    </div>
  )
}
