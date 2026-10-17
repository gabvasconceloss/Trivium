import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconGift } from './icons'
import { useIndicacao } from '../hooks/useIndicacao'
import { useAuth } from '../context/AuthContext'
import { calcularNivelLocal } from '../lib/utils'

export default function TopBarWidgets() {
  const { aluno, recarregarAluno } = useAuth()
  const navigate = useNavigate()
  const { resgatar, resgatando } = useIndicacao()
  const [codigo, setCodigo] = useState('')
  const [mensagem, setMensagem] = useState(null)

  if (!aluno) return null

  const { nivel, xpAtual, xpNecessario } = calcularNivelLocal(aluno.xp)
  const nivelOficial = aluno.nivel ?? nivel // o banco é a fonte da verdade; isso é só fallback otimista

  async function handleResgatar(e) {
    e.preventDefault()
    if (!codigo.trim()) return
    setMensagem(null)
    try {
      const resultado = await resgatar(codigo.trim())
      setMensagem({ tipo: 'sucesso', texto: `Código resgatado! +${resultado.xp_ganho} XP` })
      setCodigo('')
      await recarregarAluno()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <form onSubmit={handleResgatar} className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-surface dark:bg-[#1B1E36] rounded-xl pl-3 pr-1.5 py-1.5 shadow-card">
          <IconGift width={16} height={16} className="text-streak shrink-0" />
          <span className="text-xs text-ink-soft whitespace-nowrap hidden sm:inline">Tem um código de amigo?</span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="X9-B3K8"
            maxLength={10}
            className="w-24 bg-transparent text-sm font-medium text-ink dark:text-white placeholder:text-ink-soft/40 outline-none"
          />
          <button
            type="submit"
            disabled={resgatando || !codigo.trim()}
            className="touch-target px-3 py-1.5 rounded-lg bg-primary-light text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors disabled:opacity-50 shrink-0"
          >
            {resgatando ? '...' : 'Resgatar'}
          </button>
        </div>
        {mensagem && (
          <span className={`text-xs font-medium ${mensagem.tipo === 'sucesso' ? 'text-accent-dark' : 'text-danger'}`}>
            {mensagem.texto}
          </span>
        )}
      </form>

      <button onClick={() => navigate('/perfil')} className="flex items-center gap-2.5 touch-target">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-ink dark:text-white leading-tight">{aluno.nome}</p>
          <p className="text-xs text-primary font-medium leading-tight">
            LVL {nivelOficial} · {aluno.xp} XP
          </p>
        </div>
        <div className="relative w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shrink-0 ring-2 ring-border dark:ring-white/10">
          {aluno.nome?.[0]?.toUpperCase()}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-streak text-white text-[9px] font-bold flex items-center justify-center">
            {nivelOficial}
          </span>
        </div>
      </button>
    </div>
  )
}
