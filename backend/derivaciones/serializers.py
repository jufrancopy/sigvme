from rest_framework import serializers
from .models import Derivacion


class DerivacionSerializer(serializers.ModelSerializer):
    servicio_display = serializers.CharField(source='get_servicio_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Derivacion
        fields = '__all__'
