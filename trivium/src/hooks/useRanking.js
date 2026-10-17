import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/** RF11/RN17 — Ranking semanal (XP dos últimos 7 dias) e geral (XP total) da turma. */
export function useRanking(alunoId, modo = 'semanal') {
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true); setErro(null)
    const { data, error } = await supabase.rpc(modo === 'semanal' ? 'trivium_ranking_semanal_turma' : 'trivium_ranking_turma')
    if (error) { setErro(error.message); setCarregando(false); return }
    setRanking(data || [])
    setCarregando(false)
  }, [alunoId, modo])

  useEffect(() => { recarregar() }, [recarregar])

  return { ranking, carregando, erro, recarregar }
}
