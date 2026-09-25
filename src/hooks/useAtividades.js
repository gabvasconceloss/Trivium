import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/clienteSupabase' // Substitui o antigo '../lib/supabaseClient'

export function useAtividades(alunoId) {
  const [atividades, setAtividades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true)
    setErro(null)

    const { data, error } = await supabase
      .from('atividades')
      .select('id, titulo, descricao, data_entrega, status, nota, entregue_em, created_at, materia_id, materias ( nome, cor_tema )')
      .eq('aluno_id', alunoId)
      .order('data_entrega', { ascending: true, nullsFirst: false })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }
    setAtividades(data)
    setCarregando(false)
  }, [alunoId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const criarAtividade = useCallback(
    async ({ titulo, descricao, dataEntrega, materiaId }) => {
      const { data, error } = await supabase
        .from('atividades')
        .insert({
          aluno_id: alunoId,
          titulo,
          descricao: descricao || null,
          data_entrega: dataEntrega || null,
          materia_id: materiaId || null,
          status: 'pendente'
        })
        .select('id, titulo, descricao, data_entrega, status, nota, entregue_em, created_at, materia_id, materias ( nome, cor_tema )')
        .single()
      if (error) throw new Error('Não foi possível criar a atividade.')
      setAtividades((prev) => [...prev, data])
      return data
    },
    [alunoId]
  )

  // Marca como entregue. O trigger do banco decide se conta como "no prazo" (RN implícita)
  // e recalcula estatísticas de gamificação automaticamente.
  const marcarEntregue = useCallback(async (atividadeId) => {
    const { data, error } = await supabase
      .from('atividades')
      .update({ status: 'entregue' })
      .eq('id', atividadeId)
      .select('id, titulo, descricao, data_entrega, status, nota, entregue_em, created_at, materia_id, materias ( nome, cor_tema )')
      .single()
    if (error) throw new Error('Não foi possível marcar a atividade como entregue.')
    setAtividades((prev) => prev.map((a) => (a.id === atividadeId ? data : a)))
  }, [])

  const definirNota = useCallback(async (atividadeId, nota) => {
    const notaNumerica = nota === '' || nota === null ? null : Number(nota)
    if (notaNumerica !== null && (Number.isNaN(notaNumerica) || notaNumerica < 0 || notaNumerica > 10)) {
      throw new Error('A nota deve ser um número entre 0 e 10.')
    }
    const { data, error } = await supabase
      .from('atividades')
      .update({ nota: notaNumerica })
      .eq('id', atividadeId)
      .select('id, titulo, descricao, data_entrega, status, nota, entregue_em, created_at, materia_id, materias ( nome, cor_tema )')
      .single()
    if (error) throw new Error('Não foi possível salvar a nota.')
    setAtividades((prev) => prev.map((a) => (a.id === atividadeId ? data : a)))
  }, [])

  const excluirAtividade = useCallback(async (atividadeId) => {
    const { error } = await supabase.from('atividades').delete().eq('id', atividadeId)
    if (error) throw new Error('Não foi possível excluir a atividade.')
    setAtividades((prev) => prev.filter((a) => a.id !== atividadeId))
  }, [])

  return { atividades, carregando, erro, criarAtividade, marcarEntregue, definirNota, excluirAtividade, recarregar }
}
