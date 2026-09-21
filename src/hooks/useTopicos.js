import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { buscarVideosParaTopico, registrarParticipacaoAula } from '../lib/curadoria'
import { gerarId } from '../lib/utils'

const BLOCO_INICIAL = () => [{ id: gerarId(), tipo: 'texto', conteudo: '' }]

export function useTopicos(materiaId) {
  const [topicos, setTopicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!materiaId) return
    setCarregando(true)
    setErro(null)

    const { data, error } = await supabase
      .from('topicos')
      .select('id, titulo, status_concluido, blocos, videos_recomendados, created_at, updated_at')
      .eq('materia_id', materiaId)
      .order('created_at', { ascending: true })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }
    setTopicos(data)
    setCarregando(false)
  }, [materiaId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // RF08/RF09 — criação rápida: só o título é exigido; já nasce com um bloco de texto vazio
  const criarTopico = useCallback(
    async (titulo) => {
      const { data, error } = await supabase
        .from('topicos')
        .insert({
          materia_id: materiaId,
          titulo,
          status_concluido: false,
          blocos: BLOCO_INICIAL(),
          videos_recomendados: []
        })
        .select()
        .single()
      if (error) throw new Error('Não foi possível criar o tópico.')
      setTopicos((prev) => [...prev, data])
      return data
    },
    [materiaId]
  )

  const alternarConcluido = useCallback(async (topico) => {
    const novoStatus = !topico.status_concluido
    setTopicos((prev) => prev.map((t) => (t.id === topico.id ? { ...t, status_concluido: novoStatus } : t)))
    const { error } = await supabase.from('topicos').update({ status_concluido: novoStatus }).eq('id', topico.id)
    if (error) {
      setTopicos((prev) => prev.map((t) => (t.id === topico.id ? { ...t, status_concluido: !novoStatus } : t)))
    }
  }, [])

  const excluirTopico = useCallback(async (topicoId) => {
    const { error } = await supabase.from('topicos').delete().eq('id', topicoId)
    if (error) throw new Error('Não foi possível excluir o tópico.')
    setTopicos((prev) => prev.filter((t) => t.id !== topicoId))
  }, [])

  const renomearTopico = useCallback(async (topicoId, novoTitulo) => {
    const tituloLimpo = novoTitulo.trim()
    if (!tituloLimpo) return
    setTopicos((prev) => prev.map((t) => (t.id === topicoId ? { ...t, titulo: tituloLimpo } : t)))
    const { error } = await supabase.from('topicos').update({ titulo: tituloLimpo }).eq('id', topicoId)
    if (error) console.error('[Trivium] Erro ao renomear tópico:', error)
  }, [])

  // Autosave dos blocos do editor
  const salvarBlocos = useCallback(async (topicoId, blocos) => {
    const { error } = await supabase
      .from('topicos')
      .update({ blocos, updated_at: new Date().toISOString() })
      .eq('id', topicoId)
    if (error) throw new Error('Não foi possível salvar as anotações.')
  }, [])

  // RF14-RF18 — curadoria semiautomática de vídeos
  const buscarVideos = useCallback(async (topico, materiaNome) => {
    const videos = await buscarVideosParaTopico({
      topicoId: topico.id,
      materia: materiaNome,
      assunto: topico.titulo
    })
    setTopicos((prev) => prev.map((t) => (t.id === topico.id ? { ...t, videos_recomendados: videos } : t)))
    return videos
  }, [])

  // Chamado quando o aluno clica em "play" num vídeo — conta para a conquista "Participativo"
  const registrarAssistiu = useCallback((topicoId) => {
    registrarParticipacaoAula(topicoId)
  }, [])

  return {
    topicos,
    carregando,
    erro,
    criarTopico,
    alternarConcluido,
    excluirTopico,
    renomearTopico,
    salvarBlocos,
    buscarVideos,
    registrarAssistiu,
    recarregar
  }
}
