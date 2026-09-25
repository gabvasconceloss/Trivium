import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/clienteSupabase' // Substitui o antigo '../lib/supabaseClient'

export function useEventos(alunoId) {
  const [eventos, setEventos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true)
    setErro(null)

    const { data, error } = await supabase
      .from('eventos')
      .select('id, titulo, descricao, data, hora_inicio, hora_fim, concluido, materia_id, materias ( nome, cor_tema )')
      .eq('aluno_id', alunoId)
      .order('data', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }
    setEventos(data)
    setCarregando(false)
  }, [alunoId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const criarEvento = useCallback(
    async ({ titulo, descricao, data, horaInicio, horaFim, materiaId }) => {
      const { data: novo, error } = await supabase
        .from('eventos')
        .insert({
          aluno_id: alunoId,
          titulo,
          descricao: descricao || null,
          data,
          hora_inicio: horaInicio || null,
          hora_fim: horaFim || null,
          materia_id: materiaId || null
        })
        .select('id, titulo, descricao, data, hora_inicio, hora_fim, concluido, materia_id, materias ( nome, cor_tema )')
        .single()
      if (error) throw new Error('Não foi possível criar o evento.')
      setEventos((prev) => [...prev, novo])
      return novo
    },
    [alunoId]
  )

  const alternarConcluido = useCallback(async (evento) => {
    const novoStatus = !evento.concluido
    setEventos((prev) => prev.map((e) => (e.id === evento.id ? { ...e, concluido: novoStatus } : e)))
    const { error } = await supabase.from('eventos').update({ concluido: novoStatus }).eq('id', evento.id)
    if (error) {
      setEventos((prev) => prev.map((e) => (e.id === evento.id ? { ...e, concluido: !novoStatus } : e)))
    }
  }, [])

  const excluirEvento = useCallback(async (eventoId) => {
    const { error } = await supabase.from('eventos').delete().eq('id', eventoId)
    if (error) throw new Error('Não foi possível excluir o evento.')
    setEventos((prev) => prev.filter((e) => e.id !== eventoId))
  }, [])

  return { eventos, carregando, erro, criarEvento, alternarConcluido, excluirEvento, recarregar }
}
