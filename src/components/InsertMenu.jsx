import { useEffect, useRef } from 'react'

const OPCOES = [
  { tipo: 'texto', label: 'Texto', icone: 'T' },
  { tipo: 'subtitulo', label: 'Subtítulo', icone: 'H2' },
  { tipo: 'lista', label: 'Lista', icone: '≣' },
  { tipo: 'checklist', label: 'Checklist', icone: '☑' },
  { tipo: 'imagem', label: 'Imagem', icone: '🖼' },
  { tipo: 'cartao', label: 'Cartão', icone: '▭' }
]

export default function InsertMenu({ onEscolher, onFechar }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClickFora(e) {
      if (ref.current && !ref.current.contains(e.target)) onFechar()
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [onFechar])

  return (
    <div
      ref={ref}
      className="absolute z-20 mt-1 w-48 rounded-xl bg-surface dark:bg-[#20233F] shadow-card border border-border dark:border-white/10 py-2"
    >
      <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Inserir</p>
      {OPCOES.map((op) => (
        <button
          key={op.tipo}
          onClick={() => onEscolher(op.tipo)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink dark:text-white hover:bg-primary-light hover:text-primary touch-target"
        >
          <span className="w-6 h-6 rounded-md border border-border dark:border-white/10 flex items-center justify-center text-[11px] font-semibold shrink-0">
            {op.icone}
          </span>
          {op.label}
        </button>
      ))}
    </div>
  )
}
