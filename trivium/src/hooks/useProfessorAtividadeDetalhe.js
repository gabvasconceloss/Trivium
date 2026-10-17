import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/** Lançamento de notas (RF05): lista as entregas de uma atividade, uma por aluno. */
export function useProfessorAtividadeDetalhe(atividadeId) {
  const [atividade, setAtividade] = useState(null)
  const [entregas, setEntregas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!atividadeId) return
    setCarregando(true); setErro(null)

    const [{ data: atividadeData, error: atividadeError }, { data: entregasData, error: entregasError }] = await Promise.all([
      supabase.from('atividades').select('id, titulo, descricao, materia, data_entrega, turma_id').eq('id', atividadeId).single(),
      supabase.from('entregas').select('id, status, nota, entregue_em, aluno_id, alunos ( nome, email )').eq('atividade_id', atividadeId)
    ])

    if (atividadeError || entregasError) {
      setErro((atividadeError || entregasError).message)
      setCarregando(false)
      return
    }

    setAtividade(atividadeData)
    setEntregas((entregasData || []).sort((a, b) => a.alunos?.nome?.localeCompare(b.alunos?.nome || '')))
    setCarregando(false)
  }, [atividadeId])

  useEffect(() => { recarregar() }, [recarregar])

  const lancarNota = useCallback(async (entregaId, nota) => {
    const notaNumerica = nota === '' || nota === null ? null : Number(nota)
    if (notaNumerica !== null && (Number.isNaN(notaNumerica) || notaNumerica < 0 || notaNumerica > 10)) {
      throw new Error('A nota deve ser um número entre 0 e 10.')
    }
    const { data, error } = await supabase
      .from('entregas')
      .update({ nota: notaNumerica })
      .eq('id', entregaId)
      .select('id, status, nota, entregue_em, aluno_id, alunos ( nome, email )')
      .single()
    if (error) throw new Error('Não foi possível salvar a nota.')
    setEntregas((prev) => prev.map((e) => (e.id === entregaId ? data : e)))
  }, [])

  return { atividade, entregas, carregando, erro, lancarNota, recarregar }
}
