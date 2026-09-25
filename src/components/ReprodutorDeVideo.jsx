import { useState } from 'react'
import { IconPlay } from './icones'

function CardVideo({ video, onAssistir }) {
  const [tocando, setTocando] = useState(false)

  if (tocando) {
    return (
      <div className="rounded-xl overflow-hidden bg-black shadow-card aspect-video">
        {/* RN03 — youtube-nocookie + rel=0: isola o player, sem comentários/recomendados externos */}
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
          title={video.titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        setTocando(true)
        onAssistir?.()
      }}
      className="text-left group"
    >
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-card">
        <img src={video.thumbnail} alt={video.titulo} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-primary shadow-card group-hover:scale-105 transition-transform">
            <IconPlay width={20} height={20} />
          </span>
        </div>
        {video.duracao && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
            {video.duracao}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-ink dark:text-white/90 mt-2 line-clamp-2">{video.titulo}</p>
    </button>
  )
}

export default function VideoPlayer({ videos = [], onBuscarNovamente, onAssistir }) {
  if (!videos.length) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-accent-dark bg-accent-light px-2.5 py-1 rounded-full">
          🛡 Ambiente Seguro
        </span>
        {onBuscarNovamente && (
          <button onClick={onBuscarNovamente} className="text-xs text-primary font-medium touch-target">
            ↻ Buscar novamente
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {videos.map((video) => (
          <CardVideo key={video.id} video={video} onAssistir={onAssistir} />
        ))}
      </div>
    </div>
  )
}
