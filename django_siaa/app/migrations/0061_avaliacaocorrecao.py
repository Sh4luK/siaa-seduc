import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0060_remove_responsavel_cpf_remove_responsavel_telefone"),
    ]

    operations = [
        migrations.CreateModel(
            name="AvaliacaoCorrecao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("imagem", models.ImageField(blank=True, null=True, upload_to="avaliacoes/correcoes/")),
                ("nota", models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("aluno", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="correcoes_avaliacoes", to="app.estudante")),
                ("avaliacao", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="correcoes", to="app.avaliacao")),
            ],
            options={
                "unique_together": {("avaliacao", "aluno")},
            },
        ),
    ]
