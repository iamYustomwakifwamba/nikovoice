from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.middleware.csrf import get_token

from ..authentication import CsrfEnforcedSessionAuthentication
from ..utils import user_payload

MAX_PASSWORD_LENGTH = 128
INVALID = "Invalid email or password."


class LoginView(APIView):
    authentication_classes = [CsrfEnforcedSessionAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        data = request.data
        if not hasattr(data, "get"):
            return Response(
                {"detail": "Invalid request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = data.get("email")
        password = data.get("password")
        errors = {}

        if not isinstance(email, str) or not email.strip():
            errors["email"] = ["This field is required."]
        if not isinstance(password, str) or not password:
            errors["password"] = ["This field is required."]
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Usijaribu kukagua nenosiri refu mno
        if len(password) > MAX_PASSWORD_LENGTH:
            return Response({"detail": INVALID}, status=status.HTTP_401_UNAUTHORIZED)

        # ModelBackend inatafsiri "username" kama USERNAME_FIELD, yaani email
        user = authenticate(
            request, username=email.strip().lower(), password=password
        )
        if user is None:
            return Response({"detail": INVALID}, status=status.HTTP_401_UNAUTHORIZED)

        login(request, user)  # inaanzisha session mpya na kubadilisha CSRF token
        return Response({
            "user": user_payload(user),
            "csrfToken": get_token(request),
            })