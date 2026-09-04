from urllib.parse import urlparse
from urllib.parse import unquote
from django.utils import timezone
from datetime import date
import unicodedata
from django.db.models.functions import Replace
from django.db.models import Value
from django.db.models.functions import Trim
from django.shortcuts import render, redirect
import requests
from django.http import HttpResponse, JsonResponse, request
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
from .models import Comunicado
from .models import Coordenador
from .models import Advertencia
from .models import HorarioAula
from .models import Blogger
from .models import Post
from .models import Admin
from .models import EstudoProgramado
from django.core.files.storage import default_storage
from .models import Avaliacao, Questao, Alternativa
from .models import MensagemChat
from .models import Conversa
from .models import VinculoResponsavel
from .models import Responsavel
from django.db import models
import json
import string
from django.templatetags.static import static
from django.template.loader import render_to_string
from weasyprint import HTML
from django.views.decorators.http import require_http_methods
from django.db.models import Avg
import json



load_dotenv()

api = os.getenv("IP_API")

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
    course = request.GET.get("course", "").strip().lower()

    file = Path("/workspaces/siaa-seduc/infra/alunos_formatados.json")
    if not file.exists():
        file = Path(__file__).resolve().parent.parent / "alunos_formatados.json"
    
    try:
        with open(file, "r", encoding="utf-8") as f:
            students_data = json.load(f)
        
        results = []

        for page_id, page_content in students_data.items():
            students_list = page_content.get("alunos", [])

            for student in students_list:
                student_name = student.get('nome_completo', '')

                if fullName and fullName not in student_name.lower():
                    continue

                results.append({
                    "posicao_ordem": student.get('posicao_ordem'),
                    "nome_completo": student_name,
                    "escola": page_content.get('escola'),
                    "serie": page_content.get('serie'),
                    "turma": page_content.get('turma'),
                    "periodo": page_content.get('periodo'),
                    "curso": page_content.get('curso')
                })

        print({
            "total_encontrado": len(results),
            "estudante": results
        })  
        return JsonResponse({
            "total_encontrado": len(results),
            "estudante": results
        })
    except FileNotFoundError:
        return JsonResponse({"erro": "Arquivo data.json não encontrado."})
    except json.JSONDecodeError:
        return JsonResponse({"erro": "Erro ao processar o arquivo JSON."})


@csrf_exempt
def login_student(request):
    ip_student = get_ip()
    print(ip_student)
    fullName = request.GET.get("fullname").strip().upper()
    password = request.GET.get("password").strip().lower()
    
    student = Estudante.objects.filter(nome_completo=fullName, senha=password).first()
    print({
        fullName,
        password
    })
    print(student)
    print(ip_student)
    if student is None:
        return JsonResponse({
            "return": False
        })
    else:
        update = Estudante.objects.filter(nome_completo=fullName, senha=password).update(ip=ip_student)
        return JsonResponse({
            "return": True
        })
    
    
@csrf_exempt
def auth_student(request):
    ip_student = get_ip()
    print(ip_student)
    student = Estudante.objects.filter(ip=ip_student).first()
    try:
        student = model_to_dict(student)
        if student is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "student": student,
                "return": True
            })
    except:
        return JsonResponse({
            "message": "Usuario nao encontrado.",
            "return": None
        })
        
    

@csrf_exempt
def login_teacher(request):
    ip = get_ip()
    print(ip)
    nome_completo = request.GET.get("nome_completo").strip().upper()
    senha = request.GET.get("senha").strip().upper()


    getProfessor = Professor.objects.filter(nome_completo=nome_completo, senha=senha).first()

    print(getProfessor)

    if getProfessor is None:
        return JsonResponse({
            "return": False
        })
    else:
        updateProfessor = Professor.objects.filter(nome_completo=nome_completo, senha=senha).update(ip=ip)
        return JsonResponse({
            "return": True
        })

@csrf_exempt
def auth_teacher(request):
    ip = get_ip()
    teacher = Professor.objects.filter(ip=ip).first()
    print(teacher)
    try:
        teacher = model_to_dict(teacher)
        print(teacher)
        if teacher is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "return": True,
                "teacher": teacher
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

    # Resolve o ID da disciplina a partir do texto 'disciplina_lecionada'
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


def buscar_atravessapor_por_turma(nome_turma):
    """
    Busca vínculos AtravessaPor cujo campo 'turma' bate com o nome informado,
    normalizando espaços e ignorando maiúsculas/minúsculas — mesmo critério
    usado em buscar_alunos_por_turma, só que do lado do AtravessaPor.
    """
    nome_normalizado = (nome_turma or "").replace(" ", "").strip().lower()

    return AtravessaPor.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=nome_normalizado)

def buscar_alunos_por_turma(nome_turma):
    """
    Busca alunos no model Estudante cujo campo 'turma' bate com o nome informado,
    normalizando espaços e ignorando maiúsculas/minúsculas.
    """
    nome_normalizado = (nome_turma or "").replace(" ", "").strip().lower()

    alunos = Estudante.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=nome_normalizado).order_by("posicao_ordem", "nome_completo")

    return alunos


def _normalizar_texto(texto):
    texto = texto or ""
    texto = unicodedata.normalize("NFC", texto)
    return texto.replace(" ", "").strip().lower()


def resolver_disciplina_da_turma(turma_obj):
    nome_busca = _normalizar_texto(turma_obj.disciplina_lecionada)
    print("DEBUG - buscando (normalizado):", repr(nome_busca))
    print("DEBUG - bytes do texto buscado:", nome_busca.encode("utf-8"))

    if not nome_busca:
        return None

    for disciplina in Disciplina.objects.all():
        nome_disc_normalizado = _normalizar_texto(disciplina.nome_disciplina)
        if "quim" in nome_disc_normalizado or "quí" in nome_disc_normalizado:
            print("DEBUG - candidato:", repr(nome_disc_normalizado))
            print("DEBUG - bytes do candidato:", nome_disc_normalizado.encode("utf-8"))
            print("DEBUG - são iguais?", nome_disc_normalizado == nome_busca)

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
            "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
            "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
            "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
            "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
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
                "tgf": nota.tgf if nota else 0,
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

        if "tgf" in campos:
            try:
                nota.tgf = int(campos["tgf"] or 0)
            except (ValueError, TypeError):
                erros_aluno.append(f"Valor inválido para tgf: {campos['tgf']}")

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
                "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
                "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
                "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
                "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
                "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
                "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
                "ma": float(nota.ma) if nota.ma is not None else None,
                "maf": float(nota.maf) if nota.maf is not None else None,
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
    """
    Retorna o boletim completo do aluno autenticado: todas as disciplinas
    que ele cursa, com notas trimestrais, resultado final, faltas e situação.
    Autenticação feita pelo IP, igual ao restante do fluxo do aluno.
    """
    ip_aluno = get_ip()
    aluno = Estudante.objects.filter(ip=ip_aluno).first()

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
    assunto = body.get("assunto", "")
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

    # Salva/atualiza o assunto do dia
    Aula.objects.update_or_create(
        turma=turma, disciplina=disciplina, professor=professor, data=data_selecionada,
        defaults={"assunto": assunto, "ano_letivo": ano_letivo},
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
    """
    Lista os registros de frequência já feitos pelo professor, agrupados
    por turma + disciplina + data (uma linha por aula ministrada).
    """
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
    """Lista os eventos do professor, opcionalmente filtrados por mês/ano ou turma."""
    professor_id = request.GET.get("professor")
    mes = request.GET.get("mes")   # ex: "07"
    ano = request.GET.get("ano")   # ex: "2026"
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
    """Cria um novo evento no calendário escolar."""
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
    """Remove um evento do calendário."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    evento = Evento.objects.filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    evento.delete()
    return JsonResponse({"message": "Evento removido com sucesso."})



def caminho_relativo_arquivo(arquivo_field):
    """
    Garante que a URL do arquivo seja sempre relativa, começando com /media/,
    independente de como o storage backend monta a URL internamente
    (evita problemas de domínio/porta errados, como localhost em produção/túnel).
    """
    if not arquivo_field:
        return None

    url = arquivo_field.url
    parsed = urlparse(url)
    return parsed.path


@csrf_exempt
def get_conteudos(request):
    """Lista os conteúdos do professor, opcionalmente filtrados por mês/ano ou turma."""
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
    """Cria um novo conteúdo. Aceita multipart/form-data por causa do arquivo opcional."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor_id = request.POST.get("professor")
    turma_id = request.POST.get("turma")
    titulo = (request.POST.get("titulo") or "").strip()
    descricao = (request.POST.get("descricao") or "").strip()
    data_str = request.POST.get("data")
    arquivo = request.FILES.get("arquivo")

    if not all([professor_id, turma_id, titulo, data_str]):
        return JsonResponse(
            {"message": "Campos 'professor', 'turma', 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_conteudo = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    try:
        professor = Professor.objects.get(id=professor_id)
    except Professor.DoesNotExist:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    turma = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    conteudo = Conteudo.objects.create(
        professor=professor,
        turma=turma,
        disciplina=disciplina,
        titulo=titulo,
        descricao=descricao,
        data=data_conteudo,
        arquivo=arquivo,
    )

    return JsonResponse({
        "message": "Conteúdo criado com sucesso.",
        "conteudo": {
            "id": conteudo.id,
            "titulo": conteudo.titulo,
            "descricao": conteudo.descricao,
            "data": conteudo.data.isoformat(),
            "turma_id": conteudo.turma_id,
            "nome_turma": conteudo.turma.turma,
            "disciplina": conteudo.disciplina.nome_disciplina,
            "arquivo_url": caminho_relativo_arquivo(conteudo.arquivo),
        }
    })


@csrf_exempt
def deletar_conteudo(request, conteudo_id):
    """Remove um conteúdo."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    conteudo = Conteudo.objects.filter(id=conteudo_id).first()
    if not conteudo:
        return JsonResponse({"message": "Conteúdo não encontrado."}, status=404)

    conteudo.delete()
    return JsonResponse({"message": "Conteúdo removido com sucesso."})



@csrf_exempt
def get_atividades(request):
    """Lista as atividades do professor, opcionalmente filtradas por mês/ano ou turma."""
    professor_id = request.GET.get("professor")
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")
    turma_id = request.GET.get("turma")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    atividades = Atividade.objects.filter(professor_id=professor_id).select_related("turma", "disciplina")

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
        }
        for a in atividades
    ]

    return JsonResponse({
        "total_atividades": len(resultado),
        "atividades": resultado
    })


@csrf_exempt
def criar_atividade(request):
    """Cria uma nova atividade. Aceita multipart/form-data por causa do arquivo opcional."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor_id = request.POST.get("professor")
    turma_id = request.POST.get("turma")
    titulo = (request.POST.get("titulo") or "").strip()
    descricao = (request.POST.get("descricao") or "").strip()
    data_str = request.POST.get("data")
    data_entrega_str = request.POST.get("data_entrega")
    arquivo = request.FILES.get("arquivo")

    if not all([professor_id, turma_id, titulo, data_str]):
        return JsonResponse(
            {"message": "Campos 'professor', 'turma', 'titulo' e 'data' são obrigatórios."},
            status=400
        )

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

    turma = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    atividade = Atividade.objects.create(
        professor=professor,
        turma=turma,
        disciplina=disciplina,
        titulo=titulo,
        descricao=descricao,
        data=data_atividade,
        data_entrega=data_entrega,
        arquivo=arquivo,
    )

    return JsonResponse({
        "message": "Atividade criada com sucesso.",
        "atividade": {
            "id": atividade.id,
            "titulo": atividade.titulo,
            "descricao": atividade.descricao,
            "data": atividade.data.isoformat(),
            "data_entrega": atividade.data_entrega.isoformat() if atividade.data_entrega else None,
            "turma_id": atividade.turma_id,
            "nome_turma": atividade.turma.turma,
            "disciplina": atividade.disciplina.nome_disciplina,
            "arquivo_url": caminho_relativo_arquivo(atividade.arquivo),
        }
    })


@csrf_exempt
def deletar_atividade(request, atividade_id):
    """Remove uma atividade."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    atividade = Atividade.objects.filter(id=atividade_id).first()
    if not atividade:
        return JsonResponse({"message": "Atividade não encontrada."}, status=404)

    atividade.delete()
    return JsonResponse({"message": "Atividade removida com sucesso."})


@csrf_exempt
def get_comunicados(request):
    """Lista os comunicados do professor."""
    professor_id = request.GET.get("professor")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    comunicados = Comunicado.objects.filter(professor_id=professor_id).select_related("turma")

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
    """Cria um novo comunicado."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    professor_id = body.get("professor")
    titulo = (body.get("titulo") or "").strip()
    mensagem = (body.get("mensagem") or "").strip()
    turma_id = body.get("turma")

    if not all([professor_id, titulo, mensagem]):
        return JsonResponse(
            {"message": "Campos 'professor', 'titulo' e 'mensagem' são obrigatórios."},
            status=400
        )

    try:
        professor = Professor.objects.get(id=professor_id)
    except Professor.DoesNotExist:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada."}, status=404)

    comunicado = Comunicado.objects.create(
        professor=professor,
        turma=turma,
        titulo=titulo,
        mensagem=mensagem,
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
def login_coordenacao(request):
    ip = get_ip()
    nome_completo = request.GET.get("nome_completo").strip().upper()
    senha = request.GET.get("senha").strip()

    coordenador = Coordenador.objects.filter(nome_completo=nome_completo, senha=senha).first()

    if coordenador is None:
        return JsonResponse({
            "return": False
        })
    else:
        Coordenador.objects.filter(nome_completo=nome_completo, senha=senha).update(ip=ip)
        return JsonResponse({
            "return": True
        })


@csrf_exempt
def auth_coordenacao(request):
    ip = get_ip()
    coordenador = Coordenador.objects.filter(ip=ip).first()

    try:
        coordenador_dict = model_to_dict(coordenador)
        if coordenador is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "return": True,
                "coordenador": coordenador_dict
            })
    except:
        return JsonResponse({
            "return": None,
            "message": "error"
        })


@csrf_exempt
def get_professores_coordenacao(request):
    """
    Lista todos os professores com suas turmas e disciplinas, agrupadas.
    Cada professor pode ter múltiplos registros em AtravessaPor (um por
    disciplina lecionada); aqui agrupamos por professor -> turma -> disciplinas.
    """
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
    """
    Cadastra um novo professor e já cria seus vínculos de turma/disciplina
    (registros em AtravessaPor), um por combinação turma+disciplina.
    """
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    nome_completo = (body.get("nome_completo") or "").strip().upper()
    senha = (body.get("senha") or "").strip()
    escola = (body.get("escola") or "").strip()
    vinculos = body.get("vinculos", [])  # [{ turma, etapa, disciplinas: [...] }, ...]

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
    """Retorna a escola vinculada ao coordenador autenticado (via IP)."""
    ip = get_ip()
    coordenador = Coordenador.objects.filter(ip=ip).first()

    if not coordenador:
        return JsonResponse({"return": False}, status=401)

    return JsonResponse({
        "return": True,
        "escola": coordenador.escola or ""
    })


@csrf_exempt
def get_professor_detalhe(request, professor_id):
    """Retorna os dados de um professor com seus vínculos de turma/disciplina."""
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
    """
    Atualiza o nome/senha do professor e substitui completamente seus
    vínculos de turma/disciplina pelos novos vínculos enviados.
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

    # Substitui todos os vínculos existentes pelos novos enviados.
    # ⚠️ Isso apaga registros de AtravessaPor antigos — se algum tiver
    # notas/frequência vinculadas, elas seriam perdidas via cascade.
    # Por segurança, checamos antes de apagar.
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
    """
    Retorna as listas distintas de turmas, etapas e disciplinas já
    existentes no sistema, para alimentar os selects do formulário de
    cadastro/edição de professor — evita digitação livre e inconsistências.
    """
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
    """
    Remove um professor do sistema. Por segurança, recusa a exclusão se
    houver notas ou frequências lançadas em qualquer turma vinculada a ele
    — evita apagar dados acadêmicos de alunos por engano.
    """
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
    """Lista todos os alunos cadastrados, com os campos usados na tela da coordenação."""
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
    """Retorna os dados completos de um aluno específico."""
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
    """Atualiza os dados de um aluno."""
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
    """
    Remove um aluno. Recusa a exclusão se houver notas ou frequências
    lançadas para ele, evitando apagar histórico acadêmico por engano.
    """
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
    """Cadastra um novo aluno."""
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
    """
    Retorna as listas distintas de turmas, séries e cursos já existentes
    no sistema, para alimentar os selects do formulário de cadastro/edição
    de aluno — evita digitação livre e inconsistências.
    """
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

    # --- Comunicados relevantes: gerais (sem turma) OU da turma do aluno ---
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

    # --- Eventos relevantes: gerais (sem turma) OU da turma do aluno ---
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

    # --- Advertências do aluno ---
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
            criado_por = f"{e.coordenador.escola or 'Coordenação'}"
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
    """Retorna os dados completos de um evento específico, incluindo status calculado."""
    evento = Evento.objects.select_related("turma", "professor", "coordenador").filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    hoje = date.today()

    if evento.coordenador:
        criado_por = evento.coordenador.escola or "Coordenação"
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

    ip = get_ip()
    coordenador = Coordenador.objects.filter(ip=ip).first()

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
            "criado_por": coordenador.escola or "Coordenação",
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
    """Remove um evento."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    evento = Evento.objects.filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    evento.delete()
    return JsonResponse({"message": "Evento removido com sucesso."})


@csrf_exempt
def get_lista_professores_simples(request):
    """Lista simples de professores (id + nome), para popular selects."""
    professores = Professor.objects.all().order_by("nome_completo")

    resultado = [
        {"id": p.id, "nome_completo": p.nome_completo}
        for p in professores
    ]

    return JsonResponse({"professores": resultado})


@csrf_exempt
def get_turmas_do_professor(request, professor_id):
    """
    Retorna as turmas (agrupadas, sem repetir disciplina) que um professor
    específico leciona — usado para popular o select de turma depois que
    a coordenação escolhe o professor.
    """
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
                "registro_id": r.id,  # qualquer registro daquele grupo serve como turma_id do evento
            }

    return JsonResponse({
        "professor": {"id": professor.id, "nome_completo": professor.nome_completo},
        "turmas": list(turmas_map.values()),
    })


@csrf_exempt
def get_comunicados_coordenacao(request):
    """Lista todos os comunicados (de professores e da coordenação)."""
    comunicados = Comunicado.objects.select_related("turma", "professor", "coordenador").order_by("-data")

    resultado = []
    for c in comunicados:
        if c.coordenador:
            criado_por = c.coordenador.escola or "Coordenação"
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
    """Retorna os dados completos de um comunicado específico."""
    comunicado = Comunicado.objects.select_related("turma", "professor", "coordenador").filter(id=comunicado_id).first()
    if not comunicado:
        return JsonResponse({"message": "Comunicado não encontrado."}, status=404)

    if comunicado.coordenador:
        criado_por = comunicado.coordenador.escola or "Coordenação"
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
    """Cria um novo comunicado emitido pela coordenação (geral ou por turma)."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    ip = get_ip()
    coordenador = Coordenador.objects.filter(ip=ip).first()

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
            "criado_por": coordenador.escola or "Coordenação",
            "origem": "coordenacao",
        }
    })


@csrf_exempt
def editar_comunicado_coordenacao(request, comunicado_id):
    """Atualiza título, mensagem, turma e data de um comunicado."""
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
    """Remove um comunicado."""
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
            "emitido_por": (a.coordenador.escola or "Coordenação") if a.coordenador else None,
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
    """Retorna os dados completos de uma advertência/penalidade."""
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
            "emitido_por": (advertencia.coordenador.escola or "Coordenação") if advertencia.coordenador else None,
            "is_suspensao": advertencia.is_suspensao,
            "data_inicio_suspensao": advertencia.data_inicio_suspensao.isoformat() if advertencia.data_inicio_suspensao else None,
            "data_termino_suspensao": advertencia.data_termino_suspensao.isoformat() if advertencia.data_termino_suspensao else None,
        }
    })


@csrf_exempt
def criar_advertencia_coordenacao(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    ip = get_ip()
    coordenador = Coordenador.objects.filter(ip=ip).first()
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
    """Remove uma advertência/penalidade."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    advertencia = Advertencia.objects.filter(id=advertencia_id).first()
    if not advertencia:
        return JsonResponse({"message": "Registro não encontrado."}, status=404)

    advertencia.delete()
    return JsonResponse({"message": "Registro removido com sucesso."})


@csrf_exempt
def gerar_advertencia_pdf(request, advertencia_id):
    """Gera o PDF de advertência/penalidade, pronto para impressão."""
    advertencia = Advertencia.objects.select_related("aluno", "professor", "coordenador").filter(id=advertencia_id).first()
    if not advertencia:
        return JsonResponse({"message": "Registro não encontrado."}, status=404)

    contexto = {
        "advertencia": advertencia,
        "eh_penalidade": advertencia.tipo == "PENALIDADE",
        "escola": advertencia.aluno.escola if advertencia.aluno else "",
        "emitido_por": (advertencia.coordenador.escola or "Coordenação Pedagógica") if advertencia.coordenador else "Coordenação Pedagógica",
    }

    html_string = render_to_string("advertencias/pdf.html", contexto)
    pdf_file = HTML(string=html_string).write_pdf()

    prefixo = "penalidade" if advertencia.tipo == "PENALIDADE" else "advertencia"
    nome_arquivo = f"{prefixo}_{advertencia.id}.pdf"

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response


@csrf_exempt
def get_turmas_coordenacao(request):
    """Lista as turmas distintas (nome + etapa + escola + total de alunos), para a tela de horários."""
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
    """Retorna a grade de horários (segunda a sexta) de uma turma, com disciplina e professor de cada aula."""
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
    """Lista as combinações disciplina+professor disponíveis para essa turma, para popular os selects da grade."""
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
    """
    Salva a grade de horários de uma turma. Recebe a lista completa de células
    (dia + hora_inicio + hora_fim + atravessa_por_id ou null para célula vazia)
    e substitui os registros existentes de cada célula.
    """
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
    """Lista disciplinas cadastradas + nomes 'órfãos' usados em AtravessaPor sem Disciplina correspondente."""
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
    """Renomeia uma disciplina cadastrada."""
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
    """Cadastra uma nova disciplina (usado para resolver órfãos sem Disciplina correspondente)."""
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
    """Corrige em massa o texto de AtravessaPor.disciplina_lecionada, trocando um nome órfão pelo correto."""
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
    """Lista nomes de turma distintos usados em AtravessaPor e Estudante, mostrando divergências entre as duas."""
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
    """Renomeia uma turma em massa, sincronizando AtravessaPor.turma e Estudante.turma (ligados por texto)."""
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
def get_alunos_corrigir(request):
    """Lista alunos com a turma atual, para correção rápida de matrícula."""
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
    """Atualiza rapidamente a turma de um aluno (correção de matrícula)."""
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
    """
    Lista eventos relevantes para o professor autenticado: eventos gerais
    (sem turma) + eventos específicos das turmas que ele leciona.
    Somente leitura — professor não cria/edita/apaga eventos.
    """
    ip = get_ip()
    professor = Professor.objects.filter(ip=ip).first()

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
            criado_por = e.coordenador.escola or "Coordenação"
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
    """Lista todas as disciplinas cadastradas (model Disciplina)."""
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
    """Renomeia uma disciplina cadastrada."""
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

@csrf_exempt
def login_blogger(request):
    ip = get_ip()
    nome_completo = request.GET.get("nome_completo").strip().upper()
    senha = request.GET.get("senha").strip()

    blogger = Blogger.objects.filter(nome_completo=nome_completo, senha=senha).first()

    if blogger is None:
        return JsonResponse({"return": False})

    Blogger.objects.filter(nome_completo=nome_completo, senha=senha).update(ip=ip)
    return JsonResponse({"return": True})


@csrf_exempt
def auth_blogger(request):
    ip = get_ip()
    blogger = Blogger.objects.filter(ip=ip).first()

    if blogger is None:
        return JsonResponse({"return": False})

    return JsonResponse({
        "return": True,
        "blogger": {"id": blogger.id, "nome_completo": blogger.nome_completo}
    })


@csrf_exempt
def get_posts(request):
    """Lista pública de posts do blog (qualquer visitante pode ver)."""
    posts = Post.objects.select_related("autor").all()

    resultado = [
        {
            "id": p.id,
            "titulo": p.titulo,
            "resumo": (p.conteudo[:220] + "…") if len(p.conteudo) > 220 else p.conteudo,
            "tempo_leitura": p.tempo_leitura,
            "data_criacao": p.data_criacao.isoformat(),
            "autor": p.autor.nome_completo,
            "autor_id": p.autor_id,
        }
        for p in posts
    ]

    return JsonResponse({"total_posts": len(resultado), "posts": resultado})


@csrf_exempt
def get_post_detalhe(request, post_id):
    """Detalhe público de um post."""
    post = Post.objects.select_related("autor").filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    return JsonResponse({
        "post": {
            "id": post.id,
            "titulo": post.titulo,
            "conteudo": post.conteudo,
            "tempo_leitura": post.tempo_leitura,
            "data_criacao": post.data_criacao.isoformat(),
            "autor": post.autor.nome_completo,
            "autor_id": post.autor_id,
        }
    })


@csrf_exempt
def criar_post(request):
    """Cria um novo post — apenas bloggers autenticados."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    ip = get_ip()
    blogger = Blogger.objects.filter(ip=ip).first()
    if not blogger:
        return JsonResponse({"message": "Você precisa estar autenticado para publicar."}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    conteudo = (body.get("conteudo") or "").strip()

    if not titulo or not conteudo:
        return JsonResponse({"message": "Campos 'titulo' e 'conteudo' são obrigatórios."}, status=400)

    post = Post.objects.create(
        autor=blogger,
        titulo=titulo,
        conteudo=conteudo,
    )

    return JsonResponse({
        "message": "Post publicado com sucesso.",
        "post": {
            "id": post.id,
            "titulo": post.titulo,
            "tempo_leitura": post.tempo_leitura,
            "data_criacao": post.data_criacao.isoformat(),
        }
    })


@csrf_exempt
def editar_post(request, post_id):
    """Edita um post — apenas o autor pode editar."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    ip = get_ip()
    blogger = Blogger.objects.filter(ip=ip).first()
    if not blogger:
        return JsonResponse({"message": "Você precisa estar autenticado."}, status=401)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    if post.autor_id != blogger.id:
        return JsonResponse({"message": "Você não tem permissão para editar este post."}, status=403)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    titulo = (body.get("titulo") or "").strip()
    conteudo = (body.get("conteudo") or "").strip()

    if not titulo or not conteudo:
        return JsonResponse({"message": "Campos 'titulo' e 'conteudo' são obrigatórios."}, status=400)

    post.titulo = titulo
    post.conteudo = conteudo
    post.save()

    return JsonResponse({"message": "Post atualizado com sucesso."})


@csrf_exempt
def deletar_post(request, post_id):
    """Remove um post — apenas o autor pode apagar."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    ip = get_ip()
    blogger = Blogger.objects.filter(ip=ip).first()
    if not blogger:
        return JsonResponse({"message": "Você precisa estar autenticado."}, status=401)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({"message": "Post não encontrado."}, status=404)

    if post.autor_id != blogger.id:
        return JsonResponse({"message": "Você não tem permissão para apagar este post."}, status=403)

    post.delete()
    return JsonResponse({"message": "Post removido com sucesso."})


def _professor_atual(request):
    ip = get_ip()
    return Professor.objects.filter(ip=ip).first()


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


# def avaliacao_emitir_pdf(request):
#     pass  # placeholder para não duplicar import acima


# def avaliacao_emitir_pdf(request, avaliacao_id):
#     from reportlab.lib.pagesizes import A4
#     from reportlab.lib.units import cm
#     from reportlab.pdfgen import canvas
#     from reportlab.lib.utils import ImageReader

#     professor = _professor_atual(request)
#     if not professor:
#         return JsonResponse({"message": "Não autenticado"}, status=401)

#     try:
#         avaliacao = Avaliacao.objects.get(id=avaliacao_id, professor=professor)
#     except Avaliacao.DoesNotExist:
#         return JsonResponse({"message": "Avaliação não encontrada"}, status=404)

#     # curso: não existe no model Avaliacao/AtravessaPor, então pega do
#     # primeiro aluno cadastrado nessa turma (ajuste se tiver fonte melhor)
#     aluno_da_turma = Estudante.objects.filter(turma=avaliacao.turma).first()
#     curso = aluno_da_turma.curso if aluno_da_turma else "—"

#     response = HttpResponse(content_type="application/pdf")
#     response["Content-Disposition"] = f'attachment; filename="avaliacao_{avaliacao.id}.pdf"'

#     p = canvas.Canvas(response, pagesize=A4)
#     largura, altura = A4
#     margem_esquerda = 2 * cm
#     margem_direita = largura - 2 * cm

#     y = altura - 2 * cm

#     # --- Logo (ajuste o caminho para o arquivo real da sua logo) ---
#     logo_path = os.path.join(settings.BASE_DIR, "app", "static", "img", "logo.png")
#     logo_largura = 2.5 * cm
#     logo_altura = 2.5 * cm
#     if os.path.exists(logo_path):
#         try:
#             p.drawImage(
#                 ImageReader(logo_path),
#                 margem_esquerda, y - logo_altura,
#                 width=logo_largura, height=logo_altura,
#                 preserveAspectRatio=True, mask="auto",
#             )
#         except Exception:
#             pass

#     texto_x = margem_esquerda + logo_largura + 0.5 * cm

#     # --- Nome do professor, logo abaixo da logo (à direita dela) ---
#     p.setFont("Helvetica-Bold", 11)
#     p.drawString(texto_x, y - 0.5 * cm, "SIAA-SEDUC")
#     p.setFont("Helvetica", 9)
#     p.drawString(texto_x, y - 1.1 * cm, f"Professor(a): {professor.nome_completo}")

#     y -= (logo_altura + 0.6 * cm)

#     # --- Linha divisória ---
#     p.setStrokeColorRGB(0.7, 0.7, 0.7)
#     p.line(margem_esquerda, y, margem_direita, y)
#     y -= 0.7 * cm

#     # --- Título da avaliação ---
#     p.setFont("Helvetica-Bold", 14)
#     p.drawString(margem_esquerda, y, avaliacao.titulo)
#     y -= 0.9 * cm

#     # --- Bloco Matéria / Curso / Turma ---
#     p.setFont("Helvetica", 10)
#     p.drawString(margem_esquerda, y, f"Matéria: {avaliacao.disciplina.nome_disciplina}")
#     p.drawString(margem_esquerda + 8 * cm, y, f"Curso: {curso}")
#     y -= 0.55 * cm
#     p.drawString(margem_esquerda, y, f"Turma: {avaliacao.turma}")
#     p.drawString(margem_esquerda + 8 * cm, y, f"Data: {avaliacao.data.strftime('%d/%m/%Y')}")
#     y -= 1 * cm

#     # --- Espaço para o aluno escrever o nome ---
#     p.setFont("Helvetica", 10)
#     p.drawString(margem_esquerda, y, "Nome do aluno:")
#     p.line(margem_esquerda + 2.6 * cm, y - 0.05 * cm, margem_direita, y - 0.05 * cm)
#     y -= 1.3 * cm

#     p.setStrokeColorRGB(0.7, 0.7, 0.7)
#     p.line(margem_esquerda, y, margem_direita, y)
#     y -= 0.8 * cm

#     # --- Questões (igual antes) ---
#     for q in avaliacao.questoes.all():
#         if y < 5 * cm:
#             p.showPage()
#             y = altura - 2 * cm

#         p.setFont("Helvetica-Bold", 11)
#         p.drawString(margem_esquerda, y, f"Questão {q.ordem + 1}")
#         y -= 0.6 * cm

#         p.setFont("Helvetica", 10)
#         for linha in _quebrar_texto(q.enunciado, 90):
#             p.drawString(margem_esquerda, y, linha)
#             y -= 0.5 * cm

#         if q.imagem:
#             try:
#                 img = ImageReader(q.imagem.path)
#                 p.drawImage(img, margem_esquerda, y - 6 * cm, width=8 * cm, height=6 * cm, preserveAspectRatio=True)
#                 y -= 6.5 * cm
#             except Exception:
#                 pass

#         if q.tipo == "OBJETIVA":
#             for alt in q.alternativas.all():
#                 p.drawString(margem_esquerda + 0.5 * cm, y, f"{alt.letra}) {alt.texto}")
#                 y -= 0.5 * cm
#         else:
#             p.drawString(margem_esquerda, y, "_" * 80)
#             y -= 0.5 * cm
#             p.drawString(margem_esquerda, y, "_" * 80)
#             y -= 0.5 * cm

#         y -= 0.6 * cm

#     p.save()
#     return response

# def avaliacao_emitir_pdf(request, avaliacao_id):
#     professor = _professor_atual(request)
#     if not professor:
#         return JsonResponse({"message": "Não autenticado"}, status=401)

#     try:
#         avaliacao = Avaliacao.objects.select_related("disciplina", "professor").get(
#             id=avaliacao_id, professor=professor
#         )
#     except Avaliacao.DoesNotExist:
#         return JsonResponse({"message": "Avaliação não encontrada"}, status=404)

#     # curso: não existe no model Avaliacao/AtravessaPor, então pega do
#     # primeiro aluno cadastrado nessa turma (ajuste se tiver fonte melhor)
#     aluno_da_turma = Estudante.objects.filter(turma=avaliacao.turma).first()
#     curso = aluno_da_turma.curso if aluno_da_turma else "—"

#     logo_path = os.path.join(settings.BASE_DIR, "app", "static", "img", "logo.png")
#     logo_url = f"file://{logo_path}"

#     questoes_contexto = []
#     for q in avaliacao.questoes.all().order_by("ordem"):
#         questoes_contexto.append({
#             "enunciado": q.enunciado,
#             "tipo": q.tipo,
#             "tipo_label": "Objetiva" if q.tipo == "OBJETIVA" else "Subjetiva",
#             "imagem_url": f"file://{q.imagem.path}" if q.imagem else None,
#             "alternativas": q.alternativas.all() if q.tipo == "OBJETIVA" else [],
#         })

#     contexto = {
#         "avaliacao": avaliacao,
#         "curso": curso,
#         "logo_url": logo_url,
#         "questoes": questoes_contexto,
#     }

#     html_string = render_to_string("avaliacoes/pdf.html", contexto)
#     pdf_file = HTML(string=html_string).write_pdf()

#     nome_arquivo = f"avaliacao_{avaliacao.id}.pdf"
#     response = HttpResponse(pdf_file, content_type="application/pdf")
#     response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
#     return response

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

def _coordenador_atual(request):
    ip = get_ip()
    return Coordenador.objects.filter(ip=ip).first()


@csrf_exempt
def get_avaliacoes_coordenacao(request):
    """Lista todas as avaliações cadastradas por qualquer professor."""
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
    """Monta o PDF da avaliação (usado tanto por professor quanto coordenação)."""
    aluno_da_turma = Estudante.objects.filter(turma=avaliacao.turma).first()
    curso = aluno_da_turma.curso if aluno_da_turma else "—"

    logo_path = os.path.join(settings.BASE_DIR, "app", "static", "img", "logo.png")
    logo_url = f"file://{logo_path}"

    questoes_contexto = []
    for q in avaliacao.questoes.all().order_by("ordem"):
        questoes_contexto.append({
            "enunciado": q.enunciado,
            "tipo": q.tipo,
            "tipo_label": "Objetiva" if q.tipo == "OBJETIVA" else "Subjetiva",
            "imagem_url": f"file://{q.imagem.path}" if q.imagem else None,
            "alternativas": q.alternativas.all() if q.tipo == "OBJETIVA" else [],
        })

    contexto = {
        "avaliacao": avaliacao,
        "curso": curso,
        "logo_url": logo_url,
        "questoes": questoes_contexto,
    }

    html_string = render_to_string("avaliacoes/pdf.html", contexto)
    return HTML(string=html_string).write_pdf()

@csrf_exempt
def avaliacao_detalhe_coordenacao(request, avaliacao_id):
    """Visualização de uma avaliação específica, sem restrição de professor."""
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
    """Mesmo PDF da avaliação, mas autenticado como coordenação (sem restrição de professor)."""
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
    """Lista as avaliações criadas pelo professor autenticado."""
    ip = get_ip()
    professor = Professor.objects.filter(ip=ip).first()
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
    """Cria uma avaliação com suas questões (e alternativas, se objetivas)."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    ip = get_ip()
    professor = Professor.objects.filter(ip=ip).first()
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
    """Gera o PDF da avaliação, pronto para impressão."""
    avaliacao = Avaliacao.objects.select_related("turma").filter(id=avaliacao_id).first()
    if not avaliacao:
        return JsonResponse({"message": "Avaliação não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(avaliacao.turma)

    questoes = avaliacao.questoes.prefetch_related("alternativas").all()

    # Anexa a letra (A, B, C...) a cada alternativa antes de renderizar no template.
    letras = string.ascii_uppercase
    for questao in questoes:
        for idx, alternativa in enumerate(questao.alternativas.all()):
            alternativa.letra = letras[idx] if idx < len(letras) else "?"

    # WeasyPrint precisa de um caminho absoluto de arquivo (ou file:// URL) para
    # imagens locais — não aceita paths relativos do template estático do Django.
    logo_path = f"file://{os.path.join(settings.BASE_DIR, 'app', 'static', 'logo.png')}"

    contexto = {
        "avaliacao": avaliacao,
        "disciplina": disciplina.nome_disciplina if disciplina else avaliacao.turma.disciplina_lecionada,
        "questoes": questoes,
        "logo_path": logo_path,
    }

    html_string = render_to_string("avaliacoes/pdf.html", contexto)
    pdf_file = HTML(string=html_string).write_pdf()

    nome_arquivo = f"avaliacao_{avaliacao.id}.pdf"
    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{nome_arquivo}"'
    return response




def _coordenador_logado():
    ip = get_ip()
    return Coordenador.objects.filter(ip=ip).first()


@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagens_list_create_coordenacao(request):
    coordenador = _coordenador_logado()
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
    """Remove o prefixo de código, se houver: '22057498 - CETI CALISTO LOBO' -> 'CETI CALISTO LOBO'"""
    if not escola_str:
        return escola_str
    return escola_str.split(" - ", 1)[-1].strip()


@csrf_exempt
@require_http_methods(["GET"])
def opcoes_mensagem_coordenacao(request):
    coordenador = _coordenador_logado()
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

# @csrf_exempt
# @require_http_methods(["GET"])
# def opcoes_mensagem_coordenacao(request):
#     coordenador = _coordenador_logado()
#     if not coordenador:
#         return JsonResponse({"detail": "Não autenticado."}, status=401)

#     professores = Professor.objects.filter(
#         atravessamentos__escola=coordenador.escola
#     ).distinct().order_by("nome_completo")

#     return JsonResponse({
#         "professores": [
#             {"id": p.id, "nome_completo": p.nome_completo} for p in professores
#         ]
#     })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def mensagem_conversa_detalhe(request, conversa_id):
    coordenador = _coordenador_logado()
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


# --- app/views.py — adicionar ---

def _professor_logado():
    ip = get_ip()
    return Professor.objects.filter(ip=ip).first()


@csrf_exempt
@require_http_methods(["GET"])
def mensagens_list_professor(request):
    professor = _professor_logado()
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
    professor = _professor_logado()
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
    coordenador = _coordenador_logado()
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
    coordenador = _coordenador_logado()
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



def _admin_logado():
    ip = get_ip()
    return Admin.objects.filter(ip=ip).first()


def _nome_escola(escola_str):
    if not escola_str:
        return escola_str
    return escola_str.split(" - ", 1)[-1].strip()


# ---------- AUTH ----------

@csrf_exempt
@require_http_methods(["POST"])
def admin_login(request):
    body = json.loads(request.body or "{}")
    nome = (body.get("nome_completo") or "").strip()
    senha = (body.get("senha") or "").strip()

    admin = Admin.objects.filter(nome_completo=nome, senha=senha).first()
    if not admin:
        return JsonResponse({"return": False, "detail": "Credenciais inválidas."}, status=401)

    admin.ip = get_ip()
    admin.save(update_fields=["ip"])
    return JsonResponse({"return": True, "admin": {"id": admin.id, "nome_completo": admin.nome_completo}})


@csrf_exempt
@require_http_methods(["GET"])
def admin_auth(request):
    admin = _admin_logado()
    if not admin:
        return JsonResponse({"return": False})
    return JsonResponse({"return": True, "admin": {"id": admin.id, "nome_completo": admin.nome_completo}})


# ---------- ESCOLAS (derivadas, sem model próprio) ----------

@csrf_exempt
@require_http_methods(["GET"])
def admin_escolas_opcoes(request):
    if not _admin_logado():
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


# ---------- COORDENADORES ----------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_coordenadores(request):
    if not _admin_logado():
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
    if not _admin_logado():
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    coordenador = Coordenador.objects.filter(id=coordenador_id).first()
    if not coordenador:
        return JsonResponse({"detail": "Coordenador não encontrado."}, status=404)

    coordenador.delete()
    return JsonResponse({"detail": "Excluído."})


# ---------- PROFESSORES ----------



@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_professores(request):
    if not _admin_logado():
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
    if not _admin_logado():
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




# ---------- ALUNOS ----------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_alunos(request):
    if not _admin_logado():
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
    if not _admin_logado():
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    aluno = Estudante.objects.filter(id=aluno_id).first()
    if not aluno:
        return JsonResponse({"detail": "Aluno não encontrado."}, status=404)

    if aluno.notas_lancadas.exists() if hasattr(aluno, "notas_lancadas") else False:
        return JsonResponse({"detail": "Não é possível excluir: há notas vinculadas a este aluno."}, status=409)

    aluno.delete()
    return JsonResponse({"detail": "Excluído."})



# ---------- TURMAS (agregado, sem model próprio) ----------

@csrf_exempt
@require_http_methods(["GET"])
def admin_turmas(request):
    if not _admin_logado():
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
    if not _admin_logado():
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    body = json.loads(request.body or "{}")
    nome_atual = (body.get("nome_atual") or "").strip()
    novo_nome = (body.get("novo_nome") or "").strip()

    if not nome_atual or not novo_nome:
        return JsonResponse({"detail": "nome_atual e novo_nome são obrigatórios."}, status=400)

    qtd_alunos = Estudante.objects.filter(turma=nome_atual).update(turma=novo_nome)
    qtd_vinculos = AtravessaPor.objects.filter(turma=nome_atual).update(turma=novo_nome)

    return JsonResponse({"alunos_atualizados": qtd_alunos, "vinculos_atualizados": qtd_vinculos})


def _aluno_logado():
    ip = get_ip()
    return Estudante.objects.filter(ip=ip).first()


@csrf_exempt
@require_http_methods(["GET"])
def dashboard_aluno(request):
    aluno = _aluno_logado()
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    # --- Média geral por disciplina (a partir de Nota) ---
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

    # --- Atenção necessária: disciplinas com média (MAF/MA) abaixo de 6 ---
    atencao_necessaria = [
        {"disciplina": m["disciplina"], "media": m["media"]}
        for m in medias_por_disciplina
        if m["media"] < 6
    ]

    # --- Frequência acumulada — critério Pé-de-Meia (mínimo 80%) ---
    frequencias = Frequencia.objects.filter(aluno=aluno)
    total_freq = frequencias.count()
    presentes = frequencias.filter(presente=True).count()
    frequencia_percentual = round((presentes / total_freq) * 100, 1) if total_freq else None
    frequencia_baixa_pe_de_meia = frequencia_percentual is not None and frequencia_percentual < 80

    # --- Atividades da turma do aluno (via vínculo normalizado) ---
    vinculos_aluno = buscar_atravessapor_por_turma(aluno.turma)
    hoje = date.today()
    atividades = Atividade.objects.filter(turma__in=vinculos_aluno).select_related("disciplina")

    pendentes_qs = atividades.filter(data_entrega__gte=hoje).order_by("data_entrega")
    atrasadas_qs = atividades.filter(data_entrega__lt=hoje)
    total_pendencias = pendentes_qs.count() + atrasadas_qs.count()

    # "Próximas entregas" mostra só as pendentes de verdade (data futura), não as atrasadas
    proximas_entregas = [
        {
            "titulo": a.titulo,
            "disciplina": a.disciplina.nome_disciplina if a.disciplina else None,
            "data_entrega": a.data_entrega.isoformat() if a.data_entrega else None,
        }
        for a in pendentes_qs[:5]
    ]

    # --- Total de conteúdos disponíveis pra turma ---
    total_conteudos = Conteudo.objects.filter(turma__in=vinculos_aluno).count()

    return JsonResponse({
        "media_geral": media_geral,
        "total_pendencias": total_pendencias,
        "frequencia_percentual": frequencia_percentual,
        "frequencia_baixa_pe_de_meia": frequencia_baixa_pe_de_meia,
        "total_conteudos": total_conteudos,
        "atencao_necessaria": atencao_necessaria[:6],
        "proximas_entregas": proximas_entregas,
    })


def _aluno_logado():
    ip = get_ip()
    return Estudante.objects.filter(ip=ip).first()


# ---------- CONTEÚDOS ----------
@csrf_exempt
@require_http_methods(["GET"])
def conteudos_aluno(request):
    aluno = _aluno_logado()
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


# ---------- ATIVIDADES ----------
@csrf_exempt
@require_http_methods(["GET"])
def atividades_aluno(request):
    aluno = _aluno_logado()
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    hoje = date.today()
    vinculos = buscar_atravessapor_por_turma(aluno.turma)
    atividades = Atividade.objects.filter(turma__in=vinculos).select_related(
        "turma", "turma__professor"
    ).order_by("data_entrega")

    resultado = []
    for a in atividades:
        disciplina = resolver_disciplina_da_turma(a.turma)
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
        })

    return JsonResponse({"atividades": resultado})

# ---------- BOLETIM ----------

@csrf_exempt
@require_http_methods(["GET"])
def boletim_aluno(request):
    aluno = _aluno_logado()
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    notas = Nota.objects.filter(aluno=aluno).select_related("disciplina", "professor").order_by("disciplina__nome_disciplina")

    return JsonResponse({
        "boletim": [
            {
                "disciplina": n.disciplina.nome_disciplina if n.disciplina else None,
                "professor_nome": n.professor.nome_completo if n.professor else None,
                "nm1_t1": n.nm1_t1, "nm2_t1": n.nm2_t1, "nm3_t1": n.nm3_t1, "rpt_t1": n.rpt_t1, "mt_t1": n.mt_t1,
                "nm1_t2": n.nm1_t2, "nm2_t2": n.nm2_t2, "nm3_t2": n.nm3_t2, "rpt_t2": n.rpt_t2, "mt_t2": n.mt_t2,
                "nm1_t3": n.nm1_t3, "nm2_t3": n.nm2_t3, "nm3_t3": n.nm3_t3, "rpt_t3": n.rpt_t3, "mt_t3": n.mt_t3,
                "ma": n.ma, "pf": n.pf, "maf": n.maf, "rcf": n.rcf, "tgf": n.tgf, "rf": n.rf,
            }
            for n in notas
        ]
    })

# ---------- HORÁRIOS ----------

@csrf_exempt
@require_http_methods(["GET"])
def horarios_aluno(request):
    aluno = _aluno_logado()
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


# ---------- CRONOGRAMA (EstudoProgramado) ----------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def cronograma_aluno(request):
    aluno = _aluno_logado()
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
    aluno = _aluno_logado()
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
    aluno = _aluno_logado()
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
    aluno = _aluno_logado()
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    mes = request.GET.get("mes")  # ex: "9"
    ano = request.GET.get("ano")  # ex: "2026"

    hoje = date.today()
    mes = int(mes) if mes else hoje.month
    ano = int(ano) if ano else hoje.year

    registros = Frequencia.objects.filter(
        aluno=aluno, data__year=ano, data__month=mes
    ).select_related("disciplina").order_by("data")

    # Agrupa por dia: { "2026-09-03": [{disciplina, presente}, ...], ... }
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
    aluno = _aluno_logado()
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
    aluno = _aluno_logado()
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    vinculo = VinculoResponsavel.objects.filter(id=vinculo_id, aluno=aluno).select_related("responsavel").first()
    if not vinculo:
        return JsonResponse({"detail": "Solicitação não encontrada."}, status=404)

    responsavel = vinculo.responsavel
    vinculo.delete()

    # Se esse responsável não tem mais nenhum outro vínculo, remove o registro dele também.
    if not VinculoResponsavel.objects.filter(responsavel=responsavel).exists():
        responsavel.delete()

    return JsonResponse({"detail": "Removido."})

def _responsavel_logado():
    ip = get_ip()
    return Responsavel.objects.filter(ip=ip).first()


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
def login_responsavel(request):
    ip = get_ip()
    nome_completo = request.GET.get("nome_completo", "").strip().upper()
    senha = request.GET.get("senha", "").strip()

    responsavel = Responsavel.objects.filter(nome_completo=nome_completo, senha=senha).first()

    if responsavel is None:
        return JsonResponse({"return": False})

    Responsavel.objects.filter(id=responsavel.id).update(ip=ip)
    return JsonResponse({"return": True})


@csrf_exempt
def auth_responsavel(request):
    ip = get_ip()
    responsavel = Responsavel.objects.filter(ip=ip).first()

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



# @csrf_exempt
# @require_http_methods(["GET"])
# def vinculos_responsavel(request):
#     responsavel = _responsavel_logado()
#     if not responsavel:
#         return JsonResponse({"detail": "Não autenticado."}, status=401)

#     vinculos = VinculoResponsavel.objects.filter(responsavel=responsavel).select_related("aluno")

#     return JsonResponse({
#         "vinculos": [
#             {
#                 "id": v.id,
#                 "aluno_nome": v.aluno.nome_completo,
#                 "aluno_turma": v.aluno.turma,
#                 "parentesco": v.parentesco,
#                 "status": v.status,
#                 "data_solicitacao": v.data_solicitacao.isoformat(),
#             }
#             for v in vinculos
#         ]
#     })


@csrf_exempt
@require_http_methods(["GET"])
def vinculos_responsavel(request):
    responsavel = _responsavel_logado()
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


# @csrf_exempt
# @require_http_methods(["POST"])
# def solicitar_vinculo_responsavel(request):
#     responsavel = _responsavel_logado()
#     if not responsavel:
#         return JsonResponse({"detail": "Não autenticado."}, status=401)

#     body = json.loads(request.body or "{}")
#     aluno_nome = (body.get("aluno_nome_completo") or "").strip().upper()
#     parentesco = (body.get("parentesco") or "").strip()

#     if not aluno_nome or not parentesco:
#         return JsonResponse({"detail": "Informe o nome do aluno e o parentesco."}, status=400)

#     aluno = Estudante.objects.filter(nome_completo=aluno_nome).first()
#     if not aluno:
#         return JsonResponse({"detail": "Nenhum aluno encontrado com esse nome completo."}, status=404)

#     if VinculoResponsavel.objects.filter(aluno=aluno, responsavel=responsavel).exists():
#         return JsonResponse({"detail": "Você já tem uma solicitação ou vínculo com esse aluno."}, status=400)

#     vinculo = VinculoResponsavel.objects.create(
#         aluno=aluno, responsavel=responsavel, parentesco=parentesco, status="PENDENTE", origem="RESPONSAVEL",
#     )

#     return JsonResponse({"id": vinculo.id}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def solicitar_vinculo_responsavel(request):
    responsavel = _responsavel_logado()
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
    aluno = _aluno_logado()
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
    """Monta os dados do dashboard para um aluno específico — usado tanto
    pelo próprio aluno quanto pelo responsável vinculado a ele."""
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
def dashboard_aluno(request):
    aluno = _aluno_logado()
    if not aluno:
        return JsonResponse({"detail": "Não autenticado."}, status=401)

    return JsonResponse(_calcular_dashboard(aluno))

@csrf_exempt
@require_http_methods(["GET"])
def dashboard_aluno_responsavel(request, aluno_id):
    responsavel = _responsavel_logado()
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
    responsavel = _responsavel_logado()
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

    notas = Nota.objects.filter(aluno=aluno).select_related("disciplina", "professor").order_by("disciplina__nome_disciplina")

    return JsonResponse({
        "aluno": {"nome_completo": aluno.nome_completo, "turma": aluno.turma},
        "boletim": [
            {
                "disciplina": n.disciplina.nome_disciplina if n.disciplina else None,
                "nm1_t1": n.nm1_t1, "nm2_t1": n.nm2_t1, "nm3_t1": n.nm3_t1, "mt_t1": n.mt_t1,
                "nm1_t2": n.nm1_t2, "nm2_t2": n.nm2_t2, "nm3_t2": n.nm3_t2, "mt_t2": n.mt_t2,
                "nm1_t3": n.nm1_t3, "nm2_t3": n.nm2_t3, "nm3_t3": n.nm3_t3, "mt_t3": n.mt_t3,
                "ma": n.ma, "pf": n.pf, "maf": n.maf, "rf": n.rf,
            }
            for n in notas
        ]
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
            criado_por, origem = (c.coordenador.escola or "Coordenação"), "coordenacao"
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
                "emitido_por": (a.coordenador.escola or "Coordenação") if a.coordenador else None,
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
            criado_por, origem = (e.coordenador.escola or "Coordenação"), "coordenacao"
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

