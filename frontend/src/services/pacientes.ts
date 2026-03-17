import api from './api'
import { Paciente } from '@/types'

export const pacientesService = {
  listar: (search?: string, params?: Record<string, string>) => api.get<{ results: Paciente[]; count: number }>('/pacientes/', { params: { ...(search ? { search } : {}), ...params } }),
  obtener: (id: string) => api.get<Paciente>(`/pacientes/${id}/`),
  crear: (data: object) => api.post<Paciente>('/pacientes/', data),
  actualizar: (id: string, data: object) => api.patch<Paciente>(`/pacientes/${id}/`, data),
  eliminar: (id: string) => api.delete(`/pacientes/${id}/`),
}
