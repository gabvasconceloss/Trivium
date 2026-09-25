import { supabase } from './clienteSupabase'

/**
 * Aciona a Edge Function "curadoria-videos" (RF14-RF18).
 * Retorna vídeos ricos: [{ id, titulo, duracao, thumbnail }]
 */
export async function buscarVideosParaTopico({ topicoId, materia, assunto, idade = 14 }) {
  const { data, error } = await supabase.functions.invoke('curadoria-videos', {
    body: { topicoId, materia, assunto, idade }
  })

  if (error) {
    throw new Error(
      error.message || 'Não foi possível buscar videoaulas agora. Tente novamente em instantes.'
    )
  }
  if (!data || !Array.isArray(data.videos)) {
    throw new Error('Resposta inesperada da curadoria de vídeos.')
  }
  return data.videos
}

/**
 * Registra que o aluno abriu/assistiu uma videoaula (conta para a conquista "Participativo").
 * Feito via RPC porque a estatística nunca pode ser escrita diretamente pelo client.
 */
export async function registrarParticipacaoAula(topicoId) {
  const { error } = await supabase.rpc('trivium_registrar_participacao_aula', {
    p_topico_id: topicoId
  })
  if (error) console.error('[Trivium] Erro ao registrar participação em aula:', error)
}
