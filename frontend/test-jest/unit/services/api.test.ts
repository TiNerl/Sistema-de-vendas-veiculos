/**
 * Cliente HTTP (axios): baseURL vinda do ambiente e interceptor que injeta o JWT.
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import type { InternalAxiosRequestConfig } from 'axios'
import { AxiosHeaders } from 'axios'
import { api } from '@/services/api'

type Handler = { fulfilled: (c: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }
const interceptor = () =>
  (api.interceptors.request as unknown as { handlers: Handler[] }).handlers[0]!.fulfilled

describe('api (axios)', () => {
  beforeEach(() => sessionStorage.clear())

  it('usa VITE_API_URL como baseURL e JSON como Content-Type', () => {
    expect(api.defaults.baseURL).toBe('http://api.teste.local')
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('adiciona Authorization: Bearer <token> quando há sessão', () => {
    sessionStorage.setItem('accessToken', 'abc.def.ghi')
    const config = interceptor()({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig)
    expect(config.headers.Authorization).toBe('Bearer abc.def.ghi')
  })

  it('não envia Authorization sem sessão (ex.: tela de login)', () => {
    const config = interceptor()({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig)
    expect(config.headers.Authorization).toBeUndefined()
  })
})
