import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/** Detalhe de uma turma: lista de alunos + atividades criadas para ela (RF03, RF04). */
export function useProfessorTurmaDetalhe(turmaId, professorId) {
  const [turma, setTurma] = useState(null)
  const [alunos, setAlunos] = useState([])
  const [atividades, setAtividades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!turmaId) return
    setCarregando(true); setErro(null)

    const [{ data: turmaData, error: turmaError }, { data: alunosData, error: alunosError }, { data: atividadesData, error: atividadesError }] =
      await Promise.all([
        supabase.from('turmas').select('id, nome, escola, codigo_acesso').eq('id', turmaId).single(),
        supabase.from('alunos').select('id, nome, email, xp, nivel, media_geral').eq('turma_id', turmaId).order('nome'),
        supabase.from('atividades').select('id, titulo, descricao, materia, data_entrega, created_at').eq('turma_id', turmaId).order('created_at', { ascending: false })
      ])

    if (turmaError || alunosError || atividadesError) {
      setErro((turmaError || alunosError || atividadesError).message)
      setCarregando(false)
      return
    }

    setTurma(turmaData)
    setAlunos(alunosData)
    setAtividades(atividadesData)
    setCarregando(false)
  }, [turmaId])

  useEffect(() => { recarregar() }, [recarregar])

  const criarAtividade = useCallback(async ({ titulo, descricao, materia, dataEntrega }) => {
    const { data, error } = await supabase
      .from('atividades')
      .insert({ turma_id: turmaId, professor_id: professorId, titulo: titulo.trim(), descricao: descricao || null, materia: materia || null, data_entrega: dataEntrega || null })
      .select('id, titulo, descricao, materia, data_entrega, created_at')
      .single()
    if (error) throw new Error('Não foi possível criar a atividade.')
    setAtividades((prev) => [data, ...prev])
    return data
  }, [turmaId, professorId])

  const excluirAtividade = useCallback(async (atividadeId) => {
    const { error } = await supabase.from('atividades').delete().eq('id', atividadeId)
    if (error) throw new Error('Não foi possível excluir a atividade.')
    setAtividades((prev) => prev.filter((a) => a.id !== atividadeId))
  }, [])

  return { turma, alunos, atividades, carregando, erro, criarAtividade, excluirAtividade, recarregar }
}
