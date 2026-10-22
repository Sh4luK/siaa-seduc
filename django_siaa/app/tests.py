from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.http import JsonResponse
import json
from decimal import Decimal
import tempfile
from unittest.mock import patch

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
        self.media_dir = tempfile.TemporaryDirectory()
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

    def enviar_arquivo(self, nome, conteudo):
        self.client.cookies["aluno_session"] = self.sessao_aluno.token
        return self.client.post(
            f"/api/students/atividades/{self.atividade.id}/enviar",
            {
                "arquivo": SimpleUploadedFile(nome, conteudo),
                "comentario": "Segue minha atividade.",
            },
        )

    def test_student_can_replace_submission_and_teacher_can_review_it(self):
        primeira_resposta = self.enviar_arquivo("primeira.txt", b"primeira versao")
        self.assertEqual(primeira_resposta.status_code, 200)
        primeira_envio_id = primeira_resposta.json()["envio"]["id"]

        segunda_resposta = self.enviar_arquivo("segunda.txt", b"segunda versao")
        self.assertEqual(segunda_resposta.status_code, 200)
        self.assertEqual(AtividadeEnvio.objects.count(), 1)
        envio = AtividadeEnvio.objects.get()
        self.assertEqual(envio.id, primeira_envio_id)
        self.assertEqual(envio.arquivo.read(), b"segunda versao")

        resposta_aluno = self.client.get("/api/students/atividades")
        self.assertEqual(resposta_aluno.status_code, 200)
        self.assertEqual(resposta_aluno.json()["atividades"][0]["envio"]["id"], envio.id)

        self.client.cookies["professor_session"] = self.sessao_professor.token
        resposta_professor = self.client.get(
            f"/api/teacher/atividades/{self.atividade.id}/envios"
        )
        self.assertEqual(resposta_professor.status_code, 200)
        self.assertEqual(resposta_professor.json()["envios"][0]["aluno"], self.aluno.nome_completo)

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
