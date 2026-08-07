export const DoodleBackground = ({ children }) => {
  return (
    <div className="relative flex-1 bg-sand flex flex-col w-full">
      <div className="absolute inset-0 doodle-surface opacity-80" aria-hidden />
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 pb-8 pt-28 flex-1 flex flex-col">{children}</div>
    </div>
  )
}
