'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Paciente } from '@/types'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pacientesService } from '@/services/pacientes'

const schema = z.object({
  paciente: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  turno: z.enum(['MAÑANA', 'TARDE']),
})

type VisitaFormData = z.infer<typeof schema>

interface Props {
  onSubmit: (data: VisitaFormData) => Promise<void>
  onCancel: () => void
}

export default function VisitaForm({ onSubmit, onCancel }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [search, setSearch] = useState('')

  const form = useForm<VisitaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paciente: '',
      fecha: new Date().toISOString().split('T')[0],
      turno: 'MAÑANA',
    },
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      pacientesService.listar(search).then(({ data }) => {
        setPacientes(data.results ?? (data as unknown as Paciente[]))
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <div>
          <label className="text-sm font-medium text-slate-700">Buscar paciente</label>
          <Input
            placeholder="Nombre o CI..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>

        <FormField control={form.control} name="paciente" render={({ field }) => (
          <FormItem>
            <FormLabel>Paciente</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {pacientes.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre_completo} — {p.numero_ci}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="fecha" render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="turno" render={({ field }) => (
            <FormItem>
              <FormLabel>Turno</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MAÑANA">Mañana</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : 'Crear Visita'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
