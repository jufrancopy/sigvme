'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Empresa } from '@/types'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  actividad_rubro: z.string().min(1, 'Requerido'),
  ruc: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
})

type EmpresaFormData = z.infer<typeof schema>

interface Props {
  empresa?: Empresa
  onSubmit: (data: EmpresaFormData) => Promise<void>
  onCancel: () => void
}

export default function EmpresaForm({ empresa, onSubmit, onCancel }: Props) {
  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: empresa?.nombre ?? '',
      actividad_rubro: empresa?.actividad_rubro ?? '',
      ruc: empresa?.ruc ?? '',
      direccion: empresa?.direccion ?? '',
      telefono: empresa?.telefono ?? '',
    },
  })

  useEffect(() => {
    if (empresa) form.reset({
      nombre: empresa.nombre,
      actividad_rubro: empresa.actividad_rubro,
      ruc: empresa.ruc ?? '',
      direccion: empresa.direccion ?? '',
      telefono: empresa.telefono ?? '',
    })
  }, [empresa, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="actividad_rubro" render={({ field }) => (
          <FormItem>
            <FormLabel>Actividad / Rubro</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="ruc" render={({ field }) => (
            <FormItem>
              <FormLabel>RUC</FormLabel>
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

        <FormField control={form.control} name="direccion" render={({ field }) => (
          <FormItem>
            <FormLabel>Dirección</FormLabel>
            <FormControl><Input {...field} /></FormControl>
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
