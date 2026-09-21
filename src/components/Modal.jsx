export default function Modal({ aberto, titulo, onFechar, children }) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button aria-label="Fechar" className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div
        className="relative w-full sm:max-w-md bg-surface dark:bg-[#1B1E36] rounded-t-2xl sm:rounded-2xl p-5 md:p-6
        pb-safe-bottom shadow-card max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-ink dark:text-white">{titulo}</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar modal"
            className="touch-target w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink-soft"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
