'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Location } from '@/types'

interface Props {
  locations: Location[]
  value: string
}

export function LocationSelector({ locations, value }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(sp.toString())
    params.set('location_id', e.target.value)
    router.push('?' + params.toString())
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {locations.map(l => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  )
}
