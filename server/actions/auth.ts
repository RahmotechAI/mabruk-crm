'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult, AuthUser } from '@/types'
import { redirect } from 'next/navigation'

export async function signIn(
  email: string,
  password: string
): Promise<ActionResult<AuthUser>> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { error: `Auth error: ${error.message} (${error.status})` }

  const { data: employee } = await supabase
    .from('employees')
    .select('*, location:locations(*)')
    .eq('id', data.user.id)
    .single()

  if (!employee) return { error: 'Сотрудник не найден' }
  if (!employee.is_active) return { error: 'Аккаунт заблокирован' }

  return {
    data: {
      id: data.user.id,
      email: data.user.email!,
      employee,
    },
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from('employees')
    .select('*, location:locations(*)')
    .eq('id', user.id)
    .single()

  if (!employee) return null

  return {
    id: user.id,
    email: user.email!,
    employee,
  }
}
