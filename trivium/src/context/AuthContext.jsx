import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { gerarCodigoAleatorio } from '../lib/utils'

const AuthContext = createContext(null)

const SELECT_ALUNO =
  'id, nome, email, avatar_url, turma_id, topicos_criados, resumos_concluidos, ' +
  'atividades_entregues_prazo, aulas_participadas, sequencia_dias, media_geral, xp, nivel, ' +
  'codigo_indicacao, avatar_ativo, moldura_ativa, capa_ativa, titulo_ativo, cor_destaque, preferencias, ' +
  'turmas ( id, nome, escola, codigo_acesso )'

export function AuthProvider({ children }) {
  const [papel, setPapel] = useState(null) // 'aluno' | 'professor' | null
  const [aluno, setAluno] = useState(null)
  const [turma, setTurma] = useState(null)
  const [professor, setProfessor] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const aplicarTema = useCallback((prefs) => {
    document.documentElement.classList.toggle('dark', Boolean(prefs?.modo_escuro))
  }, [])

  // Tenta carregar como aluno; se não achar, tenta como professor. Define `papel`.
  const carregarPerfil = useCallback(
    async (userId) => {
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select(SELECT_ALUNO)
        .eq('auth_user_id', userId)
        .maybeSingle()

      if (alunoError) console.error('[Trivium] Erro ao carregar aluno:', alunoError)

      if (alunoData) {
        const { turmas, ...resto } = alunoData
        setAluno(resto)
        setTurma(turmas)
        setProfessor(null)
        setPapel('aluno')
        aplicarTema(resto.preferencias)
        return 'aluno'
      }

      const { data: profData, error: profError } = await supabase
        .from('professores')
        .select('id, nome, email')
        .eq('auth_user_id', userId)
        .maybeSingle()

      if (profError) console.error('[Trivium] Erro ao carregar professor:', profError)

      if (profData) {
        setProfessor(profData)
        setAluno(null)
        setTurma(null)
        setPapel('professor')
        return 'professor'
      }

      setPapel(null)
      return null
    },
    [aplicarTema]
  )

  useEffect(() => {
    let ativo = true
    async function bootstrap() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      if (session?.user && ativo) {
        setAuthUser(session.user)
        await carregarPerfil(session.user.id)
      }
      if (ativo) setLoading(false)
    }
    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (!session?.user) {
        setAluno(null); setTurma(null); setProfessor(null); setPapel(null)
      }
    })
    return () => { ativo = false; listener?.subscription?.unsubscribe() }
  }, [carregarPerfil])

  const entrar = useCallback(
    async ({ email, senha }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (error) {
        if (error.message.includes('Invalid login')) throw new Error('E-mail ou senha incorretos.')
        throw new Error(error.message)
      }
      setAuthUser(data.user)
      const papelCarregado = await carregarPerfil(data.user.id)
      if (!papelCarregado) throw new Error('Conta autenticada, mas sem perfil vinculado (nem aluno, nem professor). Contate o suporte.')
      return papelCarregado
    },
    [carregarPerfil]
  )

  async function garantirSessaoPosSignUp(signUpData, email, senha) {
    let session = signUpData.session
    if (!session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (loginError) {
        throw new Error(
          'Conta criada! Verifique seu e-mail para confirmar o cadastro antes de continuar ' +
            '(ou desative "Confirm email" em Authentication → Providers → Email, no painel do Supabase, se estiver apenas testando).'
        )
      }
      session = loginData.session
    }
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) throw new Error('Não foi possível confirmar sua sessão. Tente fazer login novamente.')
    return { session, userId: userData.user.id }
  }

  /** RF01 — Cadastro de ALUNO: exige um código de turma real, gerado por um professor (RN09/RN10). */
  const criarContaAluno = useCallback(async ({ nome, email, senha, codigoTurma }) => {
    const nomeLimpo = nome.trim()
    const codigoLimpo = codigoTurma.trim().toUpperCase()
    if (!nomeLimpo || !email.trim() || !senha || !codigoLimpo) throw new Error('Preencha todos os campos obrigatórios.')
    if (senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')

    // Valida o código ANTES de criar a conta, pra não gerar usuário órfão em auth.users por engano
    const { data: turmaEncontrada, error: turmaBuscaError } = await supabase
      .from('turmas')
      .select('id, nome, escola, codigo_acesso')
      .eq('codigo_acesso', codigoLimpo)
      .maybeSingle()
    if (turmaBuscaError) throw new Error('Não foi possível validar o código de turma. Tente novamente.')
    if (!turmaEncontrada) throw new Error('Código de turma inválido. Confirme com seu professor.')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password: senha })
    if (signUpError) {
      if (signUpError.message.includes('already registered')) throw new Error('Já existe uma conta com este e-mail.')
      throw new Error(signUpError.message)
    }

    const { session, userId } = await garantirSessaoPosSignUp(signUpData, email, senha)

    // RN18 — gera um codigo_indicacao único, com retry em caso de colisão (RNF12)
    let novoAluno = null
    let ultimoErro = null
    for (let tentativa = 0; tentativa < 5 && !novoAluno; tentativa++) {
      const codigoIndicacao = gerarCodigoAleatorio(6)
      const { data, error } = await supabase
        .from('alunos')
        .insert({ auth_user_id: userId, nome: nomeLimpo, email: email.trim(), turma_id: turmaEncontrada.id, codigo_indicacao: codigoIndicacao })
        .select(SELECT_ALUNO)
        .single()
      if (!error) { novoAluno = data; break }
      ultimoErro = error
      if (!error?.message?.includes('duplicate') && error?.code !== '23505') break
    }
    if (!novoAluno) {
      if (ultimoErro?.message?.includes('row-level security')) {
        throw new Error('Sem permissão para criar seu perfil de aluno (RLS). Confira a policy "alunos_insert_proprio".')
      }
      throw new Error(`Não foi possível concluir seu cadastro: ${ultimoErro?.message || 'erro desconhecido'}`)
    }

    const { turmas: turmaDoNovoAluno, ...restoAluno } = novoAluno
    setAuthUser(session.user)
    setAluno(restoAluno)
    setTurma(turmaDoNovoAluno || turmaEncontrada)
    setProfessor(null)
    setPapel('aluno')
    return restoAluno
  }, [])

  /** RF02 — Cadastro de PROFESSOR: não precisa de código, pois é quem os gera depois. */
  const criarContaProfessor = useCallback(async ({ nome, email, senha }) => {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo || !email.trim() || !senha) throw new Error('Preencha todos os campos obrigatórios.')
    if (senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password: senha })
    if (signUpError) {
      if (signUpError.message.includes('already registered')) throw new Error('Já existe uma conta com este e-mail.')
      throw new Error(signUpError.message)
    }

    const { session, userId } = await garantirSessaoPosSignUp(signUpData, email, senha)

    const { data: novoProfessor, error: profError } = await supabase
      .from('professores')
      .insert({ auth_user_id: userId, nome: nomeLimpo, email: email.trim() })
      .select('id, nome, email')
      .single()
    if (profError) {
      if (profError.message.includes('row-level security')) {
        throw new Error('Sem permissão para criar seu perfil de professor (RLS). Confira a policy "professores_insert_proprio".')
      }
      throw new Error(`Não foi possível concluir seu cadastro: ${profError.message}`)
    }

    setAuthUser(session.user)
    setProfessor(novoProfessor)
    setAluno(null)
    setTurma(null)
    setPapel('professor')
    return novoProfessor
  }, [])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
    setAluno(null); setTurma(null); setProfessor(null); setAuthUser(null); setPapel(null)
    document.documentElement.classList.remove('dark')
  }, [])

  const atualizarPerfil = useCallback(async (campos) => {
    if (!aluno) return
    const { data, error } = await supabase.from('alunos').update(campos).eq('id', aluno.id).select(SELECT_ALUNO).single()
    if (error) throw new Error(error.message || 'Não foi possível salvar as alterações.')
    const { turmas, ...resto } = data
    setAluno(resto)
    if (campos.preferencias?.modo_escuro !== undefined) aplicarTema(campos.preferencias)
    return resto
  }, [aluno, aplicarTema])

  const recarregarAluno = useCallback(() => {
    if (authUser) return carregarPerfil(authUser.id)
  }, [authUser, carregarPerfil])

  const value = {
    papel, aluno, turma, professor, authUser, loading,
    autenticado: Boolean((aluno || professor) && authUser),
    entrar, criarContaAluno, criarContaProfessor, sair, atualizarPerfil, recarregarAluno
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
