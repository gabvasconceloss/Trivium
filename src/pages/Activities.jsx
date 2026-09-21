import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import BannerHeader from '../components/BannerHeader'
import Modal from '../components/Modal'
import { IconPlus, IconTrash, IconCheck } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { useAtividades } from '../hooks/useAtividades'
import { useCadernos } from '../hooks/useCadernos'
import { formatarDataCurta } from '../lib/utils'

function statusVisual(atividade) {
  if (atividade.status === 'entregue') return { label: 'Entregue', cor: 'text-accent-dark bg-accent-light' }
  const atrasada = atividade.data_entrega && new Date(atividade.data_entrega) < new Date(new Date().toDateString())
  if (atrasada) return { label: 'Atrasada', cor: 'text-danger bg-danger/10' }
  return { label: 'Pendente', cor: 'text-primary bg-primary-light' }
}

export default function Activities() {
  const { aluno } = useAuth()
  const { cadernos } = useCadernos(aluno?.id)
  const { atividades, carregando, erro, criarAtividade, marcarEntregue, definirNota, excluirAtividade } =
    useAtividades(aluno?.id)

  const [modalAberto, setModalAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataEntrega, setDataEntrega] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [notaEditando, setNotaEditando] = useState({}) // { [atividadeId]: valorDigitado }

  async function handleCriar(e) {
    e.preventDefault()
    if (!titulo.trim()) return
    setSalvando(true)
    try {
      await criarAtividade({ titulo: titulo.trim(), descricao, dataEntrega, materiaId: materiaId || null })
      setModalAberto(false)
      setTitulo('')
      setDescricao('')
      setDataEntrega('')
      setMateriaId('')
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarNota(atividadeId) {
    const valor = notaEditando[atividadeId]
    try {
      await definirNota(atividadeId, valor)
      setNotaEditando((prev) => {
        const { [atividadeId]: _remover, ...resto } = prev
        return resto
      })
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <AppLayout>
      <BannerHeader
        titulo="Atividades"
        subtitulo="Suas tarefas e prazos, tudo em um só lugar."
        icone={<span className="text-[7rem]">✅</span>}
        acoes={
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-semibold px-3.5 py-2 rounded-xl touch-target"
          >
            <IconPlus width={16} height={16} /> Nova Atividade
          </button>
        }
      />

      {carregando && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-black/5 animate-pulse" />
          ))}
        </div>
      )}
      {erro && <p className="text-danger text-sm">{erro}</p>}

      {!carregando && atividades.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-display font-semibold text-lg mb-1 text-ink dark:text-white">Nenhuma atividade ainda</p>
          <p className="text-ink-soft text-sm">Toque em "Nova Atividade" para começar a organizar seus prazos.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {atividades.map((atividade) => {
          const status = statusVisual(atividade)
          return (
            <div key={atividade.id} className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-4 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-ink dark:text-white">{atividade.titulo}</h3>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.cor}`}>{status.label}</span>
                    {atividade.materias && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${atividade.materias.cor_tema}22`, color: atividade.materias.cor_tema }}>
                        {atividade.materias.nome}
                      </span>
                    )}
                  </div>
                  {atividade.descricao && <p className="text-sm text-ink-soft mt-1">{atividade.descricao}</p>}
                  <p className="text-xs text-ink-soft mt-1">
                    {atividade.data_entrega ? `Prazo: ${formatarDataCurta(atividade.data_entrega)}` : 'Sem prazo definido'}
                  </p>
                </div>

                <button
                  onClick={() => excluirAtividade(atividade.id)}
                  aria-label="Excluir atividade"
                  className="touch-target w-8 h-8 rounded-lg text-ink-soft hover:bg-danger/10 hover:text-danger shrink-0"
                >
                  <IconTrash width={15} height={15} />
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {atividade.status !== 'entregue' && (
                  <button
                    onClick={() => marcarEntregue(atividade.id)}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl bg-accent-light text-accent-dark hover:bg-accent hover:text-white transition-colors touch-target"
                  >
                    <IconCheck width={14} height={14} /> Marcar como entregue
                  </button>
                )}

                {atividade.status === 'entregue' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-ink-soft">Nota:</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={notaEditando[atividade.id] ?? atividade.nota ?? ''}
                      onChange={(e) => setNotaEditando((prev) => ({ ...prev, [atividade.id]: e.target.value }))}
                      placeholder="—"
                      className="w-16 h-8 px-2 rounded-lg border border-border bg-canvas dark:bg-white/5 dark:text-white text-sm text-center touch-target"
                    />
                    <button
                      onClick={() => handleSalvarNota(atividade.id)}
                      className="text-xs text-primary font-medium touch-target px-2"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal aberto={modalAberto} titulo="Nova atividade" onFechar={() => setModalAberto(false)}>
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Título</label>
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Entregar resumo de Geografia"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Descrição (opcional)</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Prazo</label>
              <input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Matéria</label>
              <select
                value={materiaId}
                onChange={(e) => setMateriaId(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target"
              >
                <option value="">Nenhuma</option>
                {cadernos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="mt-2 h-12 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-60"
          >
            {salvando ? 'Criando…' : 'Criar atividade'}
          </button>
        </form>
      </Modal>
    </AppLayout>
  )
}
