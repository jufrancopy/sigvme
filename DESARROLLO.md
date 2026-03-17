# Medicina Preventiva - Seguimiento de Desarrollo

## Stack
- Backend: Django 6 + DRF + PostgreSQL
- Frontend Web: Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Mobile: React Native + Expo (pendiente)
- Servidor producción: Ubuntu + Nginx + Gunicorn (pendiente)

## Estructura del proyecto
```
MedicinaPreventia/
├── backend/          # Django API
├── frontend/         # Next.js panel web
├── mobile/           # Expo app móvil (pendiente)
├── nginx/            # Configuración Nginx (pendiente)
└── scripts/          # Scripts de deploy (pendiente)
```

---

## BACKEND ✅ COMPLETADO

### Apps Django
- `core` — Empresa, Departamento, Ciudad, Barrio, Paciente, JornadaClinica, Visita, PerfilUsuario
- `evaluaciones` — EvaluacionEnfermeria, EvaluacionNutricion, EvaluacionOdontologia, EvaluacionPsicologia, EvaluacionMedicina
- `derivaciones` — Derivacion, DerivacionService

### Archivos clave
- `backend/config/settings.py` — configuración principal
- `backend/config/urls.py` — rutas API
- `backend/core/models.py` — modelos base
- `backend/core/serializers.py` — serializers (incluye VisitaFuncionarioSerializer anidado en JornadaClinicaSerializer)
- `backend/core/views.py` — viewsets
- `backend/core/auth_views.py` — login/logout
- `backend/evaluaciones/models.py` — modelos de evaluaciones
- `backend/evaluaciones/serializers.py` — serializers
- `backend/evaluaciones/views.py` — viewsets con BaseEvaluacionViewSet + indicadores_salud + ranking_empresas + indicadores_por_token
- `backend/derivaciones/models.py` — modelo Derivacion
- `backend/derivaciones/services.py` — DerivacionService (lógica del flujo)
- `backend/derivaciones/views.py` — viewset readonly
- `backend/.env` — variables de entorno (no subir a git)
- `backend/backup_geografia.sql` — backup de geografía Paraguay (18 depto, 174+ ciudades, 6000+ barrios)
- `backend/scripts/generar_empresa_demo.py` — genera empresa demo con 25 empleados y evaluaciones completas
- `backend/scripts/cargar_barrios.py` — carga barrios oficiales de Luque

### API Endpoints disponibles
```
POST   /api/v1/auth/login/                            — login, retorna token
POST   /api/v1/auth/logout/                           — logout

GET    /api/v1/empresas/                              — listar empresas activas
POST   /api/v1/empresas/                              — crear empresa
PATCH  /api/v1/empresas/{id}/                         — editar empresa
POST   /api/v1/empresas/{id}/desactivar/              — desactivar empresa
POST   /api/v1/empresas/{id}/generar_token/           — generar/regenerar token de acceso RRHH

GET    /api/v1/departamentos/                         — listar departamentos
GET    /api/v1/ciudades/?departamento={id}            — ciudades por departamento
GET    /api/v1/barrios/?ciudad={id}                   — barrios por ciudad

GET    /api/v1/pacientes/                             — listar pacientes (?search=, ?empresa=)
POST   /api/v1/pacientes/                             — crear paciente
PATCH  /api/v1/pacientes/{id}/                        — editar paciente
DELETE /api/v1/pacientes/{id}/                        — eliminar paciente

GET    /api/v1/jornadas/                              — listar jornadas (?empresa=, ?estado=)
POST   /api/v1/jornadas/                              — crear jornada (auto-genera visitas para todos los activos)
PATCH  /api/v1/jornadas/{id}/cambiar_estado/          — cambiar estado (PROGRAMADA/EN_CURSO/FINALIZADA/CANCELADA)
POST   /api/v1/jornadas/{id}/agregar_funcionario/     — agregar funcionario a jornada existente

GET    /api/v1/visitas/                               — listar visitas (?paciente=, ?jornada=, ?estado_general=)
POST   /api/v1/visitas/                               — crear visita individual
GET    /api/v1/visitas/{id}/estado_derivaciones/      — estado del flujo de servicios
GET    /api/v1/visitas/{id}/resumen_completo/         — resumen de toda la visita

POST   /api/v1/enfermeria/                            — crear evaluación enfermería
POST   /api/v1/enfermeria/{id}/completar/             — completar y derivar al siguiente
POST   /api/v1/nutricion/                             — crear evaluación nutrición
POST   /api/v1/nutricion/{id}/completar/
POST   /api/v1/odontologia/                           — crear evaluación odontología
POST   /api/v1/odontologia/{id}/completar/
POST   /api/v1/psicologia/                            — crear evaluación psicología
POST   /api/v1/psicologia/{id}/completar/
POST   /api/v1/medicina/                              — crear evaluación medicina
POST   /api/v1/medicina/{id}/completar/               — completar y cerrar visita

GET    /api/v1/derivaciones/                          — listar derivaciones (?visita=id)

GET    /api/v1/indicadores/                           — indicadores de salud BI (?empresa=id opcional)
GET    /api/v1/ranking-empresas/                      — ranking de morbilidad por empresa (top 10)
GET    /api/v1/publico/indicadores/{token}/           — indicadores públicos por token (sin auth)
```

### Acceso RRHH (link mágico)
- Cada empresa tiene un campo `token_acceso` (UUID único) generado automáticamente
- El encargado de RRHH recibe un link `/acceso/{token}` o un QR descargable como PNG
- La página pública muestra indicadores de salud de su empresa sin login ni sidebar
- El token se puede regenerar desde el detalle de empresa (invalida el link anterior)
- El QR se descarga como `qr-acceso-{nombre-empresa}.png` listo para compartir por WhatsApp
- Implementado con `QRCodeCanvas` (qrcode.react) para permitir `canvas.toDataURL()`

### Lógica de negocio importante
- Al crear una `JornadaClinica`, se auto-crean `Visita` para cada funcionario activo de la empresa
- Al crear una `Visita`, se auto-crean 5 registros `Derivacion` (uno por servicio)
- El flujo es secuencial: ENFERMERIA(1) → NUTRICION(2) → ODONTOLOGIA(3) → PSICOLOGIA(4) → MEDICINA(5)
- No se puede iniciar un servicio si el anterior no está COMPLETADO
- Al completar MEDICINA, la visita se marca como COMPLETADO
- IMC se calcula automáticamente en `EvaluacionEnfermeria.save()`
- AUDIT-C se calcula automáticamente en `EvaluacionPsicologia.save()`
- FINDRISC se calcula en `EvaluacionMedicina.save()` sumando puntos
- Índice de morbilidad laboral (0-100): HTA×25 + DBT×20 + ECV×20 + (obesidad+sobrepeso)×15 + no_apto×10 + estrés×5 + FINDRISC_alto×5

### Geografía Paraguay
- Fuente: DGEEC censo (INE) — archivo `backend/geo.json` (CSV semicolon-separated)
- 18 departamentos, 174+ ciudades, 6000+ barrios cargados en DB
- Luque: 48 barrios (28 oficiales municipales + 20 del censo)
- Asunción: 75 barrios oficiales

### Datos demo
- Empresa: "Industrias Paraguarí S.A." — ID: `be15f105-9e30-4e34-8df1-dc7420acb6f0`
- 25 empleados con evaluaciones completas (3 perfiles de riesgo: alto/moderado/bajo)
- 1 jornada FINALIZADA con visitas completas

### Credenciales DB
- PostgreSQL — DB: `medicina_preventiva`, user: `postgres`, host: `localhost:5432`

### Comandos para levantar el backend
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

---

## FRONTEND WEB ✅ EN PROGRESO

### Archivos clave
- `frontend/src/middleware.ts` — redirige `/` → `/login` a nivel de red
- `frontend/src/app/page.tsx` — retorna null (redirect manejado por middleware)
- `frontend/src/app/login/page.tsx` — página de login
- `frontend/src/app/dashboard/layout.tsx` — layout con sidebar
- `frontend/src/app/dashboard/page.tsx` — dashboard BI completo
- `frontend/src/app/dashboard/empresas/page.tsx` — CRUD empresas + modal funcionarios
- `frontend/src/app/dashboard/empresas/[id]/page.tsx` — detalle empresa con jornadas
- `frontend/src/app/dashboard/visitas/page.tsx` — jornadas con timeline de derivaciones
- `frontend/src/app/dashboard/visitas/[id]/enfermeria/page.tsx` — wizard 6 pasos
- `frontend/src/app/dashboard/visitas/[id]/nutricion/page.tsx` — wizard 3 pasos
- `frontend/src/app/dashboard/visitas/[id]/odontologia/page.tsx` — wizard 3 pasos
- `frontend/src/app/dashboard/visitas/[id]/psicologia/page.tsx` — wizard 3 pasos con AUDIT-C
- `frontend/src/app/dashboard/visitas/[id]/medicina/page.tsx` — wizard 6 pasos con FINDRISC y HEARTS
- `frontend/src/app/acceso/[token]/page.tsx` — página pública RRHH (sin login)
- `frontend/src/app/dashboard/visitas/[id]/resumen/page.tsx` — resumen completo con impresión
- `frontend/src/services/api.ts` — cliente axios con interceptors
- `frontend/src/services/empresas.ts` — CRUD empresas
- `frontend/src/services/pacientes.ts` — CRUD pacientes
- `frontend/src/services/visitas.ts` — visitasService + jornadasService
- `frontend/src/services/evaluaciones.ts` — crear/completar evaluaciones por servicio
- `frontend/src/services/geografia.ts` — departamentos, ciudades, barrios
- `frontend/src/types/index.ts` — todos los tipos TypeScript
- `frontend/src/stores/authStore.ts` — store Zustand para auth

### Dependencias instaladas
```
axios, react-hook-form, zod, @hookform/resolvers
zustand, recharts
qrcode.react
shadcn/ui: button, input, card, form, label, select, badge, separator, dialog, alert-dialog, table, tabs
```

### Comandos para levantar el frontend
```bash
cd frontend
npm run dev
# abre http://localhost:3000
```

### Páginas completadas
- [x] Login
- [x] Dashboard BI — indicadores HTA, DBT, IMC, FINDRISC, HEARTS, AUDIT, estrés, salud bucal, hábitos, aptitud laboral, ranking empresas
- [x] /dashboard/empresas — CRUD completo
  - Tabla con búsqueda por nombre y RUC
  - Crear, editar, desactivar empresas
  - Modal "Ver funcionarios" (ancho responsive `w-[95vw] max-w-5xl`)
  - Modal "Ver informe" por paciente (última visita)
  - Botón "Ver detalle" → página de empresa
- [x] /dashboard/empresas/[id] — detalle empresa
  - Stats: funcionarios activos, jornadas finalizadas/en curso/programadas
  - Tab Funcionarios: tabla con CRUD (agregar, eliminar)
  - Tab Visitas: jornadas colapsables con funcionarios anidados
  - Tab Información: datos de la empresa
  - Botones cambio de estado de jornada: Iniciar / Finalizar / Cancelar
  - Formulario nuevo funcionario con geografía en cascada
  - Formulario nueva jornada (auto-genera visitas para todos los activos)
  - Botón "Acceso RRHH" — genera token, muestra modal con QR descargable (PNG) y link copiable
  - Botón "Regenerar link" para invalidar el acceso anterior
- [x] /acceso/[token] — página pública RRHH (sin login, sin sidebar)
  - Muestra nombre y rubro de la empresa
  - Stats: HTA%, DBT%, sobrepeso/obesidad%, aptos laborales%
  - Gráfico distribución IMC con IMC promedio
  - Gráfico distribución estrés EVA con promedio
  - Indicadores de salud bucal y hábitos
- [x] /dashboard/visitas — jornadas clínicas
  - Filtros por empresa y estado
  - Jornadas colapsables con tabla de funcionarios
  - Botones cambio de estado: Iniciar / Finalizar / Cancelar
  - Modal timeline de derivaciones por visita (con botón "Iniciar" por servicio)
  - Botón "Ver reporte" → resumen completo
- [x] /dashboard/visitas/[id]/enfermeria — wizard 6 pasos
  - PA sistólica/diastólica, peso/talla (IMC en tiempo real), FC/cintura
  - Antecedentes ECV, renal, HTA, DBT (triestado), medicación, observaciones
- [x] /dashboard/visitas/[id]/nutricion — wizard 3 pasos
  - Actividad física, frutas/verduras, comidas/día, agua/día
  - Diagnóstico nutricional y plan de alimentación
- [x] /dashboard/visitas/[id]/odontologia — wizard 3 pasos
  - Boca sana/rehabilitada, periodontal, caries, piezas dentales
  - Observaciones clínicas y tratamiento recomendado
- [x] /dashboard/visitas/[id]/psicologia — wizard 3 pasos
  - EVA estrés (0-10), AUDIT-C (puntaje en tiempo real)
  - Diagnóstico psicológico y recomendaciones
- [x] /dashboard/visitas/[id]/medicina — wizard 6 pasos
  - Glucemia/HbA1c, función tiroidea, función renal
  - Estudios complementarios (ECG, PAP, mamografía, ecografía prostática)
  - FINDRISC (puntaje en tiempo real), HEARTS, diagnóstico final, aptitud laboral
- [x] /dashboard/visitas/[id]/resumen — resumen completo
  - Todas las secciones con datos de cada servicio
  - Botón imprimir (CSS print)

### Flujo de trabajo completo
1. Crear empresa → agregar funcionarios
2. En detalle de empresa → crear Jornada Clínica (auto-genera visitas)
3. Cambiar estado jornada: PROGRAMADA → EN_CURSO
4. En /dashboard/visitas → abrir timeline de visita → Iniciar servicio
5. Completar wizard de cada servicio (navega automáticamente al siguiente)
6. Al completar Medicina → visita COMPLETADA
7. Cambiar estado jornada: EN_CURSO → FINALIZADA
8. Ver resumen individual o dashboard BI

### Bugs corregidos
- "Negative timestamp" en SSR → resuelto con `middleware.ts` para redirect `/` → `/login`
- "Uncontrolled input" en Select → resuelto con `|| undefined` en valores y `defaultValues` completos
- Modal "Ver funcionarios" no mostraba datos → `pacientesService.listar` recibía el filtro como `search` en vez de `params`
- Sort por fecha en modal informe → `Visita` no tiene campo `fecha`, se usa `jornada_fecha`
- `<button>` anidado dentro de `<button>` (hydration error) → cabeceras de jornada cambiadas a `<div>` con `cursor-pointer`
- Campo `profesional` en evaluaciones con `null=True` pero `blank=False` → marcado como `read_only` en todos los serializers
- QR descargable → usar `QRCodeCanvas` en vez de `QRCodeSVG` para acceder a `canvas.toDataURL()`
- Migración `token_acceso` con datos existentes → truncar tablas de empresa y recrear datos demo

---

## MOBILE ⏳ PENDIENTE

### Plan
- Usar Expo Router para navegación
- Misma API Django
- Mismo store Zustand (compartir lógica)
- Enfocado en el flujo de evaluaciones para profesionales en campo

### Pantallas planificadas
- [ ] Login
- [ ] Lista de visitas del día
- [ ] Flujo de evaluación por servicio
- [ ] Timeline de derivaciones

---

## PRODUCCIÓN ⏳ PENDIENTE (Ubuntu + Nginx)

### Plan de deploy
1. Instalar dependencias en Ubuntu (Python, Node, PostgreSQL, Nginx)
2. Clonar repositorio
3. Configurar venv y variables de entorno
4. Configurar Gunicorn como servicio systemd
5. Build del frontend Next.js
6. Configurar Nginx como reverse proxy
7. Configurar SSL con Certbot

### Configuración Gunicorn (systemd)
```ini
# /etc/systemd/system/medicina.service
[Unit]
Description=Medicina Preventiva Django
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/MedicinaPreventia/backend
ExecStart=/home/ubuntu/MedicinaPreventia/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/medicina.sock \
    config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

### Configuración Nginx
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location /api/ {
        proxy_pass http://unix:/run/medicina.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /home/ubuntu/MedicinaPreventia/frontend/.next;
        try_files $uri $uri/ /_next/static/$uri /index.html;
    }

    location /static/ {
        alias /home/ubuntu/MedicinaPreventia/backend/staticfiles/;
    }
}
```

---

## Notas importantes
- El archivo `.env` nunca se sube a git
- La contraseña de la BD está en `backend/.env`
- El superusuario de Django se crea con `python manage.py createsuperuser`
- Para crear un usuario profesional, crear User desde admin y asignarle PerfilUsuario con rol y `servicios_autorizados`
- `servicios_autorizados` es un JSONField con lista de strings, ejemplo: `["ENFERMERIA"]`
- La geografía completa está en `backend/backup_geografia.sql` — restaurar con `psql medicina_preventiva < backup_geografia.sql`
