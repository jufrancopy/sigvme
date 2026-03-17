export interface Empresa {
  id: string
  nombre: string
  actividad_rubro: string
  ruc?: string
  direccion?: string
  telefono?: string
  activo: boolean
  token_acceso?: string
  funcionarios_asociados_count?: number
  visitas_previstas_count?: number
  historico_visitas_count?: number
}

export interface Departamento {
  id: string
  nombre: string
}

export interface Ciudad {
  id: string
  departamento: string
  nombre: string
}

export interface Barrio {
  id: string
  ciudad: string
  nombre: string
}

export interface Paciente {
  id: string
  empresa: string
  empresa_nombre?: string
  nombre_completo: string
  numero_ci: string
  antiguedad_laboral?: number
  telefono?: string
  departamento?: string
  departamento_nombre?: string
  ciudad?: string
  ciudad_nombre?: string
  barrio?: string
  barrio_nombre?: string
  fecha_nacimiento: string
  sexo: 1 | 2
  edad?: number
  activo: boolean
}

export interface Visita {
  id: string
  paciente: string
  paciente_nombre?: string
  paciente_ci?: string
  numero_visita: number
  fecha?: string
  jornada?: string
  jornada_fecha?: string
  jornada_turno?: string
  estado_general: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO'
}

export interface JornadaClinica {
  id: string
  empresa: string
  empresa_nombre?: string
  fecha: string
  turno: 'MAÑANA' | 'TARDE' | 'DIA_COMPLETO'
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA'
  observaciones?: string
  total_visitas: number
  visitas_completadas: number
  visitas: Visita[]
}

export type EstadoDerivacion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO'
export type Servicio = 'ENFERMERIA' | 'NUTRICION' | 'ODONTOLOGIA' | 'PSICOLOGIA' | 'MEDICINA'

export interface Derivacion {
  id: string
  visita: string
  servicio: Servicio
  servicio_display: string
  estado: EstadoDerivacion
  estado_display: string
  orden: number
  fecha_inicio?: string
  fecha_fin?: string
  observaciones?: string
  profesional_asignado?: string
}

export interface EvaluacionEnfermeria {
  id: string
  visita: string
  presion_arterial_sistolica: number
  presion_arterial_diastolica: number
  frecuencia_cardiaca?: number
  peso_kg: number
  talla_cm: number
  perimetro_cintura_cm?: number
  imc?: number
  clasificacion_imc?: string
  antecedente_ecv: 0 | 1 | 2
  enfermedad_renal_cronica: 0 | 1 | 2
  diagnostico_hta: 0 | 1 | 2
  diagnostico_dbt: 0 | 1 | 2
  medicacion_regular: 0 | 1 | 2
  completado: boolean
  requiere_derivacion: boolean
  observaciones_derivacion?: string
}

export interface EvaluacionNutricion {
  id: string
  visita: string
  actividad_fisica: 0 | 1
  consumo_frutas_verduras: 0 | 1
  frecuencia_comidas_diarias?: number
  consumo_agua_litros?: number
  diagnostico_nutricional?: string
  plan_alimentacion?: string
  completado: boolean
  requiere_derivacion: boolean
  observaciones_derivacion?: string
}

export interface EvaluacionOdontologia {
  id: string
  visita: string
  boca_sana: 0 | 1 | 2
  boca_rehabilitada: 0 | 1 | 2
  enfermedad_periodontal: 0 | 1 | 2
  caries_dental_no_tratada: 0 | 1 | 2
  numero_piezas_dentales?: number
  observaciones_clinicas?: string
  tratamiento_recomendado?: string
  completado: boolean
  requiere_derivacion: boolean
  observaciones_derivacion?: string
}

export interface EvaluacionPsicologia {
  id: string
  visita: string
  eva_psi: number
  observaciones_estres?: string
  audit_frecuencia_anual?: number
  audit_bebidas_dia?: number
  audit_episodios_excesivos?: number
  audit_puntaje: number
  audit_clasificacion: string
  diagnostico_psicologico?: string
  recomendaciones?: string
  completado: boolean
  requiere_derivacion: boolean
  observaciones_derivacion?: string
}

export interface EvaluacionMedicina {
  id: string
  visita: string
  valor_glucemia?: number
  valor_hba1c?: number
  valor_tsh?: number
  valor_t3?: number
  valor_t4?: number
  valor_urea?: number
  valor_creatinina?: number
  ecg?: number
  pap_colposcopia?: number
  mamografia?: number
  ecografia_prostatica?: number
  findrisc_edad: number
  findrisc_imc: number
  findrisc_cintura: number
  findrisc_antecedentes_familiares: number
  findrisc_hiperglicemia: number
  findrisc_medicacion: number
  findrisc_puntaje_total: number
  findrisc_clasificacion: string
  hearts_porcentaje_riesgo?: number
  hearts_clasificacion?: string
  diagnostico_final?: string
  apto_laboral?: boolean
  restricciones?: string
  recomendaciones_finales?: string
  completado: boolean
  visita_cerrada: boolean
}

export interface ResumenVisita {
  visita: Visita
  paciente: Paciente
  enfermeria?: EvaluacionEnfermeria
  nutricion?: EvaluacionNutricion
  odontologia?: EvaluacionOdontologia
  psicologia?: EvaluacionPsicologia
  medicina?: EvaluacionMedicina
}

export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}
