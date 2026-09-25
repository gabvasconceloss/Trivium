export default function StatCard({ icone, iconeBg, label, valor }) {
  return (
    <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ backgroundColor: iconeBg }}
        >
          {icone}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      </div>
      <p className="text-2xl md:text-3xl font-display font-bold text-ink dark:text-white">{valor}</p>
    </div>
  )
}
