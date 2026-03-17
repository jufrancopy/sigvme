import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from core.models import Visita


class Derivacion(models.Model):
    SERVICIO_CHOICES = [
        ('ENFERMERIA', 'Enfermería'),
        ('NUTRICION', 'Nutrición'),
        ('ODONTOLOGIA', 'Odontología'),
        ('PSICOLOGIA', 'Psicología'),
        ('MEDICINA', 'Medicina'),
    ]
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En proceso'),
        ('COMPLETADO', 'Completado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visita = models.ForeignKey(Visita, on_delete=models.CASCADE, related_name='derivaciones')
    servicio = models.CharField(max_length=20, choices=SERVICIO_CHOICES)
    orden = models.PositiveIntegerField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_inicio = models.DateTimeField(blank=True, null=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    profesional_asignado = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Derivación"
        verbose_name_plural = "Derivaciones"
        ordering = ['visita', 'orden']
        unique_together = ['visita', 'servicio']

    def __str__(self):
        return f"{self.visita} - {self.get_servicio_display()} - {self.get_estado_display()}"
