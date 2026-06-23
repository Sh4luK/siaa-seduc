from django.contrib import admin
from django.urls import path, include
import app.views
urlpatterns = [
    path("admin/", admin.site.urls),
    path("", app.views.index, name="index"),
    path("api/login/", app.views.login_api, name="login"),
    path("api/register/", app.views.register_api, name="register"),
    path("adm/login", app.views.AdminApiLoginSuperUser, name="admLogin")
    # path("api/auth/", app.views.protected_api, name="protected"),
]
