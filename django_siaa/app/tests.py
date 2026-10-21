from django.test import TestCase
import json

from .models import Sessao


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
