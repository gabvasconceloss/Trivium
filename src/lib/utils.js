export function gerarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function formatarTempoRelativo(dataIso) {
  if (!dataIso) return '—'
  const agora = new Date()
  const data = new Date(dataIso)
  const diffMs = agora - data
  const diffMin = Math.floor(diffMs / 60000)
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
  return new Date(`${dataIso}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  })
}

export const CORES_CADERNO = ['#3B5FE0', '#22B8A0', '#F5A623', '#E8564C', '#8B5CF6', '#0EA5C4']
export const ICONES_CADERNO = ['📘', '🧮', '🌎', '🔬', '🎨', '📜', '🗣️', '⚗️', '🎵', '💻']

export function primeiroNome(nomeCompleto = '') {
  return nomeCompleto.trim().split(' ')[0] || nomeCompleto
}
