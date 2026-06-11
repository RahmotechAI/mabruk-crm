'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Egg } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/server/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const password = fd.get('password') as string

    setError('')
    startTransition(async () => {
      const result = await signIn(email, password)
      if (result.error) { setError(result.error); return }
      const role = result.data?.employee.role
      router.push(role === 'admin' ? '/dashboard' : '/portal')
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: '#0c1a2e' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Egg className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Mabruk CRM</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Управление птицефабрикой<br />в одном месте
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
            Учёт продаж, складских операций и аналитика по 15 торговым точкам в режиме реального времени.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Торговых точек', value: '15+' },
              { label: 'Товаров',        value: '11' },
              { label: 'Учёт в реальном времени', value: '24/7' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: '#1a2d45' }}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Mabruk CRM</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Egg className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Mabruk CRM</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Вход в систему</h1>
            <p className="mt-1 text-sm text-slate-500">Введите ваши учётные данные</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
