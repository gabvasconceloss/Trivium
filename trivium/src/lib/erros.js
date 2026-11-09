const MENSAGEM_PADRAO = 'Algo deu errado. Tente novamente.'

const TRADUCOES = [
  [/failed to fetch|failed to send a request|networkerror|load failed|network request failed/i, 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'],
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar.'],
  [/already registered/i, 'Já existe uma conta com este e-mail.'],
  [/password should be at least/i, 'A senha é muito curta.'],
  [/unable to validate email|email address .*invalid|invalid email/i, 'Digite um e-mail válido.'],
  [/signups? .*(disabled|not allowed)/i, 'Novos cadastros estão desativados no momento.'],
  [/rate limit|too many requests|for security purposes/i, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
  [/jwt expired|session (missing|expired)|refresh token/i, 'Sua sessão expirou. Faça login novamente.'],
  [/row-level security|permission denied/i, 'Você não tem permissão para fazer isso.']
]

export function traduzirErro(erro, mensagemPadrao = MENSAGEM_PADRAO) {
  const mensagem = erro?.message || ''
  if (erro?.code === 'P0001' && mensagem) return mensagem
  const traducao = TRADUCOES.find(([padrao]) => padrao.test(mensagem))
  return traducao ? traducao[1] : mensagemPadrao
}
