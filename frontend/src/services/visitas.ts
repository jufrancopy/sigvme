import api from './api'
import { Visita, JornadaClinica } from '@/types'

export const visitasService = {
  listar: (params?: { paciente?: string; estado_general?: string; empresa?: string }) =>
    api.get<{ results: Visita[] }>('/visitas/', { params }),
  obtener: (id: string) => api.get<Visita>(`/visitas/${id}/`),
  crear: (data: Partial<Visita>) => api.post<Visita>('/visitas/', data),
  estadoDerivaciones: (id: string) => api.get(`/visitas/${id}/estado_derivaciones/`),
  resumenCompleto: (id: string) => api.get(`/visitas/${id}/resumen_completo/`),
}

export const jornadasService = {
  listar: (params?: { empresa?: string; estado?: string }) =>
    api.get<{ results: JornadaClinica[] }>('/jornadas/', { params }),
  crear: (data: Partial<JornadaClinica>) => api.post<JornadaClinica>('/jornadas/', data),
  cambiarEstado: (id: string, estado: JornadaClinica['estado']) =>
    api.patch<JornadaClinica>(`/jornadas/${id}/cambiar_estado/`, { estado }),
  agrgarFuncionario: (id: string, paciente_id: string) =>
    api.post(`/jornadas/${id}/agregar_funcionario/`, { paciente_id }),
}
