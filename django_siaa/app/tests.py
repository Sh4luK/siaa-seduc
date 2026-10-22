from django.test import TestCase
from django.http import JsonResponse
import json
from decimal import Decimal
from unittest.mock import patch

from .models import AtravessaPor, Comunicado, Conteudo, Disciplina, Nota, Professor, Sessao
from .views import _criar_sessao_e_setar_cookie


class NotaCalculationTests(TestCase):
    def test_rpt_replaces_nm3_when_nm3_is_below_six(self):
        nota = Nota(
            nm1_t1=Decimal("7"), nm2_t1=Decimal("7"), nm3_t1=Decimal("4"),
            rpt_t1=Decimal("8"),
        )

        nota.calcular()

        self.assertEqual(nota.nm3_t1, Decimal("8"))
        self.assertEqual(nota.mtf_t1, Decimal("7.3"))

    def test_rpt_replaces_nm3_when_trimester_average_is_below_six(self):
        nota = Nota(
            nm1_t1=Decimal("2"), nm2_t1=Decimal("2"), nm3_t1=Decimal("9"),
            rpt_t1=Decimal("8"),
        )

        nota.calcular()

        self.assertEqual(nota.nm3_t1, Decimal("8"))
        self.assertEqual(nota.mtf_t1, Decimal("4.0"))

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
