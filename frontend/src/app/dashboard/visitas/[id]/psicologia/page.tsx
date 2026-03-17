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

const SERVICIO_RUTA: Record<string, string> = { MEDICINA: 'medicina' }

const schema = z.object({
  eva_psi: z.number({ error: "Requerido" }).min(0).max(10),
  observaciones_estres: z.string().min(1, 'Requerido'),
  audit_frecuencia_anual: z.number({ error: "Requerido" }).min(0).max(4),
  audit_bebidas_dia: z.number({ error: "Requerido" }).min(0).max(4),
  audit_episodios_excesivos: z.number({ error: "Requerido" }).min(0).max(4),
  diagnostico_psicologico: z.string().min(1, 'Requerido'),
  recomendaciones: z.string().min(1, 'Requerido'),
})

type FormData = z.infer<typeof schema>

const PASOS = [
  { titulo: 'Nivel de Estrés', subtitulo: 'Escala visual analógica de estrés percibido (0-10)', campos: ['eva_psi', 'observaciones_estres'] },
  { titulo: 'Consumo de Alcohol (AUDIT-C)', subtitulo: 'Evaluación del consumo de alcohol', campos: ['audit_frecuencia_anual', 'audit_bebidas_dia', 'audit_episodios_excesivos'] },
  { titulo: 'Diagnóstico y Recomendaciones', subtitulo: 'Diagnóstico psicológico y plan de acción', campos: ['diagnostico_psicologico', 'recomendaciones'] },
]

const AUDIT_FRECUENCIA = [
  { value: 0, label: 'Nunca' }, { value: 1, label: 'Mensual o menos' },
  { value: 2, label: '2-4 veces/mes' }, { value: 3, label: '2-3 veces/semana' },
  { value: 4, label: '4+ veces/semana' },
]
const AUDIT_BEBIDAS = [
  { value: 0, label: '1-2' }, { value: 1, label: '3-4' },
  { value: 2, label: '5-6' }, { value: 3, label: '7-9' }, { value: 4, label: '10+' },
]
const AUDIT_EPISODIOS = [
  { value: 0, label: 'Nunca' }, { value: 1, label: 'Menos de 1 vez/mes' },
  { value: 2, label: 'Mensualmente' }, { value: 3, label: 'Semanalmente' }, { value: 4, label: 'A diario' },
]

function BotonesOpciones({ field, opciones }: { field: { value: number; onChange: (v: number) => void }, opciones: { value: number; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2 mt-1">
      {opciones.map(op => (
        <button key={op.value} type="button" onClick={() => field.onChange(op.value)}
          className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all ${
            field.value === op.value
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
          }`}>
          {op.label}
        </button>
      ))}
    </div>
  )
}

export default function PsicologiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitaId } = use(params)
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const f1 = form.watch('audit_frecuencia_anual') ?? 0
  const f2 = form.watch('audit_bebidas_dia') ?? 0
  const f3 = form.watch('audit_episodios_excesivos') ?? 0
  const auditTotal = f1 + f2 + f3
  const auditClasificacion = auditTotal <= 3 ? 'Consumo de bajo riesgo' : auditTotal <= 7 ? 'Consumo de riesgo' : 'Consumo perjudicial'

  const validarPaso = async () => form.trigger(PASOS[paso - 1].campos as (keyof FormData)[])
  const siguiente = async () => { if (await validarPaso()) setPaso(p => p + 1) }
  const anterior = () => setPaso(p => p - 1)

  const finalizar = async () => {
    if (!await validarPaso()) return
    setCargando(true)
    try {
      const { data } = await evaluacionesService.crearPsicologia({ ...form.getValues(), visita: visitaId })
      await evaluacionesService.completarPsicologia((data as { id: string }).id)
      const { data: derivaciones } = await visitasService.estadoDerivaciones(visitaId)
      const sig = derivaciones.find((d: { estado: string; servicio: string }) => d.estado === 'EN_PROCESO')
      router.push(sig ? `/dashboard/visitas/${visitaId}/${SERVICIO_RUTA[sig.servicio]}` : '/dashboard/visitas')
    } finally { setCargando(false) }
  }

  return (
    <Form {...form}>
      <WizardStep pasoActual={paso} totalPasos={PASOS.length}
        titulo={PASOS[paso - 1].titulo} subtitulo={PASOS[paso - 1].subtitulo}
        onAnterior={paso > 1 ? anterior : undefined}
        onSiguiente={paso < PASOS.length ? siguiente : undefined}
        onFinalizar={paso === PASOS.length ? finalizar : undefined}
        cargando={cargando}>

        {paso === 1 && (
          <div className="space-y-4">
            <FormField control={form.control} name="eva_psi" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Nivel de estrés percibido (0 = ninguno, 10 = máximo)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={10} placeholder="ej: 5" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="observaciones_estres" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Observaciones sobre el estrés</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} placeholder="Descripción del estado emocional..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <FormField control={form.control} name="audit_frecuencia_anual" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Con qué frecuencia consume alcohol?</FormLabel>
                <BotonesOpciones field={field} opciones={AUDIT_FRECUENCIA} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="audit_bebidas_dia" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Cuántas bebidas toma en un día típico?</FormLabel>
                <BotonesOpciones field={field} opciones={AUDIT_BEBIDAS} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="audit_episodios_excesivos" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Con qué frecuencia toma 6 o más bebidas?</FormLabel>
                <BotonesOpciones field={field} opciones={AUDIT_EPISODIOS} />
                <FormMessage />
              </FormItem>
            )} />
            {(f1 !== undefined && f2 !== undefined && f3 !== undefined) && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500">Puntaje AUDIT-C</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{auditTotal}</p>
                <p className={`text-sm font-medium mt-1 ${auditTotal <= 3 ? 'text-green-500' : auditTotal <= 7 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {auditClasificacion}
                </p>
              </div>
            )}
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <FormField control={form.control} name="diagnostico_psicologico" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Diagnóstico Psicológico</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} placeholder="Diagnóstico basado en la evaluación..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="recomendaciones" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Recomendaciones</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} placeholder="Plan de intervención y seguimiento..."
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
