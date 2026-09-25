import { usePWAInstall } from '../hooks/useInstalacaoPWA'
import { useState } from 'react'

export default function PWAInstallPrompt() {
  const { podeInstalar, instalado, instalar } = usePWAInstall()
  const [dispensado, setDispensado] = useState(false)

  if (!podeInstalar || instalado || dispensado) return null

  return (
    <div
      className="fixed left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#181B2E] text-white shadow-card
      p-4 flex items-center gap-3
      bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-display font-bold shrink-0">
        T
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Instalar o Trivium</p>
        <p className="text-xs text-white/60">Acesse mais rápido, direto da tela inicial.</p>
      </div>
      <button
        onClick={instalar}
        className="touch-target px-3 py-2 rounded-xl bg-primary text-sm font-semibold shrink-0"
      >
        Instalar
      </button>
      <button
        onClick={() => setDispensado(true)}
        aria-label="Dispensar"
        className="touch-target w-8 h-8 rounded-lg text-white/50 hover:text-white shrink-0"
      >
        ×
      </button>
    </div>
  )
}
