'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import WizardStep from '@/components/ui/WizardStep'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { evaluacionesService } from '@/services/evaluaciones'
import { visitasService } from '@/services/visitas'
import { Activity, Weight, Heart, ClipboardList, Pill } from 'lucide-react'

const SERVICIO_RUTA: Record<string, string> = {
  ENFERMERIA: 'enfermeria',
  NUTRICION: 'nutricion',
  ODONTOLOGIA: 'odontologia',
  PSICOLOGIA: 'psicologia',
  MEDICINA: 'medicina',
}

const OPCIONES_TRIESTADO = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Sí' },
  { value: '2', label: 'No sabe / No contesta' },
]

const schema = z.object({
  presion_arterial_sistolica: z.number({ error: "Requerido" }).min(60).max(300),
  presion_arterial_diastolica: z.number({ error: "Requerido" }).min(40).max(200),
  peso_kg: z.number({ error: "Requerido" }).min(20).max(300),
  talla_cm: z.number({ error: "Requerido" }).min(100).max(250),
  frecuencia_cardiaca: z.number({ error: "Requerido" }).min(30).max(250),
  perimetro_cintura_cm: z.number({ error: "Requerido" }).min(40).max(200),
  antecedente_ecv: z.number({ error: "Requerido" }),
  enfermedad_renal_cronica: z.number({ error: "Requerido" }),
  diagnostico_hta: z.number({ error: "Requerido" }),
  diagnostico_dbt: z.number({ error: "Requerido" }),
  medicacion_regular: z.number({ error: "Requerido" }),
  observaciones_derivacion: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const PASOS = [
  { titulo: 'Presión Arterial', subtitulo: 'Registrá los valores de presión arterial del paciente', icono: Activity, campos: ['presion_arterial_sistolica', 'presion_arterial_diastolica'] },
  { titulo: 'Medidas Corporales', subtitulo: 'Peso y talla para calcular el IMC', icono: Weight, campos: ['peso_kg', 'talla_cm'] },
  { titulo: 'Signos Vitales', subtitulo: 'Frecuencia cardíaca y perímetro de cintura', icono: Heart, campos: ['frecuencia_cardiaca', 'perimetro_cintura_cm'] },
  { titulo: 'Antecedentes Clínicos', subtitulo: '¿El paciente tiene antecedentes de estas condiciones?', icono: ClipboardList, campos: ['antecedente_ecv', 'enfermedad_renal_cronica'] },
  { titulo: 'Diagnósticos Actuales', subtitulo: '¿El paciente tiene diagnóstico de estas enfermedades?', icono: ClipboardList, campos: ['diagnostico_hta', 'diagnostico_dbt'] },
  { titulo: 'Medicación', subtitulo: 'Medicación regular y observaciones finales', icono: Pill, campos: ['medicacion_regular', 'observaciones_derivacion'] },
]

function calcularIMC(peso: number, talla: number) {
  if (!peso || !talla) return null
  const imc = peso / Math.pow(talla / 100, 2)
  return imc.toFixed(1)
}

function clasificarIMC(imc: number) {
  if (imc < 18.5) return { label: 'Bajo peso', color: 'text-blue-500' }
  if (imc < 25) return { label: 'Normal', color: 'text-green-500' }
  if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' }
  return { label: 'Obesidad', color: 'text-red-500' }
}

export default function EnfermeriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitaId } = use(params)
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const peso = form.watch('peso_kg')
  const talla = form.watch('talla_cm')
  const imc = peso && talla ? calcularIMC(peso, talla) : null
  const clasificacion = imc ? clasificarIMC(parseFloat(imc)) : null

  const camposDelPaso = PASOS[paso - 1].campos
  const esTriestado = (campo: string) =>
    ['antecedente_ecv', 'enfermedad_renal_cronica', 'diagnostico_hta', 'diagnostico_dbt', 'medicacion_regular'].includes(campo)

  const validarPasoActual = async () => {
    const resultado = await form.trigger(camposDelPaso as (keyof FormData)[])
    return resultado
  }

  const siguiente = async () => {
    if (await validarPasoActual()) setPaso(p => p + 1)
  }

  const anterior = () => setPaso(p => p - 1)

  const finalizar = async () => {
    if (!await validarPasoActual()) return
    setCargando(true)
    try {
      const valores = form.getValues()
      const { data } = await evaluacionesService.crearEnfermeria({ ...valores, visita: visitaId })
      await evaluacionesService.completarEnfermeria(data.id)
      const { data: derivaciones } = await visitasService.estadoDerivaciones(visitaId)
      const siguiente = derivaciones.find((d: { estado: string; servicio: string }) => d.estado === 'EN_PROCESO')
      if (siguiente) {
        router.push(`/dashboard/visitas/${visitaId}/${SERVICIO_RUTA[siguiente.servicio]}`)
      } else {
        router.push(`/dashboard/visitas`)
      }
    } finally {
      setCargando(false)
    }
  }

  const pasoInfo = PASOS[paso - 1]

  return (
    <Form {...form}>
      <WizardStep
        pasoActual={paso}
        totalPasos={PASOS.length}
        titulo={pasoInfo.titulo}
        subtitulo={pasoInfo.subtitulo}
        onAnterior={paso > 1 ? anterior : undefined}
        onSiguiente={paso < PASOS.length ? siguiente : undefined}
        onFinalizar={paso === PASOS.length ? finalizar : undefined}
        cargando={cargando}
      >
        {/* Paso 1: Presión arterial */}
        {paso === 1 && (
          <div className="space-y-4">
            <FormField control={form.control} name="presion_arterial_sistolica" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Presión Sistólica (mmHg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="ej: 120" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="presion_arterial_diastolica" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Presión Diastólica (mmHg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="ej: 80" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {/* Paso 2: Peso y talla */}
        {paso === 2 && (
          <div className="space-y-4">
            <FormField control={form.control} name="peso_kg" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Peso (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="ej: 72.5" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="talla_cm" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Talla (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="ej: 170" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {imc && clasificacion && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500">IMC calculado</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{imc}</p>
                <p className={`text-sm font-medium mt-1 ${clasificacion.color}`}>{clasificacion.label}</p>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Signos vitales */}
        {paso === 3 && (
          <div className="space-y-4">
            <FormField control={form.control} name="frecuencia_cardiaca" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Frecuencia Cardíaca (lpm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="ej: 72" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="perimetro_cintura_cm" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Perímetro de Cintura (cm)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="ej: 88" className="text-lg h-12"
                    {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {/* Pasos 4 y 5: Antecedentes y diagnósticos */}
        {(paso === 4 || paso === 5) && (
          <div className="space-y-4">
            {camposDelPaso.map(campo => (
              <FormField key={campo} control={form.control} name={campo as keyof FormData} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-600">
                    {campo === 'antecedente_ecv' && 'Antecedente de Enfermedad Cardiovascular'}
                    {campo === 'enfermedad_renal_cronica' && 'Enfermedad Renal Crónica'}
                    {campo === 'diagnostico_hta' && 'Diagnóstico de Hipertensión Arterial'}
                    {campo === 'diagnostico_dbt' && 'Diagnóstico de Diabetes'}
                  </FormLabel>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {OPCIONES_TRIESTADO.map(op => (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => field.onChange(parseInt(op.value))}
                        className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                          field.value === parseInt(op.value)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </div>
        )}

        {/* Paso 6: Medicación */}
        {paso === 6 && (
          <div className="space-y-4">
            <FormField control={form.control} name="medicacion_regular" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Toma medicación regular?</FormLabel>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {OPCIONES_TRIESTADO.map(op => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => field.onChange(parseInt(op.value))}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                        field.value === parseInt(op.value)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="observaciones_derivacion" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Observaciones (opcional)</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
