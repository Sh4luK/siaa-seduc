from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0053_atividade_questoes_e_devolutiva"),
        ("app", "0053_atividadeenvio_visto"),
    ]

    operations = [
        migrations.AddField(
            model_name="atividadeenvio",
            name="respostas_livres",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
