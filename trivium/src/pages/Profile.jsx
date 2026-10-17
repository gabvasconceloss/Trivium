import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../context/AuthContext'
import { useCosmeticos } from '../hooks/useCosmeticos'
import { useRanking } from '../hooks/useRanking'
import { useIndicacao } from '../hooks/useIndicacao'
import { calcularNivelLocal } from '../lib/utils'
import { IconLock } from '../components/icons'

const NIVEIS_TITULO = ['', 'Novato', 'Aprendiz', 'Explorador', 'Estudioso', 'Veterano', 'Mestre', 'Lenda']

function tituloPorNivel(nivel) {
  return NIVEIS_TITULO[Math.min(nivel, NIVEIS_TITULO.length - 1)] || 'Lenda'
}

export default function Profile() {
  const { aluno, atualizarPerfil } = useAuth()
  const [aba, setAba] = useState('geral')

  if (!aluno) return null

  const { nivel, xpAtual, xpNecessario } = calcularNivelLocal(aluno.xp)
  const nivelOficial = aluno.nivel ?? nivel
  const pct = Math.min(100, Math.round((xpAtual / xpNecessario) * 100))

  return (
    <AppLayout>
      <div className="rounded-2xl overflow-hidden shadow-card mb-6">
        <div className={`h-36 md:h-44 bg-gradient-to-br ${capaClasse(aluno.capa_ativa)} relative flex items-end`}>
          <span className="absolute top-3 right-4 text-[10px] font-semibold text-white/70 uppercase tracking-wide">
            Capa · {aluno.capa_ativa?.replace('capa_', '').replace('_', ' ')}
          </span>
        </div>
        <div className="bg-surface dark:bg-[#1B1E36] px-5 md:px-7 pb-5 pt-0 -mt-10 flex items-end gap-4 flex-wrap">
          <div className="relative w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-4xl border-4 border-surface dark:border-[#1B1E36] shrink-0">
            {avatarEmoji(aluno.avatar_ativo)}
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-streak text-white text-xs font-bold flex items-center justify-center border-2 border-surface dark:border-[#1B1E36]">{nivelOficial}</span>
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-xs text-primary font-medium">{tituloLabel(aluno.titulo_ativo)}</p>
            <h1 className="text-xl md:text-2xl font-display font-bold text-ink dark:text-white">{aluno.nome}</h1>
          </div>
          <div className="pb-1 text-right shrink-0">
            <p className="text-sm font-semibold text-ink dark:text-white">Lvl {nivelOficial}</p>
            <p className="text-xs text-ink-soft">{xpAtual}/{xpNecessario} XP</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 border-b border-border dark:border-white/10">
        {[{ id: 'geral', label: 'Visão geral' }, { id: 'personalizar', label: '✎ Personalizar' }].map((t) => (
          <button key={t.id} onClick={() => setAba(t.id)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-ink-soft hover:text-ink dark:hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'geral' ? <AbaVisaoGeral aluno={aluno} pct={pct} nivelOficial={nivelOficial} /> : <AbaPersonalizar aluno={aluno} atualizarPerfil={atualizarPerfil} />}
    </AppLayout>
  )
}

function capaClasse(chave) {
  const mapa = {
    capa_padrao: 'from-blue-600 to-teal-500',
    capa_synthwave: 'from-fuchsia-600 to-indigo-600',
    capa_arcade: 'from-amber-500 to-pink-600',
    capa_neotoquio: 'from-cyan-500 to-blue-700',
    capa_galaxia: 'from-indigo-900 to-purple-700'
  }
  return mapa[chave] || mapa.capa_padrao
}
function avatarEmoji(chave) {
  const mapa = { avatar_padrao: '🙂', avatar_anime_1: '🧑‍🎤', avatar_anime_2: '👧', avatar_pixel_1: '🧙', avatar_pixel_2: '🧝', avatar_robo_1: '🤖', avatar_emoji_1: '😎' }
  return mapa[chave] || '🙂'
}
function tituloLabel(chave) {
  const mapa = {
    novato_do_saber: '#NovatoDoSaber', cacador_de_xp: '#CaçadorDeXP', coruja_noturna: '#CorujaNoturna',
    mestre_do_algebra: '#MestreDoÁlgebra', speedrunner_de_prova: '#SpeedrunnerDeProva', lenda_da_turma: '#LendaDaTurma',
    titulo_pontual: '#Pontual', titulo_estudioso: '#Estudioso'
  }
  return mapa[chave] || '#NovatoDoSaber'
}

function AbaVisaoGeral({ aluno, pct, nivelOficial }) {
  const { ranking: rankingSemanal } = useRanking(aluno.id, 'semanal')
  const { resgatar, resgatando } = useIndicacao()
  const [codigo, setCodigo] = useState('')
  const [mensagem, setMensagem] = useState(null)

  async function handleResgatar(e) {
    e.preventDefault()
    setMensagem(null)
    try {
      const r = await resgatar(codigo)
      setMensagem({ tipo: 'sucesso', texto: `+${r.xp_ganho} XP!` })
      setCodigo('')
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  const minhaPosicao = rankingSemanal.findIndex((r) => r.eh_voce) + 1

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="XP total" valor={aluno.xp} icone="⚡" />
          <MiniStat label="Sequência" valor={`${aluno.sequencia_dias} dias`} icone="🔥" />
          <MiniStat label="Nível" valor={nivelOficial} icone="📈" />
          <MiniStat label="Ranking turma" valor={minhaPosicao ? `#${minhaPosicao}` : '—'} icone="🏆" />
        </div>

        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <h3 className="font-display font-semibold text-ink dark:text-white mb-3">Progresso para o próximo nível</h3>
          <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <h3 className="font-display font-semibold text-ink dark:text-white mb-3">Indicar um amigo</h3>
          <p className="text-sm text-ink-soft mb-3">Compartilhe seu código para seus colegas resgatarem XP ao entrar:</p>
          <div className="font-mono text-lg font-bold text-primary bg-primary-light rounded-xl px-4 py-3 text-center mb-4 tracking-widest">{aluno.codigo_indicacao}</div>
          <form onSubmit={handleResgatar} className="flex gap-2">
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Resgatar código de um amigo"
              className="flex-1 h-11 px-3 rounded-xl border border-border bg-canvas dark:bg-white/5 dark:text-white text-sm touch-target" />
            <button type="submit" disabled={resgatando || !codigo.trim()} className="h-11 px-4 rounded-xl bg-primary text-white text-sm font-semibold touch-target disabled:opacity-60">
              {resgatando ? '...' : 'Resgatar'}
            </button>
          </form>
          {mensagem && <p className={`text-xs mt-2 ${mensagem.tipo === 'sucesso' ? 'text-accent-dark' : 'text-danger'}`}>{mensagem.texto}</p>}
        </div>
      </div>

      <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
        <h3 className="font-display font-semibold text-ink dark:text-white mb-3">Top da turma <span className="text-xs text-ink-soft font-normal">XP da semana</span></h3>
        {rankingSemanal.length === 0 && <p className="text-sm text-ink-soft">Sem XP registrado essa semana.</p>}
        <div className="flex flex-col gap-1">
          {rankingSemanal.map((r, i) => (
            <div key={r.aluno_id} className={`flex items-center gap-3 px-2 py-2 rounded-xl text-sm ${r.eh_voce ? 'bg-primary-light' : ''}`}>
              <span className="w-5 text-center font-semibold text-ink-soft">{i + 1}</span>
              <span className="flex-1 font-medium text-ink dark:text-white truncate">{r.eh_voce ? 'Você' : r.nome}</span>
              <span className="text-ink-soft text-xs shrink-0">{r.xp_semana} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, valor, icone }) {
  return (
    <div className="rounded-xl bg-surface dark:bg-[#1B1E36] shadow-card p-3.5 flex flex-col gap-1">
      <span className="text-lg">{icone}</span>
      <p className="text-lg font-display font-bold text-ink dark:text-white">{valor}</p>
      <p className="text-[11px] text-ink-soft uppercase tracking-wide">{label}</p>
    </div>
  )
}

function AbaPersonalizar({ aluno, atualizarPerfil }) {
  const { porTipo, estaDesbloqueado, carregando } = useCosmeticos(aluno.id)
  const [salvandoCampo, setSalvandoCampo] = useState(null)

  async function equipar(campo, cosmetico) {
    if (!estaDesbloqueado(cosmetico)) return
    setSalvandoCampo(cosmetico.id)
    try {
      await atualizarPerfil({ [campo]: cosmetico.chave })
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvandoCampo(null)
    }
  }

  if (carregando) return <div className="h-64 rounded-2xl bg-black/5 animate-pulse" />

  return (
    <div className="flex flex-col gap-6">
      <SecaoCosmeticos titulo="Avatar" tipo="avatar" campo="avatar_ativo" ativo={aluno.avatar_ativo} porTipo={porTipo} estaDesbloqueado={estaDesbloqueado} equipar={equipar} salvandoCampo={salvandoCampo}
        render={(c) => <span className="text-2xl">{c.valor}</span>} />
      <SecaoCosmeticos titulo="Moldura" tipo="moldura" campo="moldura_ativa" ativo={aluno.moldura_ativa} porTipo={porTipo} estaDesbloqueado={estaDesbloqueado} equipar={equipar} salvandoCampo={salvandoCampo}
        render={(c) => <span className={`w-8 h-8 rounded-full bg-primary-light ${c.valor}`} />} />
      <SecaoCosmeticos titulo="Capa do Perfil" tipo="capa" campo="capa_ativa" ativo={aluno.capa_ativa} porTipo={porTipo} estaDesbloqueado={estaDesbloqueado} equipar={equipar} salvandoCampo={salvandoCampo}
        render={(c) => <span className={`w-14 h-8 rounded-lg bg-gradient-to-br ${c.valor.startsWith('from-') ? c.valor : 'from-primary to-accent'}`} />} />
      <SecaoCosmeticos titulo="Título" tipo="titulo" campo="titulo_ativo" ativo={aluno.titulo_ativo} porTipo={porTipo} estaDesbloqueado={estaDesbloqueado} equipar={equipar} salvandoCampo={salvandoCampo}
        render={(c) => <span className="text-xs font-semibold">{c.label}</span>} />
    </div>
  )
}

function SecaoCosmeticos({ titulo, tipo, campo, ativo, porTipo, estaDesbloqueado, equipar, salvandoCampo, render }) {
  const itens = porTipo(tipo)
  return (
    <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
      <h3 className="font-display font-semibold text-ink dark:text-white mb-4">{titulo}</h3>
      <div className="flex flex-wrap gap-3">
        {itens.map((c) => {
          const desbloqueado = estaDesbloqueado(c)
          const selecionado = ativo === c.chave
          return (
            <button key={c.id} onClick={() => equipar(campo, c)} disabled={!desbloqueado || salvandoCampo === c.id}
              className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 min-w-[72px] touch-target transition-colors ${
                selecionado ? 'border-primary bg-primary-light' : desbloqueado ? 'border-border hover:border-primary/40' : 'border-border opacity-50 cursor-not-allowed'
              }`}>
              <div className="w-9 h-9 flex items-center justify-center">{render(c)}</div>
              <span className="text-[10px] text-ink-soft text-center leading-tight">{desbloqueado ? c.label : `Nv. ${c.nivel_minimo}`}</span>
              {!desbloqueado && <IconLock width={11} height={11} className="absolute top-1.5 right-1.5 text-ink-soft" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
