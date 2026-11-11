import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/services/api'
import { aprovarVenda, cadastrarVenda, rejeitarVenda } from '@/services/vendas.service'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn<typeof api.get>(),
    patch: vi.fn<typeof api.patch>(),
    post: vi.fn<typeof api.post>(),
  },
}))

describe('vendas.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.patch).mockResolvedValue({ data: { id_venda: 41 } })
    vi.mocked(api.post).mockResolvedValue({ data: { id_venda: 41, status: 'pendente' } })
  })

  it('registers a sale through the existing sales endpoint', async () => {
    const request = {
      id_cliente: 7,
      id_veiculo: 3,
      forma_pagamento: 'pix' as const,
      percentual_desconto: 15,
    }

    await cadastrarVenda(request)

    expect(api.post).toHaveBeenCalledWith('/vendas', request)
  })

  it('approves a pending sale through the administrator endpoint', async () => {
    await aprovarVenda(41)

    expect(api.patch).toHaveBeenCalledWith('/vendas/41/aprovar')
  })

  it('rejects a pending sale through the administrator endpoint', async () => {
    await rejeitarVenda(41)

    expect(api.patch).toHaveBeenCalledWith('/vendas/41/rejeitar')
  })
})
