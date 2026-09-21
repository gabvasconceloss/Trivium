const CORES_ICONE = ['#FDECC8', '#F1EAFE', '#EAF0FD', '#E2F7F2', '#FDE2E2']

function corIcone(chave) {
  let hash = 0
  for (let i = 0; i < chave.length; i++) hash = chave.charCodeAt(i) + ((hash << 5) - hash)
  return CORES_ICONE[Math.abs(hash) % CORES_ICONE.length]
}

function formatarMeta(conquista) {
  const meta = Number(conquista.meta)
  if (conquista.tipo === 'media_geral') return meta.toFixed(1).replace('.', ',')
  return Math.round(meta)
}

function formatarProgresso(conquista) {
  const progresso = Number(conquista.progresso)
  if (conquista.tipo === 'media_geral') return progresso.toFixed(1).replace('.', ',')
  return Math.round(progresso)
}

export function ConquistaCardDesbloqueada({ conquista }) {
  return (
    <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: corIcone(conquista.chave) }}
        >
          {conquista.icone}
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-ink dark:text-white truncate">{conquista.titulo}</p>
          <p className="text-xs text-ink-soft truncate">{conquista.descricao}</p>
        </div>
      </div>
      <span className="self-start text-xs font-medium text-accent-dark bg-accent-light px-2.5 py-1 rounded-full">
        ✓ Conquistada
      </span>
    </div>
  )
}

export function ConquistaCardProgresso({ conquista }) {
  const pct = Math.min(100, Math.round((Number(conquista.progresso) / Number(conquista.meta)) * 100))
  return (
    <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-black/5 dark:bg-white/5 grayscale opacity-70">
          🔒
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-ink dark:text-white truncate">{conquista.titulo}</p>
          <p className="text-xs text-ink-soft truncate">{conquista.descricao}</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-ink-soft self-end">
        {formatarProgresso(conquista)}/{formatarMeta(conquista)}
      </p>
    </div>
  )
}
