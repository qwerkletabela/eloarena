// app/admin/turniej/[id]/partie/[partiaId]/delete/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partiaId: string }> }
) {
  const supabase = await createSupabaseServer()
  
  // Rozwiązanie Promise params
  const { id, partiaId } = await params

  try {
    // Sprawdź uprawnienia
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // Sprawdź czy partia istnieje i należy do turnieju
    const { data: partia, error: partiaError } = await supabase
      .from('wyniki_partii')
      .select('*')
      .eq('id', partiaId)
      .eq('turniej_id', id)
      .single()

    if (partiaError || !partia) {
      return new Response(JSON.stringify({ error: 'Partia nie znaleziona' }), { status: 404 })
    }

    // Usuń partię
    const { error: deleteError } = await supabase
      .from('wyniki_partii')
      .delete()
      .eq('id', partiaId)

    if (deleteError) {
      return new Response(JSON.stringify({ error: 'Błąd usuwania partii' }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error) {
    console.error('Błąd usuwania partii:', error)
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), { status: 500 })
  }
}