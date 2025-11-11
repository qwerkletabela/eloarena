import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

// Ta lista musi być identyczna jak wartości ENUM w bazie:
const VOIVODESHIPS = [
  'Dolnośląskie','Kujawsko-Pomorskie','Lubelskie','Lubuskie','Łódzkie','Małopolskie',
  'Mazowieckie','Opolskie','Podkarpackie','Podlaskie','Pomorskie','Śląskie',
  'Świętokrzyskie','Warmińsko-Mazurskie','Wielkopolskie','Zachodniopomorskie',
] as const
type Voiv = typeof VOIVODESHIPS[number]

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerMutable()
  const { data: { user } } = await supabase.auth.getUser()
  const origin = req.nextUrl.origin

  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
  }

  const form = await req.formData()
  const username = String(form.get('username') || '').trim() || null
  const first_name = String(form.get('first_name') || '').trim() || null
  const last_name = String(form.get('last_name') || '').trim() || null
  const birthdateRaw = String(form.get('birthdate') || '')
  const city = String(form.get('city') || '').trim() || null

  // Województwo: wymagane i tylko z listy
  const vRaw = String(form.get('voivodeship') || '')
  if (!vRaw) {
    return NextResponse.redirect(new URL('/profile?e=voiv_required', origin), { status: 303 })
  }
  const voivodeship = VOIVODESHIPS.includes(vRaw as Voiv) ? (vRaw as Voiv) : null
  if (!voivodeship) {
    return NextResponse.redirect(new URL('/profile?e=voiv_invalid', origin), { status: 303 })
  }

  const birthdate = birthdateRaw ? birthdateRaw : null // YYYY-MM-DD

  const updates: Record<string, any> = {
    username, first_name, last_name, birthdate, city, voivodeship,
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    // 23505: unique_violation (np. username), 22P02: invalid input (ENUM), 23514: check_violation
    const code = (error as any).code
    const reason =
      code === '23505' ? 'username_taken' :
      code === '22P02' ? 'voiv_invalid' :
      code === '23514' ? 'voiv_invalid' :
      'save_failed'
    return NextResponse.redirect(new URL(`/profile?e=${reason}`, origin), { status: 303 })
  }

  return NextResponse.redirect(new URL('/profile?ok=1', origin), { status: 303 })
}
