import { useMemo, useState } from 'react'
import AppLayout from '../components/AppLayout'
import BannerHeader from '../components/BannerHeader'
import Modal from '../components/Modal'
import { IconPlus, IconChevronLeft, IconChevronRight, IconTrash } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { useEventos } from '../hooks/useEventos'
import { useAtividades } from '../hooks/useAtividades'
import { useCadernos } from '../hooks/useCadernos'

const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function paraISO(date) {
  return date.toISOString().slice(0, 10)
}

function gerarDiasDoMes(ano, mes) {
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const offset = primeiroDia.getDay()
  const dias = []
  for (let i = 0; i < offset; i++) dias.push(null)
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(ano, mes, d))
  return dias
}

export default function CalendarPage() {
  const { aluno } = useAuth()
  const { cadernos } = useCadernos(aluno?.id)
  const { eventos, criarEvento, alternarConcluido, excluirEvento } = useEventos(aluno?.id)
  const { atividades } = useAtividades(aluno?.id)

  const [mesAtual, setMesAtual] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [diaSelecionado, setDiaSelecionado] = useState(new Date())
  const [modalAberto, setModalAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const dias = useMemo(() => gerarDiasDoMes(mesAtual.getFullYear(), mesAtual.getMonth()), [mesAtual])

  const datasComEvento = useMemo(() => {
    const set = new Set(eventos.map((e) => e.data))
    atividades.forEach((a) => a.data_entrega && set.add(a.data_entrega))
    return set
  }, [eventos, atividades])

  const eventosDoDia = eventos.filter((e) => e.data === paraISO(diaSelecionado))
  const atividadesDoDia = atividades.filter((a) => a.data_entrega === paraISO(diaSelecionado))

  async function handleCriarEvento(e) {
    e.preventDefault()
    if (!titulo.trim()) return
    setSalvando(true)
    try {
      await criarEvento({
        titulo: titulo.trim(),
        descricao,
        data: paraISO(diaSelecionado),
        horaInicio,
        horaFim,
        materiaId: materiaId || null
      })
      setModalAberto(false)
      setTitulo('')
      setDescricao('')
      setHoraInicio('')
      setHoraFim('')
      setMateriaId('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AppLayout>
      <BannerHeader
        titulo="Gestão de Tempo"
        subtitulo="Acompanhe seus prazos e planeje sua semana."
        icone={<span className="text-[7rem]">🗓️</span>}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink dark:text-white">
              {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
                className="touch-target w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-ink-soft"
              >
                <IconChevronLeft width={16} height={16} />
              </button>
              <button
                onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
                className="touch-target w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-ink-soft"
              >
                <IconChevronRight width={16} height={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-soft mb-2">
            {DIAS_SEMANA.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia, i) => {
              if (!dia) return <div key={i} />
              const iso = paraISO(dia)
              const selecionado = iso === paraISO(diaSelecionado)
              const hoje = iso === paraISO(new Date())
              return (
                <button
                  key={iso}
                  onClick={() => setDiaSelecionado(dia)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm touch-target transition-colors ${
                    selecionado
                      ? 'bg-primary-light text-primary font-semibold ring-1 ring-primary/30'
                      : hoje
                      ? 'font-semibold text-ink dark:text-white'
                      : 'text-ink dark:text-white/80 hover:bg-black/[0.03] dark:hover:bg-white/5'
                  }`}
                >
                  {dia.getDate()}
                  {datasComEvento.has(iso) && <span className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink dark:text-white">
              Agenda do Dia ({diaSelecionado.getDate()})
            </h2>
            <button
              onClick={() => setModalAberto(true)}
              aria-label="Novo evento"
              className="touch-target w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <IconPlus width={16} height={16} />
            </button>
          </div>

          {eventosDoDia.length === 0 && atividadesDoDia.length === 0 && (
            <p className="text-sm text-ink-soft">Nada agendado para este dia. Toque no + para criar um evento.</p>
          )}

          <div className="flex flex-col gap-4">
            {eventosDoDia.map((evento) => (
              <div key={evento.id} className="flex items-start gap-2 group">
                <button
                  onClick={() => alternarConcluido(evento)}
                  className={`w-4 h-4 rounded-full border-2 mt-1 shrink-0 ${
                    evento.concluido ? 'bg-accent border-accent' : 'border-primary'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  {(evento.hora_inicio || evento.hora_fim) && (
                    <p className="text-xs font-semibold text-ink-soft">
                      {evento.hora_inicio?.slice(0, 5)}
                      {evento.hora_fim ? ` - ${evento.hora_fim.slice(0, 5)}` : ''}
                    </p>
                  )}
                  <p className={`text-sm font-medium text-ink dark:text-white ${evento.concluido ? 'line-through text-ink-soft' : ''}`}>
                    {evento.materias?.nome ? `${evento.materias.nome} — ` : ''}
                    {evento.titulo}
                  </p>
                  {evento.descricao && <p className="text-xs text-ink-soft">{evento.descricao}</p>}
                </div>
                <button
                  onClick={() => excluirEvento(evento.id)}
                  className="opacity-0 group-hover:opacity-100 text-ink-soft hover:text-danger touch-target w-6 h-6 flex items-center justify-center shrink-0"
                >
                  <IconTrash width={13} height={13} />
                </button>
              </div>
            ))}

            {atividadesDoDia.map((atividade) => (
              <div key={atividade.id} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-streak mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-streak">Prazo de atividade</p>
                  <p className="text-sm font-medium text-ink dark:text-white">{atividade.titulo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal aberto={modalAberto} titulo={`Novo evento — ${diaSelecionado.toLocaleDateString('pt-BR')}`} onFechar={() => setModalAberto(false)}>
        <form onSubmit={handleCriarEvento} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Título</label>
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ler páginas 45 a 52"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Início</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Fim</label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Matéria (opcional)</label>
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
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Descrição (opcional)</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="mt-2 h-12 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-60"
          >
            {salvando ? 'Criando…' : 'Criar evento'}
          </button>
        </form>
      </Modal>
    </AppLayout>
  )
}
