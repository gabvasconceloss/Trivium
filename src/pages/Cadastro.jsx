import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/ContextoAutenticacao'

export default function Cadastro() {
  const { criarConta } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeTurma, setNomeTurma] = useState('')
  const [escola, setEscola] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setCarregando(true)
    try {
      await criarConta({ nome, email, senha, nomeTurma, escola })
      navigate('/dashboard')
    } catch (err) {
      if (err.message.includes('confirmação por e-mail')) {
        setAviso(err.message)
      } else {
        setErro(err.message)
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-5 py-10 pt-safe-top pb-safe-bottom">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center font-display font-bold text-primary text-lg">
            T
          </div>
          <p className="font-display font-bold text-xl text-ink">Trivium</p>
        </div>

        <h2 className="text-2xl font-display font-bold text-ink mb-1">Criar conta</h2>
        <p className="text-ink-soft text-sm mb-6">Leva menos de um minuto.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink">Nome completo</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como podemos te chamar?"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface touch-target"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@escola.com"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface touch-target"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface touch-target"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink">Turma</label>
            <input
              value={nomeTurma}
              onChange={(e) => setNomeTurma(e.target.value)}
              placeholder="Ex: 9º Ano A"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface touch-target"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink">Escola (opcional)</label>
            <input
              value={escola}
              onChange={(e) => setEscola(e.target.value)}
              placeholder="Nome da sua escola"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface touch-target"
            />
          </div>

          {erro && <p role="alert" className="text-sm text-danger bg-danger/10 rounded-xl px-3 py-2">{erro}</p>}
          {aviso && <p role="status" className="text-sm text-primary bg-primary-light rounded-xl px-3 py-2">{aviso}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 h-12 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-60"
          >
            {carregando ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="text-sm text-ink-soft text-center mt-6">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}