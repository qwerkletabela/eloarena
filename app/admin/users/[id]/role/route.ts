// app/admin/users/[id]/role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

// Prosty regex do walidacji UUID v4
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerMutable()
  const origin = req.nextUrl.origin

  // rozpakowanie params
  const { id: targetId } = await ctx.params

  // walidacja UUID
  if (!targetId || !UUID_RE.test(targetId)) {
    return NextResponse.redirect(new URL('/admin/users?e=invalid_id', origin), { status: 303 })
  }

  // kto wykonuje?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
  }

  // tylko admin może zmieniać role
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/', origin), { status: 303 })
  }

  // rola z formularza
  const form = await req.formData()
  const roleRaw = form.get('role')
  const role = typeof roleRaw === 'string' ? roleRaw.trim() : ''

  // ⬇️ TYLKO TE trzy są dozwolone
  const ALLOWED_ROLES = ['user', 'organizer', 'admin'] as const
  if (!ALLOWED_ROLES.includes(role as any)) {
    console.error('invalid role value from form:', roleRaw)
    return NextResponse.redirect(new URL('/admin/users?e=invalid_role', origin), { status: 303 })
  }

  // (opcjonalnie) admin nie może zabrać admina samemu sobie
  if (targetId === user.id && role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/users?e=cannot_downgrade_self', origin), { status: 303 })
  }

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
