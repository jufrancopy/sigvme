'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import WizardStep from '@/components/ui/WizardStep'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { evaluacionesService } from '@/services/evaluaciones'
import { visitasService } from '@/services/visitas'

const OPCIONES_BINARIO = [{ value: 0, label: 'No' }, { value: 1, label: 'Sí' }]

const schema = z.object({
  valor_glucemia: z.number({ error: "Requerido" }).min(0),
  valor_hba1c: z.number({ error: "Requerido" }).min(0),
  valor_tsh: z.number({ error: "Requerido" }).min(0),
  valor_t3: z.number({ error: "Requerido" }).min(0),
  valor_t4: z.number({ error: "Requerido" }).min(0),
  valor_urea: z.number({ error: "Requerido" }).min(0),
  valor_creatinina: z.number({ error: "Requerido" }).min(0),
  ecg: z.number({ error: "Requerido" }),
  pap_colposcopia: z.number({ error: "Requerido" }),
  mamografia: z.number({ error: "Requerido" }),
  ecografia_prostatica: z.number({ error: "Requerido" }),
  findrisc_edad: z.number({ error: "Requerido" }),
  findrisc_imc: z.number({ error: "Requerido" }),
  findrisc_cintura: z.number({ error: "Requerido" }),
  findrisc_antecedentes_familiares: z.number({ error: "Requerido" }),
  findrisc_hiperglicemia: z.number({ error: "Requerido" }),
  findrisc_medicacion: z.number({ error: "Requerido" }),
  hearts_porcentaje_riesgo: z.number({ error: "Requerido" }).min(0).max(100),
  hearts_clasificacion: z.string().min(1, 'Requerido'),
  diagnostico_final: z.string().min(1, 'Requerido'),
  apto_laboral: z.boolean({ error: "Requerido" }),
  restricciones: z.string().optional(),
  recomendaciones_finales: z.string().min(1, 'Requerido'),
})

type FormData = z.infer<typeof schema>

const PASOS = [
  { titulo: 'Glucemia y HbA1c', subtitulo: 'Valores de glucosa en sangre', campos: ['valor_glucemia', 'valor_hba1c'] },
  { titulo: 'Función Tiroidea', subtitulo: 'TSH, T3 y T4', campos: ['valor_tsh', 'valor_t3', 'valor_t4'] },
  { titulo: 'Función Renal', subtitulo: 'Urea y creatinina', campos: ['valor_urea', 'valor_creatinina'] },
  { titulo: 'Estudios Complementarios', subtitulo: 'ECG y estudios preventivos', campos: ['ecg', 'pap_colposcopia', 'mamografia', 'ecografia_prostatica'] },
  { titulo: 'FINDRISC', subtitulo: 'Riesgo de diabetes tipo 2 (calculado automáticamente)', campos: ['findrisc_edad', 'findrisc_imc', 'findrisc_cintura', 'findrisc_antecedentes_familiares', 'findrisc_hiperglicemia', 'findrisc_medicacion'] },
  { titulo: 'Diagnóstico Final', subtitulo: 'HEARTS, diagnóstico, aptitud laboral y recomendaciones', campos: ['hearts_porcentaje_riesgo', 'hearts_clasificacion', 'diagnostico_final', 'apto_laboral', 'recomendaciones_finales'] },
]

const FINDRISC_EDAD = [{ value: 0, label: 'Menos de 45 años' }, { value: 2, label: '45-54 años' }, { value: 3, label: '55-64 años' }, { value: 4, label: 'Más de 64 años' }]
const FINDRISC_IMC = [{ value: 0, label: 'Menos de 25 kg/m²' }, { value: 1, label: '25-30 kg/m²' }, { value: 3, label: 'Más de 30 kg/m²' }]
const FINDRISC_CINTURA_H = [{ value: 0, label: 'Menos de 94 cm' }, { value: 3, label: '94-102 cm' }, { value: 4, label: 'Más de 102 cm' }]
const FINDRISC_ANTECEDENTES = [{ value: 0, label: 'No' }, { value: 3, label: 'Abuelos, tíos, primos' }, { value: 5, label: 'Padres, hermanos, hijos' }]
const FINDRISC_HIPERGLICEMIA = [{ value: 0, label: 'No' }, { value: 5, label: 'Sí' }]
const FINDRISC_MEDICACION = [{ value: 0, label: 'No' }, { value: 2, label: 'Sí' }]

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

function NumericField({ control, name, label, placeholder, step }: { control: any, name: keyof FormData, label: string, placeholder: string, step?: string }) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel className="text-slate-600">{label}</FormLabel>
        <FormControl>
          <Input type="number" step={step ?? '0.01'} placeholder={placeholder} className="text-lg h-12"
            {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  )
}

export default function MedicinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitaId } = use(params)
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const f1 = form.watch('findrisc_edad') ?? 0
  const f2 = form.watch('findrisc_imc') ?? 0
  const f3 = form.watch('findrisc_cintura') ?? 0
  const f4 = form.watch('findrisc_antecedentes_familiares') ?? 0
  const f5 = form.watch('findrisc_hiperglicemia') ?? 0
  const f6 = form.watch('findrisc_medicacion') ?? 0
  const findrisTotal = f1 + f2 + f3 + f4 + f5 + f6
  const findrisClasificacion = findrisTotal < 7 ? 'Bajo riesgo' : findrisTotal < 12 ? 'Riesgo ligeramente elevado' : findrisTotal < 15 ? 'Riesgo moderado' : findrisTotal < 20 ? 'Riesgo alto' : 'Riesgo muy alto'

  const validarPaso = async () => form.trigger(PASOS[paso - 1].campos as (keyof FormData)[])
  const siguiente = async () => { if (await validarPaso()) setPaso(p => p + 1) }
  const anterior = () => setPaso(p => p - 1)

  const finalizar = async () => {
    if (!await validarPaso()) return
    setCargando(true)
    try {
      const { data } = await evaluacionesService.crearMedicina({ ...form.getValues(), visita: visitaId })
      await evaluacionesService.completarMedicina((data as { id: string }).id)
      router.push('/dashboard/visitas')
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
            <NumericField control={form.control} name="valor_glucemia" label="Glucemia (mg/dL)" placeholder="ej: 95" />
            <NumericField control={form.control} name="valor_hba1c" label="HbA1c (%)" placeholder="ej: 5.4" />
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <NumericField control={form.control} name="valor_tsh" label="TSH (mUI/L)" placeholder="ej: 2.5" />
            <NumericField control={form.control} name="valor_t3" label="T3 (pg/mL)" placeholder="ej: 3.1" />
            <NumericField control={form.control} name="valor_t4" label="T4 (ng/dL)" placeholder="ej: 1.2" />
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <NumericField control={form.control} name="valor_urea" label="Urea (mg/dL)" placeholder="ej: 30" />
            <NumericField control={form.control} name="valor_creatinina" label="Creatinina (mg/dL)" placeholder="ej: 0.9" />
          </div>
        )}

        {paso === 4 && (
          <div className="space-y-4">
            {(['ecg', 'pap_colposcopia', 'mamografia', 'ecografia_prostatica'] as (keyof FormData)[]).map(campo => (
              <FormField key={campo} control={form.control} name={campo} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-600">
                    {campo === 'ecg' && 'ECG'}
                    {campo === 'pap_colposcopia' && 'PAP / Colposcopía'}
                    {campo === 'mamografia' && 'Mamografía'}
                    {campo === 'ecografia_prostatica' && 'Ecografía Prostática'}
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {OPCIONES_BINARIO.map(op => (
                      <button key={op.value} type="button" onClick={() => (field.onChange as (v: number) => void)(op.value)}
                        className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                          field.value === op.value
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}>
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

        {paso === 5 && (
          <div className="space-y-4">
            <FormField control={form.control} name="findrisc_edad" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Edad</FormLabel>
                <BotonesOpciones field={field} opciones={FINDRISC_EDAD} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="findrisc_imc" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">IMC</FormLabel>
                <BotonesOpciones field={field} opciones={FINDRISC_IMC} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="findrisc_cintura" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Perímetro de cintura (hombre)</FormLabel>
                <BotonesOpciones field={field} opciones={FINDRISC_CINTURA_H} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="findrisc_antecedentes_familiares" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Antecedentes familiares de diabetes</FormLabel>
                <BotonesOpciones field={field} opciones={FINDRISC_ANTECEDENTES} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="findrisc_hiperglicemia" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Hiperglicemia previa?</FormLabel>
                <BotonesOpciones field={field} opciones={FINDRISC_HIPERGLICEMIA} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="findrisc_medicacion" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Medicación antihipertensiva?</FormLabel>
                <BotonesOpciones field={field} opciones={FINDRISC_MEDICACION} />
                <FormMessage />
              </FormItem>
            )} />
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-sm text-slate-500">Puntaje FINDRISC</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{findrisTotal}</p>
              <p className={`text-sm font-medium mt-1 ${findrisTotal < 7 ? 'text-green-500' : findrisTotal < 15 ? 'text-yellow-500' : 'text-red-500'}`}>
                {findrisClasificacion}
              </p>
            </div>
          </div>
        )}

        {paso === 6 && (
          <div className="space-y-4">
            <NumericField control={form.control} name="hearts_porcentaje_riesgo" label="HEARTS - Riesgo cardiovascular (%)" placeholder="ej: 12" step="1" />
            <FormField control={form.control} name="hearts_clasificacion" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Clasificación HEARTS</FormLabel>
                <div className="flex flex-col gap-2 mt-1">
                  {['Bajo', 'Moderado', 'Alto', 'Muy alto'].map(op => (
                    <button key={op} type="button" onClick={() => field.onChange(op)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all ${
                        field.value === op
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}>
                      {op}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="diagnostico_final" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Diagnóstico Final</FormLabel>
                <FormControl>
                  <textarea {...field} rows={2} placeholder="Diagnóstico médico final..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="apto_laboral" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">¿Apto laboral?</FormLabel>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[{ value: true, label: 'Apto' }, { value: false, label: 'No apto' }].map(op => (
                    <button key={String(op.value)} type="button" onClick={() => field.onChange(op.value)}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                        field.value === op.value
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}>
                      {op.label}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="restricciones" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Restricciones (opcional)</FormLabel>
                <FormControl>
                  <textarea {...field} rows={2} placeholder="Restricciones laborales si aplica..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="recomendaciones_finales" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600">Recomendaciones Finales</FormLabel>
                <FormControl>
                  <textarea {...field} rows={2} placeholder="Recomendaciones para el paciente..."
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
