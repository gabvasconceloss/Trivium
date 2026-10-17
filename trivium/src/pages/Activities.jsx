import AppLayout from '../components/AppLayout'
import BannerHeader from '../components/BannerHeader'
import { IconCheck, IconUsers } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { useEntregas } from '../hooks/useEntregas'
import { formatarDataCurta } from '../lib/utils'

function statusVisual(entrega) {
  const prazo = entrega.atividades?.data_entrega
  if (entrega.status === 'entregue') return { label: 'Entregue', cor: 'text-accent-dark bg-accent-light' }
  const atrasada = prazo && new Date(prazo) < new Date(new Date().toDateString())
  if (atrasada) return { label: 'Atrasada', cor: 'text-danger bg-danger/10' }
  return { label: 'Pendente', cor: 'text-primary bg-primary-light' }
}

export default function Activities() {
  const { aluno } = useAuth()
  const { entregas, carregando, erro, marcarEntregue } = useEntregas(aluno?.id)

  return (
    <AppLayout>
      <BannerHeader
        titulo="Atividades"
        subtitulo="Atividades da sua turma, criadas pelo(a) professor(a) — entregue no prazo para ganhar XP."
        icone={<span className="text-[7rem]">✅</span>}
      />

      <div className="flex items-start gap-2 bg-primary-light text-primary text-xs rounded-xl px-3 py-2.5 mb-5">
        <IconUsers width={16} height={16} className="shrink-0 mt-0.5" />
        <p>As notas são lançadas exclusivamente pelo(a) professor(a) da sua turma — isso garante que o ranking e a média reflitam avaliações reais.</p>
      </div>

      {carregando && (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-black/5 animate-pulse" />)}</div>
      )}
      {erro && <p className="text-danger text-sm">{erro}</p>}

      {!carregando && entregas.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-display font-semibold text-lg mb-1 text-ink dark:text-white">Nenhuma atividade ainda</p>
          <p className="text-ink-soft text-sm">Quando seu(sua) professor(a) criar uma atividade para a turma, ela aparece aqui.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {entregas.map((entrega) => {
          const status = statusVisual(entrega)
          const atividade = entrega.atividades
          return (
            <div key={entrega.id} className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-4 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-ink dark:text-white">{atividade?.titulo}</h3>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.cor}`}>{status.label}</span>
                    {atividade?.materia && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-soft">{atividade.materia}</span>}
                  </div>
                  {atividade?.descricao && <p className="text-sm text-ink-soft mt-1">{atividade.descricao}</p>}
                  <p className="text-xs text-ink-soft mt-1">{atividade?.data_entrega ? `Prazo: ${formatarDataCurta(atividade.data_entrega)}` : 'Sem prazo definido'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {entrega.status !== 'entregue' ? (
                  <button onClick={() => marcarEntregue(entrega.id)}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl bg-accent-light text-accent-dark hover:bg-accent hover:text-white transition-colors touch-target">
                    <IconCheck width={14} height={14} /> Marcar como entregue
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ink-soft">Nota:</span>
                    <span className="font-semibold text-ink dark:text-white">{entrega.nota ?? 'Aguardando correção'}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AppLayout>
  )
}
