// elo-arena/app/auth/signout/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerMutable();
  await supabase.auth.signOut();
  
  // Użyj URL z requestu i zmień tylko ścieżkę
  const url = new URL(request.url);
  url.pathname = '/'; // Przekieruj na stronę główną
  url.search = ''; // Wyczyść query params jeśli są
  
  return NextResponse.redirect(url);
}
