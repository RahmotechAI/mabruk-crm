'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult, CreateLocationInput, Location } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getLocations(): Promise<Location[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name')

  if (error) return []
  return data
}

export async function createLocation(
  input: CreateLocationInput
): Promise<ActionResult<Location>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .insert({ name: input.name.trim(), address: input.address?.trim() || null })
    .select()
    .single()

  if (error) return { error: 'Не удалось создать точку: ' + error.message }

  revalidatePath('/locations')
  revalidatePath('/dashboard')
  return { data }
}

export async function updateLocation(
  id: string,
  input: Partial<CreateLocationInput>
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .update({ name: input.name?.trim(), address: input.address?.trim() || null })
    .eq('id', id)

  if (error) return { error: 'Не удалось обновить точку: ' + error.message }

  revalidatePath('/locations')
  return {}
}

export async function toggleLocationActive(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .update({ is_active })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/locations')
  return {}
}
