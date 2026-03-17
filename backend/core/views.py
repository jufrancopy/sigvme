import uuid
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Empresa, Departamento, Ciudad, Barrio, Paciente, JornadaClinica, Visita, PerfilUsuario
from .serializers import (
    EmpresaSerializer, DepartamentoSerializer, CiudadSerializer, BarrioSerializer,
    PacienteSerializer, JornadaClinicaSerializer, VisitaSerializer, PerfilUsuarioSerializer
)
from derivaciones.serializers import DerivacionSerializer
from derivaciones.services import DerivacionService


class EmpresaViewSet(viewsets.ModelViewSet):
    queryset = Empresa.objects.filter(activo=True)
    serializer_class = EmpresaSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'ruc']
    filterset_fields = ['activo']

    @action(detail=True, methods=['post'])
    def generar_token(self, request, pk=None):
        empresa = self.get_object()
        empresa.token_acceso = uuid.uuid4()
        empresa.save()
        return Response({'token_acceso': str(empresa.token_acceso)})

    @action(detail=False, methods=['get'], url_path='por-token/(?P<token>[^/.]+)')
    def por_token(self, request, token=None):
        from rest_framework.authentication import BaseAuthentication
        try:
            empresa = Empresa.objects.get(token_acceso=token)
        except (Empresa.DoesNotExist, Exception):
            return Response({'error': 'Token inválido'}, status=404)
        return Response(EmpresaSerializer(empresa).data)


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre']


class CiudadViewSet(viewsets.ModelViewSet):
    queryset = Ciudad.objects.select_related('departamento').all()
    serializer_class = CiudadSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['departamento']


class BarrioViewSet(viewsets.ModelViewSet):
    queryset = Barrio.objects.select_related('ciudad').all()
    serializer_class = BarrioSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ciudad']


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.select_related('empresa', 'departamento', 'ciudad', 'barrio').filter(activo=True)
    serializer_class = PacienteSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['nombre_completo', 'numero_ci']
    filterset_fields = ['empresa', 'sexo', 'activo']


class JornadaClinicaViewSet(viewsets.ModelViewSet):
    queryset = JornadaClinica.objects.select_related('empresa').all()
    serializer_class = JornadaClinicaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['empresa', 'estado', 'fecha']

    def perform_create(self, serializer):
        jornada = serializer.save()
        # Crear visita para cada funcionario activo de la empresa
        funcionarios = jornada.empresa.pacientes.filter(activo=True)
        for paciente in funcionarios:
            visita = Visita.objects.create(
                jornada=jornada,
                paciente=paciente,
                numero_visita=paciente.visitas.count() + 1,
            )
            DerivacionService.inicializar_derivaciones(visita)

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        jornada = self.get_object()
        nuevo_estado = request.data.get('estado')
        estados_validos = ['PROGRAMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA']
        if nuevo_estado not in estados_validos:
            return Response({'error': 'Estado inválido'}, status=400)
        jornada.estado = nuevo_estado
        jornada.save()
        return Response(JornadaClinicaSerializer(jornada).data)

    @action(detail=True, methods=['post'])
    def agregar_funcionario(self, request, pk=None):
        jornada = self.get_object()
        paciente_id = request.data.get('paciente_id')
        try:
            paciente = Paciente.objects.get(id=paciente_id, empresa=jornada.empresa)
            if jornada.visitas.filter(paciente=paciente).exists():
                return Response({'error': 'El funcionario ya está en esta jornada'}, status=400)
            visita = Visita.objects.create(
                jornada=jornada,
                paciente=paciente,
                numero_visita=paciente.visitas.count() + 1,
            )
            DerivacionService.inicializar_derivaciones(visita)
            return Response(VisitaSerializer(visita).data, status=201)
        except Paciente.DoesNotExist:
            return Response({'error': 'Funcionario no encontrado'}, status=404)


class VisitaViewSet(viewsets.ModelViewSet):
    queryset = Visita.objects.select_related('paciente', 'jornada__empresa').all()
    serializer_class = VisitaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['jornada', 'paciente', 'estado_general', 'jornada__fecha']

    def perform_create(self, serializer):
        visita = serializer.save()
        DerivacionService.inicializar_derivaciones(visita)

    @action(detail=True, methods=['get'])
    def estado_derivaciones(self, request, pk=None):
        visita = self.get_object()
        derivaciones = visita.derivaciones.order_by('orden')
        return Response(DerivacionSerializer(derivaciones, many=True).data)

    @action(detail=True, methods=['get'])
    def resumen_completo(self, request, pk=None):
        from evaluaciones.serializers import (
            EvaluacionEnfermeriaSerializer, EvaluacionNutricionSerializer,
            EvaluacionOdontologiaSerializer, EvaluacionPsicologiaSerializer,
            EvaluacionMedicinaSerializer
        )
        visita = self.get_object()
        resumen = {
            'visita': VisitaSerializer(visita).data,
            'paciente': PacienteSerializer(visita.paciente).data,
            'enfermeria': None, 'nutricion': None,
            'odontologia': None, 'psicologia': None, 'medicina': None,
        }
        evaluaciones = {
            'enfermeria': ('evaluacion_enfermeria', EvaluacionEnfermeriaSerializer),
            'nutricion': ('evaluacion_nutricion', EvaluacionNutricionSerializer),
            'odontologia': ('evaluacion_odontologia', EvaluacionOdontologiaSerializer),
            'psicologia': ('evaluacion_psicologia', EvaluacionPsicologiaSerializer),
            'medicina': ('evaluacion_medicina', EvaluacionMedicinaSerializer),
        }
        for key, (attr, serializer_class) in evaluaciones.items():
            try:
                resumen[key] = serializer_class(getattr(visita, attr)).data
            except Exception:
                pass
        return Response(resumen)


class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    queryset = PerfilUsuario.objects.select_related('user').all()
    serializer_class = PerfilUsuarioSerializer
