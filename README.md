# SIGVME — Sistema de Gestión de Visitas Médicas Empresariales

Sistema integral para la gestión de jornadas de medicina preventiva en empresas. Permite registrar, gestionar y analizar evaluaciones de salud de funcionarios a través de un flujo clínico secuencial multi-disciplinario.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend API | Django 6 + Django REST Framework + PostgreSQL |
| Frontend Web | Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui |
| Mobile | React Native + Expo *(en desarrollo)* |
| Servidor | Ubuntu + Nginx + Gunicorn |
| Auth | Token Authentication (DRF) |
| Estado | Zustand |
| Gráficos | Recharts |
| Formularios | React Hook Form + Zod |

---

## Estructura del proyecto

```
sigvme/
├── backend/          # Django REST API
├── frontend/         # Panel web Next.js
├── mobile/           # App móvil Expo (en desarrollo)
├── nginx/            # Configuración Nginx
└── scripts/          # Scripts de deploy
```

---

## Funcionalidades principales

### Gestión de empresas
- CRUD completo de empresas con RUC, rubro y datos de contacto
- Gestión de funcionarios con geografía en cascada (departamento → ciudad → barrio)
- Acceso RRHH mediante link mágico (token UUID) con QR descargable en PNG
- Dashboard de indicadores de salud por empresa

### Jornadas clínicas
- Creación de jornadas que auto-generan visitas para todos los funcionarios activos
- Estados: `PROGRAMADA → EN_CURSO → FINALIZADA / CANCELADA`
- Agregar funcionarios a jornadas existentes

### Flujo de evaluaciones (secuencial)
```
ENFERMERÍA → NUTRICIÓN → ODONTOLOGÍA → PSICOLOGÍA → MEDICINA
```
Cada servicio debe completarse antes de habilitar el siguiente. Al completar Medicina, la visita se cierra automáticamente.

### Evaluaciones por servicio

| Servicio | Indicadores clave |
|----------|------------------|
| Enfermería | PA, peso/talla, IMC automático, FC, cintura, antecedentes |
| Nutrición | Actividad física, hábitos alimentarios, diagnóstico nutricional |
| Odontología | Boca sana/rehabilitada, periodontal, caries, piezas dentales |
| Psicología | EVA estrés (0-10), AUDIT-C automático, diagnóstico |
| Medicina | Glucemia, HbA1c, función tiroidea/renal, FINDRISC, HEARTS, aptitud laboral |

### Dashboard BI
- Indicadores: HTA, DBT, IMC, FINDRISC, HEARTS, AUDIT-C, estrés, salud bucal, aptitud laboral
- Ranking de morbilidad por empresa (top 10)
- Índice de morbilidad laboral (0-100)

### Acceso RRHH (sin login)
- Cada empresa tiene un token UUID único
- Link público `/acceso/{token}` con indicadores de salud de la empresa
- QR descargable como PNG para compartir por WhatsApp
- Token regenerable desde el panel (invalida el acceso anterior)

---

## API Endpoints

```
POST   /api/v1/auth/login/
POST   /api/v1/auth/logout/

GET    /api/v1/empresas/
POST   /api/v1/empresas/
PATCH  /api/v1/empresas/{id}/
POST   /api/v1/empresas/{id}/desactivar/
POST   /api/v1/empresas/{id}/generar_token/

GET    /api/v1/departamentos/
GET    /api/v1/ciudades/?departamento={id}
GET    /api/v1/barrios/?ciudad={id}

GET    /api/v1/pacientes/
POST   /api/v1/pacientes/
PATCH  /api/v1/pacientes/{id}/
DELETE /api/v1/pacientes/{id}/

GET    /api/v1/jornadas/
POST   /api/v1/jornadas/
PATCH  /api/v1/jornadas/{id}/cambiar_estado/
POST   /api/v1/jornadas/{id}/agregar_funcionario/

GET    /api/v1/visitas/
GET    /api/v1/visitas/{id}/estado_derivaciones/
GET    /api/v1/visitas/{id}/resumen_completo/

POST   /api/v1/enfermeria/
POST   /api/v1/enfermeria/{id}/completar/
POST   /api/v1/nutricion/
POST   /api/v1/nutricion/{id}/completar/
POST   /api/v1/odontologia/
POST   /api/v1/odontologia/{id}/completar/
POST   /api/v1/psicologia/
POST   /api/v1/psicologia/{id}/completar/
POST   /api/v1/medicina/
POST   /api/v1/medicina/{id}/completar/

GET    /api/v1/derivaciones/
GET    /api/v1/indicadores/
GET    /api/v1/ranking-empresas/
GET    /api/v1/publico/indicadores/{token}/   ← sin autenticación
```

---

## Instalación local

### Requisitos
- Python 3.12+
- Node.js 20+
- PostgreSQL 12+

### Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Crear base de datos
createdb sigvme

# Migraciones
python manage.py migrate

# Cargar geografía Paraguay (18 depto, 174+ ciudades, 6000+ barrios)
psql sigvme < backup_geografia.sql

# Crear superusuario
python manage.py createsuperuser

python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL

npm run dev
# http://localhost:3000
```

---

## Deploy en producción (Ubuntu + Nginx)

### 1. Clonar el repositorio

```bash
git clone https://github.com/jufrancopy/sigvme.git /var/www/sigvme
cd /var/www/sigvme
```

### 2. Backend con Gunicorn

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn

cp .env.example .env
# Editar .env: DEBUG=False, SECRET_KEY segura, ALLOWED_HOSTS, DB_HOST=localhost

python manage.py migrate
python manage.py collectstatic --noinput
```

Crear servicio systemd `/etc/systemd/system/sigvme.service`:

```ini
[Unit]
Description=SIGVME Django API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/sigvme/backend
EnvironmentFile=/var/www/sigvme/backend/.env
ExecStart=/var/www/sigvme/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/sigvme.sock \
    config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sigvme
sudo systemctl start sigvme
```

### 3. Frontend con PM2

```bash
cd /var/www/sigvme/frontend
npm install
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL=https://tu-dominio.com/api/v1

npm run build
sudo npm install -g pm2
pm2 start npm --name sigvme-frontend -- start
pm2 save
pm2 startup
```

### 4. Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location /api/ {
        proxy_pass http://unix:/run/sigvme.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static/ {
        alias /var/www/sigvme/backend/staticfiles/;
    }

    location /media/ {
        alias /var/www/sigvme/backend/media/;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sigvme /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL con Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

---

## Variables de entorno

### Backend (`backend/.env`)

```env
DEBUG=False
SECRET_KEY=clave-secreta-segura
ALLOWED_HOSTS=tu-dominio.com

DB_NAME=sigvme
DB_USER=postgres
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=https://tu-dominio.com
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api/v1
```

---

## Usuarios y roles

Los usuarios se crean desde el admin de Django (`/admin/`) y se les asigna un `PerfilUsuario` con:

- `rol`: `ADMIN`, `MEDICO`, `ENFERMERO`, `NUTRICIONISTA`, `ODONTOLOGO`, `PSICOLOGO`
- `servicios_autorizados`: lista JSON de servicios habilitados, ej: `["ENFERMERIA"]`

---

## Geografía Paraguay

La base incluye datos geográficos completos:
- 18 departamentos
- 174+ ciudades
- 6.000+ barrios

Fuente: DGEEC / INE — Censo Nacional de Paraguay.

Para restaurar: `psql sigvme < backend/backup_geografia.sql`

---

## Lógica de negocio

- **IMC** se calcula automáticamente al guardar `EvaluacionEnfermeria`
- **AUDIT-C** se calcula automáticamente al guardar `EvaluacionPsicologia`
- **FINDRISC** se calcula automáticamente al guardar `EvaluacionMedicina`
- **Índice de morbilidad laboral** (0-100): `HTA×25 + DBT×20 + ECV×20 + (obesidad+sobrepeso)×15 + no_apto×10 + estrés×5 + FINDRISC_alto×5`
- Al crear una `JornadaClinica` se auto-crean `Visita` para cada funcionario activo
- Al crear una `Visita` se auto-crean 5 registros `Derivacion` (uno por servicio)

---

## Licencia

Proyecto privado — todos los derechos reservados.
