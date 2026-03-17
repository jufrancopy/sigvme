import api from './api'
import { EvaluacionEnfermeria } from '@/types'

export const evaluacionesService = {
  // Enfermería
  crearEnfermeria: (data: object) =>
    api.post<EvaluacionEnfermeria>('/enfermeria/', data),
  completarEnfermeria: (id: string, data?: object) =>
    api.post(`/enfermeria/${id}/completar/`, data ?? {}),

  // Nutrición
  crearNutricion: (data: object) => api.post('/nutricion/', data),
  completarNutricion: (id: string) => api.post(`/nutricion/${id}/completar/`, {}),

  // Odontología
  crearOdontologia: (data: object) => api.post('/odontologia/', data),
  completarOdontologia: (id: string) => api.post(`/odontologia/${id}/completar/`, {}),

  // Psicología
  crearPsicologia: (data: object) => api.post('/psicologia/', data),
  completarPsicologia: (id: string) => api.post(`/psicologia/${id}/completar/`, {}),

  // Medicina
  crearMedicina: (data: object) => api.post('/medicina/', data),
  completarMedicina: (id: string) => api.post(`/medicina/${id}/completar/`, {}),
}
