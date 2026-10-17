import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Lado do ALUNO: lista as entregas das atividades formais da própria turma
 * (criadas pelo professor) e permite só marcar como entregue — nota é somente
 * leitura aqui (RN12, reforçado também por trigger no banco).
 */
export function useEntregas(alunoId) {
  const [entregas, setEntregas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true); setErro(null)
    const { data, error } = await supabase
      .from('entregas')
      .select('id, status, nota, entregue_em, atividade_id, atividades ( id, titulo, descricao, materia, data_entrega )')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })
    if (error) { setErro(error.message); setCarregando(false); return }
    setEntregas(data); setCarregando(false)
  }, [alunoId])

  useEffect(() => { recarregar() }, [recarregar])

  const marcarEntregue = useCallback(async (entregaId) => {
    const { data, error } = await supabase
      .from('entregas')
      .update({ status: 'entregue' })
      .eq('id', entregaId)
      .select('id, status, nota, entregue_em, atividade_id, atividades ( id, titulo, descricao, materia, data_entrega )')
      .single()
    if (error) throw new Error('Não foi possível marcar a entrega. Tente novamente.')
    setEntregas((prev) => prev.map((e) => (e.id === entregaId ? data : e)))
  }, [])

  return { entregas, carregando, erro, marcarEntregue, recarregar }
}
