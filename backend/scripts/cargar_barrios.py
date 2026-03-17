"""
Uso: python manage.py shell < scripts/cargar_barrios.py
"""
from core.models import Ciudad, Barrio

BARRIOS_POR_CIUDAD = {
    "Asunción": [
        "Centro", "Sajonia", "Las Mercedes", "Recoleta", "Villa Morra", "Barrio Obrero",
        "Trinidad", "San Pablo", "Mburicaó", "Tacumbú", "Nazareth", "Guaraní",
        "Las Palmas", "San José", "Tablada Nueva", "Jara", "Loma Pytá", "San Miguel",
        "Ytay", "Ykuá Satí", "Bañado Norte", "Bañado Sur", "Chacarita", "San Cayetano",
        "Villa Alegre", "Herrera", "Pinozá", "Zeballos Cué", "Mariscal López",
        "Manorá", "Virgen del Huerto", "San Vicente", "Republicano", "Pettirossi",
        "Hipódromo", "Ycuá Bolaños", "Bella Vista", "Santísima Trinidad",
        "Ciudad Nueva", "Los Laureles", "Tembetary", "Itá Pytá Punta",
        "Botánico", "Caacupemí", "Catedral", "Palermo", "Paso de la Arena",
        "San Cristóbal", "Santa Ana", "Santa Rosa", "Seminario", "Urunde'y",
    ],
    "Luque": [
        "Centro", "Isla Bogado", "San Buenaventura", "Mbocayaty", "San Francisco",
        "Villa Alegre", "Ykuá Satí", "Ytay", "San Miguel", "Loma Pytá",
        "Nazareth", "San José", "San Pedro", "Villa del Sol",
    ],
    "San Lorenzo": [
        "Centro", "Villa Aurelia", "San Antonio", "Jardín del Este", "San Jorge",
        "Universitario", "Las Mercedes", "Pinozá", "San Pablo", "Ycuá Bolaños",
        "Zeballos Cué", "Barrio Obrero", "Villa Alegre", "San Miguel", "Loma Pytá",
        "San José", "Trinidad", "Sajonia", "Recoleta",
    ],
    "Fernando de la Mora": [
        "Centro", "Ciudad Nueva", "Loma Pytá", "San Pedro", "Villa Aurelia",
        "Ytororó", "Barrio Obrero", "San José", "Villa Alegre", "San Miguel",
        "Las Palmas", "San Francisco", "Trinidad", "Sajonia",
    ],
    "Lambaré": [
        "Centro", "Barrio Obrero", "San José", "Ycuá Bolaños", "Villa del Mar",
        "San Miguel", "Loma Pytá", "Villa Alegre", "San Cayetano", "Bañado Sur",
        "Chacarita", "Villa Esperanza", "San Antonio", "Las Palmas",
    ],
    "Capiatá": [
        "Centro", "San Roque", "Villa Esperanza", "San Antonio", "San Cayetano",
        "Villa Alegre", "Loma Pytá", "San Miguel", "Barrio Obrero", "San José",
        "Las Palmas", "San Francisco", "Trinidad", "Villa del Sol",
    ],
    "Itauguá": [
        "Centro", "San Roque", "Villa Esperanza", "San Antonio", "Villa Alegre",
        "Loma Pytá", "San Miguel", "Barrio Obrero",
    ],
    "Mariano Roque Alonso": [
        "Centro", "San Isidro", "Villa Alegre", "San Lorenzo", "Barrio Obrero",
        "San José", "Loma Pytá", "San Miguel",
    ],
    "Ñemby": [
        "Centro", "San Pedro", "Villa del Lago", "Barrio Obrero", "San José",
        "Villa Alegre", "San Miguel",
    ],
    "Villa Elisa": [
        "Centro", "San Miguel", "Villa Alegre", "Barrio Obrero", "San José", "Loma Pytá",
    ],
    "Limpio": [
        "Centro", "San José", "Villa Esperanza", "Barrio Obrero", "Villa Alegre",
    ],
    "Areguá": [
        "Centro", "Lago Ypacaraí", "San Juan", "Villa Alegre", "Barrio Obrero",
    ],
    "Guarambaré": ["Centro", "San Isidro", "Villa Alegre"],
    "Itá": ["Centro", "San Roque", "Villa Alegre", "Barrio Obrero"],
    "Nueva Italia": ["Centro", "San Antonio", "Villa Alegre"],
    "Ciudad del Este": [
        "Microcentro", "Área 2", "Área 3", "Área 4", "Km 4", "Km 6", "Km 8",
        "San Blas", "Villa Alegre", "Santa Rosa", "San Rafael", "Barrio Obrero",
        "San Miguel", "Villa del Este", "San Antonio", "Las Palmas",
        "San José", "Trinidad", "San Pedro", "Villa Esperanza",
    ],
    "Hernandarias": [
        "Centro", "San Rafael", "Villa Alegre", "Barrio Obrero", "San José",
    ],
    "Minga Guazú": ["Centro", "San Antonio", "Villa Esperanza", "Barrio Obrero"],
    "Presidente Franco": ["Centro", "San Miguel", "Villa del Este", "Barrio Obrero"],
    "Encarnación": [
        "Centro", "San Pedro", "Cambyretá", "San Isidro", "Villa Alegre",
        "Pacú Cuá", "Barrio Obrero", "San José", "Trinidad", "San Miguel",
        "Las Palmas", "San Francisco", "Villa del Sol", "San Roque",
    ],
    "Coronel Bogado": ["Centro", "San Roque", "Villa Alegre", "Barrio Obrero"],
    "Caacupé": [
        "Centro", "San Roque", "Villa Alegre", "Tupãrenda", "Barrio Obrero",
        "San José", "San Miguel",
    ],
    "Tobatí": ["Centro", "San Isidro", "Villa Alegre"],
    "Paraguarí": ["Centro", "San Roque", "Villa Esperanza", "San Antonio", "Barrio Obrero"],
    "Carapeguá": ["Centro", "San Rafael", "Villa Alegre", "Barrio Obrero"],
    "Coronel Oviedo": [
        "Centro", "San Isidro", "Villa Alegre", "San Rafael", "Barrio Obrero",
        "San José", "San Miguel",
    ],
    "Caaguazú": ["Centro", "San Jorge", "Villa Alegre", "Barrio Obrero", "San José"],
    "San Juan Bautista": ["Centro", "San Antonio", "Villa Alegre", "Barrio Obrero"],
    "Pilar": ["Centro", "San Roque", "Villa Alegre", "Barrio Obrero"],
    "Concepción": ["Centro", "San Pablo", "Villa Alegre", "Barrio Obrero", "San José"],
    "San Pedro del Ycuamandiyú": ["Centro", "San José", "Villa Esperanza", "Barrio Obrero"],
    "Pedro Juan Caballero": ["Centro", "San Jorge", "Villa Alegre", "Barrio Obrero", "San José"],
    "Salto del Guairá": ["Centro", "San Blas", "Villa Alegre", "San Roque"],
    "Villarrica": [
        "Centro", "San Blas", "Villa Alegre", "San Roque", "Barrio Obrero",
        "San José", "San Miguel",
    ],
    "Caazapá": ["Centro", "San Roque", "Villa Alegre"],
    "Villa Hayes": ["Centro", "San Isidro", "Villa Alegre", "Barrio Obrero"],
    "Fuerte Olimpo": ["Centro", "San Pedro", "Villa del Lago"],
    "Filadelfia": ["Centro", "San Miguel", "Villa Alegre"],
}

creados = 0
omitidos = 0

for ciudad_nombre, barrios in BARRIOS_POR_CIUDAD.items():
    try:
        ciudad = Ciudad.objects.get(nombre=ciudad_nombre)
    except Ciudad.DoesNotExist:
        print(f"  [SKIP] Ciudad no encontrada: {ciudad_nombre}")
        continue

    existentes = set(ciudad.barrios.values_list('nombre', flat=True))
    for nombre in barrios:
        if nombre not in existentes:
            Barrio.objects.create(ciudad=ciudad, nombre=nombre)
            creados += 1
        else:
            omitidos += 1

print(f"\nListo: {creados} barrios creados, {omitidos} ya existían.")
