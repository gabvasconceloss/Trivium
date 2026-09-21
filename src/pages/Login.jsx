import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      await entrar({ email, senha })
      navigate('/dashboard')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-full grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center bg-canvas px-12 lg:px-16 py-10">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center font-display font-bold text-primary text-lg">
            T
          </div>
          <p className="font-display font-bold text-xl text-ink">Trivium</p>
        </div>
        <h1 className="text-4xl font-display font-bold text-primary leading-tight mb-4">
          Sua rotina escolar
          <br /> simplificada.
        </h1>
        <p className="text-ink-soft max-w-sm">
          Organize seus cadernos, acompanhe suas tarefas e estude com o apoio da Inteligência
          Artificial.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 pt-safe-top pb-safe-bottom">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center font-display font-bold text-primary text-lg">
              T
            </div>
            <p className="font-display font-bold text-xl text-ink">Trivium</p>
          </div>

          <h2 className="text-2xl font-display font-bold text-ink mb-1">Bem-vindo ao Trivium</h2>
          <p className="text-ink-soft text-sm mb-6">Entre com seu e-mail e senha para acessar seus cadernos.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-ink">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@escola.com"
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface placeholder:text-ink-soft/50 touch-target"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium mb-1.5 text-ink">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface placeholder:text-ink-soft/50 touch-target"
                required
              />
            </div>

            {erro && <p role="alert" className="text-sm text-danger bg-danger/10 rounded-xl px-3 py-2">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 h-12 rounded-xl bg-primary-light text-primary-dark font-semibold touch-target
              hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="text-sm text-ink-soft text-center mt-6">
            Não tem uma conta?{' '}
            <Link to="/criar-conta" className="text-primary font-semibold">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
