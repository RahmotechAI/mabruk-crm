'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult, Product, ProductPrice, UpdatePriceInput } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error || !products) return []

  // Attach current prices
  const { data: prices } = await supabase
    .from('product_prices')
    .select('*')
    .is('valid_to', null)

  return products.map(p => ({
    ...p,
    current_price: prices?.find(pp => pp.product_id === p.id)?.price_per_unit ?? 0,
  }))
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')

  if (error || !products) return []

  const { data: prices } = await supabase
    .from('product_prices')
    .select('*')
    .is('valid_to', null)

  return products.map(p => ({
    ...p,
    current_price: prices?.find(pp => pp.product_id === p.id)?.price_per_unit ?? 0,
  }))
}

export async function getPriceHistory(productId: string): Promise<ProductPrice[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_prices')
    .select('*')
    .eq('product_id', productId)
    .order('valid_from', { ascending: false })

  return data ?? []
}

export async function updatePrice(
  input: UpdatePriceInput
): Promise<ActionResult> {
  const supabase = await createClient()

  // Close the current price
  const { error: closeErr } = await supabase
    .from('product_prices')
    .update({ valid_to: new Date().toISOString() })
    .eq('product_id', input.product_id)
    .is('valid_to', null)

  if (closeErr) return { error: closeErr.message }

  // Insert new price
  const { error: insertErr } = await supabase
    .from('product_prices')
    .insert({
      product_id: input.product_id,
      price_per_unit: input.price_per_unit,
    })

  if (insertErr) return { error: insertErr.message }

  revalidatePath('/products')
  return {}
}

export async function toggleProductActive(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/products')
  return {}
}
