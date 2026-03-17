import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import json
from core.models import Empresa, Paciente
from core.serializers import EmpresaSerializer

print(f"Total empresas: {Empresa.objects.count()}")
print(f"Total pacientes: {Paciente.objects.count()}")

empresas = Empresa.objects.all()
data = EmpresaSerializer(empresas, many=True).data
print(json.dumps(data, indent=2))
