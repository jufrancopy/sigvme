from django.contrib import admin
from .models import Derivacion


@admin.register(Derivacion)
class DerivacionAdmin(admin.ModelAdmin):
    list_display = ['visita', 'servicio', 'orden', 'estado', 'fecha_inicio', 'fecha_fin', 'profesional_asignado']
    list_filter = ['servicio', 'estado']
    search_fields = ['visita__paciente__nombre_completo']
