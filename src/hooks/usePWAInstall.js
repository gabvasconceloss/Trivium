import { useEffect, useState, useCallback } from 'react'

/**
 * Captura o evento "beforeinstallprompt" para permitir um botão/banner customizado
 * de instalação da PWA (RF22), em vez de depender do prompt nativo do navegador.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [podeInstalar, setPodeInstalar] = useState(false)
  const [instalado, setInstalado] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)')
    setInstalado(mql.matches || window.navigator.standalone === true)

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setDeferredPrompt(event)
      setPodeInstalar(true)
    }

    function handleAppInstalled() {
      setInstalado(true)
      setPodeInstalar(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' }
    deferredPrompt.prompt()
    const escolha = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setPodeInstalar(false)
    return escolha
  }, [deferredPrompt])

  return { podeInstalar, instalado, instalar }
}
