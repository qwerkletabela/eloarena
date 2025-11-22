// app/admin/turniej/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const origin = req.nextUrl.origin
  const { id } = await ctx.params
  
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.redirect(new URL('/admin/turniej?e=invalid_id', origin), { status: 303 })
  }

  const supabase = await createSupabaseServerMutable()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
  
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.redirect(new URL('/', origin), { status: 303 })

  const { error } = await supabase
    .from('turniej')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete turniej error', error)
    return NextResponse.redirect(new URL('/admin/turniej?e=delete_failed', origin), { status: 303 })
  }

  return NextResponse.redirect(new URL('/admin/turniej?ok=1', origin), { status: 303 })
}