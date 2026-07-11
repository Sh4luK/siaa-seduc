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
    path("api/teacher/login", app.views.login_teacher, name="login_teacher"),
    path("api/teacher/auth", app.views.auth_teacher, name="authentication_teacher"),
    path("api/teacher/search", app.views.search_teacher, name="search_teacher"),
    path("api/teacher/search/turmas", app.views.get_turmas, name="get_turmas"),
    path("api/teacher/search/turma", app.views.get_turma, name="get_turma"),
    path("api/teacher/get/alunos", app.views.get_alunos_por_turma, name="get_alunos_por_turma"),
    path("api/teacher/search/disciplinas", app.views.get_disciplinas_lecionadas, name="get_disciplinas"),
]
