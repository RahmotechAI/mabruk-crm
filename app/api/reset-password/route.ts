import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// ONE-TIME USE — delete this file after resetting the password
export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.updateUserById(
    '421be808-fcb6-48de-ae49-4cc979ad84ec',
    { password: 'admin123' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, email: data.user.email })
}
