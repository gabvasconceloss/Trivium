export default function BannerHeader({ titulo, subtitulo, icone, acoes }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-banner-gradient text-white p-5 md:p-7 mb-6 flex items-center justify-between">
      <div className="relative z-10 min-w-0">
        <h1 className="text-xl md:text-2xl font-display font-bold truncate flex items-center gap-2">
          {titulo}
        </h1>
        {subtitulo && <p className="text-white/85 text-sm mt-1 max-w-md">{subtitulo}</p>}
        {acoes && <div className="mt-3 flex items-center gap-2">{acoes}</div>}
      </div>
      {icone && (
        <div className="absolute -right-4 -bottom-6 opacity-20 text-white">
          {icone}
        </div>
      )}
    </div>
  )
}
