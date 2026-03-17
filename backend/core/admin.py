from django.contrib import admin
from .models import Empresa, Departamento, Ciudad, Barrio, Paciente, JornadaClinica, Visita, PerfilUsuario


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'actividad_rubro', 'ruc', 'activo']
    search_fields = ['nombre', 'ruc']
    list_filter = ['activo']


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ['nombre']


@admin.register(Ciudad)
class CiudadAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'departamento']
    search_fields = ['nombre']
    list_filter = ['departamento']


@admin.register(Barrio)
class BarrioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'ciudad']
    search_fields = ['nombre']
    list_filter = ['ciudad__departamento']


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'numero_ci', 'empresa', 'sexo', 'fecha_nacimiento', 'activo']
    search_fields = ['nombre_completo', 'numero_ci']
    list_filter = ['sexo', 'activo', 'empresa']


@admin.register(JornadaClinica)
class JornadaClinicaAdmin(admin.ModelAdmin):
    list_display = ['empresa', 'fecha', 'turno', 'estado']
    list_filter = ['estado', 'turno', 'empresa']
    search_fields = ['empresa__nombre']


@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    list_display = ['paciente', 'jornada', 'numero_visita', 'estado_general']
    search_fields = ['paciente__nombre_completo']
    list_filter = ['estado_general']


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ['user', 'rol', 'activo']
    list_filter = ['rol', 'activo']
