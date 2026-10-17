// Supabase Edge Function: curadoria-videos (Deno)
// RF14-RF18, RN01, RN02, RN05, RN06, RN08.
// Secrets necessárias: GEMINI_API_KEY, YOUTUBE_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

function normalizar(texto: string) {
  return texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatarDuracao(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '--:--'
  const horas = parseInt(match[1] || '0', 10)
  const minutos = parseInt(match[2] || '0', 10)
  const segundos = parseInt(match[3] || '0', 10)
  const ss = String(segundos).padStart(2, '0')
  if (horas > 0) return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${ss}`
  return `${String(minutos).padStart(2, '0')}:${ss}`
}

// A Google descontinua/renomeia modelos do Gemini com frequência. Em vez de
// fixar um nome que pode sumir, perguntamos à própria API quais modelos estão
// disponíveis agora e escolhemos um que suporte generateContent (preferindo um
// "flash", mais rápido/barato, mas aceitando qualquer um compatível).
let modeloEmCache: { nome: string; expiraEm: number } | null = null

async function resolverModeloGemini(apiKey: string): Promise<string> {
  const agora = Date.now()
  if (modeloEmCache && modeloEmCache.expiraEm > agora) return modeloEmCache.nome

  const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  if (!resposta.ok) {
    throw new Error(`Não foi possível listar os modelos do Gemini (status ${resposta.status}).`)
  }
  const dados = await resposta.json()
  const modelos: any[] = dados.models ?? []

  const compativeis = modelos.filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
  if (compativeis.length === 0) {
    throw new Error('Nenhum modelo Gemini disponível para esta chave suporta generateContent.')
  }

  // Preferência: "flash" (mais rápido/barato) > "pro" > qualquer outro compatível
  const escolhido =
    compativeis.find((m) => /flash/i.test(m.name) && !/image|vision|embedding/i.test(m.name)) ??
    compativeis.find((m) => /pro/i.test(m.name) && !/image|vision|embedding/i.test(m.name)) ??
    compativeis[0]

  const nomeModelo = escolhido.name.replace(/^models\//, '')
  modeloEmCache = { nome: nomeModelo, expiraEm: agora + 30 * 60 * 1000 } // cache de 30min no processo
  return nomeModelo
}

async function gerarTermosDeBusca(materia: string, assunto: string, idade: number) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada nas secrets da Edge Function.')

  const promptSistema =
    'Você é um formatador de termos de busca para o YouTube voltado a conteúdo educacional. ' +
    'NUNCA responda a pergunta do aluno diretamente e NUNCA explique o assunto. ' +
    'Sua única tarefa é gerar de 1 a 3 termos de busca curtos, em português, apropriados para o YouTube, ' +
    `sobre o assunto informado, adequados a um aluno de ${idade} anos do ensino fundamental. ` +
    'Responda APENAS em JSON, no formato exato: {"termos": ["termo 1", "termo 2"]}. Sem markdown, sem texto extra.'

  const promptUsuario = `Matéria: ${materia}. Assunto: ${assunto}.`
  const corpoRequisicao = {
    contents: [{ role: 'user', parts: [{ text: promptUsuario }] }],
    systemInstruction: { role: 'system', parts: [{ text: promptSistema }] },
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
  }

  let modelo = await resolverModeloGemini(apiKey)
  let resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpoRequisicao) }
  )

  // Se o modelo em cache também sumiu entre uma chamada e outra, invalida o cache e tenta mais uma vez
  if (resposta.status === 404) {
    modeloEmCache = null
    modelo = await resolverModeloGemini(apiKey)
    resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpoRequisicao) }
    )
  }

  if (!resposta.ok) throw new Error(`Falha ao consultar a API de IA (status ${resposta.status}, modelo ${modelo}).`)
  const dados = await resposta.json()
  const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  let termos: string[] = []
  try {
    const parsed = JSON.parse(textoGerado)
    termos = Array.isArray(parsed.termos) ? parsed.termos : []
  } catch { termos = [`${materia} ${assunto} aula`] }
  if (termos.length === 0) termos = [`${materia} ${assunto} aula`]
  return termos
}

async function buscarVideosNoYoutube(termos: string[]) {
  const apiKey = Deno.env.get('YOUTUBE_API_KEY')
  if (!apiKey) throw new Error('YOUTUBE_API_KEY não configurada nas secrets da Edge Function.')
  const query = termos.slice(0, 2).join(' ')

  const paramsBusca = new URLSearchParams({
    part: 'snippet', type: 'video', q: query, maxResults: '3',
    safeSearch: 'strict', videoCategoryId: '27', videoDuration: 'medium',
    relevanceLanguage: 'pt', regionCode: 'BR', key: apiKey
  })
  const respostaBusca = await fetch(`https://www.googleapis.com/youtube/v3/search?${paramsBusca.toString()}`)
  if (!respostaBusca.ok) throw new Error(`Falha ao consultar a YouTube Data API - busca (status ${respostaBusca.status}).`)
  const dadosBusca = await respostaBusca.json()
  const ids: string[] = (dadosBusca.items ?? []).map((item: any) => item.id?.videoId).filter(Boolean).slice(0, 3)
  if (ids.length === 0) return []

  const paramsDetalhes = new URLSearchParams({ part: 'contentDetails,snippet', id: ids.join(','), key: apiKey })
  const respostaDetalhes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${paramsDetalhes.toString()}`)
  if (!respostaDetalhes.ok) {
    return ids.map((id) => ({ id, titulo: 'Videoaula', duracao: '--:--', thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }))
  }
  const dadosDetalhes = await respostaDetalhes.json()
  return (dadosDetalhes.items ?? []).map((item: any) => ({
    id: item.id,
    titulo: item.snippet?.title ?? 'Videoaula',
    duracao: formatarDuracao(item.contentDetails?.duration ?? ''),
    thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
  }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  try {
    const { topicoId, materia, assunto, idade = 14 } = await req.json()
    if (!topicoId || !materia || !assunto) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios ausentes.' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const assuntoNormalizado = normalizar(assunto)
    const materiaNormalizada = normalizar(materia)

    const { data: cacheExistente } = await supabaseAdmin.from('cache_buscas').select('videos')
      .eq('materia', materiaNormalizada).eq('assunto_normalizado', assuntoNormalizado).maybeSingle()

    let videos: any[]
    if (cacheExistente && Array.isArray(cacheExistente.videos) && cacheExistente.videos.length > 0) {
      videos = cacheExistente.videos
    } else {
      const termos = await gerarTermosDeBusca(materia, assunto, idade)
      videos = await buscarVideosNoYoutube(termos)
      if (videos.length > 0) {
        await supabaseAdmin.from('cache_buscas').upsert(
          { materia: materiaNormalizada, assunto_normalizado: assuntoNormalizado, termos_ia: termos.join(', '), videos },
          { onConflict: 'materia,assunto_normalizado' }
        )
      }
    }

    await supabaseAdmin.from('topicos').update({ videos_recomendados: videos }).eq('id', topicoId)
    return new Response(JSON.stringify({ videos }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('[curadoria-videos] erro:', err)
    const mensagem = err instanceof Error ? err.message : 'Erro interno na curadoria.'
    return new Response(JSON.stringify({ error: mensagem }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  }
})