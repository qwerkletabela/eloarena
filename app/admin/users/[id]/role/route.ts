import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const supabase = await createSupabaseServerMutable()
  const origin = req.nextUrl.origin
  const targetId = ctx.params.id

  // kto wykonuje?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })

  // tylko admin może zmieniać role
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.redirect(new URL('/', origin), { status: 303 })

  const form = await req.formData()
  const role = String(form.get('role') || '')
  if (role !== 'admin' && role !== 'user') {
    return NextResponse.redirect(new URL('/admin/users?e=invalid_role', origin), { status: 303 })
  }

  // aktualizacja roli docelowego profilu
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetId)

  if (error) {
    console.error('role update error', error)
    return NextResponse.redirect(new URL('/admin/users?e=update_failed', origin), { status: 303 })
  }

  return NextResponse.redirect(new URL('/admin/users?ok=1', origin), { status: 303 })
}
