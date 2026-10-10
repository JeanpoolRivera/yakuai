import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, apiList, ApiError, setToken, getToken, friendlyError } from './client'

describe('api client', () => {
  beforeEach(() => {
    setToken('')
    vi.restoreAllMocks()
  })

  it('setToken y getToken funcionan', () => {
    setToken('test-token')
    expect(getToken()).toBe('test-token')
    setToken('')
    expect(getToken()).toBe('')
  })

  it('lanza ApiError en 401 y dispara evento unauthorized', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'No autenticado' } }),
    }))

    await expect(api('auth/me')).rejects.toThrow(ApiError)
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event))
  })

  it('lanza ApiError con status 0 cuando no hay conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(api('health')).rejects.toMatchObject({status: 0, message: expect.stringContaining('conexión con el servidor')})
  })

  it('apiList recorre páginas hasta last_page', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 1 }, { id: 2 }], current_page: 1, last_page: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 3 }], current_page: 2, last_page: 2 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiList<{ id: number }>('items')
    expect(result).toHaveLength(3)
    expect(result.map(r => r.id)).toEqual([1, 2, 3])
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/items?page=2", expect.any(Object))
  })

  it('apiList maneja respuesta no paginada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 1 }, { id: 2 }] }),
    }))

    const result = await apiList<{ id: number }>('items')
    expect(result).toHaveLength(2)
  })

  it('friendlyError mapea 401 correctamente', () => {
    const err = new ApiError('No autenticado', 401)
    expect(friendlyError(err, 'fallback')).toBe('Tu sesión venció. Vuelve a ingresar.')
  })

  it('friendlyError mapea 429 correctamente', () => {
    const err = new ApiError('Too many', 429)
    expect(friendlyError(err, 'fallback')).toBe('Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
  })

  it('friendlyError mapea 422 con data', () => {
    const err = new ApiError('Faltan datos', 422, {}, { detail: 'x' })
    expect(friendlyError(err, 'fallback')).toBe('Faltan datos para decidir. Revisa el detalle.')
  })
})
