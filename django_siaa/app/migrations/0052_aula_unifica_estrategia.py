from django.db import migrations
from django.db.models import Q


def copiar_e_remover_estrategia_antiga(apps, schema_editor):
    # A 0049 criou "estrategia_metodologica" e a 0048 criou "estrategia_abordada"
    # para o mesmo dado. O código usa só "estrategia_abordada", então o que já
    # foi lançado no campo antigo é levado para o novo antes de removê-lo.
    Aula = apps.get_model("app", "Aula")
    campo_antigo = Aula._meta.get_field("estrategia_metodologica")
    with schema_editor.connection.cursor() as cursor:
        colunas = {
            coluna.name
            for coluna in schema_editor.connection.introspection.get_table_description(
                cursor, Aula._meta.db_table
            )
        }

    if campo_antigo.column in colunas:
        for aula in Aula.objects.exclude(estrategia_metodologica="").filter(
            Q(estrategia_abordada="") | Q(estrategia_abordada__isnull=True)
        ):
            aula.estrategia_abordada = aula.estrategia_metodologica
            aula.save(update_fields=["estrategia_abordada"])
        schema_editor.remove_field(Aula, campo_antigo)


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0051_atividadeenvio"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    copiar_e_remover_estrategia_antiga,
                    migrations.RunPython.noop,
                ),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name="aula",
                    name="estrategia_metodologica",
                ),
            ],
        ),
    ]
