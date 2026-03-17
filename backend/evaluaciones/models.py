import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from core.models import Visita


RESPUESTA_CHOICES = [
    (0, 'Sin Datos'),
    (1, 'Sí'),
    (2, 'No'),
]


class EvaluacionEnfermeria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visita = models.OneToOneField(Visita, on_delete=models.CASCADE, related_name='evaluacion_enfermeria')

    # Signos vitales
    presion_arterial_sistolica = models.PositiveIntegerField()
    presion_arterial_diastolica = models.PositiveIntegerField()
    frecuencia_cardiaca = models.PositiveIntegerField(blank=True, null=True)

    # Antropometría
    peso_kg = models.DecimalField(max_digits=5, decimal_places=2)
    talla_cm = models.DecimalField(max_digits=5, decimal_places=2)
    perimetro_cintura_cm = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    # Calculados
    imc = models.DecimalField(max_digits=5, decimal_places=2, editable=False, null=True)
    clasificacion_imc = models.CharField(max_length=20, editable=False, blank=True)

    # Antecedentes (HEARTS)
    antecedente_ecv = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    enfermedad_renal_cronica = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    diagnostico_hta = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    diagnostico_dbt = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    medicacion_regular = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)

    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(blank=True, null=True)
    requiere_derivacion = models.BooleanField(default=False)
    observaciones_derivacion = models.TextField(blank=True, null=True)

    profesional = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Evaluación de Enfermería"
        verbose_name_plural = "Evaluaciones de Enfermería"

    def save(self, *args, **kwargs):
        if self.peso_kg and self.talla_cm:
            talla_m = float(self.talla_cm) / 100
            imc_val = round(float(self.peso_kg) / (talla_m ** 2), 2)
            self.imc = imc_val
            if imc_val < 18.5:
                self.clasificacion_imc = 'BAJO PESO'
            elif imc_val < 25:
                self.clasificacion_imc = 'NORMAL'
            elif imc_val < 30:
                self.clasificacion_imc = 'SOBREPESO'
            else:
                self.clasificacion_imc = 'OBESIDAD'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Enfermería - {self.visita}"


class EvaluacionNutricion(models.Model):
    ACTIVIDAD_FISICA_CHOICES = [
        (0, '5 o más días por semana (0 puntos)'),
        (1, 'Menos de 5 días (1 punto)'),
    ]
    FRUTAS_VERDURAS_CHOICES = [
        (0, '5 o más porciones (0 puntos)'),
        (1, 'Menos de 5 porciones (1 punto)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visita = models.OneToOneField(Visita, on_delete=models.CASCADE, related_name='evaluacion_nutricion')

    actividad_fisica = models.IntegerField(choices=ACTIVIDAD_FISICA_CHOICES)
    consumo_frutas_verduras = models.IntegerField(choices=FRUTAS_VERDURAS_CHOICES)
    frecuencia_comidas_diarias = models.PositiveIntegerField(blank=True, null=True)
    consumo_agua_litros = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    diagnostico_nutricional = models.TextField(blank=True, null=True)
    plan_alimentacion = models.TextField(blank=True, null=True)

    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(blank=True, null=True)
    requiere_derivacion = models.BooleanField(default=False)
    observaciones_derivacion = models.TextField(blank=True, null=True)

    profesional = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Evaluación de Nutrición"
        verbose_name_plural = "Evaluaciones de Nutrición"

    def __str__(self):
        return f"Nutrición - {self.visita}"


class EvaluacionOdontologia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visita = models.OneToOneField(Visita, on_delete=models.CASCADE, related_name='evaluacion_odontologia')

    boca_sana = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    boca_rehabilitada = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    enfermedad_periodontal = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    caries_dental_no_tratada = models.IntegerField(choices=RESPUESTA_CHOICES, default=0)
    numero_piezas_dentales = models.PositiveIntegerField(blank=True, null=True)
    observaciones_clinicas = models.TextField(blank=True, null=True)
    tratamiento_recomendado = models.TextField(blank=True, null=True)

    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(blank=True, null=True)
    requiere_derivacion = models.BooleanField(default=False)
    observaciones_derivacion = models.TextField(blank=True, null=True)

    profesional = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Evaluación Odontológica"
        verbose_name_plural = "Evaluaciones Odontológicas"

    def __str__(self):
        return f"Odontología - {self.visita}"


class EvaluacionPsicologia(models.Model):
    EVA_PSI_CHOICES = [(i, str(i)) for i in range(11)]

    AUDIT_FRECUENCIA_CHOICES = [
        (None, 'Sin datos'),
        (0, 'Nunca (0 puntos)'),
        (1, 'Una vez al mes o menos (1 punto)'),
        (2, 'De 2 a 4 veces al mes (2 puntos)'),
        (3, 'De 2 a 3 veces a la semana (3 puntos)'),
        (4, '4 o más veces a la semana (4 puntos)'),
    ]
    AUDIT_BEBIDAS_CHOICES = [
        (None, 'Sin datos'),
        (0, '1 o 2 (0 puntos)'),
        (1, '3 o 4 (1 punto)'),
        (2, '5 o 6 (2 puntos)'),
        (3, '7 a 9 (3 puntos)'),
        (4, '10 o más (4 puntos)'),
    ]
    AUDIT_EPISODIO_CHOICES = [
        (None, 'Sin datos'),
        (0, 'Nunca (0 puntos)'),
        (1, 'Menos de 1 vez al mes (1 punto)'),
        (2, 'Mensual (2 puntos)'),
        (3, 'Semanal (3 puntos)'),
        (4, 'A diario o casi diario (4 puntos)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visita = models.OneToOneField(Visita, on_delete=models.CASCADE, related_name='evaluacion_psicologia')

    eva_psi = models.IntegerField(choices=EVA_PSI_CHOICES, default=0)
    observaciones_estres = models.TextField(blank=True, null=True)

    audit_frecuencia_anual = models.IntegerField(choices=AUDIT_FRECUENCIA_CHOICES, null=True, blank=True)
    audit_bebidas_dia = models.IntegerField(choices=AUDIT_BEBIDAS_CHOICES, null=True, blank=True)
    audit_episodios_excesivos = models.IntegerField(choices=AUDIT_EPISODIO_CHOICES, null=True, blank=True)

    # Calculados
    audit_puntaje = models.PositiveIntegerField(editable=False, default=0)
    audit_clasificacion = models.CharField(max_length=50, editable=False, blank=True)

    diagnostico_psicologico = models.TextField(blank=True, null=True)
    recomendaciones = models.TextField(blank=True, null=True)

    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(blank=True, null=True)
    requiere_derivacion = models.BooleanField(default=False)
    observaciones_derivacion = models.TextField(blank=True, null=True)

    profesional = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Evaluación Psicológica"
        verbose_name_plural = "Evaluaciones Psicológicas"

    def save(self, *args, **kwargs):
        puntaje = sum(filter(None, [
            self.audit_frecuencia_anual,
            self.audit_bebidas_dia,
            self.audit_episodios_excesivos,
        ]))
        self.audit_puntaje = puntaje

        sexo = self.visita.paciente.sexo
        if sexo == 2:  # Femenino
            if puntaje <= 2:
                self.audit_clasificacion = 'Consumo normal'
            elif puntaje <= 3:
                self.audit_clasificacion = 'Consumo riesgoso'
            else:
                self.audit_clasificacion = 'Alta probabilidad de trastorno por alcohol'
        else:  # Masculino
            if puntaje <= 3:
                self.audit_clasificacion = 'Consumo normal'
            elif puntaje <= 4:
                self.audit_clasificacion = 'Consumo riesgoso'
            else:
                self.audit_clasificacion = 'Alta probabilidad de trastorno por alcohol'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Psicología - {self.visita}"


class EvaluacionMedicina(models.Model):
    RESULTADO_EXAMEN_CHOICES = [
        (None, 'Sin datos'),
        (0, 'Normal'),
        (1, 'Anormal'),
        (2, 'No realizado'),
    ]
    FINDRISC_EDAD_CHOICES = [
        (0, 'Menos de 45 años (0 puntos)'),
        (2, '45-54 años (2 puntos)'),
        (3, '55-64 años (3 puntos)'),
        (4, 'Más de 64 años (4 puntos)'),
    ]
    FINDRISC_IMC_CHOICES = [
        (0, 'Menos de 25 (0 puntos)'),
        (1, '25-30 (1 punto)'),
        (3, 'Más de 30 (3 puntos)'),
    ]
    FINDRISC_CINTURA_CHOICES = [
        (0, 'Bajo riesgo (0 puntos)'),
        (3, 'Riesgo elevado (3 puntos)'),
        (4, 'Riesgo muy elevado (4 puntos)'),
    ]
    FINDRISC_ANTECEDENTES_CHOICES = [
        (0, 'No (0 puntos)'),
        (3, 'Abuelos, tíos, primos (3 puntos)'),
        (5, 'Padres, hermanos, hijos (5 puntos)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visita = models.OneToOneField(Visita, on_delete=models.CASCADE, related_name='evaluacion_medicina')

    # Laboratorio
    valor_glucemia = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    valor_hba1c = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    valor_tsh = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    valor_t3 = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    valor_t4 = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    valor_urea = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    valor_creatinina = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)

    # Exámenes diagnósticos
    ecg = models.IntegerField(choices=RESULTADO_EXAMEN_CHOICES, null=True, blank=True)
    pap_colposcopia = models.IntegerField(choices=RESULTADO_EXAMEN_CHOICES, null=True, blank=True)
    mamografia = models.IntegerField(choices=RESULTADO_EXAMEN_CHOICES, null=True, blank=True)
    ecografia_prostatica = models.IntegerField(choices=RESULTADO_EXAMEN_CHOICES, null=True, blank=True)

    # FINDRISC
    findrisc_edad = models.IntegerField(choices=FINDRISC_EDAD_CHOICES, default=0)
    findrisc_imc = models.IntegerField(choices=FINDRISC_IMC_CHOICES, default=0)
    findrisc_cintura = models.IntegerField(choices=FINDRISC_CINTURA_CHOICES, default=0)
    findrisc_antecedentes_familiares = models.IntegerField(choices=FINDRISC_ANTECEDENTES_CHOICES, default=0)
    findrisc_hiperglicemia = models.IntegerField(choices=[(0, 'No'), (1, 'Sí')], default=0)
    findrisc_medicacion = models.IntegerField(choices=[(0, 'No'), (1, 'Sí')], default=0)

    # Calculados FINDRISC
    findrisc_puntaje_total = models.PositiveIntegerField(editable=False, default=0)
    findrisc_clasificacion = models.CharField(max_length=20, editable=False, blank=True)

    # Calculados HEARTS
    hearts_porcentaje_riesgo = models.DecimalField(max_digits=5, decimal_places=2, editable=False, null=True)
    hearts_clasificacion = models.CharField(max_length=50, editable=False, blank=True)

    # Diagnóstico final
    diagnostico_final = models.TextField(blank=True, null=True)
    apto_laboral = models.BooleanField(null=True, blank=True)
    restricciones = models.TextField(blank=True, null=True)
    recomendaciones_finales = models.TextField(blank=True, null=True)

    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(blank=True, null=True)
    visita_cerrada = models.BooleanField(default=False)
    fecha_cierre = models.DateTimeField(blank=True, null=True)

    profesional = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Evaluación Médica"
        verbose_name_plural = "Evaluaciones Médicas"

    def save(self, *args, **kwargs):
        puntaje = sum([
            self.findrisc_edad,
            self.findrisc_imc,
            self.findrisc_cintura,
            self.findrisc_antecedentes_familiares,
            self.findrisc_hiperglicemia,
            self.findrisc_medicacion,
        ])

        try:
            nutricion = self.visita.evaluacion_nutricion
            if nutricion.completado:
                puntaje += nutricion.actividad_fisica
                puntaje += nutricion.consumo_frutas_verduras
        except EvaluacionNutricion.DoesNotExist:
            pass

        self.findrisc_puntaje_total = puntaje

        if puntaje < 7:
            self.findrisc_clasificacion = 'Riesgo bajo'
        elif puntaje <= 14:
            self.findrisc_clasificacion = 'Riesgo moderado'
        else:
            self.findrisc_clasificacion = 'Riesgo muy alto'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Medicina - {self.visita}"
