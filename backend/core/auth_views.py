from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)

        perfil = None
        try:
            perfil = user.perfil
        except Exception:
            pass

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'rol': perfil.rol if perfil else None,
                'servicios_autorizados': perfil.servicios_autorizados if perfil else [],
            }
        })


class LogoutView(APIView):
    def post(self, request):
        request.user.auth_token.delete()
        return Response({'status': 'ok'})
