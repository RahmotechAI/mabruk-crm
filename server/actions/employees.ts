'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ActionResult, CreateEmployeeInput, Employee } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*, location:locations(*)')
    .order('name')

  if (error) return []
  return data
}

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<ActionResult<Employee>> {
  const admin = createAdminClient()

  // Create auth user via service role (bypasses email confirmation)
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    })

  if (authError) return { error: 'Ошибка создания аккаунта: ' + authError.message }

  const { data, error } = await admin
    .from('employees')
    .insert({
      id: authData.user.id,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: input.role,
      location_id: input.location_id || null,
    })
    .select('*, location:locations(*)')
    .single()

  if (error) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Ошибка создания сотрудника: ' + error.message }
  }

  revalidatePath('/employees')
  return { data }
}

export async function updateEmployee(
  id: string,
  input: Partial<Omit<CreateEmployeeInput, 'password'>>
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({
      name: input.name?.trim(),
      role: input.role,
      location_id: input.location_id || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/employees')
  return {}
}

export async function toggleEmployeeActive(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({ is_active })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/employees')
  return {}
}
