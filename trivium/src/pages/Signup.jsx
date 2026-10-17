import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconUser, IconChalkboard } from '../components/icons'

export default function Signup() {
  const { criarContaAluno, criarContaProfessor } = useAuth()
  const navigate = useNavigate()

  const [tipoConta, setTipoConta] = useState('aluno') // 'aluno' | 'professor'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigoTurma, setCodigoTurma] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null); setAviso(null); setCarregando(true)
    try {
      if (tipoConta === 'aluno') {
        await criarContaAluno({ nome, email, senha, codigoTurma })
        navigate('/dashboard')
      } else {
        await criarContaProfessor({ nome, email, senha })
        navigate('/professor/turmas')
      }
    } catch (err) {
      if (err.message.includes('confirmação por e-mail')) setAviso(err.message)
      else setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-5 py-10 pt-safe-top pb-safe-bottom bg-canvas dark:bg-[#0F1222]">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center font-display font-bold text-primary text-lg">T</div>
          <p className="font-display font-bold text-xl text-ink dark:text-white">Trivium</p>
        </div>

        <h2 className="text-2xl font-display font-bold text-ink dark:text-white mb-1">Criar conta</h2>
        <p className="text-ink-soft text-sm mb-5">Leva menos de um minuto.</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button type="button" onClick={() => setTipoConta('aluno')}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 touch-target transition-colors ${
              tipoConta === 'aluno' ? 'border-primary bg-primary-light text-primary' : 'border-border text-ink-soft'
            }`}>
            <IconUser width={20} height={20} />
            <span className="text-sm font-medium">Sou aluno</span>
          </button>
          <button type="button" onClick={() => setTipoConta('professor')}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 touch-target transition-colors ${
              tipoConta === 'professor' ? 'border-primary bg-primary-light text-primary' : 'border-border text-ink-soft'
            }`}>
            <IconChalkboard width={20} height={20} />
            <span className="text-sm font-medium">Sou professor(a)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Nome completo</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-[#1B1E36] dark:text-white touch-target" required autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@escola.com"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-[#1B1E36] dark:text-white touch-target" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo de 6 caracteres"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-[#1B1E36] dark:text-white touch-target" required minLength={6} />
          </div>

          {tipoConta === 'aluno' && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Código da turma</label>
              <input value={codigoTurma} onChange={(e) => setCodigoTurma(e.target.value.toUpperCase())} placeholder="Ex: X9B3K8"
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-[#1B1E36] dark:text-white uppercase tracking-wide touch-target" required />
              <p className="text-xs text-ink-soft mt-1.5">Peça o código ao seu professor(a) — sem ele não é possível entrar em uma turma.</p>
            </div>
          )}

          {tipoConta === 'professor' && (
            <p className="text-xs text-ink-soft bg-primary-light text-primary rounded-xl px-3 py-2.5">
              Depois de criar sua conta, você poderá criar turmas e gerar um código de acesso para seus alunos no painel do professor.
            </p>
          )}

          {erro && <p role="alert" className="text-sm text-danger bg-danger/10 rounded-xl px-3 py-2">{erro}</p>}
          {aviso && <p role="status" className="text-sm text-primary bg-primary-light rounded-xl px-3 py-2">{aviso}</p>}

          <button type="submit" disabled={carregando}
            className="mt-2 h-12 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-60">
            {carregando ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="text-sm text-ink-soft text-center mt-6">
          Já tem uma conta? <Link to="/login" className="text-primary font-semibold">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
