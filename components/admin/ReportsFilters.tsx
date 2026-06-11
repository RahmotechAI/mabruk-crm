'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Location } from '@/types'

interface Props {
  locations: Location[]
}

export function ReportsFilters({ locations }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push('?' + params.toString())
  }, [router, sp])

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <select
        value={sp.get('location_id') ?? ''}
        onChange={e => update('location_id', e.target.value)}
        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">Все точки</option>
        {locations.map(l => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">От</label>
        <input
          type="date"
          value={sp.get('from') ?? ''}
          onChange={e => update('from', e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">До</label>
        <input
          type="date"
          value={sp.get('to') ?? ''}
          onChange={e => update('to', e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {(sp.get('location_id') || sp.get('from') || sp.get('to')) && (
        <button
          onClick={() => router.push('/reports')}
          className="h-9 px-3 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
        >
          Сбросить
        </button>
      )}
    </div>
  )
}
