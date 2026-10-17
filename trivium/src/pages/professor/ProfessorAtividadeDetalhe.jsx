import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import BannerHeader from '../../components/BannerHeader'
import { IconArrowLeft } from '../../components/icons'
import { useProfessorAtividadeDetalhe } from '../../hooks/useProfessorAtividadeDetalhe'
import { formatarDataCurta } from '../../lib/utils'

const STATUS_LABEL = { pendente: 'Pendente', entregue: 'Entregue', atrasada: 'Atrasada' }
const STATUS_COR = { pendente: 'text-primary bg-primary-light', entregue: 'text-accent-dark bg-accent-light', atrasada: 'text-danger bg-danger/10' }

export default function ProfessorAtividadeDetalhe() {
  const { atividadeId } = useParams()
  const navigate = useNavigate()
  const { atividade, entregas, carregando, erro, lancarNota } = useProfessorAtividadeDetalhe(atividadeId)
  const [notaEditando, setNotaEditando] = useState({})

  async function handleSalvarNota(entregaId) {
    try {
      await lancarNota(entregaId, notaEditando[entregaId])
      setNotaEditando((prev) => { const { [entregaId]: _r, ...resto } = prev; return resto })
    } catch (err) {
      alert(err.message)
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
  if (erro || !atividade) return <AppLayout><p className="text-danger text-sm">{erro || 'Atividade não encontrada.'}</p></AppLayout>

  return (
    <AppLayout>
      <BannerHeader titulo={atividade.titulo} subtitulo={atividade.data_entrega ? `Prazo: ${formatarDataCurta(atividade.data_entrega)}` : 'Sem prazo definido'} icone={<span className="text-[7rem]">📝</span>}
        acoes={<button onClick={() => navigate(`/professor/turmas/${atividade.turma_id}`)} className="flex items-center gap-1 text-white/90 hover:text-white text-sm font-medium touch-target"><IconArrowLeft width={16} height={16} /> Voltar à turma</button>} />

      <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-white/10 text-left text-ink-soft text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-semibold">Aluno</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Nota</th>
            </tr>
          </thead>
          <tbody>
            {entregas.map((entrega) => (
              <tr key={entrega.id} className="border-b border-border dark:border-white/10 last:border-0">
                <td className="px-4 py-3 text-ink dark:text-white font-medium">{entrega.alunos?.nome}</td>
                <td className="px-4 py-3"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COR[entrega.status]}`}>{STATUS_LABEL[entrega.status]}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={10} step={0.1}
                      value={notaEditando[entrega.id] ?? entrega.nota ?? ''}
                      onChange={(e) => setNotaEditando((prev) => ({ ...prev, [entrega.id]: e.target.value }))}
                      placeholder="—"
                      className="w-16 h-8 px-2 rounded-lg border border-border bg-canvas dark:bg-white/5 dark:text-white text-sm text-center touch-target" />
                    <button onClick={() => handleSalvarNota(entrega.id)} className="text-xs text-primary font-medium touch-target px-2">Salvar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
