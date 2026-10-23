import re
import hmac
from urllib.parse import urlparse
from urllib.parse import unquote
from urllib.parse import urlencode
from django.utils import timezone
from datetime import date, timedelta
import unicodedata
from django.db.models.functions import Replace
from django.db.models import Value
from django.db.models.functions import Trim
from django.shortcuts import render, redirect
import requests
from django.http import HttpResponse, JsonResponse, request
from django.core.files.base import ContentFile
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.conf import settings
import os
from dotenv import load_dotenv
from pathlib import Path
from .funcs import ip
from .funcs.get_ip import get_ip
from decimal import Decimal, InvalidOperation
from django.db.models.functions import Replace
from django.db.models import Value
from .models import Nota    
from .models import Estudante
from .models import Professor
from .models import AtravessaPor
from .models import Disciplina
from .models import Frequencia
from .models import Aula
from .models import Evento
from .models import Conteudo
from .models import Atividade
from .models import AtividadeEnvio
from .models import AtividadeQuestao
from .models import AtividadeAlternativa
from .models import AtividadeResposta
from .models import Comunicado
from .models import Coordenador
from .models import Advertencia
from .models import HorarioAula
from .models import Blogger
from .models import Sessao
from .models import Curtida
from .models import Comentario
from .models import Post
from .models import Admin
from .models import EstudoProgramado
from django.core.files.storage import default_storage
from .models import Avaliacao, Questao, Alternativa
from .models import MensagemChat
from .models import Conversa
from .models import VinculoResponsavel
from .models import Responsavel
from .models import ConversaResponsavelProfessor
from .models import MensagemChatResponsavelProfessor
from .models import ConversaResponsavelCoordenador
from .models import MensagemChatResponsavelCoordenador
from .models import PerfilBlog
from django.db import models, transaction
from django.urls import reverse
import json
import string
from django.templatetags.static import static
from django.template.loader import render_to_string
from django.utils.text import slugify
from django.views.decorators.http import require_http_methods
from django.db.models import Avg, Count, Q
import json
from .atividade_visto import assinatura_hmac, gerar_pdf_visto



load_dotenv()

api = os.getenv("IP_API")


# ============================================================
# AUTENTICAÇÃO POR SESSÃO/COOKIE (substitui a autenticação por IP)
# ============================================================
# Cada perfil (aluno, professor, organização, responsável, admin) tem seu
# próprio cookie de sessão, para que um mesmo navegador possa manter mais
# de um perfil logado ao mesmo tempo sem um sobrescrever o outro.
# O blog usa seu próprio cookie separado (blog_session), pois quem loga
# no blog pode ser qualquer um dos quatro tipos de usuário acima.

COOKIE_POR_TIPO = {
    "ALUNO": "aluno_session",
    "PROFESSOR": "professor_session",
    "RESPONSAVEL": "responsavel_session",
    "COORDENADOR": "coordenacao_session",
    "ADMIN": "admin_session",
}
COOKIE_MAX_AGE = 60 * 60 * 3


def _expiracao_sessao(sessao):
    return sessao.criado_em + timedelta(seconds=COOKIE_MAX_AGE)


def _sessao_ativa(sessao):
    """Sessões valem COOKIE_MAX_AGE a partir do login. Todas as verificações
    (auth de cada perfil, blog e session_status) usam esta mesma regra; se
    uma aceitasse e outra recusasse, o front ficava em loop entre o painel e o login.
    Cookies antigos (de quando a sessão durava 30 dias) caem aqui."""
    if sessao is None:
        return None
    if _expiracao_sessao(sessao) <= timezone.now():
        sessao.delete()
        return None
    return sessao


def _obter_sessao(request, tipo):
    """Lê o cookie do tipo pedido e retorna a Sessao correspondente, ou None."""
    cookie_name = COOKIE_POR_TIPO[tipo]
    token = request.COOKIES.get(cookie_name)
    if not token:
        return None
    return _sessao_ativa(Sessao.objects.filter(token=token, tipo=tipo).first())


def _criar_sessao_e_setar_cookie(response, tipo, referencia_id, nome_completo):
    """Cria uma nova Sessao e grava o cookie correspondente na resposta."""
    sessao = Sessao.objects.create(tipo=tipo, referencia_id=referencia_id, nome_completo=nome_completo)
    response.set_cookie(
        COOKIE_POR_TIPO[tipo], sessao.token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="None",
        secure=True,  # obrigatório com samesite=None sobre HTTPS (Codespaces já é HTTPS)
    )
    return sessao


@csrf_exempt
@require_http_methods(["GET"])
def session_status(request):
    tipo = request.GET.get("tipo", "").strip().upper()

    if tipo == "BLOG":
        sessao = _sessao_blog_atual(request)
    elif tipo in COOKIE_POR_TIPO:
        sessao = _obter_sessao(request, tipo)
    else:
        return JsonResponse({"return": False, "detail": "Tipo de sessão inválido."}, status=400)

    if not sessao:
        return JsonResponse({"return": False})

    expira_em = _expiracao_sessao(sessao)
    return JsonResponse({
        "return": True,
        "expires_at": expira_em.isoformat(),
        # Segundos restantes pelo relógio do servidor: o front conta a partir
        # daqui, sem depender do relógio do computador do usuário
        "expires_in": max(0, int((expira_em - timezone.now()).total_seconds())),
    })


@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"return": False, "detail": "JSON inválido."}, status=400)

    if not isinstance(body, dict) or not isinstance(body.get("tipo"), str):
        return JsonResponse({"return": False, "detail": "Tipo de sessão inválido."}, status=400)

    tipo = body["tipo"].strip().upper()
    cookie_name = "blog_session" if tipo == "BLOG" else COOKIE_POR_TIPO.get(tipo)
    if not cookie_name:
        return JsonResponse({"return": False, "detail": "Tipo de sessão inválido."}, status=400)

    token = request.COOKIES.get(cookie_name)
    if token:
        sessoes = Sessao.objects.filter(token=token)
        if tipo != "BLOG":
            sessoes = sessoes.filter(tipo=tipo)
        sessoes.delete()

    response = JsonResponse({"return": True})
    response.delete_cookie(cookie_name, samesite="None")
    return response


def _aluno_logado(request):
    sessao = _obter_sessao(request, "ALUNO")
    if not sessao:
        return None
    return Estudante.objects.filter(id=sessao.referencia_id).first()


def _professor_logado(request):
    sessao = _obter_sessao(request, "PROFESSOR")
    if not sessao:
        return None
    return Professor.objects.filter(id=sessao.referencia_id).first()


def _professor_atual(request):
    # Mesmo conceito de _professor_logado — mantido como alias para não
    # quebrar as views que já chamavam essa função pelo nome antigo.
    return _professor_logado(request)


def _coordenador_logado(request):
    sessao = _obter_sessao(request, "COORDENADOR")
    if not sessao:
        return None
    return Coordenador.objects.filter(id=sessao.referencia_id).first()


def _coordenador_atual(request):
    return _coordenador_logado(request)


def _responsavel_logado(request):
    sessao = _obter_sessao(request, "RESPONSAVEL")
    if not sessao:
        return None
    return Responsavel.objects.filter(id=sessao.referencia_id).first()


def _admin_logado(request):
    sessao = _obter_sessao(request, "ADMIN")
    if not sessao:
        return None
    return Admin.objects.filter(id=sessao.referencia_id).first()


@csrf_exempt
def index(request):
    return HttpResponse("Olá usuario! Esta é a API do SIAA.")

@csrf_exempt
def login_api(request):
    pass


@csrf_exempt
def register_api(request):
    pass

@csrf_exempt
def AdminApiLoginSuperUser(request):
    if request.method == "POST":
        data = json.loads(request.POST)
        cpf = data.get("cpf")
        password = data.get("password")
        return JsonResponse({
            cpf,
            password
        })
    else:
        return HttpResponse("error")

@csrf_exempt
def view_students(request):
    file = Path("/workspaces/siaa-seduc/infra/alunos_formatados.json")
    if not file.exists():
        file = Path(__file__).resolve().parent.parent / "alunos_formatados.json"
    
    if not file.exists():
        return JsonResponse({
            "message": "Caminho não encontrado."
        })
    
    try:
        with open(file, "r", encoding="utf-8") as data:
            data_students = json.load(data)
        
        return JsonResponse(data_students, status=200, json_dumps_params={ "ensure_ascii": False })
    
    except json.JSONDecodeError:
        return JsonResponse({
            "message": "Erro ao ler o arquivo JSON"
        })

# @csrf_exempt
def search_student(request):
    fullName = request.GET.get("fullname", "").strip().lower()

    students = Estudante.objects.all()
    if fullName:
        students = students.filter(nome_completo__icontains=fullName)

    results = [
        {
            "posicao_ordem": student.posicao_ordem,
            "nome_completo": student.nome_completo,
            "escola": student.escola,
            "serie": student.serie,
            "turma": student.turma,
            "periodo": student.periodo,
            "curso": student.curso,
        }
        for student in students
    ]

    return JsonResponse({
        "total_encontrado": len(results),
        "estudante": results
    })


@csrf_exempt
@require_http_methods(["POST"])
def login_student(request):
    body = json.loads(request.body or "{}")
    fullName = (body.get("fullname") or "").strip().upper()
    password = (body.get("password") or "").strip().lower()

    student = Estudante.objects.filter(nome_completo=fullName, senha=password).first()

    if student is None:
        return JsonResponse({
            "return": False
        })

    response = JsonResponse({
        "return": True
    })
    _criar_sessao_e_setar_cookie(response, "ALUNO", student.id, student.nome_completo)
    return response
    
    
@csrf_exempt
def auth_student(request):
    student = _aluno_logado(request)
    if student is None:
        return JsonResponse({
            "return": False
        })
    try:
        return JsonResponse({
            "student": model_to_dict(student),
            "return": True
        })
    except:
        return JsonResponse({
            "message": "Usuario nao encontrado.",
            "return": None
        })
        
    

@csrf_exempt
@require_http_methods(["POST"])
def login_teacher(request):
    body = json.loads(request.body or "{}")
    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip().upper()

    getProfessor = Professor.objects.filter(nome_completo=nome_completo, senha=senha).first()

    if getProfessor is None:
        return JsonResponse({
            "return": False
        })

    response = JsonResponse({
        "return": True
    })
    _criar_sessao_e_setar_cookie(response, "PROFESSOR", getProfessor.id, getProfessor.nome_completo)
    return response

@csrf_exempt
def auth_teacher(request):
    teacher = _professor_logado(request)
    if teacher is None:
        return JsonResponse({
            "return": False
        })
    try:
        return JsonResponse({
            "return": True,
            "teacher": model_to_dict(teacher)
        })
    except:
        return JsonResponse({
            "return": None,
            "message": "error"
        })
        
def search_teacher(request):
    nome_completo = request.GET.get("nome_completo").strip().upper()

    try:
        professor = Professor.objects.filter(nome_completo=nome_completo).first()
        professor_dict = model_to_dict(professor)
        if professor is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "return": True,
                "teacher": professor_dict
            })
    except:
        return JsonResponse({
            "return": False,
            "message": "Erro na procura do Professor."
        })

        

@csrf_exempt
def get_turmas(request):
    nome_completo = request.GET.get("nome_completo").strip().upper()
    teacher = model_to_dict(Professor.objects.filter(nome_completo=nome_completo).first())
    
    turmas = AtravessaPor.objects.filter(professor_id=teacher["id"])
    turmas_dict = [model_to_dict(turma) for turma in turmas]

    return JsonResponse({
        "professor": teacher,
        "turmas": turmas_dict
    })

@csrf_exempt
def get_disciplinas_lecionadas(request):
    nome_completo = request.GET.get("nome_completo", "").strip().upper()

    if not nome_completo:
        return JsonResponse({"detail": "O parâmetro 'nome_completo' é obrigatório."}, status=400)

    professor_instance = Professor.objects.filter(nome_completo=nome_completo).first()

    if not professor_instance:
        return JsonResponse({"detail": "Professor não encontrado."}, status=404)

    professor = model_to_dict(professor_instance)

    disciplinas_lecionadas = Disciplina.objects.filter(professores=professor["id"])
    disciplinas_lecionadas_dict = [
        model_to_dict(disciplina, exclude=["professores"])
        for disciplina in disciplinas_lecionadas
    ]

    return JsonResponse({"disciplinas": disciplinas_lecionadas_dict})


@csrf_exempt
def get_turma(request):
    turma_id = request.GET.get("turma")

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()

    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    turma_dict = model_to_dict(turma_obj)
    disciplina_id = None
    nome_disciplina = turma_dict.get("disciplina_lecionada", "").strip()

    if nome_disciplina:
        disciplina_obj = Disciplina.objects.filter(
            nome_disciplina__iexact=nome_disciplina
        ).first()

        if disciplina_obj:
            disciplina_id = disciplina_obj.id

    turma_dict["disciplina_id"] = disciplina_id

    return JsonResponse({"turma": turma_dict})

@csrf_exempt
def get_alunos_por_turma(request):
    turma = request.GET.get("turma", "")

    turma_normalizada = turma.replace(" ", "").strip().lower()

    print("Turma recebida (normalizada):", repr(turma_normalizada))

    alunos = Estudante.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=turma_normalizada)

    alunos_dict = [model_to_dict(aluno) for aluno in alunos]

    return JsonResponse({
        "alunos": alunos_dict,
        "total": len(alunos_dict)
    })


def _to_decimal(valor):
    if valor is None or valor == "":
        return None
    try:
        return Decimal(str(valor))
    except InvalidOperation:
        return None


def _mapa_tgf_por_aluno(turma, disciplina, professor, ano_letivo):
    registros = (
        Frequencia.objects.filter(
            turma=turma,
            disciplina=disciplina,
            professor=professor,
            ano_letivo=ano_letivo,
        )
        .values("aluno_id")
        .annotate(total_faltas=models.Count("id", filter=models.Q(presente=False)))
    )
    return {registro["aluno_id"]: registro["total_faltas"] for registro in registros}


def buscar_atravessapor_por_turma(nome_turma):
    nome_normalizado = (nome_turma or "").replace(" ", "").strip().lower()

    return AtravessaPor.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=nome_normalizado)

def buscar_alunos_por_turma(nome_turma):
    nome_normalizado = (nome_turma or "").replace(" ", "").strip().lower()

    alunos = Estudante.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=nome_normalizado).order_by("posicao_ordem", "nome_completo")

    return alunos


def _normalizar_texto(texto):
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(caractere for caractere in texto if not unicodedata.combining(caractere))
    return "".join(texto.split()).casefold()


def resolver_disciplina_da_turma(turma_obj):
    nome_busca = _normalizar_texto(turma_obj.disciplina_lecionada)
    if nome_busca:
        for disciplina in Disciplina.objects.all():
            if _normalizar_texto(disciplina.nome_disciplina) == nome_busca:
                return disciplina

    return None


@csrf_exempt
def get_notas_aluno(request):
    aluno_id = request.GET.get("aluno")
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")
    ano_letivo = request.GET.get("ano_letivo", "2026")

    if not all([aluno_id, turma_id, professor_id]):
        return JsonResponse(
            {"message": "Parâmetros 'aluno', 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    try:
        aluno = Estudante.objects.get(id=aluno_id)
    except Estudante.DoesNotExist:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma_obj)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nota = Nota.objects.filter(
        aluno_id=aluno_id,
        turma_id=turma_id,
        disciplina=disciplina,
        professor_id=professor_id,
        ano_letivo=ano_letivo,
    ).first()

    def campo(obj, nome):
        if obj is None:
            return None
        valor = getattr(obj, nome)
        return float(valor) if valor is not None else None

    dados = {
        "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
        "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

        "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
        "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

        "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
        "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

        "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
        "rcf": campo(nota, "rcf"),
        "tgf": nota.tgf if nota else 0,
        "rf": nota.rf if nota else "CUR",
    }

    return JsonResponse({
        "aluno": {"id": aluno.id, "nome_completo": aluno.nome_completo},
        "disciplina": {"id": disciplina.id, "nome": disciplina.nome_disciplina},
        "notas": dados,
    })


@csrf_exempt
def salvar_notas(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    aluno_id = body.get("aluno")
    turma_id = body.get("turma")
    professor_id = body.get("professor")
    ano_letivo = body.get("ano_letivo", 2026)
    campos = body.get("notas", {})

    if not all([aluno_id, turma_id, professor_id]):
        return JsonResponse(
            {"message": "Campos 'aluno', 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    try:
        aluno = Estudante.objects.get(id=aluno_id)
        turma = AtravessaPor.objects.get(id=turma_id)
        professor = Professor.objects.get(id=professor_id)
    except (Estudante.DoesNotExist, AtravessaPor.DoesNotExist, Professor.DoesNotExist):
        return JsonResponse({"message": "Aluno, turma ou professor não encontrado."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nota, _ = Nota.objects.get_or_create(
        aluno=aluno, turma=turma, disciplina=disciplina, professor=professor, ano_letivo=ano_letivo,
    )

    campos_decimais = [
        "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
        "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
        "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
        "pf", "rcf",
    ]

    erros = []
    for campo in campos_decimais:
        if campo in campos:
            valor = _to_decimal(campos[campo])
            if campos[campo] not in (None, "") and valor is None:
                erros.append(f"Valor inválido para {campo}: {campos[campo]}")
                continue
            if valor is not None and (valor < 0 or valor > 10):
                erros.append(f"{campo} fora do intervalo (0-10): {valor}")
                continue
            setattr(nota, campo, valor)

    if "tgf" in campos:
        try:
            nota.tgf = int(campos["tgf"] or 0)
        except (ValueError, TypeError):
            erros.append(f"Valor inválido para tgf: {campos['tgf']}")

    if "rf" in campos:
        rf_valido = dict(Nota.RF_CHOICES)
        if campos["rf"] in rf_valido:
            nota.rf = campos["rf"]
        else:
            erros.append(f"RF inválido: {campos['rf']}")

    nota.save()

    return JsonResponse({
        "message": "Notas salvas com sucesso.",
        "disciplina": disciplina.nome_disciplina,
        "erros": erros,
        "notas": {
            "nm3_t1": float(nota.nm3_t1) if nota.nm3_t1 is not None else None,
            "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
            "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
            "nm3_t2": float(nota.nm3_t2) if nota.nm3_t2 is not None else None,
            "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
            "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
            "nm3_t3": float(nota.nm3_t3) if nota.nm3_t3 is not None else None,
            "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
            "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
            "ma": float(nota.ma) if nota.ma is not None else None,
            "maf": float(nota.maf) if nota.maf is not None else None,
        }
    })


@csrf_exempt
def get_notas_turma(request):
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")
    ano_letivo = request.GET.get("ano_letivo", "2026")

    if not all([turma_id, professor_id]):
        return JsonResponse(
            {"message": "Parâmetros 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma_obj)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nome_turma = turma_obj.turma
    alunos = buscar_alunos_por_turma(nome_turma)
    tgf_por_aluno = _mapa_tgf_por_aluno(turma_obj, disciplina, professor_id, ano_letivo)

    def campo(obj, nome):
        if obj is None:
            return None
        valor = getattr(obj, nome)
        return float(valor) if valor is not None else None

    resultado = []

    for aluno in alunos:
        nota = Nota.objects.filter(
            aluno=aluno,
            turma_id=turma_id,
            disciplina=disciplina,
            professor_id=professor_id,
            ano_letivo=ano_letivo,
        ).first()

        resultado.append({
            "aluno_id": aluno.id,
            "posicao_ordem": aluno.posicao_ordem,
            "nome_completo": aluno.nome_completo,
            "notas": {
                "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
                "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

                "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
                "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

                "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
                "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

                "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
                "rcf": campo(nota, "rcf"),
                "tgf": tgf_por_aluno.get(aluno.id, 0),
                "rf": nota.rf if nota else "CUR",
            }
        })

    return JsonResponse({
        "turma": nome_turma,
        "disciplina": disciplina.nome_disciplina,
        "total_alunos": len(resultado),
        "alunos": resultado
    })


@csrf_exempt
def salvar_notas_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    turma_id = body.get("turma")
    professor_id = body.get("professor")
    ano_letivo = body.get("ano_letivo", 2026)
    lancamentos = body.get("lancamentos", [])

    if not all([turma_id, professor_id]):
        return JsonResponse(
            {"message": "Campos 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    if not lancamentos:
        return JsonResponse({"message": "Nenhum lançamento enviado."}, status=400)

    try:
        turma = AtravessaPor.objects.get(id=turma_id)
        professor = Professor.objects.get(id=professor_id)
    except (AtravessaPor.DoesNotExist, Professor.DoesNotExist):
        return JsonResponse({"message": "Turma ou professor não encontrado."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    campos_decimais = [
        "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
        "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
        "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
        "pf", "rcf",
    ]

    rf_valido = dict(Nota.RF_CHOICES)

    resultado_por_aluno = []
    erros_gerais = []
    tgf_por_aluno = _mapa_tgf_por_aluno(turma, disciplina, professor, ano_letivo)

    for lancamento in lancamentos:
        aluno_id = lancamento.get("aluno_id")
        campos = lancamento.get("notas", {})

        if not aluno_id:
            erros_gerais.append("Lançamento sem 'aluno_id' foi ignorado.")
            continue

        try:
            aluno = Estudante.objects.get(id=aluno_id)
        except Estudante.DoesNotExist:
            erros_gerais.append(f"Aluno com id {aluno_id} não encontrado — ignorado.")
            continue

        nota, _ = Nota.objects.get_or_create(
            aluno=aluno, turma=turma, disciplina=disciplina, professor=professor, ano_letivo=ano_letivo,
        )

        erros_aluno = []

        for campo in campos_decimais:
            if campo in campos:
                valor_bruto = campos[campo]
                if valor_bruto in (None, ""):
                    setattr(nota, campo, None)
                    continue
                try:
                    valor = Decimal(str(valor_bruto))
                except InvalidOperation:
                    erros_aluno.append(f"Valor inválido em {campo}: {valor_bruto}")
                    continue
                if valor < 0 or valor > 10:
                    erros_aluno.append(f"{campo} fora do intervalo (0-10): {valor}")
                    continue
                setattr(nota, campo, valor)

        nota.tgf = tgf_por_aluno.get(aluno.id, 0)

        if "rf" in campos:
            if campos["rf"] in rf_valido:
                nota.rf = campos["rf"]
            else:
                erros_aluno.append(f"RF inválido: {campos['rf']}")

        nota.save()

        resultado_por_aluno.append({
            "aluno_id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "erros": erros_aluno,
            "notas": {
                "nm3_t1": float(nota.nm3_t1) if nota.nm3_t1 is not None else None,
                "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
                "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
                "nm3_t2": float(nota.nm3_t2) if nota.nm3_t2 is not None else None,
                "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
                "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
                "nm3_t3": float(nota.nm3_t3) if nota.nm3_t3 is not None else None,
                "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
                "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
                "ma": float(nota.ma) if nota.ma is not None else None,
                "maf": float(nota.maf) if nota.maf is not None else None,
                "tgf": nota.tgf,
            }
        })

    return JsonResponse({
        "message": "Lançamentos processados.",
        "disciplina": disciplina.nome_disciplina,
        "erros_gerais": erros_gerais,
        "resultado": resultado_por_aluno
    })

@csrf_exempt
def get_boletim_aluno(request):
    aluno = _aluno_logado(request)

    if not aluno:
        return JsonResponse({"message": "Aluno não autenticado."}, status=401)

    ano_letivo = request.GET.get("ano_letivo", "2026")

    notas = Nota.objects.filter(
        aluno=aluno, ano_letivo=ano_letivo
    ).select_related("disciplina").order_by("disciplina__nome_disciplina")

    def campo(obj, nome):
        valor = getattr(obj, nome)
        return float(valor) if valor is not None else None

    resultado = []
    for nota in notas:
        resultado.append({
            "disciplina": nota.disciplina.nome_disciplina,
            "t1": {
                "nm1": campo(nota, "nm1_t1"), "nm2": campo(nota, "nm2_t1"), "nm3": campo(nota, "nm3_t1"),
                "mt": campo(nota, "mt_t1"), "rpt": campo(nota, "rpt_t1"), "mtf": campo(nota, "mtf_t1"),
            },
            "t2": {
                "nm1": campo(nota, "nm1_t2"), "nm2": campo(nota, "nm2_t2"), "nm3": campo(nota, "nm3_t2"),
                "mt": campo(nota, "mt_t2"), "rpt": campo(nota, "rpt_t2"), "mtf": campo(nota, "mtf_t2"),
            },
            "t3": {
                "nm1": campo(nota, "nm1_t3"), "nm2": campo(nota, "nm2_t3"), "nm3": campo(nota, "nm3_t3"),
                "mt": campo(nota, "mt_t3"), "rpt": campo(nota, "rpt_t3"), "mtf": campo(nota, "mtf_t3"),
            },
            "ma": campo(nota, "ma"),
            "pf": campo(nota, "pf"),
            "maf": campo(nota, "maf"),
            "rcf": campo(nota, "rcf"),
            "tgf": nota.tgf,
            "rf": nota.rf,
        })

    return JsonResponse({
        "aluno": {"id": aluno.id, "nome_completo": aluno.nome_completo, "turma": aluno.turma},
        "total_disciplinas": len(resultado),
        "disciplinas": resultado
    })


@csrf_exempt
def get_disciplinas_da_turma(request):
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")

    if not all([turma_id, professor_id]):
        return JsonResponse(
            {"message": "Parâmetros 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    turma_atual = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_atual:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    nome_turma = turma_atual.turma

    registros = AtravessaPor.objects.filter(
        turma=nome_turma, professor_id=professor_id
    ).order_by("disciplina_lecionada")

    disciplinas = [
        {"turma_id": r.id, "disciplina": r.disciplina_lecionada}
        for r in registros
    ]

    return JsonResponse({
        "nome_turma": nome_turma,
        "disciplinas": disciplinas
    })



@csrf_exempt
def get_frequencia_turma(request):
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")
    data_str = request.GET.get("data")

    if not all([turma_id, professor_id, data_str]):
        return JsonResponse(
            {"message": "Parâmetros 'turma', 'professor' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_selecionada = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma_obj)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nome_turma = turma_obj.turma
    alunos = buscar_alunos_por_turma(nome_turma)

    resultado = []
    for aluno in alunos:
        registro = Frequencia.objects.filter(
            aluno=aluno,
            turma_id=turma_id,
            disciplina=disciplina,
            professor_id=professor_id,
            data=data_selecionada,
        ).first()

        resultado.append({
            "aluno_id": aluno.id,
            "posicao_ordem": aluno.posicao_ordem,
            "nome_completo": aluno.nome_completo,
            "presente": registro.presente if registro else True,
        })

    aula = Aula.objects.filter(
        turma_id=turma_id, disciplina=disciplina, professor_id=professor_id, data=data_selecionada
    ).first()

    return JsonResponse({
        "turma": nome_turma,
        "disciplina": disciplina.nome_disciplina,
        "data": data_str,
        "conteudo_abordado": aula.assunto if aula else "",
        "estrategia_abordada": aula.estrategia_abordada if aula else "",
        "assunto": aula.assunto if aula else "",
        "total_alunos": len(resultado),
        "alunos": resultado
    })


@csrf_exempt
def salvar_frequencia_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    turma_id = body.get("turma")
    professor_id = body.get("professor")
    data_str = body.get("data")
    ano_letivo = body.get("ano_letivo", 2026)
    assunto = body.get("conteudo_abordado", body.get("assunto", "")) or ""
    estrategia_abordada = body.get("estrategia_abordada", "") or ""
    lancamentos = body.get("lancamentos", [])

    if not all([turma_id, professor_id, data_str]):
        return JsonResponse(
            {"message": "Campos 'turma', 'professor' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_selecionada = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    if not lancamentos:
        return JsonResponse({"message": "Nenhum lançamento enviado."}, status=400)

    try:
        turma = AtravessaPor.objects.get(id=turma_id)
        professor = Professor.objects.get(id=professor_id)
    except (AtravessaPor.DoesNotExist, Professor.DoesNotExist):
        return JsonResponse({"message": "Turma ou professor não encontrado."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )
    Aula.objects.update_or_create(
        turma=turma, disciplina=disciplina, professor=professor, data=data_selecionada,
        defaults={
            "assunto": assunto,
            "estrategia_abordada": estrategia_abordada,
            "ano_letivo": ano_letivo,
        },
    )

    erros_gerais = []
    total_salvos = 0

    for lancamento in lancamentos:
        aluno_id = lancamento.get("aluno_id")
        presente = lancamento.get("presente", True)

        if not aluno_id:
            erros_gerais.append("Lançamento sem 'aluno_id' foi ignorado.")
            continue

        try:
            aluno = Estudante.objects.get(id=aluno_id)
        except Estudante.DoesNotExist:
            erros_gerais.append(f"Aluno com id {aluno_id} não encontrado — ignorado.")
            continue

        Frequencia.objects.update_or_create(
            aluno=aluno,
            turma=turma,
            disciplina=disciplina,
            professor=professor,
            data=data_selecionada,
            defaults={"presente": bool(presente), "ano_letivo": ano_letivo},
        )
        total_salvos += 1

    return JsonResponse({
        "message": "Frequência salva com sucesso.",
        "disciplina": disciplina.nome_disciplina,
        "data": data_str,
        "total_salvos": total_salvos,
        "erros_gerais": erros_gerais,
    })



@csrf_exempt
def get_registros_frequencia(request):
    professor_id = request.GET.get("professor")
    ano_letivo = request.GET.get("ano_letivo", "2026")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    aulas = Aula.objects.filter(
        professor_id=professor_id, ano_letivo=ano_letivo
    ).select_related("turma", "disciplina").order_by("-data")

    resultado = []
    for aula in aulas:
        total_alunos = Frequencia.objects.filter(
            turma=aula.turma, disciplina=aula.disciplina, professor_id=professor_id, data=aula.data
        ).count()
        total_presentes = Frequencia.objects.filter(
            turma=aula.turma, disciplina=aula.disciplina, professor_id=professor_id, data=aula.data, presente=True
        ).count()

        resultado.append({
            "turma_id": aula.turma.id,
            "nome_turma": aula.turma.turma,
            "disciplina": aula.disciplina.nome_disciplina,
            "data": aula.data.isoformat(),
            "conteudo_abordado": aula.assunto,
            "estrategia_abordada": aula.estrategia_abordada,
            "assunto": aula.assunto,
            "total_alunos": total_alunos,
            "total_presentes": total_presentes,
            "total_faltas": total_alunos - total_presentes,
        })

    return JsonResponse({
        "total_registros": len(resultado),
        "registros": resultado
    })



@csrf_exempt
def get_eventos(request):
    professor_id = request.GET.get("professor")
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")
    turma_id = request.GET.get("turma")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    eventos = Evento.objects.filter(professor_id=professor_id).select_related("turma")

    if mes and ano:
        eventos = eventos.filter(data__year=ano, data__month=mes)
    elif ano:
        eventos = eventos.filter(data__year=ano)

    if turma_id:
        eventos = eventos.filter(turma_id=turma_id)

    resultado = [
        {
            "id": e.id,
            "titulo": e.titulo,
            "descricao": e.descricao,
            "data": e.data.isoformat(),
            "turma_id": e.turma_id,
            "nome_turma": e.turma.turma if e.turma else None,
        }
        for e in eventos
    ]

    return JsonResponse({
        "total_eventos": len(resultado),
        "eventos": resultado
    })


@csrf_exempt
def criar_evento(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    professor_id = body.get("professor")
    titulo = (body.get("titulo") or "").strip()
    descricao = (body.get("descricao") or "").strip()
    data_str = body.get("data")
    turma_id = body.get("turma")  # opcional

    if not all([professor_id, titulo, data_str]):
        return JsonResponse(
            {"message": "Campos 'professor', 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_evento = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    try:
        professor = Professor.objects.get(id=professor_id)
    except Professor.DoesNotExist:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada."}, status=404)

    evento = Evento.objects.create(
        professor=professor,
        turma=turma,
        titulo=titulo,
        descricao=descricao,
        data=data_evento,
    )

    return JsonResponse({
        "message": "Evento criado com sucesso.",
        "evento": {
            "id": evento.id,
            "titulo": evento.titulo,
            "descricao": evento.descricao,
            "data": evento.data.isoformat(),
            "turma_id": evento.turma_id,
            "nome_turma": evento.turma.turma if evento.turma else None,
        }
    })


@csrf_exempt
def deletar_evento(request, evento_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    evento = Evento.objects.filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    evento.delete()
    return JsonResponse({"message": "Evento removido com sucesso."})



def caminho_relativo_arquivo(arquivo_field):
    if not arquivo_field:
        return None

    url = arquivo_field.url
    parsed = urlparse(url)
    return parsed.path


@csrf_exempt
def get_conteudos(request):
    professor_id = request.GET.get("professor")
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")
    turma_id = request.GET.get("turma")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    conteudos = Conteudo.objects.filter(professor_id=professor_id).select_related("turma", "disciplina")

    if mes and ano:
        conteudos = conteudos.filter(data__year=ano, data__month=mes)
    elif ano:
        conteudos = conteudos.filter(data__year=ano)

    if turma_id:
        conteudos = conteudos.filter(turma_id=turma_id)

    resultado = [
        {
            "id": c.id,
            "titulo": c.titulo,
            "descricao": c.descricao,
            "data": c.data.isoformat(),
            "turma_id": c.turma_id,
            "nome_turma": c.turma.turma,
            "disciplina": c.disciplina.nome_disciplina,
            "arquivo_url": caminho_relativo_arquivo(c.arquivo),
            "arquivo_nome": c.arquivo.name.split("/")[-1] if c.arquivo else None,
        }
        for c in conteudos
    ]

    return JsonResponse({
        "total_conteudos": len(resultado),
        "conteudos": resultado
    })


@csrf_exempt
def criar_conteudo(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor_id = request.POST.get("professor")
    turmas_ids = request.POST.getlist("turmas")
    if not turmas_ids:
        turma_id = request.POST.get("turma")
        turmas_ids = [turma_id] if turma_id else []
    titulo = (request.POST.get("titulo") or "").strip()
    descricao = (request.POST.get("descricao") or "").strip()
    data_str = request.POST.get("data")
    arquivo = request.FILES.get("arquivo")

    if not all([professor_id, turmas_ids, titulo, data_str]):
        return JsonResponse(
            {"message": "Campos 'professor', 'turma(s)', 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    try:
        turmas_ids = list(dict.fromkeys(int(turma_id) for turma_id in turmas_ids))
    except (TypeError, ValueError):
        return JsonResponse({"message": "Identificador de turma inválido."}, status=400)

    try:
        data_conteudo = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    try:
        professor = Professor.objects.get(id=professor_id)
    except Professor.DoesNotExist:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    turmas = list(AtravessaPor.objects.filter(professor=professor, id__in=turmas_ids))
    if len(turmas) != len(turmas_ids):
        return JsonResponse(
            {"message": "Uma ou mais turmas não foram encontradas ou não pertencem ao professor."},
            status=404
        )

    turmas_disciplinas = []
    for turma in turmas:
        disciplina = resolver_disciplina_da_turma(turma)
        if not disciplina:
            return JsonResponse(
                {"message": f"Não foi possível resolver a disciplina da turma {turma.turma}."},
                status=404
            )
        turmas_disciplinas.append((turma, disciplina))

    conteudos = []
    for turma, disciplina in turmas_disciplinas:
        conteudo = Conteudo.objects.create(
            professor=professor,
            turma=turma,
            disciplina=disciplina,
            titulo=titulo,
            descricao=descricao,
            data=data_conteudo,
            arquivo=arquivo if not conteudos else conteudos[0].arquivo.name,
        )
        conteudos.append(conteudo)

    conteudos_serializados = [
        {
            "id": conteudo.id,
            "titulo": conteudo.titulo,
            "descricao": conteudo.descricao,
            "data": conteudo.data.isoformat(),
            "turma_id": conteudo.turma_id,
            "nome_turma": conteudo.turma.turma,
            "disciplina": conteudo.disciplina.nome_disciplina,
            "arquivo_url": caminho_relativo_arquivo(conteudo.arquivo),
        }
        for conteudo in conteudos
    ]

    return JsonResponse({
        "message": f"Conteúdo criado com sucesso em {len(conteudos)} turma(s).",
        "conteudo": conteudos_serializados[0],
        "conteudos": conteudos_serializados,
    })


@csrf_exempt
def deletar_conteudo(request, conteudo_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    conteudo = Conteudo.objects.filter(id=conteudo_id).first()
    if not conteudo:
        return JsonResponse({"message": "Conteúdo não encontrado."}, status=404)

    conteudo.delete()
    return JsonResponse({"message": "Conteúdo removido com sucesso."})



@csrf_exempt
def get_atividades(request):
    professor_id = request.GET.get("professor")
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")
    turma_id = request.GET.get("turma")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    atividades = Atividade.objects.filter(professor_id=professor_id).select_related(
        "turma", "disciplina"
    ).annotate(
        total_questoes=Count("questoes", distinct=True),
        total_envios=Count("envios", distinct=True),
        envios_sem_correcao=Count(
            "envios", filter=Q(envios__corrigido_em__isnull=True), distinct=True
        ),
    )

    if mes and ano:
        atividades = atividades.filter(data__year=ano, data__month=mes)
    elif ano:
        atividades = atividades.filter(data__year=ano)

    if turma_id:
        atividades = atividades.filter(turma_id=turma_id)

    resultado = [
        {
            "id": a.id,
            "titulo": a.titulo,
            "descricao": a.descricao,
            "data": a.data.isoformat(),
            "data_entrega": a.data_entrega.isoformat() if a.data_entrega else None,
            "turma_id": a.turma_id,
            "nome_turma": a.turma.turma,
            "disciplina": a.disciplina.nome_disciplina,
            "arquivo_url": caminho_relativo_arquivo(a.arquivo),
            "arquivo_nome": a.arquivo.name.split("/")[-1] if a.arquivo else None,
            "total_questoes": a.total_questoes,
            "total_envios": a.total_envios,
            "envios_sem_correcao": a.envios_sem_correcao,
        }
        for a in atividades
    ]

    return JsonResponse({
        "total_atividades": len(resultado),
        "atividades": resultado
    })


def _validar_questoes_atividade(bruto):
    """Lê o JSON de questões enviado na criação da atividade.
    Retorna (questoes, erro)."""
    if not bruto:
        return [], None
    try:
        questoes = json.loads(bruto)
    except json.JSONDecodeError:
        return None, "Questões em formato inválido."
    if not isinstance(questoes, list):
        return None, "Questões em formato inválido."

    validas = []
    for i, q in enumerate(questoes, start=1):
        enunciado = (q.get("enunciado") or "").strip() if isinstance(q, dict) else ""
        tipo = q.get("tipo") if isinstance(q, dict) else None
        if not enunciado:
            return None, f"Questão {i}: o enunciado é obrigatório."
        if tipo not in ("OBJETIVA", "SUBJETIVA"):
            return None, f"Questão {i}: tipo inválido."

        alternativas = []
        if tipo == "OBJETIVA":
            for alt in q.get("alternativas") or []:
                texto = (alt.get("texto") or "").strip()
                if texto:
                    alternativas.append({"texto": texto, "correta": bool(alt.get("correta"))})
            if len(alternativas) < 2:
                return None, f"Questão {i}: preencha pelo menos duas alternativas."
            if sum(a["correta"] for a in alternativas) != 1:
                return None, f"Questão {i}: marque exatamente uma alternativa correta."
        validas.append({"enunciado": enunciado, "tipo": tipo, "alternativas": alternativas})
    return validas, None


def _criar_questoes_atividade(atividade, questoes):
    for ordem, q in enumerate(questoes):
        questao = AtividadeQuestao.objects.create(
            atividade=atividade, ordem=ordem, enunciado=q["enunciado"], tipo=q["tipo"]
        )
        for i, alt in enumerate(q["alternativas"]):
            AtividadeAlternativa.objects.create(
                questao=questao, letra="ABCDEFGHIJ"[i], texto=alt["texto"], correta=alt["correta"]
            )


def _serializar_questoes_atividade(atividade, com_gabarito):
    return [
        {
            "id": q.id,
            "ordem": q.ordem,
            "enunciado": q.enunciado,
            "tipo": q.tipo,
            "alternativas": [
                {
                    "id": a.id,
                    "letra": a.letra,
                    "texto": a.texto,
                    **({"correta": a.correta} if com_gabarito else {}),
                }
                for a in q.alternativas.all()
            ],
        }
        for q in atividade.questoes.prefetch_related("alternativas").all()
    ]


def _serializar_envio_atividade(envio, atividade, com_gabarito):
    """Envio do aluno com respostas e devolutiva. O gabarito das objetivas só
    aparece para o professor ou depois que a atividade foi corrigida."""
    mostrar_gabarito = com_gabarito or envio.corrigido_em is not None
    respostas = []
    acertos = 0
    total_objetivas = 0
    for r in envio.respostas.select_related("questao", "alternativa").all():
        correta = None
        if r.questao.tipo == "OBJETIVA":
            total_objetivas += 1
            correta = bool(r.alternativa and r.alternativa.correta)
            acertos += int(correta)
        respostas.append({
            "questao_id": r.questao_id,
            "alternativa_id": r.alternativa_id,
            "texto": r.texto,
            **({"correta": correta} if mostrar_gabarito else {}),
        })

    return {
        "id": envio.id,
        "comentario": envio.comentario,
        "enviado_em": envio.enviado_em.isoformat(),
        "arquivo_url": caminho_relativo_arquivo(envio.arquivo) if envio.arquivo else None,
        "arquivo_nome": envio.arquivo.name.split("/")[-1] if envio.arquivo else None,
        "atrasado": bool(
            atividade.data_entrega
            and timezone.localdate(envio.enviado_em) > atividade.data_entrega
        ),
        "respostas": respostas,
        "respostas_livres": envio.respostas_livres,
        **({"acertos": acertos, "total_objetivas": total_objetivas} if mostrar_gabarito else {}),
        "feedback": envio.feedback,
        "nota": float(envio.nota) if envio.nota is not None else None,
        "corrigido_em": envio.corrigido_em.isoformat() if envio.corrigido_em else None,
    }


@csrf_exempt
def criar_atividade(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor_id = request.POST.get("professor")
    turmas_ids = request.POST.getlist("turmas")
    if not turmas_ids:
        turma_id = request.POST.get("turma")
        turmas_ids = [turma_id] if turma_id else []
    titulo = (request.POST.get("titulo") or "").strip()
    descricao = (request.POST.get("descricao") or "").strip()
    data_str = request.POST.get("data")
    data_entrega_str = request.POST.get("data_entrega")
    arquivo = request.FILES.get("arquivo")

    if not all([professor_id, turmas_ids, titulo, data_str]):
        return JsonResponse(
            {"message": "Campos 'professor', 'turma(s)', 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    questoes, erro_questoes = _validar_questoes_atividade(request.POST.get("questoes"))
    if erro_questoes:
        return JsonResponse({"message": erro_questoes}, status=400)

    try:
        turmas_ids = list(dict.fromkeys(int(turma_id) for turma_id in turmas_ids))
    except (TypeError, ValueError):
        return JsonResponse({"message": "Identificador de turma inválido."}, status=400)

    try:
        data_atividade = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    data_entrega = None
    if data_entrega_str:
        try:
            data_entrega = date.fromisoformat(data_entrega_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data de entrega inválido. Use AAAA-MM-DD."}, status=400)

    try:
        professor = Professor.objects.get(id=professor_id)
    except Professor.DoesNotExist:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    turmas = list(AtravessaPor.objects.filter(professor=professor, id__in=turmas_ids))
    if len(turmas) != len(turmas_ids):
        return JsonResponse(
            {"message": "Uma ou mais turmas não foram encontradas ou não pertencem ao professor."},
            status=404
        )

    turmas_disciplinas = []
    for turma in turmas:
        disciplina = resolver_disciplina_da_turma(turma)
        if not disciplina:
            return JsonResponse(
                {"message": f"Não foi possível resolver a disciplina da turma {turma.turma}."},
                status=404
            )
        turmas_disciplinas.append((turma, disciplina))

    atividades = []
    for turma, disciplina in turmas_disciplinas:
        atividade = Atividade.objects.create(
            professor=professor,
            turma=turma,
            disciplina=disciplina,
            titulo=titulo,
            descricao=descricao,
            data=data_atividade,
            data_entrega=data_entrega,
            arquivo=arquivo if not atividades else (
                atividades[0].arquivo.name if atividades[0].arquivo else None
            ),
        )
        _criar_questoes_atividade(atividade, questoes)
        atividades.append(atividade)

    atividades_serializadas = [
        {
            "id": atividade.id,
            "titulo": atividade.titulo,
            "descricao": atividade.descricao,
            "data": atividade.data.isoformat(),
            "data_entrega": atividade.data_entrega.isoformat() if atividade.data_entrega else None,
            "turma_id": atividade.turma_id,
            "nome_turma": atividade.turma.turma,
            "disciplina": atividade.disciplina.nome_disciplina,
            "arquivo_url": caminho_relativo_arquivo(atividade.arquivo),
            "total_questoes": len(questoes),
        }
        for atividade in atividades
    ]

    return JsonResponse({
        "message": f"Atividade criada com sucesso em {len(atividades)} turma(s).",
        "atividade": atividades_serializadas[0],
        "atividades": atividades_serializadas,
    })


@csrf_exempt
@require_http_methods(["GET"])
def envios_atividade_professor(request, atividade_id):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    atividade = Atividade.objects.filter(
        id=atividade_id, professor=professor
    ).select_related("turma", "disciplina").first()
    if not atividade:
        return JsonResponse({"message": "Atividade não encontrada."}, status=404)

    envios = atividade.envios.select_related("aluno").all()
    return JsonResponse({
        "atividade": {
            "id": atividade.id,
            "titulo": atividade.titulo,
            "descricao": atividade.descricao,
            "data": atividade.data.isoformat(),
            "data_entrega": atividade.data_entrega.isoformat() if atividade.data_entrega else None,
            "nome_turma": atividade.turma.turma,
            "disciplina": atividade.disciplina.nome_disciplina,
            "questoes": _serializar_questoes_atividade(atividade, com_gabarito=True),
        },
        "envios": [
            {
                # id, respostas às questões e acertos das objetivas
                **_serializar_envio_atividade(envio, atividade, com_gabarito=True),
                "aluno": envio.aluno.nome_completo,
                "comentario": envio.comentario,
                "enviado_em": envio.enviado_em.isoformat(),
                "arquivo_url": envio.arquivo.url if envio.arquivo else None,
                "arquivo_nome": envio.arquivo.name.split("/")[-1] if envio.arquivo else None,
                "respostas_livres": envio.respostas_livres,
                "alteracao_status": envio.alteracao_status,
                "alteracao_solicitada_em": (
                    envio.alteracao_solicitada_em.isoformat()
                    if envio.alteracao_solicitada_em else None
                ),
                "parecer_professor": envio.parecer_professor,
                "visto_emitido_em": (
                    envio.visto_emitido_em.isoformat()
                    if envio.visto_emitido_em else None
                ),
                "visto_assinatura": envio.visto_assinatura,
                "visto_pdf_url": envio.visto_pdf.url if envio.visto_pdf else None,
                "atrasado": bool(
                    atividade.data_entrega
                    and timezone.localdate(envio.enviado_em) > atividade.data_entrega
                ),
            }
            for envio in envios
        ],
    })


@csrf_exempt
@require_http_methods(["GET"])
def correcao_envio_atividade_professor(request, atividade_id, envio_id):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    envio = AtividadeEnvio.objects.select_related(
        "aluno", "atividade", "atividade__turma", "atividade__disciplina"
    ).filter(
        id=envio_id,
        atividade_id=atividade_id,
        atividade__professor=professor,
    ).first()
    if not envio:
        return JsonResponse({"message": "Envio não encontrado."}, status=404)

    atividade = envio.atividade
    return JsonResponse({
        "envio": {
            "id": envio.id,
            "aluno": envio.aluno.nome_completo,
            "comentario": envio.comentario,
            "enviado_em": envio.enviado_em.isoformat(),
            "arquivo_url": envio.arquivo.url if envio.arquivo else None,
            "arquivo_nome": envio.arquivo.name.split("/")[-1] if envio.arquivo else None,
            "respostas_livres": envio.respostas_livres,
            "alteracao_status": envio.alteracao_status,
            "parecer_professor": envio.parecer_professor,
            "nota": float(envio.nota) if envio.nota is not None else None,
            "visto_emitido_em": (
                envio.visto_emitido_em.isoformat()
                if envio.visto_emitido_em else None
            ),
            "visto_assinatura": envio.visto_assinatura,
            "visto_pdf_url": envio.visto_pdf.url if envio.visto_pdf else None,
        },
        "atividade": {
            "id": atividade.id,
            "titulo": atividade.titulo,
            "descricao": atividade.descricao,
            "disciplina": atividade.disciplina.nome_disciplina if atividade.disciplina else "",
            "turma": atividade.turma.turma,
            "data_entrega": atividade.data_entrega.isoformat() if atividade.data_entrega else None,
        },
    })


@csrf_exempt
@require_http_methods(["POST"])
def corrigir_envio_atividade_professor(request, atividade_id, envio_id):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)
    chave = getattr(settings, "SIAA_VISTO_SECRET", "")
    if len(chave) < 32:
        return JsonResponse(
            {"message": "A chave de assinatura do visto não está configurada corretamente no servidor."},
            status=503,
        )

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)
    if not isinstance(body, dict) or not isinstance(body.get("parecer", ""), str):
        return JsonResponse({"message": "O parecer deve ser um texto."}, status=400)
    parecer = body.get("parecer", "").strip()

    # Nota opcional de 0 a 10, aceita "8,5" ou 8.5
    nota = None
    nota_bruta = body.get("nota")
    if nota_bruta not in (None, ""):
        try:
            nota = Decimal(str(nota_bruta).replace(",", ".")).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError):
            return JsonResponse({"message": "Nota inválida."}, status=400)
        if not nota.is_finite() or nota < 0 or nota > 10:
            return JsonResponse({"message": "A nota deve ficar entre 0 e 10."}, status=400)

    with transaction.atomic():
        envio = AtividadeEnvio.objects.select_for_update().select_related(
            "aluno", "atividade", "atividade__turma", "atividade__disciplina"
        ).filter(
            id=envio_id,
            atividade_id=atividade_id,
            atividade__professor=professor,
        ).first()
        if not envio:
            return JsonResponse({"message": "Envio não encontrado."}, status=404)
        if envio.visto_emitido_em:
            return JsonResponse(
                {"message": "Este envio já recebeu um visto e não pode ser alterado."},
                status=409,
            )

        url_verificacao = request.build_absolute_uri(
            reverse("verificar_visto_envio", args=[envio.id])
        )
        try:
            resultado = gerar_pdf_visto(
                envio=envio,
                professor=professor,
                parecer=parecer,
                chave=chave,
                url_verificacao=f"{url_verificacao}?{urlencode({'hash': '__HASH__'})}",
                nota=nota,
            )
        except ValueError as error:
            return JsonResponse({"message": str(error)}, status=400)

        envio.parecer_professor = parecer
        envio.nota = nota
        envio.visto_emitido_em = resultado["assinado_em"]
        envio.visto_assinatura = resultado["assinatura"]
        envio.visto_dados = resultado["dados"]
        envio.visto_pdf.save(
            f"visto_envio_{envio.id}_{resultado['assinado_em'].strftime('%Y%m%d%H%M%S')}.pdf",
            ContentFile(resultado["pdf"]),
            save=False,
        )
        envio.save(update_fields=[
            "parecer_professor",
            "nota",
            "visto_emitido_em",
            "visto_assinatura",
            "visto_dados",
            "visto_pdf",
        ])

    return JsonResponse({
        "message": "Correção registrada e visto emitido.",
        "visto_emitido_em": envio.visto_emitido_em.isoformat(),
        "visto_assinatura": envio.visto_assinatura,
        "visto_pdf_url": envio.visto_pdf.url,
        "parecer_professor": envio.parecer_professor,
        "nota": float(envio.nota) if envio.nota is not None else None,
    })


@csrf_exempt
@require_http_methods(["GET"])
def verificar_visto_envio(request, envio_id):
    envio = AtividadeEnvio.objects.filter(id=envio_id).only(
        "visto_assinatura", "visto_dados", "visto_emitido_em", "nota"
    ).first()
    fornecida = request.GET.get("hash", "")
    chave = getattr(settings, "SIAA_VISTO_SECRET", "")
    if not envio or not envio.visto_emitido_em or len(chave) < 32 or not fornecida:
        return JsonResponse({"valido": False})

    esperada = assinatura_hmac(envio.visto_dados, chave)
    valido = (
        hmac.compare_digest(fornecida, envio.visto_assinatura)
        and hmac.compare_digest(esperada, envio.visto_assinatura)
    )

    # Vistos com nota: a nota gravada no envio tem que ser a mesma que foi assinada
    nota_assinada = envio.visto_dados.get("nota") if isinstance(envio.visto_dados, dict) else None
    if valido and nota_assinada is not None:
        nota_atual = None if envio.nota is None else f"{envio.nota:.2f}"
        valido = nota_atual == nota_assinada

    resposta = {"valido": valido}
    if valido and nota_assinada is not None:
        resposta["nota"] = float(nota_assinada)
    return JsonResponse(resposta)


@csrf_exempt
@require_http_methods(["GET"])
def detalhe_atividade_aluno(request, atividade_id):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    atividade = Atividade.objects.filter(
        id=atividade_id,
        turma__in=buscar_atravessapor_por_turma(aluno.turma),
    ).select_related("turma", "disciplina", "professor").first()
    if not atividade:
        return JsonResponse({"message": "Atividade não encontrada para esta turma."}, status=404)

    envio = AtividadeEnvio.objects.filter(atividade=atividade, aluno=aluno).first()
    dados_envio = None
    if envio:
        dados_envio = {
            **_serializar_envio_atividade(envio, atividade, com_gabarito=False),
            "comentario": envio.comentario,
            "alteracao_status": envio.alteracao_status,
            "alteracao_solicitada_em": (
                envio.alteracao_solicitada_em.isoformat()
                if envio.alteracao_solicitada_em else None
            ),
        }

    disciplina = resolver_disciplina_da_turma(atividade.turma)
    return JsonResponse({
        "atividade": {
            "id": atividade.id,
            "titulo": atividade.titulo,
            "descricao": atividade.descricao,
            "disciplina": disciplina.nome_disciplina if disciplina else atividade.turma.disciplina_lecionada,
            "turma": atividade.turma.turma,
            "professor": atividade.professor.nome_completo,
            "data_entrega": atividade.data_entrega.isoformat() if atividade.data_entrega else None,
            "arquivo_url": caminho_relativo_arquivo(atividade.arquivo) if atividade.arquivo else None,
            "arquivo_nome": atividade.arquivo.name.split("/")[-1] if atividade.arquivo else None,
            "questoes": _serializar_questoes_atividade(atividade, com_gabarito=False),
        },
        "envio": dados_envio,
    })


@csrf_exempt
@require_http_methods(["POST"])
def enviar_atividade_aluno(request, atividade_id):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    atividade = Atividade.objects.filter(
        id=atividade_id,
        turma__in=buscar_atravessapor_por_turma(aluno.turma),
    ).first()
    if not atividade:
        return JsonResponse({"message": "Atividade não encontrada para esta turma."}, status=404)

    envio = AtividadeEnvio.objects.filter(atividade=atividade, aluno=aluno).first()
    if envio and envio.corrigido_em:
        return JsonResponse(
            {"message": "Esta atividade já foi corrigida pelo professor e não pode ser reenviada."},
            status=400,
        )

    questoes = list(atividade.questoes.prefetch_related("alternativas").all())
    respostas = []
    if questoes:
        try:
            respostas_recebidas = json.loads(request.POST.get("respostas") or "[]")
        except json.JSONDecodeError:
            return JsonResponse({"message": "Respostas em formato inválido."}, status=400)
        if not isinstance(respostas_recebidas, list):
            return JsonResponse({"message": "Respostas em formato inválido."}, status=400)

        questoes_por_id = {questao.id: questao for questao in questoes}
        respostas_por_id = {}
        for resposta in respostas_recebidas:
            if not isinstance(resposta, dict):
                return JsonResponse({"message": "Resposta em formato inválido."}, status=400)
            try:
                questao_id = int(resposta.get("questao_id"))
            except (TypeError, ValueError):
                return JsonResponse({"message": "Questão inválida nas respostas."}, status=400)
            if questao_id not in questoes_por_id or questao_id in respostas_por_id:
                return JsonResponse({"message": "Questão inválida nas respostas."}, status=400)
            respostas_por_id[questao_id] = resposta

        if set(respostas_por_id) != set(questoes_por_id):
            return JsonResponse({"message": "Responda todas as questões antes de enviar."}, status=400)

        for questao in questoes:
            resposta = respostas_por_id[questao.id]
            alternativa = None
            texto = resposta.get("texto") or ""
            if not isinstance(texto, str):
                return JsonResponse(
                    {"message": f"Resposta inválida para a questão {questao.ordem + 1}."},
                    status=400,
                )
            texto = texto.strip()
            if questao.tipo == "OBJETIVA":
                try:
                    alternativa_id = int(resposta.get("alternativa_id"))
                except (TypeError, ValueError):
                    return JsonResponse(
                        {"message": f"Selecione uma alternativa para a questão {questao.ordem + 1}."},
                        status=400,
                    )
                alternativa = next(
                    (alt for alt in questao.alternativas.all() if alt.id == alternativa_id),
                    None,
                )
                if not alternativa:
                    return JsonResponse(
                        {"message": f"Alternativa inválida para a questão {questao.ordem + 1}."},
                        status=400,
                    )
            elif not texto:
                return JsonResponse(
                    {"message": f"Responda a questão {questao.ordem + 1}."},
                    status=400,
                )
            respostas.append((questao, alternativa, texto))

    try:
        respostas_livres = json.loads(request.POST.get("respostas_livres") or "[]")
    except json.JSONDecodeError:
        return JsonResponse({"message": "Respostas adicionais em formato inválido."}, status=400)
    if not isinstance(respostas_livres, list) or len(respostas_livres) > 100:
        return JsonResponse({"message": "A lista de respostas adicionais é inválida."}, status=400)

    respostas_livres_validadas = []
    for indice, item in enumerate(respostas_livres, start=1):
        if not isinstance(item, dict):
            return JsonResponse({"message": f"A resposta adicional {indice} é inválida."}, status=400)
        questao = item.get("questao")
        texto = item.get("resposta")
        if not isinstance(questao, str) or not questao.strip():
            return JsonResponse({"message": f"Informe a questão da resposta adicional {indice}."}, status=400)
        if not isinstance(texto, str) or not texto.strip():
            return JsonResponse({"message": f"Informe a resposta da questão adicional {indice}."}, status=400)
        respostas_livres_validadas.append({
            "questao": questao.strip(),
            "resposta": texto.strip(),
        })

    arquivo = request.FILES.get("arquivo")
    if (
        not arquivo
        and not questoes
        and not respostas_livres_validadas
        and not (envio and envio.arquivo)
    ):
        return JsonResponse(
            {"message": "Envie um arquivo ou adicione ao menos uma resposta."},
            status=400,
        )

    envio = AtividadeEnvio.objects.filter(atividade=atividade, aluno=aluno).first()
    if envio and envio.alteracao_status != "APROVADA":
        return JsonResponse(
            {"message": "Você já enviou esta atividade. Solicite uma alteração ao professor para enviar novamente."},
            status=409,
        )

    arquivo_anterior = envio.arquivo.name if envio and envio.arquivo else None
    if not envio:
        envio = AtividadeEnvio(atividade=atividade, aluno=aluno)
    if arquivo:
        envio.arquivo = arquivo
    envio.comentario = (request.POST.get("comentario") or "").strip()
    envio.respostas_livres = respostas_livres_validadas
    envio.alteracao_status = "NENHUMA"
    envio.alteracao_solicitada_em = None
    envio.save()

    if arquivo and arquivo_anterior and arquivo_anterior != envio.arquivo.name:
        default_storage.delete(arquivo_anterior)

    if questoes:
        envio.respostas.all().delete()
        AtividadeResposta.objects.bulk_create([
            AtividadeResposta(envio=envio, questao=q, alternativa=alt, texto=texto)
            for q, alt, texto in respostas
        ])

    respostas_serializadas = _serializar_envio_atividade(
        envio, atividade, com_gabarito=False
    )["respostas"]
    return JsonResponse({
        "message": "Atividade enviada com sucesso.",
        "envio": {
            "id": envio.id,
            "comentario": envio.comentario,
            "enviado_em": envio.enviado_em.isoformat(),
            "arquivo_url": envio.arquivo.url if envio.arquivo else None,
            "arquivo_nome": envio.arquivo.name.split("/")[-1] if envio.arquivo else None,
            "respostas_livres": envio.respostas_livres,
            "alteracao_status": envio.alteracao_status,
            "alteracao_solicitada_em": (
                envio.alteracao_solicitada_em.isoformat()
                if envio.alteracao_solicitada_em else None
            ),
            "atrasado": bool(
                atividade.data_entrega
                and timezone.localdate(envio.enviado_em) > atividade.data_entrega
            ),
            "respostas": respostas_serializadas,
        },
    })


@csrf_exempt
@require_http_methods(["GET"])
def envios_atividade_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    envios = AtividadeEnvio.objects.filter(aluno=aluno).select_related(
        "atividade", "atividade__turma", "atividade__disciplina", "atividade__professor"
    ).order_by("-enviado_em")
    return JsonResponse({"envios": [_serializar_envio_aluno(envio) for envio in envios]})


def _serializar_envio_aluno(envio):
    atividade = envio.atividade
    disciplina = resolver_disciplina_da_turma(atividade.turma)
    return {
        "id": envio.id,
        "comentario": envio.comentario,
        "enviado_em": envio.enviado_em.isoformat(),
        "arquivo_url": envio.arquivo.url if envio.arquivo else None,
        "arquivo_nome": envio.arquivo.name.split("/")[-1] if envio.arquivo else None,
        "respostas_livres": envio.respostas_livres,
        "alteracao_status": envio.alteracao_status,
        "alteracao_solicitada_em": (
            envio.alteracao_solicitada_em.isoformat()
            if envio.alteracao_solicitada_em else None
        ),
        "parecer_professor": envio.parecer_professor,
        "nota": float(envio.nota) if envio.nota is not None else None,
        "visto_emitido_em": (
            envio.visto_emitido_em.isoformat()
            if envio.visto_emitido_em else None
        ),
        "visto_assinatura": envio.visto_assinatura,
        "visto_pdf_url": envio.visto_pdf.url if envio.visto_pdf else None,
        "atrasado": bool(
            atividade.data_entrega
            and timezone.localdate(envio.enviado_em) > atividade.data_entrega
        ),
        "atividade": {
            "id": atividade.id,
            "titulo": atividade.titulo,
            "descricao": atividade.descricao,
            "disciplina": disciplina.nome_disciplina if disciplina else atividade.turma.disciplina_lecionada,
            "turma": atividade.turma.turma,
            "professor": atividade.professor.nome_completo,
            "data_entrega": atividade.data_entrega.isoformat() if atividade.data_entrega else None,
        },
    }


@csrf_exempt
@require_http_methods(["GET"])
def detalhe_envio_atividade_aluno(request, envio_id):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    envio = AtividadeEnvio.objects.select_related(
        "atividade", "atividade__turma", "atividade__disciplina", "atividade__professor"
    ).filter(id=envio_id, aluno=aluno).first()
    if not envio:
        return JsonResponse({"message": "Envio não encontrado."}, status=404)

    dados_envio = _serializar_envio_aluno(envio)
    atividade = dados_envio.pop("atividade")
    return JsonResponse({"envio": dados_envio, "atividade": atividade})


@csrf_exempt
@require_http_methods(["POST"])
def solicitar_alteracao_envio(request, atividade_id):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    atividade = Atividade.objects.filter(
        id=atividade_id,
        turma__in=buscar_atravessapor_por_turma(aluno.turma),
    ).first()
    if not atividade:
        return JsonResponse({"message": "Atividade não encontrada para esta turma."}, status=404)

    envio = AtividadeEnvio.objects.filter(atividade=atividade, aluno=aluno).first()
    if not envio:
        return JsonResponse({"message": "Envie a atividade antes de solicitar uma alteração."}, status=400)
    if envio.alteracao_status in ("SOLICITADA", "APROVADA"):
        return JsonResponse({"message": "Já existe uma solicitação em andamento ou aprovada."}, status=409)

    envio.alteracao_status = "SOLICITADA"
    envio.alteracao_solicitada_em = timezone.now()
    envio.save(update_fields=["alteracao_status", "alteracao_solicitada_em"])
    return JsonResponse({"message": "Solicitação de alteração enviada ao professor."})


@csrf_exempt
@require_http_methods(["POST"])
def responder_solicitacao_alteracao_envio(request, atividade_id, envio_id):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    if not isinstance(body, dict):
        return JsonResponse({"message": "O corpo da solicitação deve ser um objeto JSON."}, status=400)

    acao = body.get("acao")
    if acao not in ("aprovar", "negar"):
        return JsonResponse({"message": "A ação deve ser 'aprovar' ou 'negar'."}, status=400)

    envio = AtividadeEnvio.objects.filter(
        id=envio_id,
        atividade_id=atividade_id,
        atividade__professor=professor,
        alteracao_status="SOLICITADA",
    ).first()
    if not envio:
        return JsonResponse({"message": "Solicitação de alteração não encontrada."}, status=404)

    envio.alteracao_status = "APROVADA" if acao == "aprovar" else "NEGADA"
    envio.save(update_fields=["alteracao_status"])
    return JsonResponse({
        "message": "Solicitação aprovada." if acao == "aprovar" else "Solicitação negada.",
        "alteracao_status": envio.alteracao_status,
    })


@csrf_exempt
def deletar_atividade(request, atividade_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    atividade = Atividade.objects.filter(id=atividade_id).first()
    if not atividade:
        return JsonResponse({"message": "Atividade não encontrada."}, status=404)

    atividade.delete()
    return JsonResponse({"message": "Atividade removida com sucesso."})


@csrf_exempt
def get_comunicados(request):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"message": "Não autenticado."}, status=401)

    comunicados = Comunicado.objects.filter(professor=professor).select_related("turma")

    resultado = [
        {
            "id": c.id,
            "titulo": c.titulo,
            "mensagem": c.mensagem,
            "data": c.data.isoformat(),
            "turma_id": c.turma_id,
            "nome_turma": c.turma.turma if c.turma else None,
        }
        for c in comunicados
    ]

    return JsonResponse({
        "total_comunicados": len(resultado),
        "comunicados": resultado
    })


@csrf_exempt
def criar_comunicado(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"message": "Não autenticado."}, status=401)

    professor_id = body.get("professor")
    titulo = (body.get("titulo") or "").strip()
    mensagem = (body.get("mensagem") or "").strip()
    turma_id = body.get("turma")
    data_str = body.get("data")

    if not all([titulo, mensagem]):
        return JsonResponse(
            {"message": "Campos 'titulo' e 'mensagem' são obrigatórios."},
            status=400
        )

    if professor_id and str(professor.id) != str(professor_id):
        return JsonResponse({"message": "Professor da sessão não corresponde ao informado."}, status=403)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id, professor=professor).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada ou não vinculada ao professor."}, status=404)

    data_comunicado = date.today()
    if data_str:
        try:
            data_comunicado = date.fromisoformat(data_str)
        except (TypeError, ValueError):
            return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    comunicado = Comunicado.objects.create(
        professor=professor,
        turma=turma,
        titulo=titulo,
        mensagem=mensagem,
        data=data_comunicado,
    )

    return JsonResponse({
        "message": "Comunicado criado com sucesso.",
        "comunicado": {
            "id": comunicado.id,
            "titulo": comunicado.titulo,
            "mensagem": comunicado.mensagem,
            "data": comunicado.data.isoformat(),
            "turma_id": comunicado.turma_id,
            "nome_turma": comunicado.turma.turma if comunicado.turma else None,
        }
    })


@csrf_exempt
def deletar_comunicado(request, comunicado_id):
    """Remove um comunicado."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    comunicado = Comunicado.objects.filter(id=comunicado_id).first()
    if not comunicado:
        return JsonResponse({"message": "Comunicado não encontrado."}, status=404)

    comunicado.delete()
    return JsonResponse({"message": "Comunicado removido com sucesso."})


@csrf_exempt
@require_http_methods(["POST"])
def login_coordenacao(request):
    body = json.loads(request.body or "{}")
    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip()

    coordenador = Coordenador.objects.filter(nome_completo=nome_completo, senha=senha).first()

    if coordenador is None:
        return JsonResponse({
            "return": False
        })

    response = JsonResponse({
        "return": True
    })
    _criar_sessao_e_setar_cookie(response, "COORDENADOR", coordenador.id, coordenador.nome_completo)
    return response


@csrf_exempt
def auth_coordenacao(request):
    coordenador = _coordenador_logado(request)

    try:
        if coordenador is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "return": True,
                "coordenador": model_to_dict(coordenador)
            })
    except:
        return JsonResponse({
            "return": None,
            "message": "error"
        })


@csrf_exempt
def get_professores_coordenacao(request):
    professores = Professor.objects.all().order_by("nome_completo")

    resultado = []
    for professor in professores:
        registros = AtravessaPor.objects.filter(professor_id=professor.id)

        turmas_map = {}
        for r in registros:
            chave = r.turma
            if chave not in turmas_map:
                turmas_map[chave] = {
                    "nome_turma": r.turma,
                    "etapa": r.etapa,
                    "disciplinas": [],
                }
            turmas_map[chave]["disciplinas"].append(r.disciplina_lecionada)

        resultado.append({
            "id": professor.id,
            "nome_completo": professor.nome_completo,
            "total_turmas": len(turmas_map),
            "total_disciplinas": sum(len(t["disciplinas"]) for t in turmas_map.values()),
            "turmas": list(turmas_map.values()),
        })

    return JsonResponse({
        "total_professores": len(resultado),
        "professores": resultado
    })



@csrf_exempt
def criar_professor(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip()
    escola = (body.get("escola") or "").strip()
    vinculos = body.get("vinculos", [])

    if not nome_completo or not senha:
        return JsonResponse(
            {"message": "Campos 'nome_completo' e 'senha' são obrigatórios."},
            status=400
        )

    if Professor.objects.filter(nome_completo=nome_completo).exists():
        return JsonResponse(
            {"message": "Já existe um professor cadastrado com esse nome."},
            status=400
        )

    erros_vinculos = []
    for i, v in enumerate(vinculos):
        turma = (v.get("turma") or "").strip()
        etapa = (v.get("etapa") or "").strip()
        disciplinas = [d.strip() for d in (v.get("disciplinas") or []) if d.strip()]

        if not turma or not etapa or not disciplinas:
            erros_vinculos.append(
                f"Vínculo {i + 1}: turma, etapa e ao menos uma disciplina são obrigatórios."
            )

    if erros_vinculos:
        return JsonResponse({"message": " | ".join(erros_vinculos)}, status=400)

    professor = Professor.objects.create(
        nome_completo=nome_completo,
        senha=senha,
    )

    registros_criados = []
    for v in vinculos:
        turma = v.get("turma").strip()
        etapa = v.get("etapa").strip()
        disciplinas = [d.strip() for d in v.get("disciplinas", []) if d.strip()]

        for disciplina in disciplinas:
            registro = AtravessaPor.objects.create(
                professor=professor,
                escola=escola,
                turma=turma,
                etapa=etapa,
                disciplina_lecionada=disciplina,
            )
            registros_criados.append(registro.id)

    return JsonResponse({
        "message": "Professor cadastrado com sucesso.",
        "professor": {
            "id": professor.id,
            "nome_completo": professor.nome_completo,
        },
        "vinculos_criados": len(registros_criados),
    })

@csrf_exempt
def get_escola_coordenador(request):
    coordenador = _coordenador_logado(request)

    if not coordenador:
        return JsonResponse({"return": False}, status=401)

    return JsonResponse({
        "return": True,
        "escola": coordenador.escola or ""
    })


@csrf_exempt
def get_professor_detalhe(request, professor_id):
    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    registros = AtravessaPor.objects.filter(professor_id=professor_id)

    turmas_map = {}
    for r in registros:
        chave = r.turma
        if chave not in turmas_map:
            turmas_map[chave] = {
                "turma": r.turma,
                "etapa": r.etapa,
                "escola": r.escola,
                "disciplinas": [],
                "registro_ids": [],
            }
        turmas_map[chave]["disciplinas"].append(r.disciplina_lecionada)
        turmas_map[chave]["registro_ids"].append(r.id)

    return JsonResponse({
        "professor": {
            "id": professor.id,
            "nome_completo": professor.nome_completo,
        },
        "vinculos": list(turmas_map.values()),
    })


@csrf_exempt
def editar_professor(request, professor_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip()
    escola = (body.get("escola") or "").strip()
    vinculos = body.get("vinculos", [])

    if not nome_completo:
        return JsonResponse({"message": "O campo 'nome_completo' é obrigatório."}, status=400)

    if Professor.objects.filter(nome_completo=nome_completo).exclude(id=professor_id).exists():
        return JsonResponse(
            {"message": "Já existe outro professor cadastrado com esse nome."},
            status=400
        )

    erros_vinculos = []
    for i, v in enumerate(vinculos):
        turma = (v.get("turma") or "").strip()
        etapa = (v.get("etapa") or "").strip()
        disciplinas = [d.strip() for d in (v.get("disciplinas") or []) if d.strip()]

        if not turma or not etapa or not disciplinas:
            erros_vinculos.append(
                f"Vínculo {i + 1}: turma, etapa e ao menos uma disciplina são obrigatórios."
            )

    if erros_vinculos:
        return JsonResponse({"message": " | ".join(erros_vinculos)}, status=400)

    professor.nome_completo = nome_completo
    if senha:
        professor.senha = senha
    professor.save()

    registros_antigos = AtravessaPor.objects.filter(professor_id=professor_id)
    ids_com_dados = []
    for r in registros_antigos:
        tem_notas = Nota.objects.filter(turma_id=r.id).exists()
        tem_frequencia = Frequencia.objects.filter(turma_id=r.id).exists()
        if tem_notas or tem_frequencia:
            ids_com_dados.append(r.id)

    if ids_com_dados:
        return JsonResponse(
            {
                "message": (
                    f"Não é possível substituir os vínculos: existem notas ou frequências "
                    f"lançadas em {len(ids_com_dados)} vínculo(s) existente(s). "
                    f"Remova os lançamentos antes de alterar as turmas deste professor."
                )
            },
            status=400
        )

    registros_antigos.delete()

    for v in vinculos:
        turma = v.get("turma").strip()
        etapa = v.get("etapa").strip()
        disciplinas = [d.strip() for d in v.get("disciplinas", []) if d.strip()]

        for disciplina in disciplinas:
            AtravessaPor.objects.create(
                professor=professor,
                escola=escola,
                turma=turma,
                etapa=etapa,
                disciplina_lecionada=disciplina,
            )

    return JsonResponse({
        "message": "Professor atualizado com sucesso.",
        "professor": {
            "id": professor.id,
            "nome_completo": professor.nome_completo,
        }
    })

@csrf_exempt
def get_opcoes_cadastro_professor(request):
    turmas = list(
        AtravessaPor.objects.exclude(turma="")
        .values_list("turma", flat=True)
        .distinct()
        .order_by("turma")
    )

    etapas = list(
        AtravessaPor.objects.exclude(etapa="")
        .values_list("etapa", flat=True)
        .distinct()
        .order_by("etapa")
    )

    disciplinas = list(
        Disciplina.objects.values_list("nome_disciplina", flat=True)
        .distinct()
        .order_by("nome_disciplina")
    )

    return JsonResponse({
        "turmas": turmas,
        "etapas": etapas,
        "disciplinas": disciplinas,
    })

@csrf_exempt
def deletar_professor(request, professor_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    registros = AtravessaPor.objects.filter(professor_id=professor_id)

    tem_notas = Nota.objects.filter(turma_id__in=registros.values_list("id", flat=True)).exists()
    tem_frequencia = Frequencia.objects.filter(turma_id__in=registros.values_list("id", flat=True)).exists()

    if tem_notas or tem_frequencia:
        return JsonResponse(
            {
                "message": (
                    "Não é possível apagar este professor: existem notas ou "
                    "frequências lançadas em turmas vinculadas a ele. Remova "
                    "esses lançamentos antes de excluir o professor."
                )
            },
            status=400
        )

    nome = professor.nome_completo
    registros.delete()
    professor.delete()

    return JsonResponse({
        "message": f"Professor {nome} removido com sucesso."
    })

@csrf_exempt
def get_alunos_coordenacao(request):
    alunos = Estudante.objects.all().order_by("nome_completo")

    resultado = [
        {
            "id": a.id,
            "nome_completo": a.nome_completo,
            "turma": a.turma,
            "serie": a.serie,
            "escola": a.escola,
            "periodo": a.periodo,
            "curso": a.curso,
        }
        for a in alunos
    ]

    return JsonResponse({
        "total_alunos": len(resultado),
        "alunos": resultado
    })



@csrf_exempt
def get_aluno_detalhe(request, aluno_id):
    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    return JsonResponse({
        "aluno": {
            "id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "turma": aluno.turma,
            "serie": aluno.serie,
            "escola": aluno.escola,
            "periodo": aluno.periodo,
            "curso": aluno.curso,
            "modo_de_ensino": aluno.modo_de_ensino,
            "posicao_ordem": aluno.posicao_ordem,
        }
    })

@csrf_exempt
def editar_aluno(request, aluno_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_completo = (body.get("nome_completo") or "").strip().upper()
    turma = (body.get("turma") or "").strip()
    serie = (body.get("serie") or "").strip()
    escola = (body.get("escola") or "").strip()
    periodo = (body.get("periodo") or "").strip()
    curso = (body.get("curso") or "").strip()

    if not nome_completo:
        return JsonResponse({"message": "O campo 'nome_completo' é obrigatório."}, status=400)

    aluno.nome_completo = nome_completo
    aluno.turma = turma
    aluno.serie = serie
    aluno.escola = escola
    aluno.periodo = periodo
    aluno.curso = curso
    aluno.save()

    return JsonResponse({
        "message": "Aluno atualizado com sucesso.",
        "aluno": {
            "id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "turma": aluno.turma,
            "serie": aluno.serie,
            "escola": aluno.escola,
            "periodo": aluno.periodo,
            "curso": aluno.curso,
        }
    })



@csrf_exempt
def deletar_aluno(request, aluno_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    tem_notas = Nota.objects.filter(aluno_id=aluno_id).exists()
    tem_frequencia = Frequencia.objects.filter(aluno_id=aluno_id).exists()

    if tem_notas or tem_frequencia:
        return JsonResponse(
            {
                "message": (
                    "Não é possível apagar este aluno: existem notas ou "
                    "frequências lançadas em seu histórico. Remova esses "
                    "lançamentos antes de excluir o aluno."
                )
            },
            status=400
        )

    nome = aluno.nome_completo
    aluno.delete()

    return JsonResponse({
        "message": f"Aluno {nome} removido com sucesso."
    })


@csrf_exempt
def criar_aluno(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip()
    turma = (body.get("turma") or "").strip()
    serie = (body.get("serie") or "").strip()
    escola = (body.get("escola") or "").strip()
    periodo = (body.get("periodo") or "").strip()
    curso = (body.get("curso") or "").strip()
    modo_de_ensino = (body.get("modo_de_ensino") or "").strip()

    if not nome_completo or not senha:
        return JsonResponse(
            {"message": "Campos 'nome_completo' e 'senha' são obrigatórios."},
            status=400
        )

    if Estudante.objects.filter(nome_completo=nome_completo).exists():
        return JsonResponse(
            {"message": "Já existe um aluno cadastrado com esse nome."},
            status=400
        )

    aluno = Estudante.objects.create(
        nome_completo=nome_completo,
        senha=senha,
        turma=turma,
        serie=serie,
        escola=escola,
        periodo=periodo,
        curso=curso,
        modo_de_ensino=modo_de_ensino,
    )

    return JsonResponse({
        "message": "Aluno cadastrado com sucesso.",
        "aluno": {
            "id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "turma": aluno.turma,
            "serie": aluno.serie,
            "escola": aluno.escola,
            "periodo": aluno.periodo,
            "curso": aluno.curso,
        }
    })

@csrf_exempt
def get_opcoes_cadastro_aluno(request):
    turmas = list(
        Estudante.objects.exclude(turma="")
        .values_list("turma", flat=True)
        .distinct()
        .order_by("turma")
    )

    series = list(
        Estudante.objects.exclude(serie="")
        .values_list("serie", flat=True)
        .distinct()
        .order_by("serie")
    )

    cursos = list(
        Estudante.objects.exclude(curso="")
        .values_list("curso", flat=True)
        .distinct()
        .order_by("curso")
    )

    return JsonResponse({
        "turmas": turmas,
        "series": series,
        "cursos": cursos,
    })


def _turma_normalizada(texto):
    texto = unicodedata.normalize("NFC", texto or "")
    return texto.replace(" ", "").strip().upper()


@csrf_exempt
def get_aluno_visao_geral(request, aluno_id):
    """
    Retorna, para um aluno específico: dados básicos, comunicados relevantes
    (gerais do professor ou direcionados à turma do aluno), eventos do
    calendário relevantes (gerais ou da turma), e advertências recebidas.
    """
    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    turma_aluno_norm = _turma_normalizada(aluno.turma)

    comunicados_qs = Comunicado.objects.select_related("turma").order_by("-data")
    comunicados = []
    for c in comunicados_qs:
        if c.turma is None:
            comunicados.append(c)
        elif _turma_normalizada(c.turma.turma) == turma_aluno_norm:
            comunicados.append(c)

    comunicados_json = [
        {
            "id": c.id,
            "titulo": c.titulo,
            "mensagem": c.mensagem,
            "data": c.data.isoformat(),
            "nome_turma": c.turma.turma if c.turma else None,
        }
        for c in comunicados[:30]
    ]

    eventos_qs = Evento.objects.select_related("turma").order_by("-data")
    eventos = []
    for e in eventos_qs:
        if e.turma is None:
            eventos.append(e)
        elif _turma_normalizada(e.turma.turma) == turma_aluno_norm:
            eventos.append(e)

    eventos_json = [
        {
            "id": e.id,
            "titulo": e.titulo,
            "descricao": e.descricao,
            "data": e.data.isoformat(),
            "nome_turma": e.turma.turma if e.turma else None,
        }
        for e in eventos[:30]
    ]

    advertencias_qs = Advertencia.objects.filter(aluno_id=aluno_id).select_related("professor")
    advertencias_json = [
        {
            "id": a.id,
            "titulo": a.titulo,
            "descricao": a.descricao,
            "data": a.data.isoformat(),
            "professor": a.professor.nome_completo if a.professor else None,
        }
        for a in advertencias_qs
    ]

    return JsonResponse({
        "aluno": {
            "id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "turma": aluno.turma,
            "serie": aluno.serie,
            "escola": aluno.escola,
            "periodo": aluno.periodo,
            "curso": aluno.curso,
        },
        "comunicados": comunicados_json,
        "eventos": eventos_json,
        "advertencias": advertencias_json,
    })


@csrf_exempt
def criar_advertencia(request, aluno_id):
    """Registra uma nova advertência para o aluno."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    descricao = (body.get("descricao") or "").strip()

    if not titulo:
        return JsonResponse({"message": "O campo 'titulo' é obrigatório."}, status=400)

    advertencia = Advertencia.objects.create(
        aluno=aluno,
        titulo=titulo,
        descricao=descricao,
    )

    return JsonResponse({
        "message": "Advertência registrada com sucesso.",
        "advertencia": {
            "id": advertencia.id,
            "titulo": advertencia.titulo,
            "descricao": advertencia.descricao,
            "data": advertencia.data.isoformat(),
            "professor": None,
        }
    })


@csrf_exempt
def deletar_advertencia(request, advertencia_id):
    """Remove uma advertência."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    advertencia = Advertencia.objects.filter(id=advertencia_id).first()
    if not advertencia:
        return JsonResponse({"message": "Advertência não encontrada."}, status=404)

    advertencia.delete()
    return JsonResponse({"message": "Advertência removida com sucesso."})


@csrf_exempt
def get_eventos_coordenacao(request):
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")

    eventos = Evento.objects.select_related("turma", "professor", "coordenador").all()

    if mes and ano:
        eventos = eventos.filter(data__year=ano, data__month=mes)
    elif ano:
        eventos = eventos.filter(data__year=ano)

    hoje = date.today()

    resultado = []
    for e in eventos:
        if e.coordenador:
            criado_por = f"{e.coordenador.escola or 'Organização'}"
            origem = "coordenacao"
        elif e.professor:
            criado_por = e.professor.nome_completo
            origem = "professor"
        else:
            criado_por = None
            origem = None

        resultado.append({
            "id": e.id,
            "titulo": e.titulo,
            "descricao": e.descricao,
            "data": e.data.isoformat(),
            "turma_id": e.turma_id,
            "nome_turma": e.turma.turma if e.turma else None,
            "criado_por": criado_por,
            "origem": origem,
            "finalizado": e.data < hoje,
        })

    return JsonResponse({
        "total_eventos": len(resultado),
        "eventos": resultado
    })


@csrf_exempt
def get_evento_detalhe(request, evento_id):
    evento = Evento.objects.select_related("turma", "professor", "coordenador").filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    hoje = date.today()

    if evento.coordenador:
        criado_por = evento.coordenador.escola or "Organização"
        origem = "coordenacao"
    elif evento.professor:
        criado_por = evento.professor.nome_completo
        origem = "professor"
    else:
        criado_por = None
        origem = None

    return JsonResponse({
        "evento": {
            "id": evento.id,
            "titulo": evento.titulo,
            "descricao": evento.descricao,
            "data": evento.data.isoformat(),
            "turma_id": evento.turma_id,
            "nome_turma": evento.turma.turma if evento.turma else None,
            "professor": evento.professor.nome_completo if evento.professor else None,
            "criado_por": criado_por,
            "origem": origem,
            "finalizado": evento.data < hoje,
        }
    })



@csrf_exempt
def criar_evento_coordenacao(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    coordenador = _coordenador_logado(request)

    if not coordenador:
        return JsonResponse({"message": "Coordenador não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    descricao = (body.get("descricao") or "").strip()
    data_str = body.get("data")
    turma_id = body.get("turma")

    if not titulo or not data_str:
        return JsonResponse(
            {"message": "Campos 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_evento = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada."}, status=404)

    evento = Evento.objects.create(
        professor=None,
        coordenador=coordenador,
        turma=turma,
        titulo=titulo,
        descricao=descricao,
        data=data_evento,
    )

    return JsonResponse({
        "message": "Evento criado com sucesso.",
        "evento": {
            "id": evento.id,
            "titulo": evento.titulo,
            "descricao": evento.descricao,
            "data": evento.data.isoformat(),
            "turma_id": evento.turma_id,
            "nome_turma": evento.turma.turma if evento.turma else None,
            "criado_por": coordenador.escola or "Organização",
            "origem": "coordenacao",
        }
    })


@csrf_exempt
def editar_evento_coordenacao(request, evento_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    evento = Evento.objects.filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    descricao = (body.get("descricao") or "").strip()
    data_str = body.get("data")
    turma_id = body.get("turma")

    if not titulo or not data_str:
        return JsonResponse(
            {"message": "Campos 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_evento = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada."}, status=404)

    evento.titulo = titulo
    evento.descricao = descricao
    evento.data = data_evento
    evento.turma = turma
    evento.save()

    return JsonResponse({"message": "Evento atualizado com sucesso."})

@csrf_exempt
def deletar_evento_coordenacao(request, evento_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    evento = Evento.objects.filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    evento.delete()
    return JsonResponse({"message": "Evento removido com sucesso."})


@csrf_exempt
def get_lista_professores_simples(request):
    professores = Professor.objects.all().order_by("nome_completo")

    resultado = [
        {"id": p.id, "nome_completo": p.nome_completo}
        for p in professores
    ]

    return JsonResponse({"professores": resultado})


@csrf_exempt
def get_turmas_do_professor(request, professor_id):
    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    registros = AtravessaPor.objects.filter(professor_id=professor_id)

    turmas_map = {}
    for r in registros:
        if r.turma not in turmas_map:
            turmas_map[r.turma] = {
                "nome_turma": r.turma,
                "etapa": r.etapa,
                "registro_id": r.id,
            }

    return JsonResponse({
        "professor": {"id": professor.id, "nome_completo": professor.nome_completo},
        "turmas": list(turmas_map.values()),
    })


@csrf_exempt
def get_comunicados_coordenacao(request):
    comunicados = Comunicado.objects.select_related("turma", "professor", "coordenador").order_by("-data")

    resultado = []
    for c in comunicados:
        if c.coordenador:
            criado_por = c.coordenador.escola or "Organização"
            origem = "coordenacao"
        elif c.professor:
            criado_por = c.professor.nome_completo
            origem = "professor"
        else:
            criado_por = None
            origem = None

        resultado.append({
            "id": c.id,
            "titulo": c.titulo,
            "mensagem": c.mensagem,
            "data": c.data.isoformat(),
            "turma_id": c.turma_id,
            "nome_turma": c.turma.turma if c.turma else None,
            "criado_por": criado_por,
            "origem": origem,
        })

    return JsonResponse({
        "total_comunicados": len(resultado),
        "comunicados": resultado
    })



@csrf_exempt
def get_comunicado_detalhe(request, comunicado_id):
    comunicado = Comunicado.objects.select_related("turma", "professor", "coordenador").filter(id=comunicado_id).first()
    if not comunicado:
        return JsonResponse({"message": "Comunicado não encontrado."}, status=404)

    if comunicado.coordenador:
        criado_por = comunicado.coordenador.escola or "Organização"
        origem = "coordenacao"
    elif comunicado.professor:
        criado_por = comunicado.professor.nome_completo
        origem = "professor"
    else:
        criado_por = None
        origem = None

    return JsonResponse({
        "comunicado": {
            "id": comunicado.id,
            "titulo": comunicado.titulo,
            "mensagem": comunicado.mensagem,
            "data": comunicado.data.isoformat(),
            "turma_id": comunicado.turma_id,
            "nome_turma": comunicado.turma.turma if comunicado.turma else None,
            "criado_por": criado_por,
            "origem": origem,
        }
    })



@csrf_exempt
def criar_comunicado_coordenacao(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    coordenador = _coordenador_logado(request)

    if not coordenador:
        return JsonResponse({"message": "Coordenador não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    mensagem = (body.get("mensagem") or "").strip()
    turma_id = body.get("turma")
    data_str = body.get("data")

    if not titulo or not mensagem:
        return JsonResponse(
            {"message": "Campos 'titulo' e 'mensagem' são obrigatórios."},
            status=400
        )

    data_comunicado = date.today()
    if data_str:
        try:
            data_comunicado = date.fromisoformat(data_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada."}, status=404)

    comunicado = Comunicado.objects.create(
        professor=None,
        coordenador=coordenador,
        turma=turma,
        titulo=titulo,
        mensagem=mensagem,
        data=data_comunicado,
    )

    return JsonResponse({
        "message": "Comunicado criado com sucesso.",
        "comunicado": {
            "id": comunicado.id,
            "titulo": comunicado.titulo,
            "mensagem": comunicado.mensagem,
            "data": comunicado.data.isoformat(),
            "turma_id": comunicado.turma_id,
            "nome_turma": comunicado.turma.turma if comunicado.turma else None,
            "criado_por": coordenador.escola or "Organização",
            "origem": "coordenacao",
        }
    })


@csrf_exempt
def editar_comunicado_coordenacao(request, comunicado_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    comunicado = Comunicado.objects.filter(id=comunicado_id).first()
    if not comunicado:
        return JsonResponse({"message": "Comunicado não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    mensagem = (body.get("mensagem") or "").strip()
    turma_id = body.get("turma")
    data_str = body.get("data")

    if not titulo or not mensagem:
        return JsonResponse(
            {"message": "Campos 'titulo' e 'mensagem' são obrigatórios."},
            status=400
        )

    if not data_str:
        return JsonResponse({"message": "O campo 'data' é obrigatório."}, status=400)

    try:
        data_comunicado = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada."}, status=404)

    comunicado.titulo = titulo
    comunicado.mensagem = mensagem
    comunicado.turma = turma
    comunicado.data = data_comunicado
    comunicado.save()

    return JsonResponse({"message": "Comunicado atualizado com sucesso."})


@csrf_exempt
def deletar_comunicado_coordenacao(request, comunicado_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    comunicado = Comunicado.objects.filter(id=comunicado_id).first()
    if not comunicado:
        return JsonResponse({"message": "Comunicado não encontrado."}, status=404)

    comunicado.delete()
    return JsonResponse({"message": "Comunicado removido com sucesso."})


@csrf_exempt
def get_advertencias_coordenacao(request):
    """Lista advertências (alunos) e penalidades (professores)."""
    tipo = request.GET.get("tipo")  # opcional: ADVERTENCIA ou PENALIDADE

    advertencias = Advertencia.objects.select_related("aluno", "professor", "coordenador").order_by("-data")

    if tipo:
        advertencias = advertencias.filter(tipo=tipo)

    resultado = []
    for a in advertencias:
        resultado.append({
            "id": a.id,
            "tipo": a.tipo,
            "titulo": a.titulo,
            "descricao": a.descricao,
            "data": a.data.isoformat(),
            "aluno_id": a.aluno_id,
            "aluno_nome": a.aluno.nome_completo if a.aluno else None,
            "aluno_turma": a.aluno.turma if a.aluno else None,
            "professor_id": a.professor_id,
            "professor_nome": a.professor.nome_completo if a.professor else None,
            "emitido_por": (a.coordenador.escola or "Organização") if a.coordenador else None,
            "is_suspensao": a.is_suspensao,
            "data_inicio_suspensao": a.data_inicio_suspensao.isoformat() if a.data_inicio_suspensao else None,
            "data_termino_suspensao": a.data_termino_suspensao.isoformat() if a.data_termino_suspensao else None,
        })

    return JsonResponse({
        "total_advertencias": len(resultado),
        "advertencias": resultado
    })


@csrf_exempt
def get_advertencia_detalhe(request, advertencia_id):
    advertencia = Advertencia.objects.select_related("aluno", "professor", "coordenador").filter(id=advertencia_id).first()
    if not advertencia:
        return JsonResponse({"message": "Registro não encontrado."}, status=404)

    return JsonResponse({
        "advertencia": {
            "id": advertencia.id,
            "tipo": advertencia.tipo,
            "titulo": advertencia.titulo,
            "descricao": advertencia.descricao,
            "data": advertencia.data.isoformat(),
            "aluno_id": advertencia.aluno_id,
            "aluno_nome": advertencia.aluno.nome_completo if advertencia.aluno else None,
            "aluno_turma": advertencia.aluno.turma if advertencia.aluno else None,
            "professor_id": advertencia.professor_id,
            "professor_nome": advertencia.professor.nome_completo if advertencia.professor else None,
            "emitido_por": (advertencia.coordenador.escola or "Organização") if advertencia.coordenador else None,
            "is_suspensao": advertencia.is_suspensao,
            "data_inicio_suspensao": advertencia.data_inicio_suspensao.isoformat() if advertencia.data_inicio_suspensao else None,
            "data_termino_suspensao": advertencia.data_termino_suspensao.isoformat() if advertencia.data_termino_suspensao else None,
        }
    })


@csrf_exempt
def criar_advertencia_coordenacao(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"message": "Coordenador não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    tipo = body.get("tipo")
    titulo = (body.get("titulo") or "").strip()
    descricao = (body.get("descricao") or "").strip()
    data_str = body.get("data")
    aluno_id = body.get("aluno")
    professor_id = body.get("professor")
    is_suspensao = bool(body.get("is_suspensao"))
    inicio_susp_str = body.get("data_inicio_suspensao")
    termino_susp_str = body.get("data_termino_suspensao")

    if tipo not in ("ADVERTENCIA", "PENALIDADE"):
        return JsonResponse({"message": "O campo 'tipo' deve ser 'ADVERTENCIA' ou 'PENALIDADE'."}, status=400)

    if not titulo or not descricao:
        return JsonResponse({"message": "Campos 'titulo' e 'descricao' são obrigatórios."}, status=400)

    data_registro = date.today()
    if data_str:
        try:
            data_registro = date.fromisoformat(data_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    aluno = None
    professor = None

    if tipo == "ADVERTENCIA":
        if not aluno_id:
            return JsonResponse({"message": "O campo 'aluno' é obrigatório para advertências."}, status=400)
        aluno = Estudante.objects.filter(id=aluno_id).first()
        if not aluno:
            return JsonResponse({"message": "Aluno não encontrado."}, status=404)
    else:
        if not professor_id:
            return JsonResponse({"message": "O campo 'professor' é obrigatório para penalidades."}, status=400)
        professor = Professor.objects.filter(id=professor_id).first()
        if not professor:
            return JsonResponse({"message": "Professor não encontrado."}, status=404)
        is_suspensao = False  # suspensão só se aplica a advertência de aluno

    data_inicio_suspensao = None
    data_termino_suspensao = None

    if is_suspensao:
        if not inicio_susp_str or not termino_susp_str:
            return JsonResponse(
                {"message": "Informe data de início e término da suspensão."},
                status=400
            )
        try:
            data_inicio_suspensao = date.fromisoformat(inicio_susp_str)
            data_termino_suspensao = date.fromisoformat(termino_susp_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data de suspensão inválido. Use AAAA-MM-DD."}, status=400)

        if data_termino_suspensao < data_inicio_suspensao:
            return JsonResponse(
                {"message": "A data de término da suspensão não pode ser anterior à data de início."},
                status=400
            )

    advertencia = Advertencia.objects.create(
        tipo=tipo,
        aluno=aluno,
        professor=professor,
        coordenador=coordenador,
        titulo=titulo,
        descricao=descricao,
        data=data_registro,
        is_suspensao=is_suspensao,
        data_inicio_suspensao=data_inicio_suspensao,
        data_termino_suspensao=data_termino_suspensao,
    )

    return JsonResponse({
        "message": "Registro criado com sucesso.",
        "advertencia": {"id": advertencia.id, "tipo": advertencia.tipo}
    })

@csrf_exempt
def editar_advertencia_coordenacao(request, advertencia_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    advertencia = Advertencia.objects.filter(id=advertencia_id).first()
    if not advertencia:
        return JsonResponse({"message": "Registro não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    descricao = (body.get("descricao") or "").strip()
    data_str = body.get("data")
    is_suspensao = bool(body.get("is_suspensao"))
    inicio_susp_str = body.get("data_inicio_suspensao")
    termino_susp_str = body.get("data_termino_suspensao")

    if not titulo or not descricao:
        return JsonResponse({"message": "Campos 'titulo' e 'descricao' são obrigatórios."}, status=400)

    if data_str:
        try:
            advertencia.data = date.fromisoformat(data_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    if advertencia.tipo == "ADVERTENCIA" and is_suspensao:
        if not inicio_susp_str or not termino_susp_str:
            return JsonResponse(
                {"message": "Informe data de início e término da suspensão."},
                status=400
            )
        try:
            data_inicio_suspensao = date.fromisoformat(inicio_susp_str)
            data_termino_suspensao = date.fromisoformat(termino_susp_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data de suspensão inválido. Use AAAA-MM-DD."}, status=400)

        if data_termino_suspensao < data_inicio_suspensao:
            return JsonResponse(
                {"message": "A data de término da suspensão não pode ser anterior à data de início."},
                status=400
            )

        advertencia.is_suspensao = True
        advertencia.data_inicio_suspensao = data_inicio_suspensao
        advertencia.data_termino_suspensao = data_termino_suspensao
    else:
        advertencia.is_suspensao = False
        advertencia.data_inicio_suspensao = None
        advertencia.data_termino_suspensao = None

    advertencia.titulo = titulo
    advertencia.descricao = descricao
    advertencia.save()

    return JsonResponse({"message": "Registro atualizado com sucesso."})


@csrf_exempt
def deletar_advertencia_coordenacao(request, advertencia_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    advertencia = Advertencia.objects.filter(id=advertencia_id).first()
    if not advertencia:
        return JsonResponse({"message": "Registro não encontrado."}, status=404)

    advertencia.delete()
    return JsonResponse({"message": "Registro removido com sucesso."})


@csrf_exempt
def gerar_advertencia_pdf(request, advertencia_id):
    advertencia = Advertencia.objects.select_related("aluno", "professor", "coordenador").filter(id=advertencia_id).first()
    if not advertencia:
        return JsonResponse({"message": "Registro não encontrado."}, status=404)

    contexto = {
        "advertencia": advertencia,
        "eh_penalidade": advertencia.tipo == "PENALIDADE",
        "escola": advertencia.aluno.escola if advertencia.aluno else "",
        "emitido_por": (advertencia.coordenador.escola or "Organização Pedagógica") if advertencia.coordenador else "Organização Pedagógica",
    }

    html_string = render_to_string("advertencias/pdf.html", contexto)
    from .pdf import html_to_pdf
    pdf_file = html_to_pdf(html_string)

    prefixo = "penalidade" if advertencia.tipo == "PENALIDADE" else "advertencia"
    nome_arquivo = f"{prefixo}_{advertencia.id}.pdf"

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response


@csrf_exempt
def get_turmas_coordenacao(request):
    registros = AtravessaPor.objects.exclude(turma="").values("turma", "etapa", "escola").distinct()

    turmas_map = {}
    for r in registros:
        nome = r["turma"]
        if nome not in turmas_map:
            turmas_map[nome] = {
                "nome_turma": nome,
                "etapa": r["etapa"],
                "escola": r["escola"],
            }

    resultado = list(turmas_map.values())
    resultado.sort(key=lambda t: t["nome_turma"])

    for t in resultado:
        t["total_alunos"] = buscar_alunos_por_turma(t["nome_turma"]).count()

    return JsonResponse({
        "total_turmas": len(resultado),
        "turmas": resultado
    })


@csrf_exempt
def get_horarios_turma(request, nome_turma):
    nome_turma = unquote(nome_turma)

    registros_turma = AtravessaPor.objects.filter(turma=nome_turma).select_related("professor")
    if not registros_turma.exists():
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    horarios = HorarioAula.objects.filter(
        turma__in=registros_turma
    ).select_related("turma", "turma__professor").order_by("dia_semana", "hora_inicio")

    resultado = []
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        resultado.append({
            "id": h.id,
            "atravessa_por_id": h.turma_id,
            "dia_semana": h.dia_semana,
            "hora_inicio": h.hora_inicio.strftime("%H:%M"),
            "hora_fim": h.hora_fim.strftime("%H:%M"),
            "disciplina": disciplina.nome_disciplina if disciplina else h.turma.disciplina_lecionada,
            "professor": h.turma.professor.nome_completo,
        })

    primeiro_registro = registros_turma.first()

    return JsonResponse({
        "turma": {
            "nome_turma": nome_turma,
            "etapa": primeiro_registro.etapa,
            "escola": primeiro_registro.escola,
        },
        "total_horarios": len(resultado),
        "horarios": resultado
    })



@csrf_exempt
def get_opcoes_horario_turma(request, nome_turma):
    nome_turma = unquote(nome_turma)

    registros = AtravessaPor.objects.filter(turma=nome_turma).select_related("professor")
    if not registros.exists():
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    resultado = []
    for r in registros:
        disciplina = resolver_disciplina_da_turma(r)
        resultado.append({
            "atravessa_por_id": r.id,
            "disciplina": disciplina.nome_disciplina if disciplina else r.disciplina_lecionada,
            "professor": r.professor.nome_completo,
        })

    return JsonResponse({"opcoes": resultado})



@csrf_exempt
def salvar_horario_turma(request, nome_turma):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    nome_turma = unquote(nome_turma)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    atribuicoes = body.get("atribuicoes", [])
    if not atribuicoes:
        return JsonResponse({"message": "Nenhuma atribuição enviada."}, status=400)

    dias_validos = dict(HorarioAula.DIA_CHOICES).keys()
    erros = []
    total_salvos = 0
    total_removidos = 0

    for item in atribuicoes:
        dia = item.get("dia_semana")
        hora_inicio_str = item.get("hora_inicio")
        hora_fim_str = item.get("hora_fim")
        atravessa_por_id = item.get("atravessa_por_id")

        if dia not in dias_validos or not hora_inicio_str or not hora_fim_str:
            erros.append(f"Célula inválida ignorada: {item}")
            continue

        # Remove qualquer registro existente nessa célula (dia + hora de início) da turma.
        HorarioAula.objects.filter(
            turma__turma=nome_turma, dia_semana=dia, hora_inicio=hora_inicio_str
        ).delete()
        total_removidos += 1

        if atravessa_por_id:
            atravessa_por = AtravessaPor.objects.filter(id=atravessa_por_id, turma=nome_turma).first()
            if not atravessa_por:
                erros.append(f"Vínculo {atravessa_por_id} não pertence a esta turma — ignorado.")
                continue

            HorarioAula.objects.create(
                turma=atravessa_por,
                dia_semana=dia,
                hora_inicio=hora_inicio_str,
                hora_fim=hora_fim_str,
            )
            total_salvos += 1

    return JsonResponse({
        "message": "Grade de horários salva com sucesso.",
        "total_salvos": total_salvos,
        "erros": erros,
    })

@csrf_exempt
def get_disciplinas_corrigir(request):
    disciplinas = Disciplina.objects.all().order_by("nome_disciplina")

    resultado = []
    for d in disciplinas:
        total_vinculos = AtravessaPor.objects.filter(disciplina_lecionada__iexact=d.nome_disciplina).count()
        resultado.append({
            "id": d.id,
            "nome_disciplina": d.nome_disciplina,
            "total_vinculos": total_vinculos,
        })

    nomes_disciplina = set(d.nome_disciplina.strip().lower() for d in disciplinas)
    nomes_lecionados = AtravessaPor.objects.exclude(disciplina_lecionada="").values_list(
        "disciplina_lecionada", flat=True
    ).distinct()

    orfaos = []
    for nome in nomes_lecionados:
        if nome.strip().lower() not in nomes_disciplina:
            total = AtravessaPor.objects.filter(disciplina_lecionada=nome).count()
            orfaos.append({"nome_lecionado": nome, "total_vinculos": total})

    return JsonResponse({"disciplinas": resultado, "orfaos": orfaos})


@csrf_exempt
def renomear_disciplina(request, disciplina_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    disciplina = Disciplina.objects.filter(id=disciplina_id).first()
    if not disciplina:
        return JsonResponse({"message": "Disciplina não encontrada."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    novo_nome = (body.get("nome_disciplina") or "").strip()
    if not novo_nome:
        return JsonResponse({"message": "O nome não pode ficar vazio."}, status=400)

    disciplina.nome_disciplina = novo_nome
    disciplina.save()

    return JsonResponse({"message": "Disciplina renomeada com sucesso."})


@csrf_exempt
def criar_disciplina_corrigir(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome = (body.get("nome_disciplina") or "").strip()
    if not nome:
        return JsonResponse({"message": "O nome não pode ficar vazio."}, status=400)

    if Disciplina.objects.filter(nome_disciplina__iexact=nome).exists():
        return JsonResponse({"message": "Já existe uma disciplina com esse nome."}, status=400)

    disciplina = Disciplina.objects.create(nome_disciplina=nome)

    return JsonResponse({
        "message": "Disciplina criada com sucesso.",
        "disciplina": {"id": disciplina.id, "nome_disciplina": disciplina.nome_disciplina}
    })


@csrf_exempt
def corrigir_nome_lecionado(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_atual = (body.get("nome_atual") or "").strip()
    nome_correto = (body.get("nome_correto") or "").strip()

    if not nome_atual or not nome_correto:
        return JsonResponse({"message": "Informe 'nome_atual' e 'nome_correto'."}, status=400)

    total = AtravessaPor.objects.filter(disciplina_lecionada=nome_atual).update(
        disciplina_lecionada=nome_correto
    )

    return JsonResponse({
        "message": f"{total} vínculo(s) corrigido(s).",
        "total_corrigidos": total,
    })


@csrf_exempt
def get_turmas_corrigir(request):
    turmas_atravessa = set(
        AtravessaPor.objects.exclude(turma="").values_list("turma", flat=True).distinct()
    )
    turmas_estudante = set(
        Estudante.objects.exclude(turma="").values_list("turma", flat=True).distinct()
    )

    todas_turmas = sorted(turmas_atravessa | turmas_estudante)

    resultado = []
    for nome in todas_turmas:
        resultado.append({
            "nome_turma": nome,
            "existe_em_atravessa_por": nome in turmas_atravessa,
            "existe_em_estudante": nome in turmas_estudante,
            "total_registros": AtravessaPor.objects.filter(turma=nome).count(),
            "total_alunos": Estudante.objects.filter(turma=nome).count(),
        })

    return JsonResponse({"turmas": resultado})


@csrf_exempt
def renomear_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    turma_antiga = (body.get("turma_antiga") or "").strip()
    turma_nova = (body.get("turma_nova") or "").strip()

    if not turma_antiga or not turma_nova:
        return JsonResponse({"message": "Informe 'turma_antiga' e 'turma_nova'."}, status=400)

    total_atravessa = AtravessaPor.objects.filter(turma=turma_antiga).update(turma=turma_nova)
    total_estudante = Estudante.objects.filter(turma=turma_antiga).update(turma=turma_nova)

    return JsonResponse({
        "message": f"{total_atravessa} vínculo(s) e {total_estudante} aluno(s) atualizados.",
        "total_atravessa": total_atravessa,
        "total_estudante": total_estudante,
    })


@csrf_exempt
def get_membros_turma(request):
    if not _coordenador_logado(request):
        return JsonResponse({"message": "Não autenticado."}, status=401)

    nome_turma = (request.GET.get("turma") or "").strip()
    if not nome_turma:
        return JsonResponse({"message": "Informe a turma."}, status=400)

    alunos = Estudante.objects.filter(turma=nome_turma).order_by("posicao_ordem", "nome_completo")
    vinculos = (
        AtravessaPor.objects.filter(turma=nome_turma)
        .select_related("professor")
        .order_by("professor__nome_completo", "disciplina_lecionada")
    )

    return JsonResponse({
        "turma": nome_turma,
        "alunos": [{"id": a.id, "nome_completo": a.nome_completo} for a in alunos],
        "professores": [
            {
                "vinculo_id": v.id,
                "professor_id": v.professor_id,
                "nome_completo": v.professor.nome_completo,
                "disciplina": v.disciplina_lecionada or "",
            }
            for v in vinculos
        ],
        "opcoes_professores": [
            {"id": p.id, "nome_completo": p.nome_completo}
            for p in Professor.objects.all().order_by("nome_completo")
        ],
        "opcoes_disciplinas": list(
            Disciplina.objects.exclude(nome_disciplina__isnull=True)
            .exclude(nome_disciplina="")
            .order_by("nome_disciplina")
            .values_list("nome_disciplina", flat=True)
        ),
    })


@csrf_exempt
def adicionar_aluno_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)
    if not _coordenador_logado(request):
        return JsonResponse({"message": "Não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_turma = (body.get("turma") or "").strip()
    if not nome_turma:
        return JsonResponse({"message": "Informe a turma."}, status=400)

    aluno = Estudante.objects.filter(id=body.get("aluno_id")).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    if aluno.turma == nome_turma:
        return JsonResponse({"message": f"{aluno.nome_completo} já está nesta turma."}, status=400)

    aluno.turma = nome_turma
    aluno.save()

    return JsonResponse({"message": f"{aluno.nome_completo} adicionado(a) à turma {nome_turma}."})


@csrf_exempt
def remover_aluno_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)
    if not _coordenador_logado(request):
        return JsonResponse({"message": "Não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    aluno = Estudante.objects.filter(id=body.get("aluno_id")).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    # O aluno continua cadastrado — só fica sem turma até ser colocado em outra.
    turma_anterior = aluno.turma
    aluno.turma = ""
    aluno.save()

    return JsonResponse({"message": f"{aluno.nome_completo} removido(a) da turma {turma_anterior}."})


@csrf_exempt
def adicionar_professor_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"message": "Não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_turma = (body.get("turma") or "").strip()
    disciplina = (body.get("disciplina") or "").strip()
    if not nome_turma or not disciplina:
        return JsonResponse({"message": "Informe a turma e a disciplina."}, status=400)

    professor = Professor.objects.filter(id=body.get("professor_id")).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    if AtravessaPor.objects.filter(
        professor=professor, turma=nome_turma, disciplina_lecionada=disciplina
    ).exists():
        return JsonResponse(
            {"message": f"{professor.nome_completo} já leciona {disciplina} nesta turma."},
            status=400
        )

    # Escola e etapa acompanham os vínculos que a turma já tem, para o novo
    # vínculo aparecer junto dos demais nas telas que agrupam por esses campos.
    referencia = AtravessaPor.objects.filter(turma=nome_turma).first()

    AtravessaPor.objects.create(
        professor=professor,
        escola=referencia.escola if referencia else (coordenador.escola or ""),
        turma=nome_turma,
        etapa=referencia.etapa if referencia else "",
        disciplina_lecionada=disciplina,
    )

    return JsonResponse({
        "message": f"{professor.nome_completo} adicionado(a) à turma {nome_turma} ({disciplina})."
    })


@csrf_exempt
def remover_professor_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)
    if not _coordenador_logado(request):
        return JsonResponse({"message": "Não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    vinculo = AtravessaPor.objects.filter(id=body.get("vinculo_id")).select_related("professor").first()
    if not vinculo:
        return JsonResponse({"message": "Vínculo não encontrado."}, status=404)

    # Apagar o vínculo apaga em cascata o que foi lançado nele; com notas ou
    # frequências registradas, a remoção é bloqueada (mesma regra da edição
    # de professores).
    if Nota.objects.filter(turma_id=vinculo.id).exists() or Frequencia.objects.filter(turma_id=vinculo.id).exists():
        return JsonResponse(
            {
                "message": (
                    f"Não é possível remover {vinculo.professor.nome_completo}: existem notas ou "
                    f"frequências lançadas neste vínculo. Remova os lançamentos antes."
                )
            },
            status=400
        )

    nome_professor = vinculo.professor.nome_completo
    nome_turma = vinculo.turma
    vinculo.delete()

    return JsonResponse({"message": f"{nome_professor} removido(a) da turma {nome_turma}."})


@csrf_exempt
def get_alunos_corrigir(request):
    busca = request.GET.get("busca", "").strip()

    alunos = Estudante.objects.all().order_by("nome_completo")
    if busca:
        alunos = alunos.filter(nome_completo__icontains=busca)

    resultado = [
        {"id": a.id, "nome_completo": a.nome_completo, "turma": a.turma, "serie": a.serie, "escola": a.escola}
        for a in alunos[:200]
    ]

    turmas_disponiveis = sorted(
        set(Estudante.objects.exclude(turma="").values_list("turma", flat=True).distinct())
        | set(AtravessaPor.objects.exclude(turma="").values_list("turma", flat=True).distinct())
    )

    return JsonResponse({
        "total_alunos": len(resultado),
        "alunos": resultado,
        "turmas_disponiveis": turmas_disponiveis,
    })


@csrf_exempt
def mover_aluno_turma(request, aluno_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nova_turma = (body.get("turma") or "").strip()
    if not nova_turma:
        return JsonResponse({"message": "Informe a nova turma."}, status=400)

    aluno.turma = nova_turma
    aluno.save()

    return JsonResponse({"message": f"{aluno.nome_completo} movido para {nova_turma}."})


@csrf_exempt
def get_eventos_professor_visualizacao(request):
    professor = _professor_logado(request)

    if not professor:
        return JsonResponse({"message": "Professor não autenticado."}, status=401)

    mes = request.GET.get("mes")
    ano = request.GET.get("ano")

    nomes_turmas_professor = set(
        AtravessaPor.objects.filter(professor=professor)
        .exclude(turma="")
        .values_list("turma", flat=True)
        .distinct()
    )

    eventos = Evento.objects.select_related("turma", "professor", "coordenador").filter(
        models.Q(turma__isnull=True) | models.Q(turma__turma__in=nomes_turmas_professor)
    )

    if mes and ano:
        eventos = eventos.filter(data__year=ano, data__month=mes)
    elif ano:
        eventos = eventos.filter(data__year=ano)

    hoje = date.today()

    resultado = []
    for e in eventos.order_by("data"):
        if e.coordenador:
            criado_por = e.coordenador.escola or "Organização"
            origem = "coordenacao"
        elif e.professor:
            criado_por = e.professor.nome_completo
            origem = "professor"
        else:
            criado_por = None
            origem = None

        resultado.append({
            "id": e.id,
            "titulo": e.titulo,
            "descricao": e.descricao,
            "data": e.data.isoformat(),
            "turma_id": e.turma_id,
            "nome_turma": e.turma.turma if e.turma else None,
            "criado_por": criado_por,
            "origem": origem,
            "finalizado": e.data < hoje,
        })

    return JsonResponse({
        "total_eventos": len(resultado),
        "eventos": resultado
    })

@csrf_exempt
def get_disciplinas_coordenacao(request):
    disciplinas = Disciplina.objects.all().order_by("nome_disciplina")

    resultado = []
    for d in disciplinas:
        total_vinculos = AtravessaPor.objects.filter(
            disciplina_lecionada__iexact=d.nome_disciplina
        ).count()
        resultado.append({
            "id": d.id,
            "nome_disciplina": d.nome_disciplina,
            "total_vinculos": total_vinculos,
        })

    return JsonResponse({
        "total": len(resultado),
        "disciplinas": resultado,
    })


@csrf_exempt
def renomear_disciplina_coordenacao(request, disciplina_id):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    disciplina = Disciplina.objects.filter(id=disciplina_id).first()
    if not disciplina:
        return JsonResponse({"message": "Disciplina não encontrada."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    novo_nome = (body.get("nome_disciplina") or "").strip()
    if not novo_nome:
        return JsonResponse({"message": "O nome não pode ficar vazio."}, status=400)

    if Disciplina.objects.filter(nome_disciplina__iexact=novo_nome).exclude(id=disciplina_id).exists():
        return JsonResponse({"message": "Já existe outra disciplina com esse nome."}, status=400)

    disciplina.nome_disciplina = novo_nome
    disciplina.save()

    return JsonResponse({"message": "Disciplina renomeada com sucesso."})


MODELOS_POR_TIPO_BLOG = {
    "ALUNO": Estudante,
    "PROFESSOR": Professor,
    "RESPONSAVEL": Responsavel,
    "COORDENADOR": Coordenador,
}


def _sessao_blog_atual(request):
    token = request.COOKIES.get("blog_session")
    if not token:
        return None
    return _sessao_ativa(Sessao.objects.filter(token=token).first())


# @csrf_exempt
# @require_http_methods(["POST"])
# def blog_login(request):
#     body = json.loads(request.body or "{}")
#     nome_completo = (body.get("nome_completo") or "").strip().upper()
#     senha = (body.get("senha") or "").strip()
#     tipo = (body.get("tipo") or "").strip().upper()

#     modelo = MODELOS_POR_TIPO_BLOG.get(tipo)
#     if not modelo:
#         return JsonResponse({"return": False, "detail": "Tipo inválido."}, status=400)

#     usuario = modelo.objects.filter(nome_completo=nome_completo, senha=senha).first()
#     if not usuario:
#         return JsonResponse({"return": False, "detail": "Nome ou senha inválidos."}, status=401)

#     sessao = Sessao.objects.create(tipo=tipo, referencia_id=usuario.id, nome_completo=usuario.nome_completo)

#     response = JsonResponse({"return": True, "usuario": {"nome_completo": usuario.nome_completo, "tipo": tipo}})
#     response.set_cookie(
#         "blog_session", sessao.token,
#         max_age=COOKIE_MAX_AGE,
#         httponly=True,
#         samesite="None",
#         secure=True,
#     )
#     return response


# @csrf_exempt
# @require_http_methods(["GET"])
# def blog_auth(request):
#     sessao = _sessao_blog_atual(request)
#     if not sessao:
#         return JsonResponse({"return": False})
#     return JsonResponse({
#         "return": True,
#         "usuario": {
#             "nome_completo": sessao.nome_completo,
#             "tipo": sessao.tipo,
#             "referencia_id": sessao.referencia_id,
#         },
#     })
@csrf_exempt
@require_http_methods(["POST"])
def blog_login(request):
    body = json.loads(request.body or "{}")
    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip()
    tipo = (body.get("tipo") or "").strip().upper()

    modelo = MODELOS_POR_TIPO_BLOG.get(tipo)
    if not modelo:
        return JsonResponse({"return": False, "detail": "Tipo inválido."}, status=400)

    usuario = modelo.objects.filter(nome_completo=nome_completo, senha=senha).first()
    if not usuario:
        return JsonResponse({"return": False, "detail": "Nome ou senha inválidos."}, status=401)

    sessao = Sessao.objects.create(tipo=tipo, referencia_id=usuario.id, nome_completo=usuario.nome_completo)
    perfil = _obter_ou_criar_perfil_blog(tipo, usuario.id, usuario.nome_completo)

    response = JsonResponse({
        "return": True,
        "usuario": {"nome_completo": usuario.nome_completo, "tipo": tipo, "nome_usuario": perfil.nome_usuario},
    })
    response.set_cookie(
        "blog_session", sessao.token,
        max_age=COOKIE_MAX_AGE, httponly=True, samesite="None", secure=True,
    )
    return response


@csrf_exempt
@require_http_methods(["GET"])
def blog_auth(request):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"return": False})

    perfil = _obter_ou_criar_perfil_blog(sessao.tipo, sessao.referencia_id, sessao.nome_completo)

    return JsonResponse({
        "return": True,
        "usuario": {
            "nome_completo": sessao.nome_completo,
            "tipo": sessao.tipo,
            "referencia_id": sessao.referencia_id,
            "nome_usuario": perfil.nome_usuario,
        },
    })



@csrf_exempt
def get_posts(request):
    sessao = _sessao_blog_atual(request)

    resultado = []
    for p in Post.objects.all():
        curtido_por_mim = False
        if sessao:
            curtido_por_mim = Curtida.objects.filter(
                post=p, autor_tipo=sessao.tipo, autor_id=sessao.referencia_id
            ).exists()

        # resultado.append({
        #     "id": p.id,
        #     "titulo": p.titulo,
        #     "resumo": (p.conteudo[:220] + "…") if len(p.conteudo) > 220 else p.conteudo,
        #     "imagem_url": caminho_relativo_arquivo(p.imagem) if p.imagem else None,
        #     "tempo_leitura": p.tempo_leitura,
        #     "data_criacao": p.data_criacao.isoformat(),
        #     "autor_nome": p.autor_nome,
        #     "autor_tipo": p.autor_tipo,
        #     "autor_id": p.autor_id,
        #     "total_curtidas": p.curtidas.count(),
        #     "total_comentarios": p.comentarios.count(),
        #     "curtido_por_mim": curtido_por_mim,
        # })
        resultado.append({
            "id": p.id,
            "titulo": p.titulo,
            "resumo": (p.conteudo[:220] + "…") if len(p.conteudo) > 220 else p.conteudo,
            "imagem_url": caminho_relativo_arquivo(p.imagem) if p.imagem else None,
            "tempo_leitura": p.tempo_leitura,
            "data_criacao": p.data_criacao.isoformat(),
            "autor_nome": p.autor_nome,
            "autor_tipo": p.autor_tipo,
            "autor_id": p.autor_id,
            "autor_username": _username_do_autor(p.autor_tipo, p.autor_id, p.autor_nome),  # <- novo
            "total_curtidas": p.curtidas.count(),
            "total_comentarios": p.comentarios.count(),
            "curtido_por_mim": curtido_por_mim,
        })


    return JsonResponse({"total_posts": len(resultado), "posts": resultado})


@csrf_exempt
def get_post_detalhe(request, post_id):
    sessao = _sessao_blog_atual(request)
    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    curtido_por_mim = False
    if sessao:
        curtido_por_mim = Curtida.objects.filter(
            post=post, autor_tipo=sessao.tipo, autor_id=sessao.referencia_id
        ).exists()

    comentarios = [
        {
            "id": c.id,
            "autor_nome": c.autor_nome,
            "autor_tipo": c.autor_tipo,
            "conteudo": c.conteudo,
            "data_criacao": c.data_criacao.isoformat(),
        }
        for c in post.comentarios.all()
    ]

    return JsonResponse({
        "post": {
            "id": post.id,
            "titulo": post.titulo,
            "conteudo": post.conteudo,
            "imagem_url": caminho_relativo_arquivo(post.imagem) if post.imagem else None,
            "tempo_leitura": post.tempo_leitura,
            "data_criacao": post.data_criacao.isoformat(),
            "autor_nome": post.autor_nome,
            "autor_tipo": post.autor_tipo,
            "autor_id": post.autor_id,
            "autor_username": _username_do_autor(post.autor_tipo, post.autor_id, post.autor_nome),
            "total_curtidas": post.curtidas.count(),
            "curtido_por_mim": curtido_por_mim,
        },
        "comentarios": comentarios,
    })


@csrf_exempt
@require_http_methods(["POST"])
def criar_post(request):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"message": "Você precisa estar autenticado para publicar."}, status=401)

    titulo = (request.POST.get("titulo") or "").strip()
    conteudo = (request.POST.get("conteudo") or "").strip()
    imagem = request.FILES.get("imagem")

    if not titulo or not conteudo:
        return JsonResponse({"message": "Campos 'titulo' e 'conteudo' são obrigatórios."}, status=400)

    post = Post.objects.create(
        autor_tipo=sessao.tipo,
        autor_id=sessao.referencia_id,
        autor_nome=sessao.nome_completo,
        titulo=titulo,
        conteudo=conteudo,
        imagem=imagem,
    )

    return JsonResponse({
        "message": "Post publicado com sucesso.",
        "post": {
            "id": post.id,
            "titulo": post.titulo,
            "tempo_leitura": post.tempo_leitura,
            "data_criacao": post.data_criacao.isoformat(),
            "imagem_url": caminho_relativo_arquivo(post.imagem) if post.imagem else None,
        },
    })


@csrf_exempt
@require_http_methods(["POST"])
def editar_post(request, post_id):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"message": "Você precisa estar autenticado."}, status=401)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    if post.autor_tipo != sessao.tipo or post.autor_id != sessao.referencia_id:
        return JsonResponse({"message": "Você não tem permissão para editar este post."}, status=403)

    titulo = (request.POST.get("titulo") or "").strip()
    conteudo = (request.POST.get("conteudo") or "").strip()
    remover_imagem = request.POST.get("remover_imagem") == "true"
    nova_imagem = request.FILES.get("imagem")

    if not titulo or not conteudo:
        return JsonResponse({"message": "Campos 'titulo' e 'conteudo' são obrigatórios."}, status=400)

    post.titulo = titulo
    post.conteudo = conteudo

    if nova_imagem:
        post.imagem = nova_imagem
    elif remover_imagem:
        post.imagem = None

    post.save()

    return JsonResponse({"message": "Post atualizado com sucesso."})


@csrf_exempt
@require_http_methods(["DELETE"])
def deletar_post(request, post_id):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"message": "Você precisa estar autenticado."}, status=401)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    if post.autor_tipo != sessao.tipo or post.autor_id != sessao.referencia_id:
        return JsonResponse({"message": "Você não tem permissão para apagar este post."}, status=403)

    post.delete()
    return JsonResponse({"message": "Post removido com sucesso."})


@csrf_exempt
@require_http_methods(["POST"])
def curtir_post(request, post_id):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"message": "Você precisa estar autenticado para curtir."}, status=401)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    curtida = Curtida.objects.filter(post=post, autor_tipo=sessao.tipo, autor_id=sessao.referencia_id).first()
    if curtida:
        curtida.delete()
        curtido = False
    else:
        Curtida.objects.create(post=post, autor_tipo=sessao.tipo, autor_id=sessao.referencia_id)
        curtido = True

    return JsonResponse({"curtido": curtido, "total_curtidas": post.curtidas.count()})


@csrf_exempt
@require_http_methods(["POST"])
def comentar_post(request, post_id):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"message": "Você precisa estar autenticado para comentar."}, status=401)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"message": "O comentário não pode ficar vazio."}, status=400)

    comentario = Comentario.objects.create(
        post=post, autor_tipo=sessao.tipo, autor_id=sessao.referencia_id,
        autor_nome=sessao.nome_completo, conteudo=conteudo,
    )

    return JsonResponse({
        "id": comentario.id, "autor_nome": comentario.autor_nome,
        "conteudo": comentario.conteudo, "data_criacao": comentario.data_criacao.isoformat(),
    }, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def deletar_comentario(request, comentario_id):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"message": "Não autenticado."}, status=401)

    comentario = Comentario.objects.filter(id=comentario_id).first()
    if not comentario:
        return JsonResponse({"message": "Comentário não encontrado."}, status=404)

    if comentario.autor_tipo != sessao.tipo or comentario.autor_id != sessao.referencia_id:
        return JsonResponse({"message": "Você só pode apagar seus próprios comentários."}, status=403)

    comentario.delete()
    return JsonResponse({"message": "Comentário removido."})


@csrf_exempt
def avaliacoes_list_create(request):
    professor = _professor_atual(request)
    if not professor:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    if request.method == "GET":
        turma = request.GET.get("turma")
        qs = Avaliacao.objects.filter(professor=professor)
        if turma:
            qs = qs.filter(turma=turma)
        data = [{
            "id": a.id,
            "titulo": a.titulo,
            "turma": a.turma,
            "disciplina": a.disciplina.nome_disciplina,
            "data": a.data.isoformat(),
            "ano_letivo": a.ano_letivo,
            "total_questoes": a.questoes.count(),
        } for a in qs.order_by("-data")]
        return JsonResponse({"avaliacoes": data}, status=200)

    if request.method == "POST":
        try:
            body = json.loads(request.body)
            disciplina_nome = body["disciplina"]
            disciplina = Disciplina.objects.filter(nome_disciplina=disciplina_nome).first()
            if not disciplina:
                return JsonResponse({"message": f"Disciplina '{disciplina_nome}' não encontrada"}, status=400)
            avaliacao = Avaliacao.objects.create(
                professor=professor,
                turma=body["turma"],
                disciplina=disciplina,
                titulo=body["titulo"],
                descricao=body.get("descricao", ""),
                data=body["data"],
                ano_letivo=body["ano_letivo"],
            )
            for i, q in enumerate(body.get("questoes", [])):
                questao = Questao.objects.create(
                    avaliacao=avaliacao,
                    ordem=i,
                    enunciado=q["enunciado"],
                    tipo=q["tipo"],
                )
                for alt in q.get("alternativas", []):
                    Alternativa.objects.create(
                        questao=questao,
                        letra=alt["letra"],
                        texto=alt["texto"],
                        correta=alt.get("correta", False),
                    )
            return JsonResponse({"id": avaliacao.id}, status=201)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=400)

    return JsonResponse({"message": "Método não permitido"}, status=405)


@csrf_exempt
def avaliacao_detail(request, avaliacao_id):
    professor = _professor_atual(request)
    if not professor:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    try:
        avaliacao = Avaliacao.objects.get(id=avaliacao_id, professor=professor)
    except Avaliacao.DoesNotExist:
        return JsonResponse({"message": "Avaliação não encontrada"}, status=404)

    if request.method == "GET":
        questoes = []
        for q in avaliacao.questoes.all():
            questoes.append({
                "id": q.id,
                "ordem": q.ordem,
                "enunciado": q.enunciado,
                "tipo": q.tipo,
                "imagem": q.imagem.url if q.imagem else None,
                "alternativas": [
                    {"letra": a.letra, "texto": a.texto, "correta": a.correta}
                    for a in q.alternativas.all()
                ] if q.tipo == "OBJETIVA" else [],
            })
        return JsonResponse({
            "id": avaliacao.id,
            "titulo": avaliacao.titulo,
            "descricao": avaliacao.descricao,
            "turma": avaliacao.turma,
            "disciplina": avaliacao.disciplina.nome_disciplina,
            "data": avaliacao.data.isoformat(),
            "ano_letivo": avaliacao.ano_letivo,
            "questoes": questoes,
        }, status=200)

    if request.method in ("PUT", "PATCH"):
        try:
            body = json.loads(request.body)
            avaliacao.titulo = body.get("titulo", avaliacao.titulo)
            avaliacao.descricao = body.get("descricao", avaliacao.descricao)
            avaliacao.data = body.get("data", avaliacao.data)
            avaliacao.save()
            return JsonResponse({"message": "Atualizado"}, status=200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=400)

    if request.method == "DELETE":
        avaliacao.delete()
        return JsonResponse({"message": "Excluído"}, status=200)

    return JsonResponse({"message": "Método não permitido"}, status=405)


@csrf_exempt
def avaliacao_upload_imagem(request, questao_id):
    questao = Questao.objects.get(id=questao_id)
    if request.method == "POST" and request.FILES.get("imagem"):
        questao.imagem = request.FILES["imagem"]
        questao.save()
        return JsonResponse({"url": questao.imagem.url}, status=200)
    return JsonResponse({"message": "Nenhuma imagem enviada"}, status=400)


def avaliacao_emitir_pdf(request, avaliacao_id):
    professor = _professor_atual(request)
    if not professor:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    try:
        avaliacao = Avaliacao.objects.select_related("disciplina", "professor").get(
            id=avaliacao_id, professor=professor
        )
    except Avaliacao.DoesNotExist:
        return JsonResponse({"message": "Avaliação não encontrada"}, status=404)

    pdf_file = _gerar_pdf_avaliacao(avaliacao)

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="avaliacao_{avaliacao.id}.pdf"'
    return response


def _quebrar_texto(texto, largura_max):
    palavras = texto.split()
    linhas, atual = [], ""
    for palavra in palavras:
        if len(atual) + len(palavra) + 1 <= largura_max:
            atual = f"{atual} {palavra}".strip()
        else:
            linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def opcoes_avaliacao(request):
    professor = _professor_atual(request)
    if not professor:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    vinculos = AtravessaPor.objects.filter(professor=professor).values_list(
        "turma", "disciplina_lecionada"
    ).distinct()

    turmas = sorted(set(t for t, _ in vinculos))
    disciplinas_por_turma = {}
    for turma, disciplina in vinculos:
        disciplinas_por_turma.setdefault(turma, [])
        if disciplina not in disciplinas_por_turma[turma]:
            disciplinas_por_turma[turma].append(disciplina)

    return JsonResponse({
        "professor": {"nome_completo": professor.nome_completo},
        "turmas": turmas,
        "disciplinas_por_turma": disciplinas_por_turma,
    })


@csrf_exempt
def get_avaliacoes_coordenacao(request):
    coordenador = _coordenador_atual(request)
    if not coordenador:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    turma = request.GET.get("turma")
    professor_id = request.GET.get("professor")

    qs = Avaliacao.objects.select_related("professor", "disciplina").all()

    if turma:
        qs = qs.filter(turma=turma)
    if professor_id:
        qs = qs.filter(professor_id=professor_id)

    resultado = [
        {
            "id": a.id,
            "titulo": a.titulo,
            "turma": a.turma,
            "disciplina": a.disciplina.nome_disciplina,
            "professor": a.professor.nome_completo,
            "professor_id": a.professor_id,
            "data": a.data.isoformat(),
            "ano_letivo": a.ano_letivo,
            "total_questoes": a.questoes.count(),
        }
        for a in qs.order_by("-data")
    ]

    return JsonResponse({
        "total_avaliacoes": len(resultado),
        "avaliacoes": resultado,
    })

def _gerar_pdf_avaliacao(avaliacao):
    aluno_da_turma = Estudante.objects.filter(turma=avaliacao.turma).first()
    curso = aluno_da_turma.curso if aluno_da_turma else "—"

    logo_path = os.path.join(settings.BASE_DIR, "app", "static", "logo.png")
    logo_url = f"file://{logo_path}"

    questoes_contexto = []
    for q in avaliacao.questoes.all().order_by("ordem"):
        questoes_contexto.append({
            "enunciado": q.enunciado,
            "tipo": q.tipo,
            "tipo_label": "Objetiva" if q.tipo == "OBJETIVA" else "Subjetiva",
            "imagem_url": q.imagem.url if q.imagem else None,
            "alternativas": q.alternativas.all() if q.tipo == "OBJETIVA" else [],
        })

    contexto = {
        "avaliacao": avaliacao,
        "curso": curso,
        "logo_url": logo_url,
        "questoes": questoes_contexto,
    }

    html_string = render_to_string("avaliacoes/pdf.html", contexto)
    from .pdf import html_to_pdf
    return html_to_pdf(html_string)

@csrf_exempt
def avaliacao_detalhe_coordenacao(request, avaliacao_id):
    coordenador = _coordenador_atual(request)
    if not coordenador:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    try:
        avaliacao = Avaliacao.objects.select_related("disciplina", "professor").get(id=avaliacao_id)
    except Avaliacao.DoesNotExist:
        return JsonResponse({"message": "Avaliação não encontrada"}, status=404)

    questoes = []
    for q in avaliacao.questoes.all().order_by("ordem"):
        questoes.append({
            "id": q.id,
            "ordem": q.ordem,
            "enunciado": q.enunciado,
            "tipo": q.tipo,
            "imagem": q.imagem.url if q.imagem else None,
            "alternativas": [
                {"letra": a.letra, "texto": a.texto, "correta": a.correta}
                for a in q.alternativas.all()
            ] if q.tipo == "OBJETIVA" else [],
        })

    return JsonResponse({
        "id": avaliacao.id,
        "titulo": avaliacao.titulo,
        "descricao": avaliacao.descricao,
        "turma": avaliacao.turma,
        "disciplina": avaliacao.disciplina.nome_disciplina,
        "professor": avaliacao.professor.nome_completo,
        "data": avaliacao.data.isoformat(),
        "ano_letivo": avaliacao.ano_letivo,
        "questoes": questoes,
    }, status=200)


@csrf_exempt
def avaliacao_emitir_pdf_coordenacao(request, avaliacao_id):
    coordenador = _coordenador_atual(request)
    if not coordenador:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    try:
        avaliacao = Avaliacao.objects.select_related("disciplina", "professor").get(id=avaliacao_id)
    except Avaliacao.DoesNotExist:
        return JsonResponse({"message": "Avaliação não encontrada"}, status=404)

    pdf_file = _gerar_pdf_avaliacao(avaliacao)

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="avaliacao_{avaliacao.id}.pdf"'
    return response

@csrf_exempt
def get_avaliacoes_professor(request):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"message": "Professor não autenticado."}, status=401)

    avaliacoes = Avaliacao.objects.filter(professor=professor).select_related("turma").order_by("-data")

    resultado = []
    for a in avaliacoes:
        disciplina = resolver_disciplina_da_turma(a.turma)
        resultado.append({
            "id": a.id,
            "titulo": a.titulo,
            "curso": a.curso,
            "data": a.data.isoformat(),
            "nome_turma": a.turma.turma,
            "disciplina": disciplina.nome_disciplina if disciplina else a.turma.disciplina_lecionada,
            "total_questoes": a.questoes.count(),
        })

    return JsonResponse({
        "total_avaliacoes": len(resultado),
        "avaliacoes": resultado
    })


@csrf_exempt
def criar_avaliacao(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"message": "Professor não autenticado."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    curso = (body.get("curso") or "").strip()
    turma_id = body.get("turma")
    data_str = body.get("data")
    questoes_input = body.get("questoes", [])

    if not titulo:
        return JsonResponse({"message": "O título é obrigatório."}, status=400)
    if not turma_id:
        return JsonResponse({"message": "Selecione a turma."}, status=400)
    if not questoes_input:
        return JsonResponse({"message": "Adicione ao menos uma questão."}, status=400)

    turma = AtravessaPor.objects.filter(id=turma_id, professor=professor).first()
    if not turma:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    data_avaliacao = date.today()
    if data_str:
        try:
            data_avaliacao = date.fromisoformat(data_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    erros = []
    for i, q in enumerate(questoes_input):
        tipo = q.get("tipo")
        enunciado = (q.get("enunciado") or "").strip()
        if tipo not in ("DISSERTATIVA", "OBJETIVA"):
            erros.append(f"Questão {i + 1}: tipo inválido.")
        if not enunciado:
            erros.append(f"Questão {i + 1}: enunciado obrigatório.")
        if tipo == "OBJETIVA":
            alternativas = [a for a in (q.get("alternativas") or []) if (a or "").strip()]
            if len(alternativas) < 2:
                erros.append(f"Questão {i + 1}: adicione ao menos duas alternativas.")

    if erros:
        return JsonResponse({"message": " | ".join(erros)}, status=400)

    avaliacao = Avaliacao.objects.create(
        professor=professor,
        turma=turma,
        titulo=titulo,
        curso=curso,
        data=data_avaliacao,
    )

    for i, q in enumerate(questoes_input):
        questao = Questao.objects.create(
            avaliacao=avaliacao,
            ordem=i,
            tipo=q["tipo"],
            enunciado=q["enunciado"].strip(),
        )

        if q["tipo"] == "OBJETIVA":
            for j, texto_alt in enumerate(q.get("alternativas", [])):
                texto_alt = (texto_alt or "").strip()
                if texto_alt:
                    Alternativa.objects.create(questao=questao, ordem=j, texto=texto_alt)

    return JsonResponse({
        "message": "Avaliação criada com sucesso.",
        "avaliacao": {"id": avaliacao.id}
    })


@csrf_exempt
def gerar_avaliacao_pdf(request, avaliacao_id):
    avaliacao = Avaliacao.objects.select_related("turma").filter(id=avaliacao_id).first()
    if not avaliacao:
        return JsonResponse({"message": "Avaliação não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(avaliacao.turma)

    questoes = avaliacao.questoes.prefetch_related("alternativas").all()

    letras = string.ascii_uppercase
    for questao in questoes:
        for idx, alternativa in enumerate(questao.alternativas.all()):
            alternativa.letra = letras[idx] if idx < len(letras) else "?"

    logo_path = f"file://{os.path.join(settings.BASE_DIR, 'app', 'static', 'logo.png')}"

    contexto = {
        "avaliacao": avaliacao,
        "disciplina": disciplina.nome_disciplina if disciplina else avaliacao.turma.disciplina_lecionada,
        "questoes": questoes,
        "logo_path": logo_path,
    }

    html_string = render_to_string("avaliacoes/pdf_folha.html", contexto)
    from .pdf import html_to_pdf
    pdf_file = html_to_pdf(html_string)

    nome_arquivo = f"avaliacao_{avaliacao.id}.pdf"
    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response


@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagens_list_create_coordenacao(request):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    if request.method == "GET":
        conversas = (
            Conversa.objects.filter(coordenador=coordenador)
            .select_related("professor")
            .order_by("-ultima_atualizacao")
        )
        resultado = []
        for c in conversas:
            ultima = c.mensagens.last()
            nao_lidas = c.mensagens.filter(
                remetente_tipo="PROFESSOR", lida_coordenacao=False
            ).count()
            resultado.append({
                "id": c.id,
                "professor_nome": c.professor.nome_completo,
                "ultima_mensagem": ultima.conteudo if ultima else None,
                "ultima_atualizacao": c.ultima_atualizacao.isoformat(),
                "nao_lidas": nao_lidas,
            })
        return JsonResponse(resultado, safe=False)

    body = json.loads(request.body or "{}")
    professor_id = body.get("professor_id")
    conteudo = (body.get("conteudo") or "").strip()

    if not professor_id or not conteudo:
        return JsonResponse({"detail": "professor_id e conteudo são obrigatórios."}, status=400)

    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"detail": "Professor não encontrado."}, status=404)

    conversa, _ = Conversa.objects.get_or_create(
        professor=professor, coordenador=coordenador
    )
    MensagemChat.objects.create(
        conversa=conversa, remetente_tipo="COORDENACAO", conteudo=conteudo,
        lida_coordenacao=True,
    )
    conversa.save()

    return JsonResponse({"conversa_id": conversa.id}, status=201)


def _nome_escola(escola_str):
    if not escola_str:
        return escola_str
    return escola_str.split(" - ", 1)[-1].strip()


@csrf_exempt
@require_http_methods(["GET"])
def opcoes_mensagem_coordenacao(request):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    nome_escola = _nome_escola(coordenador.escola)

    professores = Professor.objects.filter(
        atravessamentos__escola__iexact=nome_escola
    ).distinct().order_by("nome_completo")

    return JsonResponse({
        "professores": [
            {"id": p.id, "nome_completo": p.nome_completo} for p in professores
        ]
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagem_conversa_detalhe(request, conversa_id):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    conversa = Conversa.objects.filter(id=conversa_id, coordenador=coordenador).select_related("professor").first()
    if not conversa:
        return JsonResponse({"detail": "Conversa não encontrada."}, status=404)

    if request.method == "GET":
        conversa.mensagens.filter(remetente_tipo="PROFESSOR", lida_coordenacao=False).update(lida_coordenacao=True)
        mensagens = [
            {
                "id": m.id,
                "remetente_tipo": m.remetente_tipo,
                "conteudo": m.conteudo,
                "data_envio": m.data_envio.isoformat(),
            }
            for m in conversa.mensagens.all()
        ]
        return JsonResponse({
            "conversa": {
                "id": conversa.id,
                "professor_nome": conversa.professor.nome_completo,
            },
            "mensagens": mensagens,
        })

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"detail": "conteudo é obrigatório."}, status=400)

    mensagem = MensagemChat.objects.create(
        conversa=conversa, remetente_tipo="COORDENACAO", conteudo=conteudo,
        lida_coordenacao=True,
    )
    conversa.save()

    return JsonResponse({
        "id": mensagem.id,
        "remetente_tipo": mensagem.remetente_tipo,
        "conteudo": mensagem.conteudo,
        "data_envio": mensagem.data_envio.isoformat(),
    }, status=201)


@csrf_exempt
@require_http_methods(["GET"])
def mensagens_list_professor(request):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    conversas = (
        Conversa.objects.filter(professor=professor)
        .select_related("coordenador")
        .order_by("-ultima_atualizacao")
    )
    resultado = []
    for c in conversas:
        ultima = c.mensagens.last()
        nao_lidas = c.mensagens.filter(
            remetente_tipo="COORDENACAO", lida_professor=False
        ).count()
        resultado.append({
            "id": c.id,
            "ultima_mensagem": ultima.conteudo if ultima else None,
            "ultima_atualizacao": c.ultima_atualizacao.isoformat(),
            "nao_lidas": nao_lidas,
        })
    return JsonResponse(resultado, safe=False)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagem_conversa_detalhe_professor(request, conversa_id):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    conversa = Conversa.objects.filter(id=conversa_id, professor=professor).first()
    if not conversa:
        return JsonResponse({"detail": "Conversa não encontrada."}, status=404)

    if request.method == "GET":
        conversa.mensagens.filter(remetente_tipo="COORDENACAO", lida_professor=False).update(lida_professor=True)
        mensagens = [
            {
                "id": m.id,
                "remetente_tipo": m.remetente_tipo,
                "conteudo": m.conteudo,
                "data_envio": m.data_envio.isoformat(),
            }
            for m in conversa.mensagens.all()
        ]
        return JsonResponse({"mensagens": mensagens})

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"detail": "conteudo é obrigatório."}, status=400)

    mensagem = MensagemChat.objects.create(
        conversa=conversa, remetente_tipo="PROFESSOR", conteudo=conteudo,
        lida_professor=True,
    )
    conversa.save()

    return JsonResponse({
        "id": mensagem.id,
        "remetente_tipo": mensagem.remetente_tipo,
        "conteudo": mensagem.conteudo,
        "data_envio": mensagem.data_envio.isoformat(),
    }, status=201)

@csrf_exempt
@require_http_methods(["GET"])
def opcoes_notas_coordenacao(request):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    nome_escola = _nome_escola(coordenador.escola)

    vinculos = AtravessaPor.objects.filter(
        escola__iexact=nome_escola
    ).select_related("professor").order_by("turma", "disciplina_lecionada")

    return JsonResponse({
        "vinculos": [
            {
                "id": v.id,
                "turma": v.turma,
                "disciplina_lecionada": v.disciplina_lecionada,
                "professor_nome": v.professor.nome_completo,
            }
            for v in vinculos
        ]
    })


@csrf_exempt
@require_http_methods(["GET"])
def notas_turma_coordenacao(request, vinculo_id):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculo = AtravessaPor.objects.filter(
        id=vinculo_id, escola__iexact=_nome_escola(coordenador.escola)
    ).select_related("professor").first()
    if not vinculo:
        return JsonResponse({"detail": "Vínculo não encontrado."}, status=404)

    disciplina = resolver_disciplina_da_turma(vinculo)
    alunos = buscar_alunos_por_turma(vinculo.turma).order_by("posicao_ordem", "nome_completo")

    resultado = []
    for aluno in alunos:
        nota = Nota.objects.filter(
            aluno=aluno, disciplina=disciplina, turma=vinculo, professor=vinculo.professor
        ).first()
        resultado.append({
            "aluno_id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "posicao_ordem": aluno.posicao_ordem,
            "notas": {
                "nm1_t1": nota.nm1_t1 if nota else None, "nm2_t1": nota.nm2_t1 if nota else None,
                "nm3_t1": nota.nm3_t1 if nota else None, "rpt_t1": nota.rpt_t1 if nota else None,
                "nm1_t2": nota.nm1_t2 if nota else None, "nm2_t2": nota.nm2_t2 if nota else None,
                "nm3_t2": nota.nm3_t2 if nota else None, "rpt_t2": nota.rpt_t2 if nota else None,
                "nm1_t3": nota.nm1_t3 if nota else None, "nm2_t3": nota.nm2_t3 if nota else None,
                "nm3_t3": nota.nm3_t3 if nota else None, "rpt_t3": nota.rpt_t3 if nota else None,
                "ma": nota.ma if nota else None, "pf": nota.pf if nota else None,
                "maf": nota.maf if nota else None, "rcf": nota.rcf if nota else None,
                "tgf": nota.tgf if nota else 0, "rf": nota.rf if nota else "ND",
            } if nota else {c: None for c in [
                "nm1_t1","nm2_t1","nm3_t1","rpt_t1","nm1_t2","nm2_t2","nm3_t2","rpt_t2",
                "nm1_t3","nm2_t3","nm3_t3","rpt_t3","ma","pf","maf","rcf","tgf","rf"
            ]},
        })

    return JsonResponse({
        "nome_turma": vinculo.turma,
        "disciplina": disciplina.nome_disciplina if disciplina else vinculo.disciplina_lecionada,
        "professor_nome": vinculo.professor.nome_completo,
        "alunos": resultado,
    })


def _nome_escola(escola_str):
    if not escola_str:
        return escola_str
    return escola_str.split(" - ", 1)[-1].strip()


@csrf_exempt
@require_http_methods(["POST"])
def admin_login(request):
    body = json.loads(request.body or "{}")
    nome = (body.get("nome_completo") or "").strip()
    senha = (body.get("senha") or "").strip()

    admin = Admin.objects.filter(nome_completo=nome, senha=senha).first()
    if not admin:
        return JsonResponse({"return": False, "detail": "Credenciais inválidas."}, status=401)

    response = JsonResponse({"return": True, "admin": {"id": admin.id, "nome_completo": admin.nome_completo}})
    _criar_sessao_e_setar_cookie(response, "ADMIN", admin.id, admin.nome_completo)
    return response


@csrf_exempt
@require_http_methods(["GET"])
def admin_auth(request):
    admin = _admin_logado(request)
    if not admin:
        return JsonResponse({"return": False})
    return JsonResponse({"return": True, "admin": {"id": admin.id, "nome_completo": admin.nome_completo}})


@csrf_exempt
@require_http_methods(["GET"])
def admin_escolas_opcoes(request):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    valores = set()
    for v in Coordenador.objects.values_list("escola", flat=True):
        if v:
            valores.add(v.strip())
    for v in AtravessaPor.objects.values_list("escola", flat=True):
        if v:
            valores.add(_nome_escola(v))
    for v in Estudante.objects.values_list("escola", flat=True):
        if v:
            valores.add(_nome_escola(v))

    return JsonResponse({"escolas": sorted(valores)})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_coordenadores(request):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    if request.method == "GET":
        coordenadores = Coordenador.objects.all().order_by("nome_completo")
        return JsonResponse([
            {"id": c.id, "nome_completo": c.nome_completo, "escola": c.escola}
            for c in coordenadores
        ], safe=False)

    body = json.loads(request.body or "{}")
    nome = (body.get("nome_completo") or "").strip()
    senha = (body.get("senha") or "").strip()
    escola = (body.get("escola") or "").strip()

    if not nome or not senha or not escola:
        return JsonResponse({"detail": "nome_completo, senha e escola são obrigatórios."}, status=400)

    coordenador = Coordenador.objects.create(nome_completo=nome, senha=senha, escola=escola)
    return JsonResponse({"id": coordenador.id}, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def admin_coordenador_excluir(request, coordenador_id):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    coordenador = Coordenador.objects.filter(id=coordenador_id).first()
    if not coordenador:
        return JsonResponse({"detail": "Coordenador não encontrado."}, status=404)

    coordenador.delete()
    return JsonResponse({"detail": "Excluído."})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_professores(request):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    if request.method == "GET":
        professores = Professor.objects.all().order_by("nome_completo")
        return JsonResponse([
            {"id": p.id, "nome_completo": p.nome_completo}
            for p in professores
        ], safe=False)

    body = json.loads(request.body or "{}")
    nome = (body.get("nome_completo") or "").strip()
    senha = (body.get("senha") or "").strip()

    if not nome or not senha:
        return JsonResponse({"detail": "nome_completo e senha são obrigatórios."}, status=400)

    professor = Professor.objects.create(nome_completo=nome, senha=senha)
    return JsonResponse({"id": professor.id}, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def admin_professor_excluir(request, professor_id):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"detail": "Professor não encontrado."}, status=404)

    if professor.notas_lancadas.exists() or professor.frequencias_registradas.exists():
        return JsonResponse(
            {"detail": "Não é possível excluir: há notas ou frequências vinculadas a este professor."},
            status=409,
        )

    professor.delete()
    return JsonResponse({"detail": "Excluído."})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_alunos(request):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    if request.method == "GET":
        alunos = Estudante.objects.all().order_by("nome_completo")
        return JsonResponse([
            {
                "id": a.id, "nome_completo": a.nome_completo, "escola": a.escola,
                "turma": a.turma, "serie": a.serie, "periodo": a.periodo, "curso": a.curso,
            }
            for a in alunos
        ], safe=False)

    body = json.loads(request.body or "{}")
    campos_obrigatorios = ["nome_completo", "senha", "escola", "modo_de_ensino", "serie", "periodo", "curso", "turma"]
    faltando = [c for c in campos_obrigatorios if not (body.get(c) or "").strip()]
    if faltando:
        return JsonResponse({"detail": f"Campos obrigatórios faltando: {', '.join(faltando)}."}, status=400)

    aluno = Estudante.objects.create(
        nome_completo=body["nome_completo"].strip(),
        senha=body["senha"].strip(),
        escola=body["escola"].strip(),
        modo_de_ensino=body["modo_de_ensino"].strip(),
        serie=body["serie"].strip(),
        periodo=body["periodo"].strip(),
        curso=body["curso"].strip(),
        turma=body["turma"].strip(),
    )
    return JsonResponse({"id": aluno.id}, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def admin_aluno_excluir(request, aluno_id):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"detail": "Aluno não encontrado."}, status=404)

    if aluno.notas_lancadas.exists() if hasattr(aluno, "notas_lancadas") else False:
        return JsonResponse({"detail": "Não é possível excluir: há notas vinculadas a este aluno."}, status=409)

    aluno.delete()
    return JsonResponse({"detail": "Excluído."})


@csrf_exempt
@require_http_methods(["GET"])
def admin_turmas(request):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    nomes = set(Estudante.objects.values_list("turma", flat=True))
    nomes |= set(AtravessaPor.objects.values_list("turma", flat=True))
    nomes = {n for n in nomes if n}

    resultado = []
    for nome in sorted(nomes):
        resultado.append({
            "turma": nome,
            "total_alunos": Estudante.objects.filter(turma=nome).count(),
            "total_vinculos": AtravessaPor.objects.filter(turma=nome).count(),
        })

    return JsonResponse(resultado, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def admin_turma_renomear(request):
    if not _admin_logado(request):
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    body = json.loads(request.body or "{}")
    nome_atual = (body.get("nome_atual") or "").strip()
    novo_nome = (body.get("novo_nome") or "").strip()

    if not nome_atual or not novo_nome:
        return JsonResponse({"detail": "nome_atual e novo_nome são obrigatórios."}, status=400)

    qtd_alunos = Estudante.objects.filter(turma=nome_atual).update(turma=novo_nome)
    qtd_vinculos = AtravessaPor.objects.filter(turma=nome_atual).update(turma=novo_nome)

    return JsonResponse({"alunos_atualizados": qtd_alunos, "vinculos_atualizados": qtd_vinculos})


@csrf_exempt
@require_http_methods(["GET"])
def dashboard_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    return JsonResponse(_calcular_dashboard(aluno))


@csrf_exempt
@require_http_methods(["GET"])
def conteudos_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    conteudos = Conteudo.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    ).order_by("-data")

    resultado = []
    for c in conteudos:
        disciplina = resolver_disciplina_da_turma(c.turma)
        resultado.append({
            "id": c.id,
            "titulo": c.titulo,
            "descricao": c.descricao,
            "disciplina": disciplina.nome_disciplina if disciplina else c.turma.disciplina_lecionada,
            "professor_nome": c.turma.professor.nome_completo if c.turma.professor else None,
            "data": c.data.isoformat() if c.data else None,
            "arquivo": c.arquivo.url if c.arquivo else None,
        })

    return JsonResponse({"conteudos": resultado})


@csrf_exempt
@require_http_methods(["GET"])
def atividades_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    hoje = date.today()
    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    atividades = Atividade.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    ).order_by("data_entrega")
    envios_por_atividade = {
        envio.atividade_id: envio
        for envio in AtividadeEnvio.objects.filter(
            aluno=aluno, atividade__in=atividades
        )
    }

    resultado = []
    for a in atividades:
        disciplina = resolver_disciplina_da_turma(a.turma)
        envio = envios_por_atividade.get(a.id)
        status = None
        if a.data_entrega:
            status = "atrasado" if a.data_entrega < hoje else "pendente"
        resultado.append({
            "id": a.id,
            "titulo": a.titulo,
            "descricao": a.descricao,
            "disciplina": disciplina.nome_disciplina if disciplina else a.turma.disciplina_lecionada,
            "professor_nome": a.turma.professor.nome_completo if a.turma.professor else None,
            "data": a.data.isoformat() if a.data else None,
            "data_entrega": a.data_entrega.isoformat() if a.data_entrega else None,
            "arquivo": a.arquivo.url if a.arquivo else None,
            "status": status,
            "questoes": _serializar_questoes_atividade(a, com_gabarito=False),
            "envio": {
                # respostas às questões da plataforma (sem gabarito para o aluno)
                **_serializar_envio_atividade(envio, a, com_gabarito=False),
                "id": envio.id,
                "comentario": envio.comentario,
                "enviado_em": envio.enviado_em.isoformat(),
                # o envio pode ter só respostas, sem arquivo
                "arquivo_url": caminho_relativo_arquivo(envio.arquivo) if envio.arquivo else None,
                "arquivo_nome": envio.arquivo.name.split("/")[-1] if envio.arquivo else None,
                "alteracao_status": envio.alteracao_status,
                "alteracao_solicitada_em": (
                    envio.alteracao_solicitada_em.isoformat()
                    if envio.alteracao_solicitada_em else None
                ),
                "atrasado": bool(
                    a.data_entrega and timezone.localdate(envio.enviado_em) > a.data_entrega
                ),
            } if envio else None,
        })

    return JsonResponse({"atividades": resultado})


@csrf_exempt
@require_http_methods(["GET"])
def boletim_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    ano_letivo = request.GET.get("ano_letivo", "2026")

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    )

    disciplinas_map = {}
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        if not disciplina or disciplina.id in disciplinas_map:
            continue
        disciplinas_map[disciplina.id] = {
            "disciplina": disciplina,
            "turma_obj": h.turma,
            "professor": h.turma.professor,
        }

    boletim = []
    for info in sorted(disciplinas_map.values(), key=lambda x: x["disciplina"].nome_disciplina):
        disciplina = info["disciplina"]
        nota = Nota.objects.filter(
            aluno=aluno,
            disciplina=disciplina,
            turma=info["turma_obj"],
            professor=info["professor"],
            ano_letivo=ano_letivo,
        ).select_related("professor").first()

        boletim.append({
            "disciplina": disciplina.nome_disciplina,
            "professor_nome": info["professor"].nome_completo if info["professor"] else None,
            "nm1_t1": nota.nm1_t1 if nota else None, "nm2_t1": nota.nm2_t1 if nota else None,
            "nm3_t1": nota.nm3_t1 if nota else None, "rpt_t1": nota.rpt_t1 if nota else None,
            "mt_t1": nota.mt_t1 if nota else None,
            "nm1_t2": nota.nm1_t2 if nota else None, "nm2_t2": nota.nm2_t2 if nota else None,
            "nm3_t2": nota.nm3_t2 if nota else None, "rpt_t2": nota.rpt_t2 if nota else None,
            "mt_t2": nota.mt_t2 if nota else None,
            "nm1_t3": nota.nm1_t3 if nota else None, "nm2_t3": nota.nm2_t3 if nota else None,
            "nm3_t3": nota.nm3_t3 if nota else None, "rpt_t3": nota.rpt_t3 if nota else None,
            "mt_t3": nota.mt_t3 if nota else None,
            "ma": nota.ma if nota else None, "pf": nota.pf if nota else None,
            "maf": nota.maf if nota else None, "rcf": nota.rcf if nota else None,
            "tgf": nota.tgf if nota else 0,
            "rf": nota.rf if nota else "CUR",
        })

    return JsonResponse({"boletim": boletim})


@csrf_exempt
@require_http_methods(["GET"])
def horarios_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related("turma", "turma__professor")

    resultado = []
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        resultado.append({
            "id": h.id,
            "dia_semana": h.dia_semana,
            "hora_inicio": h.hora_inicio.strftime("%H:%M") if h.hora_inicio else None,
            "hora_fim": h.hora_fim.strftime("%H:%M") if h.hora_fim else None,
            "disciplina": disciplina.nome_disciplina if disciplina else h.turma.disciplina_lecionada,
            "professor_nome": h.turma.professor.nome_completo if h.turma.professor else None,
        })

    return JsonResponse({"horarios": resultado})


@csrf_exempt
@require_http_methods(["GET"])
def horarios_aluno_pdf(request):
    """Gera o PDF da grade de horários do aluno autenticado."""
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    ).order_by("dia_semana", "hora_inicio")

    DIAS_ORDEM = ["SEG", "TER", "QUA", "QUI", "SEX"]
    DIAS_LABEL = {"SEG": "Segunda", "TER": "Terça", "QUA": "Quarta", "QUI": "Quinta", "SEX": "Sexta"}

    por_dia = {dia: [] for dia in DIAS_ORDEM}
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        por_dia.setdefault(h.dia_semana, []).append({
            "hora_inicio": h.hora_inicio.strftime("%H:%M") if h.hora_inicio else "—",
            "hora_fim": h.hora_fim.strftime("%H:%M") if h.hora_fim else "—",
            "disciplina": disciplina.nome_disciplina if disciplina else h.turma.disciplina_lecionada,
            "professor_nome": h.turma.professor.nome_completo if h.turma.professor else "—",
        })

    dias_contexto = [
        {"label": DIAS_LABEL[dia], "aulas": por_dia.get(dia, [])}
        for dia in DIAS_ORDEM
    ]

    logo_path_absoluto = os.path.join(settings.BASE_DIR, "app", "static", "logo.png")
    logo_path = f"file://{logo_path_absoluto}" if os.path.exists(logo_path_absoluto) else None

    contexto = {
        "aluno": aluno,
        "dias": dias_contexto,
        "logo_path": logo_path,
        "data_emissao": date.today().strftime("%d/%m/%Y"),
    }

    html_string = render_to_string("horarios/pdf.html", contexto)
    from .pdf import html_to_pdf
    pdf_file = html_to_pdf(html_string)

    nome_arquivo = f"horario_{_nome_arquivo_seguro(aluno.nome_completo)}.pdf"

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response


@csrf_exempt
@require_http_methods(["GET", "POST"])
def cronograma_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    if request.method == "GET":
        estudos = EstudoProgramado.objects.filter(aluno=aluno).order_by("data")
        return JsonResponse({
            "estudos": [
                {
                    "id": e.id, "titulo": e.titulo, "disciplina": e.disciplina,
                    "data": e.data.isoformat(), "concluido": e.concluido,
                }
                for e in estudos
            ]
        })

    body = json.loads(request.body or "{}")
    titulo = (body.get("titulo") or "").strip()
    disciplina = (body.get("disciplina") or "").strip()
    data_estudo = body.get("data")

    if not titulo or not data_estudo:
        return JsonResponse({"detail": "titulo e data são obrigatórios."}, status=400)

    estudo = EstudoProgramado.objects.create(
        aluno=aluno, titulo=titulo, disciplina=disciplina, data=data_estudo
    )
    return JsonResponse({"id": estudo.id}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def cronograma_alternar_concluido(request, estudo_id):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    estudo = EstudoProgramado.objects.filter(id=estudo_id, aluno=aluno).first()
    if not estudo:
        return JsonResponse({"detail": "Não encontrado."}, status=404)

    estudo.concluido = not estudo.concluido
    estudo.save(update_fields=["concluido"])
    return JsonResponse({"concluido": estudo.concluido})


@csrf_exempt
@require_http_methods(["DELETE"])
def cronograma_excluir(request, estudo_id):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    estudo = EstudoProgramado.objects.filter(id=estudo_id, aluno=aluno).first()
    if not estudo:
        return JsonResponse({"detail": "Não encontrado."}, status=404)

    estudo.delete()
    return JsonResponse({"detail": "Excluído."})



@csrf_exempt
@require_http_methods(["GET"])
def frequencia_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    mes = request.GET.get("mes")
    ano = request.GET.get("ano")

    hoje = date.today()
    mes = int(mes) if mes else hoje.month
    ano = int(ano) if ano else hoje.year

    registros = Frequencia.objects.filter(
        aluno=aluno, data__year=ano, data__month=mes
    ).select_related("disciplina").order_by("data")

    por_dia = {}
    for r in registros:
        chave = r.data.isoformat()
        por_dia.setdefault(chave, []).append({
            "disciplina": r.disciplina.nome_disciplina if r.disciplina else None,
            "presente": r.presente,
        })

    dias = []
    for data_str, aulas in sorted(por_dia.items()):
        total = len(aulas)
        faltas = sum(1 for a in aulas if not a["presente"])
        dias.append({
            "data": data_str,
            "total_aulas": total,
            "total_faltas": faltas,
            "situacao": "falta_total" if faltas == total else ("falta_parcial" if faltas > 0 else "presente"),
            "aulas": aulas,
        })

    total_registros_mes = registros.count()
    total_presencas_mes = registros.filter(presente=True).count()
    total_faltas_mes = total_registros_mes - total_presencas_mes
    percentual_mes = round((total_presencas_mes / total_registros_mes) * 100, 1) if total_registros_mes else None

    return JsonResponse({
        "mes": mes,
        "ano": ano,
        "total_registros": total_registros_mes,
        "total_presencas": total_presencas_mes,
        "total_faltas": total_faltas_mes,
        "percentual_presenca": percentual_mes,
        "dias": dias,
    })

@csrf_exempt
@require_http_methods(["GET", "POST"])
def solicitacoes_responsavel_aluno(request):
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    if request.method == "GET":
        vinculos = VinculoResponsavel.objects.filter(aluno=aluno).select_related("responsavel")
        return JsonResponse({
            "solicitacoes": [
                {
                    "id": v.id,
                    "responsavel_nome": v.responsavel.nome_completo,
                    "parentesco": v.parentesco,
                    "telefone": v.responsavel.telefone,
                    "status": v.status,
                    "origem": v.origem,
                    "data_solicitacao": v.data_solicitacao.isoformat(),
                }
                for v in vinculos
            ]
        })

    body = json.loads(request.body or "{}")
    nome_completo = (body.get("nome_completo") or "").strip()
    parentesco = (body.get("parentesco") or "").strip()
    cpf = (body.get("cpf") or "").strip()
    telefone = (body.get("telefone") or "").strip()
    senha = (body.get("senha") or "").strip()

    if not nome_completo or not parentesco or not senha:
        return JsonResponse(
            {"detail": "nome_completo, parentesco e senha são obrigatórios."}, status=400
        )

    responsavel = Responsavel.objects.create(
        nome_completo=nome_completo, cpf=cpf, telefone=telefone, senha=senha,
    )
    vinculo = VinculoResponsavel.objects.create(
        aluno=aluno, responsavel=responsavel, parentesco=parentesco, status="PENDENTE", origem="ALUNO",
    )

    return JsonResponse({"id": vinculo.id}, status=201)



@csrf_exempt
@require_http_methods(["DELETE"])
def solicitacao_responsavel_excluir(request, vinculo_id):
    """
    Remove o vínculo/solicitação. Se ainda estiver PENDENTE, é um cancelamento;
    se já estiver APROVADO, é uma revogação de acesso do responsável.
    """
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculo = VinculoResponsavel.objects.filter(id=vinculo_id, aluno=aluno).select_related("responsavel").first()
    if not vinculo:
        return JsonResponse({"detail": "Solicitação não encontrada."}, status=404)

    responsavel = vinculo.responsavel
    vinculo.delete()

    if not VinculoResponsavel.objects.filter(responsavel=responsavel).exists():
        responsavel.delete()

    return JsonResponse({"detail": "Removido."})


@csrf_exempt
@require_http_methods(["GET"])
def buscar_alunos_para_responsavel(request):
    """
    Busca alunos pelo nome (parcial) para popular o select de vínculo
    na tela de registro do responsável. Sem autenticação — o responsável
    ainda não tem conta nesse momento do fluxo.
    """
    termo = request.GET.get("q", "").strip()

    if len(termo) < 3:
        return JsonResponse({"alunos": []})

    alunos = Estudante.objects.filter(
        nome_completo__icontains=termo
    ).order_by("nome_completo")[:15]

    return JsonResponse({
        "alunos": [
            {"id": a.id, "nome_completo": a.nome_completo, "turma": a.turma}
            for a in alunos
        ]
    })

@csrf_exempt
@require_http_methods(["POST"])
def registrar_responsavel(request):
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_completo = (body.get("nome_completo") or "").strip().upper()
    cpf = (body.get("cpf") or "").strip()
    telefone = (body.get("telefone") or "").strip()
    senha = (body.get("senha") or "").strip()
    aluno_id = body.get("aluno_id")
    parentesco = (body.get("parentesco") or "").strip()

    if not nome_completo or not senha:
        return JsonResponse({"message": "Nome completo e senha são obrigatórios."}, status=400)

    if aluno_id and not parentesco:
        return JsonResponse({"message": "Selecione o parentesco com o aluno."}, status=400)

    if cpf:
        ja_existe = Responsavel.objects.filter(cpf=cpf).exists()
    else:
        ja_existe = Responsavel.objects.filter(nome_completo=nome_completo).exists()

    if ja_existe:
        return JsonResponse(
            {"message": "Já existe uma conta com esses dados. Se um aluno já te cadastrou como responsável, use a tela de login."},
            status=400,
        )

    responsavel = Responsavel.objects.create(
        nome_completo=nome_completo, cpf=cpf, telefone=telefone, senha=senha,
    )

    if aluno_id:
        aluno = Estudante.objects.filter(id=aluno_id).first()
        if aluno:
            VinculoResponsavel.objects.create(
                aluno=aluno, responsavel=responsavel, parentesco=parentesco,
                status="PENDENTE", origem="RESPONSAVEL",
            )

    return JsonResponse({"message": "Conta criada com sucesso. Faça login para continuar."})



@csrf_exempt
@require_http_methods(["POST"])
def login_responsavel(request):
    body = json.loads(request.body or "{}")
    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip()

    responsavel = Responsavel.objects.filter(nome_completo=nome_completo, senha=senha).first()

    if responsavel is None:
        return JsonResponse({"return": False})

    response = JsonResponse({"return": True})
    _criar_sessao_e_setar_cookie(response, "RESPONSAVEL", responsavel.id, responsavel.nome_completo)
    return response


@csrf_exempt
def auth_responsavel(request):
    responsavel = _responsavel_logado(request)

    if not responsavel:
        return JsonResponse({"return": False})

    return JsonResponse({
        "return": True,
        "responsavel": {
            "id": responsavel.id,
            "nome_completo": responsavel.nome_completo,
            "telefone": responsavel.telefone,
        },
    })


@csrf_exempt
@require_http_methods(["GET"])
def vinculos_responsavel(request):
    responsavel = _responsavel_logado(request)
    if not responsavel:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculos = VinculoResponsavel.objects.filter(responsavel=responsavel).select_related("aluno")

    return JsonResponse({
        "vinculos": [
            {
                "id": v.id,
                "aluno_id": v.aluno_id,
                "aluno_nome": v.aluno.nome_completo,
                "aluno_turma": v.aluno.turma,
                "parentesco": v.parentesco,
                "status": v.status,
                "data_solicitacao": v.data_solicitacao.isoformat(),
            }
            for v in vinculos
        ]
    })


@csrf_exempt
@require_http_methods(["POST"])
def solicitar_vinculo_responsavel(request):
    responsavel = _responsavel_logado(request)
    if not responsavel:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    body = json.loads(request.body or "{}")
    aluno_id = body.get("aluno_id")
    parentesco = (body.get("parentesco") or "").strip()

    if not aluno_id or not parentesco:
        return JsonResponse({"detail": "Selecione o aluno e o parentesco."}, status=400)

    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"detail": "Aluno não encontrado."}, status=404)

    if VinculoResponsavel.objects.filter(aluno=aluno, responsavel=responsavel).exists():
        return JsonResponse({"detail": "Você já tem uma solicitação ou vínculo com esse aluno."}, status=400)

    vinculo = VinculoResponsavel.objects.create(
        aluno=aluno, responsavel=responsavel, parentesco=parentesco,
        status="PENDENTE", origem="RESPONSAVEL",
    )

    return JsonResponse({"id": vinculo.id}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def solicitacao_responsavel_responder(request, vinculo_id):
    """Aluno aprova ou recusa uma solicitação de vínculo iniciada pelo responsável."""
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculo = VinculoResponsavel.objects.filter(id=vinculo_id, aluno=aluno).first()
    if not vinculo:
        return JsonResponse({"detail": "Solicitação não encontrada."}, status=404)

    if vinculo.status != "PENDENTE":
        return JsonResponse({"detail": "Essa solicitação já foi respondida."}, status=400)

    body = json.loads(request.body or "{}")
    decisao = body.get("decisao")  # "APROVADO" ou "RECUSADO"

    if decisao not in ("APROVADO", "RECUSADO"):
        return JsonResponse({"detail": "decisao deve ser 'APROVADO' ou 'RECUSADO'."}, status=400)

    vinculo.status = decisao
    vinculo.data_resposta = timezone.now()
    vinculo.save(update_fields=["status", "data_resposta"])

    return JsonResponse({"status": vinculo.status})

def _calcular_dashboard(aluno):
    notas = Nota.objects.filter(aluno=aluno).select_related("disciplina")

    medias_por_disciplina = []
    for n in notas:
        media = n.maf if n.maf is not None else n.ma
        if media is not None:
            medias_por_disciplina.append({
                "disciplina": n.disciplina.nome_disciplina if n.disciplina else None,
                "media": float(media),
            })

    media_geral = None
    if medias_por_disciplina:
        media_geral = round(
            sum(m["media"] for m in medias_por_disciplina) / len(medias_por_disciplina), 1
        )

    atencao_necessaria = [
        {"disciplina": m["disciplina"], "media": m["media"]}
        for m in medias_por_disciplina
        if m["media"] < 6
    ]

    frequencias = Frequencia.objects.filter(aluno=aluno)
    total_freq = frequencias.count()
    presentes = frequencias.filter(presente=True).count()
    frequencia_percentual = round((presentes / total_freq) * 100, 1) if total_freq else None
    frequencia_baixa_pe_de_meia = frequencia_percentual is not None and frequencia_percentual < 80

    vinculos_aluno = buscar_atravessapor_por_turma(aluno.turma)
    hoje = date.today()
    atividades = Atividade.objects.filter(turma__in=vinculos_aluno).select_related("disciplina")

    pendentes_qs = atividades.filter(data_entrega__gte=hoje).order_by("data_entrega")
    atrasadas_qs = atividades.filter(data_entrega__lt=hoje)
    total_pendencias = pendentes_qs.count() + atrasadas_qs.count()

    proximas_entregas = [
        {
            "titulo": a.titulo,
            "disciplina": a.disciplina.nome_disciplina if a.disciplina else None,
            "data_entrega": a.data_entrega.isoformat() if a.data_entrega else None,
        }
        for a in pendentes_qs[:5]
    ]

    total_conteudos = Conteudo.objects.filter(turma__in=vinculos_aluno).count()

    return {
        "media_geral": media_geral,
        "total_pendencias": total_pendencias,
        "frequencia_percentual": frequencia_percentual,
        "frequencia_baixa_pe_de_meia": frequencia_baixa_pe_de_meia,
        "total_conteudos": total_conteudos,
        "atencao_necessaria": atencao_necessaria[:6],
        "proximas_entregas": proximas_entregas,
    }


@csrf_exempt
@require_http_methods(["GET"])
def dashboard_aluno_responsavel(request, aluno_id):
    responsavel = _responsavel_logado(request)
    if not responsavel:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculo = VinculoResponsavel.objects.filter(
        responsavel=responsavel, aluno_id=aluno_id, status="APROVADO"
    ).select_related("aluno").first()

    if not vinculo:
        return JsonResponse(
            {"detail": "Você não tem acesso aprovado a este aluno."}, status=403
        )

    aluno = vinculo.aluno
    dados = _calcular_dashboard(aluno)

    estudos = EstudoProgramado.objects.filter(aluno=aluno).order_by("data")[:5]
    dados["estudos_programados"] = [
        {
            "id": e.id, "titulo": e.titulo, "disciplina": e.disciplina,
            "data": e.data.isoformat(), "concluido": e.concluido,
        }
        for e in estudos
    ]

    dados["aluno"] = {
        "nome_completo": aluno.nome_completo,
        "turma": aluno.turma,
        "escola": aluno.escola,
    }

    return JsonResponse(dados)


def _verificar_acesso_responsavel(request, aluno_id):
    """Retorna (responsavel, aluno, None) se aprovado, ou (None, None, JsonResponse_erro)."""
    responsavel = _responsavel_logado(request)
    if not responsavel:
        return None, None, JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculo = VinculoResponsavel.objects.filter(
        responsavel=responsavel, aluno_id=aluno_id, status="APROVADO"
    ).select_related("aluno").first()

    if not vinculo:
        return None, None, JsonResponse({"detail": "Você não tem acesso aprovado a este aluno."}, status=403)

    return responsavel, vinculo.aluno, None


@csrf_exempt
@require_http_methods(["GET"])
def boletim_aluno_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    ano_letivo = request.GET.get("ano_letivo", "2026")

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    )

    disciplinas_map = {}
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        if not disciplina or disciplina.id in disciplinas_map:
            continue
        disciplinas_map[disciplina.id] = {
            "disciplina": disciplina,
            "turma_obj": h.turma,
            "professor": h.turma.professor,
        }

    boletim = []
    for info in sorted(disciplinas_map.values(), key=lambda x: x["disciplina"].nome_disciplina):
        disciplina = info["disciplina"]
        nota = Nota.objects.filter(
            aluno=aluno,
            disciplina=disciplina,
            turma=info["turma_obj"],
            professor=info["professor"],
            ano_letivo=ano_letivo,
        ).first()

        boletim.append({
            "disciplina": disciplina.nome_disciplina,
            "nm1_t1": nota.nm1_t1 if nota else None, "nm2_t1": nota.nm2_t1 if nota else None,
            "nm3_t1": nota.nm3_t1 if nota else None, "mt_t1": nota.mt_t1 if nota else None,
            "nm1_t2": nota.nm1_t2 if nota else None, "nm2_t2": nota.nm2_t2 if nota else None,
            "nm3_t2": nota.nm3_t2 if nota else None, "mt_t2": nota.mt_t2 if nota else None,
            "nm1_t3": nota.nm1_t3 if nota else None, "nm2_t3": nota.nm2_t3 if nota else None,
            "nm3_t3": nota.nm3_t3 if nota else None, "mt_t3": nota.mt_t3 if nota else None,
            "ma": nota.ma if nota else None,
            "pf": nota.pf if nota else None,
            "maf": nota.maf if nota else None,
            "rf": nota.rf if nota else "CUR",
        })

    return JsonResponse({
        "aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma},
        "boletim": boletim,
    })


@csrf_exempt
@require_http_methods(["GET"])
def frequencia_aluno_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    mes = request.GET.get("mes")
    ano = request.GET.get("ano")
    hoje = date.today()
    mes = int(mes) if mes else hoje.month
    ano = int(ano) if ano else hoje.year

    registros = Frequencia.objects.filter(aluno=aluno, data__year=ano, data__month=mes).select_related("disciplina").order_by("data")

    por_dia = {}
    for r in registros:
        chave = r.data.isoformat()
        por_dia.setdefault(chave, []).append({
            "disciplina": r.disciplina.nome_disciplina if r.disciplina else None,
            "presente": r.presente,
        })

    dias = []
    for data_str, aulas in sorted(por_dia.items()):
        total = len(aulas)
        faltas = sum(1 for a in aulas if not a["presente"])
        dias.append({
            "data": data_str, "total_aulas": total, "total_faltas": faltas,
            "situacao": "falta_total" if faltas == total else ("falta_parcial" if faltas > 0 else "presente"),
            "aulas": aulas,
        })

    total_registros_mes = registros.count()
    total_presencas_mes = registros.filter(presente=True).count()

    return JsonResponse({
        "aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma},
        "mes": mes, "ano": ano,
        "total_registros": total_registros_mes,
        "total_presencas": total_presencas_mes,
        "total_faltas": total_registros_mes - total_presencas_mes,
        "percentual_presenca": round((total_presencas_mes / total_registros_mes) * 100, 1) if total_registros_mes else None,
        "dias": dias,
    })



@csrf_exempt
@require_http_methods(["GET"])
def horario_aluno_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related("turma", "turma__professor")

    resultado = []
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        resultado.append({
            "id": h.id,
            "dia_semana": h.dia_semana,
            "hora_inicio": h.hora_inicio.strftime("%H:%M") if h.hora_inicio else None,
            "hora_fim": h.hora_fim.strftime("%H:%M") if h.hora_fim else None,
            "disciplina": disciplina.nome_disciplina if disciplina else h.turma.disciplina_lecionada,
            "professor_nome": h.turma.professor.nome_completo if h.turma.professor else None,
        })

    return JsonResponse({"aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma}, "horarios": resultado})



@csrf_exempt
@require_http_methods(["GET"])
def comunicados_aluno_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    turma_aluno_norm = _turma_normalizada(aluno.turma)
    resultado = []
    for c in Comunicado.objects.select_related("turma", "professor", "coordenador").order_by("-data"):
        if c.turma is not None and _turma_normalizada(c.turma.turma) != turma_aluno_norm:
            continue
        if c.coordenador:
            criado_por, origem = (c.coordenador.escola or "Organização"), "coordenacao"
        elif c.professor:
            criado_por, origem = c.professor.nome_completo, "professor"
        else:
            criado_por, origem = None, None
        resultado.append({
            "id": c.id, "titulo": c.titulo, "mensagem": c.mensagem, "data": c.data.isoformat(),
            "nome_turma": c.turma.turma if c.turma else None, "criado_por": criado_por, "origem": origem,
        })

    return JsonResponse({"aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma}, "comunicados": resultado[:50]})


@csrf_exempt
@require_http_methods(["GET"])
def advertencias_aluno_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    advertencias = Advertencia.objects.filter(aluno=aluno, tipo="ADVERTENCIA").select_related("coordenador").order_by("-data")

    return JsonResponse({
        "aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma},
        "advertencias": [
            {
                "id": a.id, "titulo": a.titulo, "descricao": a.descricao, "data": a.data.isoformat(),
                "emitido_por": (a.coordenador.escola or "Organização") if a.coordenador else None,
                "is_suspensao": a.is_suspensao,
                "data_inicio_suspensao": a.data_inicio_suspensao.isoformat() if a.data_inicio_suspensao else None,
                "data_termino_suspensao": a.data_termino_suspensao.isoformat() if a.data_termino_suspensao else None,
            }
            for a in advertencias
        ]
    })


def _avaliacoes_por_turma(nome_turma):
    nome_normalizado = (nome_turma or "").replace(" ", "").strip().lower()
    return Avaliacao.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=nome_normalizado)


@csrf_exempt
@require_http_methods(["GET"])
def avaliacoes_aluno_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    avaliacoes = _avaliacoes_por_turma(aluno.turma).select_related("professor", "disciplina").order_by("-data")

    return JsonResponse({
        "aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma},
        "avaliacoes": [
            {
                "id": a.id, "titulo": a.titulo,
                "disciplina": a.disciplina.nome_disciplina if a.disciplina else None,
                "professor": a.professor.nome_completo if a.professor else None,
                "data": a.data.isoformat(),
            }
            for a in avaliacoes
        ]
    })


@csrf_exempt
@require_http_methods(["GET"])
def calendario_aluno_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    mes = request.GET.get("mes")
    ano = request.GET.get("ano")
    turma_aluno_norm = _turma_normalizada(aluno.turma)

    eventos_qs = Evento.objects.select_related("turma", "professor", "coordenador").all()
    if mes and ano:
        eventos_qs = eventos_qs.filter(data__year=ano, data__month=mes)
    elif ano:
        eventos_qs = eventos_qs.filter(data__year=ano)

    resultado = []
    for e in eventos_qs.order_by("data"):
        if e.turma is not None and _turma_normalizada(e.turma.turma) != turma_aluno_norm:
            continue
        if e.coordenador:
            criado_por, origem = (e.coordenador.escola or "Organização"), "coordenacao"
        elif e.professor:
            criado_por, origem = e.professor.nome_completo, "professor"
        else:
            criado_por, origem = None, None
        resultado.append({
            "id": e.id, "titulo": e.titulo, "descricao": e.descricao, "data": e.data.isoformat(),
            "nome_turma": e.turma.turma if e.turma else None, "criado_por": criado_por, "origem": origem,
        })

    return JsonResponse({"aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma}, "eventos": resultado})


@csrf_exempt
@require_http_methods(["GET"])
def opcoes_mensagem_professor_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    vinculos = buscar_atravessapor_por_turma(aluno.turma).select_related("professor")
    professores = {v.professor_id: v.professor.nome_completo for v in vinculos}

    return JsonResponse({"professores": [{"id": pid, "nome_completo": nome} for pid, nome in professores.items()]})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagens_professor_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    if request.method == "GET":
        conversas = ConversaResponsavelProfessor.objects.filter(
            responsavel=responsavel, aluno=aluno
        ).select_related("professor").order_by("-ultima_atualizacao")

        resultado = []
        for c in conversas:
            ultima = c.mensagens.last()
            nao_lidas = c.mensagens.filter(remetente_tipo="PROFESSOR", lida_responsavel=False).count()
            resultado.append({
                "id": c.id, "professor_nome": c.professor.nome_completo,
                "ultima_mensagem": ultima.conteudo if ultima else None,
                "ultima_atualizacao": c.ultima_atualizacao.isoformat(), "nao_lidas": nao_lidas,
            })
        return JsonResponse(resultado, safe=False)

    body = json.loads(request.body or "{}")
    professor_id = body.get("professor_id")
    conteudo = (body.get("conteudo") or "").strip()

    if not professor_id or not conteudo:
        return JsonResponse({"detail": "professor_id e conteudo são obrigatórios."}, status=400)

    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"detail": "Professor não encontrado."}, status=404)

    if not buscar_atravessapor_por_turma(aluno.turma).filter(professor=professor).exists():
        return JsonResponse({"detail": "Esse professor não leciona para a turma do aluno."}, status=400)

    conversa, _ = ConversaResponsavelProfessor.objects.get_or_create(responsavel=responsavel, professor=professor, aluno=aluno)
    MensagemChatResponsavelProfessor.objects.create(
        conversa=conversa, remetente_tipo="RESPONSAVEL", conteudo=conteudo, lida_responsavel=True,
    )
    conversa.save()

    return JsonResponse({"conversa_id": conversa.id}, status=201)



@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagem_conversa_professor_responsavel(request, aluno_id, conversa_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    conversa = ConversaResponsavelProfessor.objects.filter(
        id=conversa_id, responsavel=responsavel, aluno=aluno
    ).select_related("professor").first()
    if not conversa:
        return JsonResponse({"detail": "Conversa não encontrada."}, status=404)

    if request.method == "GET":
        conversa.mensagens.filter(remetente_tipo="PROFESSOR", lida_responsavel=False).update(lida_responsavel=True)
        mensagens = [
            {"id": m.id, "remetente_tipo": m.remetente_tipo, "conteudo": m.conteudo, "data_envio": m.data_envio.isoformat()}
            for m in conversa.mensagens.all()
        ]
        return JsonResponse({"conversa": {"id": conversa.id, "professor_nome": conversa.professor.nome_completo}, "mensagens": mensagens})

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"detail": "conteudo é obrigatório."}, status=400)

    mensagem = MensagemChatResponsavelProfessor.objects.create(
        conversa=conversa, remetente_tipo="RESPONSAVEL", conteudo=conteudo, lida_responsavel=True,
    )
    conversa.save()

    return JsonResponse({
        "id": mensagem.id, "remetente_tipo": mensagem.remetente_tipo,
        "conteudo": mensagem.conteudo, "data_envio": mensagem.data_envio.isoformat(),
    }, status=201)


def _coordenador_da_escola_do_aluno(aluno):
    nome_escola_aluno = _turma_normalizada(aluno.escola)
    if not nome_escola_aluno:
        return None

    for coordenador in Coordenador.objects.all():
        nome_escola_coord = _turma_normalizada(_nome_escola(coordenador.escola))
        if nome_escola_coord == nome_escola_aluno:
            return coordenador
        if nome_escola_coord and (nome_escola_coord in nome_escola_aluno or nome_escola_aluno in nome_escola_coord):
            return coordenador

    return None


@csrf_exempt
@require_http_methods(["GET"])
def mensagem_coordenador_status_responsavel(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    coordenador = _coordenador_da_escola_do_aluno(aluno)
    if not coordenador:
        return JsonResponse({"conversa_id": None})

    conversa = ConversaResponsavelCoordenador.objects.filter(
        responsavel=responsavel, coordenador=coordenador, aluno=aluno
    ).first()
    return JsonResponse({"conversa_id": conversa.id if conversa else None})


@csrf_exempt
@require_http_methods(["POST"])
def mensagem_coordenador_responsavel_enviar(request, aluno_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    coordenador = _coordenador_da_escola_do_aluno(aluno)
    if not coordenador:
        return JsonResponse({"detail": "Organização da escola do aluno não encontrada."}, status=404)

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"detail": "conteudo é obrigatório."}, status=400)

    conversa, _ = ConversaResponsavelCoordenador.objects.get_or_create(responsavel=responsavel, coordenador=coordenador, aluno=aluno)
    MensagemChatResponsavelCoordenador.objects.create(
        conversa=conversa, remetente_tipo="RESPONSAVEL", conteudo=conteudo, lida_responsavel=True,
    )
    conversa.save()

    return JsonResponse({"conversa_id": conversa.id}, status=201)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagem_conversa_coordenador_responsavel(request, aluno_id, conversa_id):
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    conversa = ConversaResponsavelCoordenador.objects.filter(
        id=conversa_id, responsavel=responsavel, aluno=aluno
    ).select_related("coordenador").first()
    if not conversa:
        return JsonResponse({"detail": "Conversa não encontrada."}, status=404)

    if request.method == "GET":
        conversa.mensagens.filter(remetente_tipo="COORDENACAO", lida_responsavel=False).update(lida_responsavel=True)
        mensagens = [
            {"id": m.id, "remetente_tipo": m.remetente_tipo, "conteudo": m.conteudo, "data_envio": m.data_envio.isoformat()}
            for m in conversa.mensagens.all()
        ]
        return JsonResponse({
            "conversa": {"id": conversa.id, "coordenador_nome": conversa.coordenador.escola or "Organização"},
            "mensagens": mensagens,
        })

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"detail": "conteudo é obrigatório."}, status=400)

    mensagem = MensagemChatResponsavelCoordenador.objects.create(
        conversa=conversa, remetente_tipo="RESPONSAVEL", conteudo=conteudo, lida_responsavel=True,
    )
    conversa.save()

    return JsonResponse({
        "id": mensagem.id, "remetente_tipo": mensagem.remetente_tipo,
        "conteudo": mensagem.conteudo, "data_envio": mensagem.data_envio.isoformat(),
    }, status=201)


@csrf_exempt
@require_http_methods(["GET"])
def mensagens_list_professor_responsaveis(request):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    conversas = (
        ConversaResponsavelProfessor.objects.filter(professor=professor)
        .select_related("responsavel", "aluno")
        .order_by("-ultima_atualizacao")
    )
    resultado = []
    for c in conversas:
        ultima = c.mensagens.last()
        nao_lidas = c.mensagens.filter(remetente_tipo="RESPONSAVEL", lida_professor=False).count()
        resultado.append({
            "id": c.id,
            "responsavel_nome": c.responsavel.nome_completo,
            "aluno_nome": c.aluno.nome_completo,
            "ultima_mensagem": ultima.conteudo if ultima else None,
            "ultima_atualizacao": c.ultima_atualizacao.isoformat(),
            "nao_lidas": nao_lidas,
        })
    return JsonResponse(resultado, safe=False)




@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagem_conversa_professor_responsavel_detalhe(request, conversa_id):
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    conversa = ConversaResponsavelProfessor.objects.filter(
        id=conversa_id, professor=professor
    ).select_related("responsavel", "aluno").first()
    if not conversa:
        return JsonResponse({"detail": "Conversa não encontrada."}, status=404)

    if request.method == "GET":
        conversa.mensagens.filter(remetente_tipo="RESPONSAVEL", lida_professor=False).update(lida_professor=True)
        mensagens = [
            {"id": m.id, "remetente_tipo": m.remetente_tipo, "conteudo": m.conteudo, "data_envio": m.data_envio.isoformat()}
            for m in conversa.mensagens.all()
        ]
        return JsonResponse({
            "conversa": {
                "id": conversa.id,
                "responsavel_nome": conversa.responsavel.nome_completo,
                "aluno_nome": conversa.aluno.nome_completo,
            },
            "mensagens": mensagens,
        })

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"detail": "conteudo é obrigatório."}, status=400)

    mensagem = MensagemChatResponsavelProfessor.objects.create(
        conversa=conversa, remetente_tipo="PROFESSOR", conteudo=conteudo, lida_professor=True,
    )
    conversa.save()

    return JsonResponse({
        "id": mensagem.id, "remetente_tipo": mensagem.remetente_tipo,
        "conteudo": mensagem.conteudo, "data_envio": mensagem.data_envio.isoformat(),
    }, status=201)



@csrf_exempt
@require_http_methods(["GET"])
def mensagens_list_coordenacao_responsaveis(request):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    conversas = (
        ConversaResponsavelCoordenador.objects.filter(coordenador=coordenador)
        .select_related("responsavel", "aluno")
        .order_by("-ultima_atualizacao")
    )
    resultado = []
    for c in conversas:
        ultima = c.mensagens.last()
        nao_lidas = c.mensagens.filter(remetente_tipo="RESPONSAVEL", lida_coordenacao=False).count()
        resultado.append({
            "id": c.id,
            "responsavel_nome": c.responsavel.nome_completo,
            "aluno_nome": c.aluno.nome_completo,
            "ultima_mensagem": ultima.conteudo if ultima else None,
            "ultima_atualizacao": c.ultima_atualizacao.isoformat(),
            "nao_lidas": nao_lidas,
        })
    return JsonResponse(resultado, safe=False)



@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagem_conversa_coordenacao_responsavel_detalhe(request, conversa_id):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    conversa = ConversaResponsavelCoordenador.objects.filter(
        id=conversa_id, coordenador=coordenador
    ).select_related("responsavel", "aluno").first()
    if not conversa:
        return JsonResponse({"detail": "Conversa não encontrada."}, status=404)

    if request.method == "GET":
        conversa.mensagens.filter(remetente_tipo="RESPONSAVEL", lida_coordenacao=False).update(lida_coordenacao=True)
        mensagens = [
            {"id": m.id, "remetente_tipo": m.remetente_tipo, "conteudo": m.conteudo, "data_envio": m.data_envio.isoformat()}
            for m in conversa.mensagens.all()
        ]
        return JsonResponse({
            "conversa": {
                "id": conversa.id,
                "responsavel_nome": conversa.responsavel.nome_completo,
                "aluno_nome": conversa.aluno.nome_completo,
            },
            "mensagens": mensagens,
        })

    body = json.loads(request.body or "{}")
    conteudo = (body.get("conteudo") or "").strip()
    if not conteudo:
        return JsonResponse({"detail": "conteudo é obrigatório."}, status=400)

    mensagem = MensagemChatResponsavelCoordenador.objects.create(
        conversa=conversa, remetente_tipo="COORDENACAO", conteudo=conteudo, lida_coordenacao=True,
    )
    conversa.save()

    return JsonResponse({
        "id": mensagem.id, "remetente_tipo": mensagem.remetente_tipo,
        "conteudo": mensagem.conteudo, "data_envio": mensagem.data_envio.isoformat(),
    }, status=201)


def _alunos_da_escola_coordenador(coordenador):
    nome_escola_coord = _turma_normalizada(_nome_escola(coordenador.escola))
    if not nome_escola_coord:
        return Estudante.objects.none()

    alunos_ids = []
    for aluno in Estudante.objects.all():
        nome_escola_aluno = _turma_normalizada(aluno.escola)
        if not nome_escola_aluno:
            continue
        if (
            nome_escola_aluno == nome_escola_coord
            or nome_escola_aluno in nome_escola_coord
            or nome_escola_coord in nome_escola_aluno
        ):
            alunos_ids.append(aluno.id)

    return Estudante.objects.filter(id__in=alunos_ids)


@csrf_exempt
@require_http_methods(["GET"])
def solicitacoes_responsavel_coordenacao(request):
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    alunos_escola = _alunos_da_escola_coordenador(coordenador)
    vinculos = VinculoResponsavel.objects.filter(
        aluno__in=alunos_escola
    ).select_related("aluno", "responsavel").order_by("-data_solicitacao")

    return JsonResponse({
        "solicitacoes": [
            {
                "id": v.id,
                "aluno_nome": v.aluno.nome_completo,
                "aluno_turma": v.aluno.turma,
                "responsavel_nome": v.responsavel.nome_completo,
                "parentesco": v.parentesco,
                "status": v.status,
                "origem": v.origem,
                "data_solicitacao": v.data_solicitacao.isoformat(),
            }
            for v in vinculos
        ]
    })


@csrf_exempt
@require_http_methods(["POST"])
def solicitacao_responsavel_coordenacao_responder(request, vinculo_id):
    """Permite à organização aprovar/recusar diretamente — útil se o aluno
    demorar a responder ou estiver inacessível."""
    coordenador = _coordenador_logado(request)
    if not coordenador:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculo = VinculoResponsavel.objects.filter(id=vinculo_id).select_related("aluno").first()
    if not vinculo:
        return JsonResponse({"detail": "Solicitação não encontrada."}, status=404)

    alunos_escola_ids = set(_alunos_da_escola_coordenador(coordenador).values_list("id", flat=True))
    if vinculo.aluno_id not in alunos_escola_ids:
        return JsonResponse({"detail": "Esse aluno não pertence à sua escola."}, status=403)

    body = json.loads(request.body or "{}")
    decisao = body.get("decisao")
    if decisao not in ("APROVADO", "RECUSADO"):
        return JsonResponse({"detail": "decisao deve ser 'APROVADO' ou 'RECUSADO'."}, status=400)

    vinculo.status = decisao
    vinculo.data_resposta = timezone.now()
    vinculo.save(update_fields=["status", "data_resposta"])

    return JsonResponse({"status": vinculo.status})


def _campo_pdf(obj, nome):
    if obj is None:
        return "—"
    valor = getattr(obj, nome)
    return str(valor) if valor is not None else "—"


def _nota_ficha_pdf(obj, nome):
    if obj is None:
        return "—"
    valor = getattr(obj, nome)
    return f"{valor:.1f}" if valor is not None else "—"


def _cor_nota_ficha_pdf(obj, nome):
    if obj is None:
        return ""
    valor = getattr(obj, nome)
    if valor is None:
        return ""
    if valor > 6:
        return "nota-alta"
    if valor < 6:
        return "nota-baixa"
    return ""



def _nome_arquivo_seguro(texto):
    """Remove acentos e qualquer caractere fora de A-Z/0-9/_/- , pra nunca
    quebrar o header Content-Disposition (que exige ASCII puro)."""
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Za-z0-9_\-]+", "_", texto)
    return texto.strip("_")

@csrf_exempt
def gerar_ficha_notas_pdf(request, turma_id):
    """Gera a ficha de notas (todos os alunos da turma) em PDF, pronta para impressão."""
    professor = _professor_atual(request)
    if not professor:
        return JsonResponse({"message": "Não autenticado"}, status=401)

    ano_letivo = request.GET.get("ano_letivo", "2026")

    turma_obj = AtravessaPor.objects.filter(id=turma_id, professor=professor).first()
    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma_obj)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nome_turma = turma_obj.turma
    alunos = buscar_alunos_por_turma(nome_turma)
    tgf_por_aluno = _mapa_tgf_por_aluno(turma_obj, disciplina, professor, ano_letivo)

    linhas = []
    for aluno in alunos:
        nota = Nota.objects.filter(
            aluno=aluno, turma_id=turma_id, disciplina=disciplina,
            professor=professor, ano_letivo=ano_letivo,
        ).first()

        linhas.append({
            "posicao_ordem": aluno.posicao_ordem or "—",
            "nome_completo": aluno.nome_completo,
            "nm1_t1": _nota_ficha_pdf(nota, "nm1_t1"), "nm2_t1": _nota_ficha_pdf(nota, "nm2_t1"),
            "nm3_t1": _nota_ficha_pdf(nota, "nm3_t1"), "mt_t1": _nota_ficha_pdf(nota, "mt_t1"),
            "rpt_t1": _nota_ficha_pdf(nota, "rpt_t1"), "mtf_t1": _nota_ficha_pdf(nota, "mtf_t1"),
            "nm1_t2": _nota_ficha_pdf(nota, "nm1_t2"), "nm2_t2": _nota_ficha_pdf(nota, "nm2_t2"),
            "nm3_t2": _nota_ficha_pdf(nota, "nm3_t2"), "mt_t2": _nota_ficha_pdf(nota, "mt_t2"),
            "rpt_t2": _nota_ficha_pdf(nota, "rpt_t2"), "mtf_t2": _nota_ficha_pdf(nota, "mtf_t2"),
            "nm1_t3": _nota_ficha_pdf(nota, "nm1_t3"), "nm2_t3": _nota_ficha_pdf(nota, "nm2_t3"),
            "nm3_t3": _nota_ficha_pdf(nota, "nm3_t3"), "mt_t3": _nota_ficha_pdf(nota, "mt_t3"),
            "rpt_t3": _nota_ficha_pdf(nota, "rpt_t3"), "mtf_t3": _nota_ficha_pdf(nota, "mtf_t3"),
            "ma": _nota_ficha_pdf(nota, "ma"), "pf": _nota_ficha_pdf(nota, "pf"),
            "maf": _nota_ficha_pdf(nota, "maf"), "rcf": _nota_ficha_pdf(nota, "rcf"),
            "tgf": tgf_por_aluno.get(aluno.id, 0),
            "rf": nota.get_rf_display() if nota else "Não Definido",
            "rf_sigla": nota.rf if nota else "ND",
            "cores": {
                campo: _cor_nota_ficha_pdf(nota, campo)
                for campo in (
                    "nm1_t1", "nm2_t1", "nm3_t1", "mt_t1", "rpt_t1", "mtf_t1",
                    "nm1_t2", "nm2_t2", "nm3_t2", "mt_t2", "rpt_t2", "mtf_t2",
                    "nm1_t3", "nm2_t3", "nm3_t3", "mt_t3", "rpt_t3", "mtf_t3",
                    "ma", "pf", "maf", "rcf",
                )
            },
        })

    escola = turma_obj.escola or next((aluno.escola for aluno in alunos if aluno.escola), "—")
    ano_serie = turma_obj.etapa or next((aluno.serie for aluno in alunos if aluno.serie), "—")
    turno = next((aluno.periodo for aluno in alunos if aluno.periodo), "—")

    logo_path_absoluto = os.path.join(settings.BASE_DIR, 'app', 'static', 'logo.png')
    logo_path = f"file://{logo_path_absoluto}" if os.path.exists(logo_path_absoluto) else None

    contexto = {
        "nome_turma": nome_turma,
        "escola": escola,
        "ano_serie": ano_serie,
        "turno": turno,
        "disciplina": disciplina.nome_disciplina,
        "professor": professor.nome_completo,
        "ano_letivo": ano_letivo,
        "linhas": linhas,
        "logo_path": logo_path,
        "data_emissao": date.today().strftime("%d/%m/%Y"),
    }

    html_string = render_to_string("notas/ficha_pdf.html", contexto)
    from .pdf import html_to_pdf
    pdf_file = html_to_pdf(html_string)

    nome_arquivo = f"ficha_notas_{_nome_arquivo_seguro(nome_turma)}_{_nome_arquivo_seguro(disciplina.nome_disciplina)}.pdf"

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response


@csrf_exempt
@require_http_methods(["GET"])
def boletim_aluno_pdf(request):
    """Gera o PDF do boletim do aluno autenticado, no mesmo padrão da ficha de notas do professor."""
    aluno = _aluno_logado(request)
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    ano_letivo = request.GET.get("ano_letivo", "2026")

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    )

    disciplinas_map = {}
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        if not disciplina or disciplina.id in disciplinas_map:
            continue
        disciplinas_map[disciplina.id] = {
            "disciplina": disciplina,
            "turma_obj": h.turma,
            "professor": h.turma.professor,
        }

    linhas = []
    for info in sorted(disciplinas_map.values(), key=lambda x: x["disciplina"].nome_disciplina):
        disciplina = info["disciplina"]
        nota = Nota.objects.filter(
            aluno=aluno,
            disciplina=disciplina,
            turma=info["turma_obj"],
            professor=info["professor"],
            ano_letivo=ano_letivo,
        ).first()

        linhas.append({
            "disciplina": disciplina.nome_disciplina,
            "professor_nome": info["professor"].nome_completo if info["professor"] else "—",
            "nm1_t1": _campo_pdf(nota, "nm1_t1"), "nm2_t1": _campo_pdf(nota, "nm2_t1"),
            "nm3_t1": _campo_pdf(nota, "nm3_t1"), "mt_t1": _campo_pdf(nota, "mt_t1"),
            "nm1_t2": _campo_pdf(nota, "nm1_t2"), "nm2_t2": _campo_pdf(nota, "nm2_t2"),
            "nm3_t2": _campo_pdf(nota, "nm3_t2"), "mt_t2": _campo_pdf(nota, "mt_t2"),
            "nm1_t3": _campo_pdf(nota, "nm1_t3"), "nm2_t3": _campo_pdf(nota, "nm2_t3"),
            "nm3_t3": _campo_pdf(nota, "nm3_t3"), "mt_t3": _campo_pdf(nota, "mt_t3"),
            "ma": _campo_pdf(nota, "ma"), "pf": _campo_pdf(nota, "pf"),
            "maf": _campo_pdf(nota, "maf"),
            "rf": nota.get_rf_display() if nota else "Não Definido",
        })

    logo_path_absoluto = os.path.join(settings.BASE_DIR, "app", "static", "logo.png")
    logo_path = f"file://{logo_path_absoluto}" if os.path.exists(logo_path_absoluto) else None

    contexto = {
        "aluno": aluno,
        "linhas": linhas,
        "logo_path": logo_path,
        "data_emissao": date.today().strftime("%d/%m/%Y"),
    }

    html_string = render_to_string("boletim/pdf.html", contexto)
    from .pdf import html_to_pdf
    pdf_file = html_to_pdf(html_string)

    nome_arquivo = f"boletim_{_nome_arquivo_seguro(aluno.nome_completo)}.pdf"

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response



@csrf_exempt
@require_http_methods(["GET"])
def boletim_aluno_pdf_responsavel(request, aluno_id):
    """Gera o PDF do boletim do aluno, para o responsável com acesso aprovado."""
    responsavel, aluno, erro = _verificar_acesso_responsavel(request, aluno_id)
    if erro:
        return erro

    ano_letivo = request.GET.get("ano_letivo", "2026")

    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    )

    disciplinas_map = {}
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        if not disciplina or disciplina.id in disciplinas_map:
            continue
        disciplinas_map[disciplina.id] = {
            "disciplina": disciplina,
            "turma_obj": h.turma,
            "professor": h.turma.professor,
        }

    linhas = []
    for info in sorted(disciplinas_map.values(), key=lambda x: x["disciplina"].nome_disciplina):
        disciplina = info["disciplina"]
        nota = Nota.objects.filter(
            aluno=aluno,
            disciplina=disciplina,
            turma=info["turma_obj"],
            professor=info["professor"],
            ano_letivo=ano_letivo,
        ).first()

        linhas.append({
            "disciplina": disciplina.nome_disciplina,
            "professor_nome": info["professor"].nome_completo if info["professor"] else "—",
            "nm1_t1": _campo_pdf(nota, "nm1_t1"), "nm2_t1": _campo_pdf(nota, "nm2_t1"),
            "nm3_t1": _campo_pdf(nota, "nm3_t1"), "mt_t1": _campo_pdf(nota, "mt_t1"),
            "nm1_t2": _campo_pdf(nota, "nm1_t2"), "nm2_t2": _campo_pdf(nota, "nm2_t2"),
            "nm3_t2": _campo_pdf(nota, "nm3_t2"), "mt_t2": _campo_pdf(nota, "mt_t2"),
            "nm1_t3": _campo_pdf(nota, "nm1_t3"), "nm2_t3": _campo_pdf(nota, "nm2_t3"),
            "nm3_t3": _campo_pdf(nota, "nm3_t3"), "mt_t3": _campo_pdf(nota, "mt_t3"),
            "ma": _campo_pdf(nota, "ma"), "pf": _campo_pdf(nota, "pf"),
            "maf": _campo_pdf(nota, "maf"),
            "rf": nota.get_rf_display() if nota else "Não Definido",
        })

    logo_path_absoluto = os.path.join(settings.BASE_DIR, "app", "static", "logo.png")
    logo_path = f"file://{logo_path_absoluto}" if os.path.exists(logo_path_absoluto) else None

    contexto = {
        "aluno": aluno,
        "linhas": linhas,
        "logo_path": logo_path,
        "data_emissao": date.today().strftime("%d/%m/%Y"),
    }

    html_string = render_to_string("boletim/pdf.html", contexto)
    from .pdf import html_to_pdf
    pdf_file = html_to_pdf(html_string)

    nome_arquivo = f"boletim_{_nome_arquivo_seguro(aluno.nome_completo)}.pdf"

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response


@csrf_exempt
@require_http_methods(["GET"])
def horarios_professor(request):
    """Grade de horários do professor autenticado, com turma + disciplina em cada aula
    (diferente do horário de uma turma específica, aqui o professor pode ter
    turmas diferentes em cada slot da semana)."""
    professor = _professor_logado(request)
    if not professor:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculos = AtravessaPor.objects.filter(professor=professor)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related("turma").order_by(
        "dia_semana", "hora_inicio"
    )

    resultado = []
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        resultado.append({
            "id": h.id,
            "dia_semana": h.dia_semana,
            "hora_inicio": h.hora_inicio.strftime("%H:%M") if h.hora_inicio else None,
            "hora_fim": h.hora_fim.strftime("%H:%M") if h.hora_fim else None,
            "turma": h.turma.turma,
            "disciplina": disciplina.nome_disciplina if disciplina else h.turma.disciplina_lecionada,
        })

    return JsonResponse({"horarios": resultado})


# ---------- Organização: edição do horário de um professor específico ----------

@csrf_exempt
@require_http_methods(["GET"])
def get_horarios_professor_coordenacao(request, professor_id):
    """Retorna a grade atual do professor, já com a atravessa_por_id de cada
    célula preenchida (necessário pro frontend saber o que já está selecionado)."""
    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    vinculos = AtravessaPor.objects.filter(professor=professor)
    horarios = HorarioAula.objects.filter(turma__in=vinculos).select_related("turma").order_by(
        "dia_semana", "hora_inicio"
    )

    resultado = []
    for h in horarios:
        disciplina = resolver_disciplina_da_turma(h.turma)
        resultado.append({
            "id": h.id,
            "atravessa_por_id": h.turma_id,
            "dia_semana": h.dia_semana,
            "hora_inicio": h.hora_inicio.strftime("%H:%M"),
            "hora_fim": h.hora_fim.strftime("%H:%M"),
            "turma": h.turma.turma,
            "disciplina": disciplina.nome_disciplina if disciplina else h.turma.disciplina_lecionada,
        })

    return JsonResponse({
        "professor": {"id": professor.id, "nome_completo": professor.nome_completo},
        "total_horarios": len(resultado),
        "horarios": resultado,
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_opcoes_horario_professor(request, professor_id):
    """Lista as combinações turma+disciplina que esse professor leciona —
    equivalente ao get_opcoes_horario_turma, só que o eixo é o professor,
    não a turma: cada opção já traz QUAL turma e QUAL disciplina, porque
    um mesmo professor pode lecionar em turmas diferentes."""
    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    registros = AtravessaPor.objects.filter(professor=professor)
    if not registros.exists():
        return JsonResponse(
            {"message": "Este professor não possui turmas/disciplinas vinculadas."},
            status=404
        )

    resultado = []
    for r in registros:
        disciplina = resolver_disciplina_da_turma(r)
        resultado.append({
            "atravessa_por_id": r.id,
            "turma": r.turma,
            "disciplina": disciplina.nome_disciplina if disciplina else r.disciplina_lecionada,
        })

    return JsonResponse({"opcoes": resultado})


@csrf_exempt
def salvar_horario_professor(request, professor_id):
    """
    Salva a grade de horários de UM professor. Diferente de salvar_horario_turma
    (que limpa e recria por turma+dia+hora), aqui a limpeza é por
    PROFESSOR+dia+hora — isso garante, por construção, que o mesmo professor
    nunca fica com duas turmas atribuídas no mesmo horário: ao salvar uma
    célula, qualquer atribuição anterior desse professor naquele slot (esteja
    ela em qual turma for) é removida antes de criar a nova.
    """
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor = Professor.objects.filter(id=professor_id).first()
    if not professor:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    atribuicoes = body.get("atribuicoes", [])
    if not atribuicoes:
        return JsonResponse({"message": "Nenhuma atribuição enviada."}, status=400)

    dias_validos = dict(HorarioAula.DIA_CHOICES).keys()
    vinculos_professor_ids = set(
        AtravessaPor.objects.filter(professor=professor).values_list("id", flat=True)
    )

    erros = []
    total_salvos = 0
    total_removidos = 0

    for item in atribuicoes:
        dia = item.get("dia_semana")
        hora_inicio_str = item.get("hora_inicio")
        hora_fim_str = item.get("hora_fim")
        atravessa_por_id = item.get("atravessa_por_id")

        if dia not in dias_validos or not hora_inicio_str or not hora_fim_str:
            erros.append(f"Célula inválida ignorada: {item}")
            continue

        # Remove qualquer aula já atribuída a ESTE professor nessa célula,
        # independente de qual turma estava associada antes.
        HorarioAula.objects.filter(
            turma__professor=professor, dia_semana=dia, hora_inicio=hora_inicio_str
        ).delete()
        total_removidos += 1

        if atravessa_por_id:
            if atravessa_por_id not in vinculos_professor_ids:
                erros.append(f"Vínculo {atravessa_por_id} não pertence a este professor — ignorado.")
                continue

            atravessa_por = AtravessaPor.objects.get(id=atravessa_por_id)

            HorarioAula.objects.create(
                turma=atravessa_por,
                dia_semana=dia,
                hora_inicio=hora_inicio_str,
                hora_fim=hora_fim_str,
            )
            total_salvos += 1

    return JsonResponse({
        "message": "Grade de horários do professor salva com sucesso.",
        "total_salvos": total_salvos,
        "erros": erros,
    })

@csrf_exempt
@require_http_methods(["GET"])
def curtidas_post(request, post_id):
    """Lista quem curtiu um post — resolve o nome a partir do tipo+id salvos
    em cada Curtida, já que o model não guarda o nome diretamente (evita
    nome desatualizado se a pessoa mudar de nome depois de curtir)."""
    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    resultado = []
    for c in post.curtidas.order_by("-data_criacao"):
        modelo = MODELOS_POR_TIPO_BLOG.get(c.autor_tipo)
        usuario = modelo.objects.filter(id=c.autor_id).first() if modelo else None
        resultado.append({
            "nome_completo": usuario.nome_completo if usuario else "Usuário removido",
            "tipo": c.autor_tipo,
        })

    return JsonResponse({"total": len(resultado), "curtidas": resultado})


def _gerar_username_unico(nome_completo):
    base = slugify(nome_completo).replace("-", "")[:20] or "usuario"
    candidato = base
    contador = 1
    while PerfilBlog.objects.filter(nome_usuario=candidato).exists():
        contador += 1
        candidato = f"{base}{contador}"
    return candidato



def _obter_ou_criar_perfil_blog(tipo, referencia_id, nome_completo):
    perfil, _ = PerfilBlog.objects.get_or_create(
        tipo=tipo, referencia_id=referencia_id,
        defaults={"nome_usuario": _gerar_username_unico(nome_completo)},
    )
    return perfil




def _username_do_autor(tipo, referencia_id, nome_completo):
    perfil = PerfilBlog.objects.filter(tipo=tipo, referencia_id=referencia_id).first()
    if not perfil:
        perfil = _obter_ou_criar_perfil_blog(tipo, referencia_id, nome_completo)
    return perfil.nome_usuario


@csrf_exempt
@require_http_methods(["GET"])
def get_perfil_blog(request, nome_usuario):
    perfil = PerfilBlog.objects.filter(nome_usuario=nome_usuario).first()
    if not perfil:
        return JsonResponse({"message": "Usuário não encontrado."}, status=404)

    sessao = _sessao_blog_atual(request)
    eh_proprio_perfil = bool(
        sessao and sessao.tipo == perfil.tipo and sessao.referencia_id == perfil.referencia_id
    )

    modelo = MODELOS_POR_TIPO_BLOG.get(perfil.tipo)
    usuario_obj = modelo.objects.filter(id=perfil.referencia_id).first() if modelo else None
    nome_completo = usuario_obj.nome_completo if usuario_obj else "Usuário removido"

    posts = Post.objects.filter(autor_tipo=perfil.tipo, autor_id=perfil.referencia_id).order_by("-data_criacao")
    total_curtidas_recebidas = sum(p.curtidas.count() for p in posts)

    posts_json = [
        {
            "id": p.id,
            "titulo": p.titulo,
            "resumo": (p.conteudo[:160] + "…") if len(p.conteudo) > 160 else p.conteudo,
            "imagem_url": caminho_relativo_arquivo(p.imagem) if p.imagem else None,
            "data_criacao": p.data_criacao.isoformat(),
            "total_curtidas": p.curtidas.count(),
            "total_comentarios": p.comentarios.count(),
        }
        for p in posts
    ]

    return JsonResponse({
        "perfil": {
            "nome_usuario": perfil.nome_usuario,
            "nome_completo": nome_completo,
            "tipo": perfil.tipo,
            "bio": perfil.bio,
            "data_nascimento": perfil.data_nascimento.isoformat() if perfil.data_nascimento else None,
            "foto_perfil_url": caminho_relativo_arquivo(perfil.foto_perfil) if perfil.foto_perfil else None,
            "eh_proprio_perfil": eh_proprio_perfil,
        },
        "estatisticas": {
            "total_posts": posts.count(),
            "total_curtidas_recebidas": total_curtidas_recebidas,
        },
        "posts": posts_json,
    })


@csrf_exempt
@require_http_methods(["POST"])
def editar_perfil_blog(request, nome_usuario):
    sessao = _sessao_blog_atual(request)
    if not sessao:
        return JsonResponse({"message": "Você precisa estar autenticado."}, status=401)

    perfil = PerfilBlog.objects.filter(nome_usuario=nome_usuario).first()
    if not perfil:
        return JsonResponse({"message": "Usuário não encontrado."}, status=404)

    if perfil.tipo != sessao.tipo or perfil.referencia_id != sessao.referencia_id:
        return JsonResponse({"message": "Você só pode editar seu próprio perfil."}, status=403)

    novo_username = (request.POST.get("nome_usuario") or "").strip().lower()
    bio = (request.POST.get("bio") or "").strip()
    data_nascimento_str = request.POST.get("data_nascimento") or ""
    remover_foto = request.POST.get("remover_foto") == "true"
    nova_foto = request.FILES.get("foto_perfil")

    if not novo_username:
        return JsonResponse({"message": "O nome de usuário não pode ficar vazio."}, status=400)

    if not re.match(r"^[a-z0-9_.]{3,30}$", novo_username):
        return JsonResponse(
            {"message": "Use de 3 a 30 caracteres: letras minúsculas, números, ponto ou underline."},
            status=400
        )

    if PerfilBlog.objects.filter(nome_usuario=novo_username).exclude(id=perfil.id).exists():
        return JsonResponse({"message": "Esse nome de usuário já está em uso."}, status=400)

    data_nascimento = None
    if data_nascimento_str:
        try:
            data_nascimento = date.fromisoformat(data_nascimento_str)
        except ValueError:
            return JsonResponse({"message": "Formato de data de nascimento inválido. Use AAAA-MM-DD."}, status=400)

    perfil.nome_usuario = novo_username
    perfil.bio = bio
    perfil.data_nascimento = data_nascimento

    if nova_foto:
        perfil.foto_perfil = nova_foto
    elif remover_foto:
        perfil.foto_perfil = None

    perfil.save()

    return JsonResponse({"message": "Perfil atualizado com sucesso.", "nome_usuario": perfil.nome_usuario})