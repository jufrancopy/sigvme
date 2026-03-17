'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface Props {
  pasoActual: number
  totalPasos: number
  titulo: string
  subtitulo?: string
  onAnterior?: () => void
  onSiguiente?: () => void
  onFinalizar?: () => void
  cargando?: boolean
  children: React.ReactNode
}

export default function WizardStep({
  pasoActual, totalPasos, titulo, subtitulo,
  onAnterior, onSiguiente, onFinalizar, cargando, children,
}: Props) {
  const progreso = Math.round((pasoActual / totalPasos) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Paso {pasoActual} de {totalPasos}</span>
            <span>{progreso}% completado</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800">{titulo}</h2>
            {subtitulo && <p className="text-sm text-slate-500 mt-1">{subtitulo}</p>}
          </div>

          <div className="space-y-4">
            {children}
          </div>

          {/* Navegación */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={onAnterior}
              disabled={!onAnterior}
              className="text-slate-500"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>

            {onFinalizar ? (
              <Button onClick={onFinalizar} disabled={cargando} className="bg-green-600 hover:bg-green-700">
                {cargando ? 'Guardando...' : <><Check className="h-4 w-4 mr-1" /> Finalizar</>}
              </Button>
            ) : (
              <Button onClick={onSiguiente} disabled={!onSiguiente}>
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Indicadores de pasos */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPasos }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 < pasoActual ? 'w-4 bg-blue-400' :
                i + 1 === pasoActual ? 'w-6 bg-blue-600' :
                'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
