import { useState } from 'react'
import { IconTrash, IconSparkles } from './icons'
import VideoPlayer from './VideoPlayer'

export default function TopicCard({ topico, onToggleConcluido, onExcluir, onBuscarVideos, onAssistir, onAbrir }) {
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState(null)

  async function handleBuscarVideos(e) {
    e.stopPropagation()
    setErro(null)
    setBuscando(true)
    try {
      await onBuscarVideos(topico)
    } catch (err) {
      setErro(err.message)
    } finally {
      setBuscando(false)
    }
  }

  const temVideos = topico.videos_recomendados?.length > 0

  return (
    <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleConcluido(topico)
          }}
          aria-label={topico.status_concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
          className={`touch-target w-7 h-7 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            topico.status_concluido ? 'bg-accent border-accent text-white' : 'border-ink-soft/30 text-transparent'
          }`}
        >
          ✓
        </button>

        <button className="flex-1 text-left min-w-0" onClick={() => onAbrir(topico)}>
          <h3
            className={`font-display font-semibold leading-snug truncate ${
              topico.status_concluido ? 'line-through text-ink-soft' : 'text-ink dark:text-white'
            }`}
          >
            {topico.titulo}
          </h3>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onExcluir(topico)
          }}
          aria-label={`Excluir tópico ${topico.titulo}`}
          className="touch-target w-8 h-8 rounded-lg text-ink-soft hover:bg-danger/10 hover:text-danger shrink-0"
        >
          <IconTrash width={15} height={15} />
        </button>
      </div>

      {!temVideos && (
        <button
          onClick={handleBuscarVideos}
          disabled={buscando}
          className="self-start touch-target flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-full
          bg-ai-light text-ai-dark hover:bg-ai hover:text-white transition-colors disabled:opacity-60"
        >
          {buscando ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-ai-dark/40 border-t-ai-dark rounded-full animate-spin" />
              Buscando aulas…
            </>
          ) : (
            <>
              <IconSparkles width={14} height={14} /> Buscar Aulas com IA
            </>
          )}
        </button>
      )}

      {erro && <p className="text-sm text-danger">{erro}</p>}

      {temVideos && (
        <VideoPlayer
          videos={topico.videos_recomendados}
          onAssistir={() => onAssistir(topico.id)}
          onBuscarNovamente={handleBuscarVideos}
        />
      )}
    </div>
  )
}
