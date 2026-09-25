import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/clienteSupabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [aluno, setAluno] = useState(null)
  const [turma, setTurma] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const carregarAluno = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('alunos')
      .select(
        'id, nome, email, avatar_url, turma_id, topicos_criados, resumos_concluidos, ' +
          'atividades_entregues_prazo, aulas_participadas, sequencia_dias, media_geral, xp, preferencias, ' +
          'turmas ( id, nome, escola )'
      )
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[Trivium] Erro ao carregar aluno:', error)
      return null
    }
    if (data) {
      const { turmas, ...resto } = data
      setAluno(resto)
      setTurma(turmas)

      // Aplica o tema salvo nas preferências assim que carrega
      const modoEscuro = resto.preferencias?.modo_escuro
      document.documentElement.classList.toggle('dark', Boolean(modoEscuro))
    }
    return data
  }, [])

  useEffect(() => {
    let ativo = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      if (session?.user && ativo) {
        setAuthUser(session.user)
        await carregarAluno(session.user.id)
      }
      if (ativo) setLoading(false)
    }
    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (!session?.user) {
        setAluno(null)
        setTurma(null)
      }
    })

    return () => {
      ativo = false
      listener?.subscription?.unsubscribe()
    }
  }, [carregarAluno])

  /** RF: Login real por e-mail/senha (fiel ao Figma) */
  const entrar = useCallback(
    async ({ email, senha }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha
      })
      if (error) {
        if (error.message.includes('Invalid login')) {
          throw new Error('E-mail ou senha incorretos.')
        }
        throw new Error(error.message)
      }
      setAuthUser(data.user)
      const alunoCarregado = await carregarAluno(data.user.id)
      if (!alunoCarregado) {
        throw new Error('Conta autenticada, mas sem perfil de aluno vinculado. Contate o suporte.')
      }
      return alunoCarregado
    },
    [carregarAluno]
  )

  /** RF: Cadastro (Criar conta) — cria usuário no Supabase Auth + registro em `alunos`,
   * localizando ou criando a turma informada. */
  const criarConta = useCallback(async ({ nome, email, senha, nomeTurma, escola }) => {
    const nomeLimpo = nome.trim()
    const nomeTurmaLimpo = nomeTurma.trim()

    if (!nomeLimpo || !email.trim() || !senha || !nomeTurmaLimpo) {
      throw new Error('Preencha todos os campos obrigatórios.')
    }
    if (senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.')
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha
    })
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        throw new Error('Já existe uma conta com este e-mail.')
      }
      throw new Error(signUpError.message)
    }

    const userId = signUpData.user?.id
    if (!userId) {
      throw new Error(
        'Cadastro iniciado! Se sua conta exigir confirmação por e-mail, verifique sua caixa de entrada antes de entrar.'
      )
    }

    // Garante que exista uma sessão ativa antes de gravar em `alunos` (RLS exige auth.uid())
    let session = (await supabase.auth.getSession()).data.session
    if (!session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha
      })
      if (loginError) throw new Error('Conta criada, mas não foi possível iniciar sua sessão automaticamente. Faça login.')
      session = loginData.session
    }

    // Encontra ou cria a turma pelo nome
    let { data: turmaEncontrada } = await supabase
      .from('turmas')
      .select('id, nome, escola')
      .ilike('nome', nomeTurmaLimpo)
      .maybeSingle()

    if (!turmaEncontrada) {
      const { data: novaTurma, error: turmaError } = await supabase
        .from('turmas')
        .insert({ nome: nomeTurmaLimpo, escola: escola?.trim() || null })
        .select('id, nome, escola')
        .single()
      if (turmaError) throw new Error('Não foi possível registrar a turma informada.')
      turmaEncontrada = novaTurma
    }

    const { data: novoAluno, error: alunoError } = await supabase
      .from('alunos')
      .insert({
        auth_user_id: userId,
        nome: nomeLimpo,
        email: email.trim(),
        turma_id: turmaEncontrada.id
      })
      .select()
      .single()

    if (alunoError) throw new Error('Não foi possível concluir seu cadastro. Tente novamente.')

    setAuthUser(session.user)
    setAluno(novoAluno)
    setTurma(turmaEncontrada)
    return novoAluno
  }, [])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
    setAluno(null)
    setTurma(null)
    setAuthUser(null)
    document.documentElement.classList.remove('dark')
  }, [])

  /** Atualiza preferências (perfil, tema, notificações) — usado na página Conta */
  const atualizarPerfil = useCallback(
    async (campos) => {
      if (!aluno) return
      const { data, error } = await supabase
        .from('alunos')
        .update(campos)
        .eq('id', aluno.id)
        .select()
        .single()
      if (error) throw new Error('Não foi possível salvar as alterações.')
      setAluno((prev) => ({ ...prev, ...data }))
      if (campos.preferencias?.modo_escuro !== undefined) {
        document.documentElement.classList.toggle('dark', campos.preferencias.modo_escuro)
      }
      return data
    },
    [aluno]
  )

  const recarregarAluno = useCallback(() => {
    if (authUser) return carregarAluno(authUser.id)
  }, [authUser, carregarAluno])

  const value = {
    aluno,
    turma,
    authUser,
    loading,
    autenticado: Boolean(aluno && authUser),
    entrar,
    criarConta,
    sair,
    atualizarPerfil,
    recarregarAluno
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
