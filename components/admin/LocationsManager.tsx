'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Power, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { createLocation, updateLocation, toggleLocationActive } from '@/server/actions/locations'
import type { Location } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  initialLocations: Location[]
}

export function LocationsManager({ initialLocations }: Props) {
  const [locations, setLocations] = useState(initialLocations)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState({ name: '', address: '' })
  const [error, setError] = useState('')

  function openCreate() {
    setEditing(null)
    setForm({ name: '', address: '' })
    setError('')
    setOpen(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setForm({ name: loc.name, address: loc.address ?? '' })
    setError('')
    setOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) { setError('Название обязательно'); return }
    setError('')

    startTransition(async () => {
      if (editing) {
        const res = await updateLocation(editing.id, form)
        if (res.error) { setError(res.error); return }
        setLocations(locs => locs.map(l =>
          l.id === editing.id ? { ...l, ...form } : l
        ))
      } else {
        const res = await createLocation(form)
        if (res.error) { setError(res.error); return }
        if (res.data) setLocations(locs => [...locs, res.data!])
      }
      setOpen(false)
    })
  }

  function toggleActive(loc: Location) {
    startTransition(async () => {
      await toggleLocationActive(loc.id, !loc.is_active)
      setLocations(locs => locs.map(l =>
        l.id === loc.id ? { ...l, is_active: !l.is_active } : l
      ))
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" />
          Добавить точку
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Адрес</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Создана</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map(loc => (
            <TableRow key={loc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium">{loc.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500">{loc.address ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={loc.is_active ? 'success' : 'secondary'}>
                  {loc.is_active ? 'Активна' : 'Неактивна'}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-500">{formatDate(loc.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(loc)} title="Редактировать">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(loc)}
                    title={loc.is_active ? 'Деактивировать' : 'Активировать'}
                    disabled={isPending}
                  >
                    <Power className={`h-4 w-4 ${loc.is_active ? 'text-red-500' : 'text-emerald-500'}`} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать точку' : 'Новая торговая точка'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Название *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Точка №1 — Базар"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Адрес</Label>
              <Input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="ул. Ленина 10"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
