'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Paciente, Empresa, Departamento, Ciudad, Barrio } from '@/types'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { empresasService } from '@/services/empresas'
import { geografiaService } from '@/services/geografia'

const schema = z.object({
  nombre_completo: z.string().min(1, 'Requerido'),
  numero_ci: z.string().min(1, 'Requerido'),
  empresa: z.string().min(1, 'Requerido'),
  fecha_nacimiento: z.string().min(1, 'Requerido'),
  sexo: z.number().min(1),
  departamento: z.string().optional(),
  ciudad: z.string().optional(),
  barrio: z.string().optional(),
  telefono: z.string().optional(),
  antiguedad_laboral: z.number().optional(),
})

type PacienteFormData = z.infer<typeof schema>

interface Props {
  paciente?: Paciente
  onSubmit: (data: PacienteFormData) => Promise<void>
  onCancel: () => void
}

interface FormState {
  empresas: Empresa[]
  departamentos: Departamento[]
  ciudades: Ciudad[]
  barrios: Barrio[]
  defaults: PacienteFormData
  listo: boolean
}

const defaultsVacios: PacienteFormData = {
  nombre_completo: '', numero_ci: '', empresa: '',
  fecha_nacimiento: '', sexo: 1,
  departamento: '', ciudad: '', barrio: '',
  telefono: '', antiguedad_laboral: undefined,
}

export default function PacienteForm({ paciente, onSubmit, onCancel }: Props) {
  const [state, setState] = useState<FormState>({
    empresas: [], departamentos: [], ciudades: [], barrios: [],
    defaults: defaultsVacios, listo: false,
  })

  useEffect(() => {
    const cargar = async () => {
      const [empRes, depRes] = await Promise.all([
        empresasService.listar(),
        geografiaService.departamentos(),
      ])
      const empresas = empRes.data.results ?? empRes.data
      const departamentos = depRes.data.results ?? depRes.data

      let ciudades: Ciudad[] = []
      let barrios: Barrio[] = []
      let defaults = defaultsVacios

      if (paciente) {
        const [ciudadesRes, barriosRes] = await Promise.all([
          paciente.departamento ? geografiaService.ciudades(paciente.departamento) : Promise.resolve(null),
          paciente.ciudad ? geografiaService.barrios(paciente.ciudad) : Promise.resolve(null),
        ])
        if (ciudadesRes) ciudades = ciudadesRes.data.results ?? ciudadesRes.data
        if (barriosRes) barrios = barriosRes.data.results ?? barriosRes.data
        defaults = { ...paciente, sexo: paciente.sexo }
      }

      setState({ empresas, departamentos, ciudades, barrios, defaults, listo: true })
    }
    cargar()
  }, [paciente])

  if (!state.listo) return null

  return (
    <FormInterna
      key={paciente?.id ?? 'nuevo'}
      {...state}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )
}

function FormInterna({
  empresas, departamentos, ciudades: ciudadesIniciales, barrios: barriosIniciales,
  defaults, onSubmit, onCancel,
}: Omit<FormState, 'listo'> & { onSubmit: Props['onSubmit'], onCancel: Props['onCancel'] }) {
  const [ciudades, setCiudades] = useState<Ciudad[]>(ciudadesIniciales)
  const [barrios, setBarrios] = useState<Barrio[]>(barriosIniciales)
  const [ciudadValue, setCiudadValue] = useState<string>(defaults.ciudad ?? '')
  const [barrioValue, setBarrioValue] = useState<string>(defaults.barrio ?? '')

  const form = useForm<PacienteFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  const handleDepartamentoChange = (value: string) => {
    form.setValue('departamento', value)
    form.setValue('ciudad', '')
    form.setValue('barrio', '')
    setCiudadValue('')
    setBarrioValue('')
    setCiudades([])
    setBarrios([])
    if (value) {
      geografiaService.ciudades(value).then(({ data }) => setCiudades(data.results ?? data))
    }
  }

  const handleCiudadChange = (value: string) => {
    form.setValue('ciudad', value)
    form.setValue('barrio', '')
    setCiudadValue(value)
    setBarrioValue('')
    if (value) {
      geografiaService.barrios(value).then(({ data }) => setBarrios(data.results ?? data))
    } else {
      setBarrios([])
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nombre_completo" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre completo</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="numero_ci" render={({ field }) => (
            <FormItem>
              <FormLabel>N° de CI</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="telefono" render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="empresa" render={({ field }) => (
          <FormItem>
            <FormLabel>Empresa</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar empresa..." /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="fecha_nacimiento" render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de nacimiento</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="sexo" render={({ field }) => (
            <FormItem>
              <FormLabel>Sexo</FormLabel>
              <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">Masculino</SelectItem>
                  <SelectItem value="2">Femenino</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="departamento" render={({ field }) => (
          <FormItem>
            <FormLabel>Departamento</FormLabel>
            <Select onValueChange={handleDepartamentoChange} defaultValue={field.value ?? ''}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar departamento..." /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {departamentos.map(d => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="ciudad" render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <Select onValueChange={handleCiudadChange} value={ciudadValue || undefined} disabled={ciudades.length === 0}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Seleccionar ciudad..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ciudades.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="barrio" render={({ field }) => (
            <FormItem>
              <FormLabel>Barrio</FormLabel>
              <Select onValueChange={(v) => { field.onChange(v); setBarrioValue(v) }} value={barrioValue || undefined} disabled={barrios.length === 0}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Seleccionar barrio..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {barrios.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="antiguedad_laboral" render={({ field }) => (
          <FormItem>
            <FormLabel>Antigüedad laboral (años)</FormLabel>
            <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
