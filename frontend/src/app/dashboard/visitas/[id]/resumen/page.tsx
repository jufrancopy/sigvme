'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { visitasService } from '@/services/visitas'
import { ResumenVisita } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, User, Building2, MapPin, Calendar, Activity, Salad, Smile, Brain, Stethoscope } from 'lucide-react'

const TRIESTADO: Record<number, string> = { 0: 'No', 1: 'Sí', 2: 'No sabe / No contesta' }
const BINARIO: Record<number, string> = { 0: 'No', 1: 'Sí' }

function Seccion({ icono: Icono, titulo, color, children }: {
  icono: React.ElementType, titulo: string, color: string, children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden print:shadow-none print:border print:break-inside-avoid">
      <div className={`px-6 py-4 flex items-center gap-3 ${color}`}>
        <Icono className="h-5 w-5 text-white" />
        <h2 className="font-semibold text-white">{titulo}</h2>
      </div>
      <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

function Campo({ label, valor, destacado }: { label: string, valor: React.ReactNode, destacado?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${destacado ? 'text-blue-600 text-base' : 'text-slate-700'}`}>{valor ?? '—'}</p>
    </div>
  )
}

function BadgeApto({ apto }: { apto?: boolean }) {
  if (apto === undefined) return <span className="text-slate-400 text-sm">—</span>
  return (
    <Badge className={apto ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
      {apto ? 'Apto' : 'No apto'}
    </Badge>
  )
}

export default function ResumenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitaId } = use(params)
  const router = useRouter()
  const [resumen, setResumen] = useState<ResumenVisita | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    visitasService.resumenCompleto(visitaId)
      .then(({ data }) => setResumen(data))
      .finally(() => setLoading(false))
  }, [visitaId])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Cargando resumen...</p>
    </div>
  )

  if (!resumen) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">No se encontró la visita.</p>
    </div>
  )

  const { visita, paciente, enfermeria, nutricion, odontologia, psicologia, medicina } = resumen

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header — oculto al imprimir */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={visita.estado_general === 'COMPLETADO' ? 'default' : 'secondary'}>
            {visita.estado_general}
          </Badge>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Título impresión */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold text-slate-800">Resumen de Evaluación Médica Preventiva</h1>
          <p className="text-sm text-slate-500 mt-1">Visita N° {visita.numero_visita} — {visita.fecha}</p>
        </div>

        {/* Datos del paciente */}
        <Seccion icono={User} titulo="Datos del Paciente" color="bg-slate-700">
          <Campo label="Nombre completo" valor={paciente.nombre_completo} />
          <Campo label="Cédula de identidad" valor={paciente.numero_ci} />
          <Campo label="Fecha de nacimiento" valor={paciente.fecha_nacimiento} />
          <Campo label="Edad" valor={paciente.edad ? `${paciente.edad} años` : '—'} />
          <Campo label="Sexo" valor={paciente.sexo === 1 ? 'Masculino' : 'Femenino'} />
          <Campo label="Teléfono" valor={paciente.telefono} />
          <Campo label="Empresa" valor={paciente.empresa_nombre} />
          <Campo label="Antigüedad laboral" valor={paciente.antiguedad_laboral ? `${paciente.antiguedad_laboral} años` : '—'} />
          <Campo label="Ciudad" valor={paciente.ciudad_nombre} />
          <Campo label="Barrio" valor={paciente.barrio_nombre} />
          <Campo label="Fecha de visita" valor={visita.jornada_fecha} />
          <Campo label="Turno" valor={visita.jornada_turno} />
        </Seccion>

        {/* Enfermería */}
        {enfermeria && (
          <Seccion icono={Activity} titulo="Enfermería" color="bg-blue-600">
            <Campo label="Presión arterial" valor={`${enfermeria.presion_arterial_sistolica}/${enfermeria.presion_arterial_diastolica} mmHg`} destacado />
            <Campo label="Frecuencia cardíaca" valor={enfermeria.frecuencia_cardiaca ? `${enfermeria.frecuencia_cardiaca} lpm` : '—'} />
            <Campo label="Peso" valor={`${enfermeria.peso_kg} kg`} />
            <Campo label="Talla" valor={`${enfermeria.talla_cm} cm`} />
            <Campo label="IMC" valor={enfermeria.imc ? `${enfermeria.imc} — ${enfermeria.clasificacion_imc}` : '—'} destacado />
            <Campo label="Perímetro de cintura" valor={enfermeria.perimetro_cintura_cm ? `${enfermeria.perimetro_cintura_cm} cm` : '—'} />
            <Campo label="Antecedente ECV" valor={TRIESTADO[enfermeria.antecedente_ecv]} />
            <Campo label="Enfermedad renal crónica" valor={TRIESTADO[enfermeria.enfermedad_renal_cronica]} />
            <Campo label="Diagnóstico HTA" valor={TRIESTADO[enfermeria.diagnostico_hta]} />
            <Campo label="Diagnóstico diabetes" valor={TRIESTADO[enfermeria.diagnostico_dbt]} />
            <Campo label="Medicación regular" valor={TRIESTADO[enfermeria.medicacion_regular]} />
            {enfermeria.observaciones_derivacion && (
              <div className="col-span-full">
                <Campo label="Observaciones" valor={enfermeria.observaciones_derivacion} />
              </div>
            )}
          </Seccion>
        )}

        {/* Nutrición */}
        {nutricion && (
          <Seccion icono={Salad} titulo="Nutrición" color="bg-green-600">
            <Campo label="Actividad física" valor={BINARIO[nutricion.actividad_fisica]} />
            <Campo label="Consume frutas y verduras" valor={BINARIO[nutricion.consumo_frutas_verduras]} />
            <Campo label="Comidas por día" valor={nutricion.frecuencia_comidas_diarias} />
            <Campo label="Consumo de agua" valor={nutricion.consumo_agua_litros ? `${nutricion.consumo_agua_litros} L/día` : '—'} />
            <div className="col-span-full">
              <Campo label="Diagnóstico nutricional" valor={nutricion.diagnostico_nutricional} />
            </div>
            <div className="col-span-full">
              <Campo label="Plan de alimentación" valor={nutricion.plan_alimentacion} />
            </div>
          </Seccion>
        )}

        {/* Odontología */}
        {odontologia && (
          <Seccion icono={Smile} titulo="Odontología" color="bg-yellow-500">
            <Campo label="Boca sana" valor={TRIESTADO[odontologia.boca_sana]} />
            <Campo label="Boca rehabilitada" valor={TRIESTADO[odontologia.boca_rehabilitada]} />
            <Campo label="Enfermedad periodontal" valor={TRIESTADO[odontologia.enfermedad_periodontal]} />
            <Campo label="Caries no tratada" valor={TRIESTADO[odontologia.caries_dental_no_tratada]} />
            <Campo label="Piezas dentales" valor={odontologia.numero_piezas_dentales} />
            <div className="col-span-full">
              <Campo label="Observaciones clínicas" valor={odontologia.observaciones_clinicas} />
            </div>
            <div className="col-span-full">
              <Campo label="Tratamiento recomendado" valor={odontologia.tratamiento_recomendado} />
            </div>
          </Seccion>
        )}

        {/* Psicología */}
        {psicologia && (
          <Seccion icono={Brain} titulo="Psicología" color="bg-purple-600">
            <Campo label="Nivel de estrés (EVA)" valor={`${psicologia.eva_psi} / 10`} destacado />
            <Campo label="AUDIT-C puntaje" valor={psicologia.audit_puntaje} destacado />
            <Campo label="Clasificación AUDIT-C" valor={psicologia.audit_clasificacion} />
            <Campo label="Frecuencia consumo alcohol" valor={psicologia.audit_frecuencia_anual} />
            <Campo label="Bebidas por día" valor={psicologia.audit_bebidas_dia} />
            <Campo label="Episodios excesivos" valor={psicologia.audit_episodios_excesivos} />
            <div className="col-span-full">
              <Campo label="Observaciones de estrés" valor={psicologia.observaciones_estres} />
            </div>
            <div className="col-span-full">
              <Campo label="Diagnóstico psicológico" valor={psicologia.diagnostico_psicologico} />
            </div>
            <div className="col-span-full">
              <Campo label="Recomendaciones" valor={psicologia.recomendaciones} />
            </div>
          </Seccion>
        )}

        {/* Medicina */}
        {medicina && (
          <Seccion icono={Stethoscope} titulo="Medicina" color="bg-red-600">
            <Campo label="Glucemia" valor={medicina.valor_glucemia ? `${medicina.valor_glucemia} mg/dL` : '—'} />
            <Campo label="HbA1c" valor={medicina.valor_hba1c ? `${medicina.valor_hba1c}%` : '—'} />
            <Campo label="TSH" valor={medicina.valor_tsh ? `${medicina.valor_tsh} mUI/L` : '—'} />
            <Campo label="T3" valor={medicina.valor_t3 ? `${medicina.valor_t3} pg/mL` : '—'} />
            <Campo label="T4" valor={medicina.valor_t4 ? `${medicina.valor_t4} ng/dL` : '—'} />
            <Campo label="Urea" valor={medicina.valor_urea ? `${medicina.valor_urea} mg/dL` : '—'} />
            <Campo label="Creatinina" valor={medicina.valor_creatinina ? `${medicina.valor_creatinina} mg/dL` : '—'} />
            <Campo label="ECG" valor={medicina.ecg !== undefined ? BINARIO[medicina.ecg] : '—'} />
            <Campo label="PAP / Colposcopía" valor={medicina.pap_colposcopia !== undefined ? BINARIO[medicina.pap_colposcopia] : '—'} />
            <Campo label="Mamografía" valor={medicina.mamografia !== undefined ? BINARIO[medicina.mamografia] : '—'} />
            <Campo label="Ecografía prostática" valor={medicina.ecografia_prostatica !== undefined ? BINARIO[medicina.ecografia_prostatica] : '—'} />
            <Campo label="FINDRISC puntaje" valor={medicina.findrisc_puntaje_total} destacado />
            <Campo label="Clasificación FINDRISC" valor={medicina.findrisc_clasificacion} />
            <Campo label="HEARTS riesgo CV" valor={medicina.hearts_porcentaje_riesgo ? `${medicina.hearts_porcentaje_riesgo}%` : '—'} destacado />
            <Campo label="Clasificación HEARTS" valor={medicina.hearts_clasificacion} />
            <div className="col-span-full">
              <Campo label="Diagnóstico final" valor={medicina.diagnostico_final} />
            </div>
            <div className="col-span-full flex items-center gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Aptitud laboral</p>
                <div className="mt-1"><BadgeApto apto={medicina.apto_laboral} /></div>
              </div>
              {medicina.restricciones && (
                <div className="flex-1">
                  <Campo label="Restricciones" valor={medicina.restricciones} />
                </div>
              )}
            </div>
            <div className="col-span-full">
              <Campo label="Recomendaciones finales" valor={medicina.recomendaciones_finales} />
            </div>
          </Seccion>
        )}

      </div>
    </div>
  )
}
