from rest_framework import viewsets
from .models import Derivacion
from .serializers import DerivacionSerializer


class DerivacionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Derivacion.objects.select_related('visita', 'profesional_asignado').all()
    serializer_class = DerivacionSerializer
    filterset_fields = ['visita', 'servicio', 'estado']
