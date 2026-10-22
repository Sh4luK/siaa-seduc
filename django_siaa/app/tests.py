from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from io import BytesIO
import json
from decimal import Decimal
import tempfile
from unittest.mock import patch
from pypdf import PdfReader

from .models import (
    Atividade,
    AtividadeEnvio,
    AtravessaPor,
    Comunicado,
    Conteudo,
    Disciplina,
    Estudante,
    Nota,
    Professor,
    Sessao,
)
from .atividade_visto import gerar_pdf_visto, regenerar_pdf_visto
from .views import _criar_sessao_e_setar_cookie, resolver_disciplina_da_turma


class NotaCalculationTests(TestCase):
    def test_rpt_replaces_nm3_when_nm3_is_below_six(self):
        nota = Nota(
            nm1_t1=Decimal("7"), nm2_t1=Decimal("7"), nm3_t1=Decimal("4"),
            rpt_t1=Decimal("8"),
        )

        nota.calcular()

        # A NM3 original fica gravada; a RPT só entra no cálculo da MTF
        self.assertEqual(nota.nm3_t1, Decimal("4"))
        self.assertEqual(nota.mt_t1, Decimal("6.0"))
        self.assertEqual(nota.mtf_t1, Decimal("7.3"))

    def test_rpt_replaces_nm3_when_trimester_average_is_below_six(self):
        nota = Nota(
            nm1_t1=Decimal("2"), nm2_t1=Decimal("2"), nm3_t1=Decimal("9"),
            rpt_t1=Decimal("8"),
        )

        nota.calcular()

        self.assertEqual(nota.nm3_t1, Decimal("9"))
        self.assertEqual(nota.mt_t1, Decimal("4.3"))
        self.assertEqual(nota.mtf_t1, Decimal("4.0"))

    def test_mt_and_mtf_are_equal_without_recovery(self):
        nota = Nota(nm1_t1=Decimal("7"), nm2_t1=Decimal("8"), nm3_t1=Decimal("9"))

        nota.calcular()

        self.assertEqual(nota.mt_t1, Decimal("8.0"))
        self.assertEqual(nota.mtf_t1, Decimal("8.0"))

    def test_mtf_uses_three_assessment_grades_and_ma_and_maf_are_weighted(self):
        nota = Nota(
            nm1_t1=Decimal("9"), nm2_t1=Decimal("9"), nm3_t1=Decimal("9"),
            rpt_t1=Decimal("2"),
            nm1_t2=Decimal("6"), nm2_t2=Decimal("6"), nm3_t2=Decimal("6"),
            nm1_t3=Decimal("3"), nm2_t3=Decimal("3"), nm3_t3=Decimal("3"),
            pf=Decimal("8"),
        )

        nota.calcular()

        self.assertEqual(nota.mtf_t1, Decimal("9.0"))
        self.assertEqual(nota.ma, Decimal("6.0"))
        self.assertEqual(nota.maf, Decimal("6.8"))

    def test_maf_equals_ma_when_final_exam_is_not_entered(self):
        nota = Nota(
            nm1_t1=Decimal("7"), nm2_t1=Decimal("7"), nm3_t1=Decimal("7"),
            nm1_t2=Decimal("8"), nm2_t2=Decimal("8"), nm3_t2=Decimal("8"),
            nm1_t3=Decimal("9"), nm2_t3=Decimal("9"), nm3_t3=Decimal("9"),
        )

        nota.calcular()

        self.assertEqual(nota.ma, Decimal("8.0"))
        self.assertEqual(nota.maf, Decimal("8.0"))


class ConteudoCreationTests(TestCase):
    @patch("app.views.resolver_disciplina_da_turma")
    def test_creates_content_for_each_selected_teacher_class(self, resolver_disciplina):
        professor = Professor.objects.create(nome_completo="Professor Teste")
        disciplina = Disciplina.objects.create(nome_disciplina="Matemática")
        turma_a = AtravessaPor.objects.create(professor=professor, turma="Turma A")
        turma_b = AtravessaPor.objects.create(professor=professor, turma="Turma B")
        resolver_disciplina.return_value = disciplina

        response = self.client.post(
            "/api/teacher/conteudos/criar",
            {
                "professor": professor.id,
                "turmas": [str(turma_a.id), str(turma_b.id)],
                "titulo": "Conteúdo de teste",
                "descricao": "Descrição",
                "data": "2026-10-21",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Conteudo.objects.count(), 2)
        self.assertEqual(
            set(Conteudo.objects.values_list("turma_id", flat=True)),
            {turma_a.id, turma_b.id},
        )
        self.assertEqual(len(response.json()["conteudos"]), 2)


class AtividadeCreationTests(TestCase):
    @patch("app.views.resolver_disciplina_da_turma")
    def test_creates_activity_for_each_selected_teacher_class(self, resolver_disciplina):
        professor = Professor.objects.create(nome_completo="Professor Teste")
        disciplina = Disciplina.objects.create(nome_disciplina="Matemática")
        turma_a = AtravessaPor.objects.create(professor=professor, turma="Turma A")
        turma_b = AtravessaPor.objects.create(professor=professor, turma="Turma B")
        resolver_disciplina.return_value = disciplina

        response = self.client.post(
            "/api/teacher/atividades/criar",
            {
                "professor": professor.id,
                "turmas": [str(turma_a.id), str(turma_b.id)],
                "titulo": "Atividade de teste",
                "descricao": "Descrição",
                "data": "2026-10-21",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Atividade.objects.count(), 2)
        self.assertEqual(
            set(Atividade.objects.values_list("turma_id", flat=True)),
            {turma_a.id, turma_b.id},
        )
        self.assertEqual(len(response.json()["atividades"]), 2)


class DisciplinaResolverTests(TestCase):
    def test_resolves_subject_when_accents_or_unicode_normalization_differ(self):
        disciplina = Disciplina.objects.create(nome_disciplina="INTELIGÊNCIA ARTIFICIAL")
        professor = Professor.objects.create(nome_completo="Professor Teste")
        turma = AtravessaPor.objects.create(
            professor=professor,
            turma="EMTPDES-SIS-2ª SERIE - INTEGRAL-I-A",
            disciplina_lecionada="INTELIGENCIA ARTIFICIAL",
        )

        self.assertEqual(resolver_disciplina_da_turma(turma), disciplina)

        turma.disciplina_lecionada = "Intelige\u0302ncia Artificial"
        self.assertEqual(resolver_disciplina_da_turma(turma), disciplina)


class AtividadeEnvioTests(TestCase):
    def setUp(self):
        # ignore_cleanup_errors: no Windows o arquivo lido no teste pode seguir aberto
        self.media_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.addCleanup(self.media_dir.cleanup)
        self.media_settings = override_settings(MEDIA_ROOT=self.media_dir.name)
        self.media_settings.enable()
        self.addCleanup(self.media_settings.disable)

        self.professor = Professor.objects.create(nome_completo="Professor Teste")
        self.aluno = Estudante.objects.create(
            nome_completo="Aluno Teste",
            turma="Turma A",
        )
        self.turma = AtravessaPor.objects.create(
            professor=self.professor,
            turma=self.aluno.turma,
        )
        self.disciplina = Disciplina.objects.create(nome_disciplina="Matemática")
        self.atividade = Atividade.objects.create(
            professor=self.professor,
            turma=self.turma,
            disciplina=self.disciplina,
            titulo="Atividade de teste",
            data="2026-10-21",
        )
        self.sessao_aluno = Sessao.objects.create(
            tipo="ALUNO",
            referencia_id=self.aluno.id,
            nome_completo=self.aluno.nome_completo,
        )
        self.sessao_professor = Sessao.objects.create(
            tipo="PROFESSOR",
            referencia_id=self.professor.id,
            nome_completo=self.professor.nome_completo,
        )

    def test_visto_pdf_has_compact_header_and_stamp_on_summary_page(self):
        resposta = self.enviar_arquivo("atividade.txt", b"conteudo do envio")
        self.assertEqual(resposta.status_code, 200)
        envio = AtividadeEnvio.objects.get()
        envio.comentario = "**Resposta _destacada_**\n\n- Primeiro item\n- Segundo item"
        envio.save(update_fields=["comentario"])

        resultado = gerar_pdf_visto(
            envio=envio,
            professor=self.professor,
            parecer="Bom trabalho.",
            chave="x" * 32,
            url_verificacao="https://siaa.example/api/vistos/1/verificar?hash=__HASH__",
        )

        pdf = PdfReader(BytesIO(resultado["pdf"]))
        self.assertEqual(len(pdf.pages), 2)
        capa = pdf.pages[0].extract_text()
        self.assertIn("Registro de atividade", capa)
        self.assertIn("VISTO", capa)
        self.assertIn("Atividade de teste", capa)
        self.assertIn("HMAC-SHA256", capa)
        self.assertIn("COMPROVANTE DE ENVIO E CORREÇÃO", capa)
        self.assertIn("COMENTÁRIO DO ALUNO", capa)
        self.assertIn("Resposta", capa)
        self.assertIn("destacada", capa)
        self.assertIn("Primeiro item", capa)
        self.assertNotIn("**Resposta", capa)
        self.assertNotIn("- Primeiro item", capa)

        envio.visto_emitido_em = timezone.now()
        envio.visto_assinatura = resultado["assinatura"]
        envio.visto_dados = resultado["dados"]
        pdf_atualizado = regenerar_pdf_visto(
            envio,
            "x" * 32,
            "https://siaa.example/api/vistos/1/verificar?hash=__HASH__",
        )
        pdf_atualizado = PdfReader(BytesIO(pdf_atualizado))
        self.assertEqual(len(pdf_atualizado.pages), 2)
        self.assertIn(resultado["assinatura"], pdf_atualizado.pages[0].extract_text())
        self.assertEqual(envio.visto_assinatura, resultado["assinatura"])

    def enviar_arquivo(self, nome, conteudo):
        self.client.cookies["aluno_session"] = self.sessao_aluno.token
        return self.client.post(
            f"/api/students/atividades/{self.atividade.id}/enviar",
            {
                "arquivo": SimpleUploadedFile(nome, conteudo),
                "comentario": "Segue minha atividade.",
            },
        )

    def test_student_needs_teacher_approval_before_replacing_submission(self):
        primeira_resposta = self.enviar_arquivo("primeira.txt", b"primeira versao")
        self.assertEqual(primeira_resposta.status_code, 200)
        primeira_envio_id = primeira_resposta.json()["envio"]["id"]

        segunda_resposta = self.enviar_arquivo("segunda.txt", b"segunda versao")
        self.assertEqual(segunda_resposta.status_code, 409)
        self.assertEqual(AtividadeEnvio.objects.count(), 1)
        envio = AtividadeEnvio.objects.get()
        self.assertEqual(envio.id, primeira_envio_id)
        self.assertEqual(envio.arquivo.read(), b"primeira versao")

        resposta_solicitacao = self.client.post(
            f"/api/students/atividades/{self.atividade.id}/solicitar-alteracao"
        )
        self.assertEqual(resposta_solicitacao.status_code, 200)
        envio.refresh_from_db()
        self.assertEqual(envio.alteracao_status, "SOLICITADA")

        resposta_aluno = self.client.get("/api/students/atividades")
        self.assertEqual(resposta_aluno.status_code, 200)
        self.assertEqual(resposta_aluno.json()["atividades"][0]["envio"]["id"], envio.id)

        self.client.cookies["professor_session"] = self.sessao_professor.token
        resposta_professor = self.client.get(
            f"/api/teacher/atividades/{self.atividade.id}/envios"
        )
        self.assertEqual(resposta_professor.status_code, 200)
        self.assertEqual(resposta_professor.json()["envios"][0]["aluno"], self.aluno.nome_completo)
        self.assertEqual(resposta_professor.json()["envios"][0]["alteracao_status"], "SOLICITADA")

        resposta_decisao = self.client.post(
            f"/api/teacher/atividades/{self.atividade.id}/envios/{envio.id}/solicitacao",
            data=json.dumps({"acao": "aprovar"}),
            content_type="application/json",
        )
        self.assertEqual(resposta_decisao.status_code, 200)

        segunda_resposta = self.enviar_arquivo("segunda.txt", b"segunda versao")
        self.assertEqual(segunda_resposta.status_code, 200)
        self.assertEqual(AtividadeEnvio.objects.count(), 1)
        envio.refresh_from_db()
        self.assertEqual(envio.id, primeira_envio_id)
        self.assertEqual(envio.arquivo.read(), b"segunda versao")
        self.assertEqual(envio.alteracao_status, "NENHUMA")

    def test_teacher_can_deny_edit_request_and_student_must_ask_again(self):
        self.assertEqual(self.enviar_arquivo("atividade.txt", b"versao inicial").status_code, 200)
        self.assertEqual(
            self.client.post(
                f"/api/students/atividades/{self.atividade.id}/solicitar-alteracao"
            ).status_code,
            200,
        )
        envio = AtividadeEnvio.objects.get()

        self.client.cookies["professor_session"] = self.sessao_professor.token
        resposta = self.client.post(
            f"/api/teacher/atividades/{self.atividade.id}/envios/{envio.id}/solicitacao",
            data=json.dumps({"acao": "negar"}),
            content_type="application/json",
        )
        self.assertEqual(resposta.status_code, 200)
        envio.refresh_from_db()
        self.assertEqual(envio.alteracao_status, "NEGADA")

        self.client.cookies["aluno_session"] = self.sessao_aluno.token
        self.assertEqual(self.enviar_arquivo("outra.txt", b"nao autorizado").status_code, 409)
        self.assertEqual(
            self.client.post(
                f"/api/students/atividades/{self.atividade.id}/solicitar-alteracao"
            ).status_code,
            200,
        )

    def test_student_can_open_only_their_own_submission_details(self):
        resposta = self.enviar_arquivo("atividade.txt", b"versao inicial")
        envio_id = resposta.json()["envio"]["id"]

        lista = self.client.get("/api/students/envios")
        self.assertEqual(lista.status_code, 200)
        self.assertEqual(len(lista.json()["envios"]), 1)
        self.assertEqual(lista.json()["envios"][0]["arquivo_nome"], "atividade.txt")
        self.assertEqual(lista.json()["envios"][0]["comentario"], "Segue minha atividade.")
        self.assertEqual(lista.json()["envios"][0]["atividade"]["id"], self.atividade.id)

        detalhe = self.client.get(f"/api/students/envios/{envio_id}")
        self.assertEqual(detalhe.status_code, 200)
        self.assertEqual(detalhe.json()["atividade"]["id"], self.atividade.id)
        self.assertEqual(detalhe.json()["envio"]["id"], envio_id)

        outro_aluno = Estudante.objects.create(nome_completo="Outro aluno", turma="Turma A")
        sessao_outro_aluno = Sessao.objects.create(
            tipo="ALUNO",
            referencia_id=outro_aluno.id,
            nome_completo=outro_aluno.nome_completo,
        )
        self.client.cookies["aluno_session"] = sessao_outro_aluno.token
        self.assertEqual(
            self.client.get("/api/students/envios").json()["envios"],
            [],
        )
        self.assertEqual(
            self.client.get(f"/api/students/envios/{envio_id}").status_code,
            404,
        )

    def test_student_cannot_submit_for_an_activity_outside_their_class(self):
        outra_turma = AtravessaPor.objects.create(
            professor=self.professor,
            turma="Turma B",
        )
        outra_atividade = Atividade.objects.create(
            professor=self.professor,
            turma=outra_turma,
            disciplina=self.disciplina,
            titulo="Outra atividade",
            data="2026-10-21",
        )
        self.client.cookies["aluno_session"] = self.sessao_aluno.token

        response = self.client.post(
            f"/api/students/atividades/{outra_atividade.id}/enviar",
            {"arquivo": SimpleUploadedFile("envio.txt", b"conteudo")},
        )

        self.assertEqual(response.status_code, 404)
        self.assertFalse(AtividadeEnvio.objects.exists())


class AtividadeQuestoesEDevolutivaTests(TestCase):
    def setUp(self):
        self.professor = Professor.objects.create(nome_completo="Professor Teste")
        self.aluno = Estudante.objects.create(nome_completo="Aluno Teste", turma="Turma A")
        self.turma_a = AtravessaPor.objects.create(professor=self.professor, turma="Turma A")
        self.turma_b = AtravessaPor.objects.create(professor=self.professor, turma="Turma B")
        self.disciplina = Disciplina.objects.create(nome_disciplina="Matemática")
        self.sessao_aluno = Sessao.objects.create(
            tipo="ALUNO", referencia_id=self.aluno.id, nome_completo=self.aluno.nome_completo
        )
        self.sessao_professor = Sessao.objects.create(
            tipo="PROFESSOR", referencia_id=self.professor.id, nome_completo=self.professor.nome_completo
        )

    def criar_atividade(self, questoes):
        with patch("app.views.resolver_disciplina_da_turma", return_value=self.disciplina):
            return self.client.post(
                "/api/teacher/atividades/criar",
                {
                    "professor": self.professor.id,
                    "turmas": [str(self.turma_a.id), str(self.turma_b.id)],
                    "titulo": "Atividade na plataforma",
                    "data": "2026-10-22",
                    "questoes": json.dumps(questoes),
                },
            )

    def questoes_padrao(self):
        return [
            {
                "enunciado": "Quanto é 2 + 2?",
                "tipo": "OBJETIVA",
                "alternativas": [
                    {"texto": "3", "correta": False},
                    {"texto": "4", "correta": True},
                    {"texto": "", "correta": False},
                ],
            },
            {"enunciado": "Explique a soma.", "tipo": "SUBJETIVA", "alternativas": []},
        ]

    def enviar_respostas(self, atividade, respostas):
        self.client.cookies["aluno_session"] = self.sessao_aluno.token
        with patch("app.views.resolver_disciplina_da_turma", return_value=self.disciplina):
            return self.client.post(
                f"/api/students/atividades/{atividade.id}/enviar",
                {"respostas": json.dumps(respostas)},
            )

    def test_creates_questions_without_file_for_each_selected_class(self):
        response = self.criar_atividade(self.questoes_padrao())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Atividade.objects.count(), 2)
        for atividade in Atividade.objects.all():
            self.assertFalse(atividade.arquivo)
            self.assertEqual(atividade.questoes.count(), 2)
            objetiva = atividade.questoes.get(tipo="OBJETIVA")
            # alternativa em branco é descartada
            self.assertEqual(objetiva.alternativas.count(), 2)

    def test_rejects_objective_question_without_one_correct_answer(self):
        questoes = self.questoes_padrao()
        questoes[0]["alternativas"][1]["correta"] = False

        response = self.criar_atividade(questoes)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Atividade.objects.exists())

    def test_student_answers_on_platform_and_teacher_sees_answers(self):
        self.criar_atividade(self.questoes_padrao())
        atividade = Atividade.objects.get(turma=self.turma_a)
        objetiva = atividade.questoes.get(tipo="OBJETIVA")
        subjetiva = atividade.questoes.get(tipo="SUBJETIVA")
        certa = objetiva.alternativas.get(correta=True)

        incompleta = self.enviar_respostas(
            atividade, [{"questao_id": objetiva.id, "alternativa_id": certa.id}]
        )
        self.assertEqual(incompleta.status_code, 400)

        envio_resp = self.enviar_respostas(atividade, [
            {"questao_id": objetiva.id, "alternativa_id": certa.id},
            {"questao_id": subjetiva.id, "texto": "Juntando as quantidades."},
        ])
        self.assertEqual(envio_resp.status_code, 200)
        # sem arquivo e sem gabarito para o aluno antes da correção
        envio_json = envio_resp.json()["envio"]
        self.assertIsNone(envio_json["arquivo_url"])
        self.assertNotIn("correta", envio_json["respostas"][0])
        lista_aluno = self.client.get("/api/students/atividades").json()["atividades"][0]
        self.assertNotIn("correta", lista_aluno["questoes"][0]["alternativas"][0])

        envio = AtividadeEnvio.objects.get()
        self.client.cookies["professor_session"] = self.sessao_professor.token
        envios = self.client.get(f"/api/teacher/atividades/{atividade.id}/envios").json()["envios"]
        self.assertEqual(envios[0]["id"], envio.id)
        self.assertEqual(envios[0]["acertos"], 1)
        self.assertEqual(envios[0]["total_objetivas"], 1)

    def test_submission_without_file_receives_signed_visto(self):
        self.criar_atividade(self.questoes_padrao())
        atividade = Atividade.objects.get(turma=self.turma_a)
        objetiva = atividade.questoes.get(tipo="OBJETIVA")
        subjetiva = atividade.questoes.get(tipo="SUBJETIVA")
        self.enviar_respostas(atividade, [
            {"questao_id": objetiva.id, "alternativa_id": objetiva.alternativas.get(correta=True).id},
            {"questao_id": subjetiva.id, "texto": "Juntando as quantidades."},
        ])
        envio = AtividadeEnvio.objects.get()
        self.assertFalse(envio.arquivo)

        media_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.addCleanup(media_dir.cleanup)
        self.client.cookies["professor_session"] = self.sessao_professor.token
        with override_settings(MEDIA_ROOT=media_dir.name, SIAA_VISTO_SECRET="x" * 32):
            url = f"/api/teacher/atividades/{atividade.id}/envios/{envio.id}/corrigir"
            fora = self.client.post(
                url, json.dumps({"parecer": "ok", "nota": "11"}), content_type="application/json"
            )
            self.assertEqual(fora.status_code, 400)

            correcao = self.client.post(
                url,
                json.dumps({"parecer": "Muito bem!", "nota": "8,5"}),
                content_type="application/json",
            )
            self.assertEqual(correcao.status_code, 200, correcao.content)
            self.assertEqual(correcao.json()["nota"], 8.5)
            envio.refresh_from_db()
            self.assertEqual(envio.visto_dados["arquivo_nome"], f"respostas_envio_{envio.id}.txt")
            self.assertEqual(envio.nota, Decimal("8.50"))
            self.assertEqual(envio.visto_dados["nota"], "8.50")

            with envio.visto_pdf.open("rb") as arquivo_pdf:
                capa = PdfReader(arquivo_pdf).pages[0].extract_text()
            self.assertIn("NOTA", capa)
            self.assertIn("8,5", capa)

            verificacao = self.client.get(
                f"/api/vistos/{envio.id}/verificar", {"hash": envio.visto_assinatura}
            )
            self.assertEqual(verificacao.json(), {"valido": True, "nota": 8.5})

            # nota alterada fora da correção: o visto deixa de valer
            AtividadeEnvio.objects.filter(id=envio.id).update(nota=Decimal("10"))
            adulterado = self.client.get(
                f"/api/vistos/{envio.id}/verificar", {"hash": envio.visto_assinatura}
            )
            self.assertFalse(adulterado.json()["valido"])

    def test_other_teacher_cannot_give_visto(self):
        self.criar_atividade(self.questoes_padrao())
        atividade = Atividade.objects.get(turma=self.turma_a)
        envio = AtividadeEnvio.objects.create(atividade=atividade, aluno=self.aluno, comentario="ok")

        outro = Professor.objects.create(nome_completo="Outro Professor")
        sessao_outro = Sessao.objects.create(
            tipo="PROFESSOR", referencia_id=outro.id, nome_completo=outro.nome_completo
        )
        self.client.cookies["professor_session"] = sessao_outro.token
        with override_settings(SIAA_VISTO_SECRET="x" * 32):
            alheio = self.client.post(
                f"/api/teacher/atividades/{atividade.id}/envios/{envio.id}/corrigir",
                json.dumps({"parecer": "ok"}),
                content_type="application/json",
            )
        self.assertEqual(alheio.status_code, 404)


class ProfessorComunicadoTests(TestCase):
    def setUp(self):
        self.professor = Professor.objects.create(nome_completo="Professor Teste")
        self.sessao = Sessao.objects.create(
            tipo="PROFESSOR",
            referencia_id=self.professor.id,
            nome_completo=self.professor.nome_completo,
        )
        self.client.cookies["professor_session"] = self.sessao.token

    def test_professor_can_create_announcement_for_assigned_class(self):
        turma = AtravessaPor.objects.create(professor=self.professor, turma="Turma A")

        response = self.client.post(
            "/api/teacher/comunicados/criar",
            data=json.dumps({
                "professor": self.professor.id,
                "turma": turma.id,
                "titulo": "Aviso da turma",
                "mensagem": "Mensagem de teste",
                "data": "2026-10-21",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        comunicado = Comunicado.objects.get()
        self.assertEqual(comunicado.professor, self.professor)
        self.assertEqual(comunicado.turma, turma)

    def test_professor_cannot_create_announcement_for_unassigned_class(self):
        outro_professor = Professor.objects.create(nome_completo="Outro Professor")
        turma = AtravessaPor.objects.create(professor=outro_professor, turma="Outra Turma")

        response = self.client.post(
            "/api/teacher/comunicados/criar",
            data=json.dumps({
                "professor": self.professor.id,
                "turma": turma.id,
                "titulo": "Aviso indevido",
                "mensagem": "Mensagem de teste",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertFalse(Comunicado.objects.exists())


class SessionCookieTests(TestCase):
    def test_profile_cookie_expires_after_three_hours(self):
        response = JsonResponse({"return": True})

        _criar_sessao_e_setar_cookie(response, "ALUNO", 1, "Aluno Teste")

        self.assertEqual(response.cookies["aluno_session"]["max-age"], 3 * 60 * 60)

    def test_session_status_returns_expiration_time(self):
        sessao = Sessao.objects.create(
            tipo="ALUNO",
            referencia_id=1,
            nome_completo="Aluno Teste",
        )
        self.client.cookies["aluno_session"] = sessao.token

        response = self.client.get("/api/session/status?tipo=ALUNO")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["return"])
        self.assertIn("expires_at", response.json())
        self.assertGreater(response.json()["expires_in"], 3 * 60 * 60 - 60)

    def test_expired_session_is_rejected_by_auth_and_status_alike(self):
        # Antes, /api/teacher/auth aceitava a sessão vencida e /api/session/status
        # recusava: o painel e o login ficavam redirecionando um para o outro.
        professor = Professor.objects.create(nome_completo="Professor Teste")
        sessao = Sessao.objects.create(
            tipo="PROFESSOR", referencia_id=professor.id, nome_completo=professor.nome_completo
        )
        Sessao.objects.filter(id=sessao.id).update(
            criado_em=timezone.now() - timedelta(hours=3, minutes=1)
        )
        self.client.cookies["professor_session"] = sessao.token

        auth = self.client.get("/api/teacher/auth").json()
        status = self.client.get("/api/session/status?tipo=PROFESSOR").json()

        self.assertFalse(auth["return"])
        self.assertFalse(status["return"])
        self.assertFalse(Sessao.objects.filter(id=sessao.id).exists())

    def test_session_within_three_hours_is_accepted_by_auth_and_status(self):
        professor = Professor.objects.create(nome_completo="Professor Teste")
        sessao = Sessao.objects.create(
            tipo="PROFESSOR", referencia_id=professor.id, nome_completo=professor.nome_completo
        )
        Sessao.objects.filter(id=sessao.id).update(
            criado_em=timezone.now() - timedelta(hours=2, minutes=59)
        )
        self.client.cookies["professor_session"] = sessao.token

        self.assertTrue(self.client.get("/api/teacher/auth").json()["return"])
        self.assertTrue(self.client.get("/api/session/status?tipo=PROFESSOR").json()["return"])


class LogoutApiTests(TestCase):
    def test_logout_deletes_session_and_clears_profile_cookie(self):
        sessao = Sessao.objects.create(
            tipo="ALUNO",
            referencia_id=1,
            nome_completo="Aluno Teste",
        )
        self.client.cookies["aluno_session"] = sessao.token

        response = self.client.post(
            "/api/logout",
            data=json.dumps({"tipo": "ALUNO"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Sessao.objects.filter(pk=sessao.pk).exists())
        self.assertEqual(response.cookies["aluno_session"]["max-age"], 0)

    def test_blog_logout_deletes_blog_session(self):
        sessao = Sessao.objects.create(
            tipo="PROFESSOR",
            referencia_id=1,
            nome_completo="Professor Teste",
        )
        self.client.cookies["blog_session"] = sessao.token

        response = self.client.post(
            "/api/logout",
            data=json.dumps({"tipo": "BLOG"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Sessao.objects.filter(pk=sessao.pk).exists())
        self.assertEqual(response.cookies["blog_session"]["max-age"], 0)

    def test_logout_rejects_unknown_session_type(self):
        response = self.client.post(
            "/api/logout",
            data=json.dumps({"tipo": "DESCONHECIDO"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
