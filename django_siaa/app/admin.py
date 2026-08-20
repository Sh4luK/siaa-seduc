from django.contrib import admin
from .models import HorarioAula

@admin.register(HorarioAula)
class HorarioAulaAdmin(admin.ModelAdmin):
    list_display = ("turma", "dia_semana", "hora_inicio", "hora_fim")
    list_filter = ("dia_semana",)
    search_fields = ("turma__turma", "turma__disciplina_lecionada")