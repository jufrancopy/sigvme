from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Avg, Q
from .models import (
    EvaluacionEnfermeria, EvaluacionNutricion, EvaluacionOdontologia,
    EvaluacionPsicologia, EvaluacionMedicina
)
from .serializers import (
    EvaluacionEnfermeriaSerializer, EvaluacionNutricionSerializer,
    EvaluacionOdontologiaSerializer, EvaluacionPsicologiaSerializer,
    EvaluacionMedicinaSerializer
)
from derivaciones.services import DerivacionService


@api_view(['GET'])
@permission_classes([AllowAny])
def indicadores_por_token(request, token):
    from core.models import Empresa
    try:
        empresa = Empresa.objects.get(token_acceso=token)
    except (Empresa.DoesNotExist, Exception):
        return Response({'error': 'Token inválido'}, status=404)

    enf_qs = EvaluacionEnfermeria.objects.filter(completado=True, visita__paciente__empresa=empresa)
    med_qs = EvaluacionMedicina.objects.filter(completado=True, visita__paciente__empresa=empresa)
    psi_qs = EvaluacionPsicologia.objects.filter(completado=True, visita__paciente__empresa=empresa)
    odo_qs = EvaluacionOdontologia.objects.filter(completado=True, visita__paciente__empresa=empresa)
    nut_qs = EvaluacionNutricion.objects.filter(completado=True, visita__paciente__empresa=empresa)

    total_enf = enf_qs.count()
    total_med = med_qs.count()
    total_psi = psi_qs.count()
    total_odo = odo_qs.count()

    imc_dist = {
        'bajo_peso': enf_qs.filter(clasificacion_imc='BAJO PESO').count(),
        'normal':    enf_qs.filter(clasificacion_imc='NORMAL').count(),
        'sobrepeso': enf_qs.filter(clasificacion_imc='SOBREPESO').count(),
        'obesidad':  enf_qs.filter(clasificacion_imc='OBESIDAD').count(),
    }
    imc_promedio = enf_qs.aggregate(p=Avg('imc'))['p']
    estres_promedio = psi_qs.aggregate(p=Avg('eva_psi'))['p']

    return Response({
        'empresa': {'id': str(empresa.id), 'nombre': empresa.nombre, 'rubro': empresa.actividad_rubro},
        'totales': {
            'evaluaciones_enfermeria': total_enf,
            'evaluaciones_medicina': total_med,
            'evaluaciones_psicologia': total_psi,
            'evaluaciones_odontologia': total_odo,
        },
        'cardiovascular': {
            'hta': enf_qs.filter(diagnostico_hta=1).count(),
            'ecv': enf_qs.filter(antecedente_ecv=1).count(),
            'total': total_enf,
        },
        'diabetes': {
            'diagnosticada': enf_qs.filter(diagnostico_dbt=1).count(),
            'glucemia_alta': med_qs.filter(valor_glucemia__gte=126).count(),
            'total_enf': total_enf, 'total_med': total_med,
        },
        'imc': {
            'distribucion': imc_dist,
            'promedio': round(float(imc_promedio), 1) if imc_promedio else None,
            'total': total_enf,
        },
        'aptitud_laboral': {
            'apto': med_qs.filter(apto_laboral=True).count(),
            'no_apto': med_qs.filter(apto_laboral=False).count(),
            'total': total_med,
        },
        'estres': {
            'distribucion': {
                'leve':     psi_qs.filter(eva_psi__lte=3).count(),
                'moderado': psi_qs.filter(eva_psi__gte=4, eva_psi__lte=6).count(),
                'severo':   psi_qs.filter(eva_psi__gte=7).count(),
            },
            'promedio': round(float(estres_promedio), 1) if estres_promedio else None,
            'total': total_psi,
        },
        'salud_bucal': {
            'boca_sana': odo_qs.filter(boca_sana=1).count(),
            'caries': odo_qs.filter(caries_dental_no_tratada=1).count(),
            'periodontal': odo_qs.filter(enfermedad_periodontal=1).count(),
            'total': total_odo,
        },
        'habitos': {
            'sedentarios': nut_qs.filter(actividad_fisica=0).count(),
            'bajo_consumo_frutas': nut_qs.filter(consumo_frutas_verduras=0).count(),
            'total': nut_qs.count(),
        },
    })


@api_view(['GET'])
def indicadores_salud(request):
    empresa_id = request.query_params.get('empresa')

    enf_qs = EvaluacionEnfermeria.objects.filter(completado=True)
    med_qs = EvaluacionMedicina.objects.filter(completado=True)
    psi_qs = EvaluacionPsicologia.objects.filter(completado=True)
    odo_qs = EvaluacionOdontologia.objects.filter(completado=True)
    nut_qs = EvaluacionNutricion.objects.filter(completado=True)

    if empresa_id:
        enf_qs = enf_qs.filter(visita__paciente__empresa_id=empresa_id)
        med_qs = med_qs.filter(visita__paciente__empresa_id=empresa_id)
        psi_qs = psi_qs.filter(visita__paciente__empresa_id=empresa_id)
        odo_qs = odo_qs.filter(visita__paciente__empresa_id=empresa_id)
        nut_qs = nut_qs.filter(visita__paciente__empresa_id=empresa_id)

    total_enf = enf_qs.count()
    total_med = med_qs.count()
    total_psi = psi_qs.count()
    total_odo = odo_qs.count()

    # --- Indicadores cardiovasculares y metabólicos ---
    hta = enf_qs.filter(diagnostico_hta=1).count()
    dbt = enf_qs.filter(diagnostico_dbt=1).count()
    ecv = enf_qs.filter(antecedente_ecv=1).count()
    renal = enf_qs.filter(enfermedad_renal_cronica=1).count()

    # Presión arterial elevada (sistólica >= 140 o diastólica >= 90)
    hta_no_diagnosticada = enf_qs.filter(
        diagnostico_hta=2
    ).filter(
        Q(presion_arterial_sistolica__gte=140) | Q(presion_arterial_diastolica__gte=90)
    ).count()

    # --- IMC ---
    imc_dist = {
        'bajo_peso': enf_qs.filter(clasificacion_imc='BAJO PESO').count(),
        'normal':    enf_qs.filter(clasificacion_imc='NORMAL').count(),
        'sobrepeso': enf_qs.filter(clasificacion_imc='SOBREPESO').count(),
        'obesidad':  enf_qs.filter(clasificacion_imc='OBESIDAD').count(),
    }
    imc_promedio = enf_qs.aggregate(p=Avg('imc'))['p']

    # --- FINDRISC (riesgo diabetes) ---
    findrisc_dist = {
        'bajo':      med_qs.filter(findrisc_clasificacion='Riesgo bajo').count(),
        'moderado':  med_qs.filter(findrisc_clasificacion='Riesgo moderado').count(),
        'muy_alto':  med_qs.filter(findrisc_clasificacion='Riesgo muy alto').count(),
    }

    # --- HEARTS (riesgo cardiovascular) ---
    hearts_dist = {
        'bajo':      med_qs.filter(hearts_clasificacion__icontains='bajo').count(),
        'moderado':  med_qs.filter(hearts_clasificacion__icontains='moderado').count(),
        'alto':      med_qs.filter(hearts_clasificacion__icontains='alto').count(),
    }

    # --- Aptitud laboral ---
    apto = med_qs.filter(apto_laboral=True).count()
    no_apto = med_qs.filter(apto_laboral=False).count()

    # --- Glucemia y HbA1c ---
    glucemia_alta = med_qs.filter(valor_glucemia__gte=126).count()
    hba1c_alta = med_qs.filter(valor_hba1c__gte=6.5).count()

    # --- AUDIT (alcohol) ---
    audit_dist = {
        'normal':    psi_qs.filter(audit_clasificacion__icontains='normal').count(),
        'riesgoso':  psi_qs.filter(audit_clasificacion__icontains='riesgoso').count(),
        'trastorno': psi_qs.filter(audit_clasificacion__icontains='trastorno').count(),
    }

    # --- Estrés EVA ---
    estres_dist = {
        'leve':     psi_qs.filter(eva_psi__lte=3).count(),
        'moderado': psi_qs.filter(eva_psi__gte=4, eva_psi__lte=6).count(),
        'severo':   psi_qs.filter(eva_psi__gte=7).count(),
    }
    estres_promedio = psi_qs.aggregate(p=Avg('eva_psi'))['p']

    # --- Salud bucal ---
    boca_sana = odo_qs.filter(boca_sana=1).count()
    caries = odo_qs.filter(caries_dental_no_tratada=1).count()
    periodontal = odo_qs.filter(enfermedad_periodontal=1).count()

    # --- Sedentarismo y nutrición ---
    sedentarios = nut_qs.filter(actividad_fisica=1).count()
    bajo_consumo_frutas = nut_qs.filter(consumo_frutas_verduras=1).count()
    total_nut = nut_qs.count()

    return Response({
        'totales': {
            'evaluaciones_enfermeria': total_enf,
            'evaluaciones_medicina': total_med,
            'evaluaciones_psicologia': total_psi,
            'evaluaciones_odontologia': total_odo,
        },
        'cardiovascular': {
            'hta': hta,
            'hta_no_diagnosticada': hta_no_diagnosticada,
            'ecv': ecv,
            'renal': renal,
            'total': total_enf,
        },
        'diabetes': {
            'diagnosticada': dbt,
            'glucemia_alta': glucemia_alta,
            'hba1c_alta': hba1c_alta,
            'total_enf': total_enf,
            'total_med': total_med,
        },
        'imc': {
            'distribucion': imc_dist,
            'promedio': round(float(imc_promedio), 1) if imc_promedio else None,
            'total': total_enf,
        },
        'findrisc': {
            'distribucion': findrisc_dist,
            'total': total_med,
        },
        'hearts': {
            'distribucion': hearts_dist,
            'total': total_med,
        },
        'aptitud_laboral': {
            'apto': apto,
            'no_apto': no_apto,
            'total': total_med,
        },
        'alcohol': {
            'distribucion': audit_dist,
            'total': total_psi,
        },
        'estres': {
            'distribucion': estres_dist,
            'promedio': round(float(estres_promedio), 1) if estres_promedio else None,
            'total': total_psi,
        },
        'salud_bucal': {
            'boca_sana': boca_sana,
            'caries': caries,
            'periodontal': periodontal,
            'total': total_odo,
        },
        'habitos': {
            'sedentarios': sedentarios,
            'bajo_consumo_frutas': bajo_consumo_frutas,
            'total': total_nut,
        },
    })


@api_view(['GET'])
def ranking_empresas(request):
    from core.models import Empresa

    empresas = Empresa.objects.filter(activo=True)
    resultado = []

    for empresa in empresas:
        enf = EvaluacionEnfermeria.objects.filter(completado=True, visita__paciente__empresa=empresa)
        med = EvaluacionMedicina.objects.filter(completado=True, visita__paciente__empresa=empresa)
        psi = EvaluacionPsicologia.objects.filter(completado=True, visita__paciente__empresa=empresa)
        total = enf.count()
        if total == 0:
            continue

        total_med = med.count() or 1
        total_psi = psi.count() or 1

        hta           = enf.filter(diagnostico_hta=1).count()
        dbt           = enf.filter(diagnostico_dbt=1).count()
        obesidad      = enf.filter(clasificacion_imc='OBESIDAD').count()
        sobrepeso     = enf.filter(clasificacion_imc='SOBREPESO').count()
        ecv           = enf.filter(antecedente_ecv=1).count()
        no_apto       = med.filter(apto_laboral=False).count()
        estres_alto   = psi.filter(eva_psi__gte=7).count()
        findrisc_alto = med.filter(findrisc_clasificacion='Riesgo muy alto').count()

        # Índice de morbilidad laboral (0-100): promedio ponderado de prevalencias
        indice = round((
            (hta / total) * 25 +
            (dbt / total) * 20 +
            ((obesidad + sobrepeso) / total) * 15 +
            (ecv / total) * 20 +
            (no_apto / total_med) * 10 +
            (estres_alto / total_psi) * 5 +
            (findrisc_alto / total_med) * 5
        ), 1)

        resultado.append({
            'empresa':            empresa.nombre,
            'empresa_id':         str(empresa.id),
            'total_evaluados':    total,
            'hta_pct':            round(hta / total * 100),
            'dbt_pct':            round(dbt / total * 100),
            'obesidad_pct':       round(obesidad / total * 100),
            'sobrepeso_pct':      round(sobrepeso / total * 100),
            'ecv_pct':            round(ecv / total * 100),
            'no_apto_pct':        round(no_apto / total_med * 100),
            'estres_pct':         round(estres_alto / total_psi * 100),
            'indice_morbilidad':  indice,
        })

    resultado.sort(key=lambda x: x['indice_morbilidad'], reverse=True)
    return Response(resultado[:10])


class BaseEvaluacionViewSet(viewsets.ModelViewSet):
    servicio = None

    def perform_create(self, serializer):
        evaluacion = serializer.save(profesional=self.request.user)
        DerivacionService.iniciar_servicio(evaluacion.visita, self.servicio)

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        evaluacion = self.get_object()
        evaluacion.completado = True
        evaluacion.fecha_completado = timezone.now()
        evaluacion.save()
        DerivacionService.completar_servicio(
            visita=evaluacion.visita,
            servicio=self.servicio,
            observaciones=request.data.get('observaciones', '')
        )
        orden = DerivacionService.ORDEN_SERVICIOS[self.servicio]
        siguiente = DerivacionService.SERVICIO_POR_ORDEN.get(orden + 1)
        return Response({'status': 'Completado', 'siguiente_servicio': siguiente})


class EvaluacionEnfermeriaViewSet(BaseEvaluacionViewSet):
    queryset = EvaluacionEnfermeria.objects.select_related('visita').all()
    serializer_class = EvaluacionEnfermeriaSerializer
    servicio = 'ENFERMERIA'


class EvaluacionNutricionViewSet(BaseEvaluacionViewSet):
    queryset = EvaluacionNutricion.objects.select_related('visita').all()
    serializer_class = EvaluacionNutricionSerializer
    servicio = 'NUTRICION'


class EvaluacionOdontologiaViewSet(BaseEvaluacionViewSet):
    queryset = EvaluacionOdontologia.objects.select_related('visita').all()
    serializer_class = EvaluacionOdontologiaSerializer
    servicio = 'ODONTOLOGIA'


class EvaluacionPsicologiaViewSet(BaseEvaluacionViewSet):
    queryset = EvaluacionPsicologia.objects.select_related('visita').all()
    serializer_class = EvaluacionPsicologiaSerializer
    servicio = 'PSICOLOGIA'


class EvaluacionMedicinaViewSet(BaseEvaluacionViewSet):
    queryset = EvaluacionMedicina.objects.select_related('visita').all()
    serializer_class = EvaluacionMedicinaSerializer
    servicio = 'MEDICINA'
