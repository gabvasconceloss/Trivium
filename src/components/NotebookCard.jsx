import { useNavigate } from 'react-router-dom'
import { formatarTempoRelativo } from '../lib/utils'
import { IconClock, IconBook, IconTrash } from './icons'

export default function NotebookCard({ caderno, quantidadeTopicos = 0, onExcluir }) {
  const navigate = useNavigate()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/caderno/${caderno.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/caderno/${caderno.id}`)}
      className="group relative overflow-hidden rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card
      border-l-4 p-5 min-h-[130px] cursor-pointer hover:-translate-y-0.5 transition-transform touch-target"
      style={{ borderLeftColor: caderno.cor_tema }}
    >
      <span className="absolute right-3 top-2 text-5xl opacity-10 select-none">{caderno.icone}</span>

      <div className="relative z-10 flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-lg text-ink dark:text-white pr-6">{caderno.nome}</h3>
        {onExcluir && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExcluir(caderno)
            }}
            aria-label={`Excluir caderno ${caderno.nome}`}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
            w-8 h-8 rounded-lg hover:bg-danger/10 hover:text-danger text-ink-soft flex items-center justify-center shrink-0"
          >
            <IconTrash width={16} height={16} />
          </button>
        )}
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
        <IconBook width={15} height={15} />
        {quantidadeTopicos} {quantidadeTopicos === 1 ? 'resumo criado aqui' : 'resumos criados aqui'}
      </div>
      <div className="relative z-10 mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
        <IconClock width={13} height={13} />
        Atualizado: {formatarTempoRelativo(caderno.updated_at)}
      </div>
    </div>
  )
}
