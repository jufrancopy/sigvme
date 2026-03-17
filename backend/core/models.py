import uuid
from datetime import date
from django.db import models
from django.contrib.auth.models import User


class Empresa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    actividad_rubro = models.CharField(max_length=150)
    ruc = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    token_acceso = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Departamento(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Departamento"
        verbose_name_plural = "Departamentos"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Ciudad(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name='ciudades')
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Ciudad"
        verbose_name_plural = "Ciudades"
        ordering = ['nombre']
        unique_together = ['departamento', 'nombre']

    def __str__(self):
        return f"{self.nombre} - {self.departamento.nombre}"


class Barrio(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ciudad = models.ForeignKey(Ciudad, on_delete=models.CASCADE, related_name='barrios')
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Barrio"
        verbose_name_plural = "Barrios"
        ordering = ['nombre']
        unique_together = ['ciudad', 'nombre']

    def __str__(self):
        return f"{self.nombre} - {self.ciudad.nombre}"


class Paciente(models.Model):
    SEXO_CHOICES = [
        (1, 'Masculino'),
        (2, 'Femenino'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='pacientes')
    nombre_completo = models.CharField(max_length=200)
    numero_ci = models.CharField(max_length=20, unique=True)
    antiguedad_laboral = models.PositiveIntegerField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    departamento = models.ForeignKey('Departamento', on_delete=models.SET_NULL, null=True, blank=True)
    ciudad = models.ForeignKey('Ciudad', on_delete=models.SET_NULL, null=True, blank=True)
    barrio = models.ForeignKey('Barrio', on_delete=models.SET_NULL, null=True, blank=True)
    fecha_nacimiento = models.DateField()
    sexo = models.IntegerField(choices=SEXO_CHOICES)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"
        ordering = ['nombre_completo']

    @property
    def edad(self):
        if self.fecha_nacimiento:
            today = date.today()
            return today.year - self.fecha_nacimiento.year - (
                (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
            )
        return None

    def __str__(self):
        return f"{self.nombre_completo} - {self.numero_ci}"


class JornadaClinica(models.Model):
    TURNO_CHOICES = [
        ('MAÑANA', 'Mañana'),
        ('TARDE', 'Tarde'),
        ('DIA_COMPLETO', 'Día completo'),
    ]
    ESTADO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('EN_CURSO', 'En curso'),
        ('FINALIZADA', 'Finalizada'),
        ('CANCELADA', 'Cancelada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='jornadas')
    fecha = models.DateField()
    turno = models.CharField(max_length=20, choices=TURNO_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PROGRAMADA')
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Jornada Clínica"
        verbose_name_plural = "Jornadas Clínicas"
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.empresa.nombre} - {self.fecha} ({self.turno})"


class Visita(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En proceso'),
        ('COMPLETADO', 'Completado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    jornada = models.ForeignKey(JornadaClinica, on_delete=models.CASCADE, related_name='visitas', null=True, blank=True)
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='visitas')
    numero_visita = models.PositiveIntegerField(default=1)
    estado_general = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Visita"
        verbose_name_plural = "Visitas"
        ordering = ['paciente__nombre_completo']
        unique_together = ['jornada', 'paciente']

    def __str__(self):
        return f"{self.paciente.nombre_completo} - {self.jornada}"


class PerfilUsuario(models.Model):
    ROL_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('ENFERMERIA', 'Enfermería'),
        ('NUTRICION', 'Nutrición'),
        ('ODONTOLOGIA', 'Odontología'),
        ('PSICOLOGIA', 'Psicología'),
        ('MEDICINA', 'Medicina'),
        ('SUPERVISOR', 'Supervisor'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=20, choices=ROL_CHOICES)
    servicios_autorizados = models.JSONField(default=list)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuarios"

    def __str__(self):
        return f"{self.user.username} - {self.get_rol_display()}"
