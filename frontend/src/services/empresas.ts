import api from './api'
import { Empresa } from '@/types'

export const empresasService = {
  listar: () => api.get<{ results: Empresa[]; count: number }>('/empresas/'),
  obtener: (id: string) => api.get<Empresa>(`/empresas/${id}/`),
  crear: (data: Partial<Empresa>) => api.post<Empresa>('/empresas/', data),
  actualizar: (id: string, data: Partial<Empresa>) => api.patch<Empresa>(`/empresas/${id}/`, data),
  desactivar: (id: string) => api.patch<Empresa>(`/empresas/${id}/`, { activo: false }),
  eliminar: (id: string) => api.delete(`/empresas/${id}/`),
  generarToken: (id: string) => api.post<{ token_acceso: string }>(`/empresas/${id}/generar_token/`),
}
