// app/admin/gracz/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin
  const supabase = await createSupabaseServerMutable()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!user || !isAdmin) {
    return NextResponse.redirect(new URL('/', origin), { status: 303 })
  }

  const fd = await req.formData()
  const imie = String(fd.get('imie') || '').trim()
  const nazwisko = String(fd.get('nazwisko') || '').trim()
  const back = String(fd.get('back') || '/admin') // gdzie wracamy po akcji

  if (!imie || !nazwisko) {
    return NextResponse.redirect(new URL(`${back}?e=add_invalid`, origin), { status: 303 })
  }

  const { error } = await supabase
    .from('gracz')
    .upsert({ imie, nazwisko }, { onConflict: 'fullname_norm' })

  const url = new URL(back, origin)
  if (error) url.searchParams.set('e', 'add_failed')
  else url.searchParams.set('ok', '1')
  return NextResponse.redirect(url, { status: 303 })
}
