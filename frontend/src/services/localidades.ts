import api from './api'
import { Departamento, Ciudad, Barrio } from '@/types'

export const localidadesService = {
  departamentos: () => api.get<{ results: Departamento[] }>('/departamentos/'),
  ciudades: (departamentoId: string) => api.get<{ results: Ciudad[] }>(`/ciudades/?departamento=${departamentoId}`),
  barrios: (ciudadId: string) => api.get<{ results: Barrio[] }>(`/barrios/?ciudad=${ciudadId}`),
}
