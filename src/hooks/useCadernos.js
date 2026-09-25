import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/clienteSupabase' // Substitui o antigo '../lib/supabaseClient'

export function useCadernos(alunoId) {
  const [cadernos, setCadernos] = useState([])
  const [contagemTopicos, setContagemTopicos] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true)
    setErro(null)

    const { data, error } = await supabase
      .from('materias')
      .select('id, nome, cor_tema, icone, created_at, updated_at, topicos ( id )')
      .eq('aluno_id', alunoId)
      .order('updated_at', { ascending: false })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    const contagem = {}
    data.forEach((m) => {
      contagem[m.id] = m.topicos?.length ?? 0
    })

    setCadernos(data.map(({ topicos, ...resto }) => resto))
    setContagemTopicos(contagem)
    setCarregando(false)
  }, [alunoId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const criarCaderno = useCallback(
    async ({ nome, corTema, icone }) => {
      const { data, error } = await supabase
        .from('materias')
        .insert({ aluno_id: alunoId, nome, cor_tema: corTema, icone: icone || '📘' })
        .select()
        .single()
      if (error) throw new Error('Não foi possível criar o caderno.')
      setCadernos((prev) => [data, ...prev])
      setContagemTopicos((prev) => ({ ...prev, [data.id]: 0 }))
      return data
    },
    [alunoId]
  )

  const atualizarCaderno = useCallback(async (cadernoId, campos) => {
    const { data, error } = await supabase.from('materias').update(campos).eq('id', cadernoId).select().single()
    if (error) throw new Error('Não foi possível atualizar o caderno.')
    setCadernos((prev) => prev.map((c) => (c.id === cadernoId ? data : c)))
    return data
  }, [])

  // RN04 — Exclusão em cascata (ON DELETE CASCADE remove tópicos e vídeos vinculados)
  const excluirCaderno = useCallback(async (cadernoId) => {
    const { error } = await supabase.from('materias').delete().eq('id', cadernoId)
    if (error) throw new Error('Não foi possível excluir o caderno.')
    setCadernos((prev) => prev.filter((c) => c.id !== cadernoId))
  }, [])

  return { cadernos, contagemTopicos, carregando, erro, criarCaderno, atualizarCaderno, excluirCaderno, recarregar }
}
