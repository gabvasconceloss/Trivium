import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useConquistas(alunoId) {
  const [conquistas, setConquistas] = useState([]) // catálogo + progresso mesclados
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true)
    setErro(null)

    const [{ data: catalogo, error: erroCatalogo }, { data: progresso, error: erroProgresso }, { data: rankingData, error: erroRanking }] =
      await Promise.all([
        supabase.from('conquistas').select('*').order('meta', { ascending: true }),
        supabase.from('aluno_conquistas').select('*').eq('aluno_id', alunoId),
        supabase.rpc('trivium_ranking_turma')
      ])

    if (erroCatalogo || erroProgresso) {
      setErro((erroCatalogo || erroProgresso).message)
      setCarregando(false)
      return
    }

    const progressoPorConquista = Object.fromEntries((progresso || []).map((p) => [p.conquista_id, p]))

    const mescladas = (catalogo || []).map((c) => ({
      ...c,
      progresso: progressoPorConquista[c.id]?.progresso ?? 0,
      conquistada: progressoPorConquista[c.id]?.conquistada ?? false,
      conquistada_em: progressoPorConquista[c.id]?.conquistada_em ?? null
    }))

    setConquistas(mescladas)
    if (!erroRanking) setRanking(rankingData || [])
    setCarregando(false)
  }, [alunoId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const conquistadas = conquistas.filter((c) => c.conquistada).sort((a, b) => new Date(b.conquistada_em) - new Date(a.conquistada_em))
  const proximas = conquistas.filter((c) => !c.conquistada)

  return { conquistas, conquistadas, proximas, ranking, carregando, erro, recarregar }
}
