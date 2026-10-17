import { useEffect, useState, useCallback } from 'react'

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [podeInstalar, setPodeInstalar] = useState(false)
  const [instalado, setInstalado] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)')
    setInstalado(mql.matches || window.navigator.standalone === true)
    function onBip(e) { e.preventDefault(); setDeferredPrompt(e); setPodeInstalar(true) }
    function onInstalled() { setInstalado(true); setPodeInstalar(false); setDeferredPrompt(null) }
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  const instalar = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' }
    deferredPrompt.prompt()
    const escolha = await deferredPrompt.userChoice
    setDeferredPrompt(null); setPodeInstalar(false)
    return escolha
  }, [deferredPrompt])

  return { podeInstalar, instalado, instalar }
}
