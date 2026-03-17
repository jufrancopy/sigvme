from rest_framework import serializers
from .models import (
    EvaluacionEnfermeria, EvaluacionNutricion, EvaluacionOdontologia,
    EvaluacionPsicologia, EvaluacionMedicina
)


class EvaluacionEnfermeriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionEnfermeria
        fields = '__all__'
        read_only_fields = ['imc', 'clasificacion_imc', 'profesional']


class EvaluacionNutricionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionNutricion
        fields = '__all__'
        read_only_fields = ['profesional']


class EvaluacionOdontologiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionOdontologia
        fields = '__all__'
        read_only_fields = ['profesional']


class EvaluacionPsicologiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionPsicologia
        fields = '__all__'
        read_only_fields = ['audit_puntaje', 'audit_clasificacion', 'profesional']


class EvaluacionMedicinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionMedicina
        fields = '__all__'
        read_only_fields = [
            'findrisc_puntaje_total', 'findrisc_clasificacion',
            'hearts_porcentaje_riesgo', 'hearts_clasificacion', 'profesional'
        ]
