'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { JornadaClinica, Empresa, Derivacion } from '@/types'
import { jornadasService, visitasService } from '@/services/visitas'
import { empresasService } from '@/services/empresas'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight, Eye, FileText, CheckCircle2, Clock, Circle, Building2, PlayCircle, CheckSquare, XCircle } from 'lucide-react'

const ESTADO_JORNADA: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  PROGRAMADA: { label: 'Programada', variant: 'secondary' },
  EN_CURSO:   { label: 'En curso',   variant: 'outline' },
  FINALIZADA: { label: 'Finalizada', variant: 'default' },
  CANCELADA:  { label: 'Cancelada',  variant: 'secondary' },
}

const ESTADO_VISITA: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  COMPLETADO: { label: 'Completado', variant: 'default' },
  EN_PROCESO: { label: 'En proceso', variant: 'outline' },
  PENDIENTE:  { label: 'Pendiente',  variant: 'secondary' },
}

const SERVICIO_LABEL: Record<string, string> = {
  ENFERMERIA: 'Enfermería', NUTRICION: 'Nutrición',
  ODONTOLOGIA: 'Odontología', PSICOLOGIA: 'Psicología', MEDICINA: 'Medicina',
}

const SERVICIO_RUTA: Record<string, string> = {
  ENFERMERIA: 'enfermeria', NUTRICION: 'nutricion',
  ODONTOLOGIA: 'odontologia', PSICOLOGIA: 'psicologia', MEDICINA: 'medicina',
}

function IconoEstado({ estado }: { estado: string }) {
  if (estado === 'COMPLETADO') return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (estado === 'EN_PROCESO') return <Clock className="h-4 w-4 text-yellow-500" />
  return <Circle className="h-4 w-4 text-slate-300" />
}

function TimelineDerivaciones({ visitaId }: { visitaId: string }) {
  const router = useRouter()
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([])

  useEffect(() => {
    visitasService.estadoDerivaciones(visitaId).then(({ data }) => setDerivaciones(data))
  }, [visitaId])

  return (
    <div className="space-y-2 py-2">
      {derivaciones.map((d, i) => (
        <div key={d.id} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <IconoEstado estado={d.estado} />
            {i < derivaciones.length - 1 && <div className="w-px h-6 bg-slate-200 mt-1" />}
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm text-slate-700">{SERVICIO_LABEL[d.servicio]}</span>
            <div className="flex items-center gap-2">
              <Badge variant={ESTADO_VISITA[d.estado]?.variant ?? 'secondary'}>{d.estado_display}</Badge>
              {(d.estado === 'EN_PROCESO' || (d.estado === 'PENDIENTE' && (i === 0 || derivaciones[i - 1]?.estado === 'COMPLETADO'))) && (
                <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/visitas/${visitaId}/${SERVICIO_RUTA[d.servicio]}`)}>
                  Iniciar
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function VisitasPage() {
  const router = useRouter()
  const [jornadas, setJornadas] = useState<JornadaClinica[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())
  const [timelineId, setTimelineId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (filtroEmpresa !== 'TODAS') params.empresa = filtroEmpresa
      if (filtroEstado !== 'TODOS') params.estado = filtroEstado

      const [jorRes, empRes] = await Promise.all([
        jornadasService.listar(params),
        empresasService.listar(),
      ])
      const jornadasData = jorRes.data.results ?? jorRes.data
      setJornadas(jornadasData)
      setEmpresas(empRes.data.results ?? empRes.data)

      // Expandir la primera jornada por defecto
      if (jornadasData.length > 0) {
        setExpandidas(new Set([jornadasData[0].id]))
      }
    } finally {
      setLoading(false)
    }
  }, [filtroEmpresa, filtroEstado])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEstado = async (id: string, estado: JornadaClinica['estado']) => {
    await jornadasService.cambiarEstado(id, estado)
    cargar()
  }

  const toggleExpandida = (id: string) => {
    setExpandidas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Visitas Clínicas</h1>
        <Button onClick={() => router.push('/dashboard/empresas')} variant="outline">
          <Building2 className="h-4 w-4 mr-2" /> Ir a Empresas
        </Button>
      </div>

      <p className="text-sm text-slate-500">
        Las jornadas clínicas se crean desde la página de cada empresa. Al crear una jornada, se generan automáticamente las visitas para todos los funcionarios activos.
      </p>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="w-56">
          <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
            <SelectTrigger><SelectValue placeholder="Filtrar por empresa..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las empresas</SelectItem>
              {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="PROGRAMADA">Programada</SelectItem>
              <SelectItem value="EN_CURSO">En curso</SelectItem>
              <SelectItem value="FINALIZADA">Finalizada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de jornadas */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : jornadas.length === 0 ? (
        <div className="rounded-md border bg-white text-center py-12 text-slate-400">
          No hay jornadas registradas
        </div>
      ) : (
        <div className="space-y-3">
          {jornadas.map(jornada => {
            const expandida = expandidas.has(jornada.id)
            const { label: labelEstado, variant: variantEstado } = ESTADO_JORNADA[jornada.estado] ?? { label: jornada.estado, variant: 'secondary' }
            return (
              <div key={jornada.id} className="rounded-md border bg-white overflow-hidden">
                {/* Cabecera */}
                <div
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggleExpandida(jornada.id)}
                >
                  {expandida
                    ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  }
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                    <div className="md:col-span-2">
                      <p className="font-medium text-slate-800">{jornada.empresa_nombre}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(jornada.fecha + 'T00:00:00').toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {' · '}
                        {jornada.turno === 'DIA_COMPLETO' ? 'Día completo' : jornada.turno === 'MAÑANA' ? 'Mañana' : 'Tarde'}
                      </p>
                    </div>
                    <Badge variant={variantEstado} className="w-fit">{labelEstado}</Badge>
                    <p className="text-sm text-slate-500">{jornada.total_visitas} funcionarios</p>
                    <p className="text-sm text-slate-500">{jornada.visitas_completadas}/{jornada.total_visitas} completados</p>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {jornada.estado === 'PROGRAMADA' && (
                      <Button size="sm" variant="outline" onClick={() => cambiarEstado(jornada.id, 'EN_CURSO')}>
                        <PlayCircle className="h-3.5 w-3.5 mr-1" /> Iniciar
                      </Button>
                    )}
                    {jornada.estado === 'EN_CURSO' && (
                      <Button size="sm" variant="outline" onClick={() => cambiarEstado(jornada.id, 'FINALIZADA')}>
                        <CheckSquare className="h-3.5 w-3.5 mr-1" /> Finalizar
                      </Button>
                    )}
                    {(jornada.estado === 'PROGRAMADA' || jornada.estado === 'EN_CURSO') && (
                      <Button size="sm" variant="ghost" onClick={() => cambiarEstado(jornada.id, 'CANCELADA')}>
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tabla de funcionarios */}
                {expandida && (
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Funcionario</TableHead>
                          <TableHead>CI</TableHead>
                          <TableHead>N° Visita</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-24">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jornada.visitas.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400">Sin funcionarios</TableCell></TableRow>
                        ) : jornada.visitas.map(v => {
                          const { label, variant } = ESTADO_VISITA[v.estado_general] ?? { label: v.estado_general, variant: 'secondary' }
                          return (
                            <TableRow key={v.id}>
                              <TableCell className="font-medium">{v.paciente_nombre}</TableCell>
                              <TableCell className="text-slate-500">{v.paciente_ci}</TableCell>
                              <TableCell>Visita {v.numero_visita}</TableCell>
                              <TableCell><Badge variant={variant}>{label}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => setTimelineId(v.id)} title="Ver estado">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/visitas/${v.id}/resumen`)} title="Ver reporte">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal timeline derivaciones */}
      <Dialog open={!!timelineId} onOpenChange={() => setTimelineId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Estado de la Visita</DialogTitle>
          </DialogHeader>
          {timelineId && <TimelineDerivaciones visitaId={timelineId} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
