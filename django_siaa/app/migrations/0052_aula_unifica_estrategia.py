from django.db import migrations
from django.db.models import Q


def copiar_estrategia(apps, schema_editor):
    # A 0049 criou "estrategia_metodologica" e a 0048 criou "estrategia_abordada"
    # para o mesmo dado. O código usa só "estrategia_abordada", então o que já
    # foi lançado no campo antigo é levado para o novo antes de removê-lo.
    Aula = apps.get_model("app", "Aula")
    for aula in Aula.objects.exclude(estrategia_metodologica="").filter(
        Q(estrategia_abordada="") | Q(estrategia_abordada__isnull=True)
    ):
        aula.estrategia_abordada = aula.estrategia_metodologica
        aula.save(update_fields=["estrategia_abordada"])


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0051_atividadeenvio"),
    ]

    operations = [
        migrations.RunPython(copiar_estrategia, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="aula",
            name="estrategia_metodologica",
        ),
    ]
