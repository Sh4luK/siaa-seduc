from django.contrib import admin
from django.urls import path, include
import app.views
urlpatterns = [
    path("admin/", admin.site.urls),
    path("", app.views.index, name="index"),
    path("api/students", app.views.view_students, name="students"),
    path('api/students/search', app.views.search_student, name='general_student_search'),
    path("api/students/login", app.views.login_student, name="login_student"),
    path("api/students/auth", app.views.auth_student, name="auth_student"),
    path("api/teacher/login", app.views.login_teacher, name="login_teacher")
]
