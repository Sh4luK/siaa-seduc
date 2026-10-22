from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from app.atividade_visto import regenerar_pdf_visto
from app.models import AtividadeEnvio


class Command(BaseCommand):
    help = "Regenera os PDFs de vistos existentes com o layout atual."

    def add_arguments(self, parser):
        parser.add_argument(
            "--base-url",
            required=True,
            help="URL pública do backend, por exemplo https://api.siaa.example",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Gera e valida os PDFs sem salvar as alterações.",
        )

    def handle(self, *args, **options):
        chave = settings.SIAA_VISTO_SECRET
        if len(chave) < 32:
            raise CommandError("SIAA_VISTO_SECRET deve ter pelo menos 32 caracteres.")

        envios = AtividadeEnvio.objects.filter(
            visto_emitido_em__isnull=False,
        ).exclude(visto_pdf="")
        total = envios.count()
        atualizados = 0
        falhas = 0

        for envio in envios.iterator():
            url_verificacao = (
                f"{options['base_url'].rstrip('/')}/api/vistos/{envio.id}/verificar"
                "?hash=__HASH__"
            )
            try:
                pdf = regenerar_pdf_visto(envio, chave, url_verificacao)
            except ValueError as error:
                falhas += 1
                self.stderr.write(self.style.ERROR(f"Envio {envio.id}: {error}"))
                continue

            if not options["dry_run"]:
                nome = envio.visto_pdf.name.rsplit("/", 1)[-1]
                envio.visto_pdf.save(nome, ContentFile(pdf), save=False)
                envio.save(update_fields=["visto_pdf"])
            atualizados += 1

        modo = "validados" if options["dry_run"] else "atualizados"
        self.stdout.write(f"PDFs {modo}: {atualizados}/{total}; falhas: {falhas}.")
        if falhas:
            raise CommandError("Alguns PDFs não puderam ser regenerados.")
