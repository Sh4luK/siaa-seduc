from django.test import TestCase
from django.http import JsonResponse
import json

from .models import Sessao
from .views import _criar_sessao_e_setar_cookie


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
