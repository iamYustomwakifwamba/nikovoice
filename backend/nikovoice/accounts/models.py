from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        if extra_fields["is_staff"] is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields["is_superuser"] is not True:
            raise ValueError("Superuser must have is_superuser=True")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CREATOR = "creator", "Creator"
        ADMIN = "admin", "Admin"

    email = models.EmailField("email address", max_length=254, unique=True)
    phone = PhoneNumberField("phone number", unique=True, null=True, blank=True)
    country = models.CharField(
        max_length=2,
        blank=True,
        validators=[
            RegexValidator(
                r"^[A-Z]{2}$", "Use a 2-letter ISO country code, for example TZ."
            )
        ],
        help_text="ISO 3166-1 alpha-2 code, for example TZ.",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CREATOR,
        db_index=True,
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # createsuperuser inauliza email na password tu

    class Meta:
        ordering = ["-date_joined"]
        verbose_name = "user"
        verbose_name_plural = "users"

    @property
    def is_creator(self):
        return self.role == self.Role.CREATOR

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN

    def save(self, *args, **kwargs):
        self.email = self.email.strip().lower()
        if self.country:
            self.country = self.country.upper()
        if self.is_superuser:
            self.role = self.Role.ADMIN  # superuser daima ni admin
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email