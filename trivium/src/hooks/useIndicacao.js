import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/** RF09/RN18 — Resgate de código de amigo. */
export function useIndicacao() {
  const [resgatando, setResgatando] = useState(false)

  const resgatar = useCallback(async (codigo) => {
    setResgatando(true)
    try {
      const { data, error } = await supabase.rpc('trivium_resgatar_indicacao', { p_codigo: codigo })
      if (error) throw new Error(error.message || 'Não foi possível resgatar esse código.')
      return data // { xp_ganho }
    } finally {
      setResgatando(false)
    }
  }, [])

  return { resgatar, resgatando }
}
