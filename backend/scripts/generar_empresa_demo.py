"""
Uso: python manage.py shell < scripts/generar_empresa_demo.py
"""
import random
from datetime import date, timedelta
from django.contrib.auth.models import User
from core.models import Empresa, Paciente, Ciudad, Barrio, Departamento, JornadaClinica, Visita
from evaluaciones.models import (
    EvaluacionEnfermeria, EvaluacionNutricion, EvaluacionOdontologia,
    EvaluacionPsicologia, EvaluacionMedicina
)
from derivaciones.models import Derivacion
from derivaciones.services import DerivacionService

random.seed(42)

# ── Profesional ──────────────────────────────────────────────────────────────
profesional, _ = User.objects.get_or_create(username='demo_prof', defaults={'first_name': 'Demo', 'last_name': 'Profesional'})
profesional.set_password('demo1234')
profesional.save()

# ── Empresa ───────────────────────────────────────────────────────────────────
empresa, _ = Empresa.objects.get_or_create(
    nombre='Industrias Paraguarí S.A.',
    defaults={
        'actividad_rubro': 'Manufactura y Producción',
        'ruc': '80012345-6',
        'direccion': 'Ruta 1 Km 45, Paraguarí',
        'telefono': '0531-123456',
        'activo': True,
    }
)
print(f'Empresa: {empresa.nombre}')

# ── Geografía ─────────────────────────────────────────────────────────────────
central = Departamento.objects.get(nombre='Central')
luque   = Ciudad.objects.get(nombre='Luque', departamento=central)
asuncion_dep = Departamento.objects.get(nombre='Asunción')
asuncion_ciudad = Ciudad.objects.get(nombre='Asunción', departamento=asuncion_dep)

barrios_luque    = list(Barrio.objects.filter(ciudad=luque)[:8])
barrios_asuncion = list(Barrio.objects.filter(ciudad=asuncion_ciudad)[:8])

# ── Funcionarios ──────────────────────────────────────────────────────────────
NOMBRES_M = ['Carlos', 'Juan', 'Miguel', 'Pedro', 'Luis', 'Diego', 'Roberto', 'Fernando', 'Andrés', 'Marcos', 'Pablo', 'Ricardo', 'Gustavo']
NOMBRES_F = ['María', 'Ana', 'Laura', 'Sandra', 'Patricia', 'Claudia', 'Verónica', 'Gabriela', 'Natalia', 'Sofía', 'Valeria', 'Lorena']
APELLIDOS  = ['González', 'Martínez', 'López', 'García', 'Rodríguez', 'Fernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Díaz', 'Morales', 'Ortiz']

funcionarios = []
ci_base = 3500000

for i in range(25):
    sexo = 1 if i < 15 else 2
    nombre = random.choice(NOMBRES_M if sexo == 1 else NOMBRES_F)
    apellido1 = random.choice(APELLIDOS)
    apellido2 = random.choice(APELLIDOS)
    edad = random.randint(25, 58)
    nacimiento = date.today() - timedelta(days=edad * 365 + random.randint(0, 364))
    ciudad = luque if i < 18 else asuncion_ciudad
    barrios = barrios_luque if ciudad == luque else barrios_asuncion
    barrio = random.choice(barrios) if barrios else None

    pac, created = Paciente.objects.get_or_create(
        numero_ci=str(ci_base + i),
        defaults={
            'empresa': empresa,
            'nombre_completo': f'{nombre} {apellido1} {apellido2}',
            'fecha_nacimiento': nacimiento,
            'sexo': sexo,
            'departamento': central if ciudad == luque else asuncion_dep,
            'ciudad': ciudad,
            'barrio': barrio,
            'antiguedad_laboral': random.randint(1, 20),
            'telefono': f'09{random.randint(10,99)}-{random.randint(100000,999999)}',
            'activo': True,
        }
    )
    if created:
        funcionarios.append(pac)
    else:
        funcionarios.append(pac)

print(f'Funcionarios: {len(funcionarios)}')

# ── Jornada clínica ───────────────────────────────────────────────────────────
jornada, _ = JornadaClinica.objects.get_or_create(
    empresa=empresa,
    fecha=date.today() - timedelta(days=15),
    defaults={'turno': 'DIA_COMPLETO', 'estado': 'FINALIZADA', 'observaciones': 'Jornada de demostración'}
)

# Crear visitas para cada funcionario si no existen
for pac in funcionarios:
    visita, created = Visita.objects.get_or_create(
        jornada=jornada,
        paciente=pac,
        defaults={'numero_visita': pac.visitas.count() + 1}
    )
    if created:
        DerivacionService.inicializar_derivaciones(visita)

visitas = list(jornada.visitas.all())
print(f'Visitas creadas: {len(visitas)}')

# ── Perfiles de riesgo realistas ──────────────────────────────────────────────
# Paraguay: HTA ~30%, DBT ~12%, Obesidad ~20%, Sobrepeso ~35%
def perfil_riesgo(idx):
    """Devuelve un perfil de riesgo basado en distribución epidemiológica paraguaya"""
    r = random.random()
    if idx < 8:    return 'alto'      # 32% alto riesgo
    elif idx < 18: return 'moderado'  # 40% moderado
    else:          return 'bajo'      # 28% bajo riesgo

perfiles = [perfil_riesgo(i) for i in range(25)]
random.shuffle(perfiles)

for visita, perfil in zip(visitas, perfiles):
    pac = visita.paciente
    edad = (date.today() - pac.fecha_nacimiento).days // 365

    # ── Enfermería ────────────────────────────────────────────────────────────
    if perfil == 'alto':
        pas = random.randint(145, 175)
        pad = random.randint(92, 105)
        peso = random.uniform(85, 115)
        talla = random.uniform(155, 175)
        hta = 1; dbt = random.choice([1, 1, 2]); ecv = random.choice([1, 2, 2])
    elif perfil == 'moderado':
        pas = random.randint(125, 144)
        pad = random.randint(82, 91)
        peso = random.uniform(72, 90)
        talla = random.uniform(158, 178)
        hta = random.choice([1, 2, 2]); dbt = 2; ecv = 2
    else:
        pas = random.randint(105, 124)
        pad = random.randint(65, 81)
        peso = random.uniform(55, 75)
        talla = random.uniform(160, 180)
        hta = 2; dbt = 2; ecv = 2

    enf, _ = EvaluacionEnfermeria.objects.get_or_create(
        visita=visita,
        defaults={
            'presion_arterial_sistolica': pas,
            'presion_arterial_diastolica': pad,
            'frecuencia_cardiaca': random.randint(62, 95),
            'peso_kg': round(peso, 1),
            'talla_cm': round(talla, 1),
            'perimetro_cintura_cm': round(random.uniform(75, 110) if perfil != 'bajo' else random.uniform(68, 85), 1),
            'diagnostico_hta': hta,
            'diagnostico_dbt': dbt,
            'antecedente_ecv': ecv,
            'enfermedad_renal_cronica': random.choice([1, 2, 2, 2]) if perfil == 'alto' else 2,
            'medicacion_regular': 1 if hta == 1 or dbt == 1 else 2,
            'completado': True,
            'requiere_derivacion': perfil == 'alto',
            'profesional': profesional,
        }
    )
    DerivacionService.iniciar_servicio(visita, 'ENFERMERIA')
    DerivacionService.completar_servicio(visita, 'ENFERMERIA')

    # ── Nutrición ─────────────────────────────────────────────────────────────
    nut, _ = EvaluacionNutricion.objects.get_or_create(
        visita=visita,
        defaults={
            'actividad_fisica': 1 if perfil in ('alto', 'moderado') else random.choice([0, 1]),
            'consumo_frutas_verduras': 1 if perfil == 'alto' else random.choice([0, 0, 1]),
            'frecuencia_comidas_diarias': random.randint(2, 5),
            'consumo_agua_litros': round(random.uniform(1.0, 2.5), 1),
            'diagnostico_nutricional': 'Obesidad grado I' if perfil == 'alto' else ('Sobrepeso' if perfil == 'moderado' else 'Normopeso'),
            'completado': True,
            'requiere_derivacion': perfil == 'alto',
            'profesional': profesional,
        }
    )
    DerivacionService.iniciar_servicio(visita, 'NUTRICION')
    DerivacionService.completar_servicio(visita, 'NUTRICION')

    # ── Odontología ───────────────────────────────────────────────────────────
    odo, _ = EvaluacionOdontologia.objects.get_or_create(
        visita=visita,
        defaults={
            'boca_sana': 1 if perfil == 'bajo' else 2,
            'boca_rehabilitada': random.choice([1, 2]),
            'enfermedad_periodontal': 1 if perfil == 'alto' else random.choice([1, 2, 2]),
            'caries_dental_no_tratada': 1 if perfil in ('alto', 'moderado') else random.choice([1, 2, 2]),
            'numero_piezas_dentales': random.randint(24, 32),
            'completado': True,
            'requiere_derivacion': perfil == 'alto',
            'profesional': profesional,
        }
    )
    DerivacionService.iniciar_servicio(visita, 'ODONTOLOGIA')
    DerivacionService.completar_servicio(visita, 'ODONTOLOGIA')

    # ── Psicología ────────────────────────────────────────────────────────────
    eva_psi = random.randint(6, 9) if perfil == 'alto' else (random.randint(3, 6) if perfil == 'moderado' else random.randint(0, 3))
    audit_f = random.choice([0, 1, 2]) if perfil == 'alto' else random.choice([0, 0, 1])
    audit_b = random.choice([0, 1, 2]) if perfil == 'alto' else random.choice([0, 0, 1])
    audit_e = random.choice([0, 1, 2]) if perfil == 'alto' else random.choice([0, 0, 1])

    psi, _ = EvaluacionPsicologia.objects.get_or_create(
        visita=visita,
        defaults={
            'eva_psi': eva_psi,
            'audit_frecuencia_anual': audit_f,
            'audit_bebidas_dia': audit_b,
            'audit_episodios_excesivos': audit_e,
            'diagnostico_psicologico': 'Estrés laboral moderado' if eva_psi >= 5 else 'Sin alteraciones significativas',
            'completado': True,
            'requiere_derivacion': eva_psi >= 7,
            'profesional': profesional,
        }
    )
    DerivacionService.iniciar_servicio(visita, 'PSICOLOGIA')
    DerivacionService.completar_servicio(visita, 'PSICOLOGIA')

    # ── Medicina ──────────────────────────────────────────────────────────────
    imc_val = float(enf.imc) if enf.imc else 25.0
    glucemia = round(random.uniform(126, 210), 1) if dbt == 1 else round(random.uniform(75, 115), 1)
    hba1c    = round(random.uniform(6.5, 9.5), 1) if dbt == 1 else round(random.uniform(4.5, 5.9), 1)

    findrisc_edad = 4 if edad > 64 else (3 if edad > 54 else (2 if edad > 44 else 0))
    findrisc_imc  = 3 if imc_val > 30 else (1 if imc_val >= 25 else 0)
    findrisc_cin  = 4 if perfil == 'alto' else (3 if perfil == 'moderado' else 0)
    findrisc_ant  = random.choice([0, 3, 5]) if perfil == 'alto' else random.choice([0, 0, 3])

    med, _ = EvaluacionMedicina.objects.get_or_create(
        visita=visita,
        defaults={
            'valor_glucemia': glucemia,
            'valor_hba1c': hba1c,
            'valor_urea': round(random.uniform(15, 55), 1),
            'valor_creatinina': round(random.uniform(0.6, 1.8), 2),
            'ecg': 1 if perfil == 'alto' and random.random() > 0.6 else 0,
            'findrisc_edad': findrisc_edad,
            'findrisc_imc': findrisc_imc,
            'findrisc_cintura': findrisc_cin,
            'findrisc_antecedentes_familiares': findrisc_ant,
            'findrisc_hiperglicemia': 1 if dbt == 1 else 0,
            'findrisc_medicacion': 1 if hta == 1 else 0,
            'diagnostico_final': 'Síndrome metabólico. Requiere seguimiento.' if perfil == 'alto' else ('Control en 6 meses.' if perfil == 'moderado' else 'Sin hallazgos relevantes.'),
            'apto_laboral': perfil != 'alto',
            'restricciones': 'Evitar esfuerzo físico intenso' if perfil == 'alto' else None,
            'completado': True,
            'visita_cerrada': True,
            'profesional': profesional,
        }
    )
    DerivacionService.iniciar_servicio(visita, 'MEDICINA')
    DerivacionService.completar_servicio(visita, 'MEDICINA')

    # Marcar visita como completada
    visita.estado_general = 'COMPLETADO'
    visita.save()

print('\n✅ Empresa demo generada exitosamente.')
print(f'   Empresa: {empresa.nombre} (ID: {empresa.id})')
print(f'   Funcionarios: {len(funcionarios)}')
print(f'   Jornada: {jornada.fecha} — {jornada.estado}')
print(f'   Visitas completadas: {jornada.visitas.filter(estado_general="COMPLETADO").count()}/25')
