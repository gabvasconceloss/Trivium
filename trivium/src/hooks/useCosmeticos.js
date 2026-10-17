import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/** Catálogo de cosméticos + o que o aluno já desbloqueou (RN19). */
export function useCosmeticos(alunoId) {
  const [catalogo, setCatalogo] = useState([])
  const [desbloqueados, setDesbloqueados] = useState(new Set())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!alunoId) return
    setCarregando(true); setErro(null)
    const [{ data: catalogoData, error: catalogoError }, { data: desbloqueadosData, error: desbloqueadosError }] = await Promise.all([
      supabase.from('cosmeticos').select('*').order('nivel_minimo', { ascending: true }),
      supabase.from('aluno_cosmeticos').select('cosmetico_id').eq('aluno_id', alunoId)
    ])
    if (catalogoError || desbloqueadosError) {
      setErro((catalogoError || desbloqueadosError).message)
      setCarregando(false)
      return
    }
    setCatalogo(catalogoData)
    setDesbloqueados(new Set((desbloqueadosData || []).map((d) => d.cosmetico_id)))
    setCarregando(false)
  }, [alunoId])

  useEffect(() => { recarregar() }, [recarregar])

  const porTipo = (tipo) => catalogo.filter((c) => c.tipo === tipo)
  const estaDesbloqueado = (cosmetico) => desbloqueados.has(cosmetico.id)

  return { catalogo, desbloqueados, porTipo, estaDesbloqueado, carregando, erro, recarregar }
}
