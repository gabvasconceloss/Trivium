import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { gerarCodigoAleatorio } from '../lib/utils'

/** Lado do PROFESSOR: criar/listar turmas, cada uma com um código de acesso único (RN09). */
export function useProfessorTurmas(professorId) {
  const [turmas, setTurmas] = useState([])
  const [contagemAlunos, setContagemAlunos] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!professorId) return
    setCarregando(true); setErro(null)
    const { data, error } = await supabase
      .from('turmas')
      .select('id, nome, escola, codigo_acesso, created_at, alunos ( id )')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })
    if (error) { setErro(error.message); setCarregando(false); return }
    const contagem = {}
    data.forEach((t) => { contagem[t.id] = t.alunos?.length ?? 0 })
    setTurmas(data.map(({ alunos, ...resto }) => resto))
    setContagemAlunos(contagem)
    setCarregando(false)
  }, [professorId])

  useEffect(() => { recarregar() }, [recarregar])

  const criarTurma = useCallback(async ({ nome, escola }) => {
    let ultimoErro = null
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const codigo = gerarCodigoAleatorio(6)
      const { data, error } = await supabase
        .from('turmas')
        .insert({ professor_id: professorId, nome: nome.trim(), escola: escola?.trim() || null, codigo_acesso: codigo })
        .select('id, nome, escola, codigo_acesso, created_at')
        .single()
      if (!error) {
        setTurmas((prev) => [data, ...prev])
        setContagemAlunos((prev) => ({ ...prev, [data.id]: 0 }))
        return data
      }
      ultimoErro = error
      if (error.code !== '23505') break // só tenta de novo se for colisão de código único
    }
    throw new Error(ultimoErro?.message || 'Não foi possível criar a turma.')
  }, [professorId])

  const excluirTurma = useCallback(async (turmaId) => {
    const { error } = await supabase.from('turmas').delete().eq('id', turmaId)
    if (error) throw new Error('Não foi possível excluir a turma.')
    setTurmas((prev) => prev.filter((t) => t.id !== turmaId))
  }, [])

  return { turmas, contagemAlunos, carregando, erro, criarTurma, excluirTurma, recarregar }
}
