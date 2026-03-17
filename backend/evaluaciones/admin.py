from django.contrib import admin
from .models import (
    EvaluacionEnfermeria, EvaluacionNutricion, EvaluacionOdontologia,
    EvaluacionPsicologia, EvaluacionMedicina
)


@admin.register(EvaluacionEnfermeria)
class EvaluacionEnfermeriaAdmin(admin.ModelAdmin):
    list_display = ['visita', 'imc', 'clasificacion_imc', 'completado', 'profesional']
    list_filter = ['completado', 'clasificacion_imc']
    readonly_fields = ['imc', 'clasificacion_imc']


@admin.register(EvaluacionNutricion)
class EvaluacionNutricionAdmin(admin.ModelAdmin):
    list_display = ['visita', 'actividad_fisica', 'consumo_frutas_verduras', 'completado', 'profesional']
    list_filter = ['completado']


@admin.register(EvaluacionOdontologia)
class EvaluacionOdontologiaAdmin(admin.ModelAdmin):
    list_display = ['visita', 'boca_sana', 'caries_dental_no_tratada', 'completado', 'profesional']
    list_filter = ['completado']


@admin.register(EvaluacionPsicologia)
class EvaluacionPsicologiaAdmin(admin.ModelAdmin):
    list_display = ['visita', 'eva_psi', 'audit_puntaje', 'audit_clasificacion', 'completado', 'profesional']
    list_filter = ['completado']
    readonly_fields = ['audit_puntaje', 'audit_clasificacion']


@admin.register(EvaluacionMedicina)
class EvaluacionMedicinaAdmin(admin.ModelAdmin):
    list_display = ['visita', 'findrisc_puntaje_total', 'findrisc_clasificacion', 'apto_laboral', 'completado', 'profesional']
    list_filter = ['completado', 'apto_laboral', 'findrisc_clasificacion']
    readonly_fields = ['findrisc_puntaje_total', 'findrisc_clasificacion', 'hearts_porcentaje_riesgo', 'hearts_clasificacion']
