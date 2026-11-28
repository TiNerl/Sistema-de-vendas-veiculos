import { api } from '@/services/api'

export interface RegistroAuditoria {
  id: number
  ator: {
    id_usuario: number
    nome: string
  }
  acao: string
  recursoTipo: string
  recursoId: number
  detalhes: Record<string, unknown> | null
  criadaEm: string
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function ehRegistroAuditoria(valor: unknown): valor is RegistroAuditoria {
  return (
    ehObjeto(valor) &&
    typeof valor.id === 'number' &&
    Number.isFinite(valor.id) &&
    ehObjeto(valor.ator) &&
    typeof valor.ator.id_usuario === 'number' &&
    Number.isFinite(valor.ator.id_usuario) &&
    typeof valor.ator.nome === 'string' &&
    typeof valor.acao === 'string' &&
    typeof valor.recursoTipo === 'string' &&
    typeof valor.recursoId === 'number' &&
    Number.isFinite(valor.recursoId) &&
    (valor.detalhes === null || ehObjeto(valor.detalhes)) &&
    typeof valor.criadaEm === 'string' &&
    !Number.isNaN(Date.parse(valor.criadaEm))
  )
}

export async function listarRegistrosAuditoria(): Promise<RegistroAuditoria[]> {
  const resposta = await api.get<unknown>('/auditoria')

  if (!Array.isArray(resposta.data) || !resposta.data.every(ehRegistroAuditoria)) {
    throw new Error('A API retornou os registros de auditoria em formato inesperado.')
  }

  return resposta.data
}
