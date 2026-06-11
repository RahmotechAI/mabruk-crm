'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Power, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { createEmployee, updateEmployee, toggleEmployeeActive } from '@/server/actions/employees'
import type { Employee, Location } from '@/types'

interface Props {
  initialEmployees: Employee[]
  locations: Location[]
}

interface Form {
  name: string
  email: string
  password: string
  role: 'admin' | 'employee'
  location_id: string
}

const emptyForm: Form = { name: '', email: '', password: '', role: 'employee', location_id: '' }

export function EmployeesManager({ initialEmployees, locations }: Props) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [error, setError] = useState('')

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setForm({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      location_id: emp.location_id ?? '',
    })
    setError('')
    setOpen(true)
  }

  function set<K extends keyof Form>(key: K, val: Form[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSave() {
    if (!form.name.trim()) { setError('Введите имя'); return }
    if (!editing && !form.email.trim()) { setError('Введите email'); return }
    if (!editing && !form.password.trim()) { setError('Введите пароль'); return }
    if (form.role === 'employee' && !form.location_id) { setError('Выберите точку для сотрудника'); return }
    setError('')

    startTransition(async () => {
      if (editing) {
        const res = await updateEmployee(editing.id, {
          name: form.name,
          role: form.role,
          location_id: form.location_id || undefined,
        })
        if (res.error) { setError(res.error); return }
        setEmployees(emps => emps.map(e => e.id === editing.id
          ? { ...e, name: form.name, role: form.role, location_id: form.location_id || null }
          : e
        ))
      } else {
        const res = await createEmployee({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          location_id: form.location_id || undefined,
        })
        if (res.error) { setError(res.error); return }
        if (res.data) setEmployees(emps => [...emps, res.data!])
      }
      setOpen(false)
    })
  }

  function toggleActive(emp: Employee) {
    startTransition(async () => {
      await toggleEmployeeActive(emp.id, !emp.is_active)
      setEmployees(emps => emps.map(e =>
        e.id === emp.id ? { ...e, is_active: !e.is_active } : e
      ))
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" />
          Добавить сотрудника
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Точка</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map(emp => (
            <TableRow key={emp.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="font-medium">{emp.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">{emp.email}</TableCell>
              <TableCell>
                <Badge variant={emp.role === 'admin' ? 'default' : 'secondary'}>
                  {emp.role === 'admin' ? 'Администратор' : 'Сотрудник'}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-500">
                {(emp.location as Location | null)?.name ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant={emp.is_active ? 'success' : 'secondary'}>
                  {emp.is_active ? 'Активен' : 'Заблокирован'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(emp)}
                    disabled={isPending}
                  >
                    <Power className={`h-4 w-4 ${emp.is_active ? 'text-red-500' : 'text-emerald-500'}`} />
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
            <DialogTitle>{editing ? 'Редактировать сотрудника' : 'Новый сотрудник'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Имя *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Иван Иванов" />
            </div>
            {!editing && (
              <>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ivan@mail.ru" />
                </div>
                <div className="space-y-1.5">
                  <Label>Пароль *</Label>
                  <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Минимум 6 символов" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Роль *</Label>
              <Select value={form.role} onValueChange={v => set('role', v as Form['role'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'employee' && (
              <div className="space-y-1.5">
                <Label>Торговая точка *</Label>
                <Select value={form.location_id} onValueChange={v => set('location_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите точку" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
