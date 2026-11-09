import phonenumbers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

User = get_user_model()

MAX_PASSWORD_LENGTH = 128


def _text(value):
    return value.strip() if isinstance(value, str) else ""


def _user_payload(user):
    return {
        "id": user.id,
        "email": user.email,
        "phone": str(user.phone) if user.phone else None,
        "country": user.country,
        "role": user.role,
        "date_joined": user.date_joined.isoformat(),
    }


def _normalize_phone(raw, country):
    """Rudisha namba kwa muundo wa E.164, au None ikiwa si sahihi."""
    try:
        parsed = phonenumbers.parse(raw, country)
    except phonenumbers.NumberParseException:
        return None
    if not phonenumbers.is_valid_number(parsed):
        return None
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


class RegisterView(APIView):
    authentication_classes = []  # hakuna session kwa ombi hili, kwa hiyo CSRF haihitajiki
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        data = request.data
        if not hasattr(data, "get"):
            return Response(
                {"detail": "Invalid request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = _text(data.get("email")).lower()
        phone_raw = _text(data.get("phone"))
        country = _text(data.get("country")).upper()
        password = data.get("password")
        repeat = data.get("repeat_password")
        errors = {}

        # Role HAISOMWI kutoka kwenye ombi kamwe. Kila akaunti mpya ni creator.

        # Email
        if not email:
            errors["email"] = ["This field is required."]
        elif len(email) > 254:
            errors["email"] = ["Email is too long."]
        else:
            try:
                validate_email(email)
            except ValidationError:
                errors["email"] = ["Enter a valid email address."]
            else:
                if User.objects.filter(email__iexact=email).exists():
                    errors["email"] = ["An account with this email already exists."]

        # Country
        if not country:
            errors["country"] = ["This field is required."]
        elif country not in phonenumbers.SUPPORTED_REGIONS:
            errors["country"] = ["Enter a valid 2-letter country code."]

        # Phone
        phone = None
        if not phone_raw:
            errors["phone"] = ["This field is required."]
        elif "country" not in errors:
            phone = _normalize_phone(phone_raw, country)
            if phone is None:
                errors["phone"] = ["Enter a valid phone number."]
            elif User.objects.filter(phone=phone).exists():
                errors["phone"] = ["An account with this phone number already exists."]

        # Password
        if not isinstance(password, str) or not password:
            errors["password"] = ["This field is required."]
        elif len(password) > MAX_PASSWORD_LENGTH:
            errors["password"] = [
                f"Password must be at most {MAX_PASSWORD_LENGTH} characters."
            ]
        else:
            try:
                validate_password(password, user=User(email=email))
            except ValidationError as e:
                errors["password"] = list(e.messages)

        if repeat is not None and repeat != password:
            errors["repeat_password"] = ["Passwords don't match."]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    phone=phone,
                    country=country,
                    role=User.Role.CREATOR,
                )
        except IntegrityError:
            # Mtu mwingine alisajili email au namba hiyo wakati huo huo
            return Response(
                {"detail": "An account with these details already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response({"user": _user_payload(user)}, status=status.HTTP_201_CREATED)