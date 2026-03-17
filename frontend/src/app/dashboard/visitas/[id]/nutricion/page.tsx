'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import WizardStep from '@/components/ui/WizardStep'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { evaluacionesService } from '@/services/evaluaciones'
import { visitasService } from '@/services/visitas'

const SERVICIO_RUTA: Record<string, string> = {
  NUTRICION: 'nutricion', ODONTOLOGIA: 'odontologia',
  PSICOLOGIA: 'psicologia', MEDICINA: 'medicina',
}

const OPCIONES_BINARIO = [
  { value: 0, label: 'No' },
  { value: 1, label: 'Sí' },
]

const schema = z.object({
  actividad_fisica: z.number({ error: "Requerido" }),
  consumo_frutas_verduras: z.number({ error: "Requerido" }),
  frecuencia_comidas_diarias: z.number({ error: "Requerido" }).min(1).max(10),
  consumo_agua_litros: z.number({ error: "Requerido" }).min(0).max(10),
  diagnostico_nutricional: z.string().min(1, 'Requerido'),
  plan_alimentacion: z.string().min(1, 'Requerido'),
})

type FormData = z.infer<typeof schema>

const PASOS = [
  { titulo: 'Actividad Física', subtitulo: '¿El paciente realiza actividad física regularmente?', campos: ['actividad_fisica'] },
  { titulo: 'Hábitos Alimentarios', subtitulo: 'Consumo de frutas, verduras, comidas y agua diaria', campos: ['consumo_frutas_verduras', 'frecuencia_comidas_diarias', 'consumo_agua_litros'] },
  { titulo: 'Diagnóstico Nutricional', subtitulo: 'Diagnóstico y plan de alimentación recomendado', campos: ['diagnostico_nutricional', 'plan_alimentacion'] },
]

export default function NutricionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitaId } = use(params)
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const validarPaso = async () => form.trigger(PASOS[paso - 1].campos as (keyof FormData)[])

  const siguiente = async () => { if (await validarPaso()) setPaso(p => p + 1) }
  const anterior = () => setPaso(p => p - 1)

  const finalizar = async () => {
    if (!await validarPaso()) return
    setCargando(true)
    try {
      const { data } = await evaluacionesService.crearNutricion({ ...form.getValues(), visita: visitaId })
      await evaluacionesService.completarNutricion((data as { id: string }).id)
      const { data: derivaciones } = await visitasService.estadoDerivaciones(visitaId)
      const sig = derivaciones.find((d: { estado: string; servicio: string }) => d.estado === 'EN_PROCESO')
      router.push(sig ? `/dashboard/visitas/${visitaId}/${SERVICIO_RUTA[sig.servicio]}` : '/dashboard/visitas')
    } finally { setCargando(false) }
  }

  const BotonesOpcion = ({ field, opciones }: { field: { value: number; onChange: (v: number) => void }, opciones: typeof OPCIONES_BINARIO }) => (
    <div className="grid grid-cols-2 gap-3 mt-1">
      {opciones.map(op => (
        <button key={op.value} type="button" onClick={() => field.onChange(op.value)}
          className={`py-4 rounded-xl border text-sm font-medium transition-all ${
            field.value === op.value
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
          }`}>
          {op.label}
        </button>
      ))}
    </div>
  )

  return (
    <Form {...form}>
      <WizardStep pasoActual={paso} totalPasos={PASOS.length}
        titulo={PASOS[paso - 1].titulo} subtitulo={PASOS[paso - 1].subtitulo}
        onAnterior={paso > 1 ? anterior : undefined}
        onSiguiente={paso < PASOS.length ? siguiente : undefined}
        onFinalizar={paso === PASOS.length ? finalizar : undefined}
        cargando={cargando}>

        {paso === 1 && (
          <FormField control={form.control} name="actividad_fisica" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-600">¿Realiza actividad física regularmente?</FormLabel>
              <BotonesOpcion field={field} opciones={OPCIONES_BINARIO} />
              <FormMessage />
            </FormItem>
          )} />
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <FormField control={form.control} name="consumo_frutas_verduras" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Consume frutas y verduras diariamente?</FormLabel>
                <BotonesOpcion field={field} opciones={OPCIONES_BINARIO} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="frecuencia_comidas_diarias" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Comidas por día</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="ej: 3" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="consumo_agua_litros" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Consumo de agua (litros/día)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" placeholder="ej: 2" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <FormField control={form.control} name="diagnostico_nutricional" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Diagnóstico Nutricional</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} placeholder="Ej: Sobrepeso con déficit de micronutrientes..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="plan_alimentacion" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Plan de Alimentación</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} placeholder="Ej: Dieta hipocalórica, aumentar consumo de verduras..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

      </WizardStep>
    </Form>
  )
}
