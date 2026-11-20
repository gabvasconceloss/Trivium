import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { traduzirErro } from '../lib/erros'

/** RF11/RN17 — Ranking semanal (XP dos últimos 7 dias) e geral (XP total) da turma. */
export function useRanking(alunoId, modo = 'semanal') {
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true); setErro(null)
    const { data, error } = await supabase.rpc(modo === 'semanal' ? 'trivium_ranking_semanal_turma' : 'trivium_ranking_turma')
    if (error) { setErro(traduzirErro(error)); setCarregando(false); return }
    setRanking(data || [])
    setCarregando(false)
  }, [alunoId, modo])

  useEffect(() => { recarregar() }, [recarregar])

  return { ranking, carregando, erro, recarregar }
}
