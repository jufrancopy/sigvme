from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import EmpresaViewSet, DepartamentoViewSet, CiudadViewSet, BarrioViewSet, PacienteViewSet, JornadaClinicaViewSet, VisitaViewSet, PerfilUsuarioViewSet
from core.auth_views import LoginView, LogoutView
from evaluaciones.views import (
    EvaluacionEnfermeriaViewSet, EvaluacionNutricionViewSet, EvaluacionOdontologiaViewSet,
    EvaluacionPsicologiaViewSet, EvaluacionMedicinaViewSet, indicadores_salud, ranking_empresas,
    indicadores_por_token
)
from derivaciones.views import DerivacionViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet)
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'ciudades', CiudadViewSet)
router.register(r'barrios', BarrioViewSet)
router.register(r'pacientes', PacienteViewSet)
router.register(r'jornadas', JornadaClinicaViewSet)
router.register(r'visitas', VisitaViewSet)
router.register(r'perfiles', PerfilUsuarioViewSet)
router.register(r'derivaciones', DerivacionViewSet)
router.register(r'enfermeria', EvaluacionEnfermeriaViewSet)
router.register(r'nutricion', EvaluacionNutricionViewSet)
router.register(r'odontologia', EvaluacionOdontologiaViewSet)
router.register(r'psicologia', EvaluacionPsicologiaViewSet)
router.register(r'medicina', EvaluacionMedicinaViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/login/', LoginView.as_view()),
    path('api/v1/auth/logout/', LogoutView.as_view()),
    path('api/v1/indicadores/', indicadores_salud),
    path('api/v1/ranking-empresas/', ranking_empresas),
    path('api/v1/publico/indicadores/<str:token>/', indicadores_por_token),
]
