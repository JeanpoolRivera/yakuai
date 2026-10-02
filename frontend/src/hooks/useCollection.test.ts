import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCollection } from './useCollection'

interface Item {
  id: number
  name: string
}

const items: Item[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
  { id: 3, name: 'Gamma' },
  { id: 4, name: 'Delta' },
  { id: 5, name: 'Epsilon' },
  { id: 6, name: 'Zeta' },
  { id: 7, name: 'Eta' },
  { id: 8, name: 'Theta' },
  { id: 9, name: 'Iota' },
  { id: 10, name: 'Kappa' },
]

describe('useCollection', () => {
  it('retorna todos los items cuando no hay búsqueda', () => {
    const { result } = renderHook(() => useCollection(items, { perPage: 5 }))
    expect(result.current.total).toBe(10)
    expect(result.current.items).toHaveLength(5)
    expect(result.current.pages).toBe(2)
  })

  it('filtra por búsqueda', () => {
    const { result } = renderHook(() =>
      useCollection(items, {
        perPage: 5,
        search: (item, q) => item.name.toLowerCase().includes(q),
      }),
    )

    act(() => {
      result.current.setQuery('alpha')
    })

    expect(result.current.total).toBe(1)
    expect(result.current.items[0].name).toBe('Alpha')
  })

  it('pagina correctamente', () => {
    const { result } = renderHook(() => useCollection(items, { perPage: 5 }))

    expect(result.current.page).toBe(1)
    expect(result.current.items[0].id).toBe(1)

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.page).toBe(2)
    expect(result.current.items[0].id).toBe(6)
  })

  it('resetea página al buscar', () => {
    const { result } = renderHook(() =>
      useCollection(items, {
        perPage: 5,
        search: (item, q) => item.name.toLowerCase().includes(q),
      }),
    )

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.page).toBe(2)

    act(() => {
      result.current.setQuery('a')
    })

    expect(result.current.page).toBe(1)
  })

  it('ordena correctamente', () => {
    const { result } = renderHook(() =>
      useCollection(items, {
        perPage: 10,
        sort: (a, b) => b.id - a.id,
      }),
    )

    expect(result.current.items[0].id).toBe(10)
    expect(result.current.items[9].id).toBe(1)
  })

  it('filtra con filtro personalizado', () => {
    const { result } = renderHook(() =>
      useCollection(items, {
        perPage: 10,
        filter: (item) => item.id > 5,
      }),
    )

    expect(result.current.total).toBe(5)
    expect(result.current.items.map(i => i.id)).toEqual([6, 7, 8, 9, 10])
  })

  it('maneja lista vacía', () => {
    const { result } = renderHook(() => useCollection([], { perPage: 5 }))
    expect(result.current.total).toBe(0)
    expect(result.current.items).toHaveLength(0)
    expect(result.current.pages).toBe(1)
  })

  it('maneja página fuera de rango', () => {
    const { result } = renderHook(() => useCollection(items, { perPage: 5 }))

    act(() => {
      result.current.setPage(99)
    })

    expect(result.current.page).toBe(2)
  })
})
