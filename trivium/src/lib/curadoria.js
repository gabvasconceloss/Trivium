import { supabase } from './supabaseClient'

export async function buscarVideosParaTopico({ topicoId, materia, assunto, idade = 14 }) {
  const { data, error } = await supabase.functions.invoke('curadoria-videos', { body: { topicoId, materia, assunto, idade } })
  if (error) throw new Error(error.message || 'Não foi possível buscar videoaulas agora. Tente novamente em instantes.')
  if (!data || !Array.isArray(data.videos)) throw new Error('Resposta inesperada da curadoria de vídeos.')
  return data.videos
}

export async function registrarParticipacaoAula(topicoId) {
  const { error } = await supabase.rpc('trivium_registrar_participacao_aula', { p_topico_id: topicoId })
  if (error) console.error('[Trivium] Erro ao registrar participação em aula:', error)
}
