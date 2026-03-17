'use client'

import { useEffect, useState, useCallback } from 'react'
import { Empresa, Paciente, ResumenVisita } from '@/types'
import { empresasService } from '@/services/empresas'
import { pacientesService } from '@/services/pacientes'
import { visitasService } from '@/services/visitas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import EmpresaForm from '@/components/forms/EmpresaForm'
import { Plus, Pencil, PowerOff, Search, Users, FileText, Eye } from 'lucide-react'
import Link from 'next/link'

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [desactivarId, setDesactivarId] = useState<string | null>(null)
  const [editando, setEditando] = useState<Empresa | undefined>()
  const [loading, setLoading] = useState(true)
  const [empleadosDialogOpen, setEmpleadosDialogOpen] = useState(false)
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null)
  const [empleados, setEmpleados] = useState<Paciente[]>([])
  const [cargandoEmpleados, setCargandoEmpleados] = useState(false)
  const [informeDialogOpen, setInformeDialogOpen] = useState(false)
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null)
  const [resumenVisita, setResumenVisita] = useState<ResumenVisita | null>(null)
  const [cargandoInforme, setCargandoInforme] = useState(false)
  const [informesEmpresaDialogOpen, setInformesEmpresaDialogOpen] = useState(false)
  const [estadisticasEmpresa, setEstadisticasEmpresa] = useState<any>(null)
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const { data } = await empresasService.listar()
      const todas = data.results ?? (data as unknown as Empresa[])
      const filtradas = search
        ? todas.filter(e => e.nombre.toLowerCase().includes(search.toLowerCase()) || e.ruc?.includes(search))
        : todas
      setEmpresas(filtradas)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timeout = setTimeout(cargar, 300)
    return () => clearTimeout(timeout)
  }, [cargar])

  const abrirCrear = () => { setEditando(undefined); setDialogOpen(true) }
  const abrirEditar = (e: Empresa) => { setEditando(e); setDialogOpen(true) }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    if (editando) {
      await empresasService.actualizar(editando.id, data)
    } else {
      await empresasService.crear(data)
    }
    setDialogOpen(false)
    cargar()
  }

  const handleDesactivar = async () => {
    if (!desactivarId) return
    await empresasService.desactivar(desactivarId)
    setDesactivarId(null)
    cargar()
  }

  const abrirEmpleados = async (empresa: Empresa) => {
    setEmpresaSeleccionada(empresa)
    setCargandoEmpleados(true)
    setEmpleadosDialogOpen(true)
    try {
      const { data } = await pacientesService.listar(undefined, { empresa: empresa.id })
      const pacientes = data.results ?? (data as unknown as Paciente[])
      setEmpleados(pacientes)
    } finally {
      setCargandoEmpleados(false)
    }
  }

  const abrirInformePaciente = async (paciente: Paciente) => {
    setPacienteSeleccionado(paciente)
    setCargandoInforme(true)
    setInformeDialogOpen(true)
    try {
      // Get the latest visit for this patient
      const { data: visitas } = await visitasService.listar({ paciente: paciente.id })
      if (visitas.results && visitas.results.length > 0) {
        // Sort by date descending to get the latest
        const ultimaVisita = visitas.results.sort((a, b) => new Date(b.jornada_fecha ?? '').getTime() - new Date(a.jornada_fecha ?? '').getTime())[0]
        const resumen = await visitasService.resumenCompleto(ultimaVisita.id)
        setResumenVisita(resumen.data)
      } else {
        setResumenVisita(null)
      }
    } finally {
      setCargandoInforme(false)
    }
  }

  const abrirInformesEmpresa = async (empresa: Empresa) => {
    setEmpresaSeleccionada(empresa)
    setCargandoEstadisticas(true)
    setInformesEmpresaDialogOpen(true)
    try {
      // Get all patients for this company
      const { data: pacientesData } = await pacientesService.listar(`?empresa=${empresa.id}`)
      const pacientes = pacientesData.results ?? []

      // Calculate statistics
      const stats = {
        totalEmpleados: pacientes.length,
        empleadosActivos: pacientes.filter(p => p.activo).length,
        promedioEdad: pacientes.length > 0
          ? Math.round(pacientes.reduce((sum, p) => sum + (p.edad || 0), 0) / pacientes.length)
          : 0,
        // Add more stats as needed
      }

      setEstadisticasEmpresa(stats)
    } finally {
      setCargandoEstadisticas(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Empresas</h1>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Empresa
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre o RUC..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Funcionarios</TableHead>
              <TableHead>Visitas Previstas</TableHead>
              <TableHead>Histórico Visitas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400">Cargando...</TableCell>
              </TableRow>
            ) : empresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400">No hay empresas registradas</TableCell>
              </TableRow>
            ) : empresas.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nombre}</TableCell>
                <TableCell>{e.actividad_rubro}</TableCell>
                <TableCell>{e.ruc ?? '—'}</TableCell>
                <TableCell>{e.telefono ?? '—'}</TableCell>
                <TableCell>{e.funcionarios_asociados_count ?? 0}</TableCell>
                <TableCell>{e.visitas_previstas_count ?? 0}</TableCell>
                <TableCell>{e.historico_visitas_count ?? 0}</TableCell>
                <TableCell>
                  <Badge variant={e.activo ? 'default' : 'secondary'}>
                    {e.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => abrirEditar(e)} title="Editar empresa">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Link href={`/dashboard/empresas/${e.id}`}>
                      <Button variant="ghost" size="icon" title="Ver detalle">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => abrirEmpleados(e)} title="Ver funcionarios">
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => abrirInformesEmpresa(e)} title="Ver informes">
                      <FileText className="h-4 w-4" />
                    </Button>
                    {e.activo && (
                      <Button variant="ghost" size="icon" onClick={() => setDesactivarId(e.id)} title="Desactivar empresa">
                        <PowerOff className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
          </DialogHeader>
          <EmpresaForm
            key={editando?.id ?? 'nueva'}
            empresa={editando}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!desactivarId} onOpenChange={() => setDesactivarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar empresa?</AlertDialogTitle>
            <AlertDialogDescription>La empresa no aparecerá en nuevos registros pero se conservan sus datos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesactivar} className="bg-red-600 hover:bg-red-700">
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={empleadosDialogOpen} onOpenChange={setEmpleadosDialogOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Funcionarios de {empresaSeleccionada?.nombre}</DialogTitle>
          </DialogHeader>
          {cargandoEmpleados ? (
            <div className="text-center py-8">Cargando funcionarios...</div>
          ) : empleados.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No hay funcionarios registrados</div>
          ) : (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>CI</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleados.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre_completo}</TableCell>
                      <TableCell>{p.numero_ci}</TableCell>
                      <TableCell>{p.edad ?? '—'}</TableCell>
                      <TableCell>{p.telefono ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={p.activo ? 'default' : 'secondary'}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => abrirInformePaciente(p)} title="Ver informe">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={informeDialogOpen} onOpenChange={setInformeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informe de {pacienteSeleccionado?.nombre_completo}</DialogTitle>
          </DialogHeader>
          {cargandoInforme ? (
            <div className="text-center py-8">Cargando informe...</div>
          ) : !resumenVisita ? (
            <div className="text-center py-8 text-slate-400">No hay visitas registradas para este paciente</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Datos Personales</h3>
                  <p><strong>CI:</strong> {resumenVisita.paciente.numero_ci}</p>
                  <p><strong>Edad:</strong> {resumenVisita.paciente.edad} años</p>
                  <p><strong>Empresa:</strong> {resumenVisita.paciente.empresa_nombre}</p>
                  <p><strong>Teléfono:</strong> {resumenVisita.paciente.telefono || 'No registrado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Última Visita</h3>
                  <p><strong>Fecha:</strong> {resumenVisita.visita.jornada_fecha ?? '—'}</p>
                  <p><strong>Turno:</strong> {resumenVisita.visita.jornada_turno ?? '—'}</p>
                  <p><strong>Estado:</strong> {resumenVisita.visita.estado_general}</p>
                </div>
              </div>

              {resumenVisita.enfermeria && (
                <div>
                  <h3 className="font-semibold mb-2">Evaluación Enfermería</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Presión Arterial:</strong> {resumenVisita.enfermeria.presion_arterial_sistolica}/{resumenVisita.enfermeria.presion_arterial_diastolica}</p>
                    <p><strong>Peso:</strong> {resumenVisita.enfermeria.peso_kg} kg</p>
                    <p><strong>Talla:</strong> {resumenVisita.enfermeria.talla_cm} cm</p>
                    <p><strong>IMC:</strong> {resumenVisita.enfermeria.imc} ({resumenVisita.enfermeria.clasificacion_imc})</p>
                  </div>
                </div>
              )}

              {resumenVisita.nutricion && (
                <div>
                  <h3 className="font-semibold mb-2">Evaluación Nutrición</h3>
                  <p><strong>Actividad Física:</strong> {resumenVisita.nutricion.actividad_fisica ? 'Sí' : 'No'}</p>
                  <p><strong>Consumo Frutas/Verduras:</strong> {resumenVisita.nutricion.consumo_frutas_verduras ? 'Sí' : 'No'}</p>
                  <p><strong>Comidas Diarias:</strong> {resumenVisita.nutricion.frecuencia_comidas_diarias}</p>
                </div>
              )}

              {resumenVisita.odontologia && (
                <div>
                  <h3 className="font-semibold mb-2">Evaluación Odontología</h3>
                  <p><strong>Boca Sana:</strong> {resumenVisita.odontologia.boca_sana ? 'Sí' : 'No'}</p>
                  <p><strong>Piezas Dentales:</strong> {resumenVisita.odontologia.numero_piezas_dentales}</p>
                </div>
              )}

              {resumenVisita.psicologia && (
                <div>
                  <h3 className="font-semibold mb-2">Evaluación Psicología</h3>
                  <p><strong>EVA-PSI:</strong> {resumenVisita.psicologia.eva_psi}</p>
                  <p><strong>AUDIT-C Puntaje:</strong> {resumenVisita.psicologia.audit_puntaje} ({resumenVisita.psicologia.audit_clasificacion})</p>
                </div>
              )}

              {resumenVisita.medicina && (
                <div>
                  <h3 className="font-semibold mb-2">Evaluación Medicina</h3>
                  <p><strong>FINDRISC Puntaje:</strong> {resumenVisita.medicina.findrisc_puntaje_total} ({resumenVisita.medicina.findrisc_clasificacion})</p>
                  <p><strong>Diagnóstico Final:</strong> {resumenVisita.medicina.diagnostico_final}</p>
                  <p><strong>Apto Laboral:</strong> {resumenVisita.medicina.apto_laboral ? 'Sí' : 'No'}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={informesEmpresaDialogOpen} onOpenChange={setInformesEmpresaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estadísticas de {empresaSeleccionada?.nombre}</DialogTitle>
          </DialogHeader>
          {cargandoEstadisticas ? (
            <div className="text-center py-8">Cargando estadísticas...</div>
          ) : !estadisticasEmpresa ? (
            <div className="text-center py-8 text-slate-400">No se pudieron cargar las estadísticas</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Total Empleados</h3>
                  <p className="text-2xl font-bold text-blue-600">{estadisticasEmpresa.totalEmpleados}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Empleados Activos</h3>
                  <p className="text-2xl font-bold text-green-600">{estadisticasEmpresa.empleadosActivos}</p>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Promedio de Edad</h3>
                <p className="text-2xl font-bold text-purple-600">{estadisticasEmpresa.promedioEdad} años</p>
              </div>
              <div className="text-sm text-slate-600">
                <p>📊 Estas estadísticas se basan en los empleados registrados en el sistema.</p>
                <p>🔄 Los datos se actualizan en tiempo real.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
