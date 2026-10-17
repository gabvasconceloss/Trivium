import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import BannerHeader from '../../components/BannerHeader'
import Modal from '../../components/Modal'
import { IconPlus, IconArrowLeft, IconTrash } from '../../components/icons'
import { useAuth } from '../../context/AuthContext'
import { useProfessorTurmaDetalhe } from '../../hooks/useProfessorTurmaDetalhe'
import { formatarDataCurta } from '../../lib/utils'

export default function ProfessorTurmaDetalhe() {
  const { turmaId } = useParams()
  const navigate = useNavigate()
  const { professor } = useAuth()
  const { turma, alunos, atividades, carregando, erro, criarAtividade, excluirAtividade } = useProfessorTurmaDetalhe(turmaId, professor?.id)

  const [modalAberto, setModalAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [materia, setMateria] = useState('')
  const [dataEntrega, setDataEntrega] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleCriarAtividade(e) {
    e.preventDefault()
    if (!titulo.trim()) return
    setSalvando(true)
    try {
      await criarAtividade({ titulo, descricao, materia, dataEntrega })
      setModalAberto(false); setTitulo(''); setDescricao(''); setMateria(''); setDataEntrega('')
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <AppLayout>
        <div className="h-32 rounded-2xl bg-black/5 animate-pulse mb-6" />
        <div className="h-64 rounded-2xl bg-black/5 animate-pulse" />
      </AppLayout>
    )
  }
  if (erro || !turma) return <AppLayout><p className="text-danger text-sm">{erro || 'Turma não encontrada.'}</p></AppLayout>

  return (
    <AppLayout>
      <BannerHeader titulo={turma.nome} subtitulo={`Código de acesso: ${turma.codigo_acesso} · ${alunos.length} alunos`} icone={<span className="text-[7rem]">🏫</span>}
        acoes={<button onClick={() => navigate('/professor/turmas')} className="flex items-center gap-1 text-white/90 hover:text-white text-sm font-medium touch-target"><IconArrowLeft width={16} height={16} /> Minhas Turmas</button>} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink dark:text-white">Atividades</h2>
            <button onClick={() => setModalAberto(true)} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors touch-target">
              <IconPlus width={15} height={15} /> Nova atividade
            </button>
          </div>

          {atividades.length === 0 && <p className="text-sm text-ink-soft">Nenhuma atividade criada ainda.</p>}

          <div className="flex flex-col gap-3">
            {atividades.map((a) => (
              <div key={a.id} onClick={() => navigate(`/professor/atividades/${a.id}`)}
                className="rounded-xl border border-border dark:border-white/10 p-4 cursor-pointer hover:border-primary/40 transition-colors touch-target">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-semibold text-ink dark:text-white">{a.titulo}</p>
                    {a.materia && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-soft">{a.materia}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Excluir a atividade "${a.titulo}"?`)) excluirAtividade(a.id) }}
                    className="w-8 h-8 rounded-lg text-ink-soft hover:bg-danger/10 hover:text-danger flex items-center justify-center shrink-0"><IconTrash width={15} height={15} /></button>
                </div>
                {a.descricao && <p className="text-sm text-ink-soft mt-1">{a.descricao}</p>}
                <p className="text-xs text-ink-soft mt-1">{a.data_entrega ? `Prazo: ${formatarDataCurta(a.data_entrega)}` : 'Sem prazo'} · Toque para lançar notas</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <h2 className="font-display font-semibold text-ink dark:text-white mb-4">Alunos matriculados</h2>
          {alunos.length === 0 && <p className="text-sm text-ink-soft">Nenhum aluno entrou com este código ainda.</p>}
          <div className="flex flex-col gap-1">
            {alunos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-2 py-2 rounded-xl text-sm">
                <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-xs shrink-0">{a.nome?.[0]?.toUpperCase()}</div>
                <span className="flex-1 font-medium text-ink dark:text-white truncate">{a.nome}</span>
                <span className="text-ink-soft text-xs shrink-0">Lvl {a.nivel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal aberto={modalAberto} titulo="Nova atividade" onFechar={() => setModalAberto(false)}>
        <form onSubmit={handleCriarAtividade} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Título</label>
            <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Prova de Geometria" className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Descrição (opcional)</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Matéria</label><input value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="Ex: Matemática" className="w-full h-12 px-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target" /></div>
            <div><label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Prazo</label><input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} className="w-full h-12 px-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target" /></div>
          </div>
          <p className="text-xs text-ink-soft">Ao criar, todos os {alunos.length} alunos da turma recebem automaticamente essa atividade como pendente.</p>
          <button type="submit" disabled={salvando} className="mt-1 h-12 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-60">{salvando ? 'Criando…' : 'Criar atividade'}</button>
        </form>
      </Modal>
    </AppLayout>
  )
}
