import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerMutable()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  }

  const form = await req.formData()
  const username = String(form.get('username') || '').trim() || null
  const first_name = String(form.get('first_name') || '').trim() || null
  const last_name = String(form.get('last_name') || '').trim() || null
  const birthdateRaw = String(form.get('birthdate') || '')
  const city = String(form.get('city') || '').trim() || null
  const voivodeship = String(form.get('voivodeship') || '').trim() || null

  const birthdate = birthdateRaw ? birthdateRaw : null // YYYY-MM-DD

  const updates: Record<string, any> = {
    username, first_name, last_name, birthdate, city, voivodeship,
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    // 23505 = unique_violation (np. zajęty username)
    const code = (error as any).code
    const reason = code === '23505' ? 'username_taken' : 'save_failed'
    const url = new URL(`/profile?e=${reason}`, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    return NextResponse.redirect(url)
  }

  const url = new URL('/profile?ok=1', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  return NextResponse.redirect(url, { status: 303 })
}
