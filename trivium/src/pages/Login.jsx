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
      const papel = await entrar({ email, senha })
      navigate(papel === 'professor' ? '/professor/turmas' : '/dashboard')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-full grid md:grid-cols-2 bg-[#0F1222]">
      <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-[#161A33] to-[#0F1222] px-12 lg:px-16 py-10 relative overflow-hidden">
        <svg className="absolute -right-24 -bottom-24 opacity-40" width="420" height="420" viewBox="0 0 420 420" fill="none">
          <circle cx="210" cy="210" r="200" stroke="#3B5FE0" strokeWidth="1" opacity="0.3" />
          <circle cx="210" cy="210" r="150" stroke="#8B5CF6" strokeWidth="1" opacity="0.3" />
          <circle cx="210" cy="210" r="100" stroke="#22B8A0" strokeWidth="1" opacity="0.3" />
          <path d="M130 230c20-60 70-90 100-20s70 40 90-10" stroke="#3B5FE0" strokeWidth="2" fill="none" opacity="0.6" />
          <circle cx="130" cy="230" r="5" fill="#8B5CF6" />
          <circle cx="320" cy="200" r="5" fill="#22B8A0" />
        </svg>
        <div className="relative z-10 flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-display font-bold text-lg text-white">T</div>
          <p className="font-display font-bold text-xl text-white">Trivium</p>
        </div>
        <h1 className="relative z-10 text-4xl font-display font-bold text-white leading-tight mb-4">
          Sua rotina escolar
          <br /> simplificada.
        </h1>
        <p className="relative z-10 text-white/60 max-w-sm">
          Organize seus cadernos, acompanhe suas tarefas e estude com o apoio da Inteligência Artificial.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 pt-safe-top pb-safe-bottom bg-canvas dark:bg-[#0F1222]">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center font-display font-bold text-primary text-lg">T</div>
            <p className="font-display font-bold text-xl text-ink dark:text-white">Trivium</p>
          </div>

          <h2 className="text-2xl font-display font-bold text-ink dark:text-white mb-1">Bem-vindo ao Trivium</h2>
          <p className="text-ink-soft text-sm mb-6">Entre com seu e-mail e senha para acessar seus cadernos.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-ink dark:text-white">E-mail</label>
              <input id="email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@escola.com"
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-[#1B1E36] dark:text-white placeholder:text-ink-soft/50 touch-target" required />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Senha</label>
              <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-[#1B1E36] dark:text-white placeholder:text-ink-soft/50 touch-target" required />
            </div>

            {erro && <p role="alert" className="text-sm text-danger bg-danger/10 rounded-xl px-3 py-2">{erro}</p>}

            <button type="submit" disabled={carregando}
              className="mt-2 h-12 rounded-xl bg-primary-light text-primary-dark font-semibold touch-target hover:bg-primary hover:text-white transition-colors disabled:opacity-60">
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="text-sm text-ink-soft text-center mt-6">
            Não tem uma conta? <Link to="/criar-conta" className="text-primary font-semibold">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
