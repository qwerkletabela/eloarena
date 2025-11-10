'use client'
import Link from 'next/link'

export default function Navbar({ user, role }: { user: { id: string; email?: string | null } | null; role: 'admin'|'user'|null }) {
  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="font-semibold">elo-arena</Link>
        <div className="flex items-center gap-3">
          {role === 'admin' && <Link href="/admin">Admin</Link>}
          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button className="rounded border px-3 py-1 text-sm">Wyloguj</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="rounded border px-3 py-1 text-sm">Zaloguj</Link>
              <Link href="/auth/signup" className="rounded bg-black px-3 py-1 text-sm text-white">Załóż konto</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
