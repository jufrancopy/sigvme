from datetime import date
from django.db import models
from rest_framework import serializers
from .models import Empresa, Departamento, Ciudad, Barrio, Paciente, JornadaClinica, Visita, PerfilUsuario


class EmpresaSerializer(serializers.ModelSerializer):
    funcionarios_asociados_count = serializers.SerializerMethodField()
    visitas_previstas_count = serializers.SerializerMethodField()
    historico_visitas_count = serializers.SerializerMethodField()

    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'actividad_rubro', 'ruc', 'direccion', 'telefono', 'activo', 'token_acceso', 'created_at', 'updated_at', 'funcionarios_asociados_count', 'visitas_previstas_count', 'historico_visitas_count']

    def get_funcionarios_asociados_count(self, obj):
        return obj.pacientes.filter(activo=True).count()

    def get_visitas_previstas_count(self, obj):
        today = date.today()
        return Visita.objects.filter(
            paciente__empresa=obj,
            paciente__activo=True
        ).exclude(estado_general='COMPLETADO').filter(jornada__fecha__gte=today).count()

    def get_historico_visitas_count(self, obj):
        today = date.today()
        return Visita.objects.filter(
            paciente__empresa=obj,
            paciente__activo=True
        ).filter(
            models.Q(estado_general='COMPLETADO') | models.Q(jornada__fecha__lt=today)
        ).count()


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'


class CiudadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ciudad
        fields = '__all__'


class BarrioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barrio
        fields = '__all__'


class PacienteSerializer(serializers.ModelSerializer):
    edad = serializers.ReadOnlyField()
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True, default=None)
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True, default=None)
    barrio_nombre = serializers.CharField(source='barrio.nombre', read_only=True, default=None)

    class Meta:
        model = Paciente
        fields = '__all__'


class VisitaFuncionarioSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.nombre_completo', read_only=True)
    paciente_ci = serializers.CharField(source='paciente.numero_ci', read_only=True)

    class Meta:
        model = Visita
        fields = ['id', 'paciente', 'paciente_nombre', 'paciente_ci', 'numero_visita', 'estado_general']


class JornadaClinicaSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    total_visitas = serializers.SerializerMethodField()
    visitas_completadas = serializers.SerializerMethodField()
    visitas = VisitaFuncionarioSerializer(many=True, read_only=True)

    class Meta:
        model = JornadaClinica
        fields = '__all__'

    def get_total_visitas(self, obj):
        return obj.visitas.count()

    def get_visitas_completadas(self, obj):
        return obj.visitas.filter(estado_general='COMPLETADO').count()


class VisitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.nombre_completo', read_only=True)
    paciente_ci = serializers.CharField(source='paciente.numero_ci', read_only=True)
    jornada_fecha = serializers.DateField(source='jornada.fecha', read_only=True)
    jornada_turno = serializers.CharField(source='jornada.turno', read_only=True)

    class Meta:
        model = Visita
        fields = '__all__'


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = PerfilUsuario
        fields = '__all__'
