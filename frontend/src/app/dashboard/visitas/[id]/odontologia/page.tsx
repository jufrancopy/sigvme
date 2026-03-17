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
  PSICOLOGIA: 'psicologia', MEDICINA: 'medicina',
}

const OPCIONES_TRIESTADO = [
  { value: 0, label: 'No' },
  { value: 1, label: 'Sí' },
  { value: 2, label: 'No sabe' },
]

const schema = z.object({
  boca_sana: z.number({ error: "Requerido" }),
  boca_rehabilitada: z.number({ error: "Requerido" }),
  enfermedad_periodontal: z.number({ error: "Requerido" }),
  caries_dental_no_tratada: z.number({ error: "Requerido" }),
  numero_piezas_dentales: z.number({ error: "Requerido" }).min(0).max(32),
  observaciones_clinicas: z.string().min(1, 'Requerido'),
  tratamiento_recomendado: z.string().min(1, 'Requerido'),
})

type FormData = z.infer<typeof schema>

const PASOS = [
  { titulo: 'Estado Bucal', subtitulo: 'Evaluación general de la salud bucal', campos: ['boca_sana', 'boca_rehabilitada'] },
  { titulo: 'Patologías', subtitulo: 'Presencia de enfermedades y piezas dentales', campos: ['enfermedad_periodontal', 'caries_dental_no_tratada', 'numero_piezas_dentales'] },
  { titulo: 'Observaciones y Tratamiento', subtitulo: 'Hallazgos clínicos y plan de tratamiento', campos: ['observaciones_clinicas', 'tratamiento_recomendado'] },
]

const BotonesTriestado = ({ field }: { field: { value: number; onChange: (v: number) => void } }) => (
  <div className="grid grid-cols-3 gap-2 mt-1">
    {OPCIONES_TRIESTADO.map(op => (
      <button key={op.value} type="button" onClick={() => field.onChange(op.value)}
        className={`py-3 rounded-xl border text-sm font-medium transition-all ${
          field.value === op.value
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
        }`}>
        {op.label}
      </button>
    ))}
  </div>
)

export default function OdontologiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitaId } = use(params)
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const validarPaso = async () => form.trigger(PASOS[paso - 1].campos as (keyof FormData)[])
  const siguiente = async () => { if (await validarPaso()) setPaso(p => p + 1) }
  const anterior = () => setPaso(p => p - 1)

  const finalizar = async () => {
    if (!await validarPaso()) return
    setCargando(true)
    try {
      const { data } = await evaluacionesService.crearOdontologia({ ...form.getValues(), visita: visitaId })
      await evaluacionesService.completarOdontologia((data as { id: string }).id)
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
            <FormField control={form.control} name="boca_sana" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Boca sana?</FormLabel>
                <BotonesTriestado field={field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="boca_rehabilitada" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Boca rehabilitada?</FormLabel>
                <BotonesTriestado field={field} />
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <FormField control={form.control} name="enfermedad_periodontal" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Enfermedad periodontal?</FormLabel>
                <BotonesTriestado field={field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="caries_dental_no_tratada" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Caries dental no tratada?</FormLabel>
                <BotonesTriestado field={field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="numero_piezas_dentales" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Número de piezas dentales</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="ej: 28" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <FormField control={form.control} name="observaciones_clinicas" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Observaciones Clínicas</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} placeholder="Hallazgos del examen clínico..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tratamiento_recomendado" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Tratamiento Recomendado</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} placeholder="Plan de tratamiento odontológico..."
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
