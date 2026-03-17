from django.utils import timezone
from .models import Derivacion


class DerivacionService:
    ORDEN_SERVICIOS = {
        'ENFERMERIA': 1,
        'NUTRICION': 2,
        'ODONTOLOGIA': 3,
        'PSICOLOGIA': 4,
        'MEDICINA': 5,
    }
    # Diccionario inverso para búsqueda eficiente
    SERVICIO_POR_ORDEN = {v: k for k, v in ORDEN_SERVICIOS.items()}

    @staticmethod
    def inicializar_derivaciones(visita):
        derivaciones = []
        for servicio, orden in DerivacionService.ORDEN_SERVICIOS.items():
            derivacion = Derivacion.objects.create(
                visita=visita,
                servicio=servicio,
                orden=orden,
                estado='PENDIENTE'
            )
            derivaciones.append(derivacion)
        return derivaciones

    @staticmethod
    def iniciar_servicio(visita, servicio):
        orden_actual = DerivacionService.ORDEN_SERVICIOS[servicio]

        if orden_actual > 1:
            servicio_anterior = DerivacionService.SERVICIO_POR_ORDEN[orden_actual - 1]
            derivacion_anterior = Derivacion.objects.get(visita=visita, servicio=servicio_anterior)
            if derivacion_anterior.estado != 'COMPLETADO':
                raise ValueError(f"Debe completar {servicio_anterior} antes de iniciar {servicio}")

        derivacion = Derivacion.objects.get(visita=visita, servicio=servicio)
        derivacion.estado = 'EN_PROCESO'
        derivacion.fecha_inicio = timezone.now()
        derivacion.save()
        return derivacion

    @staticmethod
    def completar_servicio(visita, servicio, observaciones=None):
        derivacion = Derivacion.objects.get(visita=visita, servicio=servicio)
        derivacion.estado = 'COMPLETADO'
        derivacion.fecha_fin = timezone.now()
        if observaciones:
            derivacion.observaciones = observaciones
        derivacion.save()

        if servicio == 'MEDICINA':
            visita.estado_general = 'COMPLETADO'
            visita.save()

        return derivacion

    @staticmethod
    def puede_acceder_servicio(user, visita, servicio):
        perfil = user.perfil
        if perfil.rol in ['ADMIN', 'SUPERVISOR']:
            return True

        if servicio not in perfil.servicios_autorizados:
            return False

        orden_actual = DerivacionService.ORDEN_SERVICIOS[servicio]
        if orden_actual > 1:
            servicio_anterior = DerivacionService.SERVICIO_POR_ORDEN[orden_actual - 1]
            try:
                derivacion_anterior = Derivacion.objects.get(visita=visita, servicio=servicio_anterior)
                return derivacion_anterior.estado == 'COMPLETADO'
            except Derivacion.DoesNotExist:
                return False

        return True
