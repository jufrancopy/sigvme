'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Empresa, Paciente, JornadaClinica, Departamento, Ciudad, Barrio } from '@/types'
import { empresasService } from '@/services/empresas'
import { pacientesService } from '@/services/pacientes'
import { jornadasService } from '@/services/visitas'
import { geografiaService } from '@/services/geografia'
import { QRCodeCanvas } from 'qrcode.react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Building2, Users, ClipboardList, CheckCircle, Clock, AlertCircle, UserPlus, CalendarPlus, Trash2, ChevronDown, ChevronRight, PlayCircle, CheckSquare, XCircle, QrCode, Copy, Check } from 'lucide-react'

const schemaFuncionario = z.object({
  nombre_completo: z.string().min(1, 'Requerido'),
  numero_ci: z.string().min(1, 'Requerido'),
  fecha_nacimiento: z.string().min(1, 'Requerido'),
  sexo: z.number().min(1),
  telefono: z.string().optional(),
  antiguedad_laboral: z.number().optional(),
  departamento: z.string().optional(),
  ciudad: z.string().optional(),
  barrio: z.string().optional(),
})

const schemaJornada = z.object({
  fecha: z.string().min(1, 'Requerido'),
  turno: z.enum(['MAÑANA', 'TARDE', 'DIA_COMPLETO']),
  observaciones: z.string().optional(),
})

type FuncionarioForm = z.infer<typeof schemaFuncionario>
type JornadaForm = z.infer<typeof schemaJornada>

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

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [funcionarios, setFuncionarios] = useState<Paciente[]>([])
  const [jornadas, setJornadas] = useState<JornadaClinica[]>([])
  const [jornadaExpandida, setJornadaExpandida] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogFuncionario, setDialogFuncionario] = useState(false)
  const [dialogJornada, setDialogJornada] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dialogAcceso, setDialogAcceso] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [barrios, setBarrios] = useState<Barrio[]>([])

  const formFuncionario = useForm<FuncionarioForm>({
    resolver: zodResolver(schemaFuncionario),
    defaultValues: { nombre_completo: '', numero_ci: '', fecha_nacimiento: '', sexo: 1, telefono: '', antiguedad_laboral: undefined, departamento: '', ciudad: '', barrio: '' },
  })

  const formJornada = useForm<JornadaForm>({
    resolver: zodResolver(schemaJornada),
    defaultValues: { fecha: new Date().toISOString().split('T')[0], turno: 'MAÑANA' },
  })

  const deptoSeleccionado = formFuncionario.watch('departamento')
  const ciudadSeleccionada = formFuncionario.watch('ciudad')

  const cargar = async () => {
    try {
      const [empRes, pacRes, jorRes] = await Promise.all([
        empresasService.obtener(id),
        pacientesService.listar(undefined, { empresa: id }),
        jornadasService.listar({ empresa: id }),
      ])
      setEmpresa(empRes.data)
      setFuncionarios(pacRes.data.results ?? pacRes.data)
      const jornadasData = jorRes.data.results ?? jorRes.data
      setJornadas(jornadasData)
      // Expandir la primera jornada por defecto
      if (jornadasData.length > 0 && !jornadaExpandida) {
        setJornadaExpandida(jornadasData[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  useEffect(() => {
    geografiaService.departamentos().then(({ data }) => setDepartamentos(data.results ?? data))
  }, [])

  useEffect(() => {
    if (deptoSeleccionado) {
      geografiaService.ciudades(deptoSeleccionado).then(({ data }) => {
        setCiudades(data.results ?? data)
        formFuncionario.setValue('ciudad', '')
        formFuncionario.setValue('barrio', '')
        setBarrios([])
      })
    }
  }, [deptoSeleccionado])

  useEffect(() => {
    if (ciudadSeleccionada) {
      geografiaService.barrios(ciudadSeleccionada).then(({ data }) => {
        setBarrios(data.results ?? data)
        formFuncionario.setValue('barrio', '')
      })
    }
  }, [ciudadSeleccionada])

  const cambiarEstadoJornada = async (jornadaId: string, estado: JornadaClinica['estado']) => {
    await jornadasService.cambiarEstado(jornadaId, estado)
    cargar()
  }

  const generarToken = async () => {
    await empresasService.generarToken(id)
    cargar()
    setDialogAcceso(true)
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(linkAcceso)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const descargarQR = () => {
    const canvas = qrRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-acceso-${empresa?.nombre?.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  const guardarFuncionario = async (data: FuncionarioForm) => {
    const payload = {
      ...data,
      empresa: id,
      antiguedad_laboral: data.antiguedad_laboral ?? null,
      telefono: data.telefono || null,
      departamento: data.departamento || null,
      ciudad: data.ciudad || null,
      barrio: data.barrio || null,
    }
    try {
      await pacientesService.crear(payload)
      setDialogFuncionario(false)
      formFuncionario.reset()
      cargar()
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: Record<string, string[]> } }).response?.data
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          formFuncionario.setError(field as keyof FuncionarioForm, {
            message: Array.isArray(messages) ? messages[0] : String(messages),
          })
        })
      }
    }
  }

  const eliminarFuncionario = async () => {
    if (!deleteId) return
    await pacientesService.eliminar(deleteId)
    setDeleteId(null)
    cargar()
  }

  const guardarJornada = async (data: JornadaForm) => {
    await jornadasService.crear({ ...data, empresa: id })
    setDialogJornada(false)
    formJornada.reset({ fecha: new Date().toISOString().split('T')[0], turno: 'MAÑANA' })
    cargar()
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando...</div>
  if (!empresa) return <div className="text-center py-12 text-slate-400">Empresa no encontrada</div>

  const activos = funcionarios.filter(f => f.activo).length
  const jornadasFinalizadas = jornadas.filter(j => j.estado === 'FINALIZADA').length
  const jornadasEnCurso = jornadas.filter(j => j.estado === 'EN_CURSO').length
  const jornadasProgramadas = jornadas.filter(j => j.estado === 'PROGRAMADA').length
  const linkAcceso = empresa.token_acceso
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/acceso/${empresa.token_acceso}`
    : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-800">{empresa.nombre}</h1>
          <p className="text-sm text-slate-500">{empresa.actividad_rubro}</p>
        </div>
        <Badge variant={empresa.activo ? 'default' : 'secondary'}>
          {empresa.activo ? 'Activa' : 'Inactiva'}
        </Badge>
        <Button onClick={() => setDialogFuncionario(true)} variant="outline">
          <UserPlus className="h-4 w-4 mr-2" /> Nuevo Funcionario
        </Button>
        <Button onClick={() => empresa.token_acceso ? setDialogAcceso(true) : generarToken()} variant="outline">
          <QrCode className="h-4 w-4 mr-2" /> Acceso RRHH
        </Button>
        <Button onClick={() => setDialogJornada(true)}>
          <CalendarPlus className="h-4 w-4 mr-2" /> Nueva Jornada
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Funcionarios', value: activos, sub: `${funcionarios.length} registrados`, icon: Users, color: 'text-blue-500' },
          { label: 'Finalizadas', value: jornadasFinalizadas, sub: 'jornadas', icon: CheckCircle, color: 'text-green-500' },
          { label: 'En curso', value: jornadasEnCurso, sub: 'jornadas', icon: Clock, color: 'text-yellow-500' },
          { label: 'Programadas', value: jornadasProgramadas, sub: 'jornadas', icon: AlertCircle, color: 'text-slate-400' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-slate-500">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="funcionarios">
        <TabsList>
          <TabsTrigger value="funcionarios"><Users className="h-4 w-4 mr-2" />Funcionarios</TabsTrigger>
          <TabsTrigger value="visitas"><ClipboardList className="h-4 w-4 mr-2" />Visitas</TabsTrigger>
          <TabsTrigger value="info"><Building2 className="h-4 w-4 mr-2" />Información</TabsTrigger>
        </TabsList>

        <TabsContent value="funcionarios">
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">No hay funcionarios registrados</TableCell></TableRow>
                ) : funcionarios.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nombre_completo}</TableCell>
                    <TableCell>{f.numero_ci}</TableCell>
                    <TableCell>{f.edad ?? '—'}</TableCell>
                    <TableCell>{f.sexo === 1 ? 'M' : 'F'}</TableCell>
                    <TableCell>{f.ciudad_nombre ?? '—'}</TableCell>
                    <TableCell>{f.telefono ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={f.activo ? 'default' : 'secondary'}>{f.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(f.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="visitas">
          <div className="space-y-3">
            {jornadas.length === 0 ? (
              <div className="rounded-md border bg-white text-center py-12 text-slate-400">
                No hay jornadas clínicas registradas
              </div>
            ) : jornadas.map(jornada => {
              const expandida = jornadaExpandida === jornada.id
              const { label: labelEstado, variant: variantEstado } = ESTADO_JORNADA[jornada.estado] ?? { label: jornada.estado, variant: 'secondary' }
              return (
                <div key={jornada.id} className="rounded-md border bg-white overflow-hidden">
                  {/* Cabecera de la jornada */}
                  <div
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setJornadaExpandida(expandida ? null : jornada.id)}
                  >
                    {expandida ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                      <div>
                        <p className="font-medium text-slate-800">
                          {new Date(jornada.fecha + 'T00:00:00').toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-500">{jornada.turno === 'DIA_COMPLETO' ? 'Día completo' : jornada.turno === 'MAÑANA' ? 'Mañana' : 'Tarde'}</p>
                      </div>
                      <Badge variant={variantEstado} className="w-fit">{labelEstado}</Badge>
                      <p className="text-sm text-slate-500">{jornada.total_visitas} funcionarios</p>
                      <p className="text-sm text-slate-500">{jornada.visitas_completadas}/{jornada.total_visitas} completados</p>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      {jornada.estado === 'PROGRAMADA' && (
                        <Button size="sm" variant="outline" onClick={() => cambiarEstadoJornada(jornada.id, 'EN_CURSO')}>
                          <PlayCircle className="h-3.5 w-3.5 mr-1" /> Iniciar
                        </Button>
                      )}
                      {jornada.estado === 'EN_CURSO' && (
                        <Button size="sm" variant="outline" onClick={() => cambiarEstadoJornada(jornada.id, 'FINALIZADA')}>
                          <CheckSquare className="h-3.5 w-3.5 mr-1" /> Finalizar
                        </Button>
                      )}
                      {(jornada.estado === 'PROGRAMADA' || jornada.estado === 'EN_CURSO') && (
                        <Button size="sm" variant="ghost" onClick={() => cambiarEstadoJornada(jornada.id, 'CANCELADA')}>
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tabla de funcionarios de la jornada */}
                  {expandida && (
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead>Funcionario</TableHead>
                            <TableHead>CI</TableHead>
                            <TableHead>N° Visita</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-24">Reporte</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jornada.visitas.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400">Sin funcionarios en esta jornada</TableCell></TableRow>
                          ) : jornada.visitas.map(v => {
                            const { label, variant } = ESTADO_VISITA[v.estado_general] ?? { label: v.estado_general, variant: 'secondary' }
                            return (
                              <TableRow key={v.id}>
                                <TableCell className="font-medium">{v.paciente_nombre}</TableCell>
                                <TableCell className="text-slate-500">{v.paciente_ci}</TableCell>
                                <TableCell>Visita {v.numero_visita}</TableCell>
                                <TableCell><Badge variant={variant}>{label}</Badge></TableCell>
                                <TableCell>
                                  <Link href={`/dashboard/visitas/${v.id}/resumen`}>
                                    <Button variant="ghost" size="sm">Ver</Button>
                                  </Link>
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
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">Nombre</p><p className="font-medium">{empresa.nombre}</p></div>
                <div><p className="text-slate-500">Rubro</p><p className="font-medium">{empresa.actividad_rubro}</p></div>
                <div><p className="text-slate-500">RUC</p><p className="font-medium">{empresa.ruc ?? '—'}</p></div>
                <div><p className="text-slate-500">Teléfono</p><p className="font-medium">{empresa.telefono ?? '—'}</p></div>
                <div className="col-span-2"><p className="text-slate-500">Dirección</p><p className="font-medium">{empresa.direccion ?? '—'}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Acceso RRHH */}
      <Dialog open={dialogAcceso} onOpenChange={setDialogAcceso}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Acceso RRHH — {empresa.nombre}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {linkAcceso && (
              <QRCodeCanvas ref={qrRef} value={linkAcceso} size={200} />
            )}
            <p className="text-xs text-slate-500 text-center">Compartí este QR o link con el encargado de RRHH. Solo verá los indicadores de salud de su empresa.</p>
            <div className="w-full flex gap-2">
              <input readOnly value={linkAcceso} className="flex-1 text-xs border rounded px-2 py-1.5 bg-slate-50 text-slate-600 truncate" />
              <Button size="sm" variant="outline" onClick={copiarLink}>
                {copiado ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="w-full flex gap-2">
              <Button className="flex-1" onClick={descargarQR}>
                Descargar QR (PNG)
              </Button>
              <Button variant="ghost" className="text-slate-400 text-xs" onClick={generarToken}>
                Regenerar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuevo Funcionario */}
      <Dialog open={dialogFuncionario} onOpenChange={setDialogFuncionario}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Funcionario — {empresa.nombre}</DialogTitle>
          </DialogHeader>
          <Form {...formFuncionario}>
            <form onSubmit={formFuncionario.handleSubmit(guardarFuncionario)} className="space-y-4">
              <FormField control={formFuncionario.control} name="nombre_completo" render={({ field }) => (
                <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={formFuncionario.control} name="numero_ci" render={({ field }) => (
                  <FormItem><FormLabel>N° CI</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={formFuncionario.control} name="telefono" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={formFuncionario.control} name="fecha_nacimiento" render={({ field }) => (
                  <FormItem><FormLabel>Fecha de nacimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={formFuncionario.control} name="sexo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={v => field.onChange(parseInt(v))} value={String(field.value)}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1">Masculino</SelectItem>
                        <SelectItem value="2">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={formFuncionario.control} name="antiguedad_laboral" render={({ field }) => (
                <FormItem><FormLabel>Antigüedad laboral (años)</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={formFuncionario.control} name="departamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent>{departamentos.map(d => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={formFuncionario.control} name="ciudad" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={!deptoSeleccionado}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                      <SelectContent>{ciudades.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={formFuncionario.control} name="barrio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barrio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={!ciudadSeleccionada}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                      <SelectContent>{barrios.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogFuncionario(false)}>Cancelar</Button>
                <Button type="submit" disabled={formFuncionario.formState.isSubmitting}>
                  {formFuncionario.formState.isSubmitting ? 'Guardando...' : 'Guardar Funcionario'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Jornada */}
      <Dialog open={dialogJornada} onOpenChange={setDialogJornada}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Jornada Clínica — {empresa.nombre}</DialogTitle>
          </DialogHeader>
          <Form {...formJornada}>
            <form onSubmit={formJornada.handleSubmit(guardarJornada)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={formJornada.control} name="fecha" render={({ field }) => (
                  <FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={formJornada.control} name="turno" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="MAÑANA">Mañana</SelectItem>
                        <SelectItem value="TARDE">Tarde</SelectItem>
                        <SelectItem value="DIA_COMPLETO">Día completo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={formJornada.control} name="observaciones" render={({ field }) => (
                <FormItem><FormLabel>Observaciones (opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <p className="text-sm text-slate-500">Al crear la jornada se generará automáticamente una visita para cada funcionario activo de la empresa.</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogJornada(false)}>Cancelar</Button>
                <Button type="submit" disabled={formJornada.formState.isSubmitting}>
                  {formJornada.formState.isSubmitting ? 'Creando...' : 'Crear Jornada'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar funcionario?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminarFuncionario} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
