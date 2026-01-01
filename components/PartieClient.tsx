// components/PartieClient.tsx - WERSJA Z TABELKĄ GRACZY
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Users,
  Trophy,
  Eye,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
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
  gracz1_id?: string | null
  gracz2_id?: string | null
  gracz3_id?: string | null
  gracz4_id?: string | null
  [key: string]: any
}

interface Turniej {
  id: string
  nazwa: string
}

interface PartieClientProps {
  partie: PartiaZGraczami[]
  turnieje?: Turniej[]
}

export default function PartieClient({ partie, turnieje = [] }: PartieClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTurniej, setSelectedTurniej] = useState('wszystkie')

  const filteredPartie = partie.filter((partia) => {
    const matchesSearch =
      searchTerm === '' ||
      partia.numer_partii.toString().includes(searchTerm) ||
      partia.gracze.some((g) =>
        `${g.imie} ${g.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      partia.turniej.nazwa.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTurniej =
      selectedTurniej === 'wszystkie' || partia.turniej.id === selectedTurniej

    return matchesSearch && matchesTurniej
  })

  if (!partie || partie.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Brak partii</h3>
        <p className="text-muted-foreground mb-4">Nie dodano jeszcze żadnych partii.</p>
        <Link
          href="/admin/partie/nowa"
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
        >
          Dodaj pierwszą partię
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtry */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Szukaj partii..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {turnieje.length > 0 && (
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={selectedTurniej}
              onChange={(e) => setSelectedTurniej(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="wszystkie">Wszystkie turnieje</option>
              {turnieje.map((turniej) => (
                <option key={turniej.id} value={turniej.id}>
                  {turniej.nazwa}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Liczba wyników */}
      {filteredPartie.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Znaleziono: {filteredPartie.length} partii
        </div>
      )}

      {/* Lista partii */}
      <div className="space-y-4">
        {filteredPartie.map((partia) => {
          const duzyPunktGracz = partia.gracze.find(
            (g) => g.id === partia.duzy_punkt_gracz_id
          )

          // ✅ Ułóż graczy wg slotów: gracz1_id..gracz4_id (A,B,C,D)
          const graczeWgSlotow = [
            partia.gracz1_id,
            partia.gracz2_id,
            partia.gracz3_id,
            partia.gracz4_id,
          ]
            .filter(Boolean)
            .map((id) => partia.gracze.find((g) => g.id === id))
            .filter(Boolean) as Gracz[]

          // Przygotuj dane graczy dla komponentu DeletePartia (również wg slotów)
          const graczeDlaUsuwania = graczeWgSlotow.map((gracz, index) => {
            const numerGracza = index + 1
            return {
              id: gracz.id,
              imie: gracz.imie,
              nazwisko: gracz.nazwisko,
              eloPrzed: partia[`elo_przed${numerGracza}`] ?? 1200,
              zmianaElo: partia[`zmiana_elo${numerGracza}`] ?? 0,
            }
          })

          return (
            <div key={partia.id} className="bg-secondary border border-border rounded-lg overflow-hidden">
              {/* Nagłówek */}
              <div className="p-4 border-b border-border bg-secondary/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-md">
                      #{partia.numer_partii}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{partia.turniej.nazwa}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(partia.data_rozgrywki).toLocaleDateString('pl-PL')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {partia.liczba_graczy} graczy
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/turniej/${partia.turniej_id}/partie/${partia.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm font-medium transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Szczegóły
                    </Link>

                    <DeletePartia
                      partiaId={partia.id}
                      turniejId={partia.turniej_id}
                      numerPartii={partia.numer_partii}
                      nazwaTurnieju={partia.turniej.nazwa}
                      gracze={graczeDlaUsuwania}
                      className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded text-sm font-medium transition-colors"
                      iconOnly
                    />
                  </div>
                </div>
              </div>

              {/* Tabela graczy */}
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="text-left py-2 px-3 font-medium">Gracz</th>
                        <th className="text-left py-2 px-3 font-medium">Imię i nazwisko</th>
                        <th className="text-left py-2 px-3 font-medium">Wynik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {graczeWgSlotow.map((gracz, index) => {
                        const isWinner = gracz.id === partia.duzy_punkt_gracz_id
                        const playerLetter = String.fromCharCode(65 + index) // A, B, C, D

                        return (
                          <tr
                            key={gracz.id}
                            className={`border-b border-border last:border-0 ${
                              isWinner ? 'bg-success/5' : ''
                            }`}
                          >
                            <td className="py-2 px-3">
                              <div
                                className={`font-medium ${
                                  isWinner ? 'text-success' : 'text-foreground'
                                }`}
                              >
                                {playerLetter}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div
                                className={`font-medium ${
                                  isWinner ? 'text-success' : 'text-foreground'
                                }`}
                              >
                                {gracz.imie} {gracz.nazwisko}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              {isWinner ? (
                                <div className="inline-flex items-center gap-1 bg-success/20 text-success px-2 py-1 rounded text-xs font-medium">
                                  <CheckCircle className="h-3 w-3" />
                                  Wygrany
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {duzyPunktGracz && (
                  <div className="mt-4 pt-3 border-t border-border text-sm">
                    <span className="text-muted-foreground">Zwycięzca partii: </span>
                    <span className="font-medium text-success">
                      {duzyPunktGracz.imie} {duzyPunktGracz.nazwisko}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Brak wyników */}
      {filteredPartie.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            {searchTerm || selectedTurniej !== 'wszystkie'
              ? 'Nie znaleziono partii'
              : 'Brak partii do wyświetlenia'}
          </p>
          {(searchTerm || selectedTurniej !== 'wszystkie') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedTurniej('wszystkie')
              }}
              className="text-primary hover:text-primary/80 text-sm"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      )}
    </div>
  )
}
