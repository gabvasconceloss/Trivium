export function gerarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function formatarTempoRelativo(dataIso) {
  if (!dataIso) return '—'
  const agora = new Date()
  const data = new Date(dataIso)
  const diffMin = Math.floor((agora - data) / 60000)
  const diffHoras = Math.floor(diffMin / 60)
  const diffDias = Math.floor(diffHoras / 24)
  if (diffMin < 1) return 'Agora mesmo'
  if (diffMin < 60) return `Há ${diffMin} min`
  if (diffHoras < 24) return diffHoras === 1 ? 'Há 1 hora' : `Há ${diffHoras} horas`
  if (diffDias === 1) return 'Ontem'
  if (diffDias < 7) return `Há ${diffDias} dias`
  if (diffDias < 14) return 'Há 1 semana'
  if (diffDias < 30) return `Há ${Math.floor(diffDias / 7)} semanas`
  return data.toLocaleDateString('pt-BR')
}

export function formatarDataCurta(dataIso) {
  if (!dataIso) return '—'
  return new Date(`${dataIso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export const CORES_CADERNO = ['#3B5FE0', '#22B8A0', '#F5A623', '#E8564C', '#8B5CF6', '#0EA5C4']
export const ICONES_CADERNO = ['📘', '🧮', '🌎', '🔬', '🎨', '📜', '🗣️', '⚗️', '🎵', '💻']

const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // sem O/0/I/1 para evitar confusão visual

export function gerarCodigoAleatorio(tamanho = 6) {
  let codigo = ''
  for (let i = 0; i < tamanho; i++) {
    codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)]
  }
  return codigo
}

export function primeiroNome(nomeCompleto = '') {
  return nomeCompleto.trim().split(' ')[0] || nomeCompleto
}

/**
 * Espelha a curva de nível calculada no banco (trivium_calcular_nivel):
 * XP necessário para ir do nível N ao N+1 = 100 + 50*(N-1).
 * Usado só para exibição otimista; o valor oficial sempre vem do banco
 * (alunos.nivel, calculado por trigger) — nunca confiar só nisso para regras de negócio.
 */
export function calcularNivelLocal(xpTotal) {
  let nivel = 1
  let restante = xpTotal
  let necessario = 100
  while (restante >= necessario) {
    restante -= necessario
    nivel += 1
    necessario = 100 + 50 * (nivel - 1)
  }
  return { nivel, xpAtual: restante, xpNecessario: necessario }
}
