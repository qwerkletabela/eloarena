// components/PartieClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Calendar,
  Users,
  Trophy,
  Eye,
  Search
} from 'lucide-react'
import DeletePartia from './DeletePartia'

interface Gracz {
  id: string
  imie: string
  nazwisko: string
}

interface PartiaZGraczami {
  id: string
  numer_partii: number
  data_rozgrywki: string
  liczba_graczy: number
  duzy_punkt_gracz_id: string
  turniej_id: string
  turniej: {
    id: string
    nazwa: string
  }
  gracze: Gracz[]
  // Dodaj dynamiczne pola ELO
  [key: string]: any
}

export default function PartieClient({ partie }: { partie: PartiaZGraczami[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPartie = partie.filter(partia =>
    partia.turniej.nazwa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partia.gracze.some(gracz =>
      gracz.imie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gracz.nazwisko.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      {/* Wyszukiwarka */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Szukaj po nazwie turnieju lub graczu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista partii */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            Lista partii ({filteredPartie.length})
          </h2>
        </div>
        
        <div className="divide-y divide-slate-700">
          {filteredPartie.map((partia) => {
            const zwyciezca = partia.gracze.find(g => g.id === partia.duzy_punkt_gracz_id)
            
            // Przygotuj dane graczy dla komponentu DeletePartia
            const graczeDlaUsuwania = partia.gracze.map((gracz, index) => {
              // Znajdź indeks gracza w partii (numer od 1 do liczba_graczy)
              const numerGracza = index + 1
              return {
                id: gracz.id,
                imie: gracz.imie,
                nazwisko: gracz.nazwisko,
                eloPrzed: partia[`elo_przed${numerGracza}`] || 1200,
                zmianaElo: partia[`zmiana_elo${numerGracza}`] || 0
              }
            })
            
            return (
              <div key={partia.id} className="p-6 hover:bg-slate-700/30 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="bg-slate-700 rounded-lg p-2">
                          <Calendar className="h-4 w-4 text-slate-300" />
                        </div>
                        <span className="text-sm text-slate-300">
                          {new Date(partia.data_rozgrywki).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="bg-slate-700 rounded-lg p-2">
                          <Users className="h-4 w-4 text-slate-300" />
                        </div>
                        <span className="text-sm text-slate-300">
                          {partia.liczba_graczy} graczy
                        </span>
                      </div>

                      {zwyciezca && (
                        <div className="flex items-center space-x-2">
                          <div className="bg-yellow-500/20 rounded-lg p-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          </div>
                          <span className="text-sm text-yellow-300">
                            {zwyciezca.imie} {zwyciezca.nazwisko}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">
                      Partia #{partia.numer_partii} - {partia.turniej.nazwa}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {partia.gracze.map((gracz) => (
                        <span
                          key={gracz.id}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            gracz.id === partia.duzy_punkt_gracz_id
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                          }`}
                        >
                          {gracz.imie} {gracz.nazwisko}
                          {gracz.id === partia.duzy_punkt_gracz_id && ' 🏆'}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/admin/turniej/${partia.turniej_id}/partie/${partia.id}`}
                      className="inline-flex items-center gap-1 rounded bg-sky-600 hover:bg-sky-500 px-3 py-2 text-sm font-medium text-white transition"
                    >
                      <Eye className="h-4 w-4" />
                      Szczegóły
                    </Link>
                    
                    <DeletePartia
                      partiaId={partia.id}
                      turniejId={partia.turniej_id}
                      numerPartii={partia.numer_partii}
                      nazwaTurnieju={partia.turniej.nazwa}
                      gracze={graczeDlaUsuwania}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredPartie.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-slate-400 mb-4">
              {searchTerm ? 'Brak partii pasujących do wyszukiwania' : 'Brak partii w systemie'}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sky-400 hover:text-sky-300 underline"
              >
                Wyczyść wyszukiwanie
              </button>
            )}
          </div>
        )}
      </div>

      {partie.length > 0 && (
        <div className="text-sm text-slate-400 text-center">
          Znaleziono {filteredPartie.length} z {partie.length} partii
        </div>
      )}
    </div>
  )
}