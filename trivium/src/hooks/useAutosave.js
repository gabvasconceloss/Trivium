import { useEffect, useRef, useState } from 'react'

export function useAutosave(valor, onSave, delay = 900) {
  const timeoutRef = useRef(null)
  const primeiraRenderRef = useRef(true)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (primeiraRenderRef.current) { primeiraRenderRef.current = false; return }
    setStatus('idle')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      try { setStatus('saving'); await onSave(valor); setStatus('saved') }
      catch (err) { console.error('[Trivium] Erro ao salvar automaticamente:', err); setStatus('error') }
    }, delay)
    return () => clearTimeout(timeoutRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, delay])

  return status
}
