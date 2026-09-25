import { useRef, useState } from 'react'
import InsertMenu from './MenuInsercao'
import { IconPlus, IconTrash } from './icones'
import { gerarId } from '../lib/utilidades'
import { supabase } from '../lib/clienteSupabase'

function blocoVazio(tipo) {
  switch (tipo) {
    case 'lista':
      return { id: gerarId(), tipo, conteudo: [''] }
    case 'checklist':
      return { id: gerarId(), tipo, conteudo: [{ texto: '', concluido: false }] }
    case 'imagem':
      return { id: gerarId(), tipo, conteudo: { url: '', legenda: '' } }
    case 'cartao':
      return { id: gerarId(), tipo, conteudo: { titulo: '', texto: '' } }
    default:
      return { id: gerarId(), tipo, conteudo: '' }
  }
}

function BlocoTexto({ bloco, atualizar, placeholder }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => atualizar(e.currentTarget.textContent)}
      className="block-text text-sm leading-relaxed text-ink dark:text-white/90 py-1"
    >
      {bloco.conteudo}
    </div>
  )
}

function BlocoSubtitulo({ bloco, atualizar }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Subtítulo"
      onBlur={(e) => atualizar(e.currentTarget.textContent)}
      className="block-text font-display font-semibold text-base text-ink dark:text-white py-1"
    >
      {bloco.conteudo}
    </div>
  )
}

function BlocoLista({ bloco, atualizar }) {
  const itens = bloco.conteudo
  function mudarItem(i, valor) {
    const novos = [...itens]
    novos[i] = valor
    atualizar(novos)
  }
  return (
    <ul className="list-disc pl-5 space-y-1">
      {itens.map((item, i) => (
        <li key={i} className="text-sm text-ink dark:text-white/90 flex items-start gap-1 group/item">
          <span
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Item da lista"
            onBlur={(e) => mudarItem(i, e.currentTarget.textContent)}
            className="block-text flex-1"
          >
            {item}
          </span>
          <button
            onClick={() => atualizar(itens.filter((_, idx) => idx !== i))}
            className="opacity-0 group-hover/item:opacity-100 text-ink-soft hover:text-danger text-xs px-1"
          >
            ×
          </button>
        </li>
      ))}
      <button onClick={() => atualizar([...itens, ''])} className="text-xs text-primary font-medium mt-1 touch-target">
        + item
      </button>
    </ul>
  )
}

function BlocoChecklist({ bloco, atualizar }) {
  const itens = bloco.conteudo
  function mudarItem(i, campo, valor) {
    const novos = itens.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it))
    atualizar(novos)
  }
  return (
    <div className="space-y-1.5">
      {itens.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group/item">
          <button
            onClick={() => mudarItem(i, 'concluido', !item.concluido)}
            className={`touch-target w-5 h-5 rounded-md border-2 flex items-center justify-center text-[10px] shrink-0 ${
              item.concluido ? 'bg-accent border-accent text-white' : 'border-ink-soft/30 text-transparent'
            }`}
          >
            ✓
          </button>
          <span
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Item da checklist"
            onBlur={(e) => mudarItem(i, 'texto', e.currentTarget.textContent)}
            className={`block-text flex-1 text-sm ${item.concluido ? 'line-through text-ink-soft' : 'text-ink dark:text-white/90'}`}
          >
            {item.texto}
          </span>
          <button
            onClick={() => atualizar(itens.filter((_, idx) => idx !== i))}
            className="opacity-0 group-hover/item:opacity-100 text-ink-soft hover:text-danger text-xs px-1"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => atualizar([...itens, { texto: '', concluido: false }])}
        className="text-xs text-primary font-medium touch-target"
      >
        + item
      </button>
    </div>
  )
}

function BlocoImagem({ bloco, atualizar }) {
  const inputRef = useRef(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  async function handleUpload(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setEnviando(true)
    setErro(null)
    try {
      const caminho = `${gerarId()}-${arquivo.name}`
      const { error } = await supabase.storage.from('notas-imagens').upload(caminho, arquivo)
      if (error) throw error
      const { data } = supabase.storage.from('notas-imagens').getPublicUrl(caminho)
      atualizar({ ...bloco.conteudo, url: data.publicUrl })
    } catch (err) {
      setErro('Não foi possível enviar a imagem. Verifique o bucket "notas-imagens" no Supabase Storage.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border dark:border-white/15 p-3">
      {bloco.conteudo.url ? (
        <img src={bloco.conteudo.url} alt={bloco.conteudo.legenda || ''} className="max-h-64 rounded-lg mx-auto" />
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-ink-soft text-sm">
          <p>Nenhuma imagem ainda</p>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="touch-target px-3 py-1.5 rounded-lg bg-primary-light text-primary text-xs font-medium disabled:opacity-60"
          >
            {enviando ? 'Enviando…' : 'Enviar imagem'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      )}
      {erro && <p className="text-xs text-danger mt-2">{erro}</p>}
      {bloco.conteudo.url && (
        <input
          value={bloco.conteudo.legenda}
          onChange={(e) => atualizar({ ...bloco.conteudo, legenda: e.target.value })}
          placeholder="Legenda (opcional)"
          className="mt-2 w-full text-xs text-center text-ink-soft bg-transparent outline-none"
        />
      )}
    </div>
  )
}

function BlocoCartao({ bloco, atualizar }) {
  return (
    <div className="rounded-xl bg-primary-light dark:bg-primary/10 border border-primary/20 p-4">
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Título do cartão"
        onBlur={(e) => atualizar({ ...bloco.conteudo, titulo: e.currentTarget.textContent })}
        className="block-text font-display font-semibold text-sm text-primary mb-1"
      >
        {bloco.conteudo.titulo}
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Escreva uma observação importante…"
        onBlur={(e) => atualizar({ ...bloco.conteudo, texto: e.currentTarget.textContent })}
        className="block-text text-sm text-ink dark:text-white/90"
      >
        {bloco.conteudo.texto}
      </div>
    </div>
  )
}

export default function BlockEditor({ blocos, onChange }) {
  const [menuAberto, setMenuAberto] = useState(null)

  function atualizarBloco(id, conteudo) {
    onChange(blocos.map((b) => (b.id === id ? { ...b, conteudo } : b)))
  }

  function removerBloco(id) {
    if (blocos.length === 1) return
    onChange(blocos.filter((b) => b.id !== id))
  }

  function inserirApos(indice, tipo) {
    const novos = [...blocos]
    novos.splice(indice + 1, 0, blocoVazio(tipo))
    onChange(novos)
    setMenuAberto(null)
  }

  function renderBloco(bloco) {
    const atualizar = (conteudo) => atualizarBloco(bloco.id, conteudo)
    switch (bloco.tipo) {
      case 'subtitulo':
        return <BlocoSubtitulo bloco={bloco} atualizar={atualizar} />
      case 'lista':
        return <BlocoLista bloco={bloco} atualizar={atualizar} />
      case 'checklist':
        return <BlocoChecklist bloco={bloco} atualizar={atualizar} />
      case 'imagem':
        return <BlocoImagem bloco={bloco} atualizar={atualizar} />
      case 'cartao':
        return <BlocoCartao bloco={bloco} atualizar={atualizar} />
      default:
        return <BlocoTexto bloco={bloco} atualizar={atualizar} placeholder="Escreva algo…" />
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {blocos.map((bloco, indice) => (
        <div key={bloco.id} className="group relative flex items-start gap-2">
          <div className="relative shrink-0 pt-1">
            <button
              onClick={() => setMenuAberto(menuAberto === indice ? null : indice)}
              aria-label="Inserir bloco"
              className="w-6 h-6 rounded-md border border-border dark:border-white/15 flex items-center justify-center
              text-ink-soft opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-primary-light hover:text-primary transition-opacity touch-target"
            >
              <IconPlus width={13} height={13} />
            </button>
            {menuAberto === indice && (
              <InsertMenu onEscolher={(tipo) => inserirApos(indice, tipo)} onFechar={() => setMenuAberto(null)} />
            )}
          </div>

          <div className="flex-1 min-w-0">{renderBloco(bloco)}</div>

          {blocos.length > 1 && (
            <button
              onClick={() => removerBloco(bloco.id)}
              aria-label="Remover bloco"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-ink-soft
              hover:text-danger w-6 h-6 flex items-center justify-center shrink-0 mt-1"
            >
              <IconTrash width={14} height={14} />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => onChange([...blocos, blocoVazio('texto')])}
        className="mt-2 self-start flex items-center gap-1.5 text-sm text-ink-soft hover:text-primary touch-target px-2 py-1.5 rounded-lg hover:bg-primary-light"
      >
        <IconPlus width={15} height={15} /> Adicionar bloco
      </button>
    </div>
  )
}
