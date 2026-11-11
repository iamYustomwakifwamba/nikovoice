from django.urls import path

from .views.register_veiws import RegisterView
from .views.csrf_view import CsrfView
from .views.login_views import LoginView
from .views.profile_views import ProfileView
from .views.logout_view import LogoutView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("csrf/", CsrfView.as_view(), name="csrf"),
    path("login/", LoginView.as_view(), name="login"),
    path("profile/", ProfileView.as_view(), name="profile" ),
    path("logout/", LogoutView.as_view(), name="logout"),
]